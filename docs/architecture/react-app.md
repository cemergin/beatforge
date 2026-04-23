# React App

How the React tree is shaped, where state lives, how persistence and tab switching work, and why the engine is stored in a `useRef` rather than state.

See [overview.md](./overview.md) for the 10,000-ft view, [audio-engine.md](./audio-engine.md) for the engine class itself, [sequencer-and-patterns.md](./sequencer-and-patterns.md) for the Pattern schema.

---

## Entry point

`src/main.tsx` is tiny:

```ts
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PWAStatus } from './lib/pwa';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PWAStatus />
  </StrictMode>,
);
```

Two components at the root: `<App/>` (all the actual UI) and `<PWAStatus/>` (a headless floating-toast component for service-worker updates and install prompts). `<PWAStatus/>` is mounted at the root so tab switching doesn't unmount it; its toasts persist across tab changes.

`StrictMode` is used. The engine-in-ref pattern described below is specifically designed to survive StrictMode's double-invocation of effects.

## Component tree

```
<App>                                          ← engine, tab, patternId state
├─ <header className="bf-top">                 ← tab switcher, theme picker
└─ {tab}
   ├─ <Practice engine patternId onPatternChange/>       (tab === 'practice')
   │  ├─ <aside className="bf-left">          ← pattern list, hero BPM, play
   │  │  ├─ highlights strip
   │  │  ├─ recent strip
   │  │  ├─ pattern card
   │  │  ├─ BPM hero + <BeatDots/>
   │  │  ├─ play + master volume
   │  │  └─ pattern list
   │  ├─ <section className="bf-grid-wrap">   ← grid visualization
   │  │  ├─ view switcher (circular/linear/pill)
   │  │  ├─ grouping permutation buttons
   │  │  └─ <CircularGrid/> | <LinearGrid/> | <PillGrid/>
   │  └─ <aside className="bf-right">         ← controls
   │     ├─ tap tempo
   │     ├─ <Trainer/>                         ← speed trainer
   │     ├─ per-group accents
   │     ├─ count-in / stop-after / poly overlay
   │     ├─ strong/weak accents
   │     ├─ swing (if pattern.swingable)
   │     └─ kit selector (7 kits)
   │
   ├─ <Studio engine initialPattern onConsumedInitial onLoadInPractice/>    (tab === 'studio')
   │  ├─ <aside className="bf-left"><StudioSidebar/></aside>
   │  ├─ <section>
   │  │  ├─ meter presets row
   │  │  ├─ grouping editor
   │  │  ├─ <StudioGrid/>                      ← edit mode, per-track subdiv menu
   │  │  └─ voice palette (add/remove KK/SN/HH/OH/CP)
   │  └─ <aside className="bf-right">          ← same controls as Practice
   │     ├─ BPM hero + play + master volume
   │     ├─ tap tempo + <Trainer/>
   │     ├─ per-group accents / count-in / stop-after / poly overlay
   │     ├─ strong/weak accents + swing + kit selector
   │     └─ <ExportImport/>                    ← JSON backup/restore
   │  └─ <SaveDialog/> (conditional modal)
   │
   ├─ <Library engine onLoadInPractice onOpenInStudio/>  (tab === 'library')
   │  ├─ <header> search input
   │  ├─ highlights + recent strips
   │  ├─ <WorldMap onPickRegion/>
   │  ├─ <StarterPaths progress onPickPath/>
   │  ├─ <Filters filters setFilters/>         ← meter/region/genre/kit/level/tempo
   │  ├─ <GroupingBrowser selected onPick/>
   │  ├─ surprise button
   │  ├─ results grid (<PatternCard/>[])
   │  └─ <PatternDetail/> (conditional modal)  ← plays preview inline via engine
   │
   └─ <PatternsSandbox engine/>                (dev-only, tab === '_patterns')
```

## The engine-in-useRef pattern

`App.tsx:19-23`:

```ts
const engineRef = useRef<AudioEngine | null>(null);
if (engineRef.current === null) {
  engineRef.current = new AudioEngine();
}
const engine = engineRef.current;
```

