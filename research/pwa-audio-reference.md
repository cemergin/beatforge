# PWA Design & Implementation for Audio/Music Applications
## Comprehensive Technical Reference for a Web Drum Machine

---

# PART 1: PWA FUNDAMENTALS

## 1.1 Web App Manifest (manifest.json)

The manifest is a JSON file that tells the browser about your PWA and how it should behave when installed. Link it in your HTML:

```html
<link rel="manifest" href="/manifest.json">
```

### All Fields Reference

**Identity Fields:**
- `name` — Full app name shown in OS launcher, dock, app switcher. Max ~45 chars recommended.
- `short_name` — Truncated name for home screen icon labels. Keep under 12 characters.
- `description` — Summary of app purpose. Shown in install prompts and app stores.
- `id` — Explicit app identity string. Decouples identity from `start_url`, allowing URL changes without breaking installs. Example: `"id": "/?homescreen=1"`
- `categories` — Array of category strings for store listings. Values: `["music", "entertainment", "utilities"]`

**Launch Fields:**
- `start_url` — URL loaded when app launches. Use `"/"` or `"/app"`. Can include query params for analytics: `"/?source=pwa"`
- `scope` — Restricts which URLs the PWA controls. Navigations outside scope open in browser. Example: `"/app/"` means only URLs under `/app/` stay in the PWA window.

**Display Fields:**
- `display` — Controls the app chrome:
  - `"standalone"` — No browser UI. App looks native. **Best for drum machine.**
  - `"fullscreen"` — No browser UI AND no OS status bar. Good for performance mode.
  - `"minimal-ui"` — Small navigation bar retained. Fallback option.
  - `"browser"` — Normal browser tab. Not useful for PWA.
- `display_override` — Array of preferred display modes tried in order before falling back to `display`. Example: `["window-controls-overlay", "standalone"]`
- `orientation` — Lock orientation:
  - `"any"` — Follows device rotation
  - `"portrait"` — Lock portrait (metronome view)
  - `"landscape"` — Lock landscape (grid/sequencer view)
  - `"portrait-primary"`, `"landscape-primary"` — Specific orientations
  - For drum machine: use `"any"` and handle layout responsively

**Color Fields:**
- `theme_color` — Colors the OS title bar, status bar, task switcher preview. Example: `"#1a1a2e"` for dark theme. Also set via meta tag: `<meta name="theme-color" content="#1a1a2e">`
- `background_color` — Splash screen background color while app loads. Should match your app's initial background. Example: `"#0f0f23"`

**Icons Field:**
Array of icon objects. Required sizes for full coverage:

```json
"icons": [
  { "src": "/icons/icon-48.png",   "sizes": "48x48",   "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-72.png",   "sizes": "72x72",   "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-96.png",   "sizes": "96x96",   "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-128.png",  "sizes": "128x128", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-144.png",  "sizes": "144x144", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-152.png",  "sizes": "152x152", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-192.png",  "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-256.png",  "sizes": "256x256", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-384.png",  "sizes": "384x384", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-512.png",  "sizes": "512x512", "type": "image/png", "purpose": "any" },
  { "src": "/icons/maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
  { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]
```

Icon `purpose` values:
- `"any"` — Standard icon, displayed as-is
- `"maskable"` — Adaptive icon (Android). Safe zone is inner 80% circle. Design with padding.
- `"monochrome"` — Single-color icon used with fill color by OS

**Important:** Do NOT use `"purpose": "any maskable"` on the same icon. Maskable icons have extra padding that looks bad when used as regular icons. Provide separate files.

**Shortcuts Field:**
Quick actions from long-pressing the app icon:

```json
"shortcuts": [
  {
    "name": "New Pattern",
    "short_name": "New",
    "description": "Create a new drum pattern",
    "url": "/app/patterns/new?source=shortcut",
    "icons": [{ "src": "/icons/shortcut-new.png", "sizes": "96x96" }]
  },
  {
    "name": "Metronome",
    "short_name": "Metro",
    "description": "Open the metronome",
    "url": "/app/metronome?source=shortcut",
    "icons": [{ "src": "/icons/shortcut-metro.png", "sizes": "96x96" }]
  },
  {
    "name": "My Patterns",
    "short_name": "Patterns",
    "description": "Browse saved patterns",
    "url": "/app/patterns?source=shortcut",
    "icons": [{ "src": "/icons/shortcut-patterns.png", "sizes": "96x96" }]
  }
]
```

**Screenshots Field:**
Shown in the install prompt on Chrome Android (richer install UI):

```json
"screenshots": [
  {
    "src": "/screenshots/desktop-sequencer.png",
    "sizes": "1280x720",
    "type": "image/png",
    "form_factor": "wide",
    "label": "Drum sequencer grid view on desktop"
  },
  {
    "src": "/screenshots/mobile-pads.png",
    "sizes": "750x1334",
    "type": "image/png",
    "form_factor": "narrow",
    "label": "Finger drumming pad view on mobile"
  },
  {
    "src": "/screenshots/mobile-patterns.png",
    "sizes": "750x1334",
    "type": "image/png",
    "form_factor": "narrow",
    "label": "Pattern library with saved beats"
  }
]
```

`form_factor`: `"wide"` for desktop screenshots, `"narrow"` for mobile. Chrome shows the appropriate set during install.

**Related Applications:**

```json
"related_applications": [
  {
    "platform": "play",
    "url": "https://play.google.com/store/apps/details?id=com.beatforge.app",
    "id": "com.beatforge.app"
  }
],
"prefer_related_applications": false
```

Set `prefer_related_applications: false` to promote the PWA over native apps.

**Advanced Manifest Fields:**

```json
"launch_handler": {
  "client_mode": "navigate-existing"
},
"handle_links": "preferred",
"scope_extensions": [
  { "origin": "https://cdn.beatforge.app" }
],
"protocol_handlers": [
  {
    "protocol": "web+beatforge",
    "url": "/app/open?pattern=%s"
  }
],
"file_handlers": [
  {
    "action": "/app/import",
    "accept": {
      "audio/wav": [".wav"],
      "audio/midi": [".mid", ".midi"]
    }
  }
],
"share_target": {
  "action": "/app/share-target",
  "method": "POST",
  "enctype": "multipart/form-data",
  "params": {
    "title": "name",
    "text": "description",
    "url": "link",
    "files": [
      {
        "name": "audio",
        "accept": ["audio/wav", "audio/mp3", "audio/*"]
      }
    ]
  }
}
```

---

## 1.2 Service Workers — Lifecycle

### Registration

```javascript
// main.js — register on page load
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('SW registered, scope:', registration.scope);

      // Check for updates periodically
      setInterval(() => registration.update(), 60 * 60 * 1000); // hourly
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  });
}
```

### Lifecycle Phases

**1. Install Phase** — Fires once when SW is first downloaded (or when sw.js bytes change). Use for precaching the app shell.

```javascript
const CACHE_NAME = 'beatforge-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/app.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()) // Activate immediately, don't wait
  );
});
```

**2. Activate Phase** — Fires after install, when the SW takes control. Use for cache cleanup of old versions.

```javascript
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== 'beatforge-samples-v1')
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim()) // Take control of all open tabs immediately
  );
});
```

**3. Fetch Phase** — Intercepts every network request from controlled pages. Route to different caching strategies.

```javascript
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Route to appropriate strategy
  if (isAppShell(url)) {
    event.respondWith(cacheFirst(event.request));
  } else if (isAudioSample(url)) {
    event.respondWith(cacheFirst(event.request));
  } else if (isAPICall(url)) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
```

### Update Flow

1. Browser checks for updated `sw.js` on navigation (or `registration.update()` call).
2. If bytes differ, new SW installs alongside the old one.
3. New SW enters "waiting" state — old SW still controls pages.
4. When all tabs using old SW close, new SW activates.
5. `skipWaiting()` bypasses the waiting state (use carefully).
6. Communicate update to user:

```javascript
// In main.js — detect waiting SW and prompt user
navigator.serviceWorker.register('/sw.js').then(reg => {
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing;
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New SW waiting — show "Update available" banner
        showUpdateNotification(() => {
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        });
      }
    });
  });
});

// Listen for controller change and reload
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});

// In sw.js — handle skip waiting message
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

---

## 1.3 Caching Strategies

### Cache First (Cache Falling Back to Network)
**Use for:** App shell (HTML, CSS, JS), audio samples, icons, fonts — anything that rarely changes.

```javascript
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}
```

### Network First (Network Falling Back to Cache)
**Use for:** API calls, user data, shared patterns — anything where freshness matters.

```javascript
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### Stale-While-Revalidate
**Use for:** Non-critical assets that should be fast but also fresh — preset libraries, UI assets, documentation.

```javascript
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cached);

  return cached || fetchPromise;
}
```

### Cache Only
**Use for:** Precached assets you know exist — offline fallback page, core app shell.

```javascript
async function cacheOnly(request) {
  return await caches.match(request) || new Response('Not found', { status: 404 });
}
```

### Network Only
**Use for:** Analytics pings, non-cacheable POST requests, real-time collaboration data.

```javascript
async function networkOnly(request) {
  return fetch(request);
}
```

### Strategy Selection Table for Drum Machine

| Asset Type | Strategy | Rationale |
|---|---|---|
| App shell (HTML/CSS/JS) | Cache First | Instant load, update via SW update |
| Audio samples (WAV/MP3) | Cache First | Large files, never change per version |
| User patterns (IndexedDB) | N/A (not via SW) | Stored in IndexedDB, not Cache API |
| Kit preset metadata | Stale-While-Revalidate | Fast load, update in background |
| API calls (auth, share) | Network First | Need freshness, offline fallback |
| Analytics | Network Only | Non-critical, fire-and-forget |
| Fonts | Cache First | Stable, rarely change |
| Images/thumbnails | Stale-While-Revalidate | Fast display, update when possible |

---

## 1.4 Workbox Library

Workbox is Google's library that abstracts service worker boilerplate. Use with build tools (Webpack, Vite, Rollup).

### Installation

```bash
npm install workbox-precaching workbox-routing workbox-strategies workbox-cacheable-response workbox-expiration workbox-background-sync
```

### Workbox Service Worker

```javascript
// sw.js using Workbox
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Precache app shell — injected at build time by workbox-webpack-plugin
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Audio samples — Cache First with size limit
registerRoute(
  ({ request, url }) =>
    request.destination === 'audio' || url.pathname.startsWith('/samples/'),
  new CacheFirst({
    cacheName: 'audio-samples',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 500,        // Max 500 sample files
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        purgeOnQuotaError: true // Drop samples if storage is full
      })
    ]
  })
);

// Kit metadata / preset data — Stale While Revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/kits/') || url.pathname.startsWith('/api/presets/'),
  new StaleWhileRevalidate({
    cacheName: 'kit-metadata',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 })
    ]
  })
);

// User API calls — Network First
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-responses',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
);

// Background sync for pattern sharing/export
const bgSyncPlugin = new BackgroundSyncPlugin('share-queue', {
  maxRetentionTime: 24 * 60 // Retry for 24 hours
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/share') || url.pathname.startsWith('/api/export'),
  new NetworkFirst({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);

// Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts'
  })
);
```

