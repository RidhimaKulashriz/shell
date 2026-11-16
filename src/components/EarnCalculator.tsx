"use client";
import { useState } from "react";
import { Meter } from "@/components/ui";

export type Rate = { slug: string; label: string; hourly: number };
const LEVEL_MULT: Record<string, number> = { Starter: 1, Trusted: 1.05, Pro: 1.12, Elite: 1.2 };

/** Monthly estimate = hours/week x 4.3 x category hourly payout x level multiplier x utilisation (60 to 90 percent). Estimates, not guarantees. */
export function EarnCalculator({ rates, withLevel = false, onDark = false }: { rates: Rate[]; withLevel?: boolean; onDark?: boolean }) {
  const [hours, setHours] = useState(8);
  const [cat, setCat] = useState(rates[0]?.slug);
  const [lvl, setLvl] = useState("Starter");
  const r = rates.find((x) => x.slug === cat) ?? rates[0];
  const base = hours * 4.3 * (r?.hourly ?? 0) * (withLevel ? LEVEL_MULT[lvl] : 1);
  const lo = Math.round(base * 0.6 / 100), hi = Math.round(base * 0.9 / 100);
  return (
    <div className={`rounded-2xl border p-5 ${onDark ? "border-sage/60" : "border-ink/20 bg-paper"}`}>
      <label htmlFor="hrs" className="flex items-baseline justify-between font-bold">How many hours per week?<span className="mono text-2xl">{hours}h</span></label>
      <input id="hrs" type="range" min={2} max={30} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-sun)]" />
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Category">
        {rates.map((x) => <button key={x.slug} className="chip" aria-pressed={cat === x.slug} onClick={() => setCat(x.slug)}>{x.label}</button>)}
      </div>
      {withLevel && <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Level">{Object.keys(LEVEL_MULT).map((l) => <button key={l} className="chip" aria-pressed={lvl === l} onClick={() => setLvl(l)}>{l}</button>)}</div>}
      <div className="mt-5 text-center">
        <div className="hand text-xl opacity-80">per month, approximately</div>
        <div className="display text-4xl md:text-5xl"><Meter key={lo + "-" + hi} value={lo} prefix="₹" /> <span className="text-xl opacity-60">to</span> <Meter key={hi} value={hi} prefix="₹" /></div>
        <p className="mt-2 text-xs opacity-70">Estimates, not guarantees. Depends on offers in your society and the slots you pick.</p>
      </div>
    </div>
  );
}
