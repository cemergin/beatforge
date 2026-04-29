# BeatForge Engineering Review — 2026-04-24 (Pass 1)

> **TL;DR** — First engineering audit pass. Companion to the (now archived) tightening work plan. Surfaces issues the plan didn't cover: PWA dedup, redundant engine loads, style-state mutation, ESLint cleanup.
> **Audience:** historical record. Items here are mostly resolved — see git log for resolutions.
> **Length:** ~280 lines · ~5 min read.
> **Status:** Most items LANDED. Remaining items either superseded or rolled into later passes.

Companion to `WORK_PLAN.md`. Scope: items the work plan does NOT already
cover. Severity is calibrated to the project's actual constraints (solo
dev, ship-first, function components, no Redux). Backwards-compat hacks,
premature abstractions, and overengineering are explicitly off the table.

Files referenced are absolute paths under `/Users/cemergin/lab/beatforge/app/`.

---

## TOP 5 — highest-leverage findings

### 1. Two PWA service-worker registrations running concurrently — HIGH
`src/lib/pwa.tsx:67-73` (`PWAStatus`, mounted in `main.tsx:11`) and
`src/components/UpdateBanner.tsx:20-28` (`UpdateBanner`, mounted in
`App.tsx:326`) **both call `registerSW()` from `virtual:pwa-register`**.
That is two competing SW lifecycles, two `onNeedRefresh` listeners, and
two "new version available" toasts that can show at once. The recent
"PWA update banner" commit (0f76134) added `UpdateBanner` without
removing the older `PWAStatus` update toast.

**Fix:** Pick one. The newer `UpdateBanner` is the simpler, more
on-brand toast — keep it. Strip the SW-registration + update-toast code
out of `PWAStatus`, leaving only the `beforeinstallprompt` handler. Or
fold the install prompt into `UpdateBanner` and delete `pwa.tsx`
entirely. (The `pwa.tsx` styles are inline anyway, so deletion costs
nothing.)

---

### 2. Practice mode: 3 redundant `engine.loadPattern` calls per pattern change — MED
`src/modes/Practice/Practice.tsx:122` calls `engine.loadPattern` inside
the `[patternId]` reset effect. Then line 135 (separate effect with
`[engine, pattern, grouping]`) loads it again because `pattern` is a new
object every render (it's a `useMemo` derived from
`{...seedPattern, tracks: {...seedPattern.tracks, ...editedTracks}}`).
On a single user click that swaps the pattern, the engine sees: stop →
loadPattern(seed) → loadPattern(pattern w/ old grouping) → loadPattern(pattern
w/ new grouping). Three loads, one user action. With the engine's hot-swap
preserve-phase logic this is mostly cosmetic, but it's wasted work and
makes the codepath very hard to reason about.

**Fix:** Delete the load on line 122 — the pattern-change effect should
only zero local state; the dependent `[engine, pattern, grouping]`
effect already covers loading. Or merge them and let the bottom effect
do all the work. Same applies to the `setBpm` order in `toggle()` at
line 225 — `engine.setBpm(bpm)` immediately before `engine.start()`
duplicates the `[engine, bpm]` effect on line 138.

---

### 3. Engine class is a public mutable bag — MED
`src/audio/engine.ts:32-51` declares `kit`, `running`, `pattern`, `bpm`,
`swing`, `strongAmp`, `weakAmp`, `groupAmps`, `cursors`, `bar`, and
`overlay` as **public mutable** fields, with parallel setters
(`setKit`, `setBpm`, …). React code reads them as state (good) but
nothing prevents direct writes that bypass the setter side-effects
(re-anchoring on bpm change, gain ramps on volume change, reverbSend
gain on kit change). The `set onBar` legacy shim (line 67) compounds
this — it has the same intent as `subscribeOnBar` but a different
storage model.

**Fix:** Mark all of these `private` or `readonly` from the React side
(making the class `interface` reflect that), and route every mutation
through a setter. Drop the `legacyBarListener` shim — there's only one
caller path now (Practice/Studio both use `subscribeOnBar`); a 30-line
deprecation block costs more than it earns. Pair this with WORK_PLAN P2
since you'll be in the file.

---

### 4. CSS contains ~10 outright duplicate rule blocks — MED
WORK_PLAN P1 covers token consolidation, but doesn't call out that the
same selector is **redefined** in multiple places, and the cascade
order quietly decides who wins. Confirmed duplicates in
`src/styles/app.css`:
- `.bf-lib-page` at line 616 AND line 684 (different padding,
  different `overflow-y`)
- `.bf-bpm-hero.sm` at line 1036 AND line 1085 AND line 1653 (three
  copies, different paddings)
- `.bf-studio-section` at line 1041 AND line 1498
- `.bf-studio-section-head` at line 1042 AND line 1503
- `.bf-studio-actions` at line 1039 AND line 1496 (column flex vs row
  flex — these are *contradictory*, not just redundant)
