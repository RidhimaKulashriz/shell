import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { helpers } from "@/db/schema";
import { PassportBook } from "@/components/Passport";
import { passportFor } from "@/lib/passport";
import { SITE_URL, meta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const [h] = await db.select().from(helpers).where(eq(helpers.passportSlug, (await params).slug)).limit(1);
  return h ? meta({ title: `${h.displayName.split(" ")[0]}'s Shell Skill Passport`, description: `Verified Shell helper, level ${h.level}.`, path: `/p/${h.passportSlug}` }) : {};
}

/** Public, QR-verifiable passport. Shows only what the helper chose to share. */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [h] = await db.select().from(helpers).where(eq(helpers.passportSlug, slug)).limit(1);
  if (!h) notFound();
  const data = await passportFor(h);
  const qr = await QRCode.toString(`${SITE_URL}/p/${slug}`, { type: "svg", margin: 0, color: { dark: "#0E1A17", light: "#F4F1E6" } });
  return (
    <main id="main" className="grid min-h-screen place-items-center bg-cream p-6"><div className="w-full max-w-lg space-y-5"><PassportBook data={{ ...data, qr }} /><div className="text-center"><span className="stamp">Verified by Shell</span><p className="mt-2 text-sm">{h.voiceIntroText}</p><a className="btn btn-cream btn-sm mt-3" href={`/p/${slug}/resume`}>Resume (PDF)</a></div></div></main>
  );
}
