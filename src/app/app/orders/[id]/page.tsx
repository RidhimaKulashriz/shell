import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole, hmac } from "@/lib/auth";
import { db } from "@/db";
import { tasks, taskEvents, plans, requests, addresses, towers, societies, users, helperProfiles, reviews, categories, disputes } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { doorOtp } from "@/lib/plans";
import { getFlags } from "@/lib/settings";
import { etaMinutes, haversine } from "@/lib/geo";
import { ReadinessRing } from "@/components/ui";
import { LiveMap, TimeMachine, SosButton, Chat, ReviewForm, ReworkForm, ChangeRequests, ExpensePanel, DisputeForm, DemoStep, CopyButton } from "@/components/order";
import { ActionButton, Poll } from "@/components/client";
import { Stamp } from "@/components/ui";
import { TASK_PROGRESS, STEPS, STEP_LABEL } from "@/lib/progress";
import { fmtDateTime, fmtTime, STATUS_LABEL } from "@/lib/utils";
import { formatINR } from "@/lib/pricing";
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["CUSTOMER"], `/app/orders/${id}`);
  const [t] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!t || t.customerId !== user.id) notFound();
  const [plan] = await db.select().from(plans).where(eq(plans.id, t.planId));
  const [req] = await db.select().from(requests).where(eq(requests.id, plan.requestId));
  const [addr] = req.addressId ? await db.select().from(addresses).where(eq(addresses.id, req.addressId)) : [];
  const [tower] = addr ? await db.select().from(towers).where(eq(towers.id, addr.towerId)) : [];
  const [soc] = addr ? await db.select().from(societies).where(eq(societies.id, addr.societyId)) : [];
  const allTowers = soc ? await db.select().from(towers).where(eq(towers.societyId, soc.id)) : [];
  const [cat] = await db.select().from(categories).where(eq(categories.id, t.categoryId));
  const [hu] = t.helperId ? await db.select().from(users).where(eq(users.id, t.helperId)) : [];
  const [hp] = t.helperId ? await db.select().from(helperProfiles).where(eq(helperProfiles.userId, t.helperId)) : [];
  const events = await db.select().from(taskEvents).where(eq(taskEvents.taskId, id)).orderBy(asc(taskEvents.createdAt));
  const [rev] = await db.select().from(reviews).where(and(eq(reviews.taskId, id), eq(reviews.fromUserId, user.id)));
  const [dsp] = await db.select().from(disputes).where(eq(disputes.taskId, id));
  const flags = await getFlags();
  const first = hu?.name.split(" ")[0];
  const showOtp = !!t.helperId && ["accepted", "en_route", "arrived"].includes(t.status);
  const eta = hp?.lat && hp?.lng && tower ? etaMinutes(haversine({ lat: hp.lat, lng: hp.lng }, tower), addr.floor) : 12;
  const stepIdx = STEPS.indexOf((t.status === "offered" ? "planned" : t.status === "arrived" || t.status === "rework" ? "in_progress" : t.status) as (typeof STEPS)[number]);
  const live = !["approved", "cancelled", "failed"].includes(t.status);
  const share = `/track/${t.id}?t=${hmac("share:" + t.id).slice(0, 16)}`;
  return (
    <div className="space-y-6">
      {live && <Poll every={6000} />}
      <Link href={`/app/plans/${t.planId}`} className="text-sm font-semibold text-euca underline">← {plan.title}</Link>
      <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center"><ReadinessRing percent={TASK_PROGRESS[t.status] ?? 0} size={120} deadline={live ? t.scheduledStart : null} label={t.status === "approved" ? "Done" : "Progress"} />
        <div><span className={`pill ${t.status === "awaiting_approval" ? "pill-warn" : t.status === "cancelled" ? "pill-bad" : ""}`}>{STATUS_LABEL[t.status]}</span><h1 className="mt-2 text-3xl font-semibold text-tide">{t.title}</h1><p className="text-ink/60">{fmtDateTime(t.scheduledStart)} to {fmtTime(t.scheduledEnd)} · {t.quantity} {cat?.unit}{t.quantity > 1 ? "s" : ""} · {formatINR(t.price)}</p></div></div>

      {t.status !== "cancelled" && <ol className="grid grid-cols-6 gap-1 text-center text-[0.65rem] font-semibold sm:text-xs">{STEPS.map((s, i) => <li key={s}><div className={`mx-auto mb-1 h-1.5 rounded-full ${i <= stepIdx ? "bg-tide" : "bg-line"}`} /><span className={i <= stepIdx ? "text-tide" : "text-ink/40"}>{STEP_LABEL[s]}</span></li>)}</ol>}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          {t.status === "awaiting_approval" && (
            <div className="card space-y-4 border-2 border-sun p-5"><h2 className="text-xl font-semibold">Your helper says it&apos;s done. Take a look.</h2>
              <TimeMachine before={t.beforePhotos[0]} after={t.afterPhotos[0]} />
              <ul className="space-y-1 text-sm">{t.checklist.map((c, i) => <li key={i} className="flex items-center gap-2"><span className={c.done ? "text-euca" : "text-danger"}>{c.done ? "✓" : "✗"}</span>{c.label}</li>)}</ul>
              <div className="flex flex-wrap items-start gap-3"><ActionButton url={`/api/tasks/${t.id}/approve`} className="btn btn-sun" success="Approved. Thank you.">All good, approve</ActionButton><ReworkForm taskId={t.id} items={t.checklist.map((c) => c.label)} /></div>
              <p className="text-xs text-ink/50">If you don&apos;t respond, we approve automatically 2 hours after the helper finishes. Rework is free within 24 hours.</p></div>
          )}
          {t.status === "rework" && <div className="rounded-2xl bg-[#fbefc9] p-4 text-sm"><strong>Rework scheduled.</strong> No problem, we&apos;ll fix it. Your helper has been notified.</div>}
          {t.status === "approved" && <div className="card space-y-3 p-5"><Stamp animate>APPROVED</Stamp><h2 className="serif text-2xl font-semibold">Home ready. Just walk in.</h2><TimeMachine before={t.beforePhotos[0]} after={t.afterPhotos[0]} /></div>}
          {t.status === "approved" && t.helperId && !rev && <ReviewForm taskId={t.id} helper={first ?? "your helper"} />}
          {rev && <div className="card p-4 text-sm">You rated {first} {rev.rating} out of 5. Thank you.</div>}
          <ChangeRequests taskId={t.id} changes={t.changes} />
          {t.expensesCap > 0 && <ExpensePanel taskId={t.id} cap={t.expensesCap} expense={t.expense} />}

          {hu && hp && (
            <div className="card p-5"><div className="text-xs font-bold uppercase tracking-wider text-euca">Meet your helper</div>
              <div className="mt-2 flex items-start gap-4"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-tide text-2xl font-bold text-cream">{first?.[0]}</span>
                <div><h2 className="text-xl font-semibold">{first}</h2><div className="mt-1 flex flex-wrap gap-2"><span className="pill">{hp.level[0] + hp.level.slice(1).toLowerCase()}</span><span className="pill">ID verified</span><span className="pill">College ID verified</span><span className="pill">Safety trained</span></div>
                  <p className="mt-2 text-sm text-ink/70">★ {hp.ratingAvg ? hp.ratingAvg.toFixed(1) : "New"} · {hp.jobsDone} jobs · speaks {hp.languages.join(", ")}</p><p className="mt-2 text-sm text-ink/70">{hp.bio}</p>
                  <p className="mt-2 text-sm"><strong>Why we picked {first}:</strong> lives nearby, {hp.ratingAvg ? `rated ${hp.ratingAvg.toFixed(1)}` : "new"}, with {Math.round(hp.onTimeRate * 100)}% on-time arrivals.</p>
                  <Link href={`/passport/${hp.passportSlug}`} className="mt-2 inline-block text-sm font-semibold underline">View Skill Passport</Link></div></div></div>
          )}

          {t.status !== "cancelled" && soc && tower && <div className="card p-4"><h2 className="mb-3 font-semibold">Live tracking</h2><LiveMap gates={soc.gates} towers={allTowers.map((x) => ({ name: x.name, lat: x.lat, lng: x.lng }))} boundary={soc.boundary} focusTower={tower.name} status={t.status} enRouteAt={t.enRouteAt?.toISOString()} etaMin={eta} helperName={first} floor={addr.floor} /></div>}

          <div className="card p-5"><h2 className="font-semibold">Timeline</h2><ol className="mt-3 space-y-3 border-l-2 border-dashed border-line pl-5">{events.map((e) => <li key={e.id} className="relative text-sm"><span className="absolute -left-[1.65rem] top-1.5 h-2.5 w-2.5 rounded-full bg-euca" /><div className="font-medium">{e.note || e.type}</div><div className="text-xs text-ink/50">{fmtDateTime(e.createdAt)}</div></li>)}</ol></div>
        </div>

        <div className="space-y-5">
          {showOtp && <div className="rounded-2xl bg-tide p-6 text-center text-cream"><div className="text-xs uppercase tracking-[0.2em] text-sage">Door code</div><div className="serif my-2 text-6xl font-bold tracking-[0.2em]" aria-label={`Door code ${doorOtp(t.id).split("").join(" ")}`}>{doorOtp(t.id)}</div><p className="text-sm text-sage">Share only with {first} when they&apos;re at your door.</p></div>}
          {t.helperId && t.status !== "approved" && t.status !== "cancelled" && <Chat threadKey={`task:${t.id}`} title={`Chat with ${first}`} />}
          {live && t.helperId && <SosButton taskId={t.id} />}
          {flags.demo_mode && live && <DemoStep taskId={t.id} />}
          <div className="card space-y-3 p-4"><h2 className="font-semibold">Actions</h2>
            <div className="flex flex-wrap gap-2"><CopyButton text={share} label="Share status with family" />
              {["planned", "offered", "accepted", "en_route", "arrived"].includes(t.status) && <ActionButton url={`/api/tasks/${t.id}/cancel`} body={{ reason: "Cancelled by customer" }} confirm="Cancel this task? Cancelling before the helper is on the way is free." className="btn btn-ghost btn-sm" success="Cancelled. Refund on the way.">Cancel task</ActionButton>}</div>
            {dsp ? <p className="text-sm">Dispute status: <strong>{dsp.status.replace("_", " ")}</strong>. We reply within 24 hours.</p> : <DisputeForm taskId={t.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
