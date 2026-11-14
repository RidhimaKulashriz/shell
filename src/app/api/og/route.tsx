import { ImageResponse } from "next/og";

export const runtime = "nodejs";

/** Receipt-style OG / share card. Query: title, sub, kind (page|waitlist|plan|wrapped), n (queue number), lines (pipe separated). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const title = (u.searchParams.get("title") ?? "Get comfortable. We've got it.").slice(0, 90);
  const sub = (u.searchParams.get("sub") ?? "One message. One plan. One person to ask.").slice(0, 110);
  const kind = u.searchParams.get("kind") ?? "page";
  const n = u.searchParams.get("n");
  const lines = (u.searchParams.get("lines") ?? "").split("|").filter(Boolean).slice(0, 5);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#DAF1DE", padding: 48, fontFamily: "serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, background: "#F4F1E6", border: "4px solid #0E1A17", padding: 44 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: 26, color: "#0E1A17" }}>
            <span>SHELL RECEIPT</span>
            <span>{kind.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {n ? <div style={{ fontSize: 120, color: "#235347", fontWeight: 700 }}>#{n}</div> : null}
            <div style={{ fontSize: n ? 52 : 74, lineHeight: 1.05, color: "#0B2B26", fontWeight: 700 }}>{title}</div>
            <div style={{ marginTop: 16, fontSize: 30, color: "#163832", fontFamily: "monospace" }}>{sub}</div>
            {lines.map((l) => (
              <div key={l} style={{ display: "flex", fontFamily: "monospace", fontSize: 28, color: "#0E1A17", marginTop: 8 }}>{`- ${l}`}</div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "monospace", fontSize: 24, color: "#0E1A17" }}>
            <span>Get comfortable. We've got it.</span>
            <span style={{ border: "4px solid #A63A24", color: "#A63A24", padding: "4px 18px", borderRadius: 10, transform: "rotate(-6deg)" }}>SHELL</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
