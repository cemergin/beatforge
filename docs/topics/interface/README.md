# Interface design

UI, UX, and visual design research for music software. What makes a drum machine *feel* like an instrument vs. a spreadsheet. How visualization can teach without explaining.

**Audience:** designers, design-aware developers, music-tech founders. Heavy on Roland / Elektron / Ableton / Native Instruments / Teenage Engineering precedents.

## What's here

| File | Lines | What it covers |
|---|---|---|
| [`hardware-instruments.md`](hardware-instruments.md) | ~800 | Hardware instrument UX: knobs vs sliders vs buttons, encoder feel, RGB pad design, multi-function controls, page-and-mode systems, the unique grammar of step-sequencer hardware (TR-808, MPC, OP-1, Polyend Tracker, Elektron Digitakt) |
| [`software-music.md`](software-music.md) | ~1,400 | Music-software UI patterns: piano-roll vs. step-grid vs. tracker, automation lanes, the "zoom is everything" problem, MIDI clip editing, browsers and tagging, why DAW UIs all converged. Plus mobile-music UX and what's different on touch |
| [`visual-design.md`](visual-design.md) | ~1,200 | Visualization systems for music: waveforms vs. spectrograms, beat dots vs. piano roll, color-as-velocity, motion design for play heads, accessibility for color-coded structures, the WAV/MIDI export visual layer |
| [`world-percussion-sound.md`](world-percussion-sound.md) | ~300 | How world-percussion timbres translate to a synthesized 5-voice palette (KK / SN / HH / OH / CP). Which traditions need re-mapping (tabla, gamelan, frame drums). Why "808 = kick" doesn't always work |

## Reading order

1. **`software-music.md`** — broadest coverage; if you've never designed a music UI, start here.
2. **`hardware-instruments.md`** — if you're making something that *feels* like an instrument, even on a screen.
3. **`visual-design.md`** — when you're past the layout and into the moving parts.
4. **`world-percussion-sound.md`** — when you realize the 808 grammar doesn't fit a tabla bol or a Balinese kendang.

## Themes that recur

- **Density vs. clarity.** Pro music software is dense by necessity; consumer-facing isn't. BeatForge tries to be both, and the seams show.
- **Hierarchical reveal.** Every great music UI has 4–5 zoom levels (track → section → bar → step → individual hit). The zoom level is *not* a slider — it's a separate UI mode.
- **Motion is information.** A play head that smoothly traverses tells you something a static highlight can't.
- **Conventions are real.** "Hold shift to multi-select" "double-click to rename" — break these and your app feels broken.

## In BeatForge

The shipped UI tries to honor these patterns:
- Practice mode = single-track focus, hardware-instrument feel
- Studio mode = multi-track grid, software-grammar
- Library mode = browse + filter, content-first
- Beat-grouping dots = "motion is information" applied to additive meter

For the **shipping voice and brand** see [`../../process/manifestos/voice-style-guide.md`](../../process/manifestos/voice-style-guide.md).

## Related

- [`../audio-synthesis/drum-synthesis.md`](../audio-synthesis/drum-synthesis.md) — the sound side of `world-percussion-sound`
- [`../../architecture/react-app.md`](../../architecture/react-app.md) — how these patterns translate into actual React component architecture
