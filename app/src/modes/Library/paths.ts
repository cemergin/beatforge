// Curated starter paths — six educational sequences per spec §6.3.
// Each path lists pattern IDs in difficulty order. Only IDs that exist
// in the current seed library are included; absent IDs are dropped so
// the build stays green. (See PATTERNS in ../../patterns/seed.ts.)

export interface StarterPath {
  id: string;
  title: string;
  subtitle: string;
  context: string;
  patternIds: string[];
}

export const STARTER_PATHS: StarterPath[] = [
  {
    id: 'turkish-usul-101',
    title: 'Turkish Usul 101',
    subtitle: 'The aksak family, one bar at a time',
    context:
      'Ottoman classical and folk traditions organize time into usul — asymmetric cycles named for their shape. Start on the even ground of Düyek, then step into the 2+2+2+3 skip that defines Thracian dance.',
    patternIds: ['duyek', 'karsilama'],
  },
  {
    id: 'clave-universe',
    title: 'Clave Universe',
    subtitle: 'Five patterns that shape Afro-Cuban music',
    context:
      'The clave is the heartbeat of Cuban music — a 5-stroke cell that every other instrument locks onto. Hear it in son, rumba, bolero, guaguancó, and bembé.',
    patternIds: ['son-clave', 'rumba-clave-3-2', 'bolero', 'guaguanco', 'bembe'],
  },
  {
    id: 'meet-the-meters',
    title: 'Meet the Meters',
    subtitle: 'Seven time signatures from around the world',
    context:
      "4/4 is one meter among many. Each pattern here lives in a different time — 4/4, 5/8, 7/8, 8/8, 9/8, 11/8, 12/8 — so you can feel what 'odd' actually means.",
    patternIds: [
      'son-clave',
      'turk-aksagi',
      'horon',
      'duyek',
      'karsilama',
      'kopanitsa',
      'bembe',
    ],
  },
  {
    id: 'beginners-world-tour',
    title: "Beginner's World Tour",
    subtitle: 'One accessible rhythm from ten regions',
    context:
      'A gentle loop around the globe. Each stop is a beginner-friendly entry point into a tradition — start here and branch out to the region that speaks loudest.',
    patternIds: [
      'son-clave',
      'maqsoum',
      'keherwa',
      'fanga',
      'baiao',
      'reggaeton-dembow',
      'tangos-flamenco',
      'taiko-base',
      'irish-reel',
      'boom-bap',
    ],
  },
  {
    id: 'afro-cuban-foundations',
    title: 'Afro-Cuban Foundations',
    subtitle: 'Cáscara, clave, and the 12/8 bell',
    context:
      'The backbone of Afro-Cuban dance music: cáscara drives the timbales, clave sets the law, mambo and guaguancó fill out the ensemble, and bembé reaches back to the 12/8 Yoruba bell.',
    patternIds: ['cascara', 'son-clave', 'mambo', 'guaguanco', 'bembe'],
  },
  {
    id: 'indian-tal-basics',
    title: 'Indian Tal Basics',
    subtitle: 'Five tals that cover the core Hindustani cycles',
    context:
      'Hindustani music organises time into tal — cycles of beats with internal accent structure. These five cover 6, 7, 8, 10, and 16 beats: the repertoire base for classical tabla study.',
    patternIds: ['keherwa', 'dadra', 'rupak', 'jhaptal', 'tintal'],
  },
];
