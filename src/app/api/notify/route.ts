import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { notifyRequests } from "@/db/schema";

const BodySchema = z.object({
  phone: z.string().min(10).max(15),
  serviceSlug: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());
    await db
      .insert(notifyRequests)
      .values({ phone: body.phone.trim(), serviceSlug: body.serviceSlug })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true, message: "We will notify you." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to save notification request" },
      { status: 500 }
    );
  }
}
