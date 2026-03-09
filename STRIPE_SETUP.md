# Stripe Checkout (Redirect) Setup

Payments use **Stripe Checkout**: when the user clicks "Proceed to Pay", they are redirected to Stripe's hosted page to pay, then back to your success or cancel URL.

## Backend environment variables

In `triply-backend/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (e.g. `sk_test_...` for test mode). |
| `STRIPE_WEBHOOK_SECRET` | For production | Webhook signing secret (`whsec_...`). Required so the backend can confirm payments when the user completes checkout. |
| `FRONTEND_URL` | Yes | Base URL of the frontend (e.g. `http://localhost:3000`). Used for success and cancel URLs. |

If `STRIPE_SECRET_KEY` is missing, the "Proceed to Pay" API will return 503 (payment not configured).

## Webhook (recommended for production)

1. In [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks), add an endpoint:
   - **URL**: `https://your-api-domain.com/api/v1/payments/webhook`
   - **Events**: `checkout.session.completed`
2. Copy the **Signing secret** (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

### Local testing with Stripe CLI

```bash
stripe listen --forward-to localhost:5000/api/v1/payments/webhook
```

Use the printed `whsec_...` as `STRIPE_WEBHOOK_SECRET` in `.env`.

## Flow

1. User clicks **Proceed to Pay** on `/payment/[bookingId]` or activity payment page.
2. Frontend calls `POST /api/v1/payments/create-checkout-session` (or activity-booking variant) with `{ bookingId }`.
3. Backend creates a Stripe Checkout Session and returns `{ url }`.
4. Frontend redirects: `window.location.href = url`.
5. User pays on Stripe; Stripe redirects to your success or cancel URL.
6. Stripe sends `checkout.session.completed` to your webhook; backend updates booking (e.g. `deposit_paid`) and runs notifications.

## Abu Dhabi / UAE: AED only (no India or other currencies)

TRIPLY is an Abu Dhabi company. Checkout is configured to charge in **AED only** with English locale.

- The backend always creates Checkout Sessions in **AED** and sets `locale: 'en'`.
- If Stripe still shows a “Choose a currency” option (e.g. INR), that comes from **Adaptive Pricing** (currency conversion) in your Stripe account. To show only AED and avoid India/other currencies:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Settings** → **Payment methods** (or **Payments** → **Settings**).
2. Find **Adaptive Pricing** or **Currency conversion** / “Let customers pay in their local currency”.
3. **Turn it off** so that only the session currency (AED) is used and no conversion or alternate currencies (e.g. INR) are offered.

After that, customers will only see AED on the Stripe Checkout page, with no India/INR option.

## Frontend

No Stripe keys are required in the frontend for this redirect flow. The publishable key is only needed if you later add embedded Stripe Elements on your site.
