import { ImageResponse } from "next/og";

// Receipt-style share card. /api/og?title=...&sub=...&n=247
export async function GET(req: Request) {
  const u = new URL(req.url);
  const title = (u.searchParams.get("title") ?? "SHELL").slice(0, 90);
  const sub = (u.searchParams.get("sub") ?? "Get comfortable. We've got it.").slice(0, 120);
  const n = u.searchParams.get("n");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#051F20", padding: 48, fontFamily: "monospace" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F4F1E6", color: "#0E1A17", width: "100%", padding: 48, borderBottom: "14px dashed #8EB69B" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, letterSpacing: 6 }}>
            <span>SHELL</span>
            <span>RECEIPT</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: n ? 120 : 68, fontWeight: 700, lineHeight: 1.05, display: "flex" }}>{n ? `#${n}` : title}</div>
            {n ? <div style={{ fontSize: 44, display: "flex", marginTop: 12 }}>{title}</div> : null}
            <div style={{ fontSize: 30, marginTop: 20, color: "#235347", display: "flex" }}>{sub}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24 }}>
            <span>Get comfortable. We&apos;ve got it.</span>
            <span style={{ border: "5px solid #235347", color: "#235347", padding: "4px 18px", transform: "rotate(-6deg)", display: "flex" }}>VERIFIED</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
