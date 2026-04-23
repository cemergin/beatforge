# BeatForge Architecture — Overview

Read this first. It's the 10,000-ft view. For depth on specific subsystems:

- [audio-engine.md](./audio-engine.md) — how `src/audio/engine.ts` schedules audio
- [sequencer-and-patterns.md](./sequencer-and-patterns.md) — the Pattern schema + how it maps to audio
- [react-app.md](./react-app.md) — React shell, state ownership, persistence

---

## What this app is

BeatForge is a browser-only **world-rhythm metronome** built on raw Web Audio. It ships as a PWA with no backend. One `AudioEngine` instance is shared across three tabs:

- **Practice** — canonical mode. Load a seeded pattern, set BPM/swing/accents, run a speed trainer, use tap-tempo, add count-in, use a polyrhythm overlay. The full metronome UX.
- **Studio** — step-sequencer sketchpad. Build a pattern from scratch or remix a seed. Change meter, grouping, per-track subdivisions; save to IndexedDB.
- **Library** — browse the 294+ seed patterns. Zoned-scroll discovery (world map, starter paths, chip-row filters, grouping browser, search). Launches patterns into Practice or Studio.

No backend, no accounts, no sample files. All sounds are synthesized on the fly (7 kits built from oscillators, noise buffers, and biquad filters). All persistence is local (`localStorage` for small state, IndexedDB via Dexie for user patterns).

## Repo layout

```
app/src/
├── main.tsx                      React entry — renders <App/> + <PWAStatus/>
├── App.tsx                       Tab router, owns the AudioEngine ref
├── audio/
│   └── engine.ts                 THE engine — ~780 LOC, 7 kits, scheduler
├── patterns/
│   ├── types.ts                  Pattern, Track, trackMeta() schema + helper
│   └── seed/
│       ├── index.ts              PATTERNS[] barrel + registerPatternSource()
│       ├── turkey-ottoman.ts     ~12 patterns
│       ├── exercise.ts           polyrhythm exercises
│       └── <13 more regions>.ts
├── modes/
│   ├── Practice/Practice.tsx     canonical mode — wires everything
│   ├── Practice/Trainer.tsx      speed trainer UI
│   ├── Studio/Studio.tsx         pattern editing on the same engine
│   ├── Studio/StudioGrid.tsx     per-track subdivision editor
│   ├── Studio/presets.ts         meter presets, blankPattern(), generateId()
│   └── Library/Library.tsx       zoned-scroll browser
├── components/
│   ├── CircularGrid.tsx          SVG polar grid — "lollipop rings"
│   ├── LinearGrid.tsx            horizontal grid, one row per track
│   ├── PillGrid.tsx              grouped pills, one pill per grouping bucket
│   ├── BeatDots.tsx              the dots-below-BPM indicator
│   └── visual-helpers.ts         GROUP_COLORS, groupIndexForStep(), isGroupDownbeat()
└── lib/
    ├── storage.ts                localStorage for highlights/recent/kit-override/volume
    ├── db.ts                     Dexie wrapper for userPatterns + validation
    └── pwa.tsx                   <PWAStatus/> — service worker registration + install toast
```

## The three modes share state

There is exactly **one** `AudioEngine` instance for the lifetime of the page. It's created eagerly in `App.tsx:19-23`:

```ts
const engineRef = useRef<AudioEngine | null>(null);
if (engineRef.current === null) {
  engineRef.current = new AudioEngine();
}
const engine = engineRef.current;
```

Modes receive `engine` as a prop and mutate it directly via setter methods (`engine.setBpm(b)`, `engine.loadPattern(p)`, `engine.setGroupAccents([...])`). React state drives engine state through `useEffect` hooks — never the reverse. The engine exposes mutable public fields (`cursors`, `bar`, `onBar`) that UI reads via rAF polling.

Tab switching calls `engine.stop()` before unmounting a mode (`App.tsx:82-87`), so every mode can assume it starts from a clean slate.

```
                 ┌───────────────────────┐
                 │        App.tsx         │
                 │  engine = useRef(...)  │
                 └─────┬─────────┬────────┘
                       │ prop    │ prop
         ┌─────────────┘         └─────────────┐
         ▼                                     ▼
  ┌──────────────┐                     ┌───────────────┐
  │   Practice   │                     │    Studio     │
  │              │                     │               │
  │  engine.*()  │─────┐         ┌─────│   engine.*()  │
  └──────────────┘     │         │     └───────────────┘
                       ▼         ▼
                  ┌─────────────────┐
                  │   AudioEngine   │  ← single instance
                  │   (Web Audio)   │
                  └─────────────────┘
                       ▲
         ┌─────────────┘
         │
  ┌──────────────┐
  │   Library    │    (preview plays in PatternDetail modal)
  │  engine.*()  │
  └──────────────┘
```

