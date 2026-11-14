// Catalog content for the demo society launch. Editable later in /ops/catalog.

type Cat = { slug: string; en: string; hi: string; icon: string; intro: string; introHi: string; included: string[]; notIncluded: string[]; steps: string[]; faqs: { q: string; a: string }[]; helperReq: string; minutes: number; min: number; max: number };

export const CATEGORIES: Cat[] = [
  {
    slug: "house-cleaning", en: "House cleaning", hi: "घर की सफाई", icon: "broom", minutes: 180, min: 24900, max: 149900,
    intro: "Jhaadu, pocha, dusting and bathrooms, done by a verified person from your own neighbourhood. You tell us the size of the home and any no-touch corners. We bring the plan and the checklist.",
    introHi: "झाड़ू, पोछा, डस्टिंग और बाथरूम। आपके पड़ोस के वेरिफाइड हेल्पर से, चेकलिस्ट के साथ।",
    included: ["Sweeping and mopping every room", "Dusting reachable surfaces and fans", "Bathroom scrub and floor wash", "Kitchen slab, sink and stove-top wipe"],
    notIncluded: ["Chemical polishing of marble or wood", "Moving heavy furniture", "Pest control", "Cleaning above 2 metres without a ladder you provide"],
    steps: ["Tell us the rooms and anything we must not touch", "We plan the visit and pick a trained cleaner", "Door OTP, before photos, cleaning by checklist", "After photos, your approval, then payment is released"],
    faqs: [
      { q: "Kya cleaning ka saaman saath aata hai?", a: "The helper brings cloths, a mop and standard supplies. If you have a product you prefer, or an allergy, put it in your Home Atlas and only that will be used." },
      { q: "Kya mujhe ghar par rehna padega?", a: "No. For Ghost Jobs the guard can hold the key or you can use a lockbox with a one-time code. You get timestamped photos for every checklist item." },
      { q: "Ek room mein kitna time lagta hai?", a: "About 45 minutes per room. A full 3 BHK usually takes around four hours with one helper." },
    ],
    helperReq: "Passed the cleaning module, safety module, and one shadow job before working alone.",
  },
  {
    slug: "utensils", en: "Utensil washing", hi: "बर्तन धुलाई", icon: "pan", minutes: 40, min: 14900, max: 34900,
    intro: "Piles of bartan after guests leave or when the usual help is on leave. One sink load or a whole party's worth, washed, rinsed and stacked where you tell us.",
    introHi: "मेहमानों के बाद या बाई की छुट्टी पर: बर्तन धुले, सूखे और सही जगह रखे हुए।",
    included: ["Washing and rinsing", "Stacking on the rack or in cabinets you point out", "Wiping the sink and slab"],
    notIncluded: ["Cleaning inside the oven or chimney", "Handling fragile antique crockery without a note from you"],
    steps: ["Tell us roughly how many loads", "We assign a nearby helper", "Photo before and after of the sink", "You approve, we release the payment"],
    faqs: [
      { q: "Kitne bartan ek load mein aate hain?", a: "One load is a full sink, around 25 to 30 pieces. For party-sized piles we quote by load so the price is clear upfront." },
      { q: "Kya dishwasher use ho sakta hai?", a: "Yes, if you have one. Mention it and the helper will load, run and unload it instead." },
      { q: "Kaunsa sabun use hoga?", a: "Whatever is in your kitchen. We do not bring our own, so nothing unfamiliar touches your plates." },
    ],
    helperReq: "Basic module and safety module. No special skills needed.",
  },
  {
    slug: "groceries", en: "Groceries", hi: "ग्रोसरी", icon: "cart", minutes: 60, min: 17900, max: 39900,
    intro: "Give us the list, set a cap, and a helper buys from the shops you prefer. The receipt is read line by line, you approve it, and whatever was not spent goes straight back.",
    introHi: "लिस्ट दीजिए, खर्च की सीमा तय कीजिए। हेल्पर खरीदता है, रसीद आप मंज़ूर करते हैं, बचा पैसा वापस।",
    included: ["Shopping from your list at preferred shops", "Substitutions only if you allow them", "Receipt photo with an itemised check", "Delivery to your door"],
    notIncluded: ["Alcohol or tobacco", "Prescription medicine (use Errands)", "Items over the cap without your approval"],
    steps: ["Send the list and set the spending cap", "We hold the cap and pick a helper", "Helper buys and uploads the receipt", "You approve lines, unused money returns"],
    faqs: [
      { q: "Kharch ka cap kaise kaam karta hai?", a: "You choose a cap before paying. We hold that amount, the helper spends only what the list needs, and anything unused is refunded to the original payment method or your Shell Wallet." },
      { q: "Agar item na mile to?", a: "You choose: no substitutions, or ask me before substituting. The helper messages you in the job chat with a photo." },
      { q: "Kaun si dukaan se aayega?", a: "Your preferred shops first. Otherwise we choose from the society's vendor list by distance, opening hours and typical wait." },
    ],
    helperReq: "Passed the errands module including the receipt and cash-handling rules.",
  },
  {
    slug: "errands", en: "Errands", hi: "छोटे-मोटे काम", icon: "scooter", minutes: 45, min: 12900, max: 49900,
    intro: "Chemist, laundry, stationery, key duplicates, the small stops that eat your evening. We stack nearby errands into one trip so they stay cheap.",
    introHi: "केमिस्ट, लॉन्ड्री, स्टेशनरी: छोटे काम एक ही चक्कर में।",
    included: ["Up to three nearby stops in one trip", "Photo proof at each stop", "Receipts for anything bought"],
    notIncluded: ["Anything illegal or age-restricted", "Handling large cash sums", "Banking transactions on your behalf"],
    steps: ["List your stops and any time windows", "We order the stops into one efficient route", "Helper checks in at each stop with a photo", "You see the receipts and approve"],
    faqs: [
      { q: "Kitne stops ek errand mein?", a: "Up to three nearby stops are one errand. More stops are priced as another errand, and we stack them so the extra travel is not charged." },
      { q: "Dawai laa sakte ho?", a: "Over-the-counter medicine yes. For prescription medicine the helper needs a photo of the prescription and the chemist verifies it." },
      { q: "Paise kaise dun?", a: "Through the Expense Wallet: you set a cap, we hold it, and unused money returns after you approve the receipt." },
    ],
    helperReq: "Errands module and expense-handling quiz.",
  },
  {
    slug: "parcel-pickup", en: "Parcel pickup and drop", hi: "पार्सल पिकअप और ड्रॉप", icon: "parcel", minutes: 25, min: 9900, max: 24900,
    intro: "Missed the courier at the gate, or need a parcel posted across the road. A helper collects it from the guard room or the shop and brings it to your door or drops it at the right counter.",
    introHi: "गेट पर कूरियर छूट गया? हेल्पर पार्सल लाकर दरवाज़े तक पहुँचाएगा।",
    included: ["Collection from the gate, a shop or a courier point", "Photo of the parcel and its label", "Drop-off at your door or a named counter"],
    notIncluded: ["Cash on delivery above the Expense Wallet cap", "Fragile or valuable items over Rs 10,000 without declared value"],
    steps: ["Tell us where to collect from", "We assign the nearest helper", "Label photo at pickup and hand-over", "You confirm it reached"],
    faqs: [
      { q: "Parcel kho gaya to?", a: "Shell Guarantee covers declared items up to the damage-cover limit. Photo of the label at pickup and drop is stored as proof." },
      { q: "COD wala parcel lega?", a: "Yes, using the Expense Wallet cap. The receipt is itemised for you to approve." },
      { q: "Society ke bahar bhi jaoge?", a: "Pickups in the immediate neighbourhood yes. The route is priced from the travel distance." },
    ],
    helperReq: "Errands module.",
  },
  {
    slug: "wardrobe-organising", en: "Wardrobe organising", hi: "अलमारी ऑर्गनाइज़", icon: "hanger", minutes: 120, min: 49900, max: 99900,
    intro: "Almirari that opens like a surprise. We sort, fold and arrange by how you actually dress, and leave a short list of what to donate. Seasonal swaps are the most common request.",
    introHi: "अलमारी जो खोलते ही गिर पड़ती है: हम आपकी आदत के हिसाब से जमाते हैं।",
    included: ["Sorting by type and season", "Folding and hanging", "Labelled zones and a donate pile", "Before and after photos"],
    notIncluded: ["Dry cleaning", "Throwing away anything without your say", "Jewellery and documents (we skip locked drawers)"],
    steps: ["Tell us the wardrobe size and your preferences", "We plan a 2 hour slot and assign an organiser", "Photos of each zone before we start", "You review the after photos in the swipe slider"],
    faqs: [
      { q: "Mere kapde kaun dekhega?", a: "Only the assigned, ID-verified helper, with you or the agreed key arrangement. The do-not-touch list in your Home Atlas is shown to them." },
      { q: "Kya cheezein fenk dete ho?", a: "Never. We only make a donate pile and wait for your approval." },
      { q: "Ek wardrobe mein kitna time?", a: "About two hours for a standard double-door wardrobe." },
    ],
    helperReq: "Organising module, safety module, and a shadow job. Valuables handling is checked in training.",
  },
  {
    slug: "decoration", en: "Decoration", hi: "सजावट", icon: "balloon", minutes: 120, min: 59900, max: 199900,
    intro: "Balloons, lights, banners and a table that looks like you tried hard. Tell us the occasion and the room. Props can be bought through the Expense Wallet or you can hand us your own.",
    introHi: "गुब्बारे, लाइट्स, बैनर: मौके और कमरे के हिसाब से सजावट।",
    included: ["Setup with props you choose or we buy within a cap", "Balloon arch or garland", "Lights and table styling", "Cleanup of packaging"],
    notIncluded: ["Rented structures, tents or sound systems", "Anything needing a ladder above 3 metres", "Tear-down on the same day unless added"],
    steps: ["Share the occasion, the room and a photo or two", "We confirm the props list and cap", "Helper sets up and posts progress photos", "You approve, we release payment"],
    faqs: [
      { q: "Saaman kaun laayega?", a: "Either you provide it, or the helper buys it from the shops you pick, within the cap you set. The receipt is itemised." },
      { q: "Kya tear-down hoga?", a: "It is a separate add-on so the price stays honest. You can add it from the plan before approving." },
      { q: "Last minute ho sakta hai?", a: "Same-day is possible with a 1.2x urgency multiplier. Rush (within 90 minutes) is 1.5x and depends on helpers who have opted in." },
    ],
    helperReq: "Decoration module plus a sample photo set reviewed by ops.",
  },
  {
    slug: "event-help", en: "Event help", hi: "इवेंट में मदद", icon: "cake", minutes: 180, min: 59900, max: 249900,
    intro: "Serving, refilling, clearing and quietly running around while you enjoy your own party. Hired by the hour, in groups, so the helpers can cover each other.",
    introHi: "आपकी पार्टी में सर्व करना, सफाई, भाग-दौड़: आप मेहमानों के साथ रहिए।",
    included: ["Serving and refilling", "Clearing plates", "Running to the kitchen and back", "Basic reset at the end"],
    notIncluded: ["Cooking", "Bartending or alcohol service", "Security"],
    steps: ["Tell us the guest count and timings", "We size the team", "Helpers arrive early for a short briefing", "You approve at the end of the event"],
    faqs: [
      { q: "Kitne log chahiye honge?", a: "A good rule is one helper for every 12 to 15 guests. We suggest the number when you share the guest count." },
      { q: "Kya khana bhi banate hain?", a: "No. Event help is serving and clearing only. Cooking is not a Shell category right now." },
      { q: "Raat tak ruk sakte ho?", a: "Yes, with a note to the guard. Helpers are not scheduled beyond 11 pm unless they opted in, and every helper gets a trusted-contact live link." },
    ],
    helperReq: "Safety module, event module, and group briefing before first event.",
  },
  {
    slug: "excel-data-help", en: "Excel and data help", hi: "एक्सेल और डेटा में मदद", icon: "laptop", minutes: 60, min: 29900, max: 119900,
    intro: "Formulas that will not behave, a pivot table that should exist, a messy export that needs cleaning. A college student who actually likes spreadsheets sits with you or works from your laptop.",
    introHi: "फ़ॉर्मूला नहीं चल रहा? पिवट टेबल चाहिए? एक्सेल जानने वाला स्टूडेंट मदद करेगा।",
    included: ["Formulas, pivots and charts", "Cleaning and formatting data", "Short walkthrough so you can repeat it"],
    notIncluded: ["Work for exams or graded submissions", "Anything involving client confidential data without your consent", "Macros that touch other systems"],
    steps: ["Share the file or describe the goal", "We match a helper with the right skill level", "Work in person or on your screen", "You test the result and approve"],
    faqs: [
      { q: "Mera data safe rahega?", a: "The helper works on your device or a shared screen. Files are not kept by Shell, and the Community Policy forbids copying data." },
      { q: "Kya assignment kar doge?", a: "No. We explain and help you learn; we do not do graded work for you." },
      { q: "Kitna time lagega?", a: "Most requests take one to two hours. You can extend in 30-minute steps with a price shown before you agree." },
    ],
    helperReq: "Verified skill sample and an Excel quiz at 80 percent or above.",
  },
  {
    slug: "tutoring", en: "Tutoring and explaining", hi: "पढ़ाई में समझाना", icon: "book", minutes: 60, min: 34900, max: 139900,
    intro: "Concepts explained patiently by a senior student. We explain, you do. Shell never does homework or assignments for anyone, and helpers are trained to say no.",
    introHi: "समझाना हमारा काम, करना आपका। होमवर्क हम नहीं करते।",
    included: ["Explaining concepts step by step", "Practice problems with feedback", "Exam-week revision plans"],
    notIncluded: ["Doing homework, assignments or projects", "Taking tests or exams", "Tutoring for children under 10 without a parent present"],
    steps: ["Tell us the subject, class and what is confusing", "We match a helper who has scored well in it", "A session at your home with a parent or adult nearby", "Feedback and a plan for the next session"],
    faqs: [
      { q: "Homework kar do?", a: "No. Helpers explain and guide; they do not write answers. If a request looks like homework being outsourced we politely decline." },
      { q: "Bachche akele hoon to?", a: "For children, an adult must be at home. This is a safety rule for tutoring jobs." },
      { q: "Kaun se subjects?", a: "Maths, science, English and commerce basics up to class 12, and Excel or programming basics for college students." },
    ],
    helperReq: "Subject score proof, tutoring module, safety module, and the no-homework policy quiz.",
  },
  {
    slug: "pet-walking", en: "Pet walking", hi: "पेट वॉक", icon: "dog", minutes: 30, min: 17900, max: 34900,
    intro: "A 30-minute walk for a dog who does not understand your meeting schedule. Helpers are told your pet's temperament in advance and send a photo and a route.",
    introHi: "आपके कुत्ते के लिए 30 मिनट की वॉक। स्वभाव पहले से बताया जाता है।",
    included: ["30 minute walk inside the society", "Water and a clean-up bag", "Photo and a short note after"],
    notIncluded: ["Grooming or bathing", "Walking aggressive dogs without prior approval", "Vet visits"],
    steps: ["Tell us the pet, breed and temperament", "We pick a helper comfortable with that breed", "Helper walks and shares a live route", "Photo and a poop-and-pee report"],
    faqs: [
      { q: "Mera kutta kaatega to?", a: "Temperament is on your Home Atlas. Aggressive or reactive dogs are only matched with helpers who explicitly accept those jobs." },
      { q: "Society ke bahar le jaoge?", a: "No. Walks stay inside the society grounds so the route is visible on the live map." },
      { q: "Rozana ke liye?", a: "Yes. Make it a Routine and prefer the same helper." },
    ],
    helperReq: "Pet-handling module and a short meet-and-greet with the pet on first booking.",
  },
  {
    slug: "moving-help", en: "Moving and shifting help", hi: "शिफ्टिंग में मदद", icon: "box", minutes: 240, min: 74900, max: 399900,
    intro: "Packing, carrying to the lift, unpacking and arranging. We do not run a truck, but we do the part that exhausts you: helpers who pack carefully and label everything.",
    introHi: "पैकिंग, लिफ्ट तक सामान, अनपैकिंग: थका देने वाला हिस्सा हम संभालते हैं।",
    included: ["Packing with labels", "Carrying within the society", "Unpacking and basic arranging", "Cleanup of cartons"],
    notIncluded: ["Truck or vehicle hire", "Disassembling large furniture", "Packing of valuables you have not declared"],
    steps: ["Tell us what is moving, and from where to where", "We plan the team size and time", "Helpers pack, label and photo each box", "You sign off at the new place"],
    faqs: [
      { q: "Truck bhi milega?", a: "Not yet. We coordinate with your mover if you have one, and we handle the people part inside the society." },
      { q: "Kimti saaman ka kya?", a: "Declare valuables upfront. You pack those yourself or we photograph them with you present." },
      { q: "Kitne log aayenge?", a: "Two helpers for a 1 BHK, three or four for larger homes. We suggest the number based on your list." },
    ],
    helperReq: "Safety module, packing module, and a shadow job. Managed-eligible helpers only.",
  },
  {
    slug: "small-repairs", en: "Small repairs coordination", hi: "छोटी मरम्मत का इंतज़ाम", icon: "wrench", minutes: 90, min: 19900, max: 59900,
    intro: "We do not pretend to be plumbers. We find the right mistri from the society's approved list, make sure they show up, watch the clock and keep the quote honest.",
    introHi: "मिस्त्री ढूँढना, समय पर बुलाना, रेट पक्का करना: यह हम संभालते हैं।",
    included: ["Finding an approved tradesperson", "Fixing the visit time and the quote", "A Shell helper present for the first 15 minutes", "Photo of the finished repair"],
    notIncluded: ["The repair cost itself, which is paid to the tradesperson", "Structural or electrical work needing a licensed contractor", "Warranty on spare parts"],
    steps: ["Describe the problem with a photo", "We fix a visit slot and a quote range", "Helper meets the mistri at the gate", "You approve, we release our coordination fee"],
    faqs: [
      { q: "Mistri ke paise alag?", a: "Yes. Shell charges a coordination fee. The tradesperson's quote is shown to you before work starts." },
      { q: "Kaun se kaam?", a: "Taps, switches, fans, curtain rods, minor carpentry. Anything involving gas, wiring behind walls or structure is declined." },
      { q: "Kaam theek na hua to?", a: "Rework within 24 hours is covered by the Guarantee for coordination. The tradesperson is asked to return." },
    ],
    helperReq: "Coordination module only. Helpers do not perform the repairs.",
  },
  {
    slug: "queueing", en: "Queueing", hi: "लाइन में खड़े होना", icon: "queue", minutes: 90, min: 19900, max: 79900,
    intro: "Banks, service centres, offices and the ration shop. We stand in line so you do not have to, and send a photo at each milestone so you can walk in at the right moment.",
    introHi: "बैंक, सर्विस सेंटर, दफ़्तर: लाइन में हम खड़े होंगे, आप सही वक़्त पर पहुँचिए।",
    included: ["Standing in line for the agreed hours", "Photo updates and a 10 minute heads-up", "Hand-over when it is your turn"],
    notIncluded: ["Signing or submitting documents on your behalf", "Handling cash or originals of identity documents"],
    steps: ["Tell us where and which counter", "We assign a helper close by", "Photo updates every 20 minutes", "10 minute heads-up before your turn"],
    faqs: [
      { q: "Mere documents dene honge?", a: "No. The helper only holds the place. You arrive and do the transaction yourself." },
      { q: "Kitne ghante?", a: "Priced by the hour with a 1 hour minimum. You can add time in 30 minute steps." },
      { q: "Wait aur lamba hua to?", a: "The helper requests extra time and you accept the price change in the app." },
    ],
    helperReq: "Safety module and errands module.",
  },
  {
    slug: "sports-partner", en: "Sports partner", hi: "खेल का साथी", icon: "ball", minutes: 60, min: 24900, max: 49900,
    intro: "Badminton, cricket nets, football or a jog. A partner who actually shows up at 6 am, matched on skill level and location inside the society.",
    introHi: "बैडमिंटन, क्रिकेट, फुटबॉल या जॉगिंग: सुबह 6 बजे भी साथ देने वाला पार्टनर।",
    included: ["One hour of play or practice", "Equipment sharing if both agree", "A short feedback note"],
    notIncluded: ["Professional coaching", "Contact sports without protective gear", "Sessions outside the society grounds"],
    steps: ["Pick the sport and your level", "We match a helper at a similar level", "Meet at the court or ground", "Rate and rebook the same partner"],
    faqs: [
      { q: "Level kaise match hota hai?", a: "Helpers self-rate their level and sample photos or notes are reviewed. You can ask for a stronger or gentler partner." },
      { q: "Chot lag gayi to?", a: "Injuries during play are not covered by damage cover, so please play within your usual limits." },
      { q: "Subah jaldi?", a: "Yes, 6 am slots are available if a helper has opted in. Safety rules still apply." },
    ],
    helperReq: "Safety module and a skill note for the sport.",
  },
  {
    slug: "gaming-partner", en: "Gaming partner", hi: "गेमिंग पार्टनर", icon: "gamepad", minutes: 60, min: 19900, max: 49900,
    intro: "Chess, carrom, console co-op or a card game on a quiet afternoon. Company for people who would rather play than scroll.",
    introHi: "शतरंज, कैरम, कंसोल या ताश: खेलने के लिए साथी।",
    included: ["One hour of games at your home or the clubhouse", "Your choice of game", "A cheerful opponent"],
    notIncluded: ["Betting or money games", "Playing on your online accounts", "Sessions with minors without an adult present"],
    steps: ["Pick the game and level", "We match a helper", "Play at home or the clubhouse", "Rate and rebook"],
    faqs: [
      { q: "Paise lagakar khelna?", a: "Never. Betting or money games are not allowed and the helper will end the session." },
      { q: "Mere account pe?", a: "Helpers do not log into your personal accounts. Use a guest or shared profile." },
      { q: "Online games?", a: "Yes, on your device while sitting with you. Remote sessions are not offered." },
    ],
    helperReq: "Safety module.",
  },
];

