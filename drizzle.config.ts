import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    // Render injects DATABASE_URL at runtime. The Dockerfile provides a
    // build-only placeholder while creating the image without production secrets.
    url: process.env.DATABASE_URL!,
  },
});
