import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { addresses, fraudAlerts, geofenceEvents, helperTraining, helpers, locationPings, offers, payouts, plans, societies, tasks, trainingModules } from "@/db/schema";
import { AppError, api, body, need } from "@/lib/api";
import { helperAgeOk } from "@/lib/statemachine";
import { haversine, impossibleSpeed, pointInPolygon } from "@/lib/geo";
import { instantPayout } from "@/lib/money";
import { notify } from "@/lib/notify";

const STEP_SCHEMAS: Record<string, z.ZodType<Record<string, unknown>>> = {
  "1": z.object({ name: z.string().trim().min(2).max(80), dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), gender: z.enum(["female", "male", "other"]), college: z.string().max(120), languages: z.array(z.string()).min(1) }),
  "2": z.object({ kycConsent: z.literal(true) }),
  "3": z.object({ collegeIdFront: z.string().max(400000).optional(), collegeIdBack: z.string().max(400000).optional(), collegeIdExpiry: z.string().optional() }),
  "4": z.object({ selfie: z.string().max(400000).optional() }),
  "5": z.object({ categories: z.array(z.object({ slug: z.string(), level: z.number().int().min(1).max(5) })).min(1), voiceIntro: z.string().max(300).optional() }),
  "6": z.object({ grid: z.record(z.string(), z.array(z.number().int().min(0).max(23))), hoursPerWeek: z.number().int().min(1).max(60), radiusM: z.number().int().min(300).max(5000) }),
  "7": z.object({ upi: z.string().regex(/^[\w.-]{2,}@[a-z]{2,}$/i, "Enter a valid UPI ID"), agreementAccepted: z.literal(true), safetyAccepted: z.literal(true) }),
};