## Data flow: "user clicks play" → "you hear a kick"

Walk-through for the most common path (Practice mode, default pattern, no count-in):

```
┌───────────────────────────────────────────────────────────────────────┐
│ 1. User clicks <button> in Practice                                   │
│    Practice.tsx:250 toggle() fires                                    │
└──────────────────────────────┬────────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│ 2. await engine.ensureCtx()                                           │
│    engine.ts:52-77 — lazily creates AudioContext,                     │
│    master GainNode → DynamicsCompressor → destination,                │
│    ConvolverNode + send gain for per-kit reverb.                      │
│    Resumes suspended context (required by browser autoplay rules).    │
└──────────────────────────────┬────────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│ 3. engine.setBpm(bpm) — sets this.bpm                                 │
│    engine.start(countInBars)                                          │
│    engine.ts:144-186                                                  │
│                                                                       │
│    - schedules count-in clicks (if any) at downbeat positions         │
│      of grouping, not evenly spaced across bar                        │
│    - resets nextNoteTimes, nextIdx, bar, cursors                      │
│    - calls tick()                                                     │
└──────────────────────────────┬────────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│ 4. tick() — engine.ts:237-304                                         │
│                                                                       │
│    Lookahead scheduler: every 25ms, schedule all notes                │
│    whose time ≤ currentTime + 120ms horizon.                          │
│                                                                       │
│    For each track:                                                    │
│      while (nextNoteTimes[tr] < horizon) {                            │
│        if (velocity > 0) trigger(voice, when, vel, stepIdx)           │
│        cursors[tr] = idx         ← UI reads this                      │
│        nextNoteTimes[tr] += stepSec                                   │
│        nextIdx[tr] += 1                                               │
│      }                                                                │
│                                                                       │
│    setTimeout(tick, 25) — scheduler re-arms.                          │
└──────────────────────────────┬────────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│ 5. trigger() → kitVoice() → drumMachineVoice/frameDrumVoice/etc       │
│    engine.ts:306-310, 353-364, then one of:                           │
│      drumMachineVoice   (808/909/707/727)                             │
│      frameDrumVoice                                                   │
│      tablaVoice                                                       │
│      gamelanVoice                                                     │
│                                                                       │
│    Each builds a disposable graph of OscillatorNode, BufferSource     │
│    (noise), BiquadFilter, GainNode — connects to master + reverb      │
│    send tap via e._connect(node, wetAmount).                          │
│    Nodes auto-free after .stop(when + dur).                           │
└──────────────────────────────┬────────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│ 6. Master chain                                                       │
│    node → master GainNode → DynamicsCompressor → destination          │
│    node → reverbSend Gain → ConvolverNode → reverbReturn → master     │
│                                                                       │
│    Speakers. Done.                                                    │
└───────────────────────────────────────────────────────────────────────┘
```

Meanwhile, the UI:

```
┌───────────────────────────────────────────────────────────────────────┐
│ Practice.tsx:103-111 — rAF cursor polling                             │
│                                                                       │
│   useEffect(() => {                                                   │
│     const loop = () => {                                              │
│       setCursors({ ...engine.cursors });                              │
│       raf = requestAnimationFrame(loop);                              │
│     };                                                                │
│     ...                                                               │
│   });                                                                 │
│                                                                       │
│ Engine mutates cursors during tick(); React reads them on every       │
│ frame and triggers a render that redraws the grid cursors.            │
└───────────────────────────────────────────────────────────────────────┘
```

And the bar-boundary side channel:

```
┌───────────────────────────────────────────────────────────────────────┐
│ Practice.tsx:114-123 — bar-boundary callback                          │
│                                                                       │
│   engine.onBar = (bar) => {                                           │
│     setTrainerBar(bar);                 ← advances speed-trainer      │
│     if (stopAfter.mode === 'cycles'                                   │
│         && bar >= stopAfter.value) {    ← stops after N cycles        │
│       engine.stop(); setPlaying(false);                               │
│     }                                                                 │
│   };                                                                  │
│                                                                       │
│ Engine fires onBar via setTimeout scheduled at bar-boundary time      │
│ (engine.ts:292-301).                                                  │
└───────────────────────────────────────────────────────────────────────┘
```

See [audio-engine.md](./audio-engine.md) for the fix that makes the trainer work correctly when multiple bar boundaries fall inside one scheduler tick.

## Key design decisions (why things look the way they do)

