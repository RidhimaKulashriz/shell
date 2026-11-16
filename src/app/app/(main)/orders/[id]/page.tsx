import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { StatusChip } from "@/components/orders/StatusChip";
import { CancelButton } from "@/components/orders/CancelButton";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["CUSTOMER"]);
  const { id } = await params;
  const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!row || row.customerId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-[700px] space-y-4 p-4 md:p-6">
      <Link href="/app/orders" className="text-xs font-semibold text-[#0B2B26] hover:underline">← Back to orders</Link>
      <div className="rounded-[16px] border border-[#E3E8E4] bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-[#0E1A17]">{row.serviceName}</h1>
          <StatusChip status={row.status} />
        </div>
        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between"><span className="text-[#4B5A55]">Quantity</span><span className="font-semibold text-[#0E1A17]">{row.quantity}</span></div>
          <div className="flex justify-between"><span className="text-[#4B5A55]">Subtotal</span><span>Rs {row.subtotal}</span></div>
          <div className="flex justify-between"><span className="text-[#4B5A55]">Platform fee</span><span>Rs {row.platformFee}</span></div>
          {row.discount > 0 && <div className="flex justify-between text-[#1E8E5A]"><span>Discount</span><span>-Rs {row.discount}</span></div>}
          <div className="flex justify-between border-t border-[#E3E8E4] pt-2 text-base font-bold text-[#0E1A17]"><span>Total</span><span>Rs {row.total}</span></div>
        </div>
        <div className="mt-4 rounded-[12px] bg-[#F7F8F6] p-4 text-sm">
          <div className="font-semibold text-[#0E1A17]">Slot</div>
          <div className="text-xs text-[#4B5A55]">{new Date(row.slotStart).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} — {new Date(row.slotEnd).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", timeStyle: "short" })}</div>
          <div className="mt-3 font-semibold text-[#0E1A17]">Address</div>
          <div className="text-xs text-[#4B5A55]">{row.address}</div>
          <div className="mt-2 text-[11px] text-[#7C8A85]">Dwarka Sectors 6, 10, 12 only · 2h window 8am–8pm</div>
        </div>
        {row.status !== "CANCELLED" && row.status !== "COMPLETED" && (
          <div className="mt-4 rounded-[12px] border border-[#E3E8E4] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#0B2B26]">Door OTP</div>
            <div className="mt-1 font-mono text-2xl font-bold tracking-widest text-[#0B2B26]">{process.env.ALLOW_DEV_OTP === "true" ? row.doorOtpPlain ?? "—" : "Available at booking"}</div>
            <p className="mt-1 text-xs text-[#4B5A55]">Share this with the helper at the door to start the job. 4-digit, 5 tries max, then locked.</p>
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <CancelButton id={row.id} status={row.status} />
          <Link href="/app/orders" className="inline-flex min-h-[40px] items-center rounded-[10px] border border-[#E3E8E4] bg-white px-4 text-xs font-semibold text-[#4B5A55] hover:bg-[#F7F8F6]">Back</Link>
        </div>
        {row.status !== "RECEIVED" && <p className="mt-2 text-xs text-[#7C8A85]">Cancel is allowed only when status is RECEIVED.</p>}
      </div>
    </div>
  );
}
