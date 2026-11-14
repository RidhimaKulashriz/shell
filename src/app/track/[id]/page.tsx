import { notFound } from "next/navigation";
import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hmac } from "@/lib/auth";
import { ReadinessRing } from "@/components/ui";
import { Poll } from "@/components/client";
import { TASK_PROGRESS } from "@/lib/progress";
import { STATUS_LABEL } from "@/lib/utils";
export const dynamic = "force-dynamic";
export const metadata = { title: "Live status", robots: { index: false } };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { id } = await params; const { t } = await searchParams;
  if (!t || t !== hmac("share:" + id).slice(0, 16)) notFound();
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)); if (!task) notFound();
  const [h] = task.helperId ? await db.select().from(users).where(eq(users.id, task.helperId)) : [];
  return (<main className="grid min-h-screen place-items-center bg-cream/50 p-6 text-center"><Poll every={8000} /><div><p className="washi">Shared by a family member</p><h1 className="mt-3 text-3xl font-semibold text-tide">{task.title}</h1><div className="my-6"><ReadinessRing percent={TASK_PROGRESS[task.status] ?? 0} /></div><p className="text-lg font-semibold">{STATUS_LABEL[task.status]}</p>{h && <p className="text-ink/60">Helper: {h.name.split(" ")[0]}</p>}<p className="mt-6 text-xs text-ink/50">This page shows status only. No address or contact details are shared.</p></div></main>);
}