### Vite Integration (vite-plugin-pwa)

```javascript
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      registerType: 'prompt', // Show update prompt to user
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/samples\/.*\.(wav|mp3|ogg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-samples',
              expiration: { maxEntries: 500, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true // Important for audio seeking
            }
          }
        ]
      },
      manifest: {
        // ... manifest fields here
      }
    })
  ]
};
```

---

## 1.5 Install Experience

### Install Criteria (Chromium Browsers)
1. Valid `manifest.json` linked from HTML with `name`/`short_name`, `start_url`, `display` (standalone/fullscreen/minimal-ui), and 192x192 + 512x512 icons
2. Registered service worker with a fetch handler
3. Served over HTTPS (or localhost)
4. User engagement heuristic (Chrome: interacted with domain for at least 30 seconds)

### Custom Install Button

```javascript
// install-prompt.js
let deferredPrompt = null;
const installButton = document.getElementById('install-button');
const installBanner = document.getElementById('install-banner');

// Capture the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // Prevent the default mini-infobar
  deferredPrompt = e;
  installBanner.style.display = 'flex'; // Show your custom UI
});

// Handle install button click
installButton.addEventListener('click', async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt(); // Show the browser install dialog
  const result = await deferredPrompt.userChoice;

  console.log('Install result:', result.outcome); // 'accepted' or 'dismissed'
  deferredPrompt = null;
  installBanner.style.display = 'none';
});

// Detect successful installation
window.addEventListener('appinstalled', () => {
  installBanner.style.display = 'none';
  deferredPrompt = null;
  console.log('PWA installed');
  // Track installation analytics
});

// Detect if already running as installed PWA
function isInstalledPWA() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true; // Safari iOS
}

if (isInstalledPWA()) {
  installBanner.style.display = 'none';
}
```

**Important:** `beforeinstallprompt` is Chromium-only. Safari iOS uses "Add to Home Screen" from the share menu — you cannot trigger it programmatically. Show instructional UI for Safari users instead.

---

## 1.6 App Shell Architecture

The app shell is the minimal HTML, CSS, and JS needed to render the UI skeleton. Cache it during SW install for instant subsequent loads.

**What to include in app shell for a drum machine:**
- `index.html` — Single page with loading skeleton
- `app.css` — Core styles, grid layout, pad styles
- `app.js` — Main bundle (or critical chunk)
- Manifest + icons
- Fonts (woff2)
- SVG icons/sprites for transport controls, UI elements

**What NOT to include in app shell:**
- Audio samples (cache separately, on-demand or lazy)
- User data (IndexedDB)
- Non-critical JS (sound design panel, song mode, export — lazy load)
- Full kit libraries

```html
<!-- index.html with inline critical CSS for instant skeleton -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#1a1a2e" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/icons/icon-192.png">
  <title>BeatForge</title>
  <style>
    /* Inline critical CSS — loading skeleton */
    :root { --bg: #0f0f23; --surface: #1a1a2e; --accent: #e94560; }
    body { margin: 0; background: var(--bg); color: #fff; font-family: system-ui; }
    .app-skeleton { display: grid; height: 100dvh; grid-template-rows: 48px 1fr 64px; }
    .skeleton-header { background: var(--surface); }
    .skeleton-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 8px; }
    .skeleton-pad { background: var(--surface); border-radius: 8px; aspect-ratio: 1; }
    .skeleton-transport { background: var(--surface); }
  </style>
</head>
<body>
  <div id="app" class="app-skeleton">
    <div class="skeleton-header"></div>
    <div class="skeleton-grid">
      <!-- 16 placeholder pads -->
      <div class="skeleton-pad"></div><div class="skeleton-pad"></div>
      <div class="skeleton-pad"></div><div class="skeleton-pad"></div>
      <div class="skeleton-pad"></div><div class="skeleton-pad"></div>
      <div class="skeleton-pad"></div><div class="skeleton-pad"></div>
      <div class="skeleton-pad"></div><div class="skeleton-pad"></div>
      <div class="skeleton-pad"></div><div class="skeleton-pad"></div>
      <div class="skeleton-pad"></div><div class="skeleton-pad"></div>
      <div class="skeleton-pad"></div><div class="skeleton-pad"></div>
    </div>
    <div class="skeleton-transport"></div>
  </div>
  <script type="module" src="/app.js"></script>
</body>
</html>
```

---

# PART 2: OFFLINE CAPABILITY FOR AUDIO APPS

## 2.1 Caching Audio Samples

Audio samples are the largest assets in a drum machine. Strategy: precache the default kit, lazy-cache additional kits on first use.

```javascript
// In service worker — precache default kit during install
const DEFAULT_KIT_SAMPLES = [
  '/samples/default/kick.wav',
  '/samples/default/snare.wav',
  '/samples/default/hihat-closed.wav',
  '/samples/default/hihat-open.wav',
  '/samples/default/clap.wav',
  '/samples/default/tom-hi.wav',
  '/samples/default/tom-lo.wav',
  '/samples/default/ride.wav',
  '/samples/default/crash.wav',
  '/samples/default/perc1.wav',
  '/samples/default/perc2.wav',
  '/samples/default/cowbell.wav',
  '/samples/default/shaker.wav',
  '/samples/default/rim.wav',
  '/samples/default/snap.wav',
  '/samples/default/conga.wav'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open('app-shell-v1').then(c => c.addAll(APP_SHELL)),
      caches.open('audio-samples-v1').then(c => c.addAll(DEFAULT_KIT_SAMPLES))
    ])
  );
});
```

**Lazy-caching additional kits from the main app:**

```javascript
// kit-loader.js — in the main thread
async function loadKit(kitName) {
  const manifest = await fetch(`/kits/${kitName}/manifest.json`).then(r => r.json());
  const sampleUrls = manifest.samples.map(s => `/kits/${kitName}/${s.file}`);

  // Pre-cache all samples in this kit
  const cache = await caches.open('audio-samples-v1');
  const uncached = [];

  for (const url of sampleUrls) {
    const existing = await cache.match(url);
    if (!existing) uncached.push(url);
  }

  if (uncached.length > 0) {
    // Show progress bar for download
    let loaded = 0;
    await Promise.all(uncached.map(async (url) => {
      const response = await fetch(url);
      await cache.put(url, response);
      loaded++;
      updateProgress(loaded / uncached.length);
    }));
  }

  // Now decode audio buffers from cache
  return Promise.all(sampleUrls.map(url => loadAudioBuffer(url)));
}

async function loadAudioBuffer(url) {
  const cache = await caches.open('audio-samples-v1');
  const response = await cache.match(url) || await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}
```

**Audio format considerations:**
- **WAV** — Uncompressed, zero decode latency, large files (1-5MB per sample). Best for drum hits.
- **MP3** — Compressed, ~90% smaller, has decode latency and padding issues. Avoid for precise drum hits.
- **OGG Vorbis** — Good compression, no patent issues, but no Safari support.
- **WebM/Opus** — Best compression quality, but not supported on Safari/iOS.
- **Recommendation:** Ship WAV for drum hits (short files, decode speed matters). Use MP3/Opus for longer samples like loops, with WAV fallback.

---

## 2.2 IndexedDB for Pattern/Kit Storage

IndexedDB is the right tool for storing structured user data: patterns, kit configurations, user preferences, custom samples.

### Dexie.js Setup

```bash
npm install dexie
```

```javascript
// db.js
import Dexie from 'dexie';

export const db = new Dexie('BeatForgeDB');

db.version(1).stores({
  // Primary key is ++id (auto-increment), indexed fields after comma
  patterns: '++id, name, kitId, bpm, createdAt, updatedAt, [kitId+name]',
  kits: '++id, name, category, isBuiltIn, isDownloaded',
  samples: '++id, kitId, name, padIndex, [kitId+padIndex]',
  settings: 'key', // Key-value store for app settings
  exportQueue: '++id, type, status, createdAt' // For background sync
});

// Version migration example
db.version(2).stores({
  patterns: '++id, name, kitId, bpm, createdAt, updatedAt, tags, [kitId+name]',
  kits: '++id, name, category, isBuiltIn, isDownloaded',
  samples: '++id, kitId, name, padIndex, [kitId+padIndex]',
  settings: 'key',
  exportQueue: '++id, type, status, createdAt',
  songArrangements: '++id, name, patternIds, createdAt'
}).upgrade(tx => {
  return tx.table('patterns').toCollection().modify(pattern => {
    pattern.tags = pattern.tags || [];
  });
});
```

### CRUD Operations

```javascript
// Pattern operations
export async function savePattern(pattern) {
  const now = Date.now();
  return db.patterns.put({
    ...pattern,
    updatedAt: now,
    createdAt: pattern.createdAt || now
  });
}

export async function getPattern(id) {
  return db.patterns.get(id);
}

export async function getAllPatterns() {
  return db.patterns.orderBy('updatedAt').reverse().toArray();
}

export async function getPatternsByKit(kitId) {
  return db.patterns.where('kitId').equals(kitId).toArray();
}

export async function deletePattern(id) {
  return db.patterns.delete(id);
}

// Store audio data as Blob in IndexedDB
export async function storeSampleBlob(kitId, padIndex, name, audioBlob) {
  return db.samples.put({ kitId, padIndex, name, audioBlob });
}

export async function getSampleBlob(kitId, padIndex) {
  return db.samples.where('[kitId+padIndex]').equals([kitId, padIndex]).first();
}

// Settings
export async function setSetting(key, value) {
  return db.settings.put({ key, value });
}

export async function getSetting(key, defaultValue) {
  const record = await db.settings.get(key);
  return record?.value ?? defaultValue;
}
```

### Pattern Data Structure

```javascript
// Example pattern object stored in IndexedDB
const examplePattern = {
  id: 1,
  name: "Boom Bap Beat",
  kitId: 1,
  bpm: 90,
  swing: 0.15,          // 0 to 0.5
  stepsPerBar: 16,
  bars: 2,
  timeSignature: [4, 4],
  tracks: [
    {
      padIndex: 0,
      name: "Kick",
      steps: [1,0,0,0, 0,0,0,0, 1,0,1,0, 0,0,0,0,  // bar 1
              1,0,0,0, 0,0,0,0, 1,0,1,0, 0,0,0,0], // bar 2
      velocity: [0.9,0,0,0, 0,0,0,0, 0.7,0,0.8,0, 0,0,0,0,
                 0.9,0,0,0, 0,0,0,0, 0.7,0,0.8,0, 0,0,0,0],
      muted: false,
      volume: 0.8,
      pan: 0
    },
    {
      padIndex: 1,
      name: "Snare",
      steps: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0,
              0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
      velocity: [0,0,0,0, 1,0,0,0, 0,0,0,0, 0.9,0,0,0,
                 0,0,0,0, 1,0,0,0, 0,0,0,0, 0.9,0,0,0.5],
      muted: false,
      volume: 0.75,
      pan: 0
    }
    // ... more tracks
  ],
  tags: ["hip-hop", "boom-bap"],
  createdAt: 1709251200000,
  updatedAt: 1709337600000
};
```

