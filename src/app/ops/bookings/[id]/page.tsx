import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { auditLogs, bookings, helpers } from "@/db/schema";
import { StatusChip } from "@/components/orders/StatusChip";
import { PaymentChip } from "@/components/payments/PaymentChip";
import { OpsActions } from "./OpsActions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!row) notFound();
  const helperList = await db.select().from(helpers).where(eq(helpers.status, "active")).limit(50);
  const logs = await db.select().from(auditLogs).where(eq(auditLogs.entityId, row.id)).orderBy(auditLogs.ts).limit(50);
  const helper = helperList.find((h) => h.id === row.helperId);
  return (
    <div className="mx-auto max-w-[800px] space-y-4">
      <a href="/ops/bookings" className="text-xs font-semibold text-[#0B2B26] hover:underline">← Back to bookings</a>
      <div className="rounded-[16px] border border-[#E3E8E4] bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-lg font-bold text-[#0E1A17]">{row.serviceName} ×{row.quantity}</h1>
          <div className="flex flex-col items-end gap-2">
            <StatusChip status={row.status} />
            <PaymentChip status={row.paymentStatus} />
          </div>
        </div>
        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between"><span className="text-[#4B5A55]">Booking ID</span><span className="font-mono">{row.id}</span></div>
          <div className="flex justify-between"><span className="text-[#4B5A55]">Customer</span><span className="font-mono text-xs">{row.customerId.slice(0, 8)}</span></div>
          <div className="flex justify-between"><span className="text-[#4B5A55]">Slot IST</span><span>{new Date(row.slotStart).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} — {new Date(row.slotEnd).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}</span></div>
          <div className="flex justify-between"><span className="text-[#4B5A55]">Address</span><span>{row.address} ({row.lat.toFixed(4)},{row.lng.toFixed(4)})</span></div>
          <div className="flex justify-between"><span className="text-[#4B5A55]">Total</span><span className="font-bold">Rs {row.total} (subtotal Rs {row.subtotal} + fee Rs {row.platformFee} {row.discount ? `- discount Rs ${row.discount}` : ""})</span></div>
          {helper && <div className="flex justify-between"><span className="text-[#4B5A55]">Assigned helper</span><span className="font-semibold">{helper.displayName} · {helper.level}</span></div>}
          <div className="flex justify-between"><span className="text-[#4B5A55]">Payment</span><span className="font-semibold">{row.paymentStatus} {row.paymentMethod ? `· ${row.paymentMethod}` : ""} {row.razorpayOrderId ? `· ${row.razorpayOrderId.slice(0, 16)}…` : ""}</span></div>
          {row.paidAt && <div className="flex justify-between"><span className="text-[#4B5A55]">Paid at</span><span>{new Date(row.paidAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span></div>}
          {row.webhookEvents?.length ? <div className="text-[11px] text-[#7C8A85]">Webhook events: {row.webhookEvents.map((e: any) => e.id).join(", ").slice(0, 80)}</div> : null}
        </div>
        <div className="mt-4 rounded-[10px] border border-[#E3E8E4] bg-[#F7F8F6] p-3 text-xs">
          <div className="font-semibold text-[#0B2B26]">Door OTP hash</div>
          <div className="font-mono break-all">{row.doorOtpHash}</div>
          {row.doorOtpPlain && <div className="mt-1 text-[#1E8E5A]">DEV OTP (ALLOW_DEV_OTP=true): {row.doorOtpPlain}</div>}
          <div className="mt-1 text-[#7C8A85]">Failures: {row.otpFailures}/5</div>
        </div>
        <OpsActions booking={row} helpers={helperList.map((h) => ({ id: h.id, name: h.displayName }))} />
      </div>
      <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-4">
        <h2 className="text-sm font-bold text-[#0E1A17]">Audit log</h2>
        {logs.length === 0 ? <p className="mt-2 text-xs text-[#7C8A85]">No actions yet.</p> : <ul className="mt-2 space-y-1 text-xs">{logs.map((l) => <li key={l.id} className="flex justify-between gap-2"><span>{new Date(l.ts!).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · {l.action} · {l.entity} {l.entityId?.slice(0, 8)}</span><span className="font-mono text-[#7C8A85]">{l.actorId?.slice(0, 8)}</span></li>)}</ul>}
      </div>
    </div>
  );
}
