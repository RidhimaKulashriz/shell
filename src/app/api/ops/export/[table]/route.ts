import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { helpers, ledgerEntries, payments, tasks, users, waitlist } from "@/db/schema";
import { AppError, api } from "@/lib/api";
import { audit } from "@/lib/audit";
import { toCsv } from "@/lib/csv";

const TABLES = ["jobs", "helpers", "customers", "ledger", "payments", "waitlist"] as const;
type Table = (typeof TABLES)[number];

// Export permission: finance data needs ops_lead, finance or super_admin. Everything else is open to ops.
const FINANCE: Table[] = ["ledger", "payments"];
const FINANCE_ROLES = ["ops_lead", "finance", "super_admin"];

export const GET = api<{ table: string }>(
  async ({ req, params, user }) => {
    const table = params.table as Table;
    if (!TABLES.includes(table)) throw new AppError(404, "not_found", "Unknown export.");
    if (FINANCE.includes(table) && !FINANCE_ROLES.includes(user!.opsRole ?? "")) throw new AppError(403, "forbidden", "Finance exports need the finance or lead role.");

    let rows: Record<string, unknown>[] = [];
    if (table === "jobs") {
      rows = (await db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(5000)).map((t) => ({ id: t.id, plan_id: t.planId, name: t.name, status: t.status, price_inr: t.price / 100, helper_payout_inr: t.helperPayout / 100, scheduled_start: t.scheduledStart, approved_at: t.approvedAt, created_at: t.createdAt }));
    } else if (table === "helpers") {
      rows = (await db.select().from(helpers)).map((h) => ({ id: h.id, name: h.displayName, level: h.level, status: h.status, rating: h.ratingAvg, jobs_done: h.jobsDone, strikes: h.strikes, languages: h.languages.join("|") }));
    } else if (table === "customers") {
      rows = (await db.select().from(users).where(eq(users.role, "CUSTOMER"))).map((u) => ({ id: u.id, name: u.name, language: u.language, status: u.status, created_at: u.createdAt }));
    } else if (table === "ledger") {
      rows = (await db.select().from(ledgerEntries).orderBy(desc(ledgerEntries.ts)).limit(10000)).map((l) => ({ journal_id: l.journalId, ts: l.ts, account: l.account, debit_inr: l.debit / 100, credit_inr: l.credit / 100, ref_type: l.refType, ref_id: l.refId, memo: l.memo }));
    } else if (table === "payments") {
      rows = (await db.select().from(payments).orderBy(desc(payments.createdAt)).limit(5000)).map((p) => ({ order_id: p.orderId, plan_id: p.planId, method: p.method, amount_inr: p.amount / 100, credits_inr: p.creditsUsed / 100, status: p.status, created_at: p.createdAt }));
    } else {
      // Phone numbers are masked in exports: the last four digits only.
      rows = (await db.select().from(waitlist).orderBy(desc(waitlist.createdAt)).limit(10000)).map((w) => ({ position: w.position, name: w.name, phone: `******${w.phone.slice(-4)}`, role: w.role, society: w.societyText, created_at: w.createdAt }));
    }
    await audit({ actorId: user!.id, action: "csv_export", entity: table, entityId: table, after: { rows: rows.length }, req });
    return new Response(toCsv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="shell-${table}-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" } });
  },
  { roles: ["OPS", "SUPER_ADMIN"] },
);
