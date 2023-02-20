import torch
import gc
import sys
from dataclasses import dataclass
from queue import SimpleQueue
from threading import Thread
from time import sleep
from typing import Callable, Any
from uuid import UUID
from enum import Enum, unique
from diffusers import StableDiffusionUpscalePipeline, StableDiffusionImageVariationPipeline, StableDiffusionPipeline, DPMSolverMultistepScheduler, DDIMScheduler, LMSDiscreteScheduler, DEISMultistepScheduler, HeunDiscreteScheduler, DPMSolverSinglestepScheduler
from diffusers.utils import is_xformers_available
from mashumaro import DataClassDictMixin
from .approximation import ApproximateDecoder
from PIL import Image
from torchvision import transforms

@unique
class ImageGeneratorTaskType(str, Enum):
    preview = "preview"
    upscale = "upscale"
    variation = "variation"

@dataclass 
class ImageGeneratorTaskUpscaleSettings(DataClassDictMixin):
    dimension : int = 1024

@dataclass
class ImageGeneratorTaskSettings(DataClassDictMixin):
    seed : int = -1
    dimensions : float = 1.0
    batch : int = 2
    method : str = "dpm"
    strength : float = 0.6
    steps : int = 30
    seamless : int = 0
    type : ImageGeneratorTaskType = ImageGeneratorTaskType("preview")
    initial_url : str | None = None

    # Settings for upscaling
    upscale : ImageGeneratorTaskUpscaleSettings = ImageGeneratorTaskUpscaleSettings()

    def is_structurally_equal(self, other : Any) -> bool:
        if not isinstance(other, ImageGeneratorTaskSettings):
            return False
        
        return self.method == other.method and self.type.value == other.type.value and self.seamless == other.seamless

@dataclass
class ImageGeneratorOutput:
    id : UUID
    url : str

@dataclass
class ImageGeneratorTask:
    prompt : str
    outputs : list[ImageGeneratorOutput]
    settings : ImageGeneratorTaskSettings = ImageGeneratorTaskSettings()
    callback : Callable = lambda *args: None

