# BeatForge i18n Plan

**Status:** Plan only — no code changes yet.
**Scope:** Multi-language UI (EN / TR / ES to start), with a path to more.

---

## Goals

1. App UI (buttons, panel headers, status text, settings) renders in the user's chosen language.
2. Cultural content (pattern stories, region intros, starter-path prose) can be translated authentically — not machine-translated, not required before launch.
3. Language is switchable at runtime from the header, persisted per-device, and propagated through routing-neutral state.
4. Bundle impact under 30 KB gzipped for all three locales combined. No network fetch at runtime — all locales precached by the PWA.
5. Additive — unlocalized strings fall back to English, so the app always works even if translations are partial.

## What we're explicitly NOT doing

- Not translating pattern *names* (Karşılama, Bulería, Konnakol Ta-Ka-Di-Mi). These are proper nouns in their own tradition.
- Not translating *region IDs* or tag keys (internal enums). User-visible region labels (from `regions.ts`) get translated.
- Not RTL support in v1. Arabic/Persian are on the roadmap but need a separate layout pass.
- Not machine-translating pattern stories. English baseline ships; translated stories land as people contribute them.

---

## Language scope

| Locale | Priority | Contributors | Rollout |
|---|---|---|---|
| English (`en`) | Required | default — all strings authored in English first | v1 (ships now) |
| Turkish (`tr`) | Launch | founder native speaker; high-value because the app ships with strong Turkish/Ottoman content | v1 |
| Spanish (`es`) | Launch | large-audience payoff; Afro-Cuban / Flamenco content resonates | v1 |
| Portuguese (`pt-BR`) | Post-launch | Brazilian content could justify | v1.1 |
| Arabic (`ar`) | Deferred | needs RTL + layout work | v1.2+ |
| Persian (`fa`) | Deferred | needs RTL | v1.2+ |
| Hindi (`hi`) | Deferred | large audience, 10+ Indian patterns | v1.2+ |

---

## Technical approach

### Library choice: none (hand-rolled)

Considered and rejected:

- **i18next / react-i18next** — industry standard, but ~20 KB gz + plugin ecosystem is overkill for a UI with ~200 strings, no pluralization-heavy content, no dynamic loading requirements beyond one locale at a time.
- **LinguiJS** — modern, tree-shakeable, but requires a compile step and `@lingui/core` runtime. Similar bundle size.
- **FormatJS** — mature, larger surface, overkill.
- **Hand-rolled** — ~80 LOC of context + hook + JSON files. Zero deps, 3 × ~4 KB gz per locale. **Chosen.**

### Shape

```
app/src/i18n/
├── index.ts              # useT() hook, LanguageProvider, detect+persist language
├── locales/
│   ├── en.json           # source of truth — all keys
│   ├── tr.json           # partial OK, falls back to en
│   └── es.json           # partial OK, falls back to en
└── keys.ts               # typed Key union — add via t('k.nav.practice') style
```

### Key naming convention

Namespace keys by zone, not by component, so moving UI between files doesn't invalidate translations.

```
nav.practice                  "Practice" / "Pratik" / "Práctica"
nav.studio                    "Studio" / "Stüdyo" / "Estudio"
nav.library                   "Library" / "Kütüphane" / "Biblioteca"

practice.bpm.label            "BPM · step/min" / "BPM · adım/dk" / "BPM · paso/min"
practice.play                 "play" / "çal" / "tocar"
practice.stop                 "stop" / "durdur" / "parar"
practice.trainer.title        "speed trainer" / "hız antrenmanı" / "entrenador de tempo"
practice.trainer.bars         "every N bars" / "her N ölçü" / "cada N compases"
practice.count_in             "count-in" / "giriş sayımı" / "cuenta previa"
practice.stop_after           "stop after" / "şundan sonra dur" / "detener tras"

studio.save_as                "save as…" / "farklı kaydet…" / "guardar como…"
studio.voices                 "voices" / "sesler" / "voces"
studio.subdivisions           "subdivisions" / "alt bölümler" / "subdivisiones"

library.search_placeholder    "search rhythms, regions, stories…"
library.zones.highlights      "Highlights" / "Öne Çıkanlar" / "Destacados"
library.zones.recent          "Recent" / "Son" / "Reciente"
library.zones.world_map       "World Map" / "Dünya Haritası" / "Mapa Mundial"
library.zones.starter_paths   "Starter Paths" / "Başlangıç Yolları" / "Caminos iniciales"

meta.difficulty.beginner      "beginner" / "başlangıç" / "principiante"
meta.difficulty.intermediate  "intermediate" / "orta" / "intermedio"
meta.difficulty.advanced      "advanced" / "ileri" / "avanzado"

kit.808                       "808"     (untranslated — brand)
kit.909                       "909"
kit.707                       "707"
kit.727                       "727"
kit.frame                     "frame"   / "çerçeve" / "marco"
kit.tabla                     "tabla"   (untranslated — cultural specificity)
kit.gamelan                   "gamelan" (untranslated)
```

