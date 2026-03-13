# BeatForge

A browser-based rhythm playground that starts as a metronome and evolves into a drum machine. Two modes share one audio engine: **Practice** for daily musician use, **Studio** for beat creation. A **Library** lets users explore 650+ world rhythms with their cultural stories.

Works offline. No install. No signup. No backend. Open source.

---

## What's in this repo

This is the research and design foundation for BeatForge — 55,000+ lines of musicology, technical references, drum patterns, and product design. The app itself hasn't been built yet; this corpus is what informs it.

### Product design

| File | What it covers |
|------|---------------|
| [`docs/product-design.md`](docs/2026-03-12-beatforge-product-design.md) | Full product spec — architecture, modes, UI layouts, phasing, design system |

### Research indexes

Start here to navigate the corpus:

| File | What it covers |
|------|---------------|
| [`research/INDEX.md`](research/INDEX.md) | Master catalog of all 50+ documents with line counts and summaries |
| [`research/TOPIC-INDEX.md`](research/TOPIC-INDEX.md) | Concept-to-file cross-reference (Web Audio, clave, tabla, Amapiano, etc.) |
| [`research/PATTERN-INDEX.md`](research/PATTERN-INDEX.md) | Every notated pattern searchable by region, genre, time signature, difficulty |

### Patterns (650+ notated rhythms)

All playable patterns live in [`research/patterns/`](research/patterns/):

#### Original library
| File | Patterns | Coverage |
|------|----------|----------|
| [`western-genres.md`](research/patterns/western-genres.md) | 211 | Rock, pop, funk, jazz, hip-hop, house, techno, DnB, Afrobeats, Amapiano, reggaeton, breakbeats, fills, rudiments |
| [`turkish-arabic-indian.md`](research/patterns/turkish-arabic-indian.md) | ~70 | Turkish usul (Duyek, Karsilama, Zeybek, Horon...), Arabic iqa'at (Maqsoum, Baladi, Saidi...), Indian tala (Tintal, Dadra, Rupak...) |
| [`african-ensembles.md`](research/patterns/african-ensembles.md) | ~30+ | Ewe (Agbekor, Gahu, Kpanlogo), Mande/djembe (Kuku, Soli, Dununba), Yoruba (Bata, Dundun) — full multi-drum ensemble notation |
| [`world-cross-cultural.md`](research/patterns/world-cross-cultural.md) | 50+ | West African bell patterns, Afro-Cuban clave/cascara/bembe, salsa ensembles, cross-rhythms |
| [`gamelan-southeast-asian.md`](research/patterns/gamelan-southeast-asian.md) | 20+ | Javanese gamelan colotomic structures (lancaran through gendhing), Balinese kotekan interlocking |
| [`supplementary.txt`](research/patterns/supplementary.txt) | — | Additional pattern data in text format |

