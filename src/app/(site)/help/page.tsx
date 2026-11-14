import { asc } from "drizzle-orm";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { PageHero, Section } from "@/components/site/Bits";
import { HelpSearch } from "@/components/HelpSearch";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Help centre", description: "Answers for customers and helpers, in Hindi and English.", path: "/help" });

export default async function Page() {
  const rows = await db.select().from(faqs).orderBy(asc(faqs.displayOrder));
  const items = rows.filter((r) => r.scope.startsWith("help") || r.scope === "home").map((r) => ({ id: r.id, scope: r.scope.startsWith("help-helper") ? "helper" : "customer", q: r.q, a: r.a, qHi: r.qHi ?? "", aHi: r.aHi ?? "" }));
  return (
    <>
      <PageHero eyebrow="help" title="Have a" em="question?" />
      <Section tone="paper"><HelpSearch items={items} /></Section>
    </>
  );
}
