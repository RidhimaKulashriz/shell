import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";
import { isBalanced, walletTopUp } from "@/lib/ledger";

describe("csv export", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(toCsv([{ a: 'x,"y"', b: "line\nbreak" }])).toBe('a,b\r\n"x,""y""","line\nbreak"\r\n');
  });
  it("neutralises spreadsheet formulas", () => {
    expect(toCsv([{ a: "=SUM(A1:A9)", b: "+1" }])).toContain("'=SUM(A1:A9)");
  });
  it("writes dates as ISO strings and blanks for null", () => {
    expect(toCsv([{ d: new Date("2026-01-02T03:04:05Z"), n: null }])).toBe("d,n\r\n2026-01-02T03:04:05.000Z,\r\n");
  });
});

describe("wallet top-up journal", () => {
  it("balances to zero", () => {
    expect(isBalanced(walletTopUp(50000))).toBe(true);
  });
  it("credits the wallet liability with the full amount", () => {
    const e = walletTopUp(50000);
    expect(e.find((x) => x.account === "wallet_liability")?.credit).toBe(50000);
    expect(e.find((x) => x.account === "customer_cash")?.debit).toBe(50000);
  });
});
