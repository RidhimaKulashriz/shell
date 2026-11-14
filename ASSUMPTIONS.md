# Assumptions and decisions (Phase 0)

Decided without asking, recorded here.

## Scope
- The brief's section 14 (phase list) was not included. I treated **Phase 0 = the public website + waitlist**: design system, all public pages, waitlist with OTP, referral queue, hex waitlist map, SEO, consent, analytics sink, catalog seeded from the database, pricing engine, anti-bypass scanner and tests.
- Customer app, helper portal, ops console and society portal (sections 17 to 19) are **not built yet**. Their engines that the website needs (pricing, keyword demo, leakage scanner, geo helpers) are built and tested.

## Stack deviations (the sandbox is fixed to Next.js 16 + Drizzle + PostgreSQL)
- **Drizzle instead of Prisma.** Money is integer paise, times UTC, UUID keys, audit log is append-only, as specified.
- **No PostGIS yet.** Geography is stored as lat/lng doubles plus **H3 hex ids (res 8 and 9)** on waitlist rows. A PostGIS migration is planned for Phase 1 when polygons and pings land.
- **No pnpm/Turborepo monorepo, Redis or BullMQ.** Rate limits are in-memory per instance. Phase 1 moves to Redis.
- **Framer Motion not used.** Motion is CSS + IntersectionObserver for bundle size on cheap Android; reduced-motion is respected.
- **Maps:** a `MapProvider` interface exists (`src/lib/geo.ts`). Phase 0 draws hex maps in SVG in the brand palette, so no tile key is needed. MapLibre + MapTiler can plug in later.
- **MDX not used.** Guides are typed content in `src/lib/content.ts`; a CMS comes with the ops console.
- **Fonts** load from Google Fonts via `<link>` (Fraunces with SOFT and WONK axes, Instrument Serif, DM Sans, DM Mono, Caveat, Noto Sans Devanagari).
- **Icons:** a custom 40-icon set in one wobbly line style (`src/components/Icon.tsx`).

## Behaviour
- **OTP is a mock provider by default.** `OTP_PROVIDER=mock` returns the code in the API response and shows it in the form as "Demo mode". Set `OTP_PROVIDER=msg91` and implement `sendOtp()` in `src/app/api/waitlist/otp/route.ts` for real WhatsApp/SMS.
- **One signup per number:** after OTP, an existing number gets its existing queue position back.
- **Queue position** = rank by `seq - 3 x verified referrals`. Each verified referral moves you up 3 places.
- **Map privacy:** counts below 3 per hex are shown as "few" (1) so nobody can be located.
- **Honest numbers:** counters show only above 10; otherwise a handwritten line. Helpers verified, jobs and rating are 0/null until Phase 1 tables exist.
- **Announcement strip** reads from the `announcements` table; `{count}` is replaced with the live waitlist count, or "Be one of the first" under 10.
- **Language toggle** switches chrome and key hero strings between English and Devanagari Hindi. Long-form content is Hinglish by design (brand voice). Full Hindi translation arrives with the CMS translation fields.
- **hreflang** points both `en` and `hi` to the same URL because language is a cookie, not a path.
- **Analytics:** a first-party sink at `/api/events`, active only after cookie consent. PostHog goes behind the same `track()` in Phase 1.
- **Legal pages** are templates marked DRAFT. Grievance officer name and address are placeholders.
- **Placeholders to replace:** contact email, WhatsApp number, safety line (env vars below), social links.
- **Demo data:** three fictional societies (Sunrise Heights is the pilot with 2 gates and Towers A to F), 16 categories, 7 packs. No fake waitlist rows, no fake testimonials.
- **Sample content** (Riya's passport, Rahul's helper card, receipts on the home page) is labelled as a sample.

## Not done in Phase 0 (needs real keys or later phases)
Razorpay, WhatsApp Business API, KYC, telephony masking, speech-to-text, S3 storage, SSE tracking, PostHog, Sentry, Playwright e2e, Lighthouse CI.
