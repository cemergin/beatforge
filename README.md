# BeatForge

A browser-based rhythm playground that starts as a metronome and evolves into a drum machine. Two modes share one audio engine: **Practice** for daily musician use, **Studio** for beat creation. A **Library** lets users explore 350+ world rhythms with their cultural stories.

Works offline. No install. No signup. No backend. Open source.

---

## What's in this repo

This is the research and design foundation for BeatForge — 55,000+ lines of musicology, technical references, drum patterns, and product design. The app itself hasn't been built yet; this corpus is what informs it.

### Product design

| File | What it covers |
|------|---------------|
| [`docs/2026-03-12-beatforge-product-design.md`](docs/2026-03-12-beatforge-product-design.md) | Full product spec — architecture, modes, UI layouts, phasing, design system |

### Research indexes

| File | What it covers |
|------|---------------|
| [`research/INDEX.md`](research/INDEX.md) | Master catalog of all 27 research documents with line counts and summaries |
| [`research/TOPIC-INDEX.md`](research/TOPIC-INDEX.md) | Concept-to-file cross-reference (Web Audio, clave, tabla, Amapiano, etc.) |
| [`research/PATTERN-INDEX.md`](research/PATTERN-INDEX.md) | Every notated pattern searchable by region, genre, time signature, difficulty |

### Technical references

| File | Lines | What it covers |
|------|-------|---------------|
| [`research/web-audio-dsp-reference.md`](research/web-audio-dsp-reference.md) | 2,577 | Web Audio API, DSP fundamentals, synthesis recipes (808 kick, 909 snare, FM, Karplus-Strong) |
| [`research/WEB_AUDIO_REFERENCE.md`](research/WEB_AUDIO_REFERENCE.md) | 2,604 | Tone.js deep dive, WAM 2.0 plugin architecture |
| [`research/MIDI_TECHNICAL_REFERENCE.md`](research/MIDI_TECHNICAL_REFERENCE.md) | 2,296 | MIDI 1.0/2.0 protocol, GM drum map, Web MIDI API, .mid file format |
| [`research/pwa-audio-reference.md`](research/pwa-audio-reference.md) | 3,191 | Service workers, Workbox, offline audio, IndexedDB, Media Session API |
| [`research/drum-machine-keyboard-reference.md`](research/drum-machine-keyboard-reference.md) | 1,860 | QWERTY-to-pad mapping, keyboard shortcuts, velocity, accessibility |
| [`research/turkish-rhythmic-systems-reference.md`](research/turkish-rhythmic-systems-reference.md) | 1,452 | Ottoman usul system, Dum/Tek/Ka vocabulary, compound meters |
| [`research/drum-machine-practice-methodology.md`](research/drum-machine-practice-methodology.md) | 1,336 | Deliberate practice, speed training, rudiments, polyrhythms, konnakol |

### Pattern libraries (350+ patterns)

| File | Patterns | Coverage |
|------|----------|----------|
| [`research/drum-patterns-library.md`](research/drum-patterns-library.md) | 211 | Rock, pop, funk, jazz, hip-hop, house, techno, DnB, Afrobeats, Amapiano, reggaeton, and more |
| [`research/drum-patterns.md`](research/drum-patterns.md) | ~70 | Turkish (Duyek, Karsilama, Zeybek, Horon...), Arabic (Maqsoum, Baladi, Saidi...), Indian (Tintal, Dadra, Rupak...) |
| [`research/african-drum-patterns.md`](research/african-drum-patterns.md) | ~30 | Ewe (Agbekor, Gahu, Kpanlogo), Mande/djembe (Kuku, Soli, Dununba), Yoruba (Bata, Dundun) — full ensemble notation |
| [`research/world-rhythm-library.md`](research/world-rhythm-library.md) | 50+ | West African bell patterns, Afro-Cuban clave/cascara/bembe, cross-rhythms |
| [`research/patterns/gamelan-southeast-asian.md`](research/patterns/gamelan-southeast-asian.md) | 20+ | Javanese gamelan colotomic structures, Balinese kotekan interlocking |
| [`research/drum-pattern-library.txt`](research/drum-pattern-library.txt) | — | Additional pattern data in text format |

### Musicology (16 cultural traditions)

Deep historical, social, and musical context for each region's rhythmic traditions:

