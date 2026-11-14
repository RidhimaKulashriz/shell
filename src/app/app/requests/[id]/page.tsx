import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { requests, plans } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Clarify } from "@/components/customer";
import { Poll } from "@/components/client";
import { fmtTime } from "@/lib/utils";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["CUSTOMER"], `/app/requests/${id}`);
  const [r] = await db.select().from(requests).where(eq(requests.id, id));
  if (!r || r.customerId !== user.id) notFound();
  const [p] = await db.select().from(plans).where(eq(plans.requestId, id)).orderBy(desc(plans.createdAt)).limit(1);
  if (p && p.status !== "draft") redirect(`/app/plans/${p.id}`);
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="note !text-xl">&ldquo;{r.rawText.slice(0, 160)}&rdquo;</div>
      {r.status === "cancelled" && <div className="card p-5"><h1 className="text-2xl font-semibold text-tide">We can&apos;t do this one</h1><p className="mt-2 text-ink/70">{r.rejectedReason}</p><Link href="/app/new" className="btn btn-primary mt-4">Try something else</Link></div>}
      {r.status === "clarifying" && <><h1 className="text-2xl font-semibold text-tide">A couple of quick questions</h1><Clarify id={r.id} questions={r.questions} answered={r.answers} /></>}
      {(r.status === "in_review" || r.status === "drafting") && <div className="card p-6 text-center"><Poll every={4000} /><div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-line border-t-euca" /><h1 className="text-2xl font-semibold text-tide">Building your plan</h1><p className="mt-2 text-ink/70">A person on our team is checking it. This usually takes about 15 minutes.{r.slaDueAt && ` We'll have it to you by ${fmtTime(r.slaDueAt)}.`}</p><p className="mt-3 text-sm text-ink/50">We&apos;ll notify you the moment it&apos;s ready. You can close this page.</p><Link href="/app" className="btn btn-ghost btn-sm mt-4">Back home</Link></div>}
    </div>
  );
}
