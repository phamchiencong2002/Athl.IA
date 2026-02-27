import base64
import hashlib
import hmac
import json
import time
from typing import Literal, TypedDict

from app.core.config import settings


class TokenPayload(TypedDict):
    sub: str
    type: Literal["access", "refresh"]
    exp: int


def _to_base64_url(value: str) -> str:
    encoded = base64.urlsafe_b64encode(value.encode("utf-8")).decode("utf-8")
    return encoded.rstrip("=")


def _from_base64_url(value: str) -> str:
    padded = value + "=" * ((4 - len(value) % 4) % 4)
    return base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")


def _sign(part: str) -> str:
    digest = hmac.new(
        settings.token_secret.encode("utf-8"),
        part.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return base64.urlsafe_b64encode(digest).decode("utf-8").rstrip("=")


def create_token(subject: str, token_type: Literal["access", "refresh"], ttl_seconds: int) -> str:
    payload: TokenPayload = {
        "sub": subject,
        "type": token_type,
        "exp": int(time.time()) + ttl_seconds,
    }
    part = _to_base64_url(json.dumps(payload))
    return f"{part}.{_sign(part)}"


def create_token_pair(subject: str) -> dict[str, str]:
    return {
        "token": create_token(subject, "access", settings.access_ttl_seconds),
        "refreshToken": create_token(subject, "refresh", settings.refresh_ttl_seconds),
    }


def parse_token(token: str) -> TokenPayload | None:
    if "." not in token:
        return None
    part, signature = token.split(".", 1)
    expected = _sign(part)
    if not hmac.compare_digest(signature, expected):
        return None

    try:
        payload = json.loads(_from_base64_url(part))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None

    if not isinstance(payload, dict):
        return None

    sub = payload.get("sub")
    token_type = payload.get("type")
    exp = payload.get("exp")
    if not isinstance(sub, str) or token_type not in {"access", "refresh"} or not isinstance(exp, int):
        return None
    if exp <= int(time.time()):
        return None

    return {"sub": sub, "type": token_type, "exp": exp}
