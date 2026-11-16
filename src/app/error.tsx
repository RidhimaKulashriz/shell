"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="grid min-h-screen place-items-center bg-cream px-6 py-16">
      <div className="max-w-md text-center">
        <div className="mono text-sm tracking-widest text-brick">500</div>
        <h1 className="display mt-1 text-4xl">Something went wrong on our side. We are looking into it.</h1>
        <p className="mt-3">Your work is saved. Please try again.{error.digest && <span className="mono block text-xs opacity-60">ref {error.digest}</span>}</p>
        <button className="btn btn-sun mt-6" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
