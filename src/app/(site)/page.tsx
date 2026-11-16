import { ShellStorefront } from "@/components/store/ShellStorefront";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Shell | Verified Home Services in Dwarka — Scheduled Slots",
  description:
    "Book trusted, verified helpers for home services in Dwarka Sectors 6, 10, 12. Scheduled 2-hour slots, upfront INR pricing, door OTP and pay-after-approval.",
  path: "/",
});

export default function Home() {
  return <ShellStorefront />;
}
