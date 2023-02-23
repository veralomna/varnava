import asyncio
import sys
from time import sleep
from .json import custom_dumps

class Channel(object):

    def __init__(self):
        # All messages to be sent with a channel
        self.ws = None

    def send(self, name, payload):
        if self.ws is None:
            return

        message = custom_dumps({
            "name" : name,
            "payload" : payload
        })

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError: 
            loop = None

        if loop and loop.is_running():
            loop.create_task(self.ws.send(message))
        else:
            asyncio.run(self.ws.send(message))
        

    async def broadcast(self, ws):
        self.ws = ws

        while True:
            await asyncio.sleep(1)

            

            