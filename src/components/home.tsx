"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATALOG, DEMO_TEXT } from "@/lib/catalog";
import { draftFromText } from "@/lib/engine";
import { computePlan, formatINR, formatRange, formatDuration, DEFAULT_PRICING, type Size } from "@/lib/pricing";
import { Icon } from "./icons";
import { Receipt, ReadinessRing, Meter, SocietyMap, HexMap } from "./ui";
import { post } from "./client";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const demoCatalog = CATALOG.map((c) => c);

export function priceText(text: string) {
  const { lines, banned } = draftFromText(text, demoCatalog);
  if (banned) return { banned, lines: [], plan: null };
  const plan = computePlan({
    lines: lines.map((l) => { const c = demoCatalog.find((x) => x.slug === l.slug)!; return { slug: c.slug, name: c.name, kind: c.kind, rate: c.rate * 100, mins: c.mins, quantity: l.quantity, size: "medium" as Size }; }),
  });
  return { banned: null, lines, plan };
}

export function ComposerDemo() {
  const [tab, setTab] = useState<"text" | "voice" | "photo">("text");
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(true);
  const [debounced, setDebounced] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!typing) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setText(DEMO_TEXT); setTyping(false); return; }
    let i = 0;
    const id = setInterval(() => { i++; setText(DEMO_TEXT.slice(0, i)); if (i >= DEMO_TEXT.length) { clearInterval(id); setTyping(false); } }, 35);
    return () => clearInterval(id);
  }, [typing]);
  useEffect(() => { const t = setTimeout(() => setDebounced(text), 300); return () => clearTimeout(t); }, [text]);
  const res = useMemo(() => priceText(debounced), [debounced]);
  const key = res.lines.map((l) => l.slug).join("|");
  return (
    <div className="card overflow-hidden shadow-[0_20px_50px_-20px_rgba(5,31,32,.35)]">
      <div className="flex border-b border-line bg-bone" role="tablist">
        {(["text", "voice", "photo"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold capitalize", tab === t ? "bg-white text-tide shadow-[inset_0_-3px_0_#235347]" : "text-ink/60")}>
            <Icon name={t === "text" ? "chat" : t === "voice" ? "mic" : "camera"} size={18} />{t}
          </button>
        ))}
      </div>
      <div className="p-4 sm:p-5">
        {tab === "text" && (
          <>
            <label className="label" htmlFor="demo-text">Tell Shell what you need</label>
            <textarea id="demo-text" ref={taRef} rows={3} value={text} onFocus={() => { if (typing) setTyping(false); }}
              onChange={(e) => { setTyping(false); setText(e.target.value); track("composer_demo_typed"); }}
              placeholder="For example: clean the house, buy groceries, organise my wardrobe" className={cn("input resize-none", typing && "cursor")} />
          </>
        )}
        {tab === "voice" && (
          <div className="rounded-xl bg-cream/60 p-4">
            <div className="flex h-16 items-center justify-center gap-1" aria-hidden>
              {Array.from({ length: 32 }).map((_, i) => <span key={i} className="w-1.5 rounded-full bg-euca" style={{ height: `${20 + Math.abs(Math.sin(i * 1.7)) * 70}%`, animation: `pulseBar ${0.8 + (i % 5) * 0.15}s ease-in-out ${i * 0.04}s infinite alternate` }} />)}
            </div>
            <style>{`@keyframes pulseBar{from{transform:scaleY(.3)}to{transform:scaleY(1)}}`}</style>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-euca">Sample transcript (demo)</p>
            <p className="text-sm italic text-ink/80">&ldquo;{DEMO_TEXT}&rdquo;</p>
            <button className="btn btn-ghost btn-sm mt-3" onClick={() => { setText(DEMO_TEXT); setTyping(false); setTab("text"); }}>Use this sample</button>
          </div>
        )}
        {tab === "photo" && <PhotoDemo />}

        <div className="mt-4">
          {res.banned ? (
            <p className="rounded-xl bg-[#fbefc9] p-3 text-sm">We don&apos;t offer that service. Shell doesn&apos;t do massage, makeup, personal care or homework. We can explain concepts and tutor, though.</p>
          ) : res.plan && res.plan.lines.length ? (
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
              <Receipt key={key} animate title="Your plan" subtitle="Estimate. Final price is locked when you approve."
                lines={res.plan.lines.map((l) => ({ name: l.name, detail: `${l.quantity} ${demoCatalog.find((c) => c.slug === l.slug)!.unit}${l.quantity > 1 ? "s" : ""} · ${formatDuration(l.durationMin)}`, amount: formatRange(l.price), stamped: true }))}
                fees={[{ label: "Platform fee", amount: formatINR(res.plan.platformFee) }, ...(res.plan.coordinationFee ? [{ label: "Coordination fee", amount: formatINR(res.plan.coordinationFee) }] : [])]}
                total={formatRange(res.plan.total)} totalLabel="Estimated total"
                footer={<>About {formatDuration(res.plan.durationMin)} of helper time. Includes Shell Guarantee.</>} />
              <div className="flex items-center gap-4 sm:flex-col sm:gap-2">
                <ReadinessRing key={key} percent={100} size={120} label="Ready" />
                <div className="text-sm"><div className="text-ink/60">From</div><div className="serif text-2xl font-bold text-tide"><Meter value={res.plan.total * 0.92} /></div></div>
              </div>
            </div>
          ) : debounced.trim().length > 3 ? (
            <div className="rounded-xl bg-cream/60 p-4 text-sm">
              <p>That isn&apos;t in our list yet, but send it anyway. A person will read it.</p>
              <Link href={`/waitlist?need=${encodeURIComponent(debounced)}`} className="btn btn-primary btn-sm mt-3">Join the waitlist</Link>
            </div>
          ) : null}
        </div>
        <Link href={`/waitlist?need=${encodeURIComponent(text)}`} onClick={() => track("cta_click", { location: "demo_try" })} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-euca underline underline-offset-4">
          Try this for your own home <Icon name="arrow" size={16} />
        </Link>
      </div>
    </div>
  );
}

