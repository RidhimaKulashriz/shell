"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CATALOG } from "@/lib/catalog";
import { computePlan, circleDiscount, formatINR, formatRange, formatDuration, DEFAULT_PRICING, type Urgency, type Size } from "@/lib/pricing";
import { Icon } from "./icons";
import { Receipt } from "./ui";
import { post } from "./client";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function Estimator() {
  const [sel, setSel] = useState<Record<string, number>>({ "house-cleaning": 3 });
  const [size, setSize] = useState<Size>("medium");
  const [urg, setUrg] = useState<Urgency>("normal");
  const [circle, setCircle] = useState(1);
  const toggle = (slug: string, def: number) => { track("estimator_used"); setSel((p) => { const n = { ...p }; if (n[slug]) delete n[slug]; else n[slug] = def; return n; }); };
  const plan = useMemo(() => computePlan({ urgency: urg, circleJoiners: circle, lines: Object.entries(sel).map(([slug, q]) => { const c = CATALOG.find((x) => x.slug === slug)!; return { slug, name: c.name, kind: c.kind, rate: c.rate * 100, mins: c.mins, quantity: q, size }; }) }), [sel, size, urg, circle]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-8">
        <section><h3 className="text-xl font-semibold">1. Pick your tasks</h3>
          <div className="mt-3 flex flex-wrap gap-2">{CATALOG.map((c) => <button key={c.slug} className="chip" aria-pressed={!!sel[c.slug]} onClick={() => toggle(c.slug, c.qty)}><Icon name={c.icon} size={18} />{c.name}</button>)}</div></section>
        <section><h3 className="text-xl font-semibold">2. Size and quantity</h3>
          <div className="mt-3 space-y-2">
            {Object.keys(sel).length === 0 && <p className="text-sm text-ink/60">Pick at least one task above.</p>}
            {Object.entries(sel).map(([slug, q]) => { const c = CATALOG.find((x) => x.slug === slug)!; return (
              <div key={slug} className="card flex items-center justify-between gap-3 p-3"><span className="font-medium">{c.name}<span className="block text-xs text-ink/50">per {c.unit}</span></span>
                <span className="flex items-center gap-2"><button className="chip !px-3" aria-label={`Less ${c.name}`} onClick={() => setSel((p) => ({ ...p, [slug]: Math.max(1, q - 1) }))}>−</button><strong className="w-6 text-center">{q}</strong><button className="chip !px-3" aria-label={`More ${c.name}`} onClick={() => setSel((p) => ({ ...p, [slug]: Math.min(12, q + 1) }))}>+</button></span></div>); })}
            <div className="flex gap-2 pt-1" role="group" aria-label="Home size">{(["small", "medium", "large"] as Size[]).map((s) => <button key={s} className="chip capitalize" aria-pressed={size === s} onClick={() => setSize(s)}>{s}</button>)}</div>
          </div></section>
        <section><h3 className="text-xl font-semibold">3. When do you need it?</h3>
          <div className="mt-3 flex flex-wrap gap-2">{([["normal", "Planned (normal price)"], ["same_day", "Same day (+20%)"], ["rush", "Rush in 90 minutes (+50%)"]] as [Urgency, string][]).map(([k, l]) => <button key={k} className="chip" aria-pressed={urg === k} onClick={() => setUrg(k)}>{l}</button>)}</div></section>
        <section><h3 className="text-xl font-semibold">4. Join a Shell Circle (optional)</h3>
          <p className="text-sm text-ink/60">Neighbours in your tower book the same slot. More flats means a lower price for everyone.</p>
          <input type="range" min={1} max={6} value={circle} onChange={(e) => setCircle(+e.target.value)} className="mt-3 w-full accent-[#235347]" aria-label="Flats in the circle" />
          <div className="flex justify-between text-xs text-ink/60"><span>{circle} flat{circle > 1 ? "s" : ""}</span><span>{Math.round(circleDiscount(circle) * 100)}% off</span></div></section>
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start">
        {plan.lines.length ? (
          <Receipt title="Your estimate" subtitle="Final price is locked when you approve a plan." animate={false}
            lines={plan.lines.map((l) => ({ name: l.name, detail: `${l.quantity} × ${CATALOG.find((c) => c.slug === l.slug)!.unit} · ${formatDuration(l.durationMin)}`, amount: formatRange(l.price) }))}
            fees={[{ label: "Platform fee", amount: formatINR(plan.platformFee) }, ...(plan.coordinationFee ? [{ label: "Coordination fee (3+ tasks)", amount: formatINR(plan.coordinationFee) }] : []), ...(plan.minTopUp ? [{ label: "Minimum order top-up", amount: formatINR(plan.minTopUp) }] : []), { label: "Travel inside your society", amount: "₹0", muted: true }]}
            total={formatRange(plan.total)} totalLabel="Estimated total" footer={<>Estimated time: {formatDuration(plan.durationMin)}. Minimum order {formatINR(DEFAULT_PRICING.minOrder)}. Includes Shell Guarantee.</>} />
        ) : <div className="card p-6 text-sm text-ink/60">Your estimate will appear here.</div>}
        <Link href={`/waitlist?need=${encodeURIComponent(plan.lines.map((l) => l.name).join(", "))}`} className="btn btn-primary mt-4 w-full">Join the waitlist with this plan</Link>
      </div>
    </div>
  );
}

