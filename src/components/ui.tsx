"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Adds `.in` once the element scrolls into view. */
export function useInView<T extends HTMLElement>(threshold = 0.25) {
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

export function Reveal({ children, rot = 0, delay = 0, className = "", as: Tag = "div" }: { children: ReactNode; rot?: number; delay?: number; className?: string; as?: "div" | "li" | "section" }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.12);
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${seen ? "in" : ""} ${className}`}
      style={{ "--rot": `${rot}deg`, transitionDelay: `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Hand-drawn underline that draws itself on scroll. */
export function Underline({ children, color = "#F2C318", className = "" }: { children: ReactNode; color?: string; className?: string }) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.6);
  return (
    <span ref={ref} className={`relative inline-block ${className}`}>
      {children}
      <svg className={`draw ${seen ? "in" : ""} pointer-events-none absolute -bottom-2 left-0 h-3 w-full`} viewBox="0 0 200 12" preserveAspectRatio="none" fill="none" aria-hidden="true" style={{ "--len": 230 } as CSSProperties}>
        <path d="M3 8 C40 2 70 11 110 6 C140 3 170 9 197 4" stroke={color} strokeWidth="4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** Hand-drawn circle around a word or area. */
export function HandCircle({ children, color = "#F2C318" }: { children: ReactNode; color?: string }) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.6);
  return (
    <span ref={ref} className="relative inline-block px-2">
      {children}
      <svg className={`draw ${seen ? "in" : ""} pointer-events-none absolute -inset-x-2 -inset-y-1 h-[calc(100%+8px)] w-[calc(100%+16px)]`} viewBox="0 0 120 50" preserveAspectRatio="none" fill="none" aria-hidden="true" style={{ "--len": 330 } as CSSProperties}>
        <path d="M60 4 C20 2 4 16 6 28 C8 44 50 48 84 44 C112 40 118 24 106 14 C94 4 66 4 40 6" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Stamp({ children, tone = "red", thump = false, className = "" }: { children: ReactNode; tone?: "red" | "green"; thump?: boolean; className?: string }) {
  return <span className={`stamp ${tone === "green" ? "stamp-green" : ""} ${thump ? "stamp-thump" : ""} ${className}`}>{children}</span>;
}

export function Washi({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`washi ${className}`}>{children}</span>;
}

/** Number that rolls like a meter whenever `value` changes. */
export function Meter({ value, prefix = "", duration = 700, className = "" }: { value: number; prefix?: string; duration?: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(a + (value - a) * e));
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={`tabular-nums ${className}`}>{prefix}{shown.toLocaleString("en-IN")}</span>;
}

/** Readiness Ring: "Ghar Ready %" */
export function Ring({ percent, size = 120, label = "Ghar ready", sub, tone = "light" }: { percent: number; size?: number; label?: string; sub?: string; tone?: "light" | "dark" }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, percent)) / 100);
  const track = tone === "dark" ? "#235347" : "#cfe3d3";
  const ink = tone === "dark" ? "#DAF1DE" : "#0E1A17";
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label} ${Math.round(percent)} percent`}>
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke={track} strokeWidth="9" strokeDasharray="2 5" strokeLinecap="round" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="#235347" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.6,0,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center" style={{ color: ink }}>
        <div>
          <div className="font-display leading-none" style={{ fontSize: size * 0.26 }}>{Math.round(percent)}%</div>
          <div className="font-mono uppercase" style={{ fontSize: Math.max(8, size * 0.07), letterSpacing: "0.12em" }}>{label}</div>
          {sub ? <div className="font-hand" style={{ fontSize: size * 0.12 }}>{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}

export type ReceiptLine = { label: string; sub?: string; amount: string; stamped?: boolean; delay?: number };

/** Thermal receipt card with dotted leaders and a scalloped tear-off edge. */
export function Receipt({ title = "SHELL RECEIPT", lines, total, totalLabel = "TOTAL (est.)", foot, className = "", stamp }: { title?: string; lines: ReceiptLine[]; total?: ReactNode; totalLabel?: string; foot?: ReactNode; className?: string; stamp?: ReactNode }) {
  return (
    <div className={`receipt scallop relative px-5 pb-9 pt-5 text-[13px] ${className}`}>
      <div className="flex items-center justify-between text-[11px] tracking-[0.2em]">
        <span>{title}</span>
        <span>№ {"SH-0001"}</span>
      </div>
      <hr className="perf my-3" />
      <ul className="space-y-2.5">
        {lines.map((l, i) => (
          <li key={l.label + i} className="slidein" style={{ animationDelay: `${l.delay ?? 0}ms` }}>
            <div className="flex items-baseline gap-2">
              <span className="font-medium">{l.label}</span>
              <span className="leader" />
              <span className="tabular-nums">{l.amount}</span>
              {l.stamped ? (
                <span className="stamp stamp-green stamp-thump -my-1 text-[9px]" style={{ animationDelay: `${(l.delay ?? 0) + 250}ms`, padding: "0 .3rem", borderWidth: 2 }}>OK</span>
              ) : null}
            </div>
            {l.sub ? <div className="text-[11px] opacity-60">{l.sub}</div> : null}
          </li>
        ))}
      </ul>
      <hr className="perf my-3" />
      {total !== undefined ? (
        <div className="flex items-baseline justify-between text-base font-medium">
          <span>{totalLabel}</span>
          <span className="tabular-nums">{total}</span>
        </div>
      ) : null}
      {foot ? <div className="mt-2 text-[11px] opacity-70">{foot}</div> : null}
      {stamp ? <div className="absolute bottom-10 right-4">{stamp}</div> : null}
    </div>
  );
}

export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const row = [...items, ...items];
  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      <div className="marquee">
        {row.map((t, i) => (
          <span key={i} className="mx-6 whitespace-nowrap">{t}</span>
        ))}
      </div>
    </div>
  );
}
