// Service Worker for Vibe Drama PWA
// ⚠️ Bump BUILD_VERSION mỗi khi deploy để invalidate cache cũ
const BUILD_VERSION = "0.0.49";
const CACHE_NAME = "vibe-drama-static-" + BUILD_VERSION;
const OFFLINE_CACHE = "vibe-drama-offline-" + BUILD_VERSION;

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
    caches.open(OFFLINE_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }),
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

  // /_next/static/ → network-first to avoid stale JS/CSS chunks during rapid deploy/dev
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cache.match(request)),
      ),
    );
    return;
  }

  // Các static asset khác (icons, manifest...) → network-first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
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
  const title = data.title || "Vibe Drama";
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
