// Pattern schema. v1 keeps the 5-voice closed set; new kits arrive incrementally.

export type VoiceId = 'KK' | 'SN' | 'HH' | 'OH' | 'CP';
export type Velocity = 0 | 1 | 2;   // 0 = off, 1 = ghost, 2 = accent
export type KitId = '808' | '909' | '707';

export type Track = Velocity[] | { cycle: number; pattern: Velocity[] };

export interface Pattern {
  id: string;
  name: string;
  origin: string;
  tradition: string;
  timeSig: string;
  grouping: number[];
  steps: number;
  stepUnit: 8 | 16 | 4;
  bpm: { default: number; min: number; max: number };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tracks: Partial<Record<VoiceId, Track>>;
  poly?: boolean;
  story?: string;
}
