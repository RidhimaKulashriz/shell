"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icons";
import { hexCenter, type LatLng } from "@/lib/geo";

export function Stamp({ children, tone = "green", className = "", animate = false }: { children: React.ReactNode; tone?: "green" | "red" | "blue"; className?: string; animate?: boolean }) {
  return <span className={cn("stamp", `stamp-${tone}`, animate && "stamp-in", className)}>{children}</span>;
}

export function Meter({ value, format = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`, ms = 700 }: { value: number; format?: (n: number) => string; ms?: number }) {
  const [v, setV] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(value); from.current = value; return; }
    const start = performance.now(), a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms), e = 1 - Math.pow(1 - k, 3);
      setV(a + (value - a) * e);
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return <span>{format(v)}</span>;
}

export function useCountdown(to: string | Date | null | undefined) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const i = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(i); }, []);
  if (!to || now === null) return null;
  const ms = new Date(to).getTime() - now;
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`;
}

export function ReadinessRing({ percent, deadline, size = 150, label = "Home ready", dark = false }: { percent: number; deadline?: string | Date | null; size?: number; label?: string; dark?: boolean }) {
  const r = 52, c = 2 * Math.PI * r;
  const [p, setP] = useState(0);
  useEffect(() => { const t = setTimeout(() => setP(percent), 80); return () => clearTimeout(t); }, [percent]);
  const left = useCountdown(deadline);
  return (
    <div className="inline-flex flex-col items-center" role="img" aria-label={`${label} ${percent} percent`}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke={dark ? "#235347" : "#d5e2d6"} strokeWidth="9" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={p >= 100 ? "#1f9d63" : dark ? "#f2c318" : "#235347"} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p / 100)} transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.3,.8,.3,1)" }} />
        <text x="60" y="58" textAnchor="middle" className="serif" fontSize="26" fontWeight="700" fill={dark ? "#daf1de" : "#051f20"}>{Math.round(percent)}%</text>
        <text x="60" y="76" textAnchor="middle" fontSize="9" fill={dark ? "#8eb69b" : "#235347"} letterSpacing=".08em">{label.toUpperCase()}</text>
      </svg>
      {left && deadline ? <span className="mt-1 text-sm font-medium" style={{ color: dark ? "#daf1de" : "#235347" }}>{left === "now" ? "Deadline reached" : `Due in ${left}`}</span> : null}
    </div>
  );
}

export type ReceiptLine = { name: string; detail?: string; amount: string; stamped?: boolean };
export function Receipt({ title, subtitle, lines, fees = [], total, totalLabel = "Total", status, footer, animate = false, className = "" }: {
  title: string; subtitle?: string; lines: ReceiptLine[]; fees?: { label: string; amount: string; muted?: boolean }[]; total: string; totalLabel?: string;
  status?: string | null; footer?: React.ReactNode; animate?: boolean; className?: string;
}) {
  return (
    <div className={cn("receipt px-5 pt-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[0.7rem] tracking-[0.2em] text-euca">SHELL RECEIPT</div>
          <div className="serif text-lg font-semibold leading-tight text-ink" style={{ fontFamily: "var(--font-serif)" }}>{title}</div>
          {subtitle && <div className="mt-0.5 text-xs text-ink/60">{subtitle}</div>}
        </div>
        {status && <Stamp tone="green" animate className="shrink-0">{status}</Stamp>}
      </div>
      <hr className="perf" />
      <ul className="space-y-2.5">
        {lines.map((l, i) => (
          <li key={i} className={cn(animate && "slide-in")} style={animate ? { animationDelay: `${i * 220}ms` } : undefined}>
            <div className="flex items-baseline">
              <span className="font-medium">{l.name}</span><span className="leader" /><span>{l.amount}</span>
            </div>
            {(l.detail || l.stamped) && (
              <div className="flex items-center justify-between text-[0.72rem] text-ink/60">
                <span>{l.detail}</span>
                {l.stamped && <Stamp tone="blue" animate={animate} className="!text-[0.6rem] !px-1.5" >CONFIRMED</Stamp>}
              </div>
            )}
          </li>
        ))}
      </ul>
      {fees.length > 0 && <hr className="perf" />}
      <ul className="space-y-1.5 text-[0.8rem]">
        {fees.map((f, i) => (
          <li key={i} className={cn("flex items-baseline", f.muted && "text-ink/60")}><span>{f.label}</span><span className="leader" /><span>{f.amount}</span></li>
        ))}
      </ul>
      <hr className="perf" />
      <div className="flex items-baseline text-base font-bold"><span>{totalLabel}</span><span className="leader" /><span>{total}</span></div>
      {footer && <div className="mt-3 text-xs text-ink/70">{footer}</div>}
      <div className="h-3" />
    </div>
  );
}

// ---- Custom maps (no external tiles, brand palette) ----
type Pt = { name?: string; lat: number; lng: number };
function project(points: LatLng[], w: number, h: number, pad = 36) {
  const lats = points.map((p) => p.lat), lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const spanX = Math.max(1e-6, (maxLng - minLng) * kx), spanY = Math.max(1e-6, maxLat - minLat);
  const s = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanY);
  const offX = (w - spanX * s) / 2, offY = (h - spanY * s) / 2;
  return (p: LatLng) => ({ x: offX + (p.lng - minLng) * kx * s, y: offY + (maxLat - p.lat) * s });
}

export function SocietyMap({ gates, towers, boundary, helper, focusTower, label, className = "" }: {
  gates: Pt[]; towers: Pt[]; boundary?: [number, number][]; helper?: LatLng | null; focusTower?: string; label?: string; className?: string;
}) {
  const W = 640, H = 420;
  const pts: LatLng[] = [...gates, ...towers, ...(boundary ?? []).map(([lat, lng]) => ({ lat, lng }))];
  const proj = project(pts, W, H, 50);
  const g = gates.map((x) => ({ ...x, ...proj(x) })), t = towers.map((x) => ({ ...x, ...proj(x) }));
  const cx = t.reduce((s, x) => s + x.x, 0) / (t.length || 1), cy = t.reduce((s, x) => s + x.y, 0) / (t.length || 1);
  const hp = helper ? proj(helper) : null;
  const poly = (boundary ?? []).map(([lat, lng]) => proj({ lat, lng })).map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("w-full rounded-2xl", className)} role="img" aria-label={label ?? "Society map"} style={{ background: "#0b2b26" }}>
      <defs><pattern id="gr" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#163832" strokeWidth="1" /></pattern></defs>
      <rect width={W} height={H} fill="url(#gr)" />
      {poly && <polygon points={poly} fill="#163832" fillOpacity=".7" stroke="#8eb69b" strokeWidth="1.5" strokeDasharray="6 5" />}
      {g.map((x, i) => <path key={i} d={`M${x.x},${x.y} L${cx},${cy}`} stroke="#235347" strokeWidth="9" strokeLinecap="round" />)}
      {t.map((x, i) => <path key={i} d={`M${cx},${cy} L${x.x},${x.y}`} stroke="#235347" strokeWidth="5" strokeLinecap="round" />)}
      {t.map((x) => {
        const on = focusTower === x.name;
        return (
          <g key={x.name}>
            {on && <circle cx={x.x} cy={x.y} r="24" fill="none" stroke="#f2c318" strokeWidth="2" strokeDasharray="4 4" />}
            <rect x={x.x - 15} y={x.y - 15} width="30" height="30" rx="7" fill={on ? "#f2c318" : "#daf1de"} />
            <text x={x.x} y={x.y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#051f20">{x.name?.replace("Tower ", "")}</text>
          </g>
        );
      })}
      {g.map((x) => (
        <g key={x.name}>
          <rect x={x.x - 7} y={x.y - 7} width="14" height="14" rx="3" fill="#e8c48a" />
          <text x={x.x} y={x.y - 12} textAnchor="middle" fontSize="11" fill="#e8c48a">{x.name}</text>
        </g>
      ))}
      {hp && (
        <g style={{ transition: "transform 1.5s ease" }}>
          <circle cx={hp.x} cy={hp.y} r="5" fill="#f2c318" className="pulse-ring" />
          <circle cx={hp.x} cy={hp.y} r="7" fill="#f2c318" stroke="#051f20" strokeWidth="2.5" />
        </g>
      )}
    </svg>
  );
}

