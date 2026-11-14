import "dotenv/config";
import { ensureSeed } from "../src/lib/seed";
import { pool } from "../src/db";
ensureSeed().then(() => { console.log("seed ok"); return pool.end(); }).catch((e) => { console.error(e); process.exit(1); });
