from dataclasses import dataclass
import os
import asyncio
from multiprocessing import Process
from threading import Thread
from time import sleep
from huggingface_hub.hf_api import HfApi
from huggingface_hub._snapshot_download import snapshot_download
from huggingface_hub.file_download import repo_folder_name
from mashumaro import DataClassDictMixin

@dataclass
class RemoteResource(DataClassDictMixin):
    name : str
    path : str
    revision : str | None = None
    is_required : bool = True
    downloaded_file_bytes : int = 0 # Current number of bytes on local device
    total_file_bytes : int = 0 # Total number of bytes to be downloaded from remote

class RemoteResourceManager:
    
    def __init__(self, models_url : str):
        # Models location URL
        self.models_url = models_url

        # HF API instance
        self.api = HfApi()

        # HF models information
        self.models_info = {}

        # Downloading thread
        self.download_process : Process | None = None

        # All models that need to be downloaded
        self.resources = [
            RemoteResource(name="Preview Model", path="stabilityai/stable-diffusion-2-1", revision="fp16"),
            RemoteResource(name="Upscaling Model", path="stabilityai/stable-diffusion-x4-upscaler", revision="fp16"),
            RemoteResource(name="Variations Model", path="lambdalabs/sd-image-variations-diffusers", revision="v2.0")
        ]

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
                file_url = os.path.join(base_url, file.rfilename)

                if os.path.exists(file_url):
                    size = os.path.getsize(file_url)
                    downloaded_file_bytes += size

            self.resources[index].downloaded_file_bytes = downloaded_file_bytes

    def start_downloading(self):
        if self.download_process is not None:
            return
        
        self.download_process = Process(target=self.download)
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

            if self.is_downloading == False:
                break

            self.fetch_resources_local_information()
        
    def download(self):
        for index, resource in enumerate(self.resources):
            try:
                self.downloading_path = resource.path

                snapshot_download(resource.path,
                                revision=resource.revision,
                                resume_download=True,
                                cache_dir=self.models_url,
                                max_workers=1)
            except:
                pass

        self.stop_downloading()


if __name__ == "__main__":
    manager = RemoteResourceManager(models_url="D:/Neural/varnava/server/data/models")
    print(manager.resources)