import { defineConfig } from "@playwright/test";

// Critical-flow e2e runs against a running app: E2E_BASE_URL=http://localhost:3000 npx playwright test
export default defineConfig({ testDir: "e2e", timeout: 60000, use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" }, reporter: "list" });
