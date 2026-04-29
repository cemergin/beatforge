# Drum & Percussion Synthesis — Engineering Reference

> **TL;DR** — How to build kicks, snares, hats, claps, toms, cymbals from oscillators + noise + envelopes. No samples needed.
> **Audience:** intermediate JS devs (no DSP background assumed).
> **Length:** ~1.2K lines · ~15 min skim, 60 min deep with code-along.
> **Best for:** voice-by-voice recipes, the synth-vs-sample tradeoff, why analog drum machines sound the way they do.
> **Skip if:** you want bare Web Audio API surface (→ [`web-audio-dsp.md`](web-audio-dsp.md)) or library comparisons (→ [`web-audio-libraries.md`](web-audio-libraries.md)).

A working reference for the future BeatForge Drum Synth project. Assumes
an intermediate Web Audio developer with no formal DSP training who is
choosing a synthesis technique for a given drum.

All code uses the standard Web Audio API (`AudioContext`,
`OscillatorNode`, `GainNode`, `BiquadFilterNode`, `AudioBufferSourceNode`).
Existing BeatForge kit files are cited throughout as worked examples.

---

## Table of contents

1. [What a drum sound is, physically](#1-what-a-drum-sound-is-physically)
2. [Synthesize vs sample](#2-synthesize-vs-sample)
3. [Physical modeling](#3-physical-modeling)
4. [Subtractive synthesis](#4-subtractive-synthesis)
5. [Additive synthesis](#5-additive-synthesis)
6. [FM synthesis](#6-fm-synthesis)
7. [Envelopes and modulation](#7-envelopes-and-modulation)
8. [Analog vs digital philosophies](#8-analog-vs-digital-philosophies)
9. [Per-drum recipes](#9-per-drum-recipes)
10. [What this means for BeatForge Drum Synth](#10-what-this-means-for-beatforge-drum-synth)
11. [Further reading](#11-further-reading)

---

## 1. What a drum sound is, physically

A drum hit is a short chain of events in time:

```
stick ──► skin/shell ──► air column ──► room
impact   body vibration   radiation     reflections
(1 ms)   (10–2000 ms)     (coupled)     (0.1–5 s)
```

The stick delivers an impulse (broadband, very short). That impulse
excites the resonator — a membrane, plate, bar, or air column — which
rings at its characteristic modes. The modes couple to the surrounding
air and radiate. The room adds reflections and may excite sympathetic
resonators (snare wires, hanging cymbals, sitar strings on the wall).

Every perceived percussion sound decomposes into four layers. A synth
that models each cleanly is strictly more flexible than one that does
not.

| Layer       | Time scale   | What it is                                   | Synth technique                   |
|-------------|--------------|----------------------------------------------|-----------------------------------|
| Transient   | 0–10 ms      | The impact click. Broadband, very short.     | Short filtered noise burst, click osc |
| Tone        | 5–2000 ms    | Pitched body (membrane/bar/shell modes).     | Sine/FM/modal resonator, pitch envelope |
| Noise       | 10–500 ms    | Skin texture, rattle, wires, beads, air.     | Filtered noise, decaying          |
| Environment | 50 ms–5 s    | Room reflections, sympathetic ring.          | Reverb send, extra resonator tails |

Two critical facts:

- **Transient dominates recognition.** Humans identify a drum within
  the first ~20 ms. The tail refines, but the attack decides.
- **Real drums are inharmonic.** Modes are spaced by Bessel/plate
  equations, not the integer ratios of a harmonic oscillator. This is
  why a synthesized sine decay sounds like a "beep," not a drum —
  you need inharmonic partials or modal resonators. See §3 and §5.

---

## 2. Synthesize vs sample

Both are valid. Pick by what you need.

**Synthesize wins when:**
- You need parameter morphing (pitch, decay, tune) without artifacts.
- You need velocity to reshape timbre, not just level.
- You're shipping to web/mobile and care about bundle size.
- You want the sound to live as JSON (versionable, shareable, forkable).
- You need cross-platform licensing freedom.
- You need deterministic behavior (reverse, ratchet, choke).

**Sampling wins when:**
- You need a specific recorded kit's character (Questlove's kick, a
  specific 909 unit with its drifted tuning).
- You need realism without per-voice modal engineering budget.
- You need sympathetic rattles and room bleed that are hard to model.
- You need fast development — a one-shot drop is done in 30 minutes.

**BeatForge's choice** is synthesize-only. No sample files to host or
license, no bundle bloat, all sounds are parameter recipes in JSON.
This reference is about how to earn that.

Hybrids exist (sampled attack + synth tail — the Linn LM-1 approach,
§8). They are not used in BeatForge but are valid.

---

## 3. Physical modeling

Physical modeling derives the sound from the physics of the vibrating
object. It is the most realistic approach and, outside of direct FDTD
(see end of section), often affordable in real time.

### 3.1 Circular membrane — the wave equation

A drum head is a circular membrane under tension. Its small-amplitude
transverse vibrations obey the 2D wave equation in polar coordinates:

```
∂²u/∂t² = c² (∂²u/∂r² + (1/r) ∂u/∂r + (1/r²) ∂²u/∂θ²)
```

where `c = sqrt(T/σ)` is wave speed (T = tension, σ = areal mass
density).

Solutions are products of Bessel functions of the first kind `J_m(kr)`
and angular functions `cos(mθ)` / `sin(mθ)`. Boundary condition (pinned
rim) says the Bessel must be zero at the rim radius `a`, so allowed
wavenumbers `k_{mn}` come from the zeros of `J_m`.

Mode frequencies are then `f_{mn} = (c · k_{mn}) / (2π)`. Normalized to
the fundamental (0,1) mode, the ratios are:

```
Mode (m,n)   Ratio     Name
(0,1)        1.000     fundamental — breathing
(1,1)        1.594     first asymmetric
(2,1)        2.136
(0,2)        2.296     second symmetric
(3,1)        2.653
(1,2)        2.918
(4,1)        3.156
(2,2)        3.501
(0,3)        3.600
(5,1)        3.652
```

Compare to a string (ratios 1, 2, 3, 4, …) or a pipe (1, 3, 5, …).
Membrane ratios are **inharmonic** — irrational numbers. This is why
sine-decay synth drums sound wrong: a sine at `f` decays without its
partners at 1.594f, 2.136f, 2.296f. The ear expects the cluster, not a
pure tone.

Real timpani and tabla are tuned by shell geometry and head loading
(black paste on tabla, kettle air-mass on timpani) to pull certain
partials into near-harmonic ratios — that's why those drums sound
pitched. An untuned drum is a "cluster of modes."

### 3.2 Plates — cymbals and gongs

A flat plate satisfies the biharmonic equation (4th-order), not the
2nd-order wave equation. Mode density grows much faster and partial
ratios are highly irrational and clustered. That cluster is what
produces the shimmering, beating character of cymbals. Expect hundreds
of audible modes on a crash.

Implementation cost: a full plate simulation needs 200+ partials. The
practical shortcut is (a) take a few dozen dominant partials via modal
synthesis (§3.5) and (b) fill the rest with shaped HP noise so the ear
completes the cluster. See the 808 cymbal (6 squares + HP noise, §4)
for the extreme-minimum version.

### 3.3 Stiff bars — marimba, xylophone, wood

A stiff bar obeys the Euler-Bernoulli beam equation. For a free-free
bar, transverse mode ratios are:

```
Mode   Ratio
1      1.000
2      2.756
3      5.404
4      8.933
```

Marimba and xylophone makers tune the **first overtone to 4:1** (two
octaves above) by carving an arch into the underside of the bar. That
converts the natural 2.756 into 4.000, producing the characteristic
"pure" mallet tone.

Shaped wood blocks approximate bar behavior but with faster decay and
less tuning control.

### 3.4 Karplus-Strong — plucked string, clave

Delay line + lowpass in feedback = plucked string. The delay length
sets the pitch (`f = sampleRate / delayLength`), the lowpass in the
feedback path controls decay (darker filter = faster high-freq loss,
like real string damping), and the feedback gain (<1) sets the tail
length.

Useful for: clave, woodblock, guiro tap, plucked bass, koto.

Web Audio lacks a sample-rate delay primitive directly (`DelayNode`
delay is in seconds and interpolated), so for realism use an
`AudioWorklet`. For a quick demo, `DelayNode` + `BiquadFilterNode`
feedback loop is usable at lower pitches:

```js
function karplusClave(ctx, when, freq, decay) {
  // Excite with short noise, run through delay+lowpass feedback loop.
  const delayTime = 1 / freq;
  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * delayTime), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noise.buffer = buf;
  const delay = ctx.createDelay(0.02);
  delay.delayTime.value = delayTime;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 4000;
  const fb = ctx.createGain();
  fb.gain.value = Math.pow(0.001, delayTime / decay); // decay-time gain
  noise.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay);
  delay.connect(ctx.destination);
  noise.start(when); noise.stop(when + delayTime);
}
```

Caveat: at audio rates (say 2 kHz clave = 0.5 ms delay), `DelayNode`
may interpolate or quantize poorly. AudioWorklet is the right home for
a production Karplus-Strong.

### 3.5 Modal synthesis — the workhorse for tuned percussion

A modal resonator is a bandpass filter (or a pair of damped sines)
tuned to one mode. Feed it an excitation — typically a short filtered
click burst — and sum a bank of them. This is how BeatForge's
`gamelan.ts` works: `gamelanTone()` adds sine partials at non-integer
ratios with exponentially decaying gain envelopes, plus a brief HP
noise click for the strike transient. See
`app/src/audio/kits/gamelan.ts:19-46`.

Gamelan partials in that file:

```
gong ageng:  [1.00, 1.78, 2.72, 4.05, 6.30]  fundamental 55 Hz, decay 2.5s
kenong:      [1.00, 2.05, 3.10, 4.80]        fundamental 220 Hz, decay 0.8s
saron:       [1.00, 2.02]                    fundamental 660 Hz, decay 0.18s
```

Note the inharmonic ratios (1.78, 2.72, etc.) — not integers. Also
note: higher partials decay faster (`partialDecay = decay / (1 + i*0.4)`
on line 26). This is physically correct — higher modes radiate faster
and dissipate faster internally. The click burst (lines 36–45) is the
strike transient; without it the sound feels like a synth pad starting,
not a mallet hitting.

Modal synthesis extends cleanly: the same kernel handles bells, bars,
kettle drums, cowbells. You're parameterizing (partials, decays,
damping).

### 3.6 FDTD and banded waveguides — why we skip them

- **FDTD** (finite-difference time-domain) discretizes the wave
  equation on a 2D grid and steps it forward in time. Realistic, but
  ~10⁴ grid points per sample at audio rate = too expensive for most
  browser contexts. Use AudioWorklet + SIMD if attempted.
- **Banded waveguide synthesis** (Essl/Cook) models each mode as a
  delay loop tuned to that mode, with coupling. Excellent for bars and
  bells; fairly cheap. Appropriate for AudioWorklet, overkill for our
  use case — modal synthesis with careful excitation handles the
  same territory with half the code.

---

## 4. Subtractive synthesis

Subtractive = start with a harmonically-rich source (oscillator or
noise), shape with filters and envelopes. This is how the classic
analog drum machines worked and how most of BeatForge's
`drum-machine.ts` (808/909/707) voices are built. It's cheap and
musically predictable.

General per-voice template:

```
oscillator ─►┐                       ┌► amp envelope ─► out
             ├► filter (envelope) ──►┤
noise       ─►┘                       └► noise mix
       ▲
   pitch envelope
```

### 4.1 Kick — sine sweep + click

The classic 808 kick: a sine that starts near 150–180 Hz and falls
exponentially to 40–60 Hz within 50–100 ms, with a short click
transient stacked on top.

```js
function kick(ctx, when, amp) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(180, when);
  osc.frequency.exponentialRampToValueAtTime(42, when + 0.08);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(amp, when + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.4);
  osc.connect(g).connect(ctx.destination);
  osc.start(when); osc.stop(when + 0.45);
}
```

BeatForge's `kickVoice()` in `app/src/audio/kits/drum-machine.ts:16-46`
parameterizes this across 808/909/707: 808 = pure sine (150→40, 0.6s),
909 = sine (180→42, 0.35s) + 2.4 kHz square click, 707 = tighter
(140→55, 0.28s) + click. The click is what distinguishes 909 from 808
on the attack; remove it and a 909 kick collapses toward 808-ness.

### 4.2 Snare — two sines + filtered noise + HP wires

A real snare is: drumhead body (pitched modes around 180–250 Hz) +
bottom-head wire rattle (broadband, bandpassed around 2 kHz) + shell
ring (higher pitched, shorter).

```js
function snare(ctx, when, amp) {
  // Body: two detuned sines at 185 and 349 Hz.
  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
  o1.frequency.value = 185; o2.frequency.value = 349;
  const og = ctx.createGain();
  og.gain.setValueAtTime(0, when);
  og.gain.linearRampToValueAtTime(amp * 0.5, when + 0.002);
  og.gain.exponentialRampToValueAtTime(0.0001, when + 0.08);
  o1.connect(og); o2.connect(og); og.connect(ctx.destination);
  o1.start(when); o2.start(when); o1.stop(when + 0.12); o2.stop(when + 0.12);
  // Wires: bandpass noise, longer decay.
  // (omitted for brevity — see drum-machine.ts:48-78)
}
```

See `app/src/audio/kits/drum-machine.ts:48-78` for the full snare with
both-sine body (185+349 Hz on 808, 220+380 Hz on 909) plus bandpass
noise wires (BP 1800 Hz on 808, 2400 Hz on 909). The 909's brighter
bandpass center frequency is a lot of its character.

### 4.3 Hi-hat — HP+BP filtered noise

Noise run through a highpass (chops off sub-content) then a bandpass
(narrows to metallic range). Closed = short decay (~50 ms), open =
longer (~300 ms). Same voice otherwise.

```js
function hat(ctx, when, amp, open) {
  const dec = open ? 0.32 : 0.05;
  // Generate noise buffer
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * (dec + 0.05)), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const n = ctx.createBufferSource(); n.buffer = buf;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 10000; bp.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(amp * 0.4, when + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dec);
  n.connect(hp).connect(bp).connect(g).connect(ctx.destination);
  n.start(when); n.stop(when + dec + 0.05);
}
```

Mirrors `hatVoice()` in `app/src/audio/kits/drum-machine.ts:80-101`.
For the 808 cymbal and realistic hat metal character, see §4.5.

### 4.4 Clap — stacked noise bursts

A hand clap is not one impulse; it is a smear of micro-impacts from
multiple hand regions contacting simultaneously. Replicate with 3–4
bandpass-filtered noise bursts offset by ~10–15 ms, plus a longer
trailing burst for the slap-reverb sense.

```js
function clap(ctx, when, amp) {
  for (let i = 0; i < 3; i++) {
    const t = when + i * 0.012;
    // short bandpassed noise burst at 1.2 kHz with 60ms decay
    // (see drum-machine.ts:103-121 for the full implementation)
  }
}
```

See `app/src/audio/kits/drum-machine.ts:103-121`. The 12 ms offset is
crucial — 8 ms is too tight (sounds like one click), 20 ms is too loose
(sounds like four claps). The center frequency of the bandpass (1200 Hz
there) is the "hand size" parameter: higher = small hands / female
clap, lower = wet cupped hands.

### 4.5 Cymbal — the 808's six-square trick

The classic TR-808 cymbal uses six square-wave oscillators at
specifically-chosen non-harmonically-related frequencies, summed,
then run through HP-then-BP filters with a long decay. The squares
provide the dense partial content a single square cannot.

Suggested square frequencies (from 808 service manual): 205, 304,
369, 522, 540, 800 Hz. These ratios are inharmonic but dense; squares
add their own harmonics on top (every odd partial of each), producing
the shimmering cymbal cluster.

```js
function cymbal808(ctx, when, amp) {
  const freqs = [205, 304, 369, 522, 540, 800];
  const mix = ctx.createGain();
  freqs.forEach(f => {
    const o = ctx.createOscillator();
    o.type = 'square'; o.frequency.value = f;
    o.connect(mix); o.start(when); o.stop(when + 1.2);
  });
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 8500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(amp * 0.25, when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 1.0);
  mix.connect(hp).connect(bp).connect(g).connect(ctx.destination);
}
```

### 4.6 Tom — sine sweep + noise body

Like a kick, but tuned higher and with more noise in the body to carry
the skin texture. Typical tom: sine 140→90 Hz (floor tom) or 220→170 Hz
(rack tom), decay 300–600 ms, with a short LP-filtered noise burst
stacked for the skin hit. See frame drum's `doum()` in
`app/src/audio/kits/frame-drum.ts:13-37` for a worked tom-like voice
(82→58 Hz + LP-180 Hz noise thump).

---

## 5. Additive synthesis

Additive = sum sine oscillators at specific frequencies, each with its
own amplitude and envelope. The inverse of subtractive: no filter, you
spell out exactly what partials exist.

**When additive wins:**
- Tuned metal: bells, gongs, cymbals, crotales, gamelan.
- Mallet instruments: marimba, vibraphone, glockenspiel.
- Tuned drums with well-known mode lists (tabla, timpani).
- Any sound where you know the target partials and want exact control
  over each one's envelope.

**When additive loses:**
- Noise-heavy sounds (hats, shakers, brushes): use §4 subtractive.
- Very dense partial content (crash cymbal with 300 audible modes):
  subtractive + noise fill is cheaper.

### 5.1 Workflow

1. Record the target (or use a published spectrum).
2. Run an FFT at the moment just after attack.
3. Extract the top N peaks. For each: frequency, initial amplitude,
   decay time constant (measure the slope on the log-magnitude plot).
4. Synthesize: one sine per peak with a `linearRampToValueAtTime`
   attack and `exponentialRampToValueAtTime` decay.
5. Optionally add a short excitation click for the strike transient
   (essential — see §3.5).

### 5.2 Example ratios — bell

A large church bell is inharmonic. Typical ratios to the fundamental
(often called "hum"):

```
hum      1.000
prime    2.000
tierce   2.400   (minor third above prime — the characteristic bell tone)
quint    3.000
nominal  4.000
deciem   5.330
```

Smaller hand-bell or cowbell:

```
1.000
2.76
5.40
8.93
13.35
```

These irrational ratios are what make it a bell. Integer ratios give
organ or choir, not bell.

### 5.3 Modal-additive hybrid — BeatForge's gamelan

`app/src/audio/kits/gamelan.ts` is an additive implementation viewed
through the lens of modal synthesis: partial list × per-partial decay
× strike-click excitation. The code iterates `partials.forEach` at
`gamelan.ts:19`, multiplying the fundamental by each ratio, giving each
partial its own gain node and exponential decay. This is structurally
identical to "additive synthesis with inharmonic ratios"; the labels
are interchangeable.

Production patterns in that file worth reusing:

- **Partial decay scaling** (line 26): `decay * (1 / (1 + i * 0.4))`
  — higher partials die faster. Without this the sound feels static.
- **Partial amplitude scaling** (line 27): `amp * (0.6 / (1 + i * 0.3))`
  — higher partials are quieter. Matches physical radiation.
- **Click burst** (lines 36–45): 1 ms HP-filtered noise burst fires
  at strike time. This is the "hammer hits bar" sound. Skip it and
  the sound starts like a pad, not a percussion hit.

Cost: ~5 partials × 3 nodes each = 15 nodes per hit. At 30 voices
polyphony that's 450 nodes — within Web Audio headroom on modern
hardware. For >8 partials per voice, move to AudioWorklet.

---

## 6. FM synthesis

FM = one oscillator modulates another oscillator's frequency. Two
parameters do most of the work: the carrier/modulator frequency ratio
(timbre color) and the modulation index (brightness).

### 6.1 2-operator concept

```
   modulator       carrier         output
   (sine @ fm) ──► .frequency ────► gain ──►
                   of (sine @ fc)
```

If `fc` is the carrier frequency and `fm` the modulator frequency, and
the modulator's peak output is `I * fm` (where `I` is the **modulation
index**), then the carrier's instantaneous frequency sweeps by
`±I·fm` around `fc`. The result is a sine at `fc` with sidebands at
`fc ± fm`, `fc ± 2fm`, `fc ± 3fm`, … with amplitudes set by Bessel
functions of `I`.

Practical intuition:

- **Ratio controls color.** `fc/fm = 1:1` makes all-harmonic partials
  (like a brass/organ tone). Irrational ratios make inharmonic
  (bell-like) tones.
- **Index controls brightness.** `I = 0` → pure carrier sine. `I = 1`
  → a few sidebands. `I = 5` → many sidebands, edgy. `I > 10` → near-
  noise.

### 6.2 Ratios cheat sheet

```
ratio    character
1:1.0    harmonic, organ/brass
1:1.4    bell-ish, slightly detuned
1:2.0    hollow wind, square-ish
1:2.01   metallic (small detune = beating)
1:3.5    inharmonic mallet
1:5.2    clang, metal hit
1:7.0    glassy, tuning-fork-esque
```

Yamaha's DX-series (FM era, 1983–) use 6 operators with 32 algorithms
— essentially different topologies of modulator→carrier chains. For
a drum synth, 2-op FM is enough for 80% of useful territory; 4-op
gives bells and complex metals.

### 6.3 Four FM drum voices

**FM kick.** Ratio 1:1, high-ish index, very short modulator decay.
```
fc = 60,  fm = 60,  I starts at 8 and decays to 0 in 40 ms.
Carrier envelope: 5 ms attack, 250 ms exp decay.
```
Result: sine kick with an attack "bark" — the index envelope is the
click.

**FM snare.** Self-feedback on the modulator (operator feeds its own
phase input, generating sawtooth-like harmonics that become noise at
high feedback). Ratio 1:5, modulator decays fast, feedback held high.
```
fc = 185,  fm = 925,  I = 12, feedback ≈ 0.7.
```

**FM bell.** Ratio 1:1.4, low-moderate index, long carrier decay.
```
fc = 440,  fm = 616,  I = 3 decaying to 0.3 over 200 ms.
Carrier decay: 3 s exponential.
```

**FM hat.** Ratio 1:1.65 (irrational), very high index, short decay.
```
fc = 7500, fm = 12375, I = 15 static.
Carrier decay: 50 ms closed / 300 ms open.
```

### 6.4 Web Audio FM implementation

Web Audio does FM via `OscillatorNode` → `GainNode` → the carrier's
`.frequency` `AudioParam`. The modulator's gain sets the modulation
depth in Hz.

```js
function fmVoice(ctx, when, fc, ratio, indexStart, indexEnd, decay) {
  const carrier = ctx.createOscillator();
  const mod = ctx.createOscillator();
  const modGain = ctx.createGain();
  const out = ctx.createGain();
  carrier.frequency.value = fc;
  mod.frequency.value = fc * ratio;
  // Mod depth in Hz = indexStart * fm, ramps down to indexEnd * fm.
  modGain.gain.setValueAtTime(indexStart * mod.frequency.value, when);
  modGain.gain.exponentialRampToValueAtTime(Math.max(0.001, indexEnd * mod.frequency.value), when + decay);
  mod.connect(modGain);
  modGain.connect(carrier.frequency); // FM: gain output modulates frequency AudioParam
  out.gain.setValueAtTime(0, when);
  out.gain.linearRampToValueAtTime(0.6, when + 0.003);
  out.gain.exponentialRampToValueAtTime(0.0001, when + decay);
  carrier.connect(out).connect(ctx.destination);
  carrier.start(when); mod.start(when);
  carrier.stop(when + decay + 0.05); mod.stop(when + decay + 0.05);
}
// FM bell: fmVoice(ctx, t, 440, 1.4, 3, 0.3, 2.5)
// FM kick: fmVoice(ctx, t, 60, 1.0, 8, 0, 0.25)
```

The key fact: `gainNode.connect(audioParam)` — not `connect(node)` —
wires the gain's output to drive the param directly. This works for
`.frequency`, `.detune`, `.gain`, `.Q`, and the filter param set.

Self-feedback (for FM snare) needs an AudioWorklet; Web Audio does not
let you form an oscillator-into-self feedback cycle with native nodes
without forming a delay cycle that gets cut.

---

## 7. Envelopes and modulation

Drums live or die by their envelopes. Pitch, amplitude, filter cutoff,
noise mix, modulation index — each should have its own shape, and they
rarely match.

### 7.1 ADSR vs multi-stage

ADSR (attack, decay, sustain, release) is designed for sustained tones
(held keys). Drum hits have no sustain — you hit, it rings, it dies.
The correct envelope is:

```
      peak
       ▲  click
       │   ▲
       │   │
 value │  ┌┘▒
       │  │ ▒
       │  │  ▒▒
       │  │    ▒▒▒▒▒
       │  │         ▒▒▒▒▒▒▒▒▒▒
       └──┴─────────────────────► time
       attack  early    late
       (3ms)  decay    decay
              (30ms)   (200ms)
```

Two-stage decays model real drums better than single-exponential: a
fast "click drop" (first 20–50 ms) plus a slower "tail" decay. Many
Web Audio recipes handle this implicitly — a noise burst at high HP has
a fast decay while the sine body rings longer.

### 7.2 Exponential vs linear decay

**Exponential** (`exponentialRampToValueAtTime`): constant percentage
per unit time. Matches physical decay (air friction, internal
dissipation). Sounds natural.

**Linear** (`linearRampToValueAtTime`): constant dB/sec only in the
middle range; near zero it "falls off a cliff" which sounds mechanical.

Rule: use `exponentialRampToValueAtTime(0.0001, t)` for tails. Don't
pass zero to exponential ramps — it will throw. Pass `0.0001` (−80 dB).

For the very-short attack ramp (< 5 ms), linear is fine and sometimes
preferable because it doesn't introduce a click from exponential's
non-zero start value.

```js
g.gain.setValueAtTime(0, when);
g.gain.linearRampToValueAtTime(amp, when + 0.003);           // 3ms linear attack
g.gain.exponentialRampToValueAtTime(0.0001, when + 0.4);    // 400ms exp tail
```

Every voice in `app/src/audio/kits/drum-machine.ts` follows this
pattern.

### 7.3 Pitch envelopes — kick thump, tom tune, tabla bend

A kick drum's pitch drops ~2 octaves in ~80 ms because the head is
unloaded as it rebounds. Without the drop, you have a sine beep.
Tabla bayan goes the other direction (62→92 Hz upward) — the drummer's
palm pressure increases skin tension as the hit progresses. See
`app/src/audio/kits/tabla.ts:21-22`:

```
osc.frequency.setValueAtTime(62, when);
osc.frequency.linearRampToValueAtTime(92, when + 0.08);
```

A rule: the pitch envelope time constant is typically ~25–50% of the
amp envelope's. You want the pitch to settle before the sound finishes
ringing — otherwise you hear the slide the whole way down.

### 7.4 Filter envelopes — transient bite

Open the filter briefly at the start of the hit, then close it. Gives
a subtle "snap" without stacking an additional click oscillator.

```js
const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
lp.frequency.setValueAtTime(3000, when);
lp.frequency.exponentialRampToValueAtTime(500, when + 0.05);
```

Useful on snares (controls wire brightness over time), toms (simulates
skin stiffening), and clavs/woodblocks (transient snap).

### 7.5 Velocity mapping

Hard hits aren't just louder; they're brighter and have more noise.
Map one MIDI velocity (0–127) to **multiple destinations**:

| Destination          | Typical depth                                |
|----------------------|----------------------------------------------|
| Output amp           | Linear or curved (e.g., `vel²/127²`)         |
| Pitch envelope depth | +10–20% at max velocity                      |
| Filter cutoff        | +30–100% of nominal                          |
| Noise mix            | +50% at max velocity                         |
| Decay time           | +20% at max velocity (slightly longer tail)  |

Without multi-destination mapping, velocity only affects level —
which sounds like an auto-gain, not dynamics.

### 7.6 Humanization

To escape the "drum machine" feel:

- **Velocity jitter**: ±3–7% random per hit.
- **Timing jitter**: ±1–3 ms. Never more than 10 ms; that crosses into
  "broken" territory.
- **Micro-timing styles**: swing (8ths delayed by a percent), push
  (hi-hat ahead of beat), lay-back (snare behind beat).

Apply these in the scheduler, not in the synthesis layer. The voice
recipe stays pure.

### 7.7 LFOs

LFOs (< 20 Hz modulators) are rarely useful for a single drum hit —
most hits finish in < 200 ms, so a 5 Hz LFO has moved through only 1
cycle. Where LFOs apply:

- **Per-bar tremolo** on a ride bell or open hat.
- **Slow filter sweep** on a 1-bar noise roll.
- **Pitch vibrato** on a sustained gong (multi-second).

For anything else, use envelopes.

---

## 8. Analog vs digital philosophies

### 8.1 Classic analog — dedicated per-voice circuits

Every voice on a TR-808/909/606/CR-78 is a hand-wired analog circuit
designed for one drum. No sharing. Reasons:

- **Bridged-T kick.** The 808 kick is a self-resonant bridged-T
  network — a filter that rings briefly when pulsed. No VCO: the
  "oscillator" is literally a resonant filter's ring-out. This is
  why the 808 kick has that pure sine-with-click character — it IS a
  pure sine with click.
- **Snare noise VCA chain.** 808 snare = two VCO sines (body) + white
  noise through VCF → VCA with its own envelope generator. Separate
  envelopes for body and noise.
- **Per-drum trimmers.** Tuning, decay, level each set by a pot. Every
  unit is slightly detuned from factory — part of the "character."

Lesson: in a drum synth, **decouple** the sub-circuits per voice. A
snare's body envelope and noise envelope should be independent params,
not a shared "decay." BeatForge's `snareVoice()` in
`drum-machine.ts:48-78` does exactly this — separate `og` (osc gain)
and `ng` (noise gain), separate decay times.

### 8.2 Hybrid — Linn LM-1, Simmons SDS-V

Linn LM-1 (1980): sampled attack transient + analog synth tail. A
sampled kick thud stacked with a synth sine sweep gave realism beyond
either alone. Simmons SDS-V (1981): electronic drum pads with analog
synth voices tuned to imitate acoustic toms.

**Lesson: the transient is what sells the drum.** If your synth tail
is good but your click is wrong, the hit feels synthetic. Consider
layering a recorded transient sample (2–8 kB WAV) with a synth tail
— the LM-1 trick. (BeatForge does not use samples, but the principle
— put more care into the first 20 ms than the next 2 seconds —
still applies.)

### 8.3 Modern digital — Nord Drum, Elektron Syntakt, Waldorf Attack

These are the template BeatForge Drum Synth should follow. Each voice
has an explicit multi-layer architecture:

```
Nord Drum 2 per-voice structure (abbreviated):

   CLICK   ────►┐
   NOISE   ────►┤    ┌► FILTER ────► AMP ──► OUT
   TONE1   ────►┤───►┤
   TONE2   ────►┘    │
                     └────────────┘
   each layer:
     - source (sine / FM / click / noise type)
     - pitch + pitch envelope
     - level envelope
     - send to filter / amp / output
```

Elektron Syntakt adds filter, overdrive, and LFO per voice. Waldorf
Attack (1998, a VST) was the first popular software drum synth with
this layered architecture.

The pattern for BeatForge:

```
Per voice:
  body        = osc or FM operator pair, with pitch + amp envs
  click       = noise or short osc, with very-short env
  noise       = filtered noise with amp env
  filter      = per-voice LP/HP/BP with env
  mix         = level balance between the three sources
```

This is extensible, morphable, and covers kick-through-cymbal.

### 8.4 Sample-based — MPC, Battery

Sample-based drum instruments use multisampling (multiple recorded
samples per voice at different velocities), velocity layers, and
round-robin (rotating between N samples of "the same" hit to mask
machine-gun repetition). These are out of scope for BeatForge but
worth knowing:

- **Multisampling**: record the kick at 5 velocities, crossfade by
  incoming velocity. Solves velocity-as-tone-change (see §7.5).
- **Round-robin**: rotate among ~4 samples per hit to avoid the
  "click click click" of identical repeats.
- **Articulations**: separate samples per playing technique (tip,
  shoulder, dead-stroke). Not required for synthesis — you parameterize
  the technique instead.

---

## 9. Per-drum recipes

Each entry: one paragraph + a short Web Audio sketch + a reference
instrument that got it right. Cross-references to sections above.

### Kick

Single sine with exp pitch drop (180→42 Hz) plus optional square click
at 2–3 kHz for the beater impact. For modern trap/hip-hop, stretch the
tail to 600–1000 ms and tune the sine to a musical pitch (C1 ≈ 32.7
Hz — see Trap 808 below). Reference: TR-808 (sine-only), TR-909 (sine
+ click), Ableton Operator kick preset (FM kick).

```js
const o = ctx.createOscillator(), g = ctx.createGain();
o.frequency.setValueAtTime(180, t);
o.frequency.exponentialRampToValueAtTime(42, t + 0.08);
g.gain.linearRampToValueAtTime(amp, t + 0.003);
g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
```
See `app/src/audio/kits/drum-machine.ts:16-46`.

### Snare

Two-detuned-sine body (180–250 Hz) + bandpass noise for wires (center
1800–2500 Hz, Q 0.6, 100–200 ms decay) + optional HP noise for shell.
Reference: TR-909 snare. Also LinnDrum and Simmons SDS-V.

```js
// Body
const o1 = ctx.createOscillator(); o1.frequency.value = 220;
const o2 = ctx.createOscillator(); o2.frequency.value = 380;
// Noise wires (see §4.2)
```
See `app/src/audio/kits/drum-machine.ts:48-78`.

### Closed hat / Open hat

HP-then-BP filtered noise, different decays (closed 50 ms, open 300
ms). Same voice otherwise. Reference: TR-909 hats.

```js
// HP 7 kHz → BP 10 kHz Q 1.2, exp decay.
```
See `app/src/audio/kits/drum-machine.ts:80-101`.

### Rimshot

Sine at 700–900 Hz (short, 30–60 ms) + HP-filtered noise click + very
short exp decay. The sine gives the "thok," the click gives the stick.
Reference: TR-909 rim.

```js
const o = ctx.createOscillator(); o.frequency.value = 800;
const g = ctx.createGain();
g.gain.setValueAtTime(amp, t);
g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
```

### Clap

3–4 bandpass noise bursts (center 1200 Hz, Q 0.8), offset by 10–15 ms.
Optionally a fourth longer burst trailing. Reference: TR-808 clap.

```js
for (let i = 0; i < 3; i++) {
  // bandpass noise burst offset by i * 0.012 sec
}
```
See `app/src/audio/kits/drum-machine.ts:103-121`.

### Tom

Sine sweep (higher than kick — rack: 220→170 Hz, floor: 140→90 Hz) +
LP-filtered noise body for skin texture. Longer decay than kick (300–
600 ms). Reference: TR-606, Roland V-Drums.

```js
const o = ctx.createOscillator();
o.frequency.setValueAtTime(220, t);
o.frequency.exponentialRampToValueAtTime(170, t + 0.06);
```
See `frame-drum.ts:13-37` for a doum (tom-adjacent) worked example.

### Ride

Modal synthesis (§3.5 / §5). 5–8 inharmonic sine partials around 300–
800 Hz fundamental + HP-filtered noise fill for the "ping/wash"
separation. Long decay (2–5 s). Ping = emphasize one partial + sharp
attack. Reference: Zildjian K ride, Diamond Drums modal cymbal plugin.

```js
const partials = [1, 1.61, 2.12, 2.87, 3.65];
const fund = 440;
partials.forEach((r, i) => { /* sine at fund*r, see gamelan.ts:19-34 */ });
```
See `app/src/audio/kits/gamelan.ts:10-46` — gamelan voice is
structurally the same engine.

### Crash

Denser partial set than ride (plates, §3.2) — realistically 30+
partials. Cheat: 5–7 partials + broadband HP-filtered noise for the
cluster fill. Long decay (3–6 s). Reference: 808 cymbal (6-square
version, §4.5).

### Cowbell

Two square waves at ratio 1.5:1 (e.g., 560 + 850 Hz), summed through
a bandpass around 700 Hz, short decay (~150 ms). Reference: TR-808
cowbell.

```js
const o1 = ctx.createOscillator(); o1.type = 'square'; o1.frequency.value = 560;
const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 850;
// sum, BP 700 Hz, decay 150 ms
```

### Clave / woodblock

Either: (a) Karplus-Strong at ~2 kHz (§3.4), or (b) triangle/sine at
2 kHz with very short decay (~30 ms) + click transient. Reference:
TR-727 clave.

```js
const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 2000;
const g = ctx.createGain();
g.gain.setValueAtTime(amp, t);
g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
```

### Shaker

Bandpass-filtered noise (center 5–8 kHz, Q 1–2), short decay (~80 ms).
For realism, amplitude envelope should have a fast attack and two-stage
decay (quick bead-drop then slower settle). Reference: LM-1 shaker,
Battery shaker presets.

### Tambourine

Shaker-like, but with shorter faster attack and the extra ring of jingle
metal: add 2–3 detuned sines at 5–8 kHz with ~200 ms decay. Reference:
TR-727.

### Triangle

Two or three inharmonic sines at irrational ratios (1.00, 2.84, 4.67),
fundamental 4–6 kHz, long decay (1–3 s). Minimal or no click — the
triangle strike is soft. Reference: Yamaha RX5 triangle, modal synth.

### Tabla (bayan + dayan + pitch bend)

Bayan (bass): sine with UPWARD pitch bend (62→92 Hz in 80 ms) through
resonant LPF, 400 ms decay. Dayan (treble): two sines at 600 + 1020
Hz + HP-noise attack click. Pitch bend is non-negotiable for realism —
it's the signature of the instrument. Reference: BeatForge
`app/src/audio/kits/tabla.ts:12-45`.

```js
// Bayan (ge)
osc.frequency.setValueAtTime(62, t);
osc.frequency.linearRampToValueAtTime(92, t + 0.08);
// LP @ 400 Hz, Q=6, 420ms decay.
```

### Djembe (bass + slap + rim)

Bass ("doum" / "gun"): sine 85→60 Hz, 300 ms decay, LP-noise thump.
Slap ("slap" / "pa"): bandpass noise at 700–900 Hz Q 1, 120 ms decay,
plus a short sine click at 1.5 kHz. Rim ("tone" / "dun"): bandpass
noise at 2 kHz + 1 kHz sine. Reference: `frame-drum.ts` — the doum /
slap / tek structure is identical. See
`app/src/audio/kits/frame-drum.ts:13-119`.

### Conga

Similar to tom but tighter: sine 250→200 Hz for open, 200→160 Hz for
muted, with shorter decay (150 ms) and LP-filtered noise body. Three
pitches (quinto/conga/tumba) via fundamental tuning. Reference: TR-727
(which is literally a conga machine).

### Frame drum (doum / tek)

Doum (center hit): sine 82→58 Hz + LP noise thump. Tek (rim): bandpass
noise at 1500 Hz Q 2.5 + short 880 Hz sine attack. Reference:
`app/src/audio/kits/frame-drum.ts:13-61`. The doum/tek pairing is
structurally identical to kick/snare; what makes it a frame drum is
the specific frequencies (lower rim than a snare, higher bass than a
kick) and the lack of snare-wire rattle.

### Gong

Deep fundamental (40–80 Hz) with 5–7 inharmonic partials, very long
decay (3–8 s). Partial ratios [1.00, 1.78, 2.72, 4.05, 6.30] work well
(from `gamelan.ts:50`). Reference: BeatForge gamelan gong ageng —
`app/src/audio/kits/gamelan.ts:49-50`.

### Gamelan (saron, kenong, kempul)

Modal synthesis, §5.3. Five examples in `app/src/audio/kits/gamelan.ts:50-66`
at five different fundamentals and partial sets. The shared engine at
`gamelan.ts:10-46` parameterizes (fundamental, partials, decay). Add
characteristic strike click (HP noise, 1 ms) — the mallet on bronze.

### 808 sub-bass kick

The original TR-808 kick as an 808-as-bass. Tune the fundamental to
C1 (32.7 Hz) or E1 (41.2 Hz). Drop the click. Extend the decay to
800–1500 ms. The pitch drop is minor (~3 semitones). Reference:
Metro Boomin, modern trap.

### Trap 808

Like the 808 sub-bass kick but pitched chromatically to match the key
of the track and stretched to 1.5–3 s. Optional distortion send for the
"mud" character. Optional short portamento. Reference: any modern trap
beat — the 808 plays the bassline, not just time.

```js
const o = ctx.createOscillator(); o.type = 'sine';
o.frequency.value = 55; // A1 — tuned to song key
const g = ctx.createGain();
g.gain.linearRampToValueAtTime(amp, t + 0.003);
g.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);
// Optional: WaveShaperNode for saturation.
```

---

## 10. What this means for BeatForge Drum Synth

A short set of architectural decisions derivable from everything above.

### 10.1 Per-voice layered architecture

Every voice is (body + noise + click + env) as independent modules.
Mirror Nord Drum 2 / Elektron Syntakt. The existing kits
(`drum-machine.ts`, `frame-drum.ts`, `tabla.ts`) already do this
informally — snare has separate body-gain and noise-gain nodes with
separate envelopes. Formalize it in the Drum Synth: every voice
instance owns a fixed set of layer slots, each slot has a type
(`sine`/`fm`/`noise`/`click`), a source param set, and an envelope.

### 10.2 Engine scope

Support four synthesis kernels in one engine:

- Subtractive (osc + filter + env) — §4
- Additive / modal (N sine partials with per-partial envelopes) — §5
- FM (2-op minimum, ideally 4-op) — §6
- Karplus-Strong (delay + LPF feedback) — §3.4

These four cover every drum listed in §9. Subtractive handles analog-
style kits. Additive/modal handles tuned metal and mallet. FM fills
bells and edge cases. KS handles clave, woodblock, plucked-string
instruments if the UI ever wants them.

### 10.3 Real-time budget

Web Audio on modern hardware comfortably runs ~20–30 simultaneous
voices with the kind of complexity seen in `drum-machine.ts`. Beyond
that, you hit GC pressure (from node allocation per hit) and graph
cycle cost.

Thresholds:

- ≤ 30 voices, ≤ 10 nodes per voice: native nodes, allocate per hit.
- > 30 voices or > 10 nodes per voice: AudioWorklet, buffer pooling.
- FDTD or > 30 modal partials per voice: AudioWorklet mandatory.

Node pooling (pre-allocated nodes reused across hits) is only a win
at high voice counts; for < 20 voices the complexity isn't worth it.

### 10.4 Preset system

Every voice is a JSON-serializable recipe:

```json
{
  "id": "snare-909",
  "engine": "subtractive",
  "layers": [
    {"type": "sine", "freq": 220, "env": {"a": 0.002, "d": 0.08}},
    {"type": "sine", "freq": 380, "env": {"a": 0.002, "d": 0.08}},
    {"type": "noise", "filter": {"type": "bandpass", "freq": 2400, "q": 0.6},
     "env": {"a": 0.002, "d": 0.15}}
  ],
  "mix": {"body": 0.5, "noise": 0.7}
}
```

- Human-readable, PR-able, forkable.
- Morphable: linear interpolation between two recipe JSONs produces a
  third (if the layer structure matches).
- Baseline: the existing kits at `app/src/audio/kits/*.ts` become
  JSON exports of themselves. Floor, not ceiling.

### 10.5 Modulation matrix

```
sources        ×     destinations
──────               ────────────
velocity             amp
step-position        pitch
env (per-voice)      filter cutoff
LFO (per-bar)        filter Q
random               noise mix
aftertouch           decay time
                     modulator index (FM)
                     partial decay scale (modal)
```

A sparse matrix: each row = `(source, dest, depth, curve)`. Most
voices use 2–5 active routings. UI exposes a small number of common
ones (velocity → amp, pitch, filter) plus an "advanced" path to add
arbitrary rows.

### 10.6 What not to build (yet)

- Full FDTD membrane simulation. Too expensive for browser real-time.
- Convolution reverb per voice. Use a single shared convolver on a
  send bus.
- Beyond 4-op FM. The complexity-vs-return curve flattens fast past
  4 ops.
- Multisampling. This is a synthesizer; samples are a different app.

---

## 11. Further reading

Short annotated list.

- **Perry R. Cook**, *Real Sound Synthesis for Interactive
  Applications* (A K Peters, 2002). The field guide to physical-model
  percussion. STK (Synthesis Toolkit) accompanying code shows modal,
  banded-waveguide, and commuted-synthesis approaches.

- **Julius O. Smith III**, *Physical Audio Signal Processing* (free
  online: ccrma.stanford.edu/~jos/pasp/). Exhaustive, rigorous.
  Skim the "Plates" and "Membranes" chapters.

- **Miller Puckette**, *The Theory and Technique of Electronic Music*
  (free online: msp.ucsd.edu/techniques.htm). Canonical reference on
  oscillator / filter / envelope theory. Written for Pd users but
  algorithm-level, not implementation-specific.

- **Karplus, K. & Strong, A.** (1983), "Digital Synthesis of
  Plucked-String and Drum Timbres." *Computer Music Journal* 7(2).
  The original paper — 10 pages, still clear.

- **Chowning, J.** (1973), "The Synthesis of Complex Audio Spectra
  by Means of Frequency Modulation." *Journal of the Audio Engineering
  Society* 21(7). Also short. The FM foundation paper.

- **Nord Drum 2 User Manual** (free PDF from nordkeyboards.com). The
  cleanest real-world documentation of a layered per-voice drum synth
  architecture. Worth reading cover-to-cover for UI + parameter
  design ideas.

- **Elektron Syntakt User Manual**. Similar value to Nord Drum 2,
  with an additional filter + LFO per voice. Good reference for
  how much to expose vs hide.

- **MDN Web Audio documentation**: developer.mozilla.org/en-US/docs/
  Web/API/Web_Audio_API. Normative reference for `OscillatorNode`,
  `GainNode`, `BiquadFilterNode`, `AudioBufferSourceNode`,
  `AudioWorkletNode`, `AudioParam`.

- **TR-808 Service Manual** (circulating PDFs). Schematics reveal the
  bridged-T kick circuit, the six-square cymbal frequencies, the
  clap bandpass, and more. Direct reference for recreating these
  voices.

- BeatForge existing kits — `app/src/audio/kits/drum-machine.ts`,
  `frame-drum.ts`, `tabla.ts`, `gamelan.ts`, `tr-727.ts`. Worked
  examples for subtractive (drum-machine, frame-drum, tabla) and
  modal/additive (gamelan) patterns.
