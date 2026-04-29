# BeatForge Engineering Review #4 — 2026-04-24

Spotlight: 5 commits adding 11 voice machines (clap, tom, cowbell,
modal, fm, comb-pluck, noise, wavefolder, crackle, chip, formant) to
`audio/machines/voice/`. Registry now at 14 of the planned 15
archetypes; phase-distort still pending. Production engine + 7
imperative kits remain untouched per phase-1 plan.

The 11 new files all follow the template established in commits
1ccd4b6→f8bf12d for `kick`/`snare`/`hat`: KNOBS const → Zod schema
→ DEFAULTS → PRESETS → exported `VoiceMachine`. Discipline is high.

---

## TOP 3 — findings on the delta

### 1. `chip` PWM doesn't actually pulse-width-modulate — HIGH

`audio/machines/voice/chip.ts:65-110`. The implementation routes the
sawtooth into `sumGain` (signal path), then routes both the LFO and
the DC-offset `ConstantSourceNode` into `sumGain.gain` (an
AudioParam). That's amplitude modulation, not summation. The actual
output is:

```
shaper.input  =  saw × (1.0 + dc + lfo·depth)
shaper.output =  sign(shaper.input)  ≡  sign(saw)
```

Since the WaveShaper curve is the sign function (`x>0 ? 1 : -1`),
multiplying the saw by any positive scalar leaves the sign — and
therefore the pulse width — unchanged. The `pulseWidth` and `pwmDepth`
knobs are inert in the current build; the audible square always sits
at 50% duty cycle regardless of preset.

When `1.0 + dc + lfo·depth` goes negative (possible when
`pulseWidth ≤ 0.5` and `pwmDepth > 0`), the multiplier flips sign and
the square inverts polarity — a click, not a width change. Worst case
at `pulseWidth=0.05, pwmDepth=0.45`: multiplier swings through zero
twice per LFO cycle → audible periodic clicks that have nothing to do
with PWM.

**Fix (~20 min):** the saw and the offset/LFO need to sum into the
shaper's *input*, not the gain's modulator. Drop `sumGain.gain` as the
mod target; use a second `GainNode` as a passive summing junction
(any audio node with multiple inputs sums). Concretely:

```ts
const sum = ctx.createGain(); sum.gain.value = 1.0;
saw.connect(sum);
dc.connect(sum);                           // summed, not multiplied
if (pwmDepth > 0) lfo.connect(lfoGain).connect(sum);
sum.connect(shaper);
```

Then verify the `bass8` and `vibrato` presets *sound* like they
should. (The `arcade` preset's `pulseWidth: 0.25` is the canonical
NES-arpeggio sound — easy A/B test.)

---

### 2. `wavefolder` asymmetry injects DC — LOW-to-MED (audible thump risk)

`audio/machines/voice/wavefolder.ts:50-55`. The fold curve at
`asymmetry=±1` is `sin((x ± 0.5) · drive · π/2)`. Evaluated at the
sine input's zero crossing (x=0) the curve is `sin(±0.5·drive·π/2)` —
non-zero. That's a baked-in DC offset that runs for the full envelope
duration, then snaps to silence when `env` decays past audibility.

The `ampEnvelope` linear-ramp attack (`attackSec = 0.005`) catches
the onset thump; the `exponentialRampToValueAtTime(0.0001, …)` tail
handles the decay. So in practice DC is ramped-in and decayed-out,
not snapped. **No speaker damage**, but high-asymmetry presets
(`metal: 0.5`, `buchla: 0.3`, `pulse: 0.4`) will have a slightly
"clunky" attack/release artifact compared to a clean sine. A
two-line DC-blocker (highpass biquad at ~30 Hz) between `shaper` and
`env` removes it cleanly — same trick the legacy snare/hat avoid by
construction.

Defer to phase-1 polish; flag here so it doesn't get lost. The
existing `metal` and `buchla` presets are the audible canaries.

---

### 3. `comb-pluck` delay buffer is fragile under future automation — MED

