# BeatForge — A Cultural-Curatorial Review

> **TL;DR** — Museum-curator / ethnomusicologist lens (lineage: Folkways, MIM, Horniman). Catches what no other lens does: "kit" is a cultural category mistake — traditions have *named ensemble roles*, not interchangeable parts. Provenance is mandatory. The corrective for "888 = kick" thinking.
> **Audience:** anyone working on cultural content + cultural representation. Important counterweight (read alongside `living-archive-agent.md` which is its corrective).
> **Length:** ~350 lines · ~6 min read.
> **Best for:** the kit-vs-ensemble naming argument, what curatorial provenance looks like in software, instrument-role hierarchy as first-class data.

**Reviewer**: Ethnomusicologist / museum curator / audio storyteller (lineage: Bruno Nettl, Steven Feld, Ali Jihad Racy, Ted Levin; MIM Phoenix, Smithsonian Folkways, the Horniman Music Gallery, the Vienna Phonogrammarchiv)
**Date**: 2026-04-27
**Subject**: BeatForge as a presenter of 536 culturally-tagged rhythms across 16+ regions
**Source**: Independent agent, fifth lens commissioned for the design review pass

---

## TL;DR

Right now BeatForge sits in the uncomfortable middle — closer to a **well-meaning marketplace** than to a museum. The 536 patterns are tagged but not *attributed*; the cultural stories are there but they're written in the voice of a single (excellent, but Turkish) founder narrating across 16 traditions; the engine flattens a tabla into a "modal preset" and a dumbek into "low tom"; and the entire UX literature you've already received frames the corpus as *content* (the senior designer says "voice palette restructure," the toy-maker says "passport," nobody yet says "where did these come from and who taught us"). What tips it toward museum: **provenance, voice, and discipline of restraint**. What keeps it a marketplace: a 536-row pattern table and no field for "transcribed by," "after a recording of," or "verified with." The good news — the founder is genuinely committed to the world-rhythm-native promise, the corpus is small enough to retro-attribute, and the curatorial fixes are *cheaper* than the engineering ones the other reviewers proposed. The next 30 days should add three columns to the pattern schema before adding a single new feature.

---

## Part 1 — The cultural-curatorial lens

### 1. Museum or marketplace?

Use a working definition. A **museum** says: *this object came from somewhere, made by someone, and means something — let me introduce you*. A **marketplace** says: *here are 536 of them, filterable by region, with a star button*. The first is honored context; the second is browseable inventory. Filters, chips, a star, a "Recently Played" rail, an instant-audition button on every card — these are *commerce affordances*. They serve the user's appetite, not the tradition's voice.

BeatForge today is closer to the marketplace end because:
- The Library page is a **filter-and-grid** experience — the same information architecture as Spotify, Bandcamp, or a sample pack store.
- Every pattern is *equivalent in weight* — Karsılama, a 400-year-old wedding rhythm from Turkish Thrace, sits in a card the same size as "Disco 4/4 #18."
- There is no attribution field. A pattern is just *data*.
- Patterns are designed to be **edited** (a museum object is rarely something you can repaint in three taps; a museum exhibit is a *handled* artifact).
- The tone is friendly, not reverent.

What pushes it firmly toward museum:
- **Provenance metadata that is visible, not hidden.** Every pattern card should show "after Ahmet Tüzün, Trakya, 1968 — transcription verified by [name/source]" with the same visual weight as the BPM.
- **Hierarchy of weight.** Some traditions get a pinned, longer treatment (a 400-word story, a photo, a name in the source language). Others get a card. The flat 536-row equivalence is the marketplace tell. *MIM Phoenix doesn't put every drum in the same vitrine.*
- **Curatorial captions in a recognizable curator's voice.** Not the friendly toy-maker voice — the *I-have-been-to-this-place-and-met-this-player* voice.
- **Restraint about what's included.** A museum's strongest move is what it *doesn't* show. The current corpus is "everything we have research on" — that's a research database, not a curated collection.
- **A "made by humans" backstage.** Crediting the people whose work made each pattern's transcription possible. Even a "Sources" page modeled on Smithsonian Folkways' liner notes would change the product's character overnight.

