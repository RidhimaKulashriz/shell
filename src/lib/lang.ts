import { cookies } from "next/headers";

export type Lang = "en" | "hi" | "hinglish";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get("shell_lang")?.value;
  return v === "hi" || v === "hinglish" ? v : "en";
}

/** Server-side picker: Hindi only when the user chose Hindi; English and Hinglish share the English UI strings. */
export function pick(lang: Lang, en: string, hi: string) {
  return lang === "hi" ? hi : en;
}
