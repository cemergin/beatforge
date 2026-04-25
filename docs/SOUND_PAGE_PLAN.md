# Sound Page — Design Plan

Working title: **Sound page** (might also call the section "Synth"
internally; user-facing label TBD). Companion to Practice + Studio.

## Goal

A first-class drum-synth lab where users can:
- Pick from a library of **machines** (parameterized synth voices)
- Tune each one with up to 6 knobs (always including pitch + decay)
- Stack up to **8 channels** in a kit, freely renaming and reordering them
- Test on a **16-step on-page sequencer**
- Save the result as a custom kit that appears in the Practice/Studio
  kit picker alongside the built-ins

Existing built-in kits (808/909/707/727/frameDrum/tabla/gamelan) are
**migrated to the same data model** so they're just named bundles of
machine configs.

## Vocabulary (final)

- **Machine**: a parameterized synth voice. The thing you tune.
  Examples: "808 Kick" (a `kick` archetype with specific knob values).
- **Archetype**: the synth template behind a machine. e.g. `kick`,
  `modal`, `fm`, `comb-pluck`. Defines the knob set and the renderer.
- **Preset**: a named knob-value bundle for an archetype.
  Example: `{archetype: 'kick', preset: '808', pitch: 150, decay: 600, ...}`.
  Built-in kits ship as preset bundles.
- **Channel**: a slot in a kit. Identified by **position** (0..4), with
  a label (user-renameable), a 3-char short-label (Practice mode
  chrome), a machine, and per-channel effects. **Exactly 5 channels
  per kit** — matches the existing VoiceId enum so patterns work
  unchanged, and 5 fits cleanly in every visualization.
- **Kit**: 5 channels + kit-level effects (reverb, delay).

## Pattern ↔ kit binding (decided)

**Positional, not by id.** A pattern's tracks map to the kit's channels
**in order**. Track 0 → channel 0, track 1 → channel 1, …  If a pattern
has fewer tracks than the kit has channels, only the first N channels
play. If a pattern has more tracks than the kit has channels (rare —
existing seed patterns max out at 5 tracks), the surplus tracks are
silent.

**Why this works for the existing library**: today's 536 JSON patterns
key tracks by VoiceId (`KK`, `SN`, `HH`, `OH`, `CP`). VoiceId is
already an *ordered enum* — KK=0, SN=1, HH=2, OH=3, CP=4. Loading a
pattern: walk `ALL_VOICES` in order, pull each track if present, route
positionally to the kit's channels.

**Why this works for user kits**: a custom 8-channel kit can have any
labels (e.g. "Sub", "Snap", "Tic", "Bell"). When a 4-track pattern
plays through it, the user hears their first 4 voices regardless of
what they're labeled. A user-authored pattern made *on* a custom kit
implicitly uses positions 0..N-1; if you load it through a different
kit, the same positions map through that kit's channels.

**No channel ids needed**: positions are stable across renames + reorders
of labels (the `label` and `short` are display-only; the position is
the binding). Reordering channels swaps which sound plays a given
track — a feature, not a bug. The user gets exactly the "swap clap
for handclap" magic with one drag.

Schema-wise, we keep `Partial<Record<VoiceId, Track>>` for built-in
patterns (the VoiceId enum continues to act as positions 0..4). The
KitRecipe has `channels: Channel[]` of length 1..8. The engine looks
up `kit.channels[positionOf(voiceId)]` instead of the old
`kit.voices[voiceId]`.

## Data model

```ts
// audio/machines/types.ts
export interface KnobSpec {
  id: string;
  label: string;
  min: number;
  max: number;
  default: number;
  /** "lin" | "exp" — affects slider mapping. Pitch wants exp, decay wants exp,
   *  click amount wants lin. */
  curve: 'lin' | 'exp';
  /** Display unit + formatter. e.g. Hz, ms, % */
  unit: string;
  format?: (v: number) => string;
}

export interface Archetype<C extends MachineConfig = MachineConfig> {
  id: string;                    // 'kick' | 'snare' | 'comb-pluck' | ...
  label: string;                 // user-facing
  knobs: readonly KnobSpec[];    // 1-6 knobs, drives the UI form
  defaults: C;                   // factory preset for "blank machine"
  render: (cfg: C, vc: VoiceCtx, when: number, amp: number, mod?: ModValues) => void;
}

export interface MachineConfig {
  archetype: string;             // archetype id; discriminator for typing
  // …archetype-specific knob fields
}

// Forward-compat: per-step modulation values that can override a knob
// at trigger time. Not exposed in the v1 UI but plumbed through the
// engine so per-step automation can land later without re-architecting.
export interface ModValues {
  [knobId: string]: number;
}

// audio/kits/types.ts

// One color-FX slot per channel — a discriminated union over the v1
// effect types. User picks the type; the type's knobs become editable.
export type ColorFx =
  | { type: 'none' }
  | { type: 'overdrive'; drive: number; tone: number; mix: number }
  | { type: 'bitcrush';  bits: number; rate: number; mix: number }
  | { type: 'filter';    mode: 'lp' | 'hp' | 'bp'; cutoff: number; q: number; mix: number };

export interface ChannelEffects {
  level: number;        // 0-1, channel volume
  pan: number;          // -1 (L) .. +1 (R)
  colorFx: ColorFx;     // one color slot, user-chosen type
  reverbSend: number;   // 0-1, tap into kit reverb
  delaySend: number;    // 0-1, tap into kit delay
}

export interface Channel {
  label: string;                 // user-facing, e.g. "Snare"
  short: string;                 // 3-char Practice/Studio visual
  machine: MachineConfig;
  effects: ChannelEffects;       // mixer strip + 1 color FX
}

export interface KitRecipe {
  id: string;
  name: string;
  user?: boolean;                // built-in vs. user-saved
  channels: [Channel, Channel, Channel, Channel, Channel];   // exactly 5
  effects: {
    // Kit-level (shared) processors. Every channel goes through the
    // master comp + drive; reverb and delay are fed by per-channel
    // sends and run in parallel.
    compressor: { amount: number; attack: number; release: number };
    drive:      { amount: number; tone: number; mix: number };       // master saturation
    reverb:     { decay: number; predelay: number; mix: number };
    delay:      { time: number; feedback: number; mix: number; pingPong: boolean };
  };
  createdAt?: number;
  updatedAt?: number;
}
```

