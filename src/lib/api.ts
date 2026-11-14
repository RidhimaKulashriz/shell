import { NextResponse } from "next/server";
import { getUser, type SessionUser } from "./auth";
import type { Role } from "@/db/schema";

export class ApiError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}
const buckets = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) { buckets.set(key, { n: 1, reset: now + windowMs }); return; }
  if (++b.n > max) throw new ApiError("rate_limited", "Too many attempts. Please wait a moment and try again.", 429);
}

type Ctx<P> = { req: Request; user: SessionUser | null; params: P; body: any; ip: string };

export function route<P = Record<string, string>>(
  opts: { roles?: Role[]; limit?: [number, number] },
  fn: (c: Ctx<P> & { user: SessionUser }) => Promise<unknown>,
  allowAnon?: false,
): (req: Request, ctx: { params: Promise<P> }) => Promise<Response>;
export function route<P = Record<string, string>>(
  opts: { roles?: Role[]; limit?: [number, number] },
  fn: (c: Ctx<P>) => Promise<unknown>,
  allowAnon: true,
): (req: Request, ctx: { params: Promise<P> }) => Promise<Response>;
export function route<P>(opts: { roles?: Role[]; limit?: [number, number] }, fn: (c: any) => Promise<unknown>, allowAnon = false) {
  return async (req: Request, ctx: { params: Promise<P> }) => {
    try {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
      if (req.method !== "GET") {
        const origin = req.headers.get("origin"), host = req.headers.get("host");
        if (origin && host && new URL(origin).host !== host && !req.url.includes("/api/webhooks/"))
          throw new ApiError("csrf", "Request blocked for your safety.", 403);
      }
      const [max, win] = opts.limit ?? [120, 60000];
      rateLimit(`${ip}:${new URL(req.url).pathname}`, max, win);
      const user = await getUser();
      if (!allowAnon) {
        if (!user) throw new ApiError("unauthenticated", "Please sign in to continue.", 401);
        if (opts.roles && !opts.roles.includes(user.role)) throw new ApiError("forbidden", "You do not have access to this.", 403);
      }
      let body: any = {};
      if (req.method !== "GET" && req.method !== "DELETE") body = await req.json().catch(() => ({}));
      const data = await fn({ req, user, params: await ctx.params, body, ip });
      return data instanceof Response ? data : NextResponse.json(data ?? { ok: true });
    } catch (e) {
      if (e instanceof ApiError) return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: e.status });
      console.error("api error", e);
      return NextResponse.json({ error: { code: "server_error", message: "Something went wrong on our side. Please try again." } }, { status: 500 });
    }
  };
}