- `.bf-studio-sum`, `.bf-studio-sum.bad` at lines 1044/1046 AND
  1520/1522 (`.bad` resolves to `var(--grp-1)` in one copy and
  `var(--accent)` in the other — visible behavior depends on which
  parser pass wins)
- `.bf-voice-chip`, `.bf-voice-chip.on`, `.bf-voice-chip button` at
  lines 1064-1071 AND 1591-1605 (different border widths, different
  active colors)
- `.bf-chip-row` at line 634 AND 1511, `.bf-chip-row.wrap` at 635 AND
  1512
- `.bf-studio-hint` at line 1043 AND 1507

**Fix:** Resolve the contradictions FIRST (`.bf-studio-actions`,
`.bf-studio-sum.bad`, `.bf-voice-chip` color) by inspecting Studio in
the browser to confirm which version is actually in use, then delete
the other. Mechanical pass; no risk of regression beyond what's
already shipping.

---

### 5. Zero tests for the UI layer — MED
Test files cover: `engine.ts`, `db.ts`, `storage.ts`, `schema.ts`,
`serialize.ts`, `types.ts`, `invariants.ts`, `seed/index.ts` — all
non-React. There are **zero tests** under `src/components/` or
`src/modes/`. WORK_PLAN P5 mentions backfilling specifically the
metronome shared components — the cliff is wider than that.

The highest-value missing tests, in order:
1. `serialize.ts` round-trip on a real seed pattern (the gzip+base64url
   path has only happy-case unit tests; no fuzz on truncation)
2. `Library.tsx`'s filter combinator — the `filtered = useMemo` block
   at line 129 is the most logic-dense pure function in the app
3. `clonePattern`/`resizeTracksToSteps` in `Studio.tsx:43-98` (these
   are pure utilities that already deserve to be extracted to
   `presets.ts`)

**Fix:** Bump WORK_PLAN P5's scope. Practice/Studio renders are too
costly for the engine they bring along; focus the new tests on **pure
utilities** that the modes embed. Do NOT introduce React Testing
Library integration tests yet — too much surface for one dev to
maintain.

---

## Smaller stuff (quick wins)

- `src/audio/engine.ts:65-71` — `legacyBarListener` shim is dead. No
  caller uses `engine.onBar = …` anymore; ripgrep confirms only
  `subscribeOnBar`. Delete the getter/setter and the field.
- `src/modes/Practice/Practice.tsx:131` has an
  `eslint-disable-next-line react-hooks/exhaustive-deps`. The intent
  is "only run when patternId changes," but `pattern` is derived from
  `patternId` via `useMemo` — putting `[pattern.id]` in the deps array
  is honest. Remove the disable.
- `src/modes/Library/Library.tsx:57` — `const recent = useMemo(() =>
  getRecent(), [])` is computed once and never refreshes. After a user
  loads from Library and navigates back, the strip is stale. Use
  `useState(() => getRecent())` and refresh on detail-modal-close /
  pattern-load.
- `src/modes/Studio/Studio.tsx:248` comment says "Intentionally NOT
  syncing" — but a few lines above (line 254-256) Studio DOES sync the
  default kit when metadata changes. Either remove the comment or align
  the behavior. (Recommend: remove the comment; the kit sync is the
  consistent behavior.)
- `src/modes/Library/GroupingBrowser.tsx` — `find` shows zero callers
  (WORK_PLAN P6 already calls this out; just confirming).
- `src/components/metronome/SwingPanel.tsx`,
  `AccentsPanel.tsx`, `CountInPanel.tsx`, `KitPanel.tsx` — none use
  `aria-label` on their range/button controls. The Practice/Studio
  parents wrap these in unlabeled panels. Add an `aria-label` per
  `<input type="range">` (just "swing", "strong accent", etc.) and a
  `role="group" aria-label="kit"` on `KitPanel`'s `bf-kit-grid`.
- `src/modes/Library/PatternDetail.tsx:93-94` — modal has
  `role="dialog" aria-modal="true"` but no focus trap, no
  `aria-labelledby`, and no return-focus-on-close. Native `<dialog>`
  element would handle all three for free. (Defer if not on the
  current iteration; flag in plan.)
- `src/modes/Studio/Studio.tsx:113` and `Practice/Practice.tsx:67` —
  `useState(() => getKitOverride(pattern.id))` reads `localStorage` in
  initializer. Fine, but `getMasterVolume()` is called in three places
  with the same pattern (App.tsx, Practice, Studio) — three reads on
  mount. Trivial cost, but if you extract a settings hook later this
  is the obvious place.
- `src/lib/errors.tsx:31-46` — `ErrorToasts` does a self-cancelling
  `setTimeout` re-render every second to clear expired entries. Cheap
  but ugly; switch to a single setTimeout scheduled when an entry is
  pushed.
- `src/audio/engine.ts:577-582` — `setTimeout(() => { ... bar
  listeners ... }, delayMs)` fires bar callbacks. `engine.dispose()`
  doesn't clear pending bar timeouts; if dispose runs mid-bar, the
  callback still fires on a torn-down engine. Track the timeouts in a
  `Set<TimeoutId>` and clear in `dispose()`.
