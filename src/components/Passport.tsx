"use client";
import { useEffect, useState } from "react";
import { Stamp, useInView } from "@/components/ui";
import { Icon } from "@/components/Icon";

export type PassportData = { name: string; level: string; slug?: string; jobs: number; rating: number; languages: string[]; stamps: { label: string; icon: string; date?: string }[]; verified: string[]; qr?: string; college?: string | null };
const LEVELS = ["STARTER", "TRUSTED", "PRO", "ELITE"];

/** A literal passport: the cover swings open with a page-flip, stamps thump onto the visa pages. */
export function PassportBook({ data, autoOpen = true }: { data: PassportData; autoOpen?: boolean }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (seen && autoOpen) {
      const id = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(id);
    }
  }, [seen, autoOpen]);
  const level = LEVELS.indexOf(data.level);
  const perPage = 6;
  const pages = Math.max(1, Math.ceil(data.stamps.length / perPage));
  const slice = data.stamps.slice(page * perPage, page * perPage + perPage);
  return (
    <div ref={ref} className="mx-auto w-full max-w-[480px]" style={{ perspective: 1400 }}>
      <div className="relative aspect-[1.35/1]">
        {/* inside right page */}
        <div className="absolute inset-0 grid grid-cols-2 overflow-hidden rounded-[18px] border-[3px] border-ink bg-paper text-ink shadow-[8px_8px_0_var(--color-ink)]">
          <div className="border-r-2 border-dashed border-ink/30 p-3 sm:p-4">
            <div className="mono text-[9px] uppercase tracking-[0.2em] opacity-60">Shell Skill Passport</div>
            <div className="mt-2 flex items-center gap-2"><span className="grid h-14 w-12 place-items-center rounded-md border-2 border-ink bg-sand font-display text-xl">{data.name[0]}</span><div><div className="display text-lg leading-tight">{data.name}</div><div className="mono text-[10px]">{data.college ?? "Verified helper"}</div></div></div>
            <div className="mt-3 space-y-1 text-[11px]"><div className="mono">LEVEL {data.level}</div><div className="mono">JOBS {data.jobs} · RATING {data.rating ? data.rating.toFixed(1) : "new"}</div><div className="mono">LANG {data.languages.join(", ")}</div></div>
            <div className="mt-3 flex flex-wrap gap-1">{data.verified.map((v) => <span key={v} className="stamp !text-[8px]">{v}</span>)}</div>
            <div className="mt-3 flex gap-1" aria-label="Level visas">{LEVELS.map((l, i) => <span key={l} className={`mono rounded border-2 border-ink px-1.5 py-0.5 text-[8px] ${i <= level ? "bg-sun" : "opacity-30"}`}>{l[0] + l.slice(1, 3).toLowerCase()}</span>)}</div>
            {data.qr && <div className="mt-2 h-14 w-14 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: data.qr }} aria-label="Verification QR code" />}
          </div>
          <div className="relative p-3 sm:p-4">
            <div className="mono text-[9px] uppercase tracking-[0.2em] opacity-60">Visas / stamps ({page + 1}/{pages})</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {open && slice.map((s, i) => (
                <div key={s.label} className="grid place-items-center rounded-lg border-2 border-dashed border-ink/30 p-1 text-center" style={{ transform: `rotate(${(i * 7) % 11 - 5}deg)` }}>
                  <Icon name={s.icon} size={26} />
                  <Stamp label={s.label} delay={700 + i * 220} rot={-8 + i * 4} className="!text-[7px] !px-1" />
                </div>
              ))}
              {data.stamps.length === 0 && <p className="col-span-3 text-xs opacity-60">First job, first stamp.</p>}
            </div>
            {pages > 1 && <button className="mono absolute bottom-2 right-3 text-[10px] underline" onClick={() => setPage((page + 1) % pages)}>turn page</button>}
          </div>
        </div>
        {/* cover */}
        <button onClick={() => setOpen(!open)} aria-label={open ? "Close passport" : "Open passport"} aria-expanded={open} className="page-flip absolute inset-0 rounded-[18px] border-[3px] border-ink bg-forest text-cream" style={{ transform: open ? "rotateY(-165deg)" : "rotateY(0)" }}>
          <div className="grid h-full place-items-center p-6 text-center"><div><Icon name="shield" size={64} tone="sand" className="mx-auto" /><div className="display mt-2 text-3xl">SHELL</div><div className="mono mt-1 text-[10px] tracking-[0.3em] text-sand">SKILL PASSPORT</div></div></div>
        </button>
      </div>
    </div>
  );
}
