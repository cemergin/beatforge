# BeatForge Modular Platform Plan

> **TL;DR** — Vision for v2+: one instrument with multiple lenses (modes), shared engine, "module algebra" for composition, internal modularity that quietly enables future extensibility. Per the synthesis doc: pursue the engineering quietly, never make it user-facing.
> **Audience:** future contributors thinking about long-term architecture. Not a current spec.
> **Length:** ~760 lines · ~12 min read.
> **Best for:** the layered-engine vision, what "platform" means here (internal not external), the module-algebra thought experiment.
> **Status:** PROPOSAL — engineering hygiene to pursue quietly; user-facing platform talk explicitly shelved.

**Date**: 2026-04-27
**Status**: Proposal — to be validated by design review before implementation
**Author**: Iterated from architecture conversation 2026-04-27

---

## 0. The vision in one paragraph

BeatForge is not three apps (Practice, Studio, Library). It is **one rhythmic
instrument with multiple lenses**. Practice / Library / Studio / Sound aren't
separate products; they're *configurations of the same instrument*, each
emphasizing a different facet:

- **Metronome** = engine + click voice + tempo
- **Practice** = engine + voices + trainer + library lens
- **Drum synth (Studio)** = engine + full voice/FX design + save
- **Rhythm explorer (Library)** = engine + browse + audition + permute
- **Live performance** (future) = engine + MIDI in/out + minimal UI

Switching tabs becomes "same engine, different lens." Pattern keeps playing,
kit stays loaded, BPM doesn't reset. Just the projection over shared state
changes.

The crown jewels — what's actually open-source-valuable — are not the app
itself but:

1. **The module algebra** — composable audio + control plane primitives
2. **The rhythm corpus** — researched, validated, JSON-shaped, culturally-tagged (536 patterns)
3. **The visualization vocabulary** — linear / pill / circular trio + beat dots,
   a *grammar* for rhythm UIs

## 0a. Product positioning anchors

The engineering plan below is shaped by these non-negotiable product framings
(detailed in `docs/process/design-reviews/brief.md` §1a):

1. **World-rhythm native, not Western-pop with workarounds**: additive
   grouping, non-Western voices, cultural pattern libraries are first-class.
   The engine + data model assume any meter and any rhythmic tradition is
   the default case. We do *not* hardcode 4/4 or 16-step assumptions
   anywhere.

2. **Friendly default, deep engine**: the UI exposes a learner-friendly
   subset; the engine itself stays maximally capable. Power-user surfaces
   (MIDI mappings, custom voices, sample import, automation lanes) appear
   as advanced UIs the engine already supports — they're not engine work,
   they're disclosure work.

3. **Practice is a real, daily product** — founder practices baglama daily.
   The Sequencer + transport + trainer paths get treated as production
   surfaces, not toys. Reliability over an hour-long session > flashy
   demos.

4. **Cultural stories are part of the product**: the Pattern type carries
   `story` field; the Library / Practice surfaces render it; engine doesn't
   care, but data + persistence + serialization preserve it.

These anchors mean: the architecture below is *more conservative on UI/UX
surface area* and *more expansive on engine capability* than the conversation
sometimes suggested. Build deep + hide. Don't build wide + expose.

---

## 1. Two-plane architecture

The system splits into two planes with very different rhythms of change:

```
┌─────────────────────────────────────────────────────────────┐
│ Control plane (events, timing, MIDI)                        │
│   - Pure-ish, mockable, no Web Audio                        │
│   - Tests run synchronously                                 │
│   - Producers emit events; consumers subscribe              │
└──────────────────────┬──────────────────────────────────────┘
                       │ Events flow ↓
┌──────────────────────┴──────────────────────────────────────┐
│ Audio plane (graph nodes, signal routing)                   │
│   - Stateful, tied to AudioContext lifecycle                │
│   - Composable via {input, output, dispose}                 │
│   - Modules wired imperatively, exposed declaratively       │
└─────────────────────────────────────────────────────────────┘
```

