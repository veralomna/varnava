import os
from sanic import Blueprint
from context import Context
from ext.json import json

files = Blueprint("files")

files.static(
    "/outputs", 
    os.path.join(Context.instance().url_for_outputs_dir), 
    use_modified_since=False,
    name="outputs"
)