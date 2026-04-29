# BeatForge — World Percussion Sound Design

## The Problem

The current spec defines 9 synthesized voices modeled on the 808/909/707 (kick, snare, closed hat, open hat, clap, tom, cowbell, rimshot). This covers Western electronic and pop genres, but the Library now has 600+ patterns from 40+ global traditions. You can't play a Gnawa lila, a flamenco bulería, or an Ewe agbekor with kick and snare.

The sound palette needs to grow — without abandoning the "no samples, no licensing" constraint that keeps the bundle small and the project legally clean.

## Approach: Synthesis-First + Optional Sampler

Two complementary systems:

1. **Expanded synthesis engine** — 30+ voice types organized by percussion family, all built with Web Audio API. Ships in Phase 1-2. Zero external dependencies.
2. **Sampler engine** — user-imported samples mapped to pads. Ships in Phase 3-4. Lets users load real recordings of instruments that are hard to synthesize convincingly.

The synthesis engine is the core product. The sampler is the escape hatch for authenticity.

---

## Percussion Families & Synthesis Strategies

### Family 1: MEMBRANES — Struck Drums

The largest family. All membrane drums share: oscillator (pitch) + noise (attack) + resonant body (filter). Differentiated by tuning range, body size, attack character, and decay.

| Voice | Real Instruments | Synthesis Technique | Parameters |
|-------|-----------------|---------------------|------------|
| **Kick (low)** | 808 kick, surdo, taiko odaiko, bass drum | Sine osc + pitch sweep (150→40Hz) + amp envelope | Tune, Decay, Click, Drive |
| **Kick (mid)** | 909 kick, bombo, zabumba | VCO + steeper sweep + noise transient | Tune, Decay, Attack, Tone |
| **Tom (tunable)** | Toms, timbales, repinique | Sine osc + pitch sweep + resonant BP filter | Tune (-24/+24), Decay, Tone, Body |
| **Conga/Tumba** | Congas, atabaque, djun djun | Sine osc (lower, longer decay) + formant filter for body resonance | Tune, Decay, Body Size, Skin |
| **Bongo** | Bongos, kpanlogo drum, kidi | Higher-pitched sine + short envelope + noise crack | Tune, Decay, Crack, Tone |
| **Goblet (open)** | Darbuka doum, djembe bass, tabla ge | Low sine + pitch curve + LP resonance for "round" body | Tune, Body, Resonance, Decay |
| **Goblet (tone)** | Darbuka tek, djembe tone, conga open | Mid sine + shorter decay + BP filter for focused tone | Tune, Tone, Decay, Ring |
| **Goblet (slap)** | Darbuka ka, djembe slap, conga slap | Noise burst + very short sine transient + HP filter | Tune, Snap, Decay, Brightness |
| **Frame drum** | Bodhrán, daf, bendir, pandeiro, riq | Sine osc + body resonance (low Q bandpass) + "skin" noise | Tune, Size, Skin, Jingles |
| **Tabla Na/Tin** | Tabla dayan (right hand, open ring) | Sine + harmonics at specific ratios (1:2.5:4.2) for the characteristic "singing" tone | Tune, Ring, Brightness, Syahi |
| **Tabla Ge/Ghe** | Tabla bayan (left hand, bass) | Low sine + pitch bend + body resonance | Tune, Bend, Body, Decay |
| **Talking drum** | Dundun/tama, changgo | Sine osc with **continuous pitch bend via envelope or LFO** — unique because pitch changes DURING the note | Tune, Bend Range, Bend Speed, Decay |

**Synthesis insight:** Most membrane drums = `OscillatorNode(sine)` → `BiquadFilterNode(bandpass)` → `GainNode(envelope)`. Differentiation comes from:
- **Pitch sweep range** (big drum = wide sweep, small drum = narrow)
- **Body filter** (Q and center frequency simulate drum body size)
- **Noise content** (attack transient — more noise = more "slap")
- **Decay time** (tight skin = short, loose skin = long)

---

### Family 2: METALS — Bells, Gongs, Cymbals

Metallic sounds use **non-harmonic frequency ratios** — the partials are NOT integer multiples of the fundamental. This is what makes them "clang" instead of "ring."