The control plane is where MIDI input, scheduler ticks, UI knobs, and
automation lanes all meet. The audio plane is where signal flows. They talk
through events.

---

## 2. Module catalog

### Foundations (no other module deps)

| Module          | Purpose                                                   | Status         |
| --------------- | --------------------------------------------------------- | -------------- |
| `audio-context` | AudioContext lifecycle, Safari/Worklet shims              | Exists         |
| `tempo`         | BPM ↔ stepSec math, time-sig parsing                      | Exists         |
| `pattern-types` | Pattern, SoundPattern, Channel, ColorFx, Kit              | Exists         |

### Audio plane

| Module          | Purpose                                                   | Status         |
| --------------- | --------------------------------------------------------- | -------------- |
| `voices`        | VOICE_MACHINES registry; kick/snare/fm/modal/etc          | Exists, ready  |
| `fx`            | Color FX builders (overdrive/bitcrush/filter)             | Exists, ready  |
| `audio-graph`   | `AudioModule` interface + chain/parallel/tap + primitives | **NEW**        |

### Control plane (engine layer)

| Module          | Purpose                                                   | Status         |
| --------------- | --------------------------------------------------------- | -------------- |
| `events`        | Typed pub/sub bus + Event union                           | **NEW**        |
| `scheduler`     | Worker-driven look-ahead clock; emits trigger events      | Extract        |
| `sequencer`     | Pattern state + scheduler glue                            | Extract        |
| `router`        | Address-based event dispatch to audio modules             | **NEW**        |
| `midi`          | Web MIDI input + output + clock                           | **NEW**        |

### Cross-cutting

| Module          | Purpose                                                   | Status         |
| --------------- | --------------------------------------------------------- | -------------- |
| `persistence`   | Dexie tables + Zod schemas + migrations                   | Exists         |
| `visualizers`   | StepGrid / PillGrid / CircularGrid / BeatDots             | Exists, ready  |
| `transport-ui`  | TransportBar / FeelBar / FxBar (callback-driven)          | Exists         |
| `samples`       | (future) load/manage user samples; new voice machine type | Future         |

### View / state bridge

| Module          | Purpose                                                   | Status         |
| --------------- | --------------------------------------------------------- | -------------- |
| `session`       | `useSession()` shared state above modes                   | **NEW**        |

### Modes (composition shells, ~200 lines each)

`Practice`, `Studio` (formerly Sound), `Library`, future `Performance`.

---

## 3. The audio plane: AudioModule interface

Every audio "brick" implements the same shape:

```ts
// modules/audio-graph/types.ts

export interface AudioModule {
  /** Where signal enters. null for pure sources (oscillators, samplers). */
  input: AudioNode | null;
  /** Where signal leaves. null for pure sinks (analyser, destination). */
  output: AudioNode | null;
  /** Tear down — disconnect everything. Idempotent. */
  dispose(): void;
}

/** Schema entry for a controllable parameter. UIs render from this;
 *  MIDI learn binds CCs by name; automation lanes know the legal range. */
export interface ParamSpec {
  name: string;
  kind: 'continuous' | 'discrete' | 'structural';
  min?: number;
  max?: number;
  options?: readonly string[];   // for discrete (e.g. lp/hp/bp)
  unit?: string;                 // 'Hz' | '%' | 'ms'
  default: number | string;
}

/** Audio modules with addressable params for events to target. */
export interface ControllableModule extends AudioModule {
  params: ParamSpec[];

  /** Universal setter. The module decides HOW to apply based on ParamSpec.kind:
   *   - continuous: AudioParam.linearRampToValueAtTime(value, when + ramp)
   *   - discrete:   immediate switch (e.g., biquad.type = 'lowpass')
   *   - structural: rebuild internals (e.g., new convolver buffer for size) */
  set(name: string, value: number | string, opts?: { when?: number; ramp?: number }): void;
}
```

