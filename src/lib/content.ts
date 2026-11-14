// Editorial content. Phase 1 moves guides and help into a CMS (ContentPost, FAQ tables).

export type Guide = { slug: string; title: string; description: string; author: string; date: string; sections: { h: string; p: string[] }[] };

export const GUIDES: Guide[] = [
  {
    slug: "prep-your-home-for-guests-in-24-hours",
    title: "How to prep your home for guests in 24 hours",
    description: "A calm, hour-by-hour plan for getting a home guest-ready in one day, with what to do first and what to skip.",
    author: "Team Shell",
    date: "2026-05-02",
    sections: [
      { h: "Start with the list, not the broom", p: ["Write down everything guests will see or use: the entrance, the drawing room, the bathroom, the kitchen counter, the place they will sit. Anything else can wait. Most of the stress comes from trying to fix the whole house instead of the path guests will walk."] },
      { h: "T minus 24 hours: groceries", p: ["Buy first. Shops are less crowded in the morning and you can store things properly. Make the list in three groups: things to cook, things to serve cold, and things to put on the table. Add a cushion of one extra item per group, not more."] },
      { h: "T minus 12 hours: the big clean", p: ["Do floors, bathrooms and the kitchen slab. These take the longest and show the most. Do them the night before so you wake up to a quiet house, and just wipe surfaces in the morning."] },
      { h: "T minus 6 hours: the wardrobe and the clutter", p: ["Clear the places guests might open: the shoe rack, the coat hooks, the guest bathroom cabinet. Put everything else in one room and close the door. That is not cheating, that is how hosts survive."] },
      { h: "T minus 3 hours: decor and a last look", p: ["Fresh flowers or one string of lights make more difference than ten small items. Walk in the way a guest would, from the door. Fix only what you notice in the first ten seconds."] },
      { h: "Or let Shell take the list", p: ["The Guests Aa Rahe Hain pack does exactly this timeline, with verified helpers and one receipt. Not launched in your society yet? Join the waitlist and we will tell you when we arrive."] },
    ],
  },
  {
    slug: "how-to-check-a-helper-before-they-enter-your-home",
    title: "How to check a helper before they enter your home",
    description: "Five questions worth asking before anyone you do not know comes into your home, whoever they work for.",
    author: "Team Shell",
    date: "2026-05-09",
    sections: [
      { h: "Ask for a name and a face", p: ["You should know who is coming before they arrive: a first name and a photo at least. If you only have a phone number, you do not have enough."] },
      { h: "Ask what was verified", p: ["Government ID, a second ID such as a college card, and a selfie matched to the ID are a sensible base. Ask whether the number is stored, and prefer anyone who does not keep it."] },
      { h: "Use a code at the door", p: ["A one-time code only you can give means the person at the door is the person you expected. It takes five seconds."] },
      { h: "Tell the guard", p: ["A gate pass shared with the society guard means two people know who is visiting. It is the cheapest safety feature there is."] },
      { h: "Keep payment and chat in one place", p: ["If something goes wrong, a record helps everyone. That is why Shell keeps chat and payment inside the app."] },
    ],
  },
  {
    slug: "student-side-hustles-that-actually-fit-a-timetable",
    title: "Student side hustles that actually fit a timetable",
    description: "Work that fits around classes: short slots, skills you already have, and how to turn them into a record you can show.",
    author: "Team Shell",
    date: "2026-05-16",
    sections: [
      { h: "Look for short slots", p: ["One to two hours between classes is enough for errands, explaining a chapter, or sorting a spreadsheet. Avoid anything that needs a whole day."] },
      { h: "Sell the skill, not the hours", p: ["Excel, a language, a sport, organising. Skills you already have are worth more per hour than generic help."] },
      { h: "Keep a record", p: ["Ratings, jobs done and on-time rate are a small CV on their own. A Skill Passport turns them into something you can attach to an internship application."] },
      { h: "Stay safe", p: ["Work inside a society with a gate pass and a door code, tell someone where you are, and never share personal numbers. Any good platform makes this the default."] },
    ],
  },
];

export type LegalDoc = { slug: string; title: string; version: string; effective: string; sections: { h: string; p: string }[]; changelog: string[] };

