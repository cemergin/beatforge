# BeatForge Research Corpus — Master Index

**Total: ~47,618 lines | 30 documents**
**Last updated: March 13, 2026**

---

## How to Find What You Need

1. **Building the audio engine?** → [`technical/web-audio-dsp-reference.md`](technical/web-audio-dsp-reference.md) + [`technical/WEB_AUDIO_REFERENCE.md`](technical/WEB_AUDIO_REFERENCE.md)
2. **Implementing MIDI?** → [`technical/MIDI_TECHNICAL_REFERENCE.md`](technical/MIDI_TECHNICAL_REFERENCE.md)
3. **Making it a PWA?** → [`technical/pwa-audio-reference.md`](technical/pwa-audio-reference.md)
4. **Designing keyboard/pad UI?** → [`technical/drum-machine-keyboard-reference.md`](technical/drum-machine-keyboard-reference.md)
5. **Need a drum pattern for genre X?** → [`patterns/western-genres.md`](patterns/western-genres.md) (211 patterns), then [`patterns/turkish-arabic-indian.md`](patterns/turkish-arabic-indian.md) and [`patterns/african-ensembles.md`](patterns/african-ensembles.md)
6. **Exploring world rhythms?** → [`patterns/world-cross-cultural.md`](patterns/world-cross-cultural.md) + the entire [`musicology/`](musicology/) folder
7. **Understanding a culture's rhythms?** → [`musicology/`](musicology/) — one file per region with deep historical context
8. **Building practice/education?** → [`technical/drum-machine-practice-methodology.md`](technical/drum-machine-practice-methodology.md)
9. **Need Turkish/Ottoman rhythms?** → [`technical/turkish-rhythmic-systems-reference.md`](technical/turkish-rhythmic-systems-reference.md) + [`patterns/turkish-arabic-indian.md`](patterns/turkish-arabic-indian.md)
10. **Need gamelan patterns?** → [`patterns/gamelan-southeast-asian.md`](patterns/gamelan-southeast-asian.md)

---

## AI Agent Instructions

When searching this corpus:

1. **Use [TOPIC-INDEX.md](TOPIC-INDEX.md)** for concept-to-file mapping. Every major concept maps to specific files and sections.
2. **Use [PATTERN-INDEX.md](PATTERN-INDEX.md)** to find specific notated patterns. Filter by region, genre, time signature, or difficulty.
3. **File paths are relative from `research/`**. Four subdirectories: `technical/`, `patterns/`, `musicology/`, `design/`.
4. **Pattern files contain playable notation** (step sequencer grid format). Musicology files contain cultural context and may also include notated patterns.
5. **For implementation questions**, read the technical references first. For "what pattern should I use", check PATTERN-INDEX.md first.
6. **Large files (2000+ lines)** should be read in sections using offset/limit. Scan headings first.
7. **Cross-reference patterns with musicology** when you need both notation and cultural context.

---

## Document Catalog

### Technical References (`technical/`)

