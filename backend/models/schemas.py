import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


def _uid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------- Users ----------
class User(BaseModel):
    id: str = Field(default_factory=_uid)
    name: str
    email: str
    role: str = "customer"
    created_at: datetime = Field(default_factory=_now)


class SignupInput(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


# ---------- Products ----------
class Product(BaseModel):
    id: str = Field(default_factory=_uid)
    name: str
    category: str  # earrings | chains | rings | bracelets
    metal: str  # gold | silver
    price: float
    image_url: str = ""
    description: str = ""
    sweat_proof: bool = True
    daily_wear: bool = True
    anti_tarnish: bool = True
    stock: int = 10
    is_new: bool = False
    created_at: datetime = Field(default_factory=_now)


class ProductInput(BaseModel):
    name: str = Field(min_length=1)
    category: str
    metal: str
    price: float = Field(gt=0)
    image_url: str = ""
    description: str = ""
    sweat_proof: bool = True
    daily_wear: bool = True
    anti_tarnish: bool = True
    stock: int = 10
    is_new: bool = False


# ---------- Orders ----------
class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    qty: int
    image_url: str = ""


class Shipping(BaseModel):
    full_name: str = Field(min_length=1)
    phone: str = Field(min_length=6)
    address: str = Field(min_length=3)
    city: str = Field(min_length=1)
    pincode: str = Field(min_length=3)


class OrderInput(BaseModel):
    items: List[OrderItem] = Field(min_length=1)
    shipping: Shipping


class Order(BaseModel):
    id: str = Field(default_factory=_uid)
    order_number: str
    user_id: Optional[str] = None
    user_email: str = ""
    user_name: str = ""
    items: List[OrderItem]
    shipping: Shipping
    total: float
    status: str = "placed"  # placed | shipped | delivered | cancelled
    payment_status: str = "pending"  # pending | paid
    payment_method: str = "razorpay_demo"
    created_at: datetime = Field(default_factory=_now)


class StatusInput(BaseModel):
    status: str


# ---------- Feedback ----------
class Feedback(BaseModel):
    id: str = Field(default_factory=_uid)
    name: str
    email: str = ""
    rating: int = 5
    message: str
    created_at: datetime = Field(default_factory=_now)


class FeedbackInput(BaseModel):
    name: str = Field(min_length=1)
    email: str = ""
    rating: int = Field(default=5, ge=1, le=5)
    message: str = Field(min_length=3)
