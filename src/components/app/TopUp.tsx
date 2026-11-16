"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function TopUp() {
  const router = useRouter();
  const key = useRef(typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random()));
  const [amount, setAmount] = useState(500);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function add() {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/me/wallet", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amountInr: amount, key: key.current }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Something went wrong. Please try again.");
      setMsg(j.duplicate ? "That top-up was already applied." : `Added ₹${amount.toLocaleString("en-IN")} to your wallet.`);
      key.current = crypto.randomUUID();
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-ink/20 bg-paper p-4">
      <h2 className="display text-xl">Add money</h2>
      <p className="mt-1 text-sm opacity-75">Wallet money pays for any plan. Unused expense caps are returned here automatically.</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Top-up amount">
        {[200, 500, 1000, 2000].map((a) => (
          <button key={a} type="button" className="chip" aria-pressed={amount === a} onClick={() => setAmount(a)}>
            ₹{a.toLocaleString("en-IN")}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <label className="sr-only" htmlFor="topup-amt">Amount in rupees</label>
        <input id="topup-amt" className="field !w-32" type="number" min={100} max={20000} step={50} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <button type="button" className="btn btn-forest btn-sm" disabled={busy || amount < 100 || amount > 20000} onClick={add}>
          {busy ? "Adding..." : "Add to wallet"}
        </button>
      </div>
      <p className="mt-2 text-sm" role="status" aria-live="polite">{msg}</p>
    </section>
  );
}
