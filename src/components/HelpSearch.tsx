"use client";
import Link from "next/link";
import { useState } from "react";

type Item = { id: string; scope: string; q: string; a: string; qHi: string; aHi: string };

export function HelpSearch({ items }: { items: Item[] }) {
  const [q, setQ] = useState("");
  const [who, setWho] = useState<"customer" | "helper">("customer");
  const [fb, setFb] = useState<Record<string, boolean>>({});
  const n = q.trim().toLowerCase();
  const list = items.filter((i) => i.scope === who && (!n || (i.q + i.a + i.qHi + i.aHi).toLowerCase().includes(n)));
  return (
    <div className="mx-auto max-w-3xl">
      <label htmlFor="help-q" className="sr-only">Search help in Hindi or English</label>
      <input id="help-q" className="field text-lg" placeholder="Search: refund, OTP, payout, किराना..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-4 flex gap-2" role="tablist">{(["customer", "helper"] as const).map((w) => <button key={w} role="tab" aria-selected={who === w} className="chip" aria-pressed={who === w} onClick={() => setWho(w)}>{w === "customer" ? "Customers" : "Helpers"}</button>)}</div>
      <div className="mt-6 space-y-3">
        {list.map((i) => (
          <details key={i.id} className="rounded-2xl border-2 border-ink bg-cream p-4">
            <summary className="cursor-pointer font-bold">{i.q}</summary>
            <p className="mt-2">{i.a}</p>
            {i.aHi && <p lang="hi" className="mt-2 opacity-80">{i.aHi}</p>}
            <div className="mt-3 flex items-center gap-2 text-sm">{fb[i.id] ? "Shukriya!" : <>Helpful? <button className="chip !min-h-0 !py-0.5" onClick={() => setFb({ ...fb, [i.id]: true })}>Haan</button><button className="chip !min-h-0 !py-0.5" onClick={() => setFb({ ...fb, [i.id]: true })}>Nahi</button></>}</div>
          </details>
        ))}
        {!list.length && <p className="hand text-2xl">Kuch nahi mila. <Link className="link-quiet" href="/contact">Humse puchho.</Link></p>}
      </div>
      <p className="mt-10 text-sm">Nahi mila jawab? <Link href="/contact" className="link-quiet font-bold">Contact us</Link> or WhatsApp.</p>
    </div>
  );
}
