import os
from sanic import Blueprint
from context import context
from lib.json import json

resources = Blueprint("resources", url_prefix="/resources")

@resources.route("/")
async def get_resources_status(request):
    manager = context.generator.models

    return json({
        "preview_models" : [model.to_dict() for model in manager.preview_models],
        "upscale_models" : [model.to_dict() for model in manager.upscale_models],
        "data_path" : manager.url_for_data,
        "is_downloading" : manager.is_downloading
    })

@resources.route("/downloads/start")
async def start_downloading(request):
    context.generator.models.start_downloading()

    return json({
        "status" : "ok"
    })

@resources.route("/downloads/stop")
async def stop_downloading(request):
    context.generator.models.stop_downloading()

    return json({
        "status" : "ok"
    })

@resources.post("/add")
async def add_model(request):
    input = request.json if request.json is not None else {}
    id = input["id"] if "id" in input else None

    if id is None:
        return json({
            "error" : "missing-field",
            "error-details" : {
                "name" : "id"
            }
        })
    
    try:
        await context.generator.models.add_preview_model(id)

        return json({
            "status" : "ok"
        })
    except Exception as e:
        return json({
            "error" : "invalid-model",
            "error-details" : {
                "text" : str(e)
            }
        })        
    
@resources.post("/remove")
async def remove_model(request):
    input = request.json if request.json is not None else {}
    id = input["id"] if "id" in input else None

    if id is None:
        return json({
            "error" : "missing-field",
            "error-details" : {
                "name" : "id"
            }
        })
    
    try:
        await context.generator.models.remove_preview_model(id)

        return json({
            "status" : "ok"
        })
    except Exception as e:
        return json({
            "error" : "invalid-model",
            "error-details" : {
                "text" : str(e)
            }
        })        

@resources.post("/data-path/update")
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
    
    context.generator.models.update_url_for_data(path)

    return json({
        "status" : "ok"
    })
