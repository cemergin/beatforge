# Process archive

Historical artifacts: design reviews, manifestos, engineering audits, superseded plans, and the original product spec. These are kept for **reasoning**, not for "what's shipping today."

If you're trying to understand *why* a particular decision was made, this is the right folder. If you want to know what BeatForge currently does, see [`../spec/`](../spec/) and [`../architecture/`](../architecture/) instead.

## What's in here

### [`design-reviews/`](design-reviews/)
A 2026-04-27 design audit run as seven independent reviews from different lenses, plus a synthesis that maps each review's prescription to a product surface. **Genuinely useful reading for understanding how the shipped product got the way it is.**

| File | Lens |
|---|---|
| [`brief.md`](design-reviews/brief.md) | Orientation — start here if you want context for the others |
| [`synthesis.md`](design-reviews/synthesis.md) | The arbiter that maps lenses to surfaces — the canonical decision document |
| [`claude.md`](design-reviews/claude.md) | Implementation-aware "close to the code" review |
| [`senior-designer.md`](design-reviews/senior-designer.md) | 10+ years music-tech design perspective |
| [`toy-maker.md`](design-reviews/toy-maker.md) | Loog / Pocket Operator / Tenori-On lens — joy + learnability |
| [`drum-machine-designer.md`](design-reviews/drum-machine-designer.md) | Roland / Elektron / Volca / Polyend lineage — performance affordances |
| [`ethnomusicology-curator.md`](design-reviews/ethnomusicology-curator.md) | Museum / Folkways / MIM curatorial lens — naming, provenance, ensemble roles |
| [`percussion-player.md`](design-reviews/percussion-player.md) | Daily-practitioner perspective — the click-vs-groove distinction |
| [`living-archive-agent.md`](design-reviews/living-archive-agent.md) | Brian Eno / scenius / recombinator lens — "cousin-finder, not museum" |

### [`manifestos/`](manifestos/)
- [`living-archive.md`](manifestos/living-archive.md) — the cultural positioning argument that shaped how BeatForge presents world rhythms (lineage: Brian Eno, Talking Heads, Madlib, J Dilla, Vampire Weekend, Os Mutantes, Khaled, Bourdain, Atlas Obscura)
- [`voice-style-guide.md`](manifestos/voice-style-guide.md) — copy + tone guide for product strings, error messages, onboarding

### [`engineering-audits/`](engineering-audits/)
Sequential code-audit passes, each a snapshot of issues found and prioritized.
- [`pass-1.md`](engineering-audits/pass-1.md) — first pass, 2026-04-24: PWA dedup, redundant engine loads, style-state mutation
- [`pass-2.md`](engineering-audits/pass-2.md) — after P1–P4 fixes: pre-commit hook, engine state paths, eslint cleanup
- [`pass-3.md`](engineering-audits/pass-3.md) — synth recipe drift on 808/909/707 machines
- [`pass-4.md`](engineering-audits/pass-4.md) — PWM chip voice, scheduler tick precision
- [`notes-2026-04-28.md`](engineering-audits/notes-2026-04-28.md) — recent hot issues (silent failures, WAI-ARIA, canvas repaint, metro-grid sync)

### [`plans/`](plans/)
Plans that either shipped, deferred, or were superseded.
- [`sound-page.md`](plans/sound-page.md) — "drum synth lab inside metronome." Now split into a separate v2 project.
- [`modular-platform.md`](plans/modular-platform.md) — vision for v2+: one instrument with multiple lenses, shared engine, module algebra
- [`i18n.md`](plans/i18n.md) — internationalization plan (EN/TR/ES first; PT-BR/AR/FA deferred). Not started.
- [`work-plan.md`](plans/work-plan.md) — 2026-04-24 tightening pass: CSS tokens, engine cleanup, hook extraction, lazy chunks, testing

### [`historical/`](historical/)
- [`product-design-2026-03.md`](historical/product-design-2026-03.md) — the original March 12 spec (SvelteKit, Tone.js, 650 patterns, full drum machine). Superseded by [`../spec/metronome.md`](../spec/metronome.md) for tech + scope, but kept for the personality + framing material ("Friendly Playground" theme, etc.).
- [`design-brainstorm-notes.md`](historical/design-brainstorm-notes.md) — earlier brainstorming notes
