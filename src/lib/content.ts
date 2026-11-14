import { CATALOG } from "./catalog";
import { computePlan, type Size } from "./pricing";

export const FAQS = [
  { q: "Does Shell do the work itself?", a: "Shell takes responsibility for the result. Verified helpers from your own neighbourhood do the work, and our team plans it, coordinates it and fixes it if something goes wrong. You deal with Shell, not with a list of strangers." },
  { q: "Who will come to my home?", a: "Only helpers who have passed a government ID check, a college or work ID check and a live selfie match. They complete safety training and are approved by our team. You can see their profile before they arrive." },
  { q: "Is my information safe?", a: "We never store raw Aadhaar numbers. Your location is shared with us only during an active job, and helpers only see the notes needed for their task. You can download or delete your data any time." },
  { q: "What if the work isn't right?", a: "Ask for a rework from the order page within 24 hours and we send the helper back at no cost. If it still isn't right, open a dispute and a person will review it, with a refund if it's warranted." },
  { q: "When and how do I pay?", a: "You approve a plan and pay upfront by UPI, card or wallet. We hold the money and release it to the helper only after you approve the work, or two hours after the job ends if you don't respond." },
  { q: "Can I talk to the helper directly?", a: "You can chat with them inside Shell, and call through a masked number. We don't share personal phone numbers. This protects both of you, and keeps your Guarantee and damage cover valid." },
  { q: "Can I request a female helper?", a: "Yes. Set it once in your Home Atlas and every job will be matched accordingly, whenever a suitable helper is available." },
  { q: "What do you not do?", a: "Massage, makeup and personal care are not offered at launch. We also don't do homework. Helpers can explain concepts and tutor, but they never complete assignments for you." },
  { q: "When will Shell reach my society?", a: "We open one society at a time so we can be reliable. Join the waitlist and we'll tell you your position. Societies open faster when more neighbours sign up." },
  { q: "Does Shell keep my house keys?", a: "No. You choose how access works: you stay home, the guard holds the key, or a lockbox with a one-time code. Every job also needs a door code before it can start." },
  { q: "What do I need to become a helper?", a: "You must be 18 or older, have a government ID and a college or work ID, and be comfortable with a short training. Students, freelancers and homemakers with useful skills are all welcome." },
  { q: "How much commission does Shell take?", a: "Helpers receive about 80% of each task price. Customers pay a small platform fee and, on bigger plans, a coordination fee. Both are shown as separate lines on your receipt." },
];

