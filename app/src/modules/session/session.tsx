// Session provider + hook. Holds canonical state for Pattern / Kit /
// BPM / Swing / Transport at the App root. Every mode consumes
// useSession() and reads the same state — switching tabs preserves
// what's playing, what's tuned, what's edited.
//
// Pattern is the mutable spine. setPattern((prev) => …) lets any
// mode patch it; the engine receives the new pattern via
// engine.loadPattern AND every other consuming mode sees the new
// reference on next render.
//
// loadPattern(p) is the explicit reset: snaps bpm/kit to the pattern's
// defaults, drops edits. Used by Library's "open here" handoffs.

import { useCallback, useMemo, useState } from 'react';
import type { KitId, Pattern } from '../../patterns/types';
import type { SoundEngine } from '../../audio/runtime/sound-engine';
import { parseTimeSigDenom, stepToNaturalBpm } from '../../audio/tempo';
import type { Session } from './types';
import { SessionContext } from './context';

interface SessionProviderProps {
  engine: SoundEngine;
  initialPattern: Pattern;
  /** Optional override for the initial kit. Default: pattern.defaultKit. */
  initialKit?: KitId;
  children: React.ReactNode;
}

/** Compute the natural BPM for a pattern's default tempo — Practice's
 *  user-facing convention. */
function naturalBpmForPattern(p: Pattern): number {
  const denom = parseTimeSigDenom(p.timeSig);
  return stepToNaturalBpm(p.bpm.default, p.stepUnit, denom);
}

export function SessionProvider({ engine, initialPattern, initialKit, children }: SessionProviderProps) {
  const [pattern, setPatternState] = useState<Pattern>(initialPattern);
  const [kit, setKitState] = useState<KitId>(initialKit ?? initialPattern.defaultKit);
  const [bpm, setBpmState] = useState<number>(() => naturalBpmForPattern(initialPattern));
  const [swing, setSwingState] = useState<number>(50);
  const [playing, setPlaying] = useState<boolean>(false);

  // Push pattern + kit + bpm + swing into the engine on each change.
  // The engine internally compares + re-anchors; cheap when nothing
  // changed (see SoundEngine.loadPattern + setKit + setNaturalBpm).
  // Using a ref to track "was the pattern changed by setPattern (sticky
  // edit) or loadPattern (full reset)?" — sticky edits push pattern
  // but DON'T touch bpm/kit; full reset overwrites all three.

  const loadPattern = useCallback((next: Pattern) => {
    setPatternState(next);
    const nextKit = next.defaultKit;
    setKitState(nextKit);
    setBpmState(naturalBpmForPattern(next));
    // Engine sync: load pattern first (sets stepUnit/steps), then kit
    // (re-applies machine presets), then bpm.
    engine.setKit(nextKit);
    engine.loadPattern(next);
    const denom = parseTimeSigDenom(next.timeSig);
    engine.setNaturalBpm(naturalBpmForPattern(next), denom);
  }, [engine]);

  const setKit = useCallback((k: KitId) => {
    setKitState(k);
    engine.setKit(k);
  }, [engine]);

  const setPattern = useCallback((updater: (prev: Pattern) => Pattern) => {
    setPatternState((prev) => {
      const next = updater(prev);
      // Push to engine — same denom/timesig, just edited tracks.
      engine.loadPattern(next);
      return next;
    });
  }, [engine]);

  const setBpm = useCallback((b: number) => {
    setBpmState(b);
    const denom = parseTimeSigDenom(pattern.timeSig);
    engine.setNaturalBpm(b, denom);
  }, [engine, pattern.timeSig]);

  const setSwing = useCallback((s: number) => {
    setSwingState(s);
    // Map slider 0..100 to engine swing 0.5..0.84 (matches useMetronome's
    // mapping so the curve feels identical regardless of which surface
    // changed it).
    const v = 0.5 + ((s - 50) / 100) * 0.34;
    engine.setSwing(v);
  }, [engine]);

  const start = useCallback((opts: { countInBars?: number } = {}) => {
    setPlaying(true);
    void engine.play(opts);
  }, [engine]);

  const stop = useCallback(() => {
    setPlaying(false);
    engine.stop();
  }, [engine]);

  const session: Session = useMemo(() => ({
    pattern, kit, bpm, swing, playing,
    loadPattern, setKit, setPattern, setBpm, setSwing,
    start, stop,
  }), [
    pattern, kit, bpm, swing, playing,
    loadPattern, setKit, setPattern, setBpm, setSwing, start, stop,
  ]);

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

