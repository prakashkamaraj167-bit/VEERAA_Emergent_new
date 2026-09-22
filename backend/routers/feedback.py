from typing import List

from fastapi import APIRouter, Depends

from lib.auth import require_admin
from lib.db import db
from models.schemas import Feedback, FeedbackInput

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=Feedback)
async def submit_feedback(payload: FeedbackInput):
    fb = Feedback(**payload.model_dump())
    await db.feedback.insert_one(fb.model_dump())
    return fb


@router.get("", response_model=List[Feedback])
async def list_feedback(_admin: dict = Depends(require_admin)):
    docs = await db.feedback.find().sort("created_at", -1).to_list(500)
    return [Feedback(**d) for d in docs]
