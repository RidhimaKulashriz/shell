import { route, ApiError } from "@/lib/api";
import { checkOtp, createSession, homeFor } from "@/lib/auth";
import { isIndianMobile, toE164 } from "@/lib/utils";
import { db } from "@/db";
import { users, customerProfiles, helperProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST = route({ limit: [15, 60000] }, async ({ body }) => {
  if (!isIndianMobile(String(body.phone ?? ""))) throw new ApiError("bad_phone", "Enter a valid 10-digit Indian mobile number.");
  const phone = toE164(body.phone);
  const r = await checkOtp(phone, String(body.code ?? ""));
  if (r === "locked") throw new ApiError("locked", "Too many wrong codes. Please wait 10 minutes and request a new one.", 429);
  if (r === "expired") throw new ApiError("expired", "That code has expired. Request a new one.");
  if (r === "bad") throw new ApiError("bad_code", "That code isn't right. Check and try again.");
  let [u] = await db.select().from(users).where(eq(users.phone, phone));
  let isNew = false;
  if (!u) {
    const role = body.as === "helper" ? "HELPER" : "CUSTOMER";
    [u] = await db.insert(users).values({ phone, role, name: "", consentWhatsapp: true, consentAt: new Date() }).returning();
    if (role === "CUSTOMER") await db.insert(customerProfiles).values({ userId: u.id, referralCode: "SH" + u.id.slice(0, 5).toUpperCase() });
    else await db.insert(helperProfiles).values({ userId: u.id, passportSlug: "h" + u.id.slice(0, 8) });
    isNew = true;
  }
  if (u.status !== "active") throw new ApiError("blocked", "This account is blocked. Contact support to appeal.", 403);
  await createSession(u.id);
  return { ok: true, isNew, next: homeFor(u.role) };
}, true);
