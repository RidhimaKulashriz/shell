import { db } from "@/db";
import { categories, packs } from "@/db/schema";
import { CatalogRow } from "@/components/ops";
import { BANNED_KEYWORDS } from "@/lib/catalog";
export const metadata = { title: "Ops: Catalog" };
export default async function Page() {
  const cats = await db.select().from(categories).orderBy(categories.displayOrder); const pk = await db.select().from(packs).orderBy(packs.displayOrder);
  return (<div className="space-y-6"><h1 className="text-3xl font-semibold text-tide">Catalog</h1><div className="card overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-bone text-xs uppercase text-ink/50"><tr><th className="p-3">Task</th><th>Base rate</th><th>Visible</th><th>Banned</th></tr></thead><tbody>{cats.map((c) => <CatalogRow key={c.id} c={{ id: c.id, name: c.name, baseRate: c.baseRate, unit: c.unit, active: c.active, banned: c.banned }} />)}</tbody></table></div>
    <div className="grid gap-5 md:grid-cols-2"><section className="card p-4"><h2 className="font-semibold">Packs</h2><ul className="mt-2 space-y-1 text-sm">{pk.map((p) => <li key={p.id}>{p.name}: {p.items.map((i) => `${i.slug} ×${i.quantity}`).join(", ")}</li>)}</ul></section>
      <section className="card p-4"><h2 className="font-semibold">Banned keywords (fuzzy matched)</h2><div className="mt-2 flex flex-wrap gap-1">{BANNED_KEYWORDS.map((k) => <span key={k} className="pill pill-bad">{k}</span>)}</div></section></div></div>);
}
