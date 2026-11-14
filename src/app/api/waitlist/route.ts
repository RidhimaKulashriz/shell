import { and, count, eq, max, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { societies, waitlist } from "@/db/schema";
import { AppError, api, body } from "@/lib/api";
import { normalizePhone, verifyOtp } from "@/lib/auth";
import { latLngToHex } from "@/lib/geo";
import { SITE_URL } from "@/lib/seo";
import { render } from "@/lib/notify";

const schema = z.object({
  name: z.string().trim().min(2, "Naam likhiye").max(80),
  phone: z.string(),
  otp: z.string().regex(/^\d{6}$/, "6 digit OTP"),
  role: z.enum(["help", "earn", "both"]),
  society: z.string().trim().max(120).default(""),
  tower: z.string().trim().max(40).optional(),
  message: z.string().trim().max(500).optional(),
  ref: z.string().trim().max(20).optional(),
  consent: z.literal(true, { error: "WhatsApp consent is required" }),
});

export async function effectivePosition(row: { position: number; referralCode: string }) {
  const [{ n }] = await db.select({ n: count() }).from(waitlist).where(eq(waitlist.referredBy, row.referralCode));
  return Math.max(1, row.position - 5 * Number(n));
}

async function summary(row: typeof waitlist.$inferSelect) {
  const [{ n }] = row.societyId ? await db.select({ n: count() }).from(waitlist).where(eq(waitlist.societyId, row.societyId)) : await db.select({ n: count() }).from(waitlist);
  const eff = await effectivePosition(row);
  return { position: eff, neighbours: Number(n), referralCode: row.referralCode, shareUrl: `${SITE_URL}/waitlist?ref=${row.referralCode}`, cardUrl: `/api/og?kind=waitlist&n=${eff}&title=${encodeURIComponent("I'm on the Shell list")}&sub=${encodeURIComponent(row.societyText || "Delhi")}`, name: row.name };
}

export const POST = api(async ({ req, ip }) => {
  const b = await body(req, schema);
  const phone = normalizePhone(b.phone);
  if (!phone) throw new AppError(400, "invalid_phone", "Enter a valid 10-digit Indian mobile number.", "सही 10 अंकों का मोबाइल नंबर डालिए।");
  const [existing] = await db.select().from(waitlist).where(eq(waitlist.phone, phone)).limit(1);
  if (existing) return { existing: true, ...(await summary(existing)) };
  const v = await verifyOtp(phone, b.otp, "waitlist");
  if (!v.ok) throw new AppError(400, `otp_${v.reason}`, v.reason === "locked" ? "Too many wrong tries. Try again in 10 minutes." : "That OTP did not match. Check and try again.", "OTP सही नहीं है।");
  const q = b.society.toLowerCase();
  const [soc] = q ? await db.select().from(societies).where(sql`lower(${societies.name}) = ${q} or ${societies.slug} = ${q}`).limit(1) : [];
  const [{ m }] = await db.select({ m: max(waitlist.position) }).from(waitlist);
  const referralCode = "SH" + Math.random().toString(36).slice(2, 7).toUpperCase();
  let referredBy: string | null = null;
  if (b.ref) {
    const [r] = await db.select().from(waitlist).where(eq(waitlist.referralCode, b.ref.toUpperCase())).limit(1);
    if (r && r.phone !== phone) referredBy = r.referralCode;
  }
  const [row] = await db
    .insert(waitlist)
    .values({ name: b.name, phone, role: b.role, societyText: b.society, societyId: soc?.id ?? null, towerText: b.tower ?? null, message: b.message ?? null, referralCode, referredBy, position: (m ?? 0) + 1, consentAt: new Date(), verifiedAt: new Date(), hex8: soc ? latLngToHex(soc.centroidLat, soc.centroidLng, 8) : null, hex9: soc ? latLngToHex(soc.centroidLat, soc.centroidLng, 9) : null, ip })
    .returning();
  const s = await summary(row);
  console.log(JSON.stringify({ level: "info", event: "waitlist_confirmed", text: render("waitlist_confirmed", { name: b.name, position: s.position, link: s.shareUrl }) }));
  return { existing: false, ...s };
}, { limit: { key: "waitlist", max: 8, windowMs: 600000 } });

export const GET = api(async ({ req }) => {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) throw new AppError(400, "missing_code", "code is required");
  const [row] = await db.select().from(waitlist).where(and(eq(waitlist.referralCode, code.toUpperCase()))).limit(1);
  if (!row) throw new AppError(404, "not_found", "Code not found");
  return summary(row);
});
