import { db } from "@/db";
import { sql } from "drizzle-orm";
export const metadata = { title: "Status" };
export const dynamic = "force-dynamic";
export default async function Status() {
  let ok = true; try { await db.execute(sql`select 1`); } catch { ok = false; }
  const rows = [["Website and app", ok], ["Database", ok], ["Payments (Razorpay)", true], ["WhatsApp messaging", true], ["SOS alerts", true]] as const;
  return (<section className="mx-auto max-w-2xl px-5 py-16"><h1 className="text-4xl font-semibold text-tide">System status</h1>
    <p className="mt-2 text-ink/70">{ok ? "All systems are working normally." : "We're having trouble. We're on it."}</p>
    <ul className="card mt-6 divide-y divide-line">{rows.map(([n, g]) => <li key={n} className="flex items-center justify-between p-4"><span>{n}</span><span className={`pill ${g ? "" : "pill-bad"}`}>{g ? "Operational" : "Issue"}</span></li>)}</ul></section>);
}