### Why `useRef` and not `useState`?

- **The engine is mutable and long-lived.** It contains timers, a WebAudio context, mutable `cursors` and `bar` fields. It's not a value that should ever be "replaced" — replacing it would orphan the audio graph.
- **React shouldn't re-render on engine changes.** Engine mutations (BPM, kit, cursors) don't map to props or state. React's render cycle is decoupled from engine state on purpose.
- **One instance for the page.** `useRef`'s lazy init pattern guarantees exactly one `AudioEngine` is constructed per App mount. StrictMode's double-invocation of component bodies does NOT call `useRef`'s initializer twice — only the `if (engineRef.current === null)` branch runs once.

### Why the `if` guard instead of `useRef(new AudioEngine())`?

`useRef(new AudioEngine())` would call `new AudioEngine()` on every render, even though React only keeps the first result. The engine constructor is cheap enough that this wouldn't break anything, but the lazy guard pattern is idiomatic for "expensive object, construct once".

### Passed as prop, not context

The engine goes through props, not React Context. Three reasons:
1. Only 3 consumers (Practice, Studio, Library) — prop-drilling is minimal.
2. Context would cause every subscriber to re-render on any engine-related re-render, which defeats the point of stabilizing the reference.
3. The engine isn't "config" — modes interact with it imperatively. Passing it as a prop makes that explicit.

## Tab switching

`App.tsx:29-35`:

```ts
const [tab, setTab] = useState<Tab>(() => {
  const t = localStorage.getItem('bf_tab');
  if (t === 'library' || t === 'studio' || t === 'practice') return t;
  // _patterns is dev-only — never restore it in production builds.
  if (t === '_patterns' && DEV_MODE) return '_patterns';
  return 'practice';
});
```

Tab is a single state value. Each `switchTab()` call stops the engine first (`App.tsx:82-87`):

```ts
const switchTab = (next: Tab) => {
  if (next !== tab) {
    engine.stop();
    setTab(next);
  }
};
```

**No React Router.** Conditional rendering at `App.tsx:164-188`:

```tsx
{tab === 'practice' && <Practice engine={engine} patternId={patternId} onPatternChange={setPatternId}/>}
{tab === 'studio'   && <Studio engine={engine} initialPattern={initialStudioPattern} onConsumedInitial={() => setInitialStudioPattern(null)} onLoadInPractice={(id) => { refreshUserCache(); loadInPractice(id); }}/>}
{tab === 'library'  && <Library engine={engine} onLoadInPractice={loadInPractice} onOpenInStudio={openInStudio}/>}
{DEV_MODE && tab === '_patterns' && <PatternsSandbox engine={engine}/>}
```

Only one mode mounts at a time. Mode unmount triggers `useEffect` cleanup (`return () => { engine.stop(); };` in both Practice and Studio, and in Library), which is a defense-in-depth against a mode leaving the engine running.

### Tab handoffs

Cross-tab navigation is orchestrated through props:

- **Library → Practice**: `onLoadInPractice(id)` at `App.tsx:89-96`. Calls `engine.stop()`, refreshes the user-pattern cache (in case a user-saved pattern is the target), sets `patternId`, sets `tab = 'practice'`.
- **Library → Studio**: `onOpenInStudio(pattern)` at `App.tsx:98-102`. Stops the engine, stashes the full pattern in `initialStudioPattern`, switches tabs. Studio consumes it exactly once (`Studio.tsx:118-124`):

```tsx
const consumedRef = useRef(false);
useEffect(() => {
  if (initialPattern && !consumedRef.current) {
    consumedRef.current = true;
    onConsumedInitial();
  }
}, [initialPattern, onConsumedInitial]);
```

`onConsumedInitial` nulls out `initialStudioPattern` in App state so re-entering Studio later starts fresh.

- **Studio → Practice**: `onLoadInPractice` with a user pattern id. Studio first auto-saves the draft if not already saved (`Studio.tsx:452-473`) so Practice can resolve it by id.

## rAF cursor polling

