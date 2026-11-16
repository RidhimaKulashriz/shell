import type { ReactNode } from "react";
import { OpsShell } from "@/components/ops/Shell";
import { requireUser } from "@/lib/auth";

export const metadata = { title: { default: "Ops Cockpit", template: "%s | Ops" }, robots: { index: false } };

export default async function Layout({ children }: { children: ReactNode }) {
  const u = await requireUser(["OPS", "SUPER_ADMIN"], "/app/login");
  return <OpsShell name={u.name} role={u.opsRole ?? u.role}>{children}</OpsShell>;
}