export function PackCustomizer({ items, packSlug }: { items: { slug: string; quantity: number; offsetHours: number; note: string }[]; packSlug: string }) {
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(items.map((i) => [i.slug, true])));
  const picks = items.filter((i) => on[i.slug]);
  const plan = computePlan({ lines: picks.map((i) => { const c = CATALOG.find((x) => x.slug === i.slug)!; return { slug: i.slug, name: c.name, kind: c.kind, rate: c.rate * 100, mins: c.mins, quantity: i.quantity, size: "medium" as Size }; }) });
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <div><h3 className="text-xl font-semibold">Customise this pack</h3><p className="mb-3 text-sm text-ink/60">Switch tasks on or off and watch the receipt update.</p>
        <div className="space-y-2">{items.map((i) => <label key={i.slug} className="card flex cursor-pointer items-center gap-3 p-3"><input type="checkbox" className="h-5 w-5 accent-[#235347]" checked={!!on[i.slug]} onChange={() => setOn((p) => ({ ...p, [i.slug]: !p[i.slug] }))} /><span className="flex-1"><strong>{CATALOG.find((c) => c.slug === i.slug)!.name}</strong><span className="block text-xs text-ink/60">{i.note}</span></span></label>)}</div></div>
      <div>
        {plan.lines.length ? <Receipt title="Your pack" lines={plan.lines.map((l) => ({ name: l.name, detail: formatDuration(l.durationMin), amount: formatRange(l.price) }))} fees={[{ label: "Platform fee", amount: formatINR(plan.platformFee) }, ...(plan.coordinationFee ? [{ label: "Coordination fee", amount: formatINR(plan.coordinationFee) }] : [])]} total={formatRange(plan.total)} totalLabel="Estimated total" /> : <p className="text-sm">Select at least one task.</p>}
        <Link href={`/app/new?pack=${packSlug}`} className="btn btn-primary mt-4 w-full">Order this pack</Link>
      </div>
    </div>
  );
}

export function ContactForm({ kind, fields, cta = "Send", success = "Thanks. We'll get back to you within one working day." }: { kind: string; fields: { name: string; label: string; type?: string; required?: boolean; options?: string[] }[]; cta?: string; success?: string }) {
  const [v, setV] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "busy" | "done">("idle"); const [err, setErr] = useState("");
  if (state === "done") return <div className="card p-6"><p className="serif text-xl font-semibold">Got it.</p><p className="mt-1 text-ink/70">{success}</p></div>;
  return (
    <form className="card space-y-3 p-5" onFocus={() => track("form_start", { form: kind })} onSubmit={async (e) => {
      e.preventDefault(); setErr(""); setState("busy");
      const { name = "", email = "", phone = "", message = "", ...meta } = v;
      try { await post("/api/contact", { kind, name, email, phone, message, meta }); setState("done"); track("form_submit", { form: kind }); } catch (er) { setErr((er as Error).message); setState("idle"); track("form_error", { form: kind }); }
    }}>
      {fields.map((f) => <div key={f.name}><label className="label" htmlFor={`f-${f.name}`}>{f.label}</label>
        {f.type === "textarea" ? <textarea id={`f-${f.name}`} rows={4} className="input" required={f.required} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} />
          : f.options ? <select id={`f-${f.name}`} className="input" required={f.required} onChange={(e) => setV({ ...v, [f.name]: e.target.value })}><option value="">Select</option>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
          : <input id={`f-${f.name}`} type={f.type ?? "text"} className="input" required={f.required} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} />}</div>)}
      {err && <p role="alert" className="rounded-lg bg-[#f8dcd8] p-2 text-sm text-danger">{err}</p>}
      <button className="btn btn-primary w-full" disabled={state === "busy"}>{state === "busy" ? "Sending…" : cta}</button>
    </form>
  );
}

export function HelpSearch({ items }: { items: { cat: string; q: string; a: string }[] }) {
  const [q, setQ] = useState(""); const [voted, setVoted] = useState<Record<string, string>>({});
  const res = items.filter((i) => (i.q + i.a).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="relative"><Icon name="search" className="absolute left-3 top-3 text-ink/40" /><input className="input !pl-11" placeholder="Search help articles" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search help" /></div>
      {["Customers", "Helpers"].map((cat) => { const list = res.filter((i) => i.cat === cat); return list.length ? (
        <section key={cat} className="mt-8"><h2 className="text-2xl font-semibold">{cat}</h2>
          <div className="mt-3 divide-y divide-line border-y border-line">{list.map((i) => <details key={i.q} className="py-3"><summary className="flex justify-between font-semibold">{i.q}<span className="plus text-xl text-euca transition-transform">+</span></summary><p className="mt-2 text-ink/75">{i.a}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-ink/60">Was this helpful? {voted[i.q] ? <span>Thanks for the feedback.</span> : ["Yes", "No"].map((b) => <button key={b} className="chip !min-h-0 !py-0.5" onClick={() => setVoted({ ...voted, [i.q]: b })}>{b}</button>)}</div></details>)}</div></section>) : null; })}
      {res.length === 0 && <p className="mt-6 text-ink/60">No articles match. <Link href="/contact" className="font-semibold underline">Contact us</Link> and a person will help.</p>}
    </div>
  );
}
export const cx = cn;
