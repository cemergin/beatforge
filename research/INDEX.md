# BeatForge Research Corpus -- Master Index

**Total: ~45,290 lines | 27 documents**
**Last updated: March 12, 2026**

---

## How to Find What You Need (Quick Start for Humans)

1. **Building the audio engine?** Start with `web-audio-dsp-reference.md` (Web Audio API, DSP) and `WEB_AUDIO_REFERENCE.md` (Tone.js, WAM 2.0).
2. **Implementing MIDI?** Go to `MIDI_TECHNICAL_REFERENCE.md` -- protocol, GM drum map, Web MIDI API, file format.
3. **Making it a PWA?** `pwa-audio-reference.md` -- service workers, caching, offline, Media Session API.
4. **Designing the keyboard/pad UI?** `drum-machine-keyboard-reference.md` -- QWERTY mapping, shortcuts, velocity.
5. **Need a drum pattern for genre X?** `drum-patterns-library.md` (211 patterns across all Western genres), then check `drum-patterns.md` (SWANA/Turkish/Arabic/Indian patterns) and `african-drum-patterns.md`.
6. **Exploring world rhythms?** `world-rhythm-library.md` (West African, Afro-Cuban, cross-rhythms) plus the entire `musicology/` folder.
7. **Understanding a specific culture's rhythms?** Check the `musicology/` folder -- one file per region with deep historical/sociopolitical context.
8. **Building the practice/education module?** `drum-machine-practice-methodology.md` -- deliberate practice, speed training, rudiments, konnakol.
9. **Need Turkish/Ottoman rhythms?** `turkish-rhythmic-systems-reference.md` (musicology) plus patterns in `drum-patterns.md` (Part 1).
10. **Need gamelan patterns?** `beatforge-research/patterns/gamelan-southeast-asian.md` -- full colotomic structures with notation.

---

## AI Agent Instructions

When searching this corpus:

1. **Use the TOPIC-INDEX.md** for concept-to-file mapping. Every major concept (Web Audio, clave, tabla, Amapiano, etc.) maps to specific files and sections.
2. **Use the PATTERN-INDEX.md** to find specific notated patterns. Filter by region, genre, time signature, or difficulty.
3. **File paths are absolute from `~/lab/`**. Technical references are in `~/lab/`, musicology in `~/lab/beatforge-research/musicology/`, patterns in `~/lab/beatforge-research/patterns/`.
4. **Pattern files contain playable notation** (step sequencer grid format). Musicology files contain historical/cultural context but may also contain some notated patterns.
5. **For implementation questions**, read the technical references first. For "what pattern should I use" questions, check PATTERN-INDEX.md first.
6. **Large files (2000+ lines) should be read in sections** using offset/limit parameters. Scan headings first, then read relevant sections.
7. **Cross-reference pattern files with musicology files** when you need both the notation and the cultural context for a rhythm.

---

## Document Catalog

### Technical References (~/lab/)

| # | Document | Path | Lines | Description |
|---|----------|------|-------|-------------|
| 1 | Web Audio & DSP Reference | `~/lab/web-audio-dsp-reference.md` | 2,577 | AudioContext, AudioParam, AudioWorklet, DSP (filters, envelopes, oscillators, noise, distortion, compression, reverb, delay), scheduling, OfflineAudioContext, AnalyserNode, synthesis recipes (808 kick, 909 snare, FM, Karplus-Strong) |
| 2 | Web Audio Ecosystem Reference | `~/lab/WEB_AUDIO_REFERENCE.md` | 2,604 | WAM 2.0 plugin API (WamNode, WamProcessor, WamEnv, WamGroup), Tone.js deep dive (Transport, MembraneSynth, MetalSynth, NoiseSynth, Player, Sequence), other libraries |
| 3 | MIDI Technical Reference | `~/lab/MIDI_TECHNICAL_REFERENCE.md` | 2,296 | MIDI 1.0 protocol, channel messages, system messages, GM drum map (notes 27-81), velocity curves, CC table, MIDI clock, MIDI 2.0, Web MIDI API, .mid file format, MIDI file generation in JS |
| 4 | PWA Audio Reference | `~/lab/pwa-audio-reference.md` | 3,191 | Web app manifest, service worker lifecycle, caching strategies (cache-first, network-first, stale-while-revalidate), Workbox, offline audio, IndexedDB, Background Sync, Media Session API, Wake Lock, Web Share, storage management |
| 5 | Keyboard Control Reference | `~/lab/drum-machine-keyboard-reference.md` | 1,860 | QWERTY-to-pad mapping (Ableton, FL Studio, custom), keyboard shortcuts for production, JavaScript keydown implementation, velocity layers, focus management, accessibility |
| 6 | Turkish Rhythmic Systems | `~/lab/turkish-rhythmic-systems-reference.md` | 1,452 | Ottoman usul system, Düm/Tek/Ka stroke vocabulary, simple to compound meters (2/4 through 120 beats), Usul vs Western meter, notation systems, regional folk rhythms |
| 7 | Practice Methodology | `~/lab/drum-machine-practice-methodology.md` | 1,336 | Deliberate practice theory (Ericsson), speed training protocols, random mute exercises, 40 PAS rudiments, polyrhythm training, odd meter acclimation, konnakol, groove templates, spaced repetition |

