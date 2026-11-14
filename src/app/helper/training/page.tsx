import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { helperProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TrainingModule } from "@/components/helper";
export const metadata = { title: "Training" };
export default async function Page() {
  const user = await requireRole(["HELPER"], "/helper/training");
  const [h] = await db.select().from(helperProfiles).where(eq(helperProfiles.userId, user.id));
  return (<div className="mx-auto max-w-xl space-y-4"><h1 className="text-3xl font-semibold text-tide">Training</h1><p className="text-ink/60">Short cards and a quiz. You need 80% to pass. The safety module is required before your first job.</p>
    {h.status === "applied" || h.status === "review" ? <p className="rounded-xl bg-[#fbefc9] p-3 text-sm">Training opens once your application is approved.</p> : <><TrainingModule mod="safety" done={!!h.safetyTrainingPassedAt} /><TrainingModule mod="general" done={h.trainingDone.includes("general")} /></>}</div>);
}
