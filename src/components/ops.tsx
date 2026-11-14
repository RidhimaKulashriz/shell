"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { post, useToast } from "./client";
import { Icon } from "./icons";
import { computePlan, DEFAULT_PRICING, formatINR, type PricingConfig, type Size } from "@/lib/pricing";
import { CATALOG } from "@/lib/catalog";
import { cn } from "@/lib/utils";

import { OPS_NAV } from "@/lib/opsnav";

export function CommandPalette() {
  const [open, setOpen] = useState(false); const [q, setQ] = useState(""); const router = useRouter(); const g = useRef(0); const [sel, setSel] = useState(0);
  const items = useMemo(() => OPS_NAV.filter(([, l]) => l.toLowerCase().includes(q.toLowerCase())), [q]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); setQ(""); setSel(0); return; }
      if (e.key === "Escape") setOpen(false);
      const tag = (e.target as HTMLElement).tagName; if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (e.key === "g") { g.current = Date.now(); return; }
      if (Date.now() - g.current < 1200) { const hit = OPS_NAV.find((n) => n[3] === e.key); if (hit) router.push(hit[0]); g.current = 0; }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [router]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-start bg-tide/50 p-4 pt-[15vh]" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <input autoFocus className="w-full border-b border-line px-4 py-4 text-lg outline-none" placeholder="Jump to… (try “disputes”)" value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={(e) => { if (e.key === "ArrowDown") setSel((s) => Math.min(items.length - 1, s + 1)); if (e.key === "ArrowUp") setSel((s) => Math.max(0, s - 1)); if (e.key === "Enter" && items[sel]) { router.push(items[sel][0]); setOpen(false); } }} />
        <ul className="max-h-80 overflow-y-auto p-2">{items.map(([h, l, i, k], n) => <li key={h}><Link href={h} onClick={() => setOpen(false)} className={cn("flex items-center justify-between rounded-lg px-3 py-2.5", n === sel && "bg-cream")}><span className="flex items-center gap-3"><Icon name={i} size={18} />{l}</span><kbd className="rounded bg-bone px-1.5 text-xs text-ink/50">g {k}</kbd></Link></li>)}{items.length === 0 && <li className="p-4 text-sm text-ink/50">Nothing found.</li>}</ul>
      </div>
    </div>
  );
}

/** Posts to /api/ops, optionally asking for a reason first. */
export function OpsAction({ body, children, className = "btn btn-ghost btn-sm", ask, confirm, success = "Done" }: { body: Record<string, unknown>; children: React.ReactNode; className?: string; ask?: string; confirm?: string; success?: string }) {
  const router = useRouter(); const { show, node } = useToast(); const [busy, setBusy] = useState(false);
  return (<><button className={className} disabled={busy} onClick={async () => {
    let extra = {}; if (ask) { const r = window.prompt(ask); if (!r) return; extra = { reason: r }; } if (confirm && !window.confirm(confirm)) return;
    setBusy(true); try { await post("/api/ops", { ...body, ...extra }); show(success); router.refresh(); } catch (e) { show((e as Error).message, "err"); } finally { setBusy(false); }
  }}>{children}</button>{node}</>);
}

export function PlanBuilder({ planId, urgency, lines, catalog }: { planId: string; urgency: string; lines: { slug: string; name: string; quantity: number; unit: string }[]; catalog: { slug: string; name: string }[] }) {
  const router = useRouter(); const { show, node } = useToast(); const [ls, setLs] = useState(lines); const [urg, setUrg] = useState(urgency); const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); try { await post("/api/ops", { action: "plan_rebuild", planId, urgency: urg, lines: ls.map((l) => ({ slug: l.slug, quantity: l.quantity, size: "medium", confidence: 1 })) }); show("Plan updated and re-priced"); router.refresh(); } catch (e) { show((e as Error).message, "err"); } finally { setBusy(false); } };
  return (
    <div className="space-y-3">
      {ls.map((l, i) => <div key={l.slug} className="card flex items-center justify-between gap-3 p-3"><span className="font-medium">{l.name}</span><span className="flex items-center gap-2"><button className="chip !px-3" aria-label="Less" onClick={() => setLs(ls.map((x, j) => (j === i ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x)))}>−</button><span className="w-20 text-center text-sm">{l.quantity} {l.unit}</span><button className="chip !px-3" aria-label="More" onClick={() => setLs(ls.map((x, j) => (j === i ? { ...x, quantity: x.quantity + 1 } : x)))}>+</button><button className="text-sm text-danger underline" onClick={() => setLs(ls.filter((_, j) => j !== i))}>Remove</button></span></div>)}
      <div className="flex flex-wrap gap-2"><select className="input !w-auto" aria-label="Add task" value="" onChange={(e) => { const c = catalog.find((x) => x.slug === e.target.value); const cat = CATALOG.find((x) => x.slug === e.target.value); if (c && cat && !ls.find((x) => x.slug === c.slug)) setLs([...ls, { slug: c.slug, name: c.name, quantity: cat.qty, unit: cat.unit }]); }}><option value="">Add task…</option>{catalog.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        <select className="input !w-auto" aria-label="Urgency" value={urg} onChange={(e) => setUrg(e.target.value)}><option value="normal">Planned</option><option value="same_day">Same day</option><option value="rush">Rush</option></select>
        <button className="btn btn-primary btn-sm" disabled={busy || !ls.length} onClick={save}>Save and re-price</button></div>{node}
    </div>
  );
}

export function AssignSelect({ taskId, options }: { taskId: string; options: { id: string; label: string }[] }) {
  const router = useRouter(); const { show, node } = useToast(); const [v, setV] = useState("");
  return (<span className="flex items-center gap-2"><select className="input !min-h-[34px] !w-44 !py-1 text-sm" aria-label="Assign helper" value={v} onChange={(e) => setV(e.target.value)}><option value="">Assign…</option>{options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
    <button className="btn btn-ghost btn-sm" disabled={!v} onClick={async () => { const reason = window.prompt("Reason for manual assignment?"); if (!reason) return; try { await post("/api/ops", { action: "task_assign", taskId, helperId: v, reason }); show("Assigned"); router.refresh(); } catch (e) { show((e as Error).message, "err"); } }}>Go</button>{node}</span>);
}

export function DisputeResolver({ id, price }: { id: string; price: number }) {
  const router = useRouter(); const { show, node } = useToast(); const [type, setType] = useState("redo"); const [amount, setAmount] = useState(""); const [msg, setMsg] = useState("");
  return (
    <div className="mt-3 space-y-2 rounded-xl bg-bone p-3"><div className="flex flex-wrap gap-2">{[["redo", "Redo"], ["partial_refund", "Partial refund"], ["full_refund", "Full refund"], ["credit", "Credit"], ["none", "No action"]].map(([v, l]) => <button key={v} className="chip" aria-pressed={type === v} onClick={() => setType(v)}>{l}</button>)}</div>
      {["partial_refund", "credit"].includes(type) && <input className="input" inputMode="decimal" placeholder={`Amount in ₹ (task was ${formatINR(price)})`} value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" />}
      <textarea className="input" rows={2} placeholder="Message to the customer" value={msg} onChange={(e) => setMsg(e.target.value)} aria-label="Resolution message" />
      <button className="btn btn-primary btn-sm" onClick={async () => { try { await post("/api/ops", { action: "dispute_resolve", id, type, amount, message: msg }); show("Resolved"); router.refresh(); } catch (e) { show((e as Error).message, "err"); } }}>Resolve</button>{node}</div>
  );
}

export function PricingEditor({ cfg }: { cfg: PricingConfig }) {
  const router = useRouter(); const { show, node } = useToast();
  const [d, setD] = useState({ same_day: cfg.urgency.same_day, rush: cfg.urgency.rush, pct: cfg.platformFeePct * 100, floor: cfg.feeFloor / 100, coord: cfg.coordinationFee / 100, min: cfg.minOrder / 100, share: cfg.helperShare * 100, circleMax: cfg.circleMaxDiscount * 100, hold: cfg.holdHours });
  const [reason, setReason] = useState(""); const set = (k: string, v: string) => setD({ ...d, [k]: Number(v) });
  const draft: PricingConfig = { ...cfg, urgency: { normal: 1, same_day: d.same_day, rush: d.rush }, platformFeePct: d.pct / 100, feeFloor: d.floor * 100, coordinationFee: d.coord * 100, minOrder: d.min * 100, helperShare: d.share / 100, circleMaxDiscount: d.circleMax / 100, holdHours: d.hold };
  const sim = (cfgX: PricingConfig) => computePlan({ config: cfgX, urgency: "same_day", circleJoiners: 4, lines: [["house-cleaning", 4], ["groceries", 1], ["decoration", 2]].map(([s, q]) => { const c = CATALOG.find((x) => x.slug === s)!; return { slug: c.slug, name: c.name, kind: c.kind, rate: c.rate * 100, mins: c.mins, quantity: q as number, size: "medium" as Size }; }) });
  const a = sim(cfg), b = sim(draft);
  const F = ({ k, l, step = 1 }: { k: keyof typeof d; l: string; step?: number }) => <div><label className="label" htmlFor={`pe-${k}`}>{l}</label><input id={`pe-${k}`} type="number" step={step} className="input" value={d[k]} onChange={(e) => set(k, e.target.value)} /></div>;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="card space-y-4 p-5"><h2 className="font-semibold">Edit pricing (version {cfg.version})</h2>
        <div className="grid gap-3 sm:grid-cols-3"><F k="same_day" l="Same-day multiplier" step={0.05} /><F k="rush" l="Rush multiplier" step={0.05} /><F k="hold" l="Auto-approve hold (hours)" /><F k="pct" l="Platform fee %" step={0.5} /><F k="floor" l="Fee floor (₹)" /><F k="coord" l="Coordination fee (₹)" /><F k="min" l="Minimum order (₹)" /><F k="share" l="Helper share %" /><F k="circleMax" l="Max Circle discount %" /></div>
        <div><label className="label" htmlFor="pe-reason">Reason for change (required)</label><input id="pe-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={async () => { try { await post("/api/ops", { action: "pricing_save", reason, data: draft }); show("Published as a new version"); router.refresh(); } catch (e) { show((e as Error).message, "err"); } }}>Publish new version</button>{node}</div>
      <div className="card p-5"><h2 className="font-semibold">Simulator</h2><p className="text-xs text-ink/60">Same-day plan: 4 rooms cleaning, groceries, 2h decoration, 4-flat Circle.</p>
        <table className="mt-3 w-full text-sm"><thead><tr className="text-left text-ink/50"><th /><th>Current</th><th>Draft</th></tr></thead><tbody>{[["Subtotal", a.subtotal, b.subtotal], ["Platform fee", a.platformFee, b.platformFee], ["Coordination", a.coordinationFee, b.coordinationFee], ["Total", a.total, b.total]].map(([l, x, y]) => <tr key={String(l)} className="border-t border-line"><td className="py-2">{l}</td><td style={{ fontFamily: "var(--font-mono)" }}>{formatINR(x as number)}</td><td style={{ fontFamily: "var(--font-mono)" }} className={x !== y ? "font-bold text-euca" : ""}>{formatINR(y as number)}</td></tr>)}</tbody></table></div>
    </div>
  );
}

export function CatalogRow({ c }: { c: { id: string; name: string; baseRate: number; unit: string; active: boolean; banned: boolean } }) {
  const router = useRouter(); const { show, node } = useToast(); const [rate, setRate] = useState(String(c.baseRate / 100));
  const save = async (b: object, m = "Saved") => { try { await post("/api/ops", { action: "catalog_update", id: c.id, ...b }); show(m); router.refresh(); } catch (e) { show((e as Error).message, "err"); } };
  return (<tr className="border-t border-line"><td className="py-2 font-medium">{c.name}</td><td><span className="flex items-center gap-1">₹<input aria-label={`${c.name} rate`} className="input !min-h-[34px] !w-20 !py-1" value={rate} onChange={(e) => setRate(e.target.value)} />/{c.unit}<button className="btn btn-ghost btn-sm" onClick={() => save({ baseRate: rate })}>Save</button></span></td><td><label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={c.active} onChange={(e) => save({ active: e.target.checked })} />Active</label></td><td><label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={c.banned} onChange={(e) => save({ banned: e.target.checked })} />Banned</label>{node}</td></tr>);
}

export function Handover({ initial }: { initial: string }) {
  const [t, setT] = useState(initial); const { show, node } = useToast();
  return (<div><label className="label" htmlFor="ho">Shift handover note</label><textarea id="ho" rows={3} className="input" value={t} onChange={(e) => setT(e.target.value)} /><button className="btn btn-ghost btn-sm mt-2" onClick={async () => { await post("/api/ops", { action: "handover", text: t }); show("Saved"); }}>Save note</button>{node}</div>);
}

export function AnnounceForm({ initial }: { initial: string }) {
  const router = useRouter(); const [t, setT] = useState(initial); const { show, node } = useToast();
  return (<div><label className="label" htmlFor="an">Website announcement strip</label><input id="an" className="input" value={t} onChange={(e) => setT(e.target.value)} placeholder="Leave empty to hide" /><button className="btn btn-ghost btn-sm mt-2" onClick={async () => { await post("/api/ops", { action: "announce", text: t }); show("Updated"); router.refresh(); }}>Publish</button>{node}</div>);
}