### API shape

```tsx
import { useT } from './i18n';

function PlayButton() {
  const t = useT();
  return <button>{t('practice.play')}</button>;
}

// With interpolation:
<span>{t('practice.trainer.remaining', { n: cyclesLeft })}</span>
// en.json: "trainer.remaining": "{n} cycles remaining"
// tr.json: "trainer.remaining": "{n} ölçü kaldı"
```

### Language detection + persistence

1. On first load: check `localStorage.bf_lang`. If set, use it.
2. Otherwise: `navigator.language.slice(0, 2)` matched against supported locales. Default to `en`.
3. When user changes language via header dropdown: write to `bf_lang`, re-render.
4. SSR/PWA consideration: initial HTML needs `<html lang=…>` set before React mounts. Inline script in `index.html` reads localStorage and sets the attribute before paint, mirroring the existing theme-color bootstrap.

### Content translation — pattern stories & region intros

Stories are the hard part. Machine-translation mangles cultural nuance ("the archetypal Ottoman asymmetric" translated to Turkish by a generic model loses all the poetry). Approach:

1. **English baseline ships now** — all 294 stories + 16 region intros already in English.
2. **Translation is a separate contribution workflow** — not a blocker for i18n shipping.
3. **Per-pattern/region translated fields** live in the JSON pattern data, keyed by locale:

   ```ts
   interface Pattern {
     story?: string;                               // English (default, always present)
     story_i18n?: Partial<Record<LocaleCode, string>>;  // optional overrides
   }
   ```

4. Renderer: `const text = pattern.story_i18n?.[lang] ?? pattern.story;`
5. Contributions: GitHub PR adds `story_i18n.tr` for a pattern, reviewer (native speaker) approves. No translation tool.
6. Encourage scope-limited contributions ("translate Turkish patterns' stories into Turkish first") rather than "translate everything."

### Bundle strategy

- All three locale JSONs bundled with the main chunk — PWA precaches them.
- Locale JSON is stripped to only keys that differ from `en` (falls back to `en` otherwise) — reduces duplicated English in tr.json and es.json.
- Budget check: ~200 keys × avg ~25 chars × 3 locales ≈ 15 KB raw ≈ 5 KB gzipped.

---

## Implementation plan

### Phase 1 — Plumbing (2–4 hours)
1. Write `app/src/i18n/` module (provider, hook, file loader)
2. Create `en.json` from current hardcoded strings (AST-extract pass across `modes/`)
3. Add language selector to header (between theme swatches and nav)
4. Wire `localStorage.bf_lang` + `<html lang>` bootstrap
5. Typecheck key union; fail build on missing keys

### Phase 2 — English baseline (1 hour)
1. Replace every hardcoded string with `t('key')` call
2. Commit with `en.json` complete — app still monolingual but infra-ready

### Phase 3 — Turkish (1–2 hours, with you)
1. You translate `tr.json` directly (founder is native speaker)
2. Per-region stories: `story_i18n.tr` added to any Turkish-origin patterns (Karşılama, Horon, etc.) as a bonus
3. Ship with Turkish available

### Phase 4 — Spanish (async, contributor-dependent)
1. `es.json` gets filled in over time
2. Partial translations supported — empty keys fall back to English transparently

### Phase 5 — RTL groundwork (later)
1. Scope only once a native Arabic/Persian speaker signs up
2. Audit CSS for logical-property migration (margin-inline-start etc.)
3. Separate project; do NOT shoehorn into i18n

---

## Success criteria

- Language switcher in header; no-refresh language change
- Zero English strings visible when Turkish is active for v1 scope (UI only; stories may be English with a badge "translation needed")
- Bundle impact ≤ 30 KB gz for infra + 3 locales
- Missing keys fall back to English with a dev-mode warning
- Adding a 4th language is a single JSON file + `keys.ts` enum entry

## Risks + mitigations

- **Translation rot:** strings change in English, translations fall behind → build-time check that flags English keys missing in `tr`/`es`.
- **Pluralization:** Turkish + Spanish have non-trivial plurals → use ICU MessageFormat if we hit this; for now `{n} bar(s)` style is acceptable.
- **Pattern stories machine-translated by a well-meaning contributor:** review bar enforced — PR template includes "I am a native speaker / I verified with a native speaker."
- **RTL bleed:** deferred explicitly. Don't mix RTL work with this phase.

---

## Decision points to resolve before implementation starts

- [ ] Language selector UX: dropdown vs flag buttons vs system-language-only toggle?
- [ ] Do we ship v1 with Turkish-only translation filled in, or hold for Spanish too?
- [ ] Are pattern stories translatable (schema addition) or English-only for now?
- [ ] URL-based language (`/tr/practice`) or state-only? (Recommend state-only — no routing rewrite.)

Leave open for a brainstorming pass when you're ready to start Phase 1.
