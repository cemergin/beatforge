# BeatForge — The Drum-Machine Designer's Review

**Reviewer:** Veteran electronic-instrument designer (Roland TR lineage, Elektron parameter-lock ethos, Volca constraint-as-feature, Sonicware weird-beautiful, Teenage Engineering minimalism, Polyend tracker, Maschine/Push pad-drumming, Moog DFAM playable-rhythm)
**Date:** 2026-04-27
**Subject:** Performability, direct control, producer-credibility — the parts the toy-maker and senior designer aren't qualified to weigh in on
**Source:** Independent agent, fourth lens commissioned for the design review pass

---

## TL;DR

BeatForge has the *bones* of a real instrument and the *posture* of a settings page. The engine is more capable than every drum machine under $400 (polyrhythmic subdivisions per channel, additive grouping as first-class, 14 voice machines, color FX, master FX bus, 536-pattern corpus) — and yet you cannot **perform** with it. There are no mute buttons. No solo buttons. There is no per-step parameter lock. Live BPM nudge is buried in a number input. There is no fill-in. There is no pattern-chain. There are no scenes. The page is 80 controls *of the wrong kind* — it has the controls a sound-designer wants when authoring a kit (knobs, FX sends, save bars), and almost none of the controls a player wants when *playing the instrument they already built*. The toy-maker and senior designer both correctly diagnose density, but their prescription — hide-by-default and drawer-everything — would push BeatForge further from being a Volca and closer to being a config screen with a play button. **The right move is a different cut: keep the density, change *which* dense controls live on the surface.** Strip the kit-design chrome (save bars, FX sliders, spectrum analyzer, knob trees inside channels), and use that real estate for the *performance* layer that's currently missing entirely — mute/solo per channel, per-step parameter locks, fill triggers, pattern chain, tap-nudge BPM. That's how BeatForge earns producer respect without losing the kid onramp (which can live as a separate `/play` route — the toy-maker is right that it should exist; they're wrong that it should be the *default Studio*).

---

## Part 1 — The drum-machine designer's lens

### 1. Performable or not?

**Not performable today.** Let me try to perform a 4-minute set with BeatForge in my head, the way I'd do it on a Digitakt:

- Switch from pattern A to pattern B mid-loop, on the next bar, with no audio gap → **can I?** No. There's no pattern-chain UI. Clicking a saved pattern chip presumably stops/starts. The brief mentions "instant switching" *between modes*, not between patterns within a mode, and that's a different feature.
- Mute the kick for 8 bars, bring it back on the downbeat → **can I?** No. Channels have no mute button. The closest move is muting individual steps or setting the mix level to zero, neither of which is performable.
- Solo the snare for an audition → **can I?** No.
- Tap-nudge BPM up 2 BPM live to lock with another musician → **can I?** Sort of — the BPM input accepts numbers. But there's no momentary "nudge +1 / nudge -1" the way a TR-8S has, and no shift-tap for fine adjustment.
- Tweak filter cutoff *over a phrase* (the most-used producer move on every instrument I've ever shipped) → **can I?** Per-channel filter exists in Color FX, but reaching it requires opening a disclosure inside a channel strip. By the time my hand is there, the phrase is over.
- Trigger a fill-in (one-bar variant played once) → **can I?** No.
- Probability-trigger steps so the pattern evolves → **can I?** No. (Engine could; UI doesn't.)

**Compare to the references:**
- **Digitakt** has 11 dedicated knobs *always on the panel* — kit-level filter cutoff, resonance, delay send, reverb send, master volume, plus 6 contextual encoders for the current track's parameters. Every one is a single hand-move from any state.
- **Volca Beats** has 6 voice-level knobs (kick click, snare snappy, tom decay, hat decay, etc.), 6 mute buttons, a single tempo knob, a stutter/roll bar, all on one panel. *No menus exist.*
- **OP-Z** has 4 contextual track encoders that re-purpose based on the active page (notes/style/sound/fx). The encoder mapping is the discipline that lets the body be that small.
- **TR-8S** has 11 channel volume sliders + 11 mute buttons + 16 step buttons + master tempo knob + master volume knob, all permanent. Dense as hell. Performable to death.

The senior designer's recommendation that channels "collapse to a single row" by default is **the wrong move for the maker persona**. Collapsed channels is what a settings page does. An instrument's channels are *expanded by default* — you want the hits-per-channel, the mute, the solo, the level, the audition trigger all visible at once. That density is what *makes it performable*.

### 2. Direct control vs menu-diving — what stays one-touch

If I were shipping BeatForge as a Volca-class web instrument, here's the **non-negotiable always-visible control set**:

**Per channel (5 channels × N controls, all visible simultaneously):**
- **Mute button** (large, instant, latching) ← currently missing
- **Solo button** (or shift-mute → solo) ← currently missing
- **Level slider** (continuous, large) ← currently buried in Mix disclosure
- **Audition trigger** (large pad / key) ← present but small
- **Step row** for that channel (the actual hits) ← present
- **One contextual knob** that defaults to "filter cutoff" but can be shift-clicked to swap to decay/pitch/send ← currently buried
- **Subdivision indicator** (small, visible — shows ÷3, ÷5, ÷7 polyrhythm at a glance) ← currently a small badge, OK

**Master row (always visible):**
- **Play / stop** ← present
- **Tap tempo** ← present
- **BPM** (with momentary +/- nudge buttons flanking it) ← BPM is a number input; nudge missing
- **Master volume** ← currently in master FX bar, fine, keep it
- **Two performance encoders** that map to "filter cutoff (all channels)" and "delay/reverb send (master)" — the Digitakt move ← currently 0
- **Pattern selector** (left/right arrows + name) for live pattern chain ← currently buried in sidebar / chips
- **Fill button** (momentary; while held, plays an alt pattern) ← currently 0

**What can absolutely live in a drawer:**
- Save kit / save pattern bars (senior designer is right — they're authoring chrome, not performance chrome)
- Master reverb size/decay, delay time/feedback (the *send* sliders on the master should be visible; the *parameter* sliders for the FX themselves can hide)
- Spectrum analyzer (delight; not performance)
- Color FX *parameter* knobs (the type pill should be visible; the parameters can hide)
- Strong/weak amp sliders, count-in (set-and-forget per pattern)

**What absolutely should NOT live in a drawer (push-back on senior designer):**
- The grouping editor. Yes, the dots strip can be tap-to-edit (that's good). But the **visible permutation pills** are a *performance* affordance — the fastest "this Karsılama 2+2+2+3 → try 3+2+2+2 → try 4+5" exploration loop is one-tap permutation. Hiding them in a popover taxes that loop.
- The view toggle (linear / pill / circular). The senior designer wants this in a drawer. **No.** Different patterns *want* different visualizers — a 32-step samba pattern reads better linear; a 12-beat cycle reads better circular. A toggle is a one-tap performance-time decision, not a settings-page decision. Put it small but visible.
- The meter chips. **Disagree with senior designer** that this should collapse to a popover labeled with the current meter. World-rhythm-native means *meters are hand-reachable*, not "set once and forget." A producer making a polymetric piece flips between 7/8 and 9/8 actively. Eight chips on a row is fine. (Cut the ones nobody plays — 11/8 is rare; consider grouping into two rows: "common" / "world.")

The senior designer's instinct (subtract until clean) and the toy-maker's instinct (hide until tapped) are both **subtraction-pure**. Drum machines aren't subtraction-pure. They're *curation-dense* — every visible control earned its slot by being touched dozens of times per session. The right question isn't "is the page too dense?" it's "which 30 controls earn their density and which 30 don't?"

### 3. Parameter locking / per-step automation — the Elektron move

This is **the** modern drum-machine feature. Without it, BeatForge is a 1996 drum machine with a Web Audio coat of paint. With it, BeatForge becomes the only browser-based parameter-locking instrument I'm aware of.

The engine already supports per-trigger `mod` values. The plumbing exists. The UI doesn't expose it. So this is *naming, gesture, and visual feedback* work, not engine work.

**Minimum viable per-step parameter lock UI — the Digitakt model:**

1. **Hold a step button → that step becomes the "selected" step.** Visually it pulses or highlights. Audio keeps playing.
2. **While holding, turn any visible knob** → that turn locks to that step (not the kit). You see a colored ring on the knob indicating "locked" state. Release the step button. Step now plays with that locked value.
3. **The step's BeatDot gets a tiny color accent** to show it has a parameter lock (Elektron does this with a small dot indicator).
4. **Hold step + tap the knob** → clears the lock for that step.
5. **Long-hold step alone → opens "step zoom" view** showing all p-locks on that step, deletable individually. (Digitakt's parameter trig page.)

**Muscle-memory feel:** identical to Elektron. Hold + turn = lock. Release = leave. Hold + tap = clear. No menus. No mode switches. Same visible knobs, contextually superpowered.

**Why this matters for world-rhythm-native:** the *single biggest thing* missing from current BeatForge is the ability to make the same Karsılama hit *not sound identical every time*. Real frame-drum players micro-time the leap-beat differently. They accent differently across 16 bars. Per-step pitch / velocity / decay / filter locks let you *sequence that humanity in.* Without p-locks, every cycle is identical, which is the dead giveaway of a beginner-tier drum machine. With p-locks, BeatForge could do things Volca Beats can't.

**Engineering complexity:** medium. Engine: low (already supports it). UI: a step's "selected" state across keyboard + mouse + touch, knob "locked" visual treatment, per-step indicator dots on the grid. ~5–7 days for a producer-grade implementation.

### 4. The 16-step bedrock — defending the grid

The toy-maker took aim at meter chips as "math fractions" and 16-step grids as Western-pop bias. **Both reviewers are conflating two distinct things, and I want to push back hard.**

**Two separate ideas:**
- **Bar length** (how many steps per bar) → BeatForge correctly varies this. Good.
- **The 16-position step-button row metaphor** → universal across every drum machine since 1980, including those used heavily for non-Western music (Indian producers loop tabla on Maschine, Turkish producers chop usul on Roland TR-8, gnawa on Akai). The 16-button row is a *muscle-memory abstraction*, not a meter assertion.

The toy-maker's claim that "step grid math notation excludes kids" is partially right *for kids*. But the claim doesn't generalize to *cultural exclusion*. The 16-step grid doesn't say "this rhythm is in 4/4." It says "this is a row of steps you can toggle." Whether 9 of those 16 are active (a 9/8 pattern) or 7 (a 7/8) or 12 (a 12/8 cycle) is up to the data — and BeatForge already does this correctly.

**Where I do agree with both reviewers:** the *labeling* of the grid as "step grid" is dry; calling it "the cycle" or just *not naming it* (it doesn't need a label) is friendlier. And the *visualizer choice* (linear vs circular) genuinely is a meaningful expression — circular is honestly better for cyclic world rhythms (see point 8 of senior designer). I'd default Practice mode to circular for cyclic patterns and linear for linear ones (auto-pick by tradition), but always toggleable, always visible.

**The 16-step row is the producer's universal alphabet. Don't pretend otherwise.**

### 5. Pattern chaining / song mode

**Yes. Build it. It's the difference between a pattern toy and an instrument.**

The objection is "do world-rhythm grooves want to extend over 32 bars?" Yes — every aksak wedding piece has a structure: intro, theme, variation, theme, transition, theme. Karsılama doesn't repeat 2+2+2+3 forever; it has fills, breakdowns, returns. Same for samba (the bateria has phrases), same for raga rhythms (the tihai is literally a pattern-chain trick), same for gamelan (irama level changes). **World rhythm is *not* one bar repeated forever; that's a beginner's misreading of it.**

**Minimum viable song mode — the Volca Beats / TR-8 chain:**
- A "chain" view (or row): up to 16 pattern slots, each holding a pattern reference + repeat count.
- Top of UI: A → B → A → C → A → B (×2). Visual clarity.
- Tap to add slot. Drag to reorder. Click slot → pattern playing, edit mode focuses on it.
- Optional: per-slot length override (this slot plays 4 bars even if pattern is 1 bar) and per-slot fill-trigger (last bar of this slot plays the fill variant).

**Engineering complexity:** medium. Sequencer needs a chain wrapper. UI is a horizontal row of cards. ~4–5 days.

**Reference:** Roland TR-8 song mode is the right depth — not the Octatrack's overwhelming arranger, not nothing. A row of slots with repeat counts, one screen.

### 6. Mute groups / choke groups

**Yes, but as a per-pair toggle, not a global feature.**

Choke pairs are physically necessary — a real hi-hat can't be open and closed simultaneously. Without it, you get the "two hi-hats ringing through each other" sound that screams "I'm playing a drum machine, not drums." Same for tom rolls, same for the canonical Roland 808 conga choke.

**For world rhythms, choke pairs matter even more:**
- Open / closed dumbek (doum / tek) — universal Middle Eastern technique, same drum, *should* choke
- Slap / tone on a frame drum — same drum, conceptually mute each other
- Damped / undamped tabla strokes
- Open / closed cabasa
- Bell mute pairs in gamelan

**Implementation:**
- In the channel strip, when machine type is settable, add a "chokes ▸" affordance under Mix (or a small chain icon). Tap → pick another channel → those two choke each other.
- Visually, paired channels share a subtle accent color or icon indicator.
- *Default kit presets* should preset these pairs (the kalimatang kit auto-pairs open/closed dumbek). Beginners get the right physics for free; power users can break the pairs.

**Engineering complexity:** low-medium. Audio engine adds a "voice-stop on trigger" hook. UI adds a pair picker. ~2–3 days.

**Reference:** Roland TR-808's mute groups (cymbal/cymbal, hat/hat, conga-conga). Volca Beats' open/closed hat choke (always-on, no UI). Maschine's group-level choke.

### 7. Performance touches the toy-maker missed

The toy-maker's review is *all* about the first 30 seconds. They missed everything that happens after the user has stopped being a tourist and is now *playing*. Here's what I'd add, ranked by what *fundamentally elevates* the instrument:

**Tier 1 — must-ship for producer credibility:**
1. **Fill-in / variant-on-demand.** Each pattern can have a "B variant" (1-bar fill). Hold a key (or button), and on the next bar boundary, the B plays once, then the A returns. This is the single most musical performance gesture — every drummer does it. *Reference: TR-8S "FILL IN" button. OP-Z's pattern-with-variants. Essential.*
2. **Step probability per channel (or per step).** Each step has a 0–100% chance of firing. Set kick to 100% on beat 1 but 30% on beat 3 → pattern subtly varies every loop. *Reference: Elektron's conditional trigs. Polyend Tracker. ~3 days to ship.*
3. **Pattern chain / song mode** (covered above).

**Tier 2 — would make BeatForge stand out:**
4. **Tap-to-roll / retrig.** Hold a key, get rapid retriggers at 1/16, 1/32, 1/8T (selectable). Audition pads should support this. *Reference: TR-8S "ROLL" button, Maschine's note-repeat. Critical for finger drumming, ~2 days.*
5. **Scene morph (Octatrack scenes / DJ-mixer-style).** Two kit snapshots A and B; a fader morphs continuously between them. Used live, this is *the* drama gesture — pull the fader, every parameter sweeps to its target. Engine already supports param interpolation. UI is a 2-snapshot button + a fader. *Reference: Octatrack scenes, MFB Tanzbär 2 morph. Genuinely elevating, ~5 days.*

**Tier 3 — nice but skippable:**
6. Pattern morphing (Elektron Digitone-style pattern crossfade) — too niche for the audience.
7. Live-recording quantize (record audition hits while pattern plays) — useful but big lift; defer.
8. Per-channel swing override — covered by p-locks; don't need a separate UI.

### 8. Aesthetic identity check

What BeatForge's current aesthetic says to a producer: *"This is a beginner-friendly metronome that's trying to grow up but hasn't quite figured out who it wants to be."*

The pieces of evidence:
- **Warm cream + colored dots + monospace** says approachable, indie, friendly. (Good.)
- **Spectrum analyzer at the top** says techy / pro. (Mixed signal.)
- **Knob graphics** say synthesizer. (Pro signal — but on touch screens, knobs are cosplay; sliders are honest, as the toy-maker noted.)
- **Pill / chip / square-shaped buttons in light gray** say "form controls." (Anti-pro signal — this is the visual language of settings pages.)
- **No status LEDs, no glowing edges, no animation when stopped** says "static document." (Anti-instrument signal.)

**What it *should* say to a producer:** "This is a hardware-flavored web instrument. It glows when it plays. The knobs *feel* responsive (subtle haptic-like animation on turn). The state at rest is *alive* (BeatDots breathe even when stopped). The colors are restrained but the active elements *light up like LEDs*."

**Concrete moves toward a producer-credible aesthetic:**
1. **Glow-on-active treatment** for every interactive element. Active mute = glowing red. Active solo = glowing yellow. Playing step = glowing white core fading to cyan halo. This is the Volca / Elektron / TR visual signature: *deep dark surface with bright accent lights*.
2. **Treat the surface like a hardware face.** Even in the warm cream theme, channel strips can have a *slightly recessed* visual (subtle inset shadow), like a control panel mounted on a panel. Knobs sit on a darker panel inset; the outer cream is the chassis.
3. **Better typography hierarchy.** Replace JetBrains Mono everywhere with a hierarchy: monospace for *numbers* (BPM, step indices, the engine readouts), clean sans for *labels*, an actual display face for the *pattern name and cultural caption*. Right now everything is monospace, which reads "code editor."
4. **Status LEDs for transport.** Tiny lit dot beside Play that pulses on the beat (kept correctly with audio). Tap-tempo pad blinks at the current BPM. *Reference: every drum machine ever.*
5. **The kit name and pattern name should look like a hardware screen readout.** Tiny, monospace, lower-thirds, like the Volca's two-digit LED display. This is character — and it *roots* the BeatForge identity in instrument-land rather than form-land.

The current aesthetic is *not bad* — it's just a *children's-book* aesthetic deployed on a *producer's-tool* product. Either pick child (commit fully — toy-maker's direction) or pick instrument (commit fully — my direction). Right now you're in the awkward middle.

### 9. World-rhythm-native for a producer

**The producer's interpretation of "world-rhythm-native" is *radically* different from the kid's.**

A producer who'd buy a Volca Sample to chop folk samples into Burial productions wants:
- **Source material that's actually a starting point.** They want patterns they can *break*, not patterns to admire.
- **Voice palettes that include the instrument's quirks.** Real frame drum has buzzy overtones, body resonances, pitch bend on the slap-edge. A "frame drum" voice that's a clean modal sine isn't useful; one that's *a real frame drum's character* is.
- **Authentic micro-timing.** Aksak isn't quantized 16ths — the beats are *unequal* in ms, and that *unequalness* is the soul of the genre. Most drum machines make this impossible. BeatForge's engine could nail this — additive grouping is the right substrate — but the UI doesn't expose timing-shift per beat group.
- **Sampling.** Eventually. They want to drop their own field recording onto a track. (You've ruled out shipping samples for licensing; that's correct. But user-imported samples are a separate, future, must-build feature.)
- **MIDI out.** They want to drive their own outboard from BeatForge's sequencer.

**Should BeatForge serve them?** *Yes — but on a separate route.* `/studio` should have a "pro" mode toggle (or just *be* the producer's workspace) that exposes: per-step p-locks, MIDI out, sample import (when shipped), micro-timing offsets per group, pattern chain, scenes, fills. The toy-maker is right that there should be a `/play` route for kids; the senior designer is right that `/studio` should subtract chrome. **What both miss: there's a third audience — the producer — and they want a route that *adds* the right kind of density.** Call it `/studio` (current) and add `/play` for the kid. The producer doesn't need a separate route name; they need `/studio` to be *for them*, with the kid stuff branched off.

**One sentence:** the producer reads BeatForge today as "an interesting toy with a good corpus." They'd respect it as "a real instrument with cultural depth" if it had p-locks, MIDI, fills, chains, and a producer-credible aesthetic.

### 10. Three things a producer expects that BeatForge doesn't have

Ranked:

1. **MIDI out.** (Highest priority.) Producers want to drive their hardware/DAW from BeatForge's beautiful pattern engine. Web MIDI API is well-supported; this is a 2–3 day ship for a basic implementation. Without it, BeatForge is permanently isolated from a producer's actual workflow.
2. **Per-step parameter lock.** (Covered above. Critical for "beats that don't sound robotic.")
3. **Pattern chain / song mode + fill triggers.** (Covered above. Critical for "this is an instrument, not a loop player.")

Beyond the top 3:
4. Audio export (WAV/stems) — listed as Phase 4. Reasonable.
5. Sample import for kits — out of scope for v1, OK to defer.
6. External clock sync (incoming MIDI clock) — pairs with MIDI out; do together.

---

## Part 2 — Tension with the prior reviews

I disagree with both prior reviews on **how** to fix the density problem. They both reach for "subtract." I reach for "**re-allocate**."

### On the toy-maker

Their review is excellent *for the kid persona* and *for the first 30 seconds*. It's substantially wrong for the maker persona. Specifically:

- **Hide-everything-by-default is right for `/play`. It's wrong for `/studio`.** The toy-maker's prescription, applied to Studio, would produce a polished but powerless instrument — a Pocket Operator without the matrix of buttons. The PO's *best* feature is its dense button grid; the toy lens missed it because they conflated PO's *visual minimalism* with *control minimalism* (PO is visually minimal, behaviorally maximal — every button does something).
- **Pill view: keep, don't drop.** The toy-maker wants to drop pill view. But pill view is genuinely the right visualizer for *phrasing-aware editing* — when a producer wants to see the rhythm grouped by phrase rather than by beat. It's the third tool, and on a producer's bench three visualizers is fine. Disagree with both reviewers; keep all three with a small toggle.
- **Meter chips: keep visible.** The toy-maker calls them "math fractions." For a kid, sure. For a producer who knows what 9/8 vs 7/8 *sounds* like, the chip row is the fastest meter switcher in any drum machine I've seen. Don't bury it.
- **Accents/swing: agree they should hide.** Set-and-forget per pattern, fine in a popover.
- **Master FX: partially agree they hide.** Master volume stays visible (every drum machine has it). Reverb/delay *send* sliders stay per-channel (visible inside the channel strip's mix area). Reverb/delay *parameter* sliders (size, decay, time, feedback) hide in a drawer. That's the right cut.

### On the senior designer

Their review is excellent *for clarity* and *for the curious-explorer persona*. It under-rotates for the producer persona. Specifically:

- **Channels collapsed by default → wrong for makers.** A producer designing a kit *wants all 5 channels' knobs visible at once*. That's how a Digitakt works — every track's parameters are reachable at all times. Collapsing them adds a click-cost to *every* tweak. The instinct is right (less density on first paint for a curious explorer), but the implementation is wrong for the maker. **My counter: channels stay open by default; what *collapses* is the per-channel FX disclosure and the per-channel Mix disclosure.** Mute, solo, level, machine, audition, primary knob — all visible.
- **Single visualizer (linear) by default → debatable.** For *cyclic* world rhythms (gamelan, aksak, qawwali), circular is genuinely the more honest representation. The structure of the rhythm IS a cycle. For *linear* / phrase-driven music (samba breaks, hip-hop loops), linear is right. Best answer: **default by tradition tag.** Karsılama opens circular. Hip-hop opens linear. User can toggle. The senior designer's "pick one default" misses that the *correct* default is data-driven.
- **Save bars → drawer:** agree. Authoring chrome.
- **Master FX → drawer:** mostly agree. Master volume stays visible.
- **Grouping editor inline → BeatDots tap-to-edit:** tap-to-edit is good. But keep the **permutation pills** visible. They're a performance affordance, not a settings affordance.

### Summary of tensions

| Element | Toy-maker says | Senior designer says | I say |
|---|---|---|---|
| Pill view | Drop | Drop unless data shows it earns its keep | Keep — phrasing tool |
| Meter chips | "Math fractions," replace with shape glyphs | Collapse to popover | Keep visible — producer's fastest control |
| Channels collapsed by default | Drastically simplify (jam mode, 4 tracks) | Yes, collapse to single row | **No** — keep open, collapse only sub-disclosures |
| Master volume | Hide | Drawer | Keep visible |
| Master reverb/delay parameters | Hide | Drawer | Drawer (agree) |
| Permutation pills | Cultural-glyph replacements | Tap-to-edit BeatDots only | Keep visible alongside BeatDots tap-to-edit |
| Save bars | Hide / surprise | Single `[name][⋯]` header | Header (agree) |
| Spectrum analyzer | Drop | Tiny corner | Tiny corner or drawer |

**Bottom line:** the toy-maker is the right voice for `/play`. The senior designer is the right voice for the curious-explorer's `/studio` first-paint. **I'm the right voice for what `/studio` becomes once the user expands it.**

---

## Part 3 — The producer's wireframe (Studio for makers, level 3+)

Sketched in words, top to bottom, for a producer who knows drum machines:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Karsılama (unsaved •)         9/8 as 2+2+2+3 — Turkish Thrace      [⋯]      │ ← thin identity
├─────────────────────────────────────────────────────────────────────────────┤
│  ▶  STOP  ●REC   BPM 96 [-][+] [TAP]   < CHAIN: A B A C >  [FILL]  vol ▮▮▮▮│ ← transport (always visible)
│   meter:  4/4  3/4  6/8  5/8  7/8  9/8★  11/8  12/8   custom…              │ ← meter row (always visible)
├─────────────────────────────────────────────────────────────────────────────┤
│  ●  ●    ●  ●    ●  ●    ●  ●  ●     [linear|pill|circle▼]                  │ ← BeatDots HERO (interactive)
│  group: 2 + 2 + 2 + 3   permutations:  [3+2+2+2] [4+5] [2+3+2+2] [edit]      │ ← permutation pills (always visible)
├─────────────────────────────────────────────────────────────────────────────┤
│ [16-step grid with all 5 channels stacked, p-lock indicators on steps]      │ ← grid (always visible, all channels)
├─────────────────────────────────────────────────────────────────────────────┤
│ CH1 dum [M][S]  vol▮▮▮  cutoff◐  [▷]  | dumbek  ▼  | chokes: dum-tek       │
│ CH2 tek [M][S]  vol▮▮   cutoff◐  [▷]  | dumbek  ▼  |                        │
│ CH3 frm [M][S]  vol▮▮▮  cutoff◐  [▷]  | frame   ▼  |                        │
│ CH4 zil [M][S]  vol▮▮   cutoff◐  [▷]  | zil     ▼  |                        │
│ CH5 bas [M][S]  vol▮▮▮  cutoff◐  [▷]  | kick    ▼  |                        │
│  └─ each strip: [▼ sound]  [▼ fx: clean]  [▼ mix]  [▼ sends]                │ ← per-channel disclosures collapsed
└─────────────────────────────────────────────────────────────────────────────┘

Drawer (gear icon): Master FX (reverb size/decay, delay time/feedback), feel (count-in, swing, accents),
spectrum analyzer toggle, MIDI in/out, view-density toggle, kit save/manage, pattern save/manage.

Performance keys: Space=play, T=tap, A-G=audition, M+1..5=mute channel, S+1..5=solo, F=fill,
                  hold step + turn knob = parameter lock, hold step alone = step zoom.
```

**What's *always* visible (no clicks):**
- Identity bar (1 thin row)
- Transport: play/stop/rec, BPM with nudge buttons, tap, chain selector, FILL button, master volume — ~10 elements
- Meter chips — 8 chips + custom
- BeatDots strip + permutation pills — interactive, breathing, editable
- View toggle (small, top-right of grid area)
- Step grid with all 5 channels stacked (not separated)
- Per-channel essentials: name, mute, solo, vol, cutoff knob, audition, machine selector, choke pair indicator (~7 controls × 5 channels = ~35 elements)

**Total visible: ~60 controls.** Yes, that's dense. **It's the right kind of dense.** Every one of those is touched in a typical session. Compare: TR-8S has 80+ physical controls and Roland did not apologize.

**What's one-action-reachable (one click / hover / disclosure):**
- Per-channel sound parameters (decay, pitch, etc.) — click "▼ sound" on the channel
- Per-channel FX type and parameters — click "▼ fx"
- Per-channel mix detail (reverb send, delay send, pan beyond just level) — click "▼ mix"
- Master FX parameters — gear icon
- Save / load patterns and kits — `⋯` menu
- Cultural story expansion — tap the caption under BeatDots

**What's deeper (worth menu-diving):**
- MIDI configuration — settings drawer
- Sample import (when shipped) — settings drawer
- Custom voice machine builder — power-user route

**Concepts to adopt from each reference:**
- **Elektron (Digitakt):** parameter lock via hold-step-and-turn-knob. *Adopt.* Step zoom view. *Adopt.* Conditional trigs (probability per step). *Adopt.* The small kit-vs-pattern distinction with kit-as-snapshot. *Adopt.*
- **Roland (TR-8S):** dedicated channel mute buttons + level sliders always visible. *Adopt.* Fill button. *Adopt.* Pattern chain / song mode. *Adopt.* The 16-step button row with status LEDs. *Adopt visual treatment.*
- **Volca Beats:** every voice's primary parameter on a dedicated knob, no menus. *Adopt the philosophy* (one primary parameter per channel always visible).
- **Sonicware Liven series:** weird-beautiful sound voices that don't try to be 808 clones. *Adopt for the world-voice machine palette* — frame drum, dumbek, kalimba, etc. should be *characterful*, not generic modal synthesis.
- **Teenage Engineering OP-Z:** contextual encoders that re-purpose by page. *Adopt for the "primary knob" per channel* — defaults to filter cutoff, shift-clickable to swap to decay/pitch/send.
- **Polyend Tracker:** per-step probability, per-step micro-timing offset. *Adopt.*
- **Maschine:** pad-based finger-drumming with note-repeat. *Adopt the audition pads + retrig.*

**Concepts to skip:**
- Octatrack arranger — too overwhelming, defer indefinitely.
- Maschine plugin ecosystem — out of scope.
- TE OP-1 lifestyle marketing — not your product.
- Eurorack patch metaphor — engine plan flirts with this; resist as a user-facing UI. Internal modularity is fine; user-facing patch cables are a different product.

---

## Part 4 — Three concrete features for the Studio side, 2-week budget

### Feature 1: **Mute / solo / fill performance bar**

**The feature:** each channel strip gets a dedicated mute button (M) and solo button (S) that are always visible. A new transport-bar element: a momentary FILL button that, while held, swaps the active pattern to a designated B-variant on the next bar boundary. Releasing the FILL button restores the A-pattern at the next boundary.

**Why it's worth shipping:** without these, BeatForge cannot be performed. With them, BeatForge becomes the cheapest Volca-class rhythm box on the market. This single change is the difference between "I made a pattern and pressed play" and "I'm playing the instrument."

**Engineering complexity:** small. Engine: per-channel mute is a one-line gain switch; solo is `mute all others`. Fill needs a per-pattern "B variant" data slot + a swap-on-bar-boundary event in the sequencer. ~3 days.

**Reference instrument:** Roland TR-8S nailed this — channel mutes in a dedicated row, FILL IN button on the transport, every gesture musical. Volca Beats nailed mute (six dedicated buttons, no menu).

### Feature 2: **Per-step parameter lock (hold-step-and-turn)**

**The feature:** holding any step button on the grid (mouse-down or finger-hold) selects that step. While held, turning *any* visible knob (volume, cutoff, pitch, decay, swing offset) creates a per-step parameter lock with that value. The locked step gets a colored ring indicator. Long-hold a step alone opens a "step zoom" view listing all p-locks on that step, deletable individually.

**Why it's worth shipping:** this is *the* feature that separates 1996 drum machines from 2026 drum machines. The engine already supports per-trigger `mod` values. Without exposing it, BeatForge is permanently in the "robotic loop player" tier. With it, BeatForge becomes a parameter-rich expressive instrument and inherits 20 years of producer muscle memory.

**Engineering complexity:** medium. Engine: low (already supports). UI: a step's "armed" state, a knob's "locked" indicator on a per-step basis, the step-zoom modal. ~5–7 days for a producer-grade implementation including keyboard accessibility.

**Reference instrument:** Elektron Digitakt's parameter locks — the move that made Elektron a billion-dollar boutique brand.

### Feature 3: **Pattern chain / song mode (Tier-1 minimal)**

**The feature:** a thin "chain" row above transport showing up to 16 pattern slots (A → B → A → C…). Each slot holds a pattern reference + repeat count. Click a slot to add or edit it. Drag to reorder. While playing, the active slot highlights and advances on bar boundaries. A "loop chain" toggle plays the chain on repeat or once-through.

**Why it's worth shipping:** this is the difference between "BeatForge as a pattern editor" and "BeatForge as a performance instrument that can play a 4-minute piece." It's also the only way to honor the *real structure* of world music — Karsılama isn't 4 bars on repeat; it has theme/variation/return. Without chain, BeatForge is structurally dishonest about what cultural rhythms actually are.

**Engineering complexity:** medium. Sequencer wrapper that advances chain state on bar boundaries. UI is a horizontal row of cards. Persistence in IDB. ~4–5 days.

**Reference instrument:** Roland TR-8 song mode — the *right* depth (one row of slots, repeat counts, no nesting). Don't aim for Octatrack. Aim for TR-8.

**Total: ~12–15 dev days for all three.** Ambitious for two weeks but achievable for a focused solo developer skipping the platform-extraction work the senior designer correctly told you to defer.

---

## Closing — if I designed BeatForge as a Volca-class instrument

**Imagine the alternate-history pitch.** BeatForge ships not as a "browser-based rhythm playground" but as **"the world's first browser-native rhythm instrument"** — a hardware-flavored web app that producers respect on first contact. The home page doesn't show a metronome; it shows the Studio with a Karsılama already breathing. The dots glow like LEDs against a slightly-recessed cream chassis. You hit space and the rhythm fills the room. You hold the kick step and turn the cutoff knob and watch a colored ring appear — *parameter locked, just like a Digitakt*. You hold FILL and the pattern lifts into a one-bar variant. You release and the groove returns. You drop into the chain row and queue Maracatu after Karsılama. You bind your Push controller via Web MIDI in two clicks. The voice palette lists *frame drum, dumbek, baglama, kalimba, gamelan-bell* before it lists *kick / snare* — because the cultural soul comes through the voices first. There's a `/play` route too, for kids and the genuinely curious — single-screen, big buttons, surprise-me — but that's a *door off the lobby*, not the lobby itself. Producers find BeatForge through a tweet that says "this is the first browser drum machine that doesn't suck," try it, p-lock a kick on bar 3, queue a chain, and never look back. Cultural journalists find it through the world-rhythm corpus and write about how it's "Atlas Obscura for rhythms." Schools find the `/play` route and use it. *Three audiences, one instrument, one shared engine, three doorways.* That's the product. The bones are already in your repo. The next two weeks are about reallocating your 80 visible controls — not subtracting them — to **the controls a player wants while playing**, instead of the controls a kit-author wants while authoring. Ship that, and BeatForge stops being "an interesting toy" and starts being **the cheapest, deepest, most culturally-rooted rhythm instrument on the modern internet**. The Volca's $150 price tag becomes free, and the depth surpasses it. That's the alternate history. It's reachable in a quarter.

---

**Files referenced:**
- `/Users/cemergin/lab/beatforge/docs/2026-04-27-design-review-brief.md`
- `/Users/cemergin/lab/beatforge/docs/2026-04-27-senior-designer-review.md`
- `/Users/cemergin/lab/beatforge/docs/2026-04-27-toy-maker-review.md`
