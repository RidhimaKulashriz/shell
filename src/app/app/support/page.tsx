import { requireRole } from "@/lib/auth";
import { Chat } from "@/components/order";
export const metadata = { title: "Support" };
export default async function Page({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const user = await requireRole(["CUSTOMER"], "/app/support");
  const plan = (await searchParams).plan;
  return (<div className="mx-auto max-w-xl space-y-4"><h1 className="text-3xl font-semibold text-tide">{plan ? "Ask for a change" : "Talk to Shell"}</h1><p className="text-ink/60">A person on our team will reply, usually within a few minutes during working hours.</p><Chat threadKey={plan ? `plan:${plan}` : `support:${user.id}`} title="Shell support" /></div>);
}