#### Expanded global coverage
| File | Patterns | Coverage |
|------|----------|----------|
| [`latin-caribbean.md`](research/patterns/latin-caribbean.md) | ~43 | Cuban (mambo, cha-cha-chá, guaguancó, timba, comparsa), Puerto Rican (bomba, plena), Dominican (merengue, bachata), Colombian (vallenato, champeta, currulao), Mexican (son jarocho, huapango, norteño), Haitian (kompa, rara, vodou), Trinidadian (calypso, soca), Brazilian (pagode, samba-reggae, forró) |
| [`iberian-flamenco.md`](research/patterns/iberian-flamenco.md) | ~18 | Flamenco (bulería, soleá, seguiriya, tangos, rumba, alegrías, fandango), Portuguese (fado, corridinho), Basque (zortziko, txalaparta) |
| [`north-east-african.md`](research/patterns/north-east-african.md) | ~20 | Gnawa (Morocco), Algerian raï, Ethiopian (eskista, tizita, kebero), Somali dhaanto, Swahili taarab, Sufi dhikr |
| [`modern-african.md`](research/patterns/modern-african.md) | ~25 | Soukous, highlife, jùjú, fuji, mbalax, makossa, bikutsi, kwaito, gqom, shangaan electro, benga, kuduro, semba, kizomba, singeli |
| [`celtic-european.md`](research/patterns/celtic-european.md) | ~20 | Irish bodhrán (reel, jig, slip jig), Scottish strathspey, Scandinavian polska, Romani čoček, klezmer (freylekhs, bulgar, hora), Hungarian csárdás, gypsy jazz |
| [`central-asian-pacific.md`](research/patterns/central-asian-pacific.md) | ~24 | Uzbek doira, Uyghur muqam, Afghan attan, Polynesian slit drum, Maori haka, Hawaiian pahu, Aboriginal clapsticks/didgeridoo, powwow drum |
| [`south-asian-expanded.md`](research/patterns/south-asian-expanded.md) | ~35 | Expanded Indian talas (deepchandi, dhamar, addha), bhangra dhol, Carnatic gati/konnakol, qawwali, Sri Lankan, Nepali, Bangladeshi, Thai piphat, Filipino kulintang |
| [`caucasus-mediterranean.md`](research/patterns/caucasus-mediterranean.md) | ~15 | Georgian (khorumi, acharuli), Armenian (kochari, yarkhushta), Azerbaijani, lezginka, Cretan (syrtos, pentozali), Sicilian tamburello, Indo-Caribbean chutney, Sufi dhikr |
| [`global-traditions.md`](research/patterns/global-traditions.md) | ~42 | Broad coverage across all regions (some overlap with specialized files) |

#### Electronic & internet-born
| File | Patterns | Coverage |
|------|----------|----------|
| [`global-electronic.md`](research/patterns/global-electronic.md) | ~35 | Budots, funkot, vinahouse, manyao, tribal guarachero, baile funk, UK drill, Jersey club, footwork/juke, gabber, hardstyle, ballroom/vogue, moombahton |
| [`underground-electronic.md`](research/patterns/underground-electronic.md) | ~30 | Mahraganat (Egypt), electronic dabke, desi bass, Shanghai bass, guaracha, Russian hardbass, Romanian minimal, disco polo, turbofolk, afro-house, zouk bass |
| [`internet-born.md`](research/patterns/internet-born.md) | ~24 | Vaporwave, future funk, lo-fi hip-hop, nightcore, hyperpop, drift phonk, Brazilian phonk, SoundCloud rap, bedroom pop, footwork, mashcore |

### Technical references

Implementation guides in [`research/technical/`](research/technical/):

| File | Lines | What it covers |
|------|-------|---------------|
| [`web-audio-dsp-reference.md`](research/technical/web-audio-dsp-reference.md) | 2,577 | Web Audio API, DSP fundamentals, synthesis recipes (808 kick, 909 snare, FM, Karplus-Strong) |
| [`WEB_AUDIO_REFERENCE.md`](research/technical/WEB_AUDIO_REFERENCE.md) | 2,604 | Tone.js deep dive, WAM 2.0 plugin architecture |
| [`MIDI_TECHNICAL_REFERENCE.md`](research/technical/MIDI_TECHNICAL_REFERENCE.md) | 2,296 | MIDI 1.0/2.0 protocol, GM drum map, Web MIDI API, .mid file format |
| [`pwa-audio-reference.md`](research/technical/pwa-audio-reference.md) | 3,191 | Service workers, Workbox, offline audio, IndexedDB, Media Session API |
| [`drum-machine-keyboard-reference.md`](research/technical/drum-machine-keyboard-reference.md) | 1,860 | QWERTY-to-pad mapping, keyboard shortcuts, velocity, accessibility |
| [`turkish-rhythmic-systems-reference.md`](research/technical/turkish-rhythmic-systems-reference.md) | 1,452 | Ottoman usul system, Dum/Tek/Ka vocabulary, compound meters |
| [`drum-machine-practice-methodology.md`](research/technical/drum-machine-practice-methodology.md) | 1,336 | Deliberate practice, speed training, rudiments, polyrhythms, konnakol |

