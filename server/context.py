import datetime
import os
import json
from dataclasses import dataclass
from peewee import SqliteDatabase
from rendering.generator import ImageGenerator, ImageGeneratorTaskType
from rendering.resource_manager import RemoteResourceManager
from db.models import db, Project, Prompt, Output
from lib.singleton import Singleton
from lib.channel import Channel
from mashumaro import DataClassDictMixin

# Configuration 

@dataclass 
class ContextConfiguration(DataClassDictMixin):
    url_for_data : str

# Context with all relevant objects and constants

@Singleton
class Context(object):

    # Data directory can be configured by the user

    @property
    def url_for_data_dir(self):
        return self.config.url_for_data
    
    @url_for_data_dir.setter
    def url_for_data_dir(self, url):
        self.config.url_for_data = url
        self.write_config()

    # Path inside local application data directory for storing configuration and database

    @property
    def url_for_default_data_dir(self):
        return os.path.join(self.url_for_root_dir, "data")

    @property
    def url_for_db(self):
        return os.path.join(self.url_for_root_dir, "data.db")
    
    @property
    def url_for_config(self):
        return os.path.join(self.url_for_root_dir, "config.json")
    
    # Paths inside data directory for storing models and outputs

    @property
    def url_for_models_dir(self):
        return os.path.join(self.url_for_data_dir, "models")

    @property
    def url_for_outputs_dir(self):
        return os.path.join(self.url_for_data_dir, "outputs")

    def url_for_output(self, *parts):
        path = self.url_for_outputs_dir

        for part in parts:
            path = os.path.join(path, part)

        return path

    def __init__(self):
        print("[SRV] Loading configuration data")

        self.url_for_root_dir = os.path.join(os.getenv("VARNAVA_DATA_PATH"), "veralomna", "varnava") 
        self.config = self.read_config()

        os.makedirs(self.url_for_models_dir, exist_ok=True)
        
        print("[SRV] Initialising database")

        self.db = db
        self.db.init(self.url_for_db)
        self.db.connect()
        self.db.create_tables([Project, Prompt, Output])

        print("[SRV] Clearing unfinished tasks")

        query = Output.delete().where(Output.progress < 1.0)
        query.execute()

        print("[SRV] Initialising generator")

        self.generator = ImageGenerator(models_url=self.url_for_models_dir)
        self.generator.start()

        print("[SRV] Starting resources manager")

        self.channel = Channel()
        self.resource_manager = RemoteResourceManager(models_url=self.url_for_models_dir)   

        print("[SRV] Ready")

    def read_config(self):
        try:
            config_file = open(self.url_for_config, "r")
            config = ContextConfiguration.from_dict(json.load(config_file))
            config_file.close()
            return config
        except (FileNotFoundError, ValueError) as error:
            return ContextConfiguration(url_for_data=self.url_for_default_data_dir)
        
    def write_config(self):
        config = self.config.to_dict()

        print(f"Config was updated to {config}")

        config_file = open(self.url_for_config, "w+")
        json.dump(config, config_file)

        config_file.close()