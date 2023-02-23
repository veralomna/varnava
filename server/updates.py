from sanic import Blueprint
from lib.json import json
from context import Context

updates = Blueprint("updates")

# Listing all possible prompts settings
@updates.websocket("/updates")
async def send_updates(request, ws):
    await Context.instance().channel.broadcast(ws)