---

## 2.3 Cache Storage Limits by Browser

| Browser | Per-Origin Limit | Total Limit | Notes |
|---|---|---|---|
| Chrome | 60% of total disk | 80% of disk | Generous. 256GB disk = ~153GB per origin |
| Edge | 60% of total disk | 80% of disk | Same as Chrome (Chromium-based) |
| Firefox | 10% of total disk (up to 10GB) | 50% of disk | More conservative per-origin |
| Safari (macOS) | ~1GB | Varies | Prompts user after 1GB |
| Safari (iOS) | ~50MB cache, larger IndexedDB | Varies | Aggressive eviction if unused 7+ days |
| Safari 17+ (iOS) | Up to 60% of disk per origin | 80% total | Improved, but still evicts aggressively |

**Critical iOS Caveat:** Even with improved Safari 17+ quotas, iOS aggressively evicts PWA storage if the app hasn't been used in approximately 7 days. This is the single biggest threat to an offline audio app on iOS.

---

## 2.4 Persistent Storage API

Request persistent storage to prevent the browser from evicting your cached data:

```javascript
async function requestPersistentStorage() {
  if (!navigator.storage?.persist) {
    console.warn('Persistent Storage API not supported');
    return false;
  }

  // Check if already persistent
  const isPersisted = await navigator.storage.persisted();
  if (isPersisted) {
    console.log('Storage is already persistent');
    return true;
  }

  // Request persistence — browser may auto-grant for installed PWAs
  const granted = await navigator.storage.persist();
  if (granted) {
    console.log('Persistent storage granted');
  } else {
    console.warn('Persistent storage denied — data may be evicted');
    // Show user a warning about potential data loss
  }
  return granted;
}
```

**When is it auto-granted?**
- Chrome: Typically grants for installed PWAs, sites with push notification permission, or bookmarked sites
- Firefox: Prompts the user
- Safari: Supports `navigator.storage.persist()` since Safari 17, but behavior is less predictable

---

## 2.5 Storage Estimation

Show users how much space they're using and how much is available:

```javascript
async function getStorageInfo() {
  if (!navigator.storage?.estimate) {
    return null;
  }

  const estimate = await navigator.storage.estimate();
  const usedMB = (estimate.usage / (1024 * 1024)).toFixed(1);
  const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(0);
  const percentUsed = ((estimate.usage / estimate.quota) * 100).toFixed(1);

  return {
    usedMB,
    quotaMB,
    percentUsed,
    usedFormatted: `${usedMB} MB`,
    quotaFormatted: `${quotaMB} MB`,
    hasSpace: estimate.usage < estimate.quota * 0.9 // Warn at 90%
  };

  // Note: estimate.usageDetails (deprecated) used to break down by cache name.
  // Now only total usage is available.
}

// Display in settings panel
async function showStorageUI() {
  const info = await getStorageInfo();
  if (!info) return;

  document.getElementById('storage-bar').style.width = `${info.percentUsed}%`;
  document.getElementById('storage-text').textContent =
    `${info.usedFormatted} of ${info.quotaFormatted} used`;

  if (!info.hasSpace) {
    showWarning('Storage nearly full. Consider deleting unused kits.');
  }
}
```

---

## 2.6 Offline-First Architecture

The drum machine should work 100% offline after first load. Architecture:

```
┌─────────────────────────────────────────────┐
│                  UI Layer                     │
│   Sequencer Grid | Pads | Transport | Mixer  │
└─────────────┬───────────────────┬────────────┘
              │                   │
    ┌─────────▼─────────┐  ┌─────▼──────────┐
    │   Audio Engine     │  │   State Manager │
    │   (Web Audio API)  │  │   (In-memory)   │
    │   - AudioContext   │  │   - Current BPM  │
    │   - Sample buffers │  │   - Playing state │
    │   - Scheduling     │  │   - Current pattern│
    └─────────┬─────────┘  └─────┬───────────┘
              │                   │
    ┌─────────▼─────────┐  ┌─────▼──────────┐
    │   Cache API        │  │   IndexedDB     │
    │   (via SW)         │  │   (via Dexie)   │
    │   - App shell      │  │   - Patterns     │
    │   - Audio files    │  │   - Kit configs   │
    │   - Kit manifests  │  │   - User settings │
    │   - Fonts/icons    │  │   - Custom samples│
    └───────────────────┘  └─────────────────┘
              │                   │
    ┌─────────▼───────────────────▼──────────┐
    │          Network Layer (Optional)        │
    │   - Fetch new kits                       │
    │   - Share patterns                       │
    │   - Sync to cloud                        │
    │   - Background sync queue                │
    └─────────────────────────────────────────┘
```

**Key principle:** The network is an enhancement, not a dependency. Every feature works offline. Network adds: new kits, sharing, cloud backup.

---

## 2.7 Background Sync

Queue operations that need network for when connectivity returns:

```javascript
// In main app — queue a share operation
async function sharePattern(pattern) {
  if (navigator.onLine) {
    try {
      await fetch('/api/share', {
        method: 'POST',
        body: JSON.stringify(pattern),
        headers: { 'Content-Type': 'application/json' }
      });
      return { success: true };
    } catch (e) {
      // Fall through to queue
    }
  }

  // Queue for background sync
  const reg = await navigator.serviceWorker.ready;
  if ('sync' in reg) {
    // Store the data in IndexedDB for the SW to find later
    await db.exportQueue.add({
      type: 'share',
      data: pattern,
      status: 'pending',
      createdAt: Date.now()
    });
    await reg.sync.register('share-pattern');
    return { success: true, queued: true };
  }

  return { success: false, error: 'offline' };
}

// In service worker — handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'share-pattern') {
    event.waitUntil(processShareQueue());
  }
});

async function processShareQueue() {
  // Open Dexie directly from SW is possible but you need importScripts or
  // use the raw IndexedDB API. Workbox BackgroundSyncPlugin is easier.
  const db = await openDB();
  const pending = await db.getAll('exportQueue', IDBKeyRange.only('pending'));

  for (const item of pending) {
    try {
      await fetch('/api/share', {
        method: 'POST',
        body: JSON.stringify(item.data),
        headers: { 'Content-Type': 'application/json' }
      });
      await db.delete('exportQueue', item.id);
    } catch (e) {
      // Will retry on next sync event
      throw e; // Re-throw to signal failure, browser will retry
    }
  }
}
```

**Browser support:** Chrome, Edge, and Android browsers support Background Sync. Safari and Firefox do NOT.

---

## 2.8 Periodic Background Sync

For syncing updated kit libraries or shared patterns in the background:

```javascript
// Register periodic sync (Chromium only, installed PWAs only)
async function registerPeriodicSync() {
  const reg = await navigator.serviceWorker.ready;

  if (!('periodicSync' in reg)) {
    console.log('Periodic Background Sync not supported');
    return;
  }

  try {
    await reg.periodicSync.register('sync-kit-library', {
      minInterval: 24 * 60 * 60 * 1000 // Once per day minimum
    });
  } catch (e) {
    console.log('Periodic sync registration failed:', e);
    // Browser may deny based on engagement score
  }
}

// In service worker
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-kit-library') {
    event.waitUntil(updateKitLibrary());
  }
});

async function updateKitLibrary() {
  try {
    const response = await fetch('/api/kits/updates?since=' + lastSyncTimestamp);
    const updates = await response.json();
    // Store updated kit metadata in IndexedDB
    // Pre-cache any new free sample packs
  } catch (e) {
    // Silent failure is fine for periodic sync
  }
}
```

**Important limitations:**
- Chromium-only (Chrome, Edge)
- PWA must be installed
- Browser controls actual interval based on site engagement (user rarely opens app = less frequent sync)
- Not available on iOS or Firefox

---

# PART 3: AUDIO-SPECIFIC PWA CHALLENGES

## 3.1 AudioContext and Service Workers

**Critical fact:** Service workers cannot access `AudioContext` or any Web Audio API. Audio processing runs entirely in the main thread (or Audio Worklets). The service worker's only role with audio is caching the sample files via the Cache API.

```
Service Worker scope:       Main Page scope:
┌──────────────────┐       ┌──────────────────────────┐
│ - Cache API      │       │ - AudioContext            │
│ - Fetch events   │       │ - AudioBufferSourceNode   │
│ - Background Sync│       │ - GainNode, BiquadFilter  │
│ - Push events    │       │ - Audio Worklets          │
│                  │       │ - MediaSession API        │
│ NO AudioContext  │       │ - analyserNode            │
│ NO DOM           │       │ - DOM / Canvas / WebGL    │
│ NO Web Audio     │       │                           │
└──────────────────┘       └──────────────────────────┘
      ↕ Cache API                    ↕
┌──────────────────────────────────────────────┐
│              Cache Storage                    │
│  (audio files stored as Response objects)     │
└──────────────────────────────────────────────┘
```

**Workflow:** SW caches audio files -> Main thread fetches from cache -> `decodeAudioData()` -> play via Web Audio.

---

## 3.2 Web Audio in Standalone Mode

There are **no functional differences** in Web Audio API behavior between a PWA running in standalone mode vs a browser tab. The same rendering engine and audio subsystem are used. Both share:
- Same `AudioContext` implementation
- Same latency characteristics
- Same `baseLatency` and `outputLatency` values
- Same buffer size options
- Same Audio Worklet support

The only differences are UI-level:
- No browser address bar (more screen real estate for pads/grid)
- No browser back/forward buttons
- Different task-switcher appearance
- Media Session integration may be more prominent in standalone mode

---

## 3.3 iOS Safari PWA Audio Quirks

This is the most problematic platform for audio PWAs. Known issues:

**1. AudioContext Resume Requirement:**
iOS requires a user gesture to resume/create an AudioContext. This applies to both Safari and standalone PWAs.

```javascript
// Must be called from a user gesture (click/touch)
async function initAudio() {
  if (!audioContext) {
    audioContext = new AudioContext({ latencyHint: 'interactive' });
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
}

// Attach to first user interaction
document.addEventListener('touchstart', initAudio, { once: true });
document.addEventListener('click', initAudio, { once: true });
```

**2. Background Audio Stops:**
When a standalone PWA is minimized or the screen locks on iOS, audio playback STOPS. This is because iOS suspends the PWA process. This is a long-standing WebKit bug (Bug 198277) that has never been fully resolved.

