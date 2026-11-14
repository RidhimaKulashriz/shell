// Static catalog: seeds the database and powers public pages + the plan engine.
// Rates are in rupees here; they are converted to paise when seeded.

export type CatalogQuestion = {
  key: string;
  text: string;
  affects: "quantity" | "size" | "cap" | "note";
  chips: { label: string; value: string }[];
};

export type CatalogItem = {
  slug: string;
  name: string;
  kind: "quick" | "managed";
  icon: string;
  rate: number;
  unit: string;
  mins: number;
  qty: number;
  keywords: string[];
  intro: string;
  included: string[];
  excluded: string[];
  checklist: string[];
  questions: CatalogQuestion[];
  faqs: { q: string; a: string }[];
  runNote: string;
  helper: string;
};

export const BANNED_KEYWORDS = [
  "massage", "makeup", "make-up", "make up", "facial", "waxing", "threading", "spa", "haircut", "personal care",
  "homework", "do my assignment", "write my assignment", "write my essay", "maalish", "malish",
];

export const CATALOG: CatalogItem[] = [
  {
    slug: "house-cleaning", name: "House cleaning", kind: "managed", icon: "broom", rate: 250, unit: "room", mins: 45, qty: 2,
    keywords: ["clean", "cleaning", "saaf", "safai", "jhaadu", "jhadu", "pochha", "mop", "sweep", "dust", "vacuum", "ghar saaf", "deep clean", "bathroom"],
    intro: "A trained helper cleans your rooms to a printed checklist, with before and after photos, so you can see exactly what changed.",
    included: ["Sweeping, mopping and dusting", "Bathroom wash and fittings wipe", "Kitchen counters and sink", "Bins emptied", "Before and after photos"],
    excluded: ["Deep chemical treatments", "Window exteriors above the ground floor", "Moving heavy furniture", "Pest control"],
    checklist: ["Dust all surfaces", "Sweep and mop floors", "Clean bathroom", "Wipe kitchen counters", "Empty bins", "Final walkthrough photo"],
    questions: [
      { key: "rooms", text: "How big is your home?", affects: "quantity", chips: [{ label: "1 BHK (3 rooms)", value: "3" }, { label: "2 BHK (4 rooms)", value: "4" }, { label: "3 BHK (6 rooms)", value: "6" }] },
    ],
    faqs: [
      { q: "Do I need to supply cleaning products?", a: "No. Helpers bring standard supplies. If you have allergies or prefer certain products, add that to your Home Atlas and the helper will see it." },
      { q: "Can I ask for a female helper?", a: "Yes. Set it once in your Home Atlas and every cleaning job will be matched accordingly." },
      { q: "What if a corner was missed?", a: "Request a rework from the order page within 24 hours. We send the helper back at no charge." },
    ],
    runNote: "Helper arrives, photographs each room, cleans to the checklist, then photographs the result for your approval.", helper: "Cleaning helpers",
  },
  {
    slug: "utensils", name: "Utensils and dishes", kind: "quick", icon: "pan", rate: 150, unit: "load", mins: 30, qty: 1,
    keywords: ["utensil", "utensils", "dishes", "dishwashing", "bartan", "bartaan", "wash dishes", "sink"],
    intro: "Piles of dishes after guests or a long week, washed, dried and stacked where you keep them.",
    included: ["Washing and rinsing", "Drying and stacking", "Sink and platform wipe"],
    excluded: ["Dishwasher repairs", "Deep scrubbing of burnt cookware beyond reasonable effort"],
    checklist: ["Wash all utensils", "Dry and stack", "Clean sink", "Wipe platform"],
    questions: [
      { key: "loads", text: "How much is there to wash?", affects: "quantity", chips: [{ label: "A sink full", value: "1" }, { label: "A big pile", value: "2" }, { label: "After a party", value: "3" }] },
    ],
    faqs: [
      { q: "What counts as one load?", a: "Roughly one full kitchen sink of dishes. A party pile is usually two to three loads." },
      { q: "Do you handle fragile crockery?", a: "Yes. Tell us in the notes and helpers will hand wash and take extra care." },
    ],
    runNote: "A quick single-helper job, usually under an hour.", helper: "Home helpers",
  },
  {
    slug: "groceries", name: "Groceries", kind: "quick", icon: "bag", rate: 149, unit: "trip", mins: 60, qty: 1,
    keywords: ["grocery", "groceries", "sabzi", "sabji", "kirana", "vegetables", "fruits", "milk", "supermarket", "shopping list", "ration"],
    intro: "Send a list and a spending cap. A helper buys from your preferred shop, uploads the bill, and any unused money is refunded.",
    included: ["Shopping from your list", "Photo of the bill, itemised", "Substitution only with your approval", "Delivery to your door"],
    excluded: ["Alcohol and tobacco", "Prescription medicines", "Items above your spending cap without approval"],
    checklist: ["Buy listed items", "Check freshness", "Upload bill", "Deliver to door"],
    questions: [
      { key: "cap", text: "How much should the helper be allowed to spend?", affects: "cap", chips: [{ label: "Up to ₹1,000", value: "1000" }, { label: "Up to ₹2,500", value: "2500" }, { label: "Up to ₹5,000", value: "5000" }] },
    ],
    faqs: [
      { q: "How does the spending cap work?", a: "We hold the cap amount. The helper uploads the bill, you approve the itemised list, and whatever was not spent returns to your payment method or wallet." },
      { q: "What if something is out of stock?", a: "The helper messages you in the order chat. Nothing is substituted unless you say yes." },
    ],
    runNote: "Money is held up to your cap. Anything unspent comes back automatically.", helper: "Errand helpers",
  },
  {
    slug: "errands", name: "Errands", kind: "quick", icon: "scooter", rate: 180, unit: "hour", mins: 60, qty: 1,
    keywords: ["errand", "errands", "pickup", "chemist", "pharmacy", "laundry", "dry clean", "tailor", "bank", "post office", "kaam"],
    intro: "Laundry pickups, pharmacy runs, tailor drops: one helper, one route, one bill.",
    included: ["Pickup and drop within the area", "Route planned for the fewest stops", "Photo proof of each stop"],
    excluded: ["Anything illegal or restricted", "Cash handling beyond your cap"],
    checklist: ["Collect item", "Complete stop", "Photo proof", "Return to door"],
    questions: [],
    faqs: [
      { q: "Can you handle multiple stops?", a: "Yes. We order the stops to save time and show the route in your plan." },
      { q: "How is it priced?", a: "By the hour of helper time, plus nothing extra inside your society." },
    ],
    runNote: "Multiple stops are ordered into a single efficient route.", helper: "Errand helpers",
  },
  {
    slug: "parcel-pickup", name: "Parcel pickup and drop", kind: "quick", icon: "parcel", rate: 99, unit: "trip", mins: 30, qty: 1,
    keywords: ["parcel", "courier", "package", "delivery", "amazon", "dispatch", "return pickup", "post"],
    intro: "Collect a parcel from the gate or send one out, without waiting at home for the delivery.",
    included: ["Collection from gate or nearby courier point", "Hand-over at your door", "Photo of the parcel"],
    excluded: ["Parcels above 15 kg", "Hazardous items"],
    checklist: ["Collect parcel", "Photo of parcel", "Hand over at door"],
    questions: [],
    faqs: [
      { q: "Can you send a return parcel?", a: "Yes. Give us the pickup details and we drop it at the courier point." },
      { q: "Is the parcel insured?", a: "Shell damage cover applies while the parcel is with our helper." },
    ],
    runNote: "Typically 30 minutes door to door.", helper: "Errand helpers",
  },
  {
    slug: "wardrobe-organising", name: "Wardrobe organising", kind: "managed", icon: "hanger", rate: 450, unit: "wardrobe", mins: 90, qty: 1,
    keywords: ["wardrobe", "almirari", "almari", "cupboard", "closet", "organise", "organize", "folding", "clothes"],
    intro: "Clothes sorted, folded and zoned by season and use, with a photo of each shelf when we are done.",
    included: ["Sorting by type and season", "Folding and zoning", "Shelf labels if you want them", "Donation pile separated"],
    excluded: ["Throwing away items without your say", "Jewellery and valuables handling unless you supervise"],
    checklist: ["Empty wardrobe", "Sort into groups", "Fold and stack", "Return by zone", "Photo of each shelf"],
    questions: [
      { key: "count", text: "How many wardrobes need organising?", affects: "quantity", chips: [{ label: "1", value: "1" }, { label: "2", value: "2" }, { label: "3 or more", value: "3" }] },
    ],
    faqs: [
      { q: "Will helpers touch my valuables?", a: "Mark them on your do-not-touch list. Helpers only see the notes relevant to the task." },
      { q: "Can I be present?", a: "Of course. Many customers prefer to stay for the first session." },
    ],
    runNote: "Best done with you home for the first session so zones match how you live.", helper: "Home helpers",
  },
  {
    slug: "decoration", name: "Decoration", kind: "managed", icon: "lamp", rate: 300, unit: "hour", mins: 60, qty: 2,
    keywords: ["decoration", "decorate", "decor", "sajawat", "balloon", "balloons", "lights", "banner", "party setup", "theme", "diwali"],
    intro: "Balloons, lights and table setups for birthdays, festivals and guests, done on time and cleared up afterwards if you like.",
    included: ["Setup from your reference photo", "Basic materials handling", "Cleanup option after the event"],
    excluded: ["Purchase of decor items unless covered by an expense cap", "Electrical wiring work"],
    checklist: ["Review reference", "Set up", "Photo of finished setup", "Clear packaging"],
    questions: [
      { key: "hours", text: "How long should decoration take?", affects: "quantity", chips: [{ label: "About 2 hours", value: "2" }, { label: "About 3 hours", value: "3" }, { label: "Half a day", value: "4" }] },
    ],
    faqs: [
      { q: "Who buys the decor?", a: "You can supply it, or use an expense cap and the helper buys from your preferred shop with a bill." },
      { q: "Can I share a reference photo?", a: "Yes. Attach it when you describe the task and the helper will see it." },
    ],
    runNote: "Scheduled to finish a few hours before your guests arrive.", helper: "Event helpers",
  },
  {
    slug: "event-help", name: "Event help", kind: "managed", icon: "key", rate: 220, unit: "hour", mins: 60, qty: 3,
    keywords: ["event", "party", "guests", "guest", "serve", "serving", "host", "gathering", "function", "birthday", "mehman", "mehmaan"],
    intro: "An extra pair of hands for the day: setting out food, serving, topping up and tidying while you enjoy your guests.",
    included: ["Table setup and serving", "Refills and tidying during the event", "Post-event clear-up"],
    excluded: ["Cooking", "Bartending"],
    checklist: ["Arrive before start time", "Set up tables", "Serve and tidy", "Clear-up"],
    questions: [
      { key: "hours", text: "How many hours of help do you need?", affects: "quantity", chips: [{ label: "3 hours", value: "3" }, { label: "4 hours", value: "4" }, { label: "6 hours", value: "6" }] },
    ],
    faqs: [
      { q: "How many helpers will come?", a: "One helper for events under 15 guests. We add more on request and show it in the plan." },
      { q: "Can helpers cook?", a: "No. Event help covers serving and tidying. Cooking is outside what we offer at launch." },
    ],
    runNote: "Helper arrives early, stays through the event, and leaves the space clean.", helper: "Event helpers",
  },
  {
    slug: "excel-data-help", name: "Excel and data help", kind: "quick", icon: "phone", rate: 350, unit: "hour", mins: 60, qty: 1,
    keywords: ["excel", "spreadsheet", "data entry", "pivot", "google sheets", "sheet", "formulas", "csv", "data"],
    intro: "A student or freelancer who is good with spreadsheets helps you clean, organise or build a sheet, in person or by screen share.",
    included: ["Data cleaning and formatting", "Formulas and pivot tables", "Short walkthrough so you can maintain it"],
    excluded: ["Confidential financial audits", "Anything that requires professional certification"],
    checklist: ["Understand the sheet", "Do the work", "Walkthrough", "Share final file"],
    questions: [],
    faqs: [
      { q: "Is my data safe?", a: "Helpers work only on what you share, inside the job window. Shared files are not kept after the job closes." },
      { q: "Can this be done remotely?", a: "Yes, via screen share, in chat with your helper." },
    ],
    runNote: "Can be in person or over a screen share.", helper: "Skills helpers",
  },
  {
    slug: "tutoring-explaining", name: "Tutoring and explaining", kind: "quick", icon: "phone", rate: 300, unit: "hour", mins: 60, qty: 1,
    keywords: ["tutor", "tutoring", "explain", "padhai", "study", "teach", "exam", "concept", "revision"],
    intro: "A senior student explains a concept, quizzes you or builds a revision plan. We explain and coach. We never do homework for you.",
    included: ["Concept explanation", "Practice questions", "Revision plan"],
    excluded: ["Completing homework or assignments", "Exam impersonation"],
    checklist: ["Agree topics", "Teach and practise", "Summary of next steps"],
    questions: [],
    faqs: [
      { q: "Will the helper do the homework?", a: "No. Helpers explain and guide. Requests to complete homework are declined." },
      { q: "Which subjects are covered?", a: "School subjects up to Class 12, plus common college subjects, depending on helper skills." },
    ],
    runNote: "Helpers explain and coach. They never complete assignments.", helper: "Skills helpers",
  },
  {
    slug: "pet-walking", name: "Pet walking", kind: "quick", icon: "plant", rate: 150, unit: "walk", mins: 30, qty: 1,
    keywords: ["dog", "pet", "walk the dog", "dog walk", "kutta", "puppy", "pet walking"],
    intro: "A confident helper who is comfortable with dogs takes your pet for a walk and sends a photo update.",
    included: ["30-minute walk", "Water and waste handling", "Photo update"],
    excluded: ["Aggressive dogs without prior notice", "Grooming and vet visits"],
    checklist: ["Meet pet", "Walk", "Water and clean-up", "Photo update"],
    questions: [],
    faqs: [
      { q: "What if my dog is nervous?", a: "Add the temperament in your Home Atlas. Helpers are matched on comfort with pets." },
      { q: "Can I share a route?", a: "Yes, in the task notes." },
    ],
    runNote: "A short, regular job that works well as a routine.", helper: "Pet helpers",
  },
  {
    slug: "moving-help", name: "Moving and shifting help", kind: "managed", icon: "parcel", rate: 260, unit: "hour", mins: 60, qty: 3,
    keywords: ["moving", "shifting", "shift", "pack", "packing", "unpack", "relocate", "move in", "move-in", "samaan"],
    intro: "Packing, carrying and unpacking help for a move within the society or the neighbourhood.",
    included: ["Packing and labelling", "Carrying within the society", "Unpacking and basic placing"],
    excluded: ["Long-distance transport", "Dismantling large furniture"],
    checklist: ["Pack and label", "Carry", "Unpack", "Final walkthrough"],
    questions: [
      { key: "hours", text: "How long do you expect the move to take?", affects: "quantity", chips: [{ label: "3 hours", value: "3" }, { label: "5 hours", value: "5" }, { label: "A full day (8)", value: "8" }] },
    ],
    faqs: [
      { q: "Do you provide a truck?", a: "No. We help with packing and carrying. Transport can be coordinated as an errand." },
      { q: "Is there damage cover?", a: "Yes. Shell Guarantee covers damage up to the stated limit." },
    ],
    runNote: "Usually planned a day ahead so the right number of helpers can come.", helper: "Moving helpers",
  },
  {
    slug: "small-repairs", name: "Small repairs coordination", kind: "quick", icon: "key", rate: 199, unit: "visit", mins: 45, qty: 1,
    keywords: ["repair", "plumber", "electrician", "carpenter", "fix", "leak", "tap", "fan", "bulb", "switch"],
    intro: "We find, schedule and supervise the right technician. A Shell helper is there to let them in and check the work against what you asked for.",
    included: ["Scheduling the technician", "Helper present for the visit", "Photo of completed work"],
    excluded: ["Cost of parts and technician charges (paid directly, with receipt)", "Structural repairs"],
    checklist: ["Meet technician", "Confirm scope", "Supervise work", "Photo of result"],
    questions: [],
    faqs: [
      { q: "Do you pay the technician?", a: "Technician charges are quoted up front. You pay them through the app so there is one receipt." },
      { q: "What if the repair is bigger than expected?", a: "The helper raises a change request with a price. Nothing proceeds without your approval." },
    ],
    runNote: "Coordination only. Skilled work is done by vetted technicians.", helper: "Home helpers",
  },
  {
    slug: "queueing", name: "Queueing", kind: "quick", icon: "bicycle", rate: 150, unit: "hour", mins: 60, qty: 2,
    keywords: ["queue", "queueing", "line", "stand in line", "waiting", "token", "office visit", "registration"],
    intro: "Someone to stand in a line for you at a government office, clinic or service centre, and call you when it is nearly your turn.",
    included: ["Holding your place", "A call when you are near the front", "Photo of your token"],
    excluded: ["Signing documents on your behalf", "Handling of original ID documents"],
    checklist: ["Reach location", "Take token", "Update customer", "Hand over place"],
    questions: [],
    faqs: [
      { q: "Can the helper submit documents for me?", a: "No. The helper holds your place. You complete the final step yourself." },
      { q: "How long will it take?", a: "We estimate from typical waits and adjust as the day goes on." },
    ],
    runNote: "You walk in just before your turn.", helper: "Errand helpers",
  },
  {
    slug: "sports-partner", name: "Sports partner", kind: "quick", icon: "bicycle", rate: 200, unit: "hour", mins: 60, qty: 1,
    keywords: ["badminton", "cricket", "tennis", "football", "sports partner", "play with", "table tennis", "running partner", "gym partner"],
    intro: "A friendly practice partner for badminton, tennis, table tennis or a morning run, matched to your level.",
    included: ["One hour of play or practice", "Matched to your level"],
    excluded: ["Professional coaching", "Contact sports with injury risk"],
    checklist: ["Meet at court", "Play", "Feedback notes"],
    questions: [],
    faqs: [
      { q: "Do I need my own equipment?", a: "Bring yours if you can. Some helpers carry spare rackets and say so on their profile." },
      { q: "Can I book the same partner again?", a: "Yes. Mark them as a favourite and request them next time." },
    ],
    runNote: "Held inside the society's courts or grounds.", helper: "Skills helpers",
  },
  {
    slug: "gaming-partner", name: "Gaming partner", kind: "quick", icon: "phone", rate: 180, unit: "hour", mins: 60, qty: 1,
    keywords: ["gaming", "game partner", "play games", "chess", "carrom", "board game", "ps5", "playstation", "video game"],
    intro: "A partner for chess, carrom, board games or console sessions, in person at your home or a common area.",
    included: ["One hour of games", "Friendly matched play"],
    excluded: ["Gambling or betting games", "Account sharing"],
    checklist: ["Agree game", "Play", "Wrap up"],
    questions: [],
    faqs: [
      { q: "Is betting allowed?", a: "No. Games for money are not allowed on Shell." },
      { q: "Is it in person?", a: "Yes, always in person and always at your home or inside a common area of the society." },
    ],
    runNote: "Always in person, always inside the society.", helper: "Skills helpers",
  },
];

