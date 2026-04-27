# BeatForge Design Synthesis — Six Reviews → One Action Plan

**Date**: 2026-04-27 (updated to integrate all seven lenses + founder's redirect on the cultural framing)
**Inputs**:
- `docs/2026-04-27-claude-design-review.md` — implementation-aware "close to the code" lens
- `docs/2026-04-27-senior-designer-review.md` — independent senior product designer (10+ yrs music tech)
- `docs/2026-04-27-toy-maker-review.md` — instrument-maker / learning-toy designer (Loog, Pocket Operator, Tenori-On)
- `docs/2026-04-27-drum-machine-designer-review.md` — electronic-instrument designer (Roland TR, Elektron, Volca, Sonicware, Polyend)
- `docs/2026-04-27-ethnomusicology-curator-review.md` — ethnomusicologist + museum curator (Folkways, MIM, Steven Feld). **Note**: the founder explicitly rejected this lens's *museum-piece-reverence* framing as "99% dead already" — the ensemble-naming + plain-language sourcing recommendations are kept; the tier-deferral / studied-mode / preservation-discipline framings are dropped in favor of the recombinator lens below.
- `docs/2026-04-27-percussion-player-review.md` — multi-tradition percussionist + acoustic-instrument practitioner
- `docs/2026-04-27-living-archive-manifesto.md` — **the corrective lens, anchoring the cultural-identity workstream**. Brian Eno's scenius / Talking Heads / Madlib / J Dilla / Damon Albarn / Vampire Weekend / Os Mutantes / Khaled / Rachid Taha / Anthony Bourdain / Atlas Obscura / Angine de Poitrine tradition. Connection as generation, not preservation.
**Audience**: Founder. The next-30-days plan to commit to.

---

## The headline

Seven lenses (six independent agents + the founder's redirect). Deep convergence on the **diagnosis**. Sharp, productive disagreement on the **prescription** — but the disagreements line up neatly with **persona × surface**, so they're not contradictions, they're a routing problem.

**The big late shift in this synthesis**: the ethnomusicologist's lens — provenance discipline, tier-deferral, museum reverence — was anchoring the cultural-identity workstream until the founder pushed back: *"if we put something in a museum it means it's 99% dead already. We want to keep the fire alive by connecting so that new music and energy is created from the most unexpected corners."* The cultural anchor swaps to **the Living Archive / Recombinator / Cousin-Finder lens** (see `docs/2026-04-27-living-archive-manifesto.md`). The product is no longer "a museum that lets you play"; it's **a cousin-finder for the world's rhythms** — Brian Eno's scenius applied to a 536-pattern corpus, with the spirit of the producers/musicians who generate new music by connecting old music: J Dilla, Madlib, Talking Heads, Vampire Weekend, Damon Albarn, Os Mutantes, Khaled, Rachid Taha, Arooj Aftab, Anthony Bourdain, Atlas Obscura, Dick Dale's *Misirlou*. The Quebec math-rock duo Angine de Poitrine (microtonal-but-danceable, viral, eye-catching) is the **positioning energy** — not a literal visual aesthetic to copy. *No polka dots in the UI.*

**Convergent diagnosis (extremely high confidence):**
- The Sound page is overloaded; the *kind* of density on it is wrong for everyone.
- Practice mode is sacred. The bones are practitioner-shaped because the founder is one.
- The voice palette restructure is the highest-ROI cultural lever — but the ethnomusicologist takes it further: rename "kit" itself.
- Internal modularity yes; external platform framing no.
- Curious explorer + self-teaching musician are the lead personas.
- The world-rhythm-native promise is half-kept (data is there; visual + verbal language still reads "808/909 with extras").

**Convergent diagnosis the three NEW lenses added:**
- The product currently has **no provenance**, which is the largest cultural-respect risk and the engineering-cheapest fix (ethnomusicologist).
- BeatForge is currently **always a groove, never a click** — which is the single biggest practitioner papercut (percussion player).
- BeatForge has **none of the performance affordances** (mute/solo/fill/song-mode/p-locks) of any drum machine since 1986 (drum-machine designer).
- The **word "kit"** is itself the cultural-respect mistake every prior review danced around without naming (ethnomusicologist).

**The persona-routing insight that resolves the divergences:**

The toy-maker, senior designer, and Claude all reach for *subtraction* (hide behind drawers). The drum-machine designer reaches for *re-allocation* (keep density, change *which* dense controls). The percussion player wants *neither* — Practice mode should fade into a steady presence. The ethnomusicologist wants *additions* (provenance, attribution, function fields) on top of subtraction.

These look like contradictions until you map them to surfaces:

| Surface | What it serves | Right prescription |
|---|---|---|
| `/play` (new — toy-maker) | First-30-seconds, kids, curious adults | **Subtract** until ≤10 elements visible. BeatDots-as-instrument. |
| `/studio` first paint | Curious explorer on second visit | **Subtract** the kit-design chrome. Hide save bars + master FX. |
| `/studio` once a maker expands a channel | Producer, sound designer | **Re-allocate** density toward performance — mute/solo/level/cutoff visible per channel. |
| Practice mode | Daily practitioner (founder) | **Don't redesign.** Tighten edges. Click-vs-groove, trainer recovery, focus mode. |
| Library | Curious explorer | **Add** provenance + studied-mode reading view. Become a museum that lets you play. |
| Pattern data + microcopy (cross-cutting) | All personas | **Stop calling ensembles "kits."** Provenance schema. Style guide. |

That's the architecture of the disagreements. Once you place each prescription against its right surface, every reviewer is right.

---

## What all six converge on (act on with extremely high confidence)

### C1 — Stop using "kit" for culturally-rooted percussion ensembles

The ethnomusicologist named this; nobody else did. **It's the single highest-leverage cultural-respect change in the product.** A "kit" implies *interchangeable parts*. Brazilian *bateria*, West African ensemble, Cuban *batá*, Turkish *takım* are *not* interchangeable parts — they're social structures with named roles.

**The change:** rename the concept. In English, *ensemble* is the closest universal term. Use the **tradition's own term where it has one**: bateria, takım, ensemble, batá. *Save kit* → *Save ensemble*. The synth machine "World" category should be organized **by ensemble role** (low-frequency / mid-frequency / high-frequency / bell-idiophone / shaker-scraper), not by Roland kit role (kick / snare / hat / tom).

Engineering: ~8 characters of UI copy + a few hours of regrouping. Identity impact: enormous.

### C2 — Subtraction sprint on Sound's first paint (with the drum-machine designer's caveat)

| Move | Reviewers |
|---|---|
| Kit + pattern save bars off first paint (drawer / `⋯` menu) | All 6 |
| Master FX bar (size/decay/wet/feedback) off first paint | All 6 |
| Spectrum analyzer hidden or shrunken | All 6 |
| Hide grouping permutation + text editor + sum-validator behind BeatDots tap | Claude · Senior · Toy-maker · Ethnomusicologist (drum-machine pushes back: keep permutation pills *visible* as a performance affordance) |
| Pick a default visualizer | Senior says linear. Drum-machine + percussion player say data-driven by tradition (linear for additive/Western, circular for cyclic/Indian/gamelan). **Resolution: data-driven default with always-visible toggle.** |

**Goal:** from ~80 first-paint elements to ≤30 (drum-machine's number, allowing performance density) or ≤15 (toy-maker's number, for the kid path). **The number depends on the surface.** `/play` aims for ≤10. `/studio` first paint for a curious explorer aims for ≤15. `/studio` after a maker expands a channel can re-densify to 50-60 with the right kind of controls.

### C3 — Voice palette restructure (the cultural unlock — extended)

The voice picker shouldn't lead with `kick / snare / hat / clap / tom / cowbell` (Roland-derived). All six lenses agree on this. The ethnomusicologist + drum-machine designer extend it:

- **Group 1 — World** (frame drum, dumbek, baglama, tabla, tonbak, daf, kalimba, agogo, surdo, kempul, log drum, claves). **Lead with this.** Organize *by ensemble role* (low-mid-high-bell-shaker), not alphabetically. Sonicware-quality character samples — frame drum with body resonance, not generic modal sine.
- **Group 2 — Drum machine** (kick, snare, hat, clap, tom, cowbell). Familiar territory; not erased; demoted from default.
- **Group 3 — Synthesis** (FM, modal, noise, wavefolder, formant, etc.). For sound designers. *Engines, not voices.*

The single biggest move toward the world-rhythm-native positioning. Engineering: ~1 week of preset work + UI regrouping.

### C4 — Practice mode is mostly right; tighten don't redesign

Every review respects Practice. The percussion player's review is the **most authoritative** here — it's the founder's actual daily use case.

| Improvement | Reviewers |
|---|---|
| **Click vs. Groove mode toggle** + dedicated click voice | Percussion player only — but it's the single biggest Practice change available |
| Trainer recovery: `[`/`]` step-back, `R` repeat-bar, descending ramp for cooldown | Percussion player only — no precedent in any hardware metronome |
| Practice-focus mode: huge BPM (25% vert), huge BeatDots (30% vert), bar counter prominent, everything else gesture-summoned | Percussion player |
| One-click "Resume yesterday's session" with trainer pre-staged | Senior · Toy-maker · Percussion player |
| Trainer setup as a sentence not 4 sliders | Claude · Senior |
| Pattern-list search box | Claude |
| Pre-anticipation visual swell at slow tempos (conductor's-baton breathing, not blinking) | Percussion player |
| Drop the three-view toggle in Practice (linear right for additive, circular for cyclic, auto-default by tradition) | Senior · Drum-machine · Percussion player |
| 60-min reliability test before any redesign | Senior · Percussion player |

### C5 — Cultural-thread-through (extended via ethnomusicologist)

- **Stop using "passport" framing** (ethnomusicologist). "Passport" is tourist language; cultures become destinations. **Replace with: "A library of the world's rhythms — heard, played, and credited."** *Credited* is the word doing the work.
- **Persistent caption under BeatDots in all modes** (senior, toy-maker, claude): "9/8 as 2+2+2+3 — Karşılama, Turkish Thrace." Tap → studied mode (full story).
- **Studied mode** (ethnomusicologist): one-tap focus reading view. Cultural story expands to 200 words. Where/When/Who-How three-line summary at top. Pull quote in display type. Optional 30-second source-audio clip. Pattern continues to play softly behind the reading.
- **Native-script names alongside transliteration** (ethnomusicologist): *Karşılama* with correct Turkish characters. Speaker icon for native-speaker pronunciation. Per-tradition visualizer overlays (bols under tabla dots).
- **Cultural-tradition ensemble defaults** (toy-maker, ethnomusicologist): Persian patterns load tonbak/daf, not 808.
- **Microcopy as a teacher's voice** (toy-maker, ethnomusicologist): "Hall echo" not "reverb wet"; "the cycle" not "step grid". A 1-page **style guide** governs voice, tone, length, and forbidden words ("exotic," "tribal," "primitive," "ethnic groove," "world flavor"). 1-day deliverable.

### C6 — Platform vision: shelve external, keep internal

All six lenses agree:
- ✅ **Do**: build the internal modules (events, audio-graph, router, sequencer, session). They make every other recommendation cheaper.
- ✅ **Do**: build `useSession()` — enables session-preserved tab switching as a *product feature*.
- ❌ **Don't**: ship `_Lab` as a public route, publish npm packages, describe BeatForge to users as "a rhythmic instrument with multiple lenses." That's correct internally; to a user it sounds like product-management abstraction.
- ❌ **Don't**: pursue this until external builders explicitly ask.

---

## NEW: The Living-Archive Reframe + Cousin-Finder Mechanic

The ethnomusicologist's framing — provenance discipline, tier-deferral, museum reverence — was anchoring this section until the founder pushed back: *"if we put something in a museum it means it's 99% dead already."* The recombinator lens (`docs/2026-04-27-living-archive-manifesto.md`, `docs/2026-04-27-living-archive-agent-review.md`) replaces it.

**Core principle**: a tradition is alive because it travels and recombines, not because it's preserved. The product's primary verb is *circulate*, not *preserve*. **Connection is generation.**

### What changes

- **Drop** the corpus tier system that retreats 100-200 patterns to "Wider Library" or excludes them. Instead: ship all 536 with **visible humility**.
- **Drop** the heavy provenance schema as a *gating* requirement. Keep a *plain-language source field* — when known, said warmly ("we learned this from a 1968 wedding recording made in Edirne; the dumbek player is Ahmet Tüzün"); when unknown, said honestly ("source unknown — if you know, write us"). Attribution as a love letter, not a bibliography.
- **Drop** the "studied mode" as a separate reverent reading view. Replace with **inline connection-stories** in Bourdain voice — 60-100 words, ending with a punch. The story is the play, not a separate ritual.
- **Add** the **humility-badge system** — replaces tier-deferral. Three glanceable marks per card:
  - **·** = *we know this one well* (founder, named collaborator, or documented source)
  - **·?** = *we believe but haven't verified* (story explains what we know)
  - **··?** = *this one's still finding its sources — help us*
  Tap → small modal: "Here's where we got this. Here's what we don't know. Here's how to help." A *Suggest a correction* button + an *I know this tradition* contributor flow. The "··?" patterns get an **invited** lane in the Library called *"Open questions"* or *"Looking for elders"* — not demoted, *invited*.
- **Add** the **cousins mechanic** — every pattern card carries 3-7 cousin-cards horizontally beneath the BeatDots strip. Cousins-by: rhythm structure, migration, function, instrument family, feel. Tap → audition inline (replaces current pattern smoothly, keeps BPM). Tap-and-hold → navigate. **The cousins panel is where the user accidentally spends 90 minutes.**
- **Add** the **trail breadcrumb** — top-of-screen breadcrumb that builds as the user follows cousins (*karşılama → rǔchenitsa → kalamatianos → kopanitsa*). After 5 hops a "Save this trail" button appears. Wikipedia rabbit-hole, but for rhythm.
- **Add** **Journey mode** — hand-curated 5-7 stop walks, each ending somewhere unexpected ("From a Senegalese gourd to a Detroit beat tape"; "The 9/8 walks home"; "The vertical spit"; "From Mali to the Mississippi delta"). **Each Journey is a piece of music writing that exists nowhere else.** Ship a new one monthly — Journey mode is BeatForge's killer publishing format, not just a feature.
- **Add** **"Lift me"** export per pattern (MIDI/WAV) — love letter to the producer / crate-digger audience. *A pattern that can leave is a pattern that lives.* Phasing: WAV first (Phase 1.5), MIDI with grouping markers second (Phase 2), MusicXML eventually.
- **Add** **Surprise-me as curated cousin-reveals**, not random. Every press lands on a pattern + shows the connection-card explaining why ("you played karşılama yesterday — meet its Bulgarian cousin"). The button is a teacher, not a dice roll.

### The aesthetic translation of "Angine de Poitrine energy"

AdP's masks/polka-dots are *theirs*. **No polka dots in the BeatForge UI.** The lesson is the principle — *complex underneath, magnetic on top, accessible despite/because of weirdness* — translated into BeatForge's existing visual language (warm cream, colored beat-dots, monospace, friendly playground).

Three concrete moves:
1. **BeatDots strip becomes the hero of every page.** 2x bigger on Library cards. Animate on hover — one full cycle preview at the pattern's actual BPM. The colored-dot rhythm-grammar is *the thing nobody else has*; show it loud.
2. **Library hover-preview as living polyrhythmic mosaic** — pattern cards in the Library preview-on-hover with a 2-second muted-but-animated BeatDots cycle at the pattern's BPM, grouping numbers (2+2+2+3) appearing as the cycle resolves. Twenty rhythms moving differently. Viral-by-screenshot.
3. **Native-script as display element**, not afterthought. *Karşılama* with diacritics, *दादरा*, *داف*, set large. A multilingual masthead is one of the most magnetic things a music product can have. Spotify won't do it. BeatForge can.

### Provenance still matters — just not as gatekeeping

Three lightweight schema fields stay, in service of the love-letter voice and the contribution flow:
- `source` (free text, plain-language, optional)
- `confidence` (one of: known / believed / open-question — drives the humility badge)
- `function` (ritual / wedding / dance / labor / court / popular / pedagogical / unknown — drives the *Where/When/Who-How* line on each card)

A `/sources` page exists, modeled on Folkways liner notes — but it's a *credit roll*, not a permission slip. Plain prose, not academic citation format.

The only patterns we don't ship at all are the ones explicitly restricted by their living tradition (Indigenous Australian songlines, consecrated bata, Native American powwow songs owned by specific families). We **name the absence** publicly — "we deliberately don't include these traditions, here's why" — rather than silently omit. Empty cases are honest curation; empty cases without explanation are erasure.

---

## Where the lenses diverge (and how the surfaces resolve them)

### D1 — Density: subtract or re-allocate?

**Toy-maker / senior designer / Claude**: subtract. Hide behind drawers. ≤15 elements at first paint.
**Drum-machine designer**: re-allocate. Density isn't the problem — wrong-kind-of-density is. Strip kit-design chrome (save bars, FX sliders, spectrum analyzer); use that real estate for *performance density* (mute/solo/level/cutoff per channel, fill button, song chain, tap-nudge BPM).

**Resolution by surface:**
- `/play` (toy-maker's territory): subtract aggressively. ≤10 elements.
- `/studio` first paint (curious-explorer arriving): subtract the kit-design chrome.
- `/studio` once a maker has expanded a channel (drum-machine territory): re-allocate. Visible density of *performance* controls is correct here. Channels stay open by default; what collapses is the per-channel FX/mix sub-disclosures.
- Practice mode (percussion-player territory): minimal first paint, gesture-summoned everything else. Different from both.

### D2 — Channels collapsed by default?

**Senior designer / toy-maker**: yes — collapsed.
**Drum-machine designer**: no — collapsed channels = settings page; expanded channels = instrument.

**Resolution**: data-driven by surface and persona.
- Practice: collapsed (the user is practicing, not designing).
- Studio default for first-time visitor: collapsed (avoid overwhelm).
- Studio for a returning user / saved-pattern context: expanded (the maker is here to make).
- Optionally: "Compact" / "Maker" view toggle, persisted. The user's choice last session is the default next session.

### D3 — Visualizer default

**Senior designer**: linear.
**Toy-maker**: BeatDots-as-grouping-UI is the hero (visualizer choice secondary).
**Drum-machine designer**: data-driven. Linear for additive/Western, circular for cyclic.
**Percussion player**: data-driven. Linear for Karsılama (gestural progression), circular for tabla (cycle-as-wheel).

**Resolution**: data-driven. Pattern's tradition tag determines default visualizer (cyclic → circular, additive → linear). Toggle stays always-visible. Pill view: deprecate from Practice, keep optionally in Studio for phrasing-aware editing.

### D4 — Brand line

**Toy-maker**: *"BeatForge — a passport for the rhythms of the world."* (Loved it.)
**Ethnomusicologist**: tourism-frame trap. Their replacement: *"a library of the world's rhythms — heard, played, and credited."*
**Living-archive (founder-aligned)**: *"credited"* is academic; the museum word leaks through. Lead with motion + connection.

**Resolution**: living-archive wins on the founder-direction grounds. Brand-line candidates, ordered by my (and the recombinator agent's) preference:

1. **"Every rhythm came from somewhere. Find out where it's going next."** — two sentences, both load-bearing. The first nods to provenance without making it homework. The second is the J Dilla / Vampire Weekend / Os Mutantes promise.
2. **"BeatForge — a living archive of the world's rhythms."** — plain, true, the word *living* does the entire job *credited* was trying to do.
3. **"Rhythms of the world, and the trails between them."** — captures the cousin-finder + movement.
4. **"Every rhythm has a cousin. Find them."** — six words; the discovery loop in one sentence.

Founder picks one. The toy-maker's *"playground for the rhythms of the world"* is an acceptable secondary line for the `/play` route specifically — *playground* is a place where children visit but don't claim ownership, which dodges the tourism trap.

### D5 — Trainer feedback at tempo bumps

**Toy-maker**: a "ding" — celebrate progress.
**Percussion player**: NO ding. Pulls a practitioner out of flow. A barely-audible click-pitch-shift on the bump (the next click is half a semitone higher in pitch for one cycle). *Integrated into the click, not a separate event.*

**Resolution**: percussion player wins for Practice mode. Toy-maker's ding is right for `/play` and `/jam` (kid celebration), wrong for daily practitioner.

### D6 — Adding features to Practice

**Drum-machine designer**: producer features (p-locks, song mode, fills) for Studio, NOT Practice.
**Percussion player**: practice-specific features (click vs groove, trainer recovery, focus mode) — entirely different list.
**Toy-maker**: Practice is "sacred" (don't touch much).

**Resolution**: route them. Percussion player owns Practice's enhancement list. Drum-machine designer owns Studio's enhancement list. They don't overlap.

### D7 — How much of the corpus to ship now

**Ethnomusicologist**: defer 100-200 patterns until properly sourced. Curate down, depth up.
**Everyone else**: didn't raise this question. The 536 patterns are baseline.

**Resolution**: ethnomusicologist's call should be honored. **The honest path: do the provenance audit on the existing 536 patterns. Patterns that can't be attributed retreat to a "Wider Library" (visible, lower-curation tag) or are temporarily withdrawn pending sourcing.** This is uncomfortable but irreversible-in-the-right-direction work. Treat it as a one-time corpus audit, not a feature; budget 5-10 days for it.

---

## The unified action plan — next 45 days, five phases

### Phase 0 (Week 1, days 1–5): "Stop and re-anchor"

**Goal**: don't ship new features. Land the cultural-identity foundation aligned with the **living-archive** lens.

| Day | Task | Reviewer |
|---|---|---|
| 1 | **Style guide doc** — voice (Bourdain meets the founder), tone (kitchen-table), forbidden words (extended list — see manifesto), words-to-use (cousin, lineage, walked, traveled, after [name]). 1-page. | Living-archive · Toy-maker |
| 1 | **"Stop using 'kit'" rename** — wherever copy says "kit" for a culturally-rooted ensemble, rename to *ensemble* (or the tradition's own term: bateria, takım, batá). | Ethnomusicologist · Living-archive |
| 2 | **Lightweight schema** — add three plain-language fields to pattern data: `source` (free text, optional), `confidence` (`known` / `believed` / `open-question`), `function` (one of the seven). No verification gating; no tier deferral. | Living-archive |
| 3 | **Humility-badge UI** — render the confidence mark on every pattern card. Tap → small "where we got this / what we don't know / how to help" modal with *Suggest a correction* + *I know this tradition* contributor affordances. | Living-archive |
| 4 | **`/sources` page** — credit-roll, not bibliography. Plain prose. "Sources, friends, kin who shared." Lists references, recordings, contributors with permission. | Living-archive (softened from ethnomusicologist) |
| 5 | **Plain-language source line** rendered per card where known: *"we learned this from a 1968 wedding recording made in Edirne. The dumbek player is Ahmet Tüzün."* When unknown: *"source unknown — if you know, write us."* No homework-feel. | Living-archive |

End-of-phase deliverables: cultural-identity foundation laid as a *living archive*, not a museum. Nothing tier-deferred. All 536 patterns still ship. Voice + naming + humility-marking + contribution flow are in place.

### Phase 1 (Week 2, days 6–12): Cousin connections + Journey mode foundation

**Goal**: build the **cousin-finder mechanic** that turns every pattern into a doorway. Not a corpus audit — a corpus *animation*.

| Day | Task |
|---|---|
| 6 | **Cousin schema** — add a `cousins` field per pattern: 3-7 related-pattern ids tagged by relation type (rhythm-structure, migration, function, instrument-family, feel). Backfill the cornerstone 50 patterns with hand-curated cousin links. Auto-suggest the rest by structural similarity for later refinement. |
| 7-8 | **Cousins-strip UI** — horizontal ribbon of cousin-cards beneath the BeatDots strip on every pattern. Each cousin card: tiny BeatDots preview animating at the cousin's BPM + tradition tag (🇹🇷 / 🇧🇬 / 🇬🇷 / etc.). Tap → audition inline (replaces current pattern smoothly, keeps BPM). Tap-and-hold → navigate. |
| 9 | **Trail breadcrumb** — top-of-screen breadcrumb of recent cousin hops. After 5 hops, *"Save this trail"* button appears → saves the path as a numbered Journey. |
| 10 | **Surprise-me as curated cousin-reveal** — replaces random with editor's-pick of unexpected bridges. Every press lands on a pattern + shows a connection-card ("you played karşılama yesterday — meet its Bulgarian cousin"). |
| 11-12 | **First three Journeys** — hand-write three cornerstone Journey arcs in Bourdain voice (5-7 stops each, ~150-250 words of connecting prose per Journey): *"The 9/8 walks home"* (Ottoman aksak family), *"From a Senegalese gourd to a Detroit beat tape"* (banjo's circle home), *"The vertical spit"* (Lebanese-Mexican migration / al pastor / cumbia sonidera). Ship Journey mode UI — index page + per-Journey reading view with patterns auditioning inline. |

End-of-phase: BeatForge has its **killer differentiating mechanic**. The cousin-finder turns the database into a story you can walk through. Journey mode becomes the monthly publishing format that makes BeatForge the "Atlas Obscura for rhythms."

### Phase 2 (Week 3, days 13–19): Practice-mode tightening (percussion player territory)

**Goal**: the daily practitioner experience becomes the best one any self-teaching world-instrument player has ever used.

| Day | Task | Reviewer |
|---|---|---|
| 13-14 | **Click vs Groove toggle + dedicated click voices** (woodblock, frame-drum slap, kalimba ping, conga slap, hand-clap). 3-state: Groove / Click+Sub / Click. "Loud click" option (+6dB). | Percussion player |
| 15 | **One-click "Resume yesterday's session"** — IDB persists last pattern + trainer config; first paint shows resume CTA. | Senior · Toy-maker · Percussion player |
| 16-17 | **Trainer recovery**: `[` / `]` step-back, `R` repeat-bar, descending ramp option. HUD text on each gesture. | Percussion player |
| 18 | **Practice-focus mode** (`F` key or `?focus` URL): huge BPM, huge BeatDots, gesture-summoned everything else. Music-stand-grade UI. | Percussion player |
| 19 | **60-min reliability test** — Chrome desktop + Android, Safari iOS. Fix any glitches/drift before phase 3. | Senior · Percussion player |

End-of-phase: Practice mode passes the four-foot test (readable from a music stand) and the 90-minute test (no glitches, trainer recovery works, click is audible at 40 BPM through baglama).

### Phase 3 (Week 4, days 20–26): Studio reset (subtraction + cultural cohesion)

**Goal**: Studio first paint goes from ~80 → ≤30 elements (drum-machine designer's number, accommodating performance density). Cultural identity threaded through.

| Day | Task | Reviewer |
|---|---|---|
| 20 | **Subtract first-paint chrome** — kit + pattern bars into 📁 drawer; master FX into ⚙️ drawer; spectrum analyzer hidden/tiny. | Senior · Toy-maker · Claude |
| 21 | **Voice palette restructure** — World / Drum machine / Synthesis. World category organized by ensemble role. | Senior · Toy-maker · Drum-machine · Ethnomusicologist |
| 22 | **Microcopy pass** — apply style guide. `Color FX odv/btc/flt` → `Clean / Warm / Crunch / Filter`. "Reverb wet" → "Hall echo". "Step grid" → "the cycle". | Toy-maker · Ethnomusicologist · Drum-machine |
| 23 | **BeatDots-as-grouping-UI** — tap a divider → cycles groupings inline. Permutation pills + text editor → tap-and-hold popover. The hero strip becomes the differentiator. | Senior · Toy-maker (drum-machine: keep permutation pills always visible — *re-route to keep them in popover but with high tap discoverability*) |
| 24 | **Persistent cultural caption** under BeatDots in all modes. Tap → studied mode. | Senior · Toy-maker · Claude · Ethnomusicologist |
| 25 | **Tradition-aware defaults** — tradition tag on pattern auto-loads ensemble + visualizer (Karşılama → linear + dumbek/daf; tabla teen taal → circular + tabla voices with bols). | Toy-maker · Ethnomusicologist · Drum-machine · Percussion player |
| 26 | Polish, ship. |

End-of-phase: Studio reads as a culturally-rooted instrument, not an engineer's playground.

### Phase 4 (Weeks 5–6, days 27–40): Joyful onramp + studied mode

**Goal**: open new doors for personas the current product doesn't serve well — kids, curious adults discovering rhythm cold.

| Days | Task | Reviewer |
|---|---|---|
| 27-29 | **Studied mode** — ⓘ Read pill on every pattern card. Long-form 200-word reading view, three-line Where/When/Who-How summary, pull quote, optional 30-sec source audio clip. Pattern plays softly behind reading. | Ethnomusicologist |
| 30-32 | **`/play` route** — full-screen BeatDots-as-instrument. Pattern auto-plays at low volume. Tap dot to fire. Drag divider to reorder. Swipe dot to cycle voice. 🎲 new rhythm, 🔊 volume. No menus. | Toy-maker |
| 33-36 | **Native-script names + bols overlay for cornerstone Hindustani patterns** — *Karşılama*, *दादरा*, *داف* with native script + speaker icon for pronunciation. Tabla bols under dots below 80 BPM. | Ethnomusicologist · Toy-maker |
| 37-39 | **`/discover` (rhythm planet)** — region grid (or world map if budget allows) with 30 curated cornerstone patterns. Click region → soft preview + cultural story card. "Play loud" → opens in `/play`. | Toy-maker |
| 40 | **New landing screen** — three big buttons (Play / Surprise / Explore) + huge BeatDots already audible softly + cultural caption. Returning users with activity skip onramp. | Toy-maker · Ethnomusicologist |

End-of-phase: BeatForge has visible doorways for personas 1 (curious explorer) and the kid sub-persona.

### Phase 5 (Week 7+, days 41+): Engine work + producer features (quietly)

**Goal**: the modular architecture lands as internal cleanup. Studio gets producer-grade performance features for the maker persona.

| Task | Reviewer |
|---|---|
| `_Lab` route + `modules/events/` (EventBus, hidden from prod) | Architecture plan |
| `modules/audio-graph/` — `AudioModule` interface + chain/parallel/tap | Architecture plan |
| Refactor colorFx to `ControllableModule` (first proof) | Architecture plan |
| `useSession()` hook | Architecture plan · Senior |
| Migrate Practice to consume `useSession` (no engine swap yet) | Architecture plan |
| **Mute / solo / fill performance bar** in Studio | Drum-machine designer |
| **Per-step parameter lock** (hold-step-and-turn-knob) | Drum-machine designer |
| **Pattern chain / song mode** (TR-8 depth — row of slots with repeat counts) | Drum-machine designer |
| MIDI in/out module | Drum-machine designer · Architecture plan |

This phase has no fixed end-date. It runs alongside Phase 4 when there's bandwidth and continues indefinitely.

---

## What's deferred (write down the "no" so it's a real no)

- ❌ **External platform framing.** No npm packages, "build your own rhythm app" tutorials, public `_Lab` route, marketing language about modularity.
- ❌ **Studio rename** until Practice migration + Studio subtraction sprint both land. Premature.
- ❌ **Per-step modulation UI** until phase 5 (drum-machine designer's p-lock work).
- ❌ **Pill view as a permanent visualizer option.** Drop or hide aggressively.
- ❌ **Spectrum analyzer prominence.** Tiny corner or off by default.
- ❌ **Sample import.** Future. Big. Defer.
- ❌ **Per-channel automation lanes.** Future. Big. Defer.
- ❌ **Yoruba bata, West African ensembles, Korean janggu, Indigenous Australian, Sufi ritual, Native American powwow, Mongolian shamanic** patterns — until partnered or excluded per Tier 3/4 policy.

---

## Anchor phrases to keep across all surfaces

These are the design-vocabulary anchors all six lenses converge on:

- **"BeatForge — a library of the world's rhythms. Heard, played, and credited."** Brand line. Replaces "passport." (Ethnomusicologist's edit; toy-maker's alternative *"A playground for the rhythms of the world"* is an acceptable secondary line for `/play`.)
- **"Tap a dot. Drag the dividers. Press Surprise."** The `/play` onboarding.
- **"Friendly default, deep engine."** Internal principle.
- **"You haven't sold a tool; you've sold a passage."** (Replacing the toy-maker's "passport" with something less tourist-y.)
- **"Subtraction is the work — except where it isn't."** Acknowledging the drum-machine designer: subtract from `/play` and from Studio's first paint, but re-allocate density once the user signals they want depth.
- **"A tradition is not a data file."** (Ethnomusicologist's principle, applied across the app.)
- **"The screen is not where your eyes are."** (Percussion player's principle, applied to Practice.)

---

## My single-thing recommendation

If I had to pick **one** action to take right now from all six reviews, it would be the ethnomusicologist's **Phase 0**: write the style guide, rename "kit" → "ensemble," add the provenance schema. **Three days. Zero engine work. Maximum identity-shift.**

Everything else in this synthesis is downstream of *that's actually a museum, not a marketplace*. If you do nothing else from this 45-day plan but Phase 0, BeatForge ships changed. The rest unfolds.

---

## How to use this synthesis

1. Read all six review docs end-to-end if you haven't.
2. Push back on anything in this synthesis that feels wrong — six smart strangers don't necessarily share your daily reality.
3. Pick the phases or specific tasks you want to commit to. Modify the day-by-day if priorities change.
4. **Most important** — the senior designer's "weekly first-paint count" discipline. Screenshot Sound's first paint at end of each week. Count interactive elements. The number monotonically decreases through Phases 1–3.
5. Ship Phase 0 first. Even without the rest, that's a complete, defensible product moment.
