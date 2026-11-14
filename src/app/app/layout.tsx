import Link from "next/link";
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { addresses, towers, societies, notifications } from "@/db/schema";
import { and, count, eq, isNull } from "drizzle-orm";
import { Logo, Icon } from "@/components/icons";
import { Onboarding } from "@/components/customer";
import { autoApproveDue } from "@/lib/tasks";
import { reofferStale } from "@/lib/dispatch";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";
const TABS = [["/app", "Home", "home"], ["/app/orders", "Orders", "receipt"], ["/app/circles", "Circles", "circle"], ["/app/wallet", "Wallet", "wallet"], ["/app/me", "Me", "user"]];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["CUSTOMER"], "/app");
  await autoApproveDue().catch(() => {}); await reofferStale().catch(() => {});
  const [addr] = await db.select().from(addresses).where(eq(addresses.userId, user.id)).limit(1);
  const [unread] = await db.select({ n: count() }).from(notifications).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  if (!addr || !user.name) {
    const [soc] = await db.select().from(societies).where(eq(societies.status, "pilot")).limit(1);
    const tw = soc ? await db.select().from(towers).where(eq(towers.societyId, soc.id)).orderBy(towers.name) : [];
    return <div className="min-h-screen bg-bone"><div className="flex items-center justify-between px-5 py-4"><Logo /><LogoutButton /></div>{soc ? <Onboarding towers={tw.map((t) => ({ id: t.id, name: t.name, floors: t.floors }))} society={soc.name} name={user.name} /> : <p className="p-10">No society is open yet.</p>}</div>;
  }
  return (
    <div className="min-h-screen bg-bone pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-line bg-bone/95 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/app"><Logo size={28} /></Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="App">{TABS.map(([h, l]) => <Link key={h} href={h} className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-cream">{l}</Link>)}</nav>
        <div className="flex items-center gap-1"><Link href="/app/notifications" className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-cream" aria-label={`Notifications${unread.n ? `, ${unread.n} unread` : ""}`}><Icon name="bell" />{unread.n > 0 && <span className="absolute right-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[0.6rem] font-bold text-white">{unread.n}</span>}</Link></div>
      </div></header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="App">{TABS.map(([h, l, i]) => <Link key={h} href={h} className="flex flex-col items-center gap-0.5 py-2 text-[0.7rem] font-semibold text-ink/70"><Icon name={i} size={22} />{l}</Link>)}</nav>
    </div>
  );
}
