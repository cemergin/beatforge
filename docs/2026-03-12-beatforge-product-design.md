# BeatForge — Product Design Specification

**Version:** 1.0
**Date:** March 12, 2026
**Author:** Cem Ergin + Claude (CPO/Design Lead)
**Status:** Draft

---

## 1. What This Is

A browser-based rhythm playground that starts as a metronome and evolves into a drum machine. Two modes share one audio engine: Practice for daily musician use, Studio for beat creation. A Library lets users explore 350+ world rhythms with their cultural stories.

Works offline. No install. No signup. No backend. Open source.

## 2. Who It's For

**Primary:** Practicing musicians who need a smart metronome with native support for odd meters and beat groupings (e.g., 9/8 as 2+2+2+3). They play instruments like bağlama, guitar, bass, drums, keys — and want a backing track that understands world rhythms.

**Secondary:** Beat explorers and bedroom producers who want to make beats with 808/909 sounds, discover rhythms from around the globe, and export their work.

**User #1 is the founder.** If Cem doesn't use this daily for bağlama practice, it has failed.

## 3. Core Value Proposition

"A metronome that secretly evolves into a drum machine — runs in your browser, no install."

The entry point is dead simple (a metronome). The depth is enormous (a full drum machine with world rhythms). The medium is the browser — zero friction, works anywhere.

## 4. Personality

**The Friendly Playground.** Colorful, inviting, low intimidation factor. Think Chrome Music Lab meets a real instrument. NOT dark/moody/gear-nerd. The complexity is there but hidden behind friendly doors. Cultural depth feels like discovery and adventure, not academic lecture.

## 5. Architecture

### 5.1 Two Modes, One Engine

```
/practice  — Metronome + backing tracks + practice tools (coral accent #e17055)
/studio    — Step sequencer + sound design + song mode (purple accent #6c5ce7)
/library   — Browse world rhythms + cultural stories (green accent #00b894)
```

All three share:
- Audio engine (Tone.js + Web Audio API)
- Pattern format (JSON)
- Kit/sound system
- Beat grouping system
- IndexedDB storage

A pattern created in Studio loads in Practice as a backing track. A pattern discovered in Library opens in either mode.

### 5.2 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit + TypeScript |
| Build | Vite |
| Audio engine | Tone.js + raw Web Audio API |
| Custom synthesis | AudioWorklet (808/909 voice recreation) |
| Scheduling | Lookahead pattern (25ms callback, 100ms lookahead) |
| Persistence | IndexedDB via Dexie.js |
| PWA | Workbox (service worker, precaching, offline) |
| Visualization | Canvas 2D |
| Hosting | Static (Vercel / Netlify / GitHub Pages) |

### 5.3 Constraints

- Solo developer
- No backend — everything runs client-side
- No user accounts — all data in IndexedDB + JSON export
- Must work fully offline (PWA)
- Open source (MIT license)
- Synthesized sounds only (no sample licensing)

## 6. Practice Mode

The daily driver. Optimized for a 30-minute practice session.

### 6.1 Layout (Desktop: 3-column)

