# BeatForge — Voice & Vocabulary

> **TL;DR** — Brand voice + product vocabulary in one tight field guide. Personality (playful, direct, no jargon), forbidden words, tone examples for empty states + errors + onboarding. Lock this before adding any surface text.
> **Audience:** anyone writing copy, error messages, onboarding strings, or doc text.
> **Length:** ~180 lines · ~3 min read.
> **Best for:** the personality definition, the don't-say-X / do-say-Y tables, the tone-example pairs.

A short field guide so the copy across Practice / Studio / Library
sounds like one app made by one person. Lock this before adding any
new surface text.

## Personality

A friend who loves rhythms and loves you for being curious. Specific,
warm, never grandiose. Bourdain in spirit: takes the listener
seriously, doesn't over-explain, ends scenes early.

The brand-anchor sentence:

> A groovebox for Balkan weddings — using our design language.

Playful and complex underneath, magnetic on top. Inspired by Angine
de Poitrine: eye-catching but never costume-y, microtonal-but-
danceable. We never hide our weirdness; we make the weirdness fun to
walk into.

## Forbidden words

These flatten everything we are.

- `museum`, `archive of`, `preservation`, `authentic` — we are alive,
  not curated.
- `master`, `expert mode`, `pro`, `professional` — we welcome, we
  don't gatekeep.
- `cultural appropriation`, `respectfully borrowed`, `inspired by` —
  if we're playing it, name it. If we don't know, ask the player.
- `simply`, `just`, `obviously`, `easy` — they signal that the
  reader's confusion is their fault.
- `ethnic`, `exotic`, `world music` (as a flat label) — the world
  isn't a genre.
- `unleash`, `unlock`, `level up`, `pro tips`, `cheat sheet`, `hack` —
  game-ified self-help. Not us.
- `users` (in user-visible strings) — they're players, learners,
  drummers. "User" is for engineering only.

## Preferred words

| Don't | Do |
|---|---|
| kit | ensemble |
| user | player / drummer / learner |
| beat (count) | step |
| sample | voice |
| pattern library | rhythm library / the library |
| world music | a region / a tradition / a family |
| lesson | walkthrough |
| advanced | deeper |
| complete the level | finish the bar |
| settings | feel / shape |
| custom | yours |
| AI suggestion | a similar one |

## Naming voices

Drum-machine archetype names ("808", "FM", "Modal", "Phase distort")
are engineering. The UI shows what it sounds like:

| Internal id | Label | Why |
|---|---|---|
| `kick` | Kick | self-explanatory |
| `snare` | Snare | self-explanatory |
| `hat` | Hat | "Hi-hat" reads dated |
| `tom` | Tom | unambiguous |
| `clap` | Clap | unambiguous |
| `cowbell` | Cowbell | unambiguous |
| `modal` | Bell | partials → bell-class textures |
| `fm` | Pluck | what FM with a short decay sounds like |
| `noise` | Shaker | what filtered noise mostly is |
| `wavefolder` | Growl | low-end with sand |
| `crackle` | Crackle | unambiguous |
| `chip` | Arcade | self-explanatory once you hear it |
| `formant` | Vowel | aaa / eee / ooo |
| `phase-distort` | Buzz | aggressive cycle, bright edge |

`id` is permanent (saved patterns reference it); `label` is for the
player and can evolve.

## Preset names

World-voice presets piggy-back on the existing synthesis recipes
(no new DSP). Names are concrete and place-of-origin / instrument-
named, not generic:

- Kick: `808`, `909`, `707`, `sub`, `punch`, `doum`, `surdo`,
  `bayan`, `acoustic`
- Snare: `808`, `909`, `707`, `rim`, `brush`, `tek`, `dayan`,
  `caixa`, `frame`
- Hat: `closed`, `open`, `pedal`, `ride`, `shaker`, `sizzle`,
  `riq`, `caxixi`, `maraca`
- Tom: `low`, `mid`, `high`, `bongo`, `octban`, `conga`, `djembe`,
  `talking`
- Clap: `808`, `finger`, `slap`, `hands`, `palmas`, `body`
- Cowbell: `727`, `clave`, `agogo`, `woodblock`, `rim`
- Bell (modal): `bell`, `frame`, `bayan`, `gong`, `tank`, `pot`,
  `log`, `bowl`, `tabla`, `kalimba`, `hangdrum`, `daf`
- Pluck (fm): `kalimba`, `marimba`, `glock`, `bell`, `ep`, `metal`,
  `blip`, `mbira`, `saz`, `oud`, `music_box`, `sitar`

When a preset name has a tradition behind it (doum, surdo, riq,
caxixi…), the Library can link the ensemble to a story; that's the
"living archive" connection. We never claim it's an exact recreation
— it's a voicing close enough to play with.

## Surface-by-surface

### Practice

Voice = a calm coach. Short. Action verbs.

- "Tap to start" not "Click here to begin"
- "Slow it down" not "Reduce tempo"
- "Try again from the top" not "Reset and replay"

Failure is never failure. "Let's slow this part down" not "Wrong
beat".

### Studio

Voice = a maker's bench. Curious. Specific to the gesture.

- "swap voice" not "change instrument"
- "color FX" not "channel insert"
- "lay it down" not "render audio"

### Library

Voice = a friend who's been there. Place-first, story-second,
spec-third.

Pattern card structure:

```
{Name}                              {time signature}
{One line about where it lives}     {grouping}
{One line about what to listen for}
```

Example:

```
Karşılama                           9/8 (2+2+2+3)
Wedding line dance, Thrace          ●●○●○●○●○
The 3 at the end is the clap that lands the line.
```

Never "an authentic Greek folk rhythm". Always who plays it now and
what to listen for.

## Punctuation & micro-rules

- Lowercase tags & section labels: `pattern`, `ensemble`, `feel`,
  `master`. Title-case headings only.
- Em-dashes, not parentheses, for asides.
- No exclamation points except for celebrations (preset saved, level
  complete, BPM milestone). Never for instructions.
- "We" is the team. "You" is the player. Never "user".
- Numbers up to nine in prose ("eight bars"), digits in UI chips
  ("8 bars").
- Time-sig grouping uses `+` not commas: `2+2+2+3`, not `2, 2, 2, 3`.

## Tone tests

If a string passes all three, it ships:

1. **The bar test** — could a friend say it to you over a drink
   without sounding weird?
2. **The grandma test** — would someone with no production
   background know what to do?
3. **The wedding test** — would it embarrass us at a Balkan
   wedding? (i.e., is it cringingly precious about the music?)

If any test fails, rewrite.