class ImageGenerator:
    # custom pytorch needs libzwapi.dll, nvToolsExt64_1.dll, libiomp5md.dll

    def __init__(self, models_url : str):
        # Models location URL
        self.models_url = models_url

        # Preparing current queue
        self.tasks = SimpleQueue()

        # Last task to compare
        self.last_task : ImageGeneratorTask | None = None

        # Our processing daemon
        self.daemon : Thread | None = None

        # No processing pipe in the beginning
        self.pipe : StableDiffusionPipeline | StableDiffusionUpscalePipeline | StableDiffusionImageVariationPipeline | None = None

        # Max memory available (in GB)
        self.total_vram_amount = torch.cuda.get_device_properties(0).total_memory / 1024 / 1024 / 1024

        # Approximate image decoder
        self.approximate_image_decoder : ApproximateDecoder | None = None

        # Original convolution initialiser
        self._original_conv_init = torch.nn.Conv2d.__init__

        print(f"[GEN] Generator is ready with {self.total_vram_amount}GB VRAM available.")

    def start(self):
        self.daemon = Thread(target=self.execute_tasks, daemon=True, name="varnava-image-generator")
        self.daemon.start()

    def stop(self):
        self.pipe = None

    def add_task(
        self,
        task : ImageGeneratorTask
    ):
        self.tasks.put(task)

    def execute_tasks(self):
        while True:
            sleep(0.5)

            task : ImageGeneratorTask = self.tasks.get(block=True, timeout=None)

            self.prepare_model_if_needed(task.settings)
            
            generator = torch.Generator(device="cuda")

            max_steps = task.settings.steps
            guidance_scale = task.settings.strength * 12.5
            aspect = task.settings.dimensions
            seed = task.settings.seed if task.settings.seed != -1 else torch.Generator(device="cuda").seed()

            if task.settings.type == ImageGeneratorTaskType.variation:
                max_steps = 50
            elif task.settings.type == ImageGeneratorTaskType.upscale:
                max_steps = 75

            generator = generator.manual_seed(seed)

            width = 768
            height = 768

            if aspect < 1:
                width = round(768 * aspect)
            elif aspect > 1:
                height = round(768 / aspect)

            print(f"[GEN] Generating output {width}x{height}: type={task.settings.type} steps={max_steps}, scale={guidance_scale}, aspect={aspect}.")
    
            def handle_callback(step, timestep, latents):
                # Storing progress images at a particular index
                # latents = 1 / 0.18215 * latents
                for index, latent in enumerate(latents):
                    if self.approximate_image_decoder is not None:
                        preview = self.approximate_image_decoder(latent)
                        preview.save(task.outputs[index].url)  

                # Progress calculation
                progress = 1.0 - float(timestep.item()) / float(self.pipe.scheduler.config.num_train_timesteps)

                # Notifying about callback datas
                task.callback(task, progress, seed)

            # Executing the model itself
            images = []

            if task.settings.type == ImageGeneratorTaskType.preview and isinstance(self.pipe, StableDiffusionPipeline):
                images = self.pipe(  
                    prompt=task.prompt, 
                    width=width,
                    height=height,
                    num_inference_steps=max_steps,
                    guidance_scale=guidance_scale,
                    num_images_per_prompt=len(task.outputs),
                    callback=handle_callback,
                    callback_steps=1,
                    generator=generator
                ).images 

            elif task.settings.type == ImageGeneratorTaskType.upscale and isinstance(self.pipe, StableDiffusionUpscalePipeline):
                source_image = Image.open(task.settings.initial_url).convert("RGB")

                # TODO: detect automatically the maximum scale supported by the current GPU device
                # For now it is hardcoded for 24GB memory GPUs.
                upscale_dimension = task.settings.upscale.dimension
                supplied_dimension = int(float(upscale_dimension) / float(512)) * 128
                
                source_image = source_image.resize((supplied_dimension, 
                                                    supplied_dimension))

                images = self.pipe(
                    prompt=task.prompt,
                    callback=handle_callback,
                    callback_steps=1,
                    image=source_image
                ).images

            elif task.settings.type == ImageGeneratorTaskType.variation and isinstance(self.pipe, StableDiffusionImageVariationPipeline):
                source_image = Image.open(task.settings.initial_url)

                tform = transforms.Compose([
                    transforms.ToTensor(),
                    transforms.Resize(
                        (224, 224),
                        interpolation=transforms.InterpolationMode.BICUBIC,
                        antialias=False,
                    ),
                    transforms.Normalize(
                        [0.48145466, 0.4578275, 0.40821073],
                        [0.26862954, 0.26130258, 0.27577711]
                    ),
                ])

                source_image = tform(source_image).to("cuda").unsqueeze(0)

                images = self.pipe(
                    image=source_image,
                    width=width,
                    height=height,
                    num_inference_steps=max_steps,
                    num_images_per_prompt=len(task.outputs),
                    callback=handle_callback,
                    callback_steps=1
                ).images

            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()
            gc.collect()

            self.last_task = task

            for index, image in enumerate(images):
                image.save(task.outputs[index].url)

            task.callback(task, 1.0, generator.seed())
    
    def prepare_model_if_needed(self, settings : ImageGeneratorTaskSettings):
        if self.last_task is not None:
            is_same_model = settings.is_structurally_equal(self.last_task.settings)
        else:
            is_same_model = False

        if is_same_model == True:
            print("[GEN] Reusing last model")
            return

        self.pipe = None

        print(f"[GEN] Reloading model")
        
        torch.nn.Conv2d.__init__ = self._original_conv_init

        if settings.type == ImageGeneratorTaskType.preview:            
            if settings.seamless == 1:
                init = torch.nn.Conv2d.__init__
                def __init__(self, *args, **kwargs):
                    return init(self, *args, **kwargs, padding_mode='circular')
                torch.nn.Conv2d.__init__ = __init__

            pipe = StableDiffusionPipeline.from_pretrained(
                "stabilityai/stable-diffusion-2-1",
                torch_dtype=torch.float16, 
                revision="fp16",
                safety_checker=None,
                cache_dir=self.models_url,
                local_files_only=True
            )

        elif settings.type == ImageGeneratorTaskType.upscale:
            pipe = StableDiffusionUpscalePipeline.from_pretrained(
                "stabilityai/stable-diffusion-x4-upscaler",
                torch_dtype=torch.float16, 
                revision="fp16",
                cache_dir=self.models_url,
                local_files_only=True
            )

        elif settings.type == ImageGeneratorTaskType.variation:
            pipe = StableDiffusionImageVariationPipeline.from_pretrained(
                "lambdalabs/sd-image-variations-diffusers",
                revision="v2.0",
                cache_dir=self.models_url,
                local_files_only=True
            )

        if settings.method == "dpm":
            pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
        elif settings.method == "ddim":
            pipe.scheduler = DDIMScheduler.from_config(pipe.scheduler.config)
        elif settings.method == "k-lms":
            pipe.scheduler = LMSDiscreteScheduler.from_config(pipe.scheduler.config)
        elif settings.method == "heun":
            pipe.scheduler = HeunDiscreteScheduler.from_config(pipe.scheduler.config)
        elif settings.method == "dpm-ss":
            pipe.scheduler = DPMSolverSinglestepScheduler.from_config(pipe.scheduler.config)
        elif settings.method == "deis-ms":
            pipe.scheduler = DEISMultistepScheduler.from_config(pipe.scheduler.config)

        pipe = pipe.to("cuda")

        if is_xformers_available():
            print("[GEN] Xformers is enabled")
            pipe.enable_xformers_memory_efficient_attention()
        else:
            print("[GEN] Xformers is NOT enabled")

        if settings.type == ImageGeneratorTaskType.upscale:
            print("[GEN] Attention slicing is enabled")
            pipe.enable_attention_slicing()
            pipe.enable_sequential_cpu_offload()

        # TODO: create better mapping for this size
        if self.total_vram_amount <= 17:
            print("[GEN] Attention slicing is enabled")
            pipe.enable_attention_slicing()

        self.pipe = pipe
        self.approximate_image_decoder = ApproximateDecoder.for_pipeline(pipe)

        print("[GEN] Reloaded model")

    def wait(self):
        self.daemon.join()

from uuid import uuid4

# if __name__ == "__main__":
#     generator = ImageGenerator(models_url="D:\\Neural\\varnava-data\\models")

#     generator.add_task(ImageGeneratorTask(prompt="Planets in space photographed from the Earth. Great colors. Hyperrealistic",
#                                           outputs=[
#                                             ImageGeneratorOutput(id=uuid4(), url="C:\\Users\\d\\Desktop\\output.png")
#                                           ],
#                                           settings=ImageGeneratorTaskSettings(batch=1, type=ImageGeneratorTaskType.preview)))

#     generator.start()

#     generator.wait()