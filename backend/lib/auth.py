"""Password hashing + httpOnly cookie sessions (stdlib only)."""
import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, Request, Response

from lib.db import db

COOKIE_NAME = "veeraa_session"
SESSION_DAYS = 30


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, digest = stored.split("$", 1)
    except ValueError:
        return False
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return secrets.compare_digest(check, digest)


async def create_session(response: Response, user_id: str) -> None:
    token = secrets.token_urlsafe(32)
    await db.sessions.insert_one(
        {
            "token": token,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS),
        }
    )
    response.set_cookie(
        COOKIE_NAME,
        token,
        httponly=True,
        samesite="lax",
        secure=True,
        max_age=SESSION_DAYS * 24 * 3600,
        path="/",
    )


async def destroy_session(request: Request, response: Response) -> None:
    token = request.cookies.get(COOKIE_NAME)
    if token:
        await db.sessions.delete_many({"token": token})
    response.delete_cookie(COOKIE_NAME, path="/")


async def current_user(request: Request) -> Optional[dict]:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    sess = await db.sessions.find_one({"token": token})
    if not sess:
        return None
    exp = sess.get("expires_at")
    if exp and exp.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        await db.sessions.delete_many({"token": token})
        return None
    return await db.users.find_one({"id": sess["user_id"]})


async def require_user(request: Request) -> dict:
    user = await current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not signed in")
    return user


async def require_admin(request: Request) -> dict:
    user = await require_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


_ = os
