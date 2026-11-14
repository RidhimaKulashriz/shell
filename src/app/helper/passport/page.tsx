import QRCode from "qrcode";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { helperProfiles, tasks, categories } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { PassportBook } from "@/components/passport";
import { CopyButton } from "@/components/order";
import { LEVELS } from "@/lib/tasks";
export const metadata = { title: "Skill Passport" };
export default async function Page() {
  const user = await requireRole(["HELPER"], "/helper/passport");
  const [h] = await db.select().from(helperProfiles).where(eq(helperProfiles.userId, user.id));
  const done = await db.select({ slug: categories.slug, icon: categories.icon, name: categories.name }).from(tasks).innerJoin(categories, eq(categories.id, tasks.categoryId)).where(and(eq(tasks.helperId, user.id), eq(tasks.status, "approved")));
  const seen = new Map(done.map((d) => [d.slug, { label: d.name, icon: d.icon }]));
  const path = `/passport/${h.passportSlug}`; const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}${path}`;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 160, color: { dark: "#051f20", light: "#f4f1e6" } });
  return (<div className="space-y-6"><div><h1 className="text-3xl font-semibold text-tide">Your Skill Passport</h1><p className="text-ink/60">A verified record of your work. Use it for internships and applications.</p></div>
    <PassportBook name={user.name.split(" ")[0] || "You"} level={h.level} jobs={h.jobsDone} rating={h.ratingAvg} qr={qr} college={h.college} languages={h.languages} stamps={[...seen.values()]} />
    <div className="flex flex-wrap gap-2"><Link className="btn btn-primary btn-sm" href={path} target="_blank">Open public page</Link><CopyButton text={path} /></div>
    <div className="card p-5"><h2 className="font-semibold">Levels</h2><ul className="mt-3 space-y-2 text-sm">{LEVELS.map((l) => <li key={l.name} className={`flex justify-between ${l.name === h.level ? "font-bold text-tide" : "text-ink/60"}`}><span>{l.label}</span><span>{l.min}+ jobs{l.rating ? `, ${l.rating}+ rating` : ""}</span></li>)}</ul><p className="mt-3 text-xs text-ink/50">Perks: priority offers, higher payout share, instant-payout fee waived, paid training invitations.</p></div>
    <p className="text-xs text-ink/50">To export a PDF résumé, open your public page and use Print, then Save as PDF.</p></div>);
}
