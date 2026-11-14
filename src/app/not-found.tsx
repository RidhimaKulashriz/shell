import Link from "next/link";
import { Logo } from "@/components/icons";
export default function NotFound() {
  return (<main className="grid min-h-screen place-items-center bg-cream/50 px-6 text-center"><div>
    <svg width="180" height="130" viewBox="0 0 180 130" fill="none" className="mx-auto" aria-hidden><path d="M20 120V30h140v90M20 30l70-24 70 24M70 120V70h40v50" stroke="#235347" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><rect x="22" y="32" width="136" height="86" fill="#8eb69b" fillOpacity=".25" /><circle cx="100" cy="96" r="2.5" fill="#235347" /></svg>
    <h1 className="mt-6 text-4xl font-semibold text-tide">Nobody&apos;s home.</h1><p className="mt-2 text-ink/70">We couldn&apos;t find that page. It may have moved.</p>
    <Link href="/" className="btn btn-primary mt-6">Back to the front door</Link><div className="mt-10 flex justify-center opacity-60"><Logo size={22} /></div></div></main>);
}
