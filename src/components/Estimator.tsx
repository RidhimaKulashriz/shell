"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import { Meter, Receipt, Stamp } from "./ui";
import { DEFAULT_CONFIG, circleDiscount, estimate, rupees, type Urgency } from "@/lib/pricing";
import { track } from "@/lib/track";

type Cat = { slug: string; name: string; icon: string; rate: number; unit: string; durationMin: number };

/** Estimator formula lives in lib/pricing.ts (editable config; admin UI in Phase 1). */
export function Estimator({ categories }: { categories: Cat[] }) {
  const [sel, setSel] = useState<Record<string, { qty: number; size: "small" | "medium" | "large" }>>({ "house-cleaning": { qty: 3, size: "medium" } });
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const [joiners, setJoiners] = useState(1);
  const [used, setUsed] = useState(false);

  const mark = () => {
    if (!used) {
      setUsed(true);
      track("estimator_used");
    }
  };
  const toggle = (slug: string) => {
    mark();
    setSel((s) => {
      const n = { ...s };
      if (n[slug]) delete n[slug];
      else n[slug] = { qty: 1, size: "medium" };
      return n;
    });
  };

  const picked = categories.filter((c) => sel[c.slug]);
  const est = useMemo(
    () => estimate({ tasks: picked.map((c) => ({ baseRate: c.rate * 100, quantity: sel[c.slug].qty, size: sel[c.slug].size })), urgency, circleJoiners: joiners }),
    [picked, sel, urgency, joiners],
  );
  const hours = picked.reduce((a, c) => a + (c.durationMin * sel[c.slug].qty) / 60, 0);
  const urgencyDelta = Math.round(est.subtotal * est.urgencyMultiplier) - est.subtotal;
  const circleDelta = est.urgencyAmount - est.subtotal - urgencyDelta;

  const lines = [
    ...picked.map((c, i) => ({ label: c.name, sub: `${sel[c.slug].qty} ${c.unit} · ${sel[c.slug].size}`, amount: rupees(est.lines[i]) })),
    ...(urgencyDelta ? [{ label: urgency === "rush" ? "Rush (x1.5)" : "Same-day (x1.2)", amount: "+" + rupees(urgencyDelta) }] : []),
    ...(circleDelta ? [{ label: `Circle discount (${Math.round(est.circleDiscount * 100)}%)`, amount: "-" + rupees(-circleDelta) }] : []),
    ...(est.platformFee ? [{ label: "Platform fee", sub: `max(${rupees(DEFAULT_CONFIG.feeFloor)}, ${DEFAULT_CONFIG.feePercent * 100}%)`, amount: rupees(est.platformFee) }] : []),
    ...(est.coordinationFee ? [{ label: "Coordination fee", sub: "3+ tasks or Managed", amount: rupees(est.coordinationFee) }] : []),
    ...(est.travel ? [{ label: "Travel", amount: rupees(est.travel) }] : []),
  ];
  const msg = picked.map((c) => c.name).join(", ");

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
      <div className="space-y-8">
        <fieldset>
          <legend className="font-display text-2xl font-bold"><span className="mr-2 font-mono text-base">1</span>Kaam chuno</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c.slug} aria-pressed={!!sel[c.slug]} onClick={() => toggle(c.slug)} className={`flex items-center gap-2 rounded-full border-2 py-1.5 pl-2 pr-4 text-sm font-semibold transition ${sel[c.slug] ? "border-tide bg-tide text-cream" : "border-tide/30 bg-white/60 hover:border-tide"}`}>
                <span className={`grid h-8 w-8 place-items-center rounded-full ${sel[c.slug] ? "bg-cream text-tide" : ""}`}><Icon name={c.icon} size={24} /></span>{c.name}
              </button>
            ))}
          </div>
        </fieldset>
        {picked.length > 0 ? (
          <fieldset>
            <legend className="font-display text-2xl font-bold"><span className="mr-2 font-mono text-base">2</span>Size aur quantity</legend>
            <ul className="mt-3 space-y-3">
              {picked.map((c) => (
                <li key={c.slug} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/60 p-3">
                  <span className="min-w-[8rem] font-semibold">{c.name}</span>
                  <span className="flex items-center gap-2">
                    <button aria-label={`Less ${c.name}`} className="h-9 w-9 rounded-full border-2 border-tide text-lg" onClick={() => { mark(); setSel((s) => ({ ...s, [c.slug]: { ...s[c.slug], qty: Math.max(1, s[c.slug].qty - 1) } })); }}>−</button>
                    <span className="w-24 text-center font-mono text-sm">{sel[c.slug].qty} {c.unit}</span>
                    <button aria-label={`More ${c.name}`} className="h-9 w-9 rounded-full border-2 border-tide text-lg" onClick={() => { mark(); setSel((s) => ({ ...s, [c.slug]: { ...s[c.slug], qty: Math.min(12, s[c.slug].qty + 1) } })); }}>+</button>
                  </span>
                  <select aria-label={`Size for ${c.name}`} value={sel[c.slug].size} onChange={(e) => { mark(); setSel((s) => ({ ...s, [c.slug]: { ...s[c.slug], size: e.target.value as "small" } })); }} className="rounded-lg border-2 border-tide/40 bg-white px-2 py-1.5 text-sm">
                    <option value="small">small</option><option value="medium">medium</option><option value="large">large</option>
                  </select>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : null}
        <fieldset>
          <legend className="font-display text-2xl font-bold"><span className="mr-2 font-mono text-base">3</span>Kab chahiye</legend>
          <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup">
            {([["normal", "Normal", "kal ya baad mein"], ["same_day", "Same-day", "x1.2"], ["rush", "Rush", "90 min, x1.5"]] as const).map(([v, l, s]) => (
              <button key={v} role="radio" aria-checked={urgency === v} onClick={() => { mark(); setUrgency(v); }} className={`rounded-2xl border-2 p-3 text-left ${urgency === v ? "border-tide bg-tide text-cream" : "border-tide/30 bg-white/60"}`}>
                <span className="block font-semibold">{l}</span><span className="block text-xs opacity-75">{s}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-display text-2xl font-bold"><span className="mr-2 font-mono text-base">4</span>Shell Circle (optional)</legend>
          <label className="mt-3 block text-sm">Aapke tower ke <b className="font-mono">{joiners}</b> flat judte hain
            <input type="range" min={1} max={6} value={joiners} onChange={(e) => { mark(); setJoiners(+e.target.value); }} className="mt-2 w-full accent-[#235347]" />
          </label>
          <div className="mt-2 flex items-end gap-1" aria-label="Circle discount curve">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="flex-1 text-center text-[10px]"><div className={`mx-auto w-full rounded-t ${n <= joiners ? "bg-euca" : "bg-tide/20"}`} style={{ height: 8 + circleDiscount(n) * 300 }} /><span className="font-mono">{Math.round(circleDiscount(n) * 100)}%</span></div>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        {picked.length === 0 ? (
          <div className="hand rounded-3xl border-2 border-dashed border-tide/40 p-8 text-center text-2xl">Kuch chuno, receipt yahin banegi.</div>
        ) : (
          <div className="relative -rotate-1">
            <Receipt
              title="ESTIMATE"
              lines={lines}
              totalLabel="TOTAL"
              total={<span><Meter prefix="₹" value={Math.round(est.low / 100)} /> - <Meter value={Math.round(est.high / 100)} /></span>}
              foot={
                <>
                  <span className="block">About {hours.toFixed(1)} hrs of helper time. Range until a human checks the plan.</span>
                  {est.minOrderApplied ? <span className="mt-1 block font-semibold">Minimum order {rupees(DEFAULT_CONFIG.minOrder)} applied.</span> : <span className="mt-1 block">Minimum order {rupees(DEFAULT_CONFIG.minOrder)}.</span>}
                </>
              }
              stamp={<Stamp tone="green">GUARANTEE</Stamp>}
            />
            <Link href={`/waitlist?msg=${encodeURIComponent(msg)}`} className="pill pill-sun mt-5 w-full justify-center" data-cta="estimator_waitlist">Ye plan waitlist mein bhejo</Link>
          </div>
        )}
      </div>
    </div>
  );
}
