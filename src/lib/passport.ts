import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { helpers, taskCategories, taskTemplates, tasks } from "@/db/schema";
import type { PassportData } from "@/components/Passport";

/** Builds the Skill Passport from verified, approved jobs: one stamp per category completed. */
export async function passportFor(h: typeof helpers.$inferSelect): Promise<PassportData> {
  const done = await db.select({ c: taskTemplates.categorySlug }).from(tasks).innerJoin(taskTemplates, eq(taskTemplates.slug, tasks.templateSlug)).where(and(eq(tasks.assignedHelperId, h.id), eq(tasks.status, "approved")));
  const cats = await db.select().from(taskCategories);
  const slugs = new Set(done.map((d) => d.c));
  if (h.jobsDone > 0) for (const c of h.categories) slugs.add(c.slug);
  const stamps = cats.filter((c) => slugs.has(c.slug)).map((c) => ({ label: c.nameEn.split(" ")[0], icon: c.icon }));
  const v = h.passportVisibility;
  return { name: h.displayName, level: h.level, slug: h.passportSlug ?? undefined, jobs: v.jobs ? h.jobsDone : 0, rating: v.rating ? h.ratingAvg : 0, languages: v.languages ? h.languages : [], college: v.college ? h.college : null, stamps, verified: [h.kycStatus === "verified" ? "ID" : "", h.collegeIdStatus === "verified" ? "College" : "", h.safetyTrainingPassedAt ? "Safety" : ""].filter(Boolean) };
}
