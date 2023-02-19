from sanic import Blueprint
from sanic.response import json
from uuid import UUID
from playhouse.shortcuts import model_to_dict
from context import Project, Prompt, Output

prompts = Blueprint("prompts")

# Listing all prompts in the project
@prompts.get("/project/<project_id:uuid>/prompts")
async def list_all_prompts(request, project_id: UUID):
    project = Project.get_or_none(id = project_id)

    if project is None:
        return json({
            "error" : "not-found"
        }, status=404)

    raw_prompts = Prompt.select().where(Prompt.project == project).order_by(Prompt.createdAt.desc())

    prompts = []

    for raw_prompt in raw_prompts:
        raw_outputs = Output.select().where(Output.prompt == raw_prompt, Output.parent.is_null()).order_by(Output.createdAt.desc())

        prompt = model_to_dict(raw_prompt, recurse=False, backrefs=True)
        prompt["outputs"] = list(
            map(lambda raw_output:model_to_dict(raw_output, recurse=False, backrefs=True), raw_outputs)
        )

        prompt.pop("project", None)
        prompts.append(prompt)

    return json({
        "prompts": prompts
    })

# Adding a prompt
@prompts.post("/project/<project_id:uuid>/prompts/add")
async def add_prompt(request, project_id: UUID):
    project = Project.get_or_none(id = project_id)

    if project is None:
        return json({
            "error" : "not-found"
        }, status=404)

    required_keys = ["value"]

    if request.json is None or not all(key in required_keys for key in request.json):
        return json({
            "error" : "missing-field"
        }, status=500)

    # Adding prompt itself
    prompt = Prompt(
        project=project,
        value=request.json["value"]
    )

    prompt.save(force_insert=True)

    return json({
        "prompt" : model_to_dict(prompt, recurse=False)
    })

# Moving a prompt to another project
@prompts.post("/project/<project_id:uuid>/prompts/move")
async def move_prompt(request, project_id: UUID):
    destination_project = Project.get_or_none(id = project_id)

    if destination_project is None:
        return json({
            "error" : "not-found"
        }, status=404)

    required_keys = ["prompt_id"]

    if request.json is None or not all(key in required_keys for key in request.json):
        return json({
            "error" : "missing-field"
        }, status=500)

    # Moving prompt
    prompt = Prompt.get_or_none(id = request.json["prompt_id"])

    if prompt is None:
        return json({
            "error" : "prompt-not-found"
        }, status=404)

    prompt.project = destination_project
    prompt.save()

    return json({
        "prompt" : model_to_dict(prompt, recurse=False)
    })