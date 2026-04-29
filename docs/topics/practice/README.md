# Practice + pedagogy

How musicians actually get better — and how to build software that helps instead of just metronoming at them.

**Audience:** developers building practice features, educators, anyone who's frustrated their metronome doesn't have a real practice loop.

## What's here

| File | Lines | What it covers |
|---|---|---|
| [`methodology.md`](methodology.md) | ~1,300 | Deliberate-practice theory (Ericsson, the 10,000-hour-rule's actual nuances). Speed-training protocols (the "increase by 5 BPM every 2 minutes" loop and its variants). Random-mute exercises. The 40 Percussive Arts Society rudiments and how to drill them. Polyrhythm training. Odd-meter acclimation. Konnakol (Indian rhythmic syllables) as a practice tool. Groove-template exercises. Spaced repetition |

This is the only file in the topic — but it's the densest pedagogical reference in the corpus, drawn from Ericsson, Galamian, the PAS curriculum, and percussion-tradition pedagogy from West Africa, India, and Cuba.

## Highlights

- **The speed trainer is the #1 practice feature.** Almost every tradition's pedagogy includes "play it slow, increase the tempo *only when it stays clean.*" BeatForge's speed-trainer (cycles + time modes) is built on this directly.
- **Random mute exercises** — the click drops out for a measure or two; you have to maintain time. Rare in software, universal in serious practice.
- **Konnakol** — vocalizing rhythmic syllables before playing them is the most underused practice technique in Western music education. The methodology doc has the full system.
- **Recovery patterns** — what to do when you fall off. Step back N BPM, repeat the bar, breathing protocols. Not in most metronomes; should be.

## In BeatForge

Practice mode's speed trainer ([`app/src/modes/Practice/Trainer.tsx`](../../../app/src/modes/Practice/Trainer.tsx) + [`app/src/audio/useMetronome.ts`](../../../app/src/audio/useMetronome.ts)) implements the deliberate-practice ramp loop in its simplest form: "every N bars or M seconds, bump BPM by step, until target is reached." Future work — random mute, konnakol prompts, recovery — is on the roadmap.

## Related

- [`../rhythm-engine/turkish-usul.md`](../rhythm-engine/turkish-usul.md) — Ottoman pedagogical traditions for additive meter
- [`../rhythm-traditions/indian-subcontinent.md`](../rhythm-traditions/indian-subcontinent.md) — konnakol's home tradition
- [`../interface/software-music.md`](../interface/software-music.md) — what practice UI looks like in shipped software (Soundslice, Hooktheory, Trinity College's app, Vexflow demos)
