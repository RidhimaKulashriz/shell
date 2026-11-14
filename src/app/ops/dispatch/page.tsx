import Link from "next/link";
import { db } from "@/db";
import * as S from "@/db/schema";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { AssignSelect, OpsAction } from "@/components/ops";
import { candidatesFor } from "@/lib/dispatch";
import { fmtDateTime } from "@/lib/utils";
export const metadata = { title: "Ops: Dispatch" };
export default async function Page() {
  const cols = [["planned", "New"], ["offered", "Offered"], ["accepted", "Accepted"], ["en_route", "On the way"], ["in_progress", "In progress"], ["awaiting_approval", "Awaiting approval"], ["approved", "Done"]];
  const all = await db.select().from(S.tasks).where(ne(S.tasks.status, "cancelled")).orderBy(desc(S.tasks.updatedAt)).limit(120);
  const paid = await db.select({ id: S.plans.id }).from(S.plans).where(eq(S.plans.status, "approved")); const paidSet = new Set(paid.map((p) => p.id));
  const ts = all.filter((t) => paidSet.has(t.planId));
  const users = await db.select().from(S.users).where(inArray(S.users.role, ["HELPER", "CUSTOMER"]));
  const nm = (id?: string | null) => users.find((u) => u.id === id)?.name.split(" ")[0] ?? "";
  const backup = await db.select({ h: S.helperProfiles, u: S.users }).from(S.helperProfiles).innerJoin(S.users, eq(S.users.id, S.helperProfiles.userId)).where(and(eq(S.helperProfiles.online, true), eq(S.helperProfiles.status, "active")));
  const circles = await db.select().from(S.circles).where(ne(S.circles.status, "cancelled"));
  const opts: Record<string, { id: string; label: string }[]> = {};
  for (const t of ts.filter((x) => ["planned", "offered", "accepted"].includes(x.status)).slice(0, 15)) opts[t.id] = (await candidatesFor(t.id)).slice(0, 5).map((c) => ({ id: c.helperId, label: `${c.name.split(" ")[0]} (${c.score.toFixed(2)})` }));
  return (<div className="space-y-6"><h1 className="text-3xl font-semibold text-tide">Dispatch board</h1>
    <div className="flex gap-3 overflow-x-auto pb-3">{cols.map(([k, l]) => { const list = ts.filter((t) => (k === "approved" ? t.status === "approved" : t.status === k) ).slice(0, k === "approved" ? 6 : 30); return (
      <section key={k} className="w-64 shrink-0" aria-label={l}><h2 className="mb-2 flex items-center justify-between text-sm font-bold uppercase tracking-wider text-ink/60">{l}<span className="pill">{list.length}</span></h2>
        <div className="space-y-2">{list.map((t) => <div key={t.id} className="card p-3 text-sm"><Link href={`/ops/jobs/${t.id}`} className="font-semibold underline">{t.title}</Link><div className="text-xs text-ink/60">{nm(t.customerId)} · {fmtDateTime(t.scheduledStart)}</div><div className="mt-1 text-xs">{t.helperId ? `Helper: ${nm(t.helperId)}` : "No helper"}{t.rush && <span className="pill pill-bad ml-1">Rush</span>}</div>
          {["planned", "offered", "accepted"].includes(t.status) && <div className="mt-2 space-y-1"><AssignSelect taskId={t.id} options={opts[t.id] ?? []} />{!t.helperId && <OpsAction body={{ action: "task_reoffer", taskId: t.id }}>Re-offer</OpsAction>}</div>}</div>)}{list.length === 0 && <p className="text-xs text-ink/40">Empty</p>}</div></section>); })}</div>
    <div className="grid gap-5 md:grid-cols-2"><div className="card p-4"><h2 className="font-semibold">Backup helper pool (online)</h2><ul className="mt-2 space-y-1 text-sm">{backup.map(({ h, u }) => <li key={u.id} className="flex justify-between"><span>{u.name}</span><span className="text-ink/50">{h.level.toLowerCase()} · {h.ratingAvg ? h.ratingAvg.toFixed(1) : "new"}</span></li>)}{backup.length === 0 && <li className="text-ink/50">Nobody online.</li>}</ul></div>
      <div className="card p-4"><h2 className="font-semibold">Circle batches</h2><ul className="mt-2 space-y-1 text-sm">{circles.map((c) => <li key={c.id} className="flex justify-between"><span>{c.title}</span><span className="pill">{c.currentFlats}/{c.maxFlats} · {c.status}</span></li>)}{circles.length === 0 && <li className="text-ink/50">None.</li>}</ul></div></div></div>);
}
