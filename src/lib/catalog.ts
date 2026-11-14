// Source of truth for catalog seed data. Pages read from the database
// (seeded from here on first request), so ops can edit rows later.
// Prices in rupees here; converted to paise on seed.

export type Faq = { q: string; a: string };

export type CategorySeed = {
  slug: string;
  en: string;
  hi: string;
  icon: string;
  intro: string;
  included: string[];
  excluded: string[];
  duration: string;
  durationMin: number; // minutes for one standard unit
  min: number;
  max: number;
  unit: string; // what the quantity means in the estimator
  rate: number; // rupees per unit
  run: [string, string];
  faqs: Faq[]; // two category-specific, rest are generated
  keywords: string[];
  helper: string;
};

export const CATEGORIES: CategorySeed[] = [
  {
    slug: "house-cleaning",
    en: "House cleaning",
    hi: "ghar ki safai",
    icon: "broom",
    intro:
      "Jhaadu, pocha, bathroom, kitchen platform. One verified helper, a checklist you can tick off from your phone, and photos before and after.",
    included: ["Sweeping and mopping all rooms", "Bathroom scrub", "Kitchen platform and sink wipe", "Dusting of reachable surfaces"],
    excluded: ["Deep chemical cleaning of tiles", "Window exteriors above the 2nd floor", "Pest control"],
    duration: "2 to 4 hours",
    durationMin: 60,
    min: 350,
    max: 900,
    unit: "rooms",
    rate: 160,
    run: ["Helper cleans room by room against your checklist", "Photos of each room go into your Home Diary"],
    faqs: [
      { q: "Do I need to give cleaning supplies?", a: "Use yours if you like. If you note an allergy in Home Atlas, the helper uses only what you have approved." },
      { q: "Can I ask for a female helper?", a: "Yes. Switch it on in Home Atlas and we only match you with women helpers for cleaning." },
    ],
    keywords: ["saaf", "safai", "clean", "cleaning", "jhaadu", "jhadu", "pocha", "mop", "sweep", "dusting", "bathroom", "ghar saaf"],
    helper: "Home-care helpers, trained on the cleaning checklist",
  },
  {
    slug: "utensils",
    en: "Utensils",
    hi: "bartan",
    icon: "plate",
    intro:
      "A sink full of bartan after a party is nobody's idea of fun. A helper washes, dries and stacks, and tells you if anything is chipped.",
    included: ["Washing and drying", "Stacking in your cabinet order", "Sink and slab wipe", "A note on anything cracked"],
    excluded: ["Dishwasher repair", "Cleaning of oven interiors", "Cooking"],
    duration: "30 to 90 minutes",
    durationMin: 45,
    min: 150,
    max: 400,
    unit: "loads",
    rate: 150,
    run: ["Helper counts items with you on chat before starting", "Dry stack, then a photo of the cleared sink"],
    faqs: [
      { q: "What about fragile crockery?", a: "Put it on your do-not-touch list or tell us in the plan. Helpers wash fragile items by hand and flag breakage at once." },
      { q: "Is it a one-off or can it repeat?", a: "Both. Routines is coming soon, so daily or weekly bartan will be a repeat booking." },
    ],
    keywords: ["bartan", "utensil", "utensils", "dishes", "dish", "plates", "sink", "bartaan"],
    helper: "Home-care helpers",
  },
  {
    slug: "groceries",
    en: "Groceries",
    hi: "groceries / sabzi",
    icon: "cart",
    intro:
      "Send the list, set a cap, and a helper buys it from your preferred shops. The receipt is read and itemised, and whatever is unspent comes back to you.",
    included: ["Shopping from your list", "Substitution rules you choose", "Itemised receipt", "Unused cap refunded"],
    excluded: ["Alcohol and tobacco", "Prescription medicines", "Cooking or unpacking into the fridge unless added"],
    duration: "60 to 120 minutes",
    durationMin: 75,
    min: 120,
    max: 350,
    unit: "stops",
    rate: 120,
    run: ["Helper shops in the order that saves the most time", "Receipt photo is itemised and you approve it before settling"],
    faqs: [
      { q: "Who pays for the groceries?", a: "You set a spending cap at checkout. It is held, and only the approved receipt amount is used. The rest is refunded." },
      { q: "What if an item is not available?", a: "Choose 'no substitutions' or 'ask me first'. The helper messages you in the job chat." },
    ],
    keywords: ["grocer", "sabzi", "sabji", "kirana", "vegetables", "fruits", "milk", "doodh", "ration", "shopping list", "saman", "samaan"],
    helper: "Errand helpers who know the local shops",
  },
  {
    slug: "errands",
    en: "Errands",
    hi: "chhote kaam",
    icon: "bag",
    intro:
      "Chemist, stationery, key duplicate, tailor pickup. Stack three small things into one trip and pay one fee instead of three.",
    included: ["Up to three stops in a trip", "Live chat with the helper", "Receipt for anything bought", "Proof photo at each stop"],
    excluded: ["Bank cash handling", "Government office submissions", "Anything illegal or age-restricted"],
    duration: "45 to 120 minutes",
    durationMin: 60,
    min: 120,
    max: 400,
    unit: "stops",
    rate: 130,
    run: ["Shell orders your stops by route and opening hours", "Helper checks in at each stop with a photo"],
    faqs: [
      { q: "Can you handle cash?", a: "Purchases come from your approved expense cap. We do not carry cash for bank work." },
      { q: "How many stops can I add?", a: "Up to three in one trip. More than that, and ops will split it into a plan with a second trip." },
    ],
    keywords: ["errand", "chemist", "medical store", "stationery", "tailor", "duplicate key", "kaam", "chhote kaam", "pickup"],
    helper: "Errand helpers",
  },
  {
    slug: "parcel-pickup-drop",
    en: "Parcel pickup and drop",
    hi: "parcel / courier",
    icon: "parcel",
    intro:
      "Missed the courier, or need a parcel sent? A helper collects from the gate or the shop and brings it to your door, with a photo trail.",
    included: ["Pickup from the gate, a shop or a courier point", "Drop at the address you give", "Photo proof at handover", "Live location during the trip"],
    excluded: ["International shipping", "Valuables over the declared limit", "Packages that look unsafe"],
    duration: "30 to 90 minutes",
    durationMin: 40,
    min: 99,
    max: 300,
    unit: "stops",
    rate: 110,
    run: ["You describe the parcel and the pickup point", "Helper confirms handover with a photo, and an OTP when needed"],
    faqs: [
      { q: "Is the parcel insured?", a: "Shell Guarantee covers damage caused by the helper up to the stated cover limit. Declare the value when you book." },
      { q: "Can a neighbour collect it instead?", a: "Yes. Add their flat in the notes and the helper hands over to them with an OTP." },
    ],
    keywords: ["parcel", "courier", "package", "delivery", "amazon", "pickup", "drop", "dak"],
    helper: "Errand helpers",
  },
  {
    slug: "wardrobe-organising",
    en: "Wardrobe organising",
    hi: "almirari set karna",
    icon: "hanger",
    intro:
      "Seasons change, the almirari does not fix itself. A helper sorts, folds and zones your wardrobe the way you want it, with a before-and-after to prove it.",
    included: ["Sorting by type or season", "Folding and hanging", "Zones labelled to your taste", "Donate pile separated for you"],
    excluded: ["Throwing away anything without your say", "Jewellery or locker handling", "Furniture assembly"],
    duration: "2 to 3 hours",
    durationMin: 90,
    min: 500,
    max: 1200,
    unit: "wardrobes",
    rate: 300,
    run: ["Helper photographs the wardrobe, you approve the zones", "Folding and stacking, then a Time Machine before-and-after"],
    faqs: [
      { q: "Will the helper see my valuables?", a: "Tell us your do-not-touch list. Helpers see only what the task needs, and jewellery boxes stay closed." },
      { q: "Can I be at home while it happens?", a: "Yes, and many people prefer it for this task. You can also skip being home with a Ghost Job." },
    ],
    keywords: ["wardrobe", "almirari", "almari", "cupboard", "organise", "organize", "clothes", "kapde", "closet", "set karna"],
    helper: "Organising helpers, level Trusted or above",
  },
  {
    slug: "decoration",
    en: "Decoration",
    hi: "decoration / sajaavat",
    icon: "balloon",
    intro:
      "Balloons, lights, a backdrop, a birthday corner. Tell us the theme and the budget and a helper sets it up before your guests arrive.",
    included: ["Balloon and banner setup", "Lights and table decor", "Clean-up of packaging", "Photo of the finished corner"],
    excluded: ["Ladders above 8 feet", "Electrical wiring", "Buying decor beyond the cap you set"],
    duration: "2 to 4 hours",
    durationMin: 90,
    min: 600,
    max: 2000,
    unit: "setups",
    rate: 350,
    run: ["You share the theme, colours and a reference photo", "Setup in the order of what is seen first, then a photo for you"],
    faqs: [
      { q: "Do you supply the decor?", a: "The helper can shop within a cap you set under Expense Wallet, or use what you already have at home." },
      { q: "How early should I book?", a: "A day before is comfortable. Same-day works for small setups, and costs a little more." },
    ],
    keywords: ["decoration", "decorate", "balloon", "balloons", "party", "birthday", "sajawat", "sajaavat", "lights", "banner", "diwali"],
    helper: "Event helpers",
  },
  {
    slug: "event-help",
    en: "Event help",
    hi: "party / function mein madad",
    icon: "party",
    intro:
      "Extra hands for a small gathering: set tables, serve, clear plates, watch the door. Not a caterer, just the people who keep the host from running around.",
    included: ["Setup and tear-down", "Serving and clearing", "Door and coat help", "A runner for last-minute items"],
    excluded: ["Cooking for the event", "Bartending", "Security staffing"],
    duration: "3 to 6 hours",
    durationMin: 60,
    min: 700,
    max: 2500,
    unit: "helpers",
    rate: 220,
    run: ["Ops builds a run-sheet with you for the evening", "Helpers check in, work the sheet, and check out with a summary"],
    faqs: [
      { q: "How many helpers do I need?", a: "As a thumb rule, one per 12 guests for serving and one extra for clean-up. Ops will suggest a number when they review your plan." },
      { q: "Will helpers eat at the party?", a: "That is up to you. They are not expected to, and a glass of water is appreciated." },
    ],
    keywords: ["event", "function", "guests", "guest", "mehmaan", "mehman", "aa rahe hain", "serve", "serving", "party prep", "get together", "pooja"],
    helper: "Event helpers, level Trusted or above",
  },
  {
    slug: "excel-data-help",
    en: "Excel and data help",
    hi: "Excel / data ka kaam",
    icon: "laptop",
    intro:
      "A messy sheet, a pivot table that will not behave, a report due tomorrow. A student or freelancer who really knows Excel sits with you on a call, or works on your file.",
    included: ["Cleaning and formatting sheets", "Formulas, pivots and charts", "A short explanation of what was done", "Your file stays yours"],
    excluded: ["Accounting or tax filing", "Confidential company data without consent", "Graded assignment submissions"],
    duration: "1 to 3 hours",
    durationMin: 60,
    min: 300,
    max: 1200,
    unit: "hours",
    rate: 350,
    run: ["You share the file and describe the result you want", "Helper works through it, then walks you through the changes"],
    faqs: [
      { q: "Is my data safe?", a: "Files are shared inside Shell chat, and helpers agree not to copy or keep them. Do not share anything that you would not be able to share with a freelancer." },
      { q: "Is this only for homes?", a: "It can be remote or in person. Small offices can ask through the For Offices page." },
    ],
    keywords: ["excel", "spreadsheet", "sheet", "pivot", "data", "formula", "report", "google sheets", "vlookup"],
    helper: "Data helpers, verified by a skills quiz",
  },
  {
    slug: "tutoring-explaining",
    en: "Tutoring and explaining",
    hi: "padhai samjhana",
    icon: "book",
    intro:
      "A student explains a chapter, a concept or a coding problem, and sits with your child while they try it. We explain and tutor. We never do the homework for anyone.",
    included: ["One-to-one explaining", "Practice questions", "A short summary of what was covered", "Parent present or on call"],
    excluded: ["Doing homework, projects or exams", "Late-night sessions", "Subjects above the helper's tested level"],
    duration: "1 to 2 hours",
    durationMin: 60,
    min: 250,
    max: 700,
    unit: "hours",
    rate: 300,
    run: ["You name the subject, class and what feels hard", "Helper teaches, then leaves a note of what to practise"],
    faqs: [
      { q: "Will you do the homework?", a: "No. Doing homework is a banned request. Helpers explain and guide, and the child writes the answers." },
      { q: "Are the tutors adults?", a: "Every helper is 18 or above, with ID and college ID checked. Sessions happen with a parent at home or on a call." },
    ],
    keywords: ["padhai", "tutor", "tutoring", "teach", "explain", "tuition", "exam", "maths", "math", "science", "chapter", "study"],
    helper: "Student tutors, verified by subject",
  },
  {
    slug: "pet-walking",
    en: "Pet walking",
    hi: "kutte ko ghumana",
    icon: "paw",
    intro:
      "A thirty-minute walk inside the society, with water breaks and a photo. Tell us the temperament and the helper reads it before arriving.",
    included: ["A walk inside the society gates", "Water and waste cleanup", "A photo update", "Notes on behaviour"],
    excluded: ["Walks outside the society", "Pets flagged aggressive by the owner", "Grooming and medicines"],
    duration: "30 to 45 minutes",
    durationMin: 30,
    min: 99,
    max: 250,
    unit: "walks",
    rate: 130,
    run: ["Helper reads your pet's profile and meets them with you or the key plan", "Walk with a mid-way photo and a check-out note"],
    faqs: [
      { q: "My dog is shy with strangers.", a: "Put it in the profile and we introduce the helper in the first visit, with you at home." },
      { q: "Do you take cats or other pets?", a: "Dogs for now. Other pet care is on the list once we see demand." },
    ],
    keywords: ["pet", "dog", "kutta", "kutte", "walk", "walking", "ghumana", "puppy"],
    helper: "Pet-friendly helpers, vetted on a short temperament quiz",
  },
  {
    slug: "moving-shifting-help",
    en: "Moving and shifting help",
    hi: "shifting mein madad",
    icon: "box",
    intro:
      "Packing the kitchen, labelling boxes, unpacking the bedroom. We bring a crew of helpers and one coordinator for a move inside your society or across the road.",
    included: ["Packing and labelling", "Carrying within the society", "Unpacking by room", "Waste and cardboard clean-up"],
    excluded: ["Truck hire", "Heavy furniture dismantling", "Piano or appliance moves"],
    duration: "Half day to full day",
    durationMin: 120,
    min: 1500,
    max: 6000,
    unit: "helpers",
    rate: 800,
    run: ["Ops walks through the flat with you on a video call", "Crew packs room by room, one photo per labelled box"],
    faqs: [
      { q: "Do you arrange the truck?", a: "Not in Phase 1. We coordinate the crew inside the society and you book the vehicle." },
      { q: "Can I move out in a day?", a: "Small flats, yes. For 2 BHK and above we usually plan two days." },
    ],
    keywords: ["moving", "shifting", "shift", "pack", "packing", "unpack", "boxes", "move-in", "new flat", "naya ghar"],
    helper: "Crew helpers, Managed eligible",
  },
  {
    slug: "small-repairs-coordination",
    en: "Small repairs coordination",
    hi: "chhoti repair ka intezaam",
    icon: "wrench",
    intro:
      "A leaking tap, a fan that wobbles. We do not pretend to be plumbers. We book a trusted local technician, wait with them, and confirm the work is done.",
    included: ["Booking a vetted technician", "A helper waits at home if you are out", "Price agreed in advance", "Check of the finished work"],
    excluded: ["The repair work itself, which is paid to the technician", "Structural or gas work", "Electrical rewiring"],
    duration: "1 to 3 hours of coordination",
    durationMin: 60,
    min: 150,
    max: 500,
    unit: "visits",
    rate: 180,
    run: ["You describe the issue with a photo", "Helper meets the technician at the gate and signs off the work"],
    faqs: [
      { q: "Who pays the technician?", a: "The quote is agreed in chat and added to the plan. Nothing is paid off-platform." },
      { q: "Are the technicians verified?", a: "They come from the society's own vendor list, plus our preferred partners, with ID checked at the gate." },
    ],
    keywords: ["repair", "plumber", "electrician", "tap", "fan", "leak", "technician", "mistri", "carpenter"],
    helper: "Coordinators, level Trusted or above",
  },
  {
    slug: "queueing",
    en: "Queueing",
    hi: "line mein lagna",
    icon: "queue",
    intro:
      "Aadhaar update centre, a ticket counter, a hospital OPD token. A helper stands in the line and messages you when you are five people away.",
    included: ["Standing in line for you", "Photo of your token number", "Update when you should arrive", "Documents handled only if you share them"],
    excluded: ["Anything that skips a legal process", "Paying bribes, ever", "Overnight queueing"],
    duration: "1 to 4 hours",
    durationMin: 60,
    min: 150,
    max: 600,
    unit: "hours",
    rate: 150,
    run: ["You tell us where, when and what the token looks like", "Helper holds the spot and pings you at five people away"],
    faqs: [
      { q: "Is this allowed everywhere?", a: "Where a person must be present for identity, we do not take the task. We take tokens, tickets and bookings." },
      { q: "What if the counter shuts early?", a: "You pay only for the time worked, with proof photos." },
    ],
    keywords: ["queue", "line", "token", "opd", "ticket", "counter", "line mein", "waiting"],
    helper: "Errand helpers",
  },
  {
    slug: "sports-partner",
    en: "Sports partner",
    hi: "khel ka saathi",
    icon: "ball",
    intro:
      "Badminton, cricket nets, a jog, table tennis. Someone your level, inside the society, who shows up on time and plays fair.",
    included: ["One hour of play", "A partner matched by level", "Equipment you share or the helper brings", "Public places only"],
    excluded: ["Coaching for competitions", "Night sessions after 9 pm", "Sessions with minors without a guardian present"],
    duration: "1 hour",
    durationMin: 60,
    min: 150,
    max: 400,
    unit: "hours",
    rate: 200,
    run: ["You pick the sport and your level", "Helper meets you at the court and checks out after the hour"],
    faqs: [
      { q: "Is this safe for kids?", a: "A guardian must be present for anyone under 18. Sessions happen in the society's open courts." },
      { q: "Can I book the same partner weekly?", a: "Yes. Favourite helpers are saved, and Routines will repeat it once launched." },
    ],
    keywords: ["badminton", "cricket", "tennis", "football", "sports", "jog", "running", "khel", "play partner"],
    helper: "Student athletes, verified",
  },
  {
    slug: "gaming-partner",
    en: "Gaming partner",
    hi: "gaming saathi",
    icon: "gamepad",
    intro:
      "Chess, carrom, Ludo, FIFA on the console. A friendly person to play with, at home or in the society clubhouse.",
    included: ["One hour of games", "A partner who matches your skill", "Public or at-home with a guardian present", "A fun time, which is the whole point"],
    excluded: ["Gambling or betting games", "Account boosting", "Sessions with minors alone"],
    duration: "1 to 2 hours",
    durationMin: 60,
    min: 150,
    max: 400,
    unit: "hours",
    rate: 200,
    run: ["You choose the game and the vibe", "Helper plays, and checks out with a short summary"],
    faqs: [
      { q: "Which games are allowed?", a: "Board, card and console games. Anything with betting or real-money stakes is not allowed." },
      { q: "Can I invite friends?", a: "Yes, mention the number of players in the plan." },
    ],
    keywords: ["gaming", "game", "games", "chess", "carrom", "ludo", "fifa", "playstation", "console"],
    helper: "Gaming helpers",
  },
];