`audio/machines/voice/comb-pluck.ts:65`. `ctx.createDelay(0.05)`
allocates a 50 ms max-delay buffer. The runtime `delayTime = 1/pitch`
is currently safe because the `pitch` knob's min is 80 Hz → 12.5 ms,
well under 50 ms. But:

- The `knobValue(cfg, 'pitch', mod)` lookup means a future automation
  lane could push pitch below 20 Hz (50 ms threshold) without
  Zod-schema reach (mod values bypass schema).
- The 80 Hz floor is also a musically arbitrary limit — bass plucks
  below 80 Hz are useful (low E on bass = 41 Hz → 24 ms delay) and
  the spec has `pitch` going to "as low as makes sense."

Beyond 50 ms, Web Audio silently truncates `delayTime` to the buffer
size — the comb tunes to a different pitch than the user dialed. Hard
to debug from the UI ("why is my 30 Hz pluck ringing at 60 Hz?").

**Fix (~5 min):** allocate a generous max — `ctx.createDelay(1.0)`
covers down to 1 Hz. The buffer is per-trigger, so the cost is a
~88 KB allocation per voice; with 5 channels at 16 steps that's
6.7 MB/sec at 120 BPM — actually meaningful. **Better fix:** size
the buffer once from the knob's *minimum*, e.g.
`const maxDelay = 1 / KNOBS[0].min; ctx.createDelay(maxDelay * 1.5)`.
12.5 ms × 1.5 = 19 ms buffer for current min, scales if the knob's
min ever loosens. A second concern in the same file: there's nothing
that explicitly tears down `delay`/`fb`/`lp` — they're held alive by
the connection graph from `delay → env → destination`. Once `env`
decays to 0.0001 they're inaudible; they get GC'd when JS releases
its refs (which is immediate, since render returns). This is fine in
practice but worth a one-line `setTimeout` guard or — better — make
the `delay → lp → fb → delay` loop *also* feed through `env` (it
already does for output) so when env hits 0.0001 the loop has
nothing to recycle. Already the case; nothing to fix.

---

## Cohesion observations

**Template discipline is excellent — one drift to flag.** All 11 new
files follow the established shape (KNOBS const with `as const
satisfies readonly KnobSpec[]`, Zod schema with min/max from the same
KNOBS array, DEFAULTS object, exported `_PRESETS` record, exported
`VoiceMachine`). The `inharmonicOffset` helper in `modal.ts:51-56`
and `bodyRatio` in `snare.ts:39-43` and `vowelFormants` in
`formant.ts:54-65` are the only file-local helpers — all small, all
pure, all earned. The drift: **`crackle` and `comb-pluck` schedule N
sub-events with magic numbers that should be named constants or
knobs.** `crackle.ts:75 burstDur = 0.012`, `comb-pluck.ts:83
excitDuration = 0.012`, `clap.ts:68 burstDecay = 0.018` — three
copies of "tiny noise burst lifetime," all hardcoded. Either lift
into `_shared/audio.ts` as `BURST_MS = 12` or make `burstDur` a
6th knob on `crackle`/`clap` (currently only 5; the design says
"4-6"). My vote: a single named constant. Knobs cost user-facing
clutter and these defaults are good.

