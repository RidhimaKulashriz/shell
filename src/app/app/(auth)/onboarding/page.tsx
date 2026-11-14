import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { societies, towers } from "@/db/schema";
import { Onboarding } from "@/components/app/Onboarding";
import { requireUser } from "@/lib/auth";
import { societyList } from "@/lib/site-data";

export default async function Page() {
  await requireUser(["CUSTOMER"]);
  const [socs, tw] = await Promise.all([societyList(), db.select().from(towers).orderBy(asc(towers.name))]);
  void societies; void eq;
  return <Onboarding societies={socs.map((s) => ({ id: s.id, name: s.name, status: s.status, count: s.count, target: s.target }))} towers={tw.map((t) => ({ id: t.id, societyId: t.societyId, name: t.name, floors: t.floors }))} />;
}