**Workaround (partial):** Use a silent `<audio>` element alongside Web Audio. The Media Session API (experimental in Safari) may help the OS keep audio alive.

```javascript
// Create a silent audio element to try to keep the audio session alive
const silentAudio = document.createElement('audio');
silentAudio.src = '/audio/silence.mp3'; // 1-second silent MP3, looping
silentAudio.loop = true;
silentAudio.volume = 0.01; // Near-silent
// Play this alongside your Web Audio output when performing

// This is NOT guaranteed to work on iOS in standalone mode.
// Background audio on iOS PWAs remains unreliable.
```

**3. Silent/Ring Switch:**
If the iOS physical silent switch is on, Web Audio output is silenced by default. The silent `<audio>` element trick above also helps here — once a media element plays, it "claims" the audio session and Web Audio output follows.

**4. Audio Session Category:**
iOS categorizes audio sessions. PWA audio defaults to "ambient" (respects silent switch, mixes with other audio). Playing a media element switches to "playback" category (ignores silent switch).

**5. Sample Rate Mismatch:**
iOS AudioContext may use 48000Hz while your samples are 44100Hz. Always check and resample if needed, or set context sample rate:

```javascript
const audioContext = new AudioContext({
  latencyHint: 'interactive',
  sampleRate: 44100  // Match your sample files
});
```

---

## 3.4 Android PWA Audio

Android handles audio far better than iOS for PWAs:

**Background Playback:** Works reliably when using Media Session API. The browser creates a foreground notification that keeps the audio process alive.

**Wake Lock:** Full `navigator.wakeLock` support to keep screen on during practice.

**Notification Controls:** Media Session metadata and action handlers appear in the notification shade automatically.

**Latency:** Android Chrome supports `latencyHint: 'interactive'` and can achieve ~10-20ms output latency on modern devices. Some Android devices support `latencyHint: 'playback'` for even lower latency paths.

---

## 3.5 Media Session API

Display "Now Playing" info and handle lock screen controls:

```javascript
function updateMediaSession(patternName, kitName, bpm, isPlaying) {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: patternName || 'BeatForge',
    artist: `${bpm} BPM`,
    album: kitName || 'Drum Machine',
    artwork: [
      { src: '/icons/icon-96.png',  sizes: '96x96',   type: 'image/png' },
      { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-256.png', sizes: '256x256', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  });

  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

  // Transport controls
  navigator.mediaSession.setActionHandler('play', () => {
    transport.play();
    navigator.mediaSession.playbackState = 'playing';
  });

  navigator.mediaSession.setActionHandler('pause', () => {
    transport.pause();
    navigator.mediaSession.playbackState = 'paused';
  });

  navigator.mediaSession.setActionHandler('stop', () => {
    transport.stop();
    navigator.mediaSession.playbackState = 'paused';
  });

  // Use seek controls for tempo adjustment
  navigator.mediaSession.setActionHandler('seekforward', () => {
    transport.setBPM(transport.bpm + 5); // +5 BPM
    updateMediaSession(patternName, kitName, transport.bpm, true);
  });

  navigator.mediaSession.setActionHandler('seekbackward', () => {
    transport.setBPM(transport.bpm - 5); // -5 BPM
    updateMediaSession(patternName, kitName, transport.bpm, true);
  });

  // Previous/next for switching patterns
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    transport.previousPattern();
  });

  navigator.mediaSession.setActionHandler('nexttrack', () => {
    transport.nextPattern();
  });
}
```

**Important for background audio on Android:** You need an actual `<audio>` element playing (even silence) for Media Session to work properly. Web Audio alone may not be enough to trigger the media notification.

```javascript
// Create a silent audio context bridge
function createMediaSessionBridge() {
  const oscillator = audioContext.createOscillator();
  const dest = audioContext.createMediaStreamDestination();
  oscillator.connect(dest);
  oscillator.start();

  const audio = document.createElement('audio');
  audio.srcObject = dest.stream;
  audio.play();

  return audio; // Keep reference to prevent GC
}
```

---

## 3.6 Screen Wake Lock API

Keep screen on during drumming practice or live performance:

```javascript
class WakeLockManager {
  constructor() {
    this.wakeLock = null;
    this.isSupported = 'wakeLock' in navigator;
  }

  async acquire() {
    if (!this.isSupported) return false;

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.wakeLock.addEventListener('release', () => {
        console.log('Wake lock released');
        this.wakeLock = null;
      });

      // Re-acquire on visibility change (lock is auto-released when tab hidden)
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible' && !this.wakeLock) {
          await this.acquire();
        }
      });

      return true;
    } catch (err) {
      // Fails if: low battery, power save mode, page not visible
      console.warn('Wake lock failed:', err);
      return false;
    }
  }

  async release() {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  get isActive() {
    return this.wakeLock !== null;
  }
}

// Usage: acquire when playing, release when stopped
const wakeLock = new WakeLockManager();

function onPlay() {
  wakeLock.acquire();
}

function onStop() {
  wakeLock.release();
}
```

**Browser support:** Chrome 84+, Edge 84+, Safari 16.4+ (including iOS standalone PWAs as of Safari 18.4). Firefox: not yet.

**iOS standalone note:** WebKit Bug 254545 previously prevented wake lock in standalone PWAs. This was fixed in Safari 18.4 (2025).

---

## 3.7 Background Audio

**Can a PWA drum machine keep playing when minimized?**

| Platform | Background Audio | Method |
|---|---|---|
| Android Chrome PWA | YES | Media Session API + `<audio>` element |
| Desktop Chrome/Edge PWA | YES | Works by default (not suspended) |
| iOS Safari PWA | NO (unreliable) | Process suspended. Silent audio trick may help briefly |
| iOS Safari Tab | PARTIAL | Better than standalone — tab stays alive longer |

**Android implementation:**

```javascript
// The key trick: connect Web Audio output to a MediaStream,
// attach to an <audio> element, so the browser sees "media playing"
// and creates a foreground notification.

function enableBackgroundPlayback() {
  const dest = audioContext.createMediaStreamDestination();
  masterGain.connect(dest); // Connect your master output

  const audioElement = document.createElement('audio');
  audioElement.srcObject = dest.stream;
  audioElement.play();

  // Now set up Media Session for controls
  updateMediaSession('My Beat', 'TR-808', 120, true);
}
```

---

## 3.8 Latency: PWA vs Browser Tab

**There is no measurable latency difference** between a PWA in standalone mode and the same app in a browser tab. Both use the same browser engine and audio subsystem. The `AudioContext.baseLatency` and `AudioContext.outputLatency` values are identical.

Typical latency values:
- **Desktop Chrome:** ~5-10ms baseLatency (128-256 sample buffer at 44.1kHz)
- **Android Chrome:** ~10-20ms with `latencyHint: 'interactive'`
- **iOS Safari:** ~20-40ms (higher due to mandatory buffer sizes)

To minimize latency for a drum machine:

```javascript
const audioContext = new AudioContext({
  latencyHint: 'interactive', // Request lowest latency
  sampleRate: 44100
});

// Check actual latency
console.log('Base latency:', audioContext.baseLatency, 'seconds');
console.log('Output latency:', audioContext.outputLatency, 'seconds');
console.log('Total latency:', audioContext.baseLatency + audioContext.outputLatency, 'seconds');
```

---

# PART 4: PWA UX BEST PRACTICES

## 4.1 Splash Screen

The splash screen is auto-generated from manifest fields:
- `background_color` — fill color
- `theme_color` — status bar color
- `icons` — centered icon (largest appropriate size)
- `name` — displayed below icon

You cannot customize the splash screen layout beyond these fields (Chromium). For a polished look:
- Ensure `background_color` matches your app's background
- Use a clean, recognizable icon at 512x512
- Keep `name` short

**iOS specific:** Safari generates splash screens from `apple-touch-startup-image` link tags, not the manifest. You must provide images for every device size:

```html
<!-- Generated splash screens for iOS — use a tool like pwa-asset-generator -->
<link rel="apple-touch-startup-image"
  href="/splash/apple-splash-2048-2732.jpg"
  media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image"
  href="/splash/apple-splash-1170-2532.jpg"
  media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)">
<!-- ... many more sizes -->
```

Tool: `npx pwa-asset-generator ./logo.png ./splash --splash-only`

---

## 4.2 Status Bar Theming

```html
<!-- Light/dark responsive theme color -->
<meta name="theme-color" content="#1a1a2e" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f8f9fa" media="(prefers-color-scheme: light)">

<!-- iOS status bar -->
<meta name="apple-mobile-web-app-capable" content="yes">
<!-- Options: default, black, black-translucent -->
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

`black-translucent` makes the status bar transparent and overlays your content — best for immersive audio apps. Your content will need to account for the status bar height via safe area insets.

**Dynamic theme color changes** (e.g., change color per kit):

```javascript
function setThemeColor(color) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}
```

---

## 4.3 Navigation in Standalone Mode

In standalone mode, there's no browser back button. You must provide your own navigation:

```javascript
// Handle back navigation
window.addEventListener('popstate', (event) => {
  // Handle your app's routing
  navigateTo(event.state?.path || '/');
});

// Programmatic navigation
function navigateTo(path) {
  history.pushState({ path }, '', path);
  renderView(path);
}

// Swipe-back gesture (especially important on iOS)
// iOS standalone mode already supports edge-swipe-back natively.
// On Android, you need to handle it yourself or use the
// navigation API.
```

**Navigation patterns for a drum machine:**
- Tab bar at bottom: Sequencer | Pads | Mixer | Patterns | Settings
- Swipe between views (horizontal)
- Modal for sound design/sample editing (slide up)
- No deep hierarchical navigation — keep it flat

---

## 4.4 Fullscreen Mode

For live performance, maximize screen real estate:

```javascript
async function enterFullscreen() {
  try {
    await document.documentElement.requestFullscreen();
  } catch (e) {
    console.log('Fullscreen not available:', e);
  }
}

function exitFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
}

// Toggle with a button or double-tap gesture
document.addEventListener('fullscreenchange', () => {
  const isFullscreen = !!document.fullscreenElement;
  document.body.classList.toggle('fullscreen-mode', isFullscreen);
});
```

**Note:** `display: "fullscreen"` in manifest makes the app ALWAYS fullscreen (no status bar). For a drum machine, `"standalone"` with an optional fullscreen toggle is more practical — users need to see the clock, battery, etc.

---

## 4.5 Orientation Lock

The manifest `orientation` field locks orientation on install. For dynamic control at runtime:

```javascript
// Lock to landscape for wide sequencer grid
async function lockLandscape() {
  try {
    await screen.orientation.lock('landscape');
  } catch (e) {
    console.log('Orientation lock not supported:', e);
  }
}

// Unlock
function unlockOrientation() {
  screen.orientation.unlock();
}

