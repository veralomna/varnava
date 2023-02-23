import json
from json import dumps
from uuid import UUID
import sanic
import datetime

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, UUID):
            return str(o) 
        elif isinstance(o, datetime.date):
            return o.isoformat()
        
        return json.JSONEncoder.default(self, o)

def custom_dumps(o):
    return dumps(o, cls=CustomJSONEncoder)

def json(dict):
    return sanic.response.json(dict, dumps=custom_dumps)