type Tpl = { slug: string; cat: string; en: string; hi: string; rate: number; unit: string; mins: number; managed?: boolean; checklist: string[] };
export const TEMPLATES: Tpl[] = [
  { slug: "clean-room", cat: "house-cleaning", en: "Room cleaning", hi: "कमरे की सफाई", rate: 24900, unit: "room", mins: 45, checklist: ["Sweep floor", "Mop floor", "Dust surfaces and fan", "Empty bin"] },
  { slug: "clean-kitchen", cat: "house-cleaning", en: "Kitchen deep clean", hi: "रसोई की गहरी सफाई", rate: 59900, unit: "kitchen", mins: 90, checklist: ["Slab and stove-top", "Sink and tap", "Cabinet fronts", "Floor"] },
  { slug: "clean-bathroom", cat: "house-cleaning", en: "Bathroom cleaning", hi: "बाथरूम सफाई", rate: 29900, unit: "bathroom", mins: 40, checklist: ["Toilet and seat", "Wash basin", "Tiles and floor", "Mirror"] },
  { slug: "clean-full-home", cat: "house-cleaning", en: "Full home clean", hi: "पूरे घर की सफाई", rate: 129900, unit: "home", mins: 240, managed: true, checklist: ["All rooms swept and mopped", "Dusting", "Bathrooms", "Kitchen slab", "Balcony"] },
  { slug: "utensils", cat: "utensils", en: "Utensil washing", hi: "बर्तन धुलाई", rate: 14900, unit: "load", mins: 30, checklist: ["Wash and rinse", "Stack on rack", "Wipe sink"] },
  { slug: "groceries", cat: "groceries", en: "Groceries run", hi: "ग्रोसरी", rate: 17900, unit: "run", mins: 60, checklist: ["Buy from list", "Photo of receipt", "Deliver to door"] },
  { slug: "errand", cat: "errands", en: "Errand (up to 3 stops)", hi: "छोटा काम", rate: 12900, unit: "errand", mins: 45, checklist: ["Visit each stop", "Photo at each stop", "Receipts uploaded"] },
  { slug: "parcel-pickup", cat: "parcel-pickup", en: "Parcel pickup or drop", hi: "पार्सल", rate: 9900, unit: "parcel", mins: 25, checklist: ["Photo of label at pickup", "Photo at hand-over"] },
  { slug: "wardrobe-organise", cat: "wardrobe-organising", en: "Wardrobe organising", hi: "अलमारी ऑर्गनाइज़", rate: 79900, unit: "wardrobe", mins: 120, managed: true, checklist: ["Sort by type", "Fold and hang", "Label zones", "Donate pile photo"] },
  { slug: "decoration", cat: "decoration", en: "Party decoration setup", hi: "पार्टी सजावट", rate: 99900, unit: "setup", mins: 120, managed: true, checklist: ["Props laid out", "Balloons and lights", "Table styling", "Cleanup"] },
  { slug: "event-help", cat: "event-help", en: "Event helper", hi: "इवेंट हेल्पर", rate: 19900, unit: "hour", mins: 60, checklist: ["Briefing", "Serving", "Clearing", "Reset"] },
  { slug: "excel-help", cat: "excel-data-help", en: "Excel and data help", hi: "एक्सेल मदद", rate: 29900, unit: "hour", mins: 60, checklist: ["Goal confirmed", "Work done", "Walkthrough given"] },
  { slug: "tutoring", cat: "tutoring", en: "Tutoring (explaining)", hi: "ट्यूशन", rate: 34900, unit: "hour", mins: 60, checklist: ["Topic agreed", "Concepts explained", "Practice reviewed"] },
  { slug: "pet-walk", cat: "pet-walking", en: "Pet walk (30 min)", hi: "पेट वॉक", rate: 17900, unit: "walk", mins: 30, checklist: ["Leash and water", "Walk done", "Photo shared"] },
  { slug: "moving-help", cat: "moving-help", en: "Moving helper", hi: "शिफ्टिंग हेल्पर", rate: 24900, unit: "hour", mins: 60, managed: true, checklist: ["Packing", "Labelling", "Carrying", "Unpacking"] },
  { slug: "small-repairs", cat: "small-repairs", en: "Repair coordination", hi: "मरम्मत का इंतज़ाम", rate: 19900, unit: "visit", mins: 90, checklist: ["Tradesperson confirmed", "First 15 min present", "Photo of repair"] },
  { slug: "queueing", cat: "queueing", en: "Queueing", hi: "लाइन में खड़े रहना", rate: 19900, unit: "hour", mins: 60, checklist: ["In line", "Updates sent", "Hand-over done"] },
  { slug: "sports-partner", cat: "sports-partner", en: "Sports partner", hi: "स्पोर्ट्स पार्टनर", rate: 24900, unit: "hour", mins: 60, checklist: ["Warm up", "Play", "Feedback note"] },
  { slug: "gaming-partner", cat: "gaming-partner", en: "Gaming partner", hi: "गेमिंग पार्टनर", rate: 19900, unit: "hour", mins: 60, checklist: ["Game agreed", "Played", "Wrap up"] },
  { slug: "clean-balcony", cat: "house-cleaning", en: "Balcony and windows", hi: "बालकनी और खिड़कियाँ", rate: 34900, unit: "balcony", mins: 50, checklist: ["Sweep and wash", "Window glass", "Plants moved and returned"] },
];

