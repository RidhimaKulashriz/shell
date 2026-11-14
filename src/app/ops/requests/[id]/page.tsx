import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requests, plans, users, customerProfiles, tasks } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { planWithTasks } from "@/lib/plans";
import { candidatesFor } from "@/lib/dispatch";
import { PlanBuilder, OpsAction } from "@/components/ops";
import { Receipt } from "@/components/ui";
import { Chat } from "@/components/order";
import { allCategories } from "@/lib/stats";
import { formatINR } from "@/lib/pricing";
import { fmtDateTime } from "@/lib/utils";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [r] = await db.select().from(requests).where(eq(requests.id, id)); if (!r) notFound();
  const [cu] = await db.select().from(users).where(eq(users.id, r.customerId)); const [cp] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, r.customerId));
  const [p] = await db.select().from(plans).where(eq(plans.requestId, id)).orderBy(desc(plans.createdAt)).limit(1);
  const data = p ? await planWithTasks(p.id) : null; const cats = await allCategories();
  const past = await db.select().from(plans).where(and(eq(plans.customerId, r.customerId), eq(plans.status, "approved")));
  const sugg = data ? await Promise.all(data.tasks.map(async (t) => ({ t, c: (await candidatesFor(t.id)).slice(0, 3) }))) : [];
  void tasks;
  return (
    <div className="space-y-5"><Link href="/ops/requests" className="text-sm font-semibold underline">← Inbox</Link><h1 className="text-3xl font-semibold text-tide">Plan builder</h1>
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr_1fr]">
        <div className="space-y-4"><div className="card p-4"><div className="text-xs font-bold uppercase text-euca">Customer message</div><div className="note mt-2 !text-lg">{r.rawText}</div><p className="mt-2 text-sm text-ink/60">{cu.name} · deadline {fmtDateTime(r.deadlineAt)} · {r.urgency.replace("_", " ")}</p>{r.photos.length > 0 && <div className="mt-2 flex gap-2">{r.photos.map((ph, i) => <img key={i} src={ph} alt={`Customer photo ${i + 1}`} className="h-20 w-20 rounded-lg object-cover" />)}</div>}</div>
          <div className="card p-4 text-sm"><div className="font-semibold">Home Atlas</div><p className="text-ink/70">Pets: {cp?.atlas?.pets || "none"}<br />Allergies: {cp?.atlas?.allergies || "none"}<br />Key: {cp?.atlas?.keyHandling || "home"}<br />Do not touch: {cp?.atlas?.doNotTouch || "none"}<br />Helper pref: {cp?.helperGenderPref}</p><p className="mt-2 text-ink/60">{past.length} past plans</p></div>
          <div className="card p-4 text-sm"><div className="font-semibold">AI draft with confidence</div>{r.draft.map((d) => <div key={d.slug} className="flex justify-between border-t border-line py-1"><span>{d.slug}</span><span className={d.confidence < 0.6 ? "font-bold text-danger" : ""}>{Math.round(d.confidence * 100)}%</span></div>)}{!r.draft.length && <p className="text-ink/50">Nothing matched. Build the plan manually.</p>}</div></div>
        <div className="space-y-4">{data ? <><div className="flex items-center gap-2"><span className="pill">{data.plan.status}</span><span className="text-sm text-ink/60">Pricing v{data.plan.pricingConfigVersion}</span></div>
          <PlanBuilder planId={data.plan.id} urgency={data.plan.urgency} lines={data.tasks.map((t) => ({ slug: t.category.slug, name: t.title, quantity: t.quantity, unit: t.category.unit }))} catalog={cats.map((c) => ({ slug: c.slug, name: c.name }))} />
          <Receipt title={data.plan.title} subtitle="Customer preview" lines={data.tasks.map((t) => ({ name: t.title, amount: formatINR(t.price) }))} fees={[{ label: "Platform fee", amount: formatINR(data.plan.platformFee) }, ...(data.plan.coordinationFee ? [{ label: "Coordination fee", amount: formatINR(data.plan.coordinationFee) }] : [])]} total={formatINR(data.plan.total)} />
          {data.plan.status === "draft" && <OpsAction body={{ action: "plan_send", planId: data.plan.id, note: "" }} className="btn btn-primary" success="Plan sent to the customer">Send plan to customer</OpsAction>}
          <div className="text-xs text-ink/50">WhatsApp template: &ldquo;Your Shell plan is ready. Total {formatINR(data.plan.total)}. Open the app to approve.&rdquo;</div></> : <div className="card p-6 text-ink/60">No plan yet. The customer is still answering questions, or the request didn&apos;t match anything. Ask them via chat.</div>}
          {p && <Chat threadKey={`plan:${p.id}`} title="Chat with customer" />}</div>
        <div className="space-y-3"><h2 className="font-semibold">Helper suggestions</h2>{sugg.map(({ t, c }) => <div key={t.id} className="card p-3 text-sm"><div className="font-semibold">{t.title}</div>{c.length === 0 && <p className="text-danger">No eligible helper. Check skills and availability.</p>}{c.map((x) => <div key={x.helperId} className="mt-2 border-t border-line pt-2"><div className="flex justify-between"><strong>{x.name}</strong><span>{x.score.toFixed(2)}</span></div><div className="text-xs text-ink/60">{x.distanceM} m · ETA {x.etaMin} min · {x.online ? "online" : "offline"}</div><div className="mt-1 text-xs text-ink/50">rating {x.breakdown.rating} · on-time {x.breakdown.onTime} · distance {x.breakdown.proximity} · repeat {x.breakdown.repeat} · stack {x.breakdown.stacking}</div></div>)}</div>)}</div>
      </div></div>
  );
}
