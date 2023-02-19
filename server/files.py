import os
from sanic import Blueprint
from sanic.response import json
from context import Context

files = Blueprint("files")

files.static(
    "/outputs", 
    os.path.join(Context.instance().url_for_outputs_dir), 
    use_modified_since=False,
    name="outputs"
)