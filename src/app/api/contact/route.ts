import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { contactMessages, enquiries } from "@/db/schema";
import { apiError, clientIp, normalisePhone, rateLimit } from "@/lib/server";

export const dynamic = "force-dynamic";

const contact = z.object({
  kind: z.literal("contact"),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  topic: z.enum(["general", "safety", "press", "helper", "society", "other"]).default("general"),
  message: z.string().trim().min(5).max(2000),
});

const enquiry = z.object({
  kind: z.enum(["rwa", "office", "hostel"]),
  orgName: z.string().trim().min(2).max(120),
  city: z.string().trim().max(60).optional().or(z.literal("")),
  size: z.coerce.number().int().min(0).max(100000).optional(),
  contactName: z.string().trim().min(2).max(80),
  contactRole: z.string().trim().max(60).optional().or(z.literal("")),
  phone: z.string().min(8).max(20),
  callTime: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

// One endpoint for contact form and RWA / office / hostel enquiries.
export async function POST(req: Request) {
  if (!rateLimit(`contact:${clientIp(req)}`, 6, 3_600_000)) {
    return apiError("rate_limited", "Too many messages. Try again later.", "Bahut messages. Thodi der baad try karo.", 429);
  }
  const json = await req.json().catch(() => null);
  if (json?.kind === "contact") {
    const p = contact.safeParse(json);
    if (!p.success) return apiError("bad_input", "Please fill name and message.", "Naam aur message bharo.");
    const d = p.data;
    await db.insert(contactMessages).values({ name: d.name, email: d.email || null, phone: d.phone || null, topic: d.topic, message: d.message });
    return NextResponse.json({ ok: true });
  }
  const p = enquiry.safeParse(json);
  if (!p.success) return apiError("bad_input", "Please check the form.", "Form check karo.");
  const d = p.data;
  const phone = normalisePhone(d.phone);
  if (!phone) return apiError("bad_phone", "Enter a 10-digit Indian mobile number.", "10 digit ka Indian mobile number daalo.");
  await db.insert(enquiries).values({
    kind: d.kind,
    orgName: d.orgName,
    city: d.city || null,
    size: d.size ?? null,
    contactName: d.contactName,
    contactRole: d.contactRole || null,
    phone,
    callTime: d.callTime || null,
    notes: d.notes || null,
  });
  return NextResponse.json({ ok: true });
}
