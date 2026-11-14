import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { customerProfiles, addresses, towers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AtlasForm } from "@/components/customer";
import { ActionButton } from "@/components/client";
import { LogoutButton } from "@/components/LogoutButton";
export const metadata = { title: "Me" };
export default async function Page() {
  const user = await requireRole(["CUSTOMER"], "/app/me");
  const [p] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user.id));
  const [a] = await db.select().from(addresses).where(eq(addresses.userId, user.id)).limit(1);
  const [tw] = a ? await db.select().from(towers).where(eq(towers.id, a.towerId)) : [];
  return (<div className="mx-auto max-w-2xl space-y-6"><h1 className="text-3xl font-semibold text-tide">Me</h1>
    {a && <div className="card flex items-center justify-between p-4"><div><div className="font-semibold">{tw?.name}, floor {a.floor}, {a.flat}</div><div className="text-sm text-ink/60">{a.landmark}</div></div>{a.verifiedAt ? <span className="pill">Verified resident</span> : <span className="pill pill-warn">Pending</span>}</div>}
    <AtlasForm atlas={p?.atlas ?? {}} pref={p?.helperGenderPref ?? "any"} trusted={p?.trustedContact ?? null} name={user.name} email={user.email} />
    <section className="card space-y-3 p-5"><h2 className="text-lg font-semibold">Privacy and data</h2><p className="text-sm text-ink/70">Your location is never collected from you. Helper location is shared with you only during an active job. You can download or delete your data any time.</p>
      <div className="flex flex-wrap gap-2"><a className="btn btn-ghost btn-sm" href="/api/me/export">Download my data</a>
        {user.deletionRequestedAt ? <ActionButton url="/api/me" body={{ action: "cancel_delete" }} className="btn btn-ghost btn-sm" success="Deletion cancelled">Cancel account deletion</ActionButton> : <ActionButton url="/api/me" body={{ action: "delete" }} confirm="Delete your account? You have 7 days to change your mind." className="btn btn-danger btn-sm" success="Deletion scheduled in 7 days">Delete my account</ActionButton>}</div></section>
    <section className="card p-5 text-sm"><h2 className="text-lg font-semibold">Help</h2><div className="mt-2 flex flex-wrap gap-4"><Link className="underline" href="/app/support">Chat with support</Link><Link className="underline" href="/help">Help centre</Link><Link className="underline" href="/legal/terms">Terms</Link><Link className="underline" href="/legal/privacy">Privacy</Link></div></section>
    <LogoutButton className="btn btn-ghost" /></div>);
}
