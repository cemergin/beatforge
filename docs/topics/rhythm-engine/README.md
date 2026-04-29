# Rhythm engine

How to design a sequencer engine that handles arbitrary meters, stacked subdivisions, beat grouping, and additive (aksak-style) meter without going insane.

**Audience:** engineers building rhythm software. Assumes you know what a "step sequencer" is and have at least skimmed the Web Audio docs.

## What's here

| File | Lines | What it covers |
|---|---|---|
| [`polyrhythmic-architecture.md`](polyrhythmic-architecture.md) | ~900 | A universal rhythm engine design. Atomic patterns (variable step count, `stepsPerBeat`, beat grouping, micro-timing). Stack operator (polyrhythm via independent cursors, LCM super-cycle). Chain operator (Zencir / song mode). The TypeScript scheduling engine. UI visualization (linear / circular / chain). 4-level progressive disclosure. JSON pattern format. Euclidean rhythm generation. Phase mapping. |
| [`turkish-usul.md`](turkish-usul.md) | ~1,500 | Ottoman usul as a case study in additive meter. Düm/Tek/Ka stroke vocabulary. Simple → compound usuls (2/4 to 120 beats). Why usul ≠ Western meter. Notation systems. Regional folk rhythms. |

## Reading order

1. **`polyrhythmic-architecture.md`** if you're designing an engine right now.
2. **`turkish-usul.md`** when you hit the question "what does it mean for a 9/8 to be 2+2+2+3 vs. 2+3+2+2" — usul is the most rigorous treatment of additive meter outside academic ethnomusicology.

## Why this matters

Most metronomes hardcode a small set of meters. To handle the world's rhythms — Bulgarian 7/8, Turkish 9/8 zeybek, Indian 16-beat tintal, Ewe 12/8 polyrhythm — you need an engine that:

1. Treats meter as **(steps × stepUnit)** not **(numerator / denominator)**, so 12/8 and 6/4 can share an engine path.
2. Supports **per-track subdivisions** so kick can be on quarter notes while shaker is on triplets.
3. Encodes **grouping** as first-class data (`[2, 2, 2, 3]` for a 9/8 zeybek), not as a styling concern.
4. Handles **chains** (sections, song mode) without a separate scheduler.

The architecture doc walks through each of these.

## In BeatForge

The actual implementation is split across:
- [`app/src/audio/runtime/sound-engine.ts`](../../../app/src/audio/runtime/sound-engine.ts) — the audio scheduler + voice dispatch
- [`app/src/modules/sequencer/`](../../../app/src/modules/sequencer/) — pattern → schedule translation
- [`app/src/audio/scheduler.worker.ts`](../../../app/src/audio/scheduler.worker.ts) — Web Worker tick loop
- [`app/src/components/BeatGroupingDots.tsx`](../../../app/src/components/BeatGroupingDots.tsx) — the visualization

The architecture doc is what we wrote *before* coding it. The shipping code is more pragmatic — single audio runtime, no chain operator yet — but the bones are the same.

## Related

- [`../../architecture/sequencer-and-patterns.md`](../../architecture/sequencer-and-patterns.md) — the production code's actual schema + grouping logic
- [`../../architecture/audio-engine.md`](../../architecture/audio-engine.md) — the runtime that consumes pattern data
- [`../rhythm-patterns/`](../rhythm-patterns/) — the corpus the engine is designed to play
