# BeatForge

A browser-based world-rhythm metronome. 536 rhythms across 23 regions, 7 synthesized kits, polyrhythm overlay, per-track subdivisions. Works offline. No install, no signup, no backend. Open source.

**Live:** [cemergin.github.io/beatforge](https://cemergin.github.io/beatforge/)

BeatForge is two projects:

| Project | Status | Where |
|---|---|---|
| **BeatForge Metronome** | v1 shipped | `app/` — React + Vite + TS PWA |
| **BeatForge Drum Synth** | Next | Separate project (hasn't started) |

The metronome is for daily practice — odd meters, beat grouping, polyrhythm, speed trainer, world rhythms. The synth (future) is the real sound-design playground built on the learnings from the metronome.

---

## Quick tour

| What you want | Where to go |
|---|---|
| Try the app | [cemergin.github.io/beatforge](https://cemergin.github.io/beatforge/) |
| Run the app locally | `cd app && bun install && bun dev` |
| Understand the code | [`docs/architecture/overview.md`](docs/architecture/overview.md) (human-readable arch) |
| Navigate every folder | [`INDEX.yaml`](INDEX.yaml) (machine-readable index) |
| Read the design spec | [`docs/superpowers/specs/2026-04-22-beatforge-metronome-design.md`](docs/superpowers/specs/2026-04-22-beatforge-metronome-design.md) |
| Browse the research corpus | [`research/INDEX.yaml`](research/INDEX.yaml) → 27 musicology MDs, 650+ notated patterns |

---

## The app (`app/`)

Built with React 19, Vite, TypeScript, Bun. PWA via `vite-plugin-pwa` + Workbox. Dexie for user-saved patterns, Fuse.js for fuzzy search, localStorage for UI state. Deploys to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`.

Three modes, one audio engine:

- **Practice** — daily driver. BPM, grouping, speed trainer, tap-tempo, count-in, stop-after, polyrhythm overlay, per-group accents, all 7 kits, 3 view modes (circular / linear / pill).
- **Studio** — step sequencer for sketching patterns. Full Practice-parity controls + per-track subdivisions editor. Save to IndexedDB, export/import JSON.
- **Library** — zoned-scroll browse surface for all 536 patterns. Search, filter chips, world map, starter paths, grouping browser, related-rhythm algorithm.

The audio engine is pure Web Audio (no Tone.js). Per-track independent scheduler for true polyrhythm. Scheduler tick runs on a dedicated Web Worker (300ms lookahead) so audio timing stays rock-solid across React renders, devtools activity, and background-tab throttling. 7 kits: 808/909/707/727 (drum machine family) + frameDrum (SWANA/Balkans) + tabla (Indian) + gamelan (Indonesian metal percussion). See [`docs/architecture/audio-engine.md`](docs/architecture/audio-engine.md) for the deep dive.

---

## The research corpus (`research/`)

Built up over many sessions — 50,000+ lines across 27 musicology files, 19 pattern files, 8 technical references, 5 design references. The app's 536 seed patterns are a curated subset; the corpus goes much deeper.

Navigate via:

- [`research/INDEX.yaml`](research/INDEX.yaml) — machine index
- [`research/INDEX.md`](research/INDEX.md) — prose catalog (pre-YAML)
- [`research/TOPIC-INDEX.md`](research/TOPIC-INDEX.md) — concept → file cross-ref
- [`research/PATTERN-INDEX.md`](research/PATTERN-INDEX.md) — every notated pattern, searchable

The corpus is the source of truth when extending the seed library. The extraction pipeline at [`app/scripts/extract-patterns.ts`](app/scripts/extract-patterns.ts) + dev-only sandbox at `/_patterns` walks drafts from `research/patterns/*.md` → JSON → proof-hearing → promotion to `app/src/patterns/seed/<region>.ts`.

---

## Docs (`docs/`)

| File | What |
|---|---|
| [`docs/architecture/overview.md`](docs/architecture/overview.md) | How the metronome works at a glance |
| [`docs/architecture/audio-engine.md`](docs/architecture/audio-engine.md) | Scheduler, kits, synthesis |
| [`docs/architecture/sequencer-and-patterns.md`](docs/architecture/sequencer-and-patterns.md) | Pattern schema, subdivisions, polyrhythm |
| [`docs/architecture/react-app.md`](docs/architecture/react-app.md) | Component tree, state, persistence |
| [`docs/superpowers/specs/2026-04-22-beatforge-metronome-design.md`](docs/superpowers/specs/2026-04-22-beatforge-metronome-design.md) | Original design spec |
| [`docs/superpowers/specs/2026-03-13-content-presentation-design.md`](docs/superpowers/specs/2026-03-13-content-presentation-design.md) | Content presentation spec |
| [`docs/2026-03-12-beatforge-product-design.md`](docs/2026-03-12-beatforge-product-design.md) | First product design (partially superseded) |

---

## The prototype (`design/`)

Early React prototype authored before the port to a real Vite app. Kept for reference — the visualizations (`views.jsx`) and engine (`engine.js`) were the basis of what's in `app/`. Do not use for development; use `app/`.

---

## What's next

- **Metronome v1.x** — grow library toward 650+ patterns via `scripts/extract-patterns.ts`. Accessibility pass. Mobile polish. Real-use bug fixes.
- **BeatForge Drum Synth** — separate project, not started. Real sound design surface (AudioWorklets, modulation, FX, routing). Will reuse the engine scheduler + pattern schema from the metronome via shared packages. See the spec's §9 v2.0 for the outline.

---

## License

MIT. Patterns and cultural stories are drawn from research and tradition; contributions welcome. If a rhythm notation is wrong or missing context, open an issue or PR.