**Presets cover the spec's promises with one weak spot.** The matrix
in SOUND_PAGE_PLAN.md:1015-1023 says modal × 5 covers frame drum,
tabla bayan, gamelan gong, bell, tank drum. Modal's presets
(`modal.ts:38-46`) deliver: `bell`, `frame`, `bayan`, `gong`, `tank`
+ bonus `pot`/`log`. Same for fm (kalimba/marimba/glock/bell/ep —
hits the "covers kalimba, marimba, glockenspiel, electric piano-like
perc, metallic FM bells" promise verbatim). **Gap: `noise` has no
"hi-hat substitute" preset** despite the spec calling for shaker
coverage. The `shaker` preset exists but at `cutoff: 5500, q: 1.5`
it sounds like a pinched maraca, not the high-end hat-like noise the
hat machine's `shaker` preset (`hat.ts:47`) produces. Either delete
the duplicate or differentiate explicitly (e.g., `noise.shaker` =
"egg shaker, low-mid"). Two presets named the same thing covering
different timbres is exactly the kind of "wait, which one?" that
will burn user-testing time.

---

## On the next commit (15th archetype, `phase-distort`)

Worth its own commit, **not** a milestone fold. Reasons:

1. The plan flags it as the "chewiest" — it deserves the same
   spotlight the previous 11 got, with a focused review surface
   instead of getting lost under "v1 done."
2. The implementation is meaningfully different from the others:
   pre-computed `PeriodicWave` tables via
   `OscillatorNode.setPeriodicWave`. The other 14 archetypes use
   stock node types or inline curves; phase-distort introduces a new
   build-time pattern that future archetypes (additive, wavetable)
   may follow. Land it visibly.
3. The risk of a bad PR is low — if it bogs down, the registry
   already exposes 14 working archetypes; nothing breaks.

**Scoping notes for the commit:**
- 5 wave types (saw / square / pulse / resonant + one extra for symmetry,
  e.g. `triangle`). 4 tables × N distortion increments (8 should be
  enough — `setPeriodicWave` interpolates between adjacent tables OK).
- Cache the `PeriodicWave` instances on the `AudioContext`
  (memoize by `{wave, distortion}` key). The CZ tables are cheap to
  generate once, expensive to recompute per trigger.
- `discrete: [{id: 'wave', options: ['saw', 'square', 'pulse',
  'resonant', 'triangle']}]` — same `discrete` pattern Tom and Hat
  and Noise already use.
- Knob set: `pitch`, `wave (discrete)`, `distortion (0-1)`, `decay
  (ms)`, `pitchEnd (Hz)` — 4 numeric + 1 discrete, matches the spec
  word for word.
- Presets: at minimum `bell`, `glassy`, `alien`, `lead`, `pad`. Five
  named presets is the established pattern.

If `setPeriodicWave` table-bank generation is taking >2 hr of fiddling
to sound right, ship the simpler "wave-table-as-sample" approach
(generate the wave samples once into an `AudioBuffer`, loop the
buffer with `AudioBufferSourceNode`). Less authentic CZ behavior,
but ships and can be upgraded later.

---

## On overall cohesion with the existing codebase

**Sound page UI scales to 15, with one specific concern.** The
`<select>` in `Sound.tsx:150-157` listing 14 archetypes is
already crowding the dropdown — at 15 it's still navigable (one
screen-height on most browsers). Past 15, an optgroup or category
header (Drums / Tonal / Synthesized / Textural) would help; but
14→15 doesn't merit redesign work. Keep it. The bigger UX smell
is the one-item-deep flow: pick channel → pick archetype → pick
preset → tweak knobs. With 14 archetype × 5-7 presets each = ~80
starting points, users will benefit from a "show me everything"
preset gallery before they can develop intuition. Defer to commit F
(test sequencer) — once they can hear sounds in rhythmic context,
the value of preset breadth lands without needing a gallery.

**Default kit should showcase the system, not the legacy 5.**
`Sound.tsx:17-25` defaults to kick/snare/hat/clap/tom — a respectable
808 surrogate, but it sells the Sound page short. The whole pitch
of the new system is "we have 14 voices, not 5." A first-visit user
clicks through and sees five drum-machine voices they could have
gotten from the existing 808/909 picker. **Recommendation:** swap
ch4 (clap) for `comb-pluck (kalimba)` and ch5 (tom) for
`modal (bell)`. The user lands on a kit that's *audibly* wider than
anything in Practice — a richer first impression that signals "this
is a different kind of thing." Two-line change in `defaultChannels()`.
Trust that drum-stack discoverability comes from the archetype
dropdown.

---

## Concrete next-3-commits-to-make

### Commit A: Fix `chip` PWM (#1) + add `phase-distort` (15/15)

