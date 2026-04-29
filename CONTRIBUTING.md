# Contributing to BeatForge

Thanks for opening this — the project is small and solo-maintained, so any help is genuinely appreciated.

There are three useful ways to contribute:

1. **Submit a pattern** (or fix one). Most valuable.
2. **File a bug or UX issue** with what you saw vs. what you expected.
3. **Open a PR** — features, fixes, accessibility, performance.

---

## 1. Pattern contributions

The 536 patterns under [`app/src/patterns/seed/`](app/src/patterns/seed/) are the heart of the app. They're imperfect — some traditions are over- or under-represented, some labels could be cleaner, some stories need a practitioner's eye. **If a rhythm in your tradition is missing, mislabeled, or culturally miscontextualized, please tell me.**

### Adding a pattern

Patterns live in JSON files grouped by region — e.g. `west-africa.json`, `cuba-afrocaribbean.json`, `india.json`. Pick the relevant file and append a record:

```json
{
  "id": "your-pattern-id",
  "name": "Display Name",
  "origin": "City · Country",
  "tradition": "Tradition / context",
  "country": "Two-letter or short name",
  "genre": "folk-dance",
  "region": "west-africa",
  "difficulty": "intermediate",
  "timeSig": "12/8",
  "stepUnit": 8,
  "steps": 12,
  "grouping": [3, 3, 3, 3],
  "bpm": { "default": 110, "min": 80, "max": 140 },
  "tags": ["bell-pattern", "polyrhythm"],
  "story": "1–3 sentences of cultural context. Where it's played, what role it serves, what to listen for.",
  "tracks": {
    "KK": [2, 0, 0, 1, 0, 0, 1, 0, 0, 2, 0, 0],
    "SN": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "HH": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  "defaultKit": "frameDrum",
  "swingable": false,
  "relatedIds": ["agbekor", "bembe-68"]
}
```

Run the schema test to confirm everything's consistent:

```bash
cd app && bun run test src/patterns/seed/index.test.ts
```

The invariant check enforces `numerator(timeSig) === sum(grouping) × (denom / stepUnit)` and `sum(grouping) === steps`. If those don't pass, the displayed BPM and the visual dot count won't match what plays.

### Voice keys

The shipping voice set is `KK / SN / HH / OH / CP` (kick / snare / hat / open hat / clap). For traditions where this mapping doesn't fit (tabla, gamelan, frame-drum families), the engine still uses these keys but the voice timbres are remapped per-kit — pick the kit that's closest to the tradition's role hierarchy.

### Cultural sensitivity

The `story` field is small but matters. A few notes:

- Lead with **what the rhythm is for**, not just where it's from. ("Wedding-procession 9/8 from Thrace; the 2+2+2+3 grouping creates a turning, off-foot lift…")
- Avoid framing traditions as exotic or primitive. They're living practices.
- If you're transcribing from a recording or notation source, link it.
- If a tradition's holders have explicitly asked that material not be commodified, **don't add the pattern.** Open an issue to discuss instead.

### Fixing a pattern

If a pattern's labels are wrong (timeSig, grouping, region, story), open a PR — the schema test will guide you to the consistent set of fields. Bonus points if you note in the PR body what's correct vs. what shipped, with a citation if you have one.

---

## 2. Bug reports + UX feedback

[Open an issue](https://github.com/cemergin/beatforge/issues) with:

- What you tried (URL with `?tab=…&pattern=…` if relevant)
- What you expected
- What happened (browser, OS, audio device if relevant)
- Screenshot or short screen recording when it's a visual or interaction bug

If you hit a real audio glitch, a paste of `console.log(performance.now())` between user action and the broken sound helps. The engine has a Web Audio + Web Worker timing model — when something's wrong, knowing if it's the React render, the scheduler, or the device usually pinpoints it.

---

## 3. Code contributions

### Dev setup

```bash
git clone https://github.com/cemergin/beatforge.git
cd beatforge/app
bun install
bun dev          # http://localhost:5173
```

Other commands you'll want:

```bash
bun run test         # vitest, 328 tests
bun run check:lint   # tsc + eslint, also runs as a pre-commit hook
bun run build        # production build into app/dist
bun run preview      # serve the production build
```

### Where things live

Read [`app/src/INDEX.yaml`](app/src/INDEX.yaml) first — it's the entry-point map. Every meaningful directory has its own `INDEX.yaml` describing purpose, contents, and invariants. Drop into any folder and read its index before changing files.

The high-traffic spots:

- `app/src/App.tsx` — root; tab routing, session, MIDI bridge.
- `app/src/audio/runtime/sound-engine.ts` — single audio runtime.
- `app/src/modes/` — Practice, Studio (in `Sound/`), Library, Midi.
- `app/src/modules/` — bus, router, sequencer, session, midi (framework-free).
- `app/src/patterns/` — schema + 536 seed patterns.

### Conventions

- TypeScript strict. ESLint flat config with React 19 rules. Code that passes `bun run check:lint` is good to PR.
- **No new abstractions for hypothetical needs.** Three similar lines beats one premature abstraction.
- **Comments are for the WHY, not the WHAT.** If a future reader can derive the intent from the code, no comment needed.
- **One commit per logical change.** Squash on PR is fine, but please keep the history readable.
- **Tests for new modules.** The pattern is in `app/src/modules/*/*.test.ts`; copy a sibling and adapt.

### Pull request flow

1. Branch from `main` (the trunk).
2. Run `bun run check:full` (typecheck + lint + tests) before pushing.
3. Open the PR with a short why + before/after if there's a UX change. Screenshots/screencaps for visual changes, please.
4. CI runs typecheck + tests automatically on push.

### Bigger changes

If you're proposing something architectural (new module, schema migration, audio-engine refactor), open an issue first to talk through the approach. The [`docs/`](docs/) folder has the design specs + architecture notes — worth a skim before a big PR.

---

## Code of conduct

Be kind. Assume good faith. If you spot bias in the corpus, the docs, or the code review, say so — quietly via DM or loudly via issue, whichever feels right. The project is small enough that disagreements should be conversations, not ceremonies.

---

## License

MIT. By contributing, you agree your contributions will be licensed under the same terms — see [`LICENSE`](LICENSE).
