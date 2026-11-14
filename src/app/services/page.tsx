import Link from "next/link";
import { PageHero, Section } from "@/components/Page";
import { Icon } from "@/components/Icon";
import { SERVICE_LINES } from "@/lib/catalog";
import { getCategories } from "@/lib/data";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Shell services: Quick, Managed, Earn, Routines", description: "Pick a small task with Shell Quick or hand over a whole plan with Shell Managed. Routines and Plus are coming soon.", path: "/services" });
export const dynamic = "force-dynamic";

export default async function Page() {
  const cats = await getCategories();
  return (
    <>
      <PageHero eyebrow="Services" title={<>Chhota ya bada, <span className="font-accent text-euca">sab</span> ek jagah.</>} sub="Shell Quick ek kaam ke liye. Shell Managed poore plan ke liye. Baaki jaldi." />
      <Section tone="paper">
        <ul className="grid gap-6 md:grid-cols-2">
          {SERVICE_LINES.map((s, i) => (
            <li key={s.slug} style={{ transform: `rotate(${[-0.8, 0.8, -0.5, 0.6, -0.4][i]}deg)` }}>
              <Link href={s.href} className={`flex h-full flex-col justify-between rounded-[26px_32px_22px_30px] p-6 ring-2 ring-tide ${s.slug === "managed" ? "band-dark md:col-span-2" : s.status === "soon" ? "border-2 border-dashed bg-paper" : "bg-sand"}`}>
                <div>
                  <div className="flex items-start justify-between gap-3"><h2 className="font-display text-4xl font-black leading-none">{s.name}</h2>{s.status === "soon" ? <span className="stamp">SOON</span> : null}</div>
                  <p className="mt-2 text-lg">{s.line}</p>
                  <ul className="mt-4 flex flex-wrap gap-2 text-sm">{s.examples.map((e) => <li key={e} className="rounded-full border border-current/40 px-3 py-1">{e}</li>)}</ul>
                </div>
                <span className="mt-5 font-semibold underline decoration-wavy underline-offset-4">Dekho →</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
      <Section tone="cream">
        <h2 className="font-display text-4xl font-black md:text-5xl">Sab kaam ek nazar mein</h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {cats.map((c) => (
            <li key={c.slug}><Link href={`/tasks/${c.slug}`} className="flex h-full items-center gap-3 rounded-2xl bg-white/60 p-3 hover:bg-white"><Icon name={c.iconId} size={36} /><span className="text-sm font-semibold leading-tight">{c.nameEn}</span></Link></li>
          ))}
        </ul>
      </Section>
    </>
  );
}
