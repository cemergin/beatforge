# BeatForge Engineering Review #2 — 2026-04-24

Second-pass review after the tightening session that landed P1 (CSS
tokens), P2 (engine cleanup), P3 (`useMetronome`), P4 (lazy chunks),
some of P5 (25 new unit tests on pure modules), and the PWA dedup.
What follows is the next bite — items the prior pass either missed
or that surfaced *because* of those changes.

Scope rules: nothing already done in WORK_PLAN/ENGINEERING_REVIEW. No
extra abstractions, no framework swaps, no enterprise sprawl. Solo
dev / ship-faster taste preserved.

---

## TOP 5 — highest-leverage findings

### 1. Pre-commit doesn't run lint, and lint is broken — HIGH
`app/scripts/githooks/pre-commit:21` runs `bun run check` (typecheck
only). `bun run lint` currently reports **8 errors + 10 warnings**
(`react-hooks/set-state-in-effect`, `react-hooks/exhaustive-deps`,
"Unused eslint-disable directive"). The work plan said "ratchet to
`check:lint` once P5a is clean" — P5a is *not* clean, and the hook
silently lets the rot through. Worse, the `eslint-disable-next-line
react-hooks/set-state-in-effect` comments at `useMetronome.ts:125`,
`134`, `Practice.tsx:122`, `Library.tsx:65`, `UpdateBanner.tsx:27`
are reported as **unused directives** — meaning eslint isn't matching
them where the developer intended.

**Fix (≤30 min):** (a) Rename `bun run check` → real check including
lint, OR change pre-commit hook to call `check:lint`. (b) Resolve the
8 set-state-in-effect errors: most are legit (count-in cycle counting,
trainer ramping); silence with the right disable line *or* refactor
the trainer to a `subscribeOnBar` callback that mutates state inside
a non-effect listener. (c) Delete the unused-directive lines so the
warnings clear. **Why it compounds:** every new commit can introduce
hook bugs that no longer get caught at commit time. The fact that
prior reviews assumed lint was enforced confirms this is invisible.

---

### 2. Engine state mutation still bypasses setters in two paths — HIGH
P2 made fields `private` with getters, but the implementation still
has self-mutation paths that skip the side-effects:

- `engine.ts:432-465` (`countInClick`) and `engine.ts:521-528`
  (`trigger`) read `this._kit`, `this._bpm` indirectly via `this.kit`,
  `this.bpm` getters — fine. But there's no equivalent guard for
  **time-sensitive sequence**: `setBpm` re-anchors only `nextNoteTimes`
  (line 226-228) — `barAnchorTime` is updated separately. If a future
  caller calls `setBpm` while `running===false` then immediately calls
  `start()`, the bar anchor gets set in `start()` from `startTime` —
  fine. But if `loadPattern` is called between two `setBpm` calls on a
  running engine (which Practice does on every grouping toggle), the
  trackCaches rebuild can change `cycle`/`stepsPerBar` while
  `nextIdx[tr]` carries forward — `audibleCursors()` then computes
  `globalIdx % cycle` against the *new* cycle but with an `anchorIdx`
  from the *old* cycle. Visual cursor jumps for ~1 bar.

- `engine.ts:255-296` (`loadPattern` hot-swap path) doesn't re-anchor.
  When stepsPerBar changes on hot swap (e.g., user edits the time sig
  in Studio while playing — possible via `applyTimeSig`), the
  `anchorTime` for surviving tracks still encodes the *old* stepSec.
  Result: scheduler keeps the old phase for one tick, jumps on the
  next cache hit.

**Fix (~2 hours):** in `loadPattern` hot-swap, when `c.cycle` or
`c.stepsPerBar` changes for a surviving track, re-anchor at the next
bar boundary rather than continuing with stale anchors. Add a regression
test in `engine.test.ts` that toggles grouping mid-playback and
asserts cursor monotonicity. **Why it compounds:** these are the kinds
of timing bugs that get reported as "drum machine glitches when I
change settings" and are nightmare to repro.

---

### 3. App.tsx URL-sync effect re-runs serializePattern on every keystroke — MED
`App.tsx:154-195` depends on `[tab, patternId, patternSourcesTick]`.
`patternSourcesTick` is bumped whenever `refreshUserCache` runs — and
`refreshUserCache` is called on Studio save, Library load, Practice
load. Each bump retriggers the URL-sync effect, which dynamically
imports `serialize.ts` and `await`s `serializePattern(resolved)` — a
gzip+base64url round-trip — for non-seed patterns. Fast in isolation
(~2-5ms) but the effect runs even when nothing relevant changed (the
shared/user pattern map being repopulated doesn't mean the URL needs
to re-encode).

