from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles

from .auth import AuthMiddleware, challenge
from .api import display_name, post
from .ui import index


app = Starlette(
    routes=[
        Route("/", index),
        Route("/api/challenge", challenge, methods=["POST"]),
        Mount(
            "/api",
            routes=[
                Route("/display_name", display_name, methods=["POST"]),
                Route("/post", post, methods=["POST"]),
            ],
            middleware=[Middleware(AuthMiddleware)],
        ),
        Mount("/scripts", app=StaticFiles(directory="js/bundled"), name="scripts"),
    ],
)
