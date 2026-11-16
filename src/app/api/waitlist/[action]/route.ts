import { z } from "zod";
import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { AppError, api, body } from "@/lib/api";
import { normalizePhone, requestOtp } from "@/lib/auth";

export const POST = api<{ action: string }>(async ({ req, params }) => {
  const b = await body(req, z.object({ phone: z.string() }));
  const phone = normalizePhone(b.phone);
  if (!phone) throw new AppError(400, "invalid_phone", "Enter a valid 10-digit Indian mobile number.", "सही 10 अंकों का मोबाइल नंबर डालिए।");
  if (params.action !== "otp") throw new AppError(404, "not_found", "Unknown action");

  const result = await requestOtp(phone, "waitlist");
  if ("locked" in result) throw new AppError(429, "locked", "Too many wrong tries. Try again in 10 minutes.", "बहुत ग़लत कोशिशें। 10 मिनट बाद आइए।");
  if ("wait" in result) throw new AppError(429, "wait", `Please wait ${result.seconds} seconds before resending.`);
  return { sent: true, channel: "whatsapp", devCode: result.devCode };
}, { limit: { key: "waitlist-otp", max: 5, windowMs: 600000 } });