### Composition operators

```ts
// modules/audio-graph/compose.ts

/** Sequential: a → b → c. Output of one feeds input of next. */
export const chain = (...mods: AudioModule[]): AudioModule => {
  for (let i = 0; i < mods.length - 1; i++) {
    mods[i].output?.connect(mods[i + 1].input!);
  }
  return {
    input: mods[0].input,
    output: mods[mods.length - 1].output,
    dispose: () => mods.forEach((m) => m.dispose()),
  };
};

/** Parallel: signal fans out to all, sums back via a fan-in gain. */
export const parallel = (ctx: AudioContext, ...mods: AudioModule[]): AudioModule => {
  const fanout = ctx.createGain();
  const fanin = ctx.createGain();
  for (const m of mods) {
    if (m.input) fanout.connect(m.input);
    if (m.output) m.output.connect(fanin);
  }
  return {
    input: fanout,
    output: fanin,
    dispose: () => {
      fanout.disconnect();
      fanin.disconnect();
      mods.forEach((m) => m.dispose());
    },
  };
};

/** Tap: split signal off through a send gain into a side bus.
 *  Returns the main module + the send gain (so the parent can adjust). */
export const tap = (
  ctx: AudioContext,
  main: AudioModule,
  sendBus: AudioModule,
  initialSend = 0,
): AudioModule & { send: GainNode } => {
  const send = ctx.createGain();
  send.gain.value = initialSend;
  main.output?.connect(send);
  if (sendBus.input) send.connect(sendBus.input);
  return {
    input: main.input,
    output: main.output,
    send,
    dispose: () => {
      send.disconnect();
      main.dispose();
    },
  };
};

/** Wrap a raw Web Audio node as an AudioModule. */
export const wrap = (node: AudioNode): AudioModule => ({
  input: node,
  output: node,
  dispose: () => {
    try { node.disconnect(); } catch { /* idempotent */ }
  },
});
```

### Primitive factories

```ts
// modules/audio-graph/primitives.ts

export const gain = (ctx: AudioContext, init = 1): ControllableModule => {
  const node = ctx.createGain();
  node.gain.value = init;
  return {
    input: node,
    output: node,
    params: [{ name: 'value', kind: 'continuous', min: 0, max: 1, default: init }],
    set: (name, value, opts = {}) => {
      if (name !== 'value' || typeof value !== 'number') return;
      const when = opts.when ?? ctx.currentTime;
      const ramp = opts.ramp ?? 0.015;
      node.gain.cancelScheduledValues(when);
      node.gain.setValueAtTime(node.gain.value, when);
      node.gain.linearRampToValueAtTime(value, when + ramp);
    },
    dispose: () => node.disconnect(),
  };
};

export const panner = (ctx: AudioContext, init = 0): ControllableModule => { /* … same shape */ };
export const lowpass = (ctx: AudioContext, fc = 1000, q = 0.7): ControllableModule => { /* … */ };
export const highpass = (ctx: AudioContext, fc = 200, q = 0.7): ControllableModule => { /* … */ };
export const delay = (ctx: AudioContext, time = 0.25, fb = 0.35): ControllableModule => { /* … */ };
export const reverb = (ctx: AudioContext, irBuffer: AudioBuffer): ControllableModule => { /* … */ };
export const shaper = (ctx: AudioContext, curve: Float32Array, ovs?: OverSampleType): ControllableModule => { /* … */ };
```

### Channel strip rebuilt as composition

The current `ChannelStrip` is hand-wired in 80 imperative lines. Composed:

