import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { helpers, plans, tasks, users } from "@/db/schema";
import { Badge, H1, Table } from "@/components/ops/ui";
import { fmtDateTime, inr } from "@/lib/format";

export const metadata = { title: "Jobs" };

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const rows = await db.select({ t: tasks, h: helpers.displayName, c: users.name }).from(tasks).innerJoin(plans, eq(plans.id, tasks.planId)).innerJoin(users, eq(users.id, plans.customerId)).leftJoin(helpers, eq(helpers.id, tasks.assignedHelperId)).orderBy(desc(tasks.createdAt)).limit(200);
  const f = rows.filter((r) => (!sp.status || r.t.status === sp.status) && (!sp.q || (r.t.name + r.c + (r.h ?? "")).toLowerCase().includes(sp.q.toLowerCase())));
  return (
    <div><H1>Jobs</H1>
      <form className="mb-3 flex flex-wrap gap-2"><input name="q" defaultValue={sp.q} className="field !w-60 !py-1" placeholder="Search customer, helper, task" /><select name="status" defaultValue={sp.status ?? ""} className="field !w-auto !py-1"><option value="">All statuses</option>{["planned", "offered", "accepted", "en_route", "arrived", "in_progress", "awaiting_approval", "approved", "cancelled"].map((s) => <option key={s}>{s}</option>)}</select><button className="btn btn-forest btn-sm">Filter</button><a className="btn btn-cream btn-sm" href="?status=in_progress">In progress</a></form>
      <Table cols={["Task", "Customer", "Helper", "When", "Price", "Status"]} rows={f.map(({ t, h, c }) => [<Link key={t.id} href={`/ops/jobs/${t.id}`} className="font-semibold underline">{t.name}</Link>, c, h ?? "-", fmtDateTime(t.scheduledStart), inr(t.price), <Badge key={t.id}>{t.status}</Badge>])} /></div>
  );
}