Position in the channels tuple is the identity — no channel id field.
Renaming changes `label`/`short` only; reordering swaps which machine
plays which pattern track.

**Effect architecture**: per-channel sends decide *how much* of each
channel feeds the kit-wide reverb + delay processors. The kit-level
processors decide *how the effect sounds* (decay, time, etc.). One
shared reverb tail + one shared delay line, but every channel chooses
its own contribution.

## Built-in archetypes (v1 list, ~10)

Each has 4-6 knobs, always including pitch + decay where they make
musical sense.

All archetypes now top out at **5 knobs** since `drive` moved to the
channel-FX color slot (overdrive) and the kit-level master drive.
Each archetype's knobs reflect what's actually unique about its
synthesis — no generic saturation slot.

### 1. `kick` — pitch sweep + click

Knobs: `pitch` (Hz), `pitchEnd` (Hz), `pitchDecay` (ms), `decay` (ms),
`click` (0-1) — 5 knobs

Covers: 808/909/707 KK, sub-kick, dub kick.

### 2. `snare` — 2-osc body + filtered noise

Knobs: `pitch` (Hz tonal body), `snap` (noise BP cutoff), `decay` (ms),
`tone` (osc-vs-noise mix 0-1), `noiseDecay` (ms) — 5 knobs

Covers: 808/909 SN, rim, side-stick, brushed snare.

### 3. `hat` — filtered noise with envelope

Knobs: `cutoff` (Hz), `q` (resonance), `decay` (ms), `character`
(HP/BP), `pitch` (oscillator boost amt for metallic edge) — 5 knobs

Covers: closed/open hats, shaker, sizzle ride, pedal.

### 4. `clap` — stacked noise bursts

Knobs: `density` (3-5 bursts), `spread` (ms between bursts),
`decay` (ms tail), `cutoff` (Hz body), `pitch` (slight tonal bias) — 5

Covers: 808 CP, finger snap, slap.

### 5. `tom` — pitch sweep, no click

Knobs: `pitch` (Hz), `pitchEnd` (Hz), `decay` (ms), `tone`
(sine-vs-triangle) — 4 knobs

Covers: tom-tom, kick variant, melodic perc.

### 6. `cowbell` — 2 detuned squares

Knobs: `pitch` (Hz fundamental), `ratio` (1.0-2.5 second osc multiple),
`decay` (ms), `detune` (cents) — 4 knobs

Covers: 727 cowbell, clave, agogo, woodblock, rim.

### 7. `modal` — sum of N damped partials

Knobs: `pitch` (Hz fundamental), `partials` (count 2-6), `damping` (Q),
`decay` (ms), `inharmonic` (0-1, shifts partials away from integer
ratios) — 5 knobs

Covers: frame drum, tabla bayan, gamelan gong, bell, tank drum,
"resonant body" sounds.

### 8. `fm` — 2-op frequency modulation

Knobs: `pitch` (Hz carrier), `ratio` (modulator/carrier freq ratio,
microtonal), `index` (mod depth), `decay` (ms), `feedback` (0-0.9) — 5

Covers: kalimba, marimba, glockenspiel, electric piano-like perc,
metallic FM bells.

### 9. `comb-pluck` (Karplus-Strong family) — impulse + comb feedback

Knobs: `pitch` (Hz, sets comb delay = 1/pitch), `feedback` (0-0.99),
`damping` (LP filter inside loop), `excitation` (continuous 0-1
crossfade: 0 = noise burst, 0.5 = click, 1 = short tone),
`decay` (overall amplitude) — 5 knobs

Continuous excitation morphs along a single axis: pure-noise → tonal-pluck.
Each integer landmark is a recognizable timbre, and intermediate
values discover hybrids ("half-clicked plucked-noise").

Covers: tubular bell, plucked string, kalimba, hand-cymbal scrape,
tank drum, mbira, tine.

### 10. `noise` — pure filtered noise

Knobs: `filter` (LP/BP/HP, discrete), `cutoff` (Hz), `q`, `decay` (ms),
`pitch` (resonant boost) — 5 knobs

Covers: wind, breath, surf, white-noise riser, shaker.

### Wilder archetypes — pulled into v1

You greenlit these "if we can." All are doable; complexity ranges
from trivial (`crackle`) to chewy (`phase-distort`). Implementation
risk ordered low→high; if any prove unwieldy during phase 1 they
slip to phase 2 without breaking anything.

### 11. `wavefolder` — fold a sine through itself

Knobs: `pitch` (Hz), `fold` (0-1, fold amount), `decay` (ms),
`asymmetry` (-1..1, DC offset before folding), `pitchEnd` (Hz) — 5

Covers: harmonic-rich analog distortion character, "metallic" sub
tones, Buchla-style west-coast textures. The wavefolding *is* the
character — no extra drive needed.

Implementation: `WaveShaperNode` with a custom curve generated
once at config-change time.

### 12. `crackle` — random short-noise bursts

Knobs: `density` (events/sec), `cutoff` (Hz), `q`, `decay` (per-burst
ms), `pitch` (resonant peak) — 5 knobs

Covers: vinyl, rain, fire, lo-fi atmosphere, percussive stutter.

Implementation: trigger schedules N short noise bursts at random
times within the decay window, each through a shared bandpass.

### 13. `chip` — PWM square + decay

Knobs: `pitch` (Hz), `pulseWidth` (0-1), `pwmDepth` (0-1, LFO
modulating pulse width), `pwmRate` (Hz), `decay` (ms) — 5 knobs

Covers: retro game/8-bit textures, Atari/NES blip, lead-style perc.

Implementation: a hand-rolled PWM oscillator (sum of saws is the
classic trick) with an LFO modulating the offset. No arpeggiator
in v1 — a pattern step is one chip blip.

### 14. `formant` — bandpass bank tuned to vowel formants

Knobs: `vowel` (continuous "a → e → i → o → u" interpolation),
`pitch` (Hz fundamental), `decay` (ms), `q` (formant sharpness),
`brightness` (high-shelf boost) — 5 knobs

Covers: "speak"-style grunts, vocal stabs, throat percussion,
ethnic vocal-perc.

Implementation: 3 parallel bandpass filters with their center
frequencies set by a vowel LUT, fed by a sawtooth or noise source
that itself has a pitched envelope.

