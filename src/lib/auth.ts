import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, createHmac, randomBytes, randomInt } from "crypto";
import { db } from "@/db";
import { sessions, users, otpCodes, type Role } from "@/db/schema";
import { and, desc, eq, gt } from "drizzle-orm";

export const COOKIE = "shell_session";
const SECRET = process.env.APP_SECRET ?? "shell-dev-secret-change-me";
export const sha = (s: string) => createHash("sha256").update(s).digest("hex");
export const hmac = (s: string) => createHmac("sha256", SECRET).update(s).digest("hex");
export type SessionUser = typeof users.$inferSelect;

export function homeFor(role: Role) {
  return role === "HELPER" ? "/helper" : role === "OPS" || role === "SUPER_ADMIN" ? "/ops" : role === "SOCIETY_PARTNER" ? "/society" : "/app";
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await db.insert(sessions).values({ token: sha(token), userId, expiresAt: new Date(Date.now() + 30 * 864e5) });
  const jar = await cookies();
  const https = (await headers()).get("x-forwarded-proto") === "https";
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: https, path: "/", maxAge: 30 * 86400 });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
}

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db.select({ u: users }).from(sessions).innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, sha(token)), gt(sessions.expiresAt, new Date())));
  if (!row || row.u.status !== "active") return null;
  return row.u;
});

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, sha(token)));
  jar.delete(COOKIE);
}

export async function requireRole(roles: Role[], here = "/"): Promise<SessionUser> {
  const u = await getUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(here)}`);
  if (!roles.includes(u.role)) redirect(homeFor(u.role));
  return u;
}

// ---- OTP (mock provider: code is 123456 unless a real provider is configured) ----
const DEMO_OTP = "123456";
export const otpIsMock = () => !process.env.MSG91_AUTH_KEY && !process.env.TWILIO_AUTH_TOKEN;

export async function issueOtp(phone: string) {
  const code = otpIsMock() ? DEMO_OTP : String(randomInt(100000, 999999));
  await db.insert(otpCodes).values({ phone, codeHash: sha(phone + code), expiresAt: new Date(Date.now() + 10 * 60000) });
  // Real providers plug in here: MSG91 / Twilio via WhatsApp first, SMS fallback.
  return otpIsMock() ? code : undefined;
}

export async function checkOtp(phone: string, code: string): Promise<"ok" | "bad" | "locked" | "expired"> {
  const [row] = await db.select().from(otpCodes).where(and(eq(otpCodes.phone, phone), gt(otpCodes.expiresAt, new Date()))).orderBy(desc(otpCodes.createdAt)).limit(1);
  if (!row) return "expired";
  if (row.attempts >= 3) return "locked";
  if (row.codeHash !== sha(phone + code)) {
    await db.update(otpCodes).set({ attempts: row.attempts + 1 }).where(eq(otpCodes.id, row.id));
    return row.attempts + 1 >= 3 ? "locked" : "bad";
  }
  await db.delete(otpCodes).where(eq(otpCodes.phone, phone));
  return "ok";
}
