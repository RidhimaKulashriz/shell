// Anti-bypass scanner: phone numbers (digits, spaced, spelled-out English/Hinglish, Devanagari numerals),
// UPI IDs, emails, and social handles. Used in chat (blur-and-warn) and the ops fraud monitor.

const DEVA = "०१२३४५६७८९";
const WORD_DIGITS: Record<string, string> = {
  zero: "0", shunya: "0", sifar: "0", one: "1", ek: "1", two: "2", teen: "3", three: "3", four: "4", char: "4", chaar: "4", five: "5", panch: "5", paanch: "5",
  six: "6", chhe: "6", chhah: "6", cheh: "6", seven: "7", saat: "7", sat: "7", eight: "8", aath: "8", ath: "8", nine: "9", nau: "9", nao: "9",
  "एक": "1", "दो": "2", "तीन": "3", "चार": "4", "पांच": "5", "पाँच": "5", "छह": "6", "छः": "6", "सात": "7", "आठ": "8", "नौ": "9", "शून्य": "0",
};
// "do" and "to" are everyday words; they only count inside a long digit run (handled by run length >= 8 digits).
const AMBIGUOUS: Record<string, string> = { do: "2", to: "2" };

export type LeakResult = { hit: boolean; flags: string[]; redacted: string };

const toAscii = (s: string) => s.replace(/[०-९]/g, (c) => String(DEVA.indexOf(c)));

export function scanMessage(body: string): LeakResult {
  const flags = new Set<string>();
  let redacted = body;

  // UPI IDs & emails
  const upi = /\b[a-z0-9._-]{2,}@(?:ok(?:axis|hdfcbank|icici|sbi)|ybl|ibl|axl|paytm|upi|apl|oksbi|fbl|sbi|hdfcbank|icici|axisbank|barodampay|kotak|postbank|pnb|idfcbank)\b/gi;
  if (upi.test(body)) flags.add("upi");
  redacted = redacted.replace(upi, "•••••");
  const email = /\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/gi;
  if (email.test(redacted)) flags.add("email");
  redacted = redacted.replace(email, "•••••");

  // Social handles
  const handle = /(^|\s)@[a-z0-9._]{3,}/gi;
  if (handle.test(redacted)) flags.add("social");
  redacted = redacted.replace(handle, "$1•••••");
  if (/\b(insta(gram)?|snap(chat)?|telegram|whats\s?app|wa\.me|facebook|fb)\b.{0,20}\b(id|handle|pe|par|number|no|username|link)\b/i.test(body) || /(?:^|\s)(?:mera|my)\s+(?:insta|snap|telegram|whatsapp)/i.test(body)) flags.add("social");
  if (/\b(gpay|google\s?pay|phonepe|paytm|bhim)\b.{0,25}\b(number|no|par|pe|id)\b/i.test(body) || /\b(direct|seedha|cash)\b.{0,15}\b(pay|payment|de\s?dena|dedo|de\s?do|karenge)\b/i.test(body) || /\b(pay|payment|paise)\b.{0,15}\b(direct|seedha|cash)\b/i.test(body)) flags.add("offplatform_payment");

  // Phone numbers: find runs of digit-ish tokens (digits or number words) totalling >= 8 digits.
  const re = /\S+/g;
  const toks: { start: number; end: number; digits: string; weak: boolean }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(redacted))) {
    const raw = m[0];
    const clean = toAscii(raw).toLowerCase().replace(/^[^\p{L}\p{N}+]+|[^\p{L}\p{N}]+$/gu, "");
    let digits = "";
    let weak = false;
    if (/^\+?[\d()-]+$/.test(clean)) digits = clean.replace(/\D/g, "");
    else if (WORD_DIGITS[clean]) digits = WORD_DIGITS[clean];
    else if (AMBIGUOUS[clean]) {
      digits = AMBIGUOUS[clean];
      weak = true;
    } else if (/^(double|triple|dubble)$/.test(clean)) digits = "";
    toks.push({ start: m.index, end: m.index + raw.length, digits, weak });
  }
  // allow "double nine" / "triple five" multipliers via lookahead
  const ranges: [number, number][] = [];
  let run: typeof toks = [];
  let total = 0;
  const flush = () => {
    const first = run.findIndex((t) => !t.weak);
    if (total >= 8 && first >= 0) {
      flags.add("phone");
      ranges.push([run[0].start, run[run.length - 1].end]);
    }
    run = [];
    total = 0;
  };
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    const rawWord = redacted.slice(t.start, t.end).toLowerCase();
    if (/^(double|dubble|triple)$/.test(rawWord) && toks[i + 1]?.digits) {
      const mult = rawWord === "triple" ? 3 : 2;
      total += toks[i + 1].digits.length * (mult - 1);
      run.push(t);
      continue;
    }
    if (t.digits) {
      run.push(t);
      total += t.digits.length;
    } else if (run.length) flush();
  }
  if (run.length) flush();
  for (const [s, e] of ranges.reverse()) redacted = redacted.slice(0, s) + "•••••" + redacted.slice(e);

  return { hit: flags.size > 0, flags: [...flags], redacted };
}

export const LEAK_WARNING = "Taking this conversation outside Shell voids the guarantee and damage cover. Please do not share numbers or UPI IDs here.";
