from typing import Any
from json import JSONEncoder
from uuid import UUID
import datetime

# Setting up JSON encoder to work with DB
def replace_json_encoder():
    original_encoder = JSONEncoder.default

    def encoder(self : JSONEncoder, o : Any) -> Any:
        if isinstance(o, UUID):
            return str(o) 
        elif isinstance(o, datetime.date):
            return o.isoformat()

        return original_encoder(self, o)

    JSONEncoder.default = encoder
    
replace_json_encoder()