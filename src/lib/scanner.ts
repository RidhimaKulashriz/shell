// Leakage scanner: flags phone numbers, UPI IDs, emails and social handles in chat so the
// message can be blurred and the sender warned. Handles spelled-out digits and Devanagari numerals.
const DEV = "०१२३४५६७८९";
const WORDS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", oh: "0",
  shunya: "0", ek: "1", do: "2", teen: "3", char: "4", chaar: "4", paanch: "5", panch: "5", chhe: "6", chhah: "6", cheh: "6",
  saat: "7", sat: "7", aath: "8", nau: "9", no: "9",
  "शून्य": "0", "एक": "1", "दो": "2", "तीन": "3", "चार": "4", "पांच": "5", "पाँच": "5", "छह": "6", "छः": "6", "सात": "7", "आठ": "8", "नौ": "9",
};

export type ScanResult = { flags: string[]; blurred: boolean; clean: string };

export function scanMessage(input: string): ScanResult {
  const flags: string[] = [];
  let text = input.replace(/[०-९]/g, (c) => String(DEV.indexOf(c)));
  let clean = input;

  const digitsOnly = text.replace(/[\s\-.()]/g, "");
  if (/(?:\+?91)?[6-9]\d{9}/.test(digitsOnly) || /\b[6-9](?:[\s\-.]?\d){9}\b/.test(text)) flags.push("phone");

  // spelled-out digits: 7 or more consecutive digit words / digits
  const tokens = text.toLowerCase().split(/[\s,.\-]+/);
  let run = 0, maxRun = 0;
  for (const tok of tokens) {
    if (WORDS[tok] !== undefined || /^\d$/.test(tok)) { run++; maxRun = Math.max(maxRun, run); } else run = 0;
  }
  if (maxRun >= 7 && !flags.includes("phone")) flags.push("phone_spelled");

  if (/\b[\w.\-]{2,}@(?:ok)?(?:sbi|hdfc|icici|axis|ybl|paytm|upi|apl|okaxis|oksbi|okhdfcbank|okicici|ibl|axl|pnb|barodampay|fbl|kotak)\b/i.test(text)) flags.push("upi");
  else if (/\b[\w.\-]{2,}@[a-z]{2,}\b(?!\.)/i.test(text) && !/@[\w-]+\.[a-z]{2,}/i.test(text)) flags.push("upi");
  if (/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(text)) flags.push("email");
  if (/(?:^|\s)@[a-z0-9_.]{3,}/i.test(text) || /\b(insta(?:gram)?|telegram|snap(?:chat)?|whats\s?app|wa\.me|signal)\b.{0,20}\b[\w.]{3,}/i.test(text) && /\b(id|handle|dm|add me|message me|ping me|msg me|number)\b/i.test(text)) flags.push("social");
  if (/\b(call me|text me|pay (?:me )?directly|direct payment|outside the app|off the app|cash instead|gpay me|phonepe me|paytm me)\b/i.test(text)) flags.push("off_platform");

  const blurred = flags.some((f) => f !== "off_platform");
  if (blurred) {
    clean = clean.replace(/[०-९\d](?:[\s\-.]?[०-९\d]){6,}/g, "••••••••");
    clean = clean.replace(/[\w.\-]{2,}@[\w.\-]+/g, "••••••");
    clean = clean.replace(/(?:^|\s)@[a-z0-9_.]{3,}/gi, " ••••••");
    if (flags.includes("phone_spelled")) clean = "•••••• (contact details hidden)";
  }
  return { flags, blurred, clean };
}
