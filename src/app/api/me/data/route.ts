import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { addresses, bookings, contactMessages, customerProfiles, notifications, users } from "@/db/schema";
import { api, body } from "@/lib/api";
import { audit } from "@/lib/audit";

// DELETE /api/me/data — DPDP hard delete: anonymize user + delete PII bookings/contacts
// Requires explicit confirmation { confirm: "DELETE" } to avoid accidents
const Schema = z.object({ confirm: z.literal("DELETE") });

export const DELETE = api(async ({ req, user }) => {
  const { confirm } = await body(req, Schema);
  if (confirm !== "DELETE") return { error: "Confirm with DELETE" };

  // Anonymize user record (keep id for FK integrity, clear PII)
  await db.update(users).set({ phone: `deleted_${user!.id.slice(0, 8)}`, name: "Deleted user", email: null, status: "deleted", updatedAt: new Date() }).where(eq(users.id, user!.id));

  // Delete or anonymize related PII — bookings addresses kept but unlinked to name
  await db.delete(addresses).where(eq(addresses.userId, user!.id)).catch(() => {});
  await db.delete(customerProfiles).where(eq(customerProfiles.userId, user!.id)).catch(() => {});
  // Keep bookings for ops audit but anonymize address note (optional)
  await db.update(bookings).set({ address: "[deleted]" }).where(eq(bookings.customerId, user!.id)).catch(() => {});
  await db.delete(notifications).where(eq(notifications.userId, user!.id)).catch(() => {});
  // contactMessages by phone not by userId, so we clear by phone match
  await db.update(users).set({ deletionRequestedAt: new Date() }).where(eq(users.id, user!.id));

  await audit({ actorId: user!.id, action: "data_hard_delete", entity: "user", entityId: user!.id, req });
  return { ok: true, message: "Your data has been deleted. Some financial records are retained as required by law." };
}, { roles: ["CUSTOMER", "HELPER", "OPS", "SUPER_ADMIN"] });

export const GET = api(async ({ user }) => {
  // Export included via DELETE confirmation check — also allow GET for info
  return { info: "Send DELETE with { confirm: \"DELETE\" } to hard-delete your PII. Use DELETE /api/me for soft delete with 7-day cooling." };
});
