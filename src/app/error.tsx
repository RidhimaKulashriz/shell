"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="band-cream px-5 py-24">
      <div className="mx-auto max-w-3xl">
        <p className="stamp">500</p>
        <h1 className="font-display mt-4 text-5xl font-black leading-none md:text-7xl">Humse kuch gadbad ho gayi.</h1>
        <p className="hand mt-4 text-3xl text-euca">Hum dekh rahe hain.</p>
        <button onClick={reset} className="pill pill-sun mt-6">Dobara try karo</button>
      </div>
    </section>
  );
}
