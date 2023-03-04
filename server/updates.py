from sanic import Blueprint
from lib.json import json
from context import context

updates = Blueprint("updates")

# Listing all possible prompts settings
@updates.websocket("/updates")
async def send_updates(request, ws):
    await context.channel.broadcast(ws)