### Pattern Libraries (~/lab/)

| # | Document | Path | Lines | Description |
|---|----------|------|-------|-------------|
| 8 | Comprehensive Drum Pattern Library | `~/lab/drum-patterns-library.md` | 2,944 | **211 patterns** across Western genres: rock, pop, blues, country, reggae, ska, punk, metal, funk, jazz, R&B, gospel, prog rock, disco, fusion, Afrobeat, math rock, djent, J Dilla, house, techno, DnB, hip-hop, UK garage, dubstep, Afrobeats, Amapiano, reggaeton, breakbeats, programmed classics, rudiment-based. Plus fills, build-ups, breakdowns. |
| 9 | SWANA & Indian Drum Patterns | `~/lab/drum-patterns.md` | 2,202 | **~70 patterns**: Turkish (Düyek, Ciftetelli, Karsilama, Roman Havasi, Kasap, Aksak, Longa, Sofyan, Turk Aksagi, Nim Sofyan, Devr-i Hindi, Yuruk Semai, Turkish Pop, Arabesk, Anatolian Rock, Psychedelic, Halay, Zeybek, Horon, Davul-Zurna, Curcuna, more), Arabic (Maqsoum, Baladi, Saidi, Masmoudi, Fallahi, Zaffa, Shaabi, Ayoub, Malfuf, Wahda, Dabke), Indian (Tintal, Dadra, Keherwa, Rupak, Jhaptal, Ektaal) |
| 10 | African Drum Patterns | `~/lab/african-drum-patterns.md` | 2,515 | **~30+ full ensemble patterns**: Ewe (Agbekor, Gahu, Kpanlogo, Bobobo, Atsiagbekor, Gadzo, Tokoe), Mande/djembe (Kuku, Soli, Dununba, Tiriba, Yankadi, Makru, Djansa, Sunu), Yoruba (Bata/Shango, Dundun/Talking drum), Senegalese (Sabar), plus full ensemble notation with bell, shaker, multiple drums, and kit adaptations |
| 11 | World Rhythm Library | `~/lab/world-rhythm-library.md` | 1,936 | West African (standard bell pattern, Gahu, Kpanlogo, Highlife, djembe accompaniment, cross-rhythms), Afro-Cuban/Caribbean (son clave, rumba clave, tresillo, cascara, bembe bell, Mozambique, songo, full salsa ensemble), plus additional world patterns |

### Pattern Libraries (~/lab/beatforge-research/patterns/)

| # | Document | Path | Lines | Description |
|---|----------|------|-------|-------------|
| 12 | Gamelan & SE Asian Patterns | `~/lab/beatforge-research/patterns/gamelan-southeast-asian.md` | 2,101 | Javanese gamelan: origins/mythology, court traditions (Yogyakarta vs Surakarta), cosmology, tuning (slendro/pelog), colotomic structure in detail, full notation for lancaran, ketawang, ladrang, merong/gendhing, srepegan, sampak, ayak-ayakan. Balinese: kotekan interlocking, kendang patterns |

### Musicology (~/lab/beatforge-research/musicology/)