export const PACKS = [
  { slug: "guests-aa-rahe-hain", en: "Guests Aa Rahe Hain", hi: "मेहमान आ रहे हैं", icon: "sofa", copy: "A day before guests land: groceries first, then cleaning, wardrobe and the decoration that makes it feel planned.", copyHi: "मेहमान आने से एक दिन पहले: ग्रोसरी, सफाई, अलमारी और सजावट।",
    items: [{ template: "groceries", qty: 1, offsetHours: -24, label: "Groceries" }, { template: "clean-full-home", qty: 1, offsetHours: -12, label: "Full home clean" }, { template: "wardrobe-organise", qty: 1, offsetHours: -6, label: "Wardrobe" }, { template: "decoration", qty: 1, offsetHours: -3, label: "Decoration" }], helpers: ["Shopper", "Cleaner", "Organiser", "Decorator"] },
  { slug: "move-in-ready", en: "Move-In Ready", hi: "मूव-इन रेडी", icon: "key", copy: "Keys in hand, nothing unpacked. Clean it, pack it, arrange it. You arrive to a home that already makes sense.", copyHi: "नई जगह पर पहुँचने से पहले सब तैयार।",
    items: [{ template: "clean-full-home", qty: 1, size: "large", offsetHours: -48, label: "Deep clean" }, { template: "clean-bathroom", qty: 2, offsetHours: -48, label: "Bathrooms" }, { template: "clean-kitchen", qty: 1, offsetHours: -46, label: "Kitchen" }, { template: "moving-help", qty: 4, offsetHours: -24, label: "Carrying and unpacking" }, { template: "wardrobe-organise", qty: 1, offsetHours: -12, label: "Wardrobe" }], helpers: ["Cleaner", "Mover", "Organiser"] },
  { slug: "diwali-ready", en: "Diwali Ready", hi: "दिवाली रेडी", icon: "lamp", copy: "The big annual clean, lights on the balcony and a fridge that is stocked. Book early; the week before Diwali fills fast.", copyHi: "दिवाली की बड़ी सफाई, सजावट और ग्रोसरी।",
    items: [{ template: "clean-full-home", qty: 1, size: "large", offsetHours: -72, label: "Big clean" }, { template: "clean-balcony", qty: 1, offsetHours: -70, label: "Balcony and windows" }, { template: "decoration", qty: 1, offsetHours: -24, label: "Diyas and lights" }, { template: "groceries", qty: 1, offsetHours: -12, label: "Groceries" }], helpers: ["Cleaner", "Decorator", "Shopper"] },
  { slug: "exam-week-support", en: "Exam Week Support", hi: "एग्ज़ाम वीक सपोर्ट", icon: "book", copy: "You study. We handle the rest: meals shopped for, utensils washed, small errands done and a senior student to explain what is not clicking.", copyHi: "आप पढ़ाई कीजिए, बाकी हम।",
    items: [{ template: "tutoring", qty: 4, offsetHours: -48, label: "Explaining sessions" }, { template: "groceries", qty: 1, offsetHours: -48, label: "Groceries" }, { template: "utensils", qty: 3, offsetHours: -24, label: "Utensils" }, { template: "errand", qty: 1, offsetHours: -24, label: "Errands" }], helpers: ["Tutor", "Shopper", "Helper"] },
  { slug: "weekend-reset", en: "Weekend Reset", hi: "वीकेंड रीसेट", icon: "calendar", copy: "Saturday morning, a tidy home. Cleaning, utensils, a fresh wardrobe shelf and the week's groceries.", copyHi: "शनिवार सुबह तक साफ़ घर।",
    items: [{ template: "clean-full-home", qty: 1, offsetHours: -4, label: "Full clean" }, { template: "utensils", qty: 1, offsetHours: -3, label: "Utensils" }, { template: "wardrobe-organise", qty: 1, offsetHours: -2, label: "Wardrobe shelf" }, { template: "groceries", qty: 1, offsetHours: -1, label: "Groceries" }], helpers: ["Cleaner", "Organiser", "Shopper"] },
  { slug: "new-flat-setup", en: "New Flat Setup", hi: "नया फ्लैट सेटअप", icon: "home", copy: "Furniture in, boxes everywhere. We help unpack, fix the small things, clean and dress the home.", copyHi: "नया फ्लैट, सब सेट।",
    items: [{ template: "moving-help", qty: 4, offsetHours: -24, label: "Unpacking" }, { template: "small-repairs", qty: 1, offsetHours: -20, label: "Small repairs" }, { template: "clean-full-home", qty: 1, offsetHours: -12, label: "Clean" }, { template: "wardrobe-organise", qty: 1, offsetHours: -8, label: "Wardrobe" }, { template: "decoration", qty: 1, offsetHours: -4, label: "Styling" }], helpers: ["Mover", "Cleaner", "Coordinator"] },
  { slug: "party-prep", en: "Party Prep", hi: "पार्टी प्रेप", icon: "balloon", copy: "Decorations up, food bought, glasses washed and three helpers who run the evening.", copyHi: "सजावट, खरीदारी और सर्विस।",
    items: [{ template: "groceries", qty: 1, offsetHours: -24, label: "Groceries" }, { template: "clean-full-home", qty: 1, offsetHours: -12, label: "Clean" }, { template: "decoration", qty: 1, size: "large", offsetHours: -4, label: "Decoration" }, { template: "event-help", qty: 3, offsetHours: 0, label: "Event helpers (3 hours)" }, { template: "utensils", qty: 2, offsetHours: 4, label: "Utensils after" }], helpers: ["Shopper", "Decorator", "Event team"] },
];

