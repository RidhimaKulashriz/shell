import { PageHero } from "@/components/Page";
import { WaitlistForm } from "@/components/WaitlistForm";
import { buildMeta } from "@/lib/site";
import Link from "next/link";

export const metadata = buildMeta({ title: "Join the Shell waitlist", description: "Tell us your society and what you need done. Verify your WhatsApp number, see your place in the queue, and move up by inviting neighbours.", path: "/waitlist" });

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Pehle logon mein" title={<>Apni society mein <span className="font-accent text-euca">jaldi</span> laao.</>} sub="Jitne zyada padosi judte hain, utna jaldi hum aapke tower mein aate hain.">
        <Link href="/waitlist/map" className="font-semibold underline decoration-sun decoration-[3px] underline-offset-4">Live map dekho →</Link>
      </PageHero>
      <section className="band-dark px-4 py-14 md:py-20"><WaitlistForm /></section>
    </>
  );
}
