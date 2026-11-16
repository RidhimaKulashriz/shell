import { eq } from "drizzle-orm";
import { db } from "@/db";
import { disputes, tasks, users } from "@/db/schema";
import { DisputeResolve } from "@/components/ops/Actions";
import { Badge, H1, Table } from "@/components/ops/ui";
import { Countdown } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { inr } from "@/lib/format";

export const metadata = { title: "Disputes" };

export default async function Page() {
  const u = await requireUser(["OPS"], "/app/login");
  const rows = await db.select({ d: disputes, t: tasks.name, c: users.name }).from(disputes).innerJoin(tasks, eq(tasks.id, disputes.taskId)).innerJoin(users, eq(users.id, disputes.openedBy)).orderBy(disputes.slaDueAt);
  return (
    <div><H1 sub={`Approval limits by role: agent ₹500, lead ₹5,000, super admin unlimited. You are ${u.opsRole ?? u.role}.`}>Disputes and refunds</H1>
      <Table cols={["Customer", "Task", "Reason", "Evidence", "SLA", "Status", "Resolution"]} rows={rows.map(({ d, t, c }) => [c, t, d.reason, <span key="e" className="text-xs">{d.description} {d.evidence.map((e) => e.text).join("; ")}</span>, d.status === "resolved" ? "-" : <Countdown key="s" to={d.slaDueAt} />, <Badge key="b">{d.status}</Badge>, d.status === "resolved" ? <span key="r" className="text-xs">{d.resolution?.action} {d.resolution?.amount ? inr(d.resolution.amount) : ""}</span> : <DisputeResolve key="r" id={d.id} />])} /></div>
  );
}
