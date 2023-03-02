import os
from sanic import Blueprint
from context import Context
from lib.json import json

resources = Blueprint("resources", url_prefix="/resources")

@resources.route("/")
async def get_resources_status(request):
    resource_manager = Context.instance().generator.models

    raw_resources = resource_manager.resources

    resources = []
    
    for raw_resource in raw_resources:
        resources.append(raw_resource.to_dict())
    
    return json({
        "resources" : resources,
        "isDownloading" : resource_manager.is_downloading,
        "downloadingPath" : resource_manager.downloading_path,
        "dataPath" : Context.instance().url_for_data_dir,
        "isDataPathDefault" : Context.instance().url_for_default_data_dir == Context.instance().url_for_data_dir
    })

@resources.route("/start_downloading")
async def start_downloading(request):
    Context.instance().generator.models.start_downloading()

    return json({
        "status" : "ok"
    })

@resources.route("/stop_downloading")
async def stop_downloading(request):
    Context.instance().generator.models.stop_downloading()

    return json({
        "status" : "ok"
    })

@resources.route("/remove_downloads")
async def remove_downloads(request):
    Context.instance().generator.models.remove_downloads()

    return json({
        "status" : "ok"
    })

@resources.post("/update_data_path")
async def update_data_path(request):
    input = request.json if request.json is not None else {}

    path = input["path"] if "path" in input else None

    if path is None:
        return json({
            "error" : "missing-field",
            "error-details" : {
                "name" : "path"
            }
        })
    
    if os.path.exists(path) == False:
        return json({
            "error" : "path-not-found"
        })
    
    if os.path.isfile(path) == True:
        return json({
            "error" : "path-not-directory"
        })
    
    Context.instance().url_for_data_dir = path

    return json({
        "status" : "ok"
    })
