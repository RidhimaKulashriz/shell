import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, featureFlags, settings, users } from "@/db/schema";
import { FlagToggle } from "@/components/ops/Actions";
import { H1, Table } from "@/components/ops/ui";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";

export const metadata = { title: "Settings, team, audit" };
const MATRIX: [string, string[]][] = [["Ops agent", ["view", "create", "edit"]], ["Ops lead", ["view", "create", "edit", "approve"]], ["Finance", ["view", "approve", "export"]], ["Safety", ["view", "edit", "approve"]], ["Content", ["view", "create", "edit"]], ["Society manager", ["view", "edit"]], ["Super admin", ["view", "create", "edit", "approve", "export"]]];

export default async function Page() {
  await requireUser(["OPS"], "/app/login");
  const [flags, st, team, logs] = await Promise.all([db.select().from(featureFlags), db.select().from(settings), db.select().from(users).where(inArray(users.role, ["OPS", "SUPER_ADMIN"])), db.select().from(auditLogs).orderBy(desc(auditLogs.ts)).limit(60)]);
  return (
    <div className="space-y-5"><H1 sub="Feature flags, SLAs, roles and the append-only audit log">Settings</H1>
      <section><h2 className="display text-xl">Feature flags</h2><Table cols={["Flag", "Description", "State"]} rows={flags.map((f) => [f.key, f.description, <FlagToggle key={f.key} k={f.key} on={f.enabled} />])} /></section>
      <section><h2 className="display text-xl">System settings</h2><Table cols={["Key", "Value"]} rows={st.map((s) => [s.key, <span key={s.key} className="mono text-xs">{JSON.stringify(s.value)}</span>])} /><p className="mt-1 text-xs">Provider status: WhatsApp {process.env.WHATSAPP_TOKEN ? "live" : "mock"} · Payments {process.env.RAZORPAY_KEY_ID ? "live" : "mock"} · OTP {process.env.OTP_PROVIDER ?? "mock"} · Maps: brand SVG provider.</p></section>
      <section><h2 className="display text-xl">Team</h2><Table cols={["Name", "Phone", "Role"]} rows={team.map((t) => [t.name, t.phone, t.opsRole ?? t.role])} /></section>
      <section><h2 className="display text-xl">Permission matrix</h2><Table cols={["Role", "Permissions"]} rows={MATRIX.map(([r, p]) => [r, p.join(", ")])} /></section>
      <section><h2 className="display text-xl">Audit log (latest 60)</h2><Table cols={["When", "Actor", "Action", "Entity", "Detail"]} rows={logs.map((l) => [fmtDateTime(l.ts), team.find((t) => t.id === l.actorId)?.name ?? l.actorId?.slice(0, 6) ?? "system", l.action, `${l.entity} ${l.entityId?.slice(0, 8) ?? ""}`, <span key={l.id} className="mono text-[10px]">{JSON.stringify(l.after)?.slice(0, 90)}</span>])} /></section></div>
  );
}
