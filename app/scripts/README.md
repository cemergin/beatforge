# BeatForge Scripts — Pattern Migration Pipeline

This directory hosts dev-time tooling. Nothing here is bundled into the app.

## extract-patterns.ts — Markdown → draft JSON

Carves a research Markdown file into per-pattern draft JSONs. Intentionally
LLM-free: the regexes capture notation + prose mechanically, and the manual
conversion to fleshed-out `tracks` / `story` happens downstream.

### Running

```bash
# from app/
bun scripts/extract-patterns.ts ../research/patterns/turkish-arabic-indian.md --region turkey-ottoman
```

Arguments:

| Arg | Required | Notes |
| --- | --- | --- |
| `<markdown-path>` | yes | Resolved relative to CWD. |
| `--region <regionId>` | no | Overrides the filename-based region guess. Use a `RegionId` from `src/patterns/types.ts`. |

### Output

```
app/patterns-drafts/<region>/<slug>.json
```

Each draft file conforms to the `Pattern` schema *plus* a `_draft` pipeline
block containing:

- `rawBlocks` — fenced code blocks lifted verbatim from the Markdown
- `rawProse` — first ~2KB of the surrounding prose
- `extractionWarnings` — mismatches the script detected (e.g. grouping sum
  doesn't equal `steps`, track length is off, no tracks detected)
- `sourceFile` — absolute path to the Markdown

Fields the extractor cannot infer are set to the sentinel `"TBD"` (for
scalars) or empty arrays (for tracks/instruments). The sandbox refuses to
play drafts whose tracks are all empty.

### Notation formats observed

The research corpus is inconsistent. `extract-patterns.ts` handles:

- `turkish-arabic-indian.md` — fenced `Genre:` / `BPM:` blocks with pipe-row
  notation (`KK: |x...x...|`) and an optional `Kit Adaptation:` subsection.
- `african-ensembles.md` — H3 headings like `### === 1. AGBEKOR ===`,
  multi-block ensembles, bell/shaker parts named in free text.
- `gamelan-southeast-asian.md` — largely prose; tables sparingly used.

Ambiguities — ensemble-instrument labels (Bell, Kagan, etc.) only partially
map onto the 5-voice set. The extractor takes a best-guess first hit per
voice and flags lengths that don't equal `steps`; the operator resolves the
rest in the sandbox or Claude pass.

### Manual LLM pass (per batch)

1. Run the extractor to produce drafts under `patterns-drafts/<region>/`.
2. For each draft with `extractionWarnings`, open it, paste its
   `_draft.rawProse` + `_draft.rawBlocks` into Claude with a prompt like:
   > "Convert this notation to 16-cell velocity arrays for KK/SN/HH/OH/CP
   > where 0=off, 1=ghost, 2=accent. Keep time sig <X/Y>. Output JSON for
   > the `tracks` object only."
3. Paste the returned `tracks` back into the draft file.
4. Fill in `tradition`, `tags`, `instruments`, and any story refinements.
5. Save. The sandbox re-reads on page reload.

## The sandbox — `/_patterns` (dev-only)

While running `bun dev`, a `_patterns` chip appears in the top nav. It:

- Lazy-loads every file in `app/patterns-drafts/**/*.json` via `import.meta.glob`.
- Groups them by region.
- For each draft card: BeatDots preview, play/stop, verdict buttons
  (approve / reject / needs-fix), extraction warnings, proof-hearing
  checklist, expandable raw source view.
- On approve, the "copy promoted JSON" button places the cleaned `Pattern`
  (no `_draft` block) on the clipboard.

## Promoting approved drafts

The v1 pipeline is deliberately clipboard-based to avoid a dev server:

1. In the sandbox, click **✓ approve** on a draft that plays correctly.
2. Click **copy promoted JSON**.
3. Open `app/src/patterns/seed/<region>.ts` and paste the object into the
   exported array. Preserve the existing ordering conventions (grouping
   by subregion / difficulty where visible).
4. Run `bunx tsc -b` to confirm types, then `bun run build` to confirm the
   app still compiles.
5. Optionally delete the draft file from `patterns-drafts/<region>/` once
   it's successfully promoted — keeps the sandbox uncluttered.

## Rejecting drafts

Mark `✗ reject` in the sandbox for a session-only hide. The draft JSON
stays on disk; delete it manually (or rename to `.rejected.json`) if you
want it permanently out of the sandbox's glob.

## Proof-hearing checklist (per draft, before approving)

- Kick (`KK`) falls on the canonical downbeats of the pattern's grouping.
- Tempo at `bpm.default` feels natural for the tradition.
- Meter matches `timeSig` when counted against the beat dots.
- `defaultKit` produces a culturally-coherent sound (frame drum for
  Turkish, tabla for Indian, gamelan for Javanese, etc.).

## Why this is structured this way

- **Solo developer, no backend** — spec constraint. No server endpoint to
  write files; clipboard + manual paste is the simplest thing that works.
- **PR-friendly** — each draft is a small JSON, and each promoted seed
  pattern is a clean addition to a per-region TS file. Good diffs.
- **Reversible** — drafts never touch `src/patterns/seed/` until the
  operator pastes them. Extraction can be re-run without data loss.