export const BANNED_KEYWORDS = [
  "massage", "malish", "makeup", "make-up", "facial", "waxing", "spa", "homework do", "homework kar", "assignment kar",
];

export type PackTask = { slug: string; label: string; offset: string; qty: number; hours: number };
export type PackSeed = {
  slug: string;
  en: string;
  hi: string;
  tagline: string;
  tasks: PackTask[];
  helpers: string[];
  faqs: Faq[];
  timeline: { at: string; what: string }[];
};

export const PACKS: PackSeed[] = [
  {
    slug: "guests-aa-rahe-hain",
    en: "Guests Aa Rahe Hain",
    hi: "mehmaan aa rahe hain",
    tagline: "Kal guests hain, aur ghar abhi ghar jaisa hai. Hum kar lenge.",
    tasks: [
      { slug: "groceries", label: "Groceries from your list", offset: "T-24h", qty: 1, hours: 1.5 },
      { slug: "house-cleaning", label: "Full house clean, 3 rooms", offset: "T-12h", qty: 3, hours: 3 },
      { slug: "wardrobe-organising", label: "Wardrobe and shoe rack tidy", offset: "T-6h", qty: 1, hours: 2 },
      { slug: "decoration", label: "Table and entrance decor", offset: "T-3h", qty: 1, hours: 2 },
    ],
    helpers: ["Errand helper", "Home-care helper", "Organising helper", "Event helper"],
    faqs: [
      { q: "Can I start with 24 hours to go?", a: "Yes. Plans for 24 hours are normal. Under 12 hours we may switch to Rush with a higher price." },
      { q: "Can I drop the decoration?", a: "Yes. Use the customise panel above and the receipt updates." },
    ],
    timeline: [
      { at: "T minus 24 hours", what: "Groceries bought against your list and cap" },
      { at: "T minus 12 hours", what: "Cleaning, room by room" },
      { at: "T minus 6 hours", what: "Wardrobe and entrance tidy" },
      { at: "T minus 3 hours", what: "Decoration and a last look" },
    ],
  },
  {
    slug: "move-in-ready",
    en: "Move-In Ready",
    hi: "naya ghar, ready",
    tagline: "Boxes aaye, ghar bana. Ek din mein kitchen aur bedroom chalu.",
    tasks: [
      { slug: "house-cleaning", label: "Deep clean before unpacking", offset: "Day 1 morning", qty: 4, hours: 4 },
      { slug: "moving-shifting-help", label: "Unpacking crew, 2 helpers", offset: "Day 1 noon", qty: 2, hours: 5 },
      { slug: "wardrobe-organising", label: "Wardrobe set-up", offset: "Day 1 evening", qty: 2, hours: 3 },
      { slug: "utensils", label: "Kitchen utensils washed and stacked", offset: "Day 1 evening", qty: 2, hours: 1.5 },
    ],
    helpers: ["Home-care helper", "Crew helpers", "Organising helper"],
    faqs: [
      { q: "Do you arrange the truck?", a: "Not yet. We take over once the boxes reach your society gate." },
      { q: "How many people come?", a: "Usually three or four, with one coordinator on chat." },
    ],
    timeline: [
      { at: "Morning", what: "Empty flat cleaned top to bottom" },
      { at: "Noon", what: "Boxes unpacked room by room" },
      { at: "Afternoon", what: "Kitchen and wardrobe set up" },
      { at: "Evening", what: "Final walk-through with photos" },
    ],
  },
  {
    slug: "diwali-ready",
    en: "Diwali Ready",
    hi: "Diwali ke liye ghar tayyar",
    tagline: "Safai, sajaavat, saman. Aap bas mithai ka dabba kholo.",
    tasks: [
      { slug: "house-cleaning", label: "Festival deep clean, whole house", offset: "T-3 days", qty: 4, hours: 5 },
      { slug: "wardrobe-organising", label: "Wardrobe and puja shelf tidy", offset: "T-2 days", qty: 2, hours: 3 },
      { slug: "decoration", label: "Lights, rangoli corner and torans", offset: "T-1 day", qty: 1, hours: 3 },
      { slug: "errands", label: "Last-minute puja saman run", offset: "T-1 day", qty: 1, hours: 1 },
    ],
    helpers: ["Home-care helper", "Organising helper", "Event helper", "Errand helper"],
    faqs: [
      { q: "Do you do rangoli?", a: "We set up the rangoli corner with your stencils or colours. Freehand art is not guaranteed." },
      { q: "Is it priced higher near Diwali?", a: "There may be a festival surge shown in the receipt, never hidden." },
    ],
    timeline: [
      { at: "3 days before", what: "Deep clean, the big dusty jobs" },
      { at: "2 days before", what: "Wardrobes and the puja shelf" },
      { at: "1 day before", what: "Lights, torans and the saman run" },
      { at: "Diwali day", what: "Nothing left to do but enjoy" },
    ],
  },
  {
    slug: "exam-week-support",
    en: "Exam Week Support",
    hi: "exam week mein madad",
    tagline: "Padhai pe dhyaan do. Khana, bartan, parcel aur doubt, sab sambhal lenge.",
    tasks: [
      { slug: "tutoring-explaining", label: "Two explaining sessions", offset: "Day 2 and 4", qty: 2, hours: 2 },
      { slug: "groceries", label: "Snacks and groceries for the week", offset: "Day 1", qty: 1, hours: 1.5 },
      { slug: "utensils", label: "Daily utensils, 5 days", offset: "Every day", qty: 5, hours: 3 },
      { slug: "parcel-pickup-drop", label: "Stationery and parcel runs", offset: "On call", qty: 2, hours: 1 },
    ],
    helpers: ["Student tutor", "Errand helper", "Home-care helper"],
    faqs: [
      { q: "Will the tutor help in the exam?", a: "No. Tutors explain topics before the exam. Nobody helps during one." },
      { q: "Is it only for students?", a: "Parents can book it for their kids, and hostel residents can book it for themselves." },
    ],
    timeline: [
      { at: "Day 1", what: "Groceries and snacks stocked" },
      { at: "Day 2", what: "First explaining session" },
      { at: "Days 1 to 5", what: "Utensils washed each evening" },
      { at: "Day 4", what: "Second session and a stationery run" },
    ],
  },
  {
    slug: "weekend-reset",
    en: "Weekend Reset",
    hi: "weekend reset",
    tagline: "Saturday ko reset, Sunday ko aaram. Ghar fresh, fridge full.",
    tasks: [
      { slug: "house-cleaning", label: "Whole-house clean", offset: "Saturday 10 am", qty: 3, hours: 3 },
      { slug: "utensils", label: "Utensils and kitchen slab", offset: "Saturday noon", qty: 1, hours: 1 },
      { slug: "groceries", label: "Weekly groceries", offset: "Saturday 4 pm", qty: 1, hours: 1.5 },
    ],
    helpers: ["Home-care helper", "Errand helper"],
    faqs: [
      { q: "Can neighbours share this?", a: "Yes. Make it a Shell Circle and the price per flat falls as more join." },
      { q: "Can I repeat it every weekend?", a: "Routines is coming soon and will repeat packs like this." },
    ],
    timeline: [
      { at: "Saturday morning", what: "Cleaning begins" },
      { at: "Saturday noon", what: "Kitchen and utensils" },
      { at: "Saturday afternoon", what: "Groceries delivered" },
      { at: "Sunday", what: "Yours" },
    ],
  },
  {
    slug: "new-flat-setup",
    en: "New Flat Setup",
    hi: "naye flat ka setup",
    tagline: "Khaali flat se rehne layak ghar tak, ek plan mein.",
    tasks: [
      { slug: "house-cleaning", label: "Handover clean", offset: "Day 1", qty: 3, hours: 4 },
      { slug: "small-repairs-coordination", label: "Technician visit for taps, fans, locks", offset: "Day 1", qty: 1, hours: 2 },
      { slug: "decoration", label: "Basic decor and lights", offset: "Day 2", qty: 1, hours: 2 },
      { slug: "errands", label: "Essentials run, up to 3 stops", offset: "Day 2", qty: 1, hours: 1.5 },
    ],
    helpers: ["Home-care helper", "Coordinator", "Event helper", "Errand helper"],
    faqs: [
      { q: "Do you buy furniture?", a: "No. We shop for small items under a cap you set, and coordinate deliveries at your door." },
      { q: "Can I do this while I am away?", a: "Yes, with a Ghost Job: key handover through the guard and photo proof at each step." },
    ],
    timeline: [
      { at: "Day 1 morning", what: "Handover clean" },
      { at: "Day 1 afternoon", what: "Technician coordinated" },
      { at: "Day 2 morning", what: "Decor and lights" },
      { at: "Day 2 afternoon", what: "Essentials bought and placed" },
    ],
  },
  {
    slug: "party-prep",
    en: "Party Prep",
    hi: "party ki taiyaari",
    tagline: "Balloons se bartan tak, party ke pehle aur baad ka kaam hum karenge.",
    tasks: [
      { slug: "decoration", label: "Balloons, banner and table setup", offset: "T-4h", qty: 1, hours: 3 },
      { slug: "event-help", label: "Two helpers for serving", offset: "During party", qty: 2, hours: 4 },
      { slug: "utensils", label: "Post-party utensils", offset: "T+2h", qty: 2, hours: 1.5 },
      { slug: "house-cleaning", label: "Next-morning clean-up", offset: "T+14h", qty: 2, hours: 2 },
    ],
    helpers: ["Event helper", "Home-care helper"],
    faqs: [
      { q: "Is food included?", a: "No. We help with everything around the food." },
      { q: "Can I skip the next-day clean?", a: "Yes, tap it off in the customise panel." },
    ],
    timeline: [
      { at: "4 hours before", what: "Decoration and table setup" },
      { at: "During", what: "Two helpers serve and clear" },
      { at: "2 hours after", what: "Utensils washed" },
      { at: "Next morning", what: "Clean-up, so you wake up to a clean house" },
    ],
  },
];