### 1. Raw Web Audio, no Tone.js

`engine.ts` uses only `AudioContext`, `OscillatorNode`, `AudioBufferSourceNode`, `BiquadFilterNode`, `GainNode`, `DynamicsCompressor`, `ConvolverNode`. No dependencies for audio. The spec justifies this: "Pure Web Audio API. No Tone.js. Original spec included Tone.js; prototype dropped it; keeping that." Rationale: smaller bundle, no abstraction between us and the hardware, kits synthesize sounds directly rather than wrapping generic `Tone.MembraneSynth`.

### 2. BPM = steps per minute (not quarter notes)

Every grid step is one "beat" for timing purposes. Bar duration is always `pattern.steps × (60 / BPM)`. This means a 9/8 pattern at BPM=276 has a bar of 1.96s (9 × 60/276), because the BPM controls the step rate, not the traditional quarter-note rate. The UI labels BPM as `BPM · step/min` (see `Practice.tsx:411`) to prevent confusion. `stepUnit` (8/16/4) is cosmetic — it drives display labels only; the engine reads only `steps` and `bpm`.

### 3. Per-track independent scheduler (polyrhythm)

Each track in a pattern has its own `subdivisions` count and its own `stepSec`. A 4-beat KK track and a 3-beat SN track scheduled against the same bar duration yields 3:4 polyrhythm naturally. Tracks re-align at every bar boundary. See [sequencer-and-patterns.md](./sequencer-and-patterns.md) for the worked 3:4 example with timing math.

### 4. Closed 5-voice set; 7 kits remap synthesis

Patterns only ever reference `KK | SN | HH | OH | CP`. Each of the 7 kits (808, 909, 707, 727, frameDrum, tabla, gamelan) provides a synthesis recipe for those 5 voices. The 727 remaps `KK` to a low conga; the tabla kit remaps `KK` to a bayan bass with upward pitch bend; etc. This lets any pattern play through any kit without voice-level remapping in the pattern JSON.

### 5. Lookahead scheduler (25ms timer, 120ms horizon)

Classic `setTimeout`-based JavaScript scheduler from Chris Wilson's pattern. `tick()` runs every 25ms; each tick schedules any notes whose time falls within the next 120ms using Web Audio's sample-accurate `AudioBufferSourceNode.start(when)` API. See `engine.ts:39-40` for constants. Visual cursors update during `tick()` immediately (before audio fires), so visual lag is at most 120ms.

### 6. Opacity = velocity (consistent everywhere)

`Velocity = 0 | 1 | 2`. 0 = off. 1 = ghost (rendered at 0.45 opacity). 2 = accent (full opacity). Every visualization (`CircularGrid`, `LinearGrid`, `PillGrid`, `StudioGrid`) implements this mapping identically.

### 7. Tab-based routing, no React Router

There are three tabs + a dev-only `_patterns` sandbox. `App.tsx` stores `tab` as state, persists to `localStorage.bf_tab`, and conditionally renders one mode at a time. No URL routing; no route params. Deep links via `?pattern=<id>` are mentioned in the spec but not implemented in shipped code.

### 8. localStorage for transient UI state, IndexedDB for user content

- `localStorage`: `bf_theme`, `bf_tab`, `bf_pattern`, `bf_view`, `bf_highlights`, `bf_recent`, `bf_kit_overrides`, `bf_master_volume`, `bf_path_progress`, `bf_install_prompt`. All small, synchronous, safe to lose.
- `IndexedDB` (Dexie): `userPatterns` table. Studio saves here; Practice/Library resolve user patterns by id through `registerPatternSource()`.

### 9. Engine state readable, not observable

The engine exposes `cursors: Record<string, number>` and `bar: number` as plain mutable fields (see `engine.ts:32-34`). UI polls them via `requestAnimationFrame`. There's one callback (`onBar`) for bar-boundary events where rAF would miss them. No observer pattern, no event emitter.

**Why rAF polling instead of an onStep callback per note?** A 16th-note pattern at 140 BPM fires 150ms between steps, but polyrhythm patterns can be much faster (a 12-subdivision track in a 4-step bar at 120 BPM ≈ 125ms between steps). A global callback would bombard React with state updates at ~100Hz. rAF at 60Hz is sufficient for smooth visuals, and decouples render frequency from scheduler density.

## What to read next

- If you need to understand **how a sound gets made**: [audio-engine.md](./audio-engine.md)
- If you need to understand **what a Pattern is and how polyrhythm works**: [sequencer-and-patterns.md](./sequencer-and-patterns.md)
- If you need to understand **the React shell, persistence, and mode wiring**: [react-app.md](./react-app.md)
