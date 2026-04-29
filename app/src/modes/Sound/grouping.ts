// Beat-grouping helper for Studio's numerator input.
//
// When the user types a new numerator, we want to give them a valid
// additive grouping (sum equals the numerator, parts in {2,3,4}). The
// rules:
//
//   1. If the previous grouping already sums to the new target AND
//      uses only 2/3/4 parts, keep it. No surprise on a no-op edit.
//   2. Otherwise generate every grouping of the target using parts
//      {2,3,4}. Score each by how much of the leading prefix matches
//      the previous grouping — this rewards "extend at the end" and
//      "trim from the end," the natural way a user re-thinks a meter.
//   3. Pick randomly among the top-scoring candidates. The randomness
//      keeps things playful — when the user starts fresh on 9/8 we
//      sometimes give them 2+2+2+3, sometimes 3+2+2+2, sometimes
//      3+3+3 — all of which are real karsilama / gigue / etc. dance
//      groupings.
//   4. If no 2/3/4 composition exists (target = 1, or absurd), fall
//      back to the legacy [target] single-bar behavior.
//
// Why 2/3/4: those are the building blocks of additive meter across
// world traditions (Turkish aksak, Bulgarian odd meters, flamenco
// 12-cycles, Indian tala, Brazilian samba, etc.). 5 and beyond are
// rare in practice, and 1 produces awkward single-pulse "groups"
// that the visualization can't render meaningfully.

const ALLOWED_PARTS = [2, 3, 4] as const;
type Part = (typeof ALLOWED_PARTS)[number];

/** Cap on enumeration. Compositions of N grow fast (Tribonacci-ish);
 *  N=32 gives ~10K candidates which we scan once and cache. Beyond
 *  that we fall back to [target] — Studio's numerator input clamps
 *  to 64 anyway, but we keep this guard so a manual call site can't
 *  accidentally trigger a 100K-element enumeration. */
const MAX_TARGET = 32;

const compositionCache = new Map<number, readonly (readonly number[])[]>();

function compositionsOf(n: number): readonly (readonly number[])[] {
  if (n === 0) return [[]];
  if (n < 0 || n > MAX_TARGET) return [];
  const cached = compositionCache.get(n);
  if (cached) return cached;
  const out: number[][] = [];
  for (const p of ALLOWED_PARTS) {
    if (p > n) continue;
    for (const rest of compositionsOf(n - p)) {
      out.push([p, ...rest]);
    }
  }
  compositionCache.set(n, out);
  return out;
}

function isAllowedPart(x: number): x is Part {
  return x === 2 || x === 3 || x === 4;
}

function prefixMatch(candidate: readonly number[], prev: readonly number[]): number {
  const min = Math.min(candidate.length, prev.length);
  let i = 0;
  while (i < min && candidate[i] === prev[i]) i++;
  return i;
}

/** Find a 2/3/4 grouping summing to `target`, biased toward
 *  preserving structure shared with `prev`. The optional `pick`
 *  function controls the random tiebreak — pass `() => 0` from
 *  tests to make the result deterministic. */
export function findGrouping(
  target: number,
  prev: readonly number[],
  pick: (n: number) => number = (n) => Math.floor(Math.random() * n),
): number[] {
  if (target <= 0) return [];

  const prevSum = prev.reduce((a, b) => a + b, 0);
  const prevIsValid = prev.length > 0 && prev.every(isAllowedPart);
  if (prevIsValid && prevSum === target) return prev.slice();

  const candidates = compositionsOf(target);
  if (candidates.length === 0) return [target];

  let bestScore = -1;
  let top: readonly (readonly number[])[] = [];
  for (const c of candidates) {
    const s = prefixMatch(c, prev);
    if (s > bestScore) {
      bestScore = s;
      top = [c];
    } else if (s === bestScore) {
      top = [...top, c];
    }
  }

  const chosen = top[pick(top.length)];
  return chosen.slice();
}
