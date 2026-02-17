const CACHE_NAME = 'orivex-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './css/variables.css',
    './js/app.js',
    './assets/orivex_logo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
