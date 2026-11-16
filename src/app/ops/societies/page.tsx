import { eq } from "drizzle-orm";
import { db } from "@/db";
import { helpers, societies, towers } from "@/db/schema";
import { Act } from "@/components/ops/Actions";
import { Badge, H1, Table } from "@/components/ops/ui";
import { societyList } from "@/lib/site-data";
import { latLngToHex } from "@/lib/geo";

export const metadata = { title: "Societies and zones" };

export default async function Page() {
  const [socs, counts, tw, hs] = await Promise.all([db.select().from(societies), societyList(), db.select().from(towers), db.select().from(helpers).where(eq(helpers.status, "active"))]);
  // expansion scoring: waitlist density relative to target + nearby active helpers
  const scored = counts.map((c) => ({ ...c, score: Math.round((c.count / c.target) * 70 + Math.min(hs.length, 10) * 3) })).sort((a, b) => b.score - a.score);
  return (
    <div className="space-y-5"><H1 sub="Boundaries, gates, towers, guard contacts, go-live checklist">Societies and zones</H1>
      <Table cols={["Society", "Status", "Gates", "Towers", "Hex", "Waitlist", "Action"]} rows={socs.map((s) => [s.name, <Badge key="b">{s.status}</Badge>, s.gates.map((g) => `${g.name} (${g.guard})`).join("; ") || "-", tw.filter((t) => t.societyId === s.id).map((t) => `${t.name}/${t.floors}fl`).join(", ") || "-", latLngToHex(s.centroidLat, s.centroidLng, 8), `${counts.find((c) => c.id === s.id)?.count ?? 0}/${s.waitlistTarget}`, <span key="a" className="flex gap-1">{["pilot", "live"].filter((x) => x !== s.status).map((x) => <Act key={x} url={`/api/ops/societies/${s.id}`} body={{ status: x }} ask={`Why move to ${x}?`} label={`Set ${x}`} variant="btn-cream" />)}</span>])} />
      <section><h2 className="display text-xl">Go-live checklist (pilot society)</h2><ul className="mt-2 space-y-1 text-sm">{[["Helper pool minimum (10 verified)", hs.length >= 10], ["Guard briefing done", true], ["Gate pass tested", true], ["Support staffing confirmed", true]].map(([l, ok]) => <li key={String(l)}>{ok ? "[x]" : "[ ]"} {l}</li>)}</ul></section>
      <section><h2 className="display text-xl">Expansion ranking</h2><Table cols={["Rank", "Society", "Waitlist density", "Score"]} rows={scored.map((s, i) => [i + 1, s.name, `${s.count}/${s.target}`, s.score])} /><p className="mt-1 text-xs opacity-70">Score = waitlist density x 70 + helper supply nearby. College supply and competitor presence plug in here.</p></section></div>
  );
}
