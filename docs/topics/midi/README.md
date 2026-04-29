# MIDI

Everything about MIDI: the wire protocol, the Web MIDI API, the `.mid` file format, and how to map QWERTY keyboards to drum pads.

**Audience:** developers adding MIDI to a web app, or anyone designing keyboard/pad triggering UI.

## What's here

| File | Lines | What it covers |
|---|---|---|
| [`reference.md`](reference.md) | ~2,300 | MIDI 1.0 protocol (channel + system messages), GM drum map (notes 27–81), velocity curves, CC table, MIDI clock, MIDI 2.0, the Web MIDI API (input + output + clock), `.mid` file format, generating MIDI files in JavaScript |
| [`keyboard-mapping.md`](keyboard-mapping.md) | ~1,900 | QWERTY-to-pad mapping conventions (Ableton, FL Studio, MPC, custom), keyboard shortcut design for production, keydown event handling in JS, velocity layers, focus management, accessibility |

## Reading order

1. **`reference.md`** — `Web MIDI API` section first if you just want input/output working today; the protocol section if you need to understand *what* the bytes mean.
2. **`keyboard-mapping.md`** when you're designing the UX for triggering sounds without a hardware controller — which conventions feel right, which traps to avoid.

## In BeatForge

The shipping MIDI integration lives in [`app/src/modules/midi/`](../../../app/src/modules/midi/) (input mappings, output sink, clock I/O) and the secret `?tab=_midi` panel. The hot-unplug guard added in commit [`024d246`](https://github.com/cemergin/beatforge/commit/024d246) came directly out of the wire-level lessons in `reference.md`.

## Gotchas worth knowing

- Web MIDI requires a permission prompt; iOS Safari still doesn't ship it as of Apr 2026 — plan a graceful fallback.
- Devices can disconnect mid-session. Wrap every `output.send()` so a closed port doesn't crash your bus listeners. (BeatForge does this in [`app/src/modules/midi/sink.ts`](../../../app/src/modules/midi/sink.ts).)
- MIDI clock is 24 PPQN — your scheduler tick rate has to be a multiple, or you'll drift.
