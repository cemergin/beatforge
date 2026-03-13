# BeatForge Research Corpus -- Topic Cross-Reference Index

**Purpose:** Map every major concept to specific file locations.
**Last updated:** March 13, 2026

---

## A. TECHNICAL CONCEPTS

### Web Audio API
- **AudioContext** (lifecycle, states, autoplay policy, suspend/resume): `technical/web-audio-dsp-reference.md` Section 1 (lines 10-88)
- **Audio Graph Architecture** (nodes, fan-out, fan-in, mixer pattern): `technical/web-audio-dsp-reference.md` Section 2 (lines 90-166)
- **AudioParam** (a-rate vs k-rate, automation timeline, setValueAtTime, ramps, setTargetAtTime, setValueCurveAtTime, cancel): `technical/web-audio-dsp-reference.md` Section 3 (lines 168-267)
- **AudioWorklet** (architecture, setup, render quantum, memory management, MessagePort, SharedArrayBuffer, ring buffer): `technical/web-audio-dsp-reference.md` Section 4 (lines 270-500+)
- **OfflineAudioContext** (bounce/export): `technical/web-audio-dsp-reference.md` (later sections)
- **AnalyserNode** (FFT, waveform, frequency data): `technical/web-audio-dsp-reference.md` (later sections)
- **iOS Safari workarounds** (silent buffer unlock): `technical/web-audio-dsp-reference.md` lines 63-72

### DSP (Digital Signal Processing)
- **Filters** (BiquadFilterNode: lowpass, highpass, bandpass, notch, allpass, peaking, lowshelf, highshelf): `technical/web-audio-dsp-reference.md` (processing sections)
- **Envelopes** (ADSR, setTargetAtTime, exponentialRamp): `technical/web-audio-dsp-reference.md` Section 3
- **Oscillators** (OscillatorNode, waveforms, detune, FM synthesis): `technical/web-audio-dsp-reference.md` (source sections)
- **Noise generation** (white, pink, brown): `technical/web-audio-dsp-reference.md` (synthesis sections)
- **Distortion** (WaveShaperNode, curve generation): `technical/web-audio-dsp-reference.md` (processing sections)
- **Compression** (DynamicsCompressorNode, threshold, ratio, knee, attack, release): `technical/web-audio-dsp-reference.md` (processing sections)
- **Reverb** (ConvolverNode, impulse responses): `technical/web-audio-dsp-reference.md` (processing sections)
- **Delay** (DelayNode, feedback delay, ping-pong): `technical/web-audio-dsp-reference.md` (processing sections)

### MIDI
- **Protocol fundamentals** (status bytes, data bytes, running status): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 1 (lines 26-118)
- **Channel voice messages** (Note On/Off, CC, Program Change, Pitch Bend, Aftertouch): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 2 (lines 120-234)
- **System messages** (SysEx, Real-Time, Common): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 3 (lines 236-306)
- **GM Drum Map** (notes 27-81, complete table + JS object): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 4 (lines 308-404)
- **Velocity** (ranges, curves: linear/log/exp/S-curve, drum context): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 5 (lines 406-470)
- **CC Reference** (complete 0-127 table): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 6 (lines 472-500+)
- **MIDI Clock** (24 PPQN, Start/Stop/Continue, Song Position): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 7
- **Web MIDI API** (requestMIDIAccess, inputs/outputs, onmidimessage): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 10-11
- **.mid file format** (header chunk, track chunk, delta time, variable-length quantity): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 12-13
- **MIDI 2.0**: `technical/MIDI_TECHNICAL_REFERENCE.md` Section 9
- **MIDI Learn**: `technical/MIDI_TECHNICAL_REFERENCE.md` Section 11 + `technical/drum-machine-keyboard-reference.md`

### Synthesis (Drum Sound Design)
- **808 kick** (sine oscillator + pitch envelope + noise layer): `technical/web-audio-dsp-reference.md` (synthesis recipes section)
- **909 snare** (noise + tone oscillators, bandpass filter): `technical/web-audio-dsp-reference.md` (synthesis recipes)
- **FM synthesis** (frequency modulation for metallic sounds): `technical/web-audio-dsp-reference.md` (synthesis recipes)
- **Karplus-Strong** (plucked string/physical modeling): `technical/web-audio-dsp-reference.md` (synthesis recipes)
- **Physical modeling**: `technical/web-audio-dsp-reference.md` (synthesis recipes)
- **MembraneSynth** (Tone.js): `technical/WEB_AUDIO_REFERENCE.md` Tone.js section
- **MetalSynth** (Tone.js): `technical/WEB_AUDIO_REFERENCE.md` Tone.js section
- **NoiseSynth** (Tone.js): `technical/WEB_AUDIO_REFERENCE.md` Tone.js section

### Tone.js
- **Transport** (BPM, scheduling, loop, timeline events): `technical/WEB_AUDIO_REFERENCE.md` Tone.js Deep Dive section
- **MembraneSynth, MetalSynth, NoiseSynth**: `technical/WEB_AUDIO_REFERENCE.md` Tone.js instruments
- **Player** (sample playback): `technical/WEB_AUDIO_REFERENCE.md` Tone.js section
- **Sequence, Part, Pattern**: `technical/WEB_AUDIO_REFERENCE.md` Tone.js section

### WAM 2.0 (Web Audio Modules)
- **What WAM is** (VST equivalent for browsers): `technical/WEB_AUDIO_REFERENCE.md` Section 1 (lines 15-43)
- **Architecture** (dual-thread, WamNode/WamProcessor/WamEnv/WamGroup): `technical/WEB_AUDIO_REFERENCE.md` Section 2 (lines 44-193)
- **Plugin API** (parameter system, WamDescriptor): `technical/WEB_AUDIO_REFERENCE.md` Section 3 (lines 194-280)
- **WAM Events** (MIDI, automation, transport, SysEx, MPE, OSC): `technical/WEB_AUDIO_REFERENCE.md` Section 4 (lines 282-388)
- **Creating a plugin from scratch** (SDK, project structure, index.js, processor.js): `technical/WEB_AUDIO_REFERENCE.md` Section 5 (lines 390-500+)

