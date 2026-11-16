import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { StatusChip } from "@/components/orders/StatusChip";

const TABS = ["all", "RECEIVED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = ((await searchParams).tab ?? "all").toUpperCase();
  const rows = tab === "ALL" ? await db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(100) : await db.select().from(bookings).where(eq(bookings.status, tab)).orderBy(desc(bookings.createdAt)).limit(100);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#0E1A17]">Bookings — Ops</h1>
      <p className="text-xs text-[#4B5A55]">Dwarka 6/10/12 · 2h slots 8am–8pm · max 3/slot · server price · door OTP audit</p>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t} href={t === "all" ? "/ops/bookings" : `/ops/bookings?tab=${t}`} className={`min-h-[36px] rounded-[10px] border px-3 py-1.5 text-xs font-semibold capitalize ${tab === t.toUpperCase() ? "border-[#0B2B26] bg-[#0B2B26] text-white" : "border-[#E3E8E4] bg-white text-[#4B5A55] hover:border-[#0B2B26]"}`}>{t.toLowerCase()}</Link>
        ))}
      </div>
      {rows.length === 0 && <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-10 text-center text-sm text-[#4B5A55]">No bookings in this tab — honest empty state.</div>}
      <div className="overflow-auto rounded-[12px] border border-[#E3E8E4] bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F8F6] text-[#4B5A55]"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Service</th><th className="px-3 py-2">Slot (IST)</th><th className="px-3 py-2">Address</th><th className="px-3 py-2">Total</th><th className="px-3 py-2">Status</th></tr></thead>
          <tbody className="divide-y divide-[#E3E8E4]">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-[#F7F8F6]">
                <td className="px-3 py-2 font-mono"><Link href={`/ops/bookings/${r.id}`} className="font-semibold text-[#0B2B26] hover:underline">{r.id.slice(0, 8)}</Link></td>
                <td className="px-3 py-2">{r.serviceName} ×{r.quantity}</td>
                <td className="px-3 py-2">{new Date(r.slotStart).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}-{new Date(r.slotEnd).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" })}</td>
                <td className="px-3 py-2 max-w-[200px] truncate">{r.address}</td>
                <td className="px-3 py-2">Rs {r.total}</td>
                <td className="px-3 py-2"><StatusChip status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
