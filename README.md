# SHELL: Get comfortable. We've got it.

Dwarka pilot — Sectors 6/10/12 · 2h slots 8am–8pm · 4 bookable services · Door OTP + pay-after-approval.

Real customer can: open on phone, login via phone OTP (30s resend), book (geo-fence Dwarka, 2h slots max 3/slot, server price), see orders with status chips, cancel only RECEIVED, pay UPI pending / Razorpay test webhook (idempotent), request rework within 24h. Helper: OTP login → /earn/portal → on the way → start with 4-digit door OTP (5 tries) → complete. Founder: /ops tabs all/RECEIVED/ASSIGNED/IN_PROGRESS/COMPLETED/CANCELLED, assign helper, status transitions, audit log, 403 for customers.

Stack: Next.js 16 App Router + TypeScript strict + Tailwind 4 + Drizzle + Neon Postgres. No second backend. Design green #0B2B26, Inter, outline icons, English only.

## Run it

```bash
npm install
cp .env.example .env            # DATABASE_URL and APP_SECRET required; ALLOWDEV_OTP=false never set in production
npx drizzle-kit push --force
npm run dev                     # http://localhost:3000
```

Seed creates societies, 12 helpers, 4 bookable services, promo codes, bookings slots. `SHOW_DEMO_DATA=false` hides demo waitlist.

### Logins (mock OTP 123456, ALLOW_DEV_OTP=true shows devCode)

| Who | Phone | Lands on |
|---|---|---|
| Customer | 9999900001 | `/app` → `/app/orders` |
| Ops | 9999900002 | `/ops` (login at `/app/login`) |
| Helper (Rahul) | 9100000001 | `/earn/portal` (login at `/earn/login`) |

## Tests

```bash
npm run typecheck        # tsc --noEmit
npx vitest run           # 5 suites — pricing, circle, leakage, slots, Dwarka, webhook idempotency
npm run build            # next build with security headers
npx playwright test      # API flow: waitlist → request → plan → checkout → OTP → rework
npm run validate         # typecheck + lint + vitest + build
```

## Where things are

```
src/app/(site)        public site (Home storefront, contact, legal, safety)
src/app/app/(main)    customer PWA (orders, requests, profile)
src/app/earn/portal   helper portal (jobs → on-the-way/OTP/complete)
src/app/ops           ops cockpit (bookings tabs, assign, status, audit, finance)
src/app/api           REST — zod, rateLimit 10/60s, CSRF, x-request-id, x-otp-failures
src/lib               dwarka, slots, mvp-catalog, sms (SMS_PROVIDER mock|msg91), payments (razorpay mock), lease
src/db                schema.ts (bookings + payments + reviews + audit), seed.ts
```

## Hardening (Step 10)

- **Rate limits:** `api()` wrapper + `limit: {key,max,windowMs}` on auth (20/10m), bookings (10/60s), pay (10/60s), contact (6/10m)
- **Zod:** every POST/PATCH validated (`BodySchema` bookings, pay method, rework, ops assign/status)
- **Headers:** `next.config.ts` → `X-Content-Type-Options nosniff`, `X-Frame-Options DENY`, `Referrer-Policy`, `Permissions-Policy`, `HSTS`, `CSP frame-ancestors none`
- **DPDP:** `DELETE /api/me` soft (7-day cooling, audit) + `DELETE /api/me/data {confirm:DELETE}` hard anonymize (deletes addresses, bookings address, notifications, audit `data_hard_delete`)
- **No fake data:** bookings/reviews/notify_requests honest empty; `ALLOW_DEV_OTP` gated
- **CI:** `.github/workflows/ci.yml` — postgres 16, `drizzle-kit push`, `next typegen`, `tsc`, `vitest`, `next build`, `playwright` against `wait-on /api/health`

## Env

See `.env.example` — all providers behind interfaces with mock defaults. Set `OTP_PROVIDER=msg91`, `RAZORPAY_*`, `SMS_PROVIDER=msg91` for live. Never commit `.env`.

## Vercel

`shell-frontend` project `main` is production. Push `main` → Vercel build. Required env: `DATABASE_URL`, `APP_SECRET`, `SESSION_COOKIE_SAMESITE=none` for HTTPS preview.

## Honest status

See `ASSUMPTIONS.md`. Legal pages are Draft v0.1 — require lawyer review.
