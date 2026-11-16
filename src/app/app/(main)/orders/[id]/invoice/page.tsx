import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { addresses, payments, plans, societies, tasks, towers, users } from "@/db/schema";
import { PrintButton } from "@/components/PrintButton";
import { requireUser } from "@/lib/auth";
import { activePricing } from "@/lib/data";
import { fmtDateTime, inr } from "@/lib/format";

export const metadata = { title: "GST invoice" };

// Prices are GST-inclusive. Shell is registered in Delhi, so services to Delhi addresses carry CGST + SGST.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["CUSTOMER"]);
  const { id } = await params;
  const [plan] = await db.select().from(plans).where(and(eq(plans.id, id), eq(plans.customerId, user.id))).limit(1);
  if (!plan || ["draft", "sent", "rejected"].includes(plan.status)) notFound();
  const [ts, pays, [me], cfg] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.planId, plan.id)).orderBy(asc(tasks.sequence)),
    db.select().from(payments).where(eq(payments.planId, plan.id)),
    db.select().from(users).where(eq(users.id, user.id)).limit(1),
    activePricing(),
  ]);
  const [addr] = plan.addressId ? await db.select().from(addresses).where(eq(addresses.id, plan.addressId)).limit(1) : [];
  const [soc] = addr ? await db.select().from(societies).where(eq(societies.id, addr.societyId)).limit(1) : [];
  const [tw] = addr?.towerId ? await db.select().from(towers).where(eq(towers.id, addr.towerId)).limit(1) : [];
  const paid = pays.filter((p) => p.status === "captured");
  const invoiceNo = `SH/${(plan.paidAt ?? plan.createdAt).getFullYear()}/${plan.id.slice(0, 8).toUpperCase()}`;
  const gross = plan.total;
  const gstPct = cfg.gstPct;
  const taxable = Math.round(gross / (1 + gstPct));
  const gst = gross - taxable;
  const half = Math.floor(gst / 2);
  const lines = ts.filter((t) => t.status !== "cancelled");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden"><h1 className="display text-3xl">GST invoice</h1><PrintButton /></div>
      <article className="receipt text-[13px]" aria-label={`Invoice ${invoiceNo}`}>
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="display text-2xl">SHELL</div><p className="text-[11px] opacity-70">Shell Services Pvt. Ltd. (template details)<br />GSTIN: 07AAAAA0000A1Z5 (placeholder) · SAC 998599</p></div>
          <div className="text-right"><div className="font-bold">Tax invoice</div><div>{invoiceNo}</div><div className="text-[11px] opacity-70">Issued {fmtDateTime(plan.paidAt ?? plan.createdAt)}</div></div>
        </header>
        <div className="perf" />
        <p className="text-[11px] uppercase tracking-widest opacity-60">Billed to</p>
        <p>{me?.name}<br />{[addr?.flat && `Flat ${addr.flat}`, tw?.name, soc?.name, soc?.city].filter(Boolean).join(", ")}</p>
        <div className="perf" />
        {lines.map((t) => <div key={t.id} className="receipt-line"><span>{t.name}</span><span className="leader" /><span>{inr(t.price)}</span></div>)}
        {plan.travelAmount > 0 && <div className="receipt-line"><span>Travel</span><span className="leader" /><span>{inr(plan.travelAmount)}</span></div>}
        <div className="receipt-line"><span>Platform fee</span><span className="leader" /><span>{inr(plan.platformFee)}</span></div>
        {plan.coordinationFee > 0 && <div className="receipt-line"><span>Coordination fee</span><span className="leader" /><span>{inr(plan.coordinationFee)}</span></div>}
        <div className="perf" />
        <div className="receipt-line"><span>Taxable value</span><span className="leader" /><span>{inr(taxable)}</span></div>
        <div className="receipt-line"><span>CGST @ {(gstPct * 50).toFixed(1)}%</span><span className="leader" /><span>{inr(half)}</span></div>
        <div className="receipt-line"><span>SGST @ {(gstPct * 50).toFixed(1)}%</span><span className="leader" /><span>{inr(gst - half)}</span></div>
        <div className="receipt-line font-bold"><span>Total (incl. GST)</span><span className="leader" /><span>{inr(gross)}</span></div>
        <div className="perf" />
        <p className="text-[11px] opacity-70">Payment: {paid.length ? paid.map((p) => `${p.method ?? "online"} ${inr(p.amount)}${p.creditsUsed ? ` + credits ${inr(p.creditsUsed)}` : ""}`).join(", ") : "pending"}. Prices shown to you were GST-inclusive. This is a computer-generated template invoice and needs your accountant&apos;s review before filing.</p>
      </article>
    </div>
  );
}
