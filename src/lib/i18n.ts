import type { Lang } from "@/lib/lang";

const D = {
  en: {
    "nav.how": "How it works", "nav.services": "Services", "nav.packs": "Packs", "nav.earn": "Earn with Shell", "nav.safety": "Safety", "nav.societies": "Societies",
    "nav.waitlist": "Join the waitlist", "nav.menu": "Menu", "nav.close": "Close",
    "svc.quick": "Shell Quick", "svc.quick.d": "One small task, done today", "svc.managed": "Shell Managed", "svc.managed.d": "Events, shifting, whole-home resets", "svc.earn": "Shell Earn", "svc.earn.d": "Earn with a skill you already have", "svc.routines": "Shell Routines", "svc.routines.d": "Repeating help, coming soon",
    "foot.tag": "Get comfortable. We've got it.", "foot.sign": "Made in Delhi, with chai", "foot.product": "Product", "foot.company": "Company", "foot.legal": "Legal", "foot.status": "Status: all good",
    "cta.waitlist": "Join the waitlist", "cta.see": "See how it works", "wa.msg": "Hi Shell, I'm on",
    "cookie.title": "Cookies, the small kind", "cookie.body": "We use essential cookies to keep you logged in. With your OK we also count visits so we can fix what is confusing.", "cookie.accept": "Accept", "cookie.reject": "Reject non-essential", "cookie.custom": "Customise", "cookie.save": "Save choice", "cookie.analytics": "Analytics (anonymous visit counts)",
  },
  hi: {
    "nav.how": "कैसे काम करता है", "nav.services": "सेवाएँ", "nav.packs": "पैक", "nav.earn": "Shell के साथ कमाएँ", "nav.safety": "सुरक्षा", "nav.societies": "सोसाइटी",
    "nav.waitlist": "वेटलिस्ट में जुड़ें", "nav.menu": "मेन्यू", "nav.close": "बंद करें",
    "svc.quick": "Shell Quick", "svc.quick.d": "एक छोटा काम, आज ही", "svc.managed": "Shell Managed", "svc.managed.d": "इवेंट, शिफ्टिंग, पूरे घर की तैयारी", "svc.earn": "Shell Earn", "svc.earn.d": "अपने हुनर से कमाइए", "svc.routines": "Shell Routines", "svc.routines.d": "रोज़/हफ़्ते की मदद, जल्द आ रहा है",
    "foot.tag": "आराम से रहिए। बाकी हम देख लेंगे।", "foot.sign": "दिल्ली में बना, चाय के साथ", "foot.product": "प्रोडक्ट", "foot.company": "कंपनी", "foot.legal": "कानूनी", "foot.status": "स्थिति: सब ठीक है",
    "cta.waitlist": "वेटलिस्ट में जुड़ें", "cta.see": "कैसे काम करता है देखें", "wa.msg": "नमस्ते Shell, मैं देख रहा/रही हूँ",
    "cookie.title": "कुकीज़, छोटी वाली", "cookie.body": "लॉगिन बनाए रखने के लिए ज़रूरी कुकीज़ चाहिए। आपकी इजाज़त से हम विज़िट भी गिनेंगे ताकि उलझी चीज़ें ठीक कर सकें।", "cookie.accept": "ठीक है", "cookie.reject": "ग़ैर-ज़रूरी मना करें", "cookie.custom": "अपनी पसंद", "cookie.save": "पसंद सेव करें", "cookie.analytics": "एनालिटिक्स (गुमनाम विज़िट गिनती)",
  },
} as const;

export type Key = keyof (typeof D)["en"];
export const dict = (lang: Lang) => (lang === "hi" ? D.hi : D.en) as Record<Key, string>;
