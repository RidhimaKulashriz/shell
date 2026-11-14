import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { applyAnswers, clarifyingQuestions, annotatePhoto, type Draft } from "@/lib/plan-engine";
import { CATALOGUE, EVENTS, inQuietHours, render } from "@/lib/notify";
import { paymentProvider, signMock } from "@/lib/money";
import { scoreHelper } from "@/lib/dispatch";
import { normalizePhone } from "@/lib/auth";
import { checkDoorOtp, doorOtp } from "@/lib/otp";
import { matchKeywords } from "@/lib/keywords";

const draft = (slugs: string[]): Draft => ({ tasks: slugs.map((template) => ({ template, qty: 1, size: "medium", confidence: 0.9 })), overallConfidence: 0.9, needsHuman: false, banned: [] });

describe("plan engine", () => {
  it("never asks more than five questions", () => {
    const q = clarifyingQuestions(draft(["clean-full-home", "groceries", "decoration", "wardrobe-organise", "event-help", "tutoring", "pet-walk"]));
    expect(q.length).toBeLessThanOrEqual(5);
    expect(new Set(q.map((x) => x.id)).size).toBe(q.length);
  });
  it("applies chip answers to size and quantity", () => {
    const d = applyAnswers(draft(["clean-full-home", "wardrobe-organise"]), { bhk: "3 BHK", wardrobes: "2" });
    expect(d.tasks[0].size).toBe("large");
    expect(d.tasks[1].qty).toBe(2);
  });
  it("annotates photos deterministically", () => {
    expect(annotatePhoto("abc")).toEqual(annotatePhoto("abc"));
    expect(annotatePhoto("abc")).toHaveLength(3);
  });
  it("flags banned categories for a human", () => {
    expect(matchKeywords("makeup aur massage chahiye").banned.length).toBeGreaterThan(0);
  });
});

describe("notifications", () => {
  it("has Hindi and English text for every catalogue event and renders variables", () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(35);
    for (const e of EVENTS) expect(CATALOGUE[e].en.length && CATALOGUE[e].hi.length).toBeTruthy();
    expect(render("helper_on_the_way_5", { helper: "Rahul", tower: "Tower C", eta: 6, otp: "4821" })).toContain("Door OTP: 4821");
    expect(render("helper_on_the_way_5", { helper: "Rahul", tower: "Tower C", eta: 6, otp: "4821" }, "hi")).toContain("Door OTP: 4821");
  });
  it("respects quiet hours, except for safety and arrival", () => {
    expect(inQuietHours(23)).toBe(true);
    expect(inQuietHours(3)).toBe(true);
    expect(inQuietHours(12)).toBe(false);
    expect(CATALOGUE.sos_sent.always).toBe(true);
    expect(CATALOGUE.helper_arrived.always).toBe(true);
    expect(CATALOGUE.plan_ready.always).toBeFalsy();
  });
});

describe("payments and auth", () => {
  it("verifies Razorpay-style signatures and rejects tampering", () => {
    const sig = signMock("order_1", "pay_1");
    expect(paymentProvider.verifySignature("order_1", "pay_1", sig)).toBe(true);
    expect(paymentProvider.verifySignature("order_1", "pay_2", sig)).toBe(false);
    expect(paymentProvider.verifySignature("order_1", "pay_1", "bad")).toBe(false);
    expect(sig).toBe(crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "mock_razorpay_secret").update("order_1|pay_1").digest("hex"));
  });
  it("normalises Indian mobile numbers", () => {
    expect(normalizePhone("98765 43210")).toBe("+919876543210");
    expect(normalizePhone("+91 98765-43210")).toBe("+919876543210");
    expect(normalizePhone("9100000001")).toBe("+919100000001");
    expect(normalizePhone("919100000001")).toBe("+919100000001");
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("5876543210")).toBeNull();
  });
  it("derives a stable four-digit door OTP per task", () => {
    expect(doorOtp("task-1")).toMatch(/^\d{4}$/);
    expect(doorOtp("task-1")).toBe(doorOtp("task-1"));
    expect(checkDoorOtp("task-1", doorOtp("task-1"))).toBe(true);
    expect(checkDoorOtp("task-1", "0000" === doorOtp("task-1") ? "1111" : "0000")).toBe(false);
  });
});

describe("dispatch scoring", () => {
  const base = { id: "h1", displayName: "Rahul", status: "active", vacation: false, categories: [{ slug: "house-cleaning", level: 3 }], isFemale: false, femaleOnlyEligible: false, managedEligible: false, dailyCap: 4, radiusM: 1500, lat: 28.5921, lng: 77.046, ratingAvg: 4.8, onTimeRate: 0.95, level: "TRUSTED", jobsDone: 30, languages: ["Hindi"], goodAt: [], voiceIntroText: "", passportSlug: "r", online: true } as never;
  const ctx = { lat: 28.5922, lng: 77.0461, category: "house-cleaning", femaleOnly: false, repeatHelperIds: new Set<string>(), stackNearby: false, load: 0, managed: false };
  it("scores eligible helpers and explains rejections", () => {
    expect(scoreHelper(base, ctx).eligible).toBe(true);
    expect(scoreHelper(base, { ...ctx, category: "tutoring" }).reasons).toContain("no skill in category");
    expect(scoreHelper(base, { ...ctx, femaleOnly: true }).eligible).toBe(false);
    expect(scoreHelper(base, { ...ctx, load: 4 }).reasons).toContain("daily cap reached");
  });
  it("adds repeat and stacking bonuses", () => {
    const plain = scoreHelper(base, ctx).score;
    expect(scoreHelper(base, { ...ctx, repeatHelperIds: new Set(["h1"]) }).score).toBe(plain + 10);
    expect(scoreHelper(base, { ...ctx, stackNearby: true }).score).toBe(plain + 6);
  });
});
