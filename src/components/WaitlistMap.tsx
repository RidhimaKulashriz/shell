"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Cell = { id: string; centre: [number, number]; outline: [number, number][]; count: number; few: boolean };
type MapData = { society: { slug: string; name: string; area: string; lat: number; lng: number; waiting: number; target: number; status: string }; cells: Cell[] };
type Soc = { slug: string; name: string; area: string; waiting: number; unlockTarget: number };

/** Privacy-safe, hex-level waitlist density in the brand palette (MapProvider: svg-hex). */
export function WaitlistMap({ initialSlug, search = true, dark = true }: { initialSlug?: string; search?: boolean; dark?: boolean }) {
  const [socs, setSocs] = useState<Soc[]>([]);
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [data, setData] = useState<MapData | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch("/api/waitlist/stats").then((r) => r.json()).then((j) => setSocs(j.societies ?? [])).catch(() => {});
  }, []);
  useEffect(() => {
    setErr(false);
    fetch(`/api/waitlist/map${slug ? `?society=${slug}` : ""}`)
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => setErr(true));
  }, [slug]);

  const geo = useMemo(() => {
    if (!data) return null;
    const pts = data.cells.flatMap((c) => c.outline);
    const lats = pts.map((p) => p[0]);
    const lngs = pts.map((p) => p[1]);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const k = Math.cos((data.society.lat * Math.PI) / 180);
    const w = (maxLng - minLng) * k;
    const h = maxLat - minLat;
    const s = 400 / Math.max(w, h);
    const proj = (p: [number, number]) => [((p[1] - minLng) * k) * s + 10, (maxLat - p[0]) * s + 10] as [number, number];
    return { proj, W: w * s + 20, H: h * s + 20 };
  }, [data]);

  const matches = socs.filter((s) => q && `${s.name} ${s.area}`.toLowerCase().includes(q.toLowerCase()));
  const s = data?.society;
  const remaining = s ? Math.max(0, s.target - s.waiting) : 0;
  const pct = s ? Math.min(100, (s.waiting / s.target) * 100) : 0;
  const max = data ? Math.max(1, ...data.cells.map((c) => c.count)) : 1;

  return (
    <div className="grid gap-6 md:grid-cols-[1.25fr_1fr] md:items-center">
      <div className={`relative overflow-hidden rounded-[30px_22px_34px_24px] ring-2 ring-tide ${dark ? "bg-tide" : "bg-forest"}`} style={{ minHeight: 280 }}>
        {err ? <p className="p-8 text-cream">Map abhi load nahi hua. Page refresh karo.</p> : null}
        {!data || !geo ? <div className="grid h-72 place-items-center font-mono text-xs text-sage">map load ho raha hai...</div> : (
          <svg viewBox={`0 0 ${geo.W} ${geo.H}`} className="w-full" role="img" aria-label={`Waitlist density around ${data.society.name}. ${data.society.waiting} neighbours waiting.`}>
            {data.cells.map((c) => {
              const pts = c.outline.map((p) => geo.proj(p).join(",")).join(" ");
              const intensity = c.count / max;
              return <polygon key={c.id} points={pts} fill={c.count > 0 ? `rgba(242,195,24,${0.25 + intensity * 0.65})` : "rgba(142,182,155,0.07)"} stroke="#235347" strokeWidth="1.2" />;
            })}
            {(() => {
              const [x, y] = geo.proj([data.society.lat, data.society.lng]);
              return (
                <g>
                  <circle cx={x} cy={y} r="4" fill="none" stroke="#8EB69B" className="pulse-ring" />
                  <circle cx={x} cy={y} r="5" fill="#DAF1DE" stroke="#051F20" strokeWidth="2" />
                  <text x={x + 10} y={y - 10} fill="#DAF1DE" fontSize="13" fontFamily="Caveat, cursive" fontWeight="700">{data.society.name}</text>
                </g>
              );
            })()}
          </svg>
        )}
        <p className="absolute bottom-2 left-3 font-mono text-[10px] text-sage">Hex-level only. Koi exact address nahi.</p>
      </div>
      <div>
        {search ? (
          <div className="relative">
            <label className="hand text-2xl" htmlFor="soc-search">Apni society dhundo</label>
            <input id="soc-search" value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-current/40 bg-white/90 px-4 py-3 text-ink outline-none" placeholder="Sunrise Heights, Greenfields..." autoComplete="off" />
            {matches.length > 0 ? (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border-2 border-tide bg-paper text-ink shadow-lg">
                {matches.map((m) => (
                  <li key={m.slug}><button className="block w-full px-4 py-2 text-left text-sm hover:bg-sage/30" onClick={() => { setSlug(m.slug); setQ(""); }}>{m.name} <span className="opacity-60">· {m.area}</span></button></li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {s ? (
          <div className="mt-5">
            <p className="font-display text-3xl font-bold leading-tight">{s.name}</p>
            <p className="font-mono text-xs uppercase tracking-widest opacity-70">{s.area}, Delhi · {s.status === "pilot" ? "pilot society" : "waitlist"}</p>
            <p className="mt-3 text-lg">
              {s.waiting === 0 ? "Abhi koi nahi. Pehle aap ban sakte ho." : <><b className="font-display text-3xl">{s.waiting}</b> neighbours waiting near you.</>}
            </p>
            <div className="mt-2 h-4 overflow-hidden rounded-full bg-current/15" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to open">
              <div className="h-full rounded-full bg-sun" style={{ width: `${Math.max(2, pct)}%`, transition: "width 1s" }} />
            </div>
            <p className="mt-2 text-sm">{remaining} more neighbours to open {s.status === "pilot" ? "Tower A to F" : "this society"}.</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Link href={`/waitlist?society=${s.slug}`} className="pill pill-sun" data-cta="map_join">Join the waitlist</Link>
              <Link href="/societies" className="underline decoration-wavy underline-offset-4">Bring your society</Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