// Respond to orientation changes
screen.orientation.addEventListener('change', () => {
  const isLandscape = screen.orientation.type.startsWith('landscape');
  if (isLandscape) {
    showSequencerGrid(); // Wide layout
  } else {
    showPadView(); // Tall layout
  }
});
```

**Support:** Chrome Android supports `screen.orientation.lock()`. iOS Safari does NOT — you must handle both orientations responsively.

---

## 4.6 Touch Event Handling

No significant differences in touch behavior between standalone and browser tab. Key considerations for drum pads:

```javascript
// Prevent default touch behaviors on the pad area
const padContainer = document.getElementById('pad-grid');

padContainer.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevent scrolling, zooming, text selection
  handlePadHit(e);
}, { passive: false });

// Use pointer events for unified mouse + touch
padContainer.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const pad = e.target.closest('.pad');
  if (pad) {
    triggerSample(pad.dataset.padIndex, e.pressure || 1);
    pad.classList.add('active');
    pad.setPointerCapture(e.pointerId);
  }
});

padContainer.addEventListener('pointerup', (e) => {
  const pad = e.target.closest('.pad');
  if (pad) pad.classList.remove('active');
});

// Disable context menu on long press
padContainer.addEventListener('contextmenu', e => e.preventDefault());
```

**Prevent double-tap zoom on pads:**

```css
.pad {
  touch-action: manipulation; /* Disables double-tap zoom */
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
```

---

## 4.7 Safe Area Insets

Handle notches, rounded corners, and home indicators:

```html
<!-- Enable full-screen rendering behind notches -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

```css
/* Base layout respecting safe areas */
:root {
  --sat: env(safe-area-inset-top);
  --sar: env(safe-area-inset-right);
  --sab: env(safe-area-inset-bottom);
  --sal: env(safe-area-inset-left);
}

/* App header — avoid notch/status bar overlap */
.app-header {
  padding-top: calc(var(--sat) + 8px);
  padding-left: calc(var(--sal) + 16px);
  padding-right: calc(var(--sar) + 16px);
}

/* Bottom transport bar — avoid home indicator */
.transport-bar {
  padding-bottom: calc(var(--sab) + 8px);
  padding-left: calc(var(--sal) + 16px);
  padding-right: calc(var(--sar) + 16px);
}

/* Full-bleed background that extends behind insets */
body {
  background: var(--bg);
  /* The background extends behind status bar and home indicator */
}

/* Fixed bottom elements */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 4.8 Viewport Management

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

- `viewport-fit=cover` — extends content behind notches/status bar
- `user-scalable=no` — prevents pinch zoom (important for instrument UI)
- `maximum-scale=1.0` — prevents double-tap zoom on older browsers

**Prevent pull-to-refresh (standalone mode):**

```css
body {
  overscroll-behavior-y: contain;
}
```

**Handle virtual keyboard (if you have BPM input fields):**

```javascript
// Detect virtual keyboard opening
if ('virtualKeyboard' in navigator) {
  navigator.virtualKeyboard.overlaysContent = true;

  navigator.virtualKeyboard.addEventListener('geometrychange', () => {
    const { height } = navigator.virtualKeyboard.boundingRect;
    document.body.style.paddingBottom = `${height}px`;
  });
}
```

**Use `100dvh` not `100vh`:**

```css
.app-container {
  height: 100dvh; /* Dynamic viewport height — accounts for browser chrome and virtual keyboard */
  /* NOT 100vh which doesn't account for mobile browser URL bar */
}
```

---

# PART 5: INSTALLATION & DISTRIBUTION

## 5.1 Chrome/Edge Install Flow

**Desktop:**
- Install icon appears in address bar (omnibox)
- Or: three-dot menu > "Install BeatForge..."
- Creates a desktop shortcut and standalone window
- App appears in OS app launcher, taskbar, Alt+Tab

**Mobile (Android):**
- "Add to Home Screen" banner (automatic, or custom prompt)
- Or: three-dot menu > "Add to Home Screen" / "Install app"
- Creates home screen icon
- Appears in app drawer, Recent Apps
- If screenshots are in manifest, shows richer install dialog

---

## 5.2 Safari "Add to Home Screen"

**Limitations vs Chrome PWA:**
- No `beforeinstallprompt` event — cannot trigger programmatically
- Must use Share button > "Add to Home Screen" manually
- No install criteria validation (no minimum engagement)
- Service worker scope and caching work, but with iOS eviction issues
- No push notifications prior to iOS 16.4
- No Background Sync
- No Periodic Background Sync
- Storage is aggressively evicted after ~7 days of non-use
- Each PWA instance gets its own separate storage (no sharing with Safari)
- Links from other apps always open in Safari, not the PWA (no deep linking / URL handling)

**Show installation instructions for Safari users:**

```javascript
function showSafariInstallInstructions() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (isIOS && !isInstalledPWA()) {
    showModal({
      title: 'Install BeatForge',
      body: 'Tap the Share button (□↑), then tap "Add to Home Screen"',
      icon: '/icons/ios-share-icon.svg'
    });
  }
}
```

---

## 5.3 Firefox PWA Support

**History:** Firefox removed desktop PWA support (site-specific browsers) in late 2020.

**2025 Update:** Firefox 143.0 (September 2025) re-introduced PWA support on Windows as an experimental feature. Mozilla is actively working on expanding this.

**Mobile:** Firefox for Android has continuously supported PWA installation. Service workers, Cache API, and install prompts work.

**Practical impact:** For a drum machine PWA, Firefox desktop users represent a small minority. Ensure the app works great as a regular web app in Firefox even without install capability.

---

## 5.4 TWA (Trusted Web Activity) for Google Play

TWA wraps your PWA in a thin Android shell and publishes to Google Play Store.

**Benefits:**
- Google Play distribution and discoverability
- Automatic updates (content is still from your website)
- Google Play Billing integration possible
- Full-screen, no browser chrome

**Requirements:**
- Digital Asset Links file at `/.well-known/assetlinks.json` for domain verification
- Lighthouse score >= 80
- App signing key (SHA-256 fingerprint in assetlinks.json)

**Tools:**
- **Bubblewrap CLI** — Google's official tool: `npx @nicolo-ribaudo/pwa-to-twa`
- **PWABuilder** (pwabuilder.com) — GUI-based, generates TWA package

```bash
# Using Bubblewrap
npx @nicolo-ribaudo/pwa-to-twa init --manifest https://beatforge.app/manifest.json
npx @nicolo-ribaudo/pwa-to-twa build
# Produces an .aab file for Google Play upload
```

**assetlinks.json:**

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "app.beatforge.twa",
    "sha256_cert_fingerprints": ["AA:BB:CC:...your signing key fingerprint..."]
  }
}]
```

---

## 5.5 PWABuilder

Microsoft's open-source tool at https://pwabuilder.com:

**Supported platforms:**
- **Google Play** — Generates TWA wrapper (free, $25 Play Console account)
- **Microsoft Store** — Direct PWA submission (free)
- **Meta Quest Store** — VR packaging
- **iOS App Store** — Generates WebView wrapper (BUT: may get rejected under Apple Guideline 4.2 for lacking native functionality)

**Process:**
1. Enter your PWA URL on pwabuilder.com
2. It audits your manifest and service worker
3. Select target platform
4. Download generated package
5. Submit to respective store

---

## 5.6 iOS PWA Limitations (Comprehensive)

As of iOS 18 / Safari 18.4 (2025-2026):

| Feature | Status |
|---|---|
| Service Workers | YES |
| Cache API | YES |
| IndexedDB | YES (improved quota in Safari 17+) |
| Push Notifications | YES (iOS 16.4+, must be installed, user-initiated) |
| Background Sync | NO |
| Periodic Background Sync | NO |
| Badging API | YES (iOS 16.4+) |
| Screen Wake Lock | YES (Safari 18.4+) |
| Media Session API | PARTIAL (experimental, improving) |
| Background Audio | NO (process suspended) |
| Web Share API | YES |
| Web Share Target API | NO |
| File System Access API | NO |
| File Handling | NO |
| Protocol Handling | NO |
| Window Controls Overlay | N/A (mobile) |
| Persistent Storage | YES (Safari 17+) |
| Storage Eviction | Aggressive (7-day unused timeout) |
| Deep Linking | NO (links open Safari, not PWA) |
| Orientation Lock | NO (screen.orientation.lock() unsupported) |

---

## 5.7 App Store Submission Strategy

**When to submit to stores:**
- Google Play: YES — TWA is mature, well-supported, free. Increases discoverability.
- Microsoft Store: YES — Direct PWA support, easy submission.
- Apple App Store: RISKY — WebView wrappers often rejected under Guideline 4.2. Only submit if you add meaningful native features (e.g., native audio engine, IAP).

**For a drum machine PWA, recommended approach:**
1. Ship as a web app first (the PWA)
2. Submit to Google Play via TWA (week 1-2 after launch)
3. Submit to Microsoft Store via PWABuilder (same timeline)
4. Consider iOS App Store only if you build a native Swift wrapper with CoreAudio for better latency and background audio

---

# PART 6: ADVANCED PWA FEATURES

## 6.1 Web Share API

Share patterns, recordings, or exports to other apps:

```javascript
async function sharePattern(pattern) {
  const shareData = {
    title: `BeatForge: ${pattern.name}`,
    text: `Check out my drum pattern "${pattern.name}" at ${pattern.bpm} BPM`,
    url: `https://beatforge.app/patterns/${pattern.id}`
  };

  if (navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
    } catch (e) {
      if (e.name !== 'AbortError') console.error('Share failed:', e);
    }
  } else {
    // Fallback: copy link to clipboard
    await navigator.clipboard.writeText(shareData.url);
    showToast('Link copied to clipboard');
  }
}

// Share with audio file
async function shareRecording(audioBlob, patternName) {
  const file = new File([audioBlob], `${patternName}.wav`, { type: 'audio/wav' });
  const shareData = {
    title: `BeatForge: ${patternName}`,
    files: [file]
  };

  if (navigator.canShare?.(shareData)) {
    await navigator.share(shareData);
  }
}
```

**Support:** Chrome, Edge, Safari (iOS & macOS), Firefox Android. Requires HTTPS. Must be triggered by user gesture.

---

## 6.2 Web Share Target API

Receive shared audio files INTO your app. Defined in manifest (see Section 1.1) and handled in your app:

```javascript
// Handle incoming shared files (on the /app/share-target page)
window.addEventListener('load', async () => {
  const url = new URL(window.location);
  if (url.pathname === '/app/share-target') {
    // For POST file shares, the service worker intercepts
    // and stores the file, then redirects to the app
    const sharedFile = await getSharedFileFromSW();
    if (sharedFile) {
      await importSample(sharedFile);
    }
  }
});