export const HOME_FAQS: { q: string; a: string; qHi: string; aHi: string }[] = [
  { q: "Kya Shell meri jagah kaam karta hai?", a: "Not yet. We are starting inside one apartment society in Delhi and opening society by society. Join the waitlist with your society name and we will tell you when we reach you.", qHi: "क्या Shell मेरे इलाक़े में है?", aHi: "अभी नहीं। हम दिल्ली की एक सोसाइटी से शुरू कर रहे हैं। वेटलिस्ट में नाम लिखिए, पहुँचते ही बताएँगे।" },
  { q: "Kaun log mere ghar aayenge?", a: "Verified people, mostly college students and freelancers from nearby. Each has a government ID check through a KYC partner, a college ID check, a selfie liveness check, safety training, and a shadow job before working alone.", qHi: "मेरे घर कौन आएगा?", aHi: "वेरिफाइड लोग, ज़्यादातर पास के कॉलेज स्टूडेंट। सरकारी ID, कॉलेज ID, सेल्फ़ी और ट्रेनिंग के बाद ही।" },
  { q: "Kya meri jaankari safe hai?", a: "We store only what we need. We never store an Aadhaar number, only a reference and a verified flag from the KYC provider. Location is shared only during an active job, and every staff access to it is logged.", qHi: "क्या मेरी जानकारी सुरक्षित है?", aHi: "हम आधार नंबर कभी नहीं रखते। लोकेशन सिर्फ़ चल रहे काम के दौरान साझा होती है।" },
  { q: "Agar kaam theek nahi hua to?", a: "Tell us within 24 hours and we send someone back to fix it at no cost. If it still is not right, we refund the affected part. Damage is covered up to a set limit under the Shell Guarantee.", qHi: "अगर काम ठीक नहीं हुआ?", aHi: "24 घंटे में बताइए, हम फिर से मुफ़्त में ठीक करवाएँगे। नुक़सान पर गारंटी कवर है।" },
  { q: "Paise kab aur kaise dene hain?", a: "You pay after you approve the plan, by UPI, card or Shell Wallet. We hold the money and release it to the helper only after you approve the job, or two hours after completion if you do not respond.", qHi: "पैसे कब और कैसे देने हैं?", aHi: "प्लान मंज़ूर करने के बाद UPI या कार्ड से। काम पूरा होने पर ही हेल्पर को पैसे जाते हैं।" },
  { q: "Kya main helper ke saath direct baat kar sakti hoon?", a: "Chat and masked calls inside the app, yes. Sharing phone numbers or paying outside Shell is not allowed, because the guarantee, damage cover and instant payouts only work inside Shell.", qHi: "क्या मैं हेल्पर से सीधे बात कर सकती हूँ?", aHi: "ऐप के अंदर चैट और मास्क्ड कॉल, हाँ। बाहर नंबर या पेमेंट शेयर करना मना है।" },
  { q: "Kya female helper mil sakti hai?", a: "Yes. Turn on the female-helper-only setting in your Home Atlas. We only offer those jobs to helpers who have opted in. In the pilot, availability depends on how many women helpers have joined, and we will tell you before you pay if a slot cannot be matched.", qHi: "क्या महिला हेल्पर मिल सकती है?", aHi: "हाँ। Home Atlas में महिला-हेल्पर विकल्प चालू कीजिए।" },
  { q: "Kaun se kaam nahi lete?", a: "Massage, makeup, and personal care are closed at launch. We explain and tutor but never do homework or assignments for anyone. Helpers must be 18 or older.", qHi: "कौन से काम नहीं लेते?", aHi: "मसाज, मेकअप और पर्सनल केयर बंद हैं। होमवर्क हम नहीं करते।" },
  { q: "Society mein kab aayega?", a: "When enough neighbours in your society join the waitlist and we have helpers nearby. The live waitlist map shows the count for your area and how many more we need.", qHi: "मेरी सोसाइटी में कब आएगा?", aHi: "जब पर्याप्त पड़ोसी वेटलिस्ट में जुड़ेंगे और पास में हेल्पर होंगे।" },
  { q: "Kya Shell mere ghar ki chaabi rakhta hai?", a: "No. Shell never keeps your key. You choose at home, guard holds the key, or a lockbox with a one-time code, and every access is logged with a timestamp.", qHi: "क्या Shell मेरे घर की चाबी रखता है?", aHi: "नहीं। आप चुनते हैं: घर पर रहें, गार्ड के पास, या लॉकबॉक्स OTP के साथ।" },
  { q: "Helper banne ke liye kya chahiye?", a: "You need to be 18 or older, with a government ID, a college ID or proof of work, a phone, and a UPI or bank account. Then a short training and a shadow job. Students, freelancers and homemakers with a skill can apply.", qHi: "हेल्पर बनने के लिए क्या चाहिए?", aHi: "18+ उम्र, सरकारी ID, कॉलेज ID या काम का सबूत, और छोटी ट्रेनिंग।" },
  { q: "Kitna commission lete ho?", a: "Between 20 and 28 percent of the task price depending on the helper's level, which is already included in the price you see. Customers also pay a platform fee, and a coordination fee on bigger plans. All of it is shown on the receipt before you pay.", qHi: "कितना कमीशन लेते हो?", aHi: "हेल्पर के लेवल के हिसाब से 20 से 28 प्रतिशत। सब रसीद पर पहले से दिखता है।" },
];

