import { desc } from "drizzle-orm";
import { db } from "@/db";
import { announcements, contactMessages, contentPosts, faqs } from "@/db/schema";
import { H1, Table } from "@/components/ops/ui";
import { CATALOGUE } from "@/lib/notify";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "Content and templates" };

export default async function Page() {
  const [posts, fq, an, msgs] = await Promise.all([db.select().from(contentPosts).orderBy(desc(contentPosts.publishedAt)), db.select().from(faqs), db.select().from(announcements), db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(20)]);
  return (
    <div className="space-y-5"><H1 sub="Blog, FAQs, banners, notification templates (WhatsApp, push, in-app; Hindi and English)">Content and templates</H1>
      <section><h2 className="display text-xl">Guides</h2><Table cols={["Title", "Tags", "Published"]} rows={posts.map((p) => [p.title, p.tags.join(", "), fmtDate(p.publishedAt)])} /></section>
      <section><h2 className="display text-xl">Banners and announcements</h2><Table cols={["Scope", "Text", "Active"]} rows={an.map((a) => [a.scope, a.text, a.active ? "yes" : "no"])} /><p className="mt-1 text-xs">{fq.length} FAQs across home, pricing and help.</p></section>
      <section><h2 className="display text-xl">Notification templates ({Object.keys(CATALOGUE).length} events)</h2><Table cols={["Event", "Channels", "English", "Hindi"]} rows={Object.entries(CATALOGUE).map(([k, t]) => [k, [t.wa && "WhatsApp", t.push && "push", "in-app", t.always && "ignores quiet hours"].filter(Boolean).join(", "), <span key="e" className="text-xs">{t.en}</span>, <span key="h" lang="hi" className="text-xs">{t.hi}</span>])} /></section>
      <section><h2 className="display text-xl">Inbound enquiries</h2><Table cols={["Kind", "Name", "Contact", "Message"]} rows={msgs.map((m) => [m.kind, m.name, m.phone ?? m.email ?? "-", m.message ?? ""])} /></section></div>
  );
}