```
┌─────────────────────────────────────────────────────┐
│  ♪ BeatForge   [Practice]  Studio  Library    ⚡    │
├──────────┬──────────────────────┬───────────────────┤
│          │                      │ PRACTICE TOOLS    │
│ Pattern  │   Pattern Grid       │                   │
│ Name     │   (read-only or      │ Speed Trainer     │
│ Origin   │    editable)         │ ┌─────────────┐   │
│          │                      │ │120→160 BPM  │   │
│  ╔═══╗   │   KK ■□□■□□■□□      │ │+5 / 8 bars  │   │
│  ║138║   │   SD □□■□□■□□■      │ │ ○ time ● cyc │   │
│  ╚═══╝   │   HH ■■■■■■■■■      │ └─────────────┘   │
│  BPM     │   OH □□□□■□□□■      │                   │
│          │                      │ Strong/Weak       │
│ ●● ●● ●● │                      │ ▪ Strong: 100%    │
│ ●●●      │                      │ ▫ Weak: 60%       │
│ 2+2+2+3  │                      │                   │
│          │                      │ Subdivisions      │
│ [▶ PLAY] │                      │ [♩] ♪♪ ♬♬ 3let   │
│          │                      │                   │
│ 🔀Random │                      │ Count-in: [2] bars│
│ 📂Browse │                      │                   │
│ 🎹Studio │                      │ Swing ────●── 50% │
│          │                      │                   │
│ ┌──────┐ │                      │ Stop after: ∞     │
│ │About │ │                      │                   │
│ │this  │ │                      │                   │
│ │rhythm│ │                      │                   │
│ └──────┘ │                      │                   │
└──────────┴──────────────────────┴───────────────────┘
```

### 6.2 Beat Grouping System

The killer feature. Not just "9/8" but "9/8 as 2+2+2+3."

