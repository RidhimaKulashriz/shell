import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { helpers } from "@/db/schema";
import { PrintButton } from "@/components/PrintButton";
import { passportFor } from "@/lib/passport";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verified experience resume", robots: { index: false } };

/** Print-optimised resume. Use "Save as PDF" in the browser print dialog. */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const [h] = await db.select().from(helpers).where(eq(helpers.passportSlug, (await params).slug)).limit(1);
  if (!h) notFound();
  const d = await passportFor(h);
  return (
    <main id="main" className="mx-auto max-w-2xl bg-white p-10 text-black print:p-0">
      <style>{`@media print{body::before{display:none}.noprint{display:none}}`}</style>
      <h1 className="display text-4xl">{d.name}</h1><p className="mono text-sm">Shell Skill Passport · Level {d.level} · Verified experience</p>
      <hr className="my-4 border-black" />
      <h2 className="display text-2xl">Verified experience</h2><ul className="mt-2 list-disc pl-5"><li>{d.jobs} completed jobs with Shell inside a Delhi apartment society</li>{d.rating > 0 && <li>Average customer rating {d.rating.toFixed(1)} out of 5</li>}<li>On-time arrival rate {Math.round(h.onTimeRate * 100)}%</li>{d.languages.length > 0 && <li>Languages: {d.languages.join(", ")}</li>}{d.college && <li>{d.college}</li>}</ul>
      <h2 className="display mt-6 text-2xl">Skills with stamps</h2><p>{d.stamps.map((s) => s.label).join(" · ") || "First stamp coming soon"}</p>
      <h2 className="display mt-6 text-2xl">Verification</h2><p>{d.verified.join(", ")}. Government ID, college ID, selfie liveness and safety training checked by Shell. Verify at shell/p/{h.passportSlug}.</p>
      <div className="noprint mt-8"><PrintButton /></div>
    </main>
  );
}
