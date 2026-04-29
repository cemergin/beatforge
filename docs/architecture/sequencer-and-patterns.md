# Sequencer & Patterns

> **TL;DR** — The `Pattern` data model + how a Pattern becomes scheduled audio. Schema covers timeSig, stepUnit, grouping, swing, per-track subdivisions; the schema invariant test enforces consistency. 536 patterns ship in `src/patterns/seed/` as JSON.
> **Audience:** anyone touching patterns, the sequencer, or pattern-authoring tools.
> **Length:** ~510 lines · ~10 min read.
> **Best for:** the schema invariant rule, per-track subdivisions for polyrhythm, the seed-pattern build pipeline.
> **Skip if:** you want the audio engine internals (→ [`audio-engine.md`](audio-engine.md)) or higher-level architecture (→ [`overview.md`](overview.md)).

This doc covers the `Pattern` schema (`src/patterns/types.ts`), the seed pattern library (`src/patterns/seed/`), and how a `Pattern` maps onto the engine's scheduler. Read [audio-engine.md](./audio-engine.md) first if you haven't — the scheduler behavior described here is implemented there.

---

## The schema

`src/patterns/types.ts:53-92`:

```ts
export interface Pattern {
  // Identity
  id: string;
  name: string;
  origin: string;
  tradition: string;
  genre: Genre;

  // Rhythmic shape
  timeSig: string;
  grouping: number[];
  steps: number;
  stepUnit: 8 | 16 | 4;
  poly?: boolean;

  // Tempo
  bpm: { default: number; min: number; max: number };

  // Content
  tracks: Partial<Record<VoiceId, Track>>;

  // Kit
  defaultKit: KitId;

  // Discoverability
  region: RegionId;
  country?: string;
  difficulty: Difficulty;
  tags: string[];
  instruments?: string[];
  swingable: boolean;
  swingDefault?: number;             // 0.5 straight → 0.67 triplet
  relatedIds?: string[];

  // Narrative
  story?: string;
  sources?: string[];

  // Reserved for v2+ (Drum Synth era) — unused in v1
  customVoices?: Record<string, { synth: string; params: object }>;
}
```

The closed voice set and velocity type (`types.ts:4-5`):

```ts
export type VoiceId = 'KK' | 'SN' | 'HH' | 'OH' | 'CP';
export type Velocity = 0 | 1 | 2;   // 0 = off, 1 = ghost, 2 = accent
```

### Field walkthrough

| Field | Meaning | Audio impact |
|---|---|---|
| `steps` | Number of main-division steps per bar (1–256) | `barSec = steps × 60/BPM` |
| `stepUnit` | 4, 8, or 16 — cosmetic only | Drives UI labels; engine ignores it except to gate swing (swing only applies when `stepUnit === 16`) |
| `grouping` | e.g. `[2,2,2,3]` — sums to `steps` | Drives per-group accent lookup, count-in click positions, and visual coloring |
| `timeSig` | Display string — `"9/8"`, `"4/4"`, `"12/8"` | Visual only; engine reads only `steps` and `bpm` |
| `bpm.default` | Initial BPM on load | Every grid step = one "beat". BPM = steps/min |
| `tracks` | `Partial<Record<VoiceId, Track>>` | The notes themselves |
| `defaultKit` | `KitId` | Auto-loaded when pattern is loaded in Practice; Studio uses it as the starting kit |
| `swingable` | boolean | Gates the swing control in Practice UI; false patterns ignore swing |
| `swingDefault` | 0.5–1.0, optional | Natural swing for this rhythm (0.5 = straight, 0.67 = triplet). Practice hydrates the slider from this on load. Jazz: 0.67, boom-bap: 0.58, reggae/son: 0.52, rock/techno: 0.5 |
| `poly` | boolean (informational) | Not read by the engine. Lets UI filter polyrhythm exercises |

### Track encoding

`types.ts:45-51`:

```ts
export type Track =
  | Velocity[]                     // shorthand — one step per pattern.steps
  | {
      pattern: Velocity[];
      subdivisions?: number;        // equal steps per bar; defaults to pattern.steps
      cycle?: number;               // wrap length; defaults to pattern.length
    };
```

Two representations for one concept. The shorthand `Velocity[]` is the common case: "this track has the same step count as the pattern's main division." The object form adds:

- **`subdivisions`** — the per-track polyrhythm count. A track with `subdivisions: 3` in a `steps: 4` pattern produces 3 notes per bar while the rest of the tracks produce 4.
- **`cycle`** — wrap length shorter than the subdivisions count. Lets a 2-step pattern `[2, 1]` repeat twice in a 4-subdivision bar: `cycle: 2, subdivisions: 4, pattern: [2, 1]`.

### The `trackMeta()` helper

`types.ts:101-114`:

```ts
export function trackMeta(track: Track, defaultSubdivisions: number): TrackMeta {
  if (Array.isArray(track)) {
    return {
      subdivisions: defaultSubdivisions,
      cycle: track.length,
      pattern: track,
    };
  }
  return {
    subdivisions: track.subdivisions ?? defaultSubdivisions,
    cycle: track.cycle ?? track.pattern.length,
    pattern: track.pattern,
  };
}
```

`trackMeta` is THE normalization function. Every consumer of track data — the scheduler (`engine.ts:246`), all three grid components (`CircularGrid.tsx:69`, `LinearGrid.tsx:37`, `PillGrid.tsx:22`), and StudioGrid (`StudioGrid.tsx:63`) — pipes tracks through it before reading `.subdivisions`, `.cycle`, `.pattern`. Always use it; never read raw track fields.

## Example patterns

### Shorthand form — Karşılama (`seed/turkey-ottoman.ts:4-30`)

```ts
{
  id: 'karsilama',
  name: 'Karşılama',
  origin: 'Turkey · Thrace',
  tradition: 'Wedding dance',
  genre: 'folk-dance',
  timeSig: '9/8',
  grouping: [2, 2, 2, 3],
  stepUnit: 8,
  steps: 9,
  bpm: { default: 276, min: 200, max: 360 },
  difficulty: 'intermediate',
  tracks: {
    KK: [2, 0, 2, 0, 2, 0, 2, 0, 0],
    SN: [0, 0, 0, 0, 0, 0, 0, 1, 1],
    HH: [2, 1, 2, 1, 2, 1, 2, 1, 1],
  },
  defaultKit: 'frameDrum',
  region: 'turkey-ottoman',
  country: 'TR',
  tags: ['wedding', 'dance', 'romani', 'thracian'],
  instruments: ['frame drum', 'bağlama', 'clarinet'],
  swingable: false,
  story: 'Karşılama means "face to face" — …',
  relatedIds: ['daichovo'],
}
```

Nine steps, grouping `[2,2,2,3]` sums to 9 (always must, by contract). KK hits on 0,2,4,6; HH runs on every step alternating accent/ghost; SN only at 7,8 as the end-of-bar push into the 3-grouping.

### Polyrhythm form — Triplets over Quarters (`seed/exercise.ts:27-49`)

```ts
{
  id: 'triplet-over-quarters',
  name: 'Triplets over Quarters (3:4)',
  origin: '—',
  tradition: 'Polyrhythm exercise',
  genre: 'exercise',
  timeSig: '4/4',
  grouping: [4],
  stepUnit: 4,
  steps: 4,
  poly: true,
  bpm: { default: 120, min: 60, max: 200 },
  difficulty: 'beginner',
  tracks: {
    KK: [2, 1, 1, 1],
    SN: { pattern: [2, 1, 1], subdivisions: 3 },
  },
  defaultKit: '707',
  region: 'exercise',
  tags: ['polyrhythm', '3-over-4', 'triplet', 'exercise'],
  swingable: false,
  story: 'Three evenly-spaced notes across one bar of four …',
}
```

