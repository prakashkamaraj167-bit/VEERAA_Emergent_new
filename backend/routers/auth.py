import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from lib.auth import (
    create_session,
    destroy_session,
    current_user,
    hash_password,
    require_admin,
    verify_password,
)
from lib.db import db
from lib.email_service import send_password_reset
from models.schemas import ForgotInput, LoginInput, ResetInput, RoleInput, SignupInput, User

router = APIRouter(prefix="/auth", tags=["auth"])

APP_URL = os.environ.get("APP_URL", "").rstrip("/")
RESET_TTL_HOURS = 1


@router.post("/signup", response_model=User)
async def signup(payload: SignupInput, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user = User(name=payload.name, email=email, role="customer")
    doc = user.model_dump()
    doc["password_hash"] = hash_password(payload.password)
    await db.users.insert_one(doc)
    await create_session(response, user.id)
    return user


@router.post("/login", response_model=User)
async def login(payload: LoginInput, response: Response):
    doc = await db.users.find_one({"email": payload.email.lower()})
    if not doc or not verify_password(payload.password, doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await create_session(response, doc["id"])
    return User(**doc)


@router.post("/logout")
async def logout(request: Request, response: Response):
    await destroy_session(request, response)
    return {"ok": True}


@router.get("/me", response_model=User)
async def me(request: Request):
    user = await current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not signed in")
    return User(**user)


@router.get("/users", response_model=list[User])
async def list_users(_admin: dict = Depends(require_admin)):
    docs = await db.users.find().sort("created_at", -1).to_list(1000)
    return [User(**d) for d in docs]


@router.patch("/users/{user_id}/role", response_model=User)
async def set_role(user_id: str, payload: RoleInput, admin: dict = Depends(require_admin)):
    if payload.role not in ("customer", "admin"):
        raise HTTPException(status_code=422, detail="Role must be 'customer' or 'admin'")
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if user_id == admin["id"] and payload.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot change your own admin role")
    if target["role"] == "admin" and payload.role == "customer":
        admin_count = await db.users.count_documents({"role": "admin"})
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="At least one admin must remain")
    await db.users.update_one({"id": user_id}, {"$set": {"role": payload.role}})
    target["role"] = payload.role
    return User(**target)


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target["role"] == "admin":
        admin_count = await db.users.count_documents({"role": "admin"})
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="At least one admin must remain")
    await db.users.delete_one({"id": user_id})
    await db.sessions.delete_many({"user_id": user_id})
    return {"ok": True}


@router.post("/forgot")
async def forgot_password(payload: ForgotInput):
    # Always return ok — never reveal whether an email is registered.
    user = await db.users.find_one({"email": payload.email.lower()})
    if user and APP_URL:
        token = secrets.token_urlsafe(32)
        await db.password_resets.insert_one(
            {
                "token": token,
                "user_id": user["id"],
                "expires_at": datetime.now(timezone.utc) + timedelta(hours=RESET_TTL_HOURS),
                "used": False,
            }
        )
        await send_password_reset(user, f"{APP_URL}/reset-password?token={token}")
    return {"ok": True}


@router.post("/reset")
async def reset_password(payload: ResetInput):
    rec = await db.password_resets.find_one({"token": payload.token})
    if not rec or rec.get("used"):
        raise HTTPException(status_code=400, detail="This reset link is invalid or already used")
    exp = rec["expires_at"]
    if exp.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This reset link has expired")
    await db.users.update_one(
        {"id": rec["user_id"]}, {"$set": {"password_hash": hash_password(payload.password)}}
    )
    await db.password_resets.update_one({"token": payload.token}, {"$set": {"used": True}})
    await db.sessions.delete_many({"user_id": rec["user_id"]})  # force re-login everywhere
    return {"ok": True}
