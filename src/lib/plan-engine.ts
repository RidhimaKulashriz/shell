import { db } from "@/db";
import { taskTemplates } from "@/db/schema";
import { matchKeywords } from "@/lib/keywords";

export type Draft = { tasks: { template: string; qty: number; size: string; confidence: number; note?: string }[]; overallConfidence: number; needsHuman: boolean; banned: string[] };

/** Behind an interface so a hosted LLM can be swapped in (set PLAN_LLM_PROVIDER). The default is the offline keyword planner.
 *  Prices never come from this layer, only task names, quantities and confidence. Low confidence routes to a human. */
export interface PlanLLM {
  name: string;
  draft(text: string, photoCount: number): Promise<{ slug: string; qty: number; size: string; confidence: number; note?: string }[]>;
  banned(text: string): string[];
}

export const keywordPlanner: PlanLLM = {
  name: "keyword-v1",
  async draft(text, photoCount) {
    const r = matchKeywords(text);
    return r.items.map((i) => ({ slug: i.slug, qty: i.qty, size: i.size, confidence: Math.min(0.95, 0.62 + 0.12 * i.matched.length + (photoCount ? 0.05 : 0)), note: i.matched.join(", ") }));
  },
  banned: (t) => matchKeywords(t).banned,
};

export const getPlanner = (): PlanLLM => keywordPlanner;

export async function draftRequest(text: string, photoCount = 0): Promise<Draft> {
  const planner = getPlanner();
  const [raw, active] = await Promise.all([planner.draft(text, photoCount), db.select({ slug: taskTemplates.slug }).from(taskTemplates)]);
  const valid = new Set(active.map((a) => a.slug));
  const tasks = raw.filter((t) => valid.has(t.slug)).map((t) => ({ template: t.slug, qty: t.qty, size: t.size, confidence: t.confidence, note: t.note }));
  const banned = planner.banned(text);
  const overall = tasks.length ? tasks.reduce((s, t) => s + t.confidence, 0) / tasks.length : 0;
  return { tasks, overallConfidence: Number(overall.toFixed(2)), needsHuman: banned.length > 0 || overall < 0.7 || tasks.length === 0, banned };
}

type Q = { id: string; q: string; qHi: string; chips: string[]; answer?: string };
const BANK: Record<string, Q[]> = {
  "clean-full-home": [{ id: "bhk", q: "How many bedrooms does the home have?", qHi: "घर कितने BHK का है?", chips: ["1 BHK", "2 BHK", "3 BHK", "4 BHK or larger"] }],
  "clean-room": [{ id: "rooms", q: "How many rooms?", qHi: "कितने कमरे?", chips: ["1", "2", "3", "4+"] }],
  groceries: [
    { id: "diet", q: "Any dietary or allergy notes?", qHi: "कोई खान-पान या एलर्जी नोट?", chips: ["No", "Veg only", "Has allergies"] },
    { id: "cap", q: "What spending limit should we set?", qHi: "खर्च की सीमा क्या रखें?", chips: ["₹1,000", "₹2,000", "₹3,000", "You decide"] },
  ],
  decoration: [{ id: "occasion", q: "What is the occasion?", qHi: "किस मौके के लिए?", chips: ["Birthday", "Anniversary", "Festival", "For guests"] }],
  "wardrobe-organise": [{ id: "wardrobes", q: "How many wardrobes?", qHi: "कितनी अलमारी?", chips: ["1", "2", "3 or more"] }],
  "event-help": [{ id: "guests", q: "How many guests?", qHi: "कितने मेहमान?", chips: ["Up to 10", "10 to 25", "More than 25"] }],
  "excel-help": [{ id: "excel", q: "What kind of work: formulas, pivot tables or data cleaning?", qHi: "कौन सा काम: फ़ॉर्मूला, पिवट या डेटा क्लीनिंग?", chips: ["Formulas", "Pivot / charts", "Data cleaning", "Not sure"] }],
  tutoring: [{ id: "subject", q: "Which subject and class?", qHi: "कौन सा विषय और कक्षा?", chips: ["Maths", "Science", "English", "Commerce"] }],
  "pet-walk": [{ id: "pet", q: "What is the dog's temperament?", qHi: "कुत्ते का स्वभाव कैसा है?", chips: ["Calm", "Energetic", "A bit nervous"] }],
};
const GENERAL: Q[] = [
  { id: "access", q: "How will the helper get in?", qHi: "हेल्पर घर कैसे आएगा?", chips: ["I will be home", "Key with the guard", "Lockbox OTP"] },
  { id: "time", q: "When do you need it ready?", qHi: "कब तक रेडी चाहिए?", chips: ["Today", "Tomorrow morning", "Tomorrow evening", "This week"] },
];

/** At most five questions, one at a time, each answered with chips. */
export function clarifyingQuestions(draft: Draft): Q[] {
  const out: Q[] = [];
  for (const t of draft.tasks) for (const q of BANK[t.template] ?? []) if (!out.find((x) => x.id === q.id)) out.push({ ...q });
  for (const q of GENERAL) out.push({ ...q });
  return out.slice(0, 5);
}

/** Apply chip answers back onto the draft (size, quantity). */
export function applyAnswers(draft: Draft, answers: Record<string, string>): Draft {
  const next = structuredClone(draft);
  for (const t of next.tasks) {
    if (t.template === "clean-full-home" && answers.bhk) t.size = /1/.test(answers.bhk) ? "small" : /3|4/.test(answers.bhk) ? "large" : "medium";
    if (t.template === "wardrobe-organise" && answers.wardrobes) t.qty = Math.min(5, parseInt(answers.wardrobes) || 1);
    if (t.template === "clean-room" && answers.rooms) t.qty = Math.min(8, parseInt(answers.rooms) || 1);
    if (t.template === "event-help" && answers.guests) t.qty = /25/.test(answers.guests) ? 3 : /10 se/.test(answers.guests) ? 2 : 1;
    if (t.template === "groceries" && answers.cap) t.note = `cap ${answers.cap}`;
  }
  return next;
}

/** Photo-to-plan: deterministic mock annotations (hand-drawn circles with task suggestions). A vision model plugs in here. */
export function annotatePhoto(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const r = (i: number) => ((h >> (i * 5)) & 31) / 31;
  return [
    { x: 14 + r(1) * 18, y: 52 + r(2) * 20, label: "Floor needs mopping", template: "clean-room" },
    { x: 52 + r(3) * 18, y: 18 + r(4) * 14, label: "Clothes pile: organise", template: "wardrobe-organise" },
    { x: 60 + r(5) * 16, y: 58 + r(6) * 16, label: "Utensils on the table", template: "utensils" },
  ];
}
