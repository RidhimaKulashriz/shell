import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { addresses, helpers, ledgerEntries, locationPings, messages, payments, photos, plans, societies, taskEvents, tasks, towers } from "@/db/schema";
import { PulseMap } from "@/components/maps";
import { Badge, H1, Table } from "@/components/ops/ui";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { fmtDateTime, inr } from "@/lib/format";

export const metadata = { title: "Job detail" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser(["OPS"], "/app/login");
  const [t] = await db.select().from(tasks).where(eq(tasks.id, (await params).id)).limit(1);
  if (!t) notFound();
  const [plan] = await db.select().from(plans).where(eq(plans.id, t.planId)).limit(1);
  const [h] = t.assignedHelperId ? await db.select().from(helpers).where(eq(helpers.id, t.assignedHelperId)).limit(1) : [];
  const [ev, msgs, ph, pings, pays, led] = await Promise.all([db.select().from(taskEvents).where(eq(taskEvents.taskId, t.id)).orderBy(asc(taskEvents.ts)), db.select().from(messages).where(eq(messages.threadKey, `task:${t.id}`)).orderBy(asc(messages.createdAt)), db.select().from(photos).where(eq(photos.taskId, t.id)), db.select().from(locationPings).where(eq(locationPings.taskId, t.id)).orderBy(asc(locationPings.ts)), db.select().from(payments).where(eq(payments.planId, t.planId)), db.select().from(ledgerEntries).where(eq(ledgerEntries.refId, t.id))]);
  // staff access to location data is itself audited
  if (pings.length) await audit({ actorId: u.id, action: "view_location", entity: "task", entityId: t.id });
  const [a] = plan.addressId ? await db.select().from(addresses).where(eq(addresses.id, plan.addressId)).limit(1) : [];
  const [soc] = a ? await db.select().from(societies).where(eq(societies.id, a.societyId)).limit(1) : [];
  const tw = soc ? await db.select().from(towers).where(eq(towers.societyId, soc.id)) : [];
  return (
    <div className="space-y-5"><H1 sub={`${plan.title} · helper ${h?.displayName ?? "unassigned"}`}>{t.name} <Badge>{t.status}</Badge></H1>
      <div className="grid gap-4 lg:grid-cols-2">
        <section><h2 className="display text-xl">Timeline</h2><Table cols={["When", "Event", "Detail"]} rows={ev.map((e) => [fmtDateTime(e.ts), e.kind.replace(/_/g, " "), <span key={e.id} className="mono text-xs">{JSON.stringify(e.detail)}</span>])} /></section>
        <section><h2 className="display text-xl">Route replay ({pings.length} pings)</h2><PulseMap boundary={soc?.boundary ?? []} gates={soc?.gates ?? []} towers={tw.map((x) => ({ name: x.name, lat: x.lat, lng: x.lng }))} route={pings.map((p) => ({ lat: p.lat, lng: p.lng }))} helpers={h?.lat != null ? [{ id: h.id, name: h.displayName, lat: h.lat, lng: h.lng!, label: h.displayName.split(" ")[0] }] : []} className="border border-ink/20" /><p className="mono mt-1 text-xs">Access to location data is logged to the audit trail.</p></section>
      </div>
      <section><h2 className="display text-xl">Chat transcript</h2><div className="space-y-1 rounded-xl border border-ink/20 bg-cream p-3 text-sm">{msgs.length === 0 && <p>No messages.</p>}{msgs.map((m) => <p key={m.id} className={m.leakFlags.length ? "rounded bg-brick/15 p-1" : ""}><b>{m.senderRole}:</b> {m.body} {m.leakFlags.length > 0 && <Badge tone="red">leak: {m.leakFlags.join(", ")}</Badge>}</p>)}</div></section>
      <section><h2 className="display text-xl">Photos</h2><div className="flex flex-wrap gap-3">{ph.map((p) => <figure key={p.id} className="w-40 text-xs">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.url} alt={p.kind} className="rounded-lg border border-ink/20" /><figcaption>{p.kind} · {fmtDateTime(p.takenAt)}</figcaption></figure>)}{ph.length === 0 && <p className="text-sm">No photos.</p>}</div></section>
      <section className="grid gap-4 md:grid-cols-2"><div><h2 className="display text-xl">Payments</h2><Table cols={["Order", "Amount", "Status"]} rows={pays.map((p) => [p.orderId.slice(-10), inr(p.amount), <Badge key={p.id}>{p.status}</Badge>])} /></div><div><h2 className="display text-xl">Ledger</h2><Table cols={["Account", "Debit", "Credit", "Memo"]} rows={led.map((l) => [l.account, inr(l.debit), inr(l.credit), l.memo])} empty="No journal for this task yet" /></div></section></div>
  );
}