export const PACKS = [
  { slug: "guests-are-coming", name: "Guests Are Coming", tagline: "Home ready before the doorbell rings.", description: "Groceries, a deep tidy, an organised wardrobe and a finished setup, timed backwards from your guests' arrival.",
    items: [
      { slug: "groceries", quantity: 1, offsetHours: 24, note: "Shopping delivered a day ahead" },
      { slug: "house-cleaning", quantity: 4, offsetHours: 12, note: "Full home clean" },
      { slug: "wardrobe-organising", quantity: 1, offsetHours: 6, note: "Guest-ready wardrobe" },
      { slug: "decoration", quantity: 2, offsetHours: 3, note: "Final setup" },
    ], helperTypes: ["Errand helpers", "Cleaning helpers", "Home helpers", "Event helpers"] },
  { slug: "move-in-ready", name: "Move-In Ready", tagline: "Arrive to a home that is already livable.", description: "Clean, unpack and set up before you carry in the first box.",
    items: [
      { slug: "house-cleaning", quantity: 6, offsetHours: 24, note: "Pre-move clean" },
      { slug: "moving-help", quantity: 5, offsetHours: 12, note: "Unpacking and placing" },
      { slug: "wardrobe-organising", quantity: 2, offsetHours: 6, note: "Wardrobes set up" },
    ], helperTypes: ["Cleaning helpers", "Moving helpers", "Home helpers"] },
  { slug: "diwali-ready", name: "Diwali Ready", tagline: "Festival prep without the festival stress.", description: "Deep clean, decoration and shopping before the festival week.",
    items: [
      { slug: "house-cleaning", quantity: 6, offsetHours: 48, note: "Festival deep clean" },
      { slug: "decoration", quantity: 3, offsetHours: 24, note: "Lights and rangoli setup" },
      { slug: "groceries", quantity: 1, offsetHours: 24, note: "Sweets and pooja items" },
    ], helperTypes: ["Cleaning helpers", "Event helpers", "Errand helpers"] },
  { slug: "exam-week-support", name: "Exam Week Support", tagline: "Fewer chores, more focus.", description: "Meals-adjacent errands, dishes and explaining help for students in exam week.",
    items: [
      { slug: "tutoring-explaining", quantity: 3, offsetHours: 72, note: "Concept revision" },
      { slug: "utensils", quantity: 2, offsetHours: 24, note: "Dishes handled" },
      { slug: "groceries", quantity: 1, offsetHours: 48, note: "Stock up on essentials" },
    ], helperTypes: ["Skills helpers", "Home helpers", "Errand helpers"] },
  { slug: "weekend-reset", name: "Weekend Reset", tagline: "Start Monday with a clean slate.", description: "Cleaning, dishes and laundry run in one Saturday morning.",
    items: [
      { slug: "house-cleaning", quantity: 4, offsetHours: 6, note: "Weekly clean" },
      { slug: "utensils", quantity: 1, offsetHours: 5, note: "Dishes" },
      { slug: "errands", quantity: 1, offsetHours: 4, note: "Laundry pickup" },
    ], helperTypes: ["Cleaning helpers", "Errand helpers"] },
  { slug: "new-flat-setup", name: "New Flat Setup", tagline: "From empty rooms to a working home.", description: "Cleaning, small repairs coordination and organising for a new flat.",
    items: [
      { slug: "house-cleaning", quantity: 5, offsetHours: 48, note: "Move-in clean" },
      { slug: "small-repairs", quantity: 2, offsetHours: 36, note: "Fixes and fittings" },
      { slug: "wardrobe-organising", quantity: 2, offsetHours: 12, note: "Wardrobes" },
    ], helperTypes: ["Cleaning helpers", "Home helpers"] },
  { slug: "party-prep", name: "Party Prep", tagline: "Everything but the cake.", description: "Decoration, serving help and clean-up for a party at home.",
    items: [
      { slug: "decoration", quantity: 3, offsetHours: 6, note: "Setup" },
      { slug: "event-help", quantity: 4, offsetHours: 0, note: "Serving and tidying" },
      { slug: "utensils", quantity: 3, offsetHours: -2, note: "Post-party dishes" },
    ], helperTypes: ["Event helpers", "Home helpers"] },
];