| Voice | Real Instruments | Synthesis Technique | Parameters |
|-------|-----------------|---------------------|------------|
| **Hi-hat (closed)** | Hi-hat, chick | 6 square waves at non-harmonic ratios → BP + HP → short VCA | Tune, Decay, Tone, Tightness |
| **Hi-hat (open)** | Open hi-hat, splash | Same as closed, longer decay | Tune, Decay, Tone |
| **Ride** | Ride cymbal, china | Similar to hi-hat but lower ratios, longer decay, more body | Tune, Decay, Bell, Wash |
| **Cowbell** | Cowbell, agogo, cencerro, campana | Two square waves at non-harmonic freqs → BP | Tune, Decay, Tone |
| **Agogo (hi/lo)** | Agogo bells, gankogui (Ewe double bell) | Two pitches, each: square wave pair → BP filter | Hi Tune, Lo Tune, Decay, Brightness |
| **Gong** | Gamelan gong, tam-tam, Chinese luo | Multiple sine waves at inharmonic ratios + slow amplitude beating | Tune, Shimmer, Decay, Size |
| **Bell (pitched)** | Gamelan saron/demung, kenong, kempul | FM synthesis (modulator:carrier ratio ~1.4:1 or ~2.76:1) | Tune, Modulation, Decay, Damping |
| **Crotales/Finger cymbal** | Zills, manjira, tingsha | High-pitched sine pair with slight detuning + long ring | Tune, Beat Rate, Decay |
| **Qraqeb/Castanets** | Gnawa qraqeb, flamenco castanets | Short metallic bursts — noise + ring mod | Rate, Brightness, Ring |

**Synthesis insight:** `MetalSynth` in Tone.js already does this for hi-hats. For gamelan/gongs, **FM synthesis** is the key — a single carrier:modulator pair can produce a huge range of metallic timbres by varying the ratio and modulation index.

---

### Family 3: WOOD — Claves, Blocks, Sticks

Short, pitched, minimal sustain. Simple to synthesize.

| Voice | Real Instruments | Synthesis Technique | Parameters |
|-------|-----------------|---------------------|------------|
| **Clave** | Claves, palitos, rhythm sticks | Short sine burst (1200-2500Hz) + very fast decay (<50ms) | Tune, Decay, Brightness |
| **Woodblock** | Woodblock, temple block, mokugyo | Sine + noise transient + resonant BP filter | Tune, Body, Decay |
| **Rimshot** | Rim click, cross-stick | Short noise burst + sine transient | Tune, Crack, Tone |
| **Log drum** | Slit drum (pate, teponaztli, garamut) | Two resonant sine tones (body has two pitches) + noise attack | Hi Tune, Lo Tune, Body, Decay |
| **Cajón (high)** | Cajón slap, edge hit | Noise burst + short sine + HP filter (snare-like but woodier) | Tune, Snap, Tone, Buzz |
| **Cajón (low)** | Cajón bass, center hit | Sine osc + body resonance + LP filter | Tune, Body, Decay |
| **Bamboo** | Angklung, bamboo shaker, rainstick | Filtered noise burst with resonant comb filter (hollow tube resonance) | Tune, Size, Decay |

---

### Family 4: SHAKERS & SCRAPERS — Noise-Based

All generated from **filtered white/pink noise** shaped by envelopes and filters.

| Voice | Real Instruments | Synthesis Technique | Parameters |
|-------|-----------------|---------------------|------------|
| **Shaker** | Maracas, shekere, axatse, egg shaker, cabasa | BP-filtered noise burst, very short | Tune, Decay, Brightness, Density |
| **Tambourine** | Pandeiro jingles, riq, tamborim, kanjira | Noise burst + metallic ring (hi-hat-like partials mixed in) | Jingle Tune, Skin Tune, Decay |
| **Güiro/Scraper** | Güiro, guacharaca, washboard, reco-reco, ferrinho | **Repeated short noise bursts** (comb filter or rapid-fire trigger) — "scraping" is many tiny hits | Speed, Brightness, Length, Tone |
| **Rain/Continuous** | Ocean drum, rainstick, continuous shaker roll | Continuous filtered noise with slow amplitude modulation | Density, Brightness, Speed |

**Synthesis insight:** Shakers are the simplest — `noise → BiquadFilter(bandpass) → GainNode(short envelope)`. Güiro is trickier: it's essentially a **rapid burst of tiny noise hits**, which can be done with a fast LFO on the gain node or by scheduling many micro-events.

---

### Family 5: HANDS — Claps, Slaps, Stomps

Body percussion — huge in flamenco, gospel, folk traditions worldwide.

| Voice | Real Instruments | Synthesis Technique | Parameters |
|-------|-----------------|---------------------|------------|
| **Handclap** | 808 clap, palmas (flamenco), gospel clap | Multiple noise bursts (3-7) with 1-5ms offsets → reverb tail | Spread, Brightness, Room, Tightness |
| **Palmas (sordas)** | Flamenco muted clap | Shorter, darker version of handclap — cupped hands | Tune, Decay, Muffled |
| **Palmas (fuertes)** | Flamenco open clap | Brighter, snappier — open palms | Tune, Snap, Ring |
| **Stomp/Zapateado** | Foot stomp, zapateado, step dance | Low thud (sine ~80-120Hz) + noise transient + short body resonance | Tune, Weight, Floor, Decay |
| **Snap** | Finger snap | Very short HP-filtered noise burst | Tune, Brightness |
| **Chest/Thigh slap** | Body percussion (konnakol practice) | Mid-pitched noise + sine → BP filter | Tune, Body, Decay |

