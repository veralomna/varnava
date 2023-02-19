from typing import Any, Callable
from peewee import CharField, TextField
from uuid import uuid4
import json

class JSONField(TextField):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super(TextField, self).__init__(*args, **kwargs)

    def db_value(self, value: Any) -> Any:
        return json.dumps(value)

    def python_value(self, value: Any) -> Any:
        return json.loads(value)

class EnumField(CharField):
    """
    This class enables an Enum like field for Peewee
    """

    def __init__(self, choices: Callable, *args: Any, **kwargs: Any) -> None:
        super(CharField, self).__init__(*args, **kwargs)
        self.choices = choices
        self.max_length = 255

    def db_value(self, value: Any) -> Any:
        return value.value

    def python_value(self, value: Any) -> Any:
        return self.choices(type(list(self.choices)[0].value)(value))

def generate_uuid():
    return uuid4()