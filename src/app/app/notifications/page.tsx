import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ActionButton } from "@/components/client";
import { EmptyState } from "@/components/ui";
import { timeAgo } from "@/lib/utils";
export const metadata = { title: "Notifications" };
export default async function Page() {
  const user = await requireRole(["CUSTOMER", "HELPER"], "/app/notifications");
  const ns = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(40);
  return (<div className="mx-auto max-w-xl"><div className="flex items-center justify-between"><h1 className="text-3xl font-semibold text-tide">Notifications</h1><ActionButton url="/api/me" body={{ action: "read_notifications" }} className="btn btn-ghost btn-sm">Mark all read</ActionButton></div>
    <div className="mt-5 space-y-2">{ns.length === 0 && <EmptyState icon="bell" title="All quiet." note="Peaceful. We'll tell you when something happens." />}{ns.map((n) => <Link key={n.id} href={n.link ?? "#"} className={`card block p-4 ${n.readAt ? "" : "border-euca bg-cream/50"}`}><div className="flex justify-between gap-2"><strong>{n.title}</strong><span className="text-xs text-ink/50">{timeAgo(n.createdAt)}</span></div><p className="text-sm text-ink/70">{n.body}</p></Link>)}</div></div>);
}
