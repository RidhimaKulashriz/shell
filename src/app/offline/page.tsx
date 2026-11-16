export default function Offline() {
  return (
    <main id="main" className="grid min-h-screen place-items-center bg-cream px-6">
      <div className="max-w-sm text-center">
        <h1 className="display text-4xl">You are offline</h1>
        <p className="mt-3">We are saving your actions. They will sync as soon as you are back online.</p>
      </div>
    </main>
  );
}