**Fix (~30 min):** extract a stable identity for "is this the
encoded URL we already wrote" and short-circuit before doing the
async work. Or split: only run encoding when `patternId` or `tab`
*actually* changed (compare against a ref of last-encoded
`{tab, patternId}`). **Why it compounds:** every Studio save +
Library navigation pulses through this. The user won't notice today,
but adding any heavier serialization (e.g., compression upgrade)
amplifies it linearly with cache refresh frequency.

---

### 4. ALL_KITS / VOICE list duplicated in 3+ places — MED
`KitPanel.tsx:3`, `StudioSidebar.tsx:8`, `storage.ts:64-66` each
re-declare `KitId[]` for the seven kits. `StudioSidebar.tsx:9-12`
and `Studio.tsx`'s implicit Genre list also duplicate. Add a kit and
you must touch three files; the type system won't catch the omission
(every list is typed `KitId[]`, all valid). Same applies to
`presets.ts:25-26` (`DEFAULT_VOICES`, `ALL_VOICES`) vs the implicit
`VoiceId[]` cast scattered across 12 callers (`StudioGrid.tsx:26`,
`patternOps.ts:12,49`, `Studio.tsx:423,440`, `LinearGrid.tsx:11`,
`PillGrid.tsx:11`, `CircularGrid.tsx:12`, etc.).

**Fix (~45 min):** add `ALL_KITS: readonly KitId[]` and
`ALL_VOICES: readonly VoiceId[]` to `patterns/types.ts` (next to the
type defs) and import from there everywhere. Replace the
`Object.keys(record) as VoiceId[]` casts with a single
`voiceKeys(track)` helper that filters via `ALL_VOICES.includes`.
Pattern reviewer/anti-pattern C from ENGINEERING_REVIEW.md is a
direct subset of this. **Why it compounds:** seven kits today, but
the spec phasing has more (Drum Synth era voices). Single source of
truth now buys cheap correctness later.

---

### 5. Test cliff: zero coverage on Library filter logic, App URL state, Practice/Studio integration paths — MED
The 25 new tests cover pure modules (engine, tempo, patternOps, db,
schema, etc.) — strong work. But the *integration paths most likely
to regress* still have zero coverage:

- **`Library.tsx:122-146` (filter combinator)** — the
  `searched`/`filtered` `useMemo` chain is the densest pure logic in
  the app. Active path overrides search; meters/regions/genres/kits
  each AND together; multi-select within a row ORs. Easy to break
  with a one-line tweak. Pure-extract `applyFilters(query, filters,
  activePath, patterns)` to `Library/filterState.ts` (already exists)
  and unit-test it.
- **`App.tsx:115-138` + `App.tsx:154-195` (URL ↔ state)** — the
  share-link decode + URL rewrite logic has no automated coverage.
  This is the public contract for a shipped product (people post
  share links). Test `readUrlState` (pure) and the seed-vs-shared
  decision in `(isSeed)` at line 162-165.
- **`useMetronome` trainer cycle math** — `useMetronome.ts:125-144`
  drives the speed trainer. Currently coupled to `subscribeOnBar`
  (good — testable via a fake engine). No test exists. A regression
  here breaks "the #1 practice feature" silently.

**Fix (~half day):** three new test files — `filterState.test.ts`,
`App.urlstate.test.ts`, `useMetronome.test.ts` — with happy + edge
case per. Don't introduce React Testing Library yet; the URL helpers
are pure functions, the trainer hook can be tested with a fake
engine that exposes `triggerBarBoundary(n)`. **Why it compounds:**
exactly the regressions a solo dev can't catch by hand.

---

## Per-axis observations

