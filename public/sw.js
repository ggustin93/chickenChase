// Minimal Service Worker for Chicken Chase PWA
// 2024 Best Practices: Essential functionality only
const CACHE_NAME = 'chicken-chase-v2';
const ESSENTIAL_ASSETS = [
  '/',
  '/manifest.json'
];

// Install: Cache only critical assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ESSENTIAL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches, take control immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(name => name !== CACHE_NAME)
             .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: Stale-while-revalidate for shell, network-first for API
self.addEventListener('fetch', e => {
  const { request } = e;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip API/external requests - always fresh
  if (request.url.includes('supabase') || 
      request.url.includes('/api/')) return;
  
  // Navigation requests: offline fallback
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }
  
  // Static assets: cache-first
  e.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request))
  );
});