### Musicology (25 cultural traditions & scenes)

Deep historical, social, and musical context in [`research/musicology/`](research/musicology/):

#### Traditional & regional
| Region | File |
|--------|------|
| West Africa (Ghana, Nigeria, Senegal, Guinea, Mali) | [`west-african-traditions.md`](research/musicology/west-african-traditions.md) |
| Afro-Cuban, Caribbean, Latin America | [`afro-cuban-caribbean-latin.md`](research/musicology/afro-cuban-caribbean-latin.md) |
| Brazil (samba, bossa nova, baiao, maracatu, capoeira) | [`brazilian-traditions.md`](research/musicology/brazilian-traditions.md) |
| Caribbean, Colombia, Mexico | [`caribbean-colombia-mexico.md`](research/musicology/caribbean-colombia-mexico.md) |
| Andean & South American | [`andean-south-american.md`](research/musicology/andean-south-american.md) |
| Balkan (Bulgaria, Romania, Serbia, Greece) | [`balkan-traditions.md`](research/musicology/balkan-traditions.md) |
| Persian / Iranian | [`persian-iranian-traditions.md`](research/musicology/persian-iranian-traditions.md) |
| Turkish / Anatolian / SWANA | [`turkish-anatolian-swana.md`](research/musicology/turkish-anatolian-swana.md) |
| Indian subcontinent (Hindustani, Carnatic, folk) | [`indian-subcontinent.md`](research/musicology/indian-subcontinent.md) |
| East Asian (Korea, Japan, China, Vietnam) | [`east-asian-traditions.md`](research/musicology/east-asian-traditions.md) |
| Japan (taiko, gagaku, Noh, kabuki) | [`japanese-traditions.md`](research/musicology/japanese-traditions.md) |
| China (opera percussion, lion dance, ritual) | [`chinese-traditions.md`](research/musicology/chinese-traditions.md) |
| Mongolia | [`mongolian-traditions.md`](research/musicology/mongolian-traditions.md) |
| Gamelan & Southeast Asia | [`gamelan-southeast-asian.md`](research/musicology/gamelan-southeast-asian.md) |
| Vietnam, Cambodia, Malaysia | [`vietnam-cambodia-malaysia.md`](research/musicology/vietnam-cambodia-malaysia.md) |
| Iberian (flamenco, fado, Basque) | [`iberian-traditions.md`](research/musicology/iberian-traditions.md) |
| North & East African (Gnawa, raï, Ethiopian, Swahili coast) | [`north-east-african-traditions.md`](research/musicology/north-east-african-traditions.md) |
| Celtic & European (bodhrán, polska, Romani, klezmer) | [`celtic-european-traditions.md`](research/musicology/celtic-european-traditions.md) |
| Central Asian & Pacific (doira, muqam, Polynesian, powwow) | [`central-asian-pacific-traditions.md`](research/musicology/central-asian-pacific-traditions.md) |
| Caucasus & Mediterranean (Georgian, Armenian, Cretan, Sufi) | [`caucasus-mediterranean-traditions.md`](research/musicology/caucasus-mediterranean-traditions.md) |

#### Modern, electronic & internet-born
| Scene | File |
|-------|------|
| Electronic, hip-hop, funk, reggae (foundations) | [`electronic-hiphop-funk-reggae.md`](research/musicology/electronic-hiphop-funk-reggae.md) |
| Modern African genres (soukous→singeli, kwaito→gqom) | [`modern-african-genres.md`](research/musicology/modern-african-genres.md) |
| Global electronic scenes (budots, funkot, drill, footwork, hardstyle) | [`global-electronic-scenes.md`](research/musicology/global-electronic-scenes.md) |
| Underground electronic (mahraganat, hardbass, Bassiani, desi bass) | [`underground-electronic-movements.md`](research/musicology/underground-electronic-movements.md) |
| Internet-born genres (vaporwave, phonk, hyperpop, lo-fi, platform-native) | [`internet-born-genres.md`](research/musicology/internet-born-genres.md) |

