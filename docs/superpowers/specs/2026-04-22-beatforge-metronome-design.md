# BeatForge Metronome — v1 Design Specification

**Version:** 1.0
**Date:** April 22, 2026
**Author:** Cem Ergin + Claude
**Status:** Approved for implementation planning
**Supersedes (partially):** `docs/2026-03-12-beatforge-product-design.md` — amendments at end of this spec

---

## 1. Context & Decision Summary

BeatForge splits into two projects:

- **BeatForge Metronome** (this spec) — world-rhythm metronome. Ships first. Scope is the existing React prototype in `design/`, productionized for daily use.
- **BeatForge Drum Synth** (future, separate project) — full drum synthesizer with deep sound-design capabilities. Does not yet exist in any form. Shared components (design system, rhythm visualizations) extracted into a library *when* that project begins, not before.

"Studio" in the current prototype is a simple step-sequencer that ships with the metronome. It is not the future Drum Synth. Possible rename later so the "serious studio" name stays free.

**Key decisions taken during brainstorming:**

| Decision | Choice | Rationale |
|---|---|---|
| Project split | One repo now, extract later | Premature extraction produces APIs shaped by one consumer. |
| Tech stack | React + Vite + TypeScript | Amends original spec's SvelteKit choice. Prototype is React; translation cost + user-as-reviewer expertise outweigh Svelte ergonomics. |
| Deploy target | GitHub Pages | User preference; self-host later if needed. |
| Pattern library | 85 patterns v1.0 (80 world rhythms + 5 polyrhythm exercises) | Stress-tests schema across continents; grow to ~650 post-launch via batches. |
| Discoverability | First-class — search, facets, world map, starter paths, grouping browser | 650-pattern endgame requires real exploration UX. |
| Voices | 5 (KK/SN/HH/OH/CP) | Closed set; kits determine synthesis. |
| Kits | 7 (808, 909, 707, 727, frameDrum, tabla, gamelan) | Covers the regional sonic palettes needed. |
| Default kit | Required per-pattern | Culturally coherent baseline; user overrides are session-only. |
| Polyrhythm | Per-track subdivisions | Each track declares N equal steps per bar; engine schedules independently. |
| Persistence | localStorage (UI state) + IndexedDB (user patterns) | No backend, no accounts. |
| PWA | Workbox via `vite-plugin-pwa` | Offline-first after first load. |

---

## 2. Scope & Product Shape

### 2.1 What v1.0 is

Browser-based world-rhythm metronome with three tabs sharing one audio engine.

- **Practice** — BPM, accents, grouping, swing, kit select, speed trainer, count-in, stop-after timer, polyrhythm overlay. Plays any pattern (built-in or user-saved) as a backing track. Three visualizations: circular, linear, pill. Beat-grouping dots show canonical group structure in distinct colors.
- **Studio** — simple step sequencer for sketching patterns on top of the same engine.
- **Library** — browse built-in patterns + saved patterns, with full discoverability (search, chip-row facets, world map, related rhythms, starter paths, grouping browser). Cultural-context story on every pattern.

**Hard constraints (from original spec, reaffirmed):** no accounts, no backend, fully offline after first load, open source (MIT), synthesized audio only (no samples).

### 2.2 Highlights & Recent (Quick Access)

Client-side persistence of starred patterns + auto-tracked recents. Both shown as horizontal strips on the Practice tab and in the Library landing. Per-device only (no sync).

- **Highlights** — explicit ⭐ on any pattern. `localStorage.bf_highlights = [patternId]`. User-ordered.
- **Recent** — auto-tracked, newest-first, deduped, capped at 20. `localStorage.bf_recent`.

### 2.3 Explicitly NOT in v1.0

- BeatForge Drum Synth (separate future project)
- 650-pattern library (grows post-launch in batches)
- WAV / MIDI export (deferred)
- Web MIDI input, user-recorded samples (deferred)
- Sign-in, cloud sync, community features (never — by design)

### 2.4 Success criteria for v1.0

1. The founder uses it daily for bağlama practice and it doesn't get in the way.
2. A musician who doesn't know "9/8 as 2+2+2+3" can *see* the grouping and feel it inside 30 seconds.
3. All 85 seed patterns (80 world + 5 polyrhythm) play correctly across the represented traditions (the continental-spread stress test).
4. Installable as a PWA, fully functional offline after first load.

