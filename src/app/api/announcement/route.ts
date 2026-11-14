import { NextResponse } from "next/server";
import { getAnnouncement } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const a = await getAnnouncement().catch(() => null);
  return NextResponse.json({ announcement: a });
}
