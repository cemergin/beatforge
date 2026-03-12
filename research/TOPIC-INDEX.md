# BeatForge Research Corpus -- Topic Cross-Reference Index

**Purpose:** Map every major concept to specific file locations.
**Last updated:** March 12, 2026

---

## A. TECHNICAL CONCEPTS

### Web Audio API
- **AudioContext** (lifecycle, states, autoplay policy, suspend/resume): `~/lab/web-audio-dsp-reference.md` Section 1 (lines 10-88)
- **Audio Graph Architecture** (nodes, fan-out, fan-in, mixer pattern): `~/lab/web-audio-dsp-reference.md` Section 2 (lines 90-166)
- **AudioParam** (a-rate vs k-rate, automation timeline, setValueAtTime, ramps, setTargetAtTime, setValueCurveAtTime, cancel): `~/lab/web-audio-dsp-reference.md` Section 3 (lines 168-267)
- **AudioWorklet** (architecture, setup, render quantum, memory management, MessagePort, SharedArrayBuffer, ring buffer): `~/lab/web-audio-dsp-reference.md` Section 4 (lines 270-500+)
- **OfflineAudioContext** (bounce/export): `~/lab/web-audio-dsp-reference.md` (later sections)
- **AnalyserNode** (FFT, waveform, frequency data): `~/lab/web-audio-dsp-reference.md` (later sections)
- **iOS Safari workarounds** (silent buffer unlock): `~/lab/web-audio-dsp-reference.md` lines 63-72

### DSP (Digital Signal Processing)
- **Filters** (BiquadFilterNode: lowpass, highpass, bandpass, notch, allpass, peaking, lowshelf, highshelf): `~/lab/web-audio-dsp-reference.md` (processing sections)
- **Envelopes** (ADSR, setTargetAtTime, exponentialRamp): `~/lab/web-audio-dsp-reference.md` Section 3
- **Oscillators** (OscillatorNode, waveforms, detune, FM synthesis): `~/lab/web-audio-dsp-reference.md` (source sections)
- **Noise generation** (white, pink, brown): `~/lab/web-audio-dsp-reference.md` (synthesis sections)
- **Distortion** (WaveShaperNode, curve generation): `~/lab/web-audio-dsp-reference.md` (processing sections)
- **Compression** (DynamicsCompressorNode, threshold, ratio, knee, attack, release): `~/lab/web-audio-dsp-reference.md` (processing sections)
- **Reverb** (ConvolverNode, impulse responses): `~/lab/web-audio-dsp-reference.md` (processing sections)
- **Delay** (DelayNode, feedback delay, ping-pong): `~/lab/web-audio-dsp-reference.md` (processing sections)

### MIDI
- **Protocol fundamentals** (status bytes, data bytes, running status): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 1 (lines 26-118)
- **Channel voice messages** (Note On/Off, CC, Program Change, Pitch Bend, Aftertouch): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 2 (lines 120-234)
- **System messages** (SysEx, Real-Time, Common): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 3 (lines 236-306)
- **GM Drum Map** (notes 27-81, complete table + JS object): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 4 (lines 308-404)
- **Velocity** (ranges, curves: linear/log/exp/S-curve, drum context): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 5 (lines 406-470)
- **CC Reference** (complete 0-127 table): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 6 (lines 472-500+)
- **MIDI Clock** (24 PPQN, Start/Stop/Continue, Song Position): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 7
- **Web MIDI API** (requestMIDIAccess, inputs/outputs, onmidimessage): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 10-11
- **.mid file format** (header chunk, track chunk, delta time, variable-length quantity): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 12-13
- **MIDI 2.0**: `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 9
- **MIDI Learn**: `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 11 + `~/lab/drum-machine-keyboard-reference.md`

### Synthesis (Drum Sound Design)
- **808 kick** (sine oscillator + pitch envelope + noise layer): `~/lab/web-audio-dsp-reference.md` (synthesis recipes section)
- **909 snare** (noise + tone oscillators, bandpass filter): `~/lab/web-audio-dsp-reference.md` (synthesis recipes)
- **FM synthesis** (frequency modulation for metallic sounds): `~/lab/web-audio-dsp-reference.md` (synthesis recipes)
- **Karplus-Strong** (plucked string/physical modeling): `~/lab/web-audio-dsp-reference.md` (synthesis recipes)
- **Physical modeling**: `~/lab/web-audio-dsp-reference.md` (synthesis recipes)
- **MembraneSynth** (Tone.js): `~/lab/WEB_AUDIO_REFERENCE.md` Tone.js section
- **MetalSynth** (Tone.js): `~/lab/WEB_AUDIO_REFERENCE.md` Tone.js section
- **NoiseSynth** (Tone.js): `~/lab/WEB_AUDIO_REFERENCE.md` Tone.js section

### Tone.js
- **Transport** (BPM, scheduling, loop, timeline events): `~/lab/WEB_AUDIO_REFERENCE.md` Tone.js Deep Dive section
- **MembraneSynth, MetalSynth, NoiseSynth**: `~/lab/WEB_AUDIO_REFERENCE.md` Tone.js instruments
- **Player** (sample playback): `~/lab/WEB_AUDIO_REFERENCE.md` Tone.js section
- **Sequence, Part, Pattern**: `~/lab/WEB_AUDIO_REFERENCE.md` Tone.js section

### WAM 2.0 (Web Audio Modules)
- **What WAM is** (VST equivalent for browsers): `~/lab/WEB_AUDIO_REFERENCE.md` Section 1 (lines 15-43)
- **Architecture** (dual-thread, WamNode/WamProcessor/WamEnv/WamGroup): `~/lab/WEB_AUDIO_REFERENCE.md` Section 2 (lines 44-193)
- **Plugin API** (parameter system, WamDescriptor): `~/lab/WEB_AUDIO_REFERENCE.md` Section 3 (lines 194-280)
- **WAM Events** (MIDI, automation, transport, SysEx, MPE, OSC): `~/lab/WEB_AUDIO_REFERENCE.md` Section 4 (lines 282-388)
- **Creating a plugin from scratch** (SDK, project structure, index.js, processor.js): `~/lab/WEB_AUDIO_REFERENCE.md` Section 5 (lines 390-500+)

