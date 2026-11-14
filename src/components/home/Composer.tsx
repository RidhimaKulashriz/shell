"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { DEMO_SENTENCE, runKeywordEngine } from "@/lib/keywords";
import { Meter, Receipt, Ring, Stamp } from "@/components/ui";
import { track } from "@/lib/track";
import { useLang } from "@/lib/i18n";

type Tab = "text" | "voice" | "photo";

export function Composer() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("text");
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(true);
  const [debounced, setDebounced] = useState("");
  const [ring, setRing] = useState(0);
  const touched = useRef(false);

  // Type the demo sentence at 35ms per character
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setText(DEMO_SENTENCE);
      setTyping(false);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      if (touched.current) return clearInterval(id);
      i++;
      setText(DEMO_SENTENCE.slice(0, i));
      if (i >= DEMO_SENTENCE.length) {
        clearInterval(id);
        setTyping(false);
      }
    }, 35);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typing) return;
    const id = setTimeout(() => setDebounced(text), touched.current ? 450 : 0);
    return () => clearTimeout(id);
  }, [text, typing]);

  const result = useMemo(() => runKeywordEngine(debounced), [debounced]);

  useEffect(() => {
    setRing(0);
    if (result.kind !== "match") return;
    const id = setTimeout(() => setRing(100), result.items.length * 180 + 500);
    return () => clearTimeout(id);
  }, [result]);

  const finish = useMemo(() => {
    if (result.kind !== "match") return "";
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    const longest = Math.max(...result.items.map((i) => i.hours));
    d.setMinutes(d.getMinutes() + Math.round((longest + 0.5) * 60));
    return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  }, [result]);

  const onType = (v: string) => {
    if (!touched.current) {
      touched.current = true;
      track("form_start", { form: "composer_demo" });
    }
    setTyping(false);
    setText(v);
    track("composer_demo_typed");
  };

  const tryHome = () => {
    try {
      sessionStorage.setItem("shell_demo_text", text);
    } catch {}
  };

  return (
    <div className="relative">
      <div className="bg-paper relative rotate-[1deg] rounded-[26px_30px_24px_32px] p-4 shadow-[0_16px_0_rgba(5,31,32,0.16)] ring-2 ring-tide md:p-5">
        <span className="washi absolute -top-3 left-8 -rotate-3">live demo</span>
        <div role="tablist" aria-label="Composer mode" className="mb-3 flex gap-1 rounded-full bg-tide/10 p-1">
          {(["text", "voice", "photo"] as Tab[]).map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold capitalize ${tab === k ? "bg-tide text-cream shadow-[0_3px_0_#000]" : ""}`}>
              {k === "text" ? "Type" : k === "voice" ? "Voice" : "Photo"}
            </button>
          ))}
        </div>

        {tab === "text" ? (
          <div>
            <label htmlFor="demo-text" className="sr-only">Kya karwana hai?</label>
            <textarea
              id="demo-text"
              rows={4}
              value={text}
              onChange={(e) => onType(e.target.value)}
              onFocus={() => (touched.current = true)}
              placeholder="Kya karwana hai? Hindi, English, Hinglish, sab chalega."
              className={`w-full resize-none rounded-2xl border-2 border-dashed border-tide/40 bg-cream/60 p-3 text-[1.02rem] leading-snug outline-none focus:border-euca ${typing ? "caret" : ""}`}
            />
            <div className="mt-1 flex items-center justify-between text-xs text-euca">
              <span>Apna sentence likh ke dekho.</span>
              <button className="underline" onClick={() => { touched.current = true; setText(""); setTyping(false); setDebounced(""); }}>saaf karo</button>
            </div>
          </div>
        ) : null}
        {tab === "voice" ? <VoiceTab /> : null}
        {tab === "photo" ? <PhotoTab /> : null}

        {tab === "text" && !typing ? (
          <div className="mt-4">
            {result.kind === "match" ? (
              <div className="relative">
                <Receipt
                  key={result.items.map((i) => i.slug).join("|")}
                  lines={result.items.map((i, n) => ({
                    label: i.label,
                    sub: `~${i.hours} hr`,
                    amount: `₹${i.min}-${i.max}`,
                    stamped: true,
                    delay: n * 180,
                  }))}
                  totalLabel="ESTIMATE"
                  total={
                    <span>
                      <Meter prefix="₹" value={result.totalMin} /> - <Meter value={result.totalMax} />
                    </span>
                  }
                  foot={
                    <span>
                      Done by about <b>{finish}</b> if you start today. Final price after a human check.
                    </span>
                  }
                />
                <div className="absolute -top-5 right-2 rotate-6 rounded-full bg-paper p-1 shadow-[0_6px_0_rgba(5,31,32,0.15)] ring-2 ring-tide">
                  <Ring percent={ring} size={84} label="ghar ready" />
                </div>
              </div>
            ) : result.kind === "banned" ? (
              <div className="rounded-2xl bg-sand/50 p-4 text-sm">
                <Stamp>NOT TAKEN</Stamp>
                <p className="mt-2">Ye kaam hum launch par nahi lete (massage, makeup, personal care, homework karna). Padhai samjhana ho to batao.</p>
              </div>
            ) : debounced.trim().length > 2 ? (
              <div className="hand rounded-2xl bg-sand/40 p-4 text-xl leading-snug">
                Ye abhi humare list mein nahi, par likh ke bhejo, hum dekhte hain.
                <div className="mt-3"><Link className="pill pill-forest !py-2.5 font-sans text-sm" href="/waitlist" onClick={tryHome}>Waitlist mein judo</Link></div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <p className="mt-5 text-center md:text-left">
        <Link href={`/waitlist?msg=${encodeURIComponent(text.slice(0, 300))}`} onClick={tryHome} className="hand text-2xl text-euca underline decoration-sun decoration-[3px] underline-offset-4" data-cta="composer_try_home">
          {t("cta.tryhome")} →
        </Link>
      </p>
    </div>
  );
}

function VoiceTab() {
  const bars = Array.from({ length: 34 }, (_, i) => i);
  return (
    <div className="rounded-2xl border-2 border-dashed border-tide/40 bg-cream/60 p-4">
      <div className="flex h-16 items-center justify-center gap-[3px]" aria-hidden="true">
        {bars.map((i) => (
          <span key={i} className="w-1.5 rounded-full bg-euca" style={{ height: `${20 + Math.abs(Math.sin(i * 1.7)) * 70}%`, animation: `wave 1.2s ease-in-out ${i * 45}ms infinite alternate` } as CSSProperties} />
        ))}
      </div>
      <style>{`@keyframes wave{from{transform:scaleY(.25)}to{transform:scaleY(1)}}@media (prefers-reduced-motion: reduce){[style*="wave"]{animation:none!important}}`}</style>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-euca">Demo transcript (sample, not your voice)</p>
      <p className="mt-1 text-sm italic">&ldquo;Bhaiya, kal shaam ko 10 log aa rahe hain. Drawing room saaf karwana hai aur kuch groceries bhi chahiye.&rdquo;</p>
      <p className="mt-2 text-xs opacity-70">In the app: hold to record up to 60 seconds, edit the words, send.</p>
    </div>
  );
}

function PhotoTab() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-tide/40 bg-cream/60 p-3">
      <div className="relative">
        <svg viewBox="0 0 320 200" className="w-full" role="img" aria-label="Sample photo of a messy bedroom with problem areas circled">
          <rect width="320" height="200" fill="#e9dfc4" />
          <rect y="140" width="320" height="60" fill="#d3c39c" />
          <rect x="18" y="52" width="120" height="70" rx="6" fill="#8EB69B" stroke="#0E1A17" strokeWidth="2" />
          <rect x="18" y="108" width="120" height="30" fill="#235347" stroke="#0E1A17" strokeWidth="2" />
          <path d="M44 98 C60 70 84 84 100 74 C112 90 96 106 70 104 Z" fill="#E8C48A" stroke="#0E1A17" strokeWidth="2" />
          <rect x="178" y="24" width="110" height="86" fill="#c9b27c" stroke="#0E1A17" strokeWidth="2" />
          <line x1="233" y1="24" x2="233" y2="110" stroke="#0E1A17" strokeWidth="2" />
          <path d="M190 112 C196 96 214 92 222 112 Z M242 112 C248 90 270 94 276 112 Z" fill="#F2C318" stroke="#0E1A17" strokeWidth="2" />
          <rect x="196" y="150" width="46" height="34" fill="#b9966a" stroke="#0E1A17" strokeWidth="2" />
          <rect x="250" y="160" width="36" height="24" fill="#b9966a" stroke="#0E1A17" strokeWidth="2" />
          <circle cx="40" cy="170" r="6" fill="#0E1A17" /><circle cx="64" cy="176" r="5" fill="#0E1A17" />
          {[
            { d: "M60 62 C20 56 8 90 40 110 C80 120 120 100 100 66 C90 54 70 56 52 62", delay: 0.2 },
            { d: "M200 98 C176 100 178 124 210 126 C250 130 284 124 282 104 C280 92 240 90 210 96", delay: 1.2 },
            { d: "M190 140 C186 168 196 192 226 190 C262 190 296 188 292 164 C288 140 250 142 214 140", delay: 2.2 },
          ].map((c, i) => (
            <path key={i} d={c.d} fill="none" stroke="#B3361F" strokeWidth="3" strokeLinecap="round" strokeDasharray="420" strokeDashoffset="420" style={{ animation: `drawc 1s ease ${c.delay}s forwards` }} />
          ))}
        </svg>
        <style>{`@keyframes drawc{to{stroke-dashoffset:0}}@media (prefers-reduced-motion: reduce){path[style*="drawc"]{stroke-dashoffset:0!important;animation:none!important}}`}</style>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="slidein rounded-full bg-sand px-3 py-1" style={{ animationDelay: "1.1s" }}>Bed par kapde: wardrobe organise</span>
        <span className="slidein rounded-full bg-sand px-3 py-1" style={{ animationDelay: "2.1s" }}>Almirari: fold + zone</span>
        <span className="slidein rounded-full bg-sand px-3 py-1" style={{ animationDelay: "3.1s" }}>Floor boxes: unpack + clean</span>
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-euca">Illustrated sample. Photo-to-plan arrives in the app.</p>
    </div>
  );
}
