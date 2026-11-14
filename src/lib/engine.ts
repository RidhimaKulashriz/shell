// Plan engine: turns free text (English, Hindi, Hinglish) into a draft list of catalog tasks.
// Runs on both server and client. It never sets prices. Prices come from pricing.ts.
import { BANNED_KEYWORDS, type CatalogItem, type CatalogQuestion } from "./catalog";
import type { DraftLine, Question } from "@/db/schema";

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

export function detectBanned(text: string): string | null {
  const t = " " + norm(text) + " ";
  for (const k of BANNED_KEYWORDS) if (t.includes(" " + norm(k) + " ") || t.includes(" " + norm(k))) {
    if (k === "spa" && !t.includes(" spa ")) continue;
    return k;
  }
  const tokens = t.trim().split(" ");
  for (const tok of tokens) if (tok.length >= 7) for (const k of ["massage", "homework", "makeup"]) if (lev(tok, k) <= 1) return k;
  return null;
}

type Match = { item: CatalogItem; confidence: number };

export function matchTasks(text: string, catalog: CatalogItem[]): Match[] {
  const t = " " + norm(text) + " ";
  const tokens = t.trim().split(" ");
  const out: Match[] = [];
  for (const item of catalog) {
    let best = 0;
    for (const kw of item.keywords) {
      const k = norm(kw);
      if (k.includes(" ")) { if (t.includes(" " + k + " ")) best = Math.max(best, 0.92); continue; }
      for (const tok of tokens) {
        if (tok === k) best = Math.max(best, 0.9);
        else if (k.length >= 6 && tok.length >= 6 && lev(tok, k) <= 1) best = Math.max(best, 0.7);
        else if (k.length >= 5 && tok.length > k.length && tok.startsWith(k)) best = Math.max(best, 0.75);
      }
    }
    if (best > 0) out.push({ item, confidence: best });
  }
  // "tutor"/"explain" should not also trigger "event help" from "guests"; keep as is but dedupe homework-like collisions
  return out.sort((a, b) => b.confidence - a.confidence);
}

export function extractQuantity(text: string, item: CatalogItem): number | undefined {
  const t = norm(text);
  if (item.unit === "room") {
    const bhk = t.match(/(\d)\s*bhk/);
    if (bhk) return Number(bhk[1]) + 1;
    const r = t.match(/(\d+)\s*(rooms?|bedrooms?)/);
    if (r) return Math.min(Number(r[1]), 12);
  }
  if (item.unit === "hour") {
    const h = t.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr)\b/);
    if (h) return Math.max(1, Math.min(Math.round(Number(h[1])), 12));
  }
  return undefined;
}

export function draftFromText(text: string, catalog: CatalogItem[]): { lines: DraftLine[]; banned: string | null } {
  const banned = detectBanned(text);
  if (banned) return { lines: [], banned };
  const lines: DraftLine[] = matchTasks(text, catalog).map(({ item, confidence }) => ({
    slug: item.slug, quantity: extractQuantity(text, item) ?? item.qty, size: "medium", confidence,
  }));
  return { lines, banned: null };
}

const MAX_QUESTIONS = 3;

export function questionsFor(lines: DraftLine[], catalog: CatalogItem[], rawText: string): Question[] {
  const qs: Question[] = [];
  for (const l of lines) {
    const item = catalog.find((c) => c.slug === l.slug);
    if (!item) continue;
    for (const q of item.questions as CatalogQuestion[]) {
      if (q.affects === "quantity" && extractQuantity(rawText, item) !== undefined) continue;
      if (qs.length < MAX_QUESTIONS) qs.push({ key: `${l.slug}:${q.key}`, slug: l.slug, text: q.text, chips: q.chips });
    }
  }
  return qs;
}

export function applyAnswers(lines: DraftLine[], answers: Record<string, string>, catalog: CatalogItem[]): DraftLine[] {
  return lines.map((l) => {
    const item = catalog.find((c) => c.slug === l.slug);
    if (!item) return l;
    const next = { ...l };
    for (const q of item.questions) {
      const a = answers[`${l.slug}:${q.key}`];
      if (!a || a === "skip") continue;
      if (q.affects === "quantity") next.quantity = Math.max(1, Number(a) || next.quantity);
      if (q.affects === "size") next.size = a;
      if (q.affects === "cap") next.cap = Number(a) * 100;
    }
    return next;
  });
}
