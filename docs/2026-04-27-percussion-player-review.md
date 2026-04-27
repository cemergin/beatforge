# BeatForge — A Practitioner's Review

**Reviewer**: Lifelong percussionist who has practiced under metronomes from a Wittner pendulum to a Boss DB-90, sat under tabla ustads, played frame drum in the Velez tradition, and accompanied baglama, oud, and saz players for years.
**Date**: 2026-04-27
**Subject**: BeatForge as a daily practice partner for a self-teaching world-instrument player
**Source**: Independent agent, sixth lens commissioned for the design review pass

---

## TL;DR

BeatForge is *already* a better practice partner than 90% of the rhythm apps a self-teaching world-instrument player has tried, and the reason is simple: **the founder is a practitioner, and the bones of the app reflect daily use, not feature-spec ambition.** The trainer ramp, the BeatDots cycle, the additive grouping, the 536 patterns, the warm cream background that doesn't strobe at you when you've been practicing for an hour — these are the choices a practitioner makes. The toy-maker called Practice "sacred" but couldn't articulate *why*; the why is that **you, the founder, have shaped Practice the way you'd want a teacher in the room: patient, audible, glanceable, predictable.** What's missing — and what would make this *the best practice partner a self-teaching world-instrument player has ever used* — is mostly down in the millimeter-level details of *click quality at 40 BPM*, *cycle-position glanceability from 4 feet away*, *trainer recovery without losing your place*, and a few small affordances that respect the reality that **the screen is not where your eyes are.** None of this is a redesign. It's a sharpening of edges. The biggest single lever: a "click vs. groove" toggle and a real audible-at-40-BPM kick. Everything else flows from that.

---

## Part 1: The practitioner's lens

### 1. The 90-minute baglama practice test

Walk it with me, founder, like I'm sitting next to you with my baglama on my knee.

**0:00 — Open the laptop.** This is the single most-repeated moment in your daily practice life. In an ideal world, BeatForge remembers: yesterday I worked Karsılama, last tempo 92 BPM, last trainer config "+5 every 4 bars to 120." The landing should *not* make me re-pick a pattern, re-stage the trainer, re-set the BPM. **One CTA: "Resume Karsılama, 92 → 120 BPM." Press space.** This single behavior is what separates a practice tool from a "rhythm app I have to set up." This is the daily papercut.

**0:00–0:08 — Warm-up at 60 BPM.** I want a *clean click* — just kick on beat 1, quiet woodblock or hat on the inner pulses if I want them. Right now Practice loads the pattern's full kit. That's a groove, not a click. **For warm-up I just want pulse.** I find myself wishing for a "click only" mute that strips down to bar-1 + sub-pulses, regardless of the loaded pattern.

**0:08–0:25 — Slow Karsılama at 50 BPM, hands learning the figure.** Here every step of 9 must be unambiguously audible.

**0:25–0:50 — Trainer ramp.** I set it up and let it climb. This is your killer feature and it's the one thing nobody else does this well — Boss DB-90 has a tempo ramp but it's buried six menus deep; Soundbrenner can do it but it's app-tethered to a wearable; Korg Beatlab requires button-push. **Yours just works in a browser tab.** This is the part of BeatForge that already wins.

**0:50–0:55 — I screw up at 95 BPM.** Now things get interesting. I want to drop back to 90, regain composure, and continue the climb. Today, my options are: pause, manually set 90 BPM, restart the trainer (loses the climb config), or punch through and hate myself. **There's no "drop 5 BPM and resume" gesture. This is the second-biggest practitioner papercut.**

**0:55–1:10 — Pattern switch.** I want to move from Karsılama to a different 9/8 (Aksak Semâî, or 7/8 for a Roman havası feel) without losing my place — same kit, same volume, same trainer scaffolding, just a new figure. Pattern recall is fast in BeatForge (good). What's slower is *trainer reset on pattern change*: switching pattern blows away my trainer config, forcing me to re-stage. Practitioners practice multiple rhythms per session.

**1:10–1:25 — Polishing at near-tempo.** I disengage the trainer and just loop at 115 BPM for endurance. Want a giant glanceable BPM number I can read from 3 feet away. Want a bar counter so I know I've done 32 bars. Want to NOT have the screen update in any other way that pulls my eye.

**1:25–1:30 — Wind down.** Drop to 60 BPM, last pass, slow it down to feel the cycle whole. Close laptop. Done.

