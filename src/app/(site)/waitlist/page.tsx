import { WaitlistForm, SocietyFinder } from "@/components/home";
import { db } from "@/db";
import { societies } from "@/db/schema";
import { hexCells, societySearch, publicStats } from "@/lib/stats";
export const metadata = { title: "Join the waitlist", description: "Join the Shell waitlist and move up by inviting neighbours." };
export const dynamic = "force-dynamic";
export default async function Waitlist({ searchParams }: { searchParams: Promise<{ need?: string; society?: string; ref?: string }> }) {
  const sp = await searchParams;
  const [socs, cells, initial, stats] = await Promise.all([db.select({ n: societies.name }).from(societies), hexCells(), societySearch(""), publicStats()]);
  return (
    <>
      <section className="grain bg-cream/50 py-12 md:py-16"><div className="mx-auto grid max-w-6xl gap-10 px-5 md:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div><h1 className="text-4xl font-semibold text-tide md:text-5xl">Be first in line.</h1>
          <p className="mt-4 max-w-md text-ink/70">We open one society at a time. Tell us where you live and what you need, and we&apos;ll message you on WhatsApp as soon as Shell reaches you.</p>
          <ul className="mt-6 space-y-2 text-sm"><li>✓ Verified by a WhatsApp code</li><li>✓ Each neighbour you refer moves you up 5 places</li><li>✓ Referral credit at launch</li></ul>
          <p className="mt-6 text-sm text-ink/60">{stats.waiting} neighbours are already waiting.</p></div>
        <WaitlistForm societies={socs.map((s) => s.n)} prefill={sp} />
      </div></section>
      <section className="bg-forest py-16 text-cream"><div className="mx-auto max-w-6xl px-5 md:px-8"><h2 className="mb-6 text-3xl font-semibold">Neighbours waiting near you</h2><SocietyFinder cells={cells} initial={initial} /></div></section>
    </>
  );
}
