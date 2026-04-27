# BeatForge — Design Review Brief

**Date**: 2026-04-27
**Audience**: Senior product designer (human or AI agent)
**Author**: Cem (with Claude as scribe)

This document is **self-contained** — read it cold. You don't need any other
file in the repo to give us useful feedback. If you do want supporting context,
see references at the end.

---

## 1. What is BeatForge?

A browser-based rhythm playground that started as a metronome and has grown
into something more ambitious. Live at [cemergin.github.io/beatforge](https://cemergin.github.io/beatforge),
~300 patterns, just entering user testing.

**Tech reality**: React + TypeScript + Vite, PWA, no backend, IndexedDB for
saved work, Web Audio API for sound. Solo developer. Open source (MIT). Works
fully offline.

**Personality (aspirational)**: "Friendly Playground" — warm light theme
(#f8f6f3), big colors, beat-grouping as the killer feature.

## 1a. Product positioning (read this first)

These are non-negotiable framing principles from the founder. Every design
recommendation should flow from these.

### 1a.1 World-rhythm native, not Western-pop with workarounds

Most music tech is built around Western-pop assumptions: 4/4 time, 16-step
grids, drum kits modeled on rock/funk/hip-hop. Odd time signatures, additive
groupings, regional micro-timing, and non-Western percussion are
afterthoughts that you bend the tool toward.

BeatForge inverts this. Additive grouping (`9/8 as 2+2+2+3`), non-Western
voices (frame drum, tabla, gamelan, baglama), and culturally-tagged pattern
libraries are *first-class*. The grid, the visualizers, the persistence
shape, the audio voices, the meter selectors — all designed assuming
**any meter and any rhythmic tradition is the default case**.

### 1a.2 The audience is curious, not technical

Primary users:
- **Curious adults** discovering rhythms from cultures they've never heard
- **Kids** exploring sound and beat as play
- **Learners** practicing world instruments (the founder uses this daily for
  **baglama** practice — see 1a.4)
- **Musicians** wanting cultural inspiration without drowning in production tools

Secondary (still important): producers, beatmakers, MIDI users, sound
designers. Their needs matter but they're **not the lead**.

### 1a.3 Engine more capable than UI — handholding is a feature

Make the interface friendly. Keep the engine deep. The phrase from the
founder is:

> "Exploring different sounds should also be fun, not like a plane cockpit.
> We can have some handholding as long as the internal engine is actually
> more capable, because if we get a lot of attention we can always create
> interfaces to go even deeper."

So: hide complexity behind progressive disclosure / advanced toggles, but
NEVER castrate the engine. Power users, MIDI users, sound designers will
find the depth via deeper UI surfaces (sandbox mode, MIDI mappings, custom
voice machines) that we add as user demand emerges. The friendly default
must be friendly. The depth must be there.

### 1a.4 Practice is a real, daily use case

The founder practices **baglama** (Turkish long-necked lute) daily and uses
BeatForge as the metronome / pattern recall / speed trainer. This means:

- Pattern **recall** must be fast (open the app, find your pattern, play).
- **Speed trainer** must be solid: "+5 BPM every 4 minutes until X BPM,"
  with reliable playback for an hour-long practice session.
- Visual feedback must be glanceable — the practitioner is looking at their
  instrument, not the screen, most of the time.
- Audio must be reliable, latency-low, no glitches across long sessions.

Practice mode is **not** the afterthought to "the cool synth" — it's a real
daily-use product on its own.

### 1a.5 Cultural stories are part of the product

Each pattern in the library can have an "About this rhythm" story —
historical origin, where it lives, who plays it, related patterns. This is
*part of* the rhythm-exploration experience, not metadata trivia. Users
should learn while they play.

---

## 1b. The four personas in light of the positioning

Refining what's in section 5 below — primary order of priority:

1. **Curious explorer** (adult, kid, learner) — wants to discover rhythms
   from a culture, hear them, feel them, learn the story. The *largest*
   audience.
2. **Self-teaching musician** (the founder included) — wants the daily
   metronome + speed trainer + pattern recall workflow rock-solid.
3. **Inspired beatmaker** — wants to take a world-rhythm template and remix
   it into their own production. Wants kit/sound design that doesn't fight
   them.
4. **Power user / sound designer / MIDI user** — wants the cockpit when they
   need it. We don't lead with them, but they should *find* the depth.

The Sound page (currently dense) is over-indexed on persona 4 and
under-indexed on personas 1+2.

---

## 2. The product as it exists today (Pages)

There are currently four user-facing modes plus a hidden dev sandbox.

### 2.1 Practice — the original mode

The metronome-with-curated-patterns experience.

- Loads from a corpus of 536 culturally-tagged rhythms (PATTERNS) + user's
  own saved work (`userPatterns` IDB table).
- BPM control with tap tempo
- **Speed Trainer** — ramp BPM by N every M bars or every M seconds
  (the "killer practice feature")
- Three views: linear / pill / circular grid (toggleable)
- Beat dots strip showing the rhythm cycle
- Per-pattern kit override (808 / 909 / 707 / etc) — legacy, kit IDs
- Count-in (0/1/2/4 bars)
- Accents (strong/weak velocity sliders)
- Swing (when stepUnit ≠ 4)
- Master volume
- Pattern sidebar: highlights + recent + the full 536 list (browsable)
- Story disclosure ("about this rhythm" — cultural context)
- Share URL (smart: short `?pattern=<id>` for unedited, hash-encoded for edits)
- Keyboard shortcuts (Space play, T tap, 1-9 highlights, S star)

**Status**: works well, in user testing. About 533 lines of JSX; uses an old
audio engine (`AudioEngine`) and an old voice-keyed `Pattern` data shape.

### 2.2 Sound — the new design surface (will become "Studio")

The drum-synth + sequencer + sound-design surface. Built more recently.

- Five channel strips, each with:
  - Editable channel name (3-char abbreviation auto-derives from name)
  - Machine picker (kick / snare / hat / clap / tom / cowbell / modal / fm /
    noise / wavefolder / crackle / chip / formant / phase-distort)
  - Preset pill buttons per machine
  - Synth parameter knobs (per-machine; pitch, decay, etc.)
  - Discrete option pickers (per-machine; e.g. waveform type)
  - **Color FX** disclosure (collapsed) — type pills (off/odv/btc/flt) +
    parameter knobs for the active type
  - **Mix** disclosure (collapsed) — level / pan / reverb send / delay send
  - Tiny per-channel rhythm preview (linear cells matching main grid)
  - Subdivisions badge for polyrhythm (÷3..÷16 + main)
  - Audition trigger button + ASDFG/QWERT keyboard shortcuts

- A spectrum analyzer at the top (FFT viz of the live audio)

- A header (title + subtitle with help text)

- **Two horizontal save bars** stacked above the transport:
  - Kit bar: "kit" tag + name input + save kit button + saved kits chips
  - Pattern bar: "pattern" tag + name input + save button + new + saved patterns chips

- A transport bar: play, BPM input, tap, clear, meter chips (4/4 / 3/4 /
  6/8 / 5/8 / 7/8 / 9/8 / 11/8 / 12/8), bar counter when playing

- A grouping picker row: "grouping" label + permutation pills (when
  permutations exist) + free-form text input ("e.g. 2,2,3") + live `= N` sum
  validator (green when matches stepsPerBar, red otherwise)

- A feel + master bar: count-in pills, swing slider (disabled when stepUnit=4),
  strong amp slider, weak amp slider, divider, master volume, master reverb
  wet, master delay wet — 7 sliders + 1 pill group

- An FX bar: reverb size slider, reverb decay slider, divider tag "reverb",
  divider tag "delay", delay time slider, delay feedback slider — 4 sliders +
  2 dividers

- A BeatDots hero strip — colored-dot rhythm cycle showing playhead glow

- A view-mode toggle pinned to the right of the BeatDots strip — three small
  CSS-shaped icons (square / pill / circle) selecting Linear / Pill / Circular grids

- The active grid (StepGrid / PillGrid / CircularGrid)

- The five channel strips below all of the above

**Status**: built but very dense. **The reason for this design review.**

**Element-density count, first paint**: roughly 80+ interactive elements
before the user has done anything.

### 2.3 Library — the rhythm browser

Browse the 536-pattern corpus. Filters by region (West African, Afro-Cuban,
Brazilian, Balkan, Persian, Turkish, Indian, Gamelan, Electronic, etc.),
search, sort by tempo / time signature / starred. Click a pattern → opens in
Practice (or Studio in legacy paths). Visual cards show pattern name,
origin, tempo, time signature, grouping, region chip, beat-dots preview,
star-toggle.

**Status**: works well, recently performance-tuned (memoized cards).

### 2.4 Studio (legacy) — the original pattern editor

The voice-keyed-pattern editor with kit dropdown. This is what Sound is
replacing. Slated to be deleted once Sound's feature parity is proven and
production user data is migrated.

### 2.5 `_patterns` (dev only)

Sandbox for testing pattern data and migrations. Hidden from prod nav.

---

## 3. The vision (what we want this to BECOME)

We've been talking about the product as **a rhythmic instrument with multiple
lenses, not three apps**. The four current modes are *configurations* of one
underlying engine, each emphasizing a different facet:

- **Practice** = engine + voices + trainer + library lens
- **Studio** (formerly Sound) = engine + voice/FX design + save
- **Library** = engine + browse + audition + permute
- **Future modes**: pure metronome, live MIDI performance, kid's trainer,
  rhythm explorer

**The "instant switching" experience**: pattern keeps playing as user moves
between modes. Kit stays loaded. BPM doesn't reset. Just the UI projection
over shared state changes.

**Engineering follow-on (full plan in `architecture/2026-04-27-modular-platform-plan.md`)**:

- Two-plane architecture: control plane (events / sequencer / MIDI) sits above
  audio plane (graph nodes / signal routing).
- Audio modules implement a single `{input, output, dispose, params, set}`
  interface. Composition operators (chain, parallel, tap) make signal chains
  declarative.
- A typed `EventBus` is the central medium. MIDI input emits param events;
  scheduler emits trigger events; UI knobs emit param events. All consumers
  (audio modules, MIDI out, recorder, visualizers) subscribe to the same bus.
- A `Sequencer` interface owns pattern + timing; can be replaced by a
  `MidiSequencer` driven by external clock without changing the audio side.
- Modules will eventually publish as `@beatforge/*` npm packages, enabling
  external builders to compose their own rhythm apps from the parts.

---

## 4. UX concerns we want you to validate / push back on

Be ruthless. We expect to cut.

### 4.1 The Sound page is dense

Roughly 80 interactive elements visible at first paint. Stacked horizontal
bars: kit bar, pattern bar, transport, grouping, feel, FX, beatdots+toggle,
grid, then 5 channel strips with their own knob trees inside.

**Question**: How would you reduce density? What disappears, what hides
behind progressive disclosure, what stays?

### 4.2 Three visualizers

Linear / pill / circular for the main rhythm view. Toggleable. Most users
will pick one and stay.

**Question**: Pick a default and hide the others, or keep all three
discoverable? Are these for distinct use cases (linear=editing,
circular=visualizing cycle, pill=phrasing), or is one of them cuttable?

### 4.3 Two save concepts (kit and pattern)

Conceptually correct: kit = palette of 5 channels' machine configs;
pattern = rhythm + meter + feel + the kit. They're separate save targets in
two equally prominent horizontal bars.

**Question**: Right call or beginner-confusing? Should this collapse to one
Save button with a "save kit only" submenu? When in the user journey does
the kit-vs-pattern distinction matter?

### 4.4 Multiple ways to control rhythm structure

- 8 meter chips (4/4 / 3/4 / 6/8 / 5/8 / 7/8 / 9/8 / 11/8 / 12/8)
- Grouping permutation pills (only when alternatives exist)
- Free-form grouping text input ("2,2,3" with live sum validator)
- Subdivisions badge per channel (polyrhythm: ÷3..÷16)

**Question**: Power user paradise / beginner overload? Cut, hide, or restructure?

### 4.5 Color FX naming and discoverability

Per-channel FX type pills labeled `off / odv / btc / flt` (overdrive /
bitcrush / filter). Each has its own parameter set under a disclosure.

**Question**: Cryptic abbreviations OK or rename (clean / warm / crunch / filter)?
Is this advanced-only or front-and-center?

### 4.6 The platform vision

We're getting excited about building modules that become publishable npm
packages, with a "build your own rhythm app in 100 lines" tutorial as
validation. Anyone can fork; the engine modules are the OSS asset.

**Question**: Engineer-fun, designer-skeptical territory? Should we ship a
great single app first and let modularity emerge from external pull, or is
there a way to bake the platform into the v1 vision without distracting from
the user product?

### 4.7 "Instant switching" between modes

Cool capability — pattern keeps playing across tab switches; same kit; same
session state preserved. Tied to the platform vision.

**Question**: Real user need or clever-engineer fan service? Do real users
actually want to design a kit while a pattern plays in Practice mode, or
do they finish in one mode and move on?

### 4.8 Subtraction sprint?

We've been adding fast. Recent commits added: visualizer trio, grouping
permutations, polyrhythm, FX parameter sliders, bar counter, per-channel
mini cells, color FX, save-kit, save-pattern, custom grouping text editor,
keyboard shortcuts.

**Question**: What would a single "subtraction sprint" cut/hide first to get
back to a beginner-friendly first paint? What's the minimum-lovable Sound
page?

---

## 5. Specific user personas (in priority order — see also section 1b)

Personas, ordered by what the v1 should serve **best**:

1. **Curious explorer** — adult / kid / learner discovering rhythms from a
   culture they've never heard. Largest audience. Wants: discoverable
   library, audible-on-tap, cultural story, visual rhythm grammar that makes
   the structure clear (the beat-dot grouping is genius for this).
2. **Self-teaching musician** — practices daily, uses BeatForge as
   metronome + pattern recall + speed trainer. The founder is in this
   group, practicing baglama daily. Wants: fast pattern recall, reliable
   trainer (+5 BPM every 4 min until X), glanceable feedback, no audio
   glitches over an hour-long session.
3. **Inspired beatmaker** — takes a world-rhythm template and remixes it
   into their own composition. Wants: kit/sound design that doesn't fight
   them, easy save/recall, ability to deviate from the cultural template.
4. **Power user / sound designer / MIDI user** — wants depth: polyrhythm,
   color FX, MIDI in/out, custom voices, eventual sample import. We don't
   lead with them, but they should *find* the depth as they look for it.

Personas 1 and 2 should drive Sound's first paint. Personas 3 and 4 should
be reachable but not visible until summoned.

---

## 6. Constraints

- **Solo developer**, every feature earns its complexity budget
- **PWA**, offline-first
- **No backend**, no accounts, IndexedDB only
- **Static hosting** (GitHub Pages currently)
- **Synthesized audio only** — no sample files (licensing / bundle size)
- **Open source MIT** — community contributions over time
- **Already shipped to early testers** — destructive changes need data
  migration

---

## 7. What we want from you

Ruthless, opinionated answers — not just observations. Specifically:

1. **Top 3 cuts** to the Sound page that would meaningfully improve first-paint
   experience for a new user. Be specific (which element, where it goes).

2. **Information architecture pass**: how should the Sound page's hierarchy
   read top-to-bottom? Which controls are primary, which secondary, which
   advanced? Anchor to the **curious explorer + self-teaching musician**
   personas (section 1b/5).

3. **Practice mode UX audit**: given that Practice is a daily-use product for
   real practitioners (founder uses it for baglama practice), what does its
   workflow look like *first paint*? What should be one-click reachable
   (recall a pattern, set up "+5 BPM every 4 min until X", start)? What's
   getting in the way of glanceable, reliable practice?

4. **One-thing principle**: what's the *one* thing each mode (Practice /
   Studio / Library) should do best? What features in each work *against* that?

5. **World-rhythm-native check**: does the current UX read as a culturally-
   inflected rhythm tool, or as a Western drum machine with extra features
   bolted on? What would shift it convincingly toward the former?

6. **Platform vision verdict**: should we pursue the modular/instrument-
   platform framing now, or shelve until users ask? Anchor your answer to
   "would this distract from serving personas 1 and 2."

7. **One UX experiment** you'd ship in the next 2 weeks if you owned this product.

8. **One thing to STOP doing** based on the recent commit cadence.

9. **Friendly-default-but-deep-engine principle (section 1a.3) check**:
   identify two specific places where current UI either (a) exposes complexity
   that should hide, OR (b) constrains the engine's actual capability and
   should be unlocked.

---

## 8. References (optional reading)

- `docs/architecture/2026-04-27-modular-platform-plan.md` — full architecture plan
  with code examples (this is the engineering side; you don't need to read it,
  but it's available)
- `docs/architecture/overview.md` — older architecture overview
- `docs/SOUND_PAGE_PLAN.md` — original Sound page design plan (older)
- `docs/2026-03-12-beatforge-product-design.md` — original product design
  spec from project kickoff

---

## 9. Format we'd like for your response

Bias toward concrete + opinionated. Bullet-driven where possible. Code/wireframe
snippets welcome but not required. Anchor each recommendation to a user
journey ("when a beginner first opens Sound, they see X").

Length: as long as needed but not longer. We'll act on this — every concrete
suggestion is a candidate for the next sprint.
