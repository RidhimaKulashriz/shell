import crypto from "node:crypto";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { AppError, api, body } from "@/lib/api";
import { normalizePhone, verifyOtp } from "@/lib/auth";

export const POST = api(async ({ req, ip }) => {
  const b = await body(req, z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string(),
    otp: z.string().length(6),
    role: z.enum(["help", "earn", "both"]).default("help"),
    society: z.string().trim().max(120).default(""),
    consent: z.literal(true),
  }));
  const phone = normalizePhone(b.phone);
  if (!phone) throw new AppError(400, "invalid_phone", "Enter a valid 10-digit Indian mobile number.", "सही 10 अंकों का मोबाइल नंबर डालिए।");

  const [existing] = await db.select({ position: waitlist.position }).from(waitlist).where(eq(waitlist.phone, phone)).limit(1);
  if (existing) return { existing: true, position: existing.position };

  const verified = await verifyOtp(phone, b.otp, "waitlist");
  if (!verified.ok) throw new AppError(400, `otp_${verified.reason}`, "That OTP did not match.", "OTP सही नहीं है।");

  const [{ n }] = await db.select({ n: count() }).from(waitlist);
  const [created] = await db.insert(waitlist).values({
    name: b.name,
    phone,
    role: b.role,
    societyText: b.society,
    referralCode: `W${crypto.randomBytes(5).toString("hex").toUpperCase()}`,
    position: Number(n) + 1,
    consentAt: new Date(),
    verifiedAt: new Date(),
    ip,
  }).returning({ position: waitlist.position });
  return { ok: true, position: created.position };
}, { limit: { key: "waitlist-signup", max: 10, windowMs: 600000 } });
