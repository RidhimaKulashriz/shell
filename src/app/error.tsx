"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (<main className="grid min-h-screen place-items-center px-6 text-center"><div><h1 className="text-4xl font-semibold text-tide">Something went wrong on our side.</h1><p className="mt-2 text-ink/70">We&apos;re looking into it. Please try again.</p><button className="btn btn-primary mt-6" onClick={reset}>Try again</button></div></main>);
}