| Region | File |
|--------|------|
| West Africa (Ghana, Nigeria, Senegal, Guinea, Mali) | [`research/musicology/west-african-traditions.md`](research/musicology/west-african-traditions.md) |
| Afro-Cuban, Caribbean, Latin America | [`research/musicology/afro-cuban-caribbean-latin.md`](research/musicology/afro-cuban-caribbean-latin.md) |
| Brazil (samba, bossa nova, baiao, maracatu, capoeira) | [`research/musicology/brazilian-traditions.md`](research/musicology/brazilian-traditions.md) |
| Caribbean, Colombia, Mexico | [`research/musicology/caribbean-colombia-mexico.md`](research/musicology/caribbean-colombia-mexico.md) |
| Andean & South American | [`research/musicology/andean-south-american.md`](research/musicology/andean-south-american.md) |
| Balkan (Bulgaria, Romania, Serbia, Greece) | [`research/musicology/balkan-traditions.md`](research/musicology/balkan-traditions.md) |
| Persian / Iranian | [`research/musicology/persian-iranian-traditions.md`](research/musicology/persian-iranian-traditions.md) |
| Turkish / Anatolian / SWANA | [`research/musicology/turkish-anatolian-swana.md`](research/musicology/turkish-anatolian-swana.md) |
| Indian subcontinent (Hindustani, Carnatic, folk) | [`research/musicology/indian-subcontinent.md`](research/musicology/indian-subcontinent.md) |
| East Asian (Korea, Japan, China, Vietnam) | [`research/musicology/east-asian-traditions.md`](research/musicology/east-asian-traditions.md) |
| Japan (taiko, gagaku, Noh, kabuki) | [`research/musicology/japanese-traditions.md`](research/musicology/japanese-traditions.md) |
| China (opera percussion, lion dance, ritual) | [`research/musicology/chinese-traditions.md`](research/musicology/chinese-traditions.md) |
| Mongolia | [`research/musicology/mongolian-traditions.md`](research/musicology/mongolian-traditions.md) |
| Gamelan & Southeast Asia | [`research/musicology/gamelan-southeast-asian.md`](research/musicology/gamelan-southeast-asian.md) |
| Vietnam, Cambodia, Malaysia | [`research/musicology/vietnam-cambodia-malaysia.md`](research/musicology/vietnam-cambodia-malaysia.md) |
| Electronic, hip-hop, funk, reggae | [`research/musicology/electronic-hiphop-funk-reggae.md`](research/musicology/electronic-hiphop-funk-reggae.md) |

### Design research

| File | What it covers |
|------|---------------|
| [`research/instrument-hardware-ui-design.md`](research/instrument-hardware-ui-design.md) | Physical drum machine UI/UX (TR-808, SP-404, MPC, Digitakt) |
| [`research/music-software-ui-design.md`](research/music-software-ui-design.md) | Software drum machine UI patterns (Ableton, FL Studio, web apps) |
| [`research/music-visual-design-systems.md`](research/music-visual-design-systems.md) | Color, typography, visual language for music tools |
| [`research/brainstorm-notes.md`](research/brainstorm-notes.md) | Product design session notes and interview transcript |

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

This repo is structured for easy navigation by LLMs and code agents:

- **Start here:** This README for orientation, then [`docs/2026-03-12-beatforge-product-design.md`](docs/2026-03-12-beatforge-product-design.md) for the full product spec
- **Find a concept:** [`research/TOPIC-INDEX.md`](research/TOPIC-INDEX.md) maps every concept (Web Audio, clave, tabla, usul, etc.) to exact file paths and line numbers
- **Find a pattern:** [`research/PATTERN-INDEX.md`](research/PATTERN-INDEX.md) is a searchable table of all 350+ patterns by region, genre, time signature, and difficulty
- **Catalog all docs:** [`research/INDEX.md`](research/INDEX.md) lists every document with line counts and content summaries
- **Large files (2000+ lines):** Read in sections. Scan headings first, then target specific sections
- **Pattern files** contain playable notation in step-sequencer grid format
- **Musicology files** contain historical/cultural context and may include some notated patterns — cross-reference with pattern files when you need both notation and context

### File tree

```
beatforge/
├── README.md                              ← You are here
├── docs/
│   └── 2026-03-12-beatforge-product-design.md  ← Product spec (start here)
└── research/
    ├── INDEX.md                           ← Master document catalog
    ├── TOPIC-INDEX.md                     ← Concept → file lookup
    ├── PATTERN-INDEX.md                   ← Pattern search by region/genre/meter
    ├── web-audio-dsp-reference.md         ← Web Audio API + DSP
    ├── WEB_AUDIO_REFERENCE.md             ← Tone.js + WAM 2.0
    ├── MIDI_TECHNICAL_REFERENCE.md        ← MIDI protocol + Web MIDI
    ├── pwa-audio-reference.md             ← PWA for audio apps
    ├── drum-machine-keyboard-reference.md ← Keyboard/pad UI
    ├── turkish-rhythmic-systems-reference.md ← Ottoman usul system
    ├── drum-machine-practice-methodology.md  ← Practice science
    ├── drum-patterns-library.md           ← 211 Western genre patterns
    ├── drum-patterns.md                   ← 70 SWANA + Indian patterns
    ├── african-drum-patterns.md           ← 30+ African ensemble patterns
    ├── world-rhythm-library.md            ← 50+ cross-cultural patterns
    ├── drum-pattern-library.txt           ← Additional pattern data
    ├── instrument-hardware-ui-design.md   ← Physical drum machine UX
    ├── music-software-ui-design.md        ← Software drum machine UX
    ├── music-visual-design-systems.md     ← Visual design for music tools
    ├── brainstorm-notes.md                ← Product design session notes
    ├── musicology/                        ← 16 cultural tradition deep dives
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
    │   └── electronic-hiphop-funk-reggae.md
    └── patterns/
        └── gamelan-southeast-asian.md     ← Javanese/Balinese colotomic structures
```

---

## License

MIT
