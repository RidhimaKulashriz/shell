# Shell: Get comfortable. We've got it.

Managed life-assistant for Indian apartment societies, starting in one Delhi society. This repo is **Phase 0: the public website and waitlist**. See `ASSUMPTIONS.md` for decisions and what is mocked.

## What is in Phase 0
- Home page with a hand-built composer demo (Hinglish keyword engine, Shell Receipt, Readiness Ring), pinned scroll story, Packs as ticket stubs, Guardian path, Skill Passport and earnings calculator, live waitlist hex map, FAQ, receipt-style waitlist form.
- How it works, Services, 16 task category pages and 7 pack pages (from the database), Pricing + estimator, Safety, Shell Earn, Societies (RWA), Offices, About, Careers, Contact, Press, Guides, Help centre, Legal (drafts), 404/500, status.
- Waitlist: OTP-verified WhatsApp number, referral queue, share card, rate limits.
- SEO: metadata, canonical, OG image per page (`/api/og`), JSON-LD, sitemap, robots, FAQ schema. Cookie consent, first-party analytics after consent, announcement strip, WhatsApp button, page transitions, Konami easter egg.

## Setup
```bash
npm install
cp .env.example .env        # or create .env, see below
npx drizzle-kit push        # creates tables
npm run dev                 # http://localhost:3000
npx vitest run              # unit tests
npm run build && npm start  # production
```
Catalog (categories, packs, demo societies, announcement) is seeded automatically on first request.

## Environment variables
| Var | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | Postgres connection | required |
| `NEXT_PUBLIC_SITE_URL` | canonical URLs, OG, sitemap | `http://localhost:3000` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | contact email | `hello@shell.in` (placeholder) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | wa.me number, digits only | placeholder |
| `NEXT_PUBLIC_WHATSAPP_DISPLAY` | display format | placeholder |
| `NEXT_PUBLIC_SAFETY_LINE` | 24x7 safety number | placeholder |
| `OTP_PROVIDER` | `mock` or `msg91` | `mock` (shows the code in the form) |
| `APP_SECRET` | salt for OTP and IP hashes | dev value, **set in production** |

## Layout
```
src/app         pages, API routes (waitlist, otp, map, stats, contact, events, og, announcement, health)
src/components  design system (ui, Icon, Receipt, Ring, Passport), home sections, forms
src/db          Drizzle schema (societies, towers, categories, packs, waitlist, otp, audit_log ...)
src/lib         pricing engine, keyword engine, leakage scanner, geo (H3), catalog seed, i18n, data layer
tests           Vitest unit tests
```

## Deploy
Vercel + managed Postgres, or Docker on a VPS: set the env vars, run `npx drizzle-kit push` once, then `npm run build && npm start`.

## Next
Phase 1: auth, customer app (composer, plan review, checkout), PostGIS, Redis/BullMQ, Ops Cockpit plan builder.
