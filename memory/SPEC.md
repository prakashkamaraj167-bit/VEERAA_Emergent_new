# Veeraa — spec

Boutique jewellery store (gold plated + 925 silver): earrings, chains, rings, bracelets.

## Stack
FastAPI (`/api` router) + MongoDB (motor) / Vite + React 19 + TS + Tailwind v4 + shadcn.
Fonts: Outfit Variable (headings, Century Gothic stand-in) + Plus Jakarta Sans. Warm gold on ivory.

## Data model (backend/models/schemas.py ↔ frontend/src/lib/types.ts)
- User: id, name, email, role (customer|admin), created_at (+ password_hash, not exposed)
- Product: id, name, category, metal (gold|silver), price, image_url (primary), images[] (gallery),
  description, sweat_proof, daily_wear, anti_tarnish, stock, is_new, created_at
- Order: id, order_number (VRA…), user_id/email/name, items[], shipping, total,
  status (placed|shipped|delivered|cancelled), payment_status (pending|paid), payment_method
- Feedback: id, name, email, rating 1-5, message, created_at

## Endpoints (all under /api)
auth: POST /auth/signup, /auth/login, /auth/logout; GET /auth/me (httpOnly cookie session).
GET /auth/users (admin), PATCH /auth/users/{id}/role (admin — promote/demote; blocks
self-demote and removing the last admin), DELETE /auth/users/{id} (admin — blocks self-delete
and removing the last admin; also clears that user's sessions). Signup always creates role=customer.
password reset: POST /auth/forgot {email} (always returns ok, emails a 1h magic link if the
account exists), POST /auth/reset {token,password} (single-use token, clears sessions).
Reset link = {APP_URL}/reset-password?token=... . Pages: /forgot-password, /reset-password.
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
- WhatsApp number: 919994034267 (`WHATSAPP_NUMBER` in frontend/src/lib/types.ts).

## Later additions
- Admin image uploads: POST /api/uploads (admin, multipart), served from GET /api/uploads/{file}.
  Stored under backend/uploads/. Product primary image_url + additional images[] gallery.
- Product detail has a swipeable Gallery (frontend/src/components/Gallery.tsx).
- Back button on every page except home (frontend/src/components/BackButton.tsx).
- Order confirmation email: Emergent-managed Resend (lib/email_service.py), sent best-effort
  from pay_order. EMAIL_FROM_NAME=Veeraa. NOTE: the seeded demo customer email
  (customer@veeraa.com) is non-deliverable test data → provider returns 422 (logged, checkout
  unaffected). Real customer signups with real emails receive the confirmation.