export const LEGAL: Record<string, { title: string; version: string; effective: string; sections: [string, string][]; changelog: string[] }> = {
  terms: { title: "Terms of Service", version: "0.1 (draft)", effective: "1 January 2026", changelog: ["0.1: First draft for lawyer review."], sections: [
    ["Who we are", "Shell provides a managed service that plans and coordinates household and personal tasks inside residential societies in India. Shell is responsible for the outcome of every job it accepts."],
    ["Your account", "You must be 18 or older. You are responsible for the accuracy of your address and for keeping your login secure. We may suspend accounts that put helpers or neighbours at risk."],
    ["Plans, payments and holds", "You see a price range first and an exact amount when you approve your plan. Payment is taken upfront and held until you approve the work or the auto-approval window ends."],
    ["Shell Guarantee", "If a job isn't done as agreed, we will redo it within 24 hours. Damage cover applies up to the limit published on our Safety page. Guarantee and damage cover apply only to jobs booked and paid inside Shell."],
    ["Things we do not allow", "Massage, makeup, personal care, completing homework or assignments, anything illegal, and any request that puts a helper at risk."],
    ["Keeping it inside Shell", "Do not exchange phone numbers, UPI IDs or social handles to arrange work outside Shell. Doing so can lead to warnings, strikes and suspension, and ends the Guarantee for that work."],
    ["Limits of liability", "To the extent permitted by law, our liability is limited to the amount you paid for the affected job, except where law says otherwise."],
  ] },
  privacy: { title: "Privacy Policy (DPDP)", version: "0.1 (draft)", effective: "1 January 2026", changelog: ["0.1: First draft for lawyer review."], sections: [
    ["What we collect", "Your phone number, name, address inside your society, Home Atlas preferences, messages inside the app, photos you or helpers upload, and payment references. Helpers also provide ID verification references."],
    ["What we never store", "We never store raw Aadhaar numbers. Our KYC provider returns a reference and a verified flag, and that is all we keep."],
    ["Location", "Helper location is collected only during an active job, with consent, and is visible to the customer only during that job. Location pings are deleted after 30 days. Every staff access to location data is logged."],
    ["Your rights", "You can access, correct, download and delete your data. Deleting your account starts a 7-day cooling-off period, after which your personal data is erased, except records we must keep for tax and legal reasons."],
    ["Consent", "WhatsApp messages, location and marketing each have a separate consent. You can withdraw any of them in Settings."],
    ["Grievances", "Contact our Grievance Officer using the details on the Grievance Officer page. We respond within 72 hours."],
  ] },
  refunds: { title: "Refund and Cancellation Policy", version: "0.1 (draft)", effective: "1 January 2026", changelog: ["0.1: First draft for lawyer review."], sections: [
    ["Before the helper is on the way", "Cancel for free and get a full refund to your original payment method."],
    ["After the helper is on the way", "A fee of 20% applies to cover the helper's time and travel. The rest is refunded."],
    ["If we cancel or the helper cancels", "You are never charged. We find a replacement first, and refund you in full if we can't."],
    ["Expense caps", "Money you set aside for groceries or errands is held separately. Whatever isn't spent is refunded to your Shell Wallet or original payment method."],
    ["Rework and disputes", "Rework within 24 hours is free. If a dispute is upheld, we refund in full or in part depending on the outcome."],
    ["Shell Circle", "If a Circle doesn't reach its minimum number of flats by the cutoff time, everyone is refunded automatically."],
  ] },
  "helper-agreement": { title: "Helper Agreement", version: "0.1 (draft)", effective: "1 January 2026", changelog: ["0.1: First draft for lawyer review."], sections: [
    ["Eligibility", "You must be 18 or older, hold valid government and college or work ID, pass a selfie liveness check and complete safety training before your first job."],
    ["Independent work", "You choose when you work. You are not an employee of Shell. You agree to follow the checklists and safety rules for each task."],
    ["Payments", "You receive the helper payout shown on each offer. Payouts are weekly and free, or instant for a small fee. Tips go 100% to you."],
    ["Conduct", "No sharing personal numbers, no off-platform deals, no photography inside homes beyond the job checklist, and no work on banned categories."],
    ["Strikes and appeals", "Rule breaks result in documented strikes. You can see the reason and evidence for each strike, and appeal once."],
  ] },
  "community-safety": { title: "Community and Safety Policy", version: "0.1 (draft)", effective: "1 January 2026", changelog: ["0.1: First draft for lawyer review."], sections: [
    ["Respect", "Everyone on Shell treats each other with respect. Harassment, discrimination and unwanted contact are not tolerated."],
    ["Door code and gate pass", "Every job starts with a door code from the customer, and a gate pass is sent to the society guard."],
    ["SOS", "Both customers and helpers can raise an SOS. Our team is alerted within 20 seconds, and the society guard is notified."],
    ["Reporting", "Report any concern in the app or on our 24x7 safety line. Reports are reviewed by a person."],
  ] },
  grievance: { title: "Grievance Officer", version: "0.1 (draft)", effective: "1 January 2026", changelog: ["0.1: Placeholder details. Replace before launch."], sections: [
    ["Officer", "Name: To be appointed. Email: grievance@shell.example. Address: Shell, Dwarka, New Delhi."],
    ["Response time", "We acknowledge complaints within 24 hours and resolve them within 15 days."],
  ] },
  cookies: { title: "Cookie Policy", version: "0.1 (draft)", effective: "1 January 2026", changelog: ["0.1: First draft for lawyer review."], sections: [
    ["Essential cookies", "A session cookie keeps you signed in. A preference cookie remembers your cookie choice. These cannot be turned off."],
    ["Analytics", "We load analytics only if you accept. We use them to understand which pages and flows need to be clearer."],
    ["Marketing", "We do not use marketing or advertising cookies."],
  ] },
};

export const GUIDES = [
  { slug: "prep-home-for-guests-in-24-hours", title: "How to prep your home for guests in 24 hours", author: "The Shell team", read: 5, date: "2026-01-12", summary: "A simple hour-by-hour plan, working backwards from the doorbell.",
    body: [["Start at T minus 24 hours: groceries", "Write your list before you sleep. Shopping a day ahead gives you time to handle anything out of stock, and keeps fresh items from sitting around."], ["T minus 12 hours: the big clean", "Clean the rooms guests will see: living room, guest bathroom and kitchen. Leave bedrooms for last. If you're short on time, this is the task to delegate first."], ["T minus 6 hours: wardrobes and clutter", "Guests rarely open your wardrobe, but you will want a place to put the things you clear off surfaces. Sort, fold and shelve."], ["T minus 3 hours: setup", "Decoration, seating and lighting. Finish early so you can shower and sit down before the first guest arrives."]] },
  { slug: "how-to-organise-a-wardrobe", title: "How to organise a wardrobe so it stays organised", author: "Priya, Shell helper", read: 4, date: "2026-01-20", summary: "Zones beat folding tricks. Here's how to set them up.",
    body: [["Empty everything", "It feels dramatic, but you can't organise what you can't see. Lay everything on the bed."], ["Sort into four piles", "Wear weekly, wear seasonally, special occasion, and let go. Be honest with the last one."], ["Make zones", "Daily wear at eye level, seasonal on the top shelf, special occasion on the far side. Zones stay organised because they match how you live."]] },
  { slug: "stay-safe-hiring-help-at-home", title: "Staying safe when you invite help into your home", author: "The Shell team", read: 4, date: "2026-02-02", summary: "What to check, whoever you hire.",
    body: [["Verify identity", "Ask for a government ID and match it to the person at your door. With Shell, this is done for you before the helper is approved."], ["Use a door code", "A code that only the customer knows means the right person starts the right job."], ["Tell someone", "Share the job with a family member. Shell has a live status link for this."]] },
];

