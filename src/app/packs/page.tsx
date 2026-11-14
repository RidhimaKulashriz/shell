import { PageHero, Section } from "@/components/Page";
import { PackStubs } from "@/components/PackStubs";
import { getPacks } from "@/lib/data";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Shell Packs: ready-made plans for guests, moves and festivals", description: "Guests Aa Rahe Hain, Move-In Ready, Diwali Ready, Exam Week Support, Weekend Reset, New Flat Setup and Party Prep. Each with a sample receipt.", path: "/packs" });
export const dynamic = "force-dynamic";

export default async function Page() {
  const packs = await getPacks();
  return (
    <>
      <PageHero eyebrow="Pre-built plans" title={<>Packs. Jo <span className="font-accent text-euca">pehle</span> se soche hue hain.</>} sub="Saat situations jo har ghar mein aati hain. Har pack ki apni receipt aur timeline hai, aur aap tasks badal sakte ho." />
      <Section tone="paper"><PackStubs packs={packs} /></Section>
    </>
  );
}
