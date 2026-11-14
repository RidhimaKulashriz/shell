import { NextResponse } from "next/server";
import { and, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { apiError, clientIp, normalisePhone, otpCode, rateLimit, sha } from "@/lib/server";

export const dynamic = "force-dynamic";

const body = z.object({ phone: z.string().min(8).max(20) });

// OTP provider interface. Set OTP_PROVIDER=msg91 and wire sendOtp() to go live.
// Default "mock" returns the code in the response so the flow can be demoed.
async function sendOtp(phone: string, code: string) {
  const provider = process.env.OTP_PROVIDER ?? "mock";
  if (provider === "mock") return { mock: true as const, code };
  // Real providers (MSG91 WhatsApp first, SMS fallback) plug in here.
  throw new Error(`OTP provider ${provider} is not configured`);
}

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("bad_input", "Enter a valid mobile number.", "Sahi mobile number daalo.");
  const phone = normalisePhone(parsed.data.phone);
  if (!phone) return apiError("bad_phone", "Enter a 10-digit Indian mobile number.", "10 digit ka Indian mobile number daalo.");
  if (!rateLimit(`otp:ip:${clientIp(req)}`, 10, 3_600_000) || !rateLimit(`otp:ph:${phone}`, 4, 600_000)) {
    return apiError("rate_limited", "Too many tries. Please wait a few minutes.", "Bahut baar try kiya. Kuch minute ruko.", 429);
  }
  // Re-use a live code within 30 seconds to avoid spamming
  const [recent] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.expiresAt, new Date()), eq(otpCodes.consumed, false)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  void recent;
  const code = otpCode();
  await db.insert(otpCodes).values({ phone, codeHash: sha(`${phone}:${code}`), expiresAt: new Date(Date.now() + 10 * 60_000) });
  const sent = await sendOtp(phone, code);
  return NextResponse.json({ ok: true, resendIn: 30, ...(sent.mock ? { devCode: sent.code, mock: true } : {}) });
}