// In service worker — intercept share target POST
self.addEventListener('fetch', (event) => {
  if (event.request.url.endsWith('/app/share-target') && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  const formData = await request.formData();
  const audioFile = formData.get('audio');

  if (audioFile) {
    // Store in cache or IndexedDB for the app to pick up
    const cache = await caches.open('shared-files');
    await cache.put('/shared/latest-audio', new Response(audioFile));
  }

  // Redirect to the app
  return Response.redirect('/app/import?source=share', 303);
}
```

**Support:** Chromium browsers only (Chrome, Edge). The PWA must be installed.

---

## 6.3 File System Access API

Read and write files directly to the user's filesystem:

```javascript
// Import audio samples from filesystem
async function importSamplesFromDisk() {
  try {
    const fileHandles = await window.showOpenFilePicker({
      multiple: true,
      types: [{
        description: 'Audio Files',
        accept: {
          'audio/wav': ['.wav'],
          'audio/mpeg': ['.mp3'],
          'audio/ogg': ['.ogg'],
          'audio/flac': ['.flac']
        }
      }]
    });

    const samples = [];
    for (const handle of fileHandles) {
      const file = await handle.getFile();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      samples.push({ name: file.name, buffer: audioBuffer, blob: file });
    }
    return samples;
  } catch (e) {
    if (e.name !== 'AbortError') throw e;
    return [];
  }
}

// Export/save a rendered pattern to disk
async function exportToDisk(audioBlob, suggestedName) {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: suggestedName || 'my-beat.wav',
      types: [{
        description: 'WAV Audio',
        accept: { 'audio/wav': ['.wav'] }
      }, {
        description: 'MP3 Audio',
        accept: { 'audio/mpeg': ['.mp3'] }
      }]
    });

    const writable = await handle.createWritable();
    await writable.write(audioBlob);
    await writable.close();

    showToast('File saved successfully');
  } catch (e) {
    if (e.name !== 'AbortError') throw e;
  }
}
```

**Support:** Chrome 86+, Edge 86+. NOT supported in Safari or Firefox. Provide `<input type="file">` and `<a download>` fallbacks.

---

## 6.4 File Handling API

Register as a handler for audio file types. Users can "Open with BeatForge" from their OS file manager.

Manifest configuration (see Section 1.1 `file_handlers`).

```javascript
// Handle launched files
if ('launchQueue' in window) {
  window.launchQueue.setConsumer(async (launchParams) => {
    if (launchParams.files.length > 0) {
      for (const fileHandle of launchParams.files) {
        const file = await fileHandle.getFile();
        await importSample(file);
      }
    }
  });
}
```

**Support:** Chrome 102+, Edge 102+. Desktop PWAs only.

---

## 6.5 Badging API

Show notification count on the app icon:

```javascript
// Set badge count (shared patterns received, etc.)
async function setBadge(count) {
  if ('setAppBadge' in navigator) {
    if (count > 0) {
      await navigator.setAppBadge(count);
    } else {
      await navigator.clearAppBadge();
    }
  }
}
```

**Support:** Chrome 81+, Edge 81+, Safari 16.4+ (iOS). PWA must be installed.

---

## 6.6 Protocol Handling

Handle custom URL schemes like `web+beatforge://pattern/123`:

Manifest configuration (see Section 1.1 `protocol_handlers`).

```javascript
// In your app, check if launched via protocol
const url = new URL(window.location);
const patternParam = url.searchParams.get('pattern');
if (patternParam) {
  // Decode the original protocol URL
  const protocolUrl = decodeURIComponent(patternParam);
  // Parse: web+beatforge://pattern/123
  const match = protocolUrl.match(/web\+beatforge:\/\/pattern\/(\d+)/);
  if (match) {
    loadSharedPattern(match[1]);
  }
}
```

---

## 6.7 Window Controls Overlay

Custom title bar on desktop PWA:

```json
// In manifest.json
"display_override": ["window-controls-overlay", "standalone"]
```

```css
/* CSS for the custom title bar */
.title-bar {
  position: fixed;
  top: 0;
  left: env(titlebar-area-x, 0);
  width: env(titlebar-area-width, 100%);
  height: env(titlebar-area-height, 33px);
  -webkit-app-region: drag; /* Make it draggable */
  display: flex;
  align-items: center;
  padding-left: 12px;
  background: var(--surface);
  z-index: 1000;
}

.title-bar button {
  -webkit-app-region: no-drag; /* Buttons should be clickable, not draggable */
}

.app-content {
  margin-top: env(titlebar-area-height, 33px);
}
```

```javascript
// Detect if WCO is active
if ('windowControlsOverlay' in navigator) {
  navigator.windowControlsOverlay.addEventListener('geometrychange', (e) => {
    const { x, y, width, height } = e.titlebarAreaRect;
    document.body.classList.toggle('wco-active', e.visible);
  });
}
```

**Use for drum machine:** Put pattern name, BPM display, and play/pause in the custom title bar on desktop.

---

## 6.8 Launch Handler API

Control how the app launches when already open:

```json
// In manifest.json
"launch_handler": {
  "client_mode": "navigate-existing"
}
```

Values:
- `"auto"` — Browser decides
- `"navigate-new"` — Always open new window
- `"navigate-existing"` — Focus existing window and navigate to the URL
- `"focus-existing"` — Focus existing window, don't navigate

For a drum machine: `"navigate-existing"` is ideal — opening a shared pattern URL focuses the existing app and loads the pattern.

---

# PART 7: PERFORMANCE OPTIMIZATION

## 7.1 Code Splitting

```javascript
// Vite/Rollup dynamic imports for code splitting
// Core (always loaded): sequencer, transport, audio engine, pad view

// Lazy loaded on demand:
const SoundDesigner = () => import('./views/SoundDesigner.js');
const SongArrangement = () => import('./views/SongArrangement.js');
const MixerPanel = () => import('./views/MixerPanel.js');
const PatternLibrary = () => import('./views/PatternLibrary.js');
const ExportPanel = () => import('./views/ExportPanel.js');
const Settings = () => import('./views/Settings.js');
const MIDIHandler = () => import('./midi/MIDIHandler.js');
const WavEncoder = () => import('./audio/WavEncoder.js');

// Example: lazy load mixer when user taps Mixer tab
async function showMixer() {
  showLoadingSpinner();
  const { MixerPanel } = await import('./views/MixerPanel.js');
  hideLoadingSpinner();
  renderView(new MixerPanel());
}
```

---

## 7.2 Asset Optimization

**Audio sample compression strategy:**
- Drum hits (short): WAV, 16-bit, 44.1kHz. Typical size: 20-200KB each.
- A full 16-pad kit: ~1-3MB total in WAV.
- Compress for download, decompress on arrival: consider shipping samples as a single .zip/tar, decompress in browser using `fflate` or `pako`.

```javascript
import { unzipSync } from 'fflate';

async function downloadKit(kitUrl) {
  const response = await fetch(kitUrl); // e.g., /kits/tr808.zip
  const zipBuffer = new Uint8Array(await response.arrayBuffer());
  const files = unzipSync(zipBuffer);

  const samples = {};
  for (const [name, data] of Object.entries(files)) {
    if (name.endsWith('.wav')) {
      const audioBuffer = await audioContext.decodeAudioData(data.buffer);
      samples[name] = audioBuffer;
    }
  }
  return samples;
}
```

---

## 7.3 Web Workers for Non-Audio Computation

Offload heavy computation from the main thread (which needs to stay responsive for audio):

```javascript
// pattern-worker.js
self.addEventListener('message', (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'GENERATE_MIDI':
      const midiBytes = generateMIDIFile(data.pattern);
      self.postMessage({ type: 'MIDI_READY', data: midiBytes }, [midiBytes]);
      break;

    case 'EXPORT_WAV_HEADER':
      const header = createWavHeader(data.sampleRate, data.numChannels, data.dataLength);
      self.postMessage({ type: 'WAV_HEADER', data: header });
      break;

    case 'QUANTIZE_PATTERN':
      const quantized = quantizeSteps(data.steps, data.grid, data.strength);
      self.postMessage({ type: 'QUANTIZED', data: quantized });
      break;

    case 'GENERATE_EUCLIDEAN':
      const euclidean = euclideanRhythm(data.pulses, data.steps, data.rotation);
      self.postMessage({ type: 'EUCLIDEAN', data: euclidean });
      break;
  }
});

// Main thread usage
const worker = new Worker('/pattern-worker.js');
worker.postMessage({ type: 'GENERATE_MIDI', data: { pattern: currentPattern } });
worker.addEventListener('message', (e) => {
  if (e.data.type === 'MIDI_READY') {
    downloadBlob(e.data.data, 'pattern.mid', 'audio/midi');
  }
});
```

**Do NOT put audio playback in a Web Worker** — Web Audio API is only available on the main thread (and Audio Worklets, which are special worker-like threads dedicated to audio processing).

---

## 7.4 Preloading Critical Audio

```html
<!-- Preload the default kit's most-used samples -->
<link rel="preload" href="/samples/default/kick.wav" as="fetch" crossorigin>
<link rel="preload" href="/samples/default/snare.wav" as="fetch" crossorigin>
<link rel="preload" href="/samples/default/hihat-closed.wav" as="fetch" crossorigin>
```

**Programmatic preloading with priority:**

```javascript
async function preloadCriticalSamples(kitSamples) {
  // Load kick, snare, hihat first (most likely to be played first)
  const critical = ['kick', 'snare', 'hihat-closed'];
  const rest = kitSamples.filter(s => !critical.includes(s.name));

  // Phase 1: Critical samples immediately
  await Promise.all(
    critical.map(name => loadAndDecodeSample(`/samples/default/${name}.wav`))
  );

  // Phase 2: Remaining samples after critical are ready
  await Promise.all(
    rest.map(s => loadAndDecodeSample(s.url))
  );
}
```

---

## 7.5 Resource Hints

```html
<!-- Preconnect to sample CDN -->
<link rel="preconnect" href="https://cdn.beatforge.app">
<link rel="dns-prefetch" href="https://cdn.beatforge.app">

<!-- Prefetch the next likely kit (if user is browsing kits) -->
<link rel="prefetch" href="/kits/tr808/manifest.json">

<!-- Preload critical font -->
<link rel="preload" href="/fonts/instrument-display.woff2" as="font" type="font/woff2" crossorigin>
```

---

## 7.6 Lighthouse PWA Audit Criteria

Lighthouse checks the following for PWA badge:

**Installability:**
- Has a valid web app manifest
- Registers a service worker with fetch handler
- Served over HTTPS
- Manifest has name, icons (192 + 512), start_url, display

**PWA Optimized:**
- Redirects HTTP to HTTPS
- Has a `<meta name="viewport">` tag
- Has a theme-color meta tag
- Content is sized correctly for viewport
- apple-touch-icon is provided
- Splash screen is configured (manifest background_color)

Run audit: Chrome DevTools > Lighthouse > Progressive Web App category.

---

## 7.7 Performance Targets for Audio App

