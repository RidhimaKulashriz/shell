// DRAFT legal templates. They need a lawyer's review before launch.
export type LegalDoc = { slug: string; title: string; version: string; effective: string; changelog: string[]; sections: [string, string][] };

const common = { version: "0.1-draft", effective: "2026-01-01", changelog: ["0.1-draft: first template for pilot review"] };

export const LEGAL: LegalDoc[] = [
  { slug: "terms", title: "Terms of Service", ...common, sections: [
    ["What Shell is", "Shell is a managed service. We plan tasks, assign verified helpers and take responsibility for completion. Helpers are independent service providers, coordinated and covered by Shell for jobs booked and paid inside Shell."],
    ["Your account", "You must be 18 or older and provide an accurate phone number and address. You are responsible for who you share your door OTP with."],
    ["Plans and prices", "You see a price range first and an exact amount after a person checks the plan. Prices include GST. Fees are shown as separate lines on the receipt."],
    ["Payments", "You pay upfront. Funds are held and released to the helper after you approve the job, or two hours after completion if you do not respond."],
    ["What we do not do", "Massage, makeup and personal care are not offered. We do not do homework or assignments. Illegal items and activities are prohibited."],
    ["Keeping transactions on Shell", "Sharing phone numbers, UPI IDs or social handles to deal outside Shell is not allowed. Guarantee, damage cover and instant payouts apply only to jobs done inside Shell."],
    ["Limits of liability", "Shell Guarantee covers rework within 24 hours and damage up to a stated limit. Beyond that, liability is limited as permitted by law. [Lawyer to complete.]"],
  ] },
  { slug: "privacy", title: "Privacy Policy (DPDP)", ...common, sections: [
    ["What we collect", "Phone number, name, address and pin, Home Atlas details you choose to share, chat messages, job photos, payment references, and location of helpers during active jobs."],
    ["What we never store", "We never store a raw Aadhaar number. We keep a reference ID and a verified flag from our KYC provider."],
    ["Location", "Helper location is collected only during an active job and stops at check-out. Customers see a 'location is being shared' indicator. Pings are purged after 30 days and downsampled routes are kept for disputes only."],
    ["Consent", "We ask for explicit consent for location, WhatsApp messages and marketing, separately. You can withdraw any consent in Settings."],
    ["Staff access", "Every staff access to location data and ID documents is recorded in an audit log."],
    ["Your rights", "You can download your data, correct it, and delete your account. Deletion has a 7-day cooling-off period. Financial records are retained as required by law."],
    ["Grievances", "Contact our Grievance Officer using the details on the Grievance Officer page."],
  ] },
  { slug: "refund-cancellation", title: "Refund and Cancellation Policy", ...common, sections: [
    ["Cancelling a plan", "Free until a helper is assigned. After assignment, a small fee may apply, shown before you confirm. If we cancel, you get a full refund."],
    ["Helper no-show", "If a helper is more than 10 minutes late with no notice, we reassign and give you a credit."],
    ["Rework and refunds", "Ask for rework within 24 hours. If the issue persists we refund the affected part. Partial work is billed pro-rata with photo evidence."],
    ["Expense wallet", "Unused amount from a spending cap is refunded automatically after you approve the receipt."],
    ["Circles", "If a Circle does not reach its minimum by the cutoff, it is cancelled and you are refunded automatically."],
    ["Timelines", "Refunds reach the original payment method in 5 to 7 working days, or the Shell Wallet instantly."],
  ] },
  { slug: "helper-agreement", title: "Helper Agreement", ...common, sections: [
    ["Eligibility", "You must be 18 or older, with valid ID, and complete verification, safety training and a shadow job."],
    ["Independent provider", "You are an independent provider. You choose your slots and can decline offers. Shell does not guarantee a minimum number of jobs."],
    ["Conduct", "Respect customers and their homes. Never share personal phone numbers, never accept payment outside Shell, never take photos of private areas, never enter without the door OTP."],
    ["Payouts", "You are paid after the customer approves. Weekly payouts are free. Instant payouts carry a small fee. TDS applies where required by law."],
    ["Strikes", "Breaches earn strikes with a stated reason and evidence. You may appeal once. Repeated or serious breaches can lead to suspension or a ban."],
    ["Safety", "Use SOS whenever you feel unsafe. Leave the job and tell us. You will not be penalised for leaving an unsafe situation."],
  ] },
  { slug: "community-safety", title: "Community and Safety Policy", ...common, sections: [
    ["Respect", "No harassment, discrimination or threats from anyone, customer or helper."],
    ["Closed categories", "Massage, makeup and personal care are closed at launch. Tutoring is explaining only, never doing homework."],
    ["Children and pets", "A responsible adult must be at home for tutoring jobs involving children. Pets must be declared in the Home Atlas."],
    ["Valuables", "Keep valuables locked away and list areas in the do-not-touch list."],
    ["Reporting", "Report any concern in the app or on the 24x7 safety line. We respond to SOS within 20 seconds."],
  ] },
  { slug: "grievance-officer", title: "Grievance Officer", ...common, sections: [
    ["Officer", "Name: [to be appointed]. Designation: Grievance Officer, Shell. Address: [registered office, Delhi]. Email: grievance@shell.example."],
    ["Response time", "We acknowledge within 24 hours and aim to resolve within 15 days."],
    ["How to complain", "Email the Grievance Officer with your order id, a description and any evidence. You can also raise a dispute from the app."],
  ] },
  { slug: "cookies", title: "Cookie Policy", ...common, sections: [
    ["Essential cookies", "Keep you logged in, remember your language and cookie choice. Always on."],
    ["Analytics", "With your consent we count page views and clicks using first-party analytics. Reject non-essential cookies and none are loaded."],
    ["Changing your mind", "Clear the shell_consent cookie or use the Cookie Settings link to choose again."],
  ] },
];
