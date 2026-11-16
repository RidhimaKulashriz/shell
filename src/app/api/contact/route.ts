import { z } from "zod";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { api, body } from "@/lib/api";

const schema = z.object({
  kind: z.enum(["contact", "society", "b2b", "careers", "callback", "notify"]),
  name: z.string().trim().min(2, "Please enter your name").max(100),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email("Please enter a valid email").max(120).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const POST = api(async ({ req }) => {
  const b = await body(req, schema);
  await db.insert(contactMessages).values({ kind: b.kind === "notify" ? "contact" : b.kind, name: b.name, phone: b.phone || null, email: b.email || null, message: b.message ?? "", data: { ...(b.data ?? {}), originalKind: b.kind } });
  return { ok: true };
}, { limit: { key: "contact", max: 6, windowMs: 600000 } });
