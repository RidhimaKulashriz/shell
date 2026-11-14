"use client";

import Link from "next/link";
import { useRef } from "react";
import type { PackRow } from "@/lib/data";
import { rupees } from "@/lib/pricing";

/** Draggable, snap-scrolling row of ticket stubs. Cards are links, so keyboard users can tab through. */
export function PackStubs({ packs }: { packs: PackRow[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, x: 0, left: 0, moved: false });
  const colors = ["bg-paper", "bg-sand", "bg-paper", "bg-sage", "bg-paper", "bg-sand", "bg-paper"];
  return (
    <div
      ref={ref}
      className="no-scrollbar -mx-5 flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-8 pt-4 active:cursor-grabbing md:-mx-10 md:px-10"
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") return;
        drag.current = { down: true, x: e.clientX, left: ref.current!.scrollLeft, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d.down) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 5) d.moved = true;
        ref.current!.scrollLeft = d.left - dx;
      }}
      onPointerUp={() => (drag.current.down = false)}
      onPointerLeave={() => (drag.current.down = false)}
      onClickCapture={(e) => {
        if (drag.current.moved) {
          e.preventDefault();
          drag.current.moved = false;
        }
      }}
      role="list"
      aria-label="Packs"
    >
      {packs.map((p, i) => (
        <Link
          key={p.slug}
          href={`/packs/${p.slug}`}
          role="listitem"
          draggable={false}
          className={`group relative flex w-[17.5rem] shrink-0 snap-start flex-col text-ink transition-transform duration-200 hover:-translate-y-2 hover:!rotate-0 focus-visible:-translate-y-2 ${colors[i % colors.length]}`}
          style={{
            transform: `rotate(${[-1.5, 1, -0.7, 1.6, -1, 0.8, -1.8][i % 7]}deg)`,
            borderRadius: 14,
            WebkitMask: "radial-gradient(circle 11px at 0 62%, transparent 98%, #000) , radial-gradient(circle 11px at 100% 62%, transparent 98%, #000)",
            WebkitMaskComposite: "source-in",
            mask: "radial-gradient(circle 11px at 0 62%, transparent 98%, #000), radial-gradient(circle 11px at 100% 62%, transparent 98%, #000)",
            maskComposite: "intersect",
          }}
        >
          <div className="p-5 pb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-60">Shell Pack · № {String(i + 1).padStart(2, "0")}</p>
            <h3 className="font-display mt-2 text-[1.7rem] font-black leading-[1]">{p.nameEn}</h3>
            <p className="hi mt-1 text-sm opacity-70">{p.nameHi}</p>
          </div>
          <div className="border-t-2 border-dashed border-tide/40 p-5 pt-4">
            <ul className="space-y-1 text-[0.82rem]">
              {p.content.tasks.map((t) => <li key={t.label} className="flex gap-2"><span aria-hidden="true">·</span>{t.label}</li>)}
            </ul>
            <div className="mt-4 flex items-end justify-between">
              <span className="font-mono text-xs">{p.content.tasks.reduce((a, t) => a + t.hours, 0)} hrs of help</span>
              <span className="text-right"><span className="block font-mono text-[10px] uppercase opacity-60">from</span><span className="font-display text-2xl font-black">{rupees(p.startingPrice)}</span></span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