KK is shorthand: 4 steps over 4 subdivisions (the pattern's main). SN is object form: 3 steps over 3 subdivisions in the same bar. That's the polyrhythm.

## How polyrhythm actually runs — 3:4 walkthrough

Take the triplet-over-quarters pattern at `BPM = 120`. Step through what the engine does.

### 1. Derived timing

```
barSec     = steps × (60/BPM) = 4 × 0.5    = 2.0 seconds
KK.stepSec = barSec / 4 (main)              = 0.5  seconds
SN.stepSec = barSec / 3 (polyrhythm)         = 0.667 seconds
```

### 2. Track scheduling over one bar

```
time (s):  0.0    0.333  0.5   0.667  1.0   1.333  1.5   1.667  2.0
           |      |      |     |      |     |      |     |      |
KK:        ●──────────── ○ ─────────── ○ ────────── ○ ────────── [bar reset]
           step 0 (acc)        step 1         step 2         step 3
SN:        ●──────────── ○ ─────────────── ○ ─────────────── [bar reset]
           step 0 (acc)        step 1              step 2
```

KK fires at t = {0, 0.5, 1.0, 1.5}. SN fires at t = {0, 0.667, 1.333}. Both re-align at t = 2.0.

### 3. How `tick()` produces this

`tick()` runs every 25ms. Assume it enters at `ctx.currentTime = 0`. Horizon = 0.12s.

**Tick 1 (t = 0.00s, horizon = 0.12s):**
- KK loop: `nextNoteTimes['KK'] = 0.0 < 0.12` → schedule KK at 0.0, `cursors.KK = 0`, advance `nextNoteTimes['KK'] += 0.5` to 0.5. Next iter: 0.5 not < 0.12, exit.
- SN loop: `nextNoteTimes['SN'] = 0.0 < 0.12` → schedule SN at 0.0, `cursors.SN = 0`, advance to 0.667. Next iter: 0.667 not < 0.12, exit.

**Tick 16 (t ≈ 0.40s, horizon = 0.52s):**
- KK loop: `nextNoteTimes['KK'] = 0.5 < 0.52` → schedule KK at 0.5, `cursors.KK = 1`, advance to 1.0. Next iter: 1.0 not < 0.52, exit.
- SN loop: `nextNoteTimes['SN'] = 0.667 not < 0.52`, no action.

**Tick 22 (t ≈ 0.55s, horizon = 0.67s):**
- KK loop: 1.0 not < 0.67, no action.
- SN loop: 0.667 not < 0.67 (right on the edge — depends on drift; will fire next tick).

…and so on. Each tick advances whichever track(s) have notes due in the next 120ms. Because `nextNoteTimes` are per-track and updated by per-track `stepSec`, the independent timing falls out for free.

### 4. Visual cursor state

Because `cursors.KK` and `cursors.SN` update synchronously at schedule time, they can temporarily be "ahead" of audible playback by up to 120ms. The rAF loop in `Practice.tsx:103-111` reads them at 60Hz and triggers grid redraws. The circular grid draws concentric rings with different notch counts (`CircularGrid.tsx:76`: `ringSteps = meta.subdivisions`) so the two cursors move at different speeds around their respective rings — the polyrhythm is visible.

### 5. Bar re-alignment

After 2.0s the bar boundary fires. `engine.ts:292-301` computes `barIndex = 1` and schedules `this.bar = 1; onBar?.(1)` at `tBar = 2.0s`. Both tracks' `nextNoteTimes` are already at 2.0s (KK: after step 3, 1.5+0.5 = 2.0; SN: after step 2, 1.333+0.667 = 2.0). They re-align naturally without special handling — this is why the scheduler doesn't need explicit bar-boundary logic for tracks.

### Multi-polyrhythm (4:3:5:7)

Same math. Each track has its own `subdivisions` and `nextNoteTimes`. Spec example:

```ts
{
  steps: 4,
  tracks: {
    KK: [2, 0, 2, 0],                                                   // 4-sub
    SN: { pattern: [2, 0, 0], subdivisions: 3 },                        // 3-sub
    HH: { pattern: [2, 0, 0, 0, 0], subdivisions: 5 },                  // 5-sub
    OH: { pattern: [2, 0, 0, 0, 0, 0, 0], subdivisions: 7 },            // 7-sub
  },
}
```

All four re-align at every bar because each `stepSec_n = barSec / n` divides `barSec` evenly.

## Per-group accents (main-division only)

Per-group accents apply to main-division tracks only. Polyrhythm tracks don't have a "which group does step N belong to" answer because they don't share the grouping's step grid.

`engine.ts:260-264`:

```ts
// Per-group accents only meaningful on main-division tracks —
// polyrhythm tracks don't align to the grouping.
if (vel > 0) this.trigger(tr, tPlay, vel, isMainDivision ? idx : -1);
```

When the step index is `-1`, `trigger()` passes `groupMul = 1` (see [audio-engine.md](./audio-engine.md) § velocity → amplitude).

## Where patterns live

### Seed patterns (read-only, shipped with the app)

Patterns ship as JSON — one file per region under `src/patterns/seed/`. The barrel eagerly globs them in through Vite and runs every entry through the Zod `PatternSchema` at module-load time.

`src/patterns/seed/index.ts` (simplified):

```ts
import { PatternSchema } from '../schema';

const modules = import.meta.glob<unknown[]>('./*.json', {
  eager: true,
  import: 'default',
});

const parsed: Pattern[] = [];
for (const [path, raw] of Object.entries(modules)) {
  for (const entry of raw) {
    const r = PatternSchema.safeParse(entry);
    if (!r.success) throw new Error(`[seed/${regionOf(path)}] ${describe(r.error)}`);
    parsed.push(r.data);
  }
}
export const PATTERNS: Pattern[] = parsed;
```

One file per region: `turkey-ottoman.json`, `balkans.json`, … `internet-born.json` (23 regions, 536 patterns as of this writing). The barrel enumerates a known `REGION_ORDER` first so `PATTERNS` is deterministic, then falls through to any new JSON alphabetically so new regions can't be silently dropped.

**Why JSON**: community contributors can add a pattern via a single-file PR editing the region's JSON — no TypeScript knowledge required. The Zod schema (`src/patterns/schema.ts`) is the authoritative shape spec; a malformed submission fails CI with a pattern-id-qualified error like `[seed/india] invalid pattern "new-tala": grouping: grouping must sum to steps`.

The Zod schema is the single source of truth for Pattern validation and is reused in `lib/db.ts` for validating user patterns loaded from IndexedDB.

### User patterns (IndexedDB)

`src/lib/db.ts:15-32`:

```ts
export interface UserPattern extends Pattern {
  user: true;
  createdAt: number;
  updatedAt: number;
}

class BFDatabase extends Dexie {
  userPatterns!: Table<UserPattern, string>;

  constructor() {
    super('beatforge');
    this.version(1).stores({
      userPatterns: 'id, region, createdAt, updatedAt',
    });
  }
}
```

Studio writes to this table via `saveUserPattern(p)`; there's also `deleteUserPattern`, `listUserPatterns`, `bulkImport` (for the export/import JSON backup feature). `loadAllSafe()` (`db.ts:141-159`) validates each record and returns `{ id, pattern: UserPattern | null, raw }` — corrupted records get a `null` pattern so the UI can offer deletion without crashing.

Validation (`db.ts:isValidPattern`, `isValidUserPattern`) delegates to the Zod schemas (`patterns/schema.ts` — `PatternSchema`, `UserPatternSchema`). Critical invariants checked: `grouping.sum === steps`, every track value is a valid `Velocity`, `defaultKit` ∈ known kits, `bpm.default` is within `[bpm.min, bpm.max]`, etc. The `isValidPattern` / `isValidUserPattern` type-guard signatures are unchanged, so callers stay untouched.

## The extensibility hook: `registerPatternSource()`

`src/patterns/seed/index.ts:44-63`:

```ts
// Optional extra-source lookup: Studio/App register user patterns here so
// Practice & Library can resolve them by id without importing Dexie.
const extraSources: Array<(id: string) => Pattern | undefined> = [];

export function registerPatternSource(src: (id: string) => Pattern | undefined): () => void {
  extraSources.push(src);
  return () => {
    const i = extraSources.indexOf(src);
    if (i >= 0) extraSources.splice(i, 1);
  };
}

export function patternById(id: string): Pattern | undefined {
  const hit = PATTERNS.find((p) => p.id === id);
  if (hit) return hit;
  for (const src of extraSources) {
    const p = src(id);
    if (p) return p;
  }
  return undefined;
}
```

This is the seam that lets user patterns (IndexedDB) be resolvable from anywhere via `patternById(id)` without importing Dexie into Practice or Library. `App.tsx:57-63` sets it up:

```ts
// Expose user patterns to seed.patternById.
useEffect(() => {
  const unregister = registerPatternSource(
    (id) => userCacheRef.current.get(id),
  );
  refreshUserCache();
  return unregister;
}, [refreshUserCache]);
```

`userCacheRef: Map<string, Pattern>` is refreshed from Dexie when:
- App mounts (initial `refreshUserCache()`)
- Studio saves a pattern (`App.tsx:176`: `onLoadInPractice={(id) => { refreshUserCache(); loadInPractice(id); }}`)
- Practice loads a user-pattern by id (`App.tsx:89-96`: `loadInPractice` awaits `refreshUserCache()` before setting `patternId`)

Returns an unregister function — React's `useEffect` cleanup path uses it on unmount.

## Pattern lifecycle in Practice

`Practice.tsx:138-152`:

```ts
// Pattern change → stop playback (user hits play again when ready) +
// load + reset trainer + hydrate kit override + reset per-group
// accents + push recent.
useEffect(() => {
  engine.stop();
  setPlaying(false);
  setCountingIn(false);
  engine.loadPattern({ ...pattern, grouping: pattern.grouping });
  setBpm(pattern.bpm.default);
  setGrouping(pattern.grouping);
  setKitOverrideState(getKitOverride(pattern.id));
  setGroupAmps(pattern.grouping.map(() => GROUP_AMP_DEFAULT));
  setTapTimes([]);
  localStorage.setItem('bf_pattern', pattern.id);
  setTrainerBar(0);
  setRecent(pushRecent(pattern.id));
}, [patternId]);
```

Loading a pattern:
1. Stops the engine (never leave it running across pattern changes)
2. Calls `engine.loadPattern({ ...pattern, grouping })` — note: shallow-cloned so React can later mutate grouping via the grouping permutation buttons without poisoning the seed
3. Resets BPM, grouping, kit override, per-group accents, tap-tempo buffer
4. Writes last-used pattern id to localStorage
5. Pushes to recent list

Note: the pattern object passed to `engine.loadPattern` is shallow-cloned with a fresh `grouping` reference, but `tracks` is **not** cloned. That means clicking grid cells in Practice (`Practice.tsx:322-329`) mutates the seed pattern's track arrays in place for the lifetime of the session. Switching patterns loads a fresh shallow-clone; edits reset. Studio in contrast deep-clones on entry (`Studio.tsx:46-66`) to prevent polluting seeds.

**Shipped diverges from spec here**: spec §7.6 says "Changes persist in-memory for session; on leaving pattern, reverts to canonical unless user saves." Actual: edits persist in memory **until page reload**, not just "leaving pattern" — because seed literals are module-scoped and a pattern change re-references the same (now-mutated) track arrays if the user has already toggled cells on this pattern earlier in the session. A full page reload restores the canonical seed.

## Pattern lifecycle in Studio

`Studio.tsx:106-112` seeds the draft:

```ts
const [draft, setDraft] = useState<Pattern>(() => {
  if (initialPattern) {
    const c = clonePattern(initialPattern);
    return { ...c, id: generateId(c.name + ' remix'), name: `${c.name} (remix)` };
  }
  return blankPattern();
});
```

If Library handed off an `initialPattern`, clone it and give it a fresh id. Otherwise, create a blank 4/4 16-step draft (`presets.ts:44-63`). All edits operate on the draft, not the source pattern.

`Studio.tsx:44-66` — `clonePattern()` deep-clones tracks:

```ts
function clonePattern(p: Pattern): Pattern {
  const tracks: Partial<Record<VoiceId, Track>> = {};
  for (const k of Object.keys(p.tracks) as VoiceId[]) {
    const td = p.tracks[k];
    if (!td) continue;
    if (Array.isArray(td)) {
      tracks[k] = [...td];
    } else {
      tracks[k] = { ...td, pattern: [...td.pattern] };
    }
  }
  return {
    ...p,
    grouping: [...p.grouping],
    tags: [...p.tags],
    instruments: p.instruments ? [...p.instruments] : undefined,
    relatedIds: p.relatedIds ? [...p.relatedIds] : undefined,
    bpm: { ...p.bpm },
    tracks,
  };
}
```

This is deliberate: Studio needs deep isolation from seed patterns because users will edit every field including `grouping` and `tracks`.

### Changing per-track subdivisions

`Studio.tsx:346-362`:

```ts
const setTrackSubdivisions = useCallback((tr: VoiceId, subs: number) => {
  setDraft((d) => {
    const td = d.tracks[tr];
    if (!td) return d;
    const oldMeta = trackMeta(td, d.steps);
    const oldPattern = oldMeta.pattern;
    const newPattern: Velocity[] = new Array<Velocity>(subs).fill(0);
    // Preserve existing hits up to the new length, or cycle the old pattern.
    for (let i = 0; i < subs; i++) {
      newPattern[i] = oldPattern[i % oldPattern.length] ?? 0;
    }
    const newTrack: Track = subs === d.steps
      ? newPattern                                        // → shorthand
      : { pattern: newPattern, subdivisions: subs, cycle: subs };  // → object form
    return { ...d, tracks: { ...d.tracks, [tr]: newTrack } };
  });
}, []);
```

When a user moves a track off main-division via the "÷N" badge in StudioGrid, this transparently swaps the Track representation between `Velocity[]` (shorthand, main-division) and the object form. The UI in `StudioGrid.tsx` renders each track with `meta.subdivisions` cells regardless of form, so the distinction is purely a data-model concern.

### Changing `steps` (meter preset)

`Studio.tsx:77-100`:

```ts
function resizeTracksToSteps(tracks, oldSteps, newSteps): ... {
  const out: Partial<Record<VoiceId, Track>> = {};
  for (const k of Object.keys(tracks) as VoiceId[]) {
    const td = tracks[k];
    if (!td) continue;
    if (Array.isArray(td)) {
      out[k] = resizeVelocityArray(td, newSteps);
    } else if ((td.subdivisions ?? oldSteps) === oldSteps) {
      // Main-division track in object form — resize pattern + drop stale cycle.
      out[k] = { ...td, pattern: resizeVelocityArray(td.pattern, newSteps), cycle: newSteps };
    } else {
      // Polyrhythm track with its own subdivisions — leave alone.
      out[k] = td;
    }
  }
  return out;
}
```

Only main-division tracks resize with the pattern. Polyrhythm tracks keep their own subdivision count — their relationship to the bar is via the `subdivisions` field, not the `steps` field.

## The step limit

`StudioSidebar` / `Studio.tsx:578` caps `steps` at 256. The schema doesn't enforce it at the type level. Practical upper bound for the engine is much higher, but UI becomes unusable past a few dozen steps on most screen sizes.

---

See [audio-engine.md](./audio-engine.md) for scheduler internals and [react-app.md](./react-app.md) for how patterns flow through the React component tree.
