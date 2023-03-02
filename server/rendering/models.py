from dataclasses import dataclass
import os
import asyncio
from sys import platform
from multiprocessing import Process
from threading import Thread
from time import sleep
from huggingface_hub.hf_api import HfApi
from huggingface_hub._snapshot_download import snapshot_download
from huggingface_hub.file_download import repo_folder_name
from mashumaro import DataClassDictMixin
from diffusers.pipelines.pipeline_utils import variant_compatible_siblings

@dataclass
class RemoteModel(DataClassDictMixin):
    name : str
    path : str
    revision : str | None = None
    is_required : bool = True
    downloaded_file_bytes : int = 0 # Current number of bytes on local device
    total_file_bytes : int = 0 # Total number of bytes to be downloaded from remote

class ModelManager:

    @property
    def resources(self):
        return [self.preview_model, self.upscale_model]
    
    def __init__(self, models_url : str, download_callback = None):
        # Storing channel to send quick updates
        self.download_callback = download_callback

        # Models location URL
        self.models_url = models_url

        # HF API instance
        self.api = HfApi()

        # HF models information
        self.models_info = {}

        # Preview model information
        self.preview_model = RemoteModel(
            name="Preview",
            path= "stabilityai/stable-diffusion-2-1" if platform == "win32" else "stabilityai/stable-diffusion-2-1-base",
            revision="fp16"
        )

        self.upscale_model = RemoteModel(
            name="Upscale",
            path="stabilityai/stable-diffusion-x4-upscaler",
            revision="fp16"
        )
        
        # TODO: implement preview model selection from HuggingFace hub.
        # models = self.api.list_models(
        #     limit=3,
        #     sort="downloads",
        #     direction=-1,
        #     filter=ModelFilter(
        #         task="text-to-image",
        #         library="diffusers",
        #     ),
        #     cardData=False,
        #     full=True,
        # )

        # Downloading thread
        self.download_process : Process | None = None

        # Current resource being downloaded
        self.downloading_path : str | None = None

        def fetch_information():
            self.fetch_resources_remote_information()
            self.fetch_resources_local_information()
        
        fetch_thread = Thread(target=fetch_information)
        fetch_thread.run()

    @property
    def is_downloading(self):
        return self.download_process != None

    def fetch_resources_remote_information(self):
 
        for index, resource in enumerate(self.resources):
            repo_info = self.api.repo_info(repo_id=resource.path, 
                                           repo_type="model",
                                           revision=resource.revision,
                                           files_metadata=True)
            
            self.models_info[resource.path] = repo_info

            total_file_bytes = 0
            
            for file in repo_info.siblings:
                if file.rfilename.endswith("ckpt"):
                    continue

                if file.lfs is not None:
                    total_file_bytes += file.lfs.get("size") or 0
                elif file.size is not None:
                    total_file_bytes += file.size

            self.resources[index].total_file_bytes = total_file_bytes

    def fetch_resources_local_information(self):
        for index, resource in enumerate(self.resources):
            repo_info = self.models_info[resource.path]
            commit_hash = repo_info.sha

            base_url = os.path.join(
                self.models_url, 
                repo_folder_name(repo_id=resource.path, repo_type="model"),
                "snapshots",
                commit_hash
            )

            downloaded_file_bytes = 0
            
            for file in repo_info.siblings:
                if file.rfilename.endswith("ckpt"):
                    continue

                file_url = os.path.join(base_url, file.rfilename)

                if os.path.exists(file_url):
                    size = os.path.getsize(file_url)
                    downloaded_file_bytes += size

            self.resources[index].downloaded_file_bytes = downloaded_file_bytes

    def start_downloading(self):
        if self.download_process is not None:
            return
        
        self.download_process = Thread(target=self.download)
        self.download_process.start()

        loop = asyncio.get_event_loop()
        loop.create_task(self.fetch_resources_local_information_periodically())

    def stop_downloading(self):
        if self.download_process is None:
            return

        self.download_process = None

    def remove_downloads(self):
        self.stop_downloading()

    async def fetch_resources_local_information_periodically(self):
        while True:
            await asyncio.sleep(2)

            self.fetch_resources_local_information()
            
            if self.download_callback is not None:
                self.download_callback()

            if self.is_downloading == False:
                break
        
    def download(self):
        print("[RSM] Starting model downloads")

        for index, resource in enumerate(self.resources):
            try:
                print("[RSM] Downloading", resource.path)

                self.downloading_path = resource.path

                snapshot_download(
                    resource.path,
                    revision=resource.revision,
                    resume_download=True,
                    cache_dir=self.models_url,
                    max_workers=1,
                    ignore_patterns=["*.ckpt"]
                )
                
            except:
                pass

        self.stop_downloading()

