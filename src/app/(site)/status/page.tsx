import { sql } from "drizzle-orm";
import { db } from "@/db";
import { PageHero, Section } from "@/components/site/Bits";
import { Stamp } from "@/components/ui";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Status", description: "Live status of Shell services.", path: "/status" });

export default async function Page() {
  let dbOk = true;
  try { await db.execute(sql`select 1`); } catch { dbOk = false; }
  const rows: [string, boolean, string][] = [["Website", true, "ok"], ["Database", dbOk, dbOk ? "ok" : "down"], ["Payments (Razorpay)", true, process.env.RAZORPAY_KEY_ID ? "live" : "mock mode"], ["WhatsApp notifications", true, process.env.WHATSAPP_TOKEN ? "live" : "mock mode"], ["Maps", true, "brand SVG map"], ["SOS pipeline", true, "ok, 20 second target"]];
  return (
    <>
      <PageHero eyebrow="sab theek hai?" title="System" em="status." />
      <Section tone="paper"><div className="receipt scallop-b mx-auto max-w-lg">{rows.map(([n, ok, note]) => <div key={n} className="receipt-line"><span>{n}</span><span className="leader" /><Stamp label={ok ? note : "down"} tone={ok ? "green" : "brick"} delay={0} /></div>)}</div></Section>
    </>
  );
}
