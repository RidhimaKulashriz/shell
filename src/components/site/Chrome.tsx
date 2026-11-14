"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, Wordmark } from "@/components/Icon";
import { Marquee, Pill, Stamp } from "@/components/ui";
import { track, hasConsent } from "@/lib/analytics";

type L = Record<string, string>;

export function LangToggle({ lang, dark = false }: { lang: string; dark?: boolean }) {
  const router = useRouter();
  const set = (l: string) => {
    document.cookie = `shell_lang=${l}; path=/; max-age=31536000; samesite=lax`;
    track("language_switch", { to: l });
    router.refresh();
  };
  const cls = (on: boolean) => `px-2.5 py-1 rounded-full text-sm font-bold ${on ? (dark ? "bg-cream text-tide" : "bg-forest text-cream") : ""}`;
  return (
    <div className={`inline-flex items-center rounded-full border-2 ${dark ? "border-cream" : "border-ink"}`} role="group" aria-label="Language">
      <button className={cls(lang !== "hi")} aria-pressed={lang !== "hi"} onClick={() => set("en")}>
        EN
      </button>
      <button className={cls(lang === "hi")} aria-pressed={lang === "hi"} onClick={() => set("hi")} lang="hi">
        हिं
      </button>
    </div>
  );
}

const NAV = [
  { href: "/how-it-works", k: "nav.how" },
  { href: "/services", k: "nav.services", mega: true },
  { href: "/packs", k: "nav.packs" },
  { href: "/earn", k: "nav.earn" },
  { href: "/safety", k: "nav.safety" },
  { href: "/societies", k: "nav.societies" },
];

export function Header({ lang, t }: { lang: string; t: L }) {
  const [hidden, setHidden] = useState(false);
  const [small, setSmall] = useState(false);
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const last = useRef(0);
  const path = usePathname();
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSmall(y > 80);
      setHidden(y > last.current && y > 160 && !open);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);
  useEffect(() => {
    setOpen(false);
    setMega(false);
  }, [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const svc = [
    { href: "/services/quick", icon: "bag", n: t["svc.quick"], d: t["svc.quick.d"], rot: -1.5 },
    { href: "/services/managed", icon: "sofa", n: t["svc.managed"], d: t["svc.managed.d"], rot: 1 },
    { href: "/earn", icon: "bicycle", n: t["svc.earn"], d: t["svc.earn.d"], rot: -0.8 },
    { href: "/services/routines", icon: "calendar", n: t["svc.routines"], d: t["svc.routines.d"], rot: 1.6, soon: true },
  ];

  return (
    <header className={`sticky top-0 z-50 border-b-2 border-ink bg-paper transition-transform duration-300 ${hidden ? "-translate-y-full" : ""}`}>
      <div className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300 md:px-8 ${small ? "h-12" : "h-16"}`}>
        <Link href="/" aria-label="Shell home" className="text-forest">
          <Wordmark size={small ? 22 : 28} />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <div key={n.href} className="relative" onMouseEnter={() => n.mega && setMega(true)} onMouseLeave={() => n.mega && setMega(false)}>
              <Link href={n.href} className="rounded-full px-3 py-2 text-[15px] font-semibold hover:bg-sand/60" aria-haspopup={n.mega ? "true" : undefined} aria-expanded={n.mega ? mega : undefined} onFocus={() => n.mega && setMega(true)}>
                {t[n.k]}
              </Link>
              {n.mega && mega && (
                <div className="absolute left-1/2 top-full w-[620px] -translate-x-1/2 pt-3" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setMega(false)}>
                  <div className="grid grid-cols-2 gap-4 rounded-[28px] border-2 border-ink bg-paper p-5 shadow-[6px_6px_0_var(--color-ink)]">
                    {svc.map((s) => (
                      <Link key={s.n} href={s.href} className="relative flex gap-3 rounded-2xl bg-cream p-3 hover:bg-sand/70" style={{ transform: `rotate(${s.rot}deg)` }}>
                        <Icon name={s.icon} size={44} />
                        <span>
                          <span className="display block text-lg">{s.n}</span>
                          <span className="text-sm opacity-75">{s.d}</span>
                        </span>
                        {s.soon && <span className="stamp stamp-brick absolute right-2 top-2 text-[9px]">soon</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LangToggle lang={lang} />
          <Pill href="/waitlist" variant="sun" size="sm" className="hidden sm:inline-flex" data-cta="header">
            {t["nav.waitlist"]}
          </Pill>
          <button className="grid h-11 w-11 place-items-center rounded-full border-2 border-ink lg:hidden" aria-label={open ? t["nav.close"] : t["nav.menu"]} aria-expanded={open} onClick={() => setOpen(!open)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              {open ? <path d="M5 5 L19 19 M19 5 L5 19" /> : <path d="M4 8 H20 M4 16 H20" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 top-[64px] z-40 flex flex-col justify-between overflow-y-auto bg-paper px-6 pb-8 pt-6 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <nav className="flex flex-col gap-1">
            {NAV.map((n, i) => (
              <Link key={n.href} href={n.href} className="display border-b-2 border-dashed border-ink/20 py-3 text-4xl" style={{ transform: `rotate(${i % 2 ? 0.6 : -0.6}deg)` }}>
                {t[n.k]}
              </Link>
            ))}
          </nav>
          <div className="mt-8 flex items-center justify-between gap-3">
            <LangToggle lang={lang} />
            <Pill href="/waitlist" variant="sun" data-cta="mobile_menu">
              {t["nav.waitlist"]}
            </Pill>
          </div>
        </div>
      )}
    </header>
  );
}

export function AnnouncementBar({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const until = Number(localStorage.getItem("shell_ann_dismissed") ?? 0);
    setShow(Date.now() > until);
  }, []);
  if (!show || !text) return null;
  return (
    <div className="tide-band relative flex items-center text-sm" role="region" aria-label="Announcement">
      <Marquee items={[text, text, text]} className="flex-1 py-2 font-mono" />
      <button
        className="absolute right-0 top-0 grid h-full w-10 place-items-center bg-tide"
        aria-label="Dismiss announcement for 7 days"
        onClick={() => {
          localStorage.setItem("shell_ann_dismissed", String(Date.now() + 7 * 86400000));
          setShow(false);
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M5 5 L19 19 M19 5 L5 19" />
        </svg>
      </button>
    </div>
  );
}

export function WhatsAppFab({ lead }: { lead: string }) {
  const [href, setHref] = useState("#");
  const path = usePathname();
  const num = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999900000";
  useEffect(() => {
    setHref(`https://wa.me/${num}?text=${encodeURIComponent(`${lead} ${location.pathname}`)}`);
  }, [path, lead, num]);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp_click", { path })} aria-label="Chat with Shell on WhatsApp" className="fixed bottom-4 right-4 z-40 grid h-14 w-14 place-items-center rounded-full border-2 border-ink bg-sage text-tide shadow-[0_4px_0_var(--color-ink)] active:translate-y-1">
      <Icon name="chat" size={30} tone="none" />
    </a>
  );
}

