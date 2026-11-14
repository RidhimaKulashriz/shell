import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { circles } from "@/db/schema";
import { activePricing } from "@/lib/data";
import { circleDiscount } from "@/lib/pricing";
import { inr, fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shell Circle invite" };

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const [c] = await db.select().from(circles).where(eq(circles.inviteCode, (await params).code)).limit(1);
  if (!c) notFound();
  const cfg = await activePricing();
  return (
    <main id="main" className="grid min-h-screen place-items-center bg-cream p-6">
      <div className="receipt scallop-b max-w-sm text-center"><div className="mono text-xs">SHELL CIRCLE</div><h1 className="display mt-2 text-3xl" style={{ fontFamily: "var(--font-display)" }}>{c.title}</h1><p className="mono mt-1 text-sm">{fmtDateTime(c.windowStart)}</p><div className="perf" /><p>{c.currentFlats} of {c.maxFlats} flats joined. Price per flat: <b>{inr(Math.round(c.basePrice * (1 - circleDiscount(Math.max(c.currentFlats + 1, 1), cfg))))}</b> when you join.</p><Link href="/app/login" className="btn btn-sun mt-4">Log in to join</Link></div>
    </main>
  );
}
