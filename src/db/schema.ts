import { sql } from "drizzle-orm";
import { bigserial, boolean, check, doublePrecision, index, integer, jsonb, pgTable, real, text, timestamp, uniqueIndex, uuid, date } from "drizzle-orm/pg-core";

const pk = () => uuid("id").primaryKey().defaultRandom();
const tz = (n: string) => timestamp(n, { withTimezone: true });
const createdAt = () => tz("created_at").notNull().defaultNow();
const updatedAt = () => tz("updated_at").notNull().defaultNow();

/* ---------- identity ---------- */
export const users = pgTable(
  "users",
  {
    id: pk(),
    phone: text("phone").notNull(),
    email: text("email"),
    name: text("name").notNull().default(""),
    role: text("role").notNull().default("CUSTOMER"), // CUSTOMER | HELPER | OPS | SOCIETY_PARTNER | SUPER_ADMIN
    opsRole: text("ops_role"), // ops_agent | ops_lead | finance | safety | content | society_manager
    language: text("language").notNull().default("en"),
    status: text("status").notNull().default("active"), // active | suspended | deleted
    consentWhatsapp: tz("consent_whatsapp"),
    consentLocation: tz("consent_location"),
    consentMarketing: tz("consent_marketing"),
    lastLoginAt: tz("last_login_at"),
    deletionRequestedAt: tz("deletion_requested_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_phone_uq").on(t.phone), index("users_role_idx").on(t.role)],
);

export const sessions = pgTable(
  "sessions",
  {
    token: text("token").primaryKey(),
    userId: uuid("user_id").notNull(),
    expiresAt: tz("expires_at").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: pk(),
    phone: text("phone").notNull(),
    codeHash: text("code_hash").notNull(),
    purpose: text("purpose").notNull().default("login"),
    expiresAt: tz("expires_at").notNull(),
    attempts: integer("attempts").notNull().default(0),
    lockedUntil: tz("locked_until"),
    consumedAt: tz("consumed_at"),
    createdAt: createdAt(),
  },
  (t) => [index("otp_phone_idx").on(t.phone)],
);