| Metric | Target | Why |
|---|---|---|
| TTFB | < 200ms | Server should respond fast |
| FCP | < 1.5s | Show skeleton immediately |
| LCP | < 2.5s | Pads/grid rendered and interactive |
| CLS | < 0.1 | No layout shifts — fixed grid layout helps |
| TBT | < 200ms | Don't block main thread during load |
| TTI | < 3.5s | User can tap pads within 3.5s |
| Audio ready | < 2s after TTI | Default kit decoded and playable |

---

## 7.8 Bundle Size Budget

| Chunk | Budget | Contents |
|---|---|---|
| Critical JS | < 50KB gzipped | App shell, router, audio engine core |
| Core CSS | < 15KB gzipped | Grid, pads, transport bar |
| Sequencer view | < 30KB gzipped | Step grid, track controls |
| Sound design | < 25KB gzipped | Lazy loaded — filter, envelope UI |
| Pattern library | < 20KB gzipped | Lazy loaded — list, search, crud |
| Dexie.js | ~15KB gzipped | IndexedDB wrapper |
| Total initial | < 80KB gzipped | Before audio samples |
| Default kit samples | ~1-3MB | WAV files, cached separately |

---

# PART 8: EXAMPLE PWA AUDIO APPS TO STUDY

## 8.1 BandLab (bandlab.com)
- Full DAW in the browser, works as a PWA on Chrome
- Offline capability for recording and basic editing
- Cloud-based collaboration with real-time sync
- Unlimited storage for projects
- Uses Web Audio API for playback and recording
- PWA install supported on Chrome/Android

## 8.2 Soundtrap (soundtrap.com)
- Spotify-owned browser-based DAW
- Real-time collaboration
- Built-in loops, virtual instruments, beat maker
- Less PWA-focused — primarily requires online connectivity
- Uses Web Audio API and MIDI support

## 8.3 Other Notable Web Audio Apps
- **Drumbit** (drumbit.app) — Web drum machine, simple PWA
- **Splice** — Sample library with web player (not full PWA)
- **Amped Studio** — Browser DAW with PWA features
- **Chrome Music Lab** — Google's web audio experiments
- **Tone.js demos** — Framework showcasing Web Audio patterns

## 8.4 Spotify Web Player PWA Patterns
- Installed via Chrome as a PWA
- Uses service worker for app shell caching
- Audio streaming requires network — not offline-first
- Media Session API for lock screen controls
- Notification integration on Android
- Good reference for Media Session implementation

---

# PART 9: COMPLETE PRODUCTION manifest.json

```json
{
  "id": "beatforge-drum-machine",
  "name": "BeatForge Drum Machine",
  "short_name": "BeatForge",
  "description": "Professional drum machine and beat maker. Create, perform, and share drum patterns with an intuitive step sequencer and finger drumming pads. Works offline.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone"],
  "orientation": "any",
  "theme_color": "#1a1a2e",
  "background_color": "#0f0f23",
  "dir": "ltr",
  "lang": "en-US",
  "categories": ["music", "entertainment", "utilities"],
  "prefer_related_applications": false,

  "icons": [
    { "src": "/icons/icon-48.png",   "sizes": "48x48",   "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-72.png",   "sizes": "72x72",   "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-96.png",   "sizes": "96x96",   "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-128.png",  "sizes": "128x128", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-144.png",  "sizes": "144x144", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-152.png",  "sizes": "152x152", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-192.png",  "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-256.png",  "sizes": "256x256", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-384.png",  "sizes": "384x384", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png",  "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-1024.png", "sizes": "1024x1024", "type": "image/png", "purpose": "any" },
    { "src": "/icons/maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],

  "shortcuts": [
    {
      "name": "New Pattern",
      "short_name": "New",
      "description": "Create a new drum pattern from scratch",
      "url": "/app/patterns/new?utm_source=shortcut",
      "icons": [{ "src": "/icons/shortcut-new-pattern.png", "sizes": "96x96", "type": "image/png" }]
    },
    {
      "name": "Metronome",
      "short_name": "Metro",
      "description": "Open the metronome for practice",
      "url": "/app/metronome?utm_source=shortcut",
      "icons": [{ "src": "/icons/shortcut-metronome.png", "sizes": "96x96", "type": "image/png" }]
    },
    {
      "name": "My Patterns",
      "short_name": "Patterns",
      "description": "Browse your saved drum patterns",
      "url": "/app/patterns?utm_source=shortcut",
      "icons": [{ "src": "/icons/shortcut-patterns.png", "sizes": "96x96", "type": "image/png" }]
    },
    {
      "name": "Finger Drums",
      "short_name": "Pads",
      "description": "Open the finger drumming pad view",
      "url": "/app/pads?utm_source=shortcut",
      "icons": [{ "src": "/icons/shortcut-pads.png", "sizes": "96x96", "type": "image/png" }]
    }
  ],

  "screenshots": [
    {
      "src": "/screenshots/desktop-sequencer-wide.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide",
      "label": "16-step drum sequencer with mixer and waveform display"
    },
    {
      "src": "/screenshots/desktop-pads-wide.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Finger drumming pad layout with velocity-sensitive response"
    },
    {
      "src": "/screenshots/mobile-sequencer.png",
      "sizes": "1170x2532",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Mobile step sequencer with swipe navigation"
    },
    {
      "src": "/screenshots/mobile-pads.png",
      "sizes": "1170x2532",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Touch-responsive drum pads optimized for mobile"
    },
    {
      "src": "/screenshots/mobile-patterns.png",
      "sizes": "1170x2532",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Pattern library with search and categorization"
    }
  ],

  "protocol_handlers": [
    {
      "protocol": "web+beatforge",
      "url": "/app/open?url=%s"
    }
  ],

  "file_handlers": [
    {
      "action": "/app/import",
      "accept": {
        "audio/wav": [".wav"],
        "audio/mpeg": [".mp3"],
        "audio/midi": [".mid", ".midi"]
      }
    }
  ],

  "share_target": {
    "action": "/app/share-target",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "name",
      "text": "description",
      "url": "link",
      "files": [
        {
          "name": "audio",
          "accept": ["audio/wav", "audio/mpeg", "audio/midi", "audio/*"]
        }
      ]
    }
  },

  "launch_handler": {
    "client_mode": "navigate-existing"
  },

  "related_applications": [],

  "edge_side_panel": {
    "preferred_width": 480
  }
}
```

---

# PART 10: COMPLETE SERVICE WORKER

```javascript
// sw.js — Complete service worker for BeatForge drum machine PWA
const APP_SHELL_CACHE = 'beatforge-shell-v1';
const AUDIO_CACHE = 'beatforge-audio-v1';
const RUNTIME_CACHE = 'beatforge-runtime-v1';

// ==========================================
// App Shell — precached on install
// ==========================================
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/app.js',
  '/app.css',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/fonts/instrument-display.woff2',
  '/offline.html'
];

// Default kit samples — precached on install
const DEFAULT_KIT_SAMPLES = [
  '/samples/default/kick.wav',
  '/samples/default/snare.wav',
  '/samples/default/hihat-closed.wav',
  '/samples/default/hihat-open.wav',
  '/samples/default/clap.wav',
  '/samples/default/tom-hi.wav',
  '/samples/default/tom-mid.wav',
  '/samples/default/tom-lo.wav',
  '/samples/default/ride.wav',
  '/samples/default/crash.wav',
  '/samples/default/perc1.wav',
  '/samples/default/perc2.wav',
  '/samples/default/cowbell.wav',
  '/samples/default/shaker.wav',
  '/samples/default/rim.wav',
  '/samples/default/conga.wav'
];

// ==========================================
// INSTALL — Precache app shell + default kit
// ==========================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(APP_SHELL_CACHE).then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL_FILES);
      }),
      caches.open(AUDIO_CACHE).then(cache => {
        console.log('[SW] Caching default kit samples');
        return cache.addAll(DEFAULT_KIT_SAMPLES);
      })
    ]).then(() => {
      console.log('[SW] Install complete');
      return self.skipWaiting();
    })
  );
});

// ==========================================
// ACTIVATE — Clean old caches
// ==========================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  const currentCaches = [APP_SHELL_CACHE, AUDIO_CACHE, RUNTIME_CACHE];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => !currentCaches.includes(name))
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// ==========================================
// FETCH — Route to caching strategies
// ==========================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (except share target)
  if (event.request.method !== 'GET') {
    // Handle share target POST
    if (url.pathname === '/app/share-target' && event.request.method === 'POST') {
      event.respondWith(handleShareTarget(event.request));
      return;
    }
    return;
  }

  // Skip chrome-extension, etc.
  if (!url.protocol.startsWith('http')) return;

  // Route based on request type
  if (isAppShellRequest(url, event.request)) {
    event.respondWith(cacheFirstStrategy(event.request, APP_SHELL_CACHE));
  } else if (isAudioRequest(url, event.request)) {
    event.respondWith(cacheFirstStrategy(event.request, AUDIO_CACHE));
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(event.request, RUNTIME_CACHE));
  } else if (isFontOrImage(url, event.request)) {
    event.respondWith(staleWhileRevalidateStrategy(event.request, RUNTIME_CACHE));
  } else {
    event.respondWith(networkFirstStrategy(event.request, RUNTIME_CACHE));
  }
});

// ==========================================
// Routing helpers
// ==========================================
function isAppShellRequest(url, request) {
  return url.origin === self.location.origin && (
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/offline.html'
  );
}

function isAudioRequest(url, request) {
  return request.destination === 'audio' ||
    url.pathname.startsWith('/samples/') ||
    url.pathname.startsWith('/kits/') ||
    /\.(wav|mp3|ogg|flac|webm)$/.test(url.pathname);
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isFontOrImage(url, request) {
  return request.destination === 'font' ||
    request.destination === 'image' ||
    /\.(woff2?|ttf|otf|png|jpg|jpeg|svg|gif|webp|ico)$/.test(url.pathname);
}

// ==========================================
// Caching Strategies
// ==========================================

// Cache First — for app shell and audio samples
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // If it's a navigation request, show offline page
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network First — for API calls and dynamic content
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }

    return new Response(
      JSON.stringify({ error: 'offline', message: 'You are currently offline' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stale While Revalidate — for fonts, images, non-critical resources
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || networkFetch;
}

// ==========================================
// Share Target Handler
// ==========================================
async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (audioFile) {
      const cache = await caches.open('beatforge-shared');
      await cache.put('/shared/latest', new Response(audioFile, {
        headers: { 'Content-Type': audioFile.type }
      }));
    }

    return Response.redirect('/app/import?source=share', 303);
  } catch (e) {
    return Response.redirect('/app?error=share-failed', 303);
  }
}

// ==========================================
// Background Sync
// ==========================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'share-pattern') {
    event.waitUntil(processShareQueue());
  } else if (event.tag === 'sync-patterns') {
    event.waitUntil(syncPatterns());
  }
});

async function processShareQueue() {
  // Open IndexedDB directly (can't use Dexie in SW without import)
  const db = await openIndexedDB('BeatForgeDB', 'exportQueue');
  const pending = await getAllFromStore(db, 'exportQueue');

  for (const item of pending) {
    if (item.status !== 'pending') continue;
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        body: JSON.stringify(item.data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        await deleteFromStore(db, 'exportQueue', item.id);
      }
    } catch (e) {
      throw e; // Will retry
    }
  }
}

async function syncPatterns() {
  // Sync user patterns to cloud backup
  try {
    const response = await fetch('/api/sync/check');
    if (response.ok) {
      const { needsSync } = await response.json();
      if (needsSync) {
        // Notify the page to handle sync
        const clients = await self.clients.matchAll();
        clients.forEach(client => client.postMessage({ type: 'SYNC_NEEDED' }));
      }
    }
  } catch (e) {
    // Will retry on next sync
  }
}

// ==========================================
// Periodic Background Sync
// ==========================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-kit-library') {
    event.waitUntil(updateKitLibrary());
  }
});

async function updateKitLibrary() {
  try {
    const response = await fetch('/api/kits/catalog?format=minimal');
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put('/api/kits/catalog', response.clone());
    }
  } catch (e) {
    // Silent failure for periodic sync
  }
}

// ==========================================
// Message handling (skip waiting, cache control)
// ==========================================
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_AUDIO':
      // Explicitly cache a kit's samples from the main thread
      event.waitUntil(
        caches.open(AUDIO_CACHE).then(cache => {
          return cache.addAll(data.urls);
        }).then(() => {
          event.source.postMessage({ type: 'CACHE_AUDIO_COMPLETE', kitId: data.kitId });
        })
      );
      break;

    case 'DELETE_KIT_CACHE':
      // Remove a kit's samples from cache
      event.waitUntil(
        caches.open(AUDIO_CACHE).then(async (cache) => {
          const keys = await cache.keys();
          const kitKeys = keys.filter(req => req.url.includes(`/kits/${data.kitId}/`));
          return Promise.all(kitKeys.map(key => cache.delete(key)));
        })
      );
      break;

    case 'GET_CACHE_SIZE':
      // Report cache sizes back to main thread
      event.waitUntil(
        getCacheSizes().then(sizes => {
          event.source.postMessage({ type: 'CACHE_SIZE_REPORT', data: sizes });
        })
      );
      break;
  }
});

async function getCacheSizes() {
  const cacheNames = await caches.keys();
  const sizes = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    sizes[name] = { entries: keys.length };
  }

  return sizes;
}

// ==========================================
// IndexedDB helpers for service worker
// ==========================================
function openIndexedDB(dbName, storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteFromStore(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ==========================================
// Update notification to user
// ==========================================
self.addEventListener('install', () => {
  // After installing a new version, notify all clients
  self.addEventListener('activate', () => {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_UPDATED',
          message: 'BeatForge has been updated. Refresh to get the latest version.'
        });
      });
    });
  });
});
```

