"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV } from "@/lib/catalog";
import { useLang } from "@/lib/i18n";
import { Icon } from "./Icon";
import { Marquee } from "./ui";

export function Wordmark({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const c = tone === "dark" ? "#051F20" : "#DAF1DE";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="Shell">
      <svg viewBox="0 0 40 40" width="30" height="30" fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
        <path d="M20 35 C9 35 4 27 5 19 C6 10 14 4 22 5 C31 6 36 13 34 21 C32 28 25 31 20 29 C15 27 14 21 17 18 C20 15 25 17 24 21 C23.4 23 21 23 20.6 21.6" />
        <path d="M8 31 L33 31" stroke="#F2C318" strokeWidth="3" />
      </svg>
      <span className="font-display text-[1.6rem] font-black leading-none tracking-tight" style={{ color: c, fontVariationSettings: '"SOFT" 100, "WONK" 1' }}>
        SHELL
      </span>
    </span>
  );
}

export function Announcement() {
  const { lang } = useLang();
  const [text, setText] = useState<{ en: string; hi: string } | null>(null);
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    try {
      const d = Number(localStorage.getItem("shell_ann_dismissed") ?? 0);
      if (Date.now() - d < 7 * 86400000) return;
    } catch {}
    fetch("/api/announcement")
      .then((r) => r.json())
      .then((j) => {
        if (j.announcement) {
          setText(j.announcement);
          setHidden(false);
        }
      })
      .catch(() => {});
  }, []);
  if (hidden || !text) return null;
  const msg = lang === "hi" ? text.hi : text.en;
  return (
    <div className="band-tide relative z-50 flex items-center text-sm" role="region" aria-label="Announcement">
      <Marquee className="flex-1 py-2 font-mono text-[12px] tracking-wide" items={[msg, "Get comfortable. We've got it.", msg, "Made in Delhi, with chai"]} />
      <span className="sr-only">{msg}</span>
      <button
        className="shrink-0 px-4 py-2 text-lg leading-none text-sage hover:text-cream"
        aria-label="Dismiss announcement"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem("shell_ann_dismissed", String(Date.now()));
          } catch {}
        }}
      >
        ×
      </button>
    </div>
  );
}

const MEGA = [
  { href: "/services/quick", name: "Shell Quick", line: "Ek chhota kaam, ek price", icon: "bag" },
  { href: "/services/managed", name: "Shell Managed", line: "Poora plan, ek zimmedar", icon: "home" },
  { href: "/earn", name: "Shell Earn", line: "Padhai ke saath kamai", icon: "book" },
  { href: "/services/routines", name: "Shell Routines", line: "Jaldi aa raha hai", icon: "calendar" },
];

export function Header() {
  const { lang, setLang, t } = useLang();
  const path = usePathname();
  const [hide, setHide] = useState(false);
  const [small, setSmall] = useState(false);
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSmall(y > 80);
      setHide(y > last.current && y > 160);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setOpen(false);
    setMega(false);
  }, [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header className={`sticky top-0 z-40 transition-transform duration-300 ${hide && !open ? "-translate-y-full" : "translate-y-0"}`}>
        <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 md:px-8 ${small ? "py-2" : "py-4"}`}>
          <div className={`flex w-full items-center justify-between rounded-full px-4 transition-all duration-300 md:px-6 ${small ? "bg-paper/95 py-1.5 shadow-[0_6px_0_rgba(5,31,32,0.12)]" : "py-1"}`}>
            <Link href="/" aria-label="Shell home" className="shrink-0">
              <Wordmark />
            </Link>
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
              {NAV.map((n) =>
                n.href === "/services" ? (
                  <div key={n.href} className="relative" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
                    <button className="rounded-full px-3 py-2 text-[0.95rem] font-medium hover:bg-sage/30" aria-expanded={mega} aria-haspopup="true" onClick={() => setMega((m) => !m)} onFocus={() => setMega(true)}>
                      {lang === "hi" ? n.hi : n.en} <span aria-hidden="true">▾</span>
                    </button>
                    {mega ? (
                      <div className="absolute left-0 top-full z-50 w-[30rem] pt-2">
                        <div className="bg-paper relative -rotate-1 rounded-3xl p-3 shadow-[0_18px_30px_-12px_rgba(0,0,0,0.5)] ring-2 ring-tide/80" style={{ borderRadius: "28px 34px 26px 36px" }}>
                          <ul className="grid grid-cols-2 gap-2">
                            {MEGA.map((m) => (
                              <li key={m.href}>
                                <Link href={m.href} className="flex items-start gap-3 rounded-2xl p-3 hover:bg-sage/30">
                                  <Icon name={m.icon} size={34} />
                                  <span>
                                    <span className="font-display block text-[1.05rem] font-bold leading-tight">{m.name}</span>
                                    <span className="text-[0.82rem] text-euca">{m.line}</span>
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                          <Link href="/tasks" className="hand mt-1 block px-3 py-1 text-lg text-euca underline decoration-wavy decoration-sun underline-offset-4">
                            Saare kaam dekho →
                          </Link>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Link key={n.href} href={n.href} className={`rounded-full px-3 py-2 text-[0.95rem] font-medium hover:bg-sage/30 ${path === n.href ? "bg-sage/40" : ""}`}>
                    {lang === "hi" ? n.hi : n.en}
                  </Link>
                ),
              )}
            </nav>
            <div className="flex items-center gap-2">
              <LangToggle />
              <Link href="/waitlist" className="pill pill-sun hidden !py-3 text-sm sm:inline-flex" data-cta="header_waitlist">
                {t("nav.waitlist")}
              </Link>
              <button className="grid h-11 w-11 place-items-center rounded-full bg-tide text-cream lg:hidden" aria-label={t("nav.menu")} aria-expanded={open} onClick={() => setOpen(true)}>
                <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true"><path d="M1 2 H19 M1 7 H14 M1 12 H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {open ? (
        <div className="bg-paper fixed inset-0 z-[70] flex flex-col overflow-y-auto px-6 pb-8 pt-5" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex items-center justify-between">
            <Wordmark />
            <button className="grid h-11 w-11 place-items-center rounded-full bg-tide text-xl text-cream" onClick={() => setOpen(false)} aria-label="Close menu">×</button>
          </div>
          <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Mobile">
            {[...NAV, { href: "/tasks", en: "All tasks", hi: "सारे काम" }].map((n, i) => (
              <Link key={n.href} href={n.href} className="font-display slidein border-b-2 border-dotted border-tide/20 py-3 text-[2.2rem] font-bold leading-none" style={{ animationDelay: `${i * 40}ms` }}>
                {lang === "hi" ? n.hi : n.en}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex items-center justify-between gap-4">
            <LangToggle />
            <Link href="/waitlist" className="pill pill-sun">{t("nav.waitlist")}</Link>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function LangToggle({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { lang, setLang } = useLang();
  const base = tone === "dark" ? "border-cream/50 text-cream" : "border-tide/40 text-tide";
  return (
    <div className={`flex items-center overflow-hidden rounded-full border-2 text-sm font-semibold ${base}`} role="group" aria-label="Language">
      <button className={`px-3 py-1.5 ${lang === "en" ? "bg-tide text-cream" : ""}`} aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
      <button className={`hi px-3 py-1.5 ${lang === "hi" ? "bg-tide text-cream" : ""}`} aria-pressed={lang === "hi"} onClick={() => setLang("hi")}>हिं</button>
    </div>
  );
}
