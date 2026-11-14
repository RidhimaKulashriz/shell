import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-screen place-items-center bg-cream px-6 py-16">
      <div className="max-w-md text-center">
        <svg viewBox="0 0 260 180" className="mx-auto w-72" aria-hidden>
          <g filter="url(#wobble)" fill="none" stroke="#0e1a17" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="20" y="20" width="220" height="140" fill="#F4F1E6" />
            <path d="M20 130 H240" />
            <path d="M60 130 V90 H110 V130" fill="#E8C48A" />
            <path d="M150 20 V70 H200 V20" fill="#DAF1DE" />
            <path d="M170 70 V130 M185 70 V130 M160 130 H196" />
            <path d="M125 130 q10 -30 22 0" strokeDasharray="2 6" />
          </g>
        </svg>
        <div className="mono mt-4 text-sm tracking-widest text-brick">404</div>
        <h1 className="display mt-1 text-5xl">Nobody's home</h1>
        <p className="mt-3 text-lg">We could not find this page. The link may be out of date, or we have not reached that address yet.</p>
        <Link href="/" className="btn btn-sun mt-6"><Icon name="home" size={22} tone="none" /> Back to home</Link>
      </div>
    </main>
  );
}
