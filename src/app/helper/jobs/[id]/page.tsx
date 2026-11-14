import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { tasks, plans, requests, addresses, towers, societies, users, customerProfiles, offers, categories } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { JobControls, TrackingBeacon } from "@/components/helper";
import { Chat, SosButton } from "@/components/order";
import { ActionButton, Poll } from "@/components/client";
import { SocietyMap } from "@/components/ui";
import { fmtDateTime, STATUS_LABEL } from "@/lib/utils";
import { formatINR, formatDuration } from "@/lib/pricing";
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["HELPER"], `/helper/jobs/${id}`);
  const [t] = await db.select().from(tasks).where(eq(tasks.id, id)); if (!t) notFound();
  const [offer] = await db.select().from(offers).where(and(eq(offers.taskId, id), eq(offers.helperId, user.id), eq(offers.status, "sent")));
  if (t.helperId !== user.id && !offer) notFound();
  const [plan] = await db.select().from(plans).where(eq(plans.id, t.planId)); const [req] = await db.select().from(requests).where(eq(requests.id, plan.requestId));
  const [a] = req.addressId ? await db.select().from(addresses).where(eq(addresses.id, req.addressId)) : []; const [tw] = a ? await db.select().from(towers).where(eq(towers.id, a.towerId)) : [];
  const [soc] = a ? await db.select().from(societies).where(eq(societies.id, a.societyId)) : []; const allTw = soc ? await db.select().from(towers).where(eq(towers.societyId, soc.id)) : [];
  const [cu] = await db.select().from(users).where(eq(users.id, t.customerId)); const [cp] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, t.customerId));
  const [cat] = await db.select().from(categories).where(eq(categories.id, t.categoryId));
  const mine = t.helperId === user.id; const active = mine && ["en_route", "arrived", "in_progress", "rework"].includes(t.status);
  const atlas = cp?.atlas ?? {};
  return (
    <div className="space-y-5">
      {mine && !["approved", "cancelled"].includes(t.status) && <Poll every={8000} />}
      <Link href="/helper" className="text-sm font-semibold text-euca underline">← All jobs</Link>
      <div><span className="pill">{STATUS_LABEL[t.status]}</span><h1 className="mt-2 text-3xl font-semibold text-tide">{t.title}</h1><p className="text-ink/60">{cu.name.split(" ")[0]} · {fmtDateTime(t.scheduledStart)} · {formatDuration(t.durationEstMin)} · you earn <strong>{formatINR(t.helperPayout)}</strong></p></div>
      {offer && !t.helperId && <div className="flex gap-2"><ActionButton url={`/api/tasks/${t.id}/accept`} className="btn btn-primary" success="Accepted">Accept this job</ActionButton><ActionButton url={`/api/tasks/${t.id}/decline`} body={{}} className="btn btn-ghost">Decline</ActionButton></div>}
      {active && <TrackingBeacon taskId={t.id} />}
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          {mine && <JobControls job={{ id: t.id, status: t.status, checklist: t.checklist, cap: t.expensesCap, hasExpense: !!t.expense, before: t.beforePhotos.length, after: t.afterPhotos.length }} />}
          <div className="card p-4"><h2 className="font-semibold">Checklist for this task</h2><ul className="mt-2 list-disc pl-5 text-sm text-ink/70">{t.checklist.map((c, i) => <li key={i}>{c.label}</li>)}</ul>{t.notes && <p className="mt-2 text-sm"><strong>Notes:</strong> {t.notes}</p>}</div>
          {mine && <Chat threadKey={`task:${t.id}`} title={`Chat with ${cu.name.split(" ")[0]}`} />}
        </div>
        <div className="space-y-5">
          <div className="card p-4"><h2 className="font-semibold">Getting there</h2>{tw && a && <><p className="mt-2 text-sm"><strong>{tw.name}</strong>, floor {a.floor}, flat {a.flat}</p><p className="text-sm text-ink/70">{tw.directions}</p><p className="mt-1 text-xs text-ink/50">{tw.liftNotes}</p>{a.landmark && <p className="text-sm text-ink/70">Landmark: {a.landmark}</p>}{a.entryNotes && <p className="text-sm text-ink/70">Entry: {a.entryNotes}</p>}
            <a className="btn btn-ghost btn-sm mt-3" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`}>Open in Google Maps</a>
            <div className="mt-3 flex items-center gap-2 text-xs"><span className="pill">Gate pass: {mine ? "sent to guard" : "sent when you accept"}</span></div></>}
            {soc && tw && <div className="mt-3"><SocietyMap gates={soc.gates} towers={allTw.map((x) => ({ name: x.name, lat: x.lat, lng: x.lng }))} boundary={soc.boundary} focusTower={tw.name} /></div>}</div>
          <div className="card p-4 text-sm"><h2 className="font-semibold">Home notes</h2><p className="mt-1 text-ink/70">Only what you need for this task.</p><ul className="mt-2 space-y-1"><li>Key: {atlas.keyHandling === "guard" ? "with the guard" : atlas.keyHandling === "lockbox" ? "lockbox, code from customer" : "customer will be home"}</li>{atlas.pets && <li>Pets: {atlas.pets}</li>}{atlas.allergies && <li>Cleaning product allergies: {atlas.allergies}</li>}{atlas.doNotTouch && <li className="font-semibold text-danger">Do not touch: {atlas.doNotTouch}</li>}</ul><p className="mt-2 text-xs text-ink/50">{cat?.name}</p></div>
          {active && <SosButton taskId={t.id} />}
        </div>
      </div>
    </div>
  );
}
