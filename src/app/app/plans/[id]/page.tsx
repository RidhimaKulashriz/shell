import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { customerProfiles, helperProfiles, users, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { planWithTasks } from "@/lib/plans";
import { candidatesFor } from "@/lib/dispatch";
import { getPricing } from "@/lib/settings";
import { PlanEditor } from "@/components/customer";
import { Poll } from "@/components/client";
import { Receipt, ReadinessRing, Stamp } from "@/components/ui";
import { Icon } from "@/components/icons";
import { planPercent } from "@/lib/progress";
import { formatINR, formatDuration } from "@/lib/pricing";
import { fmtDateTime, STATUS_LABEL } from "@/lib/utils";
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["CUSTOMER"], `/app/plans/${id}`);
  const data = await planWithTasks(id);
  if (!data || data.plan.customerId !== user.id) notFound();
  const { plan, tasks } = data;
  if (plan.status === "draft") return (<div className="mx-auto max-w-xl card p-6 text-center"><Poll every={4000} /><div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-line border-t-euca" /><h1 className="text-2xl font-semibold text-tide">A person is checking your plan</h1><p className="mt-2 text-ink/70">You&apos;ll be notified as soon as it&apos;s ready, usually within 15 minutes.</p></div>);
  if (plan.status === "sent") {
    const [prof] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user.id));
    const cfg = await getPricing();
    const all = await db.select().from(categories).where(eq(categories.active, true));
    const enriched = await Promise.all(tasks.map(async (t) => {
      const c = (await candidatesFor(t.id)); const top = c[0];
      return { id: t.id, title: t.title, icon: t.category.icon, unit: t.category.unit, quantity: t.quantity, duration: t.durationEstMin, price: t.price, cap: t.expensesCap, isGrocery: t.category.slug === "groceries", status: t.status,
        helper: top ? { name: top.name, level: top.level[0] + top.level.slice(1).toLowerCase(), rating: top.ratingAvg, jobs: top.jobsDone, why: `${top.distanceM < 400 ? "lives very close" : "is nearby"}, ${top.ratingAvg ? `rated ${top.ratingAvg.toFixed(1)}` : "new and enthusiastic"}${top.breakdown.repeat ? ", and has helped you before" : ""}.`, others: c.slice(1, 3).map((x) => x.name.split(" ")[0]) } : null };
    }));
    const have = new Set(tasks.map((t) => t.category.slug));
    return (<div><div className="mb-5"><h1 className="text-3xl font-semibold text-tide">Your plan is ready</h1><p className="text-ink/60">Check it, change anything, then approve. Nothing is charged until you approve.</p></div>
      <PlanEditor plan={{ id: plan.id, urgency: plan.urgency, promoCode: plan.promoCode, subtotal: plan.subtotal, platformFee: plan.platformFee, coordinationFee: plan.coordinationFee, minTopUp: plan.minTopUp, travel: plan.travelAmount, promoDiscount: plan.promoDiscount, total: plan.total, circleDiscount: plan.circleDiscount, title: plan.title, deadline: plan.deadlineAt?.toISOString() ?? null }}
        tasks={enriched} credits={prof?.creditsBalance ?? 0} wallet={prof?.walletBalance ?? 0} addable={all.filter((c) => !have.has(c.slug)).slice(0, 8).map((c) => ({ slug: c.slug, name: c.name }))} cfgPromoNote={`Try ${Object.keys(cfg.promos)[0]} on your first plan.`} /></div>);
  }
  // approved / paid
  const hs = tasks.filter((t) => t.helperId).map((t) => t.helperId!);
  const hu = hs.length ? await db.select().from(users) : [];
  const nameOf = (hid: string | null) => hu.find((u) => u.id === hid)?.name.split(" ")[0];
  void helperProfiles;
  const pct = planPercent(tasks.map((t) => t.status));
  const done = tasks.every((t) => ["approved", "cancelled"].includes(t.status));
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center"><ReadinessRing percent={pct} deadline={done ? null : plan.deadlineAt} label={done ? "Home ready" : "Getting ready"} />
        <div><div className="flex items-center gap-2"><Stamp animate>PAID</Stamp></div><h1 className="mt-2 text-3xl font-semibold text-tide">{done ? "Home ready. Just walk in." : plan.title}</h1><p className="text-ink/60">{done ? "Everything is done and approved." : "We're on it. Open any task to track it, chat or approve the work."}</p></div></div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">{tasks.map((t) => (
          <Link key={t.id} href={`/app/orders/${t.id}`} className="card flex items-center gap-4 p-4 hover:border-euca"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream text-euca"><Icon name={t.category.icon} /></span>
            <div className="flex-1"><div className="font-semibold">{t.title}</div><div className="text-xs text-ink/60">{fmtDateTime(t.scheduledStart)} · {formatDuration(t.durationEstMin)}{nameOf(t.helperId) ? ` · ${nameOf(t.helperId)}` : ""}</div></div>
            <span className={`pill ${t.status === "awaiting_approval" ? "pill-warn" : ""}`}>{STATUS_LABEL[t.status]}</span></Link>))}</div>
        <Receipt title={plan.title} subtitle="Final amounts" lines={tasks.map((t) => ({ name: t.title, detail: `${t.quantity} ${t.category.unit}${t.quantity > 1 ? "s" : ""}`, amount: formatINR(t.price), stamped: t.status === "approved" }))}
          fees={[{ label: "Platform fee", amount: formatINR(plan.platformFee) }, ...(plan.coordinationFee ? [{ label: "Coordination fee", amount: formatINR(plan.coordinationFee) }] : []), ...(plan.minTopUp ? [{ label: "Minimum order top-up", amount: formatINR(plan.minTopUp) }] : []), ...(plan.promoDiscount ? [{ label: "Promo", amount: "−" + formatINR(plan.promoDiscount) }] : [])]} total={formatINR(plan.total)} status="PAID" footer="Includes Shell Guarantee." />
      </div>
    </div>
  );
}
