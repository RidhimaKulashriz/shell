import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, customerProfiles, towers } from "@/db/schema";
import { SettingsForm } from "@/components/app/Misc";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Me" };

export default async function Page() {
  const user = await requireUser(["CUSTOMER"]);
  const [p] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user.id)).limit(1);
  const [a] = await db.select({ a: addresses, t: towers.name }).from(addresses).leftJoin(towers, eq(towers.id, addresses.towerId)).where(eq(addresses.userId, user.id)).limit(1);
  return (
    <div className="space-y-5">
      <h1 className="display text-3xl">Me</h1>
      {a && <div className="receipt scallop-b"><b>{user.name}</b><div className="mono text-xs">{user.phone}</div><div className="perf" /><p>{a.t}, floor {a.a.floor}, flat {a.a.flat}</p><p className="opacity-70">{a.a.landmark}</p>{a.a.verifiedAt ? <span className="stamp mt-2">Verified resident</span> : <span className="stamp stamp-brick mt-2">Verification pending</span>}</div>}
      <nav className="grid grid-cols-2 gap-2">{[["/app/routines", "Routines"], ["/app/wrapped", "Shell Wrapped"], ["/app/support", "Support chat"], ["/app/disputes", "Disputes"], ["/app/notifications", "Notifications"], ["/legal/terms", "Legal"]].map(([h, l]) => <Link key={h} href={h} className="chip justify-center">{l}</Link>)}</nav>
      <SettingsForm name={user.name} language={user.language} quiet={[p?.quietStart ?? 22, p?.quietEnd ?? 7]} consents={{ location: !!user.consentLocation, whatsapp: !!user.consentWhatsapp }} atlas={p?.homeAtlas ?? {}} />
      <p className="mono text-center text-xs opacity-60">Shell app v1.0</p>
    </div>
  );
}
