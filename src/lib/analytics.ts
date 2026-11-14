"use client";
// Analytics only fire after cookie consent. Events go to our own /api/events (PostHog can be wired here via NEXT_PUBLIC_POSTHOG_KEY).
export function hasConsent() {
  try { return localStorage.getItem("shell_consent") === "all"; } catch { return false; }
}
export function track(name: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !hasConsent()) return;
  try { navigator.sendBeacon("/api/events", new Blob([JSON.stringify({ name, props, path: location.pathname })], { type: "application/json" })); } catch {}
}
