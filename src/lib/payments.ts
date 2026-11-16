export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet" | "cash_after";

export interface PaymentIntent {
  id: string;
  amountPaise: number;
  currency: "INR";
  method: PaymentMethod;
  status: "created" | "authorised" | "captured" | "failed";
}

export interface PaymentProvider {
  createIntent(amountPaise: number, method: PaymentMethod): Promise<PaymentIntent>;
  captureIntent(intentId: string): Promise<PaymentIntent>;
}

export class MockRazorpayProvider implements PaymentProvider {
  async createIntent(amountPaise: number, method: PaymentMethod): Promise<PaymentIntent> {
    return {
      id: `pay_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      amountPaise,
      currency: "INR",
      method,
      status: method === "cash_after" ? "authorised" : "captured",
    };
  }

  async captureIntent(intentId: string): Promise<PaymentIntent> {
    return {
      id: intentId,
      amountPaise: 0,
      currency: "INR",
      method: "upi",
      status: "captured",
    };
  }
}

export const paymentProvider: PaymentProvider = new MockRazorpayProvider();
