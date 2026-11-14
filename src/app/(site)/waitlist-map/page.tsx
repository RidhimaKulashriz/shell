import { PageHero, Section } from "@/components/site/Bits";
import { SocietyFinder } from "@/components/home/Sections";
import { meta } from "@/lib/seo";
import { hexCounts, societyList } from "@/lib/site-data";

export const metadata = meta({ title: "Live waitlist map", description: "See how many neighbours are waiting near you. Hex-level density only, no addresses.", path: "/waitlist-map" });

export default async function Page() {
  const [socs, hexes] = await Promise.all([societyList(), hexCounts(3)]);
  return (
    <>
      <PageHero eyebrow="neighbours waiting near you" title="Where should" em="we start?" sub="Every hexagon is roughly 900 metres across. We only show a hexagon once at least three people are waiting in it, so nobody can be located." />
      <Section tone="dark" className="!pt-10"><div className="text-ink"><SocietyFinder societies={socs} hexes={hexes} /></div></Section>
    </>
  );
}