export const FAQS_HOME: Faq[] = [
  { q: "Kya Shell meri jagah kaam karta hai?", a: "Abhi hum Delhi ki ek society se shuru kar rahe hain. Aapki society waitlist mein hai to number badhne par hum wahan aate hain. Kuch dino mein aap dekh paoge ki kitne log aur chahiye." },
  { q: "Kaun log mere ghar aayenge?", a: "Verified helpers: 18 saal ya usse upar, government ID aur college ID check ki hui, selfie liveness, aur safety training pass. Aap pehle unka naam, rating aur voice intro dekhte ho." },
  { q: "Kya meri jaankari safe hai?", a: "Hum Aadhaar number kabhi store nahi karte. Location sirf job ke dauraan share hoti hai, aur aap apna data delete karne ko keh sakte ho." },
  { q: "Agar kaam theek nahi hua to?", a: "Rework ke liye 24 ghante hain, free. Phir bhi baat nahi bani to dispute khulta hai aur hum 24 ghante mein reply karte hain. Shell Guarantee mein damage cover bhi hai." },
  { q: "Paise kab aur kaise dene hain?", a: "Plan approve karte waqt, UPI ya card se. Paise hamare paas rehte hain jab tak aap kaam approve nahi karte. Groceries mein bachi hui raqam wapas aati hai." },
  { q: "Kya main helper ke saath direct baat kar sakti hoon?", a: "Chat aur masked call Shell ke andar hoti hai. Phone number ya UPI ID bhejoge to message blur ho jata hai. Isse guarantee, damage cover aur paise ki suraksha bani rehti hai." },
  { q: "Kya female helper mil sakti hai?", a: "Haan. Home Atlas mein female-helper-only on karo. Hum sirf unhe match karte hain. Supply abhi chhoti ho sakti hai, to kabhi kabhi time thoda aage-peeche hota hai." },
  { q: "Kaun se kaam nahi lete?", a: "Massage, makeup aur personal care launch par band hain. Homework karna bhi nahi, sirf samjhana aur padhana. Helper 18 se kam nahi hota." },
  { q: "Society mein kab aayega?", a: "Jab kam se kam ek tower ke liye helpers aur neighbours dono tayyar honge. Waitlist map par dikhta hai ki kitne aur chahiye." },
  { q: "Kya Shell mere ghar ki chaabi rakhta hai?", a: "Nahi. Chaabi aap ya guard ke paas rehti hai, ya lockbox mein OTP ke saath. Helper ko sirf utni der ke liye milti hai, aur check-out ke saath wapas." },
  { q: "Helper banne ke liye kya chahiye?", a: "18 saal ya usse upar, ek government ID, college ID ya koi kaam ka skill, ek selfie, aur ek chhoti si safety training. College students aur freelancers ke liye khaas banaya hai." },
  { q: "Kitna commission lete ho?", a: "Har job par hum ek commission aur platform fee lete hain, aur 3 ya usse zyada kaam wale plan par ek coordination fee. Receipt mein sab alag alag dikhta hai." },
];

