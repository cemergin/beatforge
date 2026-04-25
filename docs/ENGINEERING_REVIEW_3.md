# BeatForge Engineering Review #3 — 2026-04-24

Spotlight: the 5 commits introducing the Sound page (`1ccd4b6` →
`f8bf12d`). New machine type system (`audio/machines/`), dedicated
Sound engine (`audio/runtime/sound-engine.ts`), and Sound page UI
(`modes/Sound/`). Production engine + 7 imperative kits intentionally
untouched.

Same scope rules as #1/#2: no extra abstractions, no framework
swaps, ship-faster taste. Solo dev.

---

## TOP 3 — findings on the delta

### 1. Recipe drift: machine presets don't match the live 808/909/707 — HIGH

`audio/machines/voice/kick.ts:44-50`, `snare.ts:33-39`,
`hat.ts:38-44` claim to mirror the legacy voices in
`audio/kits/drum-machine.ts:14-101`. They don't. Audible drift today,
worse after phase-2 migration tries to ride parity tests.

- **Kick click level halved.** Legacy 909 `cg.gain.setValueAtTime(amp * 0.2, when)`
  (`drum-machine.ts:37`). Machine renders `amp * 0.2 * click`
  (`kick.ts:89`) with preset `click: 0.4` → final amp `0.08` — 60% softer.
  707 preset `click: 0.3` → `0.06` (legacy: `0.2`). Either bump the
  presets to `1.0` or scale the click contribution differently in
  `render()`. Same for `punch: 0.6`.
- **Snare second oscillator detune is hardcoded ratio.**
  Legacy 808 `o2 = 349 Hz` against `o1 = 185 Hz` — that's a ratio of
  **1.886**. Legacy 909 `o2 = 380 / o1 = 220` = **1.727**. Machine
  hardcodes `o2 = pitch * 1.86` (`snare.ts:61`) for everyone. 909 is
  off by 29 Hz — audibly more "tonal" than the original. Move the
  ratio into the knob set (`detune` knob already exists on cowbell)
  or per-preset.
- **Hat character drift.** Legacy hat is **always** HP→BP cascade
  (`drum-machine.ts:85-91`, both filters always built). The `Hat`
  machine's `closed`/`open`/`pedal`/`ride` presets all use
  `character: 'hp'` — pure HP, no BP at all. The BP cascade gives
  the legacy hats their metallic edge; without it the new presets
  read as "white noise puff." Either default presets to `'bp'` or
  port the legacy two-stage cascade (HP at 7 kHz + BP at 10 kHz)
  into the `'hp'` character.

**Fix (≤2 hr):** add a `parity` test using `OfflineAudioContext`
that renders both the legacy `kit808.voices.KK(...)` and
`Kick.render({...808-preset})` for one bar, then compares peak +
RMS + spectral centroid within a tolerance. Same for snare/hat.
The phase-2 migration can't ship without this gate; better to land
it now while the recipes are fresh.

---

### 2. `SoundEngine` Safari-incompat + race-unsafe — HIGH

`audio/runtime/sound-engine.ts:25` calls `new AudioContext()` directly.
The production `AudioEngine.initCtxOnce()` (`engine.ts:128-130`) does:

```ts
const Ctor = window.AudioContext
  || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
```

iOS Safari < 14.5 only exposes `webkitAudioContext`. The Sound page
will throw `ReferenceError` for those users on first interaction. The
existing PWA install banner suggests iOS targeting is real.

