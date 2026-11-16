import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { promoCodes } from "@/db/schema";

const BodySchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().nonnegative(),
});

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());
    const code = body.code.trim().toUpperCase();

    const [promo] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, code))
      .limit(1);

    if (!promo || (promo.expiresAt && promo.expiresAt < new Date()) || promo.used >= promo.maxUses) {
      return NextResponse.json(
        { error: "Invalid or expired coupon code" },
        { status: 404 }
      );
    }

    const discount =
      promo.percent > 0
        ? Math.round((body.subtotal * promo.percent) / 100)
        : Math.min(Math.round(promo.flat / 100), body.subtotal);

    return NextResponse.json({ valid: true, code: promo.code, discount });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
