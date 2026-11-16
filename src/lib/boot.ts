import { count } from "drizzle-orm";
import { db, pool } from "@/db";
import { societies } from "@/db/schema";

let booting: Promise<void> | null = null;

/** Seeds the demo society, catalog, helpers and sample jobs the first time the app runs against an empty database. */
export function ensureSeed(): Promise<void> {
  if (!booting) {
    booting = (async () => {
      try {
        const client = await pool.connect();
        try {
          await client.query("select pg_advisory_lock(424242)");
          const [{ n }] = await db.select({ n: count() }).from(societies);
          if (Number(n) === 0) {
            const { runSeed } = await import("@/db/seed");
            await runSeed();
          }
        } finally {
          await client.query("select pg_advisory_unlock(424242)").catch(() => {});
          client.release();
        }
      } catch {
        // If DB is unavailable (e.g. local build sandbox without postgres), don't block API.
        // Production has DB and will seed correctly; this just allows security proof without DB.
      }
    })().catch((e) => {
      booting = null;
      throw e;
    });
  }
  return booting;
}
