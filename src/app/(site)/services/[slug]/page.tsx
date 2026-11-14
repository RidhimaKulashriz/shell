import { notFound } from "next/navigation";
import Link from "next/link";
import { Hero, Section, H2, Cta } from "@/components/page";
import { allCategories } from "@/lib/stats";
export const dynamic = "force-dynamic";
const S: Record<string, { title: string; lead: string; soon?: boolean; points: string[]; kind?: string }> = {
  quick: { title: "Shell Quick", lead: "Single, small tasks done fast by a verified helper from your society.", points: ["Parcel pickup and drop", "Groceries with a spending cap", "Dishes and small errands", "Minimum order and a small platform fee apply", "Pooled Circle slots cut the price when neighbours join"], kind: "quick" },
  managed: { title: "Shell Managed", lead: "For events, moves and full home organising. We plan the whole thing, coordinate several helpers and deliver one result.", points: ["One plan, one receipt, one point of contact", "A person on our team reviews every plan", "Tasks timed backwards from your deadline", "A small coordination fee covers planning and backup helpers"], kind: "managed" },
  routines: { title: "Shell Routines", lead: "Weekly cleaning, pet walks and regular errands with the same helper at the same time.", soon: true, points: ["Weekly, fortnightly or monthly", "Pause, skip or reschedule in one tap", "Same-helper preference", "Auto-pay with a mandate"] },
  plus: { title: "Shell Plus", lead: "A subscription for households who use Shell every week.", soon: true, points: ["Lower platform fees", "Priority scheduling", "Free rework extension", "Early access to new services"] },
};
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const s = S[(await params).slug]; return s ? { title: s.title, description: s.lead } : {}; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const s = S[(await params).slug]; if (!s) notFound();
  const cats = (await allCategories()).filter((c) => !s.kind || c.kind === s.kind);
  return (<>
    <Hero eyebrow={s.soon ? "Coming soon" : "Service"} title={s.title} lead={s.lead}>{s.soon ? <Link href="/waitlist" className="btn btn-sun">Tell me when it&apos;s ready</Link> : <Cta />}</Hero>
    <Section tone="white"><div className="grid gap-10 md:grid-cols-2"><div><H2 className="text-tide">What you get</H2><ul className="mt-5 space-y-3">{s.points.map((p) => <li key={p} className="flex gap-3"><span className="mt-1 text-euca">✓</span>{p}</li>)}</ul></div>
      {!s.soon && <div><H2 className="text-tide">Tasks included</H2><div className="mt-5 flex flex-wrap gap-2">{cats.map((c) => <Link key={c.slug} href={`/tasks/${c.slug}`} className="chip">{c.name}</Link>)}</div></div>}</div></Section>
  </>);
}
