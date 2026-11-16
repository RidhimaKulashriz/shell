import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { requests, users } from "@/db/schema";
import { Badge, H1, Table } from "@/components/ops/ui";
import { Countdown } from "@/components/ui";

export const metadata = { title: "Request inbox" };

export default async function Page() {
  const rs = await db.select({ r: requests, u: users.name }).from(requests).innerJoin(users, eq(users.id, requests.customerId)).where(inArray(requests.status, ["new", "clarifying", "in_review", "plan_sent"])).orderBy(requests.slaDueAt);
  return (
    <div><H1 sub="Sorted by SLA. Open one to build the plan.">Request inbox</H1>
      <Table cols={["Customer", "Message", "Lang", "Deadline", "SLA", "Status"]} rows={rs.map(({ r, u }) => [u, <Link key={r.id} href={`/ops/requests/${r.id}`} className="font-semibold underline">{r.rawText.slice(0, 90)}{r.photos.length ? ` (+${r.photos.length} photo)` : ""}</Link>, r.language, r.deadlineAt ? r.deadlineAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "asap", r.slaDueAt ? <Countdown key={r.id} to={r.slaDueAt} /> : "-", <Badge key={r.id}>{r.status}</Badge>])} /></div>
  );
}
