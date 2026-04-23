import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Spec §3.3 — GitHub Pages deploy at /beatforge/; base is '/' in dev.
// PWA per §8 — precache everything, offline-first.
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    VitePWA({
      // autoUpdate — skipWaiting + clientsClaim so new SWs take over on
      // next visit. Earlier 'prompt' meant users had to see + click a
      // toast; too easy for a stale SW to hold on silently.
      registerType: 'autoUpdate',
      // The manifest file already lives in public/; let the plugin inject the
      // correct <link rel="manifest"> for us at build time.
      manifest: false,
      workbox: {
        // Precache everything the build emits — no runtime fetches in v1.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      includeAssets: ['icons/icon.svg', 'manifest.webmanifest'],
      devOptions: {
        // Keep dev frictionless — no SW in dev.
        enabled: false,
      },
    }),
  ],
  base: command === 'build' ? '/beatforge/' : '/',
  server: { port: 5173 },
}));
