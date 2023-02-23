import datetime
from rendering.generator import ImageGeneratorTaskType
from peewee import SqliteDatabase, Model, CharField, BooleanField, UUIDField, DateTimeField, ForeignKeyField, TextField, BigIntegerField, FloatField
from db.fields import EnumField, JSONField, generate_uuid

# Database models
db = SqliteDatabase(None)

class BaseModel(Model):
    class Meta:
        database = db

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