Both Practice and Studio run the same pattern:

`Practice.tsx:103-111`:

```ts
useEffect(() => {
  let raf = 0;
  const loop = () => {
    setCursors({ ...engine.cursors });
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}, [engine]);
```

Every animation frame (~60Hz), copy the engine's cursors into React state, triggering a re-render. Grid components re-render with new cursor positions.

### Why polling instead of a push/callback model?

Three considerations:

1. **Scheduler density varies by pattern.** A 16-step pattern at 140 BPM produces ~150ms between main-division steps; a 12-subdivision polyrhythm track produces ~125ms. A callback per step would flood React with updates at variable rates, including bursts when multiple tracks fire simultaneously.

2. **rAF is the correct rate for visuals.** 60Hz is sufficient smoothness for cursor movement; anything faster is wasted.

3. **Decouples visual rate from audio rate.** You can pause visuals (e.g., when the tab is backgrounded, browsers throttle rAF to 1Hz) without affecting audio. The audio keeps playing through `setTimeout`; the cursors just won't update until the tab refocuses.

`engine.onBar` is the one exception: bar-boundary events **must not** be missed because the speed trainer depends on them. rAF could miss a bar boundary if it fell between two frames. The callback fires via `setTimeout` scheduled at bar-boundary time (see [audio-engine.md](./audio-engine.md) § bar-boundary).

## State ownership

The rule is: **pattern-derived and user-adjustable state lives in the mode component. Persistent cross-session state lives in localStorage. Engine state is write-through.**

### App.tsx owns:

| State | Persisted | Why |
|---|---|---|
| `engine` | no (runtime only) | Single instance, in `useRef` |
| `theme` | `localStorage.bf_theme` | Affects root `data-theme` attribute |
| `tab` | `localStorage.bf_tab` | Last-open tab restored on reload |
| `patternId` | `localStorage.bf_pattern` | Last-loaded pattern restored on reload |
| `initialStudioPattern` | no | Transient handoff from Library |
| `userCacheRef: Map<string, Pattern>` | no (cached from IndexedDB) | Lets Practice/Library resolve user patterns by id |

### Practice.tsx owns:

| State | Persisted | Notes |
|---|---|---|
| `playing` | no | Transient |
| `bpm` | no | Resets to `pattern.bpm.default` on pattern change |
| `cursors` | no | Polled from engine every frame |
| `kitOverride` | `localStorage.bf_kit_overrides[patternId]` | Per-pattern persistent kit choice (spec §9 v1.3) |
| `view` | `localStorage.bf_view` | circular / linear / pill |
| `grouping` | no | Transient permutation of pattern's canonical grouping |
| `swing` | no | 50–75 range, gated by `pattern.swingable` |
| `strong`, `weak` | no | Accent sliders |
| `trainerOn`, `trainerCfg`, `trainerBar` | no | Trainer state (spec says `bf_trainer_cfg` should persist; **not implemented**) |
| `countInBars`, `stopAfter`, `overlaySubdivisions` | no | Per-session |
| `highlights` | `localStorage.bf_highlights` | Starred pattern ids |
| `recent` | `localStorage.bf_recent` | Recently-loaded pattern ids (cap 20) |
| `masterVolume` | `localStorage.bf_master_volume` | Shared between Practice and Studio |
| `groupAmps` | no | Per-group accent multipliers, reset per pattern |
| `tapTimes` | no | Rolling buffer for tap-tempo |

**Shipped diverges from spec here**: spec §8.3 lists `bf_kit_override` (singular, session-only) and `bf_trainer_cfg` as localStorage keys. Actual: `bf_kit_overrides` (plural, per-pattern persistent map) — which is actually an improvement consistent with v1.3 scope. `bf_trainer_cfg` is not written at all.

### Studio.tsx owns:

| State | Persisted | Notes |
|---|---|---|
| `draft` | no (saved explicitly) | Full Pattern being edited |
| `savedId` | no | Tracks whether current draft corresponds to a saved UserPattern |
| `kit` | no | Follows `draft.defaultKit` until user explicitly overrides |
| `yours` | IndexedDB (Dexie) | List of saved UserPatterns |
| Everything else (bpm, cursors, trainer, accents, etc.) | no | Same pattern as Practice |

