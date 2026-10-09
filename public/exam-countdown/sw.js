/* TimeKeeper owns only this feature scope. Never cache personal transfers,
   API responses, navigation HTML, or Deetnuts' other routes. Timers compute
   from wall-clock time in the browser; a worker is not a background clock. */
const CACHE_PREFIX = "deetnuts-exam-countdown-";
const CACHE = `${CACHE_PREFIX}v1`;
const ASSETS = ["/exam-countdown/favicon.svg", "/exam-countdown/fonts/inter.woff2", "/exam-countdown/fonts/playfair-italic.woff2"];
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))); });
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)))));
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.search || !ASSETS.includes(url.pathname)) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy))); }
    return response;
  }).catch(() => caches.match(event.request)));
});
