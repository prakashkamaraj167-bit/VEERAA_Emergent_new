import asyncio
from datetime import datetime, timedelta, timezone

from lib.auth import hash_password
from lib.db import db
from models.schemas import Product, User

IMG = {
    "earring_gold": "https://static.prod-images.emergentagent.com/jobs/c0d76ea6-ce25-4ebe-8c53-680e184e132e/images/77dce56680815c6255e823df74c302877ae7e40715880577d667f6e9afc6c39b.jpeg",
    "earring_silver": "https://static.prod-images.emergentagent.com/jobs/c0d76ea6-ce25-4ebe-8c53-680e184e132e/images/d4dade1158f49bad4477226b5f980a73290b3ebe069ab8e36ba21ac9cfca4206.jpeg",
    "chain_gold": "https://static.prod-images.emergentagent.com/jobs/c0d76ea6-ce25-4ebe-8c53-680e184e132e/images/713f6ff63d6ad4454c6818ab3274c52e82603f47638b308fe217ef287738a190.jpeg",
    "chain_silver": "https://static.prod-images.emergentagent.com/jobs/c0d76ea6-ce25-4ebe-8c53-680e184e132e/images/ea0e98202e4491cb84feffebbb85ef69fffef974f6de09a89e2882ec3b887f7c.jpeg",
    "ring_gold": "https://static.prod-images.emergentagent.com/jobs/c0d76ea6-ce25-4ebe-8c53-680e184e132e/images/0a805a0ab5d74534e9bfb6d7a82ce9f6a61978cef48b5b11957a634789615312.jpeg",
    "ring_silver": "https://static.prod-images.emergentagent.com/jobs/c0d76ea6-ce25-4ebe-8c53-680e184e132e/images/df27d08dd30dc45c8b6f54125da70d11625c79bdfd1d69bda721c8675235b319.jpeg",
    "bracelet_gold": "https://static.prod-images.emergentagent.com/jobs/c0d76ea6-ce25-4ebe-8c53-680e184e132e/images/a26110b60697423666f2ad530967a5c2a18afb967d03a382a91b8689cb9aa927.jpeg",
    "bracelet_silver": "https://static.prod-images.emergentagent.com/jobs/c0d76ea6-ce25-4ebe-8c53-680e184e132e/images/189ef64dccab614987bf916ba3045e2f5e59a21e3a33b6ed258faaf2d8fb2a42.jpeg",
}

PRODUCTS = [
    ("Aura Gold Hoops", "earrings", "gold", 899, "earring_gold", True,
     "Featherlight 18k gold plated hoops that sit close to the ear. Sweat proof and tarnish resistant, they stay bright through workdays, workouts and long evenings."),
    ("Mira Silver Drops", "earrings", "silver", 1299, "earring_silver", True,
     "925 sterling silver thread drops with a single bezel stone. Gentle on sensitive ears and light enough to forget you are wearing them."),
    ("Rope Gold Chain", "chains", "gold", 1599, "chain_gold", True,
     "A finely twisted rope chain in 18k gold plating. Layer it or wear it alone - the anti-tarnish finish keeps its warm glow through daily wear."),
    ("Luna Silver Box Chain", "chains", "silver", 1449, "chain_silver", False,
     "Crisp 925 silver box chain with a secure lobster clasp. Sweat proof and water resistant, made for everyday elegance."),
    ("Stack Gold Ring Set", "rings", "gold", 1099, "ring_gold", True,
     "A set of slim gold plated stacking bands with pave detail. Mix and match, or wear the full stack for a quiet statement."),
    ("Oxidised Silver Band", "rings", "silver", 799, "ring_silver", False,
     "Hand finished oxidised 925 silver band with a hammered texture. Rugged, unisex and built for daily wear."),
    ("Ciara Gold Bracelet", "bracelets", "gold", 1349, "bracelet_gold", True,
     "Chunky oval link bracelet in 18k gold plating with an adjustable clasp. Sweat proof, so it never leaves your wrist."),
    ("Serene Silver Cuff", "bracelets", "silver", 1699, "bracelet_silver", False,
     "A smooth, solid 925 silver open cuff. Slips on easily and holds its polish with the anti-tarnish coating."),
]


async def main() -> None:
    await db.products.delete_many({})
    now = datetime.now(timezone.utc)
    for i, (name, cat, metal, price, img, is_new, desc) in enumerate(PRODUCTS):
        p = Product(
            name=name, category=cat, metal=metal, price=float(price),
            image_url=IMG[img], description=desc, is_new=is_new,
            sweat_proof=True, daily_wear=True, anti_tarnish=True, stock=25,
            created_at=now - timedelta(minutes=i),
        )
        await db.products.insert_one(p.model_dump())

    for email, name, role, pwd in [
        ("admin@veeraa.com", "Veeraa Admin", "admin", "Admin@123"),
        ("customer@veeraa.com", "Priya Customer", "customer", "Customer@123"),
    ]:
        if not await db.users.find_one({"email": email}):
            u = User(name=name, email=email, role=role)
            doc = u.model_dump()
            doc["password_hash"] = hash_password(pwd)
            await db.users.insert_one(doc)

    print("seeded", await db.products.count_documents({}), "products")


if __name__ == "__main__":
    asyncio.run(main())
