import { LoginForm } from "./form";
import { getFlags } from "@/lib/settings";
export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; as?: string }> }) {
  const sp = await searchParams;
  const flags = await getFlags();
  return (
    <section className="grain bg-cream/50 py-12 md:py-20">
      <div className="mx-auto grid max-w-5xl gap-10 px-5 md:grid-cols-2 md:px-8">
        <div>
          <h1 className="text-4xl font-semibold text-tide md:text-5xl">{sp.as === "helper" ? "Start earning with Shell" : "Welcome back"}</h1>
          <p className="mt-3 max-w-sm text-ink/70">Sign in with your mobile number. We&apos;ll send a one-time code on WhatsApp.</p>
          {flags.demo_mode && <DemoPanel next={sp.next} />}
        </div>
        <LoginForm next={sp.next} as={sp.as} />
      </div>
    </section>
  );
}
import { DemoLogin } from "./form";
function DemoPanel({ next }: { next?: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-euca/40 bg-white/70 p-5">
      <p className="text-sm font-semibold text-tide">Just looking around? Open a demo account</p>
      <p className="text-xs text-ink/60">Pre-filled with a society, helpers and past orders.</p>
      <DemoLogin next={next} />
    </div>
  );
}
