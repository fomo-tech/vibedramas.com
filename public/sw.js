// Service Worker for Phim ngắn hay PWA
// ⚠️ Bump BUILD_VERSION mỗi khi deploy để invalidate cache cũ
const BUILD_VERSION = "0.0.65";
const CACHE_NAME = "phim-ngan-hay-static-" + BUILD_VERSION;
const OFFLINE_CACHE = "phim-ngan-hay-offline-" + BUILD_VERSION;

// Chỉ precache offline fallback — KHÔNG cache HTML pages
const PRECACHE_ASSETS = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) =>
      Promise.allSettled(
        PRECACHE_ASSETS.map(async (asset) => {
          const response = await fetch(asset, { cache: "reload" });
          if (!response.ok) {
            throw new Error(`Precache failed for ${asset}: ${response.status}`);
          }
          await cache.put(asset, response);
        }),
      ),
    ),
  );
  // Activate new worker immediately so UI bug fixes are not blocked by stale cache.
  self.skipWaiting();
});

// Listen for SKIP_WAITING message from client (triggered by update banner)
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Activate event - xoá TOÀN BỘ cache cũ, chỉ giữ OFFLINE_CACHE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== OFFLINE_CACHE && name !== CACHE_NAME)
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Bỏ qua cross-origin
  if (url.origin !== location.origin) return;

  // API → network only, không cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        Response.json({ error: "Offline - no connection" }, { status: 503 }),
      ),
    );
    return;
  }

  // HTML navigate → network only, KHÔNG cache, fallback offline.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() =>
        caches.match("/offline.html"),
      ),
    );
    return;
  }

  // Next bundles already contain a content hash. Let the browser/Next headers
  // handle them and never put UI bundles in Cache Storage. This avoids an old
  // service worker reviving stale JS/CSS after a deploy.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(fetch(request));
    return;
  }

  // All remaining same-origin assets are network-only. Only explicit offline
  // assets in OFFLINE_CACHE are retained by the install handler.
  event.respondWith(fetch(request));
});

// Background sync for offline actions (optional)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-watch-history") {
    event.waitUntil(syncWatchHistory());
  }
});

async function syncWatchHistory() {
  // Sync watch history when back online
  console.log("Syncing watch history...");
  // Implementation depends on your backend
}

// Push notifications (optional)
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Phim ngắn hay";
  const options = {
    body: data.body || "New content available!",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    data: data.url || "/",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || "/"));
});
