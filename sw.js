/* ===========================================================
 * sw.js
 * ===========================================================
 * Copyright 2016 @huxpro
 * Licensed under Apache 2.0
 * service worker scripting
 * ========================================================== */

// CACHE_NAMESPACE
// CacheStorage is shared between all sites under same domain.
// A namespace can prevent potential name conflicts and mis-deletion.
const CACHE_NAMESPACE = 'main-';
const CACHE_VERSION = 'v3';
const CACHE = `${CACHE_NAMESPACE}precache-then-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = './offline.html';

const PRECACHE_LIST = [
  './',
  OFFLINE_URL,
  './js/jquery.min.js',
  './js/hux-blog.min.js',
  './js/snackbar.js',
  './css/hux-blog.css',
  './css/bootstrap.min.css',
  './img/icon_wechat.png',
  './img/home-bg_opt.jpg',
  './pwa/manifest.json',
  './pwa/icons/128.png',
  './pwa/icons/512.png'
];

const HOSTNAME_WHITELIST = [
  self.location.hostname,
  'huangxuan.me',
  'yanshuo.io',
  'cdnjs.cloudflare.com'
];

const DEPRECATED_CACHES = [
  'precache-v1',
  'runtime',
  'main-precache-v1',
  'main-runtime'
];

const STATIC_DESTINATIONS = new Set(['style', 'script', 'image', 'font']);

const getCacheBustingUrl = (req) => {
  const now = Date.now();
  const url = new URL(req.url);
  url.protocol = self.location.protocol;
  url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;
  return url.href;
};

const isNavigationReq = (req) => {
  const accept = req.headers.get('accept') || '';
  return req.mode === 'navigate' || (req.method === 'GET' && accept.includes('text/html'));
};

const endWithExtension = (req) => Boolean(new URL(req.url).pathname.match(/\.\w+$/));

const shouldRedirect = (req) => (
  isNavigationReq(req)
  && !new URL(req.url).pathname.endsWith('/')
  && !endWithExtension(req)
);

const getRedirectUrl = (req) => {
  const url = new URL(req.url);
  url.pathname += '/';
  return url.href;
};

const isCacheableRequest = (request) => (
  request.method === 'GET'
  && (request.url.startsWith('http://') || request.url.startsWith('https://'))
);

const isStaticAssetRequest = (request) => {
  if (STATIC_DESTINATIONS.has(request.destination)) {
    return true;
  }

  return /\.(?:css|js|png|jpe?g|gif|svg|webp|ico|woff2?|ttf)$/i.test(new URL(request.url).pathname);
};

async function precacheResources() {
  const cache = await caches.open(CACHE);

  await Promise.allSettled(
    PRECACHE_LIST.map(async (asset) => {
      try {
        await cache.add(asset);
      } catch (error) {
        console.warn('Failed to precache asset:', asset, error);
      }
    })
  );
}

async function fetchAndCache(request, cacheKey = request) {
  const response = await fetch(request);

  if (response && response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(cacheKey, response.clone());
  }

  return response;
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  return fetchAndCache(request);
}

// Serve from cache immediately and refresh it in the background, so edits to
// same-origin CSS/JS reach returning visitors on their next page view.
async function staleWhileRevalidate(event, request) {
  const cachedResponse = await caches.match(request);
  const networkResponse = fetchAndCache(request);

  if (cachedResponse) {
    event.waitUntil(networkResponse.catch(() => {}));
    return cachedResponse;
  }

  return networkResponse;
}

async function networkFirst(event, request) {
  const cachedResponsePromise = caches.match(request);

  try {
    const response = await fetch(getCacheBustingUrl(request), { cache: 'no-store' });

    if (response && response.ok) {
      const cachedResponse = await cachedResponsePromise;
      const cache = await caches.open(CACHE);
      event.waitUntil(cache.put(request, response.clone()));

      if (isNavigationReq(request)) {
        event.waitUntil(revalidateContent(cachedResponse, response.clone()));
      }
    }

    return response;
  } catch (error) {
    const cachedResponse = await cachedResponsePromise;
    if (cachedResponse) {
      return cachedResponse;
    }

    if (isNavigationReq(request)) {
      return caches.match(OFFLINE_URL);
    }

    throw error;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    precacheResources().then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    const removableCaches = new Set(DEPRECATED_CACHES);

    cacheNames.forEach((cacheName) => {
      if (cacheName.startsWith(CACHE_NAMESPACE) && cacheName !== CACHE) {
        removableCaches.add(cacheName);
      }
    });

    await Promise.all(Array.from(removableCaches).map((cacheName) => caches.delete(cacheName)));
    console.log('service worker activated.');
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (!isCacheableRequest(request)) {
    return;
  }

  const requestUrl = new URL(request.url);
  if (HOSTNAME_WHITELIST.indexOf(requestUrl.hostname) === -1) {
    return;
  }

  if (shouldRedirect(request)) {
    event.respondWith(Response.redirect(getRedirectUrl(request)));
    return;
  }

  if (requestUrl.hostname === self.location.hostname && /\.(?:css|js)$/i.test(requestUrl.pathname)) {
    event.respondWith(staleWhileRevalidate(event, request));
    return;
  }

  if (request.url.indexOf('ys.static') > -1 || isStaticAssetRequest(request)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // A single network request serves the page and feeds the update check.
  event.respondWith(networkFirst(event, request));
});

function sendMessageToAllClients(msg) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(msg);
    });
  });
}

function sendMessageToClientsAsync(msg) {
  setTimeout(() => {
    sendMessageToAllClients(msg);
  }, 1000);
}

async function revalidateContent(cached, fetched) {
  if (!cached || !fetched) {
    return;
  }

  const cachedVer = cached.headers.get('last-modified');
  const fetchedVer = fetched.headers.get('last-modified');

  if (cachedVer && fetchedVer && cachedVer !== fetchedVer) {
    sendMessageToClientsAsync({
      command: 'UPDATE_FOUND',
      url: fetched.url
    });
  }
}
