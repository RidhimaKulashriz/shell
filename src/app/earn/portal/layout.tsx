import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { helpers } from "@/db/schema";
import { OfflineBanner } from "@/components/app/AppShell";
import { Icon, Wordmark } from "@/components/Icon";
import { requireUser } from "@/lib/auth";

export const metadata = { title: { default: "Shell Earn", template: "%s | Shell Earn" }, robots: { index: false } };

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await requireUser(["HELPER"], "/earn/login");
  const [h] = await db.select().from(helpers).where(eq(helpers.userId, user.id)).limit(1);
  if (!h || h.applicationStep < 7) redirect("/earn/apply");
  const tabs = [["/earn/portal", "Home", "home"], ["/earn/portal/earnings", "Earnings", "wallet"], ["/earn/portal/training", "Training", "book"], ["/earn/portal/passport", "Passport", "shield"], ["/earn/portal/growth", "Growth", "star"]];
  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-cream pb-24">
      <OfflineBanner />
      <header className="flex items-center justify-between px-4 pt-4 text-forest"><Wordmark size={26} /><span className="mono text-xs">Earn · {h.displayName.split(" ")[0]}</span></header>
      <div className="px-4 pt-4">{children}</div>
      <nav aria-label="Helper" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-paper"><ul className="mx-auto flex max-w-2xl">{tabs.map(([href, l, ic]) => <li key={href} className="flex-1"><Link href={href} className="flex flex-col items-center gap-0.5 py-2 text-xs font-bold"><Icon name={ic} size={26} tone="none" />{l}</Link></li>)}</ul></nav>
    </div>
  );
}
