# BeatForge — `/app`

The shipping React 19 + Vite + TypeScript app. Run from this folder.

```bash
bun install
bun dev          # local dev at http://localhost:5173/
bun run build    # production build into dist/
bun run preview  # serve the production build
bun run test     # vitest, 328 tests
bun run check:lint  # tsc + eslint
```

## Layout

See [`src/INDEX.yaml`](src/INDEX.yaml) for the full map. The high-traffic spots:

- **`src/App.tsx`** — root component. Owns the `SoundEngine`, the modular `Router`, the `SessionProvider`, tab routing (`?tab=practice|studio|library|_midi`), URL state, and the cross-tab dirty guard.
- **`src/audio/runtime/sound-engine.ts`** — single audio runtime. Master + dry buses, FX returns with HF/LF damping, channel strips, sequencer driver. Emits a typed `EventBus` everything else subscribes to.
- **`src/audio/machines/`** — declarative voice + FX library. Each machine is a `ControllableModule` with `params` + `set(name, value, opts)`. Voice archetypes: kick / snare / hat / clap / tom / cowbell / modal / FM / formant / noise / chip / crackle / phase-distort / wavefolder.
- **`src/modules/`** — six small framework-free modules (events, router, audio-graph, sequencer, session, midi). The "control plane" that lets UI knobs, MIDI CCs, and automation all drive audio through one path.
- **`src/modes/`** — Practice / Sound (Studio) / Library / Midi — one folder per route.
- **`src/patterns/`** — schema + 536 seed patterns under `seed/` (one JSON per region).

Every directory has its own `INDEX.yaml` describing purpose, contents, and invariants. Drop into any folder and read its index first.

## Signal flow (the fast tour)

When the user moves a slider in Studio:

1. The slider's `onChange` emits a `ParamEvent` on `engine.getEventBus()`.
2. `modules/router` (registered in `App.tsx`'s `ModeShell`) resolves the event's address (e.g. `master.dry.value`) to a `ControllableModule`.
3. The module's `.set()` ramps the underlying `AudioParam`.
4. Audio renders through `dry → master → analyser → destination`.
5. The same `ParamEvent` is observable for MIDI-out (the sink in `modules/midi/sink.ts` subscribes), recording, and future automation.

UI knobs **never** call `engine.setX()` directly — everything goes through the bus + router. That's how MIDI input mappings drive the same parameters as the UI.

## Testing

Vitest. 328 tests. Run `bun run test`. Notable suites:

- `src/patterns/seed/index.test.ts` — schema invariants over every shipping pattern (timeSig consistency, grouping sums, voice keys).
- `src/modules/midi/*.test.ts` — input mapping, sink, clock listener/sender, hot-unplug.
- `src/audio/runtime/engine-adapters.test.ts` — router → engine wiring.
- `src/modules/sequencer/sequencer.test.ts` — bar / step / trigger emission timing.

## Linting

ESLint 9 flat config with React 19 + typescript-eslint strict rules. Pre-commit hook runs `bun run check:lint`. To run manually: `bun run lint` (or `bun run lint:fix`).

## PWA + deploy

- `vite.config.ts` configures `vite-plugin-pwa` with Workbox `generateSW` strategy.
- Base path is `/beatforge/` for GitHub Pages.
- Pushes to `main` auto-deploy via [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

## Pattern authoring

To add a new pattern: edit the relevant `src/patterns/seed/<region>.json` file and append a record matching the schema in `src/patterns/types.ts`. Run `bun run test src/patterns/seed/index.test.ts` — the schema invariants will fail loudly if `timeSig`, `grouping`, and `stepUnit` aren't internally consistent.

See [`CONTRIBUTING.md`](../CONTRIBUTING.md) at the repo root for the full pattern-authoring guide including cultural-sensitivity notes.

## Engineering review notes

[`docs/2026-04-28-engineering-review-notes.md`](../docs/2026-04-28-engineering-review-notes.md) at the repo root captures findings from the most recent code review (silent failures, type design, code quality). Items marked ✅ are landed; bare bullets are open follow-ups. Read it before touching the MIDI or audio modules.
