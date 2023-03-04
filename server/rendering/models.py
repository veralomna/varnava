from dataclasses import dataclass
import os
import asyncio
import json
from fnmatch import fnmatch
from sys import platform
from multiprocessing import Process
from threading import Thread
from time import sleep
from huggingface_hub.hf_api import HfApi, ModelFilter
from huggingface_hub._snapshot_download import snapshot_download
from huggingface_hub.file_download import repo_folder_name
from mashumaro import DataClassDictMixin
from diffusers.pipelines.pipeline_utils import variant_compatible_siblings

@dataclass
class RemoteModel(DataClassDictMixin):
    name : str
    path : str
    revision : str | None = None
    downloaded_file_bytes : int = 0 # Current number of bytes on local device
    total_file_bytes : int = 0 # Total number of bytes to be downloaded from remote

@dataclass 
class ModelsConfiguration(DataClassDictMixin):
    url_for_data : str
   
    preview_model : RemoteModel = RemoteModel(
        name="Preview",
        path= "stabilityai/stable-diffusion-2-1" if platform == "win32" else "stabilityai/stable-diffusion-2-1-base",
        revision="fp16"
    )
    
    upscale_model : RemoteModel = RemoteModel(
        name="Upscale",
        path="stabilityai/stable-diffusion-x4-upscaler",
        revision="fp16"
    )

class ModelManager:

    # Various paths that are model storages and data storages.

    @property
    def url_for_config(self):
        return os.path.join(self.url_for_root, "config.json")
    
    @property
    def url_for_default_data(self):
        return os.path.join(self.url_for_root, "data")
    
    @property
    def url_for_data(self):
        return self.__config.url_for_data

    @property
    def url_for_models(self):
        return os.path.join(self.url_for_data, "models")

    # Models properties

    @property
    def preview_model(self):
        return self.__config.preview_model
    
    @property
    def upscale_model(self):
        return self.__config.upscale_model

    @property
    def all_models(self):
        return [self.preview_model, self.upscale_model]
    
    # Download state

    @property
    def is_downloading(self):
        return self.download_process != None

    def __init__(self, url_for_root : str, download_callback = None):
        self.url_for_root = url_for_root

        # Creating configuration
        try:
            config_file = open(self.url_for_config, "r")
            config = ModelsConfiguration.from_dict(json.load(config_file))
            config_file.close()

            self.__config = config
        except (FileNotFoundError, ValueError) as error:
            self.__config = ModelsConfiguration(url_for_data=self.url_for_default_data)

        # Making necessary directories 
        os.makedirs(self.url_for_models, exist_ok=True)

        # Storing channel to send quick updates
        self.download_callback = download_callback

        # HF API instance
        self.api = HfApi()

        # HF models information
        self.models_info = {}

        # Downloading thread
        self.download_process : Process | None = None

        # Ignored file extensions inside repositories
        self.ignored_patterns = ["*.ckpt", "*.safetensors"]

        def fetch_all_information():
            self.fetch_resources_remote_information()
            self.fetch_resources_local_information()
        
        fetch_thread = Thread(target=fetch_all_information)
        fetch_thread.run()

    # Updating state of the manager

    async def update_preview_model(self, path : str, revision : str):
        self.__config.preview_model.path = path
        self.__config.preview_model.revision = revision
        self.write_config()

        self.fetch_resources_remote_information()
        self.fetch_resources_local_information()

        if self.download_callback is not None:
            self.download_callback()

    def update_url_for_data(self, path):
        self.__config.url_for_data = path
        self.write_config()

        self.fetch_resources_local_information()

        if self.download_callback is not None:
            self.download_callback()

    # Fetching information about models and revisions from the hub
  
    async def fetch_all_compatible_models(self):
        models = self.api.list_models(
            limit=100,
            sort="downloads",
            direction=-1,
            filter=ModelFilter(
                task="text-to-image",
                library="diffusers",
            ),
            cardData=False,
            full=False,
        )

        return [model.modelId for model in models]

    async def fetch_model_revisions(self, id : str):
        try:
            info = self.api.list_repo_refs(id)
            return [branch.name for branch in info.branches]
        except:
            return []
    
    # Fetching remote resource information about file sizes

    def fetch_resources_remote_information(self):
        for index, resource in enumerate(self.all_models):
            repo_info = self.api.repo_info(repo_id=resource.path, 
                                           repo_type="model",
                                           revision=resource.revision,
                                           files_metadata=True)
            
            self.models_info[resource.path] = repo_info

            total_file_bytes = 0
            
            for file in repo_info.siblings:
                if any(fnmatch(file.rfilename, pattern) for pattern in self.ignored_patterns):
                    continue

                if file.lfs is not None:
                    total_file_bytes += file.lfs.get("size") or 0
                elif file.size is not None:
                    total_file_bytes += file.size

            self.all_models[index].total_file_bytes = total_file_bytes

    def fetch_resources_local_information(self):
        for index, resource in enumerate(self.all_models):
            repo_info = self.models_info[resource.path]
            commit_hash = repo_info.sha

            base_url = os.path.join(
                self.url_for_models, 
                repo_folder_name(repo_id=resource.path, repo_type="model"),
                "snapshots",
                commit_hash
            )

            downloaded_file_bytes = 0
            
            for file in repo_info.siblings:
                if any(fnmatch(file.rfilename, pattern) for pattern in self.ignored_patterns):
                    continue

                file_url = os.path.join(base_url, file.rfilename)

                if os.path.exists(file_url):
                    size = os.path.getsize(file_url)
                    downloaded_file_bytes += size

            self.all_models[index].downloaded_file_bytes = downloaded_file_bytes

    # Downloading 

    def start_downloading(self):
        if self.download_process is not None:
            return
        
        def download(self):
            for index, resource in enumerate(self.all_models):
                try:
                    snapshot_download(
                        resource.path,
                        revision=resource.revision,
                        resume_download=True,
                        cache_dir=self.url_for_models,
                        max_workers=1,
                        ignore_patterns=self.ignored_patterns
                    )
                    
                except:
                    pass

            self.stop_downloading()
        
        async def fetch_resources_local_information_periodically(self):
            while True:
                await asyncio.sleep(2)

                self.fetch_resources_local_information()
                
                if self.download_callback is not None:
                    self.download_callback()

                if self.is_downloading == False:
                    break
        
        self.download_process = Thread(target=download)
        self.download_process.start()

        loop = asyncio.get_event_loop()
        loop.create_task(fetch_resources_local_information_periodically())

    def stop_downloading(self):
        if self.download_process is None:
            return

        self.download_process = None

    # Configuration reading and writing
 
    def write_config(self):
        config = self.__config.to_dict()

        print(f"Config was updated to {config}")

        config_file = open(self.url_for_config, "w+")
        json.dump(config, config_file)

        config_file.close()

