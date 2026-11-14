import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/server";

export const dynamic = "force-dynamic";

const body = z.object({
  name: z.string().max(60),
  path: z.string().max(200).optional(),
  props: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().max(40).optional(),
});

// First-party event sink (PostHog is added in Phase 1 behind the same track()).
// The client only calls this after cookie consent.
export async function POST(req: Request) {
  if (!rateLimit(`ev:${clientIp(req)}`, 200, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ ok: false }, { status: 400 });
  await db.insert(analyticsEvents).values({ name: p.data.name, path: p.data.path, props: p.data.props ?? {}, sessionId: p.data.sessionId });
  return NextResponse.json({ ok: true });
}
