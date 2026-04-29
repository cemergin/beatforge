# BeatForge

> Browser-based world-rhythm metronome + drum machine. 536 patterns across 23 regions. Polyrhythm. Speed trainer. Step sequencer. Web MIDI. PWA. Free + open source.

**[▶ Try it now](https://cemergin.github.io/beatforge/)** &nbsp;·&nbsp; No install, no signup, works offline.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-installable-5b6bbf.svg)](https://cemergin.github.io/beatforge/)
[![Stack](https://img.shields.io/badge/stack-React%2019%20·%20Vite%20·%20TS%20·%20Bun-e17055.svg)](#tech-stack)

---

## What it is

A practice tool for musicians who want to feel rhythms beyond 4/4. Built around three ideas:

- **Beat grouping is the killer feature.** 9/8 isn't just nine eighths — it's `2+2+2+3` (or `2+2+3+2`). The visualization makes the additive structure obvious; the engine plays it correctly.
- **World rhythms are first-class.** 536 curated patterns across 23 regions — Turkish karşılama, Cuban son clave, Indian tintal, Indonesian gamelan, Brazilian samba, electronic four-on-floor — each with cultural context.
- **Practice over polish.** The metronome is the daily driver. Speed trainer ramps BPM over bars or seconds. Polyrhythm with per-track subdivisions. Tap tempo, count-in, accents, swing.

## Quick start

```bash
git clone https://github.com/cemergin/beatforge.git
cd beatforge/app
bun install
bun dev
```

Open `http://localhost:5173`. That's it — no backend, no env vars, no setup.

To build for production: `bun run build`. To run tests: `bun run test`.

## What's inside

Three modes share one Web Audio engine:

| Mode | What it's for |
|---|---|
| **Practice** | Daily metronome. Pick a pattern, set BPM, hit play. Speed trainer + tap tempo + count-in. |
| **Studio** | Step sequencer for sketching your own patterns. 14 voice machines (kick / snare / modal / FM / formant / …) + master FX with damped reverb + delay. Save to IndexedDB → appears in your Library. |
| **Library** | Browse all 536 rhythms by region / meter / genre / kit. Search, world map, starter paths, share-link any pattern by URL. |

Plus a **hidden MIDI tab** at `?tab=_midi` — bind any controller's CC or notes to any internal address, route each audio channel to a MIDI output device + channel + note, MIDI clock I/O, live monitor.

## Tech stack

- **React 19** + **TypeScript** + **Vite 8**
- **Bun** (package manager + test runner)
- **Web Audio API** — pure, no Tone.js. Per-track scheduler in a Web Worker for rock-solid timing.
- **Web MIDI API** — secret tab (no nav chip, ungated by URL).
- **Dexie / IndexedDB** for user-saved patterns + ensembles.
- **Workbox** + `vite-plugin-pwa` — installable, works offline.
- **Vitest** — 328 tests covering pattern schema, sequencer, MIDI bridge, audio adapters.

Auto-deploys to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`.

## Repo layout

```
beatforge/
├── app/                       The shipping React app
│   ├── src/
│   │   ├── App.tsx            Root: tabs, session, router
│   │   ├── audio/             Engine + voice/FX machines + adapters
│   │   ├── modes/             Practice, Sound (Studio), Library, Midi
│   │   ├── modules/           Bus, router, sequencer, session, midi
│   │   ├── components/        Shared visualizations + transport
│   │   ├── lib/               db, storage, urlState, MIDI bridge
│   │   └── patterns/          Schema + 536 seed patterns by region
│   └── INDEX.yaml             Machine-readable codebase index
├── docs/                      Specs, architecture, topical reference + process archive
│   ├── spec/                  What BeatForge does — metronome.md + library-content.md
│   ├── architecture/          Current code architecture (audio, sequencer, React)
│   ├── topics/                ~64K lines of reference: synthesis, MIDI, PWA,
│   │                          rhythm traditions (28 regions), patterns (600+),
│   │                          rhythm engine, interface design, practice pedagogy
│   └── process/               Design reviews, manifestos, engineering audits
└── INDEX.yaml                 Top-level repo map
```

Every meaningful directory has its own `INDEX.yaml` describing purpose, contents, invariants, and cross-references. Useful for both humans and AI agents navigating the code — start at `INDEX.yaml` and follow the chain.

## Contributing

Issues, PRs, and pattern submissions all welcome. **Pattern contributions** are especially valuable — if a rhythm in your tradition is missing, mislabeled, or culturally miscontextualized, please open a PR or issue. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the dev workflow + pattern-authoring guide.

## License

MIT — see [`LICENSE`](LICENSE). Cultural stories and pattern transcriptions draw from public musicology research; corrections and additions from practitioners are very welcome.
