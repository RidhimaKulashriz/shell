import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { addresses, customerProfiles, plans, requests, taskTemplates, tasks, towers, users } from "@/db/schema";
import { Act, AssignForm, PlanBuilder } from "@/components/ops/Actions";
import { Badge, H1 } from "@/components/ops/ui";
import { Receipt } from "@/components/ui";
import { suggestHelpers } from "@/lib/dispatch";
import { render } from "@/lib/notify";
import { inr, minutesToText } from "@/lib/format";

export const metadata = { title: "Plan Builder" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const [r] = await db.select().from(requests).where(eq(requests.id, (await params).id)).limit(1);
  if (!r) notFound();
  const [u] = await db.select().from(users).where(eq(users.id, r.customerId)).limit(1);
  const [prof] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, r.customerId)).limit(1);
  const [a] = r.addressId ? await db.select({ a: addresses, t: towers.name }).from(addresses).leftJoin(towers, eq(towers.id, addresses.towerId)).where(eq(addresses.id, r.addressId)).limit(1) : [];
  const [plan] = await db.select().from(plans).where(eq(plans.requestId, r.id)).orderBy(desc(plans.createdAt)).limit(1);
  const ts = plan ? await db.select().from(tasks).where(eq(tasks.planId, plan.id)).orderBy(tasks.sequence) : [];
  const tpls = await db.select().from(taskTemplates).where(eq(taskTemplates.active, true));
  const sugg = await Promise.all(ts.map(async (t) => ({ t, s: await suggestHelpers(t.id, 4) })));
  const past = await db.select().from(plans).where(eq(plans.customerId, r.customerId));
  return (
    <div className="space-y-4"><H1 sub={`${u?.name} · ${a?.t ?? ""} floor ${a?.a.floor ?? ""} · ${r.language}`}>Plan Builder</H1>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr_1.2fr]">
        <section className="space-y-3"><div className="rounded-xl border border-ink/20 bg-cream p-3"><Badge>{r.status}</Badge><p className="mt-2 font-semibold">{r.rawText}</p>{r.transcript && <p className="mono mt-1 text-xs">Transcript: {r.transcript}</p>}</div>
          {r.photos.map((p, i) => <div key={i} className="relative overflow-hidden rounded-xl border border-ink/20">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.url} alt="" className="w-full" />{p.circles?.map((c, j) => <span key={j} className="hand absolute rounded-full border border-brick bg-paper/80 px-1 text-sm" style={{ left: `${c.x}%`, top: `${c.y}%` }}>{c.label}</span>)}</div>)}
          <div className="rounded-xl border border-ink/20 bg-paper p-3 text-xs"><b>Home Atlas</b><p>Key: {prof?.homeAtlas.keyHandling ?? "-"} · Allergies: {prof?.homeAtlas.allergies || "none"} · Pets: {prof?.homeAtlas.pets?.map((p) => p.type).join(", ") || "none"}</p><p>Do not touch: {prof?.homeAtlas.doNotTouch?.map((d) => d.text).join(", ") || "none"}</p><p>Past plans: {past.length}</p></div>
          <div className="rounded-xl border border-ink/20 bg-paper p-3 text-xs"><b>Clarifying answers</b>{r.questions.map((q) => <p key={q.id}>{q.q} <b>{q.answer ?? "-"}</b></p>)}</div></section>
        <section className="space-y-3">
          {r.draft && <PlanBuilder requestId={r.id} defaultTitle={r.rawText.slice(0, 40)} templates={tpls.map((t) => ({ slug: t.slug, name: t.nameEn }))} draft={r.draft.tasks} deadline={r.deadlineAt?.toISOString() ?? null} />}
          {r.draft?.needsHuman && <p className="rounded-lg bg-sand p-2 text-xs"><b>Low confidence or banned content.</b> Banned: {r.draft.banned.join(", ") || "none"}. Overall confidence {Math.round(r.draft.overallConfidence * 100)}%.</p>}
          {plan && <div className="space-y-2"><Receipt title={plan.title} meta={`Plan v${plan.version} · ${plan.status}`} animate={false} lines={ts.map((t) => ({ name: t.name, qty: t.quantity > 1 ? String(t.quantity) : undefined, price: inr(t.price), sub: `${minutesToText(t.durationEstMin)} · payout ${inr(t.helperPayout)}` }))} fees={[{ name: "Platform fee", price: inr(plan.platformFee) }, { name: "Coordination", price: inr(plan.coordinationFee) }]} total={inr(plan.total)} />
            <p className="rounded-lg bg-paper p-2 text-xs">WhatsApp: {render("plan_ready", { link: `/app/plans/${plan.id}` })}</p>
            <div className="flex gap-2">{plan.status === "draft" && <Act url={`/api/ops/plans/${plan.id}/send`} label="Send plan" variant="btn-sun" confirmText="Send this plan to the customer?" />}{plan.status === "sent" && <Badge>sent to customer</Badge>}</div></div>}
        </section>
        <section className="space-y-3"><h2 className="display text-xl">Helper suggestions</h2>{sugg.length === 0 && <p className="text-sm opacity-70">Create the plan to see scored suggestions.</p>}
          {sugg.map(({ t, s }) => <div key={t.id} className="rounded-xl border border-ink/20 bg-cream p-3"><b>{t.name}</b>{t.assignedHelperId && <Badge>assigned</Badge>}<ul className="mt-2 space-y-1 text-xs">{s.map((x) => <li key={x.helperId} className={x.eligible ? "" : "opacity-50"}><b>{x.name}</b> score {x.score} · {x.distanceM} m · {x.level}{!x.eligible && <span className="text-brick"> ({x.reasons.join(", ")})</span>}<div className="mono text-[10px]">{Object.entries(x.breakdown).map(([k, v]) => `${k} ${v}`).join(" · ")}</div></li>)}</ul><div className="mt-2"><AssignForm taskId={t.id} helpers={s.filter((x) => x.eligible).map((x) => ({ id: x.helperId, name: x.name, score: x.score }))} /></div></div>)}</section>
      </div></div>
  );
}
