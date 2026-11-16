import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { fraudAlerts } from "@/db/schema";
import { Act } from "@/components/ops/Actions";
import { Badge, H1, Table } from "@/components/ops/ui";
import { fmtDateTime } from "@/lib/format";

export const metadata = { title: "Leakage and fraud" };

export default async function Page() {
  const al = await db.select().from(fraudAlerts).orderBy(desc(fraudAlerts.createdAt));
  const open = al.filter((a) => a.status === "open");
  return (
    <div><H1 sub="Chat scanner hits, repeat pairings, cancel-then-rebook, GPS spoofing, far check-ins">Leakage and fraud monitor</H1>
      <p className="mb-2 text-sm">{open.length} open alerts.</p>
      <Table cols={["When", "Type", "Severity", "Evidence", "Status", "Actions"]} rows={al.map((a) => [fmtDateTime(a.createdAt), a.type.replace(/_/g, " "), <Badge key="s" tone={a.severity === "high" ? "red" : "ink"}>{a.severity}</Badge>, <span key="e" className="mono text-xs">{JSON.stringify(a.evidence)}</span>, a.status + (a.action ? ` (${a.action})` : ""), a.status === "open" ? <span key="a" className="flex flex-wrap gap-1">{(["warn", "strike", "hold_payout", "suspend", "escalate", "dismiss"] as const).map((x) => <Act key={x} url={`/api/ops/alerts/${a.id}`} body={{ action: x }} label={x.replace("_", " ")} variant="btn-cream" />)}</span> : "-"])} /></div>
  );
}
void eq;