export function HexMap({ cells, highlight, className = "" }: { cells: { hex: string; count: number }[]; highlight?: string; className?: string }) {
  const W = 640, H = 360;
  const centers = cells.map((c) => ({ ...c, ...hexCenter(c.hex) }));
  if (!centers.length) return <div className={cn("grid place-items-center rounded-2xl bg-forest p-10 text-sage", className)}>No signups yet. You could be the first.</div>;
  const pts: LatLng[] = centers.flatMap((c) => [{ lat: c.lat + c.size * 1.2, lng: c.lng }, { lat: c.lat - c.size * 1.2, lng: c.lng }, { lat: c.lat, lng: c.lng + c.size * 1.2 }, { lat: c.lat, lng: c.lng - c.size * 1.2 }]);
  const proj = project(pts, W, H, 24);
  const max = Math.max(...centers.map((c) => c.count));
  const kx = Math.cos((28.6 * Math.PI) / 180);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("w-full rounded-2xl", className)} role="img" aria-label="Waitlist density by area. Each hexagon is about 500 metres across." style={{ background: "#0b2b26" }}>
      {centers.map((c) => {
        const verts = [0, 1, 2, 3, 4, 5].map((i) => { const a = (Math.PI / 180) * (60 * i - 30); return proj({ lat: c.lat + c.size * Math.sin(a), lng: c.lng + (c.size * Math.cos(a)) / kx }); });
        const k = c.count / max;
        return (
          <polygon key={c.hex} points={verts.map((v) => `${v.x},${v.y}`).join(" ")} fill={k > 0.66 ? "#f2c318" : k > 0.33 ? "#8eb69b" : "#235347"} fillOpacity={0.55 + k * 0.4}
            stroke={highlight === c.hex ? "#fff" : "#0b2b26"} strokeWidth={highlight === c.hex ? 3 : 1.5}><title>{c.count} neighbours waiting</title></polygon>
        );
      })}
    </svg>
  );
}

export function EmptyState({ title = "Nothing here yet.", note = "It's peaceful. Enjoy it.", icon = "plant", action }: { title?: string; note?: string; icon?: string; action?: React.ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-cream text-euca"><Icon name={icon} size={28} /></div>
      <p className="serif text-lg font-semibold">{title}</p>
      <p className="max-w-xs text-sm text-ink/60">{note}</p>
      {action}
    </div>
  );
}

export function Toast({ msg, kind = "ok", onDone }: { msg: string; kind?: "ok" | "err"; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div role="status" aria-live="polite" className={cn("fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg md:bottom-8", kind === "ok" ? "bg-tide text-cream" : "bg-danger text-white")}>{msg}</div>
  );
}
