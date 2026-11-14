"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export function prefersReduced() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  return (
    <div ref={ref} className={`reveal ${seen ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

type PillProps = {
  href?: string;
  onClick?: () => void;
  variant?: "sun" | "forest" | "cream" | "ghost";
  size?: "md" | "sm";
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  "data-cta"?: string;
  ariaLabel?: string;
};
export function Pill({ href, onClick, variant = "forest", size = "md", children, className = "", type = "button", disabled, ariaLabel, ...rest }: PillProps) {
  const cls = `btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`;
  const cta = rest["data-cta"];
  if (href) {
    return (
      <Link
        href={href}
        className={cls}
        aria-label={ariaLabel}
        onClick={() => {
          if (cta) import("@/lib/analytics").then((m) => m.track("cta_click", { location: cta }));
          onClick?.();
        }}
      >
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

export function Stamp({ label, tone = "green", delay = 0, rot = -6, large = false, className = "" }: { label: string; tone?: "green" | "brick" | "ink"; delay?: number; rot?: number; large?: boolean; className?: string }) {
  return (
    <span
      className={`stamp thump ${tone === "brick" ? "stamp-brick" : tone === "ink" ? "stamp-ink" : ""} ${large ? "stamp-lg" : ""} ${className}`}
      style={{ animationDelay: `${delay}ms`, ["--rot" as string]: `${rot}deg` } as CSSProperties}
    >
      {label}
    </span>
  );
}

export function Washi({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`washi ${className}`}>{children}</span>;
}
export function Sticker({ children, rot = 0, className = "" }: { children: ReactNode; rot?: number; className?: string }) {
  return (
    <span className={`sticker ${className}`} style={{ transform: `rotate(${rot}deg)` }}>
      {children}
    </span>
  );
}

export function Perf({ className = "" }: { className?: string }) {
  return <div className={`perf ${className}`} role="separator" />;
}

export function HandUnderline({ className = "", color = "var(--color-sun)" }: { className?: string; color?: string }) {
  const [ref, seen] = useInView<SVGSVGElement>(0.5);
  return (
    <svg ref={ref} viewBox="0 0 200 14" preserveAspectRatio="none" className={`absolute left-0 -bottom-2 h-3 w-full ${className}`} aria-hidden>
      <path className={`draw ${seen ? "on" : ""}`} pathLength={1} d="M2 9 C38 3 80 12 122 6 S182 7 198 4" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function HandCircle({ className = "", color = "var(--color-brick)", delay = 0 }: { className?: string; color?: string; delay?: number }) {
  const [ref, seen] = useInView<SVGSVGElement>(0.4);
  return (
    <svg ref={ref} viewBox="0 0 100 60" preserveAspectRatio="none" className={`pointer-events-none absolute ${className}`} aria-hidden>
      <path
        className={`draw ${seen ? "on" : ""}`}
        style={{ transitionDelay: `${delay}ms` }}
        pathLength={1}
        d="M52 4 C20 2 3 18 5 32 C8 50 38 57 62 54 C90 50 98 34 92 20 C86 8 60 3 30 9"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Pen-stroke tick that draws itself. */
export function Tick({ on = true, size = 22, color = "var(--color-euc)" }: { on?: boolean; size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path className={`draw ${on ? "on" : ""}`} pathLength={1} d="M3 13 L9.5 19.5 L21 5" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Number that rolls like a meter. */
export function Meter({ value, prefix = "", suffix = "", duration = 900, className = "" }: { value: number; prefix?: string; suffix?: string; duration?: number; className?: string }) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  const [ref, seen] = useInView<HTMLSpanElement>(0.2);
  useEffect(() => {
    if (!seen) return;
    if (prefersReduced()) {
      setV(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      const cur = a + (value - a) * e;
      setV(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, seen, duration]);
  return (
    <span ref={ref} className={`mono ${className}`}>
      {prefix}
      {Math.round(v).toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/** Readiness Ring: "Home ready %" */
export function Ring({ pct, size = 160, label = "Home Ready", sub, tone = "forest" }: { pct: number; size?: number; label?: string; sub?: string; tone?: "forest" | "cream" }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setP(pct), 80);
    return () => clearTimeout(id);
  }, [pct]);
  const r = 44;
  const c = 2 * Math.PI * r;
  const fg = tone === "cream" ? "var(--color-sand)" : "var(--color-euc)";
  const bg = tone === "cream" ? "rgba(218,241,222,.18)" : "rgba(11,43,38,.14)";
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label} ${Math.round(pct)} percent${sub ? ", " + sub : ""}`}>
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke={bg} strokeWidth="9" strokeDasharray="1 5" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={fg} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * p) / 100} style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.3,.8,.3,1)" }} />
      </svg>
      <div className="absolute text-center leading-tight">
        <div className="display" style={{ fontSize: size * 0.24 }}>
          {Math.round(pct)}
          <span style={{ fontSize: size * 0.12 }}>%</span>
        </div>
        <div className="hand opacity-80" style={{ fontSize: size * 0.11 }}>
          {label}
        </div>
        {sub && (
          <div className="mono opacity-70" style={{ fontSize: Math.max(10, size * 0.075) }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export function Countdown({ to, prefix = "" }: { to: string | number | Date; prefix?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return <span className="mono">--</span>;
  const ms = new Date(to).getTime() - now;
  if (ms <= 0) return <span className="mono">{prefix}now</span>;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return (
    <span className="mono">
      {prefix}
      {h}h {String(m).padStart(2, "0")}m
    </span>
  );
}

export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const row = (
    <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={false}>
      {items.map((t, i) => (
        <span key={i} className="whitespace-nowrap">
          {t} <span className="mx-3 opacity-50">/</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="marquee">
        {row}
        <div aria-hidden className="flex">
          {row}
        </div>
      </div>
    </div>
  );
}

export type RLine = { name: string; qty?: string; price: string; stamp?: boolean | string; sub?: string };

/** The Shell Receipt: thermal-receipt card with dotted leaders, a stamp per confirmed line, scalloped tear-off edge. */
export function Receipt({
  title,
  meta,
  lines,
  fees = [],
  total,
  totalLabel = "TOTAL",
  footer,
  paid = false,
  className = "",
  animate = true,
  baseDelay = 150,
  rot = 0,
}: {
  title: string;
  meta?: string;
  lines: RLine[];
  fees?: { name: string; price: string }[];
  total?: ReactNode;
  totalLabel?: string;
  footer?: ReactNode;
  paid?: boolean;
  className?: string;
  animate?: boolean;
  baseDelay?: number;
  rot?: number;
}) {
  return (
    <div className={`receipt scallop-b ${className}`} style={{ transform: `rotate(${rot}deg)` }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="display text-[1.2rem]" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </div>
          {meta && <div className="opacity-60">{meta}</div>}
        </div>
        <div className="text-right text-[10px] uppercase tracking-widest opacity-60">
          SHELL
          <br />
          RECEIPT
        </div>
      </div>
      <div className="perf" />
      <div>
        {lines.map((l, i) => (
          <div key={l.name + i} className={`receipt-line ${animate ? "slide-in" : ""}`} style={{ animationDelay: `${baseDelay + i * 380}ms` }}>
            <span className="max-w-[60%]">
              {l.name}
              {l.qty && <span className="opacity-60"> x{l.qty}</span>}
              {l.sub && <span className="block text-[11px] opacity-60">{l.sub}</span>}
            </span>
            <span className="leader" />
            <span className="whitespace-nowrap">{l.price}</span>
            {l.stamp && (
              <span className="absolute -right-1 -top-1">
                <Stamp label={typeof l.stamp === "string" ? l.stamp : "OK"} delay={animate ? baseDelay + i * 380 + 300 : 0} rot={-8 + (i % 3) * 5} />
              </span>
            )}
          </div>
        ))}
      </div>
      {fees.length > 0 && <div className="perf" />}
      {fees.map((f) => (
        <div key={f.name} className="receipt-line opacity-80">
          <span>{f.name}</span>
          <span className="leader" />
          <span>{f.price}</span>
        </div>
      ))}
      {total !== undefined && (
        <>
          <div className="perf" />
          <div className="relative flex items-baseline justify-between text-[1.15rem] font-medium">
            <span>{totalLabel}</span>
            <span>{total}</span>
            {paid && (
              <span className="pointer-events-none absolute -top-5 right-8">
                <Stamp label="PAID" tone="brick" large rot={-12} delay={baseDelay + lines.length * 380 + 200} />
              </span>
            )}
          </div>
        </>
      )}
      {footer && <div className="mt-3 text-[11px] opacity-70">{footer}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function SectionNote({ children, rot = -2, className = "" }: { children: ReactNode; rot?: number; className?: string }) {
  return (
    <span className={`hand inline-block text-2xl ${className}`} style={{ transform: `rotate(${rot}deg)` }}>
      {children}
    </span>
  );
}
