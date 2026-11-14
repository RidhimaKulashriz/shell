import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { MarkRead } from "@/components/app/Misc";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";

export const metadata = { title: "Notifications" };

export default async function Page() {
  const user = await requireUser(["CUSTOMER"]);
  const list = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.sentAt)).limit(50);
  return (
    <div className="space-y-3"><div className="flex items-center justify-between"><h1 className="display text-3xl">Notifications</h1><MarkRead /></div>
      {list.length === 0 && <p className="hand py-10 text-center text-2xl">Nothing here yet.</p>}
      {list.map((n) => <div key={n.id} className={`rounded-2xl border border-ink/20 p-3 ${n.readAt ? "bg-paper" : "bg-sand"}`}><div className="mono text-xs uppercase opacity-60">{n.type.replace(/_/g, " ")} · {fmtDateTime(n.sentAt)}{n.status !== "sent" ? " · held for quiet hours" : ""}</div><p>{n.body}</p></div>)}</div>
  );
}
