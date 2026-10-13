// Idle Trading Co. (installable web version): keeps the game's files on the phone.
// Engine and game pieces, the start-up script and pictures have the build in their names, so the cache
// can always serve them; the page itself is fetched fresh first, so a new version is never missed.
// Kaan's iPhone (13 Oct 2026): the first start after an update stopped part way. A new version of this
// worker used to take over at once, stopping the old one while it was still handing over the game's
// files. Now a new version waits until the game is next opened, everything shares one cache, and only
// files this version doesn't use are cleared out.
const CACHE = "itc-files";
const KEEP = ["apple-touch-icon.png", "engine-c91d7162-0.wasm", "engine-c91d7162-1.wasm", "engine-c91d7162-2.wasm", "engine-c91d7162-3.wasm", "game-data-cf127298-0.wasm", "game-data-cf127298-1.wasm", "icon-192.png", "icon-512.png", "index.audio.position.worklet.js", "index.audio.worklet.js", "index.js", "loading-screen.webp", "manifest.webmanifest", "radio-038c7f214b.mp3", "radio-27cb8f7540.mp3", "radio-9e8e9af719.mp3", "radio-c9120d81d9.mp3", "radio-d0cc7db2dd.mp3", "radio-d74b5dda4f.mp3", "radio-ea1e1594a0.mp3"];   // this version's files
self.addEventListener("activate", (e) => {
	e.waitUntil(caches.keys()
		.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
		.then(() => caches.open(CACHE))
		.then((cache) => cache.keys().then((reqs) => Promise.all(reqs
			.filter((r) => { const name = new URL(r.url).pathname.split("/").pop(); return name !== "" && name !== "index.html" && KEEP.indexOf(name) < 0; })
			.map((r) => cache.delete(r)))))
		.then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
	const req = e.request;
	if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
	if (req.destination === "audioworklet" || req.url.indexOf("worklet") >= 0) return;   // the sound's helpers come straight from the network (Safari)
	const page = req.mode === "navigate" || req.url.endsWith("/") || req.url.endsWith(".html");
	if (page) {
		e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((cache) => cache.put(req, c)); return r; })
			.catch(() => caches.match(req)));
		return;
	}
	e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
		if (r.ok) { const c = r.clone(); caches.open(CACHE).then((cache) => cache.put(req, c)); }
		return r;
	})));
});