### 15. `phase-distort` — Casio CZ-style

Knobs: `pitch` (Hz), `wave` (saw / square / pulse / resonant — discrete),
`distortion` (0-1, phase nonlinearity amount), `decay` (ms),
`pitchEnd` (Hz) — 5 knobs

Covers: alien metallic timbres, glassy bell-like attack, "digital
synth" character that's distinct from FM and modal.

Implementation: a pre-computed wavetable per `wave` × N distortion
amounts, played via `OscillatorNode.setPeriodicWave`. The most
"chewy" archetype on the v1 list — this is the one most likely to
slip to phase 2 if it bogs us down.

### Microtonal note (important — user-flagged)

All `pitch` knobs operate on **continuous frequency in Hz**, not on
12-EDO semitones. The UI shows three readouts side-by-side:
1. **Hz** (precise, primary) — `247 Hz`
2. **Note name** (musical-friendly) — `B3`
3. **Cents from nearest semitone** — `+0¢` (or `+12¢`, `−7¢`, …)

Cents readout is the bridge for 12-EDO familiarity AND microtonal
honesty. A user playing a Turkish karşılama can dial in `−18¢` from
A and the readout shows it; a user wanting a clean equal-tempered
synth can type `0¢` and trust it. Backing storage is always Hz.

## Modulation routing (v1, intentionally narrow)

Sources:
- **Amp envelope** (the `decay` knob → amp) — already exists everywhere
- **Pitch envelope** (the `pitchEnd` + `pitchDecay` knobs → osc.frequency
  ramp) — exists in `kick` and `tom`

Destinations beyond amp:
- **Filter cutoff** (envelope → biquad.frequency) on `snare`, `hat`, `noise`
- **FM index** (envelope → modulator gain) on `fm` — gives the classic
  "FM bell" enveloped character

The matrix is **fixed per archetype** in v1 — we don't expose a
mod-routing UI. Each archetype's renderer hardcodes which knob drives
which destination. This keeps the UI knob-centric and the synth
predictable. A free routing matrix is phase 3.

### Per-step automation (architecturally complete in v1, UI in phase 3)

You called this out as scope: **every numeric knob is automatable**
across the channel and the kit; only discrete selections (archetype,
color-FX type, channel labels) are not.

**What's automatable** (all numeric knobs):

