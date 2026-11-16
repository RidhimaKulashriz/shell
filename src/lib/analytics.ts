// First-party analytics with a PostHog-shaped interface. Events are only sent after cookie consent.
export function hasConsent() {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("shell_consent=all");
}

export function track(event: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !hasConsent()) return;
  try {
    const body = JSON.stringify({ event, props, path: location.pathname });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
  } catch {
    /* analytics must never break the page */
  }
}