| # | Document | Path | Lines | Description |
|---|----------|------|-------|-------------|
| 1 | Web Audio & DSP Reference | `technical/web-audio-dsp-reference.md` | 2,577 | AudioContext, AudioParam, AudioWorklet, DSP (filters, envelopes, oscillators, noise, distortion, compression, reverb, delay), scheduling, OfflineAudioContext, AnalyserNode, synthesis recipes (808 kick, 909 snare, FM, Karplus-Strong) |
| 2 | Web Audio Ecosystem Reference | `technical/WEB_AUDIO_REFERENCE.md` | 2,604 | WAM 2.0 plugin API (WamNode, WamProcessor, WamEnv, WamGroup), Tone.js deep dive (Transport, MembraneSynth, MetalSynth, NoiseSynth, Player, Sequence), other libraries |
| 3 | MIDI Technical Reference | `technical/MIDI_TECHNICAL_REFERENCE.md` | 2,296 | MIDI 1.0 protocol, channel messages, system messages, GM drum map (notes 27-81), velocity curves, CC table, MIDI clock, MIDI 2.0, Web MIDI API, .mid file format, MIDI file generation in JS |
| 4 | PWA Audio Reference | `technical/pwa-audio-reference.md` | 3,191 | Web app manifest, service worker lifecycle, caching strategies (cache-first, network-first, stale-while-revalidate), Workbox, offline audio, IndexedDB, Background Sync, Media Session API, Wake Lock, Web Share, storage management |
| 5 | Keyboard Control Reference | `technical/drum-machine-keyboard-reference.md` | 1,860 | QWERTY-to-pad mapping (Ableton, FL Studio, custom), keyboard shortcuts for production, JavaScript keydown implementation, velocity layers, focus management, accessibility |
| 6 | Turkish Rhythmic Systems | `technical/turkish-rhythmic-systems-reference.md` | 1,452 | Ottoman usul system, Düm/Tek/Ka stroke vocabulary, simple to compound meters (2/4 through 120 beats), Usul vs Western meter, notation systems, regional folk rhythms |
| 7 | Practice Methodology | `technical/drum-machine-practice-methodology.md` | 1,336 | Deliberate practice theory (Ericsson), speed training protocols, random mute exercises, 40 PAS rudiments, polyrhythm training, odd meter acclimation, konnakol, groove templates, spaced repetition |

### Pattern Libraries (`patterns/`)

| # | Document | Path | Patterns | Description |
|---|----------|------|----------|-------------|
| 8 | Western Genres | `patterns/western-genres.md` | 211 | Rock, pop, blues, country, reggae, ska, punk, metal, funk, jazz, R&B, gospel, prog rock, disco, fusion, Afrobeat, math rock, djent, J Dilla, house, techno, DnB, hip-hop, UK garage, dubstep, Afrobeats, Amapiano, reggaeton, breakbeats, programmed classics, rudiment-based. Plus fills, build-ups, breakdowns. |
| 9 | Turkish, Arabic & Indian | `patterns/turkish-arabic-indian.md` | ~70 | Turkish (Düyek, Ciftetelli, Karsilama, Roman Havasi, Kasap, Aksak, Longa, Sofyan, Turk Aksagi, Nim Sofyan, Devr-i Hindi, Yuruk Semai, Turkish Pop, Arabesk, Anatolian Rock, Psychedelic, Halay, Zeybek, Horon, Davul-Zurna, Curcuna, more), Arabic (Maqsoum, Baladi, Saidi, Masmoudi, Fallahi, Zaffa, Shaabi, Ayoub, Malfuf, Wahda, Dabke), Indian (Tintal, Dadra, Keherwa, Rupak, Jhaptal, Ektaal) |
| 10 | African Ensembles | `patterns/african-ensembles.md` | ~30+ | Ewe (Agbekor, Gahu, Kpanlogo, Bobobo, Atsiagbekor, Gadzo, Tokoe), Mande/djembe (Kuku, Soli, Dununba, Tiriba, Yankadi, Makru, Djansa, Sunu), Yoruba (Bata/Shango, Dundun/Talking drum), Senegalese (Sabar). Full ensemble notation with bell, shaker, multiple drums, and kit adaptations. |
| 11 | World Cross-Cultural | `patterns/world-cross-cultural.md` | 50+ | West African (standard bell pattern, Gahu, Kpanlogo, Highlife, djembe accompaniment, cross-rhythms), Afro-Cuban/Caribbean (son clave, rumba clave, tresillo, cascara, bembe bell, Mozambique, songo, full salsa ensemble) |
| 12 | Gamelan & SE Asian | `patterns/gamelan-southeast-asian.md` | 20+ | Javanese gamelan: origins/mythology, court traditions, cosmology, tuning (slendro/pelog), colotomic structure, full notation for lancaran, ketawang, ladrang, merong/gendhing, srepegan, sampak, ayak-ayakan. Balinese: kotekan interlocking, kendang patterns |
| 13 | Supplementary | `patterns/supplementary.txt` | — | Additional pattern data in text format |
| 13a | Electronic History Patterns | `patterns/electronic-history.md` | 32 | Synth-pop (Depeche Mode, New Order, Gary Numan), EBM/industrial (DAF, NIN, Skinny Puppy), Italo disco, Hi-NRG, deep house, garage house, French touch, minimal techno, microhouse, ambient house, trip-hop, progressive trance, psytrance, gabber, happy hardcore, motorik, Berlin School, melodic techno, organic/Afro house, hard techno revival, breaks revival, neo-rave, lo-fi house, electro, Eurodance, EDM/big room, Balearic, Berghain-style |

