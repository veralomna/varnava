from dataclasses import dataclass
import datetime
import os
import json
from peewee import SqliteDatabase, Model, CharField, BooleanField, UUIDField, DateTimeField, ForeignKeyField, TextField, BigIntegerField, FloatField
from lib.generator import ImageGenerator, ImageGeneratorTaskType
from lib.resource_manager import RemoteResourceManager
from ext.json_encoder import replace_json_encoder
from ext.database import EnumField, JSONField, generate_uuid
from ext.singleton import Singleton
from mashumaro import DataClassDictMixin

# Database models
_db = SqliteDatabase(None)

class BaseModel(Model):
    class Meta:
        database = _db

class Project(BaseModel):
    id = UUIDField(primary_key=True, default=generate_uuid)
    createdAt = DateTimeField(default=datetime.datetime.now)
    title = CharField(max_length=200)
    isArchived = BooleanField(default=False)

class Prompt(BaseModel):
    id = UUIDField(primary_key=True, default=generate_uuid)
    createdAt = DateTimeField(default=datetime.datetime.now)
    project = ForeignKeyField(Project, field="id", backref="prompts")
    value = TextField()

class Output(BaseModel):
    id = UUIDField(primary_key=True, default=generate_uuid)
    createdAt = DateTimeField(default=datetime.datetime.now)
    parent = ForeignKeyField("self", null=True, field="id", backref="children")
    prompt = ForeignKeyField(Prompt, field="id", backref="outputs")
    seed = BigIntegerField(default=0)
    progress = FloatField(default=0)
    type = EnumField(ImageGeneratorTaskType, default=ImageGeneratorTaskType.preview)
    settings = JSONField(default={})
    url = TextField()
    isArchived = BooleanField(default=False)
    isFavorite = BooleanField(default=False)

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
        print("hi", url)
        self.config.url_for_data = url
        print("ho")
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

        self.url_for_root_dir = os.path.join(os.getenv("LOCALAPPDATA"), "veralomna", "varnava") 
        self.config = self.read_config()

        os.makedirs(self.url_for_models_dir, exist_ok=True)
        
        print("[SRV] Initialising database")

        self.db = _db
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