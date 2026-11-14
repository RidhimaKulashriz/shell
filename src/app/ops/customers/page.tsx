import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, customerProfiles, opsNotes, users } from "@/db/schema";
import { Act, CreditForm } from "@/components/ops/Actions";
import { Badge, H1, Table } from "@/components/ops/ui";
import { inr } from "@/lib/format";

export const metadata = { title: "Customers" };

export default async function Page() {
  const rows = await db.select({ u: users, p: customerProfiles, a: addresses }).from(users).innerJoin(customerProfiles, eq(customerProfiles.userId, users.id)).leftJoin(addresses, eq(addresses.userId, users.id)).orderBy(desc(users.createdAt));
  const notes = await db.select().from(opsNotes).where(eq(opsNotes.entity, "customer"));
  return (
    <div><H1 sub="Profiles, credits (manual adjustments need a reason), blocklist">Customers</H1>
      <Table cols={["Name", "Phone", "Flat", "Verified", "Credits", "Notes", "Adjust credits", ""]} rows={rows.map(({ u, p, a }) => [u.name, u.phone, a ? `${a.flat}, floor ${a.floor}` : "-", a?.verifiedAt ? <Badge key="v">verified</Badge> : <Badge key="v" tone="red">pending</Badge>, inr(p.creditsBalance), notes.filter((n) => n.entityId === u.id).map((n) => n.body).join(" | ") || "-", <CreditForm key="c" userId={u.id} />, <Act key="b" url={`/api/ops/customers/${u.id}/block`} label={u.status === "active" ? "Block" : "Blocked"} variant="btn-ghost" confirmText="Block this customer?" />])} /></div>
  );
}
