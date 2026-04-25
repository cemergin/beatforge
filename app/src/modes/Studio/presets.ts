// Meter presets used by Studio's quick-start row.
// See design/src/studio.jsx for the original list.

import type { Pattern, VoiceId, Velocity } from '../../patterns/types';

export interface MeterPreset {
  label: string;
  steps: number;
  stepUnit: 8 | 16 | 4;
  grouping: number[];
  timeSig: string;
}

export const METER_PRESETS: MeterPreset[] = [
  { label: '4/4',  steps: 16, stepUnit: 16, grouping: [4, 4, 4, 4], timeSig: '4/4' },
  { label: '3/4',  steps: 12, stepUnit: 16, grouping: [4, 4, 4],    timeSig: '3/4' },
  { label: '6/8',  steps: 6,  stepUnit: 8,  grouping: [3, 3],       timeSig: '6/8' },
  { label: '5/8',  steps: 5,  stepUnit: 8,  grouping: [2, 3],       timeSig: '5/8' },
  { label: '7/8',  steps: 7,  stepUnit: 8,  grouping: [2, 2, 3],    timeSig: '7/8' },
  { label: '9/8',  steps: 9,  stepUnit: 8,  grouping: [2, 2, 2, 3], timeSig: '9/8' },
  { label: '11/8', steps: 11, stepUnit: 8,  grouping: [2, 2, 3, 2, 2], timeSig: '11/8' },
  { label: '12/8', steps: 12, stepUnit: 8,  grouping: [3, 3, 3, 3], timeSig: '12/8' },
];

export const DEFAULT_VOICES: VoiceId[] = ['KK', 'SN', 'HH'];
export const ALL_VOICES: VoiceId[] = ['KK', 'SN', 'HH', 'OH', 'CP'];
export const VOICE_LABELS: Record<VoiceId, string> = {
  KK: 'Kick',
  SN: 'Snare',
  HH: 'Hat',
  OH: 'Open Hat',
  CP: 'Clap',
};

export function emptyTracks(voices: VoiceId[], steps: number): Partial<Record<VoiceId, Velocity[]>> {
  const t: Partial<Record<VoiceId, Velocity[]>> = {};
  voices.forEach((v) => {
    t[v] = new Array(steps).fill(0) as Velocity[];
  });
  return t;
}

/** Build a blank pattern. Defaults to 4/4 in 16ths; pass a meter preset
 *  to start in a different time signature. The bpm.default scales with
 *  stepUnit so a fresh pattern feels musical out of the box (≈120 ♩ in
 *  4/4, ≈200 ♪ in 9/8, etc.). */
export function blankPattern(meter?: MeterPreset): Pattern {
  const m: MeterPreset = meter ?? METER_PRESETS[0];
  // Aim for ~120 quarter BPM equivalent regardless of stepUnit:
  //   stepBpm = quarterBpm × stepUnit / 4
  const defaultStepBpm = Math.round((120 * m.stepUnit) / 4);
  return {
    id: 'draft',
    name: 'Untitled',
    origin: 'Your Studio',
    tradition: 'Custom',
    genre: 'popular',
    timeSig: m.timeSig,
    grouping: [...m.grouping],
    steps: m.steps,
    stepUnit: m.stepUnit,
    bpm: {
      default: defaultStepBpm,
      min: Math.round((60 * m.stepUnit) / 4),
      max: Math.round((200 * m.stepUnit) / 4),
    },
    tracks: emptyTracks(DEFAULT_VOICES, m.steps),
    defaultKit: '808',
    region: 'electronic-western',
    difficulty: 'beginner',
    tags: [],
    swingable: m.stepUnit !== 4,
  };
}

export function kebabCase(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function generateId(name: string): string {
  const base = kebabCase(name) || 'pattern';
  return `${base}-${Date.now().toString(36)}`;
}

/** Auto-rebuild a grouping that sums to steps by distributing 2s and 3s. */
export function autoNormalizeGrouping(steps: number): number[] {
  const g: number[] = [];
  let left = steps;
  while (left > 0) {
    const next = left >= 3 && left % 2 === 1 ? 3 : 2;
    g.push(Math.min(next, left));
    left -= g[g.length - 1];
  }
  return g;
}
