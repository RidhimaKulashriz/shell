import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { addresses, customerProfiles, helpers, trustedContacts, users } from "@/db/schema";
import { api, body } from "@/lib/api";
import { audit } from "@/lib/audit";

export const GET = api(async ({ user }) => {
  if (!user) return { user: null };
  const [profile] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user.id)).limit(1);
  const addrs = await db.select().from(addresses).where(eq(addresses.userId, user.id));
  const [helper] = await db.select().from(helpers).where(eq(helpers.userId, user.id)).limit(1);
  return { user: { id: user.id, name: user.name, phone: user.phone, role: user.role, language: user.language }, profile, addresses: addrs, helper: helper ?? null };
});

const atlas = z.object({ household: z.number().int().min(1).max(20).optional(), kids: z.boolean().optional(), pets: z.array(z.object({ type: z.string().max(60), temperament: z.string().max(120) })).max(5).optional(), allergies: z.string().max(300).optional(), keyHandling: z.enum(["home", "guard", "lockbox"]).optional(), doNotTouch: z.array(z.object({ text: z.string().max(120), room: z.string().max(40).optional() })).max(20).optional(), helperGender: z.enum(["any", "female"]).optional(), helperLanguage: z.string().max(30).optional(), rooms: z.array(z.string().max(30)).max(12).optional() });

export const PATCH = api(async ({ req, user }) => {
  const b = await body(req, z.object({ name: z.string().trim().min(1).max(80).optional(), language: z.enum(["en", "hi", "hinglish"]).optional(), atlas: atlas.optional(), quietStart: z.number().int().min(0).max(23).optional(), quietEnd: z.number().int().min(0).max(23).optional(), holidayMode: z.boolean().optional(), consentLocation: z.boolean().optional(), consentWhatsapp: z.boolean().optional(), trustedContact: z.object({ name: z.string().max(60), phone: z.string().max(20) }).optional() }));
  if (b.name || b.language || b.consentLocation !== undefined || b.consentWhatsapp !== undefined) {
    await db.update(users).set({ ...(b.name ? { name: b.name } : {}), ...(b.language ? { language: b.language } : {}), ...(b.consentLocation !== undefined ? { consentLocation: b.consentLocation ? new Date() : null } : {}), ...(b.consentWhatsapp !== undefined ? { consentWhatsapp: b.consentWhatsapp ? new Date() : null } : {}), updatedAt: new Date() }).where(eq(users.id, user!.id));
  }
  const [p] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user!.id)).limit(1);
  if (p) await db.update(customerProfiles).set({ ...(b.atlas ? { homeAtlas: { ...p.homeAtlas, ...b.atlas }, helperGenderPreference: b.atlas.helperGender ?? p.helperGenderPreference } : {}), ...(b.quietStart !== undefined ? { quietStart: b.quietStart } : {}), ...(b.quietEnd !== undefined ? { quietEnd: b.quietEnd } : {}), ...(b.holidayMode !== undefined ? { holidayMode: b.holidayMode } : {}), updatedAt: new Date() }).where(eq(customerProfiles.userId, user!.id));
  if (b.trustedContact) await db.insert(trustedContacts).values({ userId: user!.id, ...b.trustedContact });
  return { ok: true };
}, { roles: ["CUSTOMER", "HELPER"] });

/** DPDP: delete-my-data request with a 7-day cooling period, and a data export. */
export const DELETE = api(async ({ req, user }) => {
  await db.update(users).set({ deletionRequestedAt: new Date() }).where(eq(users.id, user!.id));
  await audit({ actorId: user!.id, action: "deletion_requested", entity: "user", entityId: user!.id, req });
  return { ok: true, effectiveAfter: new Date(Date.now() + 7 * 86400000).toISOString() };
}, { roles: ["CUSTOMER", "HELPER"] });
