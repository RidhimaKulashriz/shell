import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";

// Money is always integer paise. Times are UTC (shown in Asia/Kolkata).
const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const societies = pgTable("societies", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  city: text("city").notNull().default("Delhi"),
  area: text("area").notNull().default(""),
  status: text("status").notNull().default("waitlist"), // waitlist | pilot | live
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  boundary: jsonb("boundary"), // GeoJSON polygon (PostGIS geography in Phase 1+)
  gates: jsonb("gates"), // [{name, lat, lng, hours, rules}]
  rules: jsonb("rules"),
  unlockTarget: integer("unlock_target").notNull().default(500),
  goLiveAt: timestamp("go_live_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const towers = pgTable(
  "towers",
  {
    id: id(),
    societyId: uuid("society_id").notNull().references(() => societies.id),
    name: text("name").notNull(),
    floors: integer("floors").notNull().default(10),
    liftNotes: text("lift_notes"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("towers_society_idx").on(t.societyId)],
);

export const taskCategories = pgTable("task_categories", {
  id: id(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameHi: text("name_hi").notNull(),
  iconId: text("icon_id").notNull(),
  baseRate: integer("base_rate").notNull(), // paise per unit (hour or item)
  priceMin: integer("price_min").notNull(),
  priceMax: integer("price_max").notNull(),
  banned: boolean("banned").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  content: jsonb("content").notNull(), // intro, included, excluded, faqs, steps
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const packs = pgTable("packs", {
  id: id(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameHi: text("name_hi").notNull(),
  startingPrice: integer("starting_price").notNull(), // paise
  displayOrder: integer("display_order").notNull().default(0),
  content: jsonb("content").notNull(), // tasks with offsets, copy
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const waitlist = pgTable(
  "waitlist",
  {
    id: id(),
    seq: serial("seq").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull().unique(), // E.164
    role: text("role").notNull().default("help"), // help | earn | both
    societyId: uuid("society_id").references(() => societies.id),
    societyText: text("society_text"),
    towerText: text("tower_text"),
    message: text("message"),
    referralCode: text("referral_code").notNull().unique(),
    referredBy: text("referred_by"),
    referralCount: integer("referral_count").notNull().default(0),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    hex8: text("hex8"),
    hex9: text("hex9"),
    ipHash: text("ip_hash"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("waitlist_society_idx").on(t.societyId),
    index("waitlist_hex9_idx").on(t.hex9),
    index("waitlist_referred_by_idx").on(t.referredBy),
  ],
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: id(),
    phone: text("phone").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumed: boolean("consumed").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("otp_phone_idx").on(t.phone)],
);

export const announcements = pgTable("announcements", {
  id: id(),
  text: text("text").notNull(), // supports {count} and {society}
  textHi: text("text_hi"),
  active: boolean("active").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const contactMessages = pgTable("contact_messages", {
  id: id(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  topic: text("topic").notNull().default("general"),
  message: text("message").notNull(),
  createdAt: createdAt(),
});

export const enquiries = pgTable("enquiries", {
  id: id(),
  kind: text("kind").notNull(), // rwa | office | hostel
  orgName: text("org_name").notNull(),
  city: text("city"),
  size: integer("size"),
  contactName: text("contact_name").notNull(),
  contactRole: text("contact_role"),
  phone: text("phone").notNull(),
  callTime: text("call_time"),
  notes: text("notes"),
  createdAt: createdAt(),
});

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: id(),
    name: text("name").notNull(),
    path: text("path"),
    props: jsonb("props"),
    sessionId: text("session_id"),
    createdAt: createdAt(),
  },
  (t) => [index("events_name_idx").on(t.name)],
);

// Append-only. Never update or delete rows.
export const auditLog = pgTable("audit_log", {
  id: id(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
});
