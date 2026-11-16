import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { RequestFlow } from "@/components/app/RequestFlow";
import { requireUser } from "@/lib/auth";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["CUSTOMER"]);
  const [r] = await db.select().from(requests).where(and(eq(requests.id, (await params).id), eq(requests.customerId, user.id))).limit(1);
  if (!r) notFound();
  return <RequestFlow id={r.id} text={r.rawText} questions={r.questions} status={r.status} slaDueAt={r.slaDueAt?.toISOString() ?? null} photos={r.photos} needsHuman={!!r.draft?.needsHuman} banned={r.draft?.banned ?? []} />;
}
