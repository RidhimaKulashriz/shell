"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function PayActions({ bookingId, total, paymentStatus }: { bookingId: string; total: number; paymentStatus: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [upi, setUpi] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const pay = async (method: "UPI" | "RAZORPAY") => {
    setBusy(method);
    setMsg("");
    try {
      const r = await fetch(`/api/bookings/${bookingId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Payment failed");
      if (j.upiString) setUpi(j.upiString);
      if (j.orderId) setOrderId(j.orderId);
      setMsg(j.message ?? `Payment ${method} initiated. Status: ${j.paymentStatus ?? "PENDING"}`);
      router.refresh();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (paymentStatus === "PAID") {
    return <div className="rounded-[12px] border border-[#A7F3D0] bg-[#ECFDF5] p-4 text-sm font-semibold text-[#065F46]">Payment confirmed — PAID. Receipt on the way via SMS.</div>;
  }

  return (
    <div className="space-y-3 rounded-[12px] border border-[#E3E8E4] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-[#0E1A17]">Pay Rs {total}</div>
        <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-semibold text-[#92400E]">{paymentStatus}</span>
      </div>
      <p className="text-xs text-[#4B5A55]">UPI pending by default for Dwarka pilot. Choose UPI (QR) or Razorpay test. Webhook marks PAID idempotently.</p>
      <div className="flex flex-wrap gap-2">
        <button disabled={!!busy} onClick={() => pay("UPI")} className="min-h-[40px] rounded-[10px] bg-[#0B2B26] px-4 text-xs font-semibold text-white disabled:opacity-60">
          {busy === "UPI" ? "…" : "Pay via UPI (QR)"}
        </button>
        <button disabled={!!busy} onClick={() => pay("RAZORPAY")} className="min-h-[40px] rounded-[10px] border border-[#0B2B26] bg-white px-4 text-xs font-semibold text-[#0B2B26] disabled:opacity-60">
          {busy === "RAZORPAY" ? "…" : "Razorpay test order"}
        </button>
      </div>
      {upi && (
        <div className="rounded-[10px] bg-[#F7F8F6] p-3">
          <div className="text-xs font-semibold text-[#0E1A17]">UPI string (scan in any UPI app)</div>
          <div className="mt-1 break-all font-mono text-xs text-[#0B2B26]">{upi}</div>
          <div className="mt-2 text-[11px] text-[#7C8A85]">After paying, ops/webhook will mark PAID. For testing, use Razorpay test webhook below.</div>
        </div>
      )}
      {orderId && (
        <div className="rounded-[10px] bg-[#F7F8F6] p-3">
          <div className="text-xs font-semibold text-[#0E1A17]">Razorpay test order</div>
          <div className="mt-1 font-mono text-xs break-all">{orderId}</div>
          <div className="mt-1 text-[11px] text-[#7C8A85]">Test webhook: POST /api/webhooks/razorpay with {"{"}"event":"payment.captured","payload": {"{"}"payment": {"{"}"entity": {"{"}"order_id":"{orderId}","id":"pay_test_123","status":"captured","notes": {"{"}"bookingId":"{bookingId}"{"}"}{"}"}{"}"}{"}"}{"}"}</div>
        </div>
      )}
      {msg && <p className="text-xs font-semibold text-[#0B2B26]">{msg}</p>}
    </div>
  );
}
