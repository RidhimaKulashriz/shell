import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { Estimator } from "@/components/Estimator";
import { Faq, PageHero, Section } from "@/components/site/Bits";
import { catalogForClient } from "@/lib/site-data";
import { activePricing } from "@/lib/data";
import { meta } from "@/lib/seo";
import { inr } from "@/lib/format";

export const metadata = meta({ title: "Pricing and estimator", description: "Task time x rate + travel + fees. Build an estimate with the interactive estimator and see platform and coordination fees as separate lines.", path: "/pricing" });

export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const sp = await searchParams;
  const [catalog, config, f] = await Promise.all([catalogForClient(), activePricing(), db.select().from(faqs).where(eq(faqs.scope, "pricing")).orderBy(asc(faqs.displayOrder))]);
  return (
    <>
      <PageHero eyebrow="koi hidden charge nahi" title="Price kaise" em="banta hai." sub="Task time x rate, plus travel (zero inside the society), plus a platform fee, plus a coordination fee on bigger plans. Everything shows as its own line." />
      <Section tone="paper">
        <div className="grid gap-4 md:grid-cols-4">
          {[["Task price", "base rate x quantity x size"], ["Urgency", "same-day x1.2, Rush x1.5"], ["Platform fee", `max(${inr(config.feeFloor)}, ${Math.round(config.feePercent * 100)}% of subtotal)`], ["Coordination", `${inr(config.coordinationFee)} for ${config.coordinationMinTasks}+ tasks or Managed`]].map(([t, d], i) => <div key={t} className="rounded-2xl border-2 border-ink bg-cream p-4" style={{ transform: `rotate(${[-1, 0.7, -0.5, 1][i]}deg)` }}><b className="display text-xl">{t}</b><p className="mono mt-1 text-sm">{d}</p></div>)}
        </div>
        <p className="mt-6 max-w-3xl">Minimum order is {inr(config.minOrder)}. Neighbours who join a Shell Circle lower everyone&apos;s price: up to {Math.round(Math.max(...config.circleCurve.map((c) => c.discount)) * 100)}% off per flat. Tips go 100% to the helper.</p>
      </Section>
      <Section tone="cream"><h2 className="display mb-8 text-4xl md:text-5xl">Estimator</h2><Estimator catalog={catalog} config={config} initial={sp.t?.split(",") ?? []} /></Section>
      <Section tone="dark">
        <div className="grid gap-10 md:grid-cols-2">
          <div><h2 className="display text-4xl md:text-5xl">Shell Guarantee</h2><ul className="mt-6 space-y-3 text-lg">{["Rework within 24 hours, free, once", "Damage cover up to a set limit, with photo evidence", "Refund rules in plain words: partial refund for partial work", "We hold your money until you approve, or two hours after completion", "Benefits like these exist only for jobs done inside Shell"].map((x) => <li key={x} className="flex gap-3"><span className="text-sand">+</span>{x}</li>)}</ul></div>
          <div className="receipt text-ink"><h3 className="display text-xl">Khud karoge to?</h3><div className="perf" />{[["Full home clean, yourself", "about 4 hours"], ["Groceries trip", "about 1.5 hours"], ["Wardrobe sort", "about 3 hours"], ["Decoration setup", "about 2.5 hours"]].map(([a, b]) => <div key={a} className="receipt-line"><span>{a}</span><span className="leader" /><span>{b}</span></div>)}<div className="perf" /><div className="flex justify-between font-bold"><span>Your Saturday</span><span>~11 hours</span></div></div>
        </div>
      </Section>
      <Section tone="paper"><h2 className="display mb-6 text-4xl">Pricing FAQ</h2><Faq items={f.map((x) => ({ q: x.q, a: x.a }))} /></Section>
    </>
  );
}
