import os
from sanic import Blueprint
from context import context
from lib.json import json

resources = Blueprint("resources", url_prefix="/resources")

@resources.route("/")
async def get_resources_status(request):
    manager = context.generator.models

    return json({
        "models" : [model.to_dict() for model in manager.all_models],
        "dataPath" : manager.url_for_data,
        "isDownloading" : manager.is_downloading
    })

@resources.route("/start_downloading")
async def start_downloading(request):
    context.generator.models.start_downloading()

    return json({
        "status" : "ok"
    })

@resources.route("/stop_downloading")
async def stop_downloading(request):
    context.generator.models.stop_downloading()

    return json({
        "status" : "ok"
    })

@resources.route("/list_models")
async def list_models(request):
    models = await context.generator.models.fetch_all_compatible_models()

    return json({
        "models" : [model.to_dict() for model in models]
    }) 

@resources.post("/update_preview_model_path")
async def update_preview_model_path(request):
    input = request.json if request.json is not None else {}
    path = input["path"] if "path" in input else None

    if path is None:
        return json({
            "error" : "missing-field",
            "error-details" : {
                "name" : "path"
            }
        })
    
    revisions = await context.generator.models.fetch_model_revisions(path)

    if "fp16" in revisions:
        revision = "fp16"
    else:
        revision = revisions[0]

    await context.generator.models.update_preview_model(path=path, revision=revision)

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
    
    context.generator.models.update_url_for_data(path)

    return json({
        "status" : "ok"
    })
