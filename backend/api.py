import base64

from starlette.requests import Request
from starlette.responses import Response
from sqlalchemy import insert

from .database import db, user_table


async def display_name(request: Request) -> Response:
    body = await request.json()

    pub_key_base64 = body["k"]
    pub_key_bytes = base64.b64decode(pub_key_base64)

    name = body["name"]

    async with db().begin() as conn:
        await conn.execute(insert(user_table()).values(key=pub_key_bytes, name=name))

    return Response()


async def post(request: Request) -> Response:
    body = await request.json()
    print(body["content"])
    return Response()
