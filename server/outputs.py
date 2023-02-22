import os
from sanic import Blueprint
from uuid import uuid4, UUID
from playhouse.shortcuts import model_to_dict
from context import Project, Prompt, Output, Context
from rendering.generator import ImageGeneratorTask, ImageGeneratorOutput, ImageGeneratorTaskSettings, ImageGeneratorTaskType
from ext.json import json

outputs = Blueprint("outputs")

# Getting output with its children by their respective identifiers
@outputs.get("/projects/<project_id:uuid>/output/<output_id:uuid>")
async def get_output(request, project_id: UUID, output_id: UUID):
    input = request.json if request.json is not None else {}

    project = Project.get_or_none(id = project_id)

    if project is None:
        return json({
            "error" : "not-found",
            "error-details" : {
                "kind" : "project"
            }
        }, status=404)

    output = Output.get_or_none(id = output_id)

    if output is None:
        return json({
            "error" : "not-found",
            "error-details" : {
                "kind" : "output"
            }
        }, status=404)
    

    return json({
        "output" : model_to_dict(output, recurse=True, backrefs=True)
    })

# Setting output favorite status
@outputs.patch("/projects/<project_id:uuid>/output/<output_id:uuid>/favorite")
async def set_favorite(request, project_id : UUID, output_id : UUID):
    input = request.json if request.json is not None else {}

    project = Project.get_or_none(id = project_id)

    if project is None:
        return json({
            "error" : "not-found",
            "error-details" : {
                "kind" : "project"
            }
        }, status=404)

    output = Output.get_or_none(id = output_id)

    if output is None:
        return json({
            "error" : "not-found",
            "error-details" : {
                "kind" : "output"
            }
        }, status=404)
    
    output.isFavorite = input["is_favorite"] if "is_favorite" in input else False
    output.save()

    return json({
        "output" : model_to_dict(output, recurse=True, backrefs=True)
    })

# Adding output (starting generation)
@outputs.post("/projects/<project_id:uuid>/prompts/<prompt_id:uuid>/generate")
async def add_output(request, project_id: UUID, prompt_id: UUID):
    input = request.json if request.json is not None else {}

    project = Project.get_or_none(id = project_id)

    if project is None:
        return json({
            "error" : "not-found",
            "error-details" : {
                "kind" : "project"
            }
        }, status=404)

    prompt = Prompt.get_or_none(id = prompt_id)

    if prompt is None:
        return json({
            "error" : "not-found",
            "error-details" : {
                "kind" : "prompt"
            }
        }, status=404)

    # Getting default values
    settings = input["settings"] if "settings" in input else {}

    size = settings["batch"] if "batch" in settings else 1

    # Callback to update outputs
    def update_outputs_progress(task : ImageGeneratorTask, progress : float, seed : int):
        for taskOutput in task.outputs:
            output = Output.get_or_none(id = taskOutput.id)

            if output is None:
                continue

            output.seed = seed
            output.progress = progress
            output.save()

    # Scheduling generator task to the backend generator
    task = ImageGeneratorTask(
        prompt=prompt.value,
        outputs=[],
        settings=ImageGeneratorTaskSettings.from_dict(settings),
        callback=update_outputs_progress,
    )

    # Getting parent if present
    parent = None 
    
    if "parent_id" in input:
        parent_id = input["parent_id"]
        parent = Output.get_or_none(id = parent_id)
        task.settings.initial_url = Context.instance().url_for_output(parent.url)

    # Adding outputs according to the supplied size
    for i in range(size):
        id = uuid4()
        relative_url = os.path.join(str(prompt.id), str(id) + ".jpg")
        absolute_url = Context.instance().url_for_output(relative_url)

        # Ensuring the output directory exists
        os.makedirs(os.path.dirname(absolute_url), exist_ok=True)

        # Saving output details in the database first
        output = Output(
            id=id,
            prompt=prompt,
            parent=parent,
            type=task.settings.type,
            url=relative_url,
            settings=settings
        )

        output.save(force_insert=True)

        task.outputs.append(ImageGeneratorOutput(
            id=id,
            url=absolute_url
        ))

    Context.instance().generator.add_task(task)

    return json({
        "prompt" : model_to_dict(prompt, recurse=False)
    })