### React — **strong** lazy-loaded chunks, single engine instance
via `useState(() => new AudioEngine())` (correct lazy-init
pattern), `subscribeOnBar` multi-listener fanout. **Weak**: `App.tsx`
has 9 useEffects, several with overlapping deps; URL-sync effect
re-runs too often (finding #3). `Library.tsx:354-469` is a 100-line
IIFE inside JSX — already flagged in prior review, still not extracted.
**Missing**: per-route error boundaries — a render crash in Library
takes down the whole app via the root `ErrorBoundary`. Each lazy
`<Suspense>` could wrap an `<ErrorBoundary>` with a "this mode crashed,
go back" panel. Practice's `useEffect(() => clearCountInTimer, [...])`
at `Practice.tsx:143` and Studio's `Studio.tsx:175` use a function
*reference* as the cleanup return — clever but easy to misread; an
explicit `return clearCountInTimer` would be clearer.

### TypeScript — **strong** discriminated `Track` union (Velocity[] |
{pattern, subdivisions, cycle}), Zod schema as runtime guard,
branded-ish `VoiceId`/`KitId`/`RegionId` literal unions. **Weak**: 30+
`as` casts across the codebase — most are `Object.keys(x) as VoiceId[]`
which is technically unsound (seed JSON could lie), but
`Practice.tsx:211` does `pattern.tracks[firstTrack as VoiceId]!` (cast
+ non-null in one shot — both wrong if the track is missing). Also
`App.tsx:57` `localStorage.getItem('bf_theme') as Theme` — there's no
`'paper'` validation, a stale `'old'` value sneaks through and
`document.documentElement.dataset.theme = 'old'` ships. **Missing**:
exhaustive switches over `KitId` / `RegionId`. With kits expanding
post-v2, an `assertNever` discipline pays for itself. Also `Theme`
is duplicated in `App.tsx:19` and the CSS `:root[data-theme=…]`
selectors — one source of truth (a `THEMES` const array) would prevent
typos.

### Frontend UX — **strong** keyboard shortcuts (Space, T, /, 1-9),
ARIA labels on most icon buttons, `aria-modal` on dialogs,
`role="status"` on toasts. **Weak**: zero focus-trap on
`<PatternDetail>` and `<SaveDialog>` modals — Tab walks out, Escape
closes only PatternDetail. Native `<dialog>` would solve all three
(focus trap, return focus, ESC-to-close) for free. No `prefers-reduced-motion`
media query *anywhere* in `app.css` — the trainer ramp at
`transition: width 0.4s` (line 410) and the cursor `transform: scale(1.08)`
(line 333) animate even for users who prefer no motion.
`:focus-visible` styles are present only on `.bf-studio-input:focus`
(line 1509); every other `outline: none` (line 270, 724, 1129) strips
focus rings without restoring them on keyboard nav. **Missing**: skip
link from header to main content, `aria-live` on the BPM display
(currently silent for screen readers when the trainer ramps), volume
slider has aria-label but no aria-valuetext (announces "53" not "53%").

### UI / style system — **strong** tokens for radii (97 token uses,
4 literals — near complete), spacing (`--sp-1..10`), font sizes
(`--fs-micro..hero`). Theme color tokens via `:root[data-theme=…]`
are tight. **Weak**: transitions tokens (`--t-fast/-base/-slow`)
defined but **0 usages in the file** — every transition is a literal
`0.08s/0.1s/0.15s/0.4s`. Border-width tokens (`--bw-1`, `--bw-2`)
defined but **0 usages** — there are 14 `1.5px` literals (an
unintended third step the tokens explicitly tried to retire). The
hardcoded `#3a1a1a` / `#5a2a2a` / `#ffd5d5` in `errors.tsx:48-50` is
the only color literal in TSX but it's the most painful one (toast
colors, won't theme). **Missing**: a `<Button>` component. Today
every button is a class string permutation (`bf-chip`, `.on`,
`.ghost`, `.sm`, `bf-chip-row`, etc.) — at least eight variant flavors
that any new dev has to grok by reading CSS. A 30-line `Button`
wrapper that maps `{variant: 'chip'|'ghost'|'on'|'kit', size: 'sm'|'md'}`
to those class strings would eliminate the variance and make the
inline styles in `pwa.tsx:30-62` (which exist *because* there's no
button system) unnecessary.

### Software-engineering — **strong** logical module boundaries
(`audio/`, `lib/`, `patterns/`, `modes/*/`), clear naming convention
(`bf-` CSS prefix, `Pattern.id` kebab-case). Pre-commit hooks installed
via `prepare`. Worker-based scheduler isolation. **Weak**: pre-commit
hook doesn't run lint (finding #1). `dist/` artifacts are 4 days old
in working tree — verify CI exists (no `.github/workflows/` was
referenced in the prior reviews; check). `console.warn` at
`Practice.tsx:153` is the only `console.*` outside `lib/log.ts` —
consolidate via `logWarn`. **Dead code**: `GroupingBrowser.tsx` (75
lines, zero callers — confirmed via grep); `pwa.tsx:30-62` inline
styles for the install toast that could share `bf-update-banner`'s
classes. `Disclosure` no longer imported in Library (matching
WORK_PLAN P6 expectation). **Missing**: a one-page `ARCHITECTURE.md`
distilling spec §4-§5 for new contributors — `engine.ts` has
excellent comments but the bridging document doesn't exist outside
the spec doc.