The honest answer: *BeatForge is a marketplace shaped like a friendly toy.* It can become a museum that lets you play. The shape change is mostly metadata, language, and where you spend hierarchy.

### 2. Provenance audit — what should accompany each pattern

The brief is silent on where the 536 patterns come from. That silence is the single largest cultural-respect risk in the product. Whatever the actual sources are, **they aren't visible to the user**, which means a user has no way to evaluate authority, and the founder has no way to honor the people whose work made the corpus possible.

The ethical bar for citing cultural rhythms in a product like this — borrowing from Smithsonian Folkways' liner-note tradition and the Society for Ethnomusicology's Position Statement on Ethics — is roughly:

**Per-pattern minimum (MUST):**
- **Source type**: one of `transcribed-from-recording` / `transcribed-from-published-source` / `transcribed-from-tradition-bearer` / `composer-original` / `derived-from-published-transcription` / `community-contributed` / `unknown`.
- **Source attribution**: a citation. If from a recording: "after Ali Akbar Khan, *The Soul of Indian Music*, 1968." If from a book: "transcribed from Mark Hijleh, *Towards a Global Music Theory*, p.214." If from a teacher: "as taught by [name, with permission]." If unknown: **say so visibly** — "source uncertain; please contribute a correction."
- **Verification status**: `verified-by-tradition-bearer` / `verified-by-academic-source` / `unverified` / `community-flagged`. *This is the single most important field.*
- **Year and place** if known — not "Turkey" but "Edirne, Thrace, 1968 recording."
- **Function**: ritual / wedding / dance / labor / court / popular / pedagogical / unknown.

**Per-pattern aspirational (SHOULD):**
- A photograph (CC-licensed) of the instrument or context, even small.
- A 5–10 second audio clip of the *original* tradition (not your synth) so a user can hear the gap between the synthesized version and the human source. *Crediting the recording.*
- A "tradition-bearer says" pull quote — even one sentence from a respected practitioner, with permission and credit.
- A "see also" link to a recommended recording or book. This is the *single most generous* curatorial move you can make: pointing users away from your synth to the real thing.

**Per-corpus (MUST):**
- A public **Sources** page modeled on Folkways liner notes. Lists every text, every recording, every consultant, every contributor by name with permission status. *If a contributor wishes to remain anonymous, that's noted too.*
- A **Methodology** page: how was the corpus compiled, by whom, with what method, with what known gaps?
- A **Corrections** mechanism: a visible button on every pattern reading "contribute a correction or context."

The honest test: would you be comfortable showing the current Library page to **the family of the player whose recording you transcribed** without being able to say "this is your father's playing, attributed, and we asked permission." If not, you have a provenance debt to retire before adding features.

This is also the **engineering-cheapest** cultural intervention available. Three new schema fields and a sources page changes BeatForge's character more than any UI redesign in the synthesis doc.

### 3. The founder is Turkish — policy for traditions outside one's own

Of the four options the brief offers — (a) cite a credible secondary source; (b) collaborate with a tradition-bearer; (c) explicitly mark "research, not lived tradition"; (d) other — the right policy is **all three, mapped to a tier system, with a fourth tier of "deferred"**:

**Tier 1 — Founder authority (lived tradition + scholarship).**
Turkish, Anatolian, Balkan/Thracian, broader SWANA. Cem can speak with the voice of the tradition. Authority is *embodied*. He can curate, narrate, and edit with confidence. **About 80–120 patterns of the 536, generously counted.**

**Tier 2 — Founder + secondary source (researched, not lived).**
Persian, Indian classical, Brazilian, Andalusian. Founder has cultural proximity but is not a tradition-bearer. **Policy**: every pattern in Tier 2 must cite a credible published source *by name on the card*, and the language must shift from "this is" to "this is documented as" or "according to [source]." *Use the curator's voice, not the tradition-bearer's voice.*