| Scope | Targets |
|---|---|
| Per channel — machine | All ~5 knobs of whichever archetype is loaded (e.g., kick's `pitch`, `pitchEnd`, `pitchDecay`, `decay`, `click`) |
| Per channel — mixer strip | `level`, `pan`, `reverbSend`, `delaySend` |
| Per channel — color FX | All knobs of the chosen color FX type (e.g., overdrive's `drive`/`tone`/`mix`) |
| Kit — compressor | `amount`, `attack`, `release` |
| Kit — drive | `amount`, `tone`, `mix` |
| Kit — reverb | `decay`, `predelay`, `mix` |
| Kit — delay | `time` (ms variant), `feedback`, `mix` |

**Not automatable** (discrete / structural):
- Archetype selection per channel
- Color FX type per channel (the slot's *what kind*)
- Channel labels / shorts / order
- Compressor / reverb / delay enabled flags (just zero the knobs)

**Schema sketch** (lives on the Pattern, not on the kit — automation
is per-track-per-step musical info, not synth-patch info):

```ts
type AutomationTarget =
  | { kind: 'channel-machine'; channel: 0|1|2|3|4; knob: string }
  | { kind: 'channel-strip';   channel: 0|1|2|3|4; knob: 'level'|'pan'|'reverbSend'|'delaySend' }
  | { kind: 'channel-color';   channel: 0|1|2|3|4; knob: string }
  | { kind: 'kit-comp';   knob: 'amount'|'attack'|'release' }
  | { kind: 'kit-drive';  knob: 'amount'|'tone'|'mix' }
  | { kind: 'kit-reverb'; knob: 'decay'|'predelay'|'mix' }
  | { kind: 'kit-delay';  knob: 'time'|'feedback'|'mix' };

interface AutomationLane {
  target: AutomationTarget;
  /** Sparse: missing entries inherit the previous set value
   *  (sample-and-hold) or interpolate to the next (the lane carries
   *  a `curve: 'step'|'ramp'` flag). */
  values: Array<{ step: number; value: number }>;
  curve: 'step' | 'ramp';
}

interface Pattern {
  // …existing fields…
  automation?: AutomationLane[];
}
```

**Engine plumbing** (decided so phase 1 implements it):

1. The `render(cfg, vc, when, amp, mod?)` signature accepts a
   `mod: { [knobId]: number }` map. Phase 1 implements it for
   machine + channel-FX knobs.
2. The bus-level processors (comp/drive/reverb/delay) read their
   parameter values from a `KitFxState` object that the engine
   updates per-step from the relevant automation lanes.
3. The `engine.tick()` loop, before triggering each note, looks up
   the automation values for that step and supplies them to
   `render()` and to the bus processors.

**v1 ships the entire automation runtime** but the Pattern schema
default is `automation: undefined` (no lanes), so existing patterns
play unchanged. Phase 3 adds the UI for editing lanes.

This is the same pattern we used for the Trainer's `cycleStartMs` —
plumb the seam now, expose the UI later. The cost is one type field
in Pattern + the lookup-and-apply hot path in `tick()`.

## Comb filter + impulse — yes, gets its own archetype

User flagged this specifically. The Karplus-Strong family is a
**delay-line with feedback** — the delay length sets the pitch, the
feedback determines decay, a one-pole lowpass inside the loop sets
the timbre damping (bright vs. mellow), and the excitation impulse
(noise burst, click, short tone) determines initial spectral content.

Web Audio implementation (~30 lines): a `DelayNode` wired to a
`GainNode` (feedback) wired to a `BiquadFilterNode` (lowpass damping)
wired back to the delay input. Trigger by injecting an impulse into
the delay's input. Tubular bell, plucked string, kalimba — all the
same recipe with different knob values + excitation choice.

## Effects: per-channel strip + kit-level processors

### Per-channel effects (each of the 5 channels)

Five things per channel:

- **Level** (0-1) — channel volume
- **Pan** (-1..+1) — stereo placement
- **Color FX** — one user-chosen effect from the menu below
- **Reverb send** (0-1) — how much taps into kit reverb
- **Delay send** (0-1) — how much taps into kit delay

#### Color FX menu (v1: 3 types)

User picks one type per channel. The type determines which knobs are
visible. Switching types resets to defaults (warning before discard).

| Type | Knobs | Use |
|---|---|---|
| `none` | (no knobs) | bypass |
| `overdrive` | `drive` (0-1), `tone` (HP→LP morph), `mix` (0-1) | warmth/grit on snare/clap; hard saturation on a sub kick |
| `bitcrush` | `bits` (1-16), `rate` (200-22050 Hz sample-rate reduction), `mix` (0-1) | lo-fi character; aliased "lofi hat" trick; gritty kick |
| `filter` | `mode` (LP/HP/BP), `cutoff` (Hz), `q` (0.1-10), `mix` (0-1) | tame brightness; resonant snap; per-channel sweep when automated |

If a user wants "distorted snare AND filtered snare," that's two
channels (one snare with overdrive, one with filter) — or it lives
in phase-3 multi-slot effects.

### Kit-level (shared) processors

Four shared boxes, each one instance fed by all channels:

- **Compressor** (master comp on the dry sum):
  `amount` (0-1, single-knob compression: more amount = lower threshold + higher ratio),
  `attack` (ms), `release` (ms)
- **Drive** (final saturation, post-comp):
  `amount` (0-1), `tone` (HP→LP morph), `mix` (dry/wet)
- **Reverb**: `decay` (1-12 sec), `predelay` (0-100ms), `mix`
- **Delay**: `time` (1/4 / 1/8 / 1/8t / 1/16 / free ms),
  `feedback` (0-0.95), `mix`, `pingPong` (toggle)

### Bus chain

```
ch1 ─ machine ─ pan ─ level ─ colorFx ─┐
                                       │
ch2 ─ machine ─ pan ─ level ─ colorFx ─┤
                                       ├─→ shared comp ─→ shared drive ─→ master out
ch3 ─ machine ─ pan ─ level ─ colorFx ─┤
                                       │
ch4 ─ machine ─ pan ─ level ─ colorFx ─┤
                                       │
ch5 ─ machine ─ pan ─ level ─ colorFx ─┘
                                       │
                                       ├─ × revSend ─→ shared reverb ─→ master out
                                       └─ × dlySend ─→ shared delay  ─→ master out
```

Why master comp **before** master drive: comp tames peaks → drive
saturates the smoothed signal. Drive after comp gives "baked in
character" without comp's pumping interacting with saturation
artifacts. This is the standard mastering chain for drum buses.

Why reverb + delay **bypass the comp+drive chain**: tails sound
cleaner if they're not squashed and saturated. The dry sum gets the
character treatment; the wet effects stay airy. (This is the audio
choice; if the user wants verb-into-comp pumping, that's a phase-3
"FX placement" toggle.)

## Software-engineering paradigm: machines as a polymorphic registry

The current 654 lines of kit code (`audio/kits/*.ts`) carry seven
ad-hoc shapes — every kit invented its own internal structure. Adding
the 15 v1 archetypes + 3 channel-FX + 4 kit-FX without a discipline
would be 22 more bespoke shapes. Instead, *every tunable thing*
implements the same interface and lives in a registry.

### Two interfaces, one paradigm

Machines come in two flavors based on how the engine calls them:

```ts
// audio/machines/types.ts

// Common metadata — drives the UI knob form, automation lane targeting,
// preset listing, schema validation. EVERY machine has this.
export interface MachineSpec<TConfig extends MachineConfig = MachineConfig> {
  readonly id: string;                              // 'kick' | 'overdrive' | 'compressor' | …
  readonly label: string;                           // user-facing
  readonly category: 'voice' | 'channel-fx' | 'kit-fx';
  readonly knobs: readonly KnobSpec[];              // 0..N continuous knobs
  readonly discrete?: readonly DiscreteSpec[];      // dropdowns (filter mode, color FX type)
  readonly defaults: TConfig;                       // factory blank
  readonly schema: ZodType<TConfig>;                // runtime validation
  readonly presets?: Record<string, Partial<TConfig>>;  // '808', '909', 'sub' …
}

// VOICE machines: triggered, one-shot per step. The kick, snare, fm,
// modal, comb-pluck etc. — anything the sequencer fires.
export interface VoiceMachine<TConfig extends MachineConfig = MachineConfig>
  extends MachineSpec<TConfig> {
  readonly category: 'voice';
  /** Build + schedule a one-shot. Mod overrides automation values
   *  for *this* trigger only; renderer merges with cfg internally. */
  render(cfg: TConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void;
}

// FX machines: continuous audio in → audio out. Channel color FX
// (overdrive/bitcrush/filter) and kit-level FX (comp/drive/reverb/
// delay). They're built once and live across triggers; mod values
// re-apply parameters without rebuilding the graph.
export interface FxMachine<TConfig extends MachineConfig = MachineConfig>
  extends MachineSpec<TConfig> {
  readonly category: 'channel-fx' | 'kit-fx';
  /** Construct the FX subgraph given a config. Returns input/output
   *  AudioNodes plus a setter that re-applies mod values without
   *  rebuilding nodes (for automation), and a teardown. */
  connect(cfg: TConfig, ctx: AudioContext): FxInstance;
}

export interface FxInstance {
  input: AudioNode;
  output: AudioNode;
  /** Apply mod overrides to the live graph (for per-step automation). */
  apply(mod: ModValues): void;
  /** Tear down (oscillators stopped, nodes disconnected). */
  dispose(): void;
}
```

### Why interfaces (structural) over classes (inheritance)

- Plain objects satisfy the interface via `const Kick: VoiceMachine<KickConfig> = { … }`. No `extends`, no `super`, no instance bookkeeping.
- Tree-shakeable: every archetype is its own module export.
- Easy to mock in tests: just provide an object with the right shape.
- `class Kick extends BaseVoiceMachine` adds zero value here — there's no instance state, no method override, no constructor work. Each machine is a pure record + a renderer.

### The registry

```ts
// audio/machines/registry.ts
import { Kick }        from './voice/kick';
import { Snare }       from './voice/snare';
// … 13 more voice machines
import { Overdrive }   from './fx/overdrive';
import { Bitcrush }    from './fx/bitcrush';
import { ChannelFilter } from './fx/filter';
import { Compressor }  from './fx/compressor';
import { KitDrive }    from './fx/kit-drive';
import { Reverb }      from './fx/reverb';
import { Delay }       from './fx/delay';

export const VOICE_MACHINES = {
  kick: Kick,        snare: Snare,    hat: Hat,         clap: Clap,
  tom: Tom,          cowbell: Cowbell, modal: Modal,    fm: Fm,
  'comb-pluck': CombPluck,  noise: Noise,
  wavefolder: Wavefolder,  crackle: Crackle,  chip: Chip,
  formant: Formant,  'phase-distort': PhaseDistort,
} as const satisfies Record<string, VoiceMachine>;

export const CHANNEL_FX = {
  none: NoneFx, overdrive: Overdrive, bitcrush: Bitcrush, filter: ChannelFilter,
} as const satisfies Record<string, FxMachine>;

export const KIT_FX = {
  compressor: Compressor, drive: KitDrive, reverb: Reverb, delay: Delay,
} as const satisfies Record<string, FxMachine>;

export type VoiceArchetypeId = keyof typeof VOICE_MACHINES;
export type ColorFxId        = keyof typeof CHANNEL_FX;
export type KitFxId          = keyof typeof KIT_FX;
```

The `as const satisfies Record<string, VoiceMachine>` clause is the
key trick: it preserves the literal-string keys for the type system
(so `VoiceArchetypeId = 'kick' | 'snare' | …` is automatic) while
still requiring every value to satisfy `VoiceMachine`. Drop a key,
TS yells; add a key without a matching machine, TS yells. Same drift
guard we used for `ALL_KITS satisfies readonly KitId[]`.

### The engine: 100% ignorant of specific archetypes

```ts
class AudioEngine {
  // …existing scheduler / cursor / bar logic…

  private triggerChannel(channelIdx: number, when: number, vel: Velocity): void {
    const channel = this.kit.channels[channelIdx];
    const machine = VOICE_MACHINES[channel.machine.archetype as VoiceArchetypeId];
    if (!machine) return;  // unknown archetype — silently skip
    const mod = this.lookupAutomation(channelIdx, this.currentStep);
    machine.render(channel.machine, this.voiceCtx, when, ampFromVel(vel), mod);
  }
}
```

Adding a new archetype: write its module + add it to the registry.
**Zero engine change.** Same for adding a new color FX or kit FX —
the channel strip / kit FX bus dispatch by registry lookup, never
by archetype-specific code.

### Live instances: `ChannelStrip` + `KitFxBus`

These are the long-lived audio graphs that wrap stateless machines
into the bus chain. They're classes (state is genuinely there: live
AudioNodes, pending FxInstance disposals) — and they own the
graph-building/teardown work.

```ts
// audio/runtime/ChannelStrip.ts
export class ChannelStrip {
  readonly input: GainNode;    // machine output connects here
  readonly tapsRev: GainNode;  // → kit reverb bus
  readonly tapsDly: GainNode;  // → kit delay bus
  readonly toMaster: GainNode; // → comp/drive chain
  private panner: StereoPannerNode;
  private level: GainNode;
  private colorFxIn: GainNode;
  private colorFxOut: GainNode;
  private currentColor: FxInstance | null = null;

  constructor(ctx: AudioContext, masterIn: GainNode, revIn: GainNode, dlyIn: GainNode);

  applyChannel(channel: Channel): void {
    this.level.gain.value = channel.effects.level;
    this.panner.pan.value = channel.effects.pan;
    this.tapsRev.gain.value = channel.effects.reverbSend;
    this.tapsDly.gain.value = channel.effects.delaySend;
    this.swapColorFx(channel.effects.colorFx);
  }

  /** Per-step automation hot-path. */
  applyMod(mod: ModValues): void {
    if ('level' in mod) this.level.gain.value = mod.level;
    if ('pan' in mod) this.panner.pan.value = mod.pan;
    if ('reverbSend' in mod) this.tapsRev.gain.value = mod.reverbSend;
    if ('delaySend' in mod) this.tapsDly.gain.value = mod.delaySend;
    this.currentColor?.apply(mod);
  }

  private swapColorFx(cfg: ColorFx): void {
    this.currentColor?.dispose();
    if (cfg.type === 'none') {
      this.colorFxIn.connect(this.colorFxOut);
      this.currentColor = null;
      return;
    }
    const fx = CHANNEL_FX[cfg.type].connect(cfg, this.ctx);
    this.colorFxIn.connect(fx.input);
    fx.output.connect(this.colorFxOut);
    this.currentColor = fx;
  }

  dispose(): void { /* tear down all nodes */ }
}
```

`KitFxBus` is the same shape but with four FxInstances in a fixed
chain (comp → drive on the dry sum, reverb + delay in parallel).

### How polymorphism shows up across the system

| Surface | What's polymorphic | How it dispatches |
|---|---|---|
| Engine `triggerChannel()` | which voice renderer runs | `VOICE_MACHINES[cfg.archetype].render(...)` |
| ChannelStrip color-fx swap | which FX subgraph builds | `CHANNEL_FX[cfg.type].connect(...)` |
| KitFxBus | which 4 FX subgraphs build | `KIT_FX[id].connect(...)` |
| UI knob form | which knobs render | `VOICE_MACHINES[cfg.archetype].knobs.map(...)` |
| Automation lane editor | which knob ids exist | same — read from the spec |
| Pattern serializer (Zod) | runtime config validation | `VOICE_MACHINES[cfg.archetype].schema.parse(cfg)` |
| Preset picker | which presets exist | `VOICE_MACHINES[cfg.archetype].presets` |

**Single-source principle**: a new archetype declares its knobs once;
every system above reads from that one source. No string-based
duplicate "knob registries" floating around.

### Module layout

**Phase 1 layout** (existing kits + engine untouched, new system added):

```
app/src/audio/
├── engine.ts                     # UNCHANGED — production scheduler
├── tempo.ts                      # UNCHANGED
├── useMetronome.ts               # UNCHANGED
├── kits/                         # UNCHANGED (existing imperative kits)
│   ├── _util.ts
│   ├── drum-machine.ts           # 808/909/707
│   ├── tr-727.ts
│   ├── frame-drum.ts
│   ├── tabla.ts
│   ├── gamelan.ts
│   ├── types.ts
│   └── index.ts
│
├── machines/                     # NEW — the declarative system
│   ├── types.ts                  # MachineSpec, VoiceMachine, FxMachine, FxInstance, KnobSpec
│   ├── registry.ts               # VOICE_MACHINES, CHANNEL_FX, KIT_FX
│   ├── voice/
│   │   ├── kick.ts               # exports `Kick: VoiceMachine<KickConfig>`
│   │   ├── snare.ts … phase-distort.ts   # 15 archetypes total
│   ├── fx/
│   │   ├── overdrive.ts          # channel-fx: ColorFx 'overdrive'
│   │   ├── bitcrush.ts           # channel-fx
│   │   ├── filter.ts             # channel-fx
│   │   ├── compressor.ts         # kit-fx
│   │   ├── kit-drive.ts          # kit-fx (master saturation)
│   │   ├── reverb.ts             # kit-fx
│   │   └── delay.ts              # kit-fx
│   └── _shared/                  # waveshaper curves, biquad helpers, env shapes
│       └── envelope.ts
│
└── runtime/                      # NEW — live audio graph wrappers
    ├── ChannelStrip.ts           # per-channel bus
    ├── KitFxBus.ts               # kit-level effects bus
    └── sound-engine.ts           # 16-step looper for the Sound page
```

`app/src/modes/Sound/` (new) hosts the Sound page UI and consumes
`runtime/sound-engine.ts`. **Practice and Studio import nothing from
`machines/` or `runtime/` in phase 1.**

**Phase 2 layout** (after migration):

```
app/src/audio/
├── engine.ts                     # REFACTORED to use runtime/* + machines/registry
├── kits/                         # NOW DATA — KitRecipe per built-in
│   ├── 808.ts                    # exports `Kit808: KitRecipe` (data, no logic)
│   ├── 909.ts … gamelan.ts
│   └── index.ts
├── machines/                     # unchanged from phase 1
└── runtime/                      # unchanged from phase 1
```

The `audio/kits/{drum-machine,tr-727,frame-drum,tabla,gamelan,_util,types}.ts`
files **delete** in phase 2. They're replaced by `KitRecipe` data
files that reference machine archetypes. The 654 lines of imperative
synthesis become ~7 small data files (~50 lines each describing a
`KitRecipe`) plus the 15 voice machines that already exist from phase
1.

### Tradeoffs explicitly considered

**Class-based machine hierarchy** (rejected): adds inheritance
ceremony with no payoff — machines are effectively static records
plus a function. Worse, classes encourage hidden state ("oh let me
cache this in a member") which is exactly the wrong instinct for a
stateless renderer called from a hot scheduler loop.

**Single big union of machine types** (rejected): a `Machine` union
covering both voice and FX would force every consumer to narrow on
`category` constantly. Two interfaces (`VoiceMachine`, `FxMachine`)
with separate registries gives engine and UI cleaner contracts.

**Web Workers / AudioWorklet for FX** (deferred): we stay on
`AudioNode` graphs throughout. AudioWorklet would unlock custom DSP
(true one-pole filters, exact comb tuning) but adds a build pipeline
and worker comms complexity. Phase 1 uses native nodes; if a specific
machine needs Worklet-level precision we add it case-by-case.

**Validation: Zod everywhere** (chosen): every machine has a Zod
schema. Pattern + kit JSON is parsed through them at load time. Drift
between knob ranges and schema constraints becomes a build error.
Same Zod we use today for pattern schemas — no new dep.

## Engine integration — phase-staged

### Phase 1: NEW Sound page engine, parallel to existing

`audio/runtime/sound-engine.ts` is a brand-new, lightweight engine
dedicated to the Sound page. It does NOT inherit from or extend the
existing `AudioEngine`. It owns:

- Its own `AudioContext` (or shares the global one — TBD; see open
  question below)
- A `KitFxBus` for the active kit's compressor/drive/reverb/delay
- 5 `ChannelStrip` instances (one per channel)
- A 16-step looper at a configurable BPM (no Worker needed — Sound
  page tolerates a `setInterval`-class scheduler since it doesn't
  drive Practice's tight metronome)
- Per-channel trigger entry points for the audition `▶` buttons +
  the `1`-`5` keyboard shortcuts

The existing `AudioEngine` (`audio/engine.ts`) is **untouched**.
Practice/Studio continue to call `engine.setKit(kitId)` →
`kitRecipes[id]` → existing voice closures. Same code path, same
sound, same scheduling guarantees.

The two engines never share a kit. Sound page kits live in the new
system; Practice/Studio kits live in the old system. They cross-pollinate
in **phase 2**.

### Phase 2: convergence

`audio/engine.ts` is refactored to use the same machine registry +
ChannelStrip + KitFxBus the Sound page already uses. The signature
becomes:

```ts
engine.setKitRecipe(recipe: KitRecipe): void;
```

Each mode (Practice / Studio / Sound) resolves a kit id to a recipe —
checking built-ins first, then user kits in IndexedDB — and hands the
full recipe to the engine. The Web Worker scheduler stays (it's the
heart of timing reliability); only the trigger path changes from
"call the kit's voice closure" to "look up the channel's machine in
the registry, render through the channel strip."

The lightweight Sound-engine from phase 1 either:
- (a) Continues as a separate, simpler engine for the Sound page (the
  Sound page doesn't need the Worker scheduler), OR
- (b) Gets folded into the main engine with a "lite mode" flag.

Probably (a) — keeping the Sound page's engine simple is a feature.
The Sound page's bar of "good enough" timing is much lower than
Practice's "this is what you're practicing against."

**Decision deferred until phase 2** — phase 1 doesn't need to commit
yet.

## Sound page UX (top-down layout)

```
┌─────────────────────────────────────────────────────────────────┐
│ Sound · machine browser & kit builder              [save kit]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  KIT  [Untitled Kit  ▼]   5 channels (positional)               │
│  ┌──────┬──────┬──────┬──────┬──────┐                           │
│  │ ch 1 │ ch 2 │ ch 3 │ ch 4 │ ch 5 │  drag to reorder           │
│  │ Kick │Snare │Closed│Open  │Clap  │                            │
│  │ ▶ 🔊 │ ▶ 🔊 │ ▶ 🔊 │ ▶ 🔊 │ ▶ 🔊 │  ▶ = trigger this voice    │
│  └──────┴──────┴──────┴──────┴──────┘                           │
│   ▲                                                              │
│   selected — edit below                                          │
│                                                                  │
│  CHANNEL                                                         │
│  Label: [Kick______]   Short (3): [Kic]    Color: [● coral]     │
│                                                                  │
│  MACHINE   Archetype: [kick     ▼]    Preset: [808 ▼]  [▶ test] │
│                                                                  │
│  ◯ Pitch       150 Hz    ━━━━━●━━    [ B3  +0¢ ]                │
│  ◯ Pitch end    40 Hz    ━━●━━━━━                               │
│  ◯ Pitch decay  80 ms    ━●━━━━━━                               │
│  ◯ Decay       600 ms    ━━━━━━━●                               │
│  ◯ Click       0.0       ●━━━━━━━                               │
│  ◯ Drive       0.2       ━━●━━━━━                               │
│                                                                  │
│  CHANNEL FX (this channel)                                       │
│  ◯ Level   80%   ◯ Pan    0     ◯ Rev send 30%  ◯ Dly send 0%   │
│  Color FX: [overdrive ▼]   ◯ Drive 40%  ◯ Tone 50%  ◯ Mix 100%  │
│                                                                  │
│  KIT FX (shared across channels)                                 │
│  Comp     amount 30%  attack 5ms  release 80ms                   │
│  Drive    amount 20%  tone 60%  mix 100%                         │
│  Reverb   decay 2.4s  predelay 20ms  mix 50/50                  │
│  Delay    time 1/8  feedback 0.4  mix 25%  ping-pong [off]       │
│                                                                  │
│  TEST SEQUENCER  16 steps · ♩=120                                │
│  ch1 ░ █ ░ ░ █ ░ ░ ░ ░ █ ░ ░ █ ░ ░ ░  [▶]                       │
│  ch2 ░ ░ ░ ░ █ ░ ░ ░ ░ ░ ░ ░ █ ░ ░ ░                            │
│  ch3 █ ░ █ ░ █ ░ █ ░ █ ░ █ ░ █ ░ █ ░                            │
│  ch4 ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░                            │
│  ch5 ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Per-channel trigger button (audition)

Each of the 5 channel cards has a small `▶` button that fires the
voice once at full velocity, ignoring the test sequencer. This is the
synth-lab equivalent of "tap a key to hear the patch" — essential for
sound design. Trigger respects the channel's effect strip (level/pan/
sends) so you hear the voice as it would mix in context.

Behaviour: click the channel `▶` → the engine plays that channel's
machine through the live effect chain at `amp = 1.0`. No scheduling,
no metering — just a one-shot. Keyboard shortcut: `1`-`5` triggers
channels 1-5 (handy for quickly comparing sounds).

Why top-down (vs. left-rail kit / center channel / right effects):
- Stacks naturally on narrow screens (mobile, small windows)
- Forces a single "you are editing this thing right now" focus
- The progressive disclosure reads as a story:
  *kit → channel → machine → effects → test*

The 16-step test sequencer is a stripped-down version of Practice's
LinearGrid; same engine, same kit (the in-edit one), unsaved changes
preview live.

## Practice + Studio integration

Practice and Studio's Kit panel grows to:
- Built-in kits (existing 7) shown first, in the existing order
- A divider, then user kits, sorted by `updatedAt` desc
- Long-press / right-click → "Edit in Sound page"

Practice's Linear/Circular/Pill grids show channels by their **3-char
`short` label** (the user-set abbreviation) instead of the hardcoded
`KK/SN/HH/OH/CP`. The engine and pattern data don't change — only
the visual chrome reads from `kit.channels[i].short`.

Patterns made on a custom kit are bound to that kit's channel ids.
Loading a pattern with unknown channel ids = the unknown ids are
muted (graceful degradation, no crash).

## Persistence

- New Dexie table `userKits` parallel to `userPatterns`.
- Each `UserKit` is JSON-serializable (just numbers + strings).
- Export/Import support (similar to user patterns).
- Share-link: future. The kit id can travel in a pattern's `kitId`
  field; recipient resolves by checking their local user kits, falling
  back to the seed kit if absent.

## Migration of built-in kits

Convert the 7 existing kits (`808`, `909`, `707`, `727`, `frameDrum`,
`tabla`, `gamelan`) into the new declarative form **in the same pass**.
Concretely:

1. Rewrite each kit's voices as `MachineConfig` records using the
   archetype matrix above.
2. Build per-archetype renderers (~10 archetype × ~30-50 lines each).
3. Audit-compare: each migrated kit should sound bit-identical or at
   worst very-close to its current rendering (manual A/B + a snapshot
   test that records output buffer hashes).

Mapping draft (we'll iterate during implementation):

| Built-in | Channel slots (existing) | Archetype each maps to |
|---|---|---|
| 808 | KK/SN/HH/OH/CP | kick / snare / hat (HP) / hat (HP open) / clap |
| 909 | KK/SN/HH/OH/CP | kick / snare / hat / hat (open) / clap |
| 707 | KK/SN/HH/OH/CP | kick / snare / hat / hat (open) / clap |
| 727 | KK/SN/HH/OH/CP | cowbell / cowbell / cowbell / cowbell / cowbell (different pitches) |
| frameDrum | KK/SN/HH/OH/CP | modal × 5 (different partials/damping) |
| tabla | KK/SN/HH/OH/CP | modal (bayan) / fm (na) / fm (tin) / modal (open) / fm (slap) |
| gamelan | KK/SN/HH/OH/CP | modal × 5 (different inharmonic ratios) |

This is also the opportunity to remove the magic numbers from
imperative code — they all become named knob defaults in preset bundles.

## Phasing — production-safe ordering

**The existing system serves real users today.** Practice + Studio +
Library + 7 kits + 536 patterns + URL share links are all working
production paths. Migrating the imperative kit code to the new
declarative model carries real regression risk (subtle Web Audio
timing differences, envelope shapes that "sound right" only because
of the exact existing code). We *don't* want to touch that until the
new system is proven musically and architecturally sound.

The phasing is therefore: **build new alongside, prove, THEN migrate.**

### Phase 1 — new system standalone, behind the Sound page

Everything new lives in new directories. **Nothing in `audio/engine.ts`
or `audio/kits/*.ts` changes.** Practice/Studio/Library keep playing
through the existing imperative kits exactly as they do today.

What ships:
- `audio/machines/{types,registry}.ts` — interfaces + dispatch tables
- `audio/machines/voice/*.ts` — 15 archetypes (kick → phase-distort)
- `audio/machines/fx/*.ts` — 7 effects (4 channel FX types: none/
  overdrive/bitcrush/filter; 4 kit FX: compressor/drive/reverb/delay
  — wait, drive is shared with channel? No — channel `overdrive` and
  kit `drive` are *different machines*, each registered separately)
- `audio/runtime/ChannelStrip.ts`, `audio/runtime/KitFxBus.ts`
- **`audio/runtime/sound-engine.ts`** — a NEW lightweight engine
  dedicated to the Sound page. It owns its own bus chain and a tiny
  16-step looper. **It does not touch the existing AudioEngine.**
- New `/sound` route + Sound page UI (top-down layout per the sketch)
- New Dexie table `userKits` for saved kits

What stays unchanged:
- `audio/engine.ts` — the production scheduler, used by Practice/Studio
- `audio/kits/*.ts` — the existing 7 imperative kits (808/909/707/727/
  frame/tabla/gamelan)
- The kit picker in Practice/Studio shows ONLY the built-in 7
- User kits saved on the Sound page **are not yet visible in
  Practice/Studio**. They live in the Sound page only.
- Pattern schema — no `automation` field added yet (patterns continue
  to work as today). Forward-compat for automation comes in phase 2
  when the new system replaces the old engine path.

What you can do at the end of phase 1:
- Open the Sound page, browse machines, tweak knobs, hear them
- Build a kit with 5 channels + per-channel and kit-level FX
- Trigger individual channels, run the 16-step test sequencer
- Save user kits to IndexedDB and recall them

What you *can't* do at the end of phase 1:
- Use a user-saved kit in Practice or Studio (that's phase 2)
- Have automation in patterns (that's phase 2)

This is the "validate the system is fun and sounds amazing" milestone.
The Sound page is the proving ground; if a machine doesn't sound
right, we fix it here without affecting any other surface.

**Production risk in phase 1: zero.** The new code is in new files,
the new engine is in a new file, the only place it runs from is the
new `/sound` route.

### Phase 2 — migration

Once phase 1 says "the machines + FX + Sound page are great," we
converge. This is the work that *replaces* the existing kit system:

- Convert each of the 7 imperative built-in kits (`808`, `909`, `707`,
  `727`, `frameDrum`, `tabla`, `gamelan`) into `KitRecipe` data files
  in `audio/kits/*.ts` — they become *data*, not code.
- Refactor `audio/engine.ts` to use `ChannelStrip` + `KitFxBus` +
  the machine registry instead of the old per-voice closures.
  (The scheduler/cursor/bar logic stays; only the trigger path
  changes.)
- Delete the imperative kit files (`audio/kits/drum-machine.ts`,
  `frame-drum.ts`, `gamelan.ts`, `tabla.ts`, `tr-727.ts`).
- Practice/Studio kit picker now shows built-in 7 + user kits from
  the Sound page.
- Add `automation` field to the Pattern schema (optional, defaults
  to undefined → existing patterns play unchanged).
- **Audio parity tests**: `OfflineAudioContext` snapshot per built-in
  kit, comparing the new path's output to the old path's output for
  a fixed trigger sequence. Hash-equality enforced. This is the gate
  that says "we didn't break the 808."

What you can do after phase 2:
- All current behaviour, plus: select a user kit in Practice/Studio,
  patterns play through the user kit's channel-positional binding.
- Pattern files can carry automation lanes (no UI yet).

**Production risk in phase 2: real, but contained.** The parity
tests are the safety net; the Sound page from phase 1 is also live
testing the same code path. If the parity tests fail, we don't ship.

### Phase 3 — polish

- Per-channel filter / bitcrush / compressor as multi-slot effects
  (today: one color FX slot; phase 3: maybe 2 slots, or more types)
- Per-step automation editor UI (the runtime is already there from
  phase 2)
- Kit-level mod routing matrix (free source → destination)
- Kit share links (compressed, like patterns)
- Pattern schema expansion past 5 tracks if/when needed

## Practice mode visual rename

Today: hardcoded `KK / SN / HH / OH / CP` in row labels of LinearGrid /
PillGrid / CircularGrid.

After: each component reads `kit.channels[i].short` (3-char user-set
abbrev). Builtin kits ship with the existing two-letter names extended
to 3 chars (e.g., `KK → "Kic"`, `SN → "Sna"`) for visual continuity.
Layout maintains its current width since 3 chars stays compact.

## Decisions (all resolved)

1. ✅ **Channel ids: positional, not labeled.** A pattern's track index
   is the binding; channel labels are display-only. Renaming/reordering
   never breaks patterns. (See "Pattern ↔ kit binding" section.)

2. ✅ **Built-in kits are read-only.** "Edit" duplicates → user kit.
   Seed integrity preserved.

3. ✅ **Test sequencer is session-only.** Lives in the Sound page,
   cleared on close. Doesn't travel with the kit. Keeps the kit data
   model lean.

4. ✅ **Pitch readout: Hz + note name + cents from nearest semitone.**
   Three readouts, microtonal-honest. Backing storage is Hz.

5. ✅ **Reverb tail bleeds.** No special preview-bypass mode — it just
   rings out. Matches how a real synth/drum machine behaves.

6. ✅ **Channel reorder swaps which sound plays a track** — feature,
   not bug. (Same as #1 — the positional binding makes this clean.)

7. ✅ **All 5 wilder archetypes pulled into v1**: `wavefolder`,
   `crackle`, `chip`, `formant`, `phase-distort`. Implementation
   complexity ordered low→high; the last one (`phase-distort`) slips
   to phase 2 if it gets unwieldy. **Total v1 archetype count: 15.**

8. ✅ **`comb-pluck` excitation: continuous crossfade knob.**
   0 = noise → 1 = tone, with the click in the middle.

9. ✅ **No cap on user kits.** IndexedDB handles thousands. We'll
   revisit if the picker grid feels cluttered.

10. ✅ **Default first-visit kit: 808 duplicate.** User hears
    something familiar immediately, then explores from there.
