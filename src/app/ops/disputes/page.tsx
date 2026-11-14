import Link from "next/link";
import { db } from "@/db";
import { disputes, tasks, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { DisputeResolver } from "@/components/ops";
import { fmtDateTime } from "@/lib/utils";
import { formatINR } from "@/lib/pricing";
export const metadata = { title: "Ops: Disputes" };
export default async function Page() {
  const rows = await db.select({ d: disputes, t: tasks }).from(disputes).innerJoin(tasks, eq(tasks.id, disputes.taskId)).orderBy(desc(disputes.createdAt));
  const us = await db.select().from(users); const nm = (id: string) => us.find((u) => u.id === id)?.name ?? "";
  const hint: Record<string, string> = { Quality: "Policy: offer a free redo first. Partial refund if redo isn't possible.", "No show": "Policy: full refund plus a ₹100 credit. Strike the helper.", Late: "Policy: credit if over 30 minutes late.", Damage: "Policy: review photos. Damage cover up to the limit.", Overcharge: "Policy: check the receipt and refund the difference.", Safety: "Policy: escalate to the safety lead immediately.", Other: "Use judgement and explain clearly." };
  return (<div><h1 className="text-3xl font-semibold text-tide">Disputes and refunds</h1><div className="mt-5 space-y-3">{rows.length === 0 && <p className="text-ink/50">No disputes. Peaceful.</p>}{rows.map(({ d, t }) => { const late = d.slaDueAt && d.slaDueAt.getTime() < Date.now(); const open = d.status !== "resolved"; return (
    <div key={d.id} className={`card p-4 ${open && late ? "border-danger" : ""}`}><div className="flex flex-wrap items-start justify-between gap-2"><div><span className="pill pill-warn">{d.reason}</span> <span className={`pill ${open ? "" : "pill-dark"}`}>{d.status}</span><h2 className="mt-1 font-semibold"><Link href={`/ops/jobs/${t.id}`} className="underline">{t.title}</Link> <span className="font-normal text-ink/60">· {nm(d.openedBy)} · {formatINR(t.price)}</span></h2><p className="mt-1 text-sm">{d.description}</p></div><div className="text-right text-xs text-ink/60">Opened {fmtDateTime(d.createdAt)}<br />{open ? <span className={late ? "font-bold text-danger" : ""}>SLA {fmtDateTime(d.slaDueAt)}</span> : "Resolved"}</div></div>
      {open ? <><p className="mt-2 text-xs text-euca">{hint[d.reason]}</p><DisputeResolver id={d.id} price={t.price} /></> : <p className="mt-2 rounded bg-bone p-2 text-sm">Outcome: <strong>{d.resolution?.type.replace("_", " ")}</strong> · {d.resolution?.message}</p>}</div>); })}</div></div>);
}
