# SHELL: Get comfortable. We've got it.

A managed personal life-assistant for Indian apartment societies, launching inside one society in Delhi.
One message in Hindi, English or Hinglish becomes a plan, verified helpers, and one result: "ghar ready".
We don't help you find people. We take responsibility for getting it done.

Stack: Next.js 16 (App Router) + TypeScript strict + Tailwind 4 + PostgreSQL via Drizzle ORM. No component library: the
paper-and-shell design system (receipts, stamps, passport pages, sticky notes) is hand-built in `globals.css` and `src/components`.

## Run it

```bash
npm install
cp .env.example .env            # DATABASE_URL and APP_SECRET are the only required values
npx drizzle-kit push --force    # create tables
npm run dev                     # http://localhost:3000
```

The first request against an empty database seeds the demo society (`src/db/seed.ts`):
Green Meadows (6 towers, 2 gates), 12 helpers (10 active, 2 applicants), 20 task templates in 16 categories,
7 packs, 3 guides, a live "Guests Aa Rahe Hain" plan with jobs in motion, a Circle at 4 of 6 flats, a dispute, an SOS drill,
fraud alerts, and 145 demo waitlist rows (flagged `demo`; set `SHOW_DEMO_DATA=false` to hide them from public counters).
You can also run `npx tsx src/db/seed.ts` against an empty database.

### Demo logins (OTP is always `123456` in mock mode)

| Who | Phone | Lands on |
| --- | --- | --- |
| Customer (Ananya) | 9999900001 | `/app` |
| Ops lead | 9999900002 | `/ops` (log in at `/app/login`) |
| Society partner | 9999900003 | `/society` |
| Super admin | 9999900004 | `/ops` |
| Helper (Rahul, Pro) | 9100000001 | `/earn/portal` (log in at `/earn/login`) |

## Tests

```bash
npx vitest run                                              # 31 unit + integration tests
E2E_BASE_URL=http://localhost:3000 npx playwright test      # API-level critical flow against a running app
```

Unit tests cover the pricing engine (every formula branch), Circle curve, keyword demo engine, leakage scanner (digits,
spelled-out English/Hinglish, Devanagari numerals, UPI, handles), ETA, ledger balancing, state machine guards, dispatch scoring,
notification catalogue and quiet hours, signature verification and door OTPs. The e2e covers: waitlist signup with OTP, then request,
plan, idempotent checkout with signature check, geofenced check-in with door OTP, checklist, approval, review, and the chat scanner.

## Where things are

```
src/app/(site)        public website (SSR, sitemap, JSON-LD, hreflang, OG images at /api/og)
src/app/app           customer PWA (login, onboarding, composer, plan review, tracker, circle, wallet, ...)
src/app/earn          Shell Earn: public pages in (site)/earn, helper portal in /earn/portal
src/app/ops           Ops Cockpit (Cmd+K, g+key hotkeys, plan builder, dispatch, finance, pricing, audit)
src/app/society       society partner portal
src/app/api           REST routes, zod-validated, rate limited, CSRF checked, consistent error shape (en + hi)
src/lib               pricing, keywords, leakage, eta, ledger, statemachine, geo/hex, dispatch, plan-engine, notify, money
src/db                schema.ts (Drizzle), seed.ts, seed-data.ts
```

## Signature features

Shell Receipt (components/ui.tsx, ink stamps, scalloped edge), Readiness Ring, Tell Shell composer (text, voice via the browser's
speech recognition in hi-IN, photo with drawn circles), Home Atlas, Shell Pulse map (brand SVG), Shell Circle with a discount curve,
Skill Passport (page-flip, QR, printable resume), Meet Your Helper card, Guardian (door OTP, gate pass, geofence, SOS with cancel
countdown, silent SOS, shake to SOS), Time Machine slider, Shell Wrapped, Rush opt-in, Expense Wallet with itemised approval and
auto refund, Shell Notes, neighbour karma, Ops Cockpit, 404 "Ghar mein koi nahi hai", and a Konami-code easter egg.

## Environment variables

See `.env.example`. Everything external sits behind an interface with a working mock:

| Concern | Interface | Mock default | Live switch |
| --- | --- | --- | --- |
| OTP | `OtpProvider` (lib/auth.ts) | fixed `123456` | `OTP_PROVIDER=msg91`, `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID` |
| Payments | `PaymentProvider` (lib/money.ts) | HMAC-signed mock orders | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| WhatsApp / push | `ChannelProvider` (lib/notify.ts) | logs + in-app rows | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` |
| Plan drafting | `PlanLLM` (lib/plan-engine.ts) | offline keyword planner | `PLAN_LLM_PROVIDER` |
| Maps | PulseMap props (components/maps.tsx) | brand SVG map | `MAP_PROVIDER=maplibre` |
| KYC, telephony masking, speech-to-text | provider hooks | consent flag / info dialog / browser STT | `KYC_PROVIDER`, `TELEPHONY_PROVIDER`, `STT_PROVIDER` |

## Deploy

Vercel plus managed Postgres, or Docker on a VPS:

```bash
docker build -t shell . && docker run -p 3000:3000 --env-file .env shell
```

The container pushes the schema and starts the server. Set `NEXT_PUBLIC_SITE_URL`, `APP_SECRET`, and `DATABASE_URL`.
Put the Razorpay webhook at `/api/webhooks/razorpay`. `/api/health` is the health check. CI is in `.github/workflows/ci.yml`.

## Honest status

See `ASSUMPTIONS.md` for what is real, what is mocked, and what is not built yet.
