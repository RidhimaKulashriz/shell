"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBasket, Bell } from "lucide-react";

export default function GroceriesPage() {
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setErr("Enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits, serviceSlug: "groceries" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed.");
      setSent(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#0E1A17]">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <Link href="/" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] border border-[#E3E8E4] bg-white px-3 text-xs font-semibold text-[#0E1A17] hover:bg-[#EEF6F0]">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Back to home
        </Link>

        <div className="mx-auto mt-8 max-w-2xl rounded-[16px] border border-[#E3E8E4] bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#EEF6F0] text-[#0B2B26]">
            <ShoppingBasket className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#0E1A17]">Groceries &amp; daily essentials</h1>
          <p className="mt-2 text-sm text-[#4B5A55]">Coming soon in Dwarka Sectors 6, 10, 12. We are opening home services first with scheduled slots, then groceries with your local stores.</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-[6px] bg-[#F2C318] px-3 py-1 text-xs font-bold text-[#0B2B26]">Pilot phase — services first</div>

          <div className="mt-8 rounded-[12px] border border-[#E3E8E4] bg-[#F7F8F6] p-5 text-left">
            <h2 className="text-sm font-bold text-[#0E1A17]">Get notified when groceries go live</h2>
            <p className="mt-1 text-xs text-[#4B5A55]">Leave your number and we will text you when groceries open in your sector. No spam.</p>
            {!sent ? (
              <div className="mt-4">
                <div className="flex gap-2">
                  <div className="flex flex-1 gap-2">
                    <span className="inline-flex min-h-[44px] items-center rounded-[10px] border border-[#E3E8E4] bg-white px-3 text-sm font-semibold text-[#0E1A17]">+91</span>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="98765 43210" className="min-h-[44px] flex-1 rounded-[10px] border border-[#E3E8E4] bg-white px-3 text-sm placeholder:text-[#7C8A85] focus:border-[#0B2B26] focus:outline-none" />
                  </div>
                  <button type="button" disabled={busy} onClick={submit} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] bg-[#0B2B26] px-5 text-sm font-semibold text-white hover:bg-[#163832] disabled:opacity-60">
                    <Bell className="h-4 w-4 text-[#F2C318]" strokeWidth={1.75} />
                    {busy ? "..." : "Notify me"}
                  </button>
                </div>
                {err && <p className="mt-2 text-xs font-semibold text-[#C2362B]">{err}</p>}
              </div>
            ) : (
              <div className="mt-4 rounded-[10px] bg-[#EEF6F0] p-3 text-sm font-semibold text-[#1E8E5A]">Done. We will notify you when groceries go live in Dwarka.</div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs">
            <Link href="/services" className="inline-flex min-h-[44px] items-center rounded-[10px] bg-[#0B2B26] px-5 text-sm font-semibold text-white hover:bg-[#163832]">Browse 4 live services</Link>
            <Link href="/" className="inline-flex min-h-[44px] items-center rounded-[10px] border border-[#E3E8E4] bg-white px-5 text-sm font-semibold text-[#0E1A17] hover:bg-[#F7F8F6]">Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
