import os
import random
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request

from lib.auth import current_user, require_admin, require_user
from lib.db import db
from lib.email_service import send_order_confirmation
from models.schemas import Order, OrderInput, StatusInput

router = APIRouter(tags=["orders"])

VALID_STATUS = ["placed", "shipped", "delivered", "cancelled"]


def _order_number() -> str:
    return "VRA" + datetime.now(timezone.utc).strftime("%y%m%d") + str(random.randint(1000, 9999))


@router.post("/orders", response_model=Order)
async def create_order(payload: OrderInput, request: Request):
    user = await current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Please sign in to place an order")
    total = round(sum(i.price * i.qty for i in payload.items), 2)
    order = Order(
        order_number=_order_number(),
        user_id=user["id"],
        user_email=user["email"],
        user_name=user.get("name", ""),
        items=payload.items,
        shipping=payload.shipping,
        total=total,
    )
    await db.orders.insert_one(order.model_dump())
    return order


@router.post("/orders/{order_id}/pay", response_model=Order)
async def pay_order(order_id: str, user: dict = Depends(require_user)):
    doc = await db.orders.find_one({"id": order_id, "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    await db.orders.update_one({"id": order_id}, {"$set": {"payment_status": "paid"}})
    doc["payment_status"] = "paid"
    await send_order_confirmation(doc)
    return Order(**doc)


@router.get("/orders/mine", response_model=List[Order])
async def my_orders(user: dict = Depends(require_user)):
    docs = await db.orders.find({"user_id": user["id"]}).sort("created_at", -1).to_list(300)
    return [Order(**d) for d in docs]


@router.get("/orders", response_model=List[Order])
async def all_orders(_admin: dict = Depends(require_admin)):
    docs = await db.orders.find().sort("created_at", -1).to_list(500)
    return [Order(**d) for d in docs]


@router.patch("/orders/{order_id}/status", response_model=Order)
async def set_status(order_id: str, payload: StatusInput, _admin: dict = Depends(require_admin)):
    if payload.status not in VALID_STATUS:
        raise HTTPException(status_code=422, detail="Invalid status")
    doc = await db.orders.find_one({"id": order_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    await db.orders.update_one({"id": order_id}, {"$set": {"status": payload.status}})
    doc["status"] = payload.status
    return Order(**doc)


@router.get("/track/{order_number}", response_model=Order)
async def track(order_number: str):
    doc = await db.orders.find_one({"order_number": order_number.strip().upper()})
    if not doc:
        raise HTTPException(status_code=404, detail="No order found with that number")
    return Order(**doc)


@router.get("/payments/config")
async def payment_config():
    key = os.environ.get("RAZORPAY_KEY_ID", "")
    return {"provider": "razorpay", "demo_mode": key == "", "key_id": key}
