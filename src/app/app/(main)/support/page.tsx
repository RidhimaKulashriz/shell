import { Chat } from "@/components/app/Chat";
import { CallbackButton } from "@/components/app/Misc";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Support" };

export default async function Page() {
  const user = await requireUser(["CUSTOMER"]);
  return (
    <div className="space-y-4"><h1 className="display text-3xl">Support</h1><p className="mono text-sm">Reply SLA: working hours, within 15 minutes.</p><Chat threadKey={`support:${user.id}`} title="Shell team" /><CallbackButton /></div>
  );
}
