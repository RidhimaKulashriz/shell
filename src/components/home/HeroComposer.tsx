"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HandCircle, Meter, Receipt, Ring, Stamp, prefersReduced, type RLine } from "@/components/ui";
import { DEMO_SENTENCE, matchKeywords } from "@/lib/keywords";
import { quote, type Size, type TemplateLike } from "@/lib/pricing";
import { inr, minutesToText } from "@/lib/format";
import { track } from "@/lib/analytics";

export type CatalogTpl = TemplateLike & { nameHi: string };

function useDemoQuote(text: string, catalog: CatalogTpl[]) {
  return useMemo(() => {
    const r = matchKeywords(text);
    const map = new Map(catalog.map((c) => [c.slug, c]));
    const lines = r.items.flatMap((i) => (map.get(i.slug) ? [{ template: map.get(i.slug)!, qty: i.qty, size: i.size as Size }] : []));
    return { r, q: lines.length ? quote({ lines }) : null };
  }, [text, catalog]);
}

const Bars = () => (
  <div className="flex h-16 items-center gap-[3px]" aria-hidden>
    {Array.from({ length: 36 }, (_, i) => (
      <span key={i} className="w-1.5 rounded-full bg-forest" style={{ height: `${20 + ((i * 37) % 70)}%`, animation: `wave ${0.7 + (i % 5) * 0.15}s ease-in-out ${i * 0.03}s infinite alternate` }} />
    ))}
    <style>{`@keyframes wave{from{transform:scaleY(.25)}to{transform:scaleY(1)}}`}</style>
  </div>
);

