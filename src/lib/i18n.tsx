"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { track } from "./track";

export type Lang = "en" | "hi";

// Chrome and key-page strings. Long-form content is Hinglish by design
// (see ASSUMPTIONS.md); the toggle swaps these strings and the document lang.
const DICT = {
  "nav.waitlist": { en: "Join the waitlist", hi: "वेटलिस्ट में जुड़ें" },
  "nav.menu": { en: "Menu", hi: "मेन्यू" },
  "hero.eyebrow": { en: "Starting in one Delhi society", hi: "दिल्ली की एक सोसाइटी से शुरुआत" },
  "hero.h1a": { en: "Get comfortable.", hi: "आराम से रहिए।" },
  "hero.h1b1": { en: "We've ", hi: "बाक़ी " },
  "hero.h1b2": { en: "got it", hi: "हम देख लेंगे" },
  "hero.sub": {
    en: "Write one message. We plan it, send verified helpers, and stay with you until it's done.",
    hi: "एक मैसेज लिखिए। हम प्लान बनाते हैं, वेरिफ़ाइड हेल्पर भेजते हैं, और काम पूरा होने तक साथ रहते हैं।",
  },
  "hero.sub2": {
    en: "Ek message likho. Hum plan banate hain, verified helpers bhejte hain, aur kaam poora hone tak saath rehte hain.",
    hi: "Ek message likho. Hum plan banate hain, verified helpers bhejte hain, aur kaam poora hone tak saath rehte hain.",
  },
  "cta.waitlist": { en: "Join the waitlist", hi: "वेटलिस्ट में जुड़ें" },
  "cta.how": { en: "See how it works", hi: "देखिए कैसे चलता है" },
  "cta.send": { en: "Shell ko bhejo", hi: "Shell को भेजो" },
  "cta.tryhome": { en: "Isse apne ghar ke liye try karo", hi: "इसे अपने घर के लिए ट्राई करो" },
  "footer.tag": { en: "Get comfortable. We've got it.", hi: "आराम से रहिए। हम देख लेंगे।" },
  "footer.sign": { en: "Made in Delhi, with chai", hi: "दिल्ली में बना, चाय के साथ" },
  "footer.status": { en: "Status: all good", hi: "स्टेटस: सब ठीक" },
  "problem.line": { en: "Kaam karwana khud ek kaam ban gaya hai.", hi: "काम करवाना ख़ुद एक काम बन गया है।" },
  "empty.generic": { en: "Abhi kuch nahi. Peaceful hai, enjoy karo.", hi: "अभी कुछ नहीं। शांति है, एन्जॉय करो।" },
  "cookie.title": { en: "Cookies, the boring kind.", hi: "कुकीज़, बस ज़रूरी वाली।" },
  "cookie.body": {
    en: "We use essential cookies to run the site. With your OK we also count visits so we can fix what's confusing.",
    hi: "साइट चलाने के लिए ज़रूरी कुकीज़। आपकी मर्ज़ी से हम विज़िट भी गिनते हैं ताकि जो उलझा हुआ है उसे सुधार सकें।",
  },
  "cookie.accept": { en: "Accept", hi: "ठीक है" },
  "cookie.reject": { en: "Reject non-essential", hi: "ग़ैर-ज़रूरी मना करें" },
  "cookie.custom": { en: "Customise", hi: "बदलें" },
} as const;

export type DictKey = keyof typeof DICT;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string };
const LangCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => DICT[k].en });

export function LangProvider({ initial, children }: { initial: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `shell_lang=${l}; path=/; max-age=31536000; samesite=lax`;
    try {
      localStorage.setItem("shell_lang", l);
    } catch {}
    track("language_switch", { to: l });
  }, []);
  const t = useCallback((k: DictKey) => DICT[k][lang], [lang]);
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

/** Inline translated string for server components. */
export function T({ k }: { k: DictKey }) {
  const { t } = useLang();
  return <>{t(k)}</>;
}
