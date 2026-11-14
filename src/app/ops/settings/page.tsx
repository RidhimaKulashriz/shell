import { db } from "@/db";
import { auditLog, users, announcements, inquiries } from "@/db/schema";
import { desc, eq, inArray, like, not } from "drizzle-orm";
import { getFlags } from "@/lib/settings";
import { OpsAction, AnnounceForm } from "@/components/ops";
import { fmtDateTime } from "@/lib/utils";
export const metadata = { title: "Ops: Settings and audit" };
const FLAG_HELP: Record<string, string> = { human_review: "A person reviews every plan before the customer sees it (production setting)", geofence_enforced: "Helpers can only check in within 150 m of the address (production setting)", demo_mode: "Shows demo controls and demo logins", auto_dispatch: "Offer jobs to the top helpers automatically after payment", rush_enabled: "Allow 90-minute Rush jobs", circles_enabled: "Allow Shell Circles", sound_effects: "Soft click sounds (off by default)" };
export default async function Page() {
  const flags = await getFlags();
  const log = await db.select().from(auditLog).where(not(like(auditLog.action, "event:%"))).orderBy(desc(auditLog.ts)).limit(40);
  const events = await db.select().from(auditLog).where(like(auditLog.action, "event:%")).orderBy(desc(auditLog.ts)).limit(8);
  const us = await db.select().from(users); const staff = us.filter((u) => ["OPS", "SUPER_ADMIN", "SOCIETY_PARTNER"].includes(u.role));
  const [ann] = await db.select().from(announcements).where(eq(announcements.active, true)).limit(1);
  const inq = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt)).limit(10);
  void inArray;
  return (<div className="space-y-6"><h1 className="text-3xl font-semibold text-tide">Settings and audit</h1>
    <section className="card p-5"><h2 className="font-semibold">Feature flags</h2><ul className="mt-3 divide-y divide-line">{Object.entries(flags).map(([k, v]) => <li key={k} className="flex items-center justify-between gap-3 py-3"><div><code className="text-sm font-semibold">{k}</code><div className="text-xs text-ink/60">{FLAG_HELP[k]}</div></div><OpsAction body={{ action: "flag_set", key: k, value: !v }} className={`btn btn-sm ${v ? "btn-primary" : "btn-ghost"}`}>{v ? "On" : "Off"}</OpsAction></li>)}</ul></section>
    <div className="grid gap-5 md:grid-cols-2"><section className="card p-5"><AnnounceForm initial={ann?.text ?? ""} /></section>
      <section className="card p-5"><h2 className="font-semibold">Team and roles</h2><ul className="mt-2 text-sm">{staff.map((s) => <li key={s.id} className="flex justify-between border-t border-line py-1"><span>{s.name}</span><span className="pill">{s.role.toLowerCase().replace("_", " ")}</span></li>)}</ul><p className="mt-2 text-xs text-ink/50">Ops can resolve disputes up to ₹1,500. Larger refunds need a Super Admin.</p></section></div>
    <section className="card p-5"><h2 className="font-semibold">Data and retention</h2><p className="mt-1 text-sm text-ink/70">Location pings are kept 30 days. Account deletion has a 7-day cooling-off period. Raw Aadhaar is never stored. Demo waitlist rows can be cleared before launch.</p><div className="mt-3"><OpsAction body={{ action: "clear_demo_waitlist" }} confirm="Delete all demo waitlist rows?" className="btn btn-ghost btn-sm">Clear demo waitlist data</OpsAction></div></section>
    <section className="card p-5"><h2 className="font-semibold">Inquiries</h2><ul className="mt-2 divide-y divide-line text-sm">{inq.map((i) => <li key={i.id} className="flex justify-between gap-3 py-2"><span><span className="pill">{i.kind}</span> <strong>{i.name}</strong> {i.message.slice(0, 80)} {Object.entries(i.meta).map(([k, v]) => `${k}: ${v}`).join(", ")}</span>{i.status === "new" && <OpsAction body={{ action: "inquiry_status", id: i.id }}>Done</OpsAction>}</li>)}{inq.length === 0 && <li className="text-ink/50">None</li>}</ul></section>
    <section className="card p-5"><h2 className="font-semibold">Audit log</h2><ul className="mt-2 divide-y divide-line text-xs">{log.map((l) => <li key={l.id} className="flex justify-between gap-3 py-1.5"><span><strong>{l.action}</strong> {l.entity} {l.entityId.slice(0, 8)} <span className="text-ink/50">by {us.find((u) => u.id === l.actorId)?.name ?? "system"}</span></span><span className="shrink-0 text-ink/40">{fmtDateTime(l.ts)}</span></li>)}</ul></section>
    <section className="card p-5 text-xs text-ink/60"><h2 className="text-base font-semibold text-ink">Recent website events</h2>{events.map((e) => <div key={e.id}>{e.action.replace("event:", "")} · {e.entityId}</div>)}{events.length === 0 && <div>None yet. Events are recorded after cookie consent.</div>}</section></div>);
}
