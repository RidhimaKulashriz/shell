import { route, ApiError } from "@/lib/api";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { z } from "zod";
const schema = z.object({ kind: z.enum(["contact", "society", "business", "helper"]).default("contact"), name: z.string().trim().min(2, "Please enter your name.").max(100), email: z.string().email("Enter a valid email.").optional().or(z.literal("")), phone: z.string().max(20).optional(), message: z.string().max(1500).optional().default(""), meta: z.record(z.string(), z.string().max(200)).optional().default({}) });
export const POST = route({ limit: [5, 60000] }, async ({ body }) => {
  const p = schema.safeParse(body);
  if (!p.success) throw new ApiError("invalid", p.error.issues[0].message);
  await db.insert(inquiries).values({ ...p.data, email: p.data.email || null });
  return { ok: true };
}, true);
