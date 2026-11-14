import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: { default: "Shell app", template: "%s | Shell" }, robots: { index: false } };

export default function AppRoot({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