export const HELP_FAQS = [
  { scope: "help-customer", q: "How do I change the time of a task?", a: "Open the plan, tap the task and choose Swap time. If a helper is already assigned we ask them first and show you any price change." },
  { scope: "help-customer", q: "Meri OTP nahi aayi", a: "We send the OTP on WhatsApp first and SMS as a fallback. Wait 30 seconds before you resend. After three wrong tries the number is locked for 10 minutes." },
  { scope: "help-customer", q: "How do refunds work?", a: "Refunds go to the original payment method in 5 to 7 working days, or to your Shell Wallet instantly if you choose." },
  { scope: "help-customer", q: "How do I invite neighbours to a Circle?", a: "Make a plan a Circle from the plan screen. Share the WhatsApp link. When the minimum flats join, the Circle is confirmed and the price per flat drops." },
  { scope: "help-customer", q: "What is the door OTP?", a: "A four-digit code that only you can see. Share it with the helper at your door. A job cannot start without it." },
  { scope: "help-helper", q: "How do I get paid?", a: "Weekly payouts are free. Instant payouts carry a small fee. Payouts are made after the customer approves the job." },
  { scope: "help-helper", q: "Why can't I check in?", a: "Check-in needs you to be within about 150 metres of the address and needs the door OTP. If GPS drifts, step outside the lift lobby and try again." },
  { scope: "help-helper", q: "How do strikes work?", a: "A strike is issued for things like sharing a phone number, a no-show without notice, or a safety breach. Each strike shows its reason and evidence, and you can appeal once." },
  { scope: "help-helper", q: "Can I take jobs between classes?", a: "Yes. Set your weekly slots in Availability, or paste a photo of your timetable. Offers only arrive in the slots you pick." },
];