### Polyrhythmic Sequencer Architecture
- **Complete design document**: `technical/polyrhythmic-sequencer-architecture.md`
  - AtomicPattern data model (variable stepCount, stepsPerBeat, beatGrouping, micro-timing, probability): Part II §2
  - Stack operator (simultaneous polyrhythm, LCM super-cycle calculation): Part II §3
  - Chain operator (sequential composition — Zencir, song mode): Part II §3
  - Scheduling engine (cursor-per-track, lookahead scheduler, TypeScript): Part III §4
  - Swing/shuffle per-track implementation: Part III §4
  - UI visualization strategies (linear grid, circular/radial, chain view): Part IV §5
  - Beat grouping system (color-coded, interactive): Part V §6
  - World rhythm coverage table (what traditions this handles): Part VI §7
  - Progressive disclosure (4 levels from basic to full polyrhythm): Part VI §8
  - Performance analysis (memory, scheduling, audio timing): Part VII §9
  - JSON pattern format (compatible with research notation): Part VII §10
  - Euclidean rhythm generation (Bjorklund algorithm): Part VII §11
  - Phase mapping (which features in which phase): Part VIII §12

### PWA (Progressive Web App)
- **Web App Manifest** (all fields, icons, shortcuts, screenshots): `technical/pwa-audio-reference.md` Section 1.1 (lines 8-190)
- **Service Worker** (lifecycle: install, activate, fetch): `technical/pwa-audio-reference.md` Section 1.2 (lines 192-313)
- **Caching strategies** (cache-first, network-first, stale-while-revalidate): `technical/pwa-audio-reference.md` Section 1.3 (lines 317-411)
- **Workbox**: `technical/pwa-audio-reference.md` Section 1.4 (lines 414-500)
- **Offline audio** (IndexedDB for samples, Cache API for app shell): `technical/pwa-audio-reference.md` (later sections)
- **Media Session API** (lock screen controls, metadata): `technical/pwa-audio-reference.md` (later sections)
- **Wake Lock API** (prevent screen sleep during performance): `technical/pwa-audio-reference.md` (later sections)
- **Background Sync**: `technical/pwa-audio-reference.md` Section 1.4 (Workbox)
- **File handling** (import WAV/MIDI): `technical/pwa-audio-reference.md` manifest section
- **Share Target**: `technical/pwa-audio-reference.md` manifest section

### Scheduling
- **Lookahead pattern** (setTimeout + audioContext.currentTime): `technical/web-audio-dsp-reference.md` (scheduling section)
- **Swing** (implementation: delay 2nd/4th 16th notes, percentages 50-67%): `patterns/western-genres.md` lines 2886-2893
- **Groove templates**: `technical/drum-machine-practice-methodology.md`
- **Tempo/BPM**: `technical/WEB_AUDIO_REFERENCE.md` (Tone.js Transport), `technical/MIDI_TECHNICAL_REFERENCE.md` Section 7 (MIDI clock)

### Export
- **WAV** (OfflineAudioContext bounce): `technical/web-audio-dsp-reference.md` (export section)
- **MP3** (encoding libraries): `technical/web-audio-dsp-reference.md` (export section)
- **MIDI** (.mid file generation): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 13
- **Stems** (per-channel offline render): `technical/web-audio-dsp-reference.md` (export section)

### Visualization
- **Waveform display** (AnalyserNode getByteTimeDomainData): `technical/web-audio-dsp-reference.md`
- **Spectrum/FFT** (AnalyserNode getByteFrequencyData): `technical/web-audio-dsp-reference.md`
- **Level meters** (SharedArrayBuffer + AudioWorklet for real-time RMS/peak): `technical/web-audio-dsp-reference.md` lines 416-462

---

## B. INSTRUMENTS & SOUNDS

### Kick Drums
- **808 kick** (synthesis): `technical/web-audio-dsp-reference.md` (synthesis recipes)
- **909 kick**: `technical/web-audio-dsp-reference.md` (synthesis recipes)
- **Acoustic kick**: GM note 35-36 in `technical/MIDI_TECHNICAL_REFERENCE.md` Section 4
- **Log drum** (Amapiano): `patterns/western-genres.md` lines 2266-2304 (Amapiano patterns)

### Snare Drums
- **909 snare** (synthesis): `technical/web-audio-dsp-reference.md` (synthesis recipes)
- **Acoustic snare**: GM note 38, `technical/MIDI_TECHNICAL_REFERENCE.md` Section 4
- **Electric snare**: GM note 40
- **Side stick/rimshot**: GM note 37
- **Ghost notes** (velocity 25-45): `patterns/western-genres.md` lines 37-41

### Hi-Hats
- **Closed/Open/Pedal** (GM notes 42, 46, 44): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 4
- **MetalSynth** (Tone.js hi-hat synthesis): `technical/WEB_AUDIO_REFERENCE.md`
- **Hi-hat patterns by genre**: `patterns/western-genres.md` (throughout)

### Claps
- **Hand clap** (GM note 39): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 4
- **Clap patterns in house/techno/pop**: `patterns/western-genres.md`

### Toms / Congas
- **Toms** (GM notes 41, 43, 45, 47, 48, 50): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 4
- **Congas** (GM notes 62-64, mute/open/low): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 4
- **Tom fills**: `patterns/western-genres.md` Section 4.6 (lines 1665-1697)

### Cowbell
- **GM note 56**: `technical/MIDI_TECHNICAL_REFERENCE.md` Section 4
- **In Afrobeat patterns**: `patterns/western-genres.md` pattern 93
- **In Phonk**: `patterns/western-genres.md` pattern 157

### Cymbals
- **Crash** (GM notes 49, 57), **Ride** (51, 59), **Ride Bell** (53), **Splash** (55), **Chinese** (52): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 4

### Tabla
- **Technique and bols** (Na, Ta, Tin, Ge, Ghe, Dha, Dhin, Ti, Re, Ke): `musicology/indian-subcontinent.md` Section 2
- **Grid patterns** (Tintal, Keherwa, Dadra, etc.): `patterns/turkish-arabic-indian.md` (Part 3 -- Indian section)

### Djembe / Dundun
- **Technique** (Tone, Slap, Bass): `patterns/african-ensembles.md` Part II intro (lines 455-458)
- **Full ensemble patterns** (Kuku, Soli, Dununba, Tiriba, Yankadi, Makru, etc.): `patterns/african-ensembles.md` patterns 8-15
- **Dundun family** (kenkeni, sangban, dundunba): `patterns/african-ensembles.md` Part II
- **Cultural context**: `musicology/west-african-traditions.md`