**Tier 3 — Researched but should not ship without collaboration.**
Yoruba bata, Korean janggu, Indigenous Australian rhythms, Vietnamese ca trù patterns, Native American powwow rhythms, Mongolian shamanic patterns, Sufi ritual patterns. **Policy**: deferred until a tradition-bearer collaboration is in place. Either:
  - (i) actively collaborate (find a partner, credit them, share whatever modest revenue/attribution exists), or
  - (ii) **don't ship**. A blank space honored is better than a misrepresented presence.

**Tier 4 — Restricted/sacred (do not include at all).**

The honest cut: of 536 patterns, **probably 100–200 should be temporarily withdrawn pending Tier-2 sourcing or Tier-3 collaboration**. The corpus is too big for the curatorial bench you have. The Folkways model — slow, named, attributed — beats the Spotify model — vast, unattributed, frictionless — for this product's positioning.

### 4. Naming, pronunciation, attribution

This is where the marketplace tells the most. A few specifics:

**Native script alongside transliteration.** "Karsılama" should appear as **Karşılama** with the correct Turkish characters (ş, ı). The same for *داف* / daf, *दादरा* / dādrā. **Get this right or don't ship it.** A misspelled name in a "world-rhythm-native" product is a credibility-killer for any user who recognizes the language.

**Romanization standard, named.** Pick one transliteration scheme per language family and *say so*: "Indian terms transliterated using IAST." "Arabic terms transliterated using ALA-LC." This is the small move that signals scholarly seriousness.

**Tabla bols** (the spoken syllables — dha, dhin, na, tin, tu, ta, ke, te, ga) should appear as labels under their respective dots when a tabla pattern is loaded. *No other rhythm app on Earth does this.*

**Frame drum disambiguation is non-negotiable.** Bendir, daf, riqq, kanjira, tar (which itself is a multi-cultural confusion — North African vs. Iranian tar are completely different instruments), pandeiro, mazhar — naming "frame drum" generically is curatorial laziness.

**Audio pronunciations.** Yes, but small. A speaker icon next to each non-English term, playing a 1-second native-speaker pronunciation. The Forvo model.

**Glossary**, single page, per region. Three columns: native script, transliteration, brief meaning.

### 5. Function — the missing dimension

The other reviewers all dance around this without naming it. **The single most important field on a pattern card is what the rhythm is *for*.**

Compare:
- "Karsılama — 9/8 — Turkey" *(marketplace)*
- "Karşılama — wedding-dance from Turkish Thrace, 9 beats walked as 2+2+2+3 — three steps and a leap. Played on dumbek (goblet drum) and zurna (double-reed shawm) at weddings, often during the bride's procession. The dancers face each other and 'meet' (karşılamak = to meet/face) at the leap." *(museum)*

How to surface function without becoming a textbook:
- **Three fixed sub-fields per pattern**: *Where* (place + setting), *When* (occasion/function), *Who/How* (instrument + body). Three short lines. Total: 30–50 words.
- **A 30-second "in context" audio or video clip**, optional, when sourceable. *MIM Phoenix's exhibits are 80% instrument + photo + 30-second video of it being played*.
- **A "body cue" line**: "three steps and a leap" / "left hand strikes the rim, right hand the head" / "the kanjira hand spins to bend the pitch." Tradition-bearers teach with body language; cards should hint at it.

### 6. Living tradition vs. canonical recording

Yes — teach variation. But carefully. The two failure modes:

- **False canonization**: shipping one Karşılama, the user concludes "Karşılama = these 18 dots."
- **Misinformation drift**: invite users to contribute their own family's version → without verification, the corpus pollutes.

The right shape:
- **Ship a canonical version** clearly marked **"version 1: as transcribed from [source]."** Not "the" Karşılama. *A* Karşılama.
- **Ship 2–4 known variants** for cornerstone patterns, each labeled with origin.
- **Allow user-contributed variants** in a *separate* visual lane — `Community variants` — clearly tagged unverified, easy to flag for review. Not in the same list as the curated patterns.
- **A "What I learned from" field** on community contributions: the contributor names *their teacher or source*.

### 6½. Variation as a feature for kids

