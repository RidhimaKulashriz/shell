export function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    RECEIVED: { label: "Received", cls: "bg-[#F2C318] text-[#0B2B26] border-[#E3B000]" },
    ASSIGNED: { label: "Assigned", cls: "bg-[#2563A8] text-white border-[#1D4F8A]" },
    IN_PROGRESS: { label: "In progress", cls: "bg-[#1E8E5A] text-white border-[#166A44]" },
    COMPLETED: { label: "Completed", cls: "bg-[#0B2B26] text-white border-[#0B2B26]" },
    CANCELLED: { label: "Cancelled", cls: "bg-[#E3E8E4] text-[#4B5A55] border-[#E3E8E4]" },
  };
  const m = map[status] ?? { label: status, cls: "bg-white text-[#4B5A55] border-[#E3E8E4]" };
  return <span className={`inline-flex min-h-[24px] items-center rounded-[6px] border px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>{m.label}</span>;
}
