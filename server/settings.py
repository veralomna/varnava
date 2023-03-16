from sanic import Blueprint
from lib.json import json
from context import context

settings = Blueprint("settings")

# Listing all possible prompts settings
@settings.get("/settings/prompts")
async def list_prompts_settings(request):
    manager = context.generator.models

    ids = [model.path for model in manager.preview_models if model.total_file_bytes == model.downloaded_file_bytes]

    if len(ids) == 0:
        ids = [manager.default_preview_model.path]

    return json({
        "constants" : {
            "base_dimension" : context.generator.base_dimension,
            "upscaled_dimension" : context.generator.upscaled_dimension,
        },
        "settings" : [
            {
                "name" : "model",
                "type" : "array",
                "values" : ids,
                "default" : ids[0]
            },
            {
                "name" : "dimensions",
                "type" : "range",
                "min" : 0.5,
                "max" : 2.0,
                "step" : 0.01,
                "default" : 1.0,
            },
            {
                "name" : "batch",
                "type" : "range",
                "min" : 1,
                "max" : 4,
                "step" : 1,
                "default" : 2,
            },
            {
                "name" : "method",
                "type" : "array",
                "values" : ["dpm", "plms", "ddim", "deis-ms", "k-lms", "heun", "dpm-ss"],
                "default" : "dpm",
            },
            {
                "name" : "strength",
                "type" : "range",
                "min" : 0.0,
                "max" : 1.0,
                "step" : 0.01,
                "default" : 0.4
            },
            {
                "name" : "steps",
                "type" : "range",
                "min" : 1,
                "max" : 300,
                "step" : 1,
                "default" : 30,
            },
            {
                "name" : "seed",
                "type" : "array",
                "values" : [
                    -1
                ],
                "default" : -1,
                "displayNames" : {
                    -1 : "Auto"
                },
                "custom" : "number"
            },
            {
                "name" : "seamless",
                "type" : "range",
                "min" : 0,
                "max" : 1,
                "step" : 1,
                "default" : 0,
                "displayNames" : {
                    0 : "No",
                    1 : "Yes"
                }
            }
        ]
    })