## Engine write-through pattern

Every slider/button in a mode that affects audio updates engine state imperatively via `useEffect`:

`Practice.tsx:171-176`:

```ts
useEffect(() => { engine.setBpm(bpm); }, [engine, bpm]);
useEffect(() => { engine.setKit(activeKit); }, [engine, activeKit]);
useEffect(() => {
  engine.setSwing(pattern.swingable ? 0.5 + ((swing - 50) / 100) * 0.34 : 0.5);
}, [engine, swing, pattern.swingable]);
useEffect(() => { engine.setAccents(strong / 100, weak / 100); }, [engine, strong, weak]);
```

One-way flow: React state → engine state. Engine state → React happens only through cursor polling and `onBar`.

The `useEffect` dependency arrays ensure these fire after state updates, so e.g. changing the BPM slider updates `bpm` state, which triggers the effect, which calls `engine.setBpm(bpm)`. If `engine.setBpm()` fails to take effect mid-playback, it's a no-op — BPM simply applies to the next scheduled notes.

Studio mirrors this exactly (`Studio.tsx:182-196`).

## Persistence layers

### localStorage (`src/lib/storage.ts`)

Synchronous, schema-less, 5-10MB quota. Used for small always-needed UI state.

Keys and accessors:

| Key | Getter / setter | Used by |
|---|---|---|
| `bf_theme` | raw `localStorage.getItem/setItem` in `App.tsx:25-27, 65-68` | `<html data-theme="…">` |
| `bf_tab` | raw, `App.tsx:29-35, 70-72` | Initial tab |
| `bf_pattern` | raw, `Practice.tsx:148` | Last-loaded pattern |
| `bf_view` | raw, `Practice.tsx:68-70, 177` | Grid view mode |
| `bf_highlights` | `getHighlights`, `toggleHighlight`, `isHighlighted` | Starred ids |
| `bf_recent` | `getRecent`, `pushRecent` | Recent ids (cap 20) |
| `bf_kit_overrides` | `getKitOverride`, `setKitOverride`, `clearKitOverride` | Per-pattern kit preference |
| `bf_master_volume` | `getMasterVolume`, `setMasterVolume` | Shared master volume 0..1 |
| `bf_path_progress` | inline in `Library.tsx:22-42` | Starter path cursor |
| `bf_install_prompt` | inline in `lib/pwa.tsx:13-25` | Install dismissal timestamp |

Every read wraps in `try/catch` and falls back to a safe default (see `storage.ts:10-19`). localStorage quota exhaustion, corrupted JSON, or disabled storage all fail silently.

### IndexedDB via Dexie (`src/lib/db.ts`)

For user-created patterns, which are larger and need key-based lookup.

