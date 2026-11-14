"use client";
import { useState } from "react";
import { Icon } from "./icons";
import { cn } from "@/lib/utils";

const LEVELS = ["Starter", "Trusted", "Pro", "Elite"];
export function PassportBook({ name, level, stamps, jobs, rating, qr, college, languages, verified = true }: { name: string; level: string; stamps: { label: string; icon: string }[]; jobs: number; rating: number; qr?: string; college?: string; languages?: string[]; verified?: boolean }) {
  const [open, setOpen] = useState(false);
  const idx = Math.max(0, LEVELS.findIndex((l) => l.toUpperCase() === level));
  return (
    <div>
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close passport" : "Open passport"} className="relative mx-auto block h-[340px] w-full max-w-[520px] text-left" style={{ perspective: 1400 }}>
        <div className="absolute inset-y-0 right-0 w-1/2 rounded-r-2xl bg-paper p-4 shadow-lg">
          <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-euca">Stamps</div>
          <div className="mt-3 grid grid-cols-3 gap-2">{stamps.slice(0, 9).map((s, i) => <div key={i} className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-euca/40 text-euca" style={{ transform: `rotate(${((i * 37) % 9) - 4}deg)` }} title={s.label}><Icon name={s.icon} size={26} /></div>)}
            {stamps.length === 0 && <p className="col-span-3 text-xs text-ink/50">Your first job earns your first stamp.</p>}</div>
          <div className="mt-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-euca">Visas</div>
          <div className="mt-1 flex gap-1">{LEVELS.map((l, i) => <span key={l} className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-semibold", i <= idx ? "bg-tide text-cream" : "bg-ink/10 text-ink/40")}>{l}</span>)}</div>
        </div>
        <div className="absolute inset-y-0 left-0 w-1/2 rounded-l-2xl bg-paper shadow-lg" />
        <div className="absolute inset-y-0 left-1/2 w-1/2 origin-left rounded-r-2xl bg-tide p-5 text-cream shadow-xl transition-transform duration-700 ease-in-out" style={{ transform: open ? "rotateY(-170deg)" : "rotateY(0)", transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}>
          <div className="grid h-full place-items-center border-2 border-sand/60 text-center"><div><Icon name="passport" size={44} className="mx-auto text-sand" /><div className="serif mt-2 text-xl font-semibold tracking-[0.15em]">SKILL PASSPORT</div><div className="mt-1 text-xs text-sage">Tap to open</div></div></div>
        </div>
        <div className="absolute inset-y-0 left-0 w-1/2 rounded-l-2xl bg-paper p-4 text-ink" style={{ opacity: open ? 1 : 0, transition: "opacity .4s .3s" }}>
          <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-euca">Holder</div>
          <div className="serif text-2xl font-semibold">{name}</div>
          <div className="mt-1 text-xs text-ink/60">{college}</div>
          <dl className="mt-3 space-y-1 text-sm" style={{ fontFamily: "var(--font-mono)" }}><div className="flex justify-between"><dt>Level</dt><dd>{LEVELS[idx]}</dd></div><div className="flex justify-between"><dt>Jobs</dt><dd>{jobs}</dd></div><div className="flex justify-between"><dt>Rating</dt><dd>{rating ? rating.toFixed(1) : "New"}</dd></div></dl>
          {languages && <div className="mt-2 text-xs">{languages.join(" · ")}</div>}
          {verified && <span className="stamp stamp-green mt-3">Verified</span>}
          {qr && <img src={qr} alt="QR code to verify this passport" className="absolute bottom-3 right-3 h-16 w-16" />}
        </div>
      </button>
    </div>
  );
}
