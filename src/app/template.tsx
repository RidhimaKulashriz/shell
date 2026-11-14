import type { ReactNode } from "react";

// Paper-slide wipe on every navigation (350ms, disabled under reduced motion via CSS).
export default function Template({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="wipe" aria-hidden />
      {children}
    </>
  );
}
