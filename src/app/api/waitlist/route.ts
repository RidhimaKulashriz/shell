import { route, ApiError, rateLimit } from "@/lib/api";
import { checkOtp } from "@/lib/auth";
import { isIndianMobile, toE164 } from "@/lib/utils";
import { db } from "@/db";
import { waitlist, societies, towers } from "@/db/schema";
import { count, eq, ilike, sql } from "drizzle-orm";
import { hexId } from "@/lib/geo";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80), phone: z.string(), role: z.enum(["help", "earn", "both"]).default("help"),
  society: z.string().max(120).optional().default(""), tower: z.string().max(40).optional().default(""), message: z.string().max(500).optional().default(""),
  referralCode: z.string().max(20).optional().default(""), consent: z.literal(true, { message: "Please agree to WhatsApp messages." }), otp: z.string().length(6, "Enter the 6-digit code."),
});

export const POST = route({ limit: [10, 60000] }, async ({ body, ip }) => {
  const p = schema.safeParse(body);
  if (!p.success) throw new ApiError("invalid", p.error.issues[0].message);
  const d = p.data;
  if (!isIndianMobile(d.phone)) throw new ApiError("bad_phone", "Enter a valid 10-digit Indian mobile number.");
  rateLimit(`wl:${ip}`, 6, 3600000);
  const phone = toE164(d.phone);
  const [dup] = await db.select().from(waitlist).where(eq(waitlist.phone, phone));
  if (dup) throw new ApiError("duplicate", `You're already on the list at #${dup.position}. Share your link to move up.`);
  const r = await checkOtp(phone, d.otp);
  if (r !== "ok") throw new ApiError("bad_code", r === "locked" ? "Too many wrong codes. Try again in 10 minutes." : "That code isn't right or has expired.");
  const [soc] = d.society ? await db.select().from(societies).where(ilike(societies.name, d.society.trim())) : [];
  const [{ n }] = await db.select({ n: count() }).from(waitlist);
  let position = n + 1;
  const ref = d.referralCode.trim().toUpperCase();
  let referrer: typeof waitlist.$inferSelect | undefined;
  if (ref) { [referrer] = await db.select().from(waitlist).where(eq(waitlist.referralCode, ref)); }
  const lat = soc?.centroidLat ?? 28.59 + (Math.random() - 0.5) * 0.02, lng = soc?.centroidLng ?? 77.05 + (Math.random() - 0.5) * 0.02;
  const code = "S" + Math.random().toString(36).slice(2, 7).toUpperCase();
  const [row] = await db.insert(waitlist).values({
    name: d.name, phone, role: d.role, societyText: d.society, societyId: soc?.id, towerText: d.tower, message: d.message, referralCode: code,
    referredBy: referrer?.referralCode, position, consentAt: new Date(), verifiedAt: new Date(), hex: hexId(lat, lng, 8),
  }).returning();
  if (referrer) await db.update(waitlist).set({ position: sql`greatest(1, ${waitlist.position} - 5)` }).where(eq(waitlist.id, referrer.id));
  const neighbours = soc ? (await db.select({ n: count() }).from(waitlist).where(eq(waitlist.societyId, soc.id)))[0].n : n + 1;
  void towers;
  return { ok: true, position: row.position, neighbours, code, society: d.society };
}, true);