export function CookieConsent({ t }: { t: L }) {
  const [state, setState] = useState<"hidden" | "banner" | "custom">("hidden");
  const [analytics, setAnalytics] = useState(true);
  useEffect(() => {
    if (!document.cookie.includes("shell_consent=")) setState("banner");
  }, []);
  const save = (all: boolean) => {
    document.cookie = `shell_consent=${all ? "all" : "essential"}; path=/; max-age=31536000; samesite=lax`;
    setState("hidden");
    if (all) track("page_view", { path: location.pathname });
  };
  if (state === "hidden") return null;
  return (
    <div role="dialog" aria-label="Cookie choices" className="fixed bottom-20 left-3 z-50 max-w-[340px] rotate-[-1.2deg] rounded-[22px] border-2 border-ink bg-sand p-4 shadow-[5px_5px_0_var(--color-ink)] sm:bottom-4">
      <div className="display text-lg">{t["cookie.title"]}</div>
      <p className="mt-1 text-sm">{t["cookie.body"]}</p>
      {state === "custom" && (
        <div className="mt-3 space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked disabled /> Essential (always on)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} /> {t["cookie.analytics"]}</label>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {state === "banner" ? (
          <>
            <Pill size="sm" variant="forest" onClick={() => save(true)}>{t["cookie.accept"]}</Pill>
            <Pill size="sm" variant="cream" onClick={() => save(false)}>{t["cookie.reject"]}</Pill>
            <button className="link-quiet text-sm font-semibold" onClick={() => setState("custom")}>{t["cookie.custom"]}</button>
          </>
        ) : (
          <Pill size="sm" variant="forest" onClick={() => save(analytics)}>{t["cookie.save"]}</Pill>
        )}
      </div>
    </div>
  );
}

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

/** Page views, scroll depth and the hidden Konami-code easter egg. */
export function SiteEffects() {
  const path = usePathname();
  const [egg, setEgg] = useState(false);
  useEffect(() => {
    if (hasConsent()) track("page_view", { path });
    const seen = new Set<number>();
    const onScroll = () => {
      const h = document.documentElement;
      const pct = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100;
      for (const m of [25, 50, 75, 100]) if (pct >= m && !seen.has(m)) { seen.add(m); track("scroll_depth", { depth: m, path }); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [path]);
  useEffect(() => {
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      i = e.key.toLowerCase() === KONAMI[i].toLowerCase() ? i + 1 : e.key === KONAMI[0] ? 1 : 0;
      if (i === KONAMI.length) { i = 0; setEgg(true); setTimeout(() => setEgg(false), 4500); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (!egg) return null;
  const bits = Array.from({ length: 36 }, (_, i) => i);
  return (
    <div className="pointer-events-none fixed inset-0 z-[95] overflow-hidden" aria-live="polite">
      {bits.map((i) => (
        <span key={i} className="absolute top-0 block h-3 w-2 rounded-[1px]" style={{ left: `${(i * 37) % 100}%`, background: ["#E8C48A", "#8EB69B", "#F2C318", "#235347"][i % 4], animation: `fall ${2 + (i % 5) * 0.4}s ${(i % 7) * 0.12}s ease-in forwards`, transform: `rotate(${i * 23}deg)` }} />
      ))}
      <style>{`@keyframes fall{to{transform:translateY(105vh) rotate(540deg)}}`}</style>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center"><Stamp label="Chai break unlocked" large tone="brick" /><p className="hand mt-4 text-3xl text-ink">Chai pee lo. Hum dekh lenge.</p></div>
      </div>
    </div>
  );
}
