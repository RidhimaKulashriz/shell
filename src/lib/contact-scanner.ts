export interface ScanResult {
  hasViolation: boolean;
  reasons: string[];
  sanitizedText: string;
}

const PHONE_REGEX = /(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g;
const UPI_REGEX = /[a-zA-Z0-9.\-_]{2,}@(okicici|okhdfcbank|okaxis|oksbi|ybl|paytm|ibl|upi)/gi;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const SOCIAL_REGEX = /(?:instagram\.com|wa\.me|t\.me)\/[a-zA-Z0-9._-]+/gi;

const WORD_DIGITS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

export function scanChatMessage(text: string): ScanResult {
  const reasons: string[] = [];
  let sanitized = text;

  if (PHONE_REGEX.test(text)) {
    reasons.push("phone_number");
    sanitized = sanitized.replace(PHONE_REGEX, "[hidden phone]");
  }
  if (UPI_REGEX.test(text)) {
    reasons.push("upi_id");
    sanitized = sanitized.replace(UPI_REGEX, "[hidden UPI]");
  }
  if (EMAIL_REGEX.test(text)) {
    reasons.push("email");
    sanitized = sanitized.replace(EMAIL_REGEX, "[hidden email]");
  }
  if (SOCIAL_REGEX.test(text)) {
    reasons.push("social_handle");
    sanitized = sanitized.replace(SOCIAL_REGEX, "[hidden link]");
  }

  // Detect 6+ number words in a row (e.g., "nine eight seven six five four")
  const words = text.toLowerCase().split(/\s+/);
  let consecutiveDigits = 0;
  for (const w of words) {
    if (WORD_DIGITS.includes(w.replace(/[^a-z]/g, ""))) {
      consecutiveDigits++;
      if (consecutiveDigits >= 6) {
        reasons.push("spoken_digits");
        sanitized = "[Message hidden: please keep communication inside Shell]";
        break;
      }
    } else {
      consecutiveDigits = 0;
    }
  }

  return {
    hasViolation: reasons.length > 0,
    reasons,
    sanitizedText: sanitized,
  };
}
