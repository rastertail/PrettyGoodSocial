import asyncio
import base64
from functools import lru_cache
from typing import Dict
import secrets

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import PlainTextResponse


@lru_cache
def store() -> Dict[bytes, bytes]:
    return {}


async def expire(transaction_id: bytes, timeout: float = 120):
    await asyncio.sleep(timeout)
    store().pop(transaction_id, None)


async def challenge(request: Request) -> PlainTextResponse:
    transaction_base64 = await request.body()
    transaction_id = base64.b64decode(transaction_base64)
    if transaction_id in store():
        return PlainTextResponse("Transaction ID already in use", status_code=400)
    if len(transaction_id) != 16:
        return PlainTextResponse("Invalid transaction ID", status_code=400)

    challenge = secrets.token_bytes(16)
    store()[transaction_id] = challenge
    asyncio.create_task(expire(transaction_id))

    return PlainTextResponse(base64.b64encode(challenge))


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        signature_base64 = request.headers.get("X-Signature")
        if signature_base64 is None:
            return PlainTextResponse("Missing signature", status_code=400)
        signature = base64.b64decode(signature_base64)

        body = await request.json()

        transaction_base64 = body["t"]
        transaction = base64.b64decode(transaction_base64)
        expected_challenge = store().pop(transaction, None)
        if expected_challenge is None:
            return PlainTextResponse("Invalid transaction ID", status_code=400)

        challenge_base64 = body["c"]
        challenge = base64.b64decode(challenge_base64)
        if challenge != expected_challenge:
            return PlainTextResponse("Invalid challenge", status_code=400)

        pub_key_base64 = body["k"]
        pub_key_bytes = base64.b64decode(pub_key_base64)
        pub_key = Ed25519PublicKey.from_public_bytes(pub_key_bytes)

        try:
            pub_key.verify(signature, await request.body())
        except InvalidSignature:
            return PlainTextResponse("Invalid signature", status_code=400)

        return await call_next(request)