**Where would I abandon BeatForge for a Boss DB-90?** Three things would do it:
1. **Audio glitches in long sessions.** A single dropout at minute 47 of an 80-minute practice is unforgivable. Hardware metronomes never do this.
2. **A click that doesn't cut through a baglama or a frame drum.** Hardware metronomes use a dedicated voice (the Wittner click, the DB-90 woodblock) tuned to be heard over a real instrument.
3. **A trainer that loses my place.** If I have to re-stage the climb after every screwup, I'm back to a pendulum.

The good news: **none of these are happening at a level that drives me away today.** They're at the level of "the founder will tolerate this for himself, but a stranger doing baglama practice for the first time will close the tab on day 3."

### 2. The slow-practice extremity test (40 → 50 → 60 BPM, 9/8 Karsılama)

This is where a lot of metronome apps die quietly.

**Audibility test:** at 40 BPM, every step must have a **transient** I can hear. Roland 707-style hats and a deep 808 kick get muddy together at low tempo because the kick's body extends past the next step. **At 40 BPM you want short, percussive, transient-forward voices** — frame drum slap, woodblock, dumbek tek, a tabla tin — not a big sustained 808 kick.

**Scheduler drift at 40 BPM:** Web Audio with a properly-implemented look-ahead scheduler should be rock-solid at 40 BPM. **A practitioner can hear 5ms of drift over a 90-minute session.** Worth a 60-minute log of audio context timestamps vs. expected times to confirm.

**Visual at 40 BPM:** at this tempo I have ~1.5 seconds between each of the 9 steps. The current playhead glow lights up *on* the step. At slow tempo I want it to *swell into* the step (50ms ramp up before the hit, sharp on the hit, slow fade out). This is how a conductor's baton works — the prep is visible. **A static blink is honest at 120 BPM. At 40 BPM it feels late.**

**Cycle-position at 40 BPM:** "you're on step 4 of 9, in group 2 of 4 (the 2+2+**2**+3)" — this is the information I need. The colored grouping dots get this right structurally. The issue: at 40 BPM I'm *thinking* about which subgroup I'm in for the gestural shape, and I want the **current group highlighted**, not just the current step.

### 3. The click-track quality audit

**Is BeatForge's default kick click-able?** Honest answer: it depends on the kit, and that's the problem. The 808 kick, beautiful for grooves, has too much body for a click voice when I'm playing baglama in the same mid-low frequency range.

**The deeper issue: BeatForge is always a groove, never a click.** When I load a pattern, I get the full kit — kick, snare, hat, sometimes hand percussion — playing the rhythm. Sometimes I want that. Most of the time during baglama practice, **I want a click on bar 1, sub-pulses on the inner downbeats of each group, and silence elsewhere.** That's how you practice a 9/8 — you accent the boundary between groups, not every step.