```ts
// modules/audio-graph/recipes.ts

export function channelStrip(
  ctx: AudioContext,
  masterIn: AudioNode,
  revBus: AudioNode,
  dlyBus: AudioNode,
): ChannelStrip {
  const main = chain(
    panner(ctx, 0),
    gain(ctx, 0.85),                                    // level
    colorFx(ctx, { type: 'none' }),                     // FX slot — swappable later
  );
  // Three taps off the post-FX signal: dry to master, send to reverb, send to delay.
  const withMaster = tap(ctx, main, wrap(masterIn), 1.0);
  const withRev = tap(ctx, withMaster, wrap(revBus), 0);
  const withDly = tap(ctx, withRev, wrap(dlyBus), 0);
  return withDly; // input is main.input; sends are accessible via .send chain
}
```

### Voice machines stay separate

Voices are *time-scheduled events*, not steady streams. They have their own
abstraction:

```ts
// Already exists in src/audio/machines/types.ts — keep it.
export interface VoiceMachine<C> {
  render(cfg: C, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void;
}
```

Voices are *producers* that connect into any AudioModule's input. By design,
MIDI input or scheduler tick or audition click all dispatch through the same
`render()` call — the address determines which voice + which channel.

---

## 4. The control plane: events, sequencer, MIDI, router

### EventBus — the medium

```ts
// modules/events/types.ts

export type Event =
  | TriggerEvent          // fire a sound
  | ReleaseEvent          // release a held note
  | ParamEvent            // CC / automation / UI knob — continuous or discrete
  | BarEvent | StepEvent  // time markers (UI subscribes)
  | TransportEvent        // play / stop / locate
  | ClockEvent            // 24ppq from external sync (or our own)
  | PatternEvent          // pattern loaded / kit changed
  ;

export interface TriggerEvent {
  type: 'trigger';
  target: string;                  // 'channel.0' or voice address
  velocity: number;                // 0..1 (normalize at the boundary)
  when: number;                    // audio-clock time, sample-accurate
  mod?: Record<string, number>;    // per-trigger param overrides — pitch, decay…
}

export interface ParamEvent {
  type: 'param';
  target: string;                  // 'channel.0.color.cutoff'
  value: number | string;
  when?: number;                   // omit = "now"
  ramp?: number;                   // glide duration (sec); module decides usage
}

export interface ReleaseEvent { type: 'release'; target: string; when: number; }
export interface BarEvent     { type: 'bar';  bar: number;  when: number; }
export interface StepEvent    { type: 'step'; channel: number; step: number; when: number; }
export interface TransportEvent { type: 'transport'; action: 'play' | 'stop' | 'locate'; when: number; bar?: number; }
export interface ClockEvent   { type: 'clock'; tick: number; when: number; }
export interface PatternEvent { type: 'pattern'; action: 'load' | 'kit-changed'; payload: unknown; when: number; }

export interface EventBus {
  emit(event: Event): void;
  on<T extends Event['type']>(
    type: T,
    fn: (event: Extract<Event, { type: T }>) => void,
  ): () => void;                   // returns unsubscribe

  /** Optional: replay events emitted in a window. Enables undo, recording,
   *  "rewind to 2 bars ago." */
  history?: { since(when: number): Event[] };
}

export const makeEventBus = (): EventBus => { /* trivial impl */ };
```

The bus has zero dependencies on Web Audio, DOM, or React. **Synchronous
testability.**

### Sequencer interface

```ts
// modules/sequencer/types.ts

export interface Sequencer {
  // Pattern + meter state
  load(pattern: SoundPattern): void;
  setBpm(bpm: number): void;
  setStepUnit(u: 4 | 8 | 16): void;
  setGrouping(g: number[]): void;
  setSwing(amount: number): void;

  // Transport
  play(opts?: { countInBars?: number }): Promise<void>;
  stop(): void;

  // Read-only state for UIs
  audibleStep(): number;
  audibleStepFor(channel: number): number;
  audibleBar(): number;

  // Event emission — bus is INJECTED, not owned
  bindBus(bus: EventBus): () => void;     // returns unbind
}
```

This is what we extract from the current `SoundEngine` — the timing/scheduling
logic. The audio side (channel strips, voices) becomes a *consumer* of trigger
events emitted by the sequencer, not a member of it.

