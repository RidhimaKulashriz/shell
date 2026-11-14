import { sql } from "drizzle-orm";
import { db } from "@/db";
import { PageHero, Section } from "@/components/Page";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Shell status", description: "Live status of the Shell website and database.", path: "/status" });
export const dynamic = "force-dynamic";

export default async function Page() {
  let dbOk = true;
  try {
    await db.execute(sql`select 1`);
  } catch {
    dbOk = false;
  }
  const rows = [["Website", true], ["Database", dbOk], ["Waitlist and OTP (demo mode)", dbOk]] as const;
  return (
    <>
      <PageHero eyebrow="Status" title={dbOk ? "Sab theek hai." : "Kuch dikkat hai."} />
      <Section tone="paper">
        <ul className="max-w-md space-y-2 font-mono">{rows.map(([n, ok]) => <li key={n} className="flex items-center justify-between rounded-xl bg-cream px-4 py-3 ring-1 ring-tide"><span>{n}</span><span className={ok ? "text-euca" : "text-stamp"}>{ok ? "operational" : "down"}</span></li>)}</ul>
      </Section>
    </>
  );
}
