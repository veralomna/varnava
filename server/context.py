import os
import json
from dataclasses import dataclass
from rendering.generator import ImageGenerator
from db.models import db, Project, Prompt, Output
from lib.channel import Channel

# Context with all relevant objects and constants

class __Context(object):

    # Path inside local application data directory for storing configuration and database

    @property
    def url_for_db(self):
        return os.path.join(self.url_for_root, "data.db")
    
    @property
    def url_for_outputs(self):
        return os.path.join(self.generator.models.url_for_data, "outputs")

    def url_for_output(self, *parts):
        path = self.url_for_outputs

        for part in parts:
            path = os.path.join(path, part)

        return path

    def __init__(self):
        print("[SRV] Loading configuration data")

        self.url_for_root = os.path.join(os.getenv("VARNAVA_DATA_PATH"), "veralomna", "varnava") 
    
        print("[SRV] Initialising database")

        self.db = db
        self.db.init(self.url_for_db)
        self.db.connect()
        self.db.create_tables([Project, Prompt, Output])

        print("[SRV] Clearing unfinished tasks")

        query = Output.delete().where(Output.progress < 1.0)
        query.execute()
        
        self.channel = Channel()

        print("[SRV] Initialising generator")

        self.generator = ImageGenerator(
            url_for_root=self.url_for_root, 
            models_download_callback=lambda: self.channel.send("resources.update", {})
        )

        self.generator.start()

        print("[SRV] Ready")

context = __Context()