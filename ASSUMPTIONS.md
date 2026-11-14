# Assumptions, deviations and what is not built

Decided without asking, as the brief allows. Safer and simpler options were chosen.

## Deviations from the brief
- **Drizzle ORM instead of Prisma, plain Postgres instead of PostGIS, single Next.js app instead of a pnpm/Turborepo monorepo.**
  The managed environment provides Drizzle and Postgres without PostGIS. Points are stored as lat/lng doubles. `lib/geo.ts`
  implements haversine, point-in-polygon, an H3-style hex index (res 8 and 9, same cell sizes as H3) and a nearest-neighbour + 2-opt
  stop ordering. Swapping to PostGIS `geography` columns and real H3 is a schema change, not a rewrite.
- **No Redis/BullMQ.** Offer expiry, re-offer and no-show rules are evaluated on read and on action. A queue is the next step.
- **Map provider is a custom brand-palette SVG** (works offline, no tile key, fast on cheap Android). The `PulseMap` props are the MapProvider
  seam for MapLibre GL with MapTiler/Stadia tiles. Google Routes is not called: travel time is estimated from distance in `lib/geo.ts`.
- **Language:** English, Hindi and Hinglish are stored per user and in a cookie. Hindi strings cover the global shell, key headings, FAQs,
  notification catalogue and category intros; the rest of the interface is Hinglish by design. hreflang uses `?lang=` URLs.
- **Auth** is phone OTP with httpOnly session cookies (hashed in DB) and role checks in server components and API wrappers.
  Staff two-factor is not built. Only CUSTOMER and HELPER can self-register; staff accounts are seeded.
- **Photos** are compressed in the browser and stored as data URLs. Swap the `photos.url` writer for signed S3 uploads.
- **Receipt OCR** is manual line entry by the helper with an itemised approval flow. The OCR provider plugs in at `tasks/[id]/expense`.
- **PDF resume** is a print-optimised page (`/p/[slug]/resume`) with Save as PDF.
- **Plan engine** is an offline keyword planner behind the `PlanLLM` interface. Prices never come from it. Low confidence, banned words
  or zero matches set `needsHuman`, and every plan is reviewed by ops before the customer sees it.

## Mocked (works end to end, needs a key to go live)
OTP delivery, Razorpay orders and webhook (signature verification is real HMAC), WhatsApp/push sending, KYC (only a reference and verified
flag are stored, never an ID number), masked calling (UI shows an info dialog), speech-to-text (browser SpeechRecognition hi-IN),
penny-drop verification, GST invoice generation.

## Real
Pricing engine with versioned config in the database, double-entry ledger with balanced journals, state machines with guards, geofenced
check-in (150 m) + door OTP + 3-strike alert, adaptive location pings with spoof, drift and impossible-speed checks, anti-bypass scanner
with blur-and-warn and fraud alerts, escrow release after approval, Circle fill/confirm logic, idempotent checkout, signed idempotent webhook,
audit log (including staff access to location data), dispatch scoring with a plain-language "why we picked", rate limits, CSRF guard,
DPDP export and 7-day delete request, consent, privacy-safe waitlist hex map (hexes under 3 people hidden).

## Not built yet (honest list)
- Split payment with flatmates, Wallet top-up, GST invoice PDFs, CSV export buttons, Razorpay reconciliation against the live API
- Voice notes in chat, real-time translation (stored `translatedBody` is displayed when present), WebSocket channels (SSE is used for tracking)
- Shell Rush pricing flow and 90-minute countdown beyond the helper opt-in and the 1.5x multiplier
- Ghost Jobs lockbox OTP flow beyond the key-handling preference, receipt OCR, helper timetable image import
- Staff 2FA, saved views, drag-and-drop on the dispatch board (assignment uses a reason form), zone polygon drawing editor
- Location ping partitioning and the 30-day purge job (documented in the privacy policy, needs a cron)
- Offline-cached map tiles per tower (the SVG map needs none; entrance photos are placeholders)
- Playwright browser E2E (the critical flow is covered at API level), Lighthouse CI budgets, axe in CI
- Legal pages are templates marked as drafts and need lawyer review.
- Seeded demo waitlist rows are labelled `demo`. Counters on the site only show when above 10, and no number is invented.
