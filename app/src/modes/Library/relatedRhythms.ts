// Related-rhythms algorithm (spec §6.7 + fingerprint §6.8).
// - sameGrouping: identical grouping array
// - sameRegion:   matching region
// - similarGroove: top-N by Hamming distance on 96-bit KK+SN fingerprint,
//                  excluding same-region patterns (surfaces cross-cultural matches).

import { trackMeta, type Pattern, type Track } from '../../patterns/types';

const FP_STEPS = 48;

function resampleToFingerprint(track: Track | undefined, sourceSteps: number): number[] {
  // Returns a 48-bit array (values 0 or 1) marking any non-zero velocity.
  const out = new Array<number>(FP_STEPS).fill(0);
  if (!track) return out;
  const meta = trackMeta(track, sourceSteps);
  const len = meta.pattern.length;
  if (len === 0) return out;
  for (let i = 0; i < len; i++) {
    if (meta.pattern[i] > 0) {
      const idx = Math.round((i * FP_STEPS) / meta.subdivisions) % FP_STEPS;
      out[idx] = 1;
    }
  }
  return out;
}

export function patternFingerprint(pattern: Pattern): number[] {
  const kk = resampleToFingerprint(pattern.tracks.KK, pattern.steps);
  const sn = resampleToFingerprint(pattern.tracks.SN, pattern.steps);
  return kk.concat(sn);
}

function hamming(a: number[], b: number[]): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

export function sameGrouping(pattern: Pattern, all: Pattern[]): Pattern[] {
  return all.filter(
    (p) =>
      p.id !== pattern.id
      && p.grouping.length === pattern.grouping.length
      && p.grouping.every((g, i) => g === pattern.grouping[i]),
  );
}

export function sameRegion(pattern: Pattern, all: Pattern[]): Pattern[] {
  return all.filter((p) => p.id !== pattern.id && p.region === pattern.region);
}

export function similarGroove(pattern: Pattern, all: Pattern[], topN = 5): Pattern[] {
  const base = patternFingerprint(pattern);
  const scored = all
    .filter((p) => p.id !== pattern.id && p.region !== pattern.region)
    .map((p) => ({ p, d: hamming(base, patternFingerprint(p)) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, topN);
  return scored.map((s) => s.p);
}
