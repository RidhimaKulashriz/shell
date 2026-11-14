"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Meter, Receipt, Stamp } from "./ui";
import { estimate, rupees } from "@/lib/pricing";
import type { PackTask } from "@/lib/catalog";

export function PackCustomise({ title, tasks, rates }: { title: string; tasks: PackTask[]; rates: Record<string, number> }) {
  const [on, setOn] = useState<boolean[]>(tasks.map(() => true));
  const active = tasks.filter((_, i) => on[i]);
  const est = useMemo(() => estimate({ managed: true, tasks: active.map((t) => ({ baseRate: (rates[t.slug] ?? 150) * 100, quantity: t.hours })) }), [active, rates]);
  const hours = active.reduce((a, t) => a + t.hours, 0);
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-start">
      <div>
        <h3 className="font-display text-3xl font-bold">Apne hisaab se badlo</h3>
        <p className="mt-1 text-ink/70">Tick hata do to receipt turant badal jaati hai.</p>
        <ul className="mt-5 space-y-2">
          {tasks.map((t, i) => (
            <li key={t.label}>
              <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 ${on[i] ? "border-tide bg-white/70" : "border-dashed border-tide/30 opacity-60"}`}>
                <input type="checkbox" className="h-5 w-5 accent-[#235347]" checked={on[i]} onChange={() => setOn((o) => o.map((v, j) => (j === i ? !v : v)))} />
                <span className="flex-1"><span className="block font-semibold">{t.label}</span><span className="font-mono text-xs opacity-70">{t.offset} · {t.hours} hr</span></span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative rotate-1">
        {active.length === 0 ? (
          <p className="hand rounded-3xl border-2 border-dashed border-tide/40 p-8 text-center text-2xl">Abhi kuch nahi. Peaceful hai, enjoy karo.</p>
        ) : (
          <>
            <Receipt
              title={title.toUpperCase()}
              lines={[
                ...active.map((t) => ({ label: t.label, sub: `${t.offset} · ${t.hours} hr`, amount: rupees((rates[t.slug] ?? 150) * 100 * t.hours), stamped: true })),
                { label: "Platform fee", amount: rupees(est.platformFee) },
                { label: "Coordination fee", amount: rupees(est.coordinationFee) },
              ]}
              totalLabel="TOTAL"
              total={<span><Meter prefix="₹" value={Math.round(est.low / 100)} /> - <Meter value={Math.round(est.high / 100)} /></span>}
              foot={`${hours} hrs of helper time. Includes Shell Guarantee. Exact price after human check.`}
              stamp={<Stamp tone="green">VERIFIED</Stamp>}
            />
            <Link href={`/waitlist?msg=${encodeURIComponent(`${title}: ${active.map((t) => t.label).join(", ")}`)}`} className="pill pill-sun mt-5 w-full justify-center" data-cta="pack_order">Order this pack</Link>
          </>
        )}
      </div>
    </div>
  );
}