The **drag-the-grouping** interaction (toy-maker's Bret Victor moment) is *also* the variation-discovery moment. When a 9-year-old drags 2+2+2+3 to 3+2+2+2, they have *invented an aksak variant that exists in real Turkish tradition*. The right curatorial response is not "you broke it" but a tiny caption appearing: "you've discovered an aksak feel — this exact grouping is heard in [region]." The interaction *teaches that the tradition is alive and you are now a small part of it*.

### 7. Sacred / ritual sensitivity

**Hard rule: some patterns should not ship at all. Period.**

Categories to deliberately exclude or treat with restriction:

- **Indigenous Australian songline rhythms**. Default to **exclude**.
- **Sufi zikr and mevlevi ritual rhythms**. **Exclude or label with explicit ritual context**.
- **Native American powwow drum patterns**. **Exclude unless collaborating** with the tradition.
- **Yoruba bata-aña (consecrated drums)**. **Exclude consecrated patterns; include performance bata only with attribution and collaboration.**
- **Mongolian shamanic drum patterns** for trance work. **Exclude.**
- **Some Korean shamanic kut rhythms.** Treat as Tier 3.

Maintain a "deliberately not included" list that lives publicly on the methodology page. *Naming the absences is curatorial work.* It signals that the corpus is curated, not scraped.

A flag-able category for borderline cases: **"context-required"** — a pattern that ships but with a mandatory story-modal-on-first-play that explains the function before the user can interact with it. Not friction for friction's sake — friction *as respect*.

### 8. Museum vs. classroom mode

Yes, separate them — but as **a single pattern with two modes of attention**, not as two products.

The Smithsonian Folkways analogue is exact: one *recording* + a separate *liner notes booklet*. Both are the same product, but you reach for them at different moments.

In BeatForge UX terms:
- **Default mode for any pattern**: *play* surface. Hit space, hear it, tap dots.
- **Studied mode** (a single visible affordance per pattern card — say, a small "ⓘ Read about this" pill): swaps the panel into a long-form, no-controls, beautifully-typeset *reading view*. The cultural story expands. Photos appear. The 30-second context clip becomes prominent. The pattern still plays softly in the background.

This is **not a separate page**. It's a focus mode within the same page. *The pattern is the same; your attention is what changes.*

A subtle but important detail: **the studied mode is where you put restrictions.** A context-required pattern (§7) opens in studied mode by default the first time it's loaded. The user reads, *then* plays.

### 9. Storytelling craft

The brief says "cultural stories are part of the product." The synthesis says "persistent caption under BeatDots." Neither has named *whose voice* the stories are in.

This is the single most important question in the cultural identity of BeatForge.

**Voice options, with verdicts:**

- **The friendly toy-maker voice** ("a wedding rhythm from Turkey"). Charming. *Not sufficient.* Works for **landing/onboarding** but does not work as the **default story voice for 536 traditions**. Will sound like Disneyland.
- **The scholarly voice** (Bruno Nettl, Ali Jihad Racy). Authoritative. *Wrong tone for this audience.*
- **The tradition-bearer voice** (a quote from a player, in their own words). *The strongest move available.* When a pattern has even one direct sentence from a named practitioner — "in my grandmother's village we played this at every wedding for three days, and on the third day my uncle would always cry" — the pattern stops being data and becomes *someone's life*.
- **The Radiolab/audio-storytelling voice** — earned punchlines, layered voices, withheld information. *The aspirational long-form treatment for cornerstone patterns* — narrated 30-second voiceovers for the 30 most important patterns in the corpus.

**The right vocabulary for BeatForge stories**, layered:

1. **The card** (always visible): one-line teaser. Toy-maker voice. *"Wedding music from Turkish Thrace. Three steps and a leap."* Warm, light, kid-readable.
2. **The studied mode** (one tap): a 150–250 word piece in the *curator's voice* — informed, specific, naming sources, naming places. **Names the writer of this particular story** — the curator's name appears at the bottom, like a museum placard.
3. **The pull quote** (when available): one line from a named tradition-bearer.
4. **The 30-second audio context** (when available): a recording of the *real* tradition, credited.
5. **The narrated piece** (cornerstone patterns only, ~30 of them): a 30–60 second produced narration. Real audio production. Music-anthropology podcast aesthetic.

Pragmatic immediate move: a **style guide** — one page. Voice, tone register, rules, length, forbidden words ("exotic," "tribal," "primitive," "ethnic groove," "world flavor"). This is a 1-day deliverable and **changes everything downstream**.

### 10. The "passport" framing — a curator's verdict

The toy-maker proposed: *"BeatForge — a passport for the rhythms of the world."*

Beautiful line. **And dangerous.**

What's right: motion (you go somewhere), discovery, personal record. All real and good.

What's wrong: a passport is a **traveler's document**. The traveler is the user; the cultures are *destinations*. This is the **tourism frame**. *MIM Phoenix avoids this language.* So does Folkways. *World-rhythm-native positioning puts the **tradition** at the center.*

**Honest alternatives that keep the warmth:**

- **"A library of rhythms — listened to, played, attributed."**
- **"A field guide to the world's rhythms."**
- **"Rhythms of the world, played and credited."** (The strongest. Explicitly names attribution as part of the brand promise. Hard to live up to — *which is the point*.)
- **"A playground for the rhythms of the world."** (Toy-maker's first option — better than passport because *playground* is a place where children visit but don't claim ownership. Acceptable.)

My recommendation: **drop "passport." Use "a library of the world's rhythms — heard, played, and credited."** Library is the curator's frame. *Credited* is the word that does all the work.

---

## Part 2 — Curation strategy for year one

If BeatForge's ambition is to be the **MIM Phoenix of rhythm apps** (not the Spotify of beats), here's the curation strategy.

### Six traditions to feature first

**1. Turkish & Anatolian (founder's home).** ~25 patterns, deeply curated, voiced in the first person where appropriate. *Karşılama, Aksak, Sofyan, Devr-i Hindi, the broader usul system*. **The founder is the curator and the tradition-bearer.**

**2. Balkan & Thracian (founder's adjacent home).** ~15 patterns. *Bulgarian aksak (rǔchenitsa, paidushko, kopanitsa), Greek 7/8, Romanian dance.* Use as a study in *cousins*: how does the same 7/8 family branch across borders?

**3. Persian/Iranian.** ~12 patterns. *The radif system's rhythmic side, daf and tonbak playing, the 6/8 reng family.* Tier 2 — researched, with named sources. **Educational unique**: the relationship between rhythmic mode and melodic mode (radif).

**4. Indian classical (Hindustani initially, Carnatic later).** ~15 patterns. Tier 2 — must cite a Hindustani percussion source by name and the bols must appear under the dots. **Educational unique**: bols as embodied notation.

**5. Brazilian (Afro-Brazilian core).** ~12 patterns. *Samba partido alto, baião, frevo, maracatu, capoeira's timing.* Tier 2 — should graduate to Tier 1 via collaboration.

**6. West African (Mali / Senegal / Ghana, ensemble traditions).** ~12 patterns. **Tier 3 — defer until partnered.** Of these six, this is the one I'd ship *latest*, despite its centrality. *Empty-case curation* in the Pitt Rivers sense.

These six get the **deepest** curation. **Everything else in the current 536 retreats** to "regional context" tier.

### Traditions to deliberately defer

- **All Sub-Saharan African traditions outside the West African collaboration**. Tier 3.
- **All Indigenous traditions worldwide**. Tier 3 minimum, often Tier 4.
- **Korean and Vietnamese traditional rhythms** beyond well-published material. Tier 3.
- **All sacred/ritual rhythms across traditions** until §7 policy is applied.
- **Anything labeled "tribal," "ethnic," or with no clearer attribution than a country.**

### Collaborations that unlock entire regions

Each of these is a single relationship that opens 20–40 patterns of curated, attributed, collaborator-credited material:

- **Brazilian percussion**: ~30 patterns
- **Indian classical (Hindustani)**: ~25 patterns
- **Persian/Iranian**: ~20 patterns
- **West African**: ~30 patterns
- **Cuban/Afro-Cuban**: ~30 patterns
- **Gamelan (Javanese / Balinese)**: ~25 patterns

**Six relationships, ~160 deeply-curated patterns**, each batch carrying the collaborator's name on every card. Combined with founder's ~40 patterns: **~200 patterns at museum-grade**. The remaining 336 of the current corpus retreat to "regional context" or get cut.

The lesson: **shrink the corpus and grow the depth.**

### "First 50 patterns" — the cornerstone curation

Cornerstone 50 for v1:
- **Turkish/Anatolian (8)**: Karşılama, Aksak, Sofyan, Devr-i Hindi, Curcuna, Düyek, a zeybek, a halay.
- **Balkan (5)**: Rǔchenitsa, Paidushko, Kopanitsa, kalamatianos, sîrba.
- **Persian (5)**: 6/8 reng, daf zikr-adjacent, tonbak chahār-mezrāb, Kurdish 10/8, a Bandari pattern.
- **Indian (8)**: tīntāl, jhaptāl, rūpak, dādrā, kaherwā, ektāl, regional folk tāla, one Carnatic ādi tālam.
- **Brazilian (5)**: samba partido alto, baião, maracatu nação, frevo, capoeira ginga timing.
- **Afro-Cuban (5)**: son clave 3-2, son clave 2-3, rumba guaguancó, bembé 6/8, conga de comparsa.
- **West African (5)**: kuku, soli, Ewe agbekor bell, sabar baar mbaye, performance bata *only with collaboration*.
- **Gamelan (4)**: Javanese lancaran, Javanese ladrang, Balinese kotekan, Balinese gilak.
- **Electronic/contemporary (5)**: Detroit techno, dub reggae, hip-hop boom-bap, drum'n'bass, footwork.

The product structure becomes: **Featured Library** (the 50, deeply curated) + **Wider Library** (the rest, browsable but tagged with curation level).

---

## Part 3 — Three concrete features for a 2-week budget

### Feature 1: Provenance schema + Sources page

**The feature**: three new fields on every pattern (`source`, `verification`, `function`) + a public `/sources` page. Every pattern card displays its source on the card.

**The cultural-respect principle**: **Attribution is the floor, not the ceiling.**

**The user-experience moment**: A 9-year-old tapping Karşılama sees, beneath the BPM, "after Ahmet Tüzün, recorded Edirne 1968." They don't know Tüzün. But they learn that *rhythms come from people who lived in places at times*.

**Reference**: Smithsonian Folkways' liner notes — every recording credits the field collector, the consultants, the place, the date.

**Two-week budget cost**: ~8 days.

### Feature 2: Studied mode — the focus reading view

**The feature**: a single affordance on every pattern card (a "ⓘ Read" pill) that swaps the page into a long-form, beautifully-typeset reading view. Cultural story expands to 200 words. Where/When/Who-How fields formatted as a tight three-line summary at the top. A pull quote in display type. A small "🔊 listen to the source" plays a 30-second context recording.

**The cultural-respect principle**: **Context belongs to the artifact, not to the user's curiosity.**

**The user-experience moment**: A curious adult, mid-explore, taps "Read" on a Persian tonbak pattern. The page transforms. They read a sentence from Hossein Tehrani about how he was taught. They tap "🔊 listen" and hear 30 seconds of Tehrani himself. *They are listening to two versions of the same lineage at once.*

**Reference**: Tate Modern's audio guide design. Smithsonian Folkways' booklet-with-recording model.

**Two-week budget cost**: ~4 days for engineering. Story content expansion is parallelizable.

### Feature 3: Native names + cultural visualizer for cornerstone traditions

**The feature**: Two paired moves. (a) **Native-script names** on every pattern card. With a small speaker icon for native-speaker pronunciation. (b) **A tradition-specific visualizer overlay**: bols under the dots for Indian classical patterns; aksak grouping numbers for Turkish; cycle-mark notation for gamelan.

**The cultural-respect principle**: **A tradition's notation is part of its instrument.**

**The user-experience moment**: A curious tabla student loads *jhaptāl*. They see the dots. *And underneath each dot, a bol*: dhi-na, dhi-dhi-na, ti-na, dhi-dhi-na. They can *say it as they play it*. **No other app does this for tabla.**

**Reference**: Ravi Shankar's pedagogical recordings. Ted Levin's Aga Khan Music Initiative.

**Two-week budget cost**: ~4 days.

**Total: 16 days. Two-week sprint, three load-bearing features, zero engineering on the audio engine, zero new tabs in the nav.**

---

## Part 4 — One thing to STOP doing immediately

**Stop using the word "kit" to describe culturally-rooted percussion ensembles.**

This is the single specific cultural-respect mistake the current product makes most consistently, and it appears in every prior review without anyone naming it.

A "kit" is a Roland-derived term. When BeatForge says "save kit" and offers presets called "808 kit," "Persian kit," "Brazilian kit" — the *Persian kit* is a category error. Iranian percussion isn't a kit; it's a **family of instruments with their own names, roles, and combinations**.

The same is true of:
- **Brazilian *bateria*** — has specific roles: surdo, caixa, repinique, tamborim, agogô, cuíca, ganzá. Not a "kit" — a *bateria*.
- **West African drum ensemble** — djembe + dununba + sangban + kenkeni + bell. Each role has a name.
- **Turkish *takım***
- **Cuban *batá ensemble***

**Why this is a cultural-respect mistake** (not just a naming nit): the *kit* metaphor implies *interchangeable parts*. **Ensemble traditions are not interchangeable parts.** A *bateria* is a social structure. A West African ensemble is a polyrhythmic conversation between named roles. Calling them kits flattens that into "set of presets."

**The correction**: rename the concept. In English, *ensemble* is the closest universal term. Better still, use the **tradition's own term where it has one**: bateria, takım, ensemble, group.

A second-tier mistake: **the synth machine names** (kick / snare / hat etc.) are a Roland-vocabulary primary index. The cultural fix is deeper than "World / Drum machine / Synthesis": the World category should be organized **by ensemble role**, not by individual voice. *Low-frequency members* (surdo, dununba, kick); *mid-frequency members* (tonbak, djembe, tabla bāyāñ, snare); *high-frequency members* (frame drum, tabla dāyāñ, hat); *bell/idiophone members* (agogô, bell, cowbell); *shaker/scraper members*. This is how percussionists already think.

---

## If I curated the entry exhibit

You walk in. The first thing you see is not a metronome. Not a play button. Not a list of patterns. **You see a single pattern playing softly, presented as a small exhibit.** Centered on the page: large native-script name (*Karşılama*) above the transliteration; below it, a 12-word caption (*"Wedding rhythm of Turkish Thrace. Three steps and a leap. Played for 400 years."*) — the curator's voice, warm but specific. A photograph (small, square, sepia-warm — a black-and-white image of two musicians and dancers at a 1960s village wedding). The BeatDots strip pulses gently underneath, already audible at low volume — the tradition is *playing for you* without asking. Below the dots, three small text lines: *Where: Edirne, Turkish Thrace. When: weddings, processions. Who: dumbek + zurna, the dancers face each other.* No menu. No transport bar. No save button. **Just one rhythm, fully present**, with three modest doorways in the bottom corners — *Listen* (continue with this one, maybe deeper), *Wander* (a curated path through 8 cornerstone traditions, one at a time), *Practice & Make* (the doorway to the working tools, for those who came to play). At the very bottom, in a small footer: *"From a corpus of 536 rhythms. Each one credited where we know its source."* That sentence — that promise — is the whole product in 14 words. The visitor knows immediately: this is not a marketplace of beats. **It is a place where rhythms come from people, and the people are remembered.**

---

**External references invoked (for the founder to follow up):**
- Smithsonian Folkways Recordings — liner notes model
- Society for Ethnomusicology Position Statement on Ethics
- AIATSIS Code of Ethics for Aboriginal and Torres Strait Islander Research
- MIM Phoenix — exhibit format (instrument + photo + 30-second video)
- Tate Modern — audio guide design
- Aga Khan Music Initiative (Ted Levin)
- Pitt Rivers Museum — empty-case curation
- Berklee World Strings, Cuban National Folkloric Ensemble — pedagogy with native terminology
- Steven Feld — *Music Grooves* (with Charles Keil)
- Mickey Hart — *Planet Drum*, *Spirit Into Sound*
