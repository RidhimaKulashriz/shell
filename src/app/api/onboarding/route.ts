import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { addresses, customerProfiles, towers } from "@/db/schema";
import { api, body, need } from "@/lib/api";
import { latLngToHex } from "@/lib/geo";

export const POST = api(async ({ req, user }) => {
  const b = await body(req, z.object({ societyId: z.string().uuid(), towerId: z.string().uuid(), floor: z.number().int().min(0).max(60), flat: z.string().trim().min(1).max(12), landmark: z.string().max(160).optional(), entryNotes: z.string().max(300).optional() }));
  const [t] = await db.select().from(towers).where(eq(towers.id, b.towerId)).limit(1);
  need(t, "Tower");
  const [a] = await db.insert(addresses).values({ userId: user!.id, societyId: b.societyId, towerId: b.towerId, floor: b.floor, flat: b.flat, landmark: b.landmark ?? "", entryNotes: b.entryNotes ?? "", lat: t.lat, lng: t.lng, hex8: latLngToHex(t.lat, t.lng, 8), hex9: latLngToHex(t.lat, t.lng, 9), verificationMethod: "pending" }).returning();
  await db.update(customerProfiles).set({ societyId: b.societyId }).where(eq(customerProfiles.userId, user!.id));
  return { ok: true, addressId: a.id };
}, { roles: ["CUSTOMER"] });