function PhotoDemo() {
  const chips = [["Clothes on the bed", "Wardrobe organising"], ["Dishes on the table", "Utensils"], ["Dusty floor", "House cleaning"]];
  return (
    <div>
      <div className="relative overflow-hidden rounded-xl bg-[#ece7d6]">
        <svg viewBox="0 0 400 220" className="w-full draw" role="img" aria-label="Sample photo of a messy room with problem areas circled">
          <rect width="400" height="220" fill="#ece7d6" /><rect y="150" width="400" height="70" fill="#d9d1b8" />
          <rect x="30" y="80" width="150" height="70" rx="8" fill="#b9c9b5" stroke="#235347" strokeWidth="2" />
          <path d="M50 95c20-10 40 5 60-5s30 10 50 0M45 115c25 8 45-8 70 2" stroke="#e8c48a" strokeWidth="9" strokeLinecap="round" fill="none" />
          <rect x="230" y="105" width="120" height="14" rx="3" fill="#a77f55" /><rect x="240" y="119" width="6" height="40" fill="#a77f55" /><rect x="334" y="119" width="6" height="40" fill="#a77f55" />
          <ellipse cx="260" cy="100" rx="14" ry="5" fill="#fff" stroke="#235347" strokeWidth="2" /><ellipse cx="300" cy="99" rx="14" ry="5" fill="#fff" stroke="#235347" strokeWidth="2" />
          <rect x="300" y="30" width="70" height="50" rx="4" fill="#cfd9c8" stroke="#235347" strokeWidth="2" />
          <g fill="none" stroke="#b4372b" strokeWidth="3" strokeLinecap="round">
            <path className="draw-line" d="M28 76c60-22 160-14 160 22 0 30-120 60-160 30-20-14-12-40 0-52z" />
            <path className="draw-line" style={{ animationDelay: ".9s" }} d="M226 90c40-18 130-6 128 22-2 24-110 20-130 6-10-8-8-20 2-28z" />
            <path className="draw-line" style={{ animationDelay: "1.5s" }} d="M20 170c80-20 220-18 340 0-20 30-280 36-340 0z" />
          </g>
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">{chips.map(([a, b]) => <span key={a} className="chip !cursor-default"><span className="text-ink/60">{a}</span><Icon name="arrow" size={14} /><strong>{b}</strong></span>)}</div>
      <p className="mt-2 text-xs text-ink/50">Sample photo. In the app you upload your own, up to 5 photos.</p>
    </div>
  );
}