export function HeroComposer({ catalog, lang }: { catalog: CatalogTpl[]; lang: string }) {
  const [tab, setTab] = useState<"text" | "voice" | "photo">("text");
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(true);
  const [debounced, setDebounced] = useState("");
  const [finish, setFinish] = useState("");

  useEffect(() => {
    if (!typing) return;
    if (prefersReduced()) {
      setText(DEMO_SENTENCE);
      setTyping(false);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setText(DEMO_SENTENCE.slice(0, i));
      if (i >= DEMO_SENTENCE.length) {
        clearInterval(id);
        setTyping(false);
      }
    }, 35);
    return () => clearInterval(id);
  }, [typing]);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(text), typing ? 0 : 450);
    return () => clearTimeout(id);
  }, [text, typing]);

  const { r, q } = useDemoQuote(debounced, catalog);
  useEffect(() => {
    if (!q) return setFinish("");
    const d = new Date(Date.now() + q.minutes * 60000);
    setFinish(d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }));
  }, [q]);

  const lines: RLine[] = q ? q.lines.map((l) => ({ name: lang === "hi" ? (catalog.find((c) => c.slug === l.slug)?.nameHi ?? l.name) : l.name, qty: l.qty > 1 ? String(l.qty) : undefined, price: inr(l.price), stamp: !typing })) : [];
  const noMatch = !typing && debounced.trim().length > 6 && !q;
  const ready = q ? (typing ? 35 : 100) : 0;

  const photoLines = ["clean-room", "wardrobe-organise", "utensils"].map((s) => catalog.find((c) => c.slug === s)).filter(Boolean) as CatalogTpl[];

  return (
    <div className="relative">
      <div className="rotate-[1deg] rounded-[28px] border-2 border-ink bg-paper p-4 shadow-[8px_8px_0_var(--color-ink)] md:p-5">
        <div role="tablist" aria-label="Composer demo" className="mb-3 flex gap-2">
          {(["text", "voice", "photo"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold capitalize ${tab === t ? "bg-forest text-cream" : "bg-cream"}`}>
              {t === "text" ? "Text" : t === "voice" ? "Voice" : "Photo"}
            </button>
          ))}
          <span className="hand ml-auto self-center text-lg text-euc">demo, no sign-up</span>
        </div>

        {tab === "text" && (
          <div role="tabpanel">
            <label htmlFor="demo-text" className="sr-only">Kya karwana hai? Hindi, English, Hinglish, sab chalega.</label>
            <textarea
              id="demo-text"
              className="field min-h-[96px] resize-none text-[15px]"
              value={text}
              placeholder="Kya karwana hai? Hindi, English, Hinglish, sab chalega."
              onFocus={() => typing && setTyping(false)}
              onChange={(e) => {
                setTyping(false);
                setText(e.target.value);
              }}
              onBlur={() => text.length > 10 && track("composer_demo_typed", { len: text.length })}
            />
            {r.banned.length > 0 && <p className="mt-2 rounded-xl bg-sand/60 p-2 text-sm">Ye hum nahi karte ({r.banned.join(", ")}). Massage, makeup aur personal care launch par band hain.</p>}
            {noMatch && (
              <div className="mt-3 rounded-2xl border-2 border-dashed border-ink/40 p-3 text-sm">
                Ye abhi humare list mein nahi, par likh ke bhejo, hum dekhte hain.
                <Link href={`/waitlist?text=${encodeURIComponent(text)}`} className="btn btn-sun btn-sm ml-2 mt-2">Waitlist mein likho</Link>
              </div>
            )}
            {q && (
              <div className="mt-4 grid items-start gap-4 sm:grid-cols-[1fr_auto]">
                <Receipt key={q.lines.map((l) => l.slug).join()} title="Aapka plan" meta="Sample estimate" lines={lines} fees={[{ name: "Platform fee", price: inr(q.platformFee) }, ...(q.coordinationFee ? [{ name: "Coordination (3+ tasks)", price: inr(q.coordinationFee) }] : [])]} total={<span className="flex items-baseline gap-1"><Meter value={q.range[0] / 100} prefix="₹" /> <span className="text-xs opacity-60">to</span> <Meter value={q.range[1] / 100} prefix="₹" /></span>} totalLabel="ESTIMATE" footer={`About ${minutesToText(q.minutes)} of work${finish ? `. Done by ~${finish} if started now.` : "."} Shell Guarantee included.`} animate={!prefersReduced()} />
                <div className="hidden justify-self-center sm:block"><Ring pct={ready} size={118} label="Ghar Ready" /></div>
              </div>
            )}
            <p className="mt-3 text-sm">
              <Link href={`/waitlist?text=${encodeURIComponent(text)}`} className="link-quiet font-bold text-euc" data-cta="hero_try">Isse apne ghar ke liye try karo</Link>
            </p>
          </div>
        )}

        {tab === "voice" && (
          <div role="tabpanel" className="space-y-3">
            <div className="flex items-center gap-4 rounded-2xl bg-cream p-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-ink bg-sun"><svg width="26" height="26" viewBox="0 0 48 48" fill="none" stroke="#0e1a17" strokeWidth="3" strokeLinecap="round"><path d="M18 12a6 6 0 0 1 12 0V24a6 6 0 0 1-12 0Z M10 22a14 14 0 0 0 28 0 M24 36V44"/></svg></span><Bars /></div>
            <div className="rounded-2xl border-2 border-dashed border-ink/40 p-3 text-sm"><span className="stamp mb-2 text-[10px]">Demo transcript</span><p className="mt-1 italic">&ldquo;{DEMO_SENTENCE}&rdquo;</p></div>
            <p className="text-sm opacity-75">In the app: hold to record up to 60 seconds in Hindi, English or Hinglish, then edit the transcript before sending.</p>
          </div>
        )}

        {tab === "photo" && (
          <div role="tabpanel" className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-[#ddd5bd]">
              <svg viewBox="0 0 400 260" className="w-full" aria-label="Sample photo of a messy room">
                <rect width="400" height="260" fill="#ddd5bd" /><rect y="215" width="400" height="45" fill="#b9ae93" />
                <rect x="24" y="30" width="110" height="120" fill="#daf1de" stroke="#0e1a17" strokeWidth="3" /><path d="M24 90H134M79 30V150" stroke="#0e1a17" strokeWidth="2" />
                <g stroke="#0e1a17" strokeWidth="2.5"><path d="M240 120 q20 -40 70 -10 q10 40 -20 50 q-50 10 -50 -40z" fill="#8eb69b" /><rect x="170" y="190" width="80" height="26" rx="5" fill="#c9a66b" transform="rotate(-6 210 200)" /><circle cx="330" cy="200" r="16" fill="#e8c48a" /><rect x="40" y="185" width="60" height="30" rx="5" fill="#c9a66b" transform="rotate(8 70 200)" /></g>
              </svg>
              <div className="pointer-events-none absolute left-[8%] top-[66%] h-[26%] w-[32%]"><HandCircle className="inset-0 h-full w-full" delay={200} /></div>
              <div className="pointer-events-none absolute left-[57%] top-[32%] h-[34%] w-[34%]"><HandCircle className="inset-0 h-full w-full" delay={900} /></div>
              <div className="pointer-events-none absolute left-[38%] top-[68%] h-[22%] w-[30%]"><HandCircle className="inset-0 h-full w-full" delay={1600} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {photoLines.map((p) => <span key={p.slug} className="chip on cursor-default">{p.name} · {inr(p.baseRate)}</span>)}
            </div>
            <p className="text-sm opacity-75">Sample photo with drawn circles. In the app you upload up to five photos and we mark what we see.</p>
          </div>
        )}
      </div>
      <div className="absolute -right-2 -top-4 hidden md:block">{q && !typing && <Stamp label="Approved by a human next" tone="ink" rot={8} />}</div>
    </div>
  );
}
