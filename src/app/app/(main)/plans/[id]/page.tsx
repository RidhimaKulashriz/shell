import { and, eq, ne } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { customerProfiles, plans, taskTemplates, tasks } from "@/db/schema";
import { PlanReview } from "@/components/app/PlanReview";
import { requireUser } from "@/lib/auth";
import { suggestHelpers } from "@/lib/dispatch";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["CUSTOMER"]);
  const [plan] = await db.select().from(plans).where(and(eq(plans.id, (await params).id), eq(plans.customerId, user.id))).limit(1);
  if (!plan) notFound();
  if (plan.status === "approved") redirect(`/app/orders/${plan.id}`);
  const ts = await db.select().from(tasks).where(and(eq(tasks.planId, plan.id), ne(tasks.status, "cancelled"))).orderBy(tasks.sequence);
  const tpls = await db.select().from(taskTemplates);
  const [profile] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user.id)).limit(1);
  const lines = await Promise.all(ts.map(async (t) => {
    const [top] = (await suggestHelpers(t.id, 3)).filter((s) => s.eligible);
    const tpl = tpls.find((x) => x.slug === t.templateSlug);
    return { id: t.id, name: t.name, qty: t.quantity, size: t.size, minutes: t.durationEstMin, price: t.price, start: t.scheduledStart?.toISOString() ?? null, checklist: t.checklist.map((c) => c.label), unit: tpl?.unit ?? "job",
      helper: top ? { name: top.name, level: top.level, rating: top.rating, jobsDone: top.jobsDone, languages: top.languages, goodAt: top.goodAt, voiceIntro: top.voiceIntro, why: top.why } : null };
  }));
  return <PlanReview plan={{ id: plan.id, title: plan.title, urgency: plan.urgency, urgencyMultiplier: plan.urgencyMultiplier, circleDiscount: plan.circleDiscount, subtotal: plan.subtotal, platformFee: plan.platformFee, coordinationFee: plan.coordinationFee, travel: plan.travelAmount, total: plan.total, deadlineAt: plan.deadlineAt?.toISOString() ?? null, status: plan.status, expiresAt: plan.expiresAt?.toISOString() ?? null }} lines={lines} credits={profile?.creditsBalance ?? 0} />;
}
