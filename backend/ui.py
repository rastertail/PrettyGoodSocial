from functools import lru_cache

from starlette.templating import Jinja2Templates
from starlette.requests import Request


@lru_cache
def templates() -> Jinja2Templates:
    return Jinja2Templates(directory="html")


async def index(request: Request):
    return templates().TemplateResponse(request, "index.html")