### Design research

UI/UX, visual design, and sound architecture in [`research/design/`](research/design/):

| File | What it covers |
|------|---------------|
| [`instrument-hardware-ui-design.md`](research/design/instrument-hardware-ui-design.md) | Physical drum machine UI/UX (TR-808, SP-404, MPC, Digitakt) |
| [`music-software-ui-design.md`](research/design/music-software-ui-design.md) | Software drum machine UI patterns (Ableton, FL Studio, web apps) |
| [`music-visual-design-systems.md`](research/design/music-visual-design-systems.md) | Color, typography, visual language for music tools |
| [`world-percussion-sound-design.md`](research/design/world-percussion-sound-design.md) | 6 percussion families, 35+ synthesized voice types, 12 world kit presets, sampler architecture |
| [`brainstorm-notes.md`](research/design/brainstorm-notes.md) | Product design session notes and interview transcript |

---

## Planned tech stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit + TypeScript |
| Build | Vite |
| Audio | Tone.js + Web Audio API + AudioWorklet |
| Persistence | IndexedDB via Dexie.js |
| PWA | Workbox |
| Visualization | Canvas 2D |
| Hosting | Static (Vercel / Netlify / GitHub Pages) |

Synthesized sounds only (808/909/707 voices built with Web Audio API) — no samples, no licensing issues, smaller bundle.

## Key design decisions

- **Two modes, one engine:** Practice (coral `#e17055`) + Studio (purple `#6c5ce7`) + Library (green `#00b894`)
- **Beat grouping is the killer feature:** Not just "9/8" but "9/8 as 2+2+2+3" with colored dots per group
- **Warm light theme:** Background `#f8f6f3` — friendly playground, not dark gear-nerd
- **Opacity = velocity:** Solid color = strong, faded = weak — consistent everywhere
- **Speed Trainer:** Repeat for X bars, increase BPM by N — the #1 practice feature
- **No backend:** Everything in IndexedDB, JSON export, fully offline PWA

## Phasing

1. **Foundation** — SvelteKit scaffold, audio engine, beat grouping, basic sequencer
2. **Practice Mode** — metronome, speed trainer, ~50 preset patterns, save/load, PWA
3. **Studio Mode** — step grid, sound design, song/chain mode, pattern operations, JSON export
4. **Library Mode** — region browsing, cultural stories, filters, search, related rhythms
5. **Polish** — WAV/MIDI export, keyboard shortcuts, Web MIDI, community features

---

## For AI agents

This repo is structured for easy navigation by LLMs and code agents.

### Quick start

1. **Orientation:** This README
2. **Product spec:** [`docs/2026-03-12-beatforge-product-design.md`](docs/2026-03-12-beatforge-product-design.md)
3. **Find a concept:** [`research/TOPIC-INDEX.md`](research/TOPIC-INDEX.md) — maps every concept to exact file paths and line numbers
4. **Find a pattern:** [`research/PATTERN-INDEX.md`](research/PATTERN-INDEX.md) — searchable table of 650+ patterns by region, genre, time signature, difficulty
5. **Catalog all docs:** [`research/INDEX.md`](research/INDEX.md) — every document with line counts and content summaries

### Navigation rules

- All paths in index files are **relative to `research/`**
- Four subdirectories: `patterns/` (notation), `technical/` (implementation), `musicology/` (cultural context), `design/` (UI/UX)
- **Large files (2000+ lines):** Read in sections — scan headings first, then target specific sections
- **Cross-reference patterns with musicology** when you need both the notation and the cultural story
- Pattern files use **step-sequencer grid format** — directly translatable to code

### File tree