### Tests — **strong** pure-module coverage (engine math, tempo
conversions, schema validation, serialization round-trip, pattern
ops, db). 10 test files, mostly fast (no DOM, no React). `db.test.ts`
covers Dexie via `fake-indexeddb`. **Weak**: zero hook tests, zero
URL-state tests, zero filter-combinator tests (finding #5). The
`Library.tsx:129` filter `useMemo` is the densest pure logic in the
app and untested. **Missing**: Studio's `applyTimeSig` /
`pickStepUnit` / `commitGroupingText` (all pure, all currently inline
in Studio.tsx — extract to `studio-meter.ts` and test). Also no test
for `serialize.ts`'s share-link round-trip on a Studio-edited pattern
(only seed patterns are tested).

---

## What's surprisingly good (preserve, lean in)

1. **`useMetronome.ts` boundary** — clean separation of "what the
   engine cares about" (BPM, swing, accents) from "what each mode
   cares about" (pattern, kit override semantics). Doesn't over-reach
   into pattern editing or kit. The comment block at lines 1-21 is
   the kind of "what lives here / what stays out" doc that prevents
   scope creep. Other shared hooks should follow this template.
2. **Engine encapsulation via getters** (`engine.ts:54-62`) — the
   `_field` private + read-only getter pattern is exactly right: lets
   React read freely, prevents drift through illegal writes, no Redux
   ceremony. Extend to any new state.
3. **`patterns/seed/index.ts`** — `import.meta.glob` + Zod parse +
   alphabetical fallback gives you a fully data-driven seed library
   where adding a region is `cp foo.json` + a one-liner in
   `REGION_ORDER`. The error message at line 73 (path + invalid id)
   is the kind of "fail clearly at build time" that pays back tenfold
   the day a contributor drops a malformed JSON.

---

## Out of scope but worth flagging

- **Schema chunk is in the main bundle** — `dist/assets/schema-*.js`
  is 67 KB (18 KB gz), and the eager `import.meta.glob` for seed JSON
  parses 23 region files synchronously at boot. Practice doesn't
  *need* the entire 536-pattern catalog to render its current pattern
  — it just needs `patternById(id)`. A future move could be: ship a
  small "patterns index" (id → region map) eagerly, lazy-load each
  region's JSON on demand. Nontrivial — touches Practice/Library/
  Studio/share-link decode all at once. Don't do it now; flag for
  when bundle pressure becomes a real problem (it's currently
  742KB / 195KB gz on the main chunk — over the 500KB warning, but
  not user-visible on broadband).
- **Native `<dialog>` migration** — three modals (`PatternDetail`,
  `SaveDialog`, and the inline-IIFE in `Library`) are hand-rolled with
  `role="dialog" aria-modal`. Native `<dialog>` (Chrome/Safari/FF
  since 2022) gets focus trap, ESC, return focus, and backdrop
  click-to-close for free. Migration touches modal styling
  (`::backdrop` pseudo-element, removing `bf-modal` overlay div) and
  the `onClick`-on-overlay close pattern. A clean half-day refactor
  whenever there's bandwidth — meaningful a11y win.

---

## Concrete next-five-things-to-do

1. **Fix lint + ratchet pre-commit (HIGH, ~30 min)** —
   resolve the 8 errors, delete the unused-directive comments, change
   `pre-commit` hook from `bun run check` to `bun run check:lint`.
   Ship in its own commit titled "lint: clean P5a debt + enforce in
   pre-commit". *Finding #1.*
2. **Hot-swap re-anchor in `engine.loadPattern` (HIGH, ~2 h)** — when
   a surviving track's `cycle` or `stepsPerBar` changes, reset
   `anchorTime`/`anchorIdx` to next bar. Add a regression test that
   plays for 2 bars, mutates pattern.steps, plays 2 more, asserts
   cursor monotonic. *Finding #2.*
3. **Single source of truth for kit + voice lists (MED, ~45 min)** —
   add `ALL_KITS`/`ALL_VOICES`/`voiceKeys()` helpers to
   `patterns/types.ts`, sweep three call sites + 12 `Object.keys` casts.
   *Finding #4.*
4. **Filter-combinator + URL-state tests (MED, half-day)** — extract
   `applyFilters` to `Library/filterState.ts` (file already exists),
   add 8-10 unit tests covering active-path-override + each
   AND/OR row. Same for `readUrlState` in App. *Finding #5.*
5. **Apply transition + border-width tokens (LOW, 1 h)** — sweep the
   ~25 literal `0.08s/0.1s/0.15s/0.4s` transitions and 14 `1.5px`
   borders. Mechanical pass. Justifies the tokens that currently exist
   but are unused. After this, `--bw-*` and `--t-*` are real, not
   aspirational.

Out of order if the user pushes for it: finding #3 is real but its
user impact is small enough to defer behind the others.