export const POST = api<{ action: string }>(async ({ req, params, user }) => {
  const [h] = await db.select().from(helpers).where(eq(helpers.userId, user!.id)).limit(1);
  need(h, "Helper profile");
  const a = params.action;

  if (a.startsWith("apply-")) {
    const step = a.slice(6);
    const schema = STEP_SCHEMAS[step];
    if (!schema) throw new AppError(404, "not_found", "Unknown step");
    const d = await body(req, schema);
    const patch: Partial<typeof helpers.$inferInsert> = { applicationStep: Math.max(h.applicationStep, Number(step)), applicationData: { ...h.applicationData, [`step${step}`]: { ...d, selfie: undefined, collegeIdFront: undefined, collegeIdBack: undefined } }, updatedAt: new Date() };
    if (step === "1") {
      if (!helperAgeOk(new Date(String(d.dob)))) throw new AppError(400, "under_18", "Shell helpers must be 18 or older.", "Shell हेल्पर की उम्र 18 या उससे ज़्यादा होनी चाहिए।");
      Object.assign(patch, { dob: String(d.dob), displayName: String(d.name), isFemale: d.gender === "female", college: String(d.college), languages: d.languages as string[] });
    }
    // KYC provider interface: only a reference and verified flag are stored, never the ID number.
    if (step === "2") Object.assign(patch, { kycStatus: "verified", kycReference: `kyc_mock_${user!.id.slice(0, 8)}` });
    if (step === "3") Object.assign(patch, { collegeIdStatus: d.collegeIdFront ? "submitted" : "pending" });
    if (step === "4") Object.assign(patch, { livenessStatus: "verified" });
    if (step === "5") Object.assign(patch, { categories: d.categories as { slug: string; level: number }[], voiceIntroText: String(d.voiceIntro ?? "") });
    if (step === "6") Object.assign(patch, { availabilityGrid: d.grid as Record<string, number[]>, radiusM: Number(d.radiusM) });
    if (step === "7") Object.assign(patch, { payoutAccountRef: "upi_ref_" + Math.random().toString(36).slice(2, 8), status: "review", passportSlug: h.passportSlug ?? (String(h.displayName).toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + user!.id.slice(0, 4)) });
    await db.update(helpers).set(patch).where(eq(helpers.id, h.id));
    return { ok: true, step: Number(step), done: step === "7" };
  }

  if (a === "online") {
    const b = await body(req, z.object({ online: z.boolean(), vacation: z.boolean().optional(), rush: z.boolean().optional(), circle: z.boolean().optional() }));
    if (h.status !== "active" && b.online) throw new AppError(403, "inactive", "You can go online once your application is approved and training is done.");
    await db.update(helpers).set({ online: b.online, ...(b.vacation !== undefined ? { vacation: b.vacation } : {}), ...(b.rush !== undefined ? { rushOptIn: b.rush } : {}), ...(b.circle !== undefined ? { circleOptIn: b.circle } : {}) }).where(eq(helpers.id, h.id));
    return { ok: true };
  }

  if (a === "location") {
    const b = await body(req, z.object({ taskId: z.string().uuid(), pings: z.array(z.object({ lat: z.number(), lng: z.number(), accuracy: z.number().optional(), speed: z.number().optional(), heading: z.number().optional(), battery: z.number().int().optional(), mock: z.boolean().optional(), ts: z.number().optional() })).min(1).max(100) }));
    const [t] = await db.select().from(tasks).where(eq(tasks.id, b.taskId)).limit(1);
    need(t, "Task");
    // tracking runs only during an active job
    if (t.assignedHelperId !== h.id || !["en_route", "arrived", "in_progress"].includes(t.status)) throw new AppError(409, "not_tracking", "Tracking runs only during an active job.");
    const alerts: string[] = [];
    let prev: { lat: number; lng: number; ts: number } | null = null;
    const [last] = await db.select().from(locationPings).where(eq(locationPings.taskId, t.id)).orderBy(desc(locationPings.ts)).limit(1);
    if (last) prev = { lat: last.lat, lng: last.lng, ts: last.ts.getTime() };
    for (const p of b.pings) {
      const ts = p.ts ?? Date.now();
      await db.insert(locationPings).values({ helperId: h.id, taskId: t.id, lat: p.lat, lng: p.lng, accuracy: p.accuracy, speed: p.speed, heading: p.heading, battery: p.battery, mock: !!p.mock, ts: new Date(ts) });
      if (p.mock) alerts.push("gps_mock");
      if ((p.accuracy ?? 0) > 120) alerts.push("gps_drift");
      if (prev && impossibleSpeed(prev, { lat: p.lat, lng: p.lng, ts })) alerts.push("impossible_speed");
      prev = { lat: p.lat, lng: p.lng, ts };
    }
    const lastP = b.pings[b.pings.length - 1];
    await db.update(helpers).set({ lat: lastP.lat, lng: lastP.lng }).where(eq(helpers.id, h.id));
    const [plan] = await db.select().from(plans).where(eq(plans.id, t.planId)).limit(1);
    const [addr] = plan.addressId ? await db.select().from(addresses).where(eq(addresses.id, plan.addressId)).limit(1) : [];
    const [soc] = addr ? await db.select().from(societies).where(eq(societies.id, addr.societyId)).limit(1) : [];
    if (soc?.boundary.length && t.status === "in_progress" && !pointInPolygon(lastP, soc.boundary)) {
      alerts.push("left_society");
      await db.insert(geofenceEvents).values({ taskId: t.id, helperId: h.id, geofenceType: "society", event: "exit" });
    }
    if (addr?.lat != null && t.status === "arrived" && haversine(lastP, { lat: addr.lat, lng: addr.lng! }) < 150) await db.insert(geofenceEvents).values({ taskId: t.id, helperId: h.id, geofenceType: "tower", event: "enter" });
    for (const type of new Set(alerts)) await db.insert(fraudAlerts).values({ type, severity: type === "gps_mock" || type === "left_society" ? "high" : "medium", refType: "task", refId: t.id, evidence: { helper: h.displayName } });
    return { stored: b.pings.length, alerts: [...new Set(alerts)] };
  }

  if (a === "payout") {
    if (h.payoutHold) throw new AppError(403, "hold", "Your payouts are on hold. Contact support.");
    const r = await instantPayout(h.id);
    if (r.amount > 0) await notify(user!.id, "helper_payout_sent", { amount: Math.round(r.amount / 100), utr: r.utr ?? "" });
    return r;
  }

  if (a === "training") {
    const b = await body(req, z.object({ module: z.string(), answers: z.array(z.number().int()) }));
    const [m] = await db.select().from(trainingModules).where(eq(trainingModules.slug, b.module)).limit(1);
    need(m, "Module");
    const correct = m.quiz.filter((q, i) => b.answers[i] === q.answer).length;
    const score = Math.round((correct / Math.max(1, m.quiz.length)) * 100);
    const passed = score >= 80;
    await db.insert(helperTraining).values({ helperId: h.id, moduleSlug: m.slug, score, passedAt: passed ? new Date() : null });
    if (passed) {
      const done = await db.select().from(helperTraining).where(and(eq(helperTraining.helperId, h.id)));
      const all = await db.select().from(trainingModules);
      const passedSlugs = new Set(done.filter((d) => d.passedAt).map((d) => d.moduleSlug).concat(m.slug));
      const safety = all.filter((x) => x.mandatory).every((x) => passedSlugs.has(x.slug));
      await db.update(helpers).set({ trainingStatus: safety ? "passed" : "in_progress", ...(m.mandatory ? { safetyTrainingPassedAt: new Date() } : {}), ...(safety && h.status === "training" ? { status: "shadow" } : {}) }).where(eq(helpers.id, h.id));
    }
    return { score, passed };
  }

  if (a === "passport") {
    const b = await body(req, z.object({ rating: z.boolean(), jobs: z.boolean(), college: z.boolean(), languages: z.boolean() }));
    await db.update(helpers).set({ passportVisibility: b }).where(eq(helpers.id, h.id));
    return { ok: true };
  }

  if (a === "appeal") {
    const b = await body(req, z.object({ strikeId: z.string().uuid(), note: z.string().min(5).max(500) }));
    const { strikes } = await import("@/db/schema");
    await db.update(strikes).set({ appealStatus: "open", appealNote: b.note }).where(and(eq(strikes.id, b.strikeId), eq(strikes.helperId, h.id)));
    return { ok: true };
  }
  throw new AppError(404, "not_found", "Unknown action");
}, { roles: ["HELPER"], limit: { key: "helper", max: 240, windowMs: 60000 } });

void inArray; void lt; void offers; void payouts;
