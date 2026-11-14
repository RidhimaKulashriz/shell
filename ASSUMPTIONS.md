# Assumptions and deliberate choices

The brief was very large. These are the decisions made so the product is usable and honest about what is real and what is mocked.

## Stack changes
- **Drizzle ORM instead of Prisma, and plain Postgres instead of PostGIS.** The runtime provides Drizzle and a Postgres without the PostGIS extension. Locations are stored as `lat/lng` doubles. Distances use haversine. "H3" hexes are replaced by a built-in hex grid (`src/lib/geo.ts`, resolutions 8 and 9) with the same purpose: privacy-safe heatmaps. Swap in `h3-js` and PostGIS geography columns when the extension is available.
- **Single Next.js app, not a pnpm/Turborepo monorepo.** Everything (site, customer app, helper app, ops, society portal, API) lives in one deployable app.
- **Polling instead of SSE/WebSockets.** Live pages refresh every 4 to 8 seconds. The API shape makes SSE a drop-in later.
- **Custom SVG maps instead of MapLibre tiles.** The society map and waitlist hex map are brand-styled SVG, so there is no tile cost or key. A `MapProvider` can replace them.
- **No BullMQ/Redis.** Time-based rules (auto-approve after 2 hours, re-offer stale offers, Circle expiry) run lazily when ops, helper and customer pages load (`autoApproveDue`, `reofferStale`). Move them to a queue when Redis is available.

## Design and language
- The UI is **English only**, as requested. The Hindi toggle from the brief is not built. Hinglish and Hindi *input* is still understood by the plan engine (for example "ghar saaf karwana hai", "bartan", "sabzi").
- The design was toned down from "paper and ink" to a **professional** look: same palette, receipts as a signature element, restrained motion, no rotated stickers except small accents.
- Fonts: Fraunces (headlines), DM Sans (UI), DM Mono (receipts and prices), Caveat (only on Shell Notes and a few handwritten accents).

## Product choices
- **Ease of use first.** The customer flow is: write a message, answer at most 3 chip questions, review the plan, approve and pay. Everything else is secondary.
- **Human review is a feature flag** (`human_review`). The brief says humans approve every plan. For a self-serve demo it is **off by default**; turn it on in Ops > Settings for production. Low-confidence drafts (photo-only requests, weak matches) always go to a human regardless of the flag.
- **Geofence enforcement** is a flag (`geofence_enforced`), off by default so the demo works from a desk. Turn on for production. The check (150 m) is implemented.
- **Demo mode** (`demo_mode`) shows demo logins and "simulate the next helper step" buttons. Turn it off before real launch.
- **Plan engine** is a deterministic keyword engine with fuzzy matching, behind `draftFromText`. An LLM can sit behind the same function. Prices never come from the model.
- **Photo-to-plan** is mocked: photos produce low-confidence suggestions that route to a human. Voice uses the browser Web Speech API where available.
- **Door OTP** is derived with an HMAC of the task id (never stored in plain text; only its hash is stored).
- **Payments** use a mock Razorpay behind `createOrder`/`capturePayment`. The webhook route verifies signatures and is idempotent. Money is integer paise, with a double-entry ledger and an escrow account.
- **Expense caps** are held in addition to the plan total and refunded to the Shell Wallet when unspent.
- **OTP login** uses a mock provider: the code is `123456` when no provider key is set. After 3 wrong codes the code is locked.
- **Waitlist, demo data.** The seeded waitlist (73 rows), helpers (10), completed jobs and reviews are **demo data**. Public counters read the database as it is. Use Ops > Settings > "Clear demo waitlist data" before launch.
- **KYC, college ID, selfie liveness and payout verification** are simulated. Only a reference and a verified flag are ever stored. No raw Aadhaar is accepted or stored.
- **Not built**: Routines manager (shown as "Coming soon", per the brief), Shell Plus, Shell Wrapped, shake-to-SOS on iOS permissions flow, receipt OCR (items are typed by the helper), PDF export (use Print to PDF on the Skill Passport), Playwright tests (a scripted end-to-end flow is in `scripts/e2e.ts`), MDX CMS (guides are typed content), push/WhatsApp delivery (in-app inbox is real, providers plug into `notify()`).
- Legal pages are templates marked as drafts that need lawyer review.