**Why first:** the chip PWM bug is a HIGH-severity defect in
*shipping* code (the Sound page renders chip presets that don't sound
right). Bundling the fix with the 15th archetype means one PR closes
"v1 archetypes complete" cleanly. Both touch the voice/ directory and
the registry; small concentrated diff. Verify chip with
audible A/B against `bass8` / `vibrato` presets; verify phase-distort
with the `bell` / `glassy` presets the spec calls out.

### Commit B: DC-blocker on `wavefolder` + `BURST_MS` constant in `_shared`

**Why second:** sweeps two cohesion findings (#2 and the cohesion
observation about magic burst-duration constants) into one
maintenance commit. ~30 lines total. Add the DC-blocker as a tiny
helper in `_shared/audio.ts` (`dcBlocker(ctx): BiquadFilterNode`) so
it's reusable when phase-distort lands and inevitably has the same
issue. Refactor `crackle`/`comb-pluck`/`clap` to import `BURST_MS`.

### Commit C: Default kit showcases the new system

**Why third:** highest-leverage UX change for the smallest diff
(2 lines in `Sound.tsx:17-25`). Switching ch4→`comb-pluck`,
ch5→`modal` makes the first-load Sound page sound *unmistakably*
different from Practice/Studio's 808 — exactly the "this is a new
mode" signal the page needs before user-testing. Bonus: it shakes out
preset-display bugs in archetypes besides the legacy 5 (today the
defaults always show `kick`/`snare`/`hat` knobs first; archetype
swap is cosmetically rare).

The remaining backlog from review #3 still applies (ChannelStrip,
KitFxBus, color FX, save/load, test sequencer). Commits A-C don't
move that forward but they pay down the per-archetype tech debt
*before* the runtime work compounds it. Phase-2 migration and parity
tests still gate on review #3's commit A — that hasn't shipped yet
and remains the single most important deferred item.

---

## Footnotes (tiny things, batch later)

- `formant.ts:98` Q max=20 with three parallel BPs in series with a
  sawtooth: at the upper extreme this can ring ~30 dB hot at the
  formant centers. The `amp * 0.55` envelope tames it but a cliprail
  at the sum (e.g. soft-clip at ±0.95) would prevent the rare nasty
  spike. Defer.
- `crackle.ts:77` `Math.random()` is called at trigger time
  (correct — different per trigger, deterministic within one shot).
  Confirmed not a render-loop call.
- `fm.ts:81-86` self-feedback path is audio-rate but bounded:
  `fbGain = feedback × pitch × ratio × 0.5`. At max settings
  (feedback=0.9, pitch=1500, ratio=8) the modulator's frequency
  swings ±5400 Hz around its 12000 Hz center. Audio-rate self-FM
  doesn't blow up in Web Audio — the AudioParam clamps don't apply
  to k-rate inputs but the oscillator handles arbitrary frequency
  values. Output stays in [-1, 1]. Safe.
- `wavefolder.ts:45` and `chip.ts:75` both use
  `new Float32Array(new ArrayBuffer(len * 4))` — correctly typed as
  `Float32Array<ArrayBuffer>` (not generic `Float32Array`). Picks
  up the lib-dom typing TS5.7+ tightened. Good.
- `noise.ts:68` `filt.Q.value = q + pitch * 6` — at knob max
  (q=12, pitch=1) Q reaches 18. With LP/HP filter mode and a
  noise source, that's a sharp resonant peak. Audible whistling at
  cutoff. Probably the desired character ("riser" preset uses
  q=4.0 + pitch=0.6 → Q=7.6, intentional). Leave alone.
- `modal.ts:51` `inharmonicOffset` uses `Math.sin(n * 12.9898) * …`
  — the classic GLSL hash. Deterministic per-partial-index, scatters
  uniformly in [-k/2, k/2]. Solid choice.
- Sound.tsx `defaultChannels()` lines 19-23: all five seed channels
  use `{...VOICE_MACHINES.X.defaults}` shallow copy. `defaults` is
  not deeply nested, so shallow is correct. Holds.
