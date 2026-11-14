import Link from "next/link";
import { db } from "@/db";
import { users, addresses } from "@/db/schema";
import { ilike, or, eq } from "drizzle-orm";
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const rows = q ? await db.select().from(users).where(or(ilike(users.name, `%${q}%`), ilike(users.phone, `%${q}%`))).limit(20) : [];
  const flat = q ? await db.select().from(addresses).where(ilike(addresses.flat, `%${q}%`)).limit(10) : [];
  const fu = flat.length ? await Promise.all(flat.map(async (a) => (await db.select().from(users).where(eq(users.id, a.userId)))[0])) : [];
  const all = [...rows, ...fu.filter(Boolean)];
  return (<div><h1 className="text-3xl font-semibold text-tide">Search: {q}</h1><div className="card mt-4 divide-y divide-line">{all.map((u) => <Link key={u.id} href={u.role === "HELPER" ? "/ops/helpers" : "/ops/customers"} className="flex justify-between p-4 hover:bg-cream/40"><span className="font-medium">{u.name || u.phone}</span><span className="text-sm text-ink/60">{u.role.toLowerCase()} · {u.phone}</span></Link>)}{all.length === 0 && <p className="p-4 text-ink/50">No matches.</p>}</div></div>);
}
