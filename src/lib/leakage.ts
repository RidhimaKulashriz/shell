// Anti-bypass scanner. Flags phone numbers (including spelled-out digits in
// English, Hindi/Hinglish and Devanagari numerals), UPI IDs, emails and social
// handles. Used in chat (blur-and-warn) and the fraud monitor.

const DEVANAGARI = "०१२३४५६७८९";
const WORDS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  shunya: "0", ek: "1", do: "2", teen: "3", char: "4", chaar: "4", paanch: "5", panch: "5", chhe: "6", chhah: "6",
  saat: "7", aath: "8", nau: "9",
  "शून्य": "0", "एक": "1", "दो": "2", "तीन": "3", "चार": "4", "पांच": "5", "पाँच": "5", "छह": "6", "छः": "6",
  "सात": "7", "आठ": "8", "नौ": "9",
};

export type LeakFlag = "phone" | "upi" | "email" | "social";

export function digitsFrom(text: string): string {
  let out = "";
  const tokens = text.toLowerCase().split(/[\s,.\-_/]+/);
  for (const tok of tokens) {
    if (WORDS[tok] !== undefined) {
      out += WORDS[tok];
      continue;
    }
    for (const ch of tok) {
      const di = DEVANAGARI.indexOf(ch);
      if (di >= 0) out += String(di);
      else if (ch >= "0" && ch <= "9") out += ch;
    }
  }
  return out;
}

export function scanMessage(text: string): LeakFlag[] {
  const flags = new Set<LeakFlag>();
  const lower = text.toLowerCase();
  const digits = digitsFrom(text);
  if (/[6-9]\d{9}/.test(digits.replace(/^(91|0)(?=[6-9]\d{9}$)/, ""))) flags.add("phone");
  if (/[a-z0-9._-]{2,}@(okaxis|oksbi|okhdfcbank|okicici|ybl|ibl|axl|paytm|upi|apl|sbi|hdfcbank|icici)\b/.test(lower)) flags.add("upi");
  if (/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/.test(lower)) flags.add("email");
  if (/(^|\s)@[a-z0-9._]{3,}/.test(lower) || /(instagram|insta|whatsapp|telegram|snapchat|facebook)\b.{0,15}(id|handle|pe|par|number|no)/.test(lower)) {
    flags.add("social");
  }
  return [...flags];
}
