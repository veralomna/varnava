from sanic import Blueprint
from sanic.response import json

settings = Blueprint("settings")

# Listing all possible prompts settings
@settings.get("/settings/prompts")
async def list_prompts_settings(request):
    return json({
        "constants" : {
            "base_dimension" : 768,
            "upscaled_dimension" : 2048,
        },
        "settings" : [
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
                "default" : 0.6
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
                    -1 : "Random"
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