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
from models.schemas import LoginInput, RoleInput, SignupInput, User

router = APIRouter(prefix="/auth", tags=["auth"])


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
