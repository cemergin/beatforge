// Pure pattern utilities used by Studio (and tested in patternOps.test.ts).
//
// clonePattern → deep clone so editing the draft can't mutate seed data.
// resizeTracksToSteps → grow/shrink track arrays when the user changes
// the step count (or applies a meter preset).

import type { Pattern, Track, Velocity, VoiceId } from '../../patterns/types';

/** Deep-clone a Pattern so edits never mutate seed data. */
export function clonePattern(p: Pattern): Pattern {
  const tracks: Partial<Record<VoiceId, Track>> = {};
  for (const k of Object.keys(p.tracks) as VoiceId[]) {
    const td = p.tracks[k];
    if (!td) continue;
    if (Array.isArray(td)) {
      tracks[k] = [...td];
    } else {
      tracks[k] = { ...td, pattern: [...td.pattern] };
    }
  }
  return {
    ...p,
    grouping: [...p.grouping],
    tags: [...p.tags],
    instruments: p.instruments ? [...p.instruments] : undefined,
    relatedIds: p.relatedIds ? [...p.relatedIds] : undefined,
    bpm: { ...p.bpm },
    tracks,
  };
}

/** Resize a flat velocity array to `newSteps`, preserving leading values
 *  (truncate or zero-pad). Pure. */
export function resizeVelocityArray(arr: Velocity[], newSteps: number): Velocity[] {
  const out = new Array<Velocity>(newSteps).fill(0);
  for (let i = 0; i < Math.min(arr.length, newSteps); i++) out[i] = arr[i];
  return out;
}

/** Apply a new step count to every track that rides the main division.
 *  Polyrhythm tracks (their own subdivisions) are passed through
 *  untouched — only main-division tracks get resized. */
export function resizeTracksToSteps(
  tracks: Partial<Record<VoiceId, Track>>,
  oldSteps: number,
  newSteps: number,
): Partial<Record<VoiceId, Track>> {
  const out: Partial<Record<VoiceId, Track>> = {};
  for (const k of Object.keys(tracks) as VoiceId[]) {
    const td = tracks[k];
    if (!td) continue;
    if (Array.isArray(td)) {
      out[k] = resizeVelocityArray(td, newSteps);
    } else if ((td.subdivisions ?? oldSteps) === oldSteps) {
      // Main-division track in object form — resize pattern + drop stale cycle.
      out[k] = {
        ...td,
        pattern: resizeVelocityArray(td.pattern, newSteps),
        cycle: newSteps,
      };
    } else {
      // Polyrhythm track with its own subdivisions — leave alone.
      out[k] = td;
    }
  }
  return out;
}
