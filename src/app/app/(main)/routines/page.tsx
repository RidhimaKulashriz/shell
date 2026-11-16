import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { routines, taskTemplates } from "@/db/schema";
import { RoutineForm, RoutineRow } from "@/components/app/Misc";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";

export const metadata = { title: "Routines" };

export default async function Page() {
  const user = await requireUser(["CUSTOMER"]);
  const [rs, tpls] = await Promise.all([db.select().from(routines).where(eq(routines.customerId, user.id)).orderBy(desc(routines.createdAt)), db.select().from(taskTemplates).where(eq(taskTemplates.active, true))]);
  return (
    <div className="space-y-4"><h1 className="display text-3xl">Routines</h1><p className="rounded-xl bg-sand p-3 text-sm"><b>Coming soon:</b> auto-run is switched off for the pilot. You can plan routines now and we remind you before each run.</p>
      {rs.length === 0 && <p className="hand py-6 text-center text-2xl">Nothing here yet.</p>}
      {rs.map((r) => <div key={r.id} className="rounded-2xl border border-ink/20 bg-paper p-4"><b className="display text-xl">{r.title}</b><div className="mono text-xs">{r.windowText} · {r.status} · next {fmtDateTime(r.nextRunAt)}</div><RoutineRow id={r.id} status={r.status} /></div>)}
      <RoutineForm templates={tpls.map((t) => ({ slug: t.slug, name: t.nameEn }))} /></div>
  );
}
