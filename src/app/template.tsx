"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Paper-slide wipe, 350ms. Disabled under prefers-reduced-motion (see globals.css).
export default function Template({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <>
      <div key={path} className="page-wipe bg-paper pointer-events-none fixed inset-0 z-[80]" aria-hidden="true" />
      {children}
    </>
  );
}
