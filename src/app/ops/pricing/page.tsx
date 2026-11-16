import { desc } from "drizzle-orm";
import { db } from "@/db";
import { pricingConfigs, promoCodes } from "@/db/schema";
import { PricingEditor } from "@/components/ops/Actions";
import { H1, Table } from "@/components/ops/ui";
import { activePricing } from "@/lib/data";
import { fmtDateTime, inr } from "@/lib/format";

export const metadata = { title: "Pricing engine" };

export default async function Page() {
  const [cfg, hist, promos] = await Promise.all([activePricing(), db.select().from(pricingConfigs).orderBy(desc(pricingConfigs.version)), db.select().from(promoCodes)]);
  return (
    <div className="space-y-5"><H1 sub="Versioned and editable without a deploy. Every change needs a reason and is logged.">Pricing engine (live v{cfg.version})</H1>
      <Table cols={["Setting", "Value"]} rows={[["Minimum order", inr(cfg.minOrder)], ["Fee floor / percent", `${inr(cfg.feeFloor)} / ${(cfg.feePercent * 100).toFixed(1)}%`], ["Coordination fee", `${inr(cfg.coordinationFee)} at ${cfg.coordinationMinTasks}+ tasks`], ["Urgency", `normal 1.0 · same-day ${cfg.urgency.same_day} · rush ${cfg.urgency.rush}`], ["Circle curve", cfg.circleCurve.map((c) => `${c.flats}:${Math.round(c.discount * 100)}%`).join("  ")], ["Commission by level", Object.entries(cfg.commissionPct).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join("  ")], ["Surge", `festival x${cfg.surge.festival} · late night x${cfg.surge.lateNight}`], ["GST", `${cfg.gstPct * 100}%`]]} />
      <PricingEditor cfg={cfg} />
      <section><h2 className="display text-xl">History</h2><Table cols={["Version", "Effective", "Reason"]} rows={hist.map((h) => [`v${h.version}`, fmtDateTime(h.effectiveFrom), h.reason])} /></section>
      <section><h2 className="display text-xl">Promo codes</h2><Table cols={["Code", "Discount", "Used", "Stackable"]} rows={promos.map((p) => [p.code, p.percent ? `${p.percent}%` : inr(p.flat), `${p.used}/${p.maxUses}`, p.stackable ? "yes" : "no"])} /></section></div>
  );
}