### Musicology (`musicology/`)

| # | Document | Path | Lines | Description |
|---|----------|------|-------|-------------|
| 14 | West African Traditions | `musicology/west-african-traditions.md` | 602 | Griot tradition, Ewe/Ashanti/Yoruba drumming, timeline/bell patterns, diaspora connections, Ghana/Nigeria/Senegal/Guinea/Mali |
| 15 | Afro-Cuban/Caribbean/Latin | `musicology/afro-cuban-caribbean-latin.md` | 692 | Transatlantic slave trade and rhythm, Cuba (cabildos, Santeria/bata, Abakua, rumba, son, clave), Jamaica (mento, ska, rocksteady, reggae, dancehall, dub), Trinidad (calypso, steelpan, soca), Haiti (vodou), Puerto Rico |
| 16 | Brazilian Traditions | `musicology/brazilian-traditions.md` | 1,993 | African roots (Yoruba/Fon/Bantu), Candomble sacred drums, samba (de roda, enredo, pagode), bossa nova, baiao/forro, maracatu, capoeira/berimbau, funk carioca, frevo, coco, jongo |
| 17 | Caribbean/Colombia/Mexico | `musicology/caribbean-colombia-mexico.md` | 1,679 | Cuba deep dive (bata for orishas, rumba, son, timba), Jamaica, Trinidad, Haiti, Colombia (cumbia, vallenato, champeta, currulao), Mexico (son jarocho, huapango, norteno, banda) |
| 18 | Andean & South American | `musicology/andean-south-american.md` | 2,150 | Pre-Columbian Inca music, quipu, tinkuy dualism, Peru (festejo, lando, marinera), Bolivia (tinku, morenada, diablada), Argentina (tango, milonga, chacarera, zamba), Chile (cueca), Uruguay (candombe, murga), Venezuela (joropo, gaita, tambor), Ecuador, Paraguay |
| 19 | Balkan Traditions | `musicology/balkan-traditions.md` | 1,634 | Aksak/asymmetric meters, Brailoiu's bichronicity, Bartok, Bulgaria (odd meters 7/8-22/16, horo), Romania (lautari), Serbia (kolo, brass), Greece (rebetiko, kalamatianos, zebekiko), North Macedonia, Albania, Bosnia, Romani musicians |
| 20 | Persian/Iranian Traditions | `musicology/persian-iranian-traditions.md` | 1,301 | Zoroastrian music, Achaemenid/Sassanid eras, Barbad, dastgah system, tombak technique, daf (Sufi frame drum), regional traditions, Persian rhythmic patterns notated, Islamic Revolution and music |
| 21 | Indian Subcontinent | `musicology/indian-subcontinent.md` | 846 | Natya Shastra, Vedic chanting, temple drumming, guru-shishya parampara, Hindustani tala (Tintal, Jhaptal, Rupak, Ektaal, Dadra, Keherwa), tabla technique/bols, Carnatic (mridangam, konnakol, solkattu), folk (dhol, dholak), Bollywood, diaspora |
| 22 | East Asian Traditions | `musicology/east-asian-traditions.md` | 1,135 | Korea (samulnori, pungmul/nongak, changdan, janggu, court music, shaman music, pansori, K-pop), Japan (taiko, gagaku, Noh, kabuki), China (opera percussion, lion dance), Vietnam, Philippines, Thailand, gamelan overview |
| 23 | Japanese Traditions | `musicology/japanese-traditions.md` | 1,149 | Gagaku (oldest orchestral tradition), jo-ha-kyu aesthetic, Noh theater (hayashi ensemble), kabuki, taiko (complete history, kumi-daiko, Sukeroku-daiko), taiko notation/patterns (jiuchi, don-doko, oroshi), folk/min'yo, Okinawan music, modern Japan |
| 24 | Chinese Traditions | `musicology/chinese-traditions.md` | 976 | Shijing (Book of Songs), Confucian music philosophy, Yuefu bureau, bianzhong bells, Chinese percussion instruments taxonomy, Chinese opera percussion (luogu jing), folk/ritual percussion, ethnic minorities (Uyghur), lion/dragon dance drumming |
| 25 | Mongolian Traditions | `musicology/mongolian-traditions.md` | 1,550 | Steppe soundscape, nomadic life and music, horse gaits as rhythmic source, morin khuur, tsam dance, Naadam festival, throat singing (khoomii), shaman drumming, modern Mongolian music (The HU, Hanggai) |
| 26 | Gamelan & SE Asian | `musicology/gamelan-southeast-asian.md` | 721 | Javanese gamelan cultural deep dive (sacred origins, kraton tradition, halus/kasar aesthetics, wayang kulit), Balinese gamelan, Thai music, Myanmar, Vietnam, Philippines, Indonesia beyond gamelan |
| 27 | Vietnam/Cambodia/Malaysia | `musicology/vietnam-cambodia-malaysia.md` | 948 | Dong Son bronze drums, Chinese influence (1000 years), Champa kingdom, nha nhac (Hue court music), ca tru, cheo theater, hat boi, Cambodian (Khmer classical, pinpeat, apsara), Malaysian (gamelan Melayu, kompang, joget) |
| 28 | Electronic/Hip-Hop/Funk/Reggae | `musicology/electronic-hiphop-funk-reggae.md` | 900 | James Brown and "The One," African roots of funk, New Orleans funk (Prof. Longhair, Meters, second line), Parliament-Funkadelic, hip-hop (breakbeats, sampling, MPC, Dilla), electronic music (TR-808/909, house, techno, DnB), reggae/dub/dancehall |
| 29a | Electronic Music History | `musicology/electronic-music-history.md` | 626 | Complete electronic music genealogy: pre-history (musique concrète, Moog, Buchla), synth-pop, industrial/EBM, Italo disco/Hi-NRG, deep house/garage, ambient, French touch, minimal techno, Berlin School, instruments timeline, movements (Second Summer of Love, superclub era, Ibiza), current landscape (2024-2026), AI in production, modular synth revival |
| 29b | Econopolitics of Music | `musicology/econopolitics-of-music.md` | 890 | How economics/technology shaped musical form: format as destiny (78rpm→streaming), big band death, DJ labor economics, playlist payola (how "algorithmic" playlists really work, label deals, fake artists), Jamaica's riddim culture (how loose copyright created a musical superpower, the versioning tradition), copyright (sampling law, Blurred Lines, term extension), label vs. artist economics (360 deals, master ownership, streaming royalties), geography of innovation (cheap rent theory), production democratization, TikTok effect, AI disruption, festival economy, three-label oligopoly |

