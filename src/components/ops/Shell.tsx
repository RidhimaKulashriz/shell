"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Wordmark } from "@/components/Icon";

export const NAV: [string, string, string][] = [
  ["/ops", "Today", "d"], ["/ops/requests", "Request inbox", "r"], ["/ops/dispatch", "Dispatch", "p"], ["/ops/jobs", "Jobs", "j"], ["/ops/helpers", "Helpers", "h"], ["/ops/customers", "Customers", "c"], ["/ops/disputes", "Disputes", "x"],
  ["/ops/safety", "Safety / SOS", "s"], ["/ops/fraud", "Leakage and fraud", "f"], ["/ops/finance", "Finance", "n"], ["/ops/pricing", "Pricing engine", "e"], ["/ops/catalog", "Catalog", "k"], ["/ops/societies", "Societies and zones", "o"],
  ["/ops/analytics", "Analytics", "a"], ["/ops/content", "Content and templates", "t"], ["/ops/settings", "Settings, team, audit", "g"],
];

/** Keyboard-first: Cmd/Ctrl+K palette, `g` then a letter to jump, `/` to search. */
export function OpsShell({ children, name, role }: { children: ReactNode; name: string; role: string }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const pending = useRef<number>(0);
  const items = useMemo(() => [...NAV.map(([h, l]) => ({ h, l })), { h: "/ops/requests", l: "New plan: open oldest request" }, { h: "/app/login", l: "Switch account" }].filter((i) => i.l.toLowerCase().includes(q.toLowerCase())), [q]);
  const [sel, setSel] = useState(0);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); setQ(""); setSel(0); return; }
      if (e.key === "Escape") setOpen(false);
      if (typing) return;
      if (e.key === "/") { e.preventDefault(); setOpen(true); }
      if (e.key === "g") pending.current = Date.now();
      else if (Date.now() - pending.current < 900) { const hit = NAV.find((n) => n[2] === e.key); if (hit) { pending.current = 0; router.push(hit[0]); } }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [router]);
  return (
    <div className="flex min-h-screen bg-paper text-[14px] text-ink">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r-2 border-ink bg-forest p-3 text-cream md:flex ${collapsed ? "w-14" : "w-60"}`} aria-label="Ops navigation">
        <div className="flex items-center justify-between"><Link href="/ops">{collapsed ? <span className="display text-xl">S</span> : <Wordmark size={24} />}</Link><button aria-label="Collapse" className="rounded px-1 text-sage" onClick={() => setCollapsed(!collapsed)}>{collapsed ? ">" : "<"}</button></div>
        <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto">{NAV.map(([h, l, k]) => { const on = h === "/ops" ? path === "/ops" : path.startsWith(h); return <Link key={h} href={h} className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${on ? "bg-sand text-ink" : "hover:bg-moss"}`} title={l}><span className={collapsed ? "sr-only" : ""}>{l}</span>{!collapsed && <kbd className="mono text-[10px] opacity-60">g {k}</kbd>}</Link>; })}</nav>
        {!collapsed && <p className="mono text-[10px] text-sage">{name} · {role}</p>}
      </aside>
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b-2 border-ink bg-paper px-4 py-2"><button className="field !min-h-0 !w-auto flex-1 !py-1.5 text-left opacity-70" onClick={() => setOpen(true)}>Search customers, helpers, jobs, phone, flat... <kbd className="mono float-right text-xs">Ctrl K</kbd></button><span className="stamp !text-[10px]">{process.env.NODE_ENV === "production" ? "prod" : "dev"}</span><Link className="chip !min-h-0 !py-1 md:hidden" href="/ops">Menu</Link></div>
        <div className="p-4 md:p-6">{children}</div>
      </div>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-start bg-ink/50 p-4 pt-24" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Command palette">
          <div className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)]" onClick={(e) => e.stopPropagation()}>
            <input autoFocus className="field !rounded-none !border-0 !border-b-2" placeholder="Type a command or page" value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={(e) => { if (e.key === "ArrowDown") setSel((s) => Math.min(items.length - 1, s + 1)); if (e.key === "ArrowUp") setSel((s) => Math.max(0, s - 1)); if (e.key === "Enter" && items[sel]) { router.push(items[sel].h); setOpen(false); } }} />
            <ul className="max-h-72 overflow-auto">{items.map((i, n) => <li key={i.l}><button className={`block w-full px-4 py-2 text-left ${n === sel ? "bg-sand" : ""}`} onClick={() => { router.push(i.h); setOpen(false); }}>{i.l}</button></li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
}
