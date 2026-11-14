import Link from "next/link";
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import { Logo, Icon } from "@/components/icons";
import { CommandPalette } from "@/components/ops";
import { OPS_NAV } from "@/lib/opsnav";
import { LogoutButton } from "@/components/LogoutButton";
import { autoApproveDue } from "@/lib/tasks";
import { reofferStale } from "@/lib/dispatch";
export const dynamic = "force-dynamic";
export default async function Layout({ children }: { children: ReactNode }) {
  const u = await requireRole(["OPS", "SUPER_ADMIN"], "/ops");
  await autoApproveDue().catch(() => {}); await reofferStale().catch(() => {});
  return (
    <div className="min-h-screen bg-bone md:grid md:grid-cols-[220px_1fr]">
      <aside className="hidden border-r border-line bg-tide text-cream md:block"><div className="sticky top-0 flex h-screen flex-col p-4"><Link href="/ops"><Logo light /></Link><span className="mt-1 text-xs text-sage">Ops Cockpit</span>
        <nav className="mt-5 flex-1 space-y-0.5 overflow-y-auto" aria-label="Ops">{OPS_NAV.map(([h, l, i]) => <Link key={h} href={h} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-moss"><Icon name={i} size={18} />{l}</Link>)}</nav>
        <p className="mb-2 text-xs text-sage">Press <kbd className="rounded bg-moss px-1">Ctrl/⌘ K</kbd> to jump anywhere. Or <kbd className="rounded bg-moss px-1">g</kbd> then a letter.</p><div className="text-xs text-sage">{u.name}</div></div></aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-bone/95 px-4 py-3 backdrop-blur"><nav className="flex gap-1 overflow-x-auto md:hidden" aria-label="Ops mobile">{OPS_NAV.map(([h, l]) => <Link key={h} href={h} className="chip whitespace-nowrap !min-h-[34px] !py-1 text-xs">{l}</Link>)}</nav>
          <form action="/ops/search" className="ml-auto hidden w-full max-w-sm md:block"><input name="q" className="input !min-h-[38px]" placeholder="Search customers, helpers, phone, flat" aria-label="Global search" /></form><LogoutButton className="btn btn-ghost btn-sm hidden md:inline-flex" /></header>
        <main className="p-4 md:p-6">{children}</main>
      </div><CommandPalette />
    </div>
  );
}
