from starlette.requests import Request
from starlette.responses import JSONResponse


async def post(request: Request) -> JSONResponse:
    return JSONResponse({"status": "ok"})
