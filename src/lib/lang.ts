import { cookies } from "next/headers";

export type Lang = "en" | "hi";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get("shell_lang")?.value;
  return v === "hi" ? "hi" : "en";
}

/** Server-side picker: Hindi only when the user chose Hindi. */
export function pick(lang: Lang, en: string, hi: string) {
  return lang === "hi" ? hi : en;
}
