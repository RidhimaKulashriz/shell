export function PaymentChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
    PAID: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
    FAILED: "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]",
  };
  const cls = map[status] ?? "bg-white text-[#4B5A55] border-[#E3E8E4]";
  return <span className={`inline-flex min-h-[24px] items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}
