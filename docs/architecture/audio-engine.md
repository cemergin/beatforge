# Audio Engine (`src/audio/engine.ts` + `src/audio/kits/`)

The audio engine is a single TypeScript class (`AudioEngine`) with direct Web Audio access. No Tone.js, no worklets. ~360 LOC. Scheduling, master bus, reverb routing, and kit dispatch live in `engine.ts`; per-kit synthesis recipes live under `src/audio/kits/` — one file per kit family.

If you only read one source file in this codebase, read `engine.ts`. It is intensively commented and authoritative for timing behavior.

See also: [overview.md](./overview.md), [sequencer-and-patterns.md](./sequencer-and-patterns.md), [react-app.md](./react-app.md).

## `kits/` layout

Synthesis was extracted out of `engine.ts` so the Drum Synth (v2) can reuse the recipes cleanly. The engine never imports Web Audio node constructors directly for voice synthesis; it dispatches into the registry.

```
src/audio/kits/
├── types.ts          # KitRecipe / VoiceRenderer / VoiceCtx + connectVoice()
├── _util.ts          # createOsc/createGain/createBiquad/createNoise — each takes an AudioContext
├── index.ts          # kitRecipes: Record<KitId, KitRecipe> + buildVoiceCtx()
├── drum-machine.ts   # 808 / 909 / 707 — shared branching recipe, per-kit param tables
├── tr-727.ts         # 727 — Latin remap (conga/cowbell/agogo/claves), structurally distinct
├── frame-drum.ts     # doum / tek / finger-snap / zils / slap
├── tabla.ts          # ge / na / tin / tun / dha (composite)
└── gamelan.ts        # inharmonic modal resonators (one tone generator, five parameterisations)
```

Each `KitRecipe` is:

```ts
export interface KitRecipe {
  id: KitId;
  name: string;
  reverbSend: number;       // per-kit reverb send level
  voices: Record<VoiceId, VoiceRenderer>;
}

export type VoiceRenderer = (vc: VoiceCtx, when: number, amp: number) => void;

export interface VoiceCtx {
  ctx: AudioContext;
  destination: AudioNode;       // master bus input
  reverbSend: GainNode | null;  // null pre-ensureCtx()
}
```

`engine.trigger()` resolves `kitRecipes[this.kit].voices[voice](vc, when, amp)`. `setKit()` also rewrites `this.reverbSend.gain.value` from `kitRecipes[k].reverbSend`. There is no backref from kits into the engine.

---

## Class surface

`engine.ts:15-50` — the public shape:

```ts
export class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  kit: KitId = '808';
  running = false;
  pattern: Pattern | null = null;
  bpm = 120;
  swing = 0.5;
  strongAmp = 1.0;
  weakAmp = 0.5;
  groupAmps: number[] = [];

  // Public state for visuals (read each frame via rAF).
  cursors: Record<string, number> = {};   // last-triggered step per track
  bar = 0;

  // Bar-boundary callback (for trainer cycle counting, stop-after).
  onBar: ((bar: number) => void) | null = null;

  private readonly lookaheadMs = 25;
  private readonly scheduleAheadS = 0.12;
  ...
}
```

**Mutable public fields** are a deliberate choice. UI code (`Practice.tsx:103-111`) reads `engine.cursors` on every animation frame and calls `setCursors({ ...engine.cursors })` to trigger re-render. Same for `engine.bar`. There is no observer pattern.

## Audio graph

Built once inside `ensureCtx()` (`engine.ts:52-77`):

