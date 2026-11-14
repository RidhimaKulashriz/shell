import { NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/boot";

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public messageHi?: string,
  ) {
    super(message);
  }
}

const buckets = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return;
  }
  if (++b.n > max) throw new AppError(429, "rate_limited", "Too many tries. Please wait a moment.", "बहुत ज़्यादा कोशिशें। थोड़ा रुकिए।");
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

type Ctx<P> = { req: NextRequest; params: P; user: SessionUser | null; ip: string };
type Opts = { roles?: string[]; limit?: { key: string; max: number; windowMs: number }; csrf?: boolean; public?: boolean };

export function api<P extends Record<string, string | string[]> = Record<string, never>>(fn: (c: Ctx<P>) => Promise<unknown>, opts: Opts = {}) {
  return async (req: NextRequest, ctx: { params: Promise<P> }): Promise<Response> => {
    const requestId = crypto.randomUUID().slice(0, 8);
    try {
      await ensureSeed();
      const ip = clientIp(req);
      if (opts.limit) rateLimit(`${opts.limit.key}:${ip}`, opts.limit.max, opts.limit.windowMs);
      // CSRF: cookie-authenticated writes must be same-origin (Sec-Fetch-Site) or carry a matching Origin.
      if (opts.csrf !== false && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        const site = req.headers.get("sec-fetch-site");
        const origin = req.headers.get("origin");
        const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
        if (site === "cross-site" || (!site && origin && host && new URL(origin).host !== host)) throw new AppError(403, "csrf", "Cross-site request blocked.");
      }
      const user = await getSessionUser();
      if (opts.roles && (!user || (!opts.roles.includes(user.role) && user.role !== "SUPER_ADMIN"))) throw new AppError(user ? 403 : 401, user ? "forbidden" : "unauthenticated", user ? "You do not have access." : "Please log in.", user ? "आपके पास अनुमति नहीं है।" : "कृपया लॉग इन करें।");
      const params = (await ctx?.params) ?? ({} as P);
      const out = await fn({ req, params, user, ip });
      const res = out instanceof Response ? out : Response.json(out ?? { ok: true });
      res.headers.set("x-request-id", requestId);
      return res;
    } catch (e) {
      if (e instanceof AppError) return Response.json({ error: { code: e.code, message: e.message, messageHi: e.messageHi ?? e.message, requestId } }, { status: e.status });
      if (e instanceof ZodError) return Response.json({ error: { code: "validation_error", message: e.issues[0]?.message ?? "Invalid input", messageHi: "जानकारी सही नहीं है", fields: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })), requestId } }, { status: 400 });
      console.error(JSON.stringify({ level: "error", requestId, msg: e instanceof Error ? e.message : String(e) }));
      return Response.json({ error: { code: "internal", message: "Something went wrong on our side.", messageHi: "हमारी तरफ़ से कुछ गड़बड़ हो गई।", requestId } }, { status: 500 });
    }
  };
}

export async function body<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    /* empty body */
  }
  return schema.parse(raw);
}

export function need<T>(v: T | null | undefined, what = "Item"): T {
  if (v === null || v === undefined) throw new AppError(404, "not_found", `${what} not found.`, "नहीं मिला।");
  return v;
}