### Design Research (`design/`)

| # | Document | Path | Lines | Description |
|---|----------|------|-------|-------------|
| 29 | Hardware UI Design | `design/instrument-hardware-ui-design.md` | — | Physical drum machine UI/UX (TR-808, SP-404, MPC, Digitakt, Analog Rytm) |
| 30 | Software UI Design | `design/music-software-ui-design.md` | — | Software drum machine patterns (Ableton, FL Studio, web apps) |
| 31 | Visual Design Systems | `design/music-visual-design-systems.md` | — | Color, typography, visual language for music tools |
| 32 | Brainstorm Notes | `design/brainstorm-notes.md` | — | Product design session notes and interview transcript |

---

## Directory Structure

```
research/
├── INDEX.md                          ← This file
├── TOPIC-INDEX.md                    ← Concept → file cross-reference
├── PATTERN-INDEX.md                  ← All 350+ patterns cataloged
├── technical/                        ← Implementation references
│   ├── web-audio-dsp-reference.md
│   ├── WEB_AUDIO_REFERENCE.md
│   ├── MIDI_TECHNICAL_REFERENCE.md
│   ├── pwa-audio-reference.md
│   ├── drum-machine-keyboard-reference.md
│   ├── turkish-rhythmic-systems-reference.md
│   └── drum-machine-practice-methodology.md
├── patterns/                         ← Notated rhythm patterns
│   ├── western-genres.md             (211 patterns)
│   ├── turkish-arabic-indian.md      (~70 patterns)
│   ├── african-ensembles.md          (~30+ full ensemble patterns)
│   ├── world-cross-cultural.md       (50+ cross-cultural patterns)
│   ├── gamelan-southeast-asian.md    (20+ colotomic structures)
│   ├── electronic-history.md          (32 patterns from electronic history)
│   └── supplementary.txt
├── musicology/                       ← Cultural/historical deep dives
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
│   ├── electronic-hiphop-funk-reggae.md
│   ├── electronic-music-history.md
│   ├── econopolitics-of-music.md
│   ├── global-electronic-scenes.md
│   └── underground-electronic-movements.md
└── design/                           ← UI/UX design research
    ├── instrument-hardware-ui-design.md
    ├── music-software-ui-design.md
    ├── music-visual-design-systems.md
    └── brainstorm-notes.md
```

