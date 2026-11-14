import { z } from "zod";
import { AppError, api, body } from "@/lib/api";
import { normalizePhone, requestOtp } from "@/lib/auth";

export const POST = api(async ({ req }) => {
  const { phone, purpose } = await body(req, z.object({ phone: z.string(), purpose: z.enum(["waitlist", "login"]).default("waitlist") }));
  const p = normalizePhone(phone);
  if (!p) throw new AppError(400, "invalid_phone", "Enter a valid 10-digit Indian mobile number.", "सही 10 अंकों का मोबाइल नंबर डालिए।");
  const r = await requestOtp(p, purpose);
  if ("locked" in r) throw new AppError(429, "locked", "Too many wrong tries. Try again in 10 minutes.", "बहुत ग़लत कोशिशें। 10 मिनट बाद आइए।");
  if ("wait" in r) throw new AppError(429, "wait", `Please wait ${r.seconds} seconds before resending.`);
  return { sent: true, channel: "whatsapp", devCode: r.devCode };
}, { limit: { key: "otp", max: 10, windowMs: 600000 } });
