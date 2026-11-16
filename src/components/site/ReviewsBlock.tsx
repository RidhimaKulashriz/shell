import { db } from "@/db";
import { reviews } from "@/db/schema";
import { count, desc } from "drizzle-orm";

export async function ReviewsBlock() {
  const [{ n }] = await db.select({ n: count() }).from(reviews).limit(1);
  const total = Number(n);
  // Only show real reviews when we have 5+ — no fake data
  if (total < 5) {
    return (
      <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-6">
        <h3 className="text-sm font-bold text-[#0E1A17]">Reviews</h3>
        <p className="mt-2 text-sm text-[#4B5A55]">No verified reviews yet — we show reviews only after 5+ real jobs are rated. Dwarka pilot just launched; your review will be the first.</p>
        <p className="mt-2 text-xs text-[#7C8A85]">Rework free within 24 hours. If it’s not right, we send someone back at no cost.</p>
      </div>
    );
  }
  const rows = await db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(6);
  const avg = rows.reduce((s, r) => s + r.rating, 0) / rows.length;
  return (
    <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-6">
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-bold text-[#0E1A17]">Verified reviews</h3>
        <span className="text-xs font-semibold text-[#1E8E5A]">{avg.toFixed(1)} avg · {total} total</span>
      </div>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-[10px] bg-[#F7F8F6] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0B2B26]">
              <span>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              <span className="text-[#4B5A55]">{r.tags?.slice(0, 3).join(" · ")}</span>
            </div>
            {r.note && <p className="mt-1 text-sm text-[#0E1A17]">{r.note}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-[#7C8A85]">24h free rework on every job. Photos + timestamps are the evidence.</p>
    </div>
  );
}
