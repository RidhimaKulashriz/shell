"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Meter, Stamp, useInView } from "./ui";
import { LEVELS } from "@/lib/levels";


function FakeQr() {
  // Deterministic decorative QR-style block; the real one points to /passport/[slug] in Phase 1.
  const cells = Array.from({ length: 49 }, (_, i) => ((i * 37 + (i % 7) * 11) % 5) < 2);
  return (
    <svg viewBox="0 0 7 7" width="56" height="56" aria-label="Sample QR" role="img">
      {cells.map((on, i) => (on ? <rect key={i} x={i % 7} y={Math.floor(i / 7)} width="1" height="1" fill="#0E1A17" /> : null))}
    </svg>
  );
}

const STAMPS = [
  { icon: "broom", label: "CLEANING", date: "12 JUN" },
  { icon: "cart", label: "GROCERIES", date: "18 JUN" },
  { icon: "laptop", label: "EXCEL", date: "02 JUL" },
  { icon: "book", label: "TUTORING", date: "09 JUL" },
];

/** A literal passport: page-flip open, stamps per category, level visas, QR. */
export function Passport({ sample = true }: { sample?: boolean }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [ref, seen] = useInView<HTMLDivElement>(0.5);
  const isOpen = open || seen;
  return (
    <div ref={ref} className="mx-auto w-full max-w-md [perspective:1400px]">
      <div className="relative aspect-[1.35/1]">
        {/* inside pages */}
        <div className="bg-paper absolute inset-0 grid grid-cols-2 overflow-hidden rounded-[10px_16px_16px_10px] shadow-[0_20px_30px_-12px_rgba(0,0,0,0.6)] ring-2 ring-tide">
          {page === 0 ? (
            <>
              <div className="border-r-2 border-dashed border-tide/30 p-3">
                <div className="grid h-16 w-16 place-items-center rounded-lg bg-sage/50 font-display text-3xl font-bold">R</div>
                <p className="font-mono mt-2 text-[10px] uppercase tracking-widest">First name</p>
                <p className="font-display text-xl font-bold leading-none">Riya</p>
                <p className="font-mono mt-2 text-[9px] leading-tight">ID VERIFIED<br />COLLEGE VERIFIED<br />SAFETY TRAINED</p>
                <div className="mt-2"><FakeQr /></div>
              </div>
              <div className="p-3">
                <p className="font-mono text-[10px] uppercase tracking-widest">Visa level</p>
                <div className="mt-1 space-y-1">
                  {LEVELS.map((l, i) => (
                    <div key={l.name} className={`rounded-md border-2 px-2 py-1 text-[11px] font-semibold ${i === 1 ? "border-euca bg-euca text-cream" : "border-tide/30 opacity-60"}`}>{l.name}</div>
                  ))}
                </div>
                <p className="hand mt-2 text-sm leading-none">Sample page. Aapki real passport yahin banegi.</p>
              </div>
            </>
          ) : (
            <>
              <div className="col-span-2 grid grid-cols-4 gap-2 p-3">
                {STAMPS.map((s, i) => (
                  <div key={s.label} className="grid place-items-center text-center" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (4 + i)}deg)` }}>
                    <div className={`stamp ${i % 2 ? "stamp-green" : ""} grid h-16 w-16 place-items-center !rounded-full !p-0`}>
                      <div>
                        <Icon name={s.icon} size={24} spot={false} />
                        <div className="font-mono text-[6px] leading-none">{s.label}</div>
                      </div>
                    </div>
                    <div className="font-mono mt-1 text-[8px]">{s.date}</div>
                  </div>
                ))}
                <div className="col-span-4 mt-1 flex items-center justify-between border-t-2 border-dashed border-tide/30 pt-2 font-mono text-[10px]">
                  <span>JOBS <b><Meter value={sample ? 27 : 0} /></b></span>
                  <span>ON TIME <b>96%</b></span>
                  <span>REPEAT <b>41%</b></span>
                </div>
              </div>
            </>
          )}
        </div>
        {/* cover */}
        <div
          className="absolute inset-0 origin-left rounded-[10px_16px_16px_10px] bg-forest p-5 text-cream shadow-xl ring-2 ring-tide transition-transform duration-[900ms] ease-[cubic-bezier(.6,0,.2,1)] [backface-visibility:hidden]"
          style={{ transform: isOpen ? "rotateY(-168deg)" : "rotateY(0deg)", pointerEvents: isOpen ? "none" : "auto" }}
        >
          <div className="flex h-full flex-col items-center justify-center border-2 border-dashed border-sand/70 text-center">
            <Icon name="stamp" size={46} spot={false} className="text-sand" />
            <p className="font-display mt-2 text-2xl font-black tracking-wide text-sand">SKILL PASSPORT</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em]">Shell Earn</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3 text-sm">
        <button className="pill pill-line !px-4 !py-2" onClick={() => { setOpen(true); setPage(0); }}>Pehla page</button>
        <button className="pill pill-line !px-4 !py-2" onClick={() => { setOpen(true); setPage(1); }}>Stamps</button>
        {isOpen ? <Stamp tone="green" className="!text-xs">SAMPLE</Stamp> : null}
      </div>
    </div>
  );
}

export function EarnCalc({ categories }: { categories: { slug: string; name: string; rate: number; durationMin: number }[] }) {
  const [hours, setHours] = useState(8);
  const [slug, setSlug] = useState(categories[0]?.slug ?? "");
  const [lvl, setLvl] = useState(0);
  const c = categories.find((x) => x.slug === slug) ?? categories[0];
  const hourly = c ? (c.rate * 60) / c.durationMin : 0;
  // hours/week x average hourly rate x level multiplier x helper share (80%) x utilisation (60%) x 4.3 weeks
  const mid = hours * 4.3 * hourly * LEVELS[lvl].mult * 0.8 * 0.6;
  const low = Math.round(mid * 0.8 / 100) * 100;
  const high = Math.round(mid * 1.2 / 100) * 100;
  return (
    <div className="bg-paper rounded-[24px_30px_22px_28px] p-5 text-ink shadow-[0_14px_0_rgba(0,0,0,0.25)] ring-2 ring-tide">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em]">Kamai ka andaaza</p>
      <label className="mt-3 block text-sm font-semibold">Hafte mein <span className="font-mono">{hours}</span> ghante
        <input type="range" min={2} max={30} value={hours} onChange={(e) => setHours(+e.target.value)} className="mt-2 w-full accent-[#235347]" aria-label="Hours per week" />
      </label>
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
        {categories.slice(0, 8).map((x) => (
          <button key={x.slug} role="radio" aria-checked={slug === x.slug} onClick={() => setSlug(x.slug)} className={`rounded-full border-2 px-3 py-1.5 text-xs font-semibold ${slug === x.slug ? "border-tide bg-tide text-cream" : "border-tide/30"}`}>{x.name}</button>
        ))}
      </div>
      <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Level">
        {LEVELS.map((l, i) => (
          <button key={l.name} role="radio" aria-checked={lvl === i} onClick={() => setLvl(i)} className={`flex-1 rounded-md border-2 px-1 py-1 text-[11px] font-semibold ${lvl === i ? "border-euca bg-euca text-cream" : "border-tide/30"}`}>{l.name}</button>
        ))}
      </div>
      <div className="mt-4 flex items-baseline gap-2 border-t-2 border-dashed border-tide/30 pt-3">
        <span className="font-display text-4xl font-black"><Meter prefix="₹" value={low} /> - <Meter value={high} /></span>
        <span className="text-sm">har mahine</span>
      </div>
      <p className="mt-1 text-xs opacity-70">Estimate, guarantee nahi. Hafte ke ghante × category ka average rate × level × aapka share, 60% booking maan kar.</p>
    </div>
  );
}