- `src/App.tsx:42-44` — `if (engineRef.current === null) engineRef.current = new AudioEngine()`
  works but is the documented anti-pattern; `useState(() => new AudioEngine())`
  reads cleaner.
- `eslint.config.js` is 22 lines — confirm it actually enforces
  `react-hooks/exhaustive-deps` as `error`, not `warn`. (One disable
  comment in the codebase suggests it's enforced; verify.)
- `.gitignore` — verify `.claude/` is listed (WORK_PLAN P6 mentions).

---

## Anti-patterns to STOP doing

### A) Inline-effect engine sync per scalar
`Practice.tsx:138-143` and `Studio.tsx:179-184` each have 5-6
useEffects that just call one engine setter. Each is a render-after-state
indirection that's invisible to anyone reading the engine code. Keep
the **first one** (loadPattern, which is genuinely effectful) and inline
the rest into the setter callbacks. E.g., `setBpm(n)` becomes
`setBpm(n); engine.setBpm(n);` — same effect, no useEffect, no closure
churn. WORK_PLAN P3's `useMetronome` hook can codify this.

### B) Per-component `useEffect` reading from `localStorage`
`Practice.tsx:67`, `:73`, `:90`, `:91`, `:92` all
`useState(() => readSomething())`. This is fine *once* but the codebase
has 5-7 keys read from localStorage scattered across components. A
single `useLocalStorage(key, default)` hook (10 lines) would dedupe and
also catch the Safari-private-mode case via `storage.ts`'s
`warnStorage` path.

### C) `(... as ...)` casts on `Object.keys`
`Studio.tsx:46, :80, :494, :511`, `Practice.tsx:272`, `Library.tsx:113,
:117`, `StudioGrid.tsx:26` all do `Object.keys(record) as VoiceId[]`.
This is unsafe (TS doesn't enforce that the record only has VoiceId
keys at runtime — and in fact it does because the type forbids extras,
but a corrupted IDB pattern can lie). Add a `voiceIds(track)` helper in
`patterns/types.ts` that filters via the `ALL_VOICES` constant and
narrows correctly.

### D) Inline IIFE returns inside JSX (Library)
`Library.tsx:354` opens a 100-line IIFE to compute pagination + region
intro inside the results section. Extract `<ResultsGrid>` as a
sub-component in the same file. Same readability win as the
`StarterPaths` extraction.

### E) Repeated `confirm()` calls
`StudioSidebar.tsx:194, :224` use `window.confirm()` for delete
guards. Fine for v1, but inconsistent with the in-app toast aesthetic
elsewhere. Either commit to native dialogs or wrap with an in-app
`<ConfirmDialog>`. (Defer; flag.)

---

## I considered and rejected

- **A `useEngine` context provider.** The engine is already a singleton
  passed via prop in three places. Context adds an indirection and a
  consumer hook for a saving of three prop drills. Not worth it.
- **A reducer for Practice/Studio state.** The state is already ~10
  scalars per mode; `useReducer` with discriminated actions adds 80
  lines for marginal clarity. WORK_PLAN P3's hook is the right
  granularity.
- **Splitting `engine.ts` into scheduler/dispatcher modules.** The
  file is 604 lines, already well-commented, and has a single clear
  job. Splitting would create export ceremony with no readability
  improvement.
- **A custom `useLocalStorage(key)` hook with cross-tab sync.** The
  app is offline-first single-tab. `storage` events would solve a
  problem that doesn't exist.
- **Switching to CSS Modules / Tailwind.** The single `app.css` is the
  problem WORK_PLAN P1 already addresses with tokens. Replacing the
  whole approach is a bigger lift than fixing what's there.
- **A formal Toast manager.** `ErrorToasts` (errors.tsx) already does
  toasts;  Studio's `setToast`/`shareToast` are local one-liners. A
  manager is an unforced abstraction.
- **Backwards-compat for `engine.onBar`.** No external consumers
  exist. Just delete.

---

## Suggested integration with WORK_PLAN

| WORK_PLAN | This review |
|---|---|
| P1 (CSS tokens) | + finding #4 (delete duplicates first) |
| P2 (engine cleanup) | + finding #3 (lock down public fields) + smaller-stuff `legacyBarListener`, `dispose` timeout tracking |
| P3 (`useMetronome` hook) | + anti-pattern A (inline setters) |
| P4 (bundle splitting) | (nothing to add) |
| P5 (test backfill) | + finding #5 (Library filter combinator + Studio utilities) |
| P6 (smaller rocks) | + most of "smaller stuff" above |
| **NEW P0** | **Finding #1 — kill duplicate SW registration.** Ship in its own commit before P1. |

---

## Severity recap

- **HIGH:** Finding #1 (PWA double-registration) — landed in a recent
  commit, behavior bug, easy fix.
- **MED:** Findings #2, #3, #4, #5 — code-health debt that compounds.
- **LOW:** Everything in "smaller stuff."
