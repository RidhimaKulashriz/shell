"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Receipt } from "@/components/ui";
import { quote, type Size } from "@/lib/pricing";
import { inr, minutesToText } from "@/lib/format";
import type { CatalogTpl } from "@/components/home/HeroComposer";
import { Meter } from "@/components/ui";
import type { PricingConfig } from "@/lib/pricing";

export type PackItem = { template: string; qty: number; size?: string; offsetHours: number; label: string };

export function PackCustomise({ slug, name, items, catalog, config }: { slug: string; name: string; items: PackItem[]; catalog: CatalogTpl[]; config: PricingConfig }) {
  const [on, setOn] = useState<Record<number, boolean>>(Object.fromEntries(items.map((_, i) => [i, true])));
  const [qty, setQty] = useState<Record<number, number>>(Object.fromEntries(items.map((it, i) => [i, it.qty])));
  const q = useMemo(() => quote({ managed: true, config, lines: items.flatMap((it, i) => { const t = catalog.find((c) => c.slug === it.template); return on[i] && t ? [{ template: t, qty: qty[i], size: (it.size ?? "medium") as Size }] : []; }) }), [on, qty, items, catalog, config]);
  return (
    <div className="grid items-start gap-8 md:grid-cols-[1fr_1.1fr]">
      <div className="space-y-2">
        <h3 className="display text-2xl">Customise it</h3>
        {items.map((it, i) => (
          <div key={it.label} className={`flex items-center gap-3 rounded-2xl border-2 border-ink p-3 ${on[i] ? "bg-paper" : "bg-cream opacity-60"}`}>
            <input type="checkbox" className="h-5 w-5" checked={on[i]} onChange={() => setOn({ ...on, [i]: !on[i] })} aria-label={`Include ${it.label}`} />
            <span className="flex-1 font-semibold">{it.label}<span className="mono block text-xs font-normal opacity-60">T{it.offsetHours > 0 ? "+" : "-"}{Math.abs(it.offsetHours)}h</span></span>
            <span className="flex items-center rounded-full border-2 border-ink"><button aria-label="Less" className="h-8 w-8" onClick={() => setQty({ ...qty, [i]: Math.max(1, qty[i] - 1) })}>−</button><span className="mono w-5 text-center">{qty[i]}</span><button aria-label="More" className="h-8 w-8" onClick={() => setQty({ ...qty, [i]: Math.min(10, qty[i] + 1) })}>+</button></span>
          </div>
        ))}
      </div>
      <div>
        <Receipt key={JSON.stringify(on) + JSON.stringify(qty)} title={name} meta="Live estimate" animate={false} lines={q.lines.map((l) => ({ name: l.name, qty: l.qty > 1 ? String(l.qty) : undefined, price: inr(l.price), stamp: true }))} fees={[{ name: "Platform fee", price: inr(q.platformFee) }, ...(q.coordinationFee ? [{ name: "Coordination fee", price: inr(q.coordinationFee) }] : []), ...(q.minOrderTopUp ? [{ name: "Minimum order top-up", price: inr(q.minOrderTopUp) }] : [])]} total={<span className="flex items-baseline gap-1"><Meter value={q.range[0] / 100} prefix="₹" /><span className="text-xs">to</span><Meter value={q.range[1] / 100} prefix="₹" /></span>} totalLabel="ESTIMATE" footer={`About ${minutesToText(q.minutes)} of work. Shell Guarantee included.`} />
        <div className="mt-4 flex flex-wrap gap-3"><Link href={`/app?pack=${slug}`} className="btn btn-sun" data-cta="pack_order">Order this pack</Link><Link href={`/waitlist?text=${encodeURIComponent(name)}`} className="btn btn-ghost">Not in my society yet</Link></div>
      </div>
    </div>
  );
}
