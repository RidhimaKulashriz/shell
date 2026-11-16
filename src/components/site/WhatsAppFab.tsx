"use client";
import { useEffect, useState } from "react";

export function WhatsAppFab({ lead }: { lead?: string }) {
  const [href, setHref] = useState("#");
  const num = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999900000";
  useEffect(() => {
    const text = encodeURIComponent(`${lead ?? "Hi Shell,"} ${location.pathname}`);
    setHref(`https://wa.me/${num}?text=${text}`);
  }, [lead, num]);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        // analytics if consented — no throw
        try { (window as any).gtag?.("event", "whatsapp_click"); } catch {}
      }}
      aria-label="Chat with Shell on WhatsApp"
      className="fixed bottom-4 right-4 z-40 grid h-14 w-14 place-items-center rounded-full border border-[#E3E8E4] bg-[#25D366] text-white shadow-md hover:bg-[#1EB955]"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19.5 3.5A9.8 9.8 0 0 0 12 1C6.5 1 2 5.1 2 10.5c0 1.7.5 3.3 1.4 4.7L2 23l8-1.9c1.3.7 2.8 1.1 4.4 1.1 5.5 0 10-4.1 10-9.6 0-2.5-1-4.8-2.9-6.6-1.8-1.7-4.3-2.7-7-2.7zm-7 15.6c-1.2 0-2.4-.3-3.4-.9l-.2-.1-4.7 1.1 1-4.3-.2-.3a8 8 0 0 1-1.1-4c0-4.4 3.7-8 8.3-8 2.1 0 4.1.8 5.6 2.2A7.6 7.6 0 0 1 20 10.6c0 4.4-3.7 8-8.2 8zm4.6-6.1c-.2-.1-1.2-.6-1.4-.7-.2 0-.4-.1-.5 0-.2.1-.5.6-.6.8 0 .1-.2.2-.4.2h-.3c-.3 0-.7-.2-1-.4a5.5 5.5 0 0 1-1.9-1.6c-.2-.3-.4-.5-.5-.6 0-.1 0-.3 0-.4.1-.2.3-.4.4-.6.1-.1.1-.2 0-.3l-.6-1.4c-.1-.3-.2-.4-.4-.4h-.3c-.2 0-.4 0-.6.2-.2.2-.7.7-.7 1.6 0 1 .7 1.9 1 2.4.1.2.8 1.3 2 1.9.8.4 1.3.6 1.8.8.5.2.9.1 1.2.1.4 0 1.2-.5 1.4-1 0-.5.2-.9.1-1 0-.1-.2-.2-.4-.2z" />
      </svg>
    </a>
  );
}
