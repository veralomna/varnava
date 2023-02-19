import os
from sanic import Sanic
from sanic_ext import Extend

from context import Context

from resources import resources
from projects import projects, project
from prompts import prompts
from outputs import outputs
from files import files
from settings import settings
from updates import updates

app = Sanic("varnava-server")
app.config.CORS_ORIGINS = "*"

app.blueprint(resources)
app.blueprint(projects)
app.blueprint(project)
app.blueprint(prompts)
app.blueprint(outputs)
app.blueprint(files)
app.blueprint(settings)
app.blueprint(updates)

Extend(app)

def run():
    Context.instance()

    port = int(os.environ.get("VARNAVA_SERVER_PORT", 23804))

    app.run(
        port=port,
        debug=False,
        single_process=True,
        motd=False, 
    )

if __name__ == "__main__":
    run()