---

### Family 6: STRINGS & SPECIAL

Instruments that don't fit neatly into other categories but appear in world rhythms.

| Voice | Real Instruments | Synthesis Technique | Parameters |
|-------|-----------------|---------------------|------------|
| **Berimbau** | Brazilian berimbau (open/closed/buzz) | **Karplus-Strong** (delay line + LP filter = plucked string) + pitch bend for "wah" | Tune, Wah, Buzz, Decay |
| **Jaw harp** | Jew's harp, dan moi, komuz, morchang | Pulse wave + formant filter (mouth resonance) | Tune, Mouth, Resonance |
| **Kalimba** | Mbira, thumb piano, likembe | Sine + slight inharmonic partials + short decay | Tune, Buzz, Decay |
| **Cuíca** | Brazilian friction drum | Sine osc with **pitch portamento triggered by pressure** — the "laughing" sound | Tune, Slide Range, Speed |
| **Whistle** | Samba whistle, apito, referee whistle | Pure sine or triangle wave at high frequency | Tune, Vibrato, Decay |

---

## Kit Presets (Curated Mappings)

Instead of just "808 / 909 / 707", the kit system maps the right voices to pattern traditions:

### Core Kits (Phase 1-2)

| Kit Name | Voices | Use With |
|----------|--------|----------|
| **808 Classic** | Kick(808), Snare, CH, OH, Clap, Tom×3, Cowbell, Rimshot | Western electronic, hip-hop |
| **909 House** | Kick(909), Snare, CH, OH, Clap, Ride, Crash | House, techno, trance |
| **707 Vintage** | Lighter kick, snare, hats, toms, cowbell, tamb | Pop, disco, new wave |
| **TR-727 Latin** | Conga(hi/lo), Bongo(hi/lo), Timbale(hi/lo), Agogo, Cabasa, Maracas, Claves, Cowbell | Salsa, samba, Latin jazz, bossa |

### World Kits (Phase 2-3)

| Kit Name | Voices | Use With |
|----------|--------|----------|
| **West African** | Agogo bell (hi/lo), Shaker, Clave, Goblet(open/tone/slap), Conga×2, Talking drum | Ewe, Mande, Yoruba patterns |
| **Afro-Cuban** | Clave, Cowbell, Agogo, Conga(hi/lo/slap), Bongo(hi/lo), Timbale(hi/lo), Güiro, Maracas | Son, rumba, salsa, mambo |
| **SWANA** | Goblet(doum/tek/ka), Frame drum, Finger cymbal, Riq/Tamb, Clave | Turkish, Arabic, Persian |
| **Tabla** | Tabla Na, Tabla Tin, Tabla Ge, Tabla Ghe, Tabla Dha (layered), Frame drum | Hindustani, Bollywood |
| **Flamenco** | Cajón(hi/lo), Palmas sordas, Palmas fuertes, Stomp, Snap | Flamenco palos |
| **Samba Bateria** | Kick(surdo), Tom(repinique), Shaker(ganzá), Tamb(pandeiro), Agogo, Whistle, Cuíca | Samba, pagode, carnival |
| **Gamelan** | Gong(large), Gong(med), Bell(hi), Bell(lo), Clave(kepyak), Goblet(kendhang) | Javanese, Balinese |
| **Celtic** | Frame drum(bodhrán), Clave(bones), Stomp, Shaker | Irish, Scottish |
| **Taiko** | Kick(odaiko-deep), Tom(nagado), Tom(shime-high), Clave(hyoshigi) | Japanese |
| **Gnawa** | Clave(guembri pluck — Karplus-Strong), Qraqeb(metallic), Stomp, Handclap | Moroccan Gnawa |
| **Ethiopian** | Frame drum(kebero), Goblet(open/slap), Handclap, Shaker | Eskista, tizita |
| **Andean** | Cajón(hi/lo), Shaker(chajcha), Clave(charango tap), Frame drum(bombo) | Festejo, huayno |

### Custom Kit Builder (Phase 3)

Users can create kits by picking any voice from any family:
- 8-16 pads per kit
- Each pad = one voice type + parameter overrides
- Save/load custom kits to IndexedDB
- Share as JSON

---

## Sampler Engine (Phase 3-4)

For sounds that synthesis can't convincingly approximate (or when users want the real thing):

### Architecture

```
Sample Source → Gain → Filter → Voice Chain (same as synth voices)
```

