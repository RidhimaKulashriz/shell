"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, Logo } from "./icons";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/services", label: "Services", menu: true },
  { href: "/packs", label: "Packs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/earn", label: "Earn with Shell" },
  { href: "/safety", label: "Safety" },
  { href: "/societies", label: "Societies" },
];
const MENU = [
  { href: "/services/quick", t: "Shell Quick", d: "Single small tasks, done fast", i: "bag" },
  { href: "/services/managed", t: "Shell Managed", d: "Events, moves and full home organising", i: "home" },
  { href: "/earn", t: "Shell Earn", d: "Earn with your skills and your timetable", i: "passport" },
  { href: "/services/routines", t: "Shell Routines", d: "Repeating help. Coming soon", i: "calendar" },
];

export function Header({ appHref, appLabel }: { appHref: string; appLabel: string }) {
  const [hidden, setHidden] = useState(false), [small, setSmall] = useState(false), [open, setOpen] = useState(false), [menu, setMenu] = useState(false);
  const path = usePathname();
  useEffect(() => {
    let last = 0;
    const on = () => { const y = window.scrollY; setSmall(y > 80); setHidden(y > last && y > 160); last = y; };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { setOpen(false); setMenu(false); }, [path]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);
  return (
    <>
      <header className={cn("sticky top-0 z-50 border-b border-line/70 bg-bone/95 backdrop-blur transition-transform duration-300", hidden && !open && "-translate-y-full")}>
        <div className={cn("mx-auto flex max-w-7xl items-center justify-between px-4 transition-all md:px-8", small ? "h-14" : "h-[4.5rem]")}>
          <Link href="/" aria-label="Shell home"><Logo size={small ? 26 : 32} /></Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((n) => n.menu ? (
              <div key={n.href} className="relative" onMouseEnter={() => setMenu(true)} onMouseLeave={() => setMenu(false)}>
                <Link href={n.href} className="rounded-full px-3 py-2 text-sm font-medium hover:bg-cream" aria-haspopup="true" aria-expanded={menu}>{n.label}</Link>
                {menu && (
                  <div className="absolute left-0 top-full z-50 w-80 pt-2">
                    <div className="card space-y-1 p-2 shadow-xl">
                      {MENU.map((m) => (
                        <Link key={m.href} href={m.href} className="flex items-center gap-3 rounded-xl p-3 hover:bg-cream">
                          <span className="grid h-10 w-10 place-items-center rounded-full bg-cream text-euca"><Icon name={m.i} /></span>
                          <span><span className="block text-sm font-semibold">{m.t}</span><span className="block text-xs text-ink/60">{m.d}</span></span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link key={n.href} href={n.href} className={cn("rounded-full px-3 py-2 text-sm font-medium hover:bg-cream", path === n.href && "bg-cream")}>{n.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href={appHref} className="hidden rounded-full px-3 py-2 text-sm font-semibold hover:bg-cream sm:block">{appLabel}</Link>
            <Link href="/waitlist" onClick={() => track("cta_click", { location: "header" })} className="btn btn-sun btn-sm hidden sm:inline-flex">Join the waitlist</Link>
            <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-cream lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
              <Icon name={open ? "close" : "menu"} />
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-paper px-6 pb-10 pt-24 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <nav className="flex flex-col">
            {[...NAV, { href: appHref, label: appLabel }].map((n) => <Link key={n.href} href={n.href} className="serif border-b border-ink/10 py-3.5 text-3xl font-semibold">{n.label}</Link>)}
          </nav>
          <Link href="/waitlist" className="btn btn-sun mt-8 w-full">Join the waitlist</Link>
        </div>
      )}
    </>
  );
}

export function Announcement({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = Number(localStorage.getItem("shell_ann") ?? 0); setShow(Date.now() - t > 7 * 864e5); }, []);
  if (!show) return null;
  return (
    <div className="flex items-center bg-tide text-cream">
      <div className="min-w-0 flex-1 overflow-hidden py-2 text-sm" aria-label={text}>
        <div className="marquee" aria-hidden>{[0, 1, 2, 3].map((i) => <span key={i} className="mx-8 whitespace-nowrap">{text}</span>)}</div>
      </div>
      <button className="px-3 py-2 text-sage hover:text-cream" aria-label="Dismiss announcement" onClick={() => { localStorage.setItem("shell_ann", String(Date.now())); setShow(false); }}><Icon name="close" size={16} /></button>
    </div>
  );
}

export function WhatsAppFab({ number }: { number: string }) {
  const path = usePathname();
  const href = `https://wa.me/${number}?text=${encodeURIComponent(`Hi Shell, I'm on ${path} and have a question.`)}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp_click", { path })} aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#1f9d63] text-white shadow-lg transition hover:scale-105">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 3a9 9 0 00-7.700 13.600L3 21l4.500-1.200A9 9 0 1012 3zm0 1.800a7.200 7.200 0 11-3.800 13.300l-.3-.2-2.600.7.7-2.500-.2-.3A7.200 7.200 0 0112 4.800zm-3 3.700c-.2 0-.5.100-.7.400-.2.300-.9.900-.9 2.200s.9 2.500 1 2.700c.1.200 1.800 2.900 4.500 3.900 2.200.9 2.700.7 3.200.7s1.600-.7 1.800-1.300.2-1.200.2-1.300-.2-.2-.4-.3l-1.600-.8c-.2-.1-.4-.1-.5.100l-.7.900c-.1.200-.3.200-.5.100a5.800 5.800 0 01-1.700-1 6.400 6.400 0 01-1.200-1.500c-.1-.2 0-.3.100-.5l.4-.5.200-.4c.1-.1 0-.3 0-.4l-.7-1.700c-.2-.5-.4-.4-.5-.4z" /></svg>
    </a>
  );
}

export function CookieBanner() {
  const [show, setShow] = useState(false), [custom, setCustom] = useState(false);
  useEffect(() => { setShow(!localStorage.getItem("shell_consent")); }, []);
  if (!show) return null;
  const set = (v: string) => { localStorage.setItem("shell_consent", v); setShow(false); };
  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] max-w-md rounded-2xl border border-line bg-paper p-4 shadow-2xl sm:left-4 sm:right-auto" role="dialog" aria-label="Cookie preferences">
      <p className="text-sm"><strong>We use a few cookies.</strong> Essential ones keep you signed in. Analytics ones help us improve, and only run if you say yes.</p>
      {custom && <p className="mt-2 rounded-lg bg-cream p-2 text-xs">Essential: always on. Analytics: off unless you accept. Marketing: we don&apos;t use any.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn btn-primary btn-sm" onClick={() => set("all")}>Accept</button>
        <button className="btn btn-ghost btn-sm" onClick={() => set("essential")}>Reject non-essential</button>
        <button className="btn btn-sm underline" onClick={() => setCustom(!custom)}>Customise</button>
      </div>
    </div>
  );
}