/* ---------- places ---------- */
export const societies = pgTable(
  "societies",
  {
    id: pk(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    city: text("city").notNull().default("Delhi"),
    status: text("status").notNull().default("waitlist"), // waitlist | pilot | live
    centroidLat: doublePrecision("centroid_lat").notNull(),
    centroidLng: doublePrecision("centroid_lng").notNull(),
    boundary: jsonb("boundary").$type<[number, number][]>().notNull().default([]),
    gates: jsonb("gates").$type<{ name: string; lat: number; lng: number; hours: string; rules: string; guard: string }[]>().notNull().default([]),
    rules: text("rules").default(""),
    perks: jsonb("perks").$type<string[]>().notNull().default([]),
    waitlistTarget: integer("waitlist_target").notNull().default(500),
    revenueSharePct: integer("revenue_share_pct").notNull().default(2),
    goLiveAt: tz("go_live_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("societies_slug_uq").on(t.slug), index("societies_status_idx").on(t.status)],
);

export const towers = pgTable(
  "towers",
  {
    id: pk(),
    societyId: uuid("society_id").notNull(),
    name: text("name").notNull(),
    floors: integer("floors").notNull().default(12),
    liftNotes: text("lift_notes").default(""),
    entrancePhotoUrl: text("entrance_photo_url"),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("towers_society_idx").on(t.societyId)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: pk(),
    userId: uuid("user_id").notNull(),
    societyId: uuid("society_id").notNull(),
    towerId: uuid("tower_id"),
    floor: integer("floor").notNull().default(1),
    flat: text("flat").notNull(),
    landmark: text("landmark").default(""),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    entryNotes: text("entry_notes").default(""),
    hex8: text("hex8"),
    hex9: text("hex9"),
    verifiedAt: tz("verified_at"),
    verificationMethod: text("verification_method"),
    createdAt: createdAt(),
  },
  (t) => [index("addr_user_idx").on(t.userId), index("addr_society_idx").on(t.societyId), index("addr_hex8_idx").on(t.hex8)],
);

export const vendors = pgTable("vendors", {
  id: pk(),
  societyId: uuid("society_id"),
  name: text("name").notNull(),
  categorySlug: text("category_slug").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  hours: text("hours").default("9am-9pm"),
  typicalWaitMin: integer("typical_wait_min").default(5),
});

export const customerProfiles = pgTable("customer_profiles", {
  userId: uuid("user_id").primaryKey(),
  societyId: uuid("society_id"),
  homeAtlas: jsonb("home_atlas")
    .$type<{
      household?: number;
      kids?: boolean;
      pets?: { type: string; temperament: string }[];
      allergies?: string;
      keyHandling?: "home" | "guard" | "lockbox";
      doNotTouch?: { text: string; room?: string }[];
      helperGender?: "any" | "female";
      helperLanguage?: string;
      rooms?: string[];
    }>()
    .notNull()
    .default({}),
  helperGenderPreference: text("helper_gender_preference").notNull().default("any"),
  quietStart: integer("quiet_start").notNull().default(22),
  quietEnd: integer("quiet_end").notNull().default(7),
  referralCode: text("referral_code"),
  referredBy: text("referred_by"),
  walletBalance: integer("wallet_balance").notNull().default(0),
  creditsBalance: integer("credits_balance").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  kudos: integer("kudos").notNull().default(0),
  holidayMode: boolean("holiday_mode").notNull().default(false),
  updatedAt: updatedAt(),
});

export const trustedContacts = pgTable("trusted_contacts", {
  id: pk(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  createdAt: createdAt(),
});

/* ---------- catalog ---------- */
export const taskCategories = pgTable(
  "task_categories",
  {
    id: pk(),
    slug: text("slug").notNull(),
    nameEn: text("name_en").notNull(),
    nameHi: text("name_hi").notNull(),
    introEn: text("intro_en").notNull(),
    introHi: text("intro_hi").notNull(),
    icon: text("icon").notNull().default("box"),
    included: jsonb("included").$type<string[]>().notNull().default([]),
    notIncluded: jsonb("not_included").$type<string[]>().notNull().default([]),
    steps: jsonb("steps").$type<string[]>().notNull().default([]),
    faqs: jsonb("faqs").$type<{ q: string; a: string }[]>().notNull().default([]),
    helperReq: text("helper_req").default(""),
    typicalMinutes: integer("typical_minutes").notNull().default(60),
    priceMin: integer("price_min").notNull().default(0),
    priceMax: integer("price_max").notNull().default(0),
    banned: boolean("banned").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [uniqueIndex("cat_slug_uq").on(t.slug)],
);

export const taskTemplates = pgTable(
  "task_templates",
  {
    id: pk(),
    slug: text("slug").notNull(),
    categorySlug: text("category_slug").notNull(),
    nameEn: text("name_en").notNull(),
    nameHi: text("name_hi").notNull(),
    baseRate: integer("base_rate").notNull(), // paise per unit
    unit: text("unit").notNull().default("job"),
    minutesPerUnit: integer("minutes_per_unit").notNull().default(60),
    sizeFactors: jsonb("size_factors").$type<{ small: number; medium: number; large: number }>().notNull().default({ small: 0.8, medium: 1, large: 1.4 }),
    requiredSkills: jsonb("required_skills").$type<string[]>().notNull().default([]),
    checklist: jsonb("checklist").$type<string[]>().notNull().default([]),
    managedOnly: boolean("managed_only").notNull().default(false),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [uniqueIndex("tpl_slug_uq").on(t.slug), index("tpl_cat_idx").on(t.categorySlug)],
);

export const packs = pgTable(
  "packs",
  {
    id: pk(),
    slug: text("slug").notNull(),
    nameEn: text("name_en").notNull(),
    nameHi: text("name_hi").notNull(),
    copyEn: text("copy_en").notNull(),
    copyHi: text("copy_hi").notNull(),
    icon: text("icon").notNull().default("gift"),
    items: jsonb("items").$type<{ template: string; qty: number; size?: string; offsetHours: number; label: string }[]>().notNull().default([]),
    helperTypes: jsonb("helper_types").$type<string[]>().notNull().default([]),
    faqs: jsonb("faqs").$type<{ q: string; a: string }[]>().notNull().default([]),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [uniqueIndex("pack_slug_uq").on(t.slug)],
);

/* ---------- helpers ---------- */
export const helpers = pgTable(
  "helpers",
  {
    id: pk(),
    userId: uuid("user_id").notNull(),
    displayName: text("display_name").notNull(),
    isFemale: boolean("is_female").notNull().default(false),
    dob: date("dob"),
    college: text("college"),
    occupation: text("occupation"),
    languages: jsonb("languages").$type<string[]>().notNull().default([]),
    categories: jsonb("categories").$type<{ slug: string; level: number }[]>().notNull().default([]),
    goodAt: jsonb("good_at").$type<string[]>().notNull().default([]),
    level: text("level").notNull().default("STARTER"),
    status: text("status").notNull().default("applied"), // applied|review|training|shadow|active|paused|suspended|banned
    kycStatus: text("kyc_status").notNull().default("pending"),
    kycReference: text("kyc_reference"),
    collegeIdStatus: text("college_id_status").notNull().default("pending"),
    livenessStatus: text("liveness_status").notNull().default("pending"),
    trainingStatus: text("training_status").notNull().default("pending"),
    safetyTrainingPassedAt: tz("safety_training_passed_at"),
    shadowJobDone: boolean("shadow_job_done").notNull().default(false),
    availabilityGrid: jsonb("availability_grid").$type<Record<string, number[]>>().notNull().default({}),
    radiusM: integer("radius_m").notNull().default(1500),
    payoutAccountRef: text("payout_account_ref"),
    ratingAvg: real("rating_avg").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    jobsDone: integer("jobs_done").notNull().default(0),
    onTimeRate: real("on_time_rate").notNull().default(1),
    repeatRate: real("repeat_rate").notNull().default(0),
    acceptanceRate: real("acceptance_rate").notNull().default(1),
    strikes: integer("strikes").notNull().default(0),
    voiceIntroText: text("voice_intro_text").default(""),
    voiceIntroUrl: text("voice_intro_url"),
    passportSlug: text("passport_slug"),
    passportVisibility: jsonb("passport_visibility").$type<{ rating: boolean; jobs: boolean; college: boolean; languages: boolean }>().notNull().default({ rating: true, jobs: true, college: true, languages: true }),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    online: boolean("online").notNull().default(false),
    vacation: boolean("vacation").notNull().default(false),
    dailyCap: integer("daily_cap").notNull().default(4),
    managedEligible: boolean("managed_eligible").notNull().default(false),
    femaleOnlyEligible: boolean("female_only_eligible").notNull().default(false),
    rushOptIn: boolean("rush_opt_in").notNull().default(false),
    circleOptIn: boolean("circle_opt_in").notNull().default(true),
    applicationStep: integer("application_step").notNull().default(0),
    applicationData: jsonb("application_data").$type<Record<string, unknown>>().notNull().default({}),
    payoutHold: boolean("payout_hold").notNull().default(false),
    societyId: uuid("society_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("helpers_user_uq").on(t.userId),
    uniqueIndex("helpers_passport_uq").on(t.passportSlug),
    index("helpers_status_idx").on(t.status),
    check("helper_age_18", sql`${t.dob} IS NULL OR ${t.dob} <= (CURRENT_DATE - INTERVAL '18 years')`),
  ],
);

export const trainingModules = pgTable("training_modules", {
  id: pk(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull().default("general"),
  mandatory: boolean("mandatory").notNull().default(false),
  cards: jsonb("cards").$type<{ title: string; body: string }[]>().notNull().default([]),
  quiz: jsonb("quiz").$type<{ q: string; options: string[]; answer: number }[]>().notNull().default([]),
  badge: text("badge"),
  displayOrder: integer("display_order").notNull().default(0),
});

export const helperTraining = pgTable(
  "helper_training",
  {
    id: pk(),
    helperId: uuid("helper_id").notNull(),
    moduleSlug: text("module_slug").notNull(),
    score: integer("score").notNull().default(0),
    passedAt: tz("passed_at"),
    createdAt: createdAt(),
  },
  (t) => [index("ht_helper_idx").on(t.helperId)],
);

export const strikes = pgTable(
  "strikes",
  {
    id: pk(),
    helperId: uuid("helper_id").notNull(),
    reason: text("reason").notNull(),
    evidence: text("evidence").default(""),
    severity: integer("severity").notNull().default(1),
    issuedBy: uuid("issued_by"),
    expiresAt: tz("expires_at"),
    appealStatus: text("appeal_status").notNull().default("none"), // none | open | upheld | overturned
    appealNote: text("appeal_note"),
    createdAt: createdAt(),
  },
  (t) => [index("strikes_helper_idx").on(t.helperId)],
);

/* ---------- requests, plans, tasks ---------- */
export const requests = pgTable(
  "requests",
  {
    id: pk(),
    customerId: uuid("customer_id").notNull(),
    addressId: uuid("address_id"),
    rawText: text("raw_text").notNull(),
    language: text("language").notNull().default("en"),
    voiceUrl: text("voice_url"),
    transcript: text("transcript"),
    photos: jsonb("photos").$type<{ url: string; caption?: string; circles?: { x: number; y: number; label: string }[] }[]>().notNull().default([]),
    deadlineAt: tz("deadline_at"),
    urgency: text("urgency").notNull().default("normal"),
    status: text("status").notNull().default("new"),
    draft: jsonb("draft").$type<{ tasks: { template: string; qty: number; size: string; confidence: number; note?: string }[]; overallConfidence: number; needsHuman: boolean; banned: string[] }>(),
    questions: jsonb("questions").$type<{ id: string; q: string; qHi: string; chips: string[]; answer?: string }[]>().notNull().default([]),
    assignedOpsId: uuid("assigned_ops_id"),
    slaDueAt: tz("sla_due_at"),
    hex8: text("hex8"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("req_customer_idx").on(t.customerId), index("req_status_idx").on(t.status)],
);

export const plans = pgTable(
  "plans",
  {
    id: pk(),
    requestId: uuid("request_id"),
    customerId: uuid("customer_id").notNull(),
    addressId: uuid("address_id"),
    version: integer("version").notNull().default(1),
    title: text("title").notNull(),
    status: text("status").notNull().default("draft"), // draft|sent|approved|rejected|superseded
    managed: boolean("managed").notNull().default(false),
    urgency: text("urgency").notNull().default("normal"),
    subtotal: integer("subtotal").notNull().default(0),
    urgencyMultiplier: real("urgency_multiplier").notNull().default(1),
    circleDiscount: real("circle_discount").notNull().default(0),
    travelAmount: integer("travel_amount").notNull().default(0),
    platformFee: integer("platform_fee").notNull().default(0),
    coordinationFee: integer("coordination_fee").notNull().default(0),
    total: integer("total").notNull().default(0),
    guaranteeIncluded: boolean("guarantee_included").notNull().default(true),
    pricingConfigVersion: integer("pricing_config_version").notNull().default(1),
    deadlineAt: tz("deadline_at"),
    circleId: uuid("circle_id"),
    shareToken: text("share_token"),
    opsNote: text("ops_note"),
    sentAt: tz("sent_at"),
    approvedAt: tz("approved_at"),
    paidAt: tz("paid_at"),
    expiresAt: tz("expires_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("plans_customer_idx").on(t.customerId), index("plans_status_idx").on(t.status), index("plans_share_idx").on(t.shareToken)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: pk(),
    planId: uuid("plan_id").notNull(),
    templateSlug: text("template_slug").notNull(),
    name: text("name").notNull(),
    quantity: integer("quantity").notNull().default(1),
    size: text("size").notNull().default("medium"),
    durationEstMin: integer("duration_est_min").notNull().default(60),
    price: integer("price").notNull().default(0),
    helperPayout: integer("helper_payout").notNull().default(0),
    scheduledStart: tz("scheduled_start"),
    scheduledEnd: tz("scheduled_end"),
    assignedHelperId: uuid("assigned_helper_id"),
    status: text("status").notNull().default("planned"),
    checklist: jsonb("checklist").$type<{ label: string; done: boolean; ts?: string }[]>().notNull().default([]),
    doorOtpHash: text("door_otp_hash"),
    otpFailures: integer("otp_failures").notNull().default(0),
    expensesCap: integer("expenses_cap").notNull().default(0),
    checkinAt: tz("checkin_at"),
    checkoutAt: tz("checkout_at"),
    approvedAt: tz("approved_at"),
    reworkCount: integer("rework_count").notNull().default(0),
    reworkUntil: tz("rework_until"),
    cancelReason: text("cancel_reason"),
    sequence: integer("sequence").notNull().default(0),
    isRush: boolean("is_rush").notNull().default(false),
    circleId: uuid("circle_id"),
    delayedReason: text("delayed_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("tasks_plan_idx").on(t.planId),
    index("tasks_helper_idx").on(t.assignedHelperId),
    index("tasks_status_idx").on(t.status),
    check("task_checkin_before_progress", sql`${t.status} <> 'in_progress' OR ${t.checkinAt} IS NOT NULL`),
  ],
);

export const taskEvents = pgTable(
  "task_events",
  {
    id: pk(),
    taskId: uuid("task_id"),
    planId: uuid("plan_id"),
    kind: text("kind").notNull(),
    detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
    actorId: uuid("actor_id"),
    ts: tz("ts").notNull().defaultNow(),
  },
  (t) => [index("te_task_idx").on(t.taskId), index("te_plan_idx").on(t.planId)],
);

export const taskStops = pgTable("task_stops", {
  id: pk(),
  taskId: uuid("task_id").notNull(),
  sequence: integer("sequence").notNull(),
  type: text("type").notNull(), // home | store | pharmacy | laundry | pickup | drop
  placeName: text("place_name").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  windowStart: tz("window_start"),
  windowEnd: tz("window_end"),
  status: text("status").notNull().default("pending"),
});

export const offers = pgTable(
  "offers",
  {
    id: pk(),
    taskId: uuid("task_id").notNull(),
    helperId: uuid("helper_id").notNull(),
    status: text("status").notNull().default("sent"), // sent|accepted|declined|expired
    payout: integer("payout").notNull().default(0),
    sentAt: tz("sent_at").notNull().defaultNow(),
    expiresAt: tz("expires_at"),
    respondedAt: tz("responded_at"),
    reason: text("reason"),
    score: real("score").notNull().default(0),
    breakdown: jsonb("breakdown").$type<Record<string, number>>().notNull().default({}),
  },
  (t) => [index("offers_task_idx").on(t.taskId), index("offers_helper_idx").on(t.helperId)],
);

export const circles = pgTable(
  "circles",
  {
    id: pk(),
    societyId: uuid("society_id").notNull(),
    towerId: uuid("tower_id"),
    templateSlug: text("template_slug").notNull(),
    title: text("title").notNull(),
    windowStart: tz("window_start").notNull(),
    windowEnd: tz("window_end").notNull(),
    cutoffAt: tz("cutoff_at").notNull(),
    minFlats: integer("min_flats").notNull().default(3),
    maxFlats: integer("max_flats").notNull().default(6),
    currentFlats: integer("current_flats").notNull().default(0),
    basePrice: integer("base_price").notNull(),
    status: text("status").notNull().default("open"),
    inviteCode: text("invite_code").notNull(),
    createdBy: uuid("created_by"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("circle_code_uq").on(t.inviteCode), index("circle_society_idx").on(t.societyId)],
);

export const circleMembers = pgTable(
  "circle_members",
  {
    id: pk(),
    circleId: uuid("circle_id").notNull(),
    userId: uuid("user_id").notNull(),
    flat: text("flat"),
    paymentStatus: text("payment_status").notNull().default("pending"),
    joinedAt: tz("joined_at").notNull().defaultNow(),
  },
  (t) => [index("cm_circle_idx").on(t.circleId), uniqueIndex("cm_unique").on(t.circleId, t.userId)],
);

/* ---------- chat, photos, expenses ---------- */
export const messages = pgTable(
  "messages",
  {
    id: pk(),
    threadKey: text("thread_key").notNull(), // plan:<id> | task:<id> | support:<userId>
    senderId: uuid("sender_id"),
    senderRole: text("sender_role").notNull().default("CUSTOMER"),
    type: text("type").notNull().default("text"),
    body: text("body").notNull(),
    translatedBody: text("translated_body"),
    leakFlags: jsonb("leak_flags").$type<string[]>().notNull().default([]),
    blurred: boolean("blurred").notNull().default(false),
    readAt: tz("read_at"),
    createdAt: createdAt(),
  },
  (t) => [index("msg_thread_idx").on(t.threadKey)],
);

export const photos = pgTable(
  "photos",
  {
    id: pk(),
    ownerId: uuid("owner_id"),
    taskId: uuid("task_id"),
    kind: text("kind").notNull(), // before | after | receipt | id | selfie | checklist | entrance
    url: text("url").notNull(),
    takenAt: tz("taken_at").notNull().defaultNow(),
    exif: jsonb("exif").$type<Record<string, unknown>>().notNull().default({}),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    checksum: text("checksum"),
  },
  (t) => [index("photos_task_idx").on(t.taskId)],
);

export const expenses = pgTable(
  "expenses",
  {
    id: pk(),
    taskId: uuid("task_id").notNull(),
    cap: integer("cap").notNull(),
    spent: integer("spent").notNull().default(0),
    status: text("status").notNull().default("held"), // held | receipt_uploaded | approved | refunded
    substitutionPolicy: text("substitution_policy").notNull().default("ask"),
    receiptPhotoId: uuid("receipt_photo_id"),
    ocrItems: jsonb("ocr_items").$type<{ name: string; amount: number; rejected?: boolean }[]>().notNull().default([]),
    approvedAmount: integer("approved_amount").notNull().default(0),
    refundedAmount: integer("refunded_amount").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("exp_task_idx").on(t.taskId)],
);

/* ---------- money ---------- */
export const payments = pgTable(
  "payments",
  {
    id: pk(),
    planId: uuid("plan_id").notNull(),
    customerId: uuid("customer_id").notNull(),
    provider: text("provider").notNull().default("razorpay"),
    orderId: text("order_id").notNull(),
    paymentId: text("payment_id"),
    method: text("method"),
    amount: integer("amount").notNull(),
    creditsUsed: integer("credits_used").notNull().default(0),
    walletUsed: integer("wallet_used").notNull().default(0),
    promoCode: text("promo_code"),
    status: text("status").notNull().default("created"),
    idempotencyKey: text("idempotency_key").notNull(),
    webhookEvents: jsonb("webhook_events").$type<{ id: string; type: string; ts: string }[]>().notNull().default([]),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("pay_idem_uq").on(t.idempotencyKey), index("pay_plan_idx").on(t.planId), index("pay_order_idx").on(t.orderId)],
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: pk(),
    journalId: uuid("journal_id").notNull(),
    account: text("account").notNull(),
    debit: integer("debit").notNull().default(0),
    credit: integer("credit").notNull().default(0),
    refType: text("ref_type").notNull(),
    refId: text("ref_id").notNull(),
    memo: text("memo").notNull().default(""),
    ts: tz("ts").notNull().defaultNow(),
  },
  (t) => [index("ledger_journal_idx").on(t.journalId), index("ledger_ref_idx").on(t.refType, t.refId)],
);

export const payouts = pgTable(
  "payouts",
  {
    id: pk(),
    helperId: uuid("helper_id").notNull(),
    amount: integer("amount").notNull(),
    method: text("method").notNull().default("weekly"),
    fee: integer("fee").notNull().default(0),
    status: text("status").notNull().default("scheduled"), // scheduled | paid | held | failed
    utr: text("utr"),
    scheduledFor: tz("scheduled_for"),
    taskIds: jsonb("task_ids").$type<string[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [index("payouts_helper_idx").on(t.helperId)],
);

export const promoCodes = pgTable("promo_codes", {
  code: text("code").primaryKey(),
  percent: integer("percent").notNull().default(0),
  flat: integer("flat").notNull().default(0),
  maxUses: integer("max_uses").notNull().default(100),
  used: integer("used").notNull().default(0),
  expiresAt: tz("expires_at"),
  stackable: boolean("stackable").notNull().default(false),
});

export const pricingConfigs = pgTable("pricing_configs", {
  id: pk(),
  version: integer("version").notNull(),
  effectiveFrom: tz("effective_from").notNull().defaultNow(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  createdBy: uuid("created_by"),
  reason: text("reason").notNull().default(""),
  createdAt: createdAt(),
});

/* ---------- trust ---------- */
export const reviews = pgTable(
  "reviews",
  {
    id: pk(),
    taskId: uuid("task_id").notNull(),
    fromUserId: uuid("from_user_id").notNull(),
    toUserId: uuid("to_user_id").notNull(),
    rating: integer("rating").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    note: text("note").default(""),
    tipAmount: integer("tip_amount").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("reviews_to_idx").on(t.toUserId), index("reviews_task_idx").on(t.taskId)],
);

export const shellNotes = pgTable("shell_notes", {
  id: pk(),
  fromUserId: uuid("from_user_id").notNull(),
  toUserId: uuid("to_user_id").notNull(),
  taskId: uuid("task_id"),
  body: text("body").notNull(),
  createdAt: createdAt(),
});

export const disputes = pgTable(
  "disputes",
  {
    id: pk(),
    taskId: uuid("task_id").notNull(),
    planId: uuid("plan_id"),
    openedBy: uuid("opened_by").notNull(),
    reason: text("reason").notNull(),
    description: text("description").default(""),
    evidence: jsonb("evidence").$type<{ kind: string; url?: string; text?: string }[]>().notNull().default([]),
    status: text("status").notNull().default("open"), // open|under_review|awaiting_info|resolved|appealed|closed
    assignedOpsId: uuid("assigned_ops_id"),
    resolution: jsonb("resolution").$type<{ action: string; amount?: number; note?: string }>(),
    slaDueAt: tz("sla_due_at").notNull(),
    appealUsed: boolean("appeal_used").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("disputes_status_idx").on(t.status)],
);

export const sosEvents = pgTable(
  "sos_events",
  {
    id: pk(),
    taskId: uuid("task_id"),
    userId: uuid("user_id").notNull(),
    kind: text("kind").notNull().default("loud"),
    points: jsonb("points").$type<{ lat: number; lng: number; ts: string }[]>().notNull().default([]),
    status: text("status").notNull().default("open"),
    respondedBy: uuid("responded_by"),
    timeline: jsonb("timeline").$type<{ ts: string; text: string }[]>().notNull().default([]),
    report: text("report"),
    createdAt: createdAt(),
  },
  (t) => [index("sos_status_idx").on(t.status)],
);

export const locationPings = pgTable(
  "location_pings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    helperId: uuid("helper_id").notNull(),
    taskId: uuid("task_id"),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    accuracy: real("accuracy"),
    speed: real("speed"),
    heading: real("heading"),
    battery: integer("battery"),
    mock: boolean("mock").notNull().default(false),
    ts: tz("ts").notNull().defaultNow(),
  },
  (t) => [index("pings_task_ts_idx").on(t.taskId, t.ts), index("pings_ts_idx").on(t.ts)],
);

export const geofenceEvents = pgTable("geofence_events", {
  id: pk(),
  taskId: uuid("task_id"),
  helperId: uuid("helper_id"),
  geofenceType: text("geofence_type").notNull(),
  event: text("event").notNull(),
  ts: tz("ts").notNull().defaultNow(),
});

export const fraudAlerts = pgTable(
  "fraud_alerts",
  {
    id: pk(),
    type: text("type").notNull(),
    severity: text("severity").notNull().default("medium"),
    evidence: jsonb("evidence").$type<Record<string, unknown>>().notNull().default({}),
    status: text("status").notNull().default("open"),
    refType: text("ref_type"),
    refId: text("ref_id"),
    action: text("action"),
    createdAt: createdAt(),
  },
  (t) => [index("fraud_status_idx").on(t.status)],
);

/* ---------- engagement ---------- */
export const routines = pgTable("routines", {
  id: pk(),
  customerId: uuid("customer_id").notNull(),
  templateSlug: text("template_slug").notNull(),
  title: text("title").notNull(),
  frequency: text("frequency").notNull().default("weekly"),
  windowText: text("window_text").notNull().default("Sat 10am-12pm"),
  preferredHelperId: uuid("preferred_helper_id"),
  autoPay: boolean("auto_pay").notNull().default(false),
  nextRunAt: tz("next_run_at"),
  pausedUntil: tz("paused_until"),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
});

export const referrals = pgTable("referrals", {
  id: pk(),
  referrerId: uuid("referrer_id").notNull(),
  referredId: uuid("referred_id"),
  status: text("status").notNull().default("invited"),
  rewardPaid: boolean("reward_paid").notNull().default(false),
  createdAt: createdAt(),
});

export const kudos = pgTable("kudos", {
  id: pk(),
  fromUserId: uuid("from_user_id").notNull(),
  toHelperId: uuid("to_helper_id").notNull(),
  taskId: uuid("task_id"),
  createdAt: createdAt(),
});

export const notifications = pgTable(
  "notifications",
  {
    id: pk(),
    userId: uuid("user_id").notNull(),
    type: text("type").notNull(),
    channel: text("channel").notNull().default("inapp"),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    status: text("status").notNull().default("sent"),
    sentAt: tz("sent_at").notNull().defaultNow(),
    readAt: tz("read_at"),
  },
  (t) => [index("notif_user_idx").on(t.userId)],
);

/* ---------- public site ---------- */
export const waitlist = pgTable(
  "waitlist",
  {
    id: pk(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    role: text("role").notNull().default("help"), // help | earn | both
    societyText: text("society_text").notNull().default(""),
    societyId: uuid("society_id"),
    towerText: text("tower_text"),
    message: text("message"),
    referralCode: text("referral_code").notNull(),
    referredBy: text("referred_by"),
    position: integer("position").notNull(),
    consentAt: tz("consent_at").notNull(),
    verifiedAt: tz("verified_at"),
    hex8: text("hex8"),
    hex9: text("hex9"),
    demo: boolean("demo").notNull().default(false),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("waitlist_phone_uq").on(t.phone), uniqueIndex("waitlist_ref_uq").on(t.referralCode), index("waitlist_society_idx").on(t.societyId), index("waitlist_hex8_idx").on(t.hex8)],
);

export const announcements = pgTable("announcements", {
  id: pk(),
  text: text("text").notNull(),
  textHi: text("text_hi"),
  societyId: uuid("society_id"),
  scope: text("scope").notNull().default("site"), // site | society
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const contentPosts = pgTable("content_posts", {
  id: pk(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  titleHi: text("title_hi"),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(), // MDX-flavoured markdown, rendered by lib/mdx
  author: text("author").notNull().default("Team Shell"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  readingMin: integer("reading_min").notNull().default(4),
  published: boolean("published").notNull().default(true),
  publishedAt: tz("published_at").notNull().defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: pk(),
  scope: text("scope").notNull(), // home | pricing | help-customer | help-helper | safety | earn
  q: text("q").notNull(),
  a: text("a").notNull(),
  qHi: text("q_hi"),
  aHi: text("a_hi"),
  displayOrder: integer("display_order").notNull().default(0),
});

export const contactMessages = pgTable("contact_messages", {
  id: pk(),
  kind: text("kind").notNull().default("contact"), // contact | society | b2b | careers | callback
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  message: text("message").default(""),
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  status: text("status").notNull().default("new"),
  createdAt: createdAt(),
});

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    event: text("event").notNull(),
    props: jsonb("props").$type<Record<string, unknown>>().notNull().default({}),
    path: text("path"),
    userId: uuid("user_id"),
    ts: tz("ts").notNull().defaultNow(),
  },
  (t) => [index("ae_event_idx").on(t.event), index("ae_ts_idx").on(t.ts)],
);

/* ---------- ops ---------- */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: pk(),
    actorId: uuid("actor_id"),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    ts: tz("ts").notNull().defaultNow(),
  },
  (t) => [index("audit_entity_idx").on(t.entity, t.entityId), index("audit_ts_idx").on(t.ts)],
);

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  description: text("description").default(""),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
});

export const notificationTemplates = pgTable("notification_templates", {
  id: pk(),
  event: text("event").notNull(),
  channel: text("channel").notNull(),
  lang: text("lang").notNull(),
  body: text("body").notNull(),
  variables: jsonb("variables").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("approved"),
});

export const opsNotes = pgTable("ops_notes", {
  id: pk(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  authorId: uuid("author_id"),
  body: text("body").notNull(),
  createdAt: createdAt(),
});

export const notifyRequests = pgTable(
  "notify_requests",
  {
    id: pk(),
    phone: text("phone").notNull(),
    serviceSlug: text("service_slug").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("notify_phone_service_uq").on(t.phone, t.serviceSlug)],
);
