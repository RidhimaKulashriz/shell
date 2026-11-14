import { route, ApiError } from "@/lib/api";
import { db } from "@/db";
import { helperProfiles, users, strikes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { instantPayout } from "@/lib/tasks";
import { TRAINING } from "@/lib/content";
import { notifyOps } from "@/lib/notify";
import { audit } from "@/lib/settings";

function age(dob: string) { const d = new Date(dob); if (isNaN(d.getTime())) return -1; const n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a; }

export const POST = route({ roles: ["HELPER"] }, async ({ body, user }) => {
  const [h] = await db.select().from(helperProfiles).where(eq(helperProfiles.userId, user.id));
  if (!h) throw new ApiError("not_found", "Helper profile not found.", 404);
  const upd = (v: Partial<typeof helperProfiles.$inferInsert>) => db.update(helperProfiles).set({ ...v, updatedAt: new Date() }).where(eq(helperProfiles.userId, user.id));
  switch (body.action) {
    case "online": {
      if (h.status !== "active") throw new ApiError("not_active", "You can go online once your application is approved and training is complete.");
      await upd({ online: !!body.online }); return { ok: true };
    }
    case "rush": { await upd({ rushOptIn: !!body.on }); return { ok: true }; }
    case "apply_step": {
      const s = Number(body.step), d = body.data ?? {};
      if (!["applied", "review"].includes(h.status) && h.status !== "applied") throw new ApiError("locked", "Your application is already submitted.");
      const application = { ...h.application, [`step${s}`]: d };
      if (s === 1) {
        const a = age(String(d.dob));
        if (a < 18) throw new ApiError("under_18", a < 0 ? "Enter a valid date of birth." : "You must be 18 or older to join Shell.");
        if (String(d.name ?? "").trim().length < 2) throw new ApiError("invalid", "Please enter your name.");
        if (!d.languages?.length) throw new ApiError("invalid", "Pick at least one language.");
        await db.update(users).set({ name: String(d.name).trim().slice(0, 80) }).where(eq(users.id, user.id));
        await upd({ dob: d.dob, gender: ["female", "male", "unspecified"].includes(d.gender) ? d.gender : "unspecified", college: String(d.college ?? "").slice(0, 100), occupation: String(d.occupation ?? "student"), languages: d.languages, application, applicationStep: Math.max(h.applicationStep, 2) });
      } else if (s === 2) { await upd({ kycStatus: "verified", kycReference: "kyc_" + Math.random().toString(36).slice(2, 12), application, applicationStep: Math.max(h.applicationStep, 3) }); }
      else if (s === 3) { await upd({ collegeIdStatus: "submitted", application, applicationStep: Math.max(h.applicationStep, 4) }); }
      else if (s === 4) { await upd({ livenessStatus: "verified", application, applicationStep: Math.max(h.applicationStep, 5) }); }
      else if (s === 5) { if (!d.categories?.length) throw new ApiError("invalid", "Pick at least one category."); await upd({ categories: d.categories, bio: String(d.bio ?? "").slice(0, 300), application, applicationStep: Math.max(h.applicationStep, 6) }); }
      else if (s === 6) { await upd({ availability: d.availability ?? {}, radiusM: Math.max(500, Math.min(10000, Number(d.radiusM) || 3000)), application, applicationStep: Math.max(h.applicationStep, 7) }); }
      else if (s === 7) {
        if (!d.agree) throw new ApiError("invalid", "Please accept the Helper Agreement and Safety Policy.");
        if (!/^[\w.\-]{2,}@[a-z]{2,}$/i.test(String(d.upi ?? ""))) throw new ApiError("invalid", "Enter a valid UPI ID, for example name@bank.");
        await upd({ payoutAccountRef: "upi_" + Math.random().toString(36).slice(2, 8), status: "review", application: { ...application, step7: { agree: true } }, applicationStep: 8 });
        await notifyOps("helper_application", "New helper application", user.name || user.phone, "/ops/helpers");
      }
      return { ok: true };
    }
    case "training_done": {
      const mod = String(body.module); const t = (TRAINING as any)[mod]; if (!t) throw new ApiError("invalid", "Unknown module.");
      const score = Number(body.score);
      if (score < 0.8) throw new ApiError("failed", "You need at least 80% to pass. Review the cards and try again.");
      const done = [...new Set([...h.trainingDone, mod])];
      const patch: Partial<typeof helperProfiles.$inferInsert> = { trainingDone: done };
      if (mod === "safety") { patch.safetyTrainingPassedAt = new Date(); patch.trainingStatus = "passed"; if (h.status === "training") patch.status = "active"; }
      await upd(patch); return { ok: true, activated: mod === "safety" && h.status === "training" };
    }
    case "payout": { return { ok: true, ...(await instantPayout(user.id)) }; }
    case "appeal": {
      await db.update(strikes).set({ appealStatus: "submitted" }).where(and(eq(strikes.id, String(body.id)), eq(strikes.helperId, user.id)));
      await notifyOps("appeal", "Strike appeal submitted", user.name, "/ops/helpers"); await audit(user.id, "strike.appeal", "strike", String(body.id)); return { ok: true };
    }
    default: throw new ApiError("unknown_action", "Unknown action.");
  }
});
