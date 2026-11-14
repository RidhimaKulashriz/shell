// Client-side keyword engine for the home-page composer demo.
// Hindi, English and Hinglish keywords map to catalog slugs. No API cost.

import { BANNED_KEYWORDS } from "./catalog";

export type Match = { slug: string; label: string; hours: number; min: number; max: number };

type Rule = { slug: string; label: string; hours: number; min: number; max: number; words: string[] };

const RULES: Rule[] = [
  { slug: "house-cleaning", label: "Ghar ki safai", hours: 3, min: 450, max: 900, words: ["saaf", "safai", "clean", "cleaning", "jhaadu", "jhadu", "pocha", "mop", "dusting", "सफाई", "साफ"] },
  { slug: "utensils", label: "Bartan", hours: 1, min: 150, max: 300, words: ["bartan", "utensil", "dishes", "बर्तन"] },
  { slug: "groceries", label: "Groceries", hours: 1.5, min: 180, max: 350, words: ["grocer", "sabzi", "sabji", "kirana", "vegetable", "milk", "doodh", "ration", "सब्जी"] },
  { slug: "wardrobe-organising", label: "Wardrobe organise", hours: 2, min: 500, max: 1000, words: ["wardrobe", "almirari", "almari", "cupboard", "closet", "kapde", "अलमारी"] },
  { slug: "decoration", label: "Decoration", hours: 2, min: 600, max: 1500, words: ["decoration", "decorate", "balloon", "party", "birthday", "sajaavat", "sajawat", "सजावट"] },
  { slug: "parcel-pickup-drop", label: "Parcel pickup", hours: 0.75, min: 99, max: 250, words: ["parcel", "courier", "package", "amazon"] },
  { slug: "excel-data-help", label: "Excel help", hours: 2, min: 400, max: 1000, words: ["excel", "spreadsheet", "pivot", "formula"] },
  { slug: "tutoring-explaining", label: "Padhai samjhana", hours: 1, min: 250, max: 600, words: ["padhai", "tutor", "teach", "explain", "maths", "exam", "पढ़ाई"] },
  { slug: "pet-walking", label: "Pet walking", hours: 0.5, min: 99, max: 200, words: ["dog", "kutta", "kutte", "pet walk", "walk the"] },
  { slug: "event-help", label: "Event help", hours: 3, min: 700, max: 1800, words: ["guests", "guest", "mehmaan", "mehman", "function", "pooja", "aa rahe"] },
  { slug: "moving-shifting-help", label: "Shifting help", hours: 5, min: 1500, max: 4000, words: ["shifting", "moving", "packing", "unpack", "shift"] },
  { slug: "errands", label: "Chhote kaam", hours: 1, min: 120, max: 350, words: ["errand", "chemist", "stationery", "tailor"] },
  { slug: "queueing", label: "Line mein lagna", hours: 2, min: 150, max: 500, words: ["queue", "token", "line mein"] },
];

export type EngineResult =
  | { kind: "match"; items: Match[]; totalMin: number; totalMax: number; hours: number }
  | { kind: "banned"; word: string }
  | { kind: "none" };

export function normalise(text: string): string {
  return text.toLowerCase().replace(/[.,!?;:]/g, " ").replace(/\s+/g, " ").trim();
}

export function runKeywordEngine(text: string): EngineResult {
  const t = normalise(text);
  if (!t) return { kind: "none" };
  const banned = BANNED_KEYWORDS.find((w) => t.includes(w));
  if (banned) return { kind: "banned", word: banned };
  const items: Match[] = [];
  for (const r of RULES) {
    if (r.words.some((w) => t.includes(w))) {
      items.push({ slug: r.slug, label: r.label, hours: r.hours, min: r.min, max: r.max });
    }
  }
  if (items.length === 0) return { kind: "none" };
  const totalMin = items.reduce((a, b) => a + b.min, 0);
  const totalMax = items.reduce((a, b) => a + b.max, 0);
  const hours = items.reduce((a, b) => a + b.hours, 0);
  return { kind: "match", items, totalMin, totalMax, hours };
}

export const DEMO_SENTENCE =
  "Kal guests aa rahe hain, ghar saaf karwana hai, groceries chahiye, wardrobe organise karna hai, decoration karni hai.";
