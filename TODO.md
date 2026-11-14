# Shell Professional Full-Stack Upgrade

## Runtime and deployment readiness

- [x] The deployed app exposes a public `/manus-routes.json` manifest containing all 71 current page routes, including dynamic route patterns, while excluding APIs, assets, and system endpoints.
- [x] The health endpoint remains unauthenticated and returns database reachability, latency, runtime mode, version, uptime, and a request identifier without exposing credentials or provider secrets.
- [x] Production startup and deployment documentation clearly state the required database and app-secret settings, the mock/demo defaults, the live-provider switches, and the health-check path.

## Full-stack reliability and security

- [x] External OTP provider calls reject non-success responses and surface a stable internal error instead of silently proceeding.
- [x] Session cookies support local HTTP and public HTTPS/embedded-preview deployments through explicit configuration, while keeping HTTP-only and secure behavior.
- [x] API errors retain their structured localized envelope and request IDs, and unexpected failures are logged without request bodies or secrets.

## Professional delivery

- [x] The repository includes a canonical platform logo declaration and a clean package identity (`shell-platform`).
- [x] Typecheck, lint, 36 unit tests, route-manifest checks, secret scan, and production build pass. Lint reports only pre-existing non-blocking warnings.
- [x] The validated changes are ready to commit and push to `main` without altering unrelated branches.
