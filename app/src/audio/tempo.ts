// Tempo conversion helpers.
//
// The audio engine schedules in "step BPM" — i.e., the rate of the
// pattern's smallest subdivision (`stepUnit`). For UI we want the
// human-readable quarter-note BPM (♩ = N) regardless of how fine the
// underlying grid is.
//
// stepUnit=4  → 1 step = quarter, step BPM == quarter BPM
// stepUnit=8  → 1 step = eighth,  quarter BPM = step / 2
// stepUnit=16 → 1 step = sixteenth, quarter BPM = step / 4

export function stepToQuarterBpm(stepBpm: number, stepUnit: number): number {
  return Math.round((stepBpm * 4) / stepUnit);
}

export function quarterToStepBpm(quarterBpm: number, stepUnit: number): number {
  return Math.round((quarterBpm * stepUnit) / 4);
}