export const POSTS = [
  {
    slug: "prep-your-home-for-guests-in-24-hours",
    title: "How to prep your home for guests in 24 hours",
    titleHi: "24 घंटे में मेहमानों के लिए घर कैसे तैयार करें",
    excerpt: "A timeline that actually works when someone texts 'we are coming tomorrow'.",
    tags: ["guests", "cleaning", "planning"],
    readingMin: 5,
    body: `## T minus 24 hours: groceries first
Write the list before you do anything else. Tea, snacks, one proper dish and something sweet. If a shop closes early near you, buy first. Everything else can be done in any order, groceries cannot.

## T minus 12 hours: clean the parts guests see
Start with the living room, the guest bathroom and the kitchen slab. Skip the inside of cupboards. Guests will not open them. A 3 BHK full clean takes about four hours for one person, so start early or split it.

## T minus 6 hours: close the doors you do not want opened
Wardrobes, the store room, the balcony pile. A twenty minute tidy of the visible shelf is better than a perfect wardrobe nobody sees.

## T minus 3 hours: the details
Lights, a few flowers, a clear table. Balloons if there are kids. Light the lamp or the incense you normally use so the house smells like you.

## What if there is no time?
This is the exact problem Shell is built for. One message, one plan, and one person to ask. Until then, use this list and delegate everything that is not tea.`,
  },
  {
    slug: "how-to-set-a-grocery-cap-without-stress",
    title: "How to set a grocery cap without stress",
    titleHi: "ग्रोसरी की सीमा कैसे तय करें",
    excerpt: "A simple rule for how much to let someone else spend on your behalf.",
    tags: ["groceries", "money"],
    readingMin: 3,
    body: `## Start with last month
Look at the last two grocery bills for a similar list. Add 15 percent for price changes. That is your cap.

## Say what you do not want substituted
Brands, dairy, anything with an allergy. Everything else can be a free choice so the helper does not message you from the aisle.

## Approve the receipt, not the person
Ask for the receipt photo and check three lines you know the price of. That is enough to trust the rest.`,
  },
  {
    slug: "what-a-verified-helper-means",
    title: "What 'verified helper' actually means at Shell",
    titleHi: "Shell में वेरिफाइड हेल्पर का मतलब",
    excerpt: "Six checks, in order, before anyone comes to your door.",
    tags: ["safety", "trust"],
    readingMin: 4,
    body: `## The six steps
1. Application and an age check: 18 or older, no exceptions.
2. Government ID checked through a KYC partner. We never store the number.
3. College ID or proof of work, with an expiry check.
4. A selfie liveness check matched with the ID photo.
5. Safety and category training with an 80 percent pass mark.
6. A shadow job with an experienced helper before working alone.

## After that
Door OTP on every job, a gate pass for the guard, live location only while the job runs, and an SOS that reaches our team in 20 seconds.`,
  },
];