**What I'd build (small):** a "Click mode" toggle right next to play. Three states:
- **Groove** (default, plays the full pattern as designed) — current behavior
- **Click+Sub** (only the first step of each group plays — for 2+2+2+3 that's steps 1, 3, 5, 7. Use a clavé/woodblock voice. Subgroups distinguishable by pitch.)
- **Click only** (only step 1 of the bar — pure pulse).

This is **one of the most-asked features I would expect from any baglama, oud, ney, or kemençe player who tries the app.**

This isn't producer-feature creep. **It's the difference between a metronome and a drum machine, and right now BeatForge is a drum machine pretending to also be a metronome.** As a player I'm telling you: this is the single most-impactful Practice mode change you could ship.

### 4. Glanceability over density

A metronome on a music stand, four feet from my eyes, with my baglama on my lap and my head down at the fingerboard — what should I be able to read in a 200ms glance?

**Critical (must be huge):**
- **Current BPM** (huge digits, top-of-screen). I need this when the trainer is climbing. ~80px tall on a laptop.
- **Cycle-position** — which step in the group, which group in the cycle. **Make the BeatDots strip 2x bigger in Practice mode.**
- **Trainer state when active** — current target BPM, time/bars to next bump.

**Nice-to-have (small or summoned):** Bar counter, pattern name, volume / kit / FX.

**Cuttable on glance:** Pattern sidebar (collapse during play), story/cultural caption, step grid editor.

**The four-foot test:** sit at your kitchen table, put your laptop on a music stand four feet away, open Practice. Can you read the BPM? Can you tell which step in the cycle you're on, eyes-half-on-the-instrument? **If no, the BPM digits are too small and the BeatDots strip is too small.**

### 5. Cycle vs. count — circular vs. linear

Here's where I'll push back on a popular assumption.

**Linear is the right default for practice.** Not because of Western reading habits — although that matters for kids and adults raised on staff notation — but because **linear visualizes phrasing**. When I'm playing a 9/8 Karsılama on baglama, my hand is moving across phrase shapes that have a left-to-right *progression* feel: the first 2-group is the "down" gesture, the second 2-group is the "answering" gesture, the third 2-group sets up tension, and the 3-group resolves it. Linear shows that progression.

**Circular is right for some traditions but wrong for most practice.** A tabla teen taal *cycles* — sam (the 1) returns and the cycle is felt as a closed loop. The Indian tradition explicitly trains you to feel the cycle as a wheel, and circular visualization rewards that perception. Persian zarbi has cycle-feel too. Gamelan colotomic structures are cycle-thought. **Circular is correct for these.**

But for Turkish aksak (your Karsılama), Balkan rhythms, and most of what a self-teaching multi-tradition player will actually practice, the rhythm is *additive and progressive*, not cyclic-as-wheel. Linear matches the cognitive model. Karsılama wants linear; teen taal wants circular.

**Actionable take:** linear default in Practice. **Circular as a per-pattern-tradition default** (when you load a tabla pattern, the visualizer auto-flips to circular; when you load a Karsılama, it stays linear). The toggle remains, but the *suggestion* matches the tradition. Pill view: probably cuttable for Practice — it's a Studio aesthetic, not a practice tool.

### 6. The trainer for a Turkish 9/8 wedding rhythm

Karsılama target tempo is dance-floor: roughly 100-130 BPM. Real walkthrough:

- **Start tempo: 60 BPM.** Not 40 — at 40 the gestural shape disintegrates.
- **Ramp: +5 BPM every 4 bars** — too aggressive. A practitioner's body needs ~30-60 seconds at each tempo plateau. **+5 BPM every 8 bars or every 60 seconds, whichever is longer.** OR: **+2 BPM every 4 bars**. Smaller, more frequent, less perceptible.
- **Hold tempo: at every multiple of 10 BPM, hold for 8 bars before climbing.** This gives you a "settling plateau." (Optional config.)
- **End tempo: 130** — slightly above target so 120 feels easy on the day.
- **Audio cue at tempo bumps:** **NO ding.** Maybe a barely-audible click-pitch-shift on the bump (the next click is half a semitone higher in pitch for one cycle). The toy-maker proposed a ding; that's right for a kid celebrating progress, **wrong for a practitioner deep in flow.**
- **Pause/recovery:** *huge* — see §10.

**One more practitioner-grade trainer feature nobody serves:** **the descending ramp.** End-of-session, you want to ramp *back down* from your worked tempo to a slow consolidation tempo, to lock in the figure at slow. Boss doesn't do it. Korg doesn't do it. BeatForge could. "120 → 80 over 4 minutes, ending session." This is the *cooldown*. **One feature, profound impact, three days of engineering.**

### 7. The "play with one hand" test

When I'm holding a 16" daf in my left hand and playing with my right, **my hands are full**. Reaching for the laptop trackpad means lowering the daf.

**Solutions, ranked:**
1. **Spacebar to play/pause from a Bluetooth foot pedal.** Pages-of-music turners (AirTurn, PageFlip) emit spacebar events. Already works because BeatForge respects spacebar. Document this on the practice tips page. *Cost: zero engineering, one paragraph of docs.*
2. **A massive on-screen hit zone for play/pause that occupies 1/3 of the visible screen** when in "practice focus" mode.
3. **Tablet on a music stand mode** — bigger touch targets, low-density UI, persistent BPM display. A `/practice?focus` route with everything sized 2x.

The foot pedal angle is gold. Most practitioners don't know their browser will respect a Bluetooth foot pedal as a spacebar source. **Telling them changes the product without changing the product.**

### 8. Counting-aloud support

Every percussion tradition has an oral notation:
- **Tabla**: dha, dhin, ta, tin, na, ge, ke, tirakita
- **Turkish dumbek**: düm, tek, ka
- **Persian tonbak**: tom, bak
- **Cuban folkloric**: bajo-uno-dos, plus clavé "five-three" / "three-two"
- **Konnakol** (South Indian) — entire rhythmic syllabary

**The toy-maker's proposal: bols under tabla dots.** Right idea, partial implementation. Practitioner-grade version:

- **Below 80 BPM:** show the syllables as text under the dots, large enough to read at glance. Use the tradition's syllabary tied to the pattern.
- **Above 80 BPM:** syllables hide; just dots. (Reading text faster than 80 BPM is mental noise; you should be feeling, not reading.)
- **Optional, off by default: speak the bols.** Konnakol practice apps do this — synthesized voice articulating "dha-dhin-dhin-dha." It's *enormously* helpful for absolute beginners, *enormously* annoying for anyone past the introductory week. **Toggle, not default.**

If you ship the *visual* bols (text under dots, off above 80 BPM, tradition-aware) without the *spoken* bols, you've already done 80% of the value.

### 9. Headphones, speakers, Bluetooth, music-stand contexts

**Audio resilience moves:**
1. **Bluetooth latency awareness.** Bluetooth audio adds 50-200ms of latency. Detect Bluetooth output and *show a small "Bluetooth: ~150ms latency" warning*. Cannot fix it, but acknowledging it builds trust.
2. **A loud-mode for over-instrument click-cutting.** A "boost click" mode that adds 6dB to the kick voice without re-EQ. Hardware metronomes solve this with dedicated transducers; you solve it with mix.
3. **Latency calibration.** Optional one-time setup: "tap on the click for 8 beats, we'll measure your input-output latency, adjust visual sync."
4. **Don't mix-bury the click in the master reverb wet.** A click should be **dry** for clarity. Either route the click to a pre-master tap, or have "click mode" disable master FX.

### 10. The "I screwed up" recovery

This is the most practitioner-specific feature on this list, and the one I most want you to ship.

**Today, mid-trainer, when I screw up at 95 BPM:**
- Pause (loses position in trainer)
- Manual BPM change (loses the climb)
- Stop and restart (loses 2 minutes of building tempo)
- Punch through (gets worse, loses confidence)

**What a practitioner wants:** a "step back" gesture. Something that says "drop me 5 (or 10) BPM, hold for 4 bars, then resume the climb from there." It's the metronome-equivalent of a teacher saying "let's take that down to 90, do it twice clean, then climb again."

**Specific spec:**
- A keyboard shortcut (suggest `[` and `]` for ±5 BPM) that:
  - Drops/raises current tempo by 5 BPM
  - Holds the new tempo for 8 bars
  - Resumes the climb from the new tempo (not the original)
- Visible on screen: "Stepped back to 90 BPM. Resuming climb in 8 bars."

There is **no other practice tool in the world that does this well.** Boss DB-90 has tempo-step buttons but no integration with the ramp. Soundbrenner has a wearable; you can't reach a buckle in mid-roll. Korg requires menus. Pendulum metronomes can't even contemplate the question. **This is a single keyboard shortcut and ~15 lines of trainer-state logic and it would be the practitioner-grade feature that makes daily users tell every other instrumentalist they know.**

Add a partner: **"Repeat last bar."** I just played the 9-step Karsılama figure and felt the 3-group come out wrong. I want to hear it once cleanly *at the same tempo* before continuing. Spacebar pause + shift-spacebar "rewind 1 bar and replay" or similar.

---

## Part 2: Where the prior reviews under-serve the practitioner

**The toy-maker** correctly says Practice is "sacred" but spends 95% of their text on Studio's joy onramp. They never unpack what makes Practice great or what would make it *greater*. Specifically:
- They want a "ding" at tempo bumps. **Wrong for practitioners — pulls you out of flow.** Right for kids celebrating mastery; wrong for daily use.
- They want the BeatDots strip "twice as big." They're right, but for a *different reason than the toy-maker thinks*. The practitioner reason is glanceability from across the room with eyes mostly on the instrument.
- They argue for "no menus, surprise buttons, randomization" — which is *exactly wrong* for Practice. Practitioners don't want surprises in their practice. We want consistency, recall, and predictability. **The toy-maker's joy-onramp belongs at `/play`, not anywhere near Practice.**

**The drum-machine designer** over-rotates on Studio cleanup and producer features. They miss:
- **Click vs. groove distinction (§3 above) entirely.** Producers don't care because they're making the groove; practitioners desperately need the click-only mode.
- **Headphones/Bluetooth/music-stand context resilience.** Producers practice in studios with monitors. Practitioners practice anywhere.
- **Trainer recovery interactions.** Producers don't use trainers — they're not practicing, they're producing.

**The ethnomusicologist** is mostly right but might over-weight the *story*. As a practitioner who *already knows* what Karsılama is, I don't need the story re-presented every time I open it. **Stories are for the curious-explorer persona; they're noise for the practitioner persona.**

**What none of them say (because they're not players):** *the act of practicing is repetitive, slow, and lonely. The metronome is your only company. A great practice partner is one that fades into a steady presence — audible-but-not-distracting, glanceable-but-not-attention-capturing, consistent-but-not-rigid. The art is in the absence of friction.* Every feature decision in Practice mode should pass the test: "does this fade into a steady presence, or does it draw attention to itself?"

---

## Part 3: What the founder probably already knows but hasn't articulated

You've been using this for baglama daily. You know things you haven't written down. My speculations:

1. **You probably wish for a "click only" mode** and just haven't said it because you've internalized the workaround.
2. **You almost certainly hit the trainer-screwup-recovery papercut weekly** and have learned to live with it.
3. **You probably wish circular were the default for some patterns and linear for others** but have settled for one default because you don't want to write the per-pattern logic.
4. **You probably have a feeling that 40 BPM doesn't sound right** and have unconsciously avoided practicing that low.
5. **You probably wish the BPM digit were huge** and have squinted at it when ramping.
6. **The bar counter probably feels small** and you probably stop trusting it after 60+ bars.
7. **You probably never edit a pattern from Practice** — recall yes, edit no.
8. **You probably wish for a quick pattern A/B switcher** — practice Karsılama, then Aksak, back and forth, locked to the same kit.
9. **You probably almost-never use Studio yourself** despite building it. Practice and Library are your daily surfaces. **This is the strongest argument for not letting Studio's UX problems dominate the design conversation.**
10. **You probably have a setlist of 8-12 patterns you actually practice rotating through.** The 536-pattern library is impressive but you only touch maybe 2% of it personally. **A "favorites first" view with exactly your daily rotation, set up as a wheel-able list (1-9 hotkeys), would be the highest personal-utility feature you could ship for yourself.**

You'd never tell a fellow practitioner "BeatForge has all 536 patterns." You'd tell them "BeatForge has the trainer that lets me ramp from 60 to 120 in 4-minute bumps, and it remembers where I left off." **That's the brand.** Lead with it.

---

## Part 4: Three concrete features for a 2-week practice-only sprint

### Feature 1: "Click vs. Groove" mode + a real click voice

**The feature:** A 3-position toggle in Practice mode header: **Groove / Click+Sub / Click**.
- Groove: current behavior (full pattern)
- Click+Sub: only group-onset steps play, using a dedicated click voice
- Click: only beat-1 of bar plays
- Add a "loud click" option that boosts the click voice 6dB above master.
- The click voice is selectable from a small palette (woodblock, rim, frame-drum slap, kalimba ping, conga slap, hand-clap).

**Why a practitioner needs it:** §3 above. This is the missing metronome-mode in your drum-machine. It's the difference between "sometimes useful for practice" and "the only thing I use daily."

**Engineering rough-cost:** ~3-4 days.

**Reference & gap:** Every hardware metronome has this as the *default*. No browser app I know of has it well. **You'd be the first browser app to bridge cleanly.**

### Feature 2: Trainer recovery — step-back, repeat-bar, descending ramp

**The feature:** Three small additions to the Speed Trainer:
- **`[` and `]` keyboard shortcuts** — drop/raise current tempo by 5 BPM mid-climb, hold 8 bars at the new tempo, then resume the climb from the new tempo.
- **`R` key** — repeat last bar at current tempo.
- **Descending ramp option** — flip the trainer to climb *down* for cooldown phase.
- All three actions show large temporary HUD text: "Stepped back to 90 BPM. Resuming climb in 8 bars."

**Why a practitioner needs it:** §10. This is the feature that respects how practice actually goes — non-linear, with screwups and re-tries.

**Engineering rough-cost:** ~4 days.

**Reference & gap:** Hardware metronomes don't do this; software metronomes don't do this. **This is the practitioner-grade feature with no reference precedent. You'd be the first.**

### Feature 3: Practice-focus mode

**The feature:** A `/practice?focus` view (or `F` keyboard shortcut):
- BPM digit takes ~25% of vertical screen height — readable from 6 feet
- BeatDots strip takes ~30% of vertical height — readable from 4 feet
- Trainer state compact below BPM
- Pattern name, tiny, top-corner
- Bar counter: "18 of 32" format, prominent
- Cultural caption hidden (can swipe down to summon)
- Pattern sidebar hidden (can swipe right to summon)
- Volume + click-mode toggle: bottom corner, big tap targets
- All other UI: hidden until summoned by gesture

**Why a practitioner needs it:** §4 + §7. Today the Practice page assumes you're at a desk with a mouse. A practitioner with hands full and eyes on their instrument needs an *ambient* surface, not a *workspace*.

**Engineering rough-cost:** ~3-4 days.

**Reference & gap:** **No browser-based practice tool I know does this well.**

---

## Part 5: The 9/8 Karsılama walkthrough — what *should* it feel like?

### At 40 BPM (super-slow, learning phase)

**Audio:** Click-mode is on. The 1 of each group plays a wood-block "tok," each at slightly different pitches so I can hear group boundaries by ear (group 1 = high tok, group 2 = mid-high, group 3 = mid, the 3-group's first step = low — a descending pitch contour that *teaches you the cycle by ear*). The 9 individual steps in between are silent. **The cycle is a 4-note ear-melody, not a 9-step grid.** Reverb is bypassed. Click voice is +3dB hot.

**Visual:** BeatDots strip is huge, occupying half the vertical screen. The active step within the group pulses in a *pre-anticipation* swell — at 40 BPM, the visual ramps up over 80ms before the click, sharp on the click, fades out 200ms after. **It feels like a conductor is breathing, not blinking.**

**Feel:** The app is patient. **Generous.**

### At 90 BPM (working tempo)

**Audio:** Click+Sub mode. Wood-block on group 1, with quieter sub-clicks on each of the other group-onsets. The 9-step interior is still silent.

**BPM:** Big number top-of-screen. ~80px tall. Currently 90.

**Trainer:** On. "Climbing from 80 to 110, +2 every 8 bars, currently at 90, 12 bars to next bump." A small ring around the BPM digit shows time-to-next-bump, filling in.

**Feel:** **When I miss, I tap `[`, the BPM drops to 85, the HUD says "Stepped back to 85, resuming climb in 8 bars," and I breathe and re-enter the cycle.** No restart. **Generous.**

### At 130 BPM (dance tempo, beyond working)

**Audio:** Groove mode (now I want the full ensemble). Reverb wet adds a hall — this is wedding music; reverb is part of the feel.

**BPM:** 130. Bar counter: "47 of 100."

**Trainer:** Off, holding tempo. Or: descending ramp is *armed* — when bar 64 hits, the trainer will start ramping back down to 90 over 30 bars.

**Feel:** The app has stepped back. It's a wedding band keeping me steady, not a teacher correcting me. **Generous.**

---

## Closing: If I built this for myself

The screen has three zones. **Top third: huge BPM digits, like a clock at a train station, with a small ring around them showing trainer time-to-next-bump.** **Middle third: the BeatDots strip, big as my palm, the active group warmly spotlit, the active step pulse-anticipating-and-resolving like a baton.** **Bottom third: nothing except a small click-mode toggle, a small volume knob, and "47 of 100" bars counter.**

The top-of-screen has a tiny "Karsılama · 9/8 (2+2+2+3)" tag. The cultural story is gone unless I summon it. The pattern sidebar is gone unless I summon it. The kit/voice editor is gone — that lives in Studio. **Practice is 90% absence and 10% essence.**

The keyboard owns the interaction surface: spacebar, `[`, `]`, `R`, `1`-`9` for pattern hotkeys, `T` for tap. My foot pedal triggers spacebar. My hands stay on the baglama. My eyes stay 80% on the fingerboard, 20% on the dots and the BPM. The click is a real click — woodblock, dry, hot enough to cut through the baglama's body, with a different pitch for the 3-group so my ear knows the cycle without my eyes leaving the strings. The trainer climbs in +2 BPM bumps every 8 bars, with plateaus at every 10, with a step-back gesture when I screw up. **The whole thing fades into a steady presence the way a tabla player accompanying a sitar fades into a steady presence — you know they're there, you trust them, you don't think about them, and when you mess up they don't make a face.**

That's the metronome a multi-tradition self-teacher dreams of. You're 70% there. The rest is small, surgical, and entirely within your two-week reach.

Go play, brother. The instrument's waiting.