| # | Document | Path | Lines | Description |
|---|----------|------|-------|-------------|
| 13 | West African Traditions | `~/lab/beatforge-research/musicology/west-african-traditions.md` | 602 | Griot tradition, Ewe/Ashanti/Yoruba drumming, timeline/bell patterns, diaspora connections, Ghana/Nigeria/Senegal/Guinea/Mali |
| 14 | Afro-Cuban/Caribbean/Latin | `~/lab/beatforge-research/musicology/afro-cuban-caribbean-latin.md` | 692 | Transatlantic slave trade and rhythm, Cuba (cabildos, Santeria/bata, Abakua, rumba, son, clave), Jamaica (mento, ska, rocksteady, reggae, dancehall, dub), Trinidad (calypso, steelpan, soca), Haiti (vodou), Puerto Rico |
| 15 | Brazilian Traditions | `~/lab/beatforge-research/musicology/brazilian-traditions.md` | 1,993 | African roots (Yoruba/Fon/Bantu), Candomble sacred drums, samba (de roda, enredo, pagode), bossa nova, baiao/forro, maracatu, capoeira/berimbau, funk carioca, frevo, coco, jongo |
| 16 | Caribbean/Colombia/Mexico | `~/lab/beatforge-research/musicology/caribbean-colombia-mexico.md` | 1,679 | Cuba deep dive (bata for orishas, rumba, son, timba), Jamaica, Trinidad, Haiti, Colombia (cumbia, vallenato, champeta, currulao), Mexico (son jarocho, huapango, norteno, banda) |
| 17 | Andean & South American | `~/lab/beatforge-research/musicology/andean-south-american.md` | 2,150 | Pre-Columbian Inca music, quipu, tinkuy dualism, Peru (festejo, lando, marinera), Bolivia (tinku, morenada, diablada), Argentina (tango, milonga, chacarera, zamba), Chile (cueca), Uruguay (candombe, murga), Venezuela (joropo, gaita, tambor), Ecuador, Paraguay |
| 18 | Balkan Traditions | `~/lab/beatforge-research/musicology/balkan-traditions.md` | 1,634 | Aksak/asymmetric meters, Brailoiu's bichronicity, Bartok, Bulgaria (odd meters 7/8-22/16, horo), Romania (lautari), Serbia (kolo, brass), Greece (rebetiko, kalamatianos, zebekiko), North Macedonia, Albania, Bosnia, Romani musicians |
| 19 | Persian/Iranian Traditions | `~/lab/beatforge-research/musicology/persian-iranian-traditions.md` | 1,301 | Zoroastrian music, Achaemenid/Sassanid eras, Barbad, dastgah system, tombak technique, daf (Sufi frame drum), regional traditions, Persian rhythmic patterns notated, Islamic Revolution and music |
| 20 | Indian Subcontinent | `~/lab/beatforge-research/musicology/indian-subcontinent.md` | 846 | Natya Shastra, Vedic chanting, temple drumming, guru-shishya parampara, Hindustani tala (Tintal, Jhaptal, Rupak, Ektaal, Dadra, Keherwa), tabla technique/bols, Carnatic (mridangam, konnakol, solkattu), folk (dhol, dholak), Bollywood, diaspora |
| 21 | East Asian Traditions | `~/lab/beatforge-research/musicology/east-asian-traditions.md` | 1,135 | Korea (samulnori, pungmul/nongak, changdan, janggu, court music, shaman music, pansori, K-pop), Japan (taiko, gagaku, Noh, kabuki), China (opera percussion, lion dance), Vietnam, Philippines, Thailand, gamelan overview |
| 22 | Japanese Traditions | `~/lab/beatforge-research/musicology/japanese-traditions.md` | 1,149 | Gagaku (oldest orchestral tradition), jo-ha-kyu aesthetic, Noh theater (hayashi ensemble), kabuki, taiko (complete history, kumi-daiko, Sukeroku-daiko), taiko notation/patterns (jiuchi, don-doko, oroshi), folk/min'yo, Okinawan music, modern Japan |
| 23 | Chinese Traditions | `~/lab/beatforge-research/musicology/chinese-traditions.md` | 976 | Shijing (Book of Songs), Confucian music philosophy, Yuefu bureau, bianzhong bells, Chinese percussion instruments taxonomy, Chinese opera percussion (luogu jing), folk/ritual percussion, ethnic minorities (Uyghur), lion/dragon dance drumming |
| 24 | Mongolian Traditions | `~/lab/beatforge-research/musicology/mongolian-traditions.md` | 1,550 | Steppe soundscape, nomadic life and music, horse gaits as rhythmic source, morin khuur, tsam dance, Naadam festival, throat singing (khoomii), shaman drumming, modern Mongolian music (The HU, Hanggai) |
| 25 | Gamelan & SE Asian (musicology) | `~/lab/beatforge-research/musicology/gamelan-southeast-asian.md` | 721 | Javanese gamelan cultural deep dive (sacred origins, kraton tradition, halus/kasar aesthetics, wayang kulit), Balinese gamelan, Thai music, Myanmar, Vietnam, Philippines, Indonesia beyond gamelan |
| 26 | Vietnam/Cambodia/Malaysia | `~/lab/beatforge-research/musicology/vietnam-cambodia-malaysia.md` | 948 | Dong Son bronze drums, Chinese influence (1000 years), Champa kingdom, nha nhac (Hue court music), ca tru, cheo theater, hat boi, Cambodian (Khmer classical, pinpeat, apsara), Malaysian (gamelan Melayu, kompang, joget) |
| 27 | Electronic/Hip-Hop/Funk/Reggae | `~/lab/beatforge-research/musicology/electronic-hiphop-funk-reggae.md` | 900 | James Brown and "The One," African roots of funk, New Orleans funk (Prof. Longhair, Meters, second line), Parliament-Funkadelic, hip-hop (breakbeats, sampling, MPC, Dilla), electronic music (TR-808/909, house, techno, DnB), reggae/dub/dancehall |