### PWA (Progressive Web App)
- **Web App Manifest** (all fields, icons, shortcuts, screenshots): `~/lab/pwa-audio-reference.md` Section 1.1 (lines 8-190)
- **Service Worker** (lifecycle: install, activate, fetch): `~/lab/pwa-audio-reference.md` Section 1.2 (lines 192-313)
- **Caching strategies** (cache-first, network-first, stale-while-revalidate): `~/lab/pwa-audio-reference.md` Section 1.3 (lines 317-411)
- **Workbox**: `~/lab/pwa-audio-reference.md` Section 1.4 (lines 414-500)
- **Offline audio** (IndexedDB for samples, Cache API for app shell): `~/lab/pwa-audio-reference.md` (later sections)
- **Media Session API** (lock screen controls, metadata): `~/lab/pwa-audio-reference.md` (later sections)
- **Wake Lock API** (prevent screen sleep during performance): `~/lab/pwa-audio-reference.md` (later sections)
- **Background Sync**: `~/lab/pwa-audio-reference.md` Section 1.4 (Workbox)
- **File handling** (import WAV/MIDI): `~/lab/pwa-audio-reference.md` manifest section
- **Share Target**: `~/lab/pwa-audio-reference.md` manifest section

### Scheduling
- **Lookahead pattern** (setTimeout + audioContext.currentTime): `~/lab/web-audio-dsp-reference.md` (scheduling section)
- **Swing** (implementation: delay 2nd/4th 16th notes, percentages 50-67%): `~/lab/drum-patterns-library.md` lines 2886-2893
- **Groove templates**: `~/lab/drum-machine-practice-methodology.md`
- **Tempo/BPM**: `~/lab/WEB_AUDIO_REFERENCE.md` (Tone.js Transport), `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 7 (MIDI clock)

### Export
- **WAV** (OfflineAudioContext bounce): `~/lab/web-audio-dsp-reference.md` (export section)
- **MP3** (encoding libraries): `~/lab/web-audio-dsp-reference.md` (export section)
- **MIDI** (.mid file generation): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 13
- **Stems** (per-channel offline render): `~/lab/web-audio-dsp-reference.md` (export section)

### Visualization
- **Waveform display** (AnalyserNode getByteTimeDomainData): `~/lab/web-audio-dsp-reference.md`
- **Spectrum/FFT** (AnalyserNode getByteFrequencyData): `~/lab/web-audio-dsp-reference.md`
- **Level meters** (SharedArrayBuffer + AudioWorklet for real-time RMS/peak): `~/lab/web-audio-dsp-reference.md` lines 416-462

---

## B. INSTRUMENTS & SOUNDS

### Kick Drums
- **808 kick** (synthesis): `~/lab/web-audio-dsp-reference.md` (synthesis recipes)
- **909 kick**: `~/lab/web-audio-dsp-reference.md` (synthesis recipes)
- **Acoustic kick**: GM note 35-36 in `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 4
- **Log drum** (Amapiano): `~/lab/drum-patterns-library.md` lines 2266-2304 (Amapiano patterns)

### Snare Drums
- **909 snare** (synthesis): `~/lab/web-audio-dsp-reference.md` (synthesis recipes)
- **Acoustic snare**: GM note 38, `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 4
- **Electric snare**: GM note 40
- **Side stick/rimshot**: GM note 37
- **Ghost notes** (velocity 25-45): `~/lab/drum-patterns-library.md` lines 37-41

### Hi-Hats
- **Closed/Open/Pedal** (GM notes 42, 46, 44): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 4
- **MetalSynth** (Tone.js hi-hat synthesis): `~/lab/WEB_AUDIO_REFERENCE.md`
- **Hi-hat patterns by genre**: `~/lab/drum-patterns-library.md` (throughout)

### Claps
- **Hand clap** (GM note 39): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 4
- **Clap patterns in house/techno/pop**: `~/lab/drum-patterns-library.md`

### Toms / Congas
- **Toms** (GM notes 41, 43, 45, 47, 48, 50): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 4
- **Congas** (GM notes 62-64, mute/open/low): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 4
- **Tom fills**: `~/lab/drum-patterns-library.md` Section 4.6 (lines 1665-1697)

### Cowbell
- **GM note 56**: `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 4
- **In Afrobeat patterns**: `~/lab/drum-patterns-library.md` pattern 93
- **In Phonk**: `~/lab/drum-patterns-library.md` pattern 157

### Cymbals
- **Crash** (GM notes 49, 57), **Ride** (51, 59), **Ride Bell** (53), **Splash** (55), **Chinese** (52): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 4

### Tabla
- **Technique and bols** (Na, Ta, Tin, Ge, Ghe, Dha, Dhin, Ti, Re, Ke): `~/lab/beatforge-research/musicology/indian-subcontinent.md` Section 2
- **Grid patterns** (Tintal, Keherwa, Dadra, etc.): `~/lab/drum-patterns.md` (Part 3 -- Indian section)

### Djembe / Dundun
- **Technique** (Tone, Slap, Bass): `~/lab/african-drum-patterns.md` Part II intro (lines 455-458)
- **Full ensemble patterns** (Kuku, Soli, Dununba, Tiriba, Yankadi, Makru, etc.): `~/lab/african-drum-patterns.md` patterns 8-15
- **Dundun family** (kenkeni, sangban, dundunba): `~/lab/african-drum-patterns.md` Part II
- **Cultural context**: `~/lab/beatforge-research/musicology/west-african-traditions.md`

### Darbuka / Tombak / Daf
- **Darbuka** (Doum/Tek/Ka technique): `~/lab/drum-patterns.md` notation key (lines 9-17)
- **Tombak** (Persian goblet drum, 30+ distinct strokes): `~/lab/beatforge-research/musicology/persian-iranian-traditions.md` Part III
- **Daf** (Sufi frame drum, Kurdish/Persian): `~/lab/beatforge-research/musicology/persian-iranian-traditions.md` Part IV
- **Arabic patterns** (Maqsoum, Baladi, Saidi, etc.): `~/lab/drum-patterns.md` Part 2 (lines 652-999+)