export const HELP = [
  { cat: "Customers", q: "How do I book my first task?", a: "Open the app, type what you need in the box on the home screen and tap Send to Shell. Answer a couple of quick questions, review your plan, and approve and pay." },
  { cat: "Customers", q: "Why do I see a price range first?", a: "Until you approve the plan, we show an estimate. When you approve, the exact amount is locked and it won't change unless you accept a change request." },
  { cat: "Customers", q: "What is the door code?", a: "A 4-digit code shown in your order page. Share it with your helper only when they are at your door. The job can't start without it." },
  { cat: "Customers", q: "How do I ask for a rework?", a: "Open the order, tap Needs rework, pick what needs fixing and add a note. The helper returns within 24 hours at no cost." },
  { cat: "Customers", q: "How do refunds work?", a: "Cancel before the helper is on the way for a full refund. Unspent grocery or errand money returns to your wallet automatically." },
  { cat: "Customers", q: "What is a Circle?", a: "Neighbours in your tower book the same service in the same slot. The more flats that join, the lower the price for everyone." },
  { cat: "Helpers", q: "How do I apply?", a: "Sign in with your phone number, then complete the 7-step application. It saves after every step so you can finish later." },
  { cat: "Helpers", q: "When do I get paid?", a: "Weekly payouts are free. Instant payouts are available for a small fee. Tips are always 100% yours." },
  { cat: "Helpers", q: "Why can't I check in?", a: "You must be within about 150 metres of the address and enter the customer's door code. Ask the customer to read it from their app." },
  { cat: "Helpers", q: "What happens if I get a strike?", a: "You'll see the reason and evidence on the Strikes page, and you can appeal once. Strikes expire after 60 days." },
];

export const PRESS = { boilerplate: "Shell is a managed personal assistant service for India, launching first inside a single apartment society in Delhi. Customers write one message and Shell plans it, sends verified helpers and sees it through, with a completion guarantee." };

export function packEstimate(items: { slug: string; quantity: number }[]) {
  const p = computePlan({ lines: items.map((i) => { const c = CATALOG.find((x) => x.slug === i.slug)!; return { slug: c.slug, name: c.name, kind: c.kind, rate: c.rate * 100, mins: c.mins, quantity: i.quantity, size: "medium" as Size }; }) });
  return p;
}

export const TRAINING = {
  safety: { title: "Safety and conduct (required)", cards: ["Always wait for the customer's door code before entering. Never start without it.", "Never share your personal phone number, UPI ID or social handles. Chat and payments stay inside Shell.", "Treat valuables with care. Don't touch anything on the customer's do-not-touch list.", "Respect and consent: ask before moving personal items. Zero tolerance for harassment of any kind.", "If you feel unsafe at any time, press SOS. Our team and the society guard are alerted within 20 seconds.", "Risky categories such as massage, makeup and personal care are not allowed. Never do homework for anyone."],
    quiz: [{ q: "What do you need before starting a job?", o: ["The customer's door code", "A verbal okay at the gate", "Nothing, if you are on time"], a: 0 }, { q: "A customer asks for your phone number. What do you do?", o: ["Share it, it's easier", "Politely keep chatting inside Shell", "Give a friend's number"], a: 1 }, { q: "You feel unsafe during a job. What is the first step?", o: ["Finish quickly", "Press SOS", "Text a friend later"], a: 1 }, { q: "A customer asks you to complete their homework. You...", o: ["Do it for extra pay", "Explain the concept but don't complete it", "Do half of it"], a: 1 }, { q: "Which item is on the do-not-touch list?", o: ["Anything the customer lists", "Only valuables", "Nothing"], a: 0 }] },
  general: { title: "Doing the job well", cards: ["Photograph before and after, in good light, from the same angle.", "Follow the checklist in order and tick items as you go.", "If a task needs more time, send an extra-time request. Don't just stay longer.", "Be on time. Message the customer if you'll be late."],
    quiz: [{ q: "Where should before and after photos be taken from?", o: ["Any angle", "The same angle", "Only after"], a: 1 }, { q: "The task needs more time. You...", o: ["Send an extra-time request", "Stay quietly", "Leave early"], a: 0 }, { q: "You'll be late. You...", o: ["Say nothing", "Message the customer", "Cancel"], a: 1 }] },
};