### Darbuka / Tombak / Daf
- **Darbuka** (Doum/Tek/Ka technique): `patterns/turkish-arabic-indian.md` notation key (lines 9-17)
- **Tombak** (Persian goblet drum, 30+ distinct strokes): `musicology/persian-iranian-traditions.md` Part III
- **Daf** (Sufi frame drum, Kurdish/Persian): `musicology/persian-iranian-traditions.md` Part IV
- **Arabic patterns** (Maqsoum, Baladi, Saidi, etc.): `patterns/turkish-arabic-indian.md` Part 2 (lines 652-999+)

### Taiko
- **Types** (nagado-daiko, shime-daiko, odaiko, okedo-daiko): `musicology/japanese-traditions.md` Section 5
- **Notation and patterns** (don, ka, doko, su, jiuchi base rhythms): `musicology/japanese-traditions.md` Section 6
- **Historical/cultural context**: `musicology/japanese-traditions.md` Section 4
- **Also in**: `musicology/east-asian-traditions.md` (Japan sections)

### Gamelan
- **Instruments** (saron, demung, peking, bonang, gender, gambang, gong ageng, kenong, kempul, kethuk, kendhang): `patterns/gamelan-southeast-asian.md` Section 5 (lines 156-269)
- **Colotomic patterns**: `patterns/gamelan-southeast-asian.md` Section 6 (lines 271-500)
- **Cultural context**: `musicology/gamelan-southeast-asian.md`

### Cajon
- **In flamenco context**: `musicology/andean-south-american.md` (Peru section)
- **Afro-Peruvian cajon**: `musicology/andean-south-american.md` Peru section

### Berimbau
- **Notation** (din, ton, buzz): `musicology/brazilian-traditions.md` notation key (line 28-31)
- **Capoeira context**: `musicology/brazilian-traditions.md` (capoeira section)

### Frame Drums
- **Daf** (Persian): `musicology/persian-iranian-traditions.md` Part IV
- **Bendir** (North African): referenced in `patterns/turkish-arabic-indian.md` Arabic sections
- **Bodhran** (Irish): referenced in `musicology/balkan-traditions.md`
- **Riq** (Arabic tambourine): referenced in Arabic sections of `patterns/turkish-arabic-indian.md`

### Steelpan
- **Trinidad origins and context**: `musicology/afro-cuban-caribbean-latin.md` (Trinidad section)

### Korean Percussion (Samulnori)
- **Kkwaenggwari, jing, janggu, buk**: `musicology/east-asian-traditions.md` Section 1 (lines 54-80)
- **Changdan patterns**: `musicology/east-asian-traditions.md` Section 3

### Chinese Percussion
- **Instruments** (tanggu, paigu, bo, naobo, muyu, bangzi, luo, yunluo): `musicology/chinese-traditions.md` Part II
- **Opera percussion** (luogu jing): `musicology/chinese-traditions.md` Part III
- **Lion/dragon dance drumming**: `musicology/chinese-traditions.md` Part IV

---

## C. RHYTHMIC CONCEPTS

### Clave
- **Son clave** (3-2 and 2-3): `patterns/world-cross-cultural.md` Section 2.1 (lines 287-311)
- **Rumba clave** (3-2 and 2-3): `patterns/world-cross-cultural.md` Section 2.2 (lines 314-339)
- **Bossa clave**: `patterns/western-genres.md` pattern 60 (Bossa Nova) + pattern 203
- **12/8 rumba clave / bell pattern**: `musicology/caribbean-colombia-mexico.md` lines 84-95
- **Clave concept explained**: `patterns/world-cross-cultural.md` Part 2 intro (lines 271-284)
- **Clave in salsa ensemble**: `patterns/world-cross-cultural.md` Section 2.8 (lines 480-500)

### Swing / Shuffle
- **Swing percentages** (50% straight to 67% full triplet): `patterns/western-genres.md` lines 2886-2893
- **MPC groove / Dilla feel**: `patterns/western-genres.md` Section 3.5 (lines 1372-1413)
- **Blues shuffle**: `patterns/western-genres.md` Section 1.3 (lines 215-278)
- **Purdie shuffle**: `patterns/western-genres.md` pattern 210 (lines 2783-2793)
- **Porcaro/Rosanna half-time shuffle**: `patterns/western-genres.md` pattern 211 (lines 2795-2805)
- **Implementation in code**: `patterns/western-genres.md` lines 2886-2893

### Polyrhythm vs Polymeter
- **3:2, 4:3 cross-rhythms**: `patterns/world-cross-cultural.md` Section 1.6 (lines 225-267)
- **3:2 hemiola as African foundation**: `patterns/african-ensembles.md` Rhythmic Concepts section 3 (lines 22-23)
- **Polymetric patterns** (Meshuggah-style 23/16 over 4/4): `patterns/western-genres.md` Section 3.4 (lines 1331-1368)
- **In practice methodology**: `technical/drum-machine-practice-methodology.md` (polyrhythm training section)

