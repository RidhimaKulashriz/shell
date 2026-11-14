"use client";

// Analytics: first-party sink, loads ONLY after cookie consent.
// PostHog plugs in here in Phase 1 (NEXT_PUBLIC_POSTHOG_KEY).

export function getConsent(): "all" | "essential" | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem("shell_consent");
    return v === "all" || v === "essential" ? v : null;
  } catch {
    return null;
  }
}

function sessionId(): string {
  try {
    let s = sessionStorage.getItem("shell_sid");
    if (!s) {
      s = Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem("shell_sid", s);
    }
    return s;
  } catch {
    return "na";
  }
}

export function track(name: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || getConsent() !== "all") return;
  const payload = JSON.stringify({ name, path: location.pathname, props, sessionId: sessionId() });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true });
    }
  } catch {}
}