```ts
// Inside Sequencer.tick():
for (const ch of activeChannels) {
  const cell = pattern.sequence[ch][stepIdx];
  if (cell > 0) {
    bus.emit({
      type: 'trigger',
      target: `channel.${ch}`,
      velocity: cell === 2 ? strongAmp : weakAmp,
      when: tPlay,
      mod: pattern.automation?.[ch]?.[stepIdx],   // future: per-step modulation
    });
  }
}
```

### Router — address-based dispatch

```ts
// modules/router/types.ts

export interface Router {
  /** Register a controllable audio module under an address. */
  register(address: string, module: ControllableModule): () => void;

  /** Register a voice trigger handler for an address (e.g. 'channel.0'). */
  registerVoiceTarget(
    address: string,
    handler: (event: TriggerEvent) => void,
  ): () => void;

  /** Bind to a bus — subscribe to ParamEvents + TriggerEvents and dispatch. */
  bindBus(bus: EventBus): () => void;
}
```

The Router holds the address registry. Param events are split by `.` and
walked: `channel.0.color.cutoff` → look up `channel.0.color` module → call
`set('cutoff', value, opts)`. Trigger events are dispatched to the registered
voice handler.

### MIDI module — bridge to Web MIDI

```ts
// modules/midi/types.ts

export interface MidiModule {
  enable(): Promise<void>;
  inputs(): MIDIInput[];
  outputs(): MIDIOutput[];

  // Input bridge: MIDI messages → events
  bindInput(input: MIDIInput, mappings: MidiInputMap[]): () => void;

  // Output bridge: events → MIDI messages
  bindOutput(output: MIDIOutput, mappings: MidiOutputMap[]): () => void;

  // External clock sync
  syncToExternalClock(input: MIDIInput): () => void;
  emitClockTo(output: MIDIOutput): () => void;
}

/** Mappings are DATA — serializable JSON. Save/load mappings; "MIDI learn"
 *  records `{ cc: 74 } → 'channel.0.color.cutoff'`. */
export interface MidiInputMap {
  match: { kind: 'note' | 'cc' | 'pitchBend'; channel?: number; cc?: number };
  toAddress: string;                        // 'channel.0' or 'channel.0.color.cutoff'
  scale?: 'linear' | 'exp' | { min: number; max: number };
}
```

---

## 5. End-to-end example: a CC event