---

## 3. Repo & Codebase Structure

### 3.1 Layout

```
beatforge/
├── app/                        ← React app (new, where shipping code lives)
│   ├── src/
│   │   ├── audio/              ← AudioEngine, voices, scheduler
│   │   ├── patterns/           ← schema, loader, seed data
│   │   │   └── seed/
│   │   │       └── <region>/<id>.json
│   │   ├── modes/              ← Practice/, Studio/, Library/
│   │   ├── components/         ← CircularGrid, PillGrid, LinearGrid, BeatDots, shared UI
│   │   ├── lib/                ← storage, utils, types
│   │   ├── styles/             ← CSS (starting from prototype's styles.css)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/                 ← manifest, icons, service worker source
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── design/                     ← existing prototype — read-only reference
├── research/                   ← existing corpus — source of truth for patterns & stories
├── docs/                       ← specs (this file lives here)
└── README.md
```

### 3.2 Tooling

- Vite + React 18 + TypeScript (strict)
- ESLint + Prettier
- Vitest for unit tests (engine timing math, pattern validation, storage helpers)
- Playwright for smoke tests (Practice loads + plays, Library filter works)
- No heavy UI framework; hand-rolled CSS continuing from the prototype
- `vite-plugin-pwa` for Workbox-powered service worker
- Fuse.js (~10KB) for fuzzy search
- Dexie (~25KB) for IndexedDB
- Zod for pattern validation

### 3.3 Deploy

- **GitHub Pages** via GitHub Actions workflow on push to `main`
- Vite `base: '/beatforge/'` in config (or custom domain later)
- Self-host transition is trivial later — no Vercel/third-party lock-in

### 3.4 Monorepo transition (later)

When the Drum Synth project begins:
- Convert to pnpm workspaces
- Genuinely shared code (`audio/`, proven-reusable `components/`, types, design tokens) moves into `packages/`
- `app/` becomes `apps/metronome/`, new `apps/synth/` joins
- Not before we have a second consumer.

---

## 4. Audio Engine & Voice Architecture

### 4.1 Engine foundations

- **Pure Web Audio API.** No Tone.js. Original spec included Tone.js; prototype dropped it; keeping that. Amending the original spec.
- **Per-track independent scheduler.** Each track runs its own scheduling loop at its own step duration. See §4.5 for polyrhythm.
- **Master chain:** mixdown → compressor → destination + reverb send tap (per-kit reverb level).
- **Visual callback** drives UI via `requestAnimationFrame` reading last-scheduled step — not `setTimeout` (jittery at high step rates).

### 4.2 Timing model — "BPM = steps per minute"

BPM is the rate at which the smallest displayed interval ticks. Every grid step is one "beat" in this system.

```
stepSeconds = 60 / BPM
barSeconds = pattern.steps × stepSeconds
```

| Pattern | BPM | Steps | Bar duration |
|---|---|---|---|
| Generic 16-step | 120 | 16 | 8s |
| Karşılama (9/8) | 276 | 9 | 1.96s |
| Horon (7/8) | 360 | 7 | 1.17s |

`stepUnit` (8 / 16 / 4) is **informational only** — drives display labels and future MIDI export. Engine timing reads only `steps` and `bpm`.

UI labels BPM as `BPM · step/min` to prevent confusion with traditional quarter-note BPM.

### 4.3 Voice set — closed

```ts
type VoiceId = 'KK' | 'SN' | 'HH' | 'OH' | 'CP';
```

Five voices. Same across all kits. Kits determine synthesis; patterns assign velocities per step per voice.

### 4.4 Kits (7)

Each kit provides synthesis recipes for all 5 voices. Per-kit reverb send level.

