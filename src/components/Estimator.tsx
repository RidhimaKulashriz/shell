"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Receipt, Meter } from "@/components/ui";
import { circleSavings, quote, type PricingConfig, type Size, type Urgency } from "@/lib/pricing";
import { inr, minutesToText } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { CatalogTpl } from "@/components/home/HeroComposer";

const ICON: Record<string, string> = { "clean-room": "broom", "clean-kitchen": "pan", "clean-bathroom": "broom", "clean-full-home": "home", "clean-balcony": "plant", utensils: "pan", groceries: "cart", errand: "scooter", "parcel-pickup": "parcel", "wardrobe-organise": "hanger", decoration: "balloon", "event-help": "cake", "excel-help": "laptop", tutoring: "book", "pet-walk": "dog", "moving-help": "box", "small-repairs": "wrench", queueing: "queue", "sports-partner": "ball", "gaming-partner": "gamepad" };

type Sel = { slug: string; qty: number; size: Size };

/** price = (base_rate x qty x size_factor) summed, x urgency x (1 - circle discount), + travel + platform fee + coordination, with a minimum order. Config is editable in /ops/pricing. */
export function Estimator({ catalog, config, initial = [] }: { catalog: CatalogTpl[]; config: PricingConfig; initial?: string[] }) {
  const [sel, setSel] = useState<Sel[]>(initial.filter((s) => catalog.some((c) => c.slug === s)).map((slug) => ({ slug, qty: 1, size: "medium" })));
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const [joiners, setJoiners] = useState(1);
  const used = useRef(false);
  const toggle = (slug: string) => setSel((s) => (s.some((x) => x.slug === slug) ? s.filter((x) => x.slug !== slug) : [...s, { slug, qty: 1, size: "medium" }]));
  const patch = (slug: string, p: Partial<Sel>) => setSel((s) => s.map((x) => (x.slug === slug ? { ...x, ...p } : x)));
  const q = useMemo(() => quote({ lines: sel.flatMap((s) => { const t = catalog.find((c) => c.slug === s.slug); return t ? [{ template: t, qty: s.qty, size: s.size }] : []; }), urgency, circleJoiners: joiners, config }), [sel, urgency, joiners, catalog, config]);
  useEffect(() => { if (sel.length && !used.current) { used.current = true; track("estimator_used"); } }, [sel]);
  const curve = circleSavings(q.subtotal, config);
  const fees = [
    ...(q.urgencyMultiplier !== 1 ? [{ name: `Urgency x${q.urgencyMultiplier}`, price: "+" + inr(Math.round(q.subtotal * (q.urgencyMultiplier - 1))) }] : []),
    ...(q.circleDiscount ? [{ name: `Circle discount ${Math.round(q.circleDiscount * 100)}%`, price: "-" + inr(Math.round(q.subtotal * q.urgencyMultiplier * q.circleDiscount)) }] : []),
    { name: "Platform fee", price: inr(q.platformFee) },
    ...(q.coordinationFee ? [{ name: "Coordination fee", price: inr(q.coordinationFee) }] : []),
    { name: "Travel (inside society)", price: "₹0" },
    ...(q.minOrderTopUp ? [{ name: `Minimum order top-up (${inr(config.minOrder)})`, price: inr(q.minOrderTopUp) }] : []),
  ];
  const step = (n: number, t: string) => <h3 className="display mb-3 flex items-center gap-3 text-2xl"><span className="mono grid h-8 w-8 place-items-center rounded-full bg-forest text-sm text-cream">{n}</span>{t}</h3>;
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-8">
        <div>{step(1, "What do you need done?")}<div className="flex flex-wrap gap-2">{catalog.map((c) => <button key={c.slug} className="chip" aria-pressed={sel.some((s) => s.slug === c.slug)} onClick={() => toggle(c.slug)}><Icon name={ICON[c.slug] ?? "box"} size={22} tone="none" />{c.name}</button>)}</div></div>
        <div>
          {step(2, "Size and quantity")}
          {sel.length === 0 && <p className="hand text-xl opacity-70">Select at least one task above.</p>}
          <div className="space-y-2">{sel.map((s) => { const t = catalog.find((c) => c.slug === s.slug)!; return (
            <div key={s.slug} className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink/20 bg-paper p-3">
              <span className="min-w-[150px] flex-1 font-semibold">{t.name}</span>
              <label className="flex items-center gap-2 text-sm">per {t.unit}<span className="flex items-center rounded-full border border-ink/20"><button aria-label="Less" className="h-9 w-9 text-lg" onClick={() => patch(s.slug, { qty: Math.max(1, s.qty - 1) })}>−</button><span className="mono w-6 text-center">{s.qty}</span><button aria-label="More" className="h-9 w-9 text-lg" onClick={() => patch(s.slug, { qty: Math.min(20, s.qty + 1) })}>+</button></span></label>
              <select aria-label={`Size for ${t.name}`} className="field !w-auto !py-1.5" value={s.size} onChange={(e) => patch(s.slug, { size: e.target.value as Size })}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select>
            </div>); })}</div>
        </div>
        <div>{step(3, "When do you need it?")}<div className="flex flex-wrap gap-2">{([["normal", "Normal (x1.0)"], ["same_day", "Same-day (x1.2)"], ["rush", "Rush, 90 min (x1.5)"]] as const).map(([v, l]) => <button key={v} className="chip" aria-pressed={urgency === v} onClick={() => setUrgency(v)}>{l}</button>)}</div></div>
        <div>
          {step(4, "Circle: neighbours join, the price drops")}
          <label htmlFor="joiners" className="flex items-baseline justify-between text-sm">Flats in your Circle<b className="mono text-xl">{joiners}</b></label>
          <input id="joiners" type="range" min={1} max={6} value={joiners} onChange={(e) => setJoiners(Number(e.target.value))} className="w-full accent-[var(--color-sun)]" />
          <div className="mt-2 flex items-end gap-1.5" aria-label="Circle discount curve">{curve.map((c) => <div key={c.flats} className="flex-1 text-center"><div className={`rounded-t-md ${c.flats === joiners ? "bg-sun" : "bg-sage"}`} style={{ height: 8 + (1 - c.perFlat / Math.max(1, curve[0].perFlat)) * 400 + "px", minHeight: 8 }} /><div className="mono text-[10px]">{c.flats}</div></div>)}</div>
        </div>
      </div>
      <div className="lg:sticky lg:top-24">
        {sel.length ? (
          <Receipt key={sel.map((s) => s.slug).join()} title="Your estimate" meta="Range until a person checks the plan" lines={q.lines.map((l) => ({ name: l.name, qty: l.qty > 1 ? String(l.qty) : undefined, price: inr(l.price) }))} fees={fees} total={<span className="flex items-baseline gap-1"><Meter value={q.range[0] / 100} prefix="₹" /><span className="text-xs">to</span><Meter value={q.range[1] / 100} prefix="₹" /></span>} totalLabel="ESTIMATE" footer={`About ${minutesToText(q.minutes)} of work. Includes the Shell Guarantee. Exact price shown after a human checks your plan.`} animate={false} />
        ) : (
          <div className="receipt scallop-b text-center"><p className="hand text-2xl">Your receipt will appear here.</p></div>
        )}
        <div className="mt-4 text-center"><Link href={`/waitlist?text=${encodeURIComponent(sel.map((s) => catalog.find((c) => c.slug === s.slug)?.name).join(", "))}`} className="btn btn-sun">Join the waitlist with this plan</Link></div>
      </div>
    </div>
  );
}
