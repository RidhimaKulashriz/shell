import { requireRole } from "@/lib/auth";
import { Composer } from "@/components/customer";
import { db } from "@/db";
import { packs } from "@/db/schema";
import { eq } from "drizzle-orm";
export const metadata = { title: "New request" };
export default async function Page({ searchParams }: { searchParams: Promise<{ text?: string; pack?: string }> }) {
  await requireRole(["CUSTOMER"], "/app/new");
  const sp = await searchParams;
  const [pk] = sp.pack ? await db.select().from(packs).where(eq(packs.slug, sp.pack)) : [];
  return (<div className="mx-auto max-w-2xl"><h1 className="text-3xl font-semibold text-tide">{pk ? pk.name : "Tell Shell what you need"}</h1><p className="mb-5 mt-1 text-ink/60">{pk ? pk.description : "Write it the way you'd tell a friend. You can also speak or add a photo."}</p><Composer full initialText={sp.text ?? ""} packSlug={pk?.slug} /></div>);
}
