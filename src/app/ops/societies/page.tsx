import { db } from "@/db";
import { societies, towers, waitlist, helperProfiles } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { OpsAction } from "@/components/ops";
import { HexMap } from "@/components/ui";
import { hexCells } from "@/lib/stats";
export const metadata = { title: "Ops: Societies" };
export default async function Page() {
  const ss = await db.select().from(societies); const tw = await db.select().from(towers);
  const wl = await db.select({ s: waitlist.societyId, n: count() }).from(waitlist).groupBy(waitlist.societyId);
  const [hp] = await db.select({ n: count() }).from(helperProfiles).where(eq(helperProfiles.status, "active"));
  const cells = await hexCells();
  const ranked = ss.map((s) => { const n = wl.find((w) => w.s === s.id)?.n ?? 0; return { s, n, score: Math.round((n / s.unlockTarget) * 70 + Math.min(30, (s.flats / 400) * 30)) }; }).filter((r) => r.s.status === "waitlist").sort((a, b) => b.score - a.score);
  return (<div className="space-y-6"><h1 className="text-3xl font-semibold text-tide">Societies and zones</h1>
    <div className="grid gap-4 md:grid-cols-2">{ss.map((s) => <div key={s.id} className="card p-4"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">{s.name}</h2><p className="text-sm text-ink/60">{s.area}, {s.city} · {s.flats} flats · {tw.filter((t) => t.societyId === s.id).length} towers · {s.gates.length} gates</p></div><span className="pill">{s.status}</span></div>
      <div className="mt-3 flex flex-wrap gap-2">{["waitlist", "pilot", "live"].filter((x) => x !== s.status).map((x) => <OpsAction key={x} body={{ action: "society_update", id: s.id, status: x, unlockTarget: s.unlockTarget }} confirm={`Change ${s.name} to ${x}?`}>Set {x}</OpsAction>)}</div>
      {s.status !== "waitlist" && <ul className="mt-3 space-y-1 text-xs text-ink/60"><li>Go-live checklist: helper pool {hp.n >= 10 ? "✓" : "✗"} (needs 10) · guard briefing ☐ · gate pass tested ☐ · support staffing ☐</li>{s.gates.map((g) => <li key={g.name}>{g.name}: {g.hours}. {g.rules}</li>)}</ul>}</div>)}</div>
    <section className="card p-4"><h2 className="font-semibold">Expansion ranking</h2><p className="text-xs text-ink/60">Score = waitlist progress (70%) + size (30%). Nearby college supply and competitor data can be added.</p><ol className="mt-3 space-y-1 text-sm">{ranked.map((r, i) => <li key={r.s.id} className="flex justify-between"><span>{i + 1}. {r.s.name}</span><span>{r.n} waiting · score {r.score}</span></li>)}</ol></section>
    <section><h2 className="mb-2 text-xl font-semibold">Demand heatmap (waitlist, hex level)</h2><HexMap cells={cells} /></section></div>);
}
