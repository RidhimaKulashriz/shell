import { ShellStorefront } from "@/components/store/ShellStorefront";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Shell | Groceries & Verified Home Services in 12 Mins",
  description:
    "Order fresh groceries, daily essentials, and background-verified home services in 12 minutes with live GPS tracking and instant UPI.",
  path: "/",
});

export default function Home() {
  return <ShellStorefront />;
}
