from sanic import Blueprint
from sanic.response import json
from uuid import UUID
from peewee import fn, JOIN
from playhouse.shortcuts import model_to_dict
from context import Project, Prompt, Output

projects = Blueprint("projects")

# Listing all projects in the database
@projects.route("/projects")
async def list_all_projects(request):
    projects = list(
        Project
            .select(
                Project,
                fn.Count(Prompt.id).alias("promptsCount"),
                fn.Count(Output.id).alias("outputsCount")
            )
            .where(Project.isArchived == False)
            .join(Prompt, JOIN.LEFT_OUTER)
            .join(Output, JOIN.LEFT_OUTER)
            .group_by(Project)
            .order_by(Project.createdAt.desc())
            .dicts()
    )

    return json({
        "projects": projects
    })

# Adding a project
@projects.post("/projects/add")
async def add_project(request):
    if request.json is None or "title" not in request.json:
        return json({
            "error" : "missing-field"
        }, status=500)

    project = Project(
        title=request.json["title"]
    )

    project.save(force_insert=True)

    return json({
        "project" : model_to_dict(project)
    })

project = Blueprint("project")

# Editing project
@project.patch("/projects/<project_id:uuid>")
async def update_project(request, project_id: UUID):
    project = Project.get_or_none(id = project_id)

    if project is None:
        return json({
            "error" : "not-found"
        }, status=404)

    if request.json is None or "title" not in request.json:
        return json({
            "error" : "missing-field"
        }, status=500)

    project.title = request.json["title"]
    project.save()

    return json({
        "project" : model_to_dict(project)
    })

# Deleting project
@project.delete("/projects/<project_id:uuid>")
async def archive_project(request, project_id: UUID):
    project = Project.get_or_none(id = project_id)

    if project is None:
        return json({
            "error" : "not-found"
        }, status=404)

    project.isArchived = True
    project.save()

    return json({
        "error" : "none"
    })