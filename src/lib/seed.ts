import { db, pool } from "@/db";
import * as S from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { CATALOG, PACKS, SOCIETY } from "./catalog";
import { DEFAULT_PRICING } from "./pricing";
import { hexId } from "./geo";
import { writePlan } from "./plans";
import { createOrder, capturePayment, settleTask } from "./tasks";
import { setSetting, DEFAULT_FLAGS } from "./settings";

function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

let running: Promise<void> | null = null;
export function ensureSeed() {
  if (!running) running = seedIfEmpty().finally(() => { running = null; });
  return running;
}

async function seedIfEmpty() {
  const [{ n }] = await db.select({ n: count() }).from(S.societies);
  if (n > 0) return;
  // advisory lock so parallel starts do not double-seed
  const client = await pool.connect();
  try {
    const got = await client.query("select pg_try_advisory_lock(424242) as ok");
    if (!got.rows[0].ok) return;
    const [{ n: n2 }] = await db.select({ n: count() }).from(S.societies);
    if (n2 > 0) return;
    await seed();
  } finally {
    await client.query("select pg_advisory_unlock(424242)").catch(() => {});
    client.release();
  }
}

export async function seed() {
  const rand = rng(7);
  // ---- society ----
  const [soc] = await db.insert(S.societies).values({
    name: SOCIETY.name, slug: SOCIETY.slug, city: SOCIETY.city, area: SOCIETY.area, status: "pilot", centroidLat: SOCIETY.lat, centroidLng: SOCIETY.lng,
    boundary: [[28.5756, 77.0396], [28.5790, 77.0396], [28.5790, 77.0438], [28.5756, 77.0438]], gates: SOCIETY.gates,
    rules: "Helpers register at the guard desk and show a Shell gate pass QR. No entry after 10 pm unless pre-approved.",
    perks: ["Priority booking for residents", "5% of Shell revenue from the society goes to the RWA fund", "Verified helpers only at the gate"], flats: 420, unlockTarget: 150, goLiveAt: new Date(),
  }).returning();
  const towerRows = await db.insert(S.towers).values(SOCIETY.towers.map((t) => ({ societyId: soc.id, name: t.name, floors: t.floors, lat: t.lat, lng: t.lng, directions: t.directions, liftNotes: t.floors > 14 ? "Two lifts, lift lobby 2 is closer to the stairs" : "Single lift bank" }))).returning();
  const waitSocs = await db.insert(S.societies).values([
    { name: "Greenfield Heights", slug: "greenfield-heights", city: "Delhi", area: "Dwarka Sector 12", status: "waitlist", centroidLat: 28.5921, centroidLng: 77.0467, unlockTarget: 150, flats: 300 },
    { name: "Sunrise Apartments", slug: "sunrise-apartments", city: "Delhi", area: "Dwarka Sector 6", status: "waitlist", centroidLat: 28.5995, centroidLng: 77.0602, unlockTarget: 150, flats: 260 },
  ]).returning();

  // ---- catalog / packs / config ----
  await db.insert(S.categories).values(CATALOG.map((c, i) => ({
    slug: c.slug, name: c.name, kind: c.kind, icon: c.icon, description: c.intro, baseRate: c.rate * 100, unit: c.unit, minutesPerUnit: c.mins, defaultQty: c.qty,
    keywords: c.keywords, included: c.included, excluded: c.excluded, checklist: c.checklist, displayOrder: i,
  })));
  await db.insert(S.packs).values(PACKS.map((p, i) => ({ ...p, displayOrder: i })));
  await db.insert(S.pricingConfigs).values({ version: 1, data: DEFAULT_PRICING, reason: "Initial launch pricing" });
  await setSetting("flags", DEFAULT_FLAGS);
  await db.insert(S.announcements).values({ text: "Now onboarding Parkview Residency, Towers A to F. Neighbours nearby can join the waitlist." });

  // ---- staff ----
  const [ops] = await db.insert(S.users).values([
    { phone: "+919810000900", name: "Meera Kapoor", role: "OPS" },
    { phone: "+919810000901", name: "Admin", role: "SUPER_ADMIN" },
  ]).returning();
  await db.insert(S.users).values({ phone: "+919810000800", name: "Suresh Bansal (RWA)", role: "SOCIETY_PARTNER", societyId: soc.id });

  // ---- customers ----
  const custSeed = [
    { name: "Anika Sharma", phone: "+919810000001", tower: 2, floor: 9, flat: "C-904" },
    { name: "Rohan Bhatia", phone: "+919810000002", tower: 2, floor: 4, flat: "C-402" },
    { name: "Divya Menon", phone: "+919810000003", tower: 2, floor: 12, flat: "C-1201" },
    { name: "Vikram Seth", phone: "+919810000004", tower: 2, floor: 7, flat: "C-703" },
    { name: "Tanvi Arora", phone: "+919810000005", tower: 0, floor: 3, flat: "A-302" },
  ];
  const custUsers = await db.insert(S.users).values(custSeed.map((c) => ({ phone: c.phone, name: c.name, role: "CUSTOMER" as const, societyId: soc.id, consentWhatsapp: true, consentLocation: true }))).returning();
  const addrs = [];
  for (let i = 0; i < custUsers.length; i++) {
    const tw = towerRows[custSeed[i].tower];
    const [a] = await db.insert(S.addresses).values({ userId: custUsers[i].id, societyId: soc.id, towerId: tw.id, floor: custSeed[i].floor, flat: custSeed[i].flat, landmark: "Near the garden", lat: tw.lat, lng: tw.lng, entryNotes: "Call the guard desk if the bell is not answered.", verifiedAt: new Date(), verificationMethod: "flat_match" }).returning();
    addrs.push(a);
    await db.insert(S.customerProfiles).values({ userId: custUsers[i].id, referralCode: custSeed[i].name.split(" ")[0].toUpperCase().slice(0, 5) + "10", creditsBalance: i === 0 ? 20000 : 0, walletBalance: 0, atlas: i === 0 ? { household: 3, kids: false, pets: "Labrador, friendly", keyHandling: "home", rooms: ["Living room", "Kitchen", "Bedroom", "Balcony", "Wardrobe"], doNotTouch: "Study desk, bedroom 2 locker" } : {} });
  }

  // ---- helpers ----
  const H = [
    ["Rahul Verma", "Delhi University", "male", "PRO", 4.8, 64, ["house-cleaning", "utensils", "groceries", "errands", "parcel-pickup", "decoration", "moving-help"], 1, 4, ["English", "Hindi"], true],
    ["Priya Singh", "Jamia Millia Islamia", "female", "TRUSTED", 4.9, 31, ["wardrobe-organising", "house-cleaning", "decoration", "event-help"], 3, 1, ["English", "Hindi"], true],
    ["Aman Khanna", "IP University", "male", "STARTER", 4.5, 7, ["groceries", "errands", "queueing", "parcel-pickup", "sports-partner", "gaming-partner"], 4, 2, ["Hindi", "English"], false],
    ["Sneha Rao", "Delhi University", "female", "PRO", 4.9, 52, ["excel-data-help", "tutoring-explaining", "wardrobe-organising"], 0, 3, ["English", "Hindi", "Telugu"], false],
    ["Karan Mehta", "NSUT Dwarka", "male", "TRUSTED", 4.7, 22, ["moving-help", "small-repairs", "event-help", "house-cleaning"], 2, 0, ["Hindi", "English", "Punjabi"], true],
    ["Isha Gupta", "Delhi University", "female", "TRUSTED", 4.8, 27, ["house-cleaning", "utensils", "wardrobe-organising", "pet-walking"], 5, 2, ["English", "Hindi"], true],
    ["Dev Malhotra", "Amity University", "male", "STARTER", 4.6, 9, ["pet-walking", "sports-partner", "gaming-partner", "errands"], 1, 3, ["Hindi", "English"], false],
    ["Neha Joshi", "Lady Shri Ram College", "female", "ELITE", 4.95, 130, ["event-help", "decoration", "house-cleaning", "wardrobe-organising"], 2, 4, ["English", "Hindi", "Marathi"], true],
    ["Arjun Nair", "IIIT Delhi", "male", "STARTER", 0, 0, ["tutoring-explaining", "excel-data-help"], 4, 1, ["English", "Malayalam", "Hindi"], false],
    ["Simran Kaur", "Delhi University", "female", "TRUSTED", 4.7, 18, ["groceries", "errands", "parcel-pickup", "queueing", "utensils"], 3, 5, ["Hindi", "English", "Punjabi"], true],
  ] as const;
  const helperUsers = await db.insert(S.users).values(H.map((h, i) => ({ phone: `+91981000${String(100 + i + 1).padStart(4, "0")}`, name: h[0], role: "HELPER" as const, consentLocation: true }))).returning();
  const avail = { Mon: ["morning", "evening"], Tue: ["evening"], Wed: ["morning", "evening"], Thu: ["evening"], Fri: ["morning", "evening"], Sat: ["morning", "afternoon", "evening"], Sun: ["morning", "afternoon"] };
  await db.insert(S.helperProfiles).values(H.map((h, i) => {
    const tw = towerRows[h[8]];
    return {
      userId: helperUsers[i].id, dob: `${2000 + (i % 4)}-0${(i % 9) + 1}-1${i % 9}`, college: h[1], gender: h[2], languages: [...h[9]], categories: [...h[6]],
      level: h[3], kycStatus: "verified", kycReference: `kyc_ref_${i + 1}`, collegeIdStatus: "verified", livenessStatus: "verified", trainingStatus: "passed",
      trainingDone: ["safety", ...h[6].slice(0, 2)], safetyTrainingPassedAt: new Date(), shadowJobDone: h[3] !== "STARTER", availability: avail, radiusM: 3000,
      payoutAccountRef: "upi_verified", ratingAvg: h[4], ratingCount: h[5], jobsDone: h[5], onTimeRate: 0.9 + rand() * 0.09, repeatRate: 0.2 + rand() * 0.4,
      status: "active", online: i % 3 !== 2, rushOptIn: h[10], bio: `${h[0].split(" ")[0]} studies at ${h[1]} and lives near Parkview Residency. Known for arriving on time and leaving things tidy.`,
      passportSlug: h[0].split(" ")[0].toLowerCase() + (100 + i), lat: tw.lat + (rand() - 0.5) * 0.0008, lng: tw.lng + (rand() - 0.5) * 0.0008,
      applicationStep: 7,
    };
  }));
  // one applicant in the review queue
  const [appUser] = await db.insert(S.users).values({ phone: "+919810000199", name: "Kavya Iyer", role: "HELPER" }).returning();
  await db.insert(S.helperProfiles).values({ userId: appUser.id, dob: "2004-03-12", college: "Hansraj College", gender: "female", languages: ["English", "Hindi"], categories: ["tutoring-explaining", "excel-data-help"], status: "review", kycStatus: "verified", kycReference: "kyc_ref_new", collegeIdStatus: "pending", livenessStatus: "verified", applicationStep: 7, passportSlug: "kavya199" });

  // ---- waitlist (demo rows, flagged is_demo) ----
  const demoSpots: { soc: typeof soc | null; txt: string; lat: number; lng: number; n: number }[] = [
    { soc: waitSocs[0], txt: "Greenfield Heights", lat: 28.5921, lng: 77.0467, n: 34 },
    { soc: waitSocs[1], txt: "Sunrise Apartments", lat: 28.5995, lng: 77.0602, n: 21 },
    { soc: soc, txt: "Parkview Residency", lat: SOCIETY.lat, lng: SOCIETY.lng, n: 18 },
  ];
  let pos = 0; const wl: (typeof S.waitlist.$inferInsert)[] = [];
  const first = ["Aarav", "Meera", "Kabir", "Sana", "Ishaan", "Pooja", "Nikhil", "Ritu", "Yash", "Anjali", "Harsh", "Kriti", "Mohit", "Sakshi", "Varun"];
  for (const s of demoSpots) for (let i = 0; i < s.n; i++) {
    pos++;
    const lat = s.lat + (rand() - 0.5) * 0.007, lng = s.lng + (rand() - 0.5) * 0.009;
    wl.push({ name: first[(pos + i) % first.length], phone: `+9170000${String(10000 + pos)}`, role: rand() > 0.82 ? "earn" : "help", societyText: s.txt, societyId: s.soc?.id, referralCode: "W" + (1000 + pos), position: pos, consentAt: new Date(), verifiedAt: new Date(), hex: hexId(lat, lng, 8), isDemo: true });
  }
  await db.insert(S.waitlist).values(wl);

  // ---- circle ----
  const sat = new Date(); sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7)); sat.setHours(10, 0, 0, 0);
  const cleaning = (await db.select().from(S.categories).where(eq(S.categories.slug, "house-cleaning")))[0];
  const [circle] = await db.insert(S.circles).values({ societyId: soc.id, towerId: towerRows[2].id, categoryId: cleaning.id, title: "Tower C Saturday cleaning", windowStart: sat, windowEnd: new Date(sat.getTime() + 3 * 3600000), cutoffAt: new Date(sat.getTime() - 18 * 3600000), minFlats: 3, maxFlats: 6, currentFlats: 4, status: "filling", createdBy: custUsers[1].id }).returning();
  await db.insert(S.circleMembers).values([1, 2, 3].map((i) => ({ circleId: circle.id, userId: custUsers[i].id, flat: custSeed[i].flat, paymentStatus: "paid" })).concat([{ circleId: circle.id, userId: custUsers[4].id, flat: "A-302", paymentStatus: "paid" }]));

  // ---- completed demo jobs through the real flow so ledger and stats are real ----
  const hist = [
    { c: 0, lines: [{ slug: "house-cleaning", quantity: 4 }, { slug: "utensils", quantity: 1 }], h: 0, ago: 9, rating: 5, note: "Rahul was on time and thorough. The kitchen looks new." },
    { c: 0, lines: [{ slug: "wardrobe-organising", quantity: 1 }], h: 1, ago: 20, rating: 5, note: "Priya organised everything by season. Loved it." },
    { c: 1, lines: [{ slug: "groceries", quantity: 1, cap: 200000 }], h: 9, ago: 5, rating: 4, note: "" },
    { c: 2, lines: [{ slug: "decoration", quantity: 3 }, { slug: "event-help", quantity: 4 }, { slug: "utensils", quantity: 2 }], h: 7, ago: 12, rating: 5, note: "Neha made the party stress free." },
  ];
  for (const j of hist) {
    const [rq] = await db.insert(S.requests).values({ customerId: custUsers[j.c].id, addressId: addrs[j.c].id, rawText: "Demo job history", status: "approved" }).returning();
    const planId = await writePlan({ requestId: rq.id, customerId: custUsers[j.c].id, lines: j.lines.map((l) => ({ ...l, size: "medium", confidence: 1, cap: (l as { cap?: number }).cap })), urgency: "normal", deadline: null });
    const pay = await createOrder({ planId, userId: custUsers[j.c].id, method: "upi", useCredits: false, useWallet: false, idempotencyKey: "seed-" + planId });
    await capturePayment(pay.id);
    const ts = await db.select().from(S.tasks).where(eq(S.tasks.planId, planId));
    for (const t of ts) {
      const when = new Date(Date.now() - j.ago * 864e5);
      await db.delete(S.offers).where(eq(S.offers.taskId, t.id));
      await db.update(S.tasks).set({
        helperId: helperUsers[j.h].id, status: "awaiting_approval", checkInAt: when, checkOutAt: when, scheduledStart: when, scheduledEnd: new Date(when.getTime() + t.durationEstMin * 60000),
        checklist: t.checklist.map((c) => ({ ...c, done: true })),
        expense: t.expensesCap ? { spent: 172000, items: [{ name: "Vegetables and fruit", amount: 61000 }, { name: "Dairy and staples", amount: 111000 }], status: "approved", approved: 172000, refunded: 0 } : null,
      }).where(eq(S.tasks.id, t.id));
      await settleTask(t.id, null, true);
      await db.insert(S.taskEvents).values([{ taskId: t.id, type: "accepted", note: "Helper accepted" }, { taskId: t.id, type: "approved", note: "Approved" }]);
      await db.insert(S.reviews).values({ taskId: t.id, fromUserId: custUsers[j.c].id, toUserId: helperUsers[j.h].id, rating: j.rating, tags: ["On time", "Careful"], note: j.note });
      if (j.note) await db.insert(S.shellNotes).values({ taskId: t.id, fromUserId: custUsers[j.c].id, toUserId: helperUsers[j.h].id, body: j.note });
    }
  }
  // ---- ops samples: a dispute, a strike, a leakage flag ----
  const [anyTask] = await db.select().from(S.tasks).where(eq(S.tasks.customerId, custUsers[1].id));
  if (anyTask) {
    await db.insert(S.disputes).values({ taskId: anyTask.id, openedBy: custUsers[1].id, reason: "Quality", description: "The vegetables were not as fresh as I expected.", slaDueAt: new Date(Date.now() + 20 * 3600000) });
    await db.insert(S.messages).values({ threadKey: `task:${anyTask.id}`, senderId: helperUsers[9].id, body: "Call me on •••••••• for next time", leakFlags: ["phone"], blurred: true });
  }
  await db.insert(S.strikes).values({ helperId: helperUsers[2].id, reason: "Arrived 25 minutes late without notice", severity: 1, issuedBy: ops.id, expiresAt: new Date(Date.now() + 60 * 864e5) });
}