| Kit | Tradition | Voice mapping | Reverb |
|---|---|---|---|
| **808** | Hip-hop / electronic | Canonical drum machine | 0.05 |
| **909** | House / techno | Canonical drum machine | 0.05 |
| **707** | Pop / rock / folk | Canonical drum machine | 0.10 |
| **727** | Afro-Cuban / Brazilian / Latin | KK→bongo/low-conga, SN→high-conga, HH→cowbell/agogo-hi, OH→maracas, CP→claves | 0.12 |
| **Frame Drum** | Turkish / Arabic / Persian / Balkan | KK→doum (deep center), SN→tek (rim), HH→finger snap, OH→jingle (zils), CP→slap | 0.08 |
| **Tabla** | Indian (Hindustani) | KK→ge/ghe (bayan bass w/ upward pitch bend), SN→na/ta (dayan rim), HH→tin (closed bell), OH→tun (open resonant), CP→dha (composite ge+na — simultaneous trigger at pattern level) | 0.15 |
| **Gamelan** | Indonesian / gamelan / SE Asian metal | KK→gong ageng, SN→kenong, HH→saron, OH→kempul, CP→kempyang. All inharmonic modal resonators. | 0.35 |

Gamelan kit requires significant reverb send — the sound's character includes the pavilion ambience.

### 4.5 Polyrhythm — per-track subdivisions

Each track declares how many equal steps fit in one bar.

```ts
type Track = Velocity[] | {
  pattern: Velocity[];
  subdivisions?: number;   // equal steps per bar; defaults to main pattern's `steps`
  cycle?: number;           // wrap length for short patterns; defaults to subdivisions
};
```

**Semantics:**

- `pattern.steps` (top-level) = **main subdivision** — BPM controls this
- Track `subdivisions` = N equal steps per bar for that track
- Bar duration = `pattern.steps × (60 / BPM)`
- Track step duration = `barDuration / track.subdivisions`
- All tracks complete one cycle per bar and re-align at bar boundary

**Example — 3:4 triplets over quarters at 120 BPM:**

```json
{
  "steps": 4,
  "bpm": { "default": 120 },
  "tracks": {
    "KK": [2, 0, 2, 0],
    "HH": { "pattern": [2, 0, 0], "subdivisions": 3 }
  }
}
```

Bar = 2s. KK step = 0.5s (4 notes/bar). HH step = 0.667s (3 notes/bar). Triplets.

**Multi-polyrhythm:**

```json
{
  "steps": 4,
  "tracks": {
    "KK": [2, 0, 2, 0],
    "SN": { "pattern": [2, 0, 0], "subdivisions": 3 },
    "HH": { "pattern": [2, 0, 0, 0, 0], "subdivisions": 5 },
    "OH": { "pattern": [2, 0, 0, 0, 0, 0, 0], "subdivisions": 7 }
  }
}
```

All four subdivisions (4, 3, 5, 7) align every bar.

**Supported ratios in seed library:** 3:2, 3:4, 4:3 (standard), 5:4, 7:4 (flagged `experimental`).

### 4.6 Visualization — polyrhythm rendering

- **Circular** — concentric rings per track, each with its own notch count. Polyrhythm obvious at a glance.
- **Linear** — rows per track; rows span same bar width but have different cell counts. Rows with fewer cells have wider cells.
- **Pill** — same model as linear.

### 4.7 Swing

- Gated per-pattern via `swingable: true/false`
- Applies to 16th-note-based patterns (stepUnit = 16); non-swingable patterns ignore the control
- Range 50% (straight) → 67% (triplet feel)

### 4.8 Engine LOC budget

| Component | LOC |
|---|---|
| Scheduler (per-track independent) | ~600 |
| 7 kits × 5 voices synthesis | ~1,450 |
| Master bus + compressor + reverb | ~100 |
| Kit selector + per-kit reverb send | ~50 |
| Polyrhythm bar-boundary logic | ~50 |
| Visualization polyrhythm rendering (shared with `components/`) | ~150 |
| Tests | ~500 |
| **Total engine + viz** | **~2,900** |

---

## 5. Pattern Schema & Data Pipeline

### 5.1 TypeScript schema

