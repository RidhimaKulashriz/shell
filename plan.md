# Shell Professional Full-Stack Upgrade

## Outcome

Make the existing Shell managed life-assistant platform feel production-ready without replacing its established paper-and-shell identity. The work focuses on runtime reliability, secure session behavior, provider correctness, route discoverability, deployment clarity, and operator-grade observability.

## Implementation approach

- Keep the current Next.js App Router, TypeScript, PostgreSQL, Drizzle, and provider-interface architecture.
- Add a canonical page-route manifest for platform discovery and keep it synchronized with the current route tree.
- Strengthen the unauthenticated health endpoint with dependency status, latency, runtime mode, version, and request correlation while avoiding secret leakage.
- Make external provider calls fail closed with explicit errors instead of silently accepting non-success responses.
- Make session-cookie policy configurable for local HTTP versus public HTTPS/embedded preview, with secure defaults and explicit documentation.
- Improve API bootstrap and error observability while preserving the current localized error envelope.
- Add production-readiness documentation and scripts so demo/mock operation, live-provider operation, database setup, and deployment are unambiguous.
- Validate with typecheck, lint, unit tests, and a production build using a local build-time database URL.

## Project structure

- `src/app`: public pages, customer app, helper portal, ops cockpit, and REST endpoints.
- `src/lib`: authentication, API wrapper, provider adapters, pricing, notifications, and boot logic.
- `src/db`: Drizzle schema, seed data, and database bootstrap.
- `public`: static PWA assets and the route manifest.
- `plan.md` / `TODO.md`: implementation intent and outcome tracking.

## Design direction

### Candidate styles

- **Quiet operations studio** (0.06): editorial whitespace, precise status language, and calm data surfaces.
- **Paper-and-shell refinement** (0.04): retain receipts, stamps, cream/forest palette, and human warmth with tighter spacing and stronger hierarchy.
- **Civic service console** (0.07): high-contrast utility, clear state transitions, and transparent service commitments.

### Chosen direction: Paper-and-shell refinement

- **Design movement:** contemporary editorial service design with tactile paper references and restrained utility-console details.
- **Core principles:** calm confidence, visible accountability, progressive disclosure, and fast recovery from errors.
- **Color philosophy:** cream and paper make the service feel human; forest and tide communicate trust; sun and brick are reserved for action and risk states.
- **Layout paradigm:** asymmetric editorial sections for public pages, with structured rail-and-panel layouts for authenticated workspaces.
- **Signature elements:** Shell Receipt summaries, stamped state labels, and route-aware status panels.
- **Interaction philosophy:** every action explains what happens next; risky actions are explicit; optimistic UI is used only when server confirmation is reliable.
- **Animation:** short, purposeful transitions; respect reduced-motion preferences; never animate critical status changes without a static equivalent.
- **Typography system:** Fraunces for headlines, Instrument Serif for emphasis, DM Sans for UI, and DM Mono for identifiers, amounts, and timestamps.
- **Brand essence:** Shell takes responsibility for getting everyday home work finished for apartment residents; calm, accountable, human.
- **Brand voice:** direct, warm, and specific. Example: “One message. One plan. One person to ask.” / “If something changes, Shell tells you before you have to ask.”
- **Wordmark & logo:** retain the existing Shell icon/wordmark system and use the canonical SVG icon as the platform logo asset.
- **Signature brand color:** tide `#051f20`, the deep blue-green that anchors trust and operational clarity.

## Boundaries

The existing mock providers remain the safe default for local/demo use. This pass does not invent live credentials, payment flows, or external provider accounts; it makes their contracts explicit and safer to operate.
