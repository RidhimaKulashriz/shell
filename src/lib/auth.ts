import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { otpCodes, sessions, users, customerProfiles } from "@/db/schema";

export const SESSION_COOKIE = "shell_session";
export const OPS_ROLES = ["OPS", "SUPER_ADMIN"];
const SECRET = process.env.APP_SECRET ?? "shell-dev-secret-change-me";
const sessionSameSite = process.env.SESSION_COOKIE_SAMESITE === "none" ? "none" : "lax";

export const sha = (s: string) => crypto.createHash("sha256").update(SECRET + s).digest("hex");

export function normalizePhone(input: string): string | null {
  const raw = input.replace(/[\s()-]/g, "");
  // Only strip a country code when the remaining part is a full 10-digit number (so 9100000001 stays intact).
  const m = raw.match(/^(?:\+91|91|0)?(\d{10})$/) ?? raw.match(/^\+91(\d{10})$/);
  const d = raw.length === 10 ? raw : (m?.[1] ?? "");
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}

/* ---- OTP provider interface: MOCK by default. Set OTP_PROVIDER=msg91 with MSG91_AUTH_KEY + MSG91_TEMPLATE_ID. ---- */
export interface OtpProvider {
  name: string;
  send(phone: string, code: string, channel: "whatsapp" | "sms"): Promise<void>;
}
const mockProvider: OtpProvider = { name: "mock", async send() {} };
const msg91Provider: OtpProvider = {
  name: "msg91",
  async send(phone, code) {
    const response = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: { authkey: process.env.MSG91_AUTH_KEY ?? "", "content-type": "application/json" },
      body: JSON.stringify({ template_id: process.env.MSG91_TEMPLATE_ID, mobile: phone.replace("+", ""), otp: code }),
    });
    if (!response.ok) throw new Error(`OTP provider rejected request (${response.status})`);
  },
};
export const otpProvider = (): OtpProvider => (process.env.OTP_PROVIDER === "msg91" ? msg91Provider : mockProvider);
export const isMockOtp = () => otpProvider().name === "mock";

export async function requestOtp(phone: string, purpose = "login") {
  const code = isMockOtp() ? "123456" : String(crypto.randomInt(100000, 999999));
  const [recent] = await db.select().from(otpCodes).where(and(eq(otpCodes.phone, phone), eq(otpCodes.purpose, purpose))).orderBy(desc(otpCodes.createdAt)).limit(1);
  if (recent?.lockedUntil && recent.lockedUntil > new Date()) return { locked: true as const, lockedUntil: recent.lockedUntil };
  if (recent && Date.now() - recent.createdAt.getTime() < 30000 && !recent.consumedAt) return { wait: true as const, seconds: 30 - Math.floor((Date.now() - recent.createdAt.getTime()) / 1000) };
  await db.insert(otpCodes).values({ phone, purpose, codeHash: sha(code), expiresAt: new Date(Date.now() + 5 * 60000) });
  await otpProvider().send(phone, code, "whatsapp");
  return { sent: true as const, devCode: isMockOtp() ? code : undefined };
}

export async function verifyOtp(phone: string, code: string, purpose = "login"): Promise<{ ok: true } | { ok: false; reason: string; lockedUntil?: Date }> {
  const [row] = await db.select().from(otpCodes).where(and(eq(otpCodes.phone, phone), eq(otpCodes.purpose, purpose), isNull(otpCodes.consumedAt))).orderBy(desc(otpCodes.createdAt)).limit(1);
  if (!row) return { ok: false, reason: "no_otp" };
  if (row.lockedUntil && row.lockedUntil > new Date()) return { ok: false, reason: "locked", lockedUntil: row.lockedUntil };
  if (row.expiresAt < new Date()) return { ok: false, reason: "expired" };
  if (row.codeHash !== sha(code)) {
    const attempts = row.attempts + 1;
    await db.update(otpCodes).set({ attempts, lockedUntil: attempts >= 3 ? new Date(Date.now() + 10 * 60000) : null }).where(eq(otpCodes.id, row.id));
    return attempts >= 3 ? { ok: false, reason: "locked", lockedUntil: new Date(Date.now() + 10 * 60000) } : { ok: false, reason: "wrong" };
  }
  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, row.id));
  return { ok: true };
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const h = await headers();
  await db.insert(sessions).values({ token: sha(token), userId, expiresAt: new Date(Date.now() + 30 * 86400000), ip: h.get("x-forwarded-for")?.split(",")[0] ?? null, userAgent: h.get("user-agent")?.slice(0, 200) ?? null });
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: sessionSameSite, secure: sessionSameSite === "none" || (process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1"), path: "/", maxAge: 30 * 86400 });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
}

export async function findOrCreateUser(phone: string, role = "CUSTOMER", name = "") {
  const [u] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (u) return { user: u, created: false };
  const [created] = await db.insert(users).values({ phone, role, name }).returning();
  if (role === "CUSTOMER") await db.insert(customerProfiles).values({ userId: created.id, referralCode: "SH" + crypto.randomBytes(3).toString("hex").toUpperCase() });
  return { user: created, created: true };
}

export type SessionUser = typeof users.$inferSelect;

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [s] = await db.select().from(sessions).where(eq(sessions.token, sha(token))).limit(1);
  if (!s || s.expiresAt < new Date()) return null;
  const [u] = await db.select().from(users).where(eq(users.id, s.userId)).limit(1);
  if (!u || u.status !== "active") return null;
  return u;
}

export async function destroySession() {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, sha(token)));
  c.delete(SESSION_COOKIE);
}

/** RBAC for server components. Redirects to the matching login when not allowed. */
export async function requireUser(roles?: string[], loginPath = "/app/login"): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect(`${loginPath}?next=${encodeURIComponent((await headers()).get("x-pathname") ?? "")}`);
  if (roles && !roles.includes(u.role) && u.role !== "SUPER_ADMIN") redirect(loginPath + "?denied=1");
  return u;
}