---

## File Size Reference (largest first)

| Path | Lines |
|------|-------|
| `technical/pwa-audio-reference.md` | 3,191 |
| `patterns/western-genres.md` | 2,944 |
| `technical/WEB_AUDIO_REFERENCE.md` | 2,604 |
| `technical/web-audio-dsp-reference.md` | 2,577 |
| `patterns/african-ensembles.md` | 2,515 |
| `technical/MIDI_TECHNICAL_REFERENCE.md` | 2,296 |
| `patterns/turkish-arabic-indian.md` | 2,202 |
| `musicology/andean-south-american.md` | 2,150 |
| `patterns/gamelan-southeast-asian.md` | 2,101 |
| `musicology/brazilian-traditions.md` | 1,993 |
| `patterns/world-cross-cultural.md` | 1,936 |
| `technical/drum-machine-keyboard-reference.md` | 1,860 |
| `musicology/caribbean-colombia-mexico.md` | 1,679 |
| `musicology/balkan-traditions.md` | 1,634 |
| `musicology/mongolian-traditions.md` | 1,550 |
| `technical/turkish-rhythmic-systems-reference.md` | 1,452 |
| `technical/drum-machine-practice-methodology.md` | 1,336 |
| `musicology/persian-iranian-traditions.md` | 1,301 |
| `musicology/japanese-traditions.md` | 1,149 |
| `musicology/east-asian-traditions.md` | 1,135 |
| `musicology/chinese-traditions.md` | 976 |
| `musicology/vietnam-cambodia-malaysia.md` | 948 |
| `musicology/electronic-hiphop-funk-reggae.md` | 900 |
| `musicology/indian-subcontinent.md` | 846 |
| `musicology/gamelan-southeast-asian.md` | 721 |
| `musicology/afro-cuban-caribbean-latin.md` | 692 |
| `musicology/west-african-traditions.md` | 602 |
| **TOTAL** | **~45,290** |
