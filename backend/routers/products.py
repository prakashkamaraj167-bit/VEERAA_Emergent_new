from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import require_admin
from lib.db import db
from models.schemas import Product, ProductInput

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[Product])
async def list_products(category: Optional[str] = None, metal: Optional[str] = None, q: Optional[str] = None):
    query: dict = {}
    if category and category != "all":
        query["category"] = category
    if metal and metal != "all":
        query["metal"] = metal
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    docs = await db.products.find(query).sort("created_at", -1).to_list(500)
    return [Product(**d) for d in docs]


@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**doc)


@router.post("", response_model=Product)
async def create_product(payload: ProductInput, _admin: dict = Depends(require_admin)):
    product = Product(**payload.model_dump())
    await db.products.insert_one(product.model_dump())
    return product


@router.put("/{product_id}", response_model=Product)
async def update_product(product_id: str, payload: ProductInput, _admin: dict = Depends(require_admin)):
    doc = await db.products.find_one({"id": product_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.products.update_one({"id": product_id}, {"$set": payload.model_dump()})
    doc.update(payload.model_dump())
    return Product(**doc)


@router.delete("/{product_id}")
async def delete_product(product_id: str, _admin: dict = Depends(require_admin)):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}
