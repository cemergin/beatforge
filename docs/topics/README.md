# Topics

Reference material that grew out of building BeatForge. Organized by subject so you can dive into one slice without reading the whole corpus.

Each topic is a folder of focused documents. Start with the topic's `README.md` — it tells you which file to open for which question.

## Index

| Topic | What's there | Useful if you want to… |
|---|---|---|
| [`audio-synthesis/`](audio-synthesis/) | Drum-synth recipes, Web Audio DSP, Tone.js + WAM 2.0 internals | Build kicks/snares/hats with `OscillatorNode`, design a sample-free voice palette, understand what `AudioParam` can and can't do |
| [`midi/`](midi/) | MIDI 1.0 + 2.0 protocol, Web MIDI API, `.mid` file format, QWERTY-to-pad keyboard mapping | Add MIDI I/O to a web app, generate a downloadable MIDI file, design a hardware-feeling keyboard layout |
| [`pwa-audio/`](pwa-audio/) | Service workers, caching strategies, IndexedDB, Wake Lock, Media Session, Background Sync | Make an audio app installable + offline-capable on iOS/Android/desktop |
| [`rhythm-traditions/`](rhythm-traditions/) | 28 region files: West Africa, Cuba, Brazil, Andes, Balkans, Persia, Turkey, India, Japan, China, Mongolia, Gamelan, hip-hop, electronic… | Understand *why* a rhythm sounds the way it does — the cultural history and instruments behind it |
| [`rhythm-patterns/`](rhythm-patterns/) | 600+ notated patterns across 20 region/genre files (step-sequencer grid format) | Pull a specific groove — a Cuban son clave, a Mande djembe ensemble, a J Dilla shuffle, a UK garage skip |
| [`rhythm-engine/`](rhythm-engine/) | Polyrhythmic sequencer architecture, Ottoman usul system as a case study | Design an engine that handles arbitrary meters, stacked subdivisions, and additive grouping |
| [`interface/`](interface/) | Hardware instrument UX, music-software UI patterns, visualization systems, world-percussion sound design | Design the interface for a music app — buttons, knobs, grids, visualizations, sound choices |
| [`practice/`](practice/) | Deliberate-practice theory, speed training protocols, polyrhythm pedagogy, 40 PAS rudiments | Build practice features that actually help musicians improve, not just metronome at them |

## How to read

- The folder `README.md` is always the gateway — it summarizes the chunks and recommends a path.
- Long files (1,000+ lines) start with a TL;DR and table of contents.
- `_old-*.md` and `_old-*.yaml` files are previous indexes kept for reference; ignore them unless you're spelunking the history.

## Cross-cutting

The deepest BeatForge-specific decisions are in:

- [`../spec/metronome.md`](../spec/metronome.md) — the v1 shipping spec
- [`../spec/library-content.md`](../spec/library-content.md) — how the 28 traditions surface as Library mode
- [`../architecture/`](../architecture/) — current code architecture (audio engine, sequencer, React app)

If you want the *reasoning* behind a decision (and the seven design lenses that produced it), it's in [`../process/design-reviews/`](../process/design-reviews/).
