import {
  pgTable, uuid, text, integer, boolean, timestamp, jsonb, real, doublePrecision, index, uniqueIndex, primaryKey,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
const ts = (n: string) => timestamp(n, { withTimezone: true });

export type Role = "CUSTOMER" | "HELPER" | "OPS" | "SOCIETY_PARTNER" | "SUPER_ADMIN";

export const users = pgTable("users", {
  id: id(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  name: text("name").notNull().default(""),
  role: text("role").$type<Role>().notNull().default("CUSTOMER"),
  language: text("language").notNull().default("en"),
  status: text("status").notNull().default("active"),
  consentWhatsapp: boolean("consent_whatsapp").notNull().default(false),
  consentLocation: boolean("consent_location").notNull().default(false),
  consentMarketing: boolean("consent_marketing").notNull().default(false),
  consentAt: ts("consent_at"),
  lastLoginAt: ts("last_login_at"),
  deletionRequestedAt: ts("deletion_requested_at"),
  societyId: uuid("society_id"),
  createdAt: createdAt(), updatedAt: updatedAt(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: uuid("user_id").notNull(),
  expiresAt: ts("expires_at").notNull(),
  createdAt: createdAt(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);

export const otpCodes = pgTable("otp_codes", {
  id: id(),
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: ts("expires_at").notNull(),
  createdAt: createdAt(),
}, (t) => [index("otp_phone_idx").on(t.phone)]);

export const societies = pgTable("societies", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  city: text("city").notNull().default("Delhi"),
  area: text("area").notNull().default(""),
  status: text("status").notNull().default("waitlist"), // waitlist | pilot | live
  centroidLat: doublePrecision("centroid_lat").notNull(),
  centroidLng: doublePrecision("centroid_lng").notNull(),
  boundary: jsonb("boundary").$type<[number, number][]>().notNull().default([]),
  gates: jsonb("gates").$type<{ name: string; lat: number; lng: number; hours: string; rules: string; guard: string }[]>().notNull().default([]),
  rules: text("rules").notNull().default(""),
  perks: jsonb("perks").$type<string[]>().notNull().default([]),
  flats: integer("flats").notNull().default(0),
  unlockTarget: integer("unlock_target").notNull().default(500),
  goLiveAt: ts("go_live_at"),
  createdAt: createdAt(), updatedAt: updatedAt(),
});

export const towers = pgTable("towers", {
  id: id(),
  societyId: uuid("society_id").notNull(),
  name: text("name").notNull(),
  floors: integer("floors").notNull().default(10),
  liftNotes: text("lift_notes").notNull().default(""),
  directions: text("directions").notNull().default(""),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  createdAt: createdAt(),
}, (t) => [index("towers_society_idx").on(t.societyId)]);

export const addresses = pgTable("addresses", {
  id: id(),
  userId: uuid("user_id").notNull(),
  societyId: uuid("society_id").notNull(),
  towerId: uuid("tower_id").notNull(),
  floor: integer("floor").notNull().default(1),
  flat: text("flat").notNull().default(""),
  landmark: text("landmark").notNull().default(""),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  entryNotes: text("entry_notes").notNull().default(""),
  verifiedAt: ts("verified_at"),
  verificationMethod: text("verification_method"),
  createdAt: createdAt(),
}, (t) => [index("addr_user_idx").on(t.userId)]);

export type Atlas = {
  household?: number; kids?: boolean; pets?: string; allergies?: string;
  keyHandling?: "home" | "guard" | "lockbox"; doNotTouch?: string; rooms?: string[]; helperLanguage?: string;
};

export const customerProfiles = pgTable("customer_profiles", {
  userId: uuid("user_id").primaryKey(),
  atlas: jsonb("atlas").$type<Atlas>().notNull().default({}),
  helperGenderPref: text("helper_gender_pref").notNull().default("any"),
  quietStart: integer("quiet_start").notNull().default(22),
  quietEnd: integer("quiet_end").notNull().default(7),
  referralCode: text("referral_code").notNull().default(""),
  referredBy: text("referred_by"),
  walletBalance: integer("wallet_balance").notNull().default(0),
  creditsBalance: integer("credits_balance").notNull().default(0),
  trustedContact: jsonb("trusted_contact").$type<{ name: string; phone: string } | null>(),
  createdAt: createdAt(), updatedAt: updatedAt(),
});

export const helperProfiles = pgTable("helper_profiles", {
  userId: uuid("user_id").primaryKey(),
  dob: text("dob"),
  college: text("college").notNull().default(""),
  occupation: text("occupation").notNull().default("student"),
  gender: text("gender").notNull().default("unspecified"),
  languages: text("languages").array().notNull().default([]),
  categories: text("categories").array().notNull().default([]),
  level: text("level").notNull().default("STARTER"),
  kycStatus: text("kyc_status").notNull().default("pending"),
  kycReference: text("kyc_reference"),
  collegeIdStatus: text("college_id_status").notNull().default("pending"),
  livenessStatus: text("liveness_status").notNull().default("pending"),
  trainingStatus: text("training_status").notNull().default("pending"),
  trainingDone: text("training_done").array().notNull().default([]),
  safetyTrainingPassedAt: ts("safety_training_passed_at"),
  shadowJobDone: boolean("shadow_job_done").notNull().default(false),
  availability: jsonb("availability").$type<Record<string, string[]>>().notNull().default({}),
  radiusM: integer("radius_m").notNull().default(3000),
  payoutAccountRef: text("payout_account_ref"),
  ratingAvg: real("rating_avg").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  jobsDone: integer("jobs_done").notNull().default(0),
  onTimeRate: real("on_time_rate").notNull().default(1),
  repeatRate: real("repeat_rate").notNull().default(0),
  strikes: integer("strikes").notNull().default(0),
  status: text("status").notNull().default("applied"), // applied|review|training|shadow|active|paused|suspended|banned
  online: boolean("online").notNull().default(false),
  rushOptIn: boolean("rush_opt_in").notNull().default(false),
  bio: text("bio").notNull().default(""),
  whyPicked: text("why_picked").notNull().default(""),
  passportSlug: text("passport_slug").unique(),
  applicationStep: integer("application_step").notNull().default(1),
  application: jsonb("application").$type<Record<string, unknown>>().notNull().default({}),
  lat: doublePrecision("lat"), lng: doublePrecision("lng"),
  createdAt: createdAt(), updatedAt: updatedAt(),
});

export const categories = pgTable("categories", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("quick"),
  icon: text("icon").notNull().default("broom"),
  description: text("description").notNull().default(""),
  baseRate: integer("base_rate").notNull(), // paise per unit
  unit: text("unit").notNull().default("hour"),
  minutesPerUnit: integer("minutes_per_unit").notNull().default(60),
  defaultQty: integer("default_qty").notNull().default(1),
  keywords: text("keywords").array().notNull().default([]),
  included: text("included").array().notNull().default([]),
  excluded: text("excluded").array().notNull().default([]),
  checklist: text("checklist").array().notNull().default([]),
  active: boolean("active").notNull().default(true),
  banned: boolean("banned").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: createdAt(), updatedAt: updatedAt(),
});

export const packs = pgTable("packs", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  items: jsonb("items").$type<{ slug: string; quantity: number; offsetHours: number; note: string }[]>().notNull().default([]),
  helperTypes: text("helper_types").array().notNull().default([]),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export type DraftLine = { slug: string; quantity: number; size: string; confidence: number; note?: string; cap?: number };
export type Question = { key: string; slug: string; text: string; chips: { label: string; value: string }[] };

export const requests = pgTable("requests", {
  id: id(),
  customerId: uuid("customer_id").notNull(),
  addressId: uuid("address_id"),
  rawText: text("raw_text").notNull(),
  language: text("language").notNull().default("en"),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  deadlineAt: ts("deadline_at"),
  urgency: text("urgency").notNull().default("normal"),
  status: text("status").notNull().default("new"),
  draft: jsonb("draft").$type<DraftLine[]>().notNull().default([]),
  questions: jsonb("questions").$type<Question[]>().notNull().default([]),
  answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
  rejectedReason: text("rejected_reason"),
  packSlug: text("pack_slug"),
  circleId: uuid("circle_id"),
  assignedOpsId: uuid("assigned_ops_id"),
  slaDueAt: ts("sla_due_at"),
  createdAt: createdAt(), updatedAt: updatedAt(),
}, (t) => [index("req_customer_idx").on(t.customerId), index("req_status_idx").on(t.status)]);

export const plans = pgTable("plans", {
  id: id(),
  requestId: uuid("request_id").notNull(),
  customerId: uuid("customer_id").notNull(),
  version: integer("version").notNull().default(1),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"), // draft|sent|approved|rejected|superseded
  urgency: text("urgency").notNull().default("normal"),
  urgencyMultiplier: real("urgency_multiplier").notNull().default(1),
  circleDiscount: real("circle_discount").notNull().default(0),
  subtotal: integer("subtotal").notNull().default(0),
  travelAmount: integer("travel_amount").notNull().default(0),
  platformFee: integer("platform_fee").notNull().default(0),
  coordinationFee: integer("coordination_fee").notNull().default(0),
  minTopUp: integer("min_top_up").notNull().default(0),
  promoDiscount: integer("promo_discount").notNull().default(0),
  promoCode: text("promo_code"),
  total: integer("total").notNull().default(0),
  guaranteeIncluded: boolean("guarantee_included").notNull().default(true),
  pricingConfigVersion: integer("pricing_config_version").notNull().default(1),
  deadlineAt: ts("deadline_at"),
  circleId: uuid("circle_id"),
  opsNote: text("ops_note"),
  createdAt: createdAt(), updatedAt: updatedAt(),
}, (t) => [index("plans_request_idx").on(t.requestId), index("plans_customer_idx").on(t.customerId)]);

export type ChecklistItem = { label: string; done: boolean };
export type ChangeReq = { id: string; type: "extra_time" | "extra_task"; minutes: number; delta: number; note: string; status: "pending" | "accepted" | "declined"; by: string };

export const tasks = pgTable("tasks", {
  id: id(),
  planId: uuid("plan_id").notNull(),
  customerId: uuid("customer_id").notNull(),
  categoryId: uuid("category_id").notNull(),
  title: text("title").notNull(),
  quantity: integer("quantity").notNull().default(1),
  size: text("size").notNull().default("medium"),
  durationEstMin: integer("duration_est_min").notNull().default(60),
  basePrice: integer("base_price").notNull().default(0),
  price: integer("price").notNull().default(0),
  feeShare: integer("fee_share").notNull().default(0),
  helperPayout: integer("helper_payout").notNull().default(0),
  scheduledStart: ts("scheduled_start"),
  scheduledEnd: ts("scheduled_end"),
  helperId: uuid("helper_id"),
  status: text("status").notNull().default("planned"),
  checklist: jsonb("checklist").$type<ChecklistItem[]>().notNull().default([]),
  doorOtpHash: text("door_otp_hash"),
  expensesCap: integer("expenses_cap").notNull().default(0),
  expense: jsonb("expense").$type<{ spent: number; items: { name: string; amount: number }[]; status: string; approved: number; refunded: number; receipt?: string } | null>(),
  changes: jsonb("changes").$type<ChangeReq[]>().notNull().default([]),
  beforePhotos: jsonb("before_photos").$type<string[]>().notNull().default([]),
  afterPhotos: jsonb("after_photos").$type<string[]>().notNull().default([]),
  notes: text("notes").notNull().default(""),
  reworkCount: integer("rework_count").notNull().default(0),
  rush: boolean("rush").notNull().default(false),
  checkInAt: ts("check_in_at"), checkOutAt: ts("check_out_at"), approvedAt: ts("approved_at"),
  enRouteAt: ts("en_route_at"),
  paidOut: boolean("paid_out").notNull().default(false),
  createdAt: createdAt(), updatedAt: updatedAt(),
}, (t) => [index("tasks_plan_idx").on(t.planId), index("tasks_helper_idx").on(t.helperId), index("tasks_status_idx").on(t.status), index("tasks_customer_idx").on(t.customerId)]);

export const taskEvents = pgTable("task_events", {
  id: id(),
  taskId: uuid("task_id").notNull(),
  type: text("type").notNull(),
  actorId: uuid("actor_id"),
  note: text("note").notNull().default(""),
  createdAt: createdAt(),
}, (t) => [index("te_task_idx").on(t.taskId)]);

export const offers = pgTable("offers", {
  id: id(),
  taskId: uuid("task_id").notNull(),
  helperId: uuid("helper_id").notNull(),
  status: text("status").notNull().default("sent"),
  payout: integer("payout").notNull().default(0),
  score: jsonb("score").$type<Record<string, number>>().notNull().default({}),
  reason: text("reason"),
  sentAt: createdAt(),
  expiresAt: ts("expires_at"),
  respondedAt: ts("responded_at"),
}, (t) => [index("offers_helper_idx").on(t.helperId), index("offers_task_idx").on(t.taskId)]);

export const circles = pgTable("circles", {
  id: id(),
  societyId: uuid("society_id").notNull(),
  towerId: uuid("tower_id").notNull(),
  categoryId: uuid("category_id").notNull(),
  title: text("title").notNull(),
  windowStart: ts("window_start").notNull(),
  windowEnd: ts("window_end").notNull(),
  cutoffAt: ts("cutoff_at").notNull(),
  minFlats: integer("min_flats").notNull().default(3),
  maxFlats: integer("max_flats").notNull().default(6),
  currentFlats: integer("current_flats").notNull().default(0),
  status: text("status").notNull().default("open"),
  createdBy: uuid("created_by").notNull(),
  createdAt: createdAt(),
});

export const circleMembers = pgTable("circle_members", {
  id: id(),
  circleId: uuid("circle_id").notNull(),
  userId: uuid("user_id").notNull(),
  flat: text("flat").notNull().default(""),
  paymentStatus: text("payment_status").notNull().default("pending"),
  joinedAt: createdAt(),
}, (t) => [uniqueIndex("circle_member_uq").on(t.circleId, t.userId)]);

export const messages = pgTable("messages", {
  id: id(),
  threadKey: text("thread_key").notNull(),
  senderId: uuid("sender_id"),
  kind: text("kind").notNull().default("text"),
  body: text("body").notNull(),
  leakFlags: text("leak_flags").array().notNull().default([]),
  blurred: boolean("blurred").notNull().default(false),
  createdAt: createdAt(),
}, (t) => [index("msg_thread_idx").on(t.threadKey)]);

export const reviews = pgTable("reviews", {
  id: id(),
  taskId: uuid("task_id").notNull(),
  fromUserId: uuid("from_user_id").notNull(),
  toUserId: uuid("to_user_id").notNull(),
  rating: integer("rating").notNull(),
  tags: text("tags").array().notNull().default([]),
  note: text("note").notNull().default(""),
  tip: integer("tip").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("rev_to_idx").on(t.toUserId)]);

export const shellNotes = pgTable("shell_notes", {
  id: id(),
  taskId: uuid("task_id"),
  fromUserId: uuid("from_user_id").notNull(),
  toUserId: uuid("to_user_id").notNull(),
  body: text("body").notNull(),
  createdAt: createdAt(),
});

export const disputes = pgTable("disputes", {
  id: id(),
  taskId: uuid("task_id").notNull(),
  openedBy: uuid("opened_by").notNull(),
  reason: text("reason").notNull(),
  description: text("description").notNull().default(""),
  evidence: jsonb("evidence").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("open"),
  resolution: jsonb("resolution").$type<{ type: string; amount: number; message: string } | null>(),
  assignedOpsId: uuid("assigned_ops_id"),
  appealUsed: boolean("appeal_used").notNull().default(false),
  slaDueAt: ts("sla_due_at"),
  createdAt: createdAt(), updatedAt: updatedAt(),
});

export const payments = pgTable("payments", {
  id: id(),
  planId: uuid("plan_id").notNull(),
  userId: uuid("user_id").notNull(),
  provider: text("provider").notNull().default("razorpay_mock"),
  orderId: text("order_id").notNull(),
  paymentId: text("payment_id"),
  method: text("method").notNull().default("upi"),
  amount: integer("amount").notNull(),
  creditsUsed: integer("credits_used").notNull().default(0),
  walletUsed: integer("wallet_used").notNull().default(0),
  status: text("status").notNull().default("created"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  webhookEvents: jsonb("webhook_events").$type<string[]>().notNull().default([]),
  createdAt: createdAt(), updatedAt: updatedAt(),
});

export const ledgerEntries = pgTable("ledger_entries", {
  id: id(),
  journalId: uuid("journal_id").notNull(),
  account: text("account").notNull(),
  debit: integer("debit").notNull().default(0),
  credit: integer("credit").notNull().default(0),
  refType: text("ref_type").notNull(),
  refId: text("ref_id").notNull(),
  memo: text("memo").notNull().default(""),
  createdAt: createdAt(),
}, (t) => [index("ledger_journal_idx").on(t.journalId), index("ledger_ref_idx").on(t.refId)]);

export const payouts = pgTable("payouts", {
  id: id(),
  helperId: uuid("helper_id").notNull(),
  amount: integer("amount").notNull(),
  fee: integer("fee").notNull().default(0),
  method: text("method").notNull().default("weekly"),
  status: text("status").notNull().default("scheduled"),
  utr: text("utr"),
  taskIds: jsonb("task_ids").$type<string[]>().notNull().default([]),
  scheduledFor: ts("scheduled_for"),
  createdAt: createdAt(),
});

export const strikes = pgTable("strikes", {
  id: id(),
  helperId: uuid("helper_id").notNull(),
  reason: text("reason").notNull(),
  severity: integer("severity").notNull().default(1),
  issuedBy: uuid("issued_by"),
  appealStatus: text("appeal_status").notNull().default("none"),
  expiresAt: ts("expires_at"),
  createdAt: createdAt(),
});

export const sosEvents = pgTable("sos_events", {
  id: id(),
  taskId: uuid("task_id"),
  userId: uuid("user_id").notNull(),
  kind: text("kind").notNull().default("loud"),
  status: text("status").notNull().default("open"),
  timeline: jsonb("timeline").$type<{ at: string; text: string }[]>().notNull().default([]),
  respondedBy: uuid("responded_by"),
  createdAt: createdAt(),
});

export const locationPings = pgTable("location_pings", {
  id: id(),
  helperId: uuid("helper_id").notNull(),
  taskId: uuid("task_id").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  accuracy: real("accuracy"),
  speed: real("speed"),
  battery: integer("battery"),
  ts: createdAt(),
}, (t) => [index("pings_task_idx").on(t.taskId)]);

export const routines = pgTable("routines", {
  id: id(),
  customerId: uuid("customer_id").notNull(),
  categoryId: uuid("category_id").notNull(),
  title: text("title").notNull(),
  quantity: integer("quantity").notNull().default(1),
  frequency: text("frequency").notNull().default("weekly"),
  dayOfWeek: integer("day_of_week").notNull().default(6),
  timeWindow: text("time_window").notNull().default("morning"),
  preferredHelperId: uuid("preferred_helper_id"),
  nextRunAt: ts("next_run_at"),
  pausedUntil: ts("paused_until"),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
});

export const notifications = pgTable("notifications", {
  id: id(),
  userId: uuid("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  link: text("link"),
  readAt: ts("read_at"),
  createdAt: createdAt(),
}, (t) => [index("notif_user_idx").on(t.userId)]);

export const waitlist = pgTable("waitlist", {
  id: id(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  role: text("role").notNull().default("help"),
  societyText: text("society_text").notNull().default(""),
  societyId: uuid("society_id"),
  towerText: text("tower_text").notNull().default(""),
  message: text("message").notNull().default(""),
  referralCode: text("referral_code").notNull(),
  referredBy: text("referred_by"),
  position: integer("position").notNull(),
  consentAt: ts("consent_at"),
  verifiedAt: ts("verified_at"),
  hex: text("hex"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: createdAt(),
}, (t) => [index("wl_society_idx").on(t.societyId)]);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: updatedAt(),
});

export const pricingConfigs = pgTable("pricing_configs", {
  id: id(),
  version: integer("version").notNull(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  reason: text("reason").notNull().default(""),
  createdBy: uuid("created_by"),
  effectiveFrom: ts("effective_from").notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: id(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull().default(""),
  before: jsonb("before"),
  after: jsonb("after"),
  ip: text("ip"),
  ts: createdAt(),
}, (t) => [index("audit_entity_idx").on(t.entity)]);

export const announcements = pgTable("announcements", {
  id: id(),
  text: text("text").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const inquiries = pgTable("inquiries", {
  id: id(),
  kind: text("kind").notNull(), // contact | society | business | helper
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  message: text("message").notNull().default(""),
  meta: jsonb("meta").$type<Record<string, string>>().notNull().default({}),
  status: text("status").notNull().default("new"),
  createdAt: createdAt(),
});

export const helperFavourites = pgTable("helper_favourites", {
  customerId: uuid("customer_id").notNull(),
  helperId: uuid("helper_id").notNull(),
}, (t) => [primaryKey({ columns: [t.customerId, t.helperId] })]);