export const TRAINING = [
  { slug: "safety-first", title: "Safety first", category: "general", mandatory: true, badge: "Safety Trained", cards: [{ title: "Door etiquette", body: "Knock, wait, introduce yourself by first name, and ask for the door OTP before you enter." }, { title: "Never share personal numbers", body: "Phone numbers and UPI stay out of chat. If a customer asks, say it is against Shell rules." }, { title: "Handling valuables", body: "Do not move jewellery, cash or documents. If something looks valuable, photograph it and tell the customer." }, { title: "Emergencies", body: "Press and hold SOS for two seconds or shake the phone three times. Our team reaches you in 20 seconds." }, { title: "Consent and respect", body: "Ask before touching anything personal. Leave if you feel unsafe and tell ops." }, { title: "Risky categories", body: "No massage, makeup or personal care. No homework for anyone. Explain, do not do." }], quiz: [{ q: "A customer asks for your number to book you directly. You...", options: ["Share it", "Politely refuse and stay in chat", "Share only your UPI"], answer: 1 }, { q: "Who can you share the door OTP with?", options: ["Anyone", "No one, you receive it from the customer", "The guard"], answer: 1 }, { q: "How do you trigger SOS?", options: ["Press and hold 2 seconds or shake 3 times", "Call a friend", "Send a message to ops"], answer: 0 }, { q: "A customer asks for a massage. You...", options: ["Do it quickly", "Decline, it is not a Shell category", "Ask ops later"], answer: 1 }, { q: "A tutoring customer asks you to write their homework. You...", options: ["Write it", "Explain the concept instead", "Charge extra"], answer: 1 }] },
  { slug: "cleaning-basics", title: "Cleaning basics", category: "house-cleaning", mandatory: false, badge: "Cleaning", cards: [{ title: "Top to bottom", body: "Fans and shelves first, floors last." }, { title: "Product safety", body: "Check the Home Atlas for allergies before you use anything." }, { title: "Photos", body: "Photograph each zone before and after, in good light, from the doorway." }], quiz: [{ q: "Which order is right?", options: ["Floors first", "Top to bottom", "Bathroom first always"], answer: 1 }, { q: "Where do you check for allergies?", options: ["Home Atlas", "Ask the guard", "You don't"], answer: 0 }, { q: "When do you photograph a zone?", options: ["Only after", "Before and after", "Never"], answer: 1 }, { q: "Can you move the 'do not touch' items?", options: ["Yes", "No", "If cleaning needs it"], answer: 1 }, { q: "Heavy furniture?", options: ["Lift it", "Do not move it, tell ops", "Ask the neighbour"], answer: 1 }] },
  { slug: "errands-and-receipts", title: "Errands and receipts", category: "errands", mandatory: false, badge: "Errands", cards: [{ title: "The cap", body: "Never spend above the cap. Message the customer first." }, { title: "Receipts", body: "Photograph the whole receipt flat, in light, with every line readable." }, { title: "Substitutions", body: "Follow the customer's rule: none, or ask first." }], quiz: [{ q: "Item is over the cap. You...", options: ["Buy anyway", "Ask the customer", "Skip silently"], answer: 1 }, { q: "A good receipt photo shows...", options: ["The total", "Every line, flat and readable", "Only the shop name"], answer: 1 }, { q: "Customer said no substitutions. Item missing. You...", options: ["Substitute", "Message with a photo", "Buy something else"], answer: 1 }, { q: "Cash handling", options: ["Keep change", "Return exact change via the app refund", "Tip yourself"], answer: 1 }, { q: "Stops per errand", options: ["As many as you like", "Up to three nearby", "One only"], answer: 1 }] },
  { slug: "decoration-and-organising", title: "Decoration and organising", category: "decoration", mandatory: false, badge: "Organiser", cards: [{ title: "Plan the room first", body: "Walk the room with the customer, agree what goes where." }, { title: "Ladders", body: "No ladder work above 3 metres. Tell ops if the job needs it." }, { title: "Sorting", body: "Never throw away. Make a donate pile and ask." }], quiz: [{ q: "Above 3 metres you...", options: ["Climb", "Tell ops", "Stack chairs"], answer: 1 }, { q: "Unwanted clothes...", options: ["Bin", "Donate pile and ask", "Take home"], answer: 1 }, { q: "Props over cap?", options: ["Buy", "Ask the customer", "Skip"], answer: 1 }, { q: "Before you start", options: ["Photos of each zone", "Nothing", "Message ops"], answer: 0 }, { q: "Do not touch list", options: ["Optional", "Mandatory", "Only for jewellery"], answer: 1 }] },
];

