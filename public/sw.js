/// Service Worker for Pharmacy Sales Dashboard PWA
/// Provides installability. Offline-first caching deferred to v2.

const CACHE_NAME = "pharma-v1";

// Install — cache shell assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            cache.addAll(["/login", "/offline.html"])
        )
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// Fetch — network-first, fallback to cache
self.addEventListener("fetch", (event) => {
    // Skip non-GET and API requests
    if (event.request.method !== "GET") return;
    if (event.request.url.includes("/api/")) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request).then((r) => r || caches.match("/offline.html")))
    );
});