### Taiko
- **Types** (nagado-daiko, shime-daiko, odaiko, okedo-daiko): `~/lab/beatforge-research/musicology/japanese-traditions.md` Section 5
- **Notation and patterns** (don, ka, doko, su, jiuchi base rhythms): `~/lab/beatforge-research/musicology/japanese-traditions.md` Section 6
- **Historical/cultural context**: `~/lab/beatforge-research/musicology/japanese-traditions.md` Section 4
- **Also in**: `~/lab/beatforge-research/musicology/east-asian-traditions.md` (Japan sections)

### Gamelan
- **Instruments** (saron, demung, peking, bonang, gender, gambang, gong ageng, kenong, kempul, kethuk, kendhang): `~/lab/beatforge-research/patterns/gamelan-southeast-asian.md` Section 5 (lines 156-269)
- **Colotomic patterns**: `~/lab/beatforge-research/patterns/gamelan-southeast-asian.md` Section 6 (lines 271-500)
- **Cultural context**: `~/lab/beatforge-research/musicology/gamelan-southeast-asian.md`

### Cajon
- **In flamenco context**: `~/lab/beatforge-research/musicology/andean-south-american.md` (Peru section)
- **Afro-Peruvian cajon**: `~/lab/beatforge-research/musicology/andean-south-american.md` Peru section

### Berimbau
- **Notation** (din, ton, buzz): `~/lab/beatforge-research/musicology/brazilian-traditions.md` notation key (line 28-31)
- **Capoeira context**: `~/lab/beatforge-research/musicology/brazilian-traditions.md` (capoeira section)

### Frame Drums
- **Daf** (Persian): `~/lab/beatforge-research/musicology/persian-iranian-traditions.md` Part IV
- **Bendir** (North African): referenced in `~/lab/drum-patterns.md` Arabic sections
- **Bodhran** (Irish): referenced in `~/lab/beatforge-research/musicology/balkan-traditions.md`
- **Riq** (Arabic tambourine): referenced in Arabic sections of `~/lab/drum-patterns.md`

### Steelpan
- **Trinidad origins and context**: `~/lab/beatforge-research/musicology/afro-cuban-caribbean-latin.md` (Trinidad section)

### Korean Percussion (Samulnori)
- **Kkwaenggwari, jing, janggu, buk**: `~/lab/beatforge-research/musicology/east-asian-traditions.md` Section 1 (lines 54-80)
- **Changdan patterns**: `~/lab/beatforge-research/musicology/east-asian-traditions.md` Section 3

### Chinese Percussion
- **Instruments** (tanggu, paigu, bo, naobo, muyu, bangzi, luo, yunluo): `~/lab/beatforge-research/musicology/chinese-traditions.md` Part II
- **Opera percussion** (luogu jing): `~/lab/beatforge-research/musicology/chinese-traditions.md` Part III
- **Lion/dragon dance drumming**: `~/lab/beatforge-research/musicology/chinese-traditions.md` Part IV

---

## C. RHYTHMIC CONCEPTS

### Clave
- **Son clave** (3-2 and 2-3): `~/lab/world-rhythm-library.md` Section 2.1 (lines 287-311)
- **Rumba clave** (3-2 and 2-3): `~/lab/world-rhythm-library.md` Section 2.2 (lines 314-339)
- **Bossa clave**: `~/lab/drum-patterns-library.md` pattern 60 (Bossa Nova) + pattern 203
- **12/8 rumba clave / bell pattern**: `~/lab/beatforge-research/musicology/caribbean-colombia-mexico.md` lines 84-95
- **Clave concept explained**: `~/lab/world-rhythm-library.md` Part 2 intro (lines 271-284)
- **Clave in salsa ensemble**: `~/lab/world-rhythm-library.md` Section 2.8 (lines 480-500)

### Swing / Shuffle
- **Swing percentages** (50% straight to 67% full triplet): `~/lab/drum-patterns-library.md` lines 2886-2893
- **MPC groove / Dilla feel**: `~/lab/drum-patterns-library.md` Section 3.5 (lines 1372-1413)
- **Blues shuffle**: `~/lab/drum-patterns-library.md` Section 1.3 (lines 215-278)
- **Purdie shuffle**: `~/lab/drum-patterns-library.md` pattern 210 (lines 2783-2793)
- **Porcaro/Rosanna half-time shuffle**: `~/lab/drum-patterns-library.md` pattern 211 (lines 2795-2805)
- **Implementation in code**: `~/lab/drum-patterns-library.md` lines 2886-2893

### Polyrhythm vs Polymeter
- **3:2, 4:3 cross-rhythms**: `~/lab/world-rhythm-library.md` Section 1.6 (lines 225-267)
- **3:2 hemiola as African foundation**: `~/lab/african-drum-patterns.md` Rhythmic Concepts section 3 (lines 22-23)
- **Polymetric patterns** (Meshuggah-style 23/16 over 4/4): `~/lab/drum-patterns-library.md` Section 3.4 (lines 1331-1368)
- **In practice methodology**: `~/lab/drum-machine-practice-methodology.md` (polyrhythm training section)

