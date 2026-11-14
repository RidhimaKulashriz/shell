// Minimal service worker: caches the app shell and shows a basic offline page when the network is gone.
const CACHE = "shell-v1";
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/offline.html", "/icon.svg"]))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).pathname.startsWith("/api/")) return;
  if (r.mode === "navigate") e.respondWith(fetch(r).catch(() => caches.match("/offline.html")));
});