export function FourJobs() {
  const [flip, setFlip] = useState(false);
  return (
    <div>
      <div className="mb-6 inline-flex rounded-full border border-line bg-white p-1" role="tablist">
        {["Today", "With Shell"].map((l, i) => <button key={l} role="tab" aria-selected={flip === (i === 1)} onClick={() => setFlip(i === 1)} className={cn("rounded-full px-5 py-2 text-sm font-semibold", flip === (i === 1) ? "bg-tide text-cream" : "text-ink/60")}>{l}</button>)}
      </div>
      <div className="relative min-h-[300px]" style={{ perspective: 1200 }}>
        <div className="fade-up" key={String(flip)}>
          {!flip ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[["Cleaner on WhatsApp", "₹600 quoted, ₹750 asked", "Running late again"], ["Grocery app", "Substitution you never approved", "Order #8841"], ["Decor vendor call", "Different price every time", "3 missed calls"], ["Friend of a friend", "Cash only, no guarantee", "Hasn't replied"]].map(([a, b, c], i) => (
                <div key={a} className="card p-4" style={{ transform: `rotate(${[-1.2, 1, 0.8, -0.8][i]}deg)` }}>
                  <p className="text-xs font-bold uppercase tracking-wider text-danger">{a}</p><p className="mt-1 font-medium">{b}</p><p className="text-sm text-ink/50">{c}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid items-center gap-6 md:grid-cols-2">
              <Receipt title="Guests tomorrow" subtitle="One message. One plan." lines={[
                { name: "Groceries", amount: "₹149", stamped: true }, { name: "House cleaning", amount: "₹1,000", stamped: true }, { name: "Wardrobe", amount: "₹450", stamped: true }, { name: "Decoration", amount: "₹600", stamped: true }]}
                fees={[{ label: "Platform and coordination", amount: "₹389" }]} total="₹2,588" status="PAID" />
              <p className="serif text-2xl leading-snug text-tide">One person to ask. One payment. One guarantee.</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {["One point of contact", "One payment, held until you approve", "One guarantee on every job"].map((t) => <div key={t} className="flex items-center gap-3 border-t-2 border-tide pt-3 text-sm font-semibold"><Icon name="check" size={18} className="text-euca" />{t}</div>)}
      </div>
    </div>
  );
}

export function EarnCalculator() {
  const [hours, setHours] = useState(8);
  const [cat, setCat] = useState("house-cleaning");
  const c = CATALOG.find((x) => x.slug === cat)!;
  const perHour = (c.rate * 60) / c.mins;
  const lo = Math.round(hours * 4.3 * perHour * 0.8 * 0.6 / 100) * 100, hi = Math.round(hours * 4.3 * perHour * 0.8 * 0.9 / 100) * 100;
  return (
    <div className="card p-5 text-ink">
      <label className="label" htmlFor="hrs">Hours per week: <strong>{hours}</strong></label>
      <input id="hrs" type="range" min={2} max={30} value={hours} onChange={(e) => { setHours(+e.target.value); track("estimator_used", { type: "earn" }); }} className="w-full accent-[#235347]" />
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Category">
        {["house-cleaning", "groceries", "wardrobe-organising", "event-help", "tutoring-explaining", "excel-data-help", "pet-walking"].map((s) => (
          <button key={s} className="chip" aria-pressed={cat === s} onClick={() => setCat(s)}>{CATALOG.find((x) => x.slug === s)!.name}</button>
        ))}
      </div>
      <div className="mt-5 rounded-xl bg-cream p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-euca">Estimated per month</div>
        <div className="serif text-3xl font-bold text-tide">₹{lo.toLocaleString("en-IN")} – ₹{hi.toLocaleString("en-IN")}</div>
        <p className="mt-1 text-xs text-ink/60">Estimates, not guarantees. Based on average rates, 80% helper share and typical demand in your society.</p>
      </div>
    </div>
  );
}

export function SocietyFinder({ cells, initial }: { cells: { hex: string; count: number }[]; initial: { id: string; name: string; area: string; status: string; count: number; target: number }[] }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState(initial);
  useEffect(() => {
    const t = setTimeout(async () => { try { const d = await post<{ items: typeof initial }>(`/api/waitlist/stats?q=${encodeURIComponent(q)}`, {}, "GET"); setRes(d.items); } catch {} }, 250);
    return () => clearTimeout(t);
  }, [q]);
  const s = res[0];
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <HexMap cells={cells} className="min-h-[260px]" />
      <div>
        <label className="label !text-sage" htmlFor="soc">Find your society</label>
        <input id="soc" className="input" placeholder="Search by name or area" value={q} onChange={(e) => setQ(e.target.value)} />
        {s ? (
          <div className="mt-4 rounded-2xl bg-cream p-4 text-tide">
            <div className="flex items-center justify-between"><strong>{s.name}</strong><span className={cn("pill", s.status === "waitlist" ? "pill-warn" : "pill-dark")}>{s.status === "waitlist" ? "Waitlist" : "Open"}</span></div>
            <div className="text-sm text-ink/60">{s.area}</div>
            {s.status === "waitlist" ? (
              <>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-euca" style={{ width: `${Math.min(100, (s.count / s.target) * 100)}%` }} /></div>
                <p className="mt-2 text-sm"><strong>{s.count}</strong> neighbours waiting. <strong>{Math.max(0, s.target - s.count)}</strong> more to open this society.</p>
              </>
            ) : <p className="mt-2 text-sm">Shell is open here. Sign up and book your first job.</p>}
          </div>
        ) : <p className="mt-4 text-sm text-sage">We couldn&apos;t find that society yet. Join the waitlist and tell us where you live.</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/waitlist${s ? `?society=${encodeURIComponent(s.name)}` : ""}`} className="btn btn-sun">Join the waitlist</Link>
          <Link href="/societies" className="btn btn-light">Bring your society</Link>
        </div>
        <p className="mt-3 text-xs text-sage">Hexagons are about 500 m across. No exact addresses are ever shown.</p>
      </div>
    </div>
  );
}

export function WaitlistForm({ societies, compact = false, prefill }: { societies: string[]; compact?: boolean; prefill?: { need?: string; society?: string; ref?: string } }) {
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [f, setF] = useState({ name: "", phone: "", role: "help", society: prefill?.society ?? "", tower: "", need: prefill?.need ?? "", ref: prefill?.ref ?? "", consent: false, otp: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [hint, setHint] = useState("");
  const [res, setRes] = useState<{ position: number; neighbours: number; code: string; society: string } | null>(null);
  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const started = useRef(false);
  const start = () => { if (!started.current) { started.current = true; track("form_start", { form: "waitlist" }); } };

  async function sendOtp() {
    setErr("");
    if (!f.name.trim()) return setErr("Please enter your name.");
    if (!/^[6-9]\d{9}$/.test(f.phone.replace(/\D/g, "").slice(-10))) return setErr("Enter a valid 10-digit Indian mobile number.");
    if (!f.consent) return setErr("Please tick the box so we can message you on WhatsApp.");
    setBusy(true);
    try { const d = await post<{ demoCode?: string }>("/api/auth/otp/request", { phone: f.phone }); setHint(d.demoCode ? `Demo mode: your code is ${d.demoCode}` : "We sent a code to your WhatsApp."); setStep("otp"); }
    catch (e) { setErr((e as Error).message); track("form_error", { form: "waitlist" }); } finally { setBusy(false); }
  }
  async function submit() {
    setErr(""); setBusy(true);
    try {
      const d = await post<any>("/api/waitlist", { name: f.name, phone: f.phone, role: f.role, society: f.society, tower: f.tower, message: f.need, referralCode: f.ref, consent: f.consent, otp: f.otp });
      setRes(d); setStep("done"); track("form_submit", { form: "waitlist" });
    } catch (e) { setErr((e as Error).message); track("form_error", { form: "waitlist" }); } finally { setBusy(false); }
  }
  if (step === "done" && res) {
    const link = typeof window !== "undefined" ? `${location.origin}/waitlist?ref=${res.code}` : `/waitlist?ref=${res.code}`;
    return (
      <div className="receipt px-6 pt-6 text-center">
        <div className="flex justify-center"><span className="stamp stamp-green stamp-in !text-lg">You&apos;re in. #{res.position}</span></div>
        <p className="serif mt-4 text-xl font-semibold">Thanks, {f.name.split(" ")[0]}.</p>
        <p className="mt-1 text-sm">{res.neighbours} neighbours are waiting near {res.society || "you"}. We&apos;ll message you on WhatsApp when we open.</p>
        <hr className="perf" />
        <p className="text-xs uppercase tracking-wider text-euca">Move up the list</p>
        <p className="mt-1 break-all text-sm">{link}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <a className="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer" onClick={() => track("referral_link_shared")} href={`https://wa.me/?text=${encodeURIComponent(`I'm #${res.position} on the Shell list. Join me: ${link}`)}`}>Share on WhatsApp</a>
          <a className="btn btn-ghost btn-sm" href={`/api/waitlist/card?code=${res.code}`} target="_blank" rel="noopener noreferrer">Open share card</a>
        </div>
        <div className="h-5" />
      </div>
    );
  }
  return (
    <form className={cn("receipt px-5 pt-5 text-left", compact ? "" : "sm:px-7 sm:pt-7")} onSubmit={(e) => { e.preventDefault(); step === "form" ? sendOtp() : submit(); }} onFocus={start} style={{ fontFamily: "var(--font-sans)" }}>
      <div className="serif text-xl font-semibold">Join the waitlist</div>
      <p className="text-xs text-ink/60">Takes under a minute. We&apos;ll verify your number on WhatsApp.</p>
      <hr className="perf" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="w-name">Your name</label><input id="w-name" className="input" value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" disabled={step === "otp"} /></div>
        <div><label className="label" htmlFor="w-phone">WhatsApp number</label><input id="w-phone" className="input" inputMode="tel" placeholder="98100 00000" value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" disabled={step === "otp"} /></div>
      </div>
      <fieldset className="mt-3"><legend className="label">I want to</legend>
        <div className="flex flex-wrap gap-2">{[["help", "Get help"], ["earn", "Earn as a helper"], ["both", "Both"]].map(([v, l]) => <button type="button" key={v} className="chip" aria-pressed={f.role === v} onClick={() => set("role", v)}>{l}</button>)}</div>
      </fieldset>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="w-soc">Society or area</label><input id="w-soc" list="soc-list" className="input" value={f.society} onChange={(e) => set("society", e.target.value)} placeholder="Start typing" /><datalist id="soc-list">{societies.map((s) => <option key={s} value={s} />)}</datalist></div>
        <div><label className="label" htmlFor="w-tower">Tower (optional)</label><input id="w-tower" className="input" value={f.tower} onChange={(e) => set("tower", e.target.value)} /></div>
      </div>
      <div className="mt-3"><label className="label" htmlFor="w-need">What do you need done?</label><textarea id="w-need" rows={2} className="input" value={f.need} onChange={(e) => set("need", e.target.value)} /></div>
      <div className="mt-3"><label className="label" htmlFor="w-ref">Referral code (optional)</label><input id="w-ref" className="input" value={f.ref} onChange={(e) => set("ref", e.target.value)} /></div>
      <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} disabled={step === "otp"} />I agree to receive WhatsApp messages from Shell about my waitlist spot and launch.</label>
      {step === "otp" && (
        <div className="mt-3 rounded-xl bg-cream p-3"><label className="label" htmlFor="w-otp">Enter the 6-digit code</label>
          <input id="w-otp" className="input tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={f.otp} onChange={(e) => set("otp", e.target.value.replace(/\D/g, ""))} autoFocus />
          <p className="mt-1 text-xs text-euca">{hint}</p></div>
      )}
      {err && <p role="alert" className="mt-3 rounded-lg bg-[#f8dcd8] p-2 text-sm text-danger">{err}</p>}
      <button className="btn btn-primary mt-4 w-full" disabled={busy || (step === "otp" && f.otp.length < 6)}>{busy ? "Please wait…" : step === "form" ? "Send verification code" : "Confirm and join"}</button>
      <div className="h-5" />
    </form>
  );
}

export function PinnedStory() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); }), { rootMargin: "-45% 0px -45% 0px" });
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);
  const steps = [
    ["1", "Write one message", "Type it, say it or send a photo. Any language you like."],
    ["2", "Answer two quick questions", "Tap a chip. Skip anything and we'll decide."],
    ["3", "Get one clear plan", "A receipt with every task, time and price. Nothing hidden."],
    ["4", "Watch it happen", "See your helper arrive at your tower and floor, in real time."],
    ["5", "Home ready", "Review the photos, approve, and say thanks."],
  ];
  const towers = [{ name: "Tower A", lat: 0, lng: 0 }, { name: "Tower B", lat: 0.0004, lng: 0.0012 }, { name: "Tower C", lat: 0.0009, lng: 0.0022 }, { name: "Tower D", lat: -0.0006, lng: 0.0023 }];
  const screens = [
    <div key="0" className="space-y-2 p-4"><div className="rounded-2xl rounded-bl-sm bg-cream p-3 text-sm">Guests are coming tomorrow. I need cleaning, groceries and some decoration.</div><div className="text-right text-xs text-ink/50">Sent</div></div>,
    <div key="1" className="space-y-3 p-4"><p className="text-sm font-semibold">How big is your home?</p><div className="flex flex-wrap gap-2"><span className="chip on">2 BHK</span><span className="chip">1 BHK</span><span className="chip">3 BHK</span></div><p className="text-sm font-semibold">Grocery budget?</p><div className="flex flex-wrap gap-2"><span className="chip">₹1,000</span><span className="chip on">₹2,500</span></div></div>,
    <div key="2" className="p-3"><Receipt title="Guests tomorrow" lines={[{ name: "Groceries", amount: "₹149", stamped: true }, { name: "Cleaning", amount: "₹1,000", stamped: true }, { name: "Decoration", amount: "₹600", stamped: true }]} total="₹2,150" status="PAID" /></div>,
    <div key="3" className="p-3"><SocietyMap gates={[{ name: "G2", lat: -0.0003, lng: 0.0003 }]} towers={towers} helper={{ lat: 0.0003, lng: 0.0015 }} focusTower="Tower C" /><p className="mt-2 text-center text-sm font-semibold">Rahul is at the gate. About 6 min to Tower C, 9th floor.</p></div>,
    <div key="4" className="grid place-items-center gap-3 p-6"><ReadinessRing percent={100} size={130} /><div className="note !text-lg">Thank you Rahul! The house looks great.</div></div>,
  ];
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-6 lg:space-y-0">
        {steps.map(([n, t, d], i) => (
          <div key={n} ref={(el) => { refs.current[i] = el; }} data-i={i} className={cn("lg:flex lg:min-h-[60vh] lg:items-center", )}>
            <div className={cn("transition-opacity", active === i ? "lg:opacity-100" : "lg:opacity-35")}>
              <div className="serif text-6xl font-bold text-sage">{n}</div>
              <h3 className="serif text-3xl font-semibold">{t}</h3>
              <p className="mt-2 max-w-sm text-ink/70">{d}</p>
              <div className="mt-4 overflow-hidden rounded-3xl border-4 border-tide bg-white lg:hidden">{screens[i]}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="relative hidden lg:block">
        <div className="sticky top-28 mx-auto w-[300px] rounded-[2.5rem] border-[6px] border-tide bg-white shadow-2xl">
          <div className="mx-auto mt-2 h-1.5 w-16 rounded-full bg-tide/20" />
          <div className="min-h-[460px]" key={active}><div className="fade-up">{screens[active]}</div></div>
          <div className="flex justify-center gap-1.5 pb-4">{steps.map((_, i) => <span key={i} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-tide" : "w-1.5 bg-tide/25")} />)}</div>
        </div>
      </div>
    </div>
  );
}
