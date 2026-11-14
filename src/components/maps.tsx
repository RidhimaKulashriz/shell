"use client";
// MapProvider interface: the default provider draws a custom brand-palette SVG map (no tile key, works offline,
// fast on cheap phones). A MapLibre GL provider with a Shell style can implement the same props. See ASSUMPTIONS.md.
import { useMemo } from "react";
import { hexCorners, projector, type LatLng } from "@/lib/geo";

export type MapTower = { name: string; lat: number; lng: number };
export type MapHelper = { id: string; name: string; lat: number; lng: number; label?: string };

export function PulseMap({
  boundary,
  gates,
  towers,
  helpers = [],
  me,
  highlightTower,
  className = "",
  labels = true,
  route,
}: {
  boundary: [number, number][];
  gates: { name: string; lat: number; lng: number }[];
  towers: MapTower[];
  helpers?: MapHelper[];
  me?: LatLng & { label?: string };
  highlightTower?: string;
  className?: string;
  labels?: boolean;
  route?: LatLng[];
}) {
  const W = 400;
  const proj = useMemo(() => projector([...boundary.map(([lat, lng]) => ({ lat, lng })), ...gates, ...towers, ...helpers]), [boundary, gates, towers, helpers]);
  const P = (p: LatLng) => {
    const q = proj(p);
    return { x: q.x * W, y: q.y * W };
  };
  const poly = boundary.map(([lat, lng]) => P({ lat, lng })).map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${W}`} className={`h-auto w-full rounded-xl ${className}`} role="img" aria-label="Society map with towers, gates and helper positions">
      <rect width={W} height={W} fill="#0B2B26" />
      <g stroke="#163832" strokeWidth="1">
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <path d={`M0 ${i * 50} H${W}`} />
            <path d={`M${i * 50} 0 V${W}`} />
          </g>
        ))}
      </g>
      {boundary.length > 2 && <polygon points={poly} fill="#163832" stroke="#8EB69B" strokeWidth="2" strokeDasharray="6 5" />}
      {/* internal roads: gate to each tower */}
      <g stroke="#235347" strokeWidth="9" strokeLinecap="round" fill="none">
        {gates.flatMap((g) => towers.slice(0, 3).map((t) => ({ g, t }))).map(({ g, t }, i) => {
          const a = P(g), b = P(t);
          return <path key={i} d={`M${a.x} ${a.y} L${a.x} ${b.y} L${b.x} ${b.y}`} />;
        })}
      </g>
      {route && route.length > 1 && <polyline points={route.map((r) => { const p = P(r); return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke="#F2C318" strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" />}
      {towers.map((t) => {
        const p = P(t);
        const hi = highlightTower === t.name;
        return (
          <g key={t.name} transform={`translate(${p.x - 17} ${p.y - 17})`}>
            <rect width="34" height="34" rx="9" fill={hi ? "#E8C48A" : "#DAF1DE"} stroke="#051F20" strokeWidth="2" transform={`rotate(${hi ? -4 : 2} 17 17)`} />
            <text x="17" y="23" textAnchor="middle" fontFamily="var(--font-display)" fontSize="16" fontWeight="700" fill="#051F20">{t.name.replace("Tower ", "")}</text>
          </g>
        );
      })}
      {gates.map((g) => {
        const p = P(g);
        return (
          <g key={g.name}>
            <path d={`M${p.x - 9} ${p.y + 6} v-12 h18 v12`} fill="none" stroke="#8EB69B" strokeWidth="3" strokeLinecap="round" />
            {labels && <text x={p.x + 14} y={p.y + 4} fontSize="11" fontFamily="var(--font-mono)" fill="#8EB69B">{g.name}</text>}
          </g>
        );
      })}
      {me && (() => {
        const p = P(me);
        return (
          <g>
            <circle cx={p.x} cy={p.y} r="5" fill="#E8C48A" stroke="#051F20" strokeWidth="2" />
            {labels && <text x={p.x + 9} y={p.y - 8} fontSize="11" fontFamily="var(--font-hand)" fill="#E8C48A">{me.label ?? "you"}</text>}
          </g>
        );
      })()}
      {helpers.map((h) => {
        const p = P(h);
        return (
          <g key={h.id}>
            <circle className="pulse-dot" cx={p.x} cy={p.y} r="8" fill="#F2C318" opacity="0.5" />
            <circle cx={p.x} cy={p.y} r="6" fill="#F2C318" stroke="#051F20" strokeWidth="2" />
            {labels && h.label && <text x={p.x + 10} y={p.y + 4} fontSize="12" fontFamily="var(--font-hand)" fill="#DAF1DE">{h.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export type HexCount = { id: string; count: number };

/** Privacy-safe waitlist density: hex-level counts only, never addresses. */
export function WaitlistMap({ hexes, societies, selected, onSelect, className = "" }: { hexes: HexCount[]; societies: { id: string; name: string; lat: number; lng: number }[]; selected?: string; onSelect?: (id: string) => void; className?: string }) {
  const W = 400;
  const data = useMemo(() => {
    const corners = hexes.map((h) => ({ ...h, c: hexCorners(h.id) }));
    const all: LatLng[] = [...corners.flatMap((h) => h.c), ...societies];
    const proj = projector(all.length ? all : [{ lat: 28.59, lng: 77.04 }]);
    const max = Math.max(1, ...hexes.map((h) => h.count));
    return { corners, proj, max };
  }, [hexes, societies]);
  const P = (p: LatLng) => {
    const q = data.proj(p);
    return { x: q.x * W, y: q.y * W };
  };
  return (
    <svg viewBox={`0 0 ${W} ${W}`} className={`h-auto w-full rounded-xl ${className}`} role="img" aria-label="Waitlist density map. Hexagons show how many neighbours are waiting in each area.">
      <rect width={W} height={W} fill="#0B2B26" />
      {data.corners.map((h) => {
        const pts = h.c.map((c) => { const p = P(c); return `${p.x},${p.y}`; }).join(" ");
        const a = 0.25 + 0.75 * (h.count / data.max);
        return <polygon key={h.id} points={pts} fill="#8EB69B" fillOpacity={a} stroke="#DAF1DE" strokeOpacity="0.3" strokeWidth="1" />;
      })}
      {societies.map((s) => {
        const p = P(s);
        const on = selected === s.id;
        return (
          <g key={s.id} tabIndex={0} role="button" aria-label={s.name} className="cursor-pointer" onClick={() => onSelect?.(s.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect?.(s.id)}>
            <circle className={on ? "pulse-dot" : ""} cx={p.x} cy={p.y} r="12" fill="#F2C318" opacity="0.4" />
            <circle cx={p.x} cy={p.y} r={on ? 8 : 6} fill={on ? "#F2C318" : "#E8C48A"} stroke="#051F20" strokeWidth="2" />
            <text x={p.x + 12} y={p.y - 10} fontSize="12" fontFamily="var(--font-hand)" fill="#DAF1DE" fontWeight="700">{s.name.split(",")[0]}</text>
          </g>
        );
      })}
    </svg>
  );
}
