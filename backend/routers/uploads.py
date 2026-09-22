import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from lib.auth import require_admin

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_BYTES = 5 * 1024 * 1024


@router.post("")
async def upload_image(file: UploadFile = File(...), _admin: dict = Depends(require_admin)):
    if file.content_type not in ALLOWED:
        raise HTTPException(status_code=422, detail="Only JPG, PNG or WEBP images are allowed")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=422, detail="Image must be under 5 MB")
    name = f"{uuid.uuid4()}{ALLOWED[file.content_type]}"
    (UPLOAD_DIR / name).write_bytes(data)
    return {"url": f"/api/uploads/{name}"}


@router.get("/{filename}")
async def serve_image(filename: str):
    path = UPLOAD_DIR / os.path.basename(filename)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path)
