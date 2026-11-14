import { NextResponse, type NextRequest } from "next/server";

// Applies ?lang=hi|en|hinglish to the same request (so SSR renders in that language), and exposes the pathname for login redirects.
export function proxy(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang");
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  const valid = lang === "hi" || lang === "en" || lang === "hinglish";
  if (valid) {
    const cookie = (headers.get("cookie") ?? "").replace(/(?:^|;\s*)shell_lang=[^;]*/g, "");
    headers.set("cookie", `${cookie}; shell_lang=${lang}`);
  }
  const res = NextResponse.next({ request: { headers } });
  if (valid) res.cookies.set("shell_lang", lang!, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return res;
}

export const config = { matcher: ["/((?!_next/|api/|.*\\..*).*)"] };
