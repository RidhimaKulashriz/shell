import type { ReactNode } from "react";

export function Tile({ label, value, tone = "paper", hint }: { label: string; value: ReactNode; tone?: "paper" | "red" | "sand" | "sage"; hint?: string }) {
  const bg = tone === "red" ? "bg-brick text-cream" : tone === "sand" ? "bg-sand" : tone === "sage" ? "bg-sage" : "bg-cream";
  return <div className={`rounded-xl border border-ink/20 p-3 ${bg}`}><div className="mono text-[10px] uppercase tracking-wider opacity-70">{label}</div><div className="display text-3xl">{value}</div>{hint && <div className="text-xs opacity-70">{hint}</div>}</div>;
}

export function Table({ cols, rows, empty = "Nothing here." }: { cols: string[]; rows: ReactNode[][]; empty?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/20 bg-cream">
      <table className="w-full min-w-[560px] text-left text-[13px]">
        <thead className="bg-forest text-cream"><tr>{cols.map((c) => <th key={c} className="px-3 py-2 font-semibold">{c}</th>)}</tr></thead>
        <tbody className="divide-y divide-ink/15">{rows.length === 0 && <tr><td className="px-3 py-6 text-center hand text-xl" colSpan={cols.length}>{empty}</td></tr>}{rows.map((r, i) => <tr key={i} className="align-top hover:bg-sand/40">{r.map((c, j) => <td key={j} className="px-3 py-2">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export const H1 = ({ children, sub }: { children: ReactNode; sub?: string }) => <div className="mb-4"><h1 className="display text-3xl">{children}</h1>{sub && <p className="text-sm opacity-70">{sub}</p>}</div>;
export const Badge = ({ children, tone = "ink" }: { children: ReactNode; tone?: "ink" | "red" | "green" }) => <span className={`stamp ${tone === "red" ? "stamp-brick" : ""} !text-[10px]`}>{children}</span>;