---

# PART 11: QUICK REFERENCE CHEATSHEET

## HTML Head Template

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">

  <!-- PWA Meta Tags -->
  <meta name="theme-color" content="#1a1a2e" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#f8f9fa" media="(prefers-color-scheme: light)">
  <meta name="color-scheme" content="dark light">

  <!-- iOS PWA Meta Tags -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="BeatForge">
  <link rel="apple-touch-icon" href="/icons/icon-192.png">

  <!-- Manifest -->
  <link rel="manifest" href="/manifest.json">

  <!-- Resource Hints -->
  <link rel="preconnect" href="https://cdn.beatforge.app">
  <link rel="preload" href="/fonts/instrument-display.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/samples/default/kick.wav" as="fetch" crossorigin>
  <link rel="preload" href="/samples/default/snare.wav" as="fetch" crossorigin>
  <link rel="preload" href="/samples/default/hihat-closed.wav" as="fetch" crossorigin>

  <title>BeatForge Drum Machine</title>
  <link rel="stylesheet" href="/app.css">
</head>
```

## Critical CSS for Audio App

```css
/* Prevent all browser-default touch behaviors on instrument UI */
* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  overscroll-behavior: none;  /* Prevent pull-to-refresh */
  -webkit-overflow-scrolling: touch;
  background: var(--bg, #0f0f23);
}

/* Safe areas */
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sar: env(safe-area-inset-right, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
}

.app {
  height: 100dvh;
  padding-top: var(--sat);
  padding-bottom: var(--sab);
  padding-left: var(--sal);
  padding-right: var(--sar);
}

/* Instrument-specific touch handling */
.pad, .knob, .slider, .button {
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Standalone mode detection */
@media (display-mode: standalone) {
  .install-prompt { display: none; }
  .browser-only-ui { display: none; }
}

/* Window Controls Overlay */
@media (display-mode: window-controls-overlay) {
  .title-bar {
    position: fixed;
    top: 0;
    left: env(titlebar-area-x, 0);
    width: env(titlebar-area-width, 100%);
    height: env(titlebar-area-height, 33px);
  }
}
```

## Feature Detection Snippet

```javascript
const capabilities = {
  serviceWorker: 'serviceWorker' in navigator,
  webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
  audioWorklet: 'AudioWorkletNode' in window,
  midi: 'requestMIDIAccess' in navigator,
  wakeLock: 'wakeLock' in navigator,
  mediaSession: 'mediaSession' in navigator,
  share: 'share' in navigator,
  canShare: 'canShare' in navigator,
  fileSystem: 'showOpenFilePicker' in window,
  storage: 'storage' in navigator && 'persist' in navigator.storage,
  periodicSync: 'serviceWorker' in navigator &&
    navigator.serviceWorker.ready.then(r => 'periodicSync' in r),
  badging: 'setAppBadge' in navigator,
  vibrate: 'vibrate' in navigator,
  isInstalled: window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true,
  isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
  isAndroid: /Android/.test(navigator.userAgent)
};
```

---

## Sources

- [Web App Manifest — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest)
- [Web App Manifest — web.dev](https://web.dev/learn/pwa/web-app-manifest)
- [Add a Web App Manifest — web.dev](https://web.dev/articles/add-manifest)
- [Using Service Workers — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [Offline-First PWAs: Service Worker Caching Strategies](https://www.magicbell.com/blog/offline-first-pwas-service-worker-caching-strategies)
- [Service Worker Lifecycle Guide](https://codesamplez.com/front-end/service-worker-lifecycle-guide)
- [How to Implement Service Worker Caching (2026)](https://oneuptime.com/blog/post/2026-01-25-implement-service-worker-caching/view)
- [Building a PWA Music Player Part 2: Offline](https://dev.to/ndesmic/building-a-pwa-music-player-part-2-offline-2pbb)
- [PWA Audio Cache Test (GitHub)](https://github.com/daffinm/audio-cache-test)
- [Media Session API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API)
- [Media Session API — web.dev](https://web.dev/articles/media-session)
- [iOS Web Apps and Media Session API](https://dbushell.com/2023/03/20/ios-pwa-media-session-api/)
- [Audio Player PWA Demo — Progressier](https://progressier.com/pwa-capabilities/audio-player-pwa)
- [What We Learned About PWAs and Audio Playback](https://prototyp.digital/blog/what-we-learned-about-pwas-and-audio-playback)
- [WebKit Bug 198277 — Audio Stops in Standalone](https://bugs.webkit.org/show_bug.cgi?id=198277)
- [WebKit Bug 254545 — Wake Lock in Home Screen Apps](https://bugs.webkit.org/show_bug.cgi?id=254545)
- [PWA iOS Limitations and Safari Support — Complete Guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Do Progressive Web Apps Work on iOS? (2026)](https://www.mobiloud.com/blog/progressive-web-apps-ios)
- [PWA on iOS — Current Status & Limitations (2025)](https://brainhub.eu/library/pwa-on-ios)
- [Safari PWA Limitations on iOS](https://docs.bswen.com/blog/2026-03-12-safari-pwa-limitations-ios/)
- [Screen Wake Lock API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [Workbox — web.dev](https://web.dev/learn/pwa/workbox)
- [Caching Resources During Runtime — Workbox](https://developer.chrome.com/docs/workbox/caching-resources-during-runtime/)
- [Precaching Dos and Don'ts — Workbox](https://developer.chrome.com/docs/workbox/precaching-dos-and-donts)
- [Dexie.js — IndexedDB Made Simple](https://dexie.org)
- [Build Offline-First PWA with React, Dexie.js & Workbox](https://www.wellally.tech/blog/build-offline-pwa-react-dexie-workbox)
- [Storage Quotas and Eviction Criteria — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [StorageManager: persist() — MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)
- [Periodic Background Sync — Chrome Developers](https://developer.chrome.com/docs/capabilities/periodic-background-sync)
- [Background Sync in PWAs — Service Worker Guide](https://www.zeepalm.com/blog/background-sync-in-pwas-service-worker-guide)
- [Making PWAs Installable — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [How to Provide Your Own Install Experience — web.dev](https://web.dev/articles/customize-install)
- [Installation Prompt — web.dev](https://web.dev/learn/pwa/installation-prompt)
- [File System Access API — Chrome Developers](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)
- [Share Data Between Apps — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Share_data_between_apps)
- [share_target — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target)
- [URL Protocol Handler Registration — Chrome Developers](https://developer.chrome.com/docs/web-platform/best-practices/url-protocol-handler)
- [Associate Files with Your PWA — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Associate_files_with_your_PWA)
- [Launch Handler API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Launch_Handler_API)
- [Can You Publish a PWA to the App Store? (2026)](https://www.mobiloud.com/blog/publishing-pwa-app-store)
- [Adding Your PWA to Google Play — Google Developers](https://developers.google.com/codelabs/pwa-in-play)
- [Firefox — Mozilla Working on PWA Support (2025)](https://www.ghacks.net/2025/03/17/firefox-mozilla-is-working-on-progressive-web-apps-pwa-support/)
- [Firefox Supports PWAs on Windows (2025)](https://www.ghacks.net/2025/08/22/experimental-firefox-now-supports-progressive-web-apps-on-windows/)
- [Make Your PWAs Look Handsome on iOS](https://dev.to/karmasakshi/make-your-pwas-look-handsome-on-ios-1o08)
- [env() CSS — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env)
- [Display Your PWA Fullscreen](https://dev.to/oncode/display-your-pwa-website-fullscreen-4776)
- [App Design — web.dev](https://web.dev/learn/pwa/app-design)
- [AudioContext — MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext)
- [Web Audio API Performance Notes](https://padenot.github.io/web-audio-perf/)
- [Workbox Runtime Caching Recipes (Addy Osmani)](https://gist.github.com/addyosmani/0e1cfeeccad94edc2f0985a15adefe54)
- [What PWA Can Do Today](https://whatpwacando.today/)
