import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { AppShell } from "@/components/app/AppShell";
import { requireUser } from "@/lib/auth";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const user = await requireUser(["CUSTOMER"]);
  const [a] = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, user.id)).limit(1);
  if (!a) redirect("/app/onboarding");
  return <AppShell name={user.name}>{children}</AppShell>;
}
