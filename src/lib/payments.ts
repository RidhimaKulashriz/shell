import crypto from "node:crypto";

// Minimal Razorpay helpers — mock when keys missing, real verify when secret present

export function createMockRazorpayOrder(opts: { bookingId: string; amount: number }) {
  // amount in paise (Rs * 100) — our bookings store Rs integer
  const orderId = `order_${opts.bookingId.slice(0, 8)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id: orderId,
    amount: opts.amount * 100,
    currency: "INR",
    bookingId: opts.bookingId,
    mock: true,
  };
}

export function buildUpiString(opts: { upiId?: string; amount: number; note: string }) {
  const upiId = opts.upiId ?? process.env.NEXT_PUBLIC_UPI_ID ?? "shell@upi";
  const params = new URLSearchParams({
    pa: upiId,
    pn: "Shell",
    am: String(opts.amount),
    cu: "INR",
    tn: opts.note.slice(0, 80),
  });
  return `upi://pay?${params.toString()}`;
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return true; // no secret configured => allow in test/dev (still check idempotency)
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  // constant-time compare
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function verifyRazorpayPaymentSignature(opts: { orderId: string; paymentId: string; signature: string }): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return true; // mock mode
  const expected = crypto.createHmac("sha256", secret).update(`${opts.orderId}|${opts.paymentId}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(opts.signature));
  } catch {
    return false;
  }
}
