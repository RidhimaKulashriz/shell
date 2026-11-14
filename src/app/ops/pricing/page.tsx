import { db } from "@/db";
import { pricingConfigs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getPricing } from "@/lib/settings";
import { PricingEditor } from "@/components/ops";
import { fmtDateTime } from "@/lib/utils";
export const metadata = { title: "Ops: Pricing" };
export default async function Page() {
  const cfg = await getPricing(); const hist = await db.select().from(pricingConfigs).orderBy(desc(pricingConfigs.version)).limit(10);
  return (<div className="space-y-6"><h1 className="text-3xl font-semibold text-tide">Pricing engine</h1><p className="text-ink/60">Changes are versioned, need a reason and apply to new plans only. Task base rates are in the Catalog.</p><PricingEditor cfg={cfg} />
    <section><h2 className="mb-2 text-xl font-semibold">Version history</h2><div className="card divide-y divide-line text-sm">{hist.map((h) => <div key={h.id} className="flex justify-between p-3"><span><strong>v{h.version}</strong> · {h.reason}</span><span className="text-ink/50">{fmtDateTime(h.effectiveFrom)}</span></div>)}</div></section>
    <section className="card p-4 text-sm"><h2 className="font-semibold">Circle discount curve</h2><p className="text-ink/60">{cfg.circleCurve.map((c) => `${c.joiners} flat${c.joiners > 1 ? "s" : ""}: ${Math.round(c.discount * 100)}%`).join(" · ")} (capped at {Math.round(cfg.circleMaxDiscount * 100)}%)</p><p className="mt-2 text-ink/60">Promo codes: {Object.entries(cfg.promos).map(([k, v]) => `${k} (${v.label})`).join(", ")}</p></section></div>);
}
