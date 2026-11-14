import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { eq } from "drizzle-orm";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  const [w] = await db.select().from(waitlist).where(eq(waitlist.referralCode, code));
  const esc = (s: string) => s.replace(/[<>&"]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="900" viewBox="0 0 720 900"><rect width="720" height="900" fill="#051f20"/><rect x="80" y="80" width="560" height="740" fill="#f4f1e6"/><text x="120" y="150" font-family="monospace" font-size="20" letter-spacing="6" fill="#235347">SHELL WAITLIST</text><text x="120" y="260" font-family="Georgia,serif" font-size="64" font-weight="700" fill="#051f20">I'm #${w?.position ?? "—"}</text><text x="120" y="320" font-family="Georgia,serif" font-size="40" fill="#051f20">on the Shell list.</text><line x1="120" y1="370" x2="600" y2="370" stroke="#0e1a17" stroke-opacity=".3" stroke-width="3" stroke-dasharray="8 8"/><text x="120" y="440" font-family="monospace" font-size="24" fill="#0e1a17">${esc(w?.name ?? "A neighbour")}</text><text x="120" y="480" font-family="monospace" font-size="22" fill="#0e1a17" fill-opacity=".7">${esc(w?.societyText || "Delhi")}</text><text x="120" y="600" font-family="Georgia,serif" font-size="34" font-style="italic" fill="#235347">Get comfortable. We've got it.</text><text x="120" y="720" font-family="monospace" font-size="22" fill="#0e1a17">Join with code ${esc(code)}</text><circle cx="560" cy="150" r="22" fill="#f2c318"/></svg>`;
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=300" } });
}
