"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CONTACT } from "@/lib/site";
import { getConsent, track } from "@/lib/track";
import { useLang } from "@/lib/i18n";

export function InkFilter() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <filter id="ink-bleed" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
        <feGaussianBlur stdDeviation="0.25" />
      </filter>
    </svg>
  );
}

export function WhatsAppButton() {
  const path = usePathname();
  const href = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(`Hi Shell! Main ye page dekh raha/rahi tha: ${typeof window !== "undefined" ? location.href : path}`)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Shell on WhatsApp"
      onClick={(e) => {
        track("whatsapp_click", { page: path });
        (e.currentTarget as HTMLAnchorElement).href = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(`Hi Shell! Main ye page dekh raha/rahi tha: ${location.href}`)}`;
      }}
      className="pill pill-forest fixed bottom-5 right-4 z-40 !gap-2 !px-4 !py-3.5 shadow-lg md:bottom-6 md:right-6"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20 L5.4 15.6 C3 11.6 4.4 6.6 8.4 4.6 C12.4 2.6 17.4 4.2 19.4 8.2 C21.4 12.2 19.8 17 15.8 19 C13.4 20.2 10.6 20.2 8.4 19 Z" /><path d="M9 9 C9 12 12 15 15 15 L15.6 13.6 L13.6 12.6 L12.8 13.2 C12 12.8 11.4 12.2 11 11.4 L11.6 10.6 L10.6 8.6 Z" /></svg>
      <span className="hidden text-sm sm:inline">WhatsApp</span>
    </a>
  );
}

export function CookieConsent() {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  useEffect(() => {
    if (getConsent() === null) setShow(true);
  }, []);
  const save = (v: "all" | "essential") => {
    try {
      localStorage.setItem("shell_consent", v);
    } catch {}
    setShow(false);
    if (v === "all") track("page_view");
  };
  if (!show) return null;
  return (
    <div role="dialog" aria-label="Cookie consent" className="bg-paper fixed bottom-24 left-3 right-3 z-50 max-w-sm -rotate-1 rounded-[22px_26px_20px_28px] p-4 shadow-[0_14px_0_rgba(5,31,32,0.18)] ring-2 ring-tide md:bottom-6 md:left-6 md:right-auto">
      <span className="washi absolute -top-3 left-6 rotate-3">cookies</span>
      <p className="font-display text-lg font-bold leading-tight">{t("cookie.title")}</p>
      <p className="mt-1 text-sm text-ink/80">{t("cookie.body")}</p>
      {custom ? (
        <div className="mt-3 space-y-2 text-sm">
          <label className="flex items-center gap-2 opacity-70"><input type="checkbox" checked disabled /> Essential (always on)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} /> Visit counting (first-party)</label>
          <button className="pill pill-forest !py-2.5 text-sm" onClick={() => save(analytics ? "all" : "essential")}>Save</button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="pill pill-sun !px-4 !py-2.5 text-sm" onClick={() => save("all")}>{t("cookie.accept")}</button>
          <button className="pill pill-line !px-4 !py-2.5 text-sm" onClick={() => save("essential")}>{t("cookie.reject")}</button>
          <button className="px-2 text-sm underline" onClick={() => setCustom(true)}>{t("cookie.custom")}</button>
        </div>
      )}
      <Link href="/legal/cookies" className="mt-2 block text-xs underline">Cookie policy</Link>
    </div>
  );
}

/** page_view, scroll_depth, cta_click (via data-cta) and form events. */
export function Analytics() {
  const path = usePathname();
  useEffect(() => {
    track("page_view");
    const fired = new Set<number>();
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      if (h <= 0) return;
      const p = (scrollY / h) * 100;
      for (const m of [25, 50, 75, 100]) {
        if (p >= m - 1 && !fired.has(m)) {
          fired.add(m);
          track("scroll_depth", { depth: m });
        }
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, [path]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest?.("[data-cta]");
      if (el) track("cta_click", { location: el.getAttribute("data-cta") });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}

/** Konami code: up up down down left right left right b a */
export function Konami() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let i = 0;
    const h = (e: KeyboardEvent) => {
      i = e.key === seq[i] ? i + 1 : e.key === seq[0] ? 1 : 0;
      if (i === seq.length) {
        i = 0;
        setOn(true);
        setTimeout(() => setOn(false), 4200);
      }
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, []);
  if (!on) return null;
  const bits = Array.from({ length: 36 }, (_, i) => i);
  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-live="polite">
      {bits.map((i) => (
        <span
          key={i}
          className="absolute top-1/2 left-1/2 block h-3 w-2 rounded-[1px]"
          style={{ background: ["#F2C318", "#8EB69B", "#E8C48A", "#235347"][i % 4], ["--dx" as string]: `${(i % 9 - 4) * 90}px`, ["--dy" as string]: `${(Math.floor(i / 9) - 1.5) * 260 + 300}px`, ["--rr" as string]: `${i * 47}deg`, animation: "paperbit 2.4s ease-out forwards" }}
        />
      ))}
      <div className="stamp stamp-thump absolute left-1/2 top-1/3 -translate-x-1/2 bg-paper px-6 py-3 text-2xl">Chai ready hai</div>
    </div>
  );
}
