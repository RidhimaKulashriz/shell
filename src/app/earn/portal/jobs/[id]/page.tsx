import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { addresses, customerProfiles, helpers, photos, plans, tasks, towers, users } from "@/db/schema";
import { JobFlow } from "@/components/earn/Portal";
import { requireUser } from "@/lib/auth";
import { fmtDateTime, inr } from "@/lib/format";

export const metadata = { title: "Job" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["HELPER"], "/earn/login");
  const [h] = await db.select().from(helpers).where(eq(helpers.userId, user.id)).limit(1);
  const [t] = await db.select().from(tasks).where(and(eq(tasks.id, (await params).id), eq(tasks.assignedHelperId, h.id))).limit(1);
  if (!t) notFound();
  const [p] = await db.select().from(plans).where(eq(plans.id, t.planId)).limit(1);
  const [a] = p.addressId ? await db.select().from(addresses).where(eq(addresses.id, p.addressId)).limit(1) : [];
  const [tw] = a?.towerId ? await db.select().from(towers).where(eq(towers.id, a.towerId)).limit(1) : [];
  const [cust] = await db.select({ name: users.name }).from(users).where(eq(users.id, p.customerId)).limit(1);
  const [prof] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, p.customerId)).limit(1);
  const ph = await db.select({ kind: photos.kind }).from(photos).where(eq(photos.taskId, t.id));
  const atlas = prof?.homeAtlas ?? {};
  const navUrl = a?.lat != null ? `https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}&travelmode=driving` : "#";
  return (
    <div className="space-y-4">
      <h1 className="display text-3xl">{t.name}</h1>
      <div className="receipt scallop-b !text-[13px]"><div className="receipt-line"><span>Customer</span><span className="leader" /><b>{cust?.name.split(" ")[0]}</b></div><div className="receipt-line"><span>When</span><span className="leader" /><span>{fmtDateTime(t.scheduledStart)}</span></div><div className="receipt-line"><span>Your payout</span><span className="leader" /><b>{inr(t.helperPayout)}</b></div><div className="receipt-line"><span>Where</span><span className="leader" /><span>{tw?.name}, floor {a?.floor}</span></div>
        <div className="perf" /><p><b>Gate 2 se seedha, {tw?.name} ke peeche, lift lobby 2.</b></p><p className="opacity-70">{tw?.liftNotes}</p><p>{a?.landmark}</p><p>Entry: {a?.entryNotes}</p>
        {atlas.doNotTouch?.length ? <p className="mt-2 rounded bg-sand p-2"><b>Do not touch:</b> {atlas.doNotTouch.map((d) => d.text).join(", ")}</p> : null}{atlas.allergies ? <p className="mt-1">Allergies: {atlas.allergies}</p> : null}{atlas.pets?.length ? <p className="mt-1">Pets: {atlas.pets.map((x) => x.type).join(", ")}</p> : null}
        <p className="mt-2 text-xs">Gate pass: sent to guard</p></div>
      <a className="btn btn-cream" href={navUrl} target="_blank" rel="noopener noreferrer">Google Maps kholo (bahar ka raasta)</a>
      <JobFlow job={{ id: t.id, name: t.name, status: t.status, checklist: t.checklist.map((c) => ({ label: c.label, done: c.done })), lat: a?.lat ?? 28.5921, lng: a?.lng ?? 77.046, photos: ph, expensesCap: t.expensesCap, extra: [] }} />
    </div>
  );
}
