import { describe, it, expect } from "vitest";
import { scanChatMessage } from "../src/lib/contact-scanner";
import { canTransitionOrder, transitionOrder } from "../src/lib/order-state";

describe("Contact Scanner (Anti-Bypass)", () => {
  it("detects and masks Indian phone numbers", () => {
    const res = scanChatMessage("Call me at 9876543210");
    expect(res.hasViolation).toBe(true);
    expect(res.reasons).toContain("phone_number");
    expect(res.sanitizedText).toContain("[hidden phone]");
  });

  it("detects and masks UPI IDs", () => {
    const res = scanChatMessage("Send money to rahul@okicici");
    expect(res.hasViolation).toBe(true);
    expect(res.reasons).toContain("upi_id");
    expect(res.sanitizedText).toContain("[hidden UPI]");
  });

  it("detects spoken digits", () => {
    const res = scanChatMessage("My number is nine eight seven six five four");
    expect(res.hasViolation).toBe(true);
    expect(res.reasons).toContain("spoken_digits");
  });

  it("allows normal job messages", () => {
    const res = scanChatMessage("I am at Gate 1, coming to Tower B.");
    expect(res.hasViolation).toBe(false);
    expect(res.sanitizedText).toBe("I am at Gate 1, coming to Tower B.");
  });
});

describe("Order State Machine", () => {
  it("allows valid progression", () => {
    expect(canTransitionOrder("placed", "confirmed")).toBe(true);
    expect(canTransitionOrder("confirmed", "assigned")).toBe(true);
    expect(canTransitionOrder("awaiting_approval", "completed")).toBe(true);
  });

  it("blocks starting job without door OTP", () => {
    expect(() =>
      transitionOrder("arrived", "in_progress", { doorOtpVerified: false })
    ).toThrow("Door OTP verification is required");
  });

  it("allows starting job with door OTP", () => {
    expect(
      transitionOrder("arrived", "in_progress", { doorOtpVerified: true })
    ).toBe("in_progress");
  });
});
