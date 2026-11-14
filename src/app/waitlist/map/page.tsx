import { PageHero, Section } from "@/components/Page";
import { WaitlistMap } from "@/components/WaitlistMap";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Live Shell waitlist map", description: "Privacy-safe hex-level density of neighbours waiting for Shell near you.", path: "/waitlist/map" });

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Live map" title={<>Aapke paas kitne <span className="font-accent text-euca">padosi</span>?</>} sub="Sirf hex dikhte hain, koi ghar ya address nahi. Teen se kam log hon to hum unhe alag se nahi dikhate." />
      <Section tone="dark"><WaitlistMap /></Section>
    </>
  );
}
