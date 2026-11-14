import { Stamp } from "@/components/ui";

export type HelperCardData = { name: string; level: string; rating: number; jobsDone: number; languages: string[]; goodAt: string[]; voiceIntro: string; why?: string; verified?: boolean };

/** Meet Your Helper: intro, languages, good-at tags, verification badges, and a plain-language reason. */
export function HelperCard({ h, compact = false }: { h: HelperCardData; compact?: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-paper p-3">
      <div className="flex items-center gap-3">
        <span className="display grid h-14 w-14 place-items-center rounded-2xl border-2 border-ink bg-sand text-2xl">{h.name[0]}</span>
        <div className="min-w-0"><b className="display text-xl">{h.name.split(" ")[0]}</b><div className="mono text-xs">{h.level} · {h.rating ? h.rating.toFixed(1) : "new"} · {h.jobsDone} jobs</div><div className="mono text-xs opacity-70">{h.languages.join(", ")}</div></div>
        {h.verified !== false && <div className="ml-auto flex flex-col gap-1"><Stamp label="ID" rot={-4} /><Stamp label="College" rot={3} /></div>}
      </div>
      {!compact && (<>
        <div className="mt-2 flex flex-wrap gap-1.5">{h.goodAt.map((g) => <span key={g} className="washi">{g}</span>)}</div>
        {h.voiceIntro && <p className="mt-2 rounded-xl bg-cream p-2 text-sm"><span className="mono mr-1 text-[10px] uppercase opacity-60">20s intro</span>&ldquo;{h.voiceIntro}&rdquo;</p>}
      </>)}
      {h.why && <p className="mt-2 text-sm"><b>Why we picked:</b> {h.why}</p>}
    </div>
  );
}
