import { asc } from "drizzle-orm";
import { db } from "@/db";
import { packs, taskCategories, taskTemplates } from "@/db/schema";
import { CatalogEdit } from "@/components/ops/Actions";
import { H1, Table } from "@/components/ops/ui";
import { minutesToText } from "@/lib/format";

export const metadata = { title: "Catalog" };
const BANNED = ["massage", "makeup", "make-up", "facial", "waxing", "spa", "bridal", "personal care", "homework kar do", "assignment kar do"];

export default async function Page() {
  const [ts, cats, ps] = await Promise.all([db.select().from(taskTemplates).orderBy(asc(taskTemplates.displayOrder)), db.select().from(taskCategories), db.select().from(packs).orderBy(asc(packs.displayOrder))]);
  return (
    <div className="space-y-5"><H1 sub="Categories, tasks, checklists, durations, packs, banned keywords">Catalog manager</H1>
      <Table cols={["Task", "Category", "Unit", "Duration/unit", "Checklist", "Base rate ₹ (edit)"]} rows={ts.map((t) => [t.nameEn, t.categorySlug, t.unit, minutesToText(t.minutesPerUnit), <span key="c" className="text-xs">{t.checklist.join(" · ")}</span>, <CatalogEdit key="e" slug={t.slug} rate={t.baseRate} active={t.active} />])} />
      <section><h2 className="display text-xl">Packs</h2><Table cols={["Pack", "Tasks"]} rows={ps.map((p) => [p.nameEn, p.items.map((i) => `${i.label} x${i.qty}`).join(", ")])} /></section>
      <section><h2 className="display text-xl">Banned keywords (fuzzy, Hindi and English)</h2><p className="mt-1 flex flex-wrap gap-2">{BANNED.map((b) => <span key={b} className="stamp stamp-brick">{b}</span>)}</p><p className="mt-2 text-sm">{cats.length} categories live.</p></section></div>
  );
}
