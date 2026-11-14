import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { CATEGORIES, HELP_FAQS, HELPERS, HOME_FAQS, PACKS, POSTS, SOCIETY_SEED, TEMPLATES, TRAINING } from "@/db/seed-data";
import { DEFAULT_PRICING } from "@/lib/pricing";
import { latLngToHex } from "@/lib/geo";
import { doorOtpHash } from "@/lib/otp";
import { sha } from "@/lib/auth";
import { createPlan, logEvent } from "@/lib/plans";
import { recordCapture, releaseTaskPayment } from "@/lib/money";
import { draftRequest, clarifyingQuestions } from "@/lib/plan-engine";
import { slugify } from "@/lib/format";
import { roomSvg } from "@/lib/placeholders";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function runSeed() {
  const now = Date.now();
  const H = 3600000;
  const rand = rng(7);

  await db.insert(s.pricingConfigs).values({ version: 1, data: DEFAULT_PRICING as never, reason: "Initial launch config" });
  await db.insert(s.featureFlags).values([
    { key: "shell_rush", enabled: true, description: "90-minute emergency dispatch inside the society" },
    { key: "shell_circle", enabled: true, description: "Pooled neighbour jobs" },
    { key: "shell_routines", enabled: false, description: "Repeating help (coming soon)" },
    { key: "shell_plus", enabled: false, description: "Subscription (later)" },
    { key: "whatsapp_otp_first", enabled: true, description: "Send OTP on WhatsApp before SMS" },
    { key: "konami_easter_egg", enabled: true, description: "Hidden surprise" },
  ]);
  await db.insert(s.settings).values([
    { key: "society_learning", value: { gateWaitMin: 2.5, liftPerFloorSec: 4, samples: 12 } },
    { key: "sla", value: { planReviewMin: 15, disputeHours: 24, sosSeconds: 20, noShowMin: 10 } },
    { key: "retention", value: { locationDays: 30, auditYears: 7 } },
    { key: "holidays", value: ["2026-11-08", "2026-10-20"] },
  ]);
  await db.insert(s.promoCodes).values([{ code: "WELCOME10", percent: 10, maxUses: 200 }, { code: "FIRSTSHELL", flat: 10000, maxUses: 100 }]);

  /* ---- societies, towers ---- */
  const m = SOCIETY_SEED.main;
  const [main] = await db
    .insert(s.societies)
    .values({
      name: m.name, slug: m.slug, city: m.city, status: m.status, centroidLat: m.lat, centroidLng: m.lng,
      boundary: [[28.5911, 77.045], [28.5933, 77.045], [28.5933, 77.0473], [28.5911, 77.0473]],
      gates: [
        { name: "Gate 1", lat: 28.5911, lng: 77.0452, hours: "24 hours", rules: "Visitors register at the guard desk", guard: "Guard desk +91 98100 00001" },
        { name: "Gate 2", lat: 28.5931, lng: 77.046, hours: "6am to 11pm", rules: "Service staff entry only, show gate-pass QR", guard: "Guard desk +91 98100 00002" },
      ],
      rules: "Service staff entry 7am to 9pm. Gate pass QR required.",
      perks: ["Resident-verified helpers", "Gate-pass QR for every visit", "2% of Shell fees go to the society fund"],
      waitlistTarget: 150,
    })
    .returning();
  const otherSocs = await db.insert(s.societies).values(SOCIETY_SEED.others.map((o) => ({ name: o.name, slug: o.slug, city: "Delhi", status: "waitlist", centroidLat: o.lat, centroidLng: o.lng, boundary: [] as [number, number][], waitlistTarget: o.target }))).returning();
  const towerPos: [string, number, number, number][] = [["Tower A", 28.5927, 77.0455, 14], ["Tower B", 28.5927, 77.0461, 14], ["Tower C", 28.5927, 77.0467, 16], ["Tower D", 28.5917, 77.0455, 12], ["Tower E", 28.5917, 77.0461, 12], ["Tower F", 28.5917, 77.0467, 12]];
  const towers = await db.insert(s.towers).values(towerPos.map(([name, lat, lng, floors]) => ({ societyId: main.id, name, lat, lng, floors, liftNotes: name === "Tower C" ? "Two lifts, lift lobby 2 is faster in the morning. Service lift at the back." : "Two lifts, one service lift." }))).returning();
  const towerC = towers.find((t) => t.name === "Tower C")!;
  await db.insert(s.vendors).values([
    { societyId: main.id, name: "Fresh Basket Kirana", categorySlug: "groceries", lat: 28.5913, lng: 77.0458, hours: "7am-10pm", typicalWaitMin: 6 },
    { societyId: main.id, name: "Apna Chemist", categorySlug: "errands", lat: 28.5909, lng: 77.0463, hours: "8am-11pm", typicalWaitMin: 4 },
    { societyId: main.id, name: "Sparkle Laundry", categorySlug: "errands", lat: 28.5935, lng: 77.0449, hours: "9am-8pm", typicalWaitMin: 3 },
  ]);

  /* ---- users ---- */
  const phone = (n: number) => `+91${9999900000 + n}`;
  const hphone = (i: number) => `+91910000${String(i).padStart(4, "0")}`;
  const userRows = [
    { phone: phone(1), name: "Ananya Mehra", role: "CUSTOMER" },
    { phone: phone(2), name: "Dev Malhotra (Ops)", role: "OPS", opsRole: "ops_lead" },
    { phone: phone(3), name: "RWA Secretary", role: "SOCIETY_PARTNER" },
    { phone: phone(4), name: "Shell Admin", role: "SUPER_ADMIN", opsRole: "super_admin" },
    { phone: phone(11), name: "Rishi Khanna", role: "CUSTOMER" },
    { phone: phone(12), name: "Pooja Bansal", role: "CUSTOMER" },
    { phone: phone(13), name: "Harleen Kaur", role: "CUSTOMER" },
  ].map((u) => ({ ...u, language: "en", consentLocation: new Date(), consentWhatsapp: new Date() }));
  const applicants = [{ name: "Neha Joshi", status: "review" }, { name: "Arjun Malik", status: "training" }];
  const helperUsers = [...HELPERS.map((h) => h.name), ...applicants.map((a) => a.name)].map((name, i) => ({ phone: hphone(i + 1), name, role: "HELPER", language: "en" }));
  const insertedUsers = await db.insert(s.users).values([...userRows, ...helperUsers]).returning();
  const U = (p: string) => insertedUsers.find((u) => u.phone === p)!;
  const ananya = U(phone(1)), ops = U(phone(2)), partner = U(phone(3)), admin = U(phone(4));
  const neighbours = [U(phone(11)), U(phone(12)), U(phone(13))];
  void partner;

  await db.insert(s.customerProfiles).values([ananya, ...neighbours].map((u, i) => ({
    userId: u.id, societyId: main.id, referralCode: "SH" + sha(u.id).slice(0, 5).toUpperCase(),
    walletBalance: i === 0 ? 45000 : 0, creditsBalance: i === 0 ? 15000 : 0, streak: i === 0 ? 3 : 0, kudos: i === 0 ? 7 : 2,
    homeAtlas: i === 0 ? { household: 3, kids: true, pets: [{ type: "Dog (Labrador)", temperament: "Friendly, barks at strangers first" }], allergies: "Strong phenyl, use only the mild floor cleaner in the kitchen", keyHandling: "guard" as const, doNotTouch: [{ text: "Study table papers", room: "Study" }, { text: "Jewellery drawer", room: "Bedroom" }], helperGender: "any" as const, helperLanguage: "Hindi", rooms: ["Living room", "Kitchen", "Bedroom", "Balcony", "Wardrobe"] } : {},
  })));
  const [addr] = await db.insert(s.addresses).values({ userId: ananya.id, societyId: main.id, towerId: towerC.id, floor: 9, flat: "C-902", landmark: "Lift lobby 2 ke saamne, neeli nameplate", lat: towerC.lat, lng: towerC.lng, entryNotes: "Guard holds the key. Dog is friendly after 10 seconds.", hex8: latLngToHex(towerC.lat, towerC.lng, 8), hex9: latLngToHex(towerC.lat, towerC.lng, 9), verifiedAt: new Date(), verificationMethod: "flat_match" }).returning();
  await db.insert(s.trustedContacts).values({ userId: ananya.id, name: "Mom", phone: "+919811100001" });

  /* ---- catalog ---- */
  await db.insert(s.taskCategories).values(CATEGORIES.map((c, i) => ({ slug: c.slug, nameEn: c.en, nameHi: c.hi, introEn: c.intro, introHi: c.introHi, icon: c.icon, included: c.included, notIncluded: c.notIncluded, steps: c.steps, faqs: c.faqs, helperReq: c.helperReq, typicalMinutes: c.minutes, priceMin: c.min, priceMax: c.max, displayOrder: i })));
  await db.insert(s.taskTemplates).values(TEMPLATES.map((t, i) => ({ slug: t.slug, categorySlug: t.cat, nameEn: t.en, nameHi: t.hi, baseRate: t.rate, unit: t.unit, minutesPerUnit: t.mins, managedOnly: !!t.managed, checklist: t.checklist, requiredSkills: [t.cat], displayOrder: i })));
  await db.insert(s.packs).values(PACKS.map((p, i) => ({
    slug: p.slug, nameEn: p.en, nameHi: p.hi, copyEn: p.copy, copyHi: p.copyHi, icon: p.icon, displayOrder: i, helperTypes: p.helpers,
    items: p.items.map((it) => ({ ...it, size: (it as { size?: string }).size ?? "medium" })),
    faqs: [
      { q: "Can I remove a task from this pack?", a: "Yes. Open the customise panel on the pack page or the plan review screen and the receipt updates live." },
      { q: "Is the price fixed?", a: "You see a range first. After a person checks the plan you see the exact amount before you pay." },
      { q: "What if I need it sooner?", a: "Same-day and Rush options are available inside the society. Urgency multiplies the task price and is shown as its own line." },
    ],
  })));
  await db.insert(s.faqs).values([
    ...HOME_FAQS.map((f, i) => ({ scope: "home", q: f.q, a: f.a, qHi: f.qHi, aHi: f.aHi, displayOrder: i })),
    ...HELP_FAQS.map((f, i) => ({ scope: f.scope, q: f.q, a: f.a, displayOrder: i })),
    { scope: "pricing", q: "Why is there a minimum order?", a: "Very small jobs cost more to coordinate than they earn. The minimum is Rs 199 and any top-up is shown as its own line.", displayOrder: 0 },
    { scope: "pricing", q: "What is the coordination fee?", a: "A flat fee on plans with three or more tasks or any Managed plan. It pays for the person who plans, schedules and follows up.", displayOrder: 1 },
    { scope: "pricing", q: "Do tips go to the helper?", a: "Yes, 100 percent.", displayOrder: 2 },
    { scope: "pricing", q: "Is GST included?", a: "Prices include GST. A GST invoice is generated for every plan.", displayOrder: 3 },
  ]);
  await db.insert(s.contentPosts).values(POSTS.map((p, i) => ({ ...p, publishedAt: new Date(now - i * 4 * 86400000) })));
  await db.insert(s.trainingModules).values(TRAINING.map((t, i) => ({ ...t, displayOrder: i })));

  /* ---- helpers ---- */
  const hRows = await db.insert(s.helpers).values([
    ...HELPERS.map((h, i) => ({
      userId: insertedUsers.find((u) => u.phone === hphone(i + 1))!.id,
      displayName: h.name, isFemale: h.f, dob: `${2002 + (i % 3)}-0${(i % 9) + 1}-1${i % 9}`, college: h.college, occupation: h.college === "Freelancer" ? "Freelancer" : "Student",
      languages: h.langs, categories: h.cats.map((c) => ({ slug: c, level: 3 })), goodAt: h.good, level: h.level, status: "active",
      kycStatus: "verified", kycReference: "digilocker_ref_" + (1000 + i), collegeIdStatus: "verified", livenessStatus: "verified", trainingStatus: "passed", safetyTrainingPassedAt: new Date(now - 30 * 86400000), shadowJobDone: true,
      availabilityGrid: { mon: [9, 10, 11, 16, 17, 18], tue: [9, 10, 11, 16, 17, 18], wed: [14, 15, 16, 17], thu: [9, 10, 11, 16, 17], fri: [16, 17, 18], sat: [8, 9, 10, 11, 12, 13, 14, 15, 16], sun: [9, 10, 11, 12] },
      ratingAvg: h.rating, ratingCount: h.jobs, jobsDone: h.jobs, onTimeRate: 0.9 + rand() * 0.09, repeatRate: 0.2 + rand() * 0.4, acceptanceRate: 0.8 + rand() * 0.18,
      voiceIntroText: h.voice, passportSlug: slugify(h.name), lat: 28.5921 + (rand() - 0.5) * 0.0016, lng: 77.046 + (rand() - 0.5) * 0.0016, online: i !== 4 && i !== 7,
      managedEligible: h.level === "PRO" || h.level === "ELITE", applicationStep: 7, femaleOnlyEligible: h.f, rushOptIn: i % 3 === 0, societyId: main.id, payoutAccountRef: "upi_ref_" + i, dailyCap: 4,
    })),
    ...applicants.map((a, i) => ({
      userId: insertedUsers.find((u) => u.phone === hphone(HELPERS.length + i + 1))!.id, displayName: a.name, isFemale: i === 0, dob: "2004-03-12", college: i === 0 ? "Hansraj College" : "Bhagwan Parshuram Institute", occupation: "Student", languages: ["Hindi", "English"], categories: [{ slug: "house-cleaning", level: 2 }],
      status: a.status, kycStatus: "verified", collegeIdStatus: i === 0 ? "pending" : "verified", livenessStatus: i === 0 ? "pending" : "verified", trainingStatus: i === 0 ? "pending" : "in_progress", applicationStep: i === 0 ? 7 : 7, societyId: main.id, passportSlug: slugify(a.name),
    })),
  ]).returning();
  const H_ = (name: string) => hRows.find((h) => h.displayName === name)!;
  const rahul = H_("Rahul Verma"), priya = H_("Priya Singh"), sneha = H_("Sneha Rao"), isha = H_("Isha Kapoor"), karan = H_("Karan Mehta");
  const mods = TRAINING.map((t) => t.slug);
  await db.insert(s.helperTraining).values(mods.map((slug) => ({ helperId: rahul.id, moduleSlug: slug, score: 90, passedAt: new Date(now - 25 * 86400000) })));
  await db.insert(s.strikes).values({ helperId: karan.id, reason: "Shared a phone number in chat", evidence: "Chat scanner hit on task thread, message blurred", severity: 1, issuedBy: ops.id, expiresAt: new Date(now + 60 * 86400000), appealStatus: "open", appealNote: "I was giving my number for a lost item, not to book directly." });
  await db.update(s.helpers).set({ strikes: 1 }).where(eq(s.helpers.id, karan.id));

  /* ---- demo plan A: Guests Are Coming (live) ---- */
  const deadline = new Date(now + 18 * H + 22 * 60000);
  const [reqA] = await db.insert(s.requests).values({ customerId: ananya.id, addressId: addr.id, rawText: "Guests are coming tomorrow. I need cleaning, groceries, wardrobe organising and decoration.", language: "en", status: "approved", deadlineAt: deadline, slaDueAt: new Date(now - 26 * H), hex8: addr.hex8, createdAt: new Date(now - 27 * H) }).returning();
  const A = await createPlan({ customerId: ananya.id, addressId: addr.id, requestId: reqA.id, title: "Guests Are Coming", status: "approved", managed: true, deadlineAt: deadline, items: PACKS[0].items.map((i) => ({ template: i.template, qty: i.qty, offsetHours: i.offsetHours })) });
  await db.update(s.plans).set({ paidAt: new Date(now - 25 * H), approvedAt: new Date(now - 25 * H), sentAt: new Date(now - 26 * H) }).where(eq(s.plans.id, A.planId));
  const aTasks = await db.select().from(s.tasks).where(eq(s.tasks.planId, A.planId)).orderBy(s.tasks.sequence);
  const [tGro, tClean, tWard, tDeco] = aTasks;
  await db.update(s.tasks).set({ status: "approved", assignedHelperId: sneha.id, scheduledStart: new Date(now - 6 * H), scheduledEnd: new Date(now - 5 * H), checkinAt: new Date(now - 6 * H), checkoutAt: new Date(now - 5 * H), approvedAt: new Date(now - 4 * H), expensesCap: 300000, checklist: tGro.checklist.map((c) => ({ ...c, done: true, ts: new Date(now - 5 * H).toISOString() })) }).where(eq(s.tasks.id, tGro.id));
  await db.update(s.tasks).set({ status: "in_progress", assignedHelperId: rahul.id, scheduledStart: new Date(now - 45 * 60000), scheduledEnd: new Date(now + 3 * H), checkinAt: new Date(now - 40 * 60000), checklist: tClean.checklist.map((c, i) => ({ ...c, done: i < 2, ts: i < 2 ? new Date(now - 10 * 60000).toISOString() : undefined })) }).where(eq(s.tasks.id, tClean.id));
  await db.update(s.tasks).set({ status: "en_route", assignedHelperId: isha.id, scheduledStart: new Date(now + 20 * 60000), scheduledEnd: new Date(now + 2.5 * H) }).where(eq(s.tasks.id, tWard.id));
  await db.update(s.tasks).set({ status: "offered", scheduledStart: new Date(now + 9 * H), scheduledEnd: new Date(now + 11 * H) }).where(eq(s.tasks.id, tDeco.id));
  await db.update(s.helpers).set({ lat: 28.5931, lng: 77.046 }).where(eq(s.helpers.id, isha.id)); // Isha at Gate 2
  await db.update(s.helpers).set({ lat: towerC.lat + 0.00003, lng: towerC.lng, online: true }).where(eq(s.helpers.id, rahul.id));
  await db.insert(s.offers).values([
    { taskId: tDeco.id, helperId: priya.id, status: "sent", payout: Math.round(tDeco.price * 0.75), expiresAt: new Date(now + 40 * 60000), score: 78, breakdown: { distance: 20, skill: 20, rating: 19, onTime: 10, level: 3, repeat: 0, stacking: 6, load: 0 } },
    { taskId: tClean.id, helperId: rahul.id, status: "accepted", payout: Math.round(tClean.price * 0.78), respondedAt: new Date(now - 100 * 60000), score: 91, breakdown: { distance: 23, skill: 20, rating: 20, onTime: 10, level: 6, repeat: 10, stacking: 0, load: -3 } },
  ]);
  const payId = "order_mock_seed_" + A.planId.slice(0, 8);
  await db.insert(s.payments).values({ planId: A.planId, customerId: ananya.id, orderId: payId, paymentId: "pay_mock_seed", method: "upi", amount: A.quote.total, status: "captured", idempotencyKey: "seed-" + A.planId, webhookEvents: [{ id: "evt_seed_1", type: "payment.captured", ts: new Date(now - 25 * H).toISOString() }] });
  await recordCapture(A.planId, A.quote.total);
  await releaseTaskPayment(tGro.id);
  await db.insert(s.expenses).values({ taskId: tGro.id, cap: 300000, spent: 214000, status: "approved", approvedAmount: 214000, refundedAmount: 86000, ocrItems: [{ name: "Atta 5kg", amount: 28500 }, { name: "Milk 2L", amount: 13800 }, { name: "Paneer 400g", amount: 16000 }, { name: "Vegetables mix", amount: 42000 }, { name: "Fruits", amount: 55000 }, { name: "Chips and drinks", amount: 58700 }] });
  const evs: [string | null, string, Record<string, unknown>, number][] = [[null, "plan_created", {}, -27], [null, "plan_sent", {}, -26], [null, "plan_paid", { amount: A.quote.total }, -25], [tGro.id, "helper_assigned", { helper: "Sneha" }, -24], [tGro.id, "approved", {}, -4], [tClean.id, "helper_assigned", { helper: "Rahul" }, -2], [tClean.id, "en_route", {}, -0.9], [tClean.id, "arrived", { gate: "Gate 2" }, -0.7], [tClean.id, "checked_in", { otp: true }, -0.67], [tWard.id, "en_route", { helper: "Isha" }, -0.1]];
  for (const [tid, kind, detail, off] of evs) await db.insert(s.taskEvents).values({ planId: A.planId, taskId: tid, kind, detail, ts: new Date(now + off * H) });
  const route: [number, number][] = [[28.5931, 77.046], [28.5931, 77.0462], [28.5929, 77.0464], [28.5927, 77.0466], [28.5927, 77.0467]];
  await db.insert(s.locationPings).values(route.map(([lat, lng], i) => ({ helperId: rahul.id, taskId: tClean.id, lat, lng, accuracy: 8, speed: 1.2, battery: 64, ts: new Date(now - 45 * 60000 + i * 60000) })));
  await db.insert(s.geofenceEvents).values([{ taskId: tClean.id, helperId: rahul.id, geofenceType: "society", event: "enter", ts: new Date(now - 45 * 60000) }, { taskId: tClean.id, helperId: rahul.id, geofenceType: "tower", event: "enter", ts: new Date(now - 41 * 60000) }]);
  await db.insert(s.messages).values([
    { threadKey: `task:${tClean.id}`, senderId: rahul.userId, senderRole: "HELPER", body: "Hello Ananya, this is Rahul. I will start with the kitchen, then the bedroom.", translatedBody: "Hello Ananya, I'm Rahul. Starting with the kitchen, then the bedroom." },
    { threadKey: `task:${tClean.id}`, senderId: ananya.id, senderRole: "CUSTOMER", body: "Sounds good. Please do not move the papers on the study table." },
    { threadKey: `task:${tClean.id}`, senderId: rahul.userId, senderRole: "HELPER", body: "Of course, it is on the do-not-touch list. Sending a photo now.", type: "text" },
    { threadKey: `plan:${A.planId}`, senderId: null, senderRole: "OPS", body: "Your plan is ready. Rahul and Isha are both inside your society, so the timing will be tight." },
  ]);
  await db.insert(s.photos).values([
    { ownerId: rahul.userId, taskId: tClean.id, kind: "before", url: roomSvg(false, "Before: kitchen"), takenAt: new Date(now - 39 * 60000) },
    { ownerId: sneha.userId, taskId: tGro.id, kind: "receipt", url: roomSvg(true, "Receipt: Fresh Basket"), takenAt: new Date(now - 5 * H) },
  ]);

  /* ---- plan B: history, approved long ago, with before/after + review ---- */
  const hist = await createPlan({ customerId: ananya.id, addressId: addr.id, title: "Kitchen reset", status: "approved", items: [{ template: "clean-kitchen", qty: 1 }, { template: "utensils", qty: 2 }] });
  await db.update(s.plans).set({ paidAt: new Date(now - 12 * 86400000), approvedAt: new Date(now - 12 * 86400000), createdAt: new Date(now - 12 * 86400000) }).where(eq(s.plans.id, hist.planId));
  const hTasks = await db.select().from(s.tasks).where(eq(s.tasks.planId, hist.planId)).orderBy(s.tasks.sequence);
  for (const [i, t] of hTasks.entries()) {
    const start = new Date(now - 12 * 86400000 + i * 2 * H);
    await db.update(s.tasks).set({ status: "approved", assignedHelperId: rahul.id, scheduledStart: start, scheduledEnd: new Date(start.getTime() + 2 * H), checkinAt: start, checkoutAt: new Date(start.getTime() + 1.5 * H), approvedAt: new Date(start.getTime() + 2 * H), checklist: t.checklist.map((c) => ({ ...c, done: true })) }).where(eq(s.tasks.id, t.id));
  }
  await db.insert(s.payments).values({ planId: hist.planId, customerId: ananya.id, orderId: "order_mock_hist", paymentId: "pay_mock_hist", method: "card", amount: hist.quote.total, status: "captured", idempotencyKey: "seed-" + hist.planId });
  await recordCapture(hist.planId, hist.quote.total);
  for (const t of hTasks) await releaseTaskPayment(t.id);
  await db.insert(s.photos).values([
    { ownerId: rahul.userId, taskId: hTasks[0].id, kind: "before", url: roomSvg(false, "Before"), takenAt: new Date(now - 12 * 86400000) },
    { ownerId: rahul.userId, taskId: hTasks[0].id, kind: "after", url: roomSvg(true, "After"), takenAt: new Date(now - 12 * 86400000 + 1.5 * H) },
  ]);
  await db.insert(s.reviews).values({ taskId: hTasks[0].id, fromUserId: ananya.id, toUserId: rahul.userId, rating: 5, tags: ["on time", "careful", "thorough"], note: "The kitchen is spotless.", tipAmount: 5000 });
  await db.insert(s.shellNotes).values({ fromUserId: ananya.id, toUserId: rahul.userId, taskId: hTasks[0].id, body: "Thank you Rahul, the kitchen looks much better!" });
  await db.insert(s.kudos).values({ fromUserId: ananya.id, toHelperId: rahul.id, taskId: hTasks[0].id });
  const leakMsg = await db.insert(s.messages).values([{ threadKey: `task:${hTasks[0].id}`, senderId: rahul.userId, senderRole: "HELPER", body: "Next time just call me directly on 98••••••10", blurred: true, leakFlags: ["phone"] }]).returning();
  await db.insert(s.disputes).values({ taskId: tGro.id, planId: A.planId, openedBy: ananya.id, reason: "overcharge", description: "Chips and drinks line looks higher than the shelf price.", evidence: [{ kind: "text", text: "Shelf price was Rs 410" }], status: "under_review", assignedOpsId: ops.id, slaDueAt: new Date(now + 18 * H) });
  await db.insert(s.sosEvents).values({ taskId: hTasks[0].id, userId: ananya.id, kind: "silent", status: "resolved", respondedBy: ops.id, points: [{ lat: towerC.lat, lng: towerC.lng, ts: new Date(now - 11 * 86400000).toISOString() }], timeline: [{ ts: new Date(now - 11 * 86400000).toISOString(), text: "Silent SOS received (test drill)" }, { ts: new Date(now - 11 * 86400000 + 12000).toISOString(), text: "Ops acknowledged in 12 seconds" }, { ts: new Date(now - 11 * 86400000 + 90000).toISOString(), text: "Resolved: drill" }], report: "Drill. Response time 12s." });
  await db.insert(s.fraudAlerts).values([
    { type: "phone_in_chat", severity: "medium", refType: "message", refId: leakMsg[0].id, evidence: { flags: ["phone"], helper: "Karan Mehta" } },
    { type: "repeat_pairing", severity: "low", refType: "helper", refId: rahul.id, evidence: { pair: "Rahul and a customer, 5 jobs, no new bookings in 14 days" } },
    { type: "gps_mock", severity: "high", refType: "helper", refId: karan.id, evidence: { note: "Mock-location flag on 3 pings" } },
  ]);
  await db.insert(s.payouts).values([1, 2, 3].map((i) => ({ helperId: rahul.id, amount: 180000 + i * 20000, status: "paid", method: i === 3 ? "instant" : "weekly", fee: i === 3 ? 2000 : 0, utr: "UTR9000" + i, scheduledFor: new Date(now - i * 7 * 86400000) })));

  /* ---- plan C: sent, awaiting customer approval ---- */
  const C = await createPlan({ customerId: ananya.id, addressId: addr.id, title: "Weekend kitchen and utensils", status: "sent", items: [{ template: "clean-kitchen", qty: 1 }, { template: "utensils", qty: 2 }], deadlineAt: new Date(now + 3 * 86400000) });
  await db.update(s.plans).set({ sentAt: new Date(now - 6 * 60000), expiresAt: new Date(now + 48 * H) }).where(eq(s.plans.id, C.planId));

  /* ---- requests in ops inbox ---- */
  const txtB = "My parents are visiting the day after tomorrow. I need the guest room set up, two wardrobes organised and the utensils washed.";
  const dB = await draftRequest(txtB, 1);
  await db.insert(s.requests).values({ customerId: neighbours[0].id, rawText: txtB, language: "en", status: "in_review", draft: dB, questions: clarifyingQuestions(dB).slice(0, 3).map((q, i) => ({ ...q, answer: q.chips[i % q.chips.length] })), slaDueAt: new Date(now + 11 * 60000), deadlineAt: new Date(now + 2 * 86400000), photos: [{ url: roomSvg(false, "guest room"), caption: "start here", circles: [{ x: 30, y: 62, label: "Floor needs mopping" }, { x: 62, y: 28, label: "Clothes pile" }] }], hex8: latLngToHex(towerC.lat, towerC.lng, 8) });
  const txtC = "I need a pivot table built in Excel by tomorrow morning. It should take about 2 hours.";
  const dC = await draftRequest(txtC);
  await db.insert(s.requests).values({ customerId: neighbours[1].id, rawText: txtC, language: "en", transcript: txtC, status: "in_review", draft: dC, slaDueAt: new Date(now + 14 * 60000), deadlineAt: new Date(now + 20 * H) });
  const txtD = "I need my dog walked morning and evening, and the bathroom cleaned.";
  const dD = await draftRequest(txtD);
  await db.insert(s.requests).values({ customerId: neighbours[2].id, rawText: txtD, language: "en", status: "new", draft: dD, slaDueAt: new Date(now + 15 * 60000) });

  /* ---- Circle ---- */
  const sat = new Date(now);
  sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7));
  sat.setHours(10, 0, 0, 0);
  const [circle] = await db.insert(s.circles).values({ societyId: main.id, towerId: towerC.id, templateSlug: "clean-room", title: "Tower C Saturday cleaning", windowStart: sat, windowEnd: new Date(sat.getTime() + 4 * H), cutoffAt: new Date(sat.getTime() - 14 * H), minFlats: 3, maxFlats: 6, currentFlats: 4, basePrice: 49800, status: "confirmed", inviteCode: "TOWERC-SAT", createdBy: neighbours[0].id }).returning();
  await db.insert(s.circleMembers).values([neighbours[0], neighbours[1], neighbours[2], ananya].map((u, i) => ({ circleId: circle.id, userId: u.id, flat: ["C-401", "C-1102", "C-304", "C-902"][i], paymentStatus: i < 3 ? "paid" : "pending" })));

  /* ---- misc: notifications, routines, referrals, announcements, content ---- */
  await db.insert(s.notifications).values([
    { userId: ananya.id, type: "helper_on_the_way_5", title: "helper on the way 5", body: "Isha is heading to your Tower C. About 6 minutes away. The door OTP is shown in the app.", sentAt: new Date(now - 5 * 60000) },
    { userId: ananya.id, type: "plan_ready", title: "plan ready", body: "Your plan is ready. Please take a look.", sentAt: new Date(now - 6 * 60000) },
    { userId: ananya.id, type: "payment_success", title: "payment success", body: "Payment received. You can relax now.", sentAt: new Date(now - 25 * H), readAt: new Date(now - 24 * H) },
    { userId: ananya.id, type: "circle_invite", title: "circle invite", body: "Rishi invited you to the Tower C Saturday cleaning. 4 of 6 flats joined.", sentAt: new Date(now - 2 * H) },
  ]);
  await db.insert(s.routines).values({ customerId: ananya.id, templateSlug: "utensils", title: "Utensils, weekdays", frequency: "weekly", windowText: "Mon-Fri 8pm", preferredHelperId: meera(hRows), autoPay: false, nextRunAt: new Date(now + 20 * H) });
  await db.insert(s.referrals).values([{ referrerId: ananya.id, referredId: neighbours[0].id, status: "joined", rewardPaid: true }, { referrerId: ananya.id, status: "invited" }]);
  await db.insert(s.contactMessages).values([{ kind: "society", name: "Mr Sharma (RWA President)", phone: "+919811100022", email: "rwa@palmcourt.example", message: "Palm Court, 420 flats. Interested in onboarding.", data: { flats: 420, society: "Palm Court" } }, { kind: "contact", name: "Gauri", email: "gauri@example.com", message: "Do you plan to come to Noida?" }]);
  await db.insert(s.opsNotes).values({ entity: "customer", entityId: ananya.id, authorId: ops.id, body: "Prefers Hindi chat. Dog barks at strangers, tell helpers." });

  /* ---- waitlist (demo rows, flagged) ---- */
  const socs = [main, ...otherSocs];
  const weights = [62, 40, 28, 15];
  const first = ["Aarav", "Diya", "Kabir", "Ira", "Vihaan", "Anika", "Reyansh", "Myra", "Arjun", "Saanvi", "Ishaan", "Navya", "Aditya", "Kiara", "Vivaan", "Tara"];
  const last = ["Sharma", "Verma", "Gupta", "Singh", "Mehta", "Kapoor", "Joshi", "Nair", "Rao", "Das"];
  const wl: (typeof s.waitlist.$inferInsert)[] = [];
  let pos = 1;
  socs.forEach((soc, si) => {
    for (let i = 0; i < weights[si]; i++) {
      const lat = soc.centroidLat + (rand() - 0.5) * 0.012, lng = soc.centroidLng + (rand() - 0.5) * 0.012;
      wl.push({ name: `${first[Math.floor(rand() * first.length)]} ${last[Math.floor(rand() * last.length)]}`, phone: `+9170000${String(pos).padStart(5, "0")}`, role: rand() > 0.75 ? "earn" : rand() > 0.92 ? "both" : "help", societyText: soc.name, societyId: soc.id, referralCode: "W" + pos.toString(36).toUpperCase().padStart(4, "0") + "Q", position: pos, consentAt: new Date(now - rand() * 20 * 86400000), verifiedAt: new Date(now - rand() * 20 * 86400000), hex8: latLngToHex(lat, lng, 8), hex9: latLngToHex(lat, lng, 9), demo: true });
      pos++;
    }
  });
  await db.insert(s.waitlist).values(wl);
  await db.insert(s.announcements).values({ text: `Now onboarding Tower A to F at Green Meadows. ${weights[0]} neighbours waiting.`, textHi: `ग्रीन मेडोज़ में टावर A से F शुरू हो रहे हैं। ${weights[0]} पड़ोसी इंतज़ार में।`, scope: "site" });
  await db.insert(s.announcements).values({ text: "Saturday cleaning Circle for Tower C is confirmed. Gate 2 will be used for service entry.", scope: "society", societyId: main.id });

  /* ---- analytics events (first-party, consented visitors only) ---- */
  const evNames: [string, number][] = [["page_view", 380], ["cta_click", 90], ["scroll_depth", 120], ["form_start", 48], ["composer_demo_typed", 61], ["estimator_used", 37], ["whatsapp_click", 22], ["language_switch", 14]];
  const aev: (typeof s.analyticsEvents.$inferInsert)[] = [];
  for (const [event, n] of evNames) for (let i = 0; i < n; i++) aev.push({ event, props: {}, path: "/", ts: new Date(now - rand() * 14 * 86400000) });
  for (let i = 0; i < aev.length; i += 400) await db.insert(s.analyticsEvents).values(aev.slice(i, i + 400));

  await db.insert(s.auditLogs).values({ actorId: admin.id, action: "seed", entity: "system", entityId: "boot", after: { note: "Demo data created" } });
  await logEvent(null, null, "seeded", {});
  // sanity: door OTP hashes exist for all tasks
  const noOtp = await db.select({ id: s.tasks.id }).from(s.tasks);
  for (const t of noOtp) await db.update(s.tasks).set({ doorOtpHash: doorOtpHash(t.id) }).where(eq(s.tasks.id, t.id));
}

function meera(rows: { id: string; displayName: string }[]) {
  return rows.find((r) => r.displayName === "Meera Nair")?.id ?? null;
}

if (process.argv[1]?.endsWith("seed.ts")) {
  runSeed().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
}
