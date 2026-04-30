// ─── Tenora Service Worker ───────────────────────────────────────────────────
// Strategy:
//   • Shell assets  → Cache-first (versioned, busted on deploy)
//   • PWA meta files → Network-first, fallback to cache
//   • Navigate      → Network-first, fallback to cached page then /
//   • Static assets → Stale-While-Revalidate (serve fast, update in bg)
//   • API / external → Never cached (pass-through)

const VERSION = "tenora-v3";
const CACHE_SHELL = `${VERSION}-shell`;
const CACHE_PAGES = `${VERSION}-pages`;
const CACHE_ASSETS = `${VERSION}-assets`;

const SHELL_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

// Always fetch fresh from network (critical PWA identity files)
const ALWAYS_FRESH = new Set([
  "/manifest.webmanifest",
  "/sw.js",
]);

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_SHELL)
      .then((cache) =>
        cache.addAll(SHELL_ASSETS).catch((err) => {
          console.warn("[SW] Shell pre-cache partial failure:", err);
        })
      )
  );
  // Take over immediately without waiting for old SW to finish
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const validCaches = new Set([CACHE_SHELL, CACHE_PAGES, CACHE_ASSETS]);

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !validCaches.has(k))
            .map((k) => {
              console.log("[SW] Deleting old cache:", k);
              return caches.delete(k);
            })
        )
      )
  );
  self.clients.claim();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const putInCache = async (cacheName, request, response) => {
  if (response && response.ok && response.status !== 206) {
    try {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    } catch (err) {
      console.warn("[SW] Cache put failed:", err);
    }
  }
  return response;
};

// Network-first, write to cache, fallback to cache
const networkFirst = async (request, cacheName, fallbackUrl) => {
  try {
    const res = await fetch(request);
    putInCache(cacheName, request, res.clone());
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
};

// Stale-While-Revalidate: serve from cache immediately, update cache in background
const staleWhileRevalidate = async (request, cacheName) => {
  const cached = await caches.match(request);

  const networkPromise = fetch(request)
    .then((res) => {
      putInCache(cacheName, request, res.clone());
      return res;
    })
    .catch(() => null);

  return cached || networkPromise;
};

// Force-fresh fetch (no cache headers) then update cache
const fetchFresh = async (request, cacheName) => {
  try {
    const freshReq = new Request(request, { cache: "reload" });
    const res = await fetch(freshReq);
    putInCache(cacheName, request, res.clone());
    return res;
  } catch {
    return caches.match(request);
  }
};

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Let external requests pass through untouched
  if (url.origin !== self.location.origin) return;

  // 1. PWA identity files — always network-fresh
  if (ALWAYS_FRESH.has(url.pathname)) {
    event.respondWith(fetchFresh(req, CACHE_SHELL));
    return;
  }

  // 2. Navigation (HTML pages) — network-first, offline fallback to /
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, CACHE_PAGES, "/"));
    return;
  }

  // 3. Static assets — stale-while-revalidate for speed + freshness
  if (/\.(?:png|jpg|jpeg|svg|webp|ico|gif|woff2?|ttf|otf|css|js|mjs|json)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req, CACHE_ASSETS));
    return;
  }

  // 4. Everything else — pass through (API calls, etc.)
});

// ─── Message handling (e.g. from app: force update) ──────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data?.type === "CLEAR_CACHE") {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});
