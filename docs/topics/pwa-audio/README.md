# PWA + offline audio

Making a Web Audio app installable, offline-capable, and well-behaved on iOS / Android / desktop.

**Audience:** developers shipping audio PWAs who keep getting bitten by service-worker quirks and locked AudioContexts.

## What's here

| File | Lines | What it covers |
|---|---|---|
| [`reference.md`](reference.md) | ~3,200 | Web App Manifest, service-worker lifecycle, caching strategies (cache-first, network-first, stale-while-revalidate), Workbox recipes, offline audio specifics, IndexedDB, Background Sync, Media Session API, Wake Lock, Web Share, storage management |

This is the only file in the topic — but it's the longest single doc in the corpus, so it has its own internal table of contents at the top.

## Why one giant file

PWA work is highly cross-cutting: the manifest tells iOS one thing, Workbox tells the runtime another, and Wake Lock interacts with both. Splitting it into 8 short files made the cross-references unreadable. It stays one document with a strong TOC.

## In BeatForge

PWA layer is built on [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) + Workbox. The update banner, install prompt, and offline shell live in [`app/src/components/`](../../../app/src/components/) and [`app/src/main.tsx`](../../../app/src/main.tsx). The service worker is generated at build; runtime caching strategy is `staleWhileRevalidate` for assets + `networkFirst` for HTML.

## Quickest path to "it works offline"

1. Manifest with `display: standalone`, themed colors, icons (192 + 512 + maskable).
2. `vite-plugin-pwa` with `registerType: 'autoUpdate'`.
3. Wake Lock API around the play button (so the screen doesn't dim during practice).
4. Test install on an actual iOS device — desktop Chrome lies about iOS behavior.

The reference covers each step in depth.
