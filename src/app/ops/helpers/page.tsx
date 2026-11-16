import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { helpers, strikes } from "@/db/schema";
import { Act } from "@/components/ops/Actions";
import { Badge, H1, Table } from "@/components/ops/ui";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Helpers" };

export default async function Page() {
  const u = await requireUser(["OPS"], "/app/login");
  const hs = await db.select().from(helpers).orderBy(desc(helpers.createdAt));
  const ss = await db.select().from(strikes);
  await audit({ actorId: u.id, action: "view_helper_documents", entity: "helper_list" });
  const queue = hs.filter((h) => ["applied", "review", "training", "shadow"].includes(h.status));
  const trans = (h: typeof hs[number]) => {
    const next: Record<string, string[]> = { applied: ["review"], review: ["training"], training: ["shadow", "active"], shadow: ["active"], active: ["paused", "suspended"], paused: ["active"], suspended: ["active", "banned"] };
    return (next[h.status] ?? []).map((s) => <Act key={s} url={`/api/ops/helpers/${h.id}/status`} body={{ status: s }} ask={`Reason to move ${h.displayName} to ${s}?`} label={s} variant="btn-cream" />);
  };
  return (
    <div className="space-y-5"><H1 sub="Application queue, verification, strikes, payout holds">Helpers</H1>
      <section><h2 className="display mb-2 text-xl">Application queue ({queue.length})</h2><Table cols={["Name", "Status", "ID", "College ID", "Selfie", "Training", "Actions"]} rows={queue.map((h) => [h.displayName, <Badge key="s">{h.status}</Badge>, h.kycStatus, h.collegeIdStatus, h.livenessStatus, h.trainingStatus, <span key="a" className="flex flex-wrap gap-1">{trans(h)}</span>])} /></section>
      <section><h2 className="display mb-2 text-xl">All helpers</h2><Table cols={["Name", "Level", "Status", "Rating", "Jobs", "On-time", "Strikes", "Tags", "Actions"]} rows={hs.map((h) => [h.displayName, h.level, <Badge key="s">{h.status}</Badge>, h.ratingAvg.toFixed(1), h.jobsDone, `${Math.round(h.onTimeRate * 100)}%`, ss.filter((s) => s.helperId === h.id).map((s) => s.reason).join("; ") || h.strikes, <span key="t" className="text-xs">{h.femaleOnlyEligible ? "female-only ok · " : ""}{h.managedEligible ? "managed · " : ""}{h.languages.join("/")}{h.payoutHold ? " · PAYOUT HOLD" : ""}</span>, <span key="a" className="flex flex-wrap gap-1"><Act url={`/api/ops/helpers/${h.id}/strike`} body={{ severity: 1 }} ask="Strike reason" label="Strike" variant="btn-ghost" />{trans(h)}{h.status === "active" && <Act url={`/api/ops/helpers/${h.id}/status`} body={{ status: "active", payoutHold: !h.payoutHold }} ask="Reason" label={h.payoutHold ? "Release hold" : "Hold payouts"} variant="btn-ghost" />}</span>])} /></section></div>
  );
}
