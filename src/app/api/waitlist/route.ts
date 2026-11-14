import { NextResponse } from "next/server";
import { and, count, desc, eq, gt, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLog, otpCodes, societies, towers, waitlist } from "@/db/schema";
import { apiError, clientIp, normalisePhone, rateLimit, referralCode, sha } from "@/lib/server";
import { ensureSeeded } from "@/lib/data";
import { hexIds } from "@/lib/geo";

export const dynamic = "force-dynamic";

const REFERRAL_JUMP = 3; // places gained per verified referral

const body = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().min(8).max(20),
  otp: z.string().regex(/^\d{6}$/),
  role: z.enum(["help", "earn", "both"]),
  societyId: z.string().uuid().optional().nullable(),
  societyText: z.string().trim().max(120).optional().nullable(),
  towerText: z.string().trim().max(40).optional().nullable(),
  message: z.string().trim().max(600).optional().nullable(),
  referral: z.string().trim().max(20).optional().nullable(),
  consent: z.literal(true),
});

async function summary(rowId: string) {
  const [me] = await db.select().from(waitlist).where(eq(waitlist.id, rowId)).limit(1);
  const [{ pos }] = await db
    .select({ pos: count() })
    .from(waitlist)
    .where(and(isNotNull(waitlist.verifiedAt), sql`(${waitlist.seq} - ${REFERRAL_JUMP} * ${waitlist.referralCount}) < ${me.seq - REFERRAL_JUMP * me.referralCount}`));
  let society: { name: string; waiting: number; target: number } | null = null;
  if (me.societyId) {
    const [s] = await db.select().from(societies).where(eq(societies.id, me.societyId)).limit(1);
    const [{ n }] = await db
      .select({ n: count() })
      .from(waitlist)
      .where(and(eq(waitlist.societyId, me.societyId), isNotNull(waitlist.verifiedAt)));
    society = { name: s.name, waiting: Number(n), target: s.unlockTarget };
  }
  return {
    name: me.name,
    position: Number(pos) + 1,
    referralCode: me.referralCode,
    referrals: me.referralCount,
    society,
  };
}

export async function POST(req: Request) {
  await ensureSeeded();
  const ip = clientIp(req);
  if (!rateLimit(`wl:${ip}`, 8, 3_600_000)) {
    return apiError("rate_limited", "Too many signups from this network. Try again later.", "Is network se bahut signup. Baad mein try karo.", 429);
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError("bad_input", "Please check the form. Name, number, OTP and consent are needed.", "Form dekho: naam, number, OTP aur consent chahiye.");
  }
  const d = parsed.data;
  const phone = normalisePhone(d.phone);
  if (!phone) return apiError("bad_phone", "Enter a 10-digit Indian mobile number.", "10 digit ka Indian mobile number daalo.");

  // Verify OTP
  const [row] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), eq(otpCodes.consumed, false), gt(otpCodes.expiresAt, new Date())))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  if (!row || row.attempts >= 5) {
    return apiError("otp_expired", "That code has expired. Ask for a new one.", "Code expire ho gaya. Naya mangao.");
  }
  if (row.codeHash !== sha(`${phone}:${d.otp}`)) {
    await db.update(otpCodes).set({ attempts: row.attempts + 1 }).where(eq(otpCodes.id, row.id));
    return apiError("otp_wrong", "That code is not right.", "Ye code sahi nahi hai.");
  }
  await db.update(otpCodes).set({ consumed: true }).where(eq(otpCodes.id, row.id));

  // One signup per number: return the existing entry
  const [existing] = await db.select().from(waitlist).where(eq(waitlist.phone, phone)).limit(1);
  if (existing) {
    return NextResponse.json({ ok: true, existing: true, ...(await summary(existing.id)) });
  }

  // Hex index from tower or society centroid
  let hex: { hex8: string; hex9: string } | null = null;
  if (d.societyId) {
    const [s] = await db.select().from(societies).where(eq(societies.id, d.societyId)).limit(1);
    if (s) {
      let lat = s.lat;
      let lng = s.lng;
      if (d.towerText) {
        const ts = await db.select().from(towers).where(eq(towers.societyId, s.id));
        const t = ts.find((x) => x.name.toLowerCase().includes(d.towerText!.toLowerCase().replace(/^tower\s*/, "")));
        if (t?.lat && t?.lng) {
          lat = t.lat;
          lng = t.lng;
        }
      }
      hex = hexIds(lat, lng);
    }
  }

  let code = referralCode(d.name);
  for (let i = 0; i < 5; i++) {
    const [clash] = await db.select({ id: waitlist.id }).from(waitlist).where(eq(waitlist.referralCode, code)).limit(1);
    if (!clash) break;
    code = referralCode(d.name);
  }

  const now = new Date();
  const [created] = await db
    .insert(waitlist)
    .values({
      name: d.name,
      phone,
      role: d.role,
      societyId: d.societyId || null,
      societyText: d.societyText || null,
      towerText: d.towerText || null,
      message: d.message || null,
      referralCode: code,
      referredBy: d.referral ? d.referral.toUpperCase() : null,
      consentAt: now,
      verifiedAt: now,
      hex8: hex?.hex8,
      hex9: hex?.hex9,
      ipHash: sha(ip),
    })
    .returning();

  if (d.referral) {
    await db
      .update(waitlist)
      .set({ referralCount: sql`${waitlist.referralCount} + 1` })
      .where(eq(waitlist.referralCode, d.referral.toUpperCase()));
  }
  await db.insert(auditLog).values({
    actorId: null,
    action: "waitlist.create",
    entity: "waitlist",
    entityId: created.id,
    after: { role: d.role, societyId: d.societyId ?? null },
    ip: sha(ip).slice(0, 12),
    userAgent: req.headers.get("user-agent")?.slice(0, 200),
  });

  return NextResponse.json({ ok: true, existing: false, ...(await summary(created.id)) });
}