### Aksak / Asymmetric Meters
- **Turkish aksak concept** (2+2+2+3 grouping): `technical/turkish-rhythmic-systems-reference.md`, `patterns/turkish-arabic-indian.md` pattern 6
- **Balkan aksak** (Brailoiu's bichronicity, S+L ratios): `musicology/balkan-traditions.md` Sections 2-3 (lines 55-100)
- **Bulgarian odd meters** (7/8 to 22/16): `musicology/balkan-traditions.md` Section 5
- **Practical patterns**: 5/8: `patterns/turkish-arabic-indian.md` pattern 9; 7/8: patterns 11, 19; 9/8: patterns 3-6, 18; 10/8: pattern 22

### Colotomic Structure
- **Full explanation**: `patterns/gamelan-southeast-asian.md` Section 5 (lines 147-269)
- **Notation for all forms** (lancaran, ketawang, ladrang, merong, srepegan, sampak): `patterns/gamelan-southeast-asian.md` Section 6 (lines 271-500)
- **Cultural context**: `musicology/gamelan-southeast-asian.md`

### Tala System (Indian)
- **What tala is** (cyclical time, sam, khali, vibhag): `musicology/indian-subcontinent.md` Section 2.1 (lines 88-100)
- **Specific talas** (Tintal 16 beats, Jhaptal 10, Rupak 7, Ektaal 12, Dadra 6, Keherwa 8): `musicology/indian-subcontinent.md` Section 2, `patterns/turkish-arabic-indian.md` Part 3
- **Carnatic tala**: `musicology/indian-subcontinent.md` Section 3

### Usul System (Ottoman/Turkish)
- **What usul is** (named cyclical rhythmic pattern, Düm/Tek strokes): `technical/turkish-rhythmic-systems-reference.md` Part I
- **Complete usul patterns**: `patterns/turkish-arabic-indian.md` Part 1 (patterns 1-24)
- **Simple usul** (2-10 beats): Nim Sofyan, Sofyan, Düyek, Turk Aksagi, Yuruk Semai, Aksak
- **Compound usul** (10+ beats): Curcuna (10/8), Cengi (8/4), and longer forms in `technical/turkish-rhythmic-systems-reference.md`

### Iqa'at (Arabic Rhythmic Modes)
- **Maqsoum, Baladi, Saidi, Masmoudi, Fallahi, Wahda, Ayoub, Malfuf, Dabke**: `patterns/turkish-arabic-indian.md` Part 2 (patterns 25-45+)
- **Cultural context**: references throughout Arabic sections

### Timeline / Bell Patterns
- **Standard West African bell** (x.x.xx.x.xx. -- 2+2+1+2+2+2+1): `patterns/world-cross-cultural.md` Section 1.1 (lines 47-70), `patterns/african-ensembles.md` pattern 1 (Agbekor bell)
- **Gahu bell**: `patterns/african-ensembles.md` pattern 2, `patterns/world-cross-cultural.md` Section 1.2
- **Highlife bell/guitar pattern**: `patterns/world-cross-cultural.md` Section 1.4 (lines 151-173)
- **Kpanlogo bell**: `patterns/african-ensembles.md` pattern 3, `patterns/world-cross-cultural.md` Section 1.3
- **Bembe bell** (Afro-Cuban 6/8): `patterns/world-cross-cultural.md` Section 2.5 (lines 394-418)
- **Concept explained**: `patterns/african-ensembles.md` Rhythmic Concepts section 1 (lines 14-17)

### Micro-Timing
- **African "in-between" feel** (uneven subdivisions): `patterns/african-ensembles.md` Rhythmic Concepts section 4 (lines 25-27)
- **J Dilla "drunk drums"** (pushing/dragging off grid): `patterns/western-genres.md` Section 3.5 (lines 1372-1413)
- **Questlove drag beat**: `patterns/western-genres.md` pattern 65 (lines 885-896)

### Humanization
- **Velocity variation guidelines**: `patterns/western-genres.md` lines 2896-2899
- **Ghost notes** (velocity 25-45): throughout pattern files
- **Practice approach**: `technical/drum-machine-practice-methodology.md`

### Tresillo (3+3+2)
- **Definition and global spread**: `patterns/world-cross-cultural.md` Section 2.3 (lines 343-370)
- **Habanera variant**: `patterns/world-cross-cultural.md` lines 360-365
- **In reggaeton kick**: `patterns/western-genres.md` pattern 178 (line 2358)
- **As hemiola within 8 pulses**: `patterns/world-cross-cultural.md` Section 1.6 (lines 257-266)

### Euclidean Rhythms
- Referenced conceptually in `technical/drum-machine-practice-methodology.md` and relates to the additive rhythm concept in `patterns/african-ensembles.md` section 6

### Parameter Locks
- Concept applicable to step sequencer: `patterns/western-genres.md` (per-step velocity notation throughout)

### Conditional Triggers
- Referenced in `technical/drum-machine-practice-methodology.md` (random mute exercises)

---

## D. REGIONS & CULTURES

### West Africa
- **Ghana (Ewe, Ga, Akan)**: `patterns/african-ensembles.md` Part I (Agbekor, Gahu, Kpanlogo, Bobobo, Atsiagbekor, Gadzo, Tokoe); `patterns/world-cross-cultural.md` Part 1; `musicology/west-african-traditions.md`
- **Nigeria (Yoruba)**: `patterns/african-ensembles.md` Part III (Bata/Shango, Dundun); `musicology/west-african-traditions.md`
- **Guinea (Malinke/Mande)**: `patterns/african-ensembles.md` Part II (Kuku, Soli, Dununba, Tiriba, Yankadi, Makru, Djansa, Sunu); `patterns/world-cross-cultural.md` Section 1.5
- **Senegal**: `patterns/african-ensembles.md` (Sabar patterns); `musicology/west-african-traditions.md`
- **Mali**: `musicology/west-african-traditions.md` (griot tradition)

### East Africa (Kenya, Tanzania)
- Referenced in `musicology/west-african-traditions.md` (broader African context)

### South Africa (Amapiano, Kwaito, Gqom)
- **Amapiano patterns**: `patterns/western-genres.md` patterns 171-173 (lines 2266-2304)
- **Context**: `musicology/electronic-hiphop-funk-reggae.md` (modern African electronic music context)

### North Africa (Morocco, Algeria, Tunisia)
- **Gnawa rhythms**: referenced in `patterns/turkish-arabic-indian.md` (broader Arabic section)
- **Chaabi**: related patterns in `patterns/turkish-arabic-indian.md` Arabic section

### Cuba
- **Santeria/bata drumming**: `musicology/caribbean-colombia-mexico.md` Section 3 (lines 30-95)
- **Rumba**: `musicology/caribbean-colombia-mexico.md`
- **Son, salsa, mambo, cha-cha-cha, timba**: `musicology/caribbean-colombia-mexico.md`; `patterns/world-cross-cultural.md` Section 2.8
- **Clave patterns**: `patterns/world-cross-cultural.md` Sections 2.1-2.2
- **Mozambique, Songo**: `patterns/world-cross-cultural.md` Sections 2.6-2.7
- **Abakua**: `musicology/caribbean-colombia-mexico.md` Section 4

### Jamaica
- **Reggae patterns** (one drop, rockers, steppers): `patterns/western-genres.md` Section 1.5 (lines 357-435)
- **Ska patterns**: `patterns/western-genres.md` Section 1.6 (lines 437-499)
- **Cultural history** (mento, ska, rocksteady, reggae, dancehall, dub): `musicology/afro-cuban-caribbean-latin.md`; `musicology/electronic-hiphop-funk-reggae.md`

### Trinidad
- **Calypso, steelpan, soca**: `musicology/afro-cuban-caribbean-latin.md` (Trinidad section)

### Haiti
- **Vodou drumming**: `musicology/afro-cuban-caribbean-latin.md` (Haiti section)

### Puerto Rico
- **Bomba, plena**: `musicology/afro-cuban-caribbean-latin.md` (Puerto Rico section)
- **Reggaeton/dembow**: `patterns/western-genres.md` Section 5.8 (lines 2308-2369)

### Brazil
- **All traditions**: `musicology/brazilian-traditions.md` (1,993 lines)
- **Samba patterns**: `patterns/western-genres.md` pattern 204 (lines 2700-2708)
- **Bossa nova patterns**: `patterns/western-genres.md` patterns 60, 203
- **Candomble, baiao, forro, maracatu, capoeira**: `musicology/brazilian-traditions.md`

### Colombia
- **Cumbia, vallenato, champeta, currulao**: `musicology/caribbean-colombia-mexico.md`

### Mexico
- **Son jarocho, huapango, norteno, banda**: `musicology/caribbean-colombia-mexico.md`

### Argentina
- **Tango, milonga, chacarera, zamba**: `musicology/andean-south-american.md` Part V

### Peru
- **Festejo, lando, marinera, cajon origins**: `musicology/andean-south-american.md` Part III

### Bolivia
- **Tinku, morenada, diablada, caporal**: `musicology/andean-south-american.md` Part IV

### Chile
- **Cueca, nueva cancion**: `musicology/andean-south-american.md` Part VI

### Venezuela
- **Joropo, gaita, tambor**: `musicology/andean-south-american.md` Part IX

### Uruguay
- **Candombe, murga**: `musicology/andean-south-american.md` Part VII

### Turkey
- **Ottoman usul system**: `technical/turkish-rhythmic-systems-reference.md`; `patterns/turkish-arabic-indian.md` Part 1 (24 patterns)
- **Folk rhythms** (Halay, Zeybek, Horon, Karsilama, Roman Havasi): `patterns/turkish-arabic-indian.md` patterns 3-5, 17-19
- **Modern Turkish** (Arabesk, Anatolian Rock, Pop): `patterns/turkish-arabic-indian.md` patterns 13-16

### Arabic / Middle East
- **Egypt** (Maqsoum, Baladi, Saidi, Masmoudi, Fallahi, Shaabi, Zaffa): `patterns/turkish-arabic-indian.md` patterns 25-32
- **Levant** (Lebanon, Syria, Palestine, Jordan -- Dabke): `patterns/turkish-arabic-indian.md` patterns 37-38
- **Pan-Arab** (Ayoub, Malfuf, Wahda): `patterns/turkish-arabic-indian.md` patterns 33-36
- **Sufi/spiritual** (Ayoub in zar/dhikr): `patterns/turkish-arabic-indian.md` pattern 33

### Iran / Persia
- **Complete tradition**: `musicology/persian-iranian-traditions.md` (1,301 lines)
- **Tombak, daf, zarb**: `musicology/persian-iranian-traditions.md` Parts III-V
- **Rhythmic patterns notated**: `musicology/persian-iranian-traditions.md` Part VII

### India
- **Hindustani** (tabla, tala system): `musicology/indian-subcontinent.md` Section 2; `patterns/turkish-arabic-indian.md` Part 3
- **Carnatic** (mridangam, konnakol): `musicology/indian-subcontinent.md` Section 3
- **Bollywood**: `musicology/indian-subcontinent.md` Section 6
- **Folk** (dhol, dholak): `musicology/indian-subcontinent.md` Section 4

### Balkans
- **Bulgaria** (odd meters, horo): `musicology/balkan-traditions.md` Section 5
- **Romania** (lautari, cimbalom): `musicology/balkan-traditions.md` Section 6
- **Serbia** (kolo, brass bands): `musicology/balkan-traditions.md` Section 7
- **Greece** (rebetiko, zebekiko, kalamatianos, hasapiko): `musicology/balkan-traditions.md` Section 8
- **Albania**: `musicology/balkan-traditions.md` Section 10
- **Bosnia**: `musicology/balkan-traditions.md` Section 11
- **Pattern notation** (all meters): `musicology/balkan-traditions.md` Section 15

### Japan
- **Complete tradition**: `musicology/japanese-traditions.md` (1,149 lines)
- **Taiko** (history, instruments, patterns): `musicology/japanese-traditions.md` Sections 4-6
- **Gagaku**: `musicology/japanese-traditions.md` Section 1
- **Noh, Kabuki**: `musicology/japanese-traditions.md` Sections 2-3
- **Also in**: `musicology/east-asian-traditions.md` (Japan sections 9-19)

### Korea
- **Samulnori**: `musicology/east-asian-traditions.md` Section 1 (lines 54-80)
- **Pungmul/Nongak**: `musicology/east-asian-traditions.md` Section 2 (lines 83-100)
- **Changdan patterns**: `musicology/east-asian-traditions.md` Section 3
- **K-pop**: `musicology/east-asian-traditions.md` Section 8

### China
- **Complete tradition**: `musicology/chinese-traditions.md` (976 lines)
- **Opera percussion**: `musicology/chinese-traditions.md` Part III
- **Lion/dragon dance**: `musicology/chinese-traditions.md` (Part IV)
- **Also in**: `musicology/east-asian-traditions.md` (China sections 24-27)

### Mongolia
- **Complete tradition**: `musicology/mongolian-traditions.md` (1,550 lines)
- **Horse gait rhythms**: `musicology/mongolian-traditions.md` Part IV
- **Shaman drumming**: `musicology/mongolian-traditions.md`

### Indonesia (Java, Bali)
- **Javanese gamelan** (patterns): `patterns/gamelan-southeast-asian.md`
- **Javanese gamelan** (culture): `musicology/gamelan-southeast-asian.md` Part I
- **Balinese gamelan** (kotekan, kebyar): `musicology/gamelan-southeast-asian.md` Part II; `patterns/gamelan-southeast-asian.md`
- **Also in**: `musicology/east-asian-traditions.md` Section 20

### Vietnam
- **Dong Son bronze drums, nha nhac, ca tru, cheo**: `musicology/vietnam-cambodia-malaysia.md` Part I (lines 1-80)

### Cambodia
- **Khmer classical, pinpeat ensemble, apsara dance**: `musicology/vietnam-cambodia-malaysia.md` (Cambodia section)

### Malaysia
- **Gamelan Melayu, kompang, joget**: `musicology/vietnam-cambodia-malaysia.md` (Malaysia section)

### Thailand
- **Thai percussion**: `musicology/gamelan-southeast-asian.md` Part IV; `musicology/east-asian-traditions.md` Section 22

### Myanmar
- **Hsaing-waing ensemble**: `musicology/gamelan-southeast-asian.md` Part V

### Philippines
- **Kulintang**: `musicology/east-asian-traditions.md` Section 21; `musicology/gamelan-southeast-asian.md` Part VII

---

## E. GENRES

### Electronic
- **House** (classic, deep, tech, acid): `patterns/western-genres.md` Section 5.1 (patterns 131-137, lines 1739-1831)
- **Techno** (Detroit, Berlin, industrial, minimal): `patterns/western-genres.md` Section 5.2 (patterns 138-144, lines 1834-1920)
- **Drum and Bass** (two-step, Amen, liquid, neurofunk, jungle): `patterns/western-genres.md` Section 5.3 (patterns 145-150, lines 1923-1995)
- **Dubstep** (classic, brostep, deep, riddim): `patterns/western-genres.md` Section 5.6 (patterns 164-168, lines 2173-2234)
- **Trance**: `patterns/western-genres.md` pattern 208 (lines 2757-2766)
- **IDM**: aspects in math rock and fusion sections
- **History/context**: `musicology/electronic-hiphop-funk-reggae.md` (TR-808, TR-909, house/techno origins)
- **Complete electronic music history** (pre-history through 2026): `musicology/electronic-music-history.md`
  - Early pioneers (musique concrète, Moog, Buchla, BBC Radiophonic Workshop): Part I §1-3
  - Synth-pop (Depeche Mode, New Order, Human League, Gary Numan): Part II §5
  - Industrial/EBM (Throbbing Gristle, DAF, Front 242, NIN): Part II §6
  - Italo disco / Hi-NRG (Robotnick, Bobby O, Patrick Cowley): Part II §7
  - Deep house / garage house (Larry Heard, Kerri Chandler, Masters at Work): Part II §8
  - Ambient (Eno, The Orb, KLF, Aphex Twin): Part II §9
  - French touch / filter house (Daft Punk, Cassius): Part II §10
  - Minimal techno / microhouse (Richie Hawtin, Villalobos, Kompakt): Part II §11
  - Berlin School / progressive electronic (Tangerine Dream, Jarre, Vangelis): Part I §4
  - Instruments genealogy (synth + drum machine timeline tables): Part IV §16
  - Movements (Second Summer of Love, superclub era, Ibiza, Berlin): Part III §12-15
  - Current landscape 2024-2026 (post-pandemic, AI, modular revival, genre map): Part V §17-18
  - Queer culture and electronic music: Part VII §22
- **Electronic patterns** (32 additional): `patterns/electronic-history.md`
  - Synth-pop, EBM, industrial, Italo disco, Hi-NRG, deep house, garage house, French touch, minimal techno, microhouse, ambient house, trip-hop, progressive trance, psytrance, gabber, happy hardcore, motorik, Berlin School, melodic techno, organic house, hard techno revival, breaks revival, neo-rave, lo-fi house, electro (1980s), Eurodance, EDM/big room, Balearic, Berghain-style
- **Global/regional electronic scenes**: `musicology/global-electronic-scenes.md`
  - SE Asian (budots, funkot, vinahouse, manyao, electronic mor lam): Part I
  - Latin American (reggaeton evolution, tribal guarachero, cumbia digital, baile funk): Part II
  - African (amapiano, Afrobeats production, gqom, gengetone, singeli): Part III
- **Underground electronic movements**: `musicology/underground-electronic-movements.md`
  - MENA (mahraganat, electronic dabke, shamstep, Iranian underground): §MENA
  - South Asian (Indian bass, Mumbai grime, Pakistani electronic): §South Asia
  - East/SE Asian (Shanghai/Beijing, Thai electronic, Cambodian space disco): §East Asia
  - Latin underground (ZZK/digital folklore, neo-perreo, guaracha, sonidero): §Latin America
  - African underground (balani show, logobi, Afro-house, shangaan electro, kuduro): §Africa
  - Eastern European (disco polo, Russian hardbass, rominimal, Georgian techno): §Eastern Europe
  - Experimental (hyperpop, deconstructed club): §Experimental

### Hip-Hop
- **Boom bap**: `patterns/western-genres.md` patterns 151-152 (lines 2001-2023)
- **Trap**: patterns 154-155 (lines 2038-2061)
- **UK Drill**: pattern 156 (lines 2063-2073)
- **Lo-fi**: pattern 153 (lines 2025-2036)
- **Phonk**: pattern 157 (lines 2075-2086)
- **Grime**: referenced in UK Garage section
- **J Dilla style**: `patterns/western-genres.md` Section 3.5 (patterns 101-103, lines 1372-1413)
- **History**: `musicology/electronic-hiphop-funk-reggae.md` (breakbeats, MPC, sampling)

### Funk
- **Funk patterns**: `patterns/western-genres.md` Section 2.1 (patterns 48-55, lines 659-758)
- **Funky Drummer** (Clyde Stubblefield): patterns 48-49, also pattern 182 (classic breakbeats)
- **Tower of Power, Parliament, Cissy Strut**: patterns 50-55
- **History** (James Brown, "The One," New Orleans, P-Funk): `musicology/electronic-hiphop-funk-reggae.md` Part I

### Disco
- **Patterns**: `patterns/western-genres.md` Section 2.6 (patterns 80-84, lines 1077-1142)
- **"I Feel Love" style**: pattern 82

### Jazz
- **Basic swing, medium swing, bebop, waltz, bossa, brush, Latin**: `patterns/western-genres.md` Section 2.2 (patterns 56-62, lines 762-855)
- **Jazz fusion**: Section 3.1 (patterns 85-88, lines 1150-1199) + Section 3.6 (patterns 104-106, lines 1416-1453)

### R&B / Neo-Soul
- **Patterns**: `patterns/western-genres.md` Section 2.3 (patterns 63-68, lines 857-933)
- **Questlove, D'Angelo, broken beat**: patterns 65-67

### Reggae / Ska / Dancehall / Dub
- **Reggae** (one drop, rockers, steppers): `patterns/western-genres.md` Section 1.5 (patterns 25-30)
- **Ska** (offbeat, 2-tone, punk): Section 1.6 (patterns 31-35)
- **History**: `musicology/electronic-hiphop-funk-reggae.md` (reggae/dub/dancehall section); `musicology/afro-cuban-caribbean-latin.md` (Jamaica)

### Rock / Pop / Metal / Punk
- **Rock**: `patterns/western-genres.md` Section 1.1 (patterns 1-7)
- **Pop**: Section 1.2 (patterns 8-13)
- **Punk**: Section 1.7 (patterns 36-40)
- **Metal** (standard, double bass, gallop, blast beat, djent): Section 1.8 (patterns 41-47)
- **Progressive Rock** (5/4, 7/8, 9/8, 15/8): Section 2.5 (patterns 74-79)
- **Math Rock** (11/8, 13/8, alternating meters): Section 3.3 (patterns 94-97)

### Afro-Cuban / Salsa / Son / Mambo / Cha-cha-cha / Timba
- **Patterns**: `patterns/world-cross-cultural.md` Part 2 (all sections)
- **Clave**: Sections 2.1-2.2
- **Cascara**: Section 2.4
- **Full salsa ensemble**: Section 2.8
- **Songo**: Section 2.7
- **Mozambique**: Section 2.6
- **History**: `musicology/afro-cuban-caribbean-latin.md`; `musicology/caribbean-colombia-mexico.md`

### Brazilian (Samba, Bossa Nova, Baiao, Forro, Maracatu)
- **Samba pattern**: `patterns/western-genres.md` pattern 204
- **Bossa nova pattern**: patterns 60, 203
- **All Brazilian rhythms (deep)**: `musicology/brazilian-traditions.md`

### Cumbia / Vallenato / Champeta
- **Colombia**: `musicology/caribbean-colombia-mexico.md` (Colombia sections)

### Reggaeton / Dembow
- **Patterns**: `patterns/western-genres.md` Section 5.8 (patterns 174-178, lines 2308-2369)

### Afrobeats / Amapiano / Highlife / Juju
- **Afrobeats patterns**: `patterns/western-genres.md` patterns 169-170 (lines 2239-2264)
- **Amapiano**: patterns 171-173 (lines 2266-2304)
- **Afrobeat (Tony Allen)**: Section 3.2 (patterns 89-93, lines 1203-1270)
- **Highlife bell**: `patterns/world-cross-cultural.md` Section 1.4

### Tango / Milonga / Candombe
- **Argentina**: `musicology/andean-south-american.md` Part V
- **Uruguay (candombe)**: Part VII

### Flamenco (Cajon)
- Referenced in `musicology/andean-south-american.md` (Peru/cajon origins)

### Bollywood
- `musicology/indian-subcontinent.md` Section 6

### K-pop
- `musicology/east-asian-traditions.md` Section 8

### Country / Blues / Gospel
- **Country**: `patterns/western-genres.md` Section 1.4 (patterns 19-24)
- **Blues shuffle**: Section 1.3 (patterns 14-18)
- **Gospel**: Section 2.4 (patterns 69-73)

### UK Garage / 2-Step
- **Patterns**: `patterns/western-genres.md` Section 5.5 (patterns 159-163, lines 2104-2169)

### Classic Breakbeats
- **Amen Break, Funky Drummer, Apache, Impeach the President, Think, and more**: `patterns/western-genres.md` Section 6 (patterns 179-188, lines 2373-2498)
- **Programmed Classics** (Blue Monday, Pacific State, Strings of Life, Acid Tracks): Section 7 (patterns 189-194, lines 2501-2577)

### Econopolitics / Music Industry / Copyright
- **Complete treatment**: `musicology/econopolitics-of-music.md`
  - Format as destiny (78rpm → 45 → LP → CD → MP3 → streaming): Part I §1-7
  - Jukebox economy and payola: Part I §3
  - LP and the album cycle: Part I §4
  - CD bloat and loudness war: Part I §5
  - Napster, piracy, and industry collapse: Part I §6
  - Streaming economics (per-stream rates, pro-rata model, playlist-bait): Part I §7
  - Big band death (AFM ban, entertainment tax, TV): Part II §8
  - DJ replacing bands (labor arbitrage → superstar economy): Part II §9
  - Band economics in streaming era: Part II §10
  - Copyright origins (1909 Act, composition vs recording): Part III §11
  - Algorithmic playlist myth / modern payola (how playlists really work): Part I §8
    - Editorial vs algorithmic playlists, label relationships, playlist pitching
    - Fake artists / ghost artists controversy
    - Discovery Mode as "payola with a discount"
    - Historical parallel: 1950s radio payola table
    - Platform comparison (Spotify, Apple Music, YouTube, Tidal)
  - Copyright promoting creativity (incentives, moral rights, PROs): Part III §13
  - Copyright hindering creativity (sampling law, Blurred Lines, term extension): Part III §14
  - Jamaica counter-example (how loose copyright created a musical superpower): Part III §15
    - Riddim culture economics (zero marginal cost, risk distribution, network effects)
    - Great riddims case studies (Sleng Teng, Real Rock, Stalag, Diwali)
    - Copyright counterfactual analysis
    - Dub as product of loose copyright (King Tubby, Lee Perry, Scientist)
    - Parallels: blues, griot tradition, Irish folk, open-source software
  - Versioning tradition (why classics were sung by everyone): Part III §16
    - Pre-copyright norm (Tin Pan Alley, multiple recordings)
    - Rise of singer-songwriter and exclusivity
    - Rock and roll transition (Hound Dog, Twist and Shout, Louie Louie)
    - Creative losses from end of versioning
  - Label vs artist economics (standard deals, 360 deals, master ownership, Taylor Swift): Part III §17
  - Revenue distribution table (who gets what from $10): Part III §17
  - Geography of innovation (cheap rent theory — Detroit, Berlin, Bristol, Bronx): Part IV §18
  - Gentrification cycle: Part IV §18
  - Democratization of production (home studio cost timeline): Part V §19
  - Auto-tune/quantization as economic tools: Part V §19
  - Internet production cycles and TikTok effect: Part V §20
  - Festival economy and Live Nation monopoly: Part VI §21
  - AI disruption: Part VII §22
  - Three-major-label oligopoly: Part VII §24
  - Catalog as investment asset class: Part VII §24

---

## F. PRACTICE & EDUCATION

- **Deliberate practice theory** (Ericsson): `technical/drum-machine-practice-methodology.md` Section 1.1
- **Speed training** (incremental tempo increase): `technical/drum-machine-practice-methodology.md`
- **Random mute exercises**: `technical/drum-machine-practice-methodology.md`
- **40 PAS rudiments** (paradiddle, flam, drag, roll, etc.): `technical/drum-machine-practice-methodology.md`; `patterns/western-genres.md` Section 8 (patterns 195-202, lines 2581-2677)
- **Polyrhythm training**: `technical/drum-machine-practice-methodology.md`; `patterns/world-cross-cultural.md` Section 1.6
- **Odd meter acclimation**: `technical/drum-machine-practice-methodology.md`; `patterns/western-genres.md` Section 2.5; `musicology/balkan-traditions.md`
- **Konnakol** (Carnatic vocal percussion): `technical/drum-machine-practice-methodology.md`; `musicology/indian-subcontinent.md` Section 3
- **Groove templates**: `technical/drum-machine-practice-methodology.md`
- **Spaced repetition**: `technical/drum-machine-practice-methodology.md`

---

## G. UX / DESIGN

### Instrument Hardware UI Design
- **"One knob per function" philosophy**: `design/instrument-hardware-ui-design.md` Section 1
- **Direct manipulation / immediacy**: `design/instrument-hardware-ui-design.md` Section 1
- **Constraints as creativity** (808's 16 steps, 303's range): `design/instrument-hardware-ui-design.md` Section 1
- **TR-808/909 layout analysis** (color coding, LED states, tempo slider): `design/instrument-hardware-ui-design.md` Section 2
- **Elektron UI** (8-encoder+page, trig+encoder parameter lock gesture): `design/instrument-hardware-ui-design.md` Section 2
- **MPC pad design** (4x4, velocity, 16 Levels mode): `design/instrument-hardware-ui-design.md` Section 2
- **Maschine** (color-coded pads, dual displays, Smart Strip): `design/instrument-hardware-ui-design.md` Section 2
- **Teenage Engineering** (OP-1 minimalism, four-encoder philosophy): `design/instrument-hardware-ui-design.md` Section 2
- **Synthesizer signal flow layout** (left-to-right: osc→filter→amp): `design/instrument-hardware-ui-design.md` Section 3
- **10 design principles** (immediacy, visibility, progressive disclosure, flow state): `design/instrument-hardware-ui-design.md` Section 4
- **Accessibility in instruments** (screen readers, color-blind, motor): `design/instrument-hardware-ui-design.md` Section 5

### Music Software UI Design
- **DAW paradigms** (Ableton Session/Arrangement, FL pattern, Logic Step Sequencer, Bitwig Grid, Reason rack): `design/music-software-ui-design.md` Section 1
- **Drum machine plugins** (XO spectral browser, Battery, Geist, Arcade): `design/music-software-ui-design.md` Section 2
- **Web audio app UIs** (Splice, BandLab, Audiotool, Drumbit, Chrome Music Lab): `design/music-software-ui-design.md` Section 3
- **Mobile music apps** (Koala Sampler, GarageBand, Korg Gadget, Zenbeats): `design/music-software-ui-design.md` Section 4
- **Key UI patterns** (grid, mixer, waveform, knob, envelope, browser, transport): `design/music-software-ui-design.md` Section 5
- **Color systems in DAWs** (Ableton muted, FL neon, Push RGB encoding): `design/music-software-ui-design.md` Section 6
- **Animation and feedback** (LEDs, waveform playback, micro-interactions): `design/music-software-ui-design.md` Section 7
- **Responsive music UI** (breakpoints, touch targets, landscape/portrait): `design/music-software-ui-design.md` Section 8
- **Onboarding** (first-run, tooltips, progressive complexity, demo patterns): `design/music-software-ui-design.md` Section 12

### Visual Design Systems
- **Design languages** (skeuomorphic vs flat vs futuristic vs vintage): `design/music-visual-design-systems.md` Section 1
- **Component library spec** (buttons, knobs, faders, displays, meters, grids): `design/music-visual-design-systems.md` Section 2
- **Design tokens** (CSS custom properties for colors, typography, spacing, animation): `design/music-visual-design-systems.md` Section 2
- **Color theory for music** (state colors, velocity-as-brightness, frequency-as-hue): `design/music-visual-design-systems.md` Section 3
- **Extracted hardware palettes** (TR-808, TR-909, MPC, Push, OP-1 hex values): `design/music-visual-design-systems.md` Section 3
- **16-column musical grid layout**: `design/music-visual-design-systems.md` Section 4
- **Iconography** (standard music icons, drum machine icons, sizing): `design/music-visual-design-systems.md` Section 5
- **Step indicator styles** (circles, squares, LED states): `design/music-visual-design-systems.md` Section 6
- **Knob rendering styles** (flat arc, 3D, dot, value ring): `design/music-visual-design-systems.md` Section 6
- **Motion design** (animation timing table, 60fps budgets, GPU properties): `design/music-visual-design-systems.md` Section 7
- **Top 30 best music interfaces** (hardware, software, web, mobile): `design/music-visual-design-systems.md` Section 8

### General UX
- **Step sequencer grid** (16-step notation used throughout all pattern files): all pattern files
- **Pad interface** (MPC-style layout): `technical/drum-machine-keyboard-reference.md` Section 1
- **Keyboard mapping** (QWERTY layouts from Ableton, FL Studio, custom): `technical/drum-machine-keyboard-reference.md` Section 1.1 (lines 18-100)
- **MIDI Learn** (map hardware controllers): `technical/MIDI_TECHNICAL_REFERENCE.md` Section 11; `technical/drum-machine-keyboard-reference.md`
- **Knob/fader controls** (AudioParam mapping): `technical/web-audio-dsp-reference.md` Section 3
- **Waveform display**: `technical/web-audio-dsp-reference.md` (AnalyserNode)
- **Responsive design** (orientation handling, mobile vs desktop): `technical/pwa-audio-reference.md` manifest orientation field (line 36-41)
- **Accessibility** (keyboard navigation, ARIA): `technical/drum-machine-keyboard-reference.md` (accessibility sections); `design/instrument-hardware-ui-design.md` Section 5
- **Mobile considerations** (touch events, iOS audio unlock, viewport, PWA install): `technical/pwa-audio-reference.md`; `technical/web-audio-dsp-reference.md` (iOS Safari gotcha lines 63-72)
- **Shortcuts** (PWA app shortcuts): `technical/pwa-audio-reference.md` lines 74-101
- **File handling** (import WAV/MIDI): `technical/pwa-audio-reference.md` lines 165-173
