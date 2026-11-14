import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = performance.now();
  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    await db.execute(sql`select 1`);
    const latencyMs = Math.round((performance.now() - started) * 100) / 100;
    const response = Response.json({
      ok: true,
      status: "ready",
      version: process.env.APP_VERSION ?? process.env.npm_package_version ?? "development",
      environment: process.env.NODE_ENV ?? "development",
      uptimeSeconds: Math.round(process.uptime()),
      dependencies: { database: { ok: true, latencyMs } },
      requestId,
    });
    response.headers.set("cache-control", "no-store");
    response.headers.set("x-request-id", requestId);
    return response;
  } catch (error) {
    const response = Response.json({
      ok: false,
      status: "degraded",
      version: process.env.APP_VERSION ?? process.env.npm_package_version ?? "development",
      environment: process.env.NODE_ENV ?? "development",
      dependencies: { database: { ok: false } },
      requestId,
      error: error instanceof Error ? "database_unavailable" : "health_check_failed",
    }, { status: 503 });
    response.headers.set("cache-control", "no-store");
    response.headers.set("x-request-id", requestId);
    return response;
  }
}
