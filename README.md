# Shell

**Get comfortable. We've got it.** A managed personal assistant for apartment societies in India. A customer writes one message, Shell plans it, sends verified helpers and sees it through, with a completion guarantee.

This repo contains the whole product in one Next.js app:

| Area | URL | Who |
| --- | --- | --- |
| Public website (home, how it works, pricing estimator, packs, safety, Earn, societies, guides, help, legal, waitlist) | `/` | everyone |
| Customer app (PWA) | `/app` | customers |
| Helper app, Shell Earn (PWA) | `/helper` | helpers |
| Ops Cockpit | `/ops` | ops, super admin |
| Society partner portal | `/society` | RWA |
| Public Skill Passport | `/passport/[slug]` | anyone with the link |
| Family status link | `/track/[id]?t=…` | anyone with the link |

## Try it in 30 seconds

1. Open `/login` and use the **demo accounts** panel (Customer, Helper, Ops, Society partner), or sign in with any phone number and the demo OTP `123456`.
2. As the customer, type "Guests are coming tomorrow, need cleaning, groceries and decoration" and tap **Send to Shell**. Answer the chips, review the plan, tap **Approve and pay**.
3. Open an order and use the **Demo controls** to move the job along as the helper would (accept, on the way, check in with the door code, checklist, check out). Then approve the work and leave a review.
4. Switch to **Ops** to see the dispatch board, ledger, analytics, disputes and the audit log.

## Run locally

```bash
npm install
cp .env.example .env          # set DATABASE_URL
npx drizzle-kit push          # create tables
npx tsx scripts/seed.ts       # demo society, 10 helpers, 16 tasks, 7 packs, demo jobs (also auto-runs on /api/health)
npm run dev
```

Tests:

```bash
npx vitest run                # pricing, plan engine, leakage scanner, geo/ETA, ledger, levels (22 tests)
npx tsx scripts/e2e.ts        # request, plan, pay, track, complete, rate against a running server
```

## Environment variables

See `.env.example`. Only `DATABASE_URL` is required. Every external provider has a working mock when its key is missing: OTP (`123456`), Razorpay, WhatsApp, KYC, telephony, maps.

## What is real and what is mocked

Real: database schema, auth with httpOnly sessions, OTP lockout, rate limits, CSRF origin check, pricing engine with versioned config, plan engine, dispatch scoring, offers, the full task state machine, door OTP, escrow and double-entry ledger, wallet and credits, expense caps, Circles, chat with leakage scanner, disputes, strikes and appeals, SOS, location pings, audit log, feature flags, analytics from real tables.

Mocked behind interfaces: payment gateway, OTP/WhatsApp delivery, KYC and liveness, masked calling, receipt OCR, LLM plan drafting, map tiles. See `ASSUMPTIONS.md`.

## Going live checklist

- Set `human_review` and `geofence_enforced` on, and `demo_mode` off in Ops > Settings.
- Clear demo waitlist data. Replace placeholder phone numbers, grievance officer and legal text (lawyer review).
- Set `APP_SECRET`, `NEXT_PUBLIC_SITE_URL`, and your Razorpay, OTP and WhatsApp keys.
- Run `drizzle-kit push` (or generate migrations) against your managed Postgres. Deploy to Vercel or any Node host.
- Add a scheduled job to delete `location_pings` older than 30 days.

## Anti-bypass and trust

Masked contact, in-app chat only, a scanner that blurs phone numbers (including spelled-out and Devanagari digits), UPI IDs, emails and handles, strikes, and benefits that exist only inside Shell: Guarantee, damage cover, instant payouts, credits, Skill Passport.