export const SOCIETY_SEED = {
  main: { name: "Green Meadows Apartments", slug: "green-meadows-dwarka", city: "Delhi", status: "pilot", lat: 28.5921, lng: 77.046 },
  others: [
    { name: "Palm Court, Sector 19 Dwarka", slug: "palm-court-sector-19", lat: 28.5735, lng: 77.0489, target: 400 },
    { name: "Sunrise Heights, Janakpuri", slug: "sunrise-heights-janakpuri", lat: 28.6219, lng: 77.0878, target: 500 },
    { name: "Lotus Apartments, Vasant Kunj", slug: "lotus-apartments-vasant-kunj", lat: 28.5200, lng: 77.1590, target: 600 },
  ],
};

export const HELPERS = [
  { name: "Rahul Verma", f: false, college: "Delhi Technological University", level: "PRO", rating: 4.9, jobs: 74, langs: ["Hindi", "English"], cats: ["house-cleaning", "utensils", "groceries"], good: ["Deep cleaning", "Punctual", "Careful with fragile things"], voice: "Namaste, main Rahul hoon. DTU mein padhta hoon. Saaf-safai mera kaam hai, aur main waqt ka pakka hoon." },
  { name: "Priya Singh", f: true, college: "Miranda House", level: "TRUSTED", rating: 4.8, jobs: 31, langs: ["Hindi", "English", "Punjabi"], cats: ["decoration", "event-help", "wardrobe-organising"], good: ["Decoration", "Wardrobe", "Female-only jobs"], voice: "Hi, I'm Priya. I love setting up spaces. Balloons, lights, wardrobes, give me a corner and I'll make it feel like a party." },
  { name: "Aman Gupta", f: false, college: "Delhi University (SRCC)", level: "TRUSTED", rating: 4.7, jobs: 26, langs: ["Hindi", "English"], cats: ["excel-data-help", "tutoring", "queueing"], good: ["Excel", "Patient explainer", "Maths"], voice: "Hello, Aman here. Commerce student. Excel and maths explain karna mujhe achha lagta hai." },
  { name: "Sneha Rao", f: true, college: "Lady Shri Ram College", level: "TRUSTED", rating: 4.9, jobs: 38, langs: ["Hindi", "English", "Telugu"], cats: ["groceries", "errands", "parcel-pickup"], good: ["Careful with receipts", "Quick shopper"], voice: "Hi, Sneha. Groceries and errands, I keep every receipt clean and tell you before I substitute anything." },
  { name: "Karan Mehta", f: false, college: "IP University", level: "STARTER", rating: 4.6, jobs: 8, langs: ["Hindi", "English"], cats: ["sports-partner", "gaming-partner", "pet-walking"], good: ["Badminton", "Chess", "Dog person"], voice: "Hey, Karan. Badminton aur chess dono khelta hoon. Kutte mujhe bahut pasand hain." },
  { name: "Isha Kapoor", f: true, college: "Jesus and Mary College", level: "PRO", rating: 4.9, jobs: 62, langs: ["Hindi", "English"], cats: ["wardrobe-organising", "house-cleaning", "decoration"], good: ["Wardrobe", "Neat labels", "Female-only jobs"], voice: "Hello! Isha here. I organise wardrobes the way you actually dress, not how a magazine thinks you should." },
  { name: "Vikram Yadav", f: false, college: "Freelancer", level: "TRUSTED", rating: 4.7, jobs: 29, langs: ["Hindi"], cats: ["moving-help", "small-repairs", "house-cleaning"], good: ["Packing", "Lifting", "Coordination"], voice: "Namaste, Vikram. Shifting aur packing ka kaam achhe se karta hoon, har dabba label karke." },
  { name: "Meera Nair", f: true, college: "Ambedkar University", level: "STARTER", rating: 4.8, jobs: 6, langs: ["Hindi", "English", "Malayalam"], cats: ["tutoring", "pet-walking", "utensils"], good: ["Explaining science", "Patient with kids"], voice: "Hi, I'm Meera. I explain science and I walk dogs, usually on the same afternoon." },
  { name: "Rohan Das", f: false, college: "NSUT", level: "STARTER", rating: 4.5, jobs: 9, langs: ["Hindi", "English", "Bengali"], cats: ["excel-data-help", "gaming-partner", "queueing"], good: ["Excel", "Waits patiently"], voice: "Hey, Rohan here. I like spreadsheets, and I do not mind standing in a queue." },
  { name: "Tanvi Sharma", f: true, college: "Gargi College", level: "ELITE", rating: 5.0, jobs: 141, langs: ["Hindi", "English"], cats: ["house-cleaning", "event-help", "decoration", "wardrobe-organising"], good: ["Event leader", "Managed plans", "Calm in a rush"], voice: "Namaste, Tanvi. Managed plans mera favourite hai, ek din mein ghar ready." },
];
