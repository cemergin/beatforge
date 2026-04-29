# BeatForge Design Review

> **TL;DR** — Independent senior-designer perspective on Sound page density, Practice mode integrity, and the platform-vision sanity check. Echoes Claude's bloat diagnosis but from a clean-eyes industry-standard angle. Voice palette is named as the highest-leverage change.
> **Audience:** anyone wanting an industry-standard outside take on the product.
> **Length:** ~340 lines · ~6 min read.
> **Best for:** the focus-mode-during-play idea, the voice-palette-as-lever argument, third-party validation of the subtraction call.

**Reviewer:** Senior Product Designer (10+ years, music tech)
**Date:** 2026-04-27
**Subject:** Sound page density, Practice mode integrity, platform vision sanity check
**Source:** Independent agent commissioned to review `docs/2026-04-27-design-review-brief.md`

---

## TL;DR

You have a *genuinely good product underneath a panel of cockpit instruments*. The Practice mode is sacred and largely correct; touch it carefully. The Sound page (about-to-be-Studio) has been built outward from the engine instead of inward from the user — it shows every capability at first paint, which is the classic "engineer-built UI" tell. The fix isn't a redesign, it's **collapsing 80 elements into 3 zones, demoting every "master" control into a settings drawer, and making the kit an attribute of the pattern rather than a co-equal save target.** Your platform/modular vision is good engineering but bad product framing right now — keep the *internal* modularity, kill the *external* platform messaging until users pull. The world-rhythm-native promise is half-kept: the data and grouping are there, but the visual language and voice naming still read "808/909 with extras." That's the highest-leverage thing you're not yet doing.

---

## Q1. Top 3 cuts to the Sound page

Three cuts. Each removes elements from first paint without removing capability.

### Cut 1: Collapse the kit + pattern save bars into a single contextual save header

**What goes away from first paint:** the entire two-bar stack — "kit" tag + name input + save kit button + saved-kit chips + "pattern" tag + name input + save button + new + saved-pattern chips. Roughly 12 interactive elements.

