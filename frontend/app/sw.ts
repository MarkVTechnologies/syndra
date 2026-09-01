import { defaultCache } from "@serwist/next/worker";
import { Serwist, NetworkFirst, StaleWhileRevalidate, CacheFirst, ExpirationPlugin } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * CACHE SAFETY (PRD §11.2): nothing authenticated is precached. Dashboard
 * and /api routes use NetworkFirst so a shared device never serves a
 * previous user's cached data; a purge on logout is handled client-side by
 * clearing the runtime cache namespace.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  fallbacks: {
    entries: [{ url: "/offline", matcher: ({ request }) => request.destination === "document" }],
  },
  runtimeCaching: [
    {
      matcher: /\/api\/.*/,
      handler: new NetworkFirst({ cacheName: "api-cache" }),
    },
    {
      matcher: ({ request }) => request.destination === "document",
      handler: new NetworkFirst({ cacheName: "pages-cache" }),
    },
    {
      matcher: ({ request }) => request.destination === "style" || request.destination === "script",
      handler: new StaleWhileRevalidate({ cacheName: "static-resources" }),
    },
    {
      matcher: ({ url }) => url.hostname === "res.cloudinary.com",
      handler: new CacheFirst({
        cacheName: "cloudinary-images",
        plugins: [new ExpirationPlugin({ maxAgeSeconds: 30 * 24 * 60 * 60, maxEntries: 200 })],
      }),
    },
    ...defaultCache,
  ],
});

// Push-ready — payload delivery lands v1.1 (PRD §11.2), handlers wired now
// so the SW doesn't need to change when it does.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "SAN", {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string })?.url ?? "/";
  event.waitUntil(self.clients.openWindow(url));
});

serwist.addEventListeners();
