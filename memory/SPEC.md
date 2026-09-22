# Veeraa — spec

Boutique jewellery store (gold plated + 925 silver): earrings, chains, rings, bracelets.

## Stack
FastAPI (`/api` router) + MongoDB (motor) / Vite + React 19 + TS + Tailwind v4 + shadcn.
Fonts: Outfit Variable (headings, Century Gothic stand-in) + Plus Jakarta Sans. Warm gold on ivory.

## Data model (backend/models/schemas.py ↔ frontend/src/lib/types.ts)
- User: id, name, email, role (customer|admin), created_at (+ password_hash, not exposed)
- Product: id, name, category, metal (gold|silver), price, image_url, description,
  sweat_proof, daily_wear, anti_tarnish, stock, is_new, created_at
- Order: id, order_number (VRA…), user_id/email/name, items[], shipping, total,
  status (placed|shipped|delivered|cancelled), payment_status (pending|paid), payment_method
- Feedback: id, name, email, rating 1-5, message, created_at

## Endpoints (all under /api)
auth: POST /auth/signup, /auth/login, /auth/logout; GET /auth/me (httpOnly cookie session)
products: GET /products?category=&metal=&q=, GET /products/{id}; POST/PUT/DELETE (admin)
orders: POST /orders (auth), POST /orders/{id}/pay (simulated Razorpay), GET /orders/mine,
GET /orders (admin), PATCH /orders/{id}/status (admin), GET /track/{order_number} (public)
payments: GET /payments/config → demo_mode true until RAZORPAY_KEY_ID is set in backend/.env
feedback: POST /feedback (public), GET /feedback (admin)

## Flows
Home (hero, promise strip, categories, Just Arrived, track/exchange tabs, feedback box) →
Shop (category/metal filters) → Product detail (sweat proof / daily wear / anti-tarnish +
WhatsApp enquiry) → Cart → Checkout (sign-in required, demo Razorpay payment) → order number →
My Orders. Admin: product CRUD, purchase history with status control, all feedback.

## Seed (backend/seed.py, idempotent for users, resets products)
8 products (2 per category, gold + silver). Accounts in memory/test_credentials.md.

## Known deviations
- Razorpay is in DEMO mode (no keys yet); POST /orders/{id}/pay marks the order paid.
- Google sign-in not implemented (email/password only), agreed with the user.
- WhatsApp number is a placeholder (`WHATSAPP_NUMBER` in frontend/src/lib/types.ts).
