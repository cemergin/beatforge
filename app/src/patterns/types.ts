// Pattern schema. v1 keeps the 5-voice closed set.
// New kits (727/frameDrum/tabla/gamelan) ship as part of batch 1.

export type VoiceId = 'KK' | 'SN' | 'HH' | 'OH' | 'CP';
export type Velocity = 0 | 1 | 2;   // 0 = off, 1 = ghost, 2 = accent

export type KitId =
  | '808' | '909' | '707' | '727'
  | 'frameDrum' | 'tabla' | 'gamelan';

// Single source of truth for kit + voice enumerations. Adding a new
// kit or voice means updating the union above AND this list — TS will
// flag drift via the `satisfies readonly KitId[]` constraint.
export const ALL_KITS = ['808', '909', '707', '727', 'frameDrum', 'tabla', 'gamelan'] as const satisfies readonly KitId[];
export const ALL_VOICES = ['KK', 'SN', 'HH', 'OH', 'CP'] as const satisfies readonly VoiceId[];

/** Type-safe Object.keys over a Partial<Record<VoiceId, ...>>. Replaces
 *  the `Object.keys(record) as VoiceId[]` cast pattern that bypasses
 *  runtime safety. */
export function voiceKeys<T>(record: Partial<Record<VoiceId, T>>): VoiceId[] {
  return Object.keys(record).filter((k): k is VoiceId =>
    (ALL_VOICES as readonly string[]).includes(k),
  );
}

export type RegionId =
  | 'turkey-ottoman'
  | 'arabic-swana'
  | 'persia'
  | 'india'
  | 'west-africa'
  | 'modern-african'             // Afropop / highlife / soukous / makossa / gqom / kwaito
  | 'north-east-african'         // Gnawa / Ethiopian / Somali / Sufi
  | 'cuba-afrocaribbean'
  | 'brazil'
  | 'andean-south-america'
  | 'caribbean'
  | 'balkans'
  | 'iberia-flamenco'
  | 'caucasus-mediterranean'     // Georgia / Armenia / Crete / Sicily / Sufi dhikr
  | 'gamelan-southeast-asia'
  | 'east-asia'
  | 'central-asian-pacific'      // Uzbek / Uyghur / Afghan / Polynesian / Aboriginal
  | 'celtic-europe'
  | 'electronic-western'
  | 'global-electronic'          // Funkot / budots / vinahouse / baile-funk / drill
  | 'underground-electronic'     // Mahraganat / dabke-electronic / guaracha / hardbass
  | 'internet-born'              // Vaporwave / lo-fi hip-hop / hyperpop / drift-phonk
  | 'exercise';                  // polyrhythm exercises, not regional

export type Genre =
  | 'folk-dance'
  | 'classical'
  | 'devotional'
  | 'popular'
  | 'electronic'
  | 'hip-hop'
  | 'jazz'
  | 'ceremonial'
  | 'exercise';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// Track encoding supports per-track subdivisions for polyrhythm (spec §4.5).
// - Velocity[] shorthand → subdivisions = pattern.steps, cycle = pattern.length
// - Full form → explicit subdivisions (equal steps per bar), cycle (wrap length)
export type Track =
  | Velocity[]
  | {
      pattern: Velocity[];
      subdivisions?: number;
      cycle?: number;
    };

export interface Pattern {
  // Identity
  id: string;
  name: string;
  origin: string;
  tradition: string;
  genre: Genre;

  // Rhythmic shape
  timeSig: string;
  grouping: number[];
  steps: number;
  stepUnit: 8 | 16 | 4;
  poly?: boolean;

  // Tempo
  bpm: { default: number; min: number; max: number };

  // Content
  tracks: Partial<Record<VoiceId, Track>>;

  // Kit
  defaultKit: KitId;

  // Discoverability
  region: RegionId;
  country?: string;
  difficulty: Difficulty;
  tags: string[];
  instruments?: string[];
  swingable: boolean;
  // Natural swing amount for this rhythm — 0.5 = straight, 0.67 = triplet
  // shuffle, anywhere in between captures "slightly behind the beat"
  // feels. Practice Mode hydrates the swing slider from this on load.
  swingDefault?: number;
  relatedIds?: string[];

  // Narrative
  story?: string;
  sources?: string[];

  // Reserved for v2+ (Drum Synth era) — unused in v1
  customVoices?: Record<string, { synth: string; params: object }>;
}

// Helper — resolves a Track into its normalized form.
export interface TrackMeta {
  subdivisions: number;
  cycle: number;
  pattern: Velocity[];
}

export function trackMeta(track: Track, defaultSubdivisions: number): TrackMeta {
  if (Array.isArray(track)) {
    return {
      subdivisions: defaultSubdivisions,
      cycle: track.length,
      pattern: track,
    };
  }
  return {
    subdivisions: track.subdivisions ?? defaultSubdivisions,
    cycle: track.cycle ?? track.pattern.length,
    pattern: track.pattern,
  };
}
