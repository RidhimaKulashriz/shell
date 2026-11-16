import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { bookings, helpers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { StatusChip } from "@/components/orders/StatusChip";
import { HelperActions } from "./HelperActions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["HELPER"], "/earn/login");
  const { id } = await params;
  const [h] = await db.select().from(helpers).where(eq(helpers.userId, user.id)).limit(1);
  if (!h) notFound();
  const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!row || row.helperId !== h.id) notFound();

  return (
    <div className="space-y-4">
      <a href="/earn/portal" className="text-xs font-semibold text-[#0B2B26] hover:underline">← Back to jobs</a>
      <div className="rounded-[16px] border border-[#E3E8E4] bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-lg font-bold text-[#0E1A17]">{row.serviceName}</h1>
          <StatusChip status={row.status} />
        </div>
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-[#4B5A55]">Qty</span><span className="font-semibold">{row.quantity}</span></div>
          <div className="flex justify-between"><span className="text-[#4B5A55]">Total</span><span className="font-bold">Rs {row.total}</span></div>
          <div className="flex justify-between"><span className="text-[#4B5A55]">Slot IST</span><span>{new Date(row.slotStart).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} — {new Date(row.slotEnd).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}</span></div>
          <div className="pt-2 text-xs text-[#4B5A55]">{row.address} · {row.lat.toFixed(4)},{row.lng.toFixed(4)}</div>
        </div>
        <HelperActions booking={{ id: row.id, status: row.status, otpFailures: row.otpFailures }} />
      </div>
    </div>
  );
}
