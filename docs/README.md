# BeatForge — docs

This folder is two different things in one tree:

1. **What BeatForge is + how it's built** (`spec/`, `architecture/`)
2. **Reference material that grew out of building it** (`topics/`)

If you came here from the repo root and just want to understand the project, follow path 1. If you stumbled in from a search for "Web Audio drum synthesis" or "Turkish aksak rhythms" or "Brazilian samba" — you probably want path 2.

## The four sections

| Folder | What's there | Read if… |
|---|---|---|
| [`spec/`](spec/) | The shipping product specs — metronome behavior, content/library design | …you want to know what BeatForge does and why it does it that way |
| [`architecture/`](architecture/) | Current code architecture — audio engine, sequencer, React app, modular plan | …you're contributing code or porting the engine |
| [`topics/`](topics/) | Reference material organized by subject (audio synthesis, MIDI, PWA, rhythm traditions, patterns, engine, interface, practice) | …you're learning a topic, not necessarily working on BeatForge |
| [`process/`](process/) | Design reviews, manifestos, engineering audits, plans, historical specs | …you want the *reasoning* behind decisions or are doing your own design review |

## The topics tree

`topics/` is the largest section by far — ~64K lines across 60+ files. It has its own [README](topics/README.md) with a full map. The short version:

- **[`audio-synthesis/`](topics/audio-synthesis/)** — drum synthesis on Web Audio (no samples)
- **[`midi/`](topics/midi/)** — MIDI protocol + Web MIDI API + keyboard mapping
- **[`pwa-audio/`](topics/pwa-audio/)** — service workers, offline audio, Wake Lock
- **[`rhythm-traditions/`](topics/rhythm-traditions/)** — 28 region files: West Africa, Cuba, Brazil, Persia, Turkey, India, gamelan, Japan, China, Mongolia, hip-hop, electronic…
- **[`rhythm-patterns/`](topics/rhythm-patterns/)** — 600+ notated step-grid patterns
- **[`rhythm-engine/`](topics/rhythm-engine/)** — polyrhythmic sequencer architecture + Ottoman usul case study
- **[`interface/`](topics/interface/)** — UI/UX/visual design for music software
- **[`practice/`](topics/practice/)** — deliberate-practice methodology + speed-training protocols

Each topic folder has its own README with a map.

## Quick paths

**"What is BeatForge?"** → [`spec/metronome.md`](spec/metronome.md)

**"How is the audio engine built?"** → [`architecture/audio-engine.md`](architecture/audio-engine.md)

**"Why do you call it 'living archive'?"** → [`process/manifestos/living-archive.md`](process/manifestos/living-archive.md)

**"Show me a Cuban son clave."** → [`topics/rhythm-patterns/latin-caribbean.md`](topics/rhythm-patterns/latin-caribbean.md)

**"How does aksak work?"** → [`topics/rhythm-engine/turkish-usul.md`](topics/rhythm-engine/turkish-usul.md) + [`topics/rhythm-traditions/turkish-anatolian-swana.md`](topics/rhythm-traditions/turkish-anatolian-swana.md)

**"How do I build an 808 kick on Web Audio?"** → [`topics/audio-synthesis/drum-synthesis.md`](topics/audio-synthesis/drum-synthesis.md) (start) → [`topics/audio-synthesis/web-audio-dsp.md`](topics/audio-synthesis/web-audio-dsp.md) (depth)

**"What design lenses shaped the product?"** → [`process/design-reviews/synthesis.md`](process/design-reviews/synthesis.md)

**"How do I add a pattern?"** → [`../CONTRIBUTING.md`](../CONTRIBUTING.md)

## Stability of these docs

- `spec/` and `architecture/` are kept current with the shipping code. PRs that change behavior should update them.
- `topics/` is reference material. It's slower-moving and more durable; corrections welcome (see [`../CONTRIBUTING.md`](../CONTRIBUTING.md)).
- `process/` is a frozen archive — historical artifacts, not living docs. Useful for context, not for "what is shipping today."

## File naming

- Folders use lowercase + hyphens (`rhythm-traditions/`, `audio-synthesis/`).
- Most files are named for what they cover (`turkish-usul.md`, `west-african.md`).
- Files starting with `_old-` are previous index files we kept for reference. Ignore unless you're spelunking.
- `process/` artifacts keep their dates in the filename when they're snapshots in time (`product-design-2026-03.md`, `notes-2026-04-28.md`).

## Contributing

For pattern additions or musicology corrections see [`../CONTRIBUTING.md`](../CONTRIBUTING.md). The cultural-sensitivity notes in there apply to the docs in `topics/rhythm-traditions/` too.
