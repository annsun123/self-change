// Service Worker for 自我改变 (Self-Change) PWA
const CACHE_NAME = "self-change-v1";

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/login",
  "/manifest.json",
];

// Install: pre-cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: stale-while-revalidate for navigation + static assets,
//        network-only for Supabase and API routes
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip Supabase API calls — always go to network
  if (url.hostname.includes("supabase.co")) return;

  // Skip API routes — always go to network
  if (url.pathname.startsWith("/api/")) return;

  // Skip Next.js hot reloading (dev only)
  if (url.pathname.startsWith("/_next/")) return;

  // For page navigations: stale-while-revalidate
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone);
              });
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // For static assets (JS, CSS, fonts, images): cache-first with network update
  if (
    url.pathname.match(
      /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/
    )
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone);
              });
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
  }
});