```ts
type VoiceId = 'KK' | 'SN' | 'HH' | 'OH' | 'CP';
type Velocity = 0 | 1 | 2;   // 0=off, 1=ghost, 2=accent
type KitId = '808' | '909' | '707' | '727' | 'frameDrum' | 'tabla' | 'gamelan';

type Track = Velocity[] | {
  pattern: Velocity[];
  subdivisions?: number;
  cycle?: number;
};

type RegionId =
  | 'turkey-ottoman' | 'arabic-swana' | 'persia' | 'india'
  | 'west-africa' | 'cuba-afrocaribbean' | 'brazil'
  | 'andean-south-america' | 'caribbean' | 'balkans'
  | 'iberia-flamenco' | 'gamelan-southeast-asia'
  | 'east-asia' | 'celtic-europe' | 'electronic-western';

type Genre =
  | 'folk-dance' | 'classical' | 'devotional' | 'popular'
  | 'electronic' | 'hip-hop' | 'jazz' | 'ceremonial';

interface Pattern {
  // Identity
  id: string;                                 // kebab-case, unique
  name: string;                               // display (may include diacritics)
  origin: string;                             // "Turkey · Thrace"
  tradition: string;                          // free text, specific ("Romani wedding")
  genre: Genre;                               // controlled enum

  // Rhythmic shape
  timeSig: string;                            // "9/8", "7/8", "4/4", "12/8", "5/4"
  grouping: number[];                         // [2,2,2,3]
  steps: number;                              // main grid size
  stepUnit: 8 | 16 | 4;                       // informational only
  poly?: boolean;                             // any track has non-default subdivisions

  // Tempo
  bpm: { default: number; min: number; max: number };

  // Content
  tracks: Partial<Record<VoiceId, Track>>;

  // Kit
  defaultKit: KitId;                          // required — loads with pattern

  // Discoverability
  region: RegionId;
  country?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];                             // ['wedding','dance','romani']
  instruments?: string[];                     // ['frame drum','bağlama','clarinet']
  swingable: boolean;
  relatedIds?: string[];                      // hand-curated cross-cultural bridges

  // Narrative
  story?: string;                             // 1-3 sentences from research corpus
  sources?: string[];                         // research file refs

  // Reserved for v2+ (Drum Synth era) — unused in v1
  customVoices?: Record<string, { synth: string; params: object }>;
}
```

### 5.2 Kit defaults by region

| Region | Default kit |
|---|---|
| Turkish / Ottoman | frameDrum |
| Arabic / SWANA | frameDrum |
| Persia | frameDrum |
| India | tabla |
| West Africa | 727 |
| Cuba / Afro-Caribbean | 727 |
| Brazil | 727 |
| Caribbean modern (reggaeton, dancehall) | 808 |
| Balkans | frameDrum |
| Iberia / Flamenco | 727 |
| Gamelan / SE Asia | gamelan |
| East Asia — samulnori | gamelan |
| East Asia — taiko | 808 |
| Celtic / Europe | 707 |
| Electronic / Western | 808 or 909 per pattern |

Pattern switches → engine auto-loads `pattern.defaultKit`. User kit overrides are **session-only** (discarded on next pattern load or page refresh).

### 5.3 Seed library — 80 patterns, continental spread

| Region | Count | Examples |
|---|---|---|
| Turkish / Ottoman | 12 | Karşılama, Roman Havası, Aksak, Zeybek, Horon, Ciftetelli, Düyek, Semai, Yürük, Devr-i Turan, Devr-i Kebir, Sofyan |
| Arabic / SWANA | 8 | Maqsoum, Baladi, Saidi, Masmoudi, Wahda, Ayoub, Sama'i, Chiftetelli |
| Persia | 3 | Reng, Tasnif, Chaharmezrab |
| India | 10 | Tintal, Dadra, Rupak, Ektal, Jhaptal, Keherwa, Deepchandi, Chautal, Ādi, Khanda Chapu |
| West Africa | 10 | Agbekor, Gahu, Kpanlogo, Kuku, Soli, Dununba, Fanga, Adowa, Bembé 6/8, Djembe standard |
| Cuba / Afro-Caribbean | 10 | Son clave (2-3, 3-2), Rumba clave, Bolero, Cha-cha, Mambo, Guaguancó, Bembé, Rumba Columbia, Comparsa, Cáscara |
| Brazil | 5 | Bossa, Samba, Samba-reggae, Baião, Maracatu |
| Caribbean modern | 4 | Reggaeton dembow, Dancehall, Kompa, Soca |
| Balkans | 5 | Rachenitsa, Daichovo, Kopanitsa, Čoček, Oro |
| Iberia / Flamenco | 3 | Bulería, Soleá, Tangos |
| Gamelan / SE Asia | 3 | Lancaran, Kotekan, Gendhing |
| East Asia | 2 | Taiko base, Samulnori |
| Celtic / Europe | 3 | Irish reel, Jig, Scandinavian polska |
| Electronic / Western | 2 | Boom-bap, Four-on-the-floor |

