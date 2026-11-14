"use client";
export function PrintButton() {
  return <button className="btn btn-forest" onClick={() => window.print()}>Download PDF (Save as PDF)</button>;
}
