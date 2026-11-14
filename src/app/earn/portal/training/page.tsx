import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { helperTraining, helpers, trainingModules } from "@/db/schema";
import { QuizModule } from "@/components/earn/Portal";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Training" };

export default async function Page() {
  const user = await requireUser(["HELPER"], "/earn/login");
  const [h] = await db.select().from(helpers).where(eq(helpers.userId, user.id)).limit(1);
  const [ms, done] = await Promise.all([db.select().from(trainingModules).orderBy(asc(trainingModules.displayOrder)), db.select().from(helperTraining).where(eq(helperTraining.helperId, h.id))]);
  const passed = new Set(done.filter((d) => d.passedAt).map((d) => d.moduleSlug));
  return (
    <div className="space-y-4"><h1 className="display text-3xl">Training</h1><p>Safety module pehli job se pehle zaroori hai. Pass mark 80%. Managed jobs ke liye ek shadow job bhi.</p>
      {ms.map((m) => <QuizModule key={m.slug} m={{ slug: m.slug, title: m.title, mandatory: m.mandatory, cards: m.cards, quiz: m.quiz.map((q) => ({ q: q.q, options: q.options })), passed: passed.has(m.slug) }} />)}
      <p className="text-sm">Shadow job: {h.shadowJobDone ? "done" : "pending"}.</p></div>
  );
}
