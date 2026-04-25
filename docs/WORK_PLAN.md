# BeatForge — Tightening Pass Work Plan

Snapshot taken **2026-04-24** after the metronome shared-component
extraction (commit `cadd2fa`). Goal: tighten the codebase before piling
on more features. Keep changes mechanical where possible, structural
where it pays.

LOC reference points (current):
- `engine.ts` 604 lines
- `app.css` 1923 lines
- `Studio.tsx` 736 lines
- `Practice.tsx` 559 lines

---

## P1 — Design tokens + container/input streamlining (CSS)

**Why first:** highest UI consistency payoff per hour; unblocks every
future visual change. Today the same intent is expressed with 4-7
different magic numbers. A token pass collapses them.

**What needs tokens** (audit):

| Concept | Current scatter | Token to introduce |
|---|---|---|
| Border radius | `6, 8, 10, 12, 13, 14, 16, 999, 50%` | `--r-sm` (8), `--r-md` (12), `--r-lg` (16), `--r-pill` (999), `--r-circle` (50%) |
| Container padding | `8px, 10px 12px, 14px 16px, 14px 18px, 18px` | `--pad-sm`, `--pad-md`, `--pad-lg` |
| Gap (flex/grid) | `4, 6, 8, 10, 12, 14, 16, 24px` | `--gap-xs..xl` |
| Border width | `1, 1.5, 2px` | `--bw-1`, `--bw-2` (drop 1.5px) |
| Font sizes | `9, 10, 11, 12, 13, 14, 15, 16, 18, 28, 44px` | `--fs-micro..hero` |
| Transitions | inline `0.08s, 0.1s, 0.4s` | `--t-fast`, `--t-base`, `--t-slow` |

**Deliverable:**
1. Add token block at the top of `app.css` under `:root` (themes already
   define color tokens — extend the same pattern for these).
2. Sweep through container shapes in this order: `.bf-panel`,
   `.bf-pattern-card`, `.bf-bpm-hero`, `.bf-trainer`, `.bf-strip`,
   `.bf-region-intro-card`, `.bf-starter-card`, `.bf-starter-chip`,
   `.bf-lib-tile`. Each gets the same shape vocabulary.
3. Sweep buttons next: `.bf-chip`, `.bf-bpm-tap`, `.bf-page-btn`,
   `.bf-starter-arrow`, `.bf-kit-btn`, `.bf-tap-btn` (gone but check),
   `.bf-mode-seg button`, `.bf-seg button`. Standardize height/padding
   pairs.
4. Inputs sweep last: `.bf-search-input`, `.bf-studio-input`,
   range slider thumbs, `<input type="number">`.

**Estimate:** half-day. Big diff but mechanical.

---

## P2 — Engine cleanup

The metronome UI lost three control surfaces, but the engine still
carries their plumbing. Either delete or call out as "intentionally
preserved for future Studio use".

**Dead-or-orphan in `engine.ts`:**

| Field/Method | Lines | Status |
|---|---|---|
| `overlay`, `overlayNextTime`, `overlayNextIdx` | 105-107 | No UI calls `setOverlay`; defaults to `null` so it's inert. Code path runs every tick to check. |
| `overlayClick`, `setOverlay` | 432-465 | Dead from the UI. ~35 lines incl. helpers. |
| `groupAccents` | 260-? | No UI calls `setGroupAccents`. |

**Decision needed:** delete or preserve?
- **Delete** — `engine.ts` drops to ~520 lines, scheduler tick loop
  shrinks (the `if (this.overlay)` branch goes away). Cheap to revive
  from git later if needed.
- **Preserve + comment** — leave as documented capability the UI
  doesn't currently expose. Recommend a banner comment near the field:
  `// Engine capability — currently unwired in UI as of 2026-04-24.`

**Default recommendation: delete.** YAGNI applies. Git is the
preservation layer.

**Estimate:** 1-2 hours including test pass.

---

## P3 — Extract `useMetronome(engine)` hook

Both Practice and Studio carry the same state (`bpm`, `kit`, `swing`,
`strong`/`weak`, `countInBars`, `trainerCfg`, `trainerOn`, `trainerBar`,
`trainerCycleStartMs`, `tapTimes`) and the same effects that sync each
to the engine. The shared *components* now consume the state — but the
state itself is still duplicated.

**Goal:** one hook that owns the metronome state + engine sync. Each
mode calls it with mode-specific overrides.

```ts
const m = useMetronome(engine, {
  initialBpm: pattern.bpm.default,
  initialKit: pattern.defaultKit,
  swingable: pattern.swingable,
});
// m.bpm, m.setBpm, m.handleTap, m.kit, m.setKit, ...
// m.trainer: { cfg, setCfg, on, setOn, bar, cycleStartMs }
```