Plus **5 polyrhythm exercises** tagged `polyrhythm`: Hemiola (3:2), Triplets over quarters (3:4), Four over three (4:3), Five over four (5:4 — experimental), Seven over four (7:4 — experimental).

Total: 85 patterns at v1.0 launch.

### 5.4 Data pipeline — Markdown research → JSON

Research corpus (`research/patterns/*.md`) is prose + notation. Migration is the most underestimated work in this project.

**Per-batch workflow:**

1. **Select** a research file or subsection
2. **LLM extraction** — `scripts/extract-patterns.ts` feeds notation + surrounding prose to Claude API; emits draft JSON to `patterns/drafts/<region>/<id>.json`. Includes `defaultKit` assignment based on region + character.
3. **Validation sandbox** — dev-only route `/_patterns` loads drafts, plays each, shows canonical fields. Click ✓ / ✗ / needs-fix.
4. **Proof-hearing checklist per pattern:**
   - Does the kick fall on the canonical "strong" beats of the grouping?
   - Does the tempo feel natural?
   - Does the meter match the stated time sig?
   - Does the default kit produce a culturally-coherent sound?
5. **Promote** approved drafts → `app/src/patterns/seed/<region>/<id>.json`
6. **Tests** — Vitest auto-loads every seed pattern, asserts Zod schema validity, asserts no undefined voice IDs, asserts `grouping` sums consistently with `steps`.

### 5.5 Pattern storage in-app

- `app/src/patterns/seed/<region>/<id>.json` — per-pattern files (diffs + PRs clean)
- `app/src/patterns/index.ts` — `import.meta.glob('./seed/**/*.json', { eager: true })` builds a flat array at build time
- v1.0: bundle all 85 (~45KB)
- v1.x+: if seed grows to 650, switch to route-level code split — Library lazy-loads patterns per region on tab open

**User patterns (from Studio):**

- Same schema with `user: true` flag + `region: 'user'`
- IndexedDB via Dexie, table `userPatterns` keyed by `id`
- Show up in Highlights/Recent + Library under a "Yours" tab
- Export/Import JSON backup for data portability

### 5.6 Validation via Zod

- Every pattern parsed through Zod schema at load time
- Seed-pattern errors fail the build (CI gate)
- User-pattern errors get quarantined — shown with "⚠️ corrupted" badge, no crash

---

## 6. Discoverability & Library UX

### 6.1 Zoned-scroll layout (not filters-sidebar)

```
🔍 Search                           ← sticky header
Highlights ⭐ [chip strip, horizontal]
Recent        [chip strip, horizontal]

🗺 World Map                        ← stylized SVG, 15 region blobs

🌱 Starter Paths                    ← curated educational sequences

meter  [all][4/4][6/8][7/8][9/8][11/8]...   ← always-visible chip rows
region [all][Turkey][India][Cuba][Brazil]...
genre  [all][folk-dance][classical]...
kit    [all][808][909][frameDrum][tabla]...
level  [all][beginner][intermediate]...
tempo  [──────●──────]  60–360
                                  24 / 80 match

🎯 Browse by Grouping               ← unique angle
   [2+2+3][2+3+2][2+2+2+3][3+3+3]...

🎲 Surprise me

Results grid (filtered)             ← responsive to chip rows above
```