Second, `ensureCtx()` on `sound-engine.ts:20-36` has no race guard —
if the user mashes the `▶` button while the canvas-resize observer
also calls into the engine (it doesn't today, but tomorrow…), two
contexts get created and the first one's master+analyser are
orphaned. `engine.ts:106-125` solves this with `ctxInitPromise`.

**Fix (≤30 min):** copy the `Ctor` resolution + `ctxInitPromise`
pattern verbatim from `engine.ts:106-157`. Or better — extract
both engines' `ensureCtx` to a tiny shared helper in
`audio/runtime/audio-context.ts` (≤20 lines, zero added abstraction).
That same helper will be used by `KitFxBus` when it lands.

---

### 3. Nested `<button>` in Sound channel cards — MED

`modes/Sound/Sound.tsx:113-130`: a `<button class="bf-sound-channel">`
contains a child `<button class="bf-sound-channel-trigger">`. HTML
spec disallows interactive content nested inside a `<button>`; React
19 logs a hydration warning, and Safari quietly elides the inner
button's click handler in some focus paths. The `e.stopPropagation()`
on the inner click is a tell that the dev felt the wrongness.

**Fix (≤15 min):** make the outer element a `<div role="button"
tabIndex={0} onClick={...} onKeyDown={...}>` and keep the inner `▶`
as a real button. Or — simpler — keep both as buttons and lay them
out as siblings inside a wrapping `<div className="bf-sound-channel">`,
with the card's "select" affordance being the card's whitespace
(click-through-to-select via `onMouseDown` on the wrapper). The card
already has `cursor: pointer` on the wrapper class, so visually
nothing changes.

---

## Cohesion observations

The biggest cohesion smell is **two `_util.ts` / `_shared/audio.ts`
files with identical helpers** (`audio/kits/_util.ts:6-29` and
`audio/machines/_shared/audio.ts:7-30`). The phase-1-doesn't-touch-
production rule justifies the parallel system, but `createOsc`/
`createGain`/`createBiquad`/`createNoise` are pure four-line wrappers
with zero coupling to either kit shape — they should live in one
place even today. Move them to `audio/_audio-helpers.ts` (or
`audio/dsp.ts`) and re-export from both `kits/_util.ts` and
`machines/_shared/audio.ts` so neither system grows a new dep on the
other. The `ampEnvelope` helper (new) is genuinely new and OK to
keep in `_shared/`. **One big footgun avoided:** the legacy code's
`connectVoice` (with reverb tap) is meaningfully different from the
new `VoiceCtx` (no reverb send) — that distinction is real and
intentional, don't unify those.

Other cohesion notes:
- `Sound.tsx:28` `useState(() => new SoundEngine())` matches
  `App.tsx:38` `useState(() => new AudioEngine())` exactly — solid
  consistency.
- `Sound.tsx:48-67` keyboard handler matches the
  `Practice.tsx:182-207` and `Library.tsx:65-90` shape (input/textarea
  guard, `e.repeat` skip, named-key dispatch). Good.
- `Sound.tsx` doesn't read `getMasterVolume()` from `lib/storage` —
  the production engine respects it on every load. Sound page ignores
  it and hardcodes `0.85` (`sound-engine.ts:28`). Tiny gap, cheap fix.
- Two parallel engines is fine in the file tree —
  `audio/engine.ts` vs `audio/runtime/sound-engine.ts` reads
  unambiguously. The `runtime/` directory name is a touch
  generic ("runtime for what?"); consider `sound-runtime/` or just
  letting it sit until `ChannelStrip` + `KitFxBus` land and the name
  makes sense in aggregate. Don't pre-rename.
- No lint/test pattern violations spotted. The new code uses tokens
  (`var(--accent)`, `var(--sp-*)`), function components, lazy chunks,
  `as const satisfies` — all matching house style.

---

## What surprised me, positively

1. **`as const satisfies Record<string, VoiceMachine>` is the right
   choice and it's wired correctly.** `registry.ts:18-22` preserves
   literal keys for `VoiceArchetypeId` while enforcing the value
   shape — same drift guard the codebase already uses for
   `ALL_KITS satisfies readonly KitId[]`. The forward-looking comments
   on `CHANNEL_FX`/`KIT_FX` ("populated by phase-1 commits") show the
   exhaustive registry is going to keep its discipline as it grows.
   The `triggerVoice` cast (`registry.ts:50-61`) is the *narrowest*
   possible escape hatch — confined to one function with a comment
   explaining why the discriminator already validates the dispatch.
2. **`ModValues` plumbed through `render()` from day one even
   though no UI emits modulation yet.** `kick.ts:64-68` uses
   `knobValue(cfg, 'pitch', mod)` for *every* knob lookup. When
   per-step automation lands, the renderers don't change at all —
   the runtime just starts passing populated `mod` maps. That's the
   same Trainer-cycleStartMs trick in #2 of the review (plumb the
   seam, expose the UI later) and it's already paid off here: writing
   `Hat`/`Snare` was fast because the discipline was set in
   `Kick`.

---

## Concrete next-3-commits-to-make

### Commit A: `clap` + `tom` archetypes + recipe parity tests

