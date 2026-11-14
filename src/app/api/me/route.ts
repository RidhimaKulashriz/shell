import { route, ApiError } from "@/lib/api";
import { db } from "@/db";
import { users, customerProfiles, addresses, towers, notifications } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { audit } from "@/lib/settings";

export const POST = route({}, async ({ body, user }) => {
  switch (body.action) {
    case "onboard": {
      const name = String(body.name ?? "").trim().slice(0, 80);
      if (name.length < 2) throw new ApiError("invalid", "Please enter your name.");
      const [tw] = await db.select().from(towers).where(eq(towers.id, String(body.towerId)));
      if (!tw) throw new ApiError("invalid", "Please choose your tower.");
      const floor = Math.max(0, Math.min(tw.floors, Number(body.floor) || 1)); const flat = String(body.flat ?? "").trim().slice(0, 12);
      if (!flat) throw new ApiError("invalid", "Please enter your flat number.");
      await db.update(users).set({ name, societyId: tw.societyId, consentLocation: true, consentWhatsapp: true, updatedAt: new Date() }).where(eq(users.id, user.id));
      await db.insert(addresses).values({ userId: user.id, societyId: tw.societyId, towerId: tw.id, floor, flat, landmark: String(body.landmark ?? "").slice(0, 120), lat: tw.lat, lng: tw.lng, entryNotes: String(body.entryNotes ?? "").slice(0, 300), verifiedAt: new Date(), verificationMethod: "self_declared_demo" });
      return { ok: true };
    }
    case "atlas": {
      const a = body.atlas ?? {};
      await db.update(customerProfiles).set({ atlas: { household: Number(a.household) || undefined, kids: !!a.kids, pets: String(a.pets ?? "").slice(0, 100), allergies: String(a.allergies ?? "").slice(0, 100), keyHandling: ["home", "guard", "lockbox"].includes(a.keyHandling) ? a.keyHandling : undefined, doNotTouch: String(a.doNotTouch ?? "").slice(0, 300), rooms: Array.isArray(a.rooms) ? a.rooms.slice(0, 12) : [] }, helperGenderPref: body.helperGenderPref === "female" ? "female" : "any", updatedAt: new Date() }).where(eq(customerProfiles.userId, user.id));
      return { ok: true };
    }
    case "profile": {
      await db.update(users).set({ name: String(body.name ?? user.name).slice(0, 80), email: body.email ? String(body.email).slice(0, 120) : null, updatedAt: new Date() }).where(eq(users.id, user.id));
      return { ok: true };
    }
    case "trusted": {
      await db.update(customerProfiles).set({ trustedContact: body.name && body.phone ? { name: String(body.name).slice(0, 60), phone: String(body.phone).slice(0, 15) } : null }).where(eq(customerProfiles.userId, user.id));
      return { ok: true };
    }
    case "delete": {
      await db.update(users).set({ deletionRequestedAt: new Date() }).where(eq(users.id, user.id));
      await audit(user.id, "account.delete_requested", "user", user.id);
      return { ok: true, message: "Your account will be deleted after a 7-day cooling-off period. Sign in any time before then to cancel." };
    }
    case "cancel_delete": { await db.update(users).set({ deletionRequestedAt: null }).where(eq(users.id, user.id)); return { ok: true }; }
    case "read_notifications": { await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt))); return { ok: true }; }
    default: throw new ApiError("unknown_action", "Unknown action.");
  }
});
