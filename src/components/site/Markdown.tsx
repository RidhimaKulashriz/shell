import type { ReactNode } from "react";
import { slugify } from "@/lib/format";

/** Tiny MDX-flavoured markdown renderer: ## headings, numbered and bullet lists, paragraphs, **bold**. */
export function headingsOf(body: string) {
  return body.split("\n").filter((l) => l.startsWith("## ")).map((l) => ({ text: l.slice(3), id: slugify(l.slice(3)) }));
}
const inline = (t: string): ReactNode[] => t.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : p));

export function Markdown({ body }: { body: string }) {
  const out: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    out.push(<Tag key={out.length} className={`my-4 space-y-2 pl-6 ${list.ordered ? "list-decimal" : "list-disc"}`}>{list.items.map((x, i) => <li key={i}>{inline(x)}</li>)}</Tag>);
    list = null;
  };
  for (const raw of body.split("\n")) {
    const l = raw.trimEnd();
    if (!l.trim()) { flush(); continue; }
    if (l.startsWith("## ")) { flush(); out.push(<h2 id={slugify(l.slice(3))} key={out.length} className="display mt-10 scroll-mt-24 text-3xl">{l.slice(3)}</h2>); continue; }
    const num = l.match(/^\d+\.\s+(.*)/);
    const bul = l.match(/^[-*]\s+(.*)/);
    if (num) { if (!list || !list.ordered) { flush(); list = { ordered: true, items: [] }; } list.items.push(num[1]); continue; }
    if (bul) { if (!list || list.ordered) { flush(); list = { ordered: false, items: [] }; } list.items.push(bul[1]); continue; }
    flush();
    out.push(<p key={out.length} className="my-4 text-lg leading-relaxed">{inline(l)}</p>);
  }
  flush();
  return <>{out}</>;
}
