// Client-safe keyword engine: English and Hindi keywords mapped to the task catalog.
// Used by the home-page composer demo (no API cost) and as the offline fallback of the plan engine.

export type KeywordItem = { slug: string; qty: number; size: "small" | "medium" | "large"; matched: string[]; pos: number };
export type KeywordResult = { items: KeywordItem[]; banned: string[] };

const TERMS: Record<string, string[]> = {
  "clean-full-home": ["saaf", "safai", "safayi", "cleaning", "clean", "cleaner", "jhaadu", "jhadu", "pocha", "mop", "sweep", "sweeping", "dusting", "सफाई", "साफ", "झाड़ू", "पोछा"],
  "clean-kitchen": ["kitchen", "rasoi", "रसोई", "किचन"],
  "clean-bathroom": ["bathroom", "washroom", "toilet", "bathrooms", "बाथरूम"],
  utensils: ["bartan", "bartaan", "utensils", "utensil", "dishes", "dishwashing", "बर्तन"],
  groceries: ["groceries", "grocery", "sabzi", "sabji", "kirana", "doodh", "saman", "ration", "fruits", "vegetables", "सब्ज़ी", "सब्जी", "किराना", "राशन"],
  "wardrobe-organise": ["wardrobe", "almirari", "almari", "alamari", "cupboard", "closet", "organise", "organize", "अलमारी", "वार्डरोब"],
  decoration: ["decoration", "decorate", "decorations", "balloon", "balloons", "sajawat", "sajaana", "sajana", "party", "streamers", "सजावट", "डेकोरेशन", "गुब्बारे"],
  "event-help": ["event", "function", "waiters", "serving", "mehfil", "shaadi", "catering"],
  "parcel-pickup": ["parcel", "courier", "amazon", "delivery", "पार्सल", "कुरियर"],
  errand: ["errand", "errands", "chemist", "dawai", "dawa", "medicine", "pharmacy", "laundry", "dhobi", "pickup", "दवाई", "धोबी"],
  "excel-help": ["excel", "spreadsheet", "sheet", "sheets", "data", "pivot", "एक्सेल"],
  tutoring: ["padhai", "tuition", "tutor", "tutoring", "explain", "samjhana", "samjha", "padhana", "पढ़ाई", "ट्यूशन"],
  "pet-walk": ["kutta", "kutte", "dog", "pet", "puppy", "कुत्ता"],
  "moving-help": ["shifting", "shift", "moving", "packing", "movers", "शिफ्टिंग", "पैकिंग"],
  "small-repairs": ["plumber", "electrician", "repair", "repairs", "tap", "leak", "mistri", "carpenter", "मिस्त्री"],
  queueing: ["queue", "line", "lineup", "bank", "aadhaar", "कतार", "लाइन"],
  "sports-partner": ["cricket", "badminton", "football", "tennis", "sports", "khelna", "खेलना"],
  "gaming-partner": ["gaming", "game", "games", "ps5", "valorant", "bgmi", "chess"],
};
const MULTI: Record<string, string[]> = {
  "pet-walk": ["dog walk", "walk the dog", "kutte ko ghumana"],
  "parcel-pickup": ["delivery pickup"],
  queueing: ["line mein", "line me khade"],
};
const BANNED = ["massage", "makeup", "make-up", "make up", "facial", "waxing", "spa", "bridal", "personal care", "मसाज", "मेकअप"];
const BANNED_MULTI = ["homework kar do", "assignment kar do", "homework karwana", "do my homework", "write my assignment"];

const GENERIC_CLEAN = "clean-full-home";
const SIZE_BIG = ["bada", "badi", "bade", "large", "big", "3bhk", "4bhk", "3 bhk", "4 bhk", "huge", "बड़ा"];
const SIZE_SMALL = ["chhota", "chhoti", "small", "1bhk", "1 bhk", "studio", "छोटा"];

const tokenize = (s: string): string[] => Array.from(s.toLowerCase().match(/[\p{L}\p{M}\p{N}-]+/gu) ?? []);

function termHit(tokens: string[], term: string) {
  return tokens.findIndex((t) => t === term || (term.length >= 5 && t.startsWith(term)));
}

export function matchKeywords(input: string): KeywordResult {
  const text = input.toLowerCase();
  const tokens = tokenize(text);
  const hits = new Map<string, { pos: number; matched: string[] }>();
  for (const [slug, terms] of Object.entries(TERMS)) {
    for (const term of terms) {
      const i = termHit(tokens, term);
      if (i >= 0) {
        const cur = hits.get(slug);
        if (cur) {
          cur.pos = Math.min(cur.pos, i);
          cur.matched.push(term);
        } else hits.set(slug, { pos: i, matched: [term] });
      }
    }
  }
  for (const [slug, terms] of Object.entries(MULTI))
    for (const term of terms) {
      const idx = text.indexOf(term);
      if (idx >= 0) hits.set(slug, { pos: tokens.length ? Math.max(0, text.slice(0, idx).split(/\s+/).length - 1) : 0, matched: [term] });
    }

  // "organise" alone is too generic: it only counts for wardrobe when a storage word is present.
  const w = hits.get("wardrobe-organise");
  if (w && w.matched.every((m) => m === "organise" || m === "organize")) hits.delete("wardrobe-organise");
  // Specific rooms beat the generic whole-home clean.
  if ((hits.has("clean-kitchen") || hits.has("clean-bathroom")) && hits.has(GENERIC_CLEAN) && hits.get(GENERIC_CLEAN)!.matched.every((m) => ["saaf", "safai", "cleaning", "clean", "safayi"].includes(m)) && !/\b(ghar|home|flat|house|poora|pura)\b/.test(text)) hits.delete(GENERIC_CLEAN);
  // A bare "party" is decoration only when no event-help intent is present.
  if (hits.has("event-help") && hits.has("decoration") && hits.get("decoration")!.matched.length === 1 && hits.get("decoration")!.matched[0] === "party") hits.delete("decoration");

  const size: "small" | "medium" | "large" = SIZE_BIG.some((s) => text.includes(s)) ? "large" : SIZE_SMALL.some((s) => text.includes(s)) ? "small" : "medium";
  const qtyOf = (re: RegExp) => {
    const m = text.match(re);
    return m ? Math.min(20, Math.max(1, Number(m[1]))) : 1;
  };
  const items: KeywordItem[] = [...hits.entries()]
    .map(([slug, h]) => {
      let qty = 1;
      if (slug === "event-help") qty = qtyOf(/(\d+)\s*(?:people|log|waiters|helpers|persons)/);
      if (["excel-help", "tutoring", "queueing", "sports-partner", "gaming-partner", "moving-help"].includes(slug)) qty = qtyOf(/(\d+)\s*(?:hours?|hrs?|ghante|ghanta|घंटे)/);
      if (slug === "parcel-pickup") qty = qtyOf(/(\d+)\s*(?:parcels?|couriers?)/);
      if (slug === "pet-walk") qty = qtyOf(/(\d+)\s*(?:walks?|dogs?)/);
      return { slug, qty, size, matched: h.matched, pos: h.pos };
    })
    .sort((a, b) => a.pos - b.pos);

  const banned = [...BANNED.filter((b) => tokens.includes(b) || text.includes(b + " ") || text.endsWith(b)), ...BANNED_MULTI.filter((b) => text.includes(b))];
  return { items, banned: [...new Set(banned)] };
}

export const DEMO_SENTENCE = "Guests are coming tomorrow. I need cleaning, groceries, wardrobe organising and decoration.";
