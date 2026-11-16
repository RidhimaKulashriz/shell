import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { taskTemplates } from "@/db/schema";

const BOOKABLE_SLUGS = new Set([
  "bathroom-cleaning",
  "utensils",
  "errands",
  "parcel-pickup",
]);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const rows = await db
      .select()
      .from(taskTemplates)
      .where(
        category && category !== "all"
          ? eq(taskTemplates.categorySlug, category)
          : undefined
      )
      .orderBy(asc(taskTemplates.displayOrder));

    const services = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.nameEn,
      category: r.categorySlug,
      price: Math.round(r.baseRate / 100),
      unit: r.unit,
      bookable: BOOKABLE_SLUGS.has(r.slug),
    }));

    return NextResponse.json({ services });
  } catch (err) {
    console.error("GET /api/services error:", err);
    return NextResponse.json(
      { error: "Failed to load services" },
      { status: 500 }
    );
  }
}