**Why first:** clap completes the 808/909/707 voice surface (KK/SN/
HH/OH/CP), so the Sound page can finally play a full classic
groove with the new system. Tom is a 4-knob trivial cousin of kick
(no click) — cheap to add, gives users another shape.

Critically, this commit also adds `audio/machines/voice/__parity__`
tests using `OfflineAudioContext` (Vitest's `happy-dom` doesn't expose
it but `vitest-environment-jsdom-with-audio` or a small WebAudio
polyfill works; if the env is too painful, defer parity tests to a
manual snapshot-buffer fixture committed to the repo). Without parity
tests the recipe drift in finding #1 will compound for every new
preset.

### Commit B: Extract `audio/audio-context.ts` (Safari + race-safe)

**Why second:** unblocks finding #2 with one tiny module. Both
`AudioEngine` and `SoundEngine` import the same `acquireContext()`
helper. ~25 lines. Bonus: the same helper will be reused by the
forthcoming `KitFxBus.dispose()` flow (which needs to handle
"context already closed by parent app unmount" gracefully). Land
this *before* `ChannelStrip`/`KitFxBus` land so they pick it up
on day one.

### Commit C: `ChannelStrip` runtime + per-channel level/pan in Sound page

**Why third:** the highest-leverage *next-thing-to-build* per the
phase-1 plan. ChannelStrip unlocks four UI affordances at once
(level/pan/reverbSend/delaySend), gives the Sound page mixing
behavior, and is a precondition for both `KitFxBus` (which depends
on the bus inputs ChannelStrip exposes) and color FX (which depend
on ChannelStrip's `swapColorFx` slot from the plan). Without it,
every new archetype just plays at full amp into the master — fine
for 3 voices, mushy for 5+.

Implementation note: keep ChannelStrip stateless about FX for now —
just `level`, `pan`, and an empty `colorFx` passthrough slot. Don't
land color FX in the same commit; that's commit D.

The remaining backlog (in order):
- Commit D: `Overdrive` + `Bitcrush` + `Filter` channel FX (one PR
  each is fine, all three small)
- Commit E: `Compressor`/`KitDrive`/`Reverb`/`Delay` kit FX +
  `KitFxBus`
- Commit F: 16-step test sequencer (look at `LinearGrid` for the
  cell-toggle pattern; the Sound page can reuse it almost verbatim
  with a fixed `subdivisions=16`)
- Commit G: `userKits` Dexie table + save/load
- Commit H: remaining 10 archetypes (clap+tom done in A; cowbell,
  modal, fm, comb-pluck, noise, wavefolder, crackle, chip, formant,
  phase-distort)
- Phase 2 trigger only after parity tests are green for the 7
  built-ins.

---

## Footnotes (tiny things, batch later)

- `Sound.tsx:28` doesn't call `engine.setMasterVolume(getMasterVolume())`
  on mount — the user's saved master volume is ignored on the Sound
  page. Two-line fix.
- `Sound.tsx:166-185` knob slider step is `(max - min) / 200` — fine
  for `decay: 50..2000` (step 9.75ms, imperceptible) but coarse for
  `tone: 0..1` (step 0.005, OK) and *very* coarse for `q: 0.1..10`
  (step 0.0495). The `KnobSpec.curve: 'exp'` field exists but the UI
  ignores it (linear `<input type=range>` only). Phase-1 acceptable;
  flag for the v1 polish pass.
- `SpectrumAnalyzer.tsx:38` reads `--accent` from
  `getComputedStyle(canvas)`. CSS custom properties inherit, so this
  works only if the canvas is in the DOM at the time the rAF fires —
  which it is, by construction (the rAF starts in the same effect
  that owns the canvas ref). Solid.
- `SpectrumAnalyzer.tsx:62` allocates `new Uint8Array(len)` every
  frame in waveform mode — at 60fps that's a small GC pressure
  source. Hoist to a ref. Same for line 42 in spectrum mode.
- `audio/machines/registry.ts:26-43`: `CHANNEL_FX` and `KIT_FX` are
  empty objects today, so `ColorFxId` resolves to `'none'` and
  `KitFxId` resolves to `never`. That's fine for the "phase 1
  starts empty" claim, but `keyof typeof KIT_FX` being `never` will
  bite the moment a consumer iterates over it. Add a sentinel
  `none` to both, or wait until the first FX lands and remove the
  comment.