### Aksak / Asymmetric Meters
- **Turkish aksak concept** (2+2+2+3 grouping): `~/lab/turkish-rhythmic-systems-reference.md`, `~/lab/drum-patterns.md` pattern 6
- **Balkan aksak** (Brailoiu's bichronicity, S+L ratios): `~/lab/beatforge-research/musicology/balkan-traditions.md` Sections 2-3 (lines 55-100)
- **Bulgarian odd meters** (7/8 to 22/16): `~/lab/beatforge-research/musicology/balkan-traditions.md` Section 5
- **Practical patterns**: 5/8: `~/lab/drum-patterns.md` pattern 9; 7/8: patterns 11, 19; 9/8: patterns 3-6, 18; 10/8: pattern 22

### Colotomic Structure
- **Full explanation**: `~/lab/beatforge-research/patterns/gamelan-southeast-asian.md` Section 5 (lines 147-269)
- **Notation for all forms** (lancaran, ketawang, ladrang, merong, srepegan, sampak): `~/lab/beatforge-research/patterns/gamelan-southeast-asian.md` Section 6 (lines 271-500)
- **Cultural context**: `~/lab/beatforge-research/musicology/gamelan-southeast-asian.md`

### Tala System (Indian)
- **What tala is** (cyclical time, sam, khali, vibhag): `~/lab/beatforge-research/musicology/indian-subcontinent.md` Section 2.1 (lines 88-100)
- **Specific talas** (Tintal 16 beats, Jhaptal 10, Rupak 7, Ektaal 12, Dadra 6, Keherwa 8): `~/lab/beatforge-research/musicology/indian-subcontinent.md` Section 2, `~/lab/drum-patterns.md` Part 3
- **Carnatic tala**: `~/lab/beatforge-research/musicology/indian-subcontinent.md` Section 3

### Usul System (Ottoman/Turkish)
- **What usul is** (named cyclical rhythmic pattern, Düm/Tek strokes): `~/lab/turkish-rhythmic-systems-reference.md` Part I
- **Complete usul patterns**: `~/lab/drum-patterns.md` Part 1 (patterns 1-24)
- **Simple usul** (2-10 beats): Nim Sofyan, Sofyan, Düyek, Turk Aksagi, Yuruk Semai, Aksak
- **Compound usul** (10+ beats): Curcuna (10/8), Cengi (8/4), and longer forms in `~/lab/turkish-rhythmic-systems-reference.md`

### Iqa'at (Arabic Rhythmic Modes)
- **Maqsoum, Baladi, Saidi, Masmoudi, Fallahi, Wahda, Ayoub, Malfuf, Dabke**: `~/lab/drum-patterns.md` Part 2 (patterns 25-45+)
- **Cultural context**: references throughout Arabic sections

### Timeline / Bell Patterns
- **Standard West African bell** (x.x.xx.x.xx. -- 2+2+1+2+2+2+1): `~/lab/world-rhythm-library.md` Section 1.1 (lines 47-70), `~/lab/african-drum-patterns.md` pattern 1 (Agbekor bell)
- **Gahu bell**: `~/lab/african-drum-patterns.md` pattern 2, `~/lab/world-rhythm-library.md` Section 1.2
- **Highlife bell/guitar pattern**: `~/lab/world-rhythm-library.md` Section 1.4 (lines 151-173)
- **Kpanlogo bell**: `~/lab/african-drum-patterns.md` pattern 3, `~/lab/world-rhythm-library.md` Section 1.3
- **Bembe bell** (Afro-Cuban 6/8): `~/lab/world-rhythm-library.md` Section 2.5 (lines 394-418)
- **Concept explained**: `~/lab/african-drum-patterns.md` Rhythmic Concepts section 1 (lines 14-17)

### Micro-Timing
- **African "in-between" feel** (uneven subdivisions): `~/lab/african-drum-patterns.md` Rhythmic Concepts section 4 (lines 25-27)
- **J Dilla "drunk drums"** (pushing/dragging off grid): `~/lab/drum-patterns-library.md` Section 3.5 (lines 1372-1413)
- **Questlove drag beat**: `~/lab/drum-patterns-library.md` pattern 65 (lines 885-896)

### Humanization
- **Velocity variation guidelines**: `~/lab/drum-patterns-library.md` lines 2896-2899
- **Ghost notes** (velocity 25-45): throughout pattern files
- **Practice approach**: `~/lab/drum-machine-practice-methodology.md`

### Tresillo (3+3+2)
- **Definition and global spread**: `~/lab/world-rhythm-library.md` Section 2.3 (lines 343-370)
- **Habanera variant**: `~/lab/world-rhythm-library.md` lines 360-365
- **In reggaeton kick**: `~/lab/drum-patterns-library.md` pattern 178 (line 2358)
- **As hemiola within 8 pulses**: `~/lab/world-rhythm-library.md` Section 1.6 (lines 257-266)

### Euclidean Rhythms
- Referenced conceptually in `~/lab/drum-machine-practice-methodology.md` and relates to the additive rhythm concept in `~/lab/african-drum-patterns.md` section 6

### Parameter Locks
- Concept applicable to step sequencer: `~/lab/drum-patterns-library.md` (per-step velocity notation throughout)

### Conditional Triggers
- Referenced in `~/lab/drum-machine-practice-methodology.md` (random mute exercises)

---

## D. REGIONS & CULTURES

### West Africa
- **Ghana (Ewe, Ga, Akan)**: `~/lab/african-drum-patterns.md` Part I (Agbekor, Gahu, Kpanlogo, Bobobo, Atsiagbekor, Gadzo, Tokoe); `~/lab/world-rhythm-library.md` Part 1; `~/lab/beatforge-research/musicology/west-african-traditions.md`
- **Nigeria (Yoruba)**: `~/lab/african-drum-patterns.md` Part III (Bata/Shango, Dundun); `~/lab/beatforge-research/musicology/west-african-traditions.md`
- **Guinea (Malinke/Mande)**: `~/lab/african-drum-patterns.md` Part II (Kuku, Soli, Dununba, Tiriba, Yankadi, Makru, Djansa, Sunu); `~/lab/world-rhythm-library.md` Section 1.5
- **Senegal**: `~/lab/african-drum-patterns.md` (Sabar patterns); `~/lab/beatforge-research/musicology/west-african-traditions.md`
- **Mali**: `~/lab/beatforge-research/musicology/west-african-traditions.md` (griot tradition)

### East Africa (Kenya, Tanzania)
- Referenced in `~/lab/beatforge-research/musicology/west-african-traditions.md` (broader African context)

### South Africa (Amapiano, Kwaito, Gqom)
- **Amapiano patterns**: `~/lab/drum-patterns-library.md` patterns 171-173 (lines 2266-2304)
- **Context**: `~/lab/beatforge-research/musicology/electronic-hiphop-funk-reggae.md` (modern African electronic music context)

### North Africa (Morocco, Algeria, Tunisia)
- **Gnawa rhythms**: referenced in `~/lab/drum-patterns.md` (broader Arabic section)
- **Chaabi**: related patterns in `~/lab/drum-patterns.md` Arabic section

### Cuba
- **Santeria/bata drumming**: `~/lab/beatforge-research/musicology/caribbean-colombia-mexico.md` Section 3 (lines 30-95)
- **Rumba**: `~/lab/beatforge-research/musicology/caribbean-colombia-mexico.md`
- **Son, salsa, mambo, cha-cha-cha, timba**: `~/lab/beatforge-research/musicology/caribbean-colombia-mexico.md`; `~/lab/world-rhythm-library.md` Section 2.8
- **Clave patterns**: `~/lab/world-rhythm-library.md` Sections 2.1-2.2
- **Mozambique, Songo**: `~/lab/world-rhythm-library.md` Sections 2.6-2.7
- **Abakua**: `~/lab/beatforge-research/musicology/caribbean-colombia-mexico.md` Section 4

### Jamaica
- **Reggae patterns** (one drop, rockers, steppers): `~/lab/drum-patterns-library.md` Section 1.5 (lines 357-435)
- **Ska patterns**: `~/lab/drum-patterns-library.md` Section 1.6 (lines 437-499)
- **Cultural history** (mento, ska, rocksteady, reggae, dancehall, dub): `~/lab/beatforge-research/musicology/afro-cuban-caribbean-latin.md`; `~/lab/beatforge-research/musicology/electronic-hiphop-funk-reggae.md`

### Trinidad
- **Calypso, steelpan, soca**: `~/lab/beatforge-research/musicology/afro-cuban-caribbean-latin.md` (Trinidad section)

### Haiti
- **Vodou drumming**: `~/lab/beatforge-research/musicology/afro-cuban-caribbean-latin.md` (Haiti section)

### Puerto Rico
- **Bomba, plena**: `~/lab/beatforge-research/musicology/afro-cuban-caribbean-latin.md` (Puerto Rico section)
- **Reggaeton/dembow**: `~/lab/drum-patterns-library.md` Section 5.8 (lines 2308-2369)

### Brazil
- **All traditions**: `~/lab/beatforge-research/musicology/brazilian-traditions.md` (1,993 lines)
- **Samba patterns**: `~/lab/drum-patterns-library.md` pattern 204 (lines 2700-2708)
- **Bossa nova patterns**: `~/lab/drum-patterns-library.md` patterns 60, 203
- **Candomble, baiao, forro, maracatu, capoeira**: `~/lab/beatforge-research/musicology/brazilian-traditions.md`

### Colombia
- **Cumbia, vallenato, champeta, currulao**: `~/lab/beatforge-research/musicology/caribbean-colombia-mexico.md`

### Mexico
- **Son jarocho, huapango, norteno, banda**: `~/lab/beatforge-research/musicology/caribbean-colombia-mexico.md`

### Argentina
- **Tango, milonga, chacarera, zamba**: `~/lab/beatforge-research/musicology/andean-south-american.md` Part V

### Peru
- **Festejo, lando, marinera, cajon origins**: `~/lab/beatforge-research/musicology/andean-south-american.md` Part III

### Bolivia
- **Tinku, morenada, diablada, caporal**: `~/lab/beatforge-research/musicology/andean-south-american.md` Part IV

### Chile
- **Cueca, nueva cancion**: `~/lab/beatforge-research/musicology/andean-south-american.md` Part VI

### Venezuela
- **Joropo, gaita, tambor**: `~/lab/beatforge-research/musicology/andean-south-american.md` Part IX

### Uruguay
- **Candombe, murga**: `~/lab/beatforge-research/musicology/andean-south-american.md` Part VII

### Turkey
- **Ottoman usul system**: `~/lab/turkish-rhythmic-systems-reference.md`; `~/lab/drum-patterns.md` Part 1 (24 patterns)
- **Folk rhythms** (Halay, Zeybek, Horon, Karsilama, Roman Havasi): `~/lab/drum-patterns.md` patterns 3-5, 17-19
- **Modern Turkish** (Arabesk, Anatolian Rock, Pop): `~/lab/drum-patterns.md` patterns 13-16

### Arabic / Middle East
- **Egypt** (Maqsoum, Baladi, Saidi, Masmoudi, Fallahi, Shaabi, Zaffa): `~/lab/drum-patterns.md` patterns 25-32
- **Levant** (Lebanon, Syria, Palestine, Jordan -- Dabke): `~/lab/drum-patterns.md` patterns 37-38
- **Pan-Arab** (Ayoub, Malfuf, Wahda): `~/lab/drum-patterns.md` patterns 33-36
- **Sufi/spiritual** (Ayoub in zar/dhikr): `~/lab/drum-patterns.md` pattern 33

### Iran / Persia
- **Complete tradition**: `~/lab/beatforge-research/musicology/persian-iranian-traditions.md` (1,301 lines)
- **Tombak, daf, zarb**: `~/lab/beatforge-research/musicology/persian-iranian-traditions.md` Parts III-V
- **Rhythmic patterns notated**: `~/lab/beatforge-research/musicology/persian-iranian-traditions.md` Part VII

### India
- **Hindustani** (tabla, tala system): `~/lab/beatforge-research/musicology/indian-subcontinent.md` Section 2; `~/lab/drum-patterns.md` Part 3
- **Carnatic** (mridangam, konnakol): `~/lab/beatforge-research/musicology/indian-subcontinent.md` Section 3
- **Bollywood**: `~/lab/beatforge-research/musicology/indian-subcontinent.md` Section 6
- **Folk** (dhol, dholak): `~/lab/beatforge-research/musicology/indian-subcontinent.md` Section 4

### Balkans
- **Bulgaria** (odd meters, horo): `~/lab/beatforge-research/musicology/balkan-traditions.md` Section 5
- **Romania** (lautari, cimbalom): `~/lab/beatforge-research/musicology/balkan-traditions.md` Section 6
- **Serbia** (kolo, brass bands): `~/lab/beatforge-research/musicology/balkan-traditions.md` Section 7
- **Greece** (rebetiko, zebekiko, kalamatianos, hasapiko): `~/lab/beatforge-research/musicology/balkan-traditions.md` Section 8
- **Albania**: `~/lab/beatforge-research/musicology/balkan-traditions.md` Section 10
- **Bosnia**: `~/lab/beatforge-research/musicology/balkan-traditions.md` Section 11
- **Pattern notation** (all meters): `~/lab/beatforge-research/musicology/balkan-traditions.md` Section 15

### Japan
- **Complete tradition**: `~/lab/beatforge-research/musicology/japanese-traditions.md` (1,149 lines)
- **Taiko** (history, instruments, patterns): `~/lab/beatforge-research/musicology/japanese-traditions.md` Sections 4-6
- **Gagaku**: `~/lab/beatforge-research/musicology/japanese-traditions.md` Section 1
- **Noh, Kabuki**: `~/lab/beatforge-research/musicology/japanese-traditions.md` Sections 2-3
- **Also in**: `~/lab/beatforge-research/musicology/east-asian-traditions.md` (Japan sections 9-19)

### Korea
- **Samulnori**: `~/lab/beatforge-research/musicology/east-asian-traditions.md` Section 1 (lines 54-80)
- **Pungmul/Nongak**: `~/lab/beatforge-research/musicology/east-asian-traditions.md` Section 2 (lines 83-100)
- **Changdan patterns**: `~/lab/beatforge-research/musicology/east-asian-traditions.md` Section 3
- **K-pop**: `~/lab/beatforge-research/musicology/east-asian-traditions.md` Section 8

### China
- **Complete tradition**: `~/lab/beatforge-research/musicology/chinese-traditions.md` (976 lines)
- **Opera percussion**: `~/lab/beatforge-research/musicology/chinese-traditions.md` Part III
- **Lion/dragon dance**: `~/lab/beatforge-research/musicology/chinese-traditions.md` (Part IV)
- **Also in**: `~/lab/beatforge-research/musicology/east-asian-traditions.md` (China sections 24-27)

### Mongolia
- **Complete tradition**: `~/lab/beatforge-research/musicology/mongolian-traditions.md` (1,550 lines)
- **Horse gait rhythms**: `~/lab/beatforge-research/musicology/mongolian-traditions.md` Part IV
- **Shaman drumming**: `~/lab/beatforge-research/musicology/mongolian-traditions.md`

### Indonesia (Java, Bali)
- **Javanese gamelan** (patterns): `~/lab/beatforge-research/patterns/gamelan-southeast-asian.md`
- **Javanese gamelan** (culture): `~/lab/beatforge-research/musicology/gamelan-southeast-asian.md` Part I
- **Balinese gamelan** (kotekan, kebyar): `~/lab/beatforge-research/musicology/gamelan-southeast-asian.md` Part II; `~/lab/beatforge-research/patterns/gamelan-southeast-asian.md`
- **Also in**: `~/lab/beatforge-research/musicology/east-asian-traditions.md` Section 20

### Vietnam
- **Dong Son bronze drums, nha nhac, ca tru, cheo**: `~/lab/beatforge-research/musicology/vietnam-cambodia-malaysia.md` Part I (lines 1-80)

### Cambodia
- **Khmer classical, pinpeat ensemble, apsara dance**: `~/lab/beatforge-research/musicology/vietnam-cambodia-malaysia.md` (Cambodia section)

### Malaysia
- **Gamelan Melayu, kompang, joget**: `~/lab/beatforge-research/musicology/vietnam-cambodia-malaysia.md` (Malaysia section)

### Thailand
- **Thai percussion**: `~/lab/beatforge-research/musicology/gamelan-southeast-asian.md` Part IV; `~/lab/beatforge-research/musicology/east-asian-traditions.md` Section 22

### Myanmar
- **Hsaing-waing ensemble**: `~/lab/beatforge-research/musicology/gamelan-southeast-asian.md` Part V

### Philippines
- **Kulintang**: `~/lab/beatforge-research/musicology/east-asian-traditions.md` Section 21; `~/lab/beatforge-research/musicology/gamelan-southeast-asian.md` Part VII

---

## E. GENRES

### Electronic
- **House** (classic, deep, tech, acid): `~/lab/drum-patterns-library.md` Section 5.1 (patterns 131-137, lines 1739-1831)
- **Techno** (Detroit, Berlin, industrial, minimal): `~/lab/drum-patterns-library.md` Section 5.2 (patterns 138-144, lines 1834-1920)
- **Drum and Bass** (two-step, Amen, liquid, neurofunk, jungle): `~/lab/drum-patterns-library.md` Section 5.3 (patterns 145-150, lines 1923-1995)
- **Dubstep** (classic, brostep, deep, riddim): `~/lab/drum-patterns-library.md` Section 5.6 (patterns 164-168, lines 2173-2234)
- **Trance**: `~/lab/drum-patterns-library.md` pattern 208 (lines 2757-2766)
- **IDM**: aspects in math rock and fusion sections
- **History/context**: `~/lab/beatforge-research/musicology/electronic-hiphop-funk-reggae.md` (TR-808, TR-909, house/techno origins)

### Hip-Hop
- **Boom bap**: `~/lab/drum-patterns-library.md` patterns 151-152 (lines 2001-2023)
- **Trap**: patterns 154-155 (lines 2038-2061)
- **UK Drill**: pattern 156 (lines 2063-2073)
- **Lo-fi**: pattern 153 (lines 2025-2036)
- **Phonk**: pattern 157 (lines 2075-2086)
- **Grime**: referenced in UK Garage section
- **J Dilla style**: `~/lab/drum-patterns-library.md` Section 3.5 (patterns 101-103, lines 1372-1413)
- **History**: `~/lab/beatforge-research/musicology/electronic-hiphop-funk-reggae.md` (breakbeats, MPC, sampling)

### Funk
- **Funk patterns**: `~/lab/drum-patterns-library.md` Section 2.1 (patterns 48-55, lines 659-758)
- **Funky Drummer** (Clyde Stubblefield): patterns 48-49, also pattern 182 (classic breakbeats)
- **Tower of Power, Parliament, Cissy Strut**: patterns 50-55
- **History** (James Brown, "The One," New Orleans, P-Funk): `~/lab/beatforge-research/musicology/electronic-hiphop-funk-reggae.md` Part I

### Disco
- **Patterns**: `~/lab/drum-patterns-library.md` Section 2.6 (patterns 80-84, lines 1077-1142)
- **"I Feel Love" style**: pattern 82

### Jazz
- **Basic swing, medium swing, bebop, waltz, bossa, brush, Latin**: `~/lab/drum-patterns-library.md` Section 2.2 (patterns 56-62, lines 762-855)
- **Jazz fusion**: Section 3.1 (patterns 85-88, lines 1150-1199) + Section 3.6 (patterns 104-106, lines 1416-1453)

### R&B / Neo-Soul
- **Patterns**: `~/lab/drum-patterns-library.md` Section 2.3 (patterns 63-68, lines 857-933)
- **Questlove, D'Angelo, broken beat**: patterns 65-67

### Reggae / Ska / Dancehall / Dub
- **Reggae** (one drop, rockers, steppers): `~/lab/drum-patterns-library.md` Section 1.5 (patterns 25-30)
- **Ska** (offbeat, 2-tone, punk): Section 1.6 (patterns 31-35)
- **History**: `~/lab/beatforge-research/musicology/electronic-hiphop-funk-reggae.md` (reggae/dub/dancehall section); `~/lab/beatforge-research/musicology/afro-cuban-caribbean-latin.md` (Jamaica)

### Rock / Pop / Metal / Punk
- **Rock**: `~/lab/drum-patterns-library.md` Section 1.1 (patterns 1-7)
- **Pop**: Section 1.2 (patterns 8-13)
- **Punk**: Section 1.7 (patterns 36-40)
- **Metal** (standard, double bass, gallop, blast beat, djent): Section 1.8 (patterns 41-47)
- **Progressive Rock** (5/4, 7/8, 9/8, 15/8): Section 2.5 (patterns 74-79)
- **Math Rock** (11/8, 13/8, alternating meters): Section 3.3 (patterns 94-97)

### Afro-Cuban / Salsa / Son / Mambo / Cha-cha-cha / Timba
- **Patterns**: `~/lab/world-rhythm-library.md` Part 2 (all sections)
- **Clave**: Sections 2.1-2.2
- **Cascara**: Section 2.4
- **Full salsa ensemble**: Section 2.8
- **Songo**: Section 2.7
- **Mozambique**: Section 2.6
- **History**: `~/lab/beatforge-research/musicology/afro-cuban-caribbean-latin.md`; `~/lab/beatforge-research/musicology/caribbean-colombia-mexico.md`

### Brazilian (Samba, Bossa Nova, Baiao, Forro, Maracatu)
- **Samba pattern**: `~/lab/drum-patterns-library.md` pattern 204
- **Bossa nova pattern**: patterns 60, 203
- **All Brazilian rhythms (deep)**: `~/lab/beatforge-research/musicology/brazilian-traditions.md`

### Cumbia / Vallenato / Champeta
- **Colombia**: `~/lab/beatforge-research/musicology/caribbean-colombia-mexico.md` (Colombia sections)

### Reggaeton / Dembow
- **Patterns**: `~/lab/drum-patterns-library.md` Section 5.8 (patterns 174-178, lines 2308-2369)

### Afrobeats / Amapiano / Highlife / Juju
- **Afrobeats patterns**: `~/lab/drum-patterns-library.md` patterns 169-170 (lines 2239-2264)
- **Amapiano**: patterns 171-173 (lines 2266-2304)
- **Afrobeat (Tony Allen)**: Section 3.2 (patterns 89-93, lines 1203-1270)
- **Highlife bell**: `~/lab/world-rhythm-library.md` Section 1.4

### Tango / Milonga / Candombe
- **Argentina**: `~/lab/beatforge-research/musicology/andean-south-american.md` Part V
- **Uruguay (candombe)**: Part VII

### Flamenco (Cajon)
- Referenced in `~/lab/beatforge-research/musicology/andean-south-american.md` (Peru/cajon origins)

### Bollywood
- `~/lab/beatforge-research/musicology/indian-subcontinent.md` Section 6

### K-pop
- `~/lab/beatforge-research/musicology/east-asian-traditions.md` Section 8

### Country / Blues / Gospel
- **Country**: `~/lab/drum-patterns-library.md` Section 1.4 (patterns 19-24)
- **Blues shuffle**: Section 1.3 (patterns 14-18)
- **Gospel**: Section 2.4 (patterns 69-73)

### UK Garage / 2-Step
- **Patterns**: `~/lab/drum-patterns-library.md` Section 5.5 (patterns 159-163, lines 2104-2169)

### Classic Breakbeats
- **Amen Break, Funky Drummer, Apache, Impeach the President, Think, and more**: `~/lab/drum-patterns-library.md` Section 6 (patterns 179-188, lines 2373-2498)
- **Programmed Classics** (Blue Monday, Pacific State, Strings of Life, Acid Tracks): Section 7 (patterns 189-194, lines 2501-2577)

---

## F. PRACTICE & EDUCATION

- **Deliberate practice theory** (Ericsson): `~/lab/drum-machine-practice-methodology.md` Section 1.1
- **Speed training** (incremental tempo increase): `~/lab/drum-machine-practice-methodology.md`
- **Random mute exercises**: `~/lab/drum-machine-practice-methodology.md`
- **40 PAS rudiments** (paradiddle, flam, drag, roll, etc.): `~/lab/drum-machine-practice-methodology.md`; `~/lab/drum-patterns-library.md` Section 8 (patterns 195-202, lines 2581-2677)
- **Polyrhythm training**: `~/lab/drum-machine-practice-methodology.md`; `~/lab/world-rhythm-library.md` Section 1.6
- **Odd meter acclimation**: `~/lab/drum-machine-practice-methodology.md`; `~/lab/drum-patterns-library.md` Section 2.5; `~/lab/beatforge-research/musicology/balkan-traditions.md`
- **Konnakol** (Carnatic vocal percussion): `~/lab/drum-machine-practice-methodology.md`; `~/lab/beatforge-research/musicology/indian-subcontinent.md` Section 3
- **Groove templates**: `~/lab/drum-machine-practice-methodology.md`
- **Spaced repetition**: `~/lab/drum-machine-practice-methodology.md`

---

## G. UX / DESIGN

### Instrument Hardware UI Design
- **"One knob per function" philosophy**: `~/lab/beatforge-research/instrument-hardware-ui-design.md` Section 1
- **Direct manipulation / immediacy**: `~/lab/beatforge-research/instrument-hardware-ui-design.md` Section 1
- **Constraints as creativity** (808's 16 steps, 303's range): `~/lab/beatforge-research/instrument-hardware-ui-design.md` Section 1
- **TR-808/909 layout analysis** (color coding, LED states, tempo slider): `~/lab/beatforge-research/instrument-hardware-ui-design.md` Section 2
- **Elektron UI** (8-encoder+page, trig+encoder parameter lock gesture): `~/lab/beatforge-research/instrument-hardware-ui-design.md` Section 2
- **MPC pad design** (4x4, velocity, 16 Levels mode): `~/lab/beatforge-research/instrument-hardware-ui-design.md` Section 2
- **Maschine** (color-coded pads, dual displays, Smart Strip): `~/lab/beatforge-research/instrument-hardware-ui-design.md` Section 2
- **Teenage Engineering** (OP-1 minimalism, four-encoder philosophy): `~/lab/beatforge-research/instrument-hardware-ui-design.md` Section 2
- **Synthesizer signal flow layout** (left-to-right: osc→filter→amp): `~/lab/beatforge-research/instrument-hardware-ui-design.md` Section 3
- **10 design principles** (immediacy, visibility, progressive disclosure, flow state): `~/lab/beatforge-research/instrument-hardware-ui-design.md` Section 4
- **Accessibility in instruments** (screen readers, color-blind, motor): `~/lab/beatforge-research/instrument-hardware-ui-design.md` Section 5

### Music Software UI Design
- **DAW paradigms** (Ableton Session/Arrangement, FL pattern, Logic Step Sequencer, Bitwig Grid, Reason rack): `~/lab/beatforge-research/music-software-ui-design.md` Section 1
- **Drum machine plugins** (XO spectral browser, Battery, Geist, Arcade): `~/lab/beatforge-research/music-software-ui-design.md` Section 2
- **Web audio app UIs** (Splice, BandLab, Audiotool, Drumbit, Chrome Music Lab): `~/lab/beatforge-research/music-software-ui-design.md` Section 3
- **Mobile music apps** (Koala Sampler, GarageBand, Korg Gadget, Zenbeats): `~/lab/beatforge-research/music-software-ui-design.md` Section 4
- **Key UI patterns** (grid, mixer, waveform, knob, envelope, browser, transport): `~/lab/beatforge-research/music-software-ui-design.md` Section 5
- **Color systems in DAWs** (Ableton muted, FL neon, Push RGB encoding): `~/lab/beatforge-research/music-software-ui-design.md` Section 6
- **Animation and feedback** (LEDs, waveform playback, micro-interactions): `~/lab/beatforge-research/music-software-ui-design.md` Section 7
- **Responsive music UI** (breakpoints, touch targets, landscape/portrait): `~/lab/beatforge-research/music-software-ui-design.md` Section 8
- **Onboarding** (first-run, tooltips, progressive complexity, demo patterns): `~/lab/beatforge-research/music-software-ui-design.md` Section 12

### Visual Design Systems
- **Design languages** (skeuomorphic vs flat vs futuristic vs vintage): `~/lab/beatforge-research/music-visual-design-systems.md` Section 1
- **Component library spec** (buttons, knobs, faders, displays, meters, grids): `~/lab/beatforge-research/music-visual-design-systems.md` Section 2
- **Design tokens** (CSS custom properties for colors, typography, spacing, animation): `~/lab/beatforge-research/music-visual-design-systems.md` Section 2
- **Color theory for music** (state colors, velocity-as-brightness, frequency-as-hue): `~/lab/beatforge-research/music-visual-design-systems.md` Section 3
- **Extracted hardware palettes** (TR-808, TR-909, MPC, Push, OP-1 hex values): `~/lab/beatforge-research/music-visual-design-systems.md` Section 3
- **16-column musical grid layout**: `~/lab/beatforge-research/music-visual-design-systems.md` Section 4
- **Iconography** (standard music icons, drum machine icons, sizing): `~/lab/beatforge-research/music-visual-design-systems.md` Section 5
- **Step indicator styles** (circles, squares, LED states): `~/lab/beatforge-research/music-visual-design-systems.md` Section 6
- **Knob rendering styles** (flat arc, 3D, dot, value ring): `~/lab/beatforge-research/music-visual-design-systems.md` Section 6
- **Motion design** (animation timing table, 60fps budgets, GPU properties): `~/lab/beatforge-research/music-visual-design-systems.md` Section 7
- **Top 30 best music interfaces** (hardware, software, web, mobile): `~/lab/beatforge-research/music-visual-design-systems.md` Section 8

### General UX
- **Step sequencer grid** (16-step notation used throughout all pattern files): all pattern files
- **Pad interface** (MPC-style layout): `~/lab/drum-machine-keyboard-reference.md` Section 1
- **Keyboard mapping** (QWERTY layouts from Ableton, FL Studio, custom): `~/lab/drum-machine-keyboard-reference.md` Section 1.1 (lines 18-100)
- **MIDI Learn** (map hardware controllers): `~/lab/MIDI_TECHNICAL_REFERENCE.md` Section 11; `~/lab/drum-machine-keyboard-reference.md`
- **Knob/fader controls** (AudioParam mapping): `~/lab/web-audio-dsp-reference.md` Section 3
- **Waveform display**: `~/lab/web-audio-dsp-reference.md` (AnalyserNode)
- **Responsive design** (orientation handling, mobile vs desktop): `~/lab/pwa-audio-reference.md` manifest orientation field (line 36-41)
- **Accessibility** (keyboard navigation, ARIA): `~/lab/drum-machine-keyboard-reference.md` (accessibility sections); `~/lab/beatforge-research/instrument-hardware-ui-design.md` Section 5
- **Mobile considerations** (touch events, iOS audio unlock, viewport, PWA install): `~/lab/pwa-audio-reference.md`; `~/lab/web-audio-dsp-reference.md` (iOS Safari gotcha lines 63-72)
- **Shortcuts** (PWA app shortcuts): `~/lab/pwa-audio-reference.md` lines 74-101
- **File handling** (import WAV/MIDI): `~/lab/pwa-audio-reference.md` lines 165-173
