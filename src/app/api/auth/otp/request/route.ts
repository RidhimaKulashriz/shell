import { route, ApiError, rateLimit } from "@/lib/api";
import { issueOtp } from "@/lib/auth";
import { isIndianMobile, toE164 } from "@/lib/utils";
export const POST = route({ limit: [8, 60000] }, async ({ body, ip }) => {
  if (!isIndianMobile(String(body.phone ?? ""))) throw new ApiError("bad_phone", "Enter a valid 10-digit Indian mobile number.");
  const phone = toE164(body.phone);
  rateLimit(`otp:${phone}`, 5, 10 * 60000); rateLimit(`otpip:${ip}`, 20, 10 * 60000);
  const demoCode = await issueOtp(phone);
  return { ok: true, demoCode };
}, true);
