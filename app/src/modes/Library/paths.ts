// Curated starter paths. Each path lists pattern IDs in a reading order;
// Library runtime drops any ID that's not in the seed so the build stays
// green if a pattern ever gets renamed.
//
// These paths are designed to surface *connections* you wouldn't otherwise
// see: the same rhythmic DNA across continents, a genre's family tree,
// a meter's siblings. Clicking a path opens it inline in the Library
// (see Library.tsx).

export interface StarterPath {
  id: string;
  title: string;
  subtitle: string;
  context: string;
  patternIds: string[];
}

export const STARTER_PATHS: StarterPath[] = [
  // ── Foundations ────────────────────────────────────────────────────
  {
    id: 'beginners-world-tour',
    title: "Beginner's World Tour",
    subtitle: 'One friendly rhythm from ten traditions',
    context:
      'A gentle loop around the globe. Each stop is a beginner-friendly entry into a tradition — feel it once, then branch out to the region that speaks loudest.',
    patternIds: [
      'son-clave', 'maqsoum', 'keherwa', 'fanga', 'baiao',
      'reggaeton-dembow', 'tangos-flamenco', 'irish-reel',
      'duyek', 'boom-bap',
    ],
  },
  {
    id: 'meet-the-meters',
    title: 'Meet the Meters',
    subtitle: 'Ten time signatures, one at a time',
    context:
      "4/4 is one meter among many. Each pattern here lives in a different time — 2/4, 3/4, 4/4, 5/8, 6/8, 7/8, 8/8, 9/8, 11/8, 12/8 — so you can feel what 'odd' actually means.",
    patternIds: [
      'son-clave', 'jig', 'turk-aksagi', 'bembe', 'horon',
      'duyek', 'karsilama', 'kopanitsa', 'samba-enredo',
      'curcuna',
    ],
  },

  // ── Regional 101 paths ────────────────────────────────────────────
  {
    id: 'turkish-usul-101',
    title: 'Turkish Usul 101',
    subtitle: 'Five steps through Ottoman time',
    context:
      'Ottoman classical and folk traditions organize time into usul — asymmetric cycles named for their shape. Düyek is even ground; Türk Aksağı limps in 5; Karşılama skips in 9/8 (2+2+2+3); Curcuna doubles that skip into 10. Zeybek is the heaviest — a warrior\'s walk.',
    patternIds: ['duyek', 'turk-aksagi', 'karsilama', 'curcuna', 'zeybek'],
  },
  {
    id: 'indian-tal-basics',
    title: 'Indian Tal Basics',
    subtitle: 'Five tals that map the Hindustani core',
    context:
      'Hindustani music organises time into tal — cycles of beats with internal accent structure (tali = clap, khali = wave). These five cover 6, 7, 8, 10, and 16 beats: the repertoire base for classical tabla study.',
    patternIds: ['keherwa', 'dadra', 'rupak', 'jhaptal', 'tintal'],
  },
  {
    id: 'afro-cuban-foundations',
    title: 'Afro-Cuban Foundations',
    subtitle: 'Cáscara, clave, rumba, bembé',
    context:
      'The spine of Cuban dance music. Cáscara drives the timbales, clave sets the law, mambo and guaguancó fill out the son montuno ensemble, and bembé reaches back through the 12/8 Yoruba bell to West Africa itself.',
    patternIds: ['cascara', 'son-clave', 'mambo', 'guaguanco', 'bembe'],
  },
  {
    id: 'balkan-asymmetrics',
    title: 'Balkan Asymmetrics',
    subtitle: 'From 7/8 up to 11/8 stomping',
    context:
      "The Balkan playground — aksak (\"limping\") meters inherited from five centuries of Ottoman contact, sharpened into dance. Ruchenitsa skips in 7, Daichovo and Karşılama share a 9/8 skeleton from opposite sides of the old empire, Kopanitsa pushes to 11.",
    patternIds: ['ruchenitsa', 'daichovo', 'karsilama', 'kopanitsa', 'lesnoto'],
  },
  {
    id: 'west-african-ensembles',
    title: 'West African Ensembles',
    subtitle: 'Mande djembe and Ewe bell traditions',
    context:
      'Two great percussion lineages. Kuku and Soli are Mande djembe repertoire from Guinea/Mali. Agbekor is the Ewe war dance from Ghana-Togo. Bembé (the 12/8 bell) binds them — the "standard pattern" that migrated through the Atlantic slave trade into Cuba, Brazil, and Andalusia.',
    patternIds: ['djembe-standard', 'kuku', 'soli', 'agbekor', 'bembe-68'],
  },

  // ── Cross-cultural DNA paths (new) ────────────────────────────────
  {
    id: 'clave-universe',
    title: 'Clave Universe',
    subtitle: 'The 5-stroke cell across the Afro-Atlantic',
    context:
      'Son clave is a 3+2 framework that spread from Cuba across the hemisphere. Hear it in son, rumba, bolero, guaguancó, bembé — and its diaspora cousins in Brazilian samba, Puerto Rican bomba, and African-ancestor 12/8 bells.',
    patternIds: [
      'son-clave', 'rumba-clave-3-2', 'bolero', 'guaguanco',
      'bembe', 'samba-partido-alto', 'bomba-sica',
    ],
  },
  {
    id: 'aksak-family',
    title: 'The Aksak Family',
    subtitle: '2+2+2+3 around the silk road',
    context:
      "The 9/8 aksak limp — Turkish for \"limping\" — isn't Turkish alone. It travels from Thrace (Karşılama) east through Bulgaria (Daichovo), across the Aegean (Zeibekiko), and all the way into Xinjiang via the Uyghur Muqam tradition. Different languages, one pulse.",
    patternIds: [
      'karsilama', 'daichovo', 'roman-havasi', 'zeibekiko',
      'uyghur-muqam-78', 'aksak',
    ],
  },
  {
    id: '12-8-bell-circuit',
    title: 'The 12/8 Bell Circuit',
    subtitle: 'West Africa → Cuba → Puerto Rico → Andalusia',
    context:
      'One of the deepest musical migrations on record. The West African 12/8 bell pattern (Agbekor, Bembé 6/8) crosses the Atlantic into Cuban bembé ceremonies, Puerto Rican bomba holandé, Bahian ijexá — and, via Morisco and Romani routes, finds its way into the 12-beat compás of flamenco bulería.',
    patternIds: [
      'agbekor', 'bembe-68', 'bembe', 'rumba-columbia',
      'bomba-holande', 'ijexa', 'buleria',
    ],
  },
  {
    id: 'swana-maqsoum-trail',
    title: 'The Maqsoum Trail',
    subtitle: 'From Cairo street bands to mahraganat',
    context:
      'Maqsoum is the most ubiquitous SWANA rhythm — doum-tek-tek-doum-tek in 4/4. Hear it carried through Egyptian shaabi, Gulf wedding music, North African raï, Zanzibari taarab, and finally through Cairo drum machines as mahraganat, the soundtrack of the 2011 revolution.',
    patternIds: [
      'maqsoum', 'baladi', 'saidi', 'shaabi-egyptian',
      'rai-electric', 'taarab', 'mahraganat',
    ],
  },
  {
    id: 'afrobeat-lineage',
    title: 'Afrobeat → Afrobeats',
    subtitle: 'Tony Allen to Amapiano via Highlife',
    context:
      "Tony Allen's Afrobeat (with Fela) in 1970s Lagos was already a synthesis of Yoruba percussion, jazz, and funk. Highlife is its cousin across Ghana and eastern Nigeria. Modern Afrobeats (with the 's') is the grandchild that took over global pop in the 2010s. Amapiano is the South African branch that replaced the drummer with the log drum.",
    patternIds: [
      'afrobeat-tony-allen', 'highlife-ghana', 'highlife-nigeria',
      'juju', 'afrobeats-modern', 'amapiano-groove', 'azonto',
    ],
  },
  {
    id: 'trance-grooves',
    title: 'Trance Grooves',
    subtitle: 'Sufi, Gnawa, Bandari, Qawwali',
    context:
      'A transcultural trance circuit. Gnawa and Stambali carry sub-Saharan spiritual music across the Sahara into Morocco and Tunisia. Sufi dhikr spirals on a single pulse across the Muslim world. Bandari — the music of Iran\'s Gulf coast — mirrors all of it through Indian Ocean slave-trade routes. Qawwali accelerates the idea in South Asia.',
    patternIds: [
      'gnawa-lila', 'gnawa-banga', 'stambali', 'bandari',
      'qawwali', 'sufi-dhikr-sudan', 'daf-zikr', 'dhamaal-sufi',
    ],
  },

  // ── Modern / electronic paths ─────────────────────────────────────
  {
    id: 'drill-family',
    title: 'Drill Family Tree',
    subtitle: 'Chicago → New York → London → Jersey',
    context:
      'Drill started with sliding 808 sub-bass and triplet hi-hats in Chicago\'s South Side (2012). Brooklyn MCs picked it up around 2018 — harder kicks, darker melodies. UK drill pushed the tempo lower and the hats busier. Jersey club contributes the bed-squeak kick pattern to the family.',
    patternIds: [
      'chicago-drill', 'ny-drill', 'uk-drill', 'jersey-club',
      'footwork-juke',
    ],
  },
  {
    id: 'phonk-lineage',
    title: 'Phonk Lineage',
    subtitle: 'Memphis tapes to TikTok drift',
    context:
      'Phonk began as lo-fi Memphis rap cassettes in the 1990s — cowbell, chopped vocals, gritty 808s. It resurfaced online in the late 2010s, got the "drift" association through Russian-produced YouTube edits, then exploded on TikTok. Brazilian and fish (hyper-drift) variants followed.',
    patternIds: [
      'hiphop-phonk', 'phonk-drift', 'phonk-brazilian', 'phonk-fish',
    ],
  },
  {
    id: 'internet-born',
    title: 'Internet-Born Genres',
    subtitle: 'Vaporwave, lo-fi, hyperpop',
    context:
      "Genres that couldn't exist without bedroom producers and streaming. Vaporwave stretched 80s corporate muzak into something haunted. Lo-fi hip-hop turned J Dilla's swung timing into study music. Hyperpop crashed trap, ska, happy-hardcore and nightcore together. Future funk danced on vaporwave's grave.",
    patternIds: [
      'vaporwave', 'future-funk', 'lofi-hiphop-standard',
      'nightcore', 'hyperpop',
    ],
  },

  // ── Microtiming / feel ─────────────────────────────────────────────
  {
    id: 'the-swing-spectrum',
    title: 'The Swing Spectrum',
    subtitle: 'Straight → shuffled → fully swung, across traditions',
    context:
      "Swing isn't a jazz thing — it's a microtiming dimension every tradition tunes differently. The strokes on the page can be identical; where they actually land is the culture. Start straight with Detroit techno, walk the dial up through Cuban son, funk, and Dilla-style lag, then cross into explicit triplet territory: rockabilly shuffle, blues shuffle, Purdie half-time, and full jazz swing. The last four are 12/8 patterns — the triplet isn't a swing setting, it's baked into the grid.",
    patternIds: [
      'techno-detroit',       // 0.50 — straight reference
      'son-clave',            // 0.52 — Cuban behind-the-beat
      'funk-funky-drummer',   // 0.55 — the Clyde Stubblefield push
      'lofi-hiphop-standard', // 0.58 — J Dilla lag
      'shuffle-rock',         // 12/8 pulse — rockabilly
      'blues-shuffle',        // 12/8 ding-a ride — electric blues
      'half-time-shuffle',    // 12/8 half-time — Purdie / Porcaro
      'jazz-swing-medium',    // 4/4 at 0.67 — full triplet, jazz comping
    ],
  },

  // ── Polyrhythm + rhythmic technique ───────────────────────────────
  {
    id: 'polyrhythm-progression',
    title: 'Polyrhythm Progression',
    subtitle: '3:2 up to 7:4, one step at a time',
    context:
      "Five pure polyrhythm exercises at increasing difficulty. Hemiola (3 over 2) is the easiest — three notes where two would go. Then 3:4 (triplets over quarters), 4:3, 5:4 (Carnatic khanda territory), and 7:4 (konnakol-level).",
    patternIds: [
      'hemiola-3-2', 'triplet-over-quarters', 'four-over-three',
      'five-over-four', 'seven-over-four',
    ],
  },
];
