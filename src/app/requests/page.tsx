import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { StatusChip } from "@/components/orders/StatusChip";

export const metadata = { title: "My requests" };

export default async function Page() {
  const user = await requireUser(["CUSTOMER"], "/login");
  const rows = await db.select().from(bookings).where(eq(bookings.customerId, user.id)).orderBy(desc(bookings.createdAt)).limit(50);
  return (
    <div className="mx-auto max-w-[900px] space-y-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold text-[#0E1A17]">Requests</h1>
      <p className="text-sm text-[#4B5A55]">Every request you make becomes a booking that ops reviews. No fake queue — this is your real history in Dwarka 6/10/12.</p>
      {rows.length === 0 ? (
        <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-10 text-center">
          <p className="text-sm font-semibold text-[#0E1A17]">No requests yet.</p>
          <p className="mt-1 text-xs text-[#4B5A55]">Go to the storefront, pick one of the 4 live services, choose a 2h slot, and submit. Ops will review within 15 mins.</p>
          <Link href="/" className="mt-4 inline-flex min-h-[40px] items-center rounded-[10px] bg-[#0B2B26] px-5 text-xs font-semibold text-white">Browse services</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Link key={r.id} href={`/app/orders/${r.id}`} className="rounded-[12px] border border-[#E3E8E4] bg-white p-4 hover:border-[#0B2B26]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-[#0E1A17]">{r.serviceName}</div>
                  <div className="mt-1 text-xs text-[#4B5A55]">{new Date(r.slotStart).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · {r.address.slice(0, 60)}</div>
                </div>
                <StatusChip status={r.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="rounded-[10px] border border-[#E3E8E4] bg-[#EEF6F0] p-3 text-xs text-[#4B5A55]">
        Need help? <Link href="/contact" className="font-semibold text-[#0B2B26] underline">Contact us</Link> · WhatsApp {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999900000"} · <Link href="/legal/refund-cancellation" className="underline">Refund policy</Link> · <Link href="/legal/privacy" className="underline">Privacy</Link>
      </div>
    </div>
  );
}