const DRAFT = "DRAFT template. Needs review by a qualified lawyer before launch.";
export const LEGAL: LegalDoc[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    version: "0.1",
    effective: "2026-06-01",
    changelog: ["0.1: first draft"],
    sections: [
      { h: "Status of this document", p: DRAFT },
      { h: "1. What Shell is", p: "Shell is a managed service that plans and coordinates household tasks and arranges verified helpers. Shell is responsible for coordinating the work and for the Shell Guarantee as described on the Pricing and Safety pages." },
      { h: "2. Accounts", p: "You sign in with a mobile number verified by OTP. You are responsible for activity on your account and for keeping your door OTP private." },
      { h: "3. Plans, prices and payment", p: "Prices are shown as a range until a plan is approved and as an exact amount after. Payment is taken at approval and held until you approve the work or the auto-approve window ends." },
      { h: "4. What we do not do", p: "We do not provide massage, makeup or personal care services, and we do not do homework or assessed work for any student. Helpers are 18 or above." },
      { h: "5. Staying on Shell", p: "Sharing phone numbers, UPI IDs or social handles to arrange work outside Shell is not allowed. Benefits such as the Guarantee, damage cover and protected payment apply only to work done through Shell." },
      { h: "6. Liability", p: "Damage cover applies up to the limit stated in the Guarantee. Nothing here limits liability that cannot be limited by law." },
      { h: "7. Governing law", p: "Indian law applies. Courts at Delhi have jurisdiction, subject to any consumer rights you have." },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy (DPDP)",
    version: "0.1",
    effective: "2026-06-01",
    changelog: ["0.1: first draft"],
    sections: [
      { h: "Status of this document", p: DRAFT },
      { h: "What we collect", p: "Name, mobile number, society and address details, the messages and photos you send, payment records (via our payment provider), and location during an active job only." },
      { h: "What we never store", p: "We never store a raw Aadhaar number. Identity checks go through a KYC provider and we keep only a reference and a verified flag." },
      { h: "Why we use it", p: "To plan and perform your jobs, keep helpers and residents safe, prevent fraud, and improve the service. Analytics cookies load only after you consent." },
      { h: "Location", p: "Location is shared only during an active job, with your explicit consent. Location pings are deleted after 30 days, and staff access to location data is logged." },
      { h: "Your rights", p: "You can access, correct, export and delete your data, withdraw consent, and nominate someone to exercise your rights. Account deletion has a 7-day cooling period." },
      { h: "Grievances", p: "Contact the Grievance Officer listed on the Grievance Officer page. We aim to reply within 7 days." },
    ],
  },
  {
    slug: "refunds",
    title: "Refund and Cancellation Policy",
    version: "0.1",
    effective: "2026-06-01",
    changelog: ["0.1: first draft"],
    sections: [
      { h: "Status of this document", p: DRAFT },
      { h: "Cancelling a task", p: "Free until 3 hours before the scheduled start. Within 3 hours a part of the platform fee may be kept. Rush jobs cannot be cancelled once a helper is on the way." },
      { h: "If a helper does not show up", p: "We re-assign automatically after 10 minutes, add a credit, and refund in full if we cannot find a backup." },
      { h: "Rework and refunds", p: "If work is not as agreed, we redo it free within 24 hours. If that fails, we refund the affected lines in full or part." },
      { h: "Expense wallet", p: "Money held as a spending cap is refunded automatically for the unspent portion." },
      { h: "Circles", p: "If a Circle does not reach its minimum by the cutoff, it is cancelled and everyone is refunded automatically." },
    ],
  },
  {
    slug: "helper-agreement",
    title: "Helper Agreement",
    version: "0.1",
    effective: "2026-06-01",
    changelog: ["0.1: first draft"],
    sections: [
      { h: "Status of this document", p: DRAFT },
      { h: "Eligibility", p: "You must be 18 or older, provide a government ID through our KYC provider, and complete safety training before your first job." },
      { h: "Independent work", p: "You choose when to work. You are not an employee of Shell. You are responsible for your own taxes, and Shell will provide statements." },
      { h: "Conduct", p: "Respect every home, follow the checklist, never share personal numbers, and never arrange work outside Shell. Harassment of any kind leads to removal." },
      { h: "Safety", p: "Use the SOS button if you feel unsafe. You may refuse any job that feels risky without penalty." },
      { h: "Strikes", p: "Strikes are given with reasons and evidence and you can appeal each one." },
      { h: "Payouts", p: "Pay is released after customer approval or the auto-approve window. Weekly payout is free; instant payout has a small fee." },
    ],
  },
  {
    slug: "community-safety",
    title: "Community and Safety Policy",
    version: "0.1",
    effective: "2026-06-01",
    changelog: ["0.1: first draft"],
    sections: [
      { h: "Status of this document", p: DRAFT },
      { h: "For everyone", p: "Be respectful. No harassment, discrimination or threats. Do not record people in private spaces." },
      { h: "Not allowed", p: "Massage, makeup, personal care, doing homework, anything illegal, anything involving gambling or alcohol delivery." },
      { h: "Safety features", p: "Door OTP, gate pass for the guard, live check-in and check-out, geofence alerts, SOS with a 20-second ops response goal." },
      { h: "Reporting", p: "Use the SOS button for emergencies and Report a concern for everything else. Our safety line is on the Safety page." },
    ],
  },
  {
    slug: "grievance",
    title: "Grievance Officer",
    version: "0.1",
    effective: "2026-06-01",
    changelog: ["0.1: first draft"],
    sections: [
      { h: "Status of this document", p: DRAFT },
      { h: "Grievance Officer", p: "Name: [to be appointed before launch]. Address: [registered office address]. Email: see the Contact page." },
      { h: "How we respond", p: "We acknowledge within 48 hours and resolve within 15 days. Safety concerns are handled immediately through the safety line." },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    version: "0.1",
    effective: "2026-06-01",
    changelog: ["0.1: first draft"],
    sections: [
      { h: "Status of this document", p: DRAFT },
      { h: "Essential", p: "Language preference and consent choice. These make the site work and are always on." },
      { h: "Analytics", p: "First-party visit counting (page views, scroll depth, button clicks). It loads only after you click Accept, and you can change your mind by clearing site data." },
      { h: "Third parties", p: "We do not use advertising cookies. Fonts load from Google Fonts." },
    ],
  },
];

export const HELP_ITEMS = [
  { section: "customer" as const, topic: "plans", q: "How long does a plan take?", a: "A human checks every plan. During working hours that takes about 15 minutes." },
  { section: "customer" as const, topic: "payment", q: "When do I pay?", a: "When you approve the plan. The money is held until you approve the finished work." },
  { section: "customer" as const, topic: "safety", q: "Where is the door OTP shown?", a: "On the live tracker, in big digits. Share it only with the helper at your door." },
  { section: "customer" as const, topic: "refund", q: "How do I get a refund?", a: "Ask for rework in the app within 24 hours, or raise a dispute. Refunds go back to the original payment method." },
  { section: "customer" as const, topic: "chaabi", q: "Chaabi kaise dete hain?", a: "Aap ghar par ho, guard ko do, ya lockbox use karo jo OTP se khulta hai. Shell chaabi nahi rakhta." },
  { section: "customer" as const, topic: "female helper", q: "Female helper kaise chunu?", a: "Home Atlas mein 'female helper only' on karo." },
  { section: "helper" as const, topic: "apply", q: "What do I need to apply?", a: "You must be 18+, with a government ID, a college ID or a skill, a selfie, and a UPI or bank account for payouts." },
  { section: "helper" as const, topic: "training", q: "Is training paid?", a: "Training is free. The safety module is mandatory before your first job." },
  { section: "helper" as const, topic: "payout", q: "Payout kab milta hai?", a: "Weekly payout free hai. Instant payout par chhoti si fee lagti hai." },
  { section: "helper" as const, topic: "sos", q: "What if I feel unsafe at a job?", a: "Press and hold SOS. You can also leave and report the customer without penalty." },
  { section: "helper" as const, topic: "levels", q: "How do levels work?", a: "Starter 0 to 10 jobs, Trusted 11 to 40 with 4.6+, Pro 41 to 120, Elite 121+." },
];
