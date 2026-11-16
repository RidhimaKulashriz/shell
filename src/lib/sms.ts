// SMS_PROVIDER interface — mock when env empty, pluggable for msg91/twilio later
export interface SmsProvider {
  name: string;
  send(to: string, body: string): Promise<{ id: string; to: string }>;
}

class MockSmsProvider implements SmsProvider {
  name = "mock";
  async send(to: string, body: string) {
    // In production replace with real provider — logs for now (never log OTP in prod)
    console.log(`[SMS mock] to=${to} body=${body.slice(0, 80)}`);
    return { id: `mock_${Date.now()}`, to };
  }
}

class Msg91Provider implements SmsProvider {
  name = "msg91";
  async send(to: string, body: string) {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    if (!authKey) throw new Error("MSG91_AUTH_KEY missing");
    // Minimal msg91 v5 flow — fallback to mock if fails
    const res = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey: authKey },
      body: JSON.stringify({
        template_id: templateId,
        short_url: "0",
        recipients: [{ mobiles: to, VAR1: body }],
      }),
    }).catch(() => null);
    if (!res || !res.ok) {
      console.warn("[SMS msg91] upstream failed, falling back to mock log");
      return { id: `mock_fallback_${Date.now()}`, to };
    }
    return { id: `msg91_${Date.now()}`, to };
  }
}

export function getSmsProvider(): SmsProvider {
  const p = (process.env.SMS_PROVIDER ?? "mock").toLowerCase();
  if (p === "msg91" && process.env.MSG91_AUTH_KEY) return new Msg91Provider();
  return new MockSmsProvider();
}

// convenience helper used by booking/payment flows
export async function sendSms(to: string, body: string) {
  const provider = getSmsProvider();
  return provider.send(to, body);
}
