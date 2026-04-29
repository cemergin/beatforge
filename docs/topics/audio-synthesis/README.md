# Audio synthesis

Building drum sounds in the browser with Web Audio. No samples, no licensing, no MB-heavy bundles — just oscillators, noise, envelopes, and filters.

**Audience:** intermediate JS developers who want to understand *why* an 808 kick sounds like it does, and how to build one. No DSP background assumed.

## What's here

| File | Lines | What it covers |
|---|---|---|
| [`drum-synthesis.md`](drum-synthesis.md) | ~1,200 | Per-drum recipes (kick, snare, hat, clap, tom, cymbal). Subtractive + additive + FM. Physical modeling. Analog vs. digital philosophy. Worked examples from the BeatForge kits. **Start here.** |
| [`web-audio-dsp.md`](web-audio-dsp.md) | ~2,500 | Web Audio API surface (AudioContext, AudioParam, AudioWorklet) plus the DSP primitives (filters, envelopes, oscillators, noise, distortion, compression, reverb, delay) and synthesis recipes (808 kick, 909 snare, FM bell, Karplus-Strong pluck). **Reference depth.** |
| [`web-audio-libraries.md`](web-audio-libraries.md) | ~2,600 | Tone.js internals (Transport, MembraneSynth, MetalSynth, NoiseSynth, Player, Sequence) and WAM 2.0 plugin API (WamNode, WamProcessor, WamEnv, WamGroup). Decision matrix for which library to pick. **Read if you're choosing between bare Web Audio, Tone.js, or WAM.** |

## Reading order

1. **`drum-synthesis.md`** for the mental model — what makes a kick a kick.
2. **`web-audio-dsp.md`** when you want the nuts and bolts.
3. **`web-audio-libraries.md`** only if you're considering a layer above raw Web Audio.

## Why this exists

BeatForge ships ~14 drum machines (808, 909, 707, LinnDrum, plus four world-rhythm kits) entirely synthesized at runtime. The reference is what got written down on the way. The recipes are battle-tested in [`app/src/audio/runtime/sound-engine.ts`](../../../app/src/audio/runtime/sound-engine.ts) and the kit-specific voice files alongside it.

## Related

- [`../../architecture/audio-engine.md`](../../architecture/audio-engine.md) — how the engine actually wires these voices in production
- [`../midi/`](../midi/) — if you want these synth voices triggered by external hardware
- [`../pwa-audio/`](../pwa-audio/) — for the offline + Wake Lock + Media Session layer that wraps it
