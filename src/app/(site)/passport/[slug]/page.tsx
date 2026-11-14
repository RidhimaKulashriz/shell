import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/db";
import { helperProfiles, users, tasks, categories } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { PassportBook } from "@/components/passport";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const [row] = await db.select({ h: helperProfiles, u: users }).from(helperProfiles).innerJoin(users, eq(users.id, helperProfiles.userId)).where(eq(helperProfiles.passportSlug, (await params).slug));
  if (!row) notFound();
  const done = await db.select({ slug: categories.slug, icon: categories.icon, name: categories.name }).from(tasks).innerJoin(categories, eq(categories.id, tasks.categoryId)).where(and(eq(tasks.helperId, row.h.userId), eq(tasks.status, "approved")));
  const seen = new Map(done.map((d) => [d.slug, { label: d.name, icon: d.icon }]));
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/passport/${row.h.passportSlug}`;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 160, color: { dark: "#051f20", light: "#f4f1e6" } });
  return (<div className="mx-auto max-w-3xl px-5 py-14"><h1 className="text-3xl font-semibold text-tide">Verified Skill Passport</h1><p className="mb-8 text-ink/70">Issued by Shell. Scan the QR code to verify.</p>
    <PassportBook name={row.u.name.split(" ")[0]} level={row.h.level} jobs={row.h.jobsDone} rating={row.h.ratingAvg} qr={qr} college={row.h.college} languages={row.h.languages} stamps={[...seen.values()]} />
    <div className="mt-8 grid gap-3 sm:grid-cols-3">{[["ID verified", row.h.kycStatus === "verified"], ["College ID verified", row.h.collegeIdStatus === "verified"], ["Safety trained", !!row.h.safetyTrainingPassedAt]].map(([l, ok]) => <div key={String(l)} className="card p-4 text-sm"><span className={`pill ${ok ? "" : "pill-warn"}`}>{ok ? "Verified" : "Pending"}</span><div className="mt-2 font-semibold">{String(l)}</div></div>)}</div>
    <p className="mt-8 text-sm text-ink/60 print:hidden">To save this as a PDF résumé, use your browser&apos;s Print option and choose &ldquo;Save as PDF&rdquo;.</p></div>);
}
