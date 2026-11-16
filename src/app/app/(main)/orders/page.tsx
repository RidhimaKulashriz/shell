import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { StatusChip } from "@/components/orders/StatusChip";

export const metadata = { title: "Orders" };

export default async function Page({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const user = await requireUser(["CUSTOMER"]);
  const f = (await searchParams).f ?? "all";
  const rows = await db.select().from(bookings).where(eq(bookings.customerId, user.id)).orderBy(desc(bookings.createdAt));
  const filtered = rows.filter((r) => {
    if (f === "all") return true;
    if (f === "active") return ["RECEIVED", "ASSIGNED", "IN_PROGRESS"].includes(r.status);
    if (f === "completed") return r.status === "COMPLETED";
    if (f === "cancelled") return r.status === "CANCELLED";
    return true;
  });

  return (
    <div className="mx-auto max-w-[900px] space-y-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold tracking-tight text-[#0E1A17]">My orders</h1>
      <div className="flex flex-wrap gap-2">
        {["all", "active", "completed", "cancelled"].map((x) => (
          <Link key={x} href={`/app/orders?f=${x}`} className={`min-h-[36px] rounded-[10px] border px-3 py-1.5 text-xs font-semibold capitalize ${f === x ? "border-[#0B2B26] bg-[#0B2B26] text-white" : "border-[#E3E8E4] bg-white text-[#4B5A55] hover:border-[#0B2B26]"}`}>{x}</Link>
        ))}
      </div>
      {filtered.length === 0 && <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-12 text-center"><p className="text-sm font-semibold text-[#0E1A17]">No orders yet.</p><p className="mt-1 text-xs text-[#4B5A55]">Book one of the 4 live services from the storefront. Dwarka Sectors 6, 10, 12 · Scheduled slots 8am–8pm.</p></div>}
      <div className="grid gap-3">
        {filtered.map((r) => (
          <Link key={r.id} href={`/app/orders/${r.id}`} className="flex flex-col justify-between rounded-[12px] border border-[#E3E8E4] bg-white p-4 hover:border-[#0B2B26]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-[#0E1A17]">{r.serviceName}</div>
                <div className="mt-1 text-xs text-[#4B5A55]">{new Date(r.slotStart).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} — {new Date(r.slotEnd).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" })} · {r.address}</div>
                <div className="mt-1 text-xs font-medium text-[#0E1A17]">Rs {r.total} · Qty {r.quantity}</div>
              </div>
              <StatusChip status={r.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
