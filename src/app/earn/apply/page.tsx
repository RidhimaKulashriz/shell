import { eq } from "drizzle-orm";
import { db } from "@/db";
import { helpers } from "@/db/schema";
import { Apply } from "@/components/earn/Apply";
import { OfflineBanner } from "@/components/app/AppShell";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Apply to Shell Earn", robots: { index: false } };

export default async function Page() {
  const user = await requireUser(["HELPER"], "/earn/login");
  const [h] = await db.select().from(helpers).where(eq(helpers.userId, user.id)).limit(1);
  return <div className="mx-auto min-h-screen max-w-xl bg-cream px-4 py-6"><OfflineBanner /><Apply startStep={h?.applicationStep ?? 0} status={h?.status ?? "applied"} name={h?.displayName === "New helper" ? "" : (h?.displayName ?? "")} /></div>;
}
