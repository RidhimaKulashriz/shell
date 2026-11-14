import Link from "next/link";
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import { Logo, Icon } from "@/components/icons";
import { autoApproveDue } from "@/lib/tasks";
import { reofferStale } from "@/lib/dispatch";
export const dynamic = "force-dynamic";
const TABS = [["/helper", "Home", "home"], ["/helper/earnings", "Earnings", "wallet"], ["/helper/passport", "Passport", "passport"], ["/helper/training", "Training", "check"], ["/helper/account", "Account", "user"]];
export default async function Layout({ children }: { children: ReactNode }) {
  await requireRole(["HELPER"], "/helper");
  await autoApproveDue().catch(() => {}); await reofferStale().catch(() => {});
  return (
    <div className="min-h-screen bg-bone pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-line bg-tide text-cream"><div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3"><Link href="/helper" className="flex items-center gap-2"><Logo light size={28} /><span className="rounded-full bg-moss px-2 py-0.5 text-[0.65rem] font-bold tracking-wider text-sage">EARN</span></Link>
        <nav className="hidden gap-1 md:flex" aria-label="Helper">{TABS.map(([h, l]) => <Link key={h} href={h} className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-moss">{l}</Link>)}</nav><Link href="/app/notifications" className="grid h-11 w-11 place-items-center rounded-full hover:bg-moss" aria-label="Notifications"><Icon name="bell" /></Link></div></header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Helper">{TABS.map(([h, l, i]) => <Link key={h} href={h} className="flex flex-col items-center gap-0.5 py-2 text-[0.7rem] font-semibold text-ink/70"><Icon name={i} size={22} />{l}</Link>)}</nav>
    </div>
  );
}