**What lives outside the hook:**
- Practice's pattern-driven kit override + reset (mode-specific UX)
- Studio's `kitOverrideRef` follow-the-draft logic
- Pattern change reset semantics (different in each mode)

**Estimate:** half-day. Big TS refactor but the test surface is small.

---

## P4 — Bundle size

`vite build` warns: 921KB JS, 248KB gzipped, threshold 500KB.

**Quick wins:**
1. Code-split `Library` and `Studio` via `React.lazy` — Practice is the
   default landing route; Studio + Library don't need to ship in the
   first chunk.
2. Lazy-load `Fuse.js` only when the search input gets focus.
3. Investigate `INEFFECTIVE_DYNAMIC_IMPORT` warnings on `storage.ts` and
   `serialize.ts` — both are statically imported elsewhere, defeating
   their dynamic imports.

**Estimate:** 2-3 hours.

---

## P5a — Lint debt (React 19 strict rules)

Pre-commit currently runs **typecheck only** (`bun run check`). Lint
runs are advisory (`bun run check:lint`). The codebase has 25 preexisting
errors from `eslint-plugin-react-hooks` v7's stricter rules:

- **`react-hooks/refs`** ("Cannot access refs during render"): `App.tsx:45`,
  `Practice.tsx:100`. Lazy-init engine/timer ref pattern. Needs refactor
  to a `useState` lazy initializer or a custom `useEngine` hook.
- **`react-hooks/set-state-in-effect`**: `App.tsx:110`, `UpdateBanner.tsx:27`,
  `Library.tsx:65`, `Practice.tsx:121`, `Studio.tsx:393`. Most are
  legit cases (sync state to a prop change) but the modern pattern is to
  compute during render where possible.
- **`react-hooks/impure-during-render`**: `errors.tsx:40` — `Date.now()` in
  filter. Move to a state with rAF/interval refresh, or accept that
  filtering by `at` is fine and silence with `// eslint-disable-next-line`.
- **`react-refresh/only-export-components`**: `errors.tsx:25,29` — file
  exports both components AND `logError`/`logWarn` functions. Split the
  helpers into `lib/log.ts`.
- **`react-hooks/preserve-manual-memoization`**: `Practice.tsx:123` —
  `clearCountInTimer` referenced before declaration in a useEffect dep.

Once these are fixed, ratchet up the pre-commit hook to:
```sh
bun run check:lint   # typecheck + lint, no test
```

Update `app/scripts/githooks/pre-commit` to call `check:lint` instead of
`check`. The `check:full` script runs the test suite too — wire that
into CI when you set CI up.

## P5 — Test gaps to backfill

Nothing under `app/src/components/metronome/` has tests. Specifically:
- `BpmHero` tap-armed state, slider clamping
- `Trainer` time-mode countdown math (cycleStartMs timing)
- `KitPanel` reset flow (Practice path)

Plus the engine cleanup in P2 needs a regression test that schedule
ticks no longer reference overlay/groupAccents fields.

**Estimate:** half-day.

---

## P6 — Smaller rocks (do these inline as you encounter them)

- Delete orphan `app/src/modes/Library/GroupingBrowser.tsx` (no
  consumers since the zone was removed).
- Remove `difficulty` from `presets.ts` defaults — schema still
  requires it but UI never sets it; defaulting in `presets` is now the
  only writer.
- `app.css` has both `.bf-lib-count` rules removed (older one at line
  635 was removed; check no other duplicates lurk).
- `.claude/` directory is untracked but persistent — add to
  `.gitignore`.
- `Disclosure` import was removed from `Library.tsx`; double-check no
  other library file imports it accidentally.

---

## Suggested ordering

1. **P1 (CSS tokens)** — high payoff, blocks nothing else
2. **P6 (inline cleanup)** — pair with P1 since you'll be in CSS anyway
3. **P2 (engine cleanup)** — lands clean, then P3 lands on top
4. **P3 (`useMetronome` hook)**
5. **P4 (bundle splitting)**
6. **P5 (test backfill)** — natural follow-up to P2/P3

Don't try to land all of this in one branch. P1+P6 in one commit. P2 in
its own. P3 in its own (touches both modes meaningfully). P4 separately.
P5 alongside whatever it backfills.

## Non-goals (explicit)

- Renaming `yours` variable / `bf-studio-yours-*` classes. Internal,
  not user-visible — pure churn.
- Removing `difficulty` from the schema or pattern JSON files. Data
  preservation > UI cleanup.
- Changing the audio engine's scheduling model. It works; leave it.
