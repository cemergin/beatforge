// CI gate for pattern data. Runs invariants that the Zod schema can't
// express or is too permissive about, across every one of the ~540
// shipped patterns. If you edit a JSON file and one of these fails,
// you've broken a contract the rest of the app relies on.
//
// Intent: catch regressions like "son-clave second stroke moved back
// to step 4" or "a pattern went silent" BEFORE the next deploy, not
// through a user reporting it.

import { describe, expect, it } from 'vitest';
import { PATTERNS } from './seed';
import { trackMeta, type Velocity, type Pattern } from './types';

type Inv = { id: string; msg: string };

/** Collect all violations rather than bail on the first — easier to
 * diff what broke when a bulk edit lands. */
function scan(predicate: (p: Pattern) => string | null): Inv[] {
  const out: Inv[] = [];
  for (const p of PATTERNS) {
    const msg = predicate(p);
    if (msg) out.push({ id: p.id, msg });
  }
  return out;
}

describe('Pattern library invariants', () => {
  it('has ≥ 500 patterns (smoke test against accidental deletions)', () => {
    expect(PATTERNS.length).toBeGreaterThanOrEqual(500);
  });

  it('every pattern has a unique id', () => {
    const dups = new Map<string, number>();
    for (const p of PATTERNS) dups.set(p.id, (dups.get(p.id) ?? 0) + 1);
    const conflicts = [...dups.entries()].filter(([, c]) => c > 1);
    expect(conflicts).toEqual([]);
  });

  it('grouping sums to steps', () => {
    const bad = scan((p) => {
      const sum = p.grouping.reduce((a, b) => a + b, 0);
      return sum === p.steps
        ? null
        : `grouping=[${p.grouping.join(',')}] sums to ${sum} but steps=${p.steps}`;
    });
    expect(bad).toEqual([]);
  });

  it('bpm.min ≤ bpm.default ≤ bpm.max', () => {
    const bad = scan((p) => {
      const { min, default: d, max } = p.bpm;
      return (min <= d && d <= max)
        ? null
        : `bpm range broken: min=${min} default=${d} max=${max}`;
    });
    expect(bad).toEqual([]);
  });

  it('steps + stepUnit are positive integers within sane bounds', () => {
    const bad = scan((p) => {
      if (!Number.isInteger(p.steps) || p.steps <= 0 || p.steps > 256) {
        return `steps=${p.steps} out of range (1..256)`;
      }
      if (![4, 8, 16].includes(p.stepUnit)) {
        return `stepUnit=${p.stepUnit} not one of 4/8/16`;
      }
      return null;
    });
    expect(bad).toEqual([]);
  });

  it('at least one track has at least one accent (vel >= 2)', () => {
    // Silent patterns play nothing — user loads the pattern and hears
    // nothing. Catch that before shipping.
    const bad = scan((p) => {
      let anyAccent = false;
      for (const tr of Object.values(p.tracks)) {
        if (!tr) continue;
        const meta = trackMeta(tr, p.steps);
        if (meta.pattern.some((v: Velocity) => v >= 2)) {
          anyAccent = true;
          break;
        }
      }
      return anyAccent ? null : 'no accent (vel=2) in any track — pattern is silent';
    });
    expect(bad).toEqual([]);
  });

  it('track patterns produce a positive integer subdivision count', () => {
    // Malformed data would trigger the tick() guard and skip the track
    // — audible as "that pattern never plays that track."
    const bad: Inv[] = [];
    for (const p of PATTERNS) {
      for (const [voice, tr] of Object.entries(p.tracks)) {
        if (!tr) continue;
        const meta = trackMeta(tr, p.steps);
        if (!Number.isFinite(meta.subdivisions) || meta.subdivisions <= 0) {
          bad.push({ id: p.id, msg: `track ${voice}: bad subdivisions=${meta.subdivisions}` });
        }
        if (!meta.pattern || meta.pattern.length === 0) {
          bad.push({ id: p.id, msg: `track ${voice}: empty pattern array` });
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('swingDefault is within [0.5, 1.0] if present', () => {
    const bad = scan((p) => {
      const s = p.swingDefault;
      if (s === undefined) return null;
      return (s >= 0.5 && s <= 1.0)
        ? null
        : `swingDefault=${s} outside [0.5, 1.0]`;
    });
    expect(bad).toEqual([]);
  });

  it('swingDefault without swingable=true is a no-op (warn only)', () => {
    // Engine ignores swing unless pattern.swingable is true; having a
    // swingDefault on a non-swingable pattern is dead data. Enforcing
    // this would require data fixes we haven't committed to, so it's
    // a warning test for now.
    const orphans = PATTERNS.filter((p) => p.swingDefault !== undefined && !p.swingable);
    if (orphans.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(`${orphans.length} patterns have swingDefault but swingable=false:`, orphans.map((p) => p.id));
    }
    // Assert nothing — just surface it.
  });

  // Regression tests for patterns we just fixed in this session.
  // These are the canary canaries: they pin the positions so a future
  // edit (or bad merge) reverts are caught immediately.
  //
  // Clave strokes live on KK (3-side) and SN (2-side) by convention in
  // this library; HH carries a subordinate bell/ride pattern and is
  // NOT asserted here.
  const claveStrokes = (patternId: string): number[] => {
    const p = PATTERNS.find((x) => x.id === patternId)!;
    const strokes = new Set<number>();
    for (const voice of ['KK', 'SN'] as const) {
      const tr = p.tracks[voice];
      if (!tr) continue;
      trackMeta(tr, p.steps).pattern.forEach((v: Velocity, i: number) => {
        if (v >= 2) strokes.add(i);
      });
    }
    return [...strokes].sort((a, b) => a - b);
  };

  it('son-clave 3-2 has canonical KK+SN strokes at 0,3,6,10,12', () => {
    expect(claveStrokes('son-clave')).toEqual([0, 3, 6, 10, 12]);
  });

  it('rumba-clave-3-2 has canonical KK+SN strokes at 0,3,7,10,12', () => {
    expect(claveStrokes('rumba-clave-3-2')).toEqual([0, 3, 7, 10, 12]);
  });

  it('son-clave-2-3 has canonical KK+SN strokes at 2,4,8,11,14', () => {
    expect(claveStrokes('son-clave-2-3')).toEqual([2, 4, 8, 11, 14]);
  });

  it('bossa-nova clave (2-3) strokes on SN at 0,3,6,10,13', () => {
    const p = PATTERNS.find((x) => x.id === 'bossa-nova')!;
    const sn = p.tracks.SN;
    expect(sn).toBeDefined();
    const strokes: number[] = [];
    trackMeta(sn!, p.steps).pattern.forEach((v: Velocity, i: number) => {
      if (v >= 2) strokes.push(i);
    });
    expect(strokes).toEqual([0, 3, 6, 10, 13]);
  });

  it('maqsoum doums land on steps 0 and 8 (not 0 and 6)', () => {
    const p = PATTERNS.find((x) => x.id === 'maqsoum')!;
    const kk = p.tracks.KK;
    expect(kk).toBeDefined();
    const doums: number[] = [];
    trackMeta(kk!, p.steps).pattern.forEach((v: Velocity, i: number) => {
      if (v >= 2) doums.push(i);
    });
    expect(doums).toEqual([0, 8]);
  });

  it('rupak tal sam is KHALI (vel ≤ 1 at step 0), not an accent', () => {
    // Rupak's defining feature. If a well-meaning editor "fixes" the
    // quiet sam by bumping it to velocity 2, this test screams.
    const p = PATTERNS.find((x) => x.id === 'rupak')!;
    for (const tr of Object.values(p.tracks)) {
      if (!tr) continue;
      const pattern = trackMeta(tr, p.steps).pattern;
      expect(pattern[0]).toBeLessThanOrEqual(1); // sam must not be an accent
    }
  });
});
