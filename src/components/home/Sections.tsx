"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { WaitlistMap, type HexCount } from "@/components/maps";
import { Stamp, useInView } from "@/components/ui";
import { inr, minutesToText } from "@/lib/format";

export type PackCard = { slug: string; name: string; tasks: string[]; minutes: number; from: number; icon: string };

export function PackTickets({ packs }: { packs: PackCard[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, x: 0, left: 0, moved: false });
  const [dragging, setDragging] = useState(false);
  return (
    <div
      ref={ref}
      className={`hide-scroll -mx-5 flex gap-5 overflow-x-auto px-5 pb-6 pt-3 md:-mx-8 md:px-8 ${dragging ? "" : "snap-x snap-mandatory"} cursor-grab active:cursor-grabbing`}
      tabIndex={0}
      aria-label="Packs, scroll sideways"
      onPointerDown={(e) => { drag.current = { down: true, x: e.clientX, left: ref.current!.scrollLeft, moved: false }; }}
      onPointerMove={(e) => {
        if (!drag.current.down) return;
        const dx = e.clientX - drag.current.x;
        if (Math.abs(dx) > 6) { drag.current.moved = true; setDragging(true); }
        ref.current!.scrollLeft = drag.current.left - dx;
      }}
      onPointerUp={() => { drag.current.down = false; setTimeout(() => setDragging(false), 50); }}
      onPointerLeave={() => { drag.current.down = false; setDragging(false); }}
      onClickCapture={(e) => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false; } }}
    >
      {packs.map((p, i) => (
        <Link key={p.slug} href={`/packs/${p.slug}`} draggable={false} className="ticket relative flex w-[270px] shrink-0 snap-start flex-col justify-between border-2 border-ink p-5 transition-transform hover:-translate-y-1" style={{ transform: `rotate(${[-1.5, 1, -0.7, 1.4, -1, 0.6, -1.2][i % 7]}deg)`, minHeight: 300 }}>
          <div>
            <div className="flex items-start justify-between"><Icon name={p.icon} size={46} /><span className="mono text-[10px] uppercase tracking-widest opacity-60">pack no. {String(i + 1).padStart(2, "0")}</span></div>
            <h3 className="display mt-3 text-2xl">{p.name}</h3>
            <ul className="mt-3 space-y-1 text-sm">{p.tasks.slice(0, 4).map((t) => <li key={t} className="flex gap-2"><span className="text-euc">+</span>{t}</li>)}</ul>
          </div>
          <div className="mt-4 border-t-2 border-dashed border-ink/30 pt-3">
            <div className="mono text-xs opacity-70">about {minutesToText(p.minutes)} of work</div>
            <div className="flex items-baseline justify-between"><span className="text-sm">from</span><span className="mono text-xl font-medium">{inr(p.from)}</span></div>
          </div>
        </Link>
      ))}
    </div>
  );
}

const GUARD_STEPS = ["Gate pass sent to the guard", "Helper at the gate", "Door OTP", "Check-in at the door", "Job in progress", "Check-out and photos"];
const PTS = [[40, 230], [90, 180], [200, 130], [270, 90], [300, 60], [330, 40]];

export function GuardianPath() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!seen) return;
    const id = setInterval(() => setI((x) => (x + 1) % GUARD_STEPS.length), 1500);
    return () => clearInterval(id);
  }, [seen]);
  return (
    <div ref={ref} className="rounded-[28px] border-2 border-sage/50 p-4">
      <svg viewBox="0 0 380 270" className="w-full" role="img" aria-label="Path from gate to tower to door">
        <path d="M40 230 C90 180 160 170 200 130 S290 90 330 40" fill="none" stroke="#235347" strokeWidth="12" strokeLinecap="round" />
        <path d="M40 230 C90 180 160 170 200 130 S290 90 330 40" fill="none" stroke="#8EB69B" strokeWidth="3" strokeDasharray="1 9" strokeLinecap="round" />
        {[["GATE", 40, 258], ["TOWER", 200, 160], ["DOOR", 330, 24]].map(([l, x, y]) => <text key={String(l)} x={Number(x)} y={Number(y)} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill="#E8C48A">{l}</text>)}
        <g style={{ transform: `translate(${PTS[i][0]}px, ${PTS[i][1]}px)`, transition: "transform 1s cubic-bezier(.4,0,.2,1)" }}>
          <circle className="pulse-dot" r="10" fill="#F2C318" opacity=".5" /><circle r="7" fill="#F2C318" stroke="#051F20" strokeWidth="2.5" />
        </g>
      </svg>
      <ol className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        {GUARD_STEPS.map((s, k) => <li key={s} className={`flex items-center gap-2 transition-opacity ${k <= i ? "opacity-100" : "opacity-40"}`}><span className="mono text-sand">{k + 1}</span>{s}</li>)}
      </ol>
    </div>
  );
}

export function SocietyFinder({ societies, hexes, initial }: { societies: { id: string; name: string; slug: string; lat: number; lng: number; count: number; target: number; status: string }[]; hexes: HexCount[]; initial?: string }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(initial ?? societies[0]?.id);
  const list = societies.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  const s = societies.find((x) => x.id === sel) ?? societies[0];
  const left = Math.max(0, s.target - s.count);
  return (
    <div className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
      <WaitlistMap hexes={hexes} societies={societies} selected={s.id} onSelect={setSel} className="border-2 border-ink shadow-[8px_8px_0_var(--color-ink)]" />
      <div>
        <label htmlFor="soc-search" className="hand text-2xl">Apni society dhundo</label>
        <input id="soc-search" className="field mt-1" placeholder="Society ya area ka naam" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="mt-2 max-h-32 space-y-1 overflow-auto">{list.map((x) => <li key={x.id}><button className={`w-full rounded-xl px-3 py-2 text-left ${x.id === s.id ? "bg-forest text-cream" : "bg-paper"}`} onClick={() => setSel(x.id)}>{x.name}</button></li>)}{!list.length && <li className="text-sm">Not listed? Join the waitlist and tell us the name.</li>}</ul>
        <div className="receipt scallop-b mt-5 !text-sm">
          <div className="display text-xl">{s.name}</div>
          <div className="mt-1 flex items-baseline justify-between"><span>Neighbours waiting</span><b className="text-2xl">{s.count}</b></div>
          <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-ink bg-cream" role="progressbar" aria-valuenow={s.count} aria-valuemax={s.target}><div className="h-full bg-euc transition-all" style={{ width: `${Math.min(100, (s.count / s.target) * 100)}%` }} /></div>
          <p className="mt-2">{s.status !== "waitlist" ? `Live pilot. ${left} more neighbours to open the next towers.` : left > 0 ? `${left} more neighbours to unlock ${s.name.split(",")[0]}.` : "Enough neighbours. We are lining up helpers."}</p>
          <div className="mt-3 flex flex-wrap gap-2"><Link href={`/waitlist?society=${s.slug}`} className="btn btn-sun btn-sm" data-cta="society_map">Join the waitlist</Link><Link href="/societies" className="link-quiet self-center font-bold">Bring your society</Link></div>
        </div>
      </div>
    </div>
  );
}

export function Stamped({ label }: { label: string }) {
  return <Stamp label={label} />;
}
