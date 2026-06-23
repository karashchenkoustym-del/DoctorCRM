// Minimal service worker: required by some browsers (Android Chrome) to
// consider the app installable. Intentionally does not cache anything —
// this app's data changes constantly, so we always want a fresh network
// fetch rather than a stale cached response.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('fetch', () => {});
