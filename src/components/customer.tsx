"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { post, useToast, compressImage, ActionButton } from "./client";
import { Icon } from "./icons";
import { Receipt, Stamp, EmptyState } from "./ui";
import { track } from "@/lib/analytics";
import { cn, fmtDateTime } from "@/lib/utils";
import { formatINR, formatRange, formatDuration } from "@/lib/pricing";

export function Onboarding({ towers, society, name }: { towers: { id: string; name: string; floors: number }[]; society: string; name: string }) {
  const router = useRouter(); const [f, setF] = useState({ name, towerId: towers[0]?.id ?? "", floor: "1", flat: "", landmark: "", entryNotes: "" }); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const tower = towers.find((t) => t.id === f.towerId);
  return (
    <div className="mx-auto max-w-lg px-5 py-10">
      <h1 className="text-3xl font-semibold text-tide">Welcome to Shell</h1><p className="mt-1 text-ink/70">Tell us where you live in {society}, so helpers can find you. It takes a minute.</p>
      <form className="card mt-6 space-y-4 p-5" onSubmit={async (e) => { e.preventDefault(); setErr(""); setBusy(true); try { await post("/api/me", { action: "onboard", ...f }); track("society_selected"); router.refresh(); } catch (er) { setErr((er as Error).message); setBusy(false); } }}>
        <div><label className="label" htmlFor="o-name">Your name</label><input id="o-name" className="input" value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="label" htmlFor="o-tower">Tower</label><select id="o-tower" className="input" value={f.towerId} onChange={(e) => set("towerId", e.target.value)}>{towers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div><label className="label" htmlFor="o-floor">Floor</label><select id="o-floor" className="input" value={f.floor} onChange={(e) => set("floor", e.target.value)}>{Array.from({ length: tower?.floors ?? 10 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></div></div>
        <div><label className="label" htmlFor="o-flat">Flat number</label><input id="o-flat" className="input" placeholder="For example C-904" value={f.flat} onChange={(e) => set("flat", e.target.value)} /></div>
        <div><label className="label" htmlFor="o-land">Landmark (optional)</label><input id="o-land" className="input" value={f.landmark} onChange={(e) => set("landmark", e.target.value)} placeholder="Near the garden, opposite lift 2" /></div>
        <div><label className="label" htmlFor="o-notes">Entry notes for the guard (optional)</label><input id="o-notes" className="input" value={f.entryNotes} onChange={(e) => set("entryNotes", e.target.value)} /></div>
        {err && <p role="alert" className="rounded-lg bg-[#f8dcd8] p-2 text-sm text-danger">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Continue"}</button>
        <p className="text-xs text-ink/50">Your address is used only to match and guide helpers. Residency is verified by our team.</p>
      </form>
    </div>
  );
}

const SUGGEST = ["House cleaning", "Groceries", "Wardrobe organising", "Party decoration", "Dishes", "Parcel pickup"];

export function Composer({ initialText = "", packSlug, full = false, placeholder = "What do you need done? For example: clean the house, buy groceries and organise my wardrobe." }: { initialText?: string; packSlug?: string; full?: boolean; placeholder?: string }) {
  const router = useRouter(); const { show, node } = useToast();
  const [text, setText] = useState(initialText); const [photos, setPhotos] = useState<string[]>([]); const [when, setWhen] = useState("asap"); const [at, setAt] = useState(""); const [urg, setUrg] = useState("normal");
  const [rec, setRec] = useState(false); const [busy, setBusy] = useState(false); const recRef = useRef<any>(null); const started = useRef(false);
  useEffect(() => { if (initialText) setText(initialText); }, [initialText]);
  const speech = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  const toggleVoice = () => {
    if (rec) { recRef.current?.stop(); return; }
    const R = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; const r = new R(); r.lang = "en-IN"; r.interimResults = true; r.continuous = true;
    r.onresult = (e: any) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setText(t); };
    r.onend = () => setRec(false); r.onerror = () => setRec(false); recRef.current = r; r.start(); setRec(true); setTimeout(() => r.stop(), 60000);
  };
  async function submit() {
    setBusy(true);
    try {
      let deadlineAt: string | null = null;
      if (when === "today") { const d = new Date(); d.setHours(20, 0, 0, 0); deadlineAt = d.toISOString(); } else if (when === "tomorrow") { const d = new Date(Date.now() + 864e5); d.setHours(18, 0, 0, 0); deadlineAt = d.toISOString(); } else if (when === "pick" && at) deadlineAt = new Date(at).toISOString();
      const urgency = when === "asap" && urg === "normal" ? "normal" : urg;
      const d = await post<{ id: string }>("/api/requests", { text, photos, deadlineAt, urgency, packSlug });
      track("request_submitted"); router.push(`/app/requests/${d.id}`);
    } catch (e) { show((e as Error).message, "err"); setBusy(false); }
  }
  return (
    <div className="card p-4 sm:p-5" onFocus={() => { if (!started.current) { started.current = true; track("composer_opened"); } }}>
      {packSlug && <p className="mb-3 rounded-lg bg-cream p-2 text-sm">Pack selected. We&apos;ll build your plan from it. Add any details below.</p>}
      <label htmlFor="tell" className="sr-only">What do you need done?</label>
      <textarea id="tell" rows={full ? 5 : 3} className="input resize-none !text-[1.05rem]" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} />
      {!full && <div className="mt-3 flex flex-wrap gap-2">{SUGGEST.map((s) => <button key={s} className="chip" onClick={() => setText((t) => (t ? t.replace(/[.\s]*$/, "") + ", " + s.toLowerCase() : s.toLowerCase()))}>{s}</button>)}</div>}
      {photos.length > 0 && <div className="mt-3 flex gap-2">{photos.map((p, i) => <div key={i} className="relative"><img src={p} alt={`Attached ${i + 1}`} className="h-16 w-16 rounded-lg object-cover" /><button aria-label="Remove photo" className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-tide text-xs text-cream" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>×</button></div>)}</div>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {speech && <button type="button" className={cn("chip", rec && "on")} onClick={toggleVoice} aria-pressed={rec}><Icon name="mic" size={18} />{rec ? "Listening… tap to stop" : "Speak"}</button>}
        <label className="chip cursor-pointer"><Icon name="camera" size={18} />Add photo<input type="file" accept="image/*" multiple className="sr-only" onChange={async (e) => { const fs = [...(e.target.files ?? [])].slice(0, 5 - photos.length); const out = await Promise.all(fs.map((f) => compressImage(f))); setPhotos([...photos, ...out]); }} /></label>
      </div>
      {full && (
        <div className="mt-5 space-y-4 border-t border-line pt-4">
          <div><div className="label">When do you need it?</div><div className="flex flex-wrap gap-2">{[["asap", "As soon as possible"], ["today", "Today evening"], ["tomorrow", "Tomorrow evening"], ["pick", "Pick a time"]].map(([v, l]) => <button key={v} className="chip" aria-pressed={when === v} onClick={() => setWhen(v)}>{l}</button>)}</div>
            {when === "pick" && <input type="datetime-local" className="input mt-2" value={at} onChange={(e) => setAt(e.target.value)} aria-label="Deadline" />}</div>
          <div><div className="label">How urgent?</div><div className="flex flex-wrap gap-2">{[["normal", "Planned"], ["same_day", "Same day (+20%)"], ["rush", "Rush, within 90 min (+50%)"]].map(([v, l]) => <button key={v} className="chip" aria-pressed={urg === v} onClick={() => setUrg(v)}>{l}</button>)}</div></div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" onClick={submit} disabled={busy || (!text.trim() && !photos.length && !packSlug)}>{busy ? "Sending…" : "Send to Shell"}</button>
        {!full && <Link href={`/app/new?text=${encodeURIComponent(text)}`} className="text-sm font-semibold text-euca underline">More options</Link>}
      </div>{node}
    </div>
  );
}

export function Clarify({ id, questions, answered }: { id: string; questions: { key: string; text: string; chips: { label: string; value: string }[] }[]; answered: Record<string, string> }) {
  const router = useRouter(); const { show, node } = useToast(); const [busy, setBusy] = useState(false);
  const idx = questions.findIndex((q) => !answered[q.key]); const q = questions[idx];
  if (!q) return <p>Building your plan…</p>;
  const answer = async (value: string) => {
    setBusy(true);
    try { const d = await post<{ done: boolean; planId?: string; status?: string }>(`/api/requests/${id}/answers`, { key: q.key, value }); track("question_answered"); if (d.done) router.replace(d.status === "sent" ? `/app/plans/${d.planId}` : `/app/requests/${id}`); else router.refresh(); }
    catch (e) { show((e as Error).message, "err"); } finally { setBusy(false); }
  };
  return (
    <div className="card p-5 slide-in" key={q.key}>
      <div className="mb-4 flex gap-1.5" aria-label={`Question ${idx + 1} of ${questions.length}`}>{questions.map((_, i) => <span key={i} className={cn("h-1.5 flex-1 rounded-full", i <= idx ? "bg-tide" : "bg-line")} />)}</div>
      <h2 className="text-2xl font-semibold text-tide">{q.text}</h2>
      <div className="mt-4 grid gap-2">{q.chips.map((c) => <button key={c.value} disabled={busy} className="chip !justify-start !py-3 !text-base" onClick={() => answer(c.value)}>{c.label}</button>)}</div>
      <button className="mt-4 text-sm font-semibold text-euca underline" disabled={busy} onClick={() => answer("skip")}>Skip. You decide.</button>{node}
    </div>
  );
}

type PlanTask = { id: string; title: string; icon: string; unit: string; quantity: number; duration: number; price: number; cap: number; isGrocery: boolean; helper?: { name: string; level: string; rating: number; jobs: number; why: string; others: string[] } | null; status: string };
export function PlanEditor({ plan, tasks, credits, wallet, addable, cfgPromoNote }: {
  plan: { id: string; urgency: string; promoCode: string | null; subtotal: number; platformFee: number; coordinationFee: number; minTopUp: number; travel: number; promoDiscount: number; total: number; circleDiscount: number; title: string; deadline: string | null };
  tasks: PlanTask[]; credits: number; wallet: number; addable: { slug: string; name: string }[]; cfgPromoNote: string;
}) {
  const router = useRouter(); const { show, node } = useToast(); const [busy, setBusy] = useState(false); const [promo, setPromo] = useState(plan.promoCode ?? ""); const [method, setMethod] = useState("upi");
  const [useCredits, setUseCredits] = useState(credits > 0); const [useWallet, setUseWallet] = useState(false); const [paid, setPaid] = useState(false); const key = useRef("");
  useEffect(() => { key.current = crypto.randomUUID(); track("plan_viewed"); }, []);
  const edit = async (b: Record<string, unknown>) => { setBusy(true); try { await post(`/api/plans/${plan.id}/edit`, b); track("plan_edited"); router.refresh(); } catch (e) { show((e as Error).message, "err"); } finally { setBusy(false); } };
  const holds = tasks.reduce((s, t) => s + t.cap, 0); const gross = plan.total + holds;
  const cr = useCredits ? Math.min(credits, gross) : 0; const wl = useWallet ? Math.min(wallet, gross - cr) : 0; const pay = gross - cr - wl;
  const lines = tasks.map((t) => ({ name: t.title, detail: `${t.quantity} ${t.unit}${t.quantity > 1 ? "s" : ""} · ${formatDuration(t.duration)}`, amount: formatRange(t.price) }));
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        {tasks.length === 0 && <EmptyState title="No tasks left." note="Add a task below or go back." />}
        {tasks.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream text-euca"><Icon name={t.icon} /></span>
              <div className="flex-1"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{t.title}</h3><span className="font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{formatRange(t.price)}</span></div>
                <p className="text-sm text-ink/60">{formatDuration(t.duration)} estimated</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1"><button className="chip !px-3" disabled={busy || t.quantity <= 1} aria-label={`Decrease ${t.title}`} onClick={() => edit({ quantities: { [t.id]: t.quantity - 1 } })}>−</button><span className="w-24 text-center text-sm">{t.quantity} {t.unit}{t.quantity > 1 ? "s" : ""}</span><button className="chip !px-3" disabled={busy || t.quantity >= 12} aria-label={`Increase ${t.title}`} onClick={() => edit({ quantities: { [t.id]: t.quantity + 1 } })}>+</button></span>
                  <button className="text-sm text-danger underline" disabled={busy} onClick={() => edit({ remove: [t.id] })}>Remove</button></div>
                {t.isGrocery && <div className="mt-3"><div className="label">Spending cap for the helper</div><div className="flex flex-wrap gap-2">{[0, 100000, 250000, 500000].map((c) => <button key={c} className="chip" aria-pressed={t.cap === c} onClick={() => edit({ caps: { [t.id]: c } })}>{c ? formatINR(c) : "No purchases"}</button>)}</div><p className="mt-1 text-xs text-ink/50">Held separately. Whatever isn&apos;t spent is refunded.</p></div>}
                {t.helper ? <div className="mt-3 rounded-xl bg-bone p-3 text-sm"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-tide text-xs font-bold text-cream">{t.helper.name[0]}</span><strong>{t.helper.name.split(" ")[0]}</strong><span className="pill">{t.helper.level}</span><span className="text-ink/60">★ {t.helper.rating ? t.helper.rating.toFixed(1) : "New"} · {t.helper.jobs} jobs</span></div><p className="mt-1 text-ink/70">Why we picked {t.helper.name.split(" ")[0]}: {t.helper.why}</p>{t.helper.others.length > 0 && <p className="mt-1 text-xs text-ink/50">Also available: {t.helper.others.join(", ")}</p>}</div>
                  : <p className="mt-3 text-xs text-ink/50">We&apos;ll assign a verified helper once you approve.</p>}
              </div></div>
          </div>
        ))}
        {addable.length > 0 && <div><div className="label">Add another task</div><div className="flex flex-wrap gap-2">{addable.map((a) => <button key={a.slug} className="chip" disabled={busy} onClick={() => edit({ addSlugs: [a.slug] })}><Icon name="plus" size={16} />{a.name}</button>)}</div></div>}
        <div><div className="label">How urgent?</div><div className="flex flex-wrap gap-2">{[["normal", "Planned"], ["same_day", "Same day (+20%)"], ["rush", "Rush (+50%)"]].map(([v, l]) => <button key={v} className="chip" aria-pressed={plan.urgency === v} disabled={busy} onClick={() => edit({ urgency: v })}>{l}</button>)}</div></div>
        <div><label className="label" htmlFor="promo">Promo code</label><div className="flex gap-2"><input id="promo" className="input" value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder="WELCOME100" /><button className="btn btn-ghost" disabled={busy} onClick={() => edit({ promo })}>Apply</button></div><p className="mt-1 text-xs text-ink/50">{cfgPromoNote}</p></div>
        <Link href={`/app/circles?plan=${plan.id}`} className="block rounded-2xl border border-dashed border-euca/50 p-4 text-sm hover:bg-cream"><strong>Save money with neighbours.</strong> Start a Shell Circle for your tower and the price drops as more flats join.</Link>
      </div>
      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="relative">
          <Receipt title={plan.title} subtitle={plan.deadline ? `Needed by ${fmtDateTime(plan.deadline)}` : "Estimate. Locked when you approve."} lines={lines}
            fees={[{ label: "Platform fee", amount: formatINR(plan.platformFee) }, ...(plan.coordinationFee ? [{ label: "Coordination fee", amount: formatINR(plan.coordinationFee) }] : []), ...(plan.minTopUp ? [{ label: "Minimum order top-up", amount: formatINR(plan.minTopUp) }] : []), ...(plan.circleDiscount ? [{ label: `Circle discount applied (${Math.round(plan.circleDiscount * 100)}%)`, amount: "included", muted: true }] : []), ...(plan.promoDiscount ? [{ label: `Promo ${plan.promoCode}`, amount: "−" + formatINR(plan.promoDiscount) }] : []), ...(holds ? [{ label: "Expense cap (refundable)", amount: formatINR(holds), muted: true }] : [])]}
            total={formatRange(plan.total + holds)} totalLabel="Estimated total" status={paid ? "PAID" : undefined} footer={<>Includes Shell Guarantee: free rework within 24 hours and damage cover.</>} />
        </div>
        <div className="card space-y-3 p-4">
          <div className="label">Pay with</div>
          <div className="grid grid-cols-2 gap-2">{[["upi", "UPI"], ["card", "Card"], ["netbanking", "Net banking"], ["wallet", "Shell Wallet"]].map(([v, l]) => <button key={v} className="chip !justify-center" aria-pressed={method === v} onClick={() => setMethod(v)}>{l}</button>)}</div>
          {credits > 0 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={useCredits} onChange={(e) => setUseCredits(e.target.checked)} />Use credits ({formatINR(credits)} available)</label>}
          {wallet > 0 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} />Use wallet ({formatINR(wallet)} available)</label>}
          <div className="flex items-baseline justify-between border-t border-line pt-3"><span className="text-sm text-ink/60">You pay now (up to)</span><strong className="serif text-2xl">{formatINR(Math.round(pay * 1.0))}</strong></div>
          <p className="text-xs text-ink/50">Your money is held by Shell and released to the helper only after you approve the work. Free cancellation until the helper is on the way.</p>
          <button className="btn btn-sun w-full" disabled={busy || !tasks.length || paid} onClick={async () => { setBusy(true); track("checkout_started"); try { await post(`/api/plans/${plan.id}/checkout`, { method, useCredits, useWallet, promo: promo || null, idempotencyKey: key.current }); setPaid(true); navigator.vibrate?.(60); track("payment_success"); setTimeout(() => router.refresh(), 1400); } catch (e) { show((e as Error).message, "err"); setBusy(false); } }}>{paid ? "Paid. Opening…" : busy ? "Please wait…" : "Approve and pay"}</button>
          <Link href={`/app/support?plan=${plan.id}`} className="block text-center text-sm font-semibold underline">Ask for a change</Link>
        </div>{node}
      </div>
    </div>
  );
}

export function CircleCard({ c, joined, mine }: { c: { id: string; title: string; current: number; min: number; max: number; status: string; when: string; discount: number }; joined: boolean; mine: boolean }) {
  const pct = Math.min(100, (c.current / c.max) * 100);
  const link = `/app/circles?join=${c.id}`;
  return (
    <div className="card p-4"><div className="flex items-start justify-between"><div><h3 className="font-semibold">{c.title}</h3><p className="text-sm text-ink/60">{c.when}</p></div><span className={cn("pill", c.status === "confirmed" || c.status === "full" ? "" : "pill-warn")}>{c.status === "filling" || c.status === "open" ? "Filling" : c.status === "confirmed" ? "Confirmed" : c.status}</span></div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-euca transition-all" style={{ width: `${pct}%` }} /></div>
      <p className="mt-2 text-sm"><strong>{c.current} of {c.max}</strong> flats joined · needs {c.min} to confirm · <strong>{Math.round(c.discount * 100)}% off</strong> right now</p>
      <div className="mt-3 flex flex-wrap gap-2">{!joined && !["cancelled", "full"].includes(c.status) && <ActionButton url={`/api/circles/${c.id}/join`} className="btn btn-primary btn-sm" success="You're in the Circle">Join this Circle</ActionButton>}{joined && <Stamp>{mine ? "YOURS" : "JOINED"}</Stamp>}
        <a className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`Join our tower's Shell Circle: ${c.title}. The more flats join, the cheaper it gets. ${typeof window !== "undefined" ? location.origin : ""}${link}`)}`}>Invite a neighbour</a></div></div>
  );
}

export function CircleCreate() {
  const router = useRouter(); const { show, node } = useToast(); const [f, setF] = useState({ category: "house-cleaning", start: "", minFlats: 3, maxFlats: 6 }); const [busy, setBusy] = useState(false);
  return (
    <form className="card space-y-3 p-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { await post("/api/circles", { ...f, start: new Date(f.start).toISOString() }); track("circle_created"); router.refresh(); } catch (er) { show((er as Error).message, "err"); } finally { setBusy(false); } }}>
      <h3 className="font-semibold">Start a Circle for your tower</h3>
      <div><label className="label" htmlFor="c-cat">Service</label><select id="c-cat" className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}><option value="house-cleaning">House cleaning</option><option value="utensils">Utensils</option><option value="wardrobe-organising">Wardrobe organising</option><option value="pet-walking">Pet walking</option></select></div>
      <div><label className="label" htmlFor="c-when">Start time</label><input id="c-when" type="datetime-local" required className="input" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3"><div><label className="label" htmlFor="c-min">Minimum flats</label><input id="c-min" type="number" min={2} max={10} className="input" value={f.minFlats} onChange={(e) => setF({ ...f, minFlats: +e.target.value })} /></div><div><label className="label" htmlFor="c-max">Maximum flats</label><input id="c-max" type="number" min={2} max={12} className="input" value={f.maxFlats} onChange={(e) => setF({ ...f, maxFlats: +e.target.value })} /></div></div>
      <p className="text-xs text-ink/60">Price drops from 0% with one flat to about 18% with six. If the minimum isn&apos;t met by the cutoff, everyone is refunded automatically.</p>
      <button className="btn btn-primary w-full" disabled={busy}>Create Circle</button>{node}
    </form>
  );
}

export function AtlasForm({ atlas, pref, trusted, name, email }: { atlas: any; pref: string; trusted: { name: string; phone: string } | null; name: string; email: string | null }) {
  const { show, node } = useToast(); const router = useRouter();
  const [a, setA] = useState({ household: atlas.household ?? 2, kids: !!atlas.kids, pets: atlas.pets ?? "", allergies: atlas.allergies ?? "", keyHandling: atlas.keyHandling ?? "home", doNotTouch: atlas.doNotTouch ?? "", rooms: (atlas.rooms ?? []) as string[] });
  const [female, setFemale] = useState(pref === "female"); const [tc, setTc] = useState(trusted ?? { name: "", phone: "" }); const [nm, setNm] = useState(name); const [em, setEm] = useState(email ?? "");
  const rooms = ["Living room", "Kitchen", "Bedroom", "Balcony", "Wardrobe", "Bathroom", "Study"];
  const save = async (b: Record<string, unknown>, msg: string) => { try { await post("/api/me", b); show(msg); router.refresh(); } catch (e) { show((e as Error).message, "err"); } };
  return (
    <div className="space-y-6">
      <section className="card space-y-3 p-5"><h2 className="text-lg font-semibold">Profile</h2><div className="grid gap-3 sm:grid-cols-2"><div><label className="label" htmlFor="p-n">Name</label><input id="p-n" className="input" value={nm} onChange={(e) => setNm(e.target.value)} /></div><div><label className="label" htmlFor="p-e">Email (optional)</label><input id="p-e" className="input" value={em} onChange={(e) => setEm(e.target.value)} /></div></div><button className="btn btn-ghost btn-sm" onClick={() => save({ action: "profile", name: nm, email: em }, "Profile saved")}>Save profile</button></section>
      <section className="card space-y-4 p-5"><div><h2 className="text-lg font-semibold">Home Atlas</h2><p className="text-sm text-ink/60">Helpers see only what they need for their task.</p></div>
        <div><div className="label">Rooms</div><div className="flex flex-wrap gap-2">{rooms.map((r) => <button key={r} className="chip" aria-pressed={a.rooms.includes(r)} onClick={() => setA({ ...a, rooms: a.rooms.includes(r) ? a.rooms.filter((x) => x !== r) : [...a.rooms, r] })}>{r}</button>)}</div></div>
        <div className="grid gap-3 sm:grid-cols-2"><div><label className="label" htmlFor="a-pets">Pets</label><input id="a-pets" className="input" value={a.pets} placeholder="For example: Labrador, friendly" onChange={(e) => setA({ ...a, pets: e.target.value })} /></div><div><label className="label" htmlFor="a-all">Cleaning product allergies</label><input id="a-all" className="input" value={a.allergies} onChange={(e) => setA({ ...a, allergies: e.target.value })} /></div></div>
        <div><div className="label">How do helpers get in?</div><div className="flex flex-wrap gap-2">{[["home", "I'll be home"], ["guard", "Guard holds the key"], ["lockbox", "Lockbox with a code"]].map(([v, l]) => <button key={v} className="chip" aria-pressed={a.keyHandling === v} onClick={() => setA({ ...a, keyHandling: v })}>{l}</button>)}</div></div>
        <div><label className="label" htmlFor="a-dnt">Do-not-touch list</label><textarea id="a-dnt" rows={2} className="input" value={a.doNotTouch} onChange={(e) => setA({ ...a, doNotTouch: e.target.value })} placeholder="For example: study desk, bedroom locker" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={female} onChange={(e) => setFemale(e.target.checked)} />Match me with female helpers only</label>
        <button className="btn btn-primary btn-sm" onClick={() => save({ action: "atlas", atlas: a, helperGenderPreference: female ? "female" : "any", helperGenderPref: female ? "female" : "any" }, "Home Atlas saved")}>Save Home Atlas</button></section>
      <section className="card space-y-3 p-5"><h2 className="text-lg font-semibold">Trusted contact</h2><p className="text-sm text-ink/60">Gets a live link if you raise an SOS.</p><div className="grid gap-3 sm:grid-cols-2"><input className="input" placeholder="Name" aria-label="Trusted contact name" value={tc.name} onChange={(e) => setTc({ ...tc, name: e.target.value })} /><input className="input" placeholder="Phone" aria-label="Trusted contact phone" value={tc.phone} onChange={(e) => setTc({ ...tc, phone: e.target.value })} /></div><button className="btn btn-ghost btn-sm" onClick={() => save({ action: "trusted", ...tc }, "Trusted contact saved")}>Save contact</button></section>
      {node}
    </div>
  );
}
void useMemo;