export const NAV = [
  { href: "/how-it-works", en: "How it works", hi: "kaise chalta hai" },
  { href: "/services", en: "Services", hi: "services" },
  { href: "/packs", en: "Packs", hi: "packs" },
  { href: "/earn", en: "Earn with Shell", hi: "Shell se kamao" },
  { href: "/safety", en: "Safety", hi: "suraksha" },
  { href: "/societies", en: "Societies", hi: "societies" },
];

export const SERVICE_LINES = [
  { slug: "quick", name: "Shell Quick", status: "live", line: "Ek chhota kaam, ek helper, ek price.", examples: ["Parcel pickup", "Utensils", "Queueing"], href: "/services/quick" },
  { slug: "managed", name: "Shell Managed", status: "live", line: "Poora plan. Events, shifting, ghar ka reset. Ek insaan zimmedar.", examples: ["Guests aa rahe hain", "Move-in", "Full home organising"], href: "/services/managed" },
  { slug: "earn", name: "Shell Earn", status: "live", line: "Padhai ke saath kamai. Apne time par.", examples: ["Cleaning", "Tutoring", "Excel help"], href: "/earn" },
  { slug: "routines", name: "Shell Routines", status: "soon", line: "Har hafte ya har mahine, wahi helper, wahi time.", examples: ["Weekly bartan", "Fortnightly clean", "Monthly groceries"], href: "/services/routines" },
  { slug: "plus", name: "Shell Plus", status: "soon", line: "Ek subscription: fee kam, priority zyada.", examples: ["Lower fees", "Priority helpers", "Free Circle joins"], href: "/services/plus" },
];
