// Pure double-entry helpers. A journal must balance to zero.
export type Account = "customer_cash" | "escrow" | "platform_revenue" | "helper_payable" | "expense_float" | "tax_payable" | "refunds" | "promo_cost";
export type Entry = { account: Account; debit: number; credit: number; memo: string };

export function isBalanced(entries: Entry[]) {
  return entries.reduce((s, e) => s + e.debit - e.credit, 0) === 0 && entries.every((e) => Number.isInteger(e.debit) && Number.isInteger(e.credit) && e.debit >= 0 && e.credit >= 0);
}
export function assertBalanced(entries: Entry[]) {
  if (!isBalanced(entries)) throw new Error("Ledger journal does not balance");
  return entries;
}

export const capture = (amount: number, credits = 0): Entry[] =>
  assertBalanced([
    { account: "customer_cash", debit: amount - credits, credit: 0, memo: "Payment captured" },
    ...(credits ? [{ account: "promo_cost" as Account, debit: credits, credit: 0, memo: "Shell credits applied" }] : []),
    { account: "escrow", debit: 0, credit: amount, memo: "Held until approval" },
  ]);

/** Release on approval: escrow -> helper payable + platform revenue + GST on platform revenue. */
export function release(taskPrice: number, helperPayout: number, gstPct = 0.18): Entry[] {
  const gross = taskPrice - helperPayout;
  const gst = Math.round((gross * gstPct) / (1 + gstPct));
  return assertBalanced([
    { account: "escrow", debit: taskPrice, credit: 0, memo: "Released on approval" },
    { account: "helper_payable", debit: 0, credit: helperPayout, memo: "Helper earning" },
    { account: "platform_revenue", debit: 0, credit: gross - gst, memo: "Commission (ex GST)" },
    { account: "tax_payable", debit: 0, credit: gst, memo: "GST on commission" },
  ]);
}

export const refund = (amount: number, fromEscrow = true): Entry[] =>
  assertBalanced([
    { account: fromEscrow ? "escrow" : "refunds", debit: amount, credit: 0, memo: "Refund" },
    { account: "customer_cash", debit: 0, credit: amount, memo: "Refund paid out" },
  ]);

export const payout = (amount: number, fee = 0): Entry[] =>
  assertBalanced([
    { account: "helper_payable", debit: amount, credit: 0, memo: "Payout" },
    { account: "customer_cash", debit: 0, credit: amount - fee, memo: "Bank transfer" },
    ...(fee ? [{ account: "platform_revenue" as Account, debit: 0, credit: fee, memo: "Instant payout fee" }] : []),
  ]);

export const expenseHold = (cap: number): Entry[] =>
  assertBalanced([
    { account: "escrow", debit: cap, credit: 0, memo: "Expense cap moved to float" },
    { account: "expense_float", debit: 0, credit: cap, memo: "Held for helper purchases" },
  ]);
