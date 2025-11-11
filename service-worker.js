/* © 2025 MWA LegacyBuiltCO™ — LegacyBuilt Command OS™ v3.2.9
   Created by April Lungal. All Rights Reserved. */
const CACHE_NAME = "lbcos-v3-2-9-gh-1761399544";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c)=>c.addAll(ASSETS)));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k===CACHE_NAME? null : caches.delete(k))))
  );
});
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request).then(r => {
      return caches.open(CACHE_NAME).then(c => { c.put(e.request, r.clone()); return r; });
    }).catch(()=> caches.match("./index.html")))
  );
});