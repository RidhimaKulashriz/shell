"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { quote, type PricingConfig } from "@/lib/pricing";
import { inr } from "@/lib/format";

async function call(url: string, method: string, body: unknown) {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, data: j, error: j?.error?.message as string | undefined };
}

/** One-click admin action. `ask` prompts for a required reason (audit-logged server side). */
export function Act({ url, method = "POST", body = {}, label, ask, confirmText, variant = "btn-forest" }: { url: string; method?: string; body?: Record<string, unknown>; label: string; ask?: string; confirmText?: string; variant?: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  return (
    <span className="inline-flex flex-col">
      <button className={`btn btn-sm ${variant}`} onClick={async () => {
        if (confirmText && !confirm(confirmText)) return;
        let extra = {};
        if (ask) { const r = prompt(ask); if (!r) return; extra = { reason: r }; }
        const r = await call(url, method, { ...body, ...extra });
        setMsg(r.ok ? "Done" : r.error ?? "Error");
        if (r.ok) router.refresh();
      }}>{label}</button>
      {msg && <span role="status" className="mono text-[10px]">{msg}</span>}
    </span>
  );
}

type Tpl = { slug: string; name: string };
export function PlanBuilder({ requestId, defaultTitle, templates, draft, deadline }: { requestId: string; defaultTitle: string; templates: Tpl[]; draft: { template: string; qty: number; size: string; confidence: number }[]; deadline: string | null }) {
  const router = useRouter();
  const [items, setItems] = useState(draft.map((d) => ({ ...d })));
  const [title, setTitle] = useState(defaultTitle);
  const [urgency, setUrgency] = useState("normal");
  const [managed, setManaged] = useState(draft.length >= 3);
  const [msg, setMsg] = useState("");
  const upd = (i: number, p: object) => setItems(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="space-y-3 rounded-xl border border-ink/20 bg-cream p-3">
      <h2 className="display text-xl">Plan Builder</h2>
      <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Plan title" />
      {items.map((it, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-paper p-2">
          <select className="field !w-auto !py-1" value={it.template} onChange={(e) => upd(i, { template: e.target.value })}>{templates.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select>
          <input className="field !w-16 !py-1" type="number" min={1} max={20} value={it.qty} onChange={(e) => upd(i, { qty: Number(e.target.value) })} aria-label="Quantity" />
          <select className="field !w-auto !py-1" value={it.size} onChange={(e) => upd(i, { size: e.target.value })}><option>small</option><option>medium</option><option>large</option></select>
          <span className="mono text-xs">conf {Math.round(it.confidence * 100)}%</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setItems(items.filter((_, j) => j !== i))}>Delete</button>
        </div>
      ))}
      <button className="btn btn-cream btn-sm" onClick={() => setItems([...items, { template: templates[0].slug, qty: 1, size: "medium", confidence: 1 }])}>+ Add from catalog</button>
      <div className="flex flex-wrap gap-2">{["normal", "same_day", "rush"].map((u) => <button key={u} className="chip" aria-pressed={urgency === u} onClick={() => setUrgency(u)}>{u}</button>)}<button className="chip" aria-pressed={managed} onClick={() => setManaged(!managed)}>Managed</button></div>
      <button className="btn btn-sun" disabled={!items.length} onClick={async () => {
        const r = await call("/api/ops/plans", "POST", { requestId, title, items: items.map((i) => ({ template: i.template, qty: i.qty, size: i.size })), urgency, managed, deadlineAt: deadline ?? undefined });
        if (!r.ok) return setMsg(r.error ?? "Error");
        setMsg(`Draft plan created, total ₹${Math.round(r.data.total / 100)} (priced by the pricing engine)`);
        router.refresh();
      }}>Price it and create plan</button>
      {msg && <p role="status" className="text-sm font-semibold">{msg}</p>}
    </div>
  );
}

export function AssignForm({ taskId, helpers }: { taskId: string; helpers: { id: string; name: string; score: number }[] }) {
  const router = useRouter();
  const [h, setH] = useState(helpers[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  return <span className="inline-flex flex-wrap items-center gap-1"><select className="field !w-auto !py-1" value={h} onChange={(e) => setH(e.target.value)} aria-label="Helper">{helpers.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.score})</option>)}</select><input className="field !w-40 !py-1" placeholder="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} /><button className="btn btn-forest btn-sm" disabled={reason.length < 3} onClick={async () => { const r = await call(`/api/ops/tasks/${taskId}/assign`, "POST", { helperId: h, reason }); setMsg(r.ok ? "Assigned" : r.error ?? "Error"); if (r.ok) router.refresh(); }}>Assign</button>{msg && <span className="mono text-[10px]">{msg}</span>}</span>;
}

export function DisputeResolve({ id }: { id: string }) {
  const router = useRouter();
  const [action, setAction] = useState("redo");
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  return <div className="flex flex-wrap items-center gap-1"><select className="field !w-auto !py-1" value={action} onChange={(e) => setAction(e.target.value)} aria-label="Resolution">{["redo", "partial_refund", "full_refund", "credit", "no_action"].map((a) => <option key={a}>{a}</option>)}</select>{["partial_refund", "credit"].includes(action) && <input className="field !w-24 !py-1" placeholder="₹" value={amt} onChange={(e) => setAmt(e.target.value)} />}<input className="field !w-40 !py-1" placeholder="Note to customer" value={note} onChange={(e) => setNote(e.target.value)} /><button className="btn btn-forest btn-sm" onClick={async () => { const r = await call(`/api/ops/disputes/${id}/resolve`, "POST", { action, amount: Math.round(Number(amt || 0) * 100), note }); setMsg(r.ok ? "Resolved" : r.error ?? "Error"); if (r.ok) router.refresh(); }}>Resolve</button>{msg && <span className="mono text-[10px]">{msg}</span>}</div>;
}

