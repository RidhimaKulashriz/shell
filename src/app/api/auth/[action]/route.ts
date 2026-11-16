import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { helpers, users } from "@/db/schema";
import { AppError, api, body } from "@/lib/api";
import { createSession, destroySession, findOrCreateUser, normalizePhone, requestOtp, verifyOtp } from "@/lib/auth";

export const POST = api<{ action: string }>(async ({ req, params }) => {
  if (params.action === "logout") {
    await destroySession();
    return { ok: true };
  }
  const b = await body(req, z.object({ phone: z.string(), code: z.string().optional(), role: z.enum(["CUSTOMER", "HELPER"]).default("CUSTOMER"), name: z.string().max(80).optional(), language: z.string().optional() }));
  const phone = normalizePhone(b.phone);
  if (!phone) throw new AppError(400, "invalid_phone", "Enter a valid 10-digit Indian mobile number.", "सही 10 अंकों का मोबाइल नंबर डालिए।");
  if (params.action === "request") {
    const r = await requestOtp(phone, "login");
    if ("locked" in r) throw new AppError(429, "locked", "Too many wrong tries. Try again in 10 minutes.", "बहुत ग़लत कोशिशें। 10 मिनट बाद आइए।");
    if ("wait" in r) throw new AppError(429, "wait", `Please wait ${r.seconds} seconds before resending.`);
    if (process.env.ALLOW_DEV_OTP === "true" && "devCode" in r && r.devCode) {
      return { sent: true, devCode: r.devCode };
    }
    return { sent: true };
  }
  if (params.action === "verify") {
    if (!b.code) throw new AppError(400, "code_required", "Enter the 6-digit OTP");
    const v = await verifyOtp(phone, b.code, "login");
    if (!v.ok) throw new AppError(v.reason === "locked" ? 429 : 400, `otp_${v.reason}`, v.reason === "locked" ? "Too many wrong tries. Try again in 10 minutes." : "That OTP did not match.", "OTP सही नहीं है।");
    const { user, created } = await findOrCreateUser(phone, b.role, b.name ?? "");
    if (b.language && created) await db.update(users).set({ language: b.language }).where(eq(users.id, user.id));
    if (created && b.role === "HELPER") await db.insert(helpers).values({ userId: user.id, displayName: b.name || "New helper", status: "applied" });
    await createSession(user.id);
    const dest = user.role === "HELPER" ? "/earn/portal" : user.role === "OPS" || user.role === "SUPER_ADMIN" ? "/ops" : user.role === "SOCIETY_PARTNER" ? "/society" : "/app";
    return { ok: true, created, role: user.role, redirect: created && user.role === "CUSTOMER" ? "/app/onboarding" : dest };
  }
  throw new AppError(404, "not_found", "Unknown action");
}, { limit: { key: "auth", max: 20, windowMs: 600000 } });