Rationale: with 15 regions and 80+ patterns growing to 650+, a single grid + hidden drawer underserves exploration. Zoned scroll invites wandering; always-visible chip rows (matching prototype's pattern) make filters discoverable.

### 6.2 World Map

Custom stylized SVG, not geographically accurate — visual clarity > precision. 15 region blobs with regional colors and pattern counts. Tap → drawer with that region's patterns + region-level story intro (1 paragraph). Lazy-loaded (only when scrolled into view).

### 6.3 Starter Paths (v1.0)

Each path: title, subtitle, context paragraph, 5–12 patterns in difficulty order. Loads first pattern; Practice tab shows path progress (`2 of 5 · Düyek · next → Karşılama`).

Initial paths:

- Turkish Usul 101 (Sofyan → Düyek → Karşılama → Aksak → Zeybek)
- Clave Universe (Son 2-3 → Son 3-2 → Rumba → Bolero → Guaguancó)
- Meet the Meters (4/4 → 6/8 → 7/8 → 9/8 → 12/8 → 11/8 → 5/4)
- Beginner's World Tour (one accessible rhythm from 12 regions)
- Afro-Cuban Foundations (Cáscara → Son → Mambo → Guaguancó → Bembé)
- Indian Tal Basics (Keherwa → Dadra → Rupak → Tintal → Jhaptal)

Paths are data (`app/src/patterns/paths.ts`) — community contribution pattern over time.

### 6.4 Chip-row filters

Always visible. Multiple filters combine with AND; multiselect within a facet is OR.

| Row | Values |
|---|---|
| meter | all, 4/4, 3/4, 5/8, 6/8, 7/8, 9/8, 10/8, 11/8, 12/8, 5/4, poly |
| region | all + 15 regions |
| genre | all + 8 genres |
| kit | all + 7 kits |
| level | all, beginner, intermediate, advanced |
| tempo | slider 30–500 BPM |

`tags` intentionally NOT a chip row (too many values) — surfaces via search instead.

### 6.5 Grouping browser (unique angle)

Dedicated zone below the facet rows. Shows visual grid of distinct `grouping` arrays with counts:

```
2+2+3 (7 steps)     9 rhythms  →
2+3+2               4 rhythms
3+2+2               3 rhythms
2+2+2+3 (9)         7 rhythms
3+3+3               4 rhythms
4+4+4+4 (16)        18 rhythms
2+2+2+2+3 (11)      3 rhythms
```

Clicking a grouping surfaces patterns from *different traditions* sharing the same pulse — Karşılama / Roman Havası / Aksak / Zeybek (all 2+2+2+3) side-by-side. Cross-cultural insight no other metronome offers.

### 6.6 Pattern detail view

Modal (desktop) / full-screen sheet (mobile). Triggered by tapping any pattern card.

```
Karşılama                      ⭐ ✕
Turkey · Thrace · Wedding dance
────────────────────────────────
[ ▶ mini-player — plays in-place ]

9/8 · 2+2+2+3 · ♩=276 · intermediate
frameDrum kit · #wedding #dance #romani

Story
Karşılama means "face to face" — …

Instruments: frame drum, bağlama, clarinet

─ Related ─────────────────────
Same grouping (2+2+2+3):
  Roman Havası · Aksak · Zeybek
Same region (Turkey):
  Horon · Düyek · Sofyan
Similar groove:
  Daichovo (Bulgaria · 9/8 · 2+2+2+3)

Source: research/patterns/turkish-arabic-…

[ Load in Practice ] [ Open in Studio ]
```

Every card has actions: star, load, open-in-studio, share-link (URL with `?pattern=<id>` for deep links).

### 6.7 Related rhythms algorithm

Three computed sets, deduped, shown as labeled groups:

- **Same grouping** — identical `grouping` array
- **Same region** — matching `region`
- **Similar groove** — fingerprint match (§6.8)

Plus hand-curated `relatedIds` on the pattern for cross-cultural bridges that aren't algorithmic.

### 6.8 Rhythmic fingerprint — "similar groove"

v1 algorithm:

1. Normalize every pattern to a 48-step grid (common multiple of 16/12/9/8/7/6 — nearest-step resample)
2. Extract `KK` positions as a 48-bit vector
3. Extract `SN` positions as a 48-bit vector
4. Concatenate → 96-bit fingerprint
5. Distance = Hamming distance between fingerprints
6. For pattern X, "similar groove" = top 5 by distance **excluding same-region patterns** (surfaces cross-cultural matches, not regional siblings)

### 6.9 Search

- Sticky header input, always accessible
- Keyboard shortcut `/` to focus
- Fuse.js across `name`, `origin`, `tradition`, `story`, `tags`, `instruments`
- Diacritics-normalized (`karsilama` finds `Karşılama`)
- Live results dropdown, keyboard-navigable

### 6.10 Highlights + Recent on Practice

Practice tab left sidebar, above the pattern card:

```
⭐ Karşılama  Bossa  Rumba  +     ← starred row
Recent: Zeybek  Maqsoum  Kuku      ← recent row
```

Keyboard: `1`–`9` loads Nth highlight. `⌘K` opens quick-switcher modal (fuzzy search from anywhere).

### 6.11 Mobile

- Library stays zoned scroll (stacks well)
- Facet rows remain visible (wrap if needed)
- Pattern detail = full-screen sheet
- Region map: pinch/zoom, tap to select
- Starter paths = horizontal carousel

---

## 7. Practice Mode Features

### 7.1 Core controls (port from prototype)

- BPM hero: big number, ± buttons, drag slider, keyboard arrows
- Play / stop
- Kit selector (session-only override of pattern default)
- View switch (circular / linear / pill)
- Grouping selector (permutations of pattern's canonical grouping)
- Strong / Weak accent sliders
- Swing slider (50–67%, gated per pattern)

### 7.2 Speed Trainer

- From BPM → To BPM
- Step size (default +5)
- Mode: **cycles** (every N bars) OR **time** (every Y minutes)
- Runs during playback; auto-caps at target BPM
- Visible indicator when active

### 7.3 Count-in

- Setting: 0 / 1 / 2 / 4 bars (default 1)
- On play: clicks count-in for N bars before pattern begins
- Neutral hat/click voice (kit-independent), beat 1 accented
- Grid dims during count-in; beat dots still animate

### 7.4 Stop-after timer

- Setting: ∞ / 4 / 8 / 16 / 32 cycles OR 1 / 5 / 10 / 15 / 30 minutes
- Engine stops gracefully at next cycle boundary
- Remaining time/cycles shown in BPM hero area during playback
- Composes cleanly with Speed Trainer (trainer handles BPM, stop-after handles duration)

### 7.5 Polyrhythm overlay

- Subdivisions selector: 3, 4, 5 (exp), 7 (exp)
- Voice: click (kit-independent)
- When active: injects ephemeral click track at chosen subdivision into current pattern
- Same engine path as library polyrhythm patterns (§4.5)
- Off → click track removed

### 7.6 Pattern editing

- Tap any cell in grid → cycle velocity (0 → 2 → 1 → 0)
- Changes persist in-memory for session; on leaving pattern, reverts to canonical unless user saves (via Studio "save as")
- Built-in patterns cannot be permanently modified

---

## 8. PWA, Persistence, Offline

### 8.1 Service worker (Workbox)

- `vite-plugin-pwa` configured for precaching
- Precache: HTML, JS, CSS, fonts, all seed pattern JSON, kit synth code
- Runtime cache: nothing (no external network in v1)
- Update flow: new version deploys → SW detects → toast "New version available · Reload" → user taps, swaps

### 8.2 Manifest

- Name / short name: BeatForge
- Theme: coral `#e17055`
- Background: warm `#f8f6f3`
- Icons: 192, 512, maskable, monochrome (generated from 1024px SVG via `scripts/generate-icons.ts`)
- `display: standalone`
- `start_url: /beatforge/?source=pwa`

### 8.3 Storage layering

**localStorage — small always-needed UI state:**

| Key | Content |
|---|---|
| `bf_theme` | `'warm' \| 'noir' \| 'paper'` |
| `bf_kit_override` | session-only kit override |
| `bf_view` | `'circular' \| 'linear' \| 'pill'` |
| `bf_tab` | last-open tab |
| `bf_pattern` | last-loaded pattern ID |
| `bf_highlights` | array of starred pattern IDs |
| `bf_recent` | array of recent pattern IDs (cap 20) |
| `bf_trainer_cfg` | speed trainer settings |
| `bf_path_progress` | `{ pathId → currentIndex }` |

**IndexedDB via Dexie — user content:**

```ts
class BFDatabase extends Dexie {
  userPatterns!: Table<Pattern, string>;

  constructor() {
    super('beatforge');
    this.version(1).stores({
      userPatterns: 'id, region, createdAt, updatedAt',
    });
  }
}
```

Only `userPatterns` in v1.

**Export/Import:** Library "Yours" tab has Backup (downloads `beatforge-patterns-YYYY-MM-DD.json`) and Restore (imports such a file). Prevents data loss on browser storage wipe.

### 8.4 Install prompt

- Stash `beforeinstallprompt` event
- Show subtle banner on Practice tab after ≥ 2 minutes of playback: "Install BeatForge as an app · Works offline"
- Dismissed → hidden for 30 days (`localStorage.bf_install_prompt`)

### 8.5 Asset budget

| Asset | Approx size |
|---|---|
| App JS (React + Vite, min + gz) | ~80KB |
| App CSS | ~15KB |
| Seed patterns (85 × ~500B) | ~45KB |
| Fonts (IBM Plex Sans + Mono subset) | ~80KB |
| Icons / manifest | ~20KB |
| Dexie + Fuse.js + Workbox runtime | ~40KB |
| **Total first-load** | **~280KB gzipped** |

Under 300KB gzipped for a full offline-capable PWA with 85 patterns and 7 kits.

---

## 9. Phasing

### v1.0 — Ship the metronome (8–12 weeks solo dev)

- React + Vite + TS scaffold
- Engine (scheduler, 7 kits, polyrhythm, visuals)
- 85 seed patterns (80 world + 5 polyrhythm), continental spread
- Practice tab (full prototype features + count-in + stop-after + polyrhythm overlay)
- Studio tab (simple step sequencer)
- Library tab (zoned scroll, chip-row filters, pattern detail, search, related, grouping browser, world map, 6 starter paths)
- Highlights + Recent
- PWA (offline, installable)
- Deploy: GitHub Pages
- Basic a11y pass (keyboard nav, focus rings, aria-labels on grid cells, reduced-motion)

**Ship criteria:** founder uses daily; 2+2+2+3 is instantly legible to a new user; all 85 patterns proof-heard; installable offline.

### v1.1 — Fill the library (4–8 weeks rolling)

- Data pipeline built (extract → sandbox → proof-hear → promote)
- Migrate research corpus in region batches (~50 patterns per release)
- Target: ~400 patterns by end of v1.1

### v1.2 — Library polish

- Final migration to ~650+ patterns total
- Region-level intro content for World Map zones
- Community-PR starter paths
- Hand-curated `relatedIds` for cross-cultural bridges

### v1.3 — Practice polish

- Subdivisions (triplets over duple)
- Tap-tempo input
- Per-group accents (accent each group independently)
- Custom kit swaps per pattern (override `defaultKit`, saved per-pattern-per-user)

### v2.0 — Extract & begin Synth (when ready)

- Monorepo restructure (pnpm workspaces)
- Extract `audio/`, design-system components, pattern schema into `packages/`
- `apps/metronome/` (existing) + `apps/synth/` (new)
- BeatForge Drum Synth begins as a separate project

### Deliberately deferred

- WAV / MIDI export
- Web MIDI input
- User-recorded samples
- Multi-pattern song/chain mode beyond simple Studio
- Keyboard-launch pad mode

---

## 10. Amendments to the Original Product Spec

This spec supersedes parts of `docs/2026-03-12-beatforge-product-design.md`:

| Original spec says | Amended to |
|---|---|
| Framework: SvelteKit + TypeScript | React + Vite + TypeScript |
| Audio engine: Tone.js + raw Web Audio | Pure Web Audio (no Tone.js) |
| Custom synthesis: AudioWorklet | Not required v1; vanilla Web Audio synthesis sufficient |
| Hosting: Vercel / Netlify / GitHub Pages | GitHub Pages |
| Library focus: browsing | Browsing + explicit discoverability features (search, facets, world map, starter paths, grouping browser) |
| Voice set | Implied open; confirmed closed: `KK/SN/HH/OH/CP` |
| Kits | 808/909/707 implied; confirmed: 808/909/707 **+ 727 + frameDrum + tabla + gamelan** (7 kits) |
| Polyrhythm | Mentioned; made concrete via per-track `subdivisions` field |
| BPM semantics | Clarified: BPM = steps/min, tied to main division |
| "Studio" naming | Noted as potentially confusing with future Drum Synth; rename deferred |

All other sections of the original spec remain in force (personality, hard constraints, design system colors, beat-grouping colors, user archetypes, etc.).

---

## 11. Open Questions (to address during implementation)

- Final exact 80-pattern selection (sketched in §5.3; finalized during implementation)
- Exact voice mapping nuances for 727 (which conga pitch → KK vs SN)
- Gamelan synthesis — tuning the inharmonic partials for authenticity vs. CPU cost
- World Map SVG design — commission or build via existing open-source world maps
- Starter path #6 Indian Tal Basics — pattern sequence needs validation with a Hindustani-trained musician
- Whether "Studio" renames to "Builder" / "Compose" / stay — defer until closer to ship

---

**End of spec.**
