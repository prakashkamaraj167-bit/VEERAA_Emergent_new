from fastapi import APIRouter, HTTPException, Request, Response

from lib.auth import create_session, destroy_session, current_user, hash_password, verify_password
from lib.db import db
from models.schemas import LoginInput, SignupInput, User

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