export const SOCIETY = {
  name: "Parkview Residency", slug: "parkview-residency", city: "Delhi", area: "Dwarka Sector 19",
  lat: 28.5772, lng: 77.0415,
  gates: [
    { name: "Gate 1", lat: 28.5760, lng: 77.0402, hours: "24 hours", rules: "Visitors register at the guard desk", guard: "Guard desk 1" },
    { name: "Gate 2", lat: 28.5784, lng: 77.0428, hours: "5 am to 11 pm", rules: "Shell helpers show gate pass QR", guard: "Guard desk 2" },
    { name: "Gate 3", lat: 28.5768, lng: 77.0432, hours: "6 am to 10 pm", rules: "Service gate, deliveries only", guard: "Guard desk 3" },
  ],
  towers: [
    { name: "Tower A", floors: 14, lat: 28.5776, lng: 77.0406, directions: "From Gate 1, straight ahead, first tower on the left" },
    { name: "Tower B", floors: 14, lat: 28.5779, lng: 77.0414, directions: "From Gate 2, left past the clubhouse, second tower" },
    { name: "Tower C", floors: 18, lat: 28.5783, lng: 77.0421, directions: "From Gate 2, straight, behind the garden, lift lobby 2" },
    { name: "Tower D", floors: 18, lat: 28.5772, lng: 77.0422, directions: "From Gate 3, right, beside the parking ramp" },
    { name: "Tower E", floors: 12, lat: 28.5768, lng: 77.0413, directions: "From Gate 1, right at the fountain" },
    { name: "Tower F", floors: 12, lat: 28.5764, lng: 77.0424, directions: "From Gate 3, straight to the end of the road" },
  ],
};

export function catalogBySlug(slug: string) {
  return CATALOG.find((c) => c.slug === slug);
}

export const GENERIC_FAQS = (name: string) => [
  { q: `How much does ${name.toLowerCase()} cost?`, a: "You see a price range as soon as you describe the task. The exact amount is locked when you approve your plan. There are no hidden charges." },
  { q: "Who will come to my home?", a: "Only verified helpers: government ID checked, college ID checked, selfie verified, trained, and approved by our team. You see their profile before they arrive." },
  { q: "What if I need to cancel?", a: "Free until the helper is on the way. After that a small fee covers their time. See our refund policy for details." },
];

export const DEMO_TEXT = "Guests are coming tomorrow. I need the house cleaned, groceries, my wardrobe organised and some decoration.";
