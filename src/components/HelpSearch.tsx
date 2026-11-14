"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Faq } from "@/lib/catalog";

export type HelpItem = Faq & { section: "customer" | "helper"; topic: string };

export function HelpSearch({ items }: { items: HelpItem[] }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"customer" | "helper">("customer");
  const [vote, setVote] = useState<Record<string, "y" | "n">>({});
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return items.filter((i) => (t ? `${i.q} ${i.a} ${i.topic}`.toLowerCase().includes(t) : i.section === tab));
  }, [q, tab, items]);
  return (
    <div>
      <label htmlFor="help-q" className="sr-only">Search help</label>
      <input id="help-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search karo: refund, OTP, payout, पैसे..." className="w-full rounded-full border-2 border-tide bg-white px-6 py-4 text-lg outline-none focus:border-euca" />
      {!q ? (
        <div className="mt-5 flex gap-2" role="tablist">
          {(["customer", "helper"] as const).map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-5 py-2 font-semibold ${tab === k ? "bg-tide text-cream" : "border-2 border-tide/40"}`}>{k === "customer" ? "Customers" : "Helpers"}</button>
          ))}
        </div>
      ) : null}
      <ul className="mt-6 space-y-3">
        {list.length === 0 ? (
          <li className="hand text-2xl">Kuch nahi mila. <Link href="/contact" className="underline">Humse poochho</Link>.</li>
        ) : (
          list.map((i) => (
            <li key={i.q}>
              <details className="rounded-2xl bg-white/70 p-4 open:bg-white">
                <summary className="cursor-pointer font-semibold">{i.q}<span className="ml-2 font-mono text-[10px] uppercase opacity-50">{i.topic}</span></summary>
                <p className="mt-2 leading-relaxed text-ink/80">{i.a}</p>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  {vote[i.q] ? <span className="hand text-lg">Shukriya!</span> : (
                    <>
                      <span>Kaam aaya?</span>
                      <button className="rounded-full border-2 border-tide/40 px-3 py-0.5" onClick={() => setVote((v) => ({ ...v, [i.q]: "y" }))}>Haan</button>
                      <button className="rounded-full border-2 border-tide/40 px-3 py-0.5" onClick={() => setVote((v) => ({ ...v, [i.q]: "n" }))}>Nahi</button>
                    </>
                  )}
                </div>
              </details>
            </li>
          ))
        )}
      </ul>
      <p className="mt-8 text-sm">Jawab nahi mila? <Link className="font-semibold underline" href="/contact">Contact karo</Link> ya WhatsApp par likho.</p>
    </div>
  );
}
