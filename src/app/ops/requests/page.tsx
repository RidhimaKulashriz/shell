import Link from "next/link";
import { db } from "@/db";
import { requests, users, addresses, towers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { fmtDateTime, timeAgo } from "@/lib/utils";
export const metadata = { title: "Ops: Requests" };
export default async function Page() {
  const rows = await db.select({ r: requests, u: users }).from(requests).innerJoin(users, eq(users.id, requests.customerId)).orderBy(desc(requests.createdAt)).limit(60);
  const order = ["in_review", "new", "clarifying", "drafting", "plan_sent", "approved", "cancelled"];
  rows.sort((a, b) => order.indexOf(a.r.status) - order.indexOf(b.r.status));
  const tw = await db.select().from(towers); const ad = await db.select().from(addresses);
  return (<div><h1 className="text-3xl font-semibold text-tide">Request inbox</h1><p className="text-ink/60">Plans waiting for review come first.</p>
    <div className="card mt-5 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-bone text-xs uppercase text-ink/50"><tr><th className="p-3">Customer</th><th>Message</th><th>Tower</th><th>Deadline</th><th>Status</th><th>Age</th></tr></thead><tbody>{rows.map(({ r, u }) => { const a = ad.find((x) => x.id === r.addressId); const t = tw.find((x) => x.id === a?.towerId); return (
      <tr key={r.id} className="border-t border-line hover:bg-cream/40"><td className="p-3 font-medium"><Link href={`/ops/requests/${r.id}`} className="underline">{u.name}</Link></td><td className="max-w-xs truncate">{r.rawText}</td><td>{t?.name}</td><td>{fmtDateTime(r.deadlineAt)}</td><td><span className={`pill ${r.status === "in_review" ? "pill-warn" : ""}`}>{r.status.replace("_", " ")}</span></td><td className="text-xs text-ink/50">{timeAgo(r.createdAt)}</td></tr>); })}</tbody></table></div></div>);
}
