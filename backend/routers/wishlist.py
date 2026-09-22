from typing import List

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import require_user
from lib.db import db
from models.schemas import Product

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=List[Product])
async def my_wishlist(user: dict = Depends(require_user)):
    rows = await db.wishlists.find({"user_id": user["id"]}).sort("created_at", -1).to_list(500)
    ids = [r["product_id"] for r in rows]
    if not ids:
        return []
    docs = await db.products.find({"id": {"$in": ids}}).to_list(500)
    by_id = {d["id"]: d for d in docs}
    return [Product(**by_id[i]) for i in ids if i in by_id]


@router.post("/{product_id}", response_model=Product)
async def add_to_wishlist(product_id: str, user: dict = Depends(require_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    from lib.dates import today_iso

    await db.wishlists.update_one(
        {"user_id": user["id"], "product_id": product_id},
        {"$setOnInsert": {"created_at": today_iso()}},
        upsert=True,
    )
    return Product(**product)


@router.delete("/{product_id}")
async def remove_from_wishlist(product_id: str, user: dict = Depends(require_user)):
    await db.wishlists.delete_one({"user_id": user["id"], "product_id": product_id})
    return {"ok": True}