**What replaces it:** a single thin top bar reading `[pattern name, editable inline] [unsaved dot] [⋯ menu]`. The `⋯` menu contains: Save, Save As, New, Save kit only, Browse saved patterns, Browse saved kits. Saved chips disappear from the canvas — they live in a Library-style drawer summoned from the menu (or, even better, from a dedicated sidebar that's collapsed by default).

**Why this is right for personas 1 & 2:** A curious explorer has nothing to save yet — these bars are noise. A self-teaching musician (the founder) wants to recall, not browse-while-designing — recall belongs in Library or in a quick-pick palette (keyboard `Cmd-O`), not in a permanent header band. Power users are unaffected; the menu is two clicks away.

**Why kit ≠ co-equal:** see Q3 below — the kit-vs-pattern split is real internally but is a *power-user mental model* leaking into the beginner UI.

### Cut 2: Demote the master FX bar into a "kit settings" gear drawer

**What goes away from first paint:** master volume slider, master reverb wet, master delay wet, reverb size, reverb decay, delay time, delay feedback, the two divider tags. **9 controls.** None of these are touched in the first 30 minutes of use.

**What replaces it:** a single gear icon, top-right of the rhythm stage, opening a slide-in drawer titled "Mix & Effects." Inside, group as: **Levels** (master volume), **Reverb** (size, decay), **Delay** (time, feedback). Reverb/delay *send* sliders stay per-channel, behind the channel's existing Mix disclosure.

**Why this is right:** Master FX are *finishing* controls. A curious explorer auditioning a pattern doesn't need them. A practicing musician wants the kit to sound the way it sounded last time — they touch master volume once, never again. A beatmaker reaches for them after they've laid down a beat. Not first paint.

### Cut 3: Hide grouping permutation pills + free-form grouping editor behind the BeatDots strip

**What goes away from first paint:** the entire "grouping" row — label, permutation pills, text input, `= N` validator. **Up to 8 elements.**

**What replaces it:** the BeatDots hero strip itself becomes interactive. Tap any group divider in the dots → it cycles through valid groupings inline. Tap-and-hold or right-click → a small popover with permutation chips and the free-form editor. The grouping label becomes a subtle text caption under the dots: "9/8 as 2+2+2+3 — Karsılama feel."

**Why this is right:** Grouping is your differentiator (positioning principle 1a.1), and right now you've buried its emotional weight in a forms-row. The BeatDots strip is the most visually evocative thing on the page — make it *the* grouping UI. This is the move that takes you from "Western drum machine with 7/8 support" to "world-rhythm-native instrument," and it's nearly free; the data is already there.

**Net effect:** about 30 elements removed from first paint, no capability lost.

---

## Q2. Information architecture pass — top to bottom

When a curious explorer opens Sound for the first time, or a self-teaching musician opens it on day 50, the page should read in **three zones**, in this order:

### Zone A — Identity (thin, ~40px)
Pattern name + unsaved indicator + `⋯` menu. That's it. Top of page.

### Zone B — The Instrument (the hero, ~60% of viewport)
This is what people came for. Contents, in order:
1. **BeatDots strip** (now grouping-interactive — see Cut 3). Caption underneath: "9/8 as 2+2+2+3."
2. **Grid** (your active visualizer — single one, see Q3).
3. **Transport bar**, simplified: Play, BPM (with tap), meter selector (which now opens a popover, not 8 chips inline — see below).

The **gear icon** (master mix/FX drawer) lives top-right of Zone B. The **view-mode toggle** (linear/pill/circular) lives next to it but de-emphasized — not three CSS-shaped icons fighting for attention; one icon labeled "View" that opens a toggle.

### Zone C — Sound design (channels, below the fold by default)
The five channel strips. Important: **collapsed by default to a single row each.** Each strip shows: name, machine name, audition button, mini rhythm preview, expand affordance. That's it. Tap to expand into the current full strip with knobs, presets, color FX, mix.

Why collapsed by default: a curious explorer playing back a Kalimatang pattern doesn't need to see kick decay knobs. A beatmaker designing a kit *will expand* a strip. The friendly default doesn't punish the power user; one click and they're in.

### What goes into popovers / drawers (not first paint)

- **Meter selector** — was 8 chips inline. Becomes a button labeled with the current meter (e.g. `9/8`); click opens a popover grid of 8 meters + a "more…" link to a future custom-meter editor.
- **Feel** (count-in, swing, strong/weak amp) — into a "Feel" popover beside transport. Four sliders + a pill group should not occupy permanent canvas real estate; they're set-and-forget per pattern.
- **FX (master)** — into the gear drawer (Cut 2).
- **Spectrum analyzer** — keep but make it small, in the corner of Zone B, or behind a "show analyzer" toggle in the gear drawer. It's a delight for sound designers, irrelevant for explorers.

### Persona walkthrough

- *Curious explorer, first paint:* sees the rhythm name, the BeatDots, a grid, and a play button. Hits play. Hears it. Reads the caption "9/8 as 2+2+2+3." Reads the grouping. Done — that's a complete interaction.
- *Self-teaching musician, day 50:* opens, sees yesterday's pattern, hits play (or Space). The 5 channel strips below the fold are exactly where they were. They scroll if they need to tweak.
- *Beatmaker:* expands a channel strip, designs a sound, audits it. Doesn't see master FX until they reach for the gear icon.
- *Power user:* finds depth via drawers, popovers, and `⋯` menus. Annoyed for one session, fluent forever after.

---

## Q3. Practice mode UX audit

**TL;DR for Practice: it's mostly right. Don't touch the engine. Tighten the first paint and the trainer. Two specific changes.**

The founder uses this daily for baglama. That's the tell — when a real practitioner uses something for an hour a day, they will tolerate small papercuts forever rather than risk a redesign. So the bar here is "make it more glanceable + recallable, do not destabilize."

### What's right and must stay
- BeatDots strip + linear/circular grid combo is excellent for glancing-while-playing.
- Speed Trainer existing as a real feature (not buried).
- Pattern sidebar with highlights/recent/full list.
- Story disclosure — keep, this is your soul.
- Keyboard shortcuts — the practitioner is on the instrument, hand off mouse, must be `Space`/`T` reachable. Confirm these never lose focus when count-in is active.

### Two changes I'd make

**Change 1: First-paint should be the *last pattern you played*, with Speed Trainer pre-staged but not running.**

Right now I'm guessing the user lands on a default screen with empty trainer. If the founder practices the same Karsılama at 90→120 BPM ramp daily, Practice should remember that and present it. Specifically:

- Remember last pattern + last trainer config in IDB.
- On open, show: "Resume Karsılama at 90 BPM, ramp to 120 (+5 every 4 min)" as a single primary CTA above the play button.
- One click and you're practicing.

This is the difference between "open app, find pattern, set BPM, set trainer, press play" (5 steps) and "open app, press resume" (1 step). For a daily-use workflow, this is the most important UX in the entire app.

**Change 2: Make the trainer's "current state" glanceable from across the room.**

When you're playing baglama you're not looking at the screen. The dots strip handles "where am I in the bar" beautifully. But trainer state — *what BPM am I at, how long until the next bump* — should be equally glanceable.

- Big BPM number (currently a control; make it a glanceable readout with controls on hover/tap).
- A second progress ring or bar showing "time until next +5 BPM bump." Same visual vocabulary as BeatDots — colored arc fills as the period elapses.
- When the bump happens, a subtle whole-screen flash + audio cue ("ding"). The user *should not have to look at the screen* to know the BPM moved.

### What's getting in Practice's way

- **Three-view toggle is overkill in Practice.** Pick one — linear with BeatDots header is the right answer for a metronome surface. Circular is gorgeous for Library audition. Pill is an awkward middle child in this context. (See Q4 — one mode, one job.)
- **Per-pattern kit override sidebar control** is power-user clutter for daily practice. Hide behind an "advanced" disclosure on the pattern card. Default kit is fine for 99% of practice sessions.
- **Accents (strong/weak velocity sliders) inline** — these belong in a popover. Practitioners set them once per pattern.

### Things to verify (not redesign)

These are reliability concerns the brief flagged at 1a.4 — I'd commission a 60-minute test session before any visual changes:
- Run Speed Trainer for 60 continuous minutes. Confirm: no audio glitches, no scheduler drift, no memory growth, no tab-throttling pauses (PWA service worker keeps audio worklet alive). If any of these fail, that bug fix outranks every Sound-page change in this review.
- Backgrounded tab behavior — what happens when the user alt-tabs to read sheet music? Test on Safari + Chrome, mobile + desktop.

---

## Q4. The "one thing" each mode should do best

This is the most important framing question in the brief. Lock it in.

| Mode | The one thing | What works against it (cut/hide) |
|---|---|---|
| **Practice** | "Make today's practice session start in one click and run reliably for an hour." | Three-view toggle, per-pattern kit override at top level, accent sliders inline. |
| **Studio** (was Sound) | "Take a world-rhythm template and make it *yours* — change a kit, tweak a groove, save it." | Master FX bar at top level, kit-as-co-equal-save-target, the grouping editor competing with the dots strip, spectrum analyzer being prominent. |
| **Library** | "Discover a rhythm from a culture, hear it, read its story, decide what to do next." | (Library is reportedly working well — leave it. Watch for: over-filtering UI vs. browsing-as-flow. The cultural story should be teaser-on-card, full-on-tap, not buried behind a disclosure.) |

The trick: each mode's "one thing" implies a *handoff* to another mode. Practice's handoff is "I want to remix this" → Studio. Library's handoff is "I want to learn this" → Practice, or "I want to remix this" → Studio. Studio's handoff is "I want to use this in my practice" → Practice. The instant-switch architecture (Q7) supports this *if* the handoffs are obvious.

Each mode should answer a single visible question on first paint:
- Practice: **"What are you practicing today?"**
- Studio: **"What's your kit sound like?"**
- Library: **"Where do you want to go?"**

If the page can't answer its question in five seconds, it's broken.

---

## Q5. World-rhythm-native check

**Verdict: half-kept. The *data* is world-rhythm-native; the *visual and verbal language* is still Western-drum-machine with extras.**

Where you've delivered on 1a.1:
- 536-pattern corpus with cultural tags.
- Additive grouping in the data model.
- Time signatures beyond 4/4 are first-class.
- The BeatDots strip *visualizes* additive grouping correctly.

Where you haven't:

**1. The voice palette is still 808/909/707 + "extras."**
The machine list reads: kick / snare / hat / clap / tom / cowbell / modal / fm / noise / wavefolder / crackle / chip / formant / phase-distort. Eight of those are Roland-drum-machine voices. "Modal" hides the world voices (frame drum, tabla, baglama-friendly tones) behind a generic synthesis term. A curious explorer dropping into Studio doesn't see "frame drum, tabla, kalimba, dumbek" as voice categories — they see "kick" first.

**Recommendation:** Restructure the voice picker into two top-level groups: **World** (frame drum, dumbek, tabla, kalimba, gamelan-like, log drum, shaker, claves…) and **Drum machine** (kick, snare, hat, clap, tom, cowbell). Synthesis primitives (FM, modal, noise, wavefolder, etc.) move into a third "Synthesis" group for sound designers — these are *engines*, not *voices*. Lead with the world category. Yes, the synthesis primitives behind everything are the same — the difference is purely curatorial naming + presets, which is a 1-week task and an enormous shift in identity.

**2. The transport defaults are 4/4-shaped.**
The meter chips list 4/4 first. The default new pattern is presumably 4/4 with a 16-step grid. Even the founder's daily-use case (baglama, often in 9/8 or 10/8 aksak meters) opens to 4/4.

**Recommendation:** New pattern's default meter should be a *random world meter* with a fun caption — "Try 9/8 (Karsılama)" or "Try 7/8 (Aksak)." Or remove the concept of a default and instead present a "pick your meter" prompt with cultural micro-stories. (This is small, charming, on-brand, and reframes the whole product.)

**3. Cultural stories are filed away, not threaded through.**
The story disclosure is there in Practice. In Studio, it's absent (or very subtle). When you're tweaking a Karsılama kit, the cultural context disappears — you become a drum-machine user again.

**Recommendation:** Persistent thin caption under the BeatDots in *all* modes: "9/8 as 2+2+2+3 — Karsılama, Turkish Thrace." Tap → full story. The cultural context follows the pattern everywhere it goes. This is the core of "cultural stories are part of the product, not metadata trivia" (positioning principle 1a.5).

**4. Color FX naming is generic Western audio engineering.**
"odv / btc / flt." See Q9. (Flagged here too because it contributes to the "extras bolted on" feel.)

If you do *only* the voice restructure + the persistent cultural caption, your repositioning lands in two weeks of work. This is the highest-ROI change in the entire review.

---

## Q6. Platform vision verdict

**Shelve the external platform framing. Keep the internal modularity. Don't talk about it publicly until users ask.**

The architecture plan (`2026-04-27-modular-platform-plan.md`) is excellent engineering. The two-plane control/audio split, the typed event bus, the address-based router, the AudioModule interface — these are *correct* and will save you pain when you add MIDI, automation, recording, and sample voices. Build them. The plan even explicitly self-corrects in §10: "don't pursue this *yet*. Real OSS platforms emerge **after** there's pull." Honor that note.

Where the platform vision *would* hurt the product right now:

1. **Distraction tax on a solo developer.** Every hour spent on `_Lab` event-bus demos, package extraction, "build your own rhythm app in 100 lines" tutorials, and npm publishing is an hour not spent on the voice palette restructure (Q5), the Sound page subtraction sprint (Q1), or the trainer reliability test (Q3).

2. **It indexes on persona 4 (power user / external builder)** when the brief explicitly says personas 1+2 lead. Modular npm packages are sex appeal for engineers; the curious adult discovering Karsılama for the first time does not care.

3. **"Instant switching between modes" (Q7) is a real user feature** — but it's a *product* feature, not a platform feature. You can ship session-preserved tab-switching in a single mode-shell pattern without ever shipping `@beatforge/audio-graph` to npm.

**Concrete recommendation:**
- ✅ **Do** build the internal modules (events, audio-graph, router, sequencer, session) — they make the rest of the design review's recommendations cheaper to implement.
- ✅ **Do** build `useSession()` — it's the engine that makes "instant switching" possible.
- ❌ **Don't** build `_Lab` as a public route or talk about it in marketing.
- ❌ **Don't** publish npm packages until you have a documented external request (someone forking, someone asking on GitHub, someone wanting to embed).
- ❌ **Don't** describe BeatForge as "a rhythmic instrument with multiple lenses" to *users*. That's correct internally; to a user it sounds like product-management abstraction. To users say: "BeatForge is a metronome, a drum machine, and a world-rhythm library that all share the same heart." Concrete words.

Verdict: **architecture, yes. platform-as-product-story, no — not yet.**

---

## Q7. One UX experiment to ship in 2 weeks

**Replace the Sound page's first paint with the "Instrument view": BeatDots-as-grouping-UI + collapsed channel strips + everything else demoted to drawers/popovers. Ship it behind a feature flag, A/B against the current dense view, measure first-30-second behavior.**

Specifics:

- **Two routes:** `/studio` (new) and `/studio?mode=cockpit` (current dense view, kept available).
- **First-paint contract for `/studio`:** ≤12 interactive elements visible. Identity bar (3) + transport row (3-4) + BeatDots+caption (1 visible target) + grid (1) + 5 collapsed channel rows (1 each).
- **Telemetry (privacy-respecting, IDB-only, no backend):** time-to-first-play, time-to-first-edit, did-the-user-expand-a-channel, did-the-user-open-the-gear-drawer, did-they-toggle-back-to-cockpit-view, did-they-save.
- **Success criterion:** users in the "instrument view" hit play within 10 seconds and audit the pattern before touching anything else. Users in the "cockpit view" probably scroll, click around, and bounce. (You will see this in the data within a week of testing.)

If it doesn't work, you've learned that for *your* audience the cockpit was right after all. (I'd take that bet against you, but the experiment makes the call, not me.)

This is one experiment, not five. Ship it, measure it, decide.

---

## Q8. One thing to STOP doing

**Stop adding visible top-level controls to the Sound page.**

The recent commits enumerated in the brief — visualizer trio, grouping permutations, polyrhythm subdivisions, FX parameter sliders, bar counter, per-channel mini cells, color FX, save-kit, save-pattern, custom grouping text editor, keyboard shortcuts — are *all good capabilities*. Most of them are wrong as **first-paint elements**. The pattern: every time a feature lands, it gets a spot on the canvas. That's how you got to 80 interactive elements. The discipline going forward:

> **New capability lands behind disclosure, drawer, popover, or keyboard shortcut by default. Promotion to first paint is a separate, explicit decision with a removal of something else as the trade.**

Make this the rule for Studio for the next 90 days. Practice and Library are already disciplined; Sound is the leaky one.

A useful weekly self-check: count the interactive elements visible in `/studio` first paint at the end of each week. The number should monotonically *decrease* during the subtraction sprint, then plateau, then only grow when you explicitly choose to.

---

## Q9. Friendly-default-but-deep-engine principle — two specific places

The 1a.3 principle is the most important and the most easily violated. Here are two clear cases each direction.

### Where UI exposes complexity that should hide

**A. Color FX type pills `off / odv / btc / flt` at the top level of every channel strip.**
These read as cryptic to a curious explorer (persona 1) and as *limited* to a power user who'd want a real FX graph anyway. Hide.
- Fix: each channel strip's "FX" disclosure currently *toggles* visibility of FX content. Change it to hide both the type pills and the parameter knobs by default. The disclosure label becomes "Add effect" when off, "Filter ▸" / "Crunch ▸" / "Warm ▸" when on. Inside the disclosure, the type picker uses *full names with intent words*: **Clean** (off), **Warm** (overdrive — soft saturation), **Crunch** (bitcrush — gritty digital), **Filter** (lowpass/highpass). Cryptic abbreviations gone. The engine is unchanged — just the labels and the disclosure state.

**B. The channel "Mix" disclosure at every channel strip is fine, but the four parameters inside (level, pan, reverb send, delay send) are exposed as four labeled sliders, when 80% of users will only ever touch level + pan.**
Fix: surface level + pan as the *primary* controls inside Mix. Reverb send + delay send live behind a "Sends" sub-disclosure or a small "+" affordance. A beatmaker (persona 3) finds them in two seconds; a curious explorer never sees them.

### Where UI constrains the engine that should be unlocked

**C. Meter selector is 8 chips. The engine should support arbitrary meters.**
Right now: 4/4, 3/4, 6/8, 5/8, 7/8, 9/8, 11/8, 12/8. Beautiful coverage of common world meters. But — your engine should support *any* numerator/denominator + *any* additive grouping. A user who learns about 13/8 `3+3+2+3+2` doesn't have a path. A user who learns Bulgarian `15/16 = 4+2+3+3+3` is locked out.

Fix: the meter popover (Q2) ends with a "Custom…" entry that opens a small modal: `[N] / [D]` numeric inputs + grouping editor. The engine already does this; the UI gates it. This is *exactly* the friendly-default-but-deep-engine pattern: the 8 chips remain the friendly default; "Custom" is the depth.

**D. Per-channel subdivisions badge for polyrhythm is hidden as an advanced affordance, but the engine supports proper polyrhythm.**
You've correctly hidden it as a small badge, but the *visual representation* of a polyrhythm in the grid is unclear (does the grid show the longest channel? do shorter channels loop visually?). The engine handles polyrhythm; the UI half-hides it.

Fix: when *any* channel has a non-default subdivision, the BeatDots strip should switch to a polyrhythmic view that shows two concentric/parallel cycles with their own dot arrays. This is a real feature, ships in a week, and lets your circular visualizer (which is the right shape for polyrhythm) finally earn its keep.

---

## If I owned this product, here's what I'd ship in 2 weeks

A "subtraction sprint" with concrete deliverables, in sequence:

### Week 1 — Studio (was Sound) reset

**Day 1-2: Restructure first paint.**
- Identity bar (Cut 1): single thin top header `[pattern name] [unsaved dot] [⋯]`. Save bars deleted from canvas.
- Gear drawer (Cut 2): top-right of stage. All master FX move inside.
- BeatDots-as-grouping-UI (Cut 3): the strip becomes the grouping affordance. Free-form editor + permutations move into a popover summoned by tap-and-hold on a divider.
- Channels collapse by default. Click to expand.
- Single visualizer (linear). View toggle moves to gear drawer or a small icon next to it. Pill view deprecated unless usage shows it earns its keep — my bet is it doesn't.

**Day 3: Friendlier names.**
- Color FX rename: `Clean / Warm / Crunch / Filter`.
- Voice picker reorganized into **World / Drum machine / Synthesis** groups, with "World" leading.
- Persistent caption under BeatDots in Studio mode: "9/8 as 2+2+2+3 — Karsılama."

**Day 4: Cultural-thread-through.**
- Story caption under BeatDots in all three modes.
- Tap caption → full story modal (or sidebar pane in Library).
- New-pattern default = a culturally-flavored prompt instead of empty 4/4.

**Day 5: Ship behind a feature flag.** `/studio` is the new view; `/studio?mode=cockpit` keeps the current one for any user testers who freak out. Add minimal IDB telemetry.

### Week 2 — Practice tightening + reliability

**Day 6-7: One-click resume in Practice.**
- IDB persists last pattern + last trainer config.
- First paint shows a "Resume" CTA: "Resume Karsılama at 90 BPM, ramp to 120 (+5 every 4 min)."
- Single click starts.

**Day 8: Glanceable trainer state.**
- Big BPM readout (was control, becomes display with hover-controls).
- Progress ring/bar for "time until next bump." Visual language matches BeatDots.
- Audio cue + screen flash at each bump.

**Day 9: Reliability test.**
- 60-minute Speed Trainer session. Chrome desktop, Chrome Android, Safari iOS. Pass criteria: zero glitches, zero drift, zero memory growth, no tab-throttle pauses.
- If any fail → fix takes priority over the rest of week 2.

**Day 10: Polyrhythm visualization.**
- BeatDots strip detects per-channel subdivisions and renders concentric/parallel cycles.
- This validates the circular visualizer's right to exist, AND ships a power-user feature without adding visible chrome.

### What I would not do in these two weeks

- No work on `_Lab`, no event bus, no router, no module extraction, no npm packages. (All correct work, all wrong timing.)
- No new voices, no new FX types, no new meters in the chip row.
- No new top-level controls anywhere on the Sound page. (See Q8.)
- No Studio→Sound rename if it requires cascading code changes; if it's a one-line tab label change, fine.

### One discipline I'd impose on myself

A weekly "first-paint count": screenshot Studio's first paint, count interactive elements, post to a single tracking doc. Goal: from ~80 → ≤15 by end of week 2, ≤12 by end of month 1. Anything that pushes the count up requires a written justification + a removal of something else.

---

**A closing note, since you asked for opinion not checklist:**

You have built more than you realize. The 536-pattern corpus is rare. The grouping-as-first-class is rare. The cultural-story-as-data is rare. The Practice mode's actual daily use by a real practitioner (you) is the most valuable signal in the entire product.

What you've also built is a Sound page that *shows* every capability, when the curious adults and self-teaching musicians you're pointing at need a Sound page that *protects* them from those capabilities until they ask. The shift from "show everything because we can" to "show three things and let the rest emerge" is the single biggest move from "engineer-built tool" to "product worth recommending to a friend."

The platform vision is real, and it's coming, and you're right that the architecture supports it. But platforms emerge from beloved products, not the other way around. Ship the loved product first. The packages will write themselves later, when someone outside your house asks for them.

You're closer than the brief makes it sound. Two weeks of subtraction and you're shipping something distinctive.

---

**Files referenced:**
- `/Users/cemergin/lab/beatforge/docs/2026-04-27-design-review-brief.md`
- `/Users/cemergin/lab/beatforge/docs/architecture/2026-04-27-modular-platform-plan.md`