User turns a physical MIDI knob (CC #74).

```
1. Browser fires MIDIMessageEvent: [0xB0, 74, 90]
                                    ^^^^  ^^  ^^
                                    CC ch1 #74 val=90/127

2. midi-input module:
   const cutoffHz = 200 * Math.pow(40, 90 / 127);   // → ~5800Hz
   bus.emit({
     type: 'param',
     target: 'channel.0.color.cutoff',
     value: cutoffHz,
     when: ctx.currentTime,
     ramp: 0.02,
   });

3. Router receives ParamEvent:
   const mod = registry.get('channel.0.color');     // the FX module
   mod.set('cutoff', cutoffHz, { when, ramp: 0.02 });

4. FX module's set():
   biquad.frequency.cancelScheduledValues(when);
   biquad.frequency.setValueAtTime(biquad.frequency.value, when);
   biquad.frequency.linearRampToValueAtTime(5800, when + 0.02);

5. Audio: filter sweeps over 20ms. No click. Sample-accurate.
```

A UI knob drag does the **exact same thing** — emits a `ParamEvent` with
`target='channel.0.color.cutoff'`. The router doesn't care where the event came
from. Automation lanes too — emit `ParamEvent`s with `when` set 100ms in the
future; the audio param's `linearRampToValueAtTime` queues them on the audio
clock.

---

## 6. Modes as composition shells

Each mode imports the modules it needs and projects state into UI. The same
person who built BeatForge can ship "BeatForge Mini" or "BeatForge Live" by
composing differently — no engine fork.

```ts
// modes/practice/Practice.tsx — sketch of what it looks like in the new world

export function Practice() {
  const session = useSession();           // shared state above modes
  const sequencer = useSequencer(session);
  const visualizers = useVisualizers(sequencer);

  return (
    <Layout sidebar={<PatternBrowser />} stage={<RhythmStage visualizers={visualizers} />}>
      <TransportBar sequencer={sequencer} />
      <Trainer sequencer={sequencer} />     // Practice-specific overlay
      <BeatDots cursor={visualizers.headCursor} grouping={session.grouping} />
    </Layout>
  );
}
```

The mode is ~200 lines, not 533. All the heavy lifting is in modules.

---

## 7. Shared state: `useSession()`

The "instant switching" experience requires shared state that survives tab
switches. A single canonical session object:

```ts
// modules/session/types.ts

export interface Session {
  // Pattern state
  pattern: SoundPattern;                    // current loaded pattern
  kitId: string | null;                     // active SoundKit (if applied separately)

  // Transport state
  bpm: number;
  swing: number;
  countInBars: number;
  playing: boolean;
  currentBar: number;

  // Visual state (synthesized from sequencer)
  audibleStep: number;
  rowCursors: number[];

  // Persistence
  save(): Promise<void>;
  saveAsKit(name: string): Promise<void>;
  load(id: string): Promise<void>;
}

export function useSession(): Session { /* … */ }
```

Tab switch = swap UI tree, keep the session intact. The pattern keeps playing
as you move between Practice / Studio / Library.

---

## 8. Migration strategy: alongside, not replacing

```
Day 0 (now):
  src/
    audio/                      ← existing engines + machines
    components/                 ← existing visualizers
    modes/                      ← existing modes (Practice, Studio, Library, Sound)

Day 1: build alongside
  src/
    audio/                      ← unchanged
    components/                 ← unchanged
    modules/                    ← NEW: future home
      events/
      audio-graph/
      sequencer/
      midi/
      router/
      session/
    modes/
      _Lab/                     ← NEW: hidden dev sandbox to prove modules
      Practice/                 ← unchanged
      Sound/                    ← unchanged
      Studio/                   ← unchanged (legacy)
      Library/                  ← unchanged

Day N: bridge production engine to new event bus
  SoundEngine.tick() now ALSO emits to bus alongside its direct dispatch.
  Subscribers move in one at a time (MIDI out, recorder, future visualizer).

Day N+M: production modes consume from bus
  Modes migrate one at a time onto session + new engine.
  Practice first (forces clean trainer/transport extraction), then Library
  (forces clean pattern-load surface), then Studio (clean kit + save).

Day final: drop direct dispatch
  Once all paths flow through the bus, the direct path is deletable.
```

---

## 9. The `_Lab` hidden route

```
src/modes/_Lab/
  Lab.tsx              ← landing page; cards link to experiments
  EventBusDemo.tsx     ← live event log + buttons to fire test events
  ChainDemo.tsx        ← assemble + audition signal chains
  MidiDemo.tsx         ← list MIDI devices, log incoming, send test notes
  SequencerDemo.tsx    ← drive a Sequencer that emits triggers; show event log
  RouterDemo.tsx       ← demo address dispatch with mock modules
```

```ts
// App.tsx — same dev-only gating as _patterns
const Lab = lazy(() =>
  import('./modes/_Lab/Lab').then((m) => ({ default: m.Lab })),
);

type Tab = 'practice' | 'studio' | 'sound' | 'library' | '_patterns' | '_lab';
//                                                                       ^^^^^

{tab === '_lab' && DEV_MODE && <Lab />}
```

Hidden from prod nav; reachable via URL `?tab=_lab` in dev. Same pattern that
already works for `_patterns`.

### What goes in `_Lab` first

The smallest useful thing: **EventBus + a log viewer**. ~150 lines total.

1. `modules/events/types.ts` — Event union
2. `modules/events/bus.ts` — `makeEventBus()` factory, ~20 lines
3. `_Lab/EventBusDemo.tsx` — fire test events from buttons, log all events
   with timestamps + payloads

Once you can SEE the bus working, every subsequent module becomes "wire it to
the same bus, add a panel that visualizes its contribution."

---

## 10. Open source: the publishable packages story

Eventually the modules become independent npm packages:

```
@beatforge/audio-graph    — Lego primitives + composition
@beatforge/sequencer      — pattern clock + scheduler
@beatforge/voices         — machine catalog (kick/snare/fm/modal/...)
@beatforge/fx             — color FX builders
@beatforge/midi           — Web MIDI bridge
@beatforge/events         — typed event bus
@beatforge/visualizers    — StepGrid / PillGrid / CircularGrid / BeatDots
@beatforge/patterns-lib   — 536 culturally-curated rhythms as JSON
```

Anyone `npm install`s the parts they want. Fork-friendly: "I want a kid's
rhythm trainer" → swap UI, keep engine. "I want sample support" → add a
sample-voice module to the registry.

**Caveat from the design lens**: don't pursue this *yet*. Real OSS platforms
emerge **after** there's pull from external builders. Build internal
modularity (cleaner code) but don't frame anything user-facing around the
platform story until users ask for it. Ship the great app first.

---

## 11. Concrete sequencing of work

Pending design review (which may reorder this). Tentative:

| #  | Step                                                              | Risk |
| -- | ----------------------------------------------------------------- | ---- |
| 1  | `_Lab` route + `modules/events/` (bus + types + demo)             | Low  |
| 2  | `modules/audio-graph/` — interface + chain/parallel/tap + a few primitives | Low  |
| 3  | Refactor `colorFx` to ControllableModule (proves the shape)       | Low  |
| 4  | Refactor ChannelStrip to use composition primitives               | Low  |
| 5  | Refactor master + reverb + delay buses to composition             | Low  |
| 6  | Extract `scheduler` from sound-engine.ts                          | Med  |
| 7  | Wire `Sequencer.tick()` to emit events to the bus (alongside direct dispatch) | Med |
| 8  | `modules/midi/` — input + output + clock; subscribes to bus       | Med  |
| 9  | `modules/router/` — address dispatch; replaces direct setters     | Med  |
| 10 | `useSession()` shared-state hook                                  | High |
| 11 | Migrate Practice to use session + sequencer + new engine path     | High |
| 12 | Migrate Library handoff to use session                            | High |
| 13 | Migrate Studio (formerly Sound) to use session                    | High |
| 14 | Drop legacy `AudioEngine` direct dispatch                         | High |
| 15 | Extract to `packages/` workspace (publishable npm packages)       | Future |

---

## 12. Open questions / decision points

1. **Scope discipline**: how much of the platform vision is real now vs aspiration?
   Design review is the gating step.

2. **Density**: the Sound page is overloaded. Subtraction sprint required
   before further additive work? See design brief.

3. **Visualizers**: do we ship all three (linear/pill/circular) or pick a
   default + hide the others?

4. **Two saves (kit + pattern)**: keep the two-equal-buttons pattern or
   collapse to one save with a "save kit only" submenu?

5. **Polyrhythm UI**: subdivisions badge per channel — keep prominent or
   hide as advanced?

6. **Timing on packages extraction**: now (forces good API) or later (after
   product is proven)?

---

## Appendix A: Today's reality check

The current Sound page has roughly **80 interactive elements visible at first
paint**. That's well into "engineer-built" territory and is what's prompting
the parallel design review. The Sound page in its current form is a power-user
playground, not a beginner's instrument.

The platform vision above only pays off if the user can actually *use* what
we build. Which is what the next document (`2026-04-27-design-review-brief.md`)
is for.