Each beat group gets a distinct color:
- Group 1: coral (#ff6b6b)
- Group 2: gold (#ffd93d)
- Group 3: purple (#6c5ce7)
- Group 4: teal (#00b894)

Within each group:
- **Solid color** = strong beat (downbeat of group) → full velocity
- **Faded/transparent** = weak beat → reduced velocity

The dots appear everywhere: BPM area, grid column headers, transport bar. They are the visual language of the app.

The user selects a time signature, then specifies the grouping:
- 9/8 → options: 2+2+2+3, 3+2+2+2, 2+3+2+2, 2+2+3+2
- 7/8 → options: 2+2+3, 3+2+2, 2+3+2
- 5/4 → options: 3+2, 2+3
- 4/4 → default: 4, or custom: 3+3+2 (tresillo)

### 6.3 Speed Trainer

The #1 practice feature. Two modes:

**Cycle-based:** "Play for Y bars at current BPM, then increase by N BPM"
- Example: 8 bars → +5 BPM, starting at 120, target 160
- Visual: progress bar showing 120 ──●──── 160

**Time-based:** "Play for X minutes at current BPM, then increase by N BPM"
- Example: 2 minutes → +3 BPM
- Visual: countdown timer + progress bar

The BPM display updates live as the trainer progresses. Clear visual feedback of current position in the start→target range.

### 6.4 Practice Tools (complete list)

| Tool | Description | Control |
|------|-------------|---------|
| Speed Trainer | Gradual BPM increase by time or cycles | Start/target BPM, increment, trigger mode |
| Strong/Weak | Velocity differentiation for beat groupings | Strong %, Weak % |
| Subdivisions | Audible click subdivisions | Quarter, 8th, 16th, triplet chips |
| Count-in | Bars before playback starts | 0, 1, 2, 4 selector |
| Swing | Percentage-based shuffle | Slider: 50% (straight) → 67% (triplet) |
| Stop after | Auto-stop after N bars | Number input or ∞ |

### 6.5 First-Time Experience

1. App loads with a random preset pattern from the Library
2. Pattern is NOT auto-playing (respects autoplay policy + gives user agency)
3. Grid shows the pattern visually — steps lit up, beat grouping dots visible
4. Cultural label visible: "Karşılama · Turkey · Wedding dance · 9/8 (2+2+2+3)"
5. Big play button invites interaction
6. User presses play → hears something they maybe didn't know before
7. Each visit can feature a different random pattern

## 7. Studio Mode

The creative laboratory. Build beats, design sounds, arrange songs.

### 7.1 Layout (Desktop)

```
┌──────────────────────────────────────────────────────────┐
│ ♪ BeatForge   Practice  [Studio]  Library    Export ▾  ⚡│
├──────────────────────────────────────────────────────────┤
│ [⏮][▶][⏹]  138 BPM  [9/8] ●●●●●●●●● 2+2+2+3   Sw:50% │
│                                        Pattern: My Beat  │
├────┬─────────────────────────────────────┬───────────────┤
│Kit │  1  ·  2  ·  3  ·  4  · ·          │Sound: KK(808) │
│    │                                     │               │
│ KK │  ■  □  □  ■  ■  □  □  ■  □         │ [808][909][707]│
│ SD │  □  □  ■  □  □  ■  □  □  ■         │               │
│ CH │  ▪  ■  ▪  ■  ▪  ■  ▪  ■  ▪         │  (Tune) (Dec) │
│ OH │  □  □  □  □  ■  □  □  □  ■         │  (Tone) (Lvl) │
│ CP │  □  □  □  □  □  □  □  □  □         │               │
│ TM │  □  □  □  □  □  □  □  □  □         │ Filter [LP]   │
│ CB │  □  □  □  □  □  □  □  □  □         │ Cut ────── Res │
│ RS │  □  □  □  □  □  □  □  □  □         │               │
│+Add│                                     │ Drive  Rev Del│
│    │  [Copy][Paste][Shift][Rev][Rnd][Clr]│ Pan    Volume │
│    │                                     │               │
│    │  Song: [Intro×1]→[Verse×4]→[Fill×1] │               │
│    │        →[Chorus×2]→[+ Add]          │               │
└────┴─────────────────────────────────────┴───────────────┘
```

### 7.2 Step Grid

**Step resolution rules:**
- In x/8 meters: one step = one eighth note (9/8 = 9 steps, 7/8 = 7 steps, 12/8 = 12 steps)
- In x/4 meters: one step = one sixteenth note (4/4 = 16 steps, 3/4 = 12 steps, 5/4 = 20 steps)
- Column headers colored by beat grouping

**Interaction:**
- Click to toggle step on/off (default velocity derived from beat grouping position: strong or weak)
- Shift+click or vertical drag on a step to set custom velocity (override grouping default)
- Right-click to cycle velocity: off → weak → medium → strong → off
- Step opacity encodes velocity: solid = strong, faded = weak (matches beat grouping system)
- Active steps glow with subtle box-shadow
- Playhead highlights current column during playback

### 7.3 Sound Design (per voice)

Each instrument track gets these controls:

| Parameter | Range | Notes |
|-----------|-------|-------|
| Kit type | 808 / 909 / 707 / File (Phase 4) | Synthesis models; File = user sample import, deferred to Phase 4 |
| Tune | -24 to +24 semitones | Coarse pitch |
| Decay | 1ms – 10s | Amplitude decay time |
| Tone | 0 – 100% | Brightness/character |
| Level | -inf to +6dB | Volume |
| Filter | LP / HP / BP | Type selector |
| Cutoff | 20Hz – 20kHz | Filter frequency |
| Resonance | 0 – 100% | Filter resonance |
| Drive | 0 – 100% | Saturation/distortion |
| Reverb send | 0 – 100% | Amount to reverb bus |
| Delay send | 0 – 100% | Amount to delay bus |
| Pan | L100 – R100 | Stereo position |

### 7.4 Song Mode / Pattern Chaining

Patterns arranged in a horizontal strip at the bottom of the sequencer:

```
[Intro ×1] → [Verse ×4] → [Fill ×1] → [Chorus ×2] → [+ Add]
```

Each block is a colored pill showing pattern name and repeat count. Drag to reorder. Click to edit the pattern. The chain plays back sequentially — this is how larger musical structures are built.

*Note: Song Mode ships as part of Phase 2's Studio release. It is a core part of the Studio experience, not a deferred sub-feature.*

### 7.5 Pattern Operations

| Operation | Description |
|-----------|-------------|
| Copy | Copy current pattern to clipboard |
| Paste | Paste clipboard into current slot |
| Shift → / ← | Circular rotation of all steps |
| Reverse | Flip pattern direction |
| Random | Generate random pattern (density-controlled) |
| Clear | Reset all steps |
| → Practice | Send this pattern to Practice mode |

## 8. Library Mode

The exploration and education hub.

### 8.1 Layout (Desktop: 3-column)

```
┌────────────────────────────────────────────────────────┐
│ ♪ BeatForge  Practice  Studio  [Library]   🔍 Search  │
├──────────┬─────────────────────────┬───────────────────┤
│ REGIONS  │  PATTERN CARDS          │ DETAIL PANEL      │
│          │                         │                   │
│ 🌍 All   │ ┌─────┐ ┌─────┐       │ Karşılama         │
│ 🌊 W.Afr │ │Karşı│ │Agbe │       │ Turkey · Thrace   │
│ 🏝 Carib │ │lama │ │kor  │       │ 9/8 · Intermediate│
│ 🎭 Brazil│ │     │ │     │       │                   │
│ 🏔 Andes │ └─────┘ └─────┘       │ THE STORY         │
│ 🕌 Turkey│ ┌─────┐ ┌─────┐       │ Karşılama means   │
│ 🌙 Arabic│ │Son  │ │Tin- │       │ "face to face"... │
│ 🎻 Iran  │ │Clave│ │tal  │       │                   │
│ 🪷 India │ └─────┘ └─────┘       │ RELATED RHYTHMS   │
│ ⛩ Japan  │                         │ → Roman Havası    │
│ 🎎 Korea │                         │ → Rŭchenitsa      │
│ 🏯 Gameln│                         │ → Kalamatianos    │
│ 🎺 Balkn │                         │                   │
│ 🐎 Mongol│                         │ [▶ Practice]      │
│          │ FILTERS                 │ [🎹 Studio]       │
│ Time sig │ [4/4][6/8][7/8][9/8].. │ [📋 Copy JSON]    │
│ Diff     │ [Beg][Int][Adv]        │                   │
│ Genre    │ [Trad][Elec][Jazz]..   │                   │
└──────────┴─────────────────────────┴───────────────────┘
```

### 8.2 Pattern Cards

Each card shows:
- Pattern name and origin (country, region, context)
- Time signature badge
- Mini grid preview (colored by beat grouping)
- One-line description
- BPM range and difficulty
- Ensemble track count (if multi-part)
- Three action buttons: Play (audition), Practice (load), Studio (edit)

### 8.3 Detail Panel

When a pattern is selected, the right panel shows:
- Full cultural story (conversational tone, 2-3 paragraphs)
- Related rhythms with cross-cultural connections
- Tags (time sig, difficulty, genre, instruments)
- Actions: Load in Practice, Open in Studio, Copy JSON

### 8.4 Future: YouTube Links

Not in MVP. Later, each pattern can include a `videos: []` array in its JSON — community-contributed links to real performances. YouTube embeds are trivial to add and bring patterns to life. Perfect for open-source contributions.

## 9. Data Model

### 9.1 Pattern (JSON)

```typescript
interface Pattern {
  id: string;
  name: string;
  origin: {
    region: string;       // "Turkey"
    subregion?: string;   // "Thrace"
    tradition?: string;   // "Wedding dance"
  };
  timeSignature: {
    numerator: number;    // 9
    denominator: number;  // 8
    grouping: number[];   // [2, 2, 2, 3]
  };
  bpm: {
    default: number;      // 138
    min: number;          // 120
    max: number;          // 160
  };
  swing: number;          // 0-100 (50 = straight, 67 = triplet)
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tracks: Track[];
  culturalNote?: string;  // short description for cards
  story?: string;         // full cultural story for Library detail
  relatedPatterns?: string[]; // IDs of related patterns
  tags?: string[];
  videos?: string[];      // YouTube URLs (future)
}

interface Track {
  instrument: string;     // "KK", "SD", "CH", "OH", etc.
  kit: '808' | '909' | '707' | 'custom';
  steps: Step[];
  soundParams?: SoundParams;
}

interface Step {
  active: boolean;
  velocity: number;       // 0-127 (0 = off)
}

interface SoundParams {
  tune: number;           // -24 to +24 semitones
  decay: number;          // ms
  tone: number;           // 0-100
  level: number;          // dB
  filterType: 'lp' | 'hp' | 'bp';
  filterCutoff: number;   // Hz
  filterResonance: number;// 0-100
  drive: number;          // 0-100
  reverbSend: number;     // 0-100
  delaySend: number;      // 0-100
  pan: number;            // -100 to +100
}
```

### 9.2 Song/Chain

```typescript
interface Song {
  id: string;
  name: string;
  sections: SongSection[];
}

interface SongSection {
  patternId: string;
  name: string;           // "Intro", "Verse", "Fill", "Chorus"
  repeats: number;
}
```

### 9.3 Kit

```typescript
interface Kit {
  id: string;
  name: string;           // "808 Classic", "909 House", "Anatolian"
  voices: { [instrument: string]: SoundParams };
}
```

## 10. Audio Engine

### 10.1 Architecture

```
AudioContext (single)
├── Voice 1-N (per-track chains)
│   ├── Source (Tone.MembraneSynth | MetalSynth | NoiseSynth | Player)
│   ├── Filter (BiquadFilterNode)
│   ├── Drive (WaveShaperNode)
│   ├── Gain (envelope / VCA)
│   ├── StereoPanner
│   └── Channel Gain → Send to Reverb / Delay / Master
├── Reverb Bus (ConvolverNode)
├── Delay Bus (Tone.FeedbackDelay)
├── Master Bus
│   ├── DynamicsCompressor
│   ├── Master Gain
│   └── AnalyserNode (visualization)
└── AudioDestination
```

### 10.2 Synthesis

808/909/707 voices synthesized in-browser — no samples:

| Voice | Technique |
|-------|-----------|
| Kick (808) | Sine oscillator with pitch sweep (~150Hz→40Hz) + amplitude envelope |
| Kick (909) | VCO with steeper pitch sweep + noise click transient |
| Snare | Two oscillators (~185Hz + ~349Hz) + bandpass-filtered white noise |
| Hi-hat (closed) | 6 square wave oscillators at non-harmonic ratios → bandpass + HP → short VCA |
| Hi-hat (open) | Same as closed, longer decay |
| Clap | Multiple short noise bursts with 1-5ms offsets → filtered tail |
| Tom | Sine oscillator with pitch sweep + envelope |
| Cowbell | Two square waves at non-harmonic frequencies → bandpass |
| Rimshot | Short noise burst + sine transient |

### 10.3 Scheduling

Lookahead pattern:
- `setInterval` callback every 25ms on main thread (or Web Worker for background tab resilience)
- Looks ahead 100ms and schedules any upcoming notes via `source.start(when)` against `AudioContext.currentTime`
- Audio thread executes with sample accuracy
- Swing implemented by delaying every other subdivision

## 11. Visual Design

### 11.1 Color System

**Mode accents:**
- Practice: coral (#e17055, #ff6b6b)
- Studio: purple (#6c5ce7, #a29bfe)
- Library: teal (#00b894, #00cec9)

**Beat grouping colors:**
- Group 1: #ff6b6b (coral)
- Group 2: #ffd93d (gold)
- Group 3: #6c5ce7 (purple)
- Group 4: #00b894 (teal)

**Base palette:**
- Background: #f8f6f3 (warm cream)
- Surface: #fff
- Border: #e8e4df
- Muted surface: #f0ebe4
- Text primary: #1a1a2e
- Text secondary: #666
- Text muted: #888, #aaa

**Velocity encoding:**
- Solid color = strong beat / full velocity
- 55% opacity = medium velocity
- 33% opacity = weak / ghost

### 11.2 Typography

- BPM display: system-ui, 48-72px, weight 800
- Section headers: system-ui, 10px, uppercase, letter-spacing 1.5px
- Body: system-ui, 12-13px
- Parameter values: system-ui, 11px, weight 600
- Monospace for BPM and time values

### 11.3 Design Principles

1. **Warm and inviting** — light backgrounds, rounded corners, soft shadows
2. **Beat grouping dots everywhere** — the visual language of the app
3. **Opacity = velocity** — consistent across all views
4. **Color = mode** — always know where you are (coral/purple/green)
5. **Big controls for big actions** — BPM and play button are the biggest elements
6. **Progressive disclosure** — start simple, reveal depth on demand
7. **Cultural labels always visible** — every pattern shows its origin

## 12. PWA & Offline

### 12.1 Service Worker Strategy

| Resource | Strategy | Rationale |
|----------|----------|-----------|
| App shell (HTML/CSS/JS) | Cache First | Instant load after first visit |
| Pattern library (JSON) | Cache First, update in background | Patterns rarely change |
| Audio synthesis code | Precache | Must work offline |
| Images/icons | Cache First | Static assets |

### 12.2 Manifest Shortcuts

```json
"shortcuts": [
  { "name": "Practice", "url": "/practice", "description": "Open metronome" },
  { "name": "Studio", "url": "/studio", "description": "Open beat maker" },
  { "name": "Library", "url": "/library", "description": "Browse rhythms" }
]
```

### 12.3 Media Session API

Lock screen shows: pattern name, BPM, play/pause controls. Enables controlling playback without unlocking phone during practice.

### 12.4 Screen Wake Lock

Active during playback to prevent screen sleep during practice sessions.

## 13. Phasing

### Phase 0.5 — Foundation (ship internally)
- SvelteKit project scaffold with PWA
- Audio engine (Tone.js synthesis for 808 kit)
- Beat grouping system (time sig + grouping data model)
- Basic step sequencer (play/stop, toggle steps)
- Pattern JSON format

### Phase 1 — Practice Mode (first public release)
- Full Practice layout (BPM, transport, beat grouping dots)
- Speed Trainer (cycle-based and time-based)
- Strong/Weak accent control
- Subdivisions, count-in, swing
- Preset pattern library (~50 world rhythms with cultural labels)
- Pattern save/load (IndexedDB)
- PWA + offline
- Responsive (mobile + desktop)

### Phase 2 — Studio Mode
- Full step sequencer grid (clickable, velocity)
- Sound design panel (tune, decay, tone, filter, drive, sends)
- 808 + 909 + 707 kit selectors
- Pattern operations (copy, paste, shift, reverse, random, clear)
- Song/chain mode
- Pattern export/import (JSON)
- "→ Practice" bridge

### Phase 3 — Library Mode
- Region-based browsing sidebar
- Pattern cards with mini grid previews
- Filter chips (time sig, difficulty, genre)
- Detail panel with cultural stories
- Related rhythms cross-links
- Search

### Phase 4 — Polish & Community
- Additional kits and patterns (community PRs)
- WAV export (OfflineAudioContext)
- MIDI export
- YouTube video links in Library
- Keyboard shortcuts (QWERTY-to-pads)
- Web MIDI input
- User sample import (drag-drop)

## 14. What We Are NOT Building (MVP)

- User accounts / auth / cloud sync
- Real-time collaboration
- Plugin system / WAM hosting
- AI-generated patterns
- Piano roll view
- Pad view (MPC-style finger drumming)
- Audio recording / sampling from microphone
- Social features / sharing to social media
- Monetization / premium tiers
- Native mobile apps

## 15. Success Criteria

The app succeeds if Cem uses it daily for bağlama practice. Specifically:

1. Opens the app, selects or loads a 9/8 pattern
2. Sets the Speed Trainer (e.g., 120→160 BPM, +5 every 8 bars)
3. Practices for 30 minutes with the backing track
4. Occasionally explores the Library to discover new rhythms
5. Sometimes enters Studio to tweak a pattern or create a new one
6. Saves patterns locally, exports JSON to share or backup

If this workflow is smooth, fast, and pleasant — we've won.

## Appendix A: Mobile Layouts

### Practice (mobile — single column, scrollable)

Stack order (top to bottom):
1. Top nav bar (Practice / Studio / Library tabs)
2. Pattern banner (name, origin, time sig — compact)
3. BPM display (large) with ± buttons and tap-to-set
4. Beat grouping dots
5. Mini pattern grid (read-only, compact)
6. Transport controls (play/prev/next — centered)
7. Practice tools (Speed Trainer, Strong/Weak, Subdivisions, Count-in, Swing, Stop after — card-style, scrollable)
8. Quick actions row (Random, Browse, Studio link)

Transport should be sticky at the bottom so play/stop is always accessible without scrolling.

### Studio (mobile — landscape recommended)

On phone-sized screens, Studio shows a simplified view:
- Transport bar (top, compact)
- Step grid (full width, horizontally scrollable if needed)
- Instrument list as horizontal scrollable strip (not sidebar)
- Sound design opens as a bottom sheet when a track is selected
- Song chain strip below the grid
- Prompt to rotate to landscape for best experience

### Library (mobile — single column)

- Search bar (top)
- Region pills (horizontal scroll)
- Filter chips (horizontal scroll)
- Pattern cards (single column, full width)
- Tapping a card expands its detail inline (or opens a bottom sheet) rather than a side panel

## Appendix B: Accessibility

**Phase 1 (MVP) accessibility:**
- All playback controls (play, stop, BPM adjust) keyboard-accessible
- Step grid cells are focusable via Tab/Arrow keys, toggled with Space/Enter
- ARIA labels on all controls: `aria-label="Kick drum, step 3, active, strong beat"`
- Beat grouping colors are supplemented with position numbers (1, ·, 2, ·, 3, ·, 4, ·, ·) — not color alone
- High-contrast mode toggle (inverts to dark background, brighter colors)
- Minimum touch targets: 44×44px (48×48px preferred)

**Later phases:**
- Full keyboard shortcut layer (Phase 4)
- Screen reader announcements for playback position
- MIDI controller mapping as alternative to mouse/touch

## Appendix C: Transient UI State

Practice tool settings (Speed Trainer config, Strong/Weak percentages, subdivision selection, count-in, swing, stop-after) are **transient UI state** — they are not persisted in the Pattern JSON. They reset to defaults on each visit. A future enhancement could save these as per-pattern practice presets, but this is not in scope for MVP.

## Appendix D: Random Pattern Button

The "Random" button in Practice mode loads a random pattern from the built-in preset library. Behavior:
- Selects from the full library (all regions, all time signatures)
- Does NOT auto-play — loads the pattern and waits for the user to press play
- Displays the new pattern's name, origin, and cultural label
- If the user has previously filtered by time signature (e.g., only 9/8), Random respects that filter

## Appendix E: URL Sharing (deferred)

LZ-compressed pattern state in URL parameters is a natural fit for this architecture but is deferred to Phase 4. JSON export/import covers the sharing use case for MVP. URL sharing would enable "click this link to hear my beat" without any backend — a compelling future feature.

## 16. Open Questions

- **Product name:** "BeatForge" is a working title. The name should match the "Friendly Playground" vibe — BeatForge feels more "gear nerd."
- **Dark mode:** The warm light theme is the identity, but should we offer a dark mode toggle for stage/studio use?
- **Pattern contribution format:** How should community members submit patterns via GitHub PRs? One JSON file per pattern? Bundled by region?

---

*Research corpus: 51,000+ lines across 34 documents at `~/lab/beatforge-research/`*
*Brainstorm notes: `~/lab/beatforge-research/brainstorm-notes.md`*
*Visual mockups: `~/lab/.superpowers/brainstorm/`*
