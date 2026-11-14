import { db } from "@/db";
import { customerProfiles, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

type Tpl = { en: string; hi: string; wa?: boolean; push?: boolean; always?: boolean };

/** Notification catalogue: WhatsApp template + push + in-app card. `always` = ignores quiet hours (safety and arrival). */
export const CATALOGUE: Record<string, Tpl> = {
  waitlist_confirmed: { en: "You're in, {name}. You are #{position} on the Shell list. Share your link to move up: {link}", hi: "आप लिस्ट में हैं, {name}। आपका नंबर #{position} है। ऊपर आने के लिए लिंक शेयर कीजिए: {link}", wa: true },
  otp: { en: "{code} is your Shell code. Do not share it with anyone.", hi: "{code} आपका Shell कोड है। किसी को न बताएँ।", wa: true, always: true },
  plan_ready: { en: "Your plan is ready. Take one look: {link}", hi: "आपका प्लान तैयार है। एक बार देख लीजिए: {link}", wa: true, push: true },
  plan_changes_requested: { en: "We got your change request and a person is on it.", hi: "आपका बदलाव मिल गया, एक इंसान देख रहा है।", push: true },
  payment_success: { en: "Payment received: Rs {amount}. You can relax now.", hi: "हो गया। अब आप रिलैक्स करो। ₹{amount} जमा हुए।", wa: true, push: true },
  payment_failed: { en: "Payment did not go through. Your plan is saved, try again or pick another method.", hi: "पेमेंट नहीं हो पाया। प्लान सेव है, दोबारा कोशिश कीजिए।", push: true },
  helper_assigned: { en: "{helper} will do {task}. Meet them in the app.", hi: "{helper} {task} करेंगे। ऐप में मिलिए।", wa: true, push: true },
  helper_changed: { en: "Your helper changed to {helper}. Same guarantee, same price.", hi: "आपका हेल्पर बदलकर {helper} हो गया है।", wa: true, push: true },
  helper_on_the_way_15: { en: "{helper} is about 15 minutes from {tower}.", hi: "{helper} {tower} से लगभग 15 मिनट दूर हैं।", push: true },
  helper_on_the_way_5: { en: "{helper} is coming to {tower}. About {eta} minutes. Door OTP: {otp}. Share only with {helper}.", hi: "{helper} {tower} की तरफ़ आ रहे हैं। लगभग {eta} मिनट। Door OTP: {otp}। सिर्फ़ {helper} को बताएँ।", wa: true, push: true, always: true },
  helper_arrived: { en: "{helper} has arrived at your door. Door OTP: {otp}.", hi: "{helper} दरवाज़े पर पहुँच गए हैं। Door OTP: {otp}।", wa: true, push: true, always: true },
  door_otp_reminder: { en: "Your door OTP for {task} is {otp}. Share only with the helper at your door.", hi: "{task} के लिए Door OTP {otp} है। सिर्फ़ दरवाज़े पर खड़े हेल्पर को बताएँ।", push: true, always: true },
  job_started: { en: "{task} has started. Checked in with OTP.", hi: "{task} शुरू हो गया।", push: true },
  change_requested: { en: "{helper} asked for {change}. It changes the price by Rs {delta}. Accept or decline in the app.", hi: "{helper} ने {change} माँगा है। कीमत ₹{delta} बदलेगी। ऐप में हाँ या ना कहिए।", wa: true, push: true },
  receipt_to_approve: { en: "Receipt is in. Rs {spent} of Rs {cap} spent. Please check the lines.", hi: "रसीद आ गई है। ₹{cap} में से ₹{spent} खर्च हुए। लाइनें देख लीजिए।", wa: true, push: true },
  job_done_review: { en: "Your home is ready. Please review {task}.", hi: "घर रेडी। आप बस आइए। {task} देख लीजिए।", wa: true, push: true },
  rework_scheduled: { en: "No problem. We will put it right within 24 hours.", hi: "कोई बात नहीं, हम ठीक कर देंगे। पहले 24 घंटे में।", wa: true, push: true },
  refund_processed: { en: "Refund of Rs {amount} is on its way to {method}.", hi: "₹{amount} का रिफ़ंड {method} में आ रहा है।", wa: true, push: true },
  dispute_opened: { en: "We have received your dispute and will reply within 24 hours.", hi: "आपकी शिकायत मिल गई। हम 24 घंटे में जवाब देंगे।", push: true },
  dispute_update: { en: "There is an update on your dispute. Open the app.", hi: "आपकी शिकायत पर अपडेट है।", push: true },
  dispute_resolved: { en: "Your dispute is resolved: {outcome}.", hi: "आपकी शिकायत हल हो गई: {outcome}।", wa: true, push: true },
  circle_invite: { en: "{name} invited you to {circle}. {joined} of {max} flats joined. Price per flat drops as more join.", hi: "{name} ने आपको {circle} में बुलाया है। {joined}/{max} फ़्लैट जुड़ चुके हैं।", wa: true, push: true },
  circle_progress: { en: "{circle}: {joined} of {max} flats joined.", hi: "{circle}: {joined}/{max} फ़्लैट जुड़े।", push: true },
  circle_confirmed: { en: "{circle} is confirmed. Your price per flat is Rs {price}.", hi: "{circle} पक्का हो गया। आपका दाम ₹{price} है।", wa: true, push: true },
  circle_cancelled: { en: "{circle} did not reach its minimum, so it is cancelled. Your payment is refunded.", hi: "{circle} में न्यूनतम फ़्लैट नहीं जुड़े, इसलिए रद्द। आपका पैसा वापस।", wa: true, push: true },
  routine_reminder: { en: "Your {task} routine runs tomorrow. Skip or reschedule in the app.", hi: "कल आपका {task} रूटीन है। स्किप या बदलना हो तो ऐप खोलिए।", push: true },
  routine_skipped: { en: "Skipped your next {task} run as asked.", hi: "आपके कहने पर अगला {task} स्किप किया।", push: true },
  sos_sent: { en: "SOS sent. Shell team and your trusted contact have your location.", hi: "SOS भेज दिया गया। Shell टीम और आपके भरोसेमंद व्यक्ति के पास आपकी लोकेशन है।", wa: true, push: true, always: true },
  sos_resolved: { en: "SOS marked resolved. We will follow up with you.", hi: "SOS बंद किया गया। हम आपसे संपर्क करेंगे।", wa: true, push: true, always: true },
  helper_offer: { en: "New job: {task}, {tower}, Rs {payout}. Reply in {mins} min.", hi: "नया काम: {task}, {tower}, ₹{payout}। {mins} मिनट में जवाब दीजिए।", wa: true, push: true },
  helper_offer_expiring: { en: "Offer for {task} expires in 30 seconds.", hi: "{task} का ऑफ़र 30 सेकंड में ख़त्म होगा।", push: true },
  helper_payout_sent: { en: "Payout of Rs {amount} sent. UTR {utr}.", hi: "₹{amount} का पेआउट भेजा। UTR {utr}।", wa: true, push: true },
  helper_strike: { en: "A strike was added: {reason}. You can appeal in Shell Earn.", hi: "स्ट्राइक जुड़ी: {reason}। आप Shell Earn में अपील कर सकते हैं।", wa: true, push: true },
  helper_level_up: { en: "You moved up to {level}. New perks are unlocked.", hi: "आप {level} पर पहुँच गए। नए फ़ायदे खुल गए।", wa: true, push: true },
  weekly_summary: { en: "This week: {jobs} jobs, {hours} hours saved. Nice.", hi: "इस हफ़्ते: {jobs} काम, {hours} घंटे बचे।", wa: true },
  wrapped_ready: { en: "Your Shell Wrapped is ready. Take a look and share it.", hi: "आपका Shell Wrapped तैयार है।", push: true },
};

export const EVENTS = Object.keys(CATALOGUE);

export function render(event: string, vars: Record<string, string | number> = {}, lang: "en" | "hi" = "en") {
  const t = CATALOGUE[event];
  if (!t) return "";
  return (lang === "hi" ? t.hi : t.en).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export interface ChannelProvider {
  send(channel: "whatsapp" | "push" | "sms", userId: string, text: string): Promise<void>;
}
// WhatsApp Business Cloud API / FCM / MSG91 go behind this interface. Default: logs and records delivery.
export const channelProvider: ChannelProvider = {
  async send(channel, userId, text) {
    if (process.env.NODE_ENV !== "test") console.log(JSON.stringify({ level: "info", channel, userId, text: text.slice(0, 80) }));
  },
};

export function inQuietHours(hourIst: number, start = 22, end = 7) {
  return start > end ? hourIst >= start || hourIst < end : hourIst >= start && hourIst < end;
}

export async function notify(userId: string, event: string, vars: Record<string, string | number> = {}, lang: "en" | "hi" = "en") {
  const t = CATALOGUE[event];
  if (!t) return;
  const [p] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, userId)).limit(1);
  const hour = Number(new Date().toLocaleString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }));
  const quiet = !t.always && inQuietHours(hour, p?.quietStart ?? 22, p?.quietEnd ?? 7);
  const body = render(event, vars, lang);
  await db.insert(notifications).values({ userId, type: event, channel: "inapp", title: event.replace(/_/g, " "), body, payload: vars, status: quiet ? "held_quiet_hours" : "sent" });
  if (!quiet) {
    if (t.wa) await channelProvider.send("whatsapp", userId, body);
    if (t.push) await channelProvider.send("push", userId, body);
  }
}
