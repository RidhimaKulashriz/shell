import { PageHero, Section } from "@/components/Page";
import { HelpSearch } from "@/components/HelpSearch";
import { HELP_ITEMS } from "@/lib/content";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Shell Help Centre", description: "Search answers for customers and helpers, in English and Hindi.", path: "/help" });

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Help centre" title={<>Kya <span className="font-accent text-euca">poochhna</span> hai?</>} />
      <Section tone="paper"><div className="mx-auto max-w-3xl"><HelpSearch items={HELP_ITEMS} /></div></Section>
    </>
  );
}