```ts
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

Indices: `id` (primary), `region`, `createdAt`, `updatedAt`. Only `id` is used for lookups currently; the others are there for future filtering.

`loadAllSafe()` is the defensive loader — any corrupted record returns `{ id, pattern: null, raw }` instead of throwing, so the UI can show a quarantine card with a delete button rather than crashing. Studio's sidebar uses this.

### Corruption handling

`db.ts:84-121` — `isValidPattern` runs on every load. Validates:
- `id`, `name` are non-empty strings
- `steps >= 1`, `grouping.sum === steps`
- `tracks` has ≥ 1 voice, each voice is a valid `VoiceId`, each track passes `isTrack`
- `defaultKit` ∈ known kits, `region` ∈ known regions, `genre` ∈ known genres, `difficulty` ∈ known, `stepUnit` ∈ {4, 8, 16}
- `bpm.default/min/max` are numbers

Any failure → `{ pattern: null }`. The import/export flow (`Studio/ExportImport.tsx`) runs imported JSON through the same validator before writing to IDB.

## PWA layer

`src/lib/pwa.tsx` mounts once from `main.tsx` and handles two responsibilities:

### Service worker (Workbox via vite-plugin-pwa)

```ts
const update = registerSW({
  onNeedRefresh() { setNeedRefresh(true); },
  onOfflineReady() { /* silent — offline is the default posture */ },
});
setRefresh(() => () => void update(true));
```

- Precaches HTML, JS, CSS, fonts, seed patterns, kit synth code
- No runtime network fetch in v1 — nothing to cache from the wire
- On new deployment: worker detects update → "New version available" toast → user clicks Reload → `update(true)` triggers SW skipWaiting + page reload

### Install prompt

Stashes the `beforeinstallprompt` event, shows a "Install BeatForge · works offline" toast. Dismissal persists for 30 days via `bf_install_prompt` localStorage key.

**Shipped diverges from spec here**: spec §8.4 says show the banner "after ≥ 2 minutes of playback". Actual: shows immediately when browser fires `beforeinstallprompt` (gated only by the 30-day dismissal).

## Keyboard shortcuts

All three modes listen on `window` via `useEffect`. Shortcuts guard against triggering inside text inputs.

### Practice (`Practice.tsx:271-296`):

| Key | Action |
|---|---|
| Space | Play / stop |
| T | Tap tempo |
| 1–9 | Load Nth starred pattern |
| S | Toggle star on current pattern |

### Studio (`Studio.tsx:263-271`):

| Key | Action |
|---|---|
| T | Tap tempo |

### Library (`Library.tsx:69-80`):

| Key | Action |
|---|---|
| / | Focus search input |

**Shipped diverges from spec here**: spec §6.10 mentions `⌘K` for a quick-switcher modal. Not implemented.

## Theme system

`App.tsx:25-27, 65-68`:

```ts
const [theme, setTheme] = useState<Theme>(
  () => (localStorage.getItem('bf_theme') as Theme) || 'warm',
);

useEffect(() => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('bf_theme', theme);
}, [theme]);
```

Three themes: `warm` (default — `#f8f6f3` bg, coral accent), `noir` (dark), `paper` (high-contrast light). CSS variables in `styles/app.css` key off `[data-theme="…"]` selectors. No theme context; just a DOM attribute at the root. Every child that wants theme-aware colors reads CSS variables like `var(--bg)`, `var(--fg)`, `var(--grp-1)`.

## Dev-only `_patterns` sandbox

`App.tsx:14-16, 186-188`:

```ts
const DEV_MODE = import.meta.env.DEV;
// ...
{DEV_MODE && tab === '_patterns' && <PatternsSandbox engine={engine}/>}
```

A fourth tab appears only in Vite dev builds. Used for pattern-migration QA (proof-hearing drafts). Not shipped in production.

---

## Things that are not what you might expect

### No global state library

No Redux, Zustand, Jotai, MobX. Everything is lifted state + props. The engine is the only "global" thing; it's not React state.

### No routing library

No React Router, no Reach Router. A single `tab` state value, three `{tab === 'X' && <Mode/>}` conditionals. Deep links via URL query params are mentioned in the spec but not implemented.

### No Suspense boundaries

IndexedDB loads use `useEffect` + `await` + local state. No `<Suspense>`, no `use()`, no React Query.

### No memoization where you'd expect it

Grid components re-render on every rAF tick (every frame the cursor changes). That's ~60 renders/sec of each grid. It's fine — the grids are small SVGs (~200 DOM nodes) and React's reconciler handles it. No `React.memo`, no `useMemo` on the grid itself.

### Mutable cursor state

`engine.cursors` is a plain object mutated in-place by the engine. React reads it in rAF via `{ ...engine.cursors }` — a shallow clone — then `setCursors` triggers a re-render with a fresh reference. This sidesteps any reactivity contract and works because React doesn't need to observe engine mutations directly; it just needs a new object reference each frame.

---

See [audio-engine.md](./audio-engine.md) for how the engine uses `cursors` and `onBar`, [sequencer-and-patterns.md](./sequencer-and-patterns.md) for how Pattern data enters the system.
