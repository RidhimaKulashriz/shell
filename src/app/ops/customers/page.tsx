import { db } from "@/db";
import { users, customerProfiles, addresses, towers, tasks } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { OpsAction } from "@/components/ops";
import { formatINR } from "@/lib/pricing";
export const metadata = { title: "Ops: Customers" };
export default async function Page() {
  const rows = await db.select({ u: users, p: customerProfiles }).from(users).innerJoin(customerProfiles, eq(customerProfiles.userId, users.id)).orderBy(desc(users.createdAt)).limit(100);
  const ad = await db.select().from(addresses); const tw = await db.select().from(towers);
  const n = await db.select({ c: tasks.customerId, n: count() }).from(tasks).groupBy(tasks.customerId);
  return (<div><h1 className="text-3xl font-semibold text-tide">Customers</h1><div className="card mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-bone text-xs uppercase text-ink/50"><tr><th className="p-3">Name</th><th>Phone</th><th>Address</th><th>Tasks</th><th>Wallet</th><th>Credits</th><th>Actions</th></tr></thead><tbody>{rows.map(({ u, p }) => { const a = ad.find((x) => x.userId === u.id); const t = tw.find((x) => x.id === a?.towerId); return (
    <tr key={u.id} className="border-t border-line"><td className="p-3 font-medium">{u.name || "—"}{u.status !== "active" && <span className="pill pill-bad ml-2">{u.status}</span>}</td><td>{u.phone}</td><td>{t ? `${t.name}, ${a?.flat}` : "—"} {a?.verifiedAt && <span className="pill">verified</span>}</td><td>{n.find((x) => x.c === u.id)?.n ?? 0}</td><td>{formatINR(p.walletBalance)}</td><td>{formatINR(p.creditsBalance)}</td>
    <td><span className="flex gap-1"><OpsAction body={{ action: "credit", id: u.id, amount: 200 }} ask="Reason for ₹200 credit">+₹200 credit</OpsAction>{u.status === "active" ? <OpsAction body={{ action: "user_status", id: u.id, status: "suspended" }} ask="Reason for blocking">Block</OpsAction> : <OpsAction body={{ action: "user_status", id: u.id, status: "active" }} ask="Reason">Unblock</OpsAction>}</span></td></tr>); })}</tbody></table></div></div>);
}