```
beatforge/
├── README.md                                ← You are here
├── docs/
│   └── 2026-03-12-beatforge-product-design.md   ← Product spec
└── research/
    ├── INDEX.md                             ← Master document catalog
    ├── TOPIC-INDEX.md                       ← Concept → file lookup
    ├── PATTERN-INDEX.md                     ← Pattern search by region/genre/meter
    │
    ├── patterns/                            ← 650+ notated rhythms
    │   ├── western-genres.md                   (211 — rock through electronic)
    │   ├── turkish-arabic-indian.md            (~70 — usul, iqa'at, tala)
    │   ├── african-ensembles.md                (~30+ — Ewe, Mande, Yoruba)
    │   ├── world-cross-cultural.md             (50+ — W.African, Afro-Cuban)
    │   ├── gamelan-southeast-asian.md          (20+ — colotomic structures)
    │   ├── latin-caribbean.md                  (~43 — bomba to kompa)
    │   ├── iberian-flamenco.md                 (~18 — bulería to zortziko)
    │   ├── north-east-african.md               (~20 — gnawa to taarab)
    │   ├── modern-african.md                   (~25 — soukous to singeli)
    │   ├── celtic-european.md                  (~20 — bodhrán to klezmer)
    │   ├── central-asian-pacific.md            (~24 — doira to powwow)
    │   ├── south-asian-expanded.md             (~35 — bhangra to kulintang)
    │   ├── caucasus-mediterranean.md           (~15 — lezginka to dhikr)
    │   ├── global-traditions.md                (~42 — broad cross-regional)
    │   ├── global-electronic.md                (~35 — budots to hardstyle)
    │   ├── underground-electronic.md           (~30 — mahraganat to hardbass)
    │   ├── internet-born.md                    (~24 — vaporwave to hyperpop)
    │   └── supplementary.txt
    │
    ├── technical/                            ← Implementation references
    │   ├── web-audio-dsp-reference.md
    │   ├── WEB_AUDIO_REFERENCE.md
    │   ├── MIDI_TECHNICAL_REFERENCE.md
    │   ├── pwa-audio-reference.md
    │   ├── drum-machine-keyboard-reference.md
    │   ├── turkish-rhythmic-systems-reference.md
    │   └── drum-machine-practice-methodology.md
    │
    ├── musicology/                           ← 25 cultural & scene deep dives
    │   ├── west-african-traditions.md
    │   ├── afro-cuban-caribbean-latin.md
    │   ├── brazilian-traditions.md
    │   ├── caribbean-colombia-mexico.md
    │   ├── andean-south-american.md
    │   ├── balkan-traditions.md
    │   ├── persian-iranian-traditions.md
    │   ├── turkish-anatolian-swana.md
    │   ├── indian-subcontinent.md
    │   ├── east-asian-traditions.md
    │   ├── japanese-traditions.md
    │   ├── chinese-traditions.md
    │   ├── mongolian-traditions.md
    │   ├── gamelan-southeast-asian.md
    │   ├── vietnam-cambodia-malaysia.md
    │   ├── iberian-traditions.md               ← NEW
    │   ├── north-east-african-traditions.md    ← NEW
    │   ├── celtic-european-traditions.md       ← NEW
    │   ├── central-asian-pacific-traditions.md ← NEW
    │   ├── caucasus-mediterranean-traditions.md ← NEW
    │   ├── modern-african-genres.md            ← NEW
    │   ├── electronic-hiphop-funk-reggae.md
    │   ├── global-electronic-scenes.md         ← NEW
    │   ├── underground-electronic-movements.md ← NEW
    │   └── internet-born-genres.md             ← NEW
    │
    └── design/                               ← UI/UX & sound design
        ├── instrument-hardware-ui-design.md
        ├── music-software-ui-design.md
        ├── music-visual-design-systems.md
        ├── world-percussion-sound-design.md    ← NEW (6 families, 35+ voices)
        └── brainstorm-notes.md
```

---

## License

MIT