| Feature | Description |
|---------|-------------|
| **Import** | Drag-drop or file picker (WAV, MP3, OGG, FLAC) |
| **Storage** | IndexedDB via Dexie.js (same as patterns/kits) |
| **Trim** | Start/end points with waveform display |
| **Pitch** | Repitch via playbackRate (no time-stretch — keeps it simple) |
| **One-shot / Loop** | One-shot for hits, loop for continuous sounds |
| **Choke groups** | Open/closed hi-hat behavior (open hat silenced by closed) |
| **Velocity layers** | Map 2-4 samples to velocity ranges for realism |
| **Voice chain** | Same filter/drive/send controls as synth voices |

### Why Both Synth + Sampler

| | Synthesis | Sampler |
|-|-----------|---------|
| **Bundle size** | Zero — it's code | Grows with each sample |
| **Offline** | Always works | Only if samples cached |
| **Tweakability** | Every parameter exposed | Limited to trim/pitch/filter |
| **Authenticity** | Approximation (good enough for practice/exploration) | Real recordings |
| **Licensing** | No concerns | User's responsibility |
| **Discovery** | Can morph between sounds | Fixed recordings |

The synthesis engine is the **core** — it ships first and works everywhere. The sampler is for users who want to go deeper.

---

## Voice Count & Performance Budget

Web Audio API on modern browsers can handle 30-50 simultaneous voices without issues. Our constraint is more about UI than audio:

| Constraint | Limit | Reasoning |
|------------|-------|-----------|
| Voices per kit | 8-16 | UI space: 8 pads on mobile, up to 16 on desktop |
| Polyphony per voice | 4 | Overlapping hits (open hi-hat ringing while new one triggers) |
| Total active nodes | ~100 | AudioContext node limit is much higher, but keep graph clean |
| AudioWorklet voices | 2-4 max | For the most CPU-intensive synthesis (custom DSP) |

---

## Synthesis Implementation Priority

### Phase 1 (MVP — ship with Practice Mode)
- Kick (808 + 909)
- Snare
- Hi-hat (closed + open)
- Handclap
- Tom (tunable — covers timbale, repinique with tuning)
- Cowbell
- Rimshot/Clave (dual-purpose)
- **Shaker** (new — needed for almost every world rhythm)
- **Goblet drum 3-way** (doum/tek/ka — new — covers darbuka, djembe approximation)

**= 12 voices, enough for 808 kit + basic world rhythms**

### Phase 2 (Studio Mode)
- Conga (hi/muted/lo)
- Bongo (hi/lo)
- Agogo bell (hi/lo)
- Frame drum (tunable)
- Güiro/Scraper
- Cajón (hi/lo)
- Palmas (sordas/fuertes)
- Stomp
- Tambourine/Pandeiro
- Gong/Bell (FM-based, for gamelan)
- Talking drum (pitch-bend drum)
- Tom (additional tunings)

**= 25+ voices, enough for TR-727 Latin + most world kits**

### Phase 3 (Library Mode + Custom Kits)
- Tabla voices (Na, Tin, Ge, Ghe)
- Berimbau (Karplus-Strong)
- Kalimba/Mbira
- Cuíca
- Whistle
- Log drum / Slit drum
- Jaw harp
- Qraqeb / Castanets
- Sampler engine

**= 35+ voices + sampler, covers virtually everything**

---

## How Kits Map to Patterns

When a user opens a Library pattern, the app auto-selects the best kit:

```typescript
// Pattern metadata includes suggested kit
interface Pattern {
  // ...existing fields...
  suggestedKit: string;        // "afro-cuban", "808", "west-african", etc.
  voiceMap: {
    [trackLabel: string]: {
      family: VoiceFamily;     // "membrane", "metal", "wood", etc.
      voiceType: string;       // "goblet-open", "agogo-hi", etc.
      defaultTune: number;     // semitones offset
      defaultDecay: number;    // ms
    }
  };
}
```

The Library mode can show: *"This pattern sounds best with the West African kit"* and auto-load it. Users can always swap to a different kit — playing agbekor with 808 sounds is a valid creative choice.

---

## Open Questions

1. **Should Phase 1 include the 3-way goblet drum?** It's the single most impactful addition for world rhythms — covers darbuka, djembe, and conga approximations with one voice type. Cost: ~200 lines of synthesis code.

2. **TR-727 as a dedicated kit or distributed across families?** The 727 voices (congas, bongos, timbales, agogo, cabasa, maracas, claves) map 1:1 to our family system. Could offer a "727" preset that's really just a curated selection from families 1-4.

3. **Choke groups across families?** Open/closed hi-hat is standard. But world percussion has many more: open/muted conga, open/closed darbuka, damped/ringing gong. Should choke groups be user-configurable per kit?

4. **Sample packs as community feature?** Users could share sample kits as downloadable JSON+audio bundles via GitHub PRs. This would let the community contribute authentic recordings of instruments we can't synthesize well.