---

## File Size Reference

| Path | Lines |
|------|-------|
| `~/lab/pwa-audio-reference.md` | 3,191 |
| `~/lab/drum-patterns-library.md` | 2,944 |
| `~/lab/WEB_AUDIO_REFERENCE.md` | 2,604 |
| `~/lab/web-audio-dsp-reference.md` | 2,577 |
| `~/lab/african-drum-patterns.md` | 2,515 |
| `~/lab/MIDI_TECHNICAL_REFERENCE.md` | 2,296 |
| `~/lab/drum-patterns.md` | 2,202 |
| `~/lab/beatforge-research/musicology/andean-south-american.md` | 2,150 |
| `~/lab/beatforge-research/patterns/gamelan-southeast-asian.md` | 2,101 |
| `~/lab/beatforge-research/musicology/brazilian-traditions.md` | 1,993 |
| `~/lab/world-rhythm-library.md` | 1,936 |
| `~/lab/drum-machine-keyboard-reference.md` | 1,860 |
| `~/lab/beatforge-research/musicology/caribbean-colombia-mexico.md` | 1,679 |
| `~/lab/beatforge-research/musicology/balkan-traditions.md` | 1,634 |
| `~/lab/beatforge-research/musicology/mongolian-traditions.md` | 1,550 |
| `~/lab/turkish-rhythmic-systems-reference.md` | 1,452 |
| `~/lab/drum-machine-practice-methodology.md` | 1,336 |
| `~/lab/beatforge-research/musicology/persian-iranian-traditions.md` | 1,301 |
| `~/lab/beatforge-research/musicology/japanese-traditions.md` | 1,149 |
| `~/lab/beatforge-research/musicology/east-asian-traditions.md` | 1,135 |
| `~/lab/beatforge-research/musicology/chinese-traditions.md` | 976 |
| `~/lab/beatforge-research/musicology/vietnam-cambodia-malaysia.md` | 948 |
| `~/lab/beatforge-research/musicology/electronic-hiphop-funk-reggae.md` | 900 |
| `~/lab/beatforge-research/musicology/indian-subcontinent.md` | 846 |
| `~/lab/beatforge-research/musicology/gamelan-southeast-asian.md` | 721 |
| `~/lab/beatforge-research/musicology/afro-cuban-caribbean-latin.md` | 692 |
| `~/lab/beatforge-research/musicology/west-african-traditions.md` | 602 |
| **TOTAL** | **~45,290** |

---

## Directory Structure

```
~/lab/
  web-audio-dsp-reference.md          # Web Audio API + DSP
  WEB_AUDIO_REFERENCE.md              # WAM 2.0 + Tone.js
  MIDI_TECHNICAL_REFERENCE.md         # MIDI protocol + Web MIDI
  pwa-audio-reference.md              # PWA for audio apps
  drum-machine-keyboard-reference.md  # Keyboard/pad UI design
  turkish-rhythmic-systems-reference.md  # Ottoman usul system
  drum-machine-practice-methodology.md   # Practice/education
  drum-patterns-library.md            # 211 Western genre patterns
  drum-patterns.md                    # SWANA + Indian patterns
  african-drum-patterns.md            # West African ensemble patterns
  world-rhythm-library.md             # Global rhythms (W. Africa, Afro-Cuban)
  beatforge-research/
    INDEX.md                          # THIS FILE
    TOPIC-INDEX.md                    # Concept cross-reference
    PATTERN-INDEX.md                  # Complete pattern catalog
    patterns/
      gamelan-southeast-asian.md      # Gamelan colotomic notation
    musicology/
      west-african-traditions.md
      afro-cuban-caribbean-latin.md
      brazilian-traditions.md
      caribbean-colombia-mexico.md
      andean-south-american.md
      balkan-traditions.md
      persian-iranian-traditions.md
      indian-subcontinent.md
      east-asian-traditions.md
      japanese-traditions.md
      chinese-traditions.md
      mongolian-traditions.md
      gamelan-southeast-asian.md
      vietnam-cambodia-malaysia.md
      electronic-hiphop-funk-reggae.md
```
