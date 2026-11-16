"use client";
import { useState } from "react";

/** Time Machine: swipe slider comparing before and after photos. */
export function TimeMachine({ before, after, label = "Before and after" }: { before: string; after: string; label?: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative select-none overflow-hidden rounded-2xl border border-ink/20 bg-paper" role="group" aria-label={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="After" className="block w-full" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt="Before" className="block h-full w-full object-cover" draggable={false} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-1 bg-ink" style={{ left: `calc(${pos}% - 2px)` }}>
        <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-ink/20 bg-sun text-xs font-bold">⇆</span>
      </div>
      <span className="stamp absolute left-2 top-2 bg-paper/80 text-[10px]">before</span>
      <span className="stamp absolute right-2 top-2 bg-paper/80 text-[10px]">after</span>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Slide to compare before and after" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
    </div>
  );
}
