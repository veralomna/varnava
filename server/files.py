import os
from sanic import Blueprint
from context import context
from lib.json import json

files = Blueprint("files")

files.static(
    "/outputs", 
    os.path.join(context.url_for_outputs), 
    use_modified_since=False,
    name="outputs"
)