export function PricingEditor({ cfg }: { cfg: PricingConfig }) {
  const router = useRouter();
  const [v, setV] = useState({ minOrder: cfg.minOrder / 100, feeFloor: cfg.feeFloor / 100, feePercent: cfg.feePercent * 100, coordinationFee: cfg.coordinationFee / 100, same_day: cfg.urgency.same_day, rush: cfg.urgency.rush, maxCircle: cfg.maxCircleDiscount * 100 });
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const draft: PricingConfig = { ...cfg, minOrder: v.minOrder * 100, feeFloor: v.feeFloor * 100, feePercent: v.feePercent / 100, coordinationFee: v.coordinationFee * 100, urgency: { normal: 1, same_day: v.same_day, rush: v.rush }, maxCircleDiscount: v.maxCircle / 100 };
  const sample = [{ slug: "a", name: "Cleaning", baseRate: 129900, unit: "home", minutesPerUnit: 240, sizeFactors: { small: 0.8, medium: 1, large: 1.4 } }, { slug: "b", name: "Groceries", baseRate: 17900, unit: "run", minutesPerUnit: 60, sizeFactors: { small: 0.8, medium: 1, large: 1.4 } }, { slug: "c", name: "Wardrobe", baseRate: 79900, unit: "w", minutesPerUnit: 120, sizeFactors: { small: 0.8, medium: 1, large: 1.4 } }].map((t) => ({ template: t, qty: 1, size: "medium" as const }));
  const live = quote({ lines: sample, config: cfg });
  const sim = quote({ lines: sample, config: draft });
  const field = (k: keyof typeof v, label: string, step = 1) => <label className="text-xs font-bold">{label}<input className="field !py-1" type="number" step={step} value={v[k]} onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })} /></label>;
  return (
    <div className="space-y-3 rounded-xl border border-ink/20 bg-cream p-3"><h2 className="display text-xl">Draft config (v{cfg.version + 1})</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{field("minOrder", "Minimum order ₹")}{field("feeFloor", "Fee floor ₹")}{field("feePercent", "Fee percent %", 0.5)}{field("coordinationFee", "Coordination ₹")}{field("same_day", "Same-day x", 0.05)}{field("rush", "Rush x", 0.05)}{field("maxCircle", "Max Circle %")}</div>
      <div className="mono rounded-lg bg-paper p-2 text-xs"><b>Simulator</b> (3-task sample plan): live {inr(live.total)} vs draft {inr(sim.total)} (platform fee {inr(sim.platformFee)}, coordination {inr(sim.coordinationFee)})</div>
      <input className="field" placeholder="Reason for this change (required, logged)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <button className="btn btn-sun btn-sm" disabled={reason.length < 3} onClick={async () => { const r = await call("/api/ops/pricing-config", "PUT", { reason, data: { minOrder: draft.minOrder, feeFloor: draft.feeFloor, feePercent: draft.feePercent, coordinationFee: draft.coordinationFee, urgency: draft.urgency, maxCircleDiscount: draft.maxCircleDiscount } }); setMsg(r.ok ? `Published v${r.data.version}` : r.error ?? "Error"); if (r.ok) router.refresh(); }}>Publish new version</button>{msg && <p className="text-sm font-semibold">{msg}</p>}</div>
  );
}

export function CreditForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [amt, setAmt] = useState("");
  const [reason, setReason] = useState("");
  return <span className="inline-flex gap-1"><input className="field !w-20 !py-1" placeholder="₹" value={amt} onChange={(e) => setAmt(e.target.value)} /><input className="field !w-32 !py-1" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} /><button className="btn btn-cream btn-sm" disabled={!amt || reason.length < 3} onClick={async () => { const r = await call(`/api/ops/customers/${userId}/credit`, "POST", { amount: Math.round(Number(amt) * 100), reason }); if (r.ok) router.refresh(); }}>Adjust</button></span>;
}

export function CatalogEdit({ slug, rate, active }: { slug: string; rate: number; active: boolean }) {
  const router = useRouter();
  const [r, setR] = useState(String(rate / 100));
  return <span className="inline-flex items-center gap-1"><input className="field !w-24 !py-1" value={r} onChange={(e) => setR(e.target.value)} aria-label="Base rate" /><button className="btn btn-cream btn-sm" onClick={async () => { const reason = prompt("Reason for the change?"); if (!reason) return; await call(`/api/ops/catalog/${slug}`, "POST", { baseRate: Math.round(Number(r) * 100), reason }); router.refresh(); }}>Save</button><button className="btn btn-ghost btn-sm" onClick={async () => { const reason = prompt("Reason?"); if (!reason) return; await call(`/api/ops/catalog/${slug}`, "POST", { active: !active, reason }); router.refresh(); }}>{active ? "Disable" : "Enable"}</button></span>;
}

export function FlagToggle({ k, on }: { k: string; on: boolean }) {
  const router = useRouter();
  return <button role="switch" aria-checked={on} className={`chip ${on ? "on" : ""}`} onClick={async () => { await call(`/api/ops/flags/${k}`, "POST", { enabled: !on }); router.refresh(); }}>{on ? "ON" : "OFF"}</button>;
}
