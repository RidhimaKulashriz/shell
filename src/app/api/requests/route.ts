import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { addresses, requests } from "@/db/schema";
import { api, body } from "@/lib/api";
import { clarifyingQuestions, draftRequest, annotatePhoto } from "@/lib/plan-engine";
import { latLngToHex } from "@/lib/geo";
import { scanMessage } from "@/lib/leakage";
import { logEvent } from "@/lib/plans";

const schema = z.object({ text: z.string().trim().min(3, "Please write something").max(2000), voiceTranscript: z.string().max(2000).optional(), photos: z.array(z.object({ url: z.string().max(400000), caption: z.string().max(200).optional() })).max(5).default([]), deadlineAt: z.string().datetime().optional(), urgency: z.enum(["normal", "same_day", "rush"]).default("normal"), language: z.string().default("en") });

export const POST = api(async ({ req, user }) => {
  const b = await body(req, schema);
  const [addr] = await db.select().from(addresses).where(eq(addresses.userId, user!.id)).orderBy(desc(addresses.createdAt)).limit(1);
  const scan = scanMessage(b.text);
  const text = scan.hit ? scan.redacted : b.text; // never let contact details ride in on a request
  const draft = await draftRequest(text, b.photos.length);
  const questions = clarifyingQuestions(draft);
  const photos = b.photos.map((p, i) => ({ ...p, circles: annotatePhoto(p.url.slice(-24) + i).map((c) => ({ x: c.x, y: c.y, label: c.label })) }));
  const [r] = await db.insert(requests).values({ customerId: user!.id, addressId: addr?.id ?? null, rawText: text, transcript: b.voiceTranscript ?? null, language: b.language, photos, deadlineAt: b.deadlineAt ? new Date(b.deadlineAt) : null, urgency: b.urgency, status: questions.length ? "clarifying" : "in_review", draft, questions, slaDueAt: new Date(Date.now() + 15 * 60000), hex8: addr?.lat ? latLngToHex(addr.lat, addr.lng!, 8) : null }).returning();
  await logEvent(null, null, "request_created", { requestId: r.id });
  return { id: r.id, status: r.status, needsHuman: draft.needsHuman, banned: draft.banned };
}, { roles: ["CUSTOMER"], limit: { key: "requests", max: 30, windowMs: 600000 } });

export const GET = api(async ({ user }) => ({ requests: await db.select().from(requests).where(eq(requests.customerId, user!.id)).orderBy(desc(requests.createdAt)).limit(30) }), { roles: ["CUSTOMER"] });
