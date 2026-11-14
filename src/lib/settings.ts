import { db } from "@/db";
import { settings, pricingConfigs, auditLog } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { DEFAULT_PRICING, type PricingConfig } from "./pricing";

export async function getPricing(): Promise<PricingConfig> {
  const [row] = await db.select().from(pricingConfigs).orderBy(desc(pricingConfigs.version)).limit(1);
  return row ? ({ ...DEFAULT_PRICING, ...(row.data as Partial<PricingConfig>), version: row.version } as PricingConfig) : DEFAULT_PRICING;
}

export const DEFAULT_FLAGS = {
  human_review: false, // production: true. Ops reviews every plan before the customer sees it.
  geofence_enforced: false, // production: true. Check-in only within 150 m of the address.
  demo_mode: true, // shows demo controls so one person can walk the full flow
  auto_dispatch: true,
  rush_enabled: true,
  circles_enabled: true,
  sound_effects: false,
};
export type Flags = typeof DEFAULT_FLAGS;

export async function getSetting<T>(key: string, def: T): Promise<T> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return row ? (row.value as T) : def;
}
export async function setSetting(key: string, value: unknown) {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}
export async function getFlags(): Promise<Flags> {
  return { ...DEFAULT_FLAGS, ...(await getSetting<Partial<Flags>>("flags", {})) };
}
export async function audit(actorId: string | null, action: string, entity: string, entityId: string, before?: unknown, after?: unknown, ip?: string) {
  await db.insert(auditLog).values({ actorId, action, entity, entityId, before: before ?? null, after: after ?? null, ip: ip ?? null });
}
