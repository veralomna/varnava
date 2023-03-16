from dataclasses import dataclass, field
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
from huggingface_hub.utils import scan_cache_dir
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

    preview_models : list[RemoteModel] = field(default_factory=list) 
    upscale_models : list[RemoteModel] = field(default_factory=list) 

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

    # All models list

    @property
    def preview_models(self):
        return self.__config.preview_models
    
    @property
    def upscale_models(self):
        return self.__config.upscale_models

    @property
    def default_preview_model(self):
        return RemoteModel(
            name="Preview",
            path= "stabilityai/stable-diffusion-2-1" if platform == "win32" else "stabilityai/stable-diffusion-2-1-base",
            revision="fp16",
        )
    
    @property
    def default_upscale_model(self):
        return RemoteModel(
            name="Upscale",
            path="stabilityai/stable-diffusion-x4-upscaler",
            revision="fp16"
        )
    
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
        except (FileNotFoundError, ValueError) as e:
            self.__config = ModelsConfiguration(url_for_data=self.url_for_default_data)

        # Adding default models if no models were found
        if len(self.__config.preview_models) == 0:
            self.__config.preview_models.append(self.default_preview_model)

        if len(self.__config.upscale_models) == 0:
            self.__config.upscale_models.append(self.default_upscale_model)

        self.write_config()

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
        
        self.fetch_resources_local_information()
        self.fetch_resources_remote_information()

    # Updating state of the manager

    async def remove_preview_model(self, id):
        self.stop_downloading()

        repos = { repo.repo_id : repo for repo in list(scan_cache_dir(self.url_for_models).repos) }

        if id in repos:
            os.rmdir(repos[id].repo_path)

        self.__config.preview_models = [model for model in self.__config.preview_models if model.path != id]
        self.write_config()

        if self.download_callback is not None:
            self.download_callback()

    async def add_preview_model(self, id):
        self.stop_downloading()

        try: 
            info = self.api.list_repo_refs(id)
            revisions = [branch.name for branch in info.branches]
            
            if "fp16" in revisions:
                revision = "fp16"
            else:
                revision = revisions[0]
        except:
            raise RuntimeError("Specified model not found.")
        
        if id in [model.path for model in self.preview_models]:
            raise RuntimeError("Specified model is already added.")

        repo_info = self.api.repo_info(repo_id=id, 
                                       repo_type="model",
                                       revision=revision,
                                       files_metadata=True)

        model = RemoteModel(name="Preview", 
                            path=id,
                            revision=revision,
                            downloaded_file_bytes=0,
                            total_file_bytes=self.__get_model_network_size(repo_info))
        
        self.__config.preview_models.append(model)
        self.write_config() 

        if self.download_callback is not None:
            self.download_callback()

    def update_url_for_data(self, path):
        self.__config.url_for_data = path
        self.write_config()

        self.fetch_resources_local_information()

        if self.download_callback is not None:
            self.download_callback()

    # Getting model info by its path (id)
    def get_preview_model_by_id(self, id):
        models = { model.path : model for model in self.preview_models }
        return models.get(id)

    # Fetching remote resource information about file sizes

    def fetch_resources_remote_information(self):
        for index, resource in enumerate(self.preview_models):
            if resource.total_file_bytes != 0:
                continue

            repo_info = self.api.repo_info(repo_id=resource.path, 
                                           repo_type="model",
                                           revision=resource.revision,
                                           files_metadata=True)
            
            self.preview_models[index].total_file_bytes = self.__get_model_network_size(repo_info)

        for index, resource in enumerate(self.upscale_models):
            if resource.total_file_bytes != 0:
                continue

            repo_info = self.api.repo_info(repo_id=resource.path, 
                                           repo_type="model",
                                           revision=resource.revision,
                                           files_metadata=True)
            
            self.upscale_models[index].total_file_bytes = self.__get_model_network_size(repo_info)
    
        self.write_config()

    def __get_model_network_size(self, info):
        total_file_bytes = 0
            
        for file in info.siblings:
            if any(fnmatch(file.rfilename, pattern) for pattern in self.ignored_patterns):
                continue

            if file.lfs is not None:
                total_file_bytes += file.lfs.get("size") or 0
            elif file.size is not None:
                total_file_bytes += file.size

        return total_file_bytes

    def fetch_resources_local_information(self):
        repos = { repo.repo_id : repo for repo in list(scan_cache_dir(self.url_for_models).repos) }

        for index, resource in enumerate(self.preview_models):
            try:
                ref = repos[resource.path].refs[resource.revision]
            except:
                continue

            if ref is None:
                continue
            
            self.preview_models[index].downloaded_file_bytes = ref.size_on_disk

        for index, resource in enumerate(self.upscale_models):
            try:
                ref = repos[resource.path].refs[resource.revision]
            except:
                continue

            if ref is None:
                continue

            self.upscale_models[index].downloaded_file_bytes = ref.size_on_disk

  
    # Downloading 

    def start_downloading(self):
        if self.download_process is not None:
            return
        
        def download():
            for index, resource in enumerate(self.__config.preview_models + self.__config.upscale_models):
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
        
        async def fetch_resources_local_information_periodically():
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

        config_file = open(self.url_for_config, "w+")
        json.dump(config, config_file)

        config_file.close()

