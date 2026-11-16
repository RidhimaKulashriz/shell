import { z } from "zod";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { api, body } from "@/lib/api";

const schema = z.object({ event: z.string().max(60), props: z.record(z.string(), z.unknown()).optional(), path: z.string().max(200).optional() });

export const POST = api(async ({ req, user }) => {
  const b = await body(req, schema);
  await db.insert(analyticsEvents).values({ event: b.event, props: b.props ?? {}, path: b.path ?? null, userId: user?.id ?? null });
  return { ok: true };
}, { limit: { key: "events", max: 240, windowMs: 60000 } });
