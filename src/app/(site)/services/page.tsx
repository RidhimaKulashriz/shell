import { meta } from "@/lib/seo";
import { MVP_SERVICES, COMING_SOON_SERVICES } from "@/lib/mvp-catalog";
import { ServiceGrid } from "./ServiceGrid";

export const metadata = meta({
  title: "Services — 4 live in Dwarka",
  description: "4 verified home services bookable now in Dwarka Sectors 6, 10, 12 with upfront INR pricing. Others coming soon — get notified.",
  path: "/services",
});

export default function Page() {
  return (
    <>
      <section className="border-b border-[#E3E8E4] bg-[#0B2B26] px-4 py-10 text-white md:px-6 md:py-12">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8EB69B]">Dwarka Pilot · Scheduled slots 8am–8pm</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">4 services live. More coming soon.</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">Upfront INR pricing. Verified helpers from your society. Door OTP check-in. Pay after you approve the job.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-8 md:px-6">
        <div className="rounded-[12px] border border-[#0B2B26]/15 bg-[#0B2B26] p-5 text-white">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold">Groceries &amp; daily essentials</h2>
              <p className="mt-1 text-xs text-white/80">Coming soon with your local Dwarka stores. We start with services first.</p>
            </div>
            <a href="/groceries" className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-white px-5 text-xs font-semibold text-[#0B2B26] hover:bg-[#F7F8F6]">
              Get notified for groceries
            </a>
          </div>
        </div>
      </section>

      <ServiceGrid bookable={MVP_SERVICES} comingSoon={COMING_SOON_SERVICES} />
    </>
  );
}