```
                ┌───────────────────────────────────────────┐
                │           AudioContext.destination         │
                └────────────────────▲────────────────────────┘
                                     │
                  ┌──────────────────┴──────────────────┐
                  │       DynamicsCompressor            │
                  │   threshold=-14 ratio=3             │
                  │   attack=0.003 release=0.1          │
                  └──────────────────▲──────────────────┘
                                     │
                        ┌────────────┴────────────┐
                        │     master GainNode     │◀────────────┐
                        │   (master volume 0..1)   │             │
                        └────────▲────────────────┘             │
                                 │                               │
                 per-voice outs  │           reverb return 0.6  │
                 (via _connect)  │                               │
                                 │                               │
                                 │        ┌──────────────────────┴──────────┐
                                 │        │  ConvolverNode (2s impulse)     │
                                 │        └──────────────▲─────────────────┘
                                 │                       │
                                 │        ┌──────────────┴──────────────┐
                                 │        │   reverbSend GainNode       │◀─ per-voice tap (wetAmount)
                                 │        │   gain = KIT_REVERB_SEND[k] │
                                 │        └─────────────────────────────┘
                                 │
  ┌──────────────────────────────┴────────────────────────────────┐
  │   Disposable per-voice graphs (Osc/Noise/Filter/Gain)          │
  │   created inline by kit voice functions, .stop(when+dur)       │
  │   — browser garbage-collects after stop.                       │
  └────────────────────────────────────────────────────────────────┘
```

The impulse response is synthesized once on context creation — `makeImpulse(1.8, 2.2)` at `engine.ts:79-91` fills a stereo buffer with exponentially-decaying white noise. No IR file download.

**Reverb send is global**, but the send gain is set per kit. Each `KitRecipe` exports its own `reverbSend` value; `setKit()` rewrites the send gain to `kitRecipes[k].reverbSend`:

