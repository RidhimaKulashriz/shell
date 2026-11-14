import { createHash, randomInt } from "crypto";
import { NextResponse } from "next/server";

/** Indian mobile: strips +91 / 0 / spaces. Returns E.164 or null. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

export function sha(input: string): string {
  return createHash("sha256").update(`${process.env.APP_SECRET ?? "shell-dev-secret"}:${input}`).digest("hex");
}

export function otpCode(): string {
  return String(randomInt(100000, 1000000));
}

export function referralCode(name: string): string {
  const base = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase().padEnd(4, "S");
  return `${base}${randomInt(100, 999)}`;
}

// In-memory sliding window limiter. Per instance; Phase 1 moves it to Redis.
const buckets = new Map<string, number[]>();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Consistent error format with English and Hindi messages. */
export function apiError(code: string, en: string, hi: string, status = 400) {
  return NextResponse.json({ ok: false, error: { code, en, hi } }, { status });
}
