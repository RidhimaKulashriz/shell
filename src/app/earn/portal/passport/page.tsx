import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { helpers, taskCategories, taskTemplates, tasks } from "@/db/schema";
import { PassportBook } from "@/components/Passport";
import { PassportControls } from "@/components/earn/Portal";
import { requireUser } from "@/lib/auth";
import { SITE_URL } from "@/lib/seo";
import { passportFor } from "@/lib/passport";

export const metadata = { title: "Skill Passport" };

export default async function Page() {
  const user = await requireUser(["HELPER"], "/earn/login");
  const [h] = await db.select().from(helpers).where(eq(helpers.userId, user.id)).limit(1);
  const data = await passportFor(h);
  const qr = await QRCode.toString(`${SITE_URL}/p/${h.passportSlug}`, { type: "svg", margin: 0, color: { dark: "#0E1A17", light: "#F4F1E6" } });
  void taskCategories; void taskTemplates; void tasks;
  return <div className="space-y-5"><h1 className="display text-3xl">Skill Passport</h1><PassportBook data={{ ...data, qr }} /><PassportControls vis={h.passportVisibility} slug={h.passportSlug ?? ""} /></div>;
}