| Kit | reverbSend |
|---|---|
| 808 | 0.05 |
| 909 | 0.05 |
| 707 | 0.10 |
| 727 | 0.12 |
| frameDrum | 0.08 |
| tabla | 0.15 |
| gamelan | 0.35 (pavilion ambience is part of gamelan's sound) |

Individual voices can multiply the send level with a `wetAmount` arg to `connectVoice(vc, node, wetAmount)` — e.g. the frame drum's zils use `connectVoice(vc, g, 1.5)` to get 50% more reverb for a shimmery decay.

## The scheduler

BeatForge uses the classic two-clock lookahead scheduler (Chris Wilson's pattern). There are two timers:

1. **`setTimeout`** — fires every `lookaheadMs` (25ms). Not sample-accurate. Just a wake-up.
2. **Web Audio's sample clock** — `ctx.currentTime`, advances with the hardware. All note scheduling uses this clock via `.start(when)` with `when` in seconds.

On each tick (`engine.ts:237-304`), the scheduler asks: "what notes are due in the next 120ms?" and schedules every one of them at a precise `ctx.currentTime` offset. JavaScript GC pauses don't cause audio glitches because Web Audio has already queued the notes on the audio thread.

Constants (`engine.ts:39-40`):

```ts
private readonly lookaheadMs = 25;
private readonly scheduleAheadS = 0.12;
```

25ms tick, 120ms horizon. Pick tick ≪ horizon so no notes slip past the horizon between ticks even under GC.

### Per-track scheduling

The `tick()` loop iterates over every track independently:

`engine.ts:243-272`

```ts
for (const tr of Object.keys(p.tracks) as VoiceId[]) {
  const trackData = p.tracks[tr];
  if (!trackData) continue;
  const meta = trackMeta(trackData, p.steps);
  const stepSec = barSec / meta.subdivisions;
  const isMainDivision = meta.subdivisions === p.steps;

  while (this.nextNoteTimes[tr] < horizon) {
    let tPlay = this.nextNoteTimes[tr];

    // Swing applies only to main-division 16th-step tracks.
    if (p.stepUnit === 16 && isMainDivision && this.nextIdx[tr] % 2 === 1) {
      const swingDelay = (this.swing - 0.5) * 2 * stepSec;
      tPlay += swingDelay;
    }

    const idx = this.nextIdx[tr] % meta.cycle;
    const vel = meta.pattern[idx];
    // Per-group accents only meaningful on main-division tracks —
    // polyrhythm tracks don't align to the grouping.
    if (vel > 0) this.trigger(tr, tPlay, vel, isMainDivision ? idx : -1);

    // Visual cursor updates "now playing" step immediately
    // (audio may fire slightly in the future; visual lag is <=120ms).
    this.cursors[tr] = idx;

    this.nextNoteTimes[tr] += stepSec;
    this.nextIdx[tr] += 1;
  }
}
```

Key points:

- `stepSec = barSec / meta.subdivisions` — **each track** computes its own step duration from its own subdivision count. A 4-step KK track and a 3-step SN track in the same 2-second bar get `stepSec = 0.5s` and `0.667s` respectively.
- `nextNoteTimes[tr]` tracks when this track's next note fires in `AudioContext` seconds.
- `nextIdx[tr]` is the running step counter; `idx = nextIdx % meta.cycle` wraps around the pattern loop.
- Visual cursor is updated in-loop. This means `engine.cursors[tr]` always reflects the **last-scheduled** step, not necessarily the currently-audible one. The scheduling-to-audible gap is bounded by `scheduleAheadS = 120ms`.

### Swing

Only applies to main-division 16th-note tracks. The swing value is 0.5 (straight) to ~0.67 (triplet feel); each odd-indexed step gets pushed later by `(swing - 0.5) * 2 * stepSec` seconds. The `(swing - 0.5) * 2` maps the [0.5, 1.0] range to [0, 1].

Polyrhythm tracks explicitly skip swing (condition `isMainDivision`). Non-swingable patterns never see a non-0.5 swing value because `Practice.tsx:174` gates the setter:

```ts
engine.setSwing(pattern.swingable ? 0.5 + ((swing - 50) / 100) * 0.34 : 0.5);
```

## Bar-boundary derivation (the bug we just solved)

`engine.ts:286-301`:

```ts
// Bar boundary — count off full bars (for trainer / stop-after).
// Derive each bar's index from elapsed time so multiple bars scheduled
// in one tick get unique b values (prev code captured this.bar+1, which
// was the same for every bar in the batch because this.bar only
// updated inside the async setTimeout — all callbacks fired with the
// same index and the speed-trainer stalled at 1).
while (this.nextBarTime < horizon) {
  const tBar = this.nextBarTime;
  const barIndex = Math.round((tBar - this.startTime) / barSec);
  if (barIndex > 0) {
    const b = barIndex;
    const delayMs = Math.max(0, (tBar - this.ctx.currentTime) * 1000);
    setTimeout(() => { this.bar = b; this.onBar?.(b); }, delayMs);
  }
  this.nextBarTime += barSec;
}
```

### The bug

At fast tempos, a single 25ms scheduler tick can cross **multiple** bar boundaries. E.g., at BPM=600 with `steps=2`, a bar is 200ms; 120ms of lookahead straddles ~0.6 bars per tick and under tempo spikes the inner `while` runs 2+ iterations in one tick.

The previous implementation read `this.bar + 1` inside the `setTimeout` closure:

```ts
// OLD, BUGGY
const next = this.bar + 1;
setTimeout(() => { this.bar = next; this.onBar?.(next); }, delayMs);
```

Both `setTimeout` callbacks captured `this.bar + 1` synchronously at schedule time — same value, because `this.bar` only gets written when the *first* timeout fires (which hasn't happened yet when the *second* is scheduled). Result: the trainer received `onBar(1), onBar(1)` instead of `onBar(1), onBar(2)`.

This manifested as the speed trainer stalling forever at the first BPM increment because `Practice.tsx:191` increments only when `trainerBar > 0 && trainerBar % trainerCfg.bars === 0`.

### The fix

Derive the bar index from **elapsed time** (`Math.round((tBar - this.startTime) / barSec)`) rather than an incrementing mutable counter. Each iteration of the outer `while` gets a unique, correct `barIndex` because it's pure math against the invariant `startTime` and a known-good `barSec`.

`Math.round` is used rather than `Math.floor` to tolerate tiny floating-point drift; `barIndex > 0` skips the zero-index bar (the downbeat of the first bar isn't a "bar passed" event).

## Count-in

`engine.ts:153-168`. Unlike a traditional metronome that spaces count-in clicks evenly, BeatForge's count-in clicks fall on the **first step of each grouping subgroup**:

```ts
// Count-in: clicks at the FIRST STEP of each subgroup, with the pattern's
// actual grouping. For 2+2+2+3 (9/8) → 4 clicks at step positions 0, 2, 4, 6
// — unevenly spaced to reflect the grouping, not evenly spaced over the bar.
if (countInBars > 0) {
  const stepSec = barSec / this.pattern.steps;
  const downbeatSteps: number[] = [];
  let acc = 0;
  for (const g of this.pattern.grouping) {
    downbeatSteps.push(acc);
    acc += g;
  }
  for (let bar = 0; bar < countInBars; bar++) {
    downbeatSteps.forEach((stepIdx, beatIdx) => {
      const t = now + bar * barSec + stepIdx * stepSec;
      // Beat 1 of each bar = strong; other group downbeats = medium
      this.countInClick(t, beatIdx === 0 ? 1.0 : 0.6);
    });
  }
}
```

So a 9/8 `2+2+2+3` pattern with `countInBars=1` produces 4 clicks at `{0, 2, 4, 6} × stepSec`. The first click is loud (amp 1.0, 2200Hz); the others are medium (amp 0.6, 1400Hz). This teaches the groove's internal structure before the pattern starts.

Count-in click synthesis (`engine.ts:189-200`) is a 30ms exponentially-decaying sine — kit-independent on purpose.

After count-in, `startTime` is advanced by `countInBars * barSec` (`engine.ts:170`) so bar-index derivation starts at the pattern's first real downbeat.

## Polyrhythm overlay

Separate from pattern-level polyrhythm. The overlay is an **ephemeral click track** overlaid on whatever pattern is playing, used during practice to feel a subdivision other than the pattern's.

State (`engine.ts:48-50`):

```ts
overlay: { subdivisions: number } | null = null;
private overlayNextTime = 0;
private overlayNextIdx = 0;
```

Scheduling (`engine.ts:274-284`) is a parallel loop inside `tick()`:

```ts
if (this.overlay) {
  const overlayStepSec = barSec / this.overlay.subdivisions;
  while (this.overlayNextTime < horizon) {
    if (this.overlayNextTime >= this.startTime) {
      this.overlayClick(this.overlayNextTime);
    }
    this.overlayNextTime += overlayStepSec;
    this.overlayNextIdx += 1;
  }
}
```

`overlayClick` (`engine.ts:203-214`) is a 40ms 1800Hz sine — brighter and shorter than the count-in click, kit-independent.

`setOverlay()` (`engine.ts:216-223`) re-syncs `overlayNextTime` to the nearest upcoming bar boundary when toggled during playback, so the overlay always starts cleanly on a downbeat.

## The 7 kits

Kits are `KitRecipe` objects stored in `kitRecipes: Record<KitId, KitRecipe>` (`src/audio/kits/index.ts`). Voice dispatch (`engine.ts`, in `trigger()`):

```ts
const vc = buildVoiceCtx(this.ctx, this.master, this.reverbSend);
kitRecipes[this.kit].voices[voice](vc, when, base * groupMul);
```

Each `VoiceRenderer` constructs a disposable graph of Web Audio nodes, wires them to `vc.destination` (master bus) and optionally to `vc.reverbSend` via `connectVoice(vc, node, wetAmount)`, and calls `.start(when)` / `.stop(when + dur)`. After stop, the browser garbage-collects the nodes.

### `drum-machine.ts` — 808 / 909 / 707

Three kits with shared voice shape — one file, parameter tables select kick/snare/hat/clap variant per kit.

| Voice | 808 / 909 / 707 |
|---|---|
| KK | Kick (sine sweep with optional 2400Hz click transient) |
| SN | Snare (two-osc body + filtered noise) |
| HH | Hi-hat (HP+BP filtered noise) |
| OH | Open hat (same chain, longer decay) |
| CP | Clap (3× stacked noise bursts) |

808 vs 909 differ by kick frequencies (150→40 vs 180→42) and decay (0.6s vs 0.35s); 909's kick includes a 2400Hz square "click" transient. 707 is shorter and more percussive (dec=0.28) with the same transient.

### `tr-727.ts` — Roland 727 (Latin percussion)

Different enough from 808/909/707 to live in its own file — same `VoiceId` surface (KK/SN/HH/OH/CP), different instruments.

| Voice | 727 |
|---|---|
| KK | Low conga (180→130Hz) |
| SN | High conga (300→220Hz) |
| HH | Cowbell (two squares + BP) |
| OH | Agogo (same synth, lower pitches) |
| CP | Claves (short 2500Hz click) |

### `frame-drum.ts` — Turkish / Arabic / Persian / Balkan

Voice mapping:

| Voice | Sound | Synthesis |
|---|---|---|
| KK | Doum (deep center) | 82→58Hz sine + LP-filtered noise thump |
| SN | Tek (rim edge) | 1500Hz BP noise + 880Hz sine attack |
| HH | Finger snap | 25ms HP noise (6kHz+) |
| OH | Zils (jingles) | Three detuned sines (3.1/5.2/7.3kHz) + HP noise tail |
| CP | Slap | 700Hz BP noise |

### `tabla.ts` — Indian Hindustani

| Voice | Bol | Synthesis |
|---|---|---|
| KK | Ge/ghe (bayan) | 62→**92Hz** UPWARD pitch bend + resonant LPF at 400Hz Q=6 |
| SN | Na/ta (dayan rim) | Modal resonator at 600/1020Hz + HP noise attack |
| HH | Tin (closed bell) | 900Hz sine, 40ms |
| OH | Tun (open resonant) | 500/980Hz sines, 500ms decay |
| CP | Dha | Composite — calls `ge + na` simultaneously |

The bayan's upward bend is the signature "wump" — a lexical cue your ear will pick up even at low volumes.

### `gamelan.ts` — Indonesian metal percussion

All voices share the same recipe via `gamelanTone()`: inharmonic modal resonators (sine partials at non-integer ratios) with higher partials decaying faster. Each voice has different `fundamental`, `partials[]`, and `decay`:

```ts
function gamelanTone(vc, when, amp, fundamental, partials, decay) {
  partials.forEach((ratio, i) => {
    const osc = createOsc(vc.ctx);
    osc.frequency.value = fundamental * ratio;
    // Higher partials decay faster (classic inharmonic metal shape)
    const partialDecay = decay * (1 / (1 + i * 0.4));
    const partialAmp = amp * (0.6 / (1 + i * 0.3));
    // ...
  });
  // + brief HP noise attack transient
}
```

| Voice | Instrument | Fundamental | Partials | Decay |
|---|---|---|---|---|
| KK | Gong ageng (deepest) | 55Hz | 1, 1.78, 2.72, 4.05, 6.3 | 2.5s |
| SN | Kenong (mid kettle) | 220Hz | 1, 2.05, 3.1, 4.8 | 0.8s |
| HH | Saron (bright short) | 660Hz | 1, 2.02 | 0.18s |
| OH | Kempul (hanging gong) | 140Hz | 1, 1.84, 2.9, 4.2 | 1.2s |
| CP | Kempyang (high bell) | 1180Hz | 1, 2.1 | 0.3s |

Gamelan kit pairs with `reverbSend = 0.35` — the highest of any kit — because pavilion ambience is inseparable from the sound.

## Velocity → amplitude

`trigger()` at `engine.ts:306-310`:

```ts
private trigger(voice: VoiceId, when: number, velLevel: Velocity, stepIdx: number): void {
  const base = velLevel === 2 ? this.strongAmp : this.weakAmp;
  const groupMul = stepIdx >= 0 ? this.groupAmpForStep(stepIdx) : 1;
  kitVoice(this, voice, when, base * groupMul);
}
```

Three multipliers chain:

1. **Strong/weak amp** — set via `setAccents(strong, weak)`. Velocity 2 → `strongAmp`; velocity 1 → `weakAmp`. Default 1.0 / 0.5.
2. **Per-group accent** — `groupAmpForStep(idx)` looks up which grouping bucket the step falls into and multiplies by the corresponding entry of `this.groupAmps` (defaults 1.0). Only applies to main-division tracks — polyrhythm tracks pass `stepIdx = -1`.
3. **Voice-internal scaling** — each kit voice recipe has its own internal amp multiplier (e.g. `amp * 0.9` for 727's low conga).

### groupAmpForStep (`engine.ts:118-132`)

```ts
private groupAmpForStep(idx: number): number {
  const p = this.pattern;
  if (!p || !this.groupAmps.length) return 1;
  const grouping = p.grouping;
  if (!grouping || grouping.length === 0) return 1;
  // Steps in a track cycle may exceed pattern.steps for short loops;
  // fold into the bar, then walk grouping to find the owning group.
  const folded = ((idx % p.steps) + p.steps) % p.steps;
  let acc = 0;
  for (let g = 0; g < grouping.length; g++) {
    acc += grouping[g];
    if (folded < acc) return this.groupAmps[g] ?? 1;
  }
  return this.groupAmps[grouping.length - 1] ?? 1;
}
```

The "fold into the bar" step handles tracks with a short `cycle` (e.g. a 3-note snare pattern cycling over a 16-step bar). Step indices beyond `pattern.steps` wrap correctly.

## Load / start / stop lifecycle

```
loadPattern(p)                              engine.ts:134-142
  └─ stores pattern, resets cursors[] and nextIdx[]

start(countInBars)                          engine.ts:144-186
  ├─ now = ctx.currentTime + 0.06           (60ms pre-roll)
  ├─ schedule count-in clicks (if any)
  ├─ startTime = now + countInBars * barSec
  ├─ for each track: nextNoteTimes[tr] = startTime, nextIdx[tr] = 0
  ├─ if (overlay) reset overlayNextTime, overlayNextIdx
  └─ tick()                                 ← kicks off the loop

stop()                                      engine.ts:225-228
  ├─ running = false
  └─ clearTimeout(timerId)                  ← tick() bails on next entry
```

`stop()` does NOT tear down the AudioContext. Nodes that were already scheduled will keep playing to their natural stop times (usually <1s). Calling `start()` again reuses the same context.

## Visual-feedback contract

Two channels feed the UI:

1. **`engine.cursors: Record<string, number>`** — written synchronously during `tick()`. Read by rAF loops in `Practice.tsx:103-111` and `Studio.tsx:156-165`. Always reflects the last-scheduled step.

2. **`engine.bar: number` + `engine.onBar(bar)`** — written in a `setTimeout` at bar-boundary time. The callback is the **only** way to get bar-granular events; cursors can miss them between frames. Used by the speed trainer and stop-after-cycles.

Gotcha: `engine.bar` is written lazily inside the deferred `setTimeout` (`engine.ts:298`). Don't read it synchronously after a `tick()` expecting the latest bar — read it inside `onBar` instead.

---

See [sequencer-and-patterns.md](./sequencer-and-patterns.md) for how a `Pattern` object becomes the input to this engine, and [react-app.md](./react-app.md) for how React reads/writes engine state.
