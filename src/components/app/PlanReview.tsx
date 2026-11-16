"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HelperCard, type HelperCardData } from "@/components/app/HelperCard";
import { Ring, Receipt, Stamp, Countdown } from "@/components/ui";
import { inr, minutesToText, fmtDateTime } from "@/lib/format";
import { send } from "@/lib/offline";
import { track } from "@/lib/analytics";

type Line = { id: string; name: string; qty: number; size: string; minutes: number; price: number; start: string | null; checklist: string[]; unit: string; helper: (HelperCardData & { why?: string }) | null };
type P = { id: string; title: string; urgency: string; urgencyMultiplier: number; circleDiscount: number; subtotal: number; platformFee: number; coordinationFee: number; travel: number; total: number; deadlineAt: string | null; status: string; expiresAt: string | null };

export function PlanReview({ plan, lines, credits }: { plan: P; lines: Line[]; credits: number }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "timeline">("list");
  const [pay, setPay] = useState(false);
  const [useCredits, setUseCredits] = useState(true);
  const [promo, setPromo] = useState("");
  const [method, setMethod] = useState("upi");
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);
  const [err, setErr] = useState("");
  const [chat, setChat] = useState(false);
  const [msg, setMsg] = useState("");
  const [sentMsg, setSentMsg] = useState(false);
  const [key] = useState(() => "k" + Math.random().toString(36).slice(2) + Date.now());
  track("plan_viewed");

  const patch = async (body: unknown) => { const r = await send(`/api/plans/${plan.id}`, body, "PATCH"); if (r.ok) { track("plan_edited"); router.refresh(); } };
  const doPay = async () => {
    setBusy(true); setErr("");
    track("checkout_started");
    const o = await send("/api/checkout/orders", { planId: plan.id, useCredits, promo: promo || undefined, idempotencyKey: key });
    if (!o.ok || !o.data) { setErr(o.error ?? "Could not create the order"); setBusy(false); return; }
    const v = await send("/api/checkout/verify", { orderId: o.data.orderId, mock: true, method });
    if (!v.ok) { setErr(v.error ?? "Payment did not go through. Your plan is saved. Please try again."); setBusy(false); return; }
    track("payment_success"); track("plan_approved");
    if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
    setPaid(true); setBusy(false);
    setTimeout(() => router.push(`/app/orders/${plan.id}`), 2600);
  };
  const askChange = async () => { await send(`/api/threads/${encodeURIComponent("plan:" + plan.id)}/messages`, { body: msg }); setSentMsg(true); setMsg(""); };
  const creditUse = useCredits ? Math.min(credits, plan.total) : 0;
  const rows = lines.map((l) => ({ name: l.name, qty: l.qty > 1 ? String(l.qty) : undefined, price: inr(l.price), sub: `${minutesToText(l.minutes)}${l.helper ? " · " + l.helper.name.split(" ")[0] : ""}` }));
  const fees = [
    ...(plan.urgencyMultiplier !== 1 ? [{ name: `Urgency x${plan.urgencyMultiplier}`, price: "+" + inr(Math.round(plan.subtotal * (plan.urgencyMultiplier - 1))) }] : []),
    ...(plan.circleDiscount ? [{ name: `Circle discount ${Math.round(plan.circleDiscount * 100)}%`, price: "-" + inr(Math.round(plan.subtotal * plan.urgencyMultiplier * plan.circleDiscount)) }] : []),
    { name: "Platform fee", price: inr(plan.platformFee) },
    ...(plan.coordinationFee ? [{ name: "Coordination fee", price: inr(plan.coordinationFee) }] : []),
  ];
  const finish = lines.length ? new Date(Math.max(...lines.map((l) => (l.start ? new Date(l.start).getTime() + l.minutes * 60000 : 0)), Date.now())) : null;

  if (paid) return (
    <div className="grid min-h-[70vh] place-items-center text-center"><div><Stamp label="PAID" tone="brick" large rot={-10} /><p className="hand mt-6 text-3xl">Payment received. You can relax now.</p>
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>{Array.from({ length: 30 }, (_, i) => <span key={i} className="absolute top-0 block h-3 w-2" style={{ left: `${(i * 37) % 100}%`, background: ["#E8C48A", "#8EB69B", "#F2C318", "#235347"][i % 4], animation: `fall ${2 + (i % 5) * 0.3}s ${(i % 6) * 0.1}s ease-in forwards` }} />)}<style>{`@keyframes fall{to{transform:translateY(105vh) rotate(500deg)}}`}</style></div></div></div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4"><Ring pct={0} size={96} label="Home Ready" /><div><h1 className="display text-3xl">{plan.title}</h1>{plan.deadlineAt && <p className="mono text-sm">Deadline {fmtDateTime(plan.deadlineAt)} (<Countdown to={plan.deadlineAt} />)</p>}{finish && <p className="mono text-xs opacity-70">Estimated finish {fmtDateTime(finish)}</p>}</div></div>
      <div className="flex gap-2" role="tablist"><button role="tab" aria-selected={view === "list"} className="chip" aria-pressed={view === "list"} onClick={() => setView("list")}>Receipt</button><button role="tab" aria-selected={view === "timeline"} className="chip" aria-pressed={view === "timeline"} onClick={() => setView("timeline")}>Timeline</button>
        <span className="ml-auto flex gap-1">{(["normal", "same_day", "rush"] as const).map((u) => <button key={u} className="chip !px-3" aria-pressed={plan.urgency === u} onClick={() => patch({ urgency: u })}>{u === "normal" ? "Normal" : u === "same_day" ? "Same-day" : "Rush"}</button>)}</span></div>
      {view === "list" ? <Receipt title="Shell Receipt" meta="Per-task price, exact after approval" lines={rows} fees={fees} total={inr(plan.total)} footer={<span className="sticker !text-[11px]">Includes Shell Guarantee</span>} animate={false} /> : (
        <ol className="space-y-3 border-l border-dashed border-ink/40 pl-5">{[...lines].sort((a, b) => (a.start ?? "").localeCompare(b.start ?? "")).map((l) => <li key={l.id} className="relative rounded-xl bg-paper p-3"><span className="absolute -left-[27px] top-4 h-3 w-3 rounded-full border border-ink/20 bg-sun" /><div className="mono text-xs">{l.start ? fmtDateTime(l.start) : "Time to be fixed"} · {minutesToText(l.minutes)}</div><b>{l.name}</b><div className="mono text-xs opacity-60">+5 min travel buffer inside society</div></li>)}</ol>
      )}
      <section className="space-y-3"><h2 className="display text-2xl">Tasks and helper</h2>
        {lines.map((l) => (
          <div key={l.id} className="rounded-2xl border border-ink/20 bg-cream p-3">
            <button className="flex w-full items-center justify-between text-left font-bold" aria-expanded={open === l.id} onClick={() => setOpen(open === l.id ? null : l.id)}><span>{l.name}{l.qty > 1 && ` x${l.qty}`}</span><span className="mono">{inr(l.price)}</span></button>
            {open === l.id && <div className="mt-3 space-y-3 text-sm"><div><b>Included</b><ul className="mt-1 list-disc pl-5">{l.checklist.map((c) => <li key={c}>{c}</li>)}</ul></div><div className="flex flex-wrap gap-2"><button className="btn btn-ghost btn-sm" onClick={() => { if (confirm("Remove this task from the plan?")) patch({ removeTaskId: l.id }); }}>Hata do</button><button className="btn btn-ghost btn-sm" onClick={() => setChat(true)}>Time badlo</button></div></div>}
            {l.helper ? <div className="mt-3"><HelperCard h={l.helper} compact={open !== l.id} /></div> : <p className="mt-2 text-sm opacity-70">A helper is assigned after payment.</p>}
          </div>
        ))}
      </section>
      {chat && <div className="rounded-2xl border border-ink/20 bg-paper p-3"><label htmlFor="ch" className="font-bold">Tell ops what to change</label><textarea id="ch" className="field mt-1" value={msg} onChange={(e) => setMsg(e.target.value)} />{sentMsg ? <p className="mt-2 text-sm font-semibold">Sent. A person will review it.</p> : <button className="btn btn-forest btn-sm mt-2" disabled={!msg} onClick={askChange}>Bhejo</button>}</div>}
      {plan.expiresAt && <p className="mono text-xs opacity-60">Draft held until {fmtDateTime(plan.expiresAt)} (48 hours).</p>}
      {!pay ? (
        <div className="sticky bottom-24 flex gap-2"><button className="btn btn-sun flex-1" onClick={() => setPay(true)}>Approve and pay {inr(plan.total)}</button><button className="btn btn-cream" onClick={() => setChat(true)}>Ask a change</button></div>
      ) : (
        <div className="rounded-2xl border border-ink/20 bg-paper p-4 shadow-[0_22px_44px_-30px_rgba(5,31,32,0.6)]">
          <h2 className="display text-2xl">Payment</h2>
          {credits > 0 && <label className="mt-3 flex items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={useCredits} onChange={(e) => setUseCredits(e.target.checked)} />Shell Credits lagao ({inr(credits)} available)</label>}
          <div className="mt-3 flex gap-2"><input className="field" placeholder="Promo code (WELCOME10)" value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} aria-label="Promo code" /></div>
          <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment method">{[["upi", "UPI"], ["card", "Card"], ["netbanking", "Netbanking"], ["wallet", "Shell Wallet"]].map(([v, l]) => <button key={v} role="radio" aria-checked={method === v} className={`rounded-xl border border-ink/20 p-3 font-bold ${method === v ? "bg-forest text-cream" : "bg-cream"}`} onClick={() => setMethod(v)}>{l}</button>)}</div>
          <div className="receipt-line mono mt-3"><span>To pay</span><span className="leader" /><b>{inr(plan.total - creditUse)}</b></div>
          <p className="mt-2 text-xs">Cancel free until a helper is assigned. Payment is held until you approve each job. <a className="underline" href="/legal/refund-cancellation">Policy</a>. Demo mode: no real money moves.</p>
          {err && <p role="alert" className="mt-2 font-semibold text-brick">{err}</p>}
          <button className="btn btn-sun mt-3 w-full" disabled={busy} onClick={doPay}>{busy ? "One moment..." : "Pay now"}</button>
        </div>
      )}
    </div>
  );
}
