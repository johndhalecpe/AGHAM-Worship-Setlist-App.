/**
 * Service Worker for AGHAM Worship Setlist App
 *
 * Strategy:
 *   - App shell (HTML, CSS, JS, fonts): Cache-first, network update
 *   - API GET requests: Network-first, cache fallback
 *   - API mutations (POST/PATCH/DELETE): Network-only (no cache)
 *   - Static assets: Cache-first
 */

const CACHE_NAME = "agham-setlist-v1";
const APP_SHELL_CACHE = "agham-shell-v1";

// App shell assets to pre-cache on install
const APP_SHELL_ASSETS = [
  "/",
  "/songs",
  "/setlists",
  "/manifest.webmanifest",
  "/transparent-logo.svg",
  "/icon-192.png",
  "/icon-512.png",
];

// Static assets pattern (JS, CSS, fonts, images)
const STATIC_asset_PATTERN = /\.(js|css|woff2?|ttf|eot|svg|png|jpg|webp|avif)$/;

// Install: pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS).catch(() => {
        // Some assets may fail (e.g., dynamic routes) — that's OK
        console.log("[SW] Some shell assets failed to cache, continuing...");
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== APP_SHELL_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: handle requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (mutations are never cached)
  if (request.method !== "GET") return;

  // Skip chrome-extension and other non-http(s) schemes
  if (!url.protocol.startsWith("http")) return;

  // Skip Supabase auth/realtime endpoints
  if (url.hostname.includes("supabase")) return;

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets: cache-first
  if (STATIC_asset_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation requests (HTML pages): network-first with cache fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Everything else: network-first
  event.respondWith(networkFirst(request));
});

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed — try cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return a basic offline page for navigation requests
    if (request.mode === "navigate") {
      return new Response(offlineHTML(), {
        headers: { "Content-Type": "text/html" },
        status: 200,
      });
    }

    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}

// ---------------------------------------------------------------------------
// Offline fallback HTML
// ---------------------------------------------------------------------------

function offlineHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Offline - AGHAM Setlist</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #F6F4EF;
      color: #1a1a1a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
    }
    .card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    p { color: #666; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1rem; }
    .hint { font-size: 0.75rem; color: #999; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1>You're offline</h1>
    <p>No internet connection detected. Cached setlists and songs are still available in the app.</p>
    <button onclick="window.location.reload()" style="
      background: #252320;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      cursor: pointer;
      margin-bottom: 0.75rem;
    ">Try again</button>
    <p class="hint">Cached data loads automatically when available.</p>
  </div>
</body>
</html>`;
}
