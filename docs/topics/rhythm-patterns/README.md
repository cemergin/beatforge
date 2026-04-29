# Rhythm patterns

600+ notated patterns across 20 region/genre files. Step-sequencer grid format — instruments on the rows, time on the columns, each cell is a hit (or rest).

**Audience:** producers, drummers, music-software developers. You can read these and *play them* on any drum machine, sequencer, or kit.

These are the **notated** counterparts to the cultural docs in [`../rhythm-traditions/`](../rhythm-traditions/). Open both side-by-side: the tradition file tells you why; the pattern file tells you what to play.

## Index by region

### Africa
- [`african-ensembles.md`](african-ensembles.md) — **2,500 lines, 30+ ensembles.** Ewe (Agbekor, Gahu, Kpanlogo, Bobobo, Atsiagbekor, Gadzo, Tokoe), Mande/djembe (Kuku, Soli, Dununba, Tiriba, Yankadi, Makru, Djansa, Sunu), Yoruba (Bata/Shango, Dùndún), Senegalese (Sabar). Full ensemble notation: bell, shaker, multiple drums, with kit adaptations.
- [`modern-african.md`](modern-african.md) — Afrobeat, Afrobeats, Amapiano, Highlife, Soukous loops
- [`north-east-african.md`](north-east-african.md) — Ethiopian (chiqchiqa), Sudanese, Eritrean patterns

### Turkish, Arabic + Indian
- [`turkish-arabic-indian.md`](turkish-arabic-indian.md) — **~70 patterns.** Turkish (Düyek, Çiftetelli, Karşılama, Roman Havası, Kasap, Aksak, Longa, Sofyan, Türk Aksağı, Yürük Semai, Halay, Zeybek, Horon, Curcuna), Arabic (Maqsoum, Baladi, Saidi, Masmoudi, Fallahi, Zaffa, Shaabi, Ayoub, Malfuf, Wahda, Dabke), Indian (Tintal, Dadra, Keherwa, Rupak, Jhaptal, Ektaal)
- [`south-asian-expanded.md`](south-asian-expanded.md) — More Hindustani + Carnatic talas, regional folk drumming, Bollywood production patterns

### Latin + Caribbean
- [`latin-caribbean.md`](latin-caribbean.md) — Cuban (son clave, rumba clave, tresillo, cascara, bembe bell, Mozambique, songo, full salsa ensemble), Puerto Rican, Dominican, Brazilian, Colombian, Venezuelan
- [`world-cross-cultural.md`](world-cross-cultural.md) — Cross-Atlantic patterns: West African bell patterns and how they show up in Caribbean + Brazilian music

### Asia
- [`gamelan-southeast-asian.md`](gamelan-southeast-asian.md) — **2,100 lines.** Javanese gamelan (lancaran, ketawang, ladrang, merong/gendhing, srepegan, sampak, ayak-ayakan), Balinese kotekan interlocking, kendang patterns
- [`central-asian-pacific.md`](central-asian-pacific.md) — Uzbek, Kazakh, Mongolian, Pacific patterns

### Mediterranean + Europe
- [`caucasus-mediterranean.md`](caucasus-mediterranean.md) — Armenian, Georgian, Azerbaijani, southern Italian, Maltese
- [`celtic-european.md`](celtic-european.md) — Irish jigs (6/8) and reels (4/4), hornpipes, Scottish strathspeys, Breton, Galician
- [`iberian-flamenco.md`](iberian-flamenco.md) — Flamenco compás for soleá (12), bulería (12), alegrías (12), tangos (4), tientos, fandango, sevillanas

### Western popular
- [`western-genres.md`](western-genres.md) — **2,900 lines, 211 patterns.** Rock, pop, blues, country, reggae, ska, punk, metal, funk, jazz, R&B, gospel, prog rock, disco, fusion, Afrobeat, math rock, djent, J Dilla, house, techno, DnB, hip-hop, UK garage, dubstep, Afrobeats, Amapiano, reggaeton, breakbeats. Plus fills, build-ups, breakdowns.

### Electronic
- [`electronic-history.md`](electronic-history.md) — Synth-pop (Depeche Mode, New Order, Gary Numan), EBM/industrial (DAF, NIN, Skinny Puppy), Italo, Hi-NRG, deep + garage + French + minimal house, microhouse, ambient house, trip-hop, prog/psy trance, gabber, motorik, Berlin School, melodic techno, organic/Afro house, neo-rave, lo-fi house, electro, Eurodance, EDM, Balearic, Berghain
- [`global-electronic.md`](global-electronic.md) — Amapiano, gqom, baile funk, kuduro, dembow, drill (UK + Brooklyn + Chicago), shatta
- [`underground-electronic.md`](underground-electronic.md) — Footwork (160 BPM Chicago), jungle (170 BPM Amen breaks), DnB, hardcore breakbeat, IDM, Detroit techno deep cuts
- [`internet-born.md`](internet-born.md) — Vaporwave, hyperpop, lo-fi hip-hop, slowed+reverb, plugg, jersey/Philly club

### Cross-cultural reference
- [`global-traditions.md`](global-traditions.md) — A cross-tradition pattern compendium for educators

## How patterns are notated

Each pattern is a grid:
```
            1  e  &  a  2  e  &  a  3  e  &  a  4  e  &  a
Bell        x  .  x  .  x  x  .  x  .  x  x  .  x  .  x  .
Snare       .  .  .  .  x  .  .  .  .  .  .  .  x  .  .  .
Kick        x  .  .  .  .  .  .  .  x  .  .  .  .  .  .  .
```

Conventions:
- `x` = hit, `.` = rest, `o` = ghost note, capital letters for accents
- Time signature noted at the top of every pattern
- Tempo (BPM) given as a range (slow / typical / fast)

## In BeatForge

The **536 shipped patterns** in [`app/src/patterns/seed/`](../../../app/src/patterns/seed/) are JSON adaptations of patterns from these files, simplified to the 5-voice (KK / SN / HH / OH / CP) palette and validated against a schema test. The mapping is many-to-one: each shipped pattern picks one canonical interpretation from these references.

## Related

- For the **cultural backstory** of any tradition → [`../rhythm-traditions/`](../rhythm-traditions/)
- For **the engine that plays them** → [`../rhythm-engine/`](../rhythm-engine/)
- To **add or fix a pattern in BeatForge** → [`../../../CONTRIBUTING.md#1-pattern-contributions`](../../../CONTRIBUTING.md)
