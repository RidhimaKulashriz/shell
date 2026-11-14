import Link from "next/link";

export default function NotFound() {
  return (
    <section className="band-cream px-5 py-16 md:py-24">
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
        <svg viewBox="0 0 320 240" className="w-full" role="img" aria-label="An empty room with an open door">
          <rect x="10" y="190" width="300" height="12" rx="4" fill="#E8C48A" stroke="#0E1A17" strokeWidth="3" />
          <path d="M30 190 L30 30 L290 30 L290 190" fill="#F4F1E6" stroke="#0E1A17" strokeWidth="3" strokeLinejoin="round" />
          <path d="M210 190 L210 80 L260 66 L260 190 Z" fill="#8EB69B" stroke="#0E1A17" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="222" cy="136" r="4" fill="#0E1A17" />
          <rect x="60" y="62" width="90" height="62" fill="#DAF1DE" stroke="#0E1A17" strokeWidth="3" />
          <path d="M105 62 V124 M60 93 H150" stroke="#0E1A17" strokeWidth="3" />
          <path d="M70 190 C70 168 100 168 100 190" fill="#E8C48A" stroke="#0E1A17" strokeWidth="3" />
          <path d="M128 150 C150 110 170 150 150 190" fill="none" stroke="#235347" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 8" />
        </svg>
        <div>
          <p className="stamp">404</p>
          <h1 className="font-display mt-4 text-5xl font-black leading-none md:text-7xl">Ghar mein koi nahi hai.</h1>
          <p className="hand mt-4 text-3xl text-euca">Ye page yahan nahi mila.</p>
          <Link href="/" className="pill pill-sun mt-6">Wapas ghar chalo</Link>
        </div>
      </div>
    </section>
  );
}
