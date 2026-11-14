import { NextResponse } from "next/server";
import { getSocieties, getStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const [stats, societies] = await Promise.all([getStats(), getSocieties()]);
  return NextResponse.json({ stats, societies });
}
