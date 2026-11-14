import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { helperProfiles, strikes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ActionButton } from "@/components/client";
import { CopyButton } from "@/components/order";
import { LogoutButton } from "@/components/LogoutButton";
import { fmtDate } from "@/lib/utils";
export const metadata = { title: "Account" };
export default async function Page() {
  const user = await requireRole(["HELPER"], "/helper/account");
  const [h] = await db.select().from(helperProfiles).where(eq(helperProfiles.userId, user.id));
  const ss = await db.select().from(strikes).where(eq(strikes.helperId, user.id)).orderBy(desc(strikes.createdAt));
  return (<div className="mx-auto max-w-xl space-y-6"><h1 className="text-3xl font-semibold text-tide">Account</h1>
    <div className="card p-5 text-sm"><div className="font-semibold">{user.name}</div><div className="text-ink/60">{user.phone} · {h.college}</div><div className="mt-2 flex flex-wrap gap-2"><span className="pill">{h.level[0] + h.level.slice(1).toLowerCase()}</span><span className="pill">Status: {h.status}</span></div></div>
    <section className="card p-5"><h2 className="font-semibold">Strikes and appeals</h2><p className="text-sm text-ink/60">Every strike shows its reason. You can appeal once. Strikes expire after 60 days.</p>{ss.length === 0 ? <p className="mt-3 text-sm">No strikes. Keep it up.</p> : <ul className="mt-3 space-y-3">{ss.map((s) => <li key={s.id} className="rounded-xl bg-bone p-3 text-sm"><div className="font-semibold">{s.reason}</div><div className="text-xs text-ink/50">{fmtDate(s.createdAt)} · expires {fmtDate(s.expiresAt)}</div>{s.appealStatus === "none" ? <ActionButton url="/api/helper" body={{ action: "appeal", id: s.id }} className="btn btn-ghost btn-sm mt-2" success="Appeal submitted">Appeal</ActionButton> : <span className="pill pill-warn mt-2">Appeal {s.appealStatus}</span>}</li>)}</ul>}</section>
    <section className="card p-5 text-sm"><h2 className="font-semibold">Refer a friend</h2><p className="text-ink/60">College ambassadors earn bonuses for every verified helper they refer.</p><div className="mt-3 flex items-center gap-3"><code className="rounded bg-bone px-3 py-2">{h.passportSlug}</code><CopyButton text={`/login?as=helper&ref=${h.passportSlug}`} /></div></section>
    <section className="card p-5 text-sm"><h2 className="font-semibold">Safety</h2><p className="text-ink/60">SOS is available on every active job. Safety line: +91 98100 00001 (placeholder). You can also report a customer from any job chat by messaging support.</p></section>
    <LogoutButton className="btn btn-ghost" /></div>);
}
