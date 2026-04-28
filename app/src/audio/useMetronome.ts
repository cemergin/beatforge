// Shared metronome state hook used by Practice + Studio.
//
// What lives here:
//   - bpm (in NATURAL BPM — quarter for 4/4, eighth for 9/8, etc.)
//   - speed-trainer state + the cycles/time scheduling effects
//   - count-in toggle + countingIn flag
//   - accents (strong/weak)
//   - swing
//   - master volume (with localStorage write-through)
//   - tap-tempo accumulator + handler
//   - all the engine sync effects so Practice/Studio don't repeat them
//
// What stays in each mode:
//   - the loaded pattern/draft + pattern-change reset logic
//   - kit selection (Practice uses per-pattern overrides; Studio has its
//     own follow-the-draft behaviour — different enough to leak here)
//   - play/stop toggle (count-in timer cancellation is per-mode)
//
// On pattern change, modes call the returned setters (setBpm, setSwing,
// resetTaps, etc.) — this hook never reads the pattern itself.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SoundEngine } from './runtime/sound-engine';
import { parseTimeSigDenom } from './tempo';
import { useSession } from '../modules/session';
import { getMasterVolume, setMasterVolume as storeMasterVolume } from '../lib/storage';
import type { TrainerCfg } from '../modes/Practice/Trainer';

const TAP_WINDOW = 8;
const TAP_MIN_TAPS = 2;
const TAP_RESET_MS = 2000;

interface MetronomeOptions {
  /** Pattern's smallest subdivision — used to convert UI BPM ↔ engine. */
  stepUnit: number;
  /** Pattern's time signature — drives natural BPM denominator. */
  timeSig: string;
  /** Pattern allows swing? Emits straight pulse when false regardless of slider. */
  swingable: boolean;
  /** Initial natural BPM (typically stepToNaturalBpm of pattern.bpm.default). */
  initialBpm: number;
  /** Initial swing slider value (0-100). */
  initialSwing: number;
  /** Engine is currently playing — gates the trainer time-mode interval. */
  playing: boolean;
}

export interface UseMetronome {
  // Tempo
  bpm: number;
  setBpm: (next: number | ((prev: number) => number)) => void;
  /** Tap pulse → updates BPM directly; engine sync happens immediately. */
  handleTap: () => void;
  tapTimes: number[];
  resetTaps: () => void;

  // Speed trainer
  trainerOn: boolean;
  setTrainerOn: (on: boolean) => void;
  trainerCfg: TrainerCfg;
  setTrainerCfg: (cfg: TrainerCfg) => void;
  trainerBar: number;
  setTrainerBar: (n: number) => void;
  trainerCycleStartMs: number | null;

  // Count-in
  countInBars: number;
  setCountInBars: (n: number) => void;
  countingIn: boolean;
  setCountingIn: (on: boolean) => void;

  // Accents (engine-sync'd)
  strong: number;
  setStrong: (n: number) => void;
  weak: number;
  setWeak: (n: number) => void;

  // Swing (engine-sync'd; ignored when !swingable)
  swing: number;
  setSwing: (n: number) => void;

  // Master volume — read/write also persists via storage
  masterVolume: number;
  setMasterVolume: (v: number) => void;
}

export function useMetronome(engine: SoundEngine, opts: MetronomeOptions): UseMetronome {
  const { timeSig, swingable, playing } = opts;
  const denom = parseTimeSigDenom(timeSig);

  // BPM + swing live in the Session so they ride with the user across
  // tab switches. Practice / Studio / Sound all see the same tempo
  // even when the modes themselves remount on tab change. The other
  // metronome state (count-in, accents, master volume, tap-tempo,
  // trainer config) stays mode-local because no other surface
  // reads it.
  const session = useSession();
  const bpm = session.bpm;
  const swing = session.swing;
  // Preserve the legacy "function-form setter" API the trainer
  // effects rely on — session.setBpm only takes a number, so we
  // resolve the function form against the current session bpm here.
  const setBpm = useCallback((next: number | ((prev: number) => number)) => {
    const v = typeof next === 'function' ? next(session.bpm) : next;
    session.setBpm(v);
  }, [session]);
  const setSwing = useCallback((next: number | ((prev: number) => number)) => {
    const v = typeof next === 'function' ? next(session.swing) : next;
    session.setSwing(v);
  }, [session]);

  // ── State ────────────────────────────────────────────────────────
  const [strong, setStrong] = useState(100);
  const [weak, setWeak] = useState(55);
  const [countInBars, setCountInBars] = useState(0);
  const [countingIn, setCountingIn] = useState(false);
  const [trainerOn, setTrainerOn] = useState(false);
  const [trainerCfg, setTrainerCfg] = useState<TrainerCfg>({
    from: 100, to: 160, step: 5, bars: 4, mode: 'cycles',
  });
  const [trainerBar, setTrainerBar] = useState(0);
  const [trainerCycleStartMs, setTrainerCycleStartMs] = useState<number | null>(null);
  const [masterVolume, setMasterVolumeState] = useState(() => getMasterVolume());
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // ── Engine sync ──────────────────────────────────────────────────
  // BPM is pushed to the engine by SessionProvider directly. Swing
  // needs a per-pattern swingable override here — when the loaded
  // pattern doesn't allow swing, force the engine to 0.5 (straight)
  // regardless of the slider value. The slider value still rides in
  // session so a swingable pattern picks it up automatically.
  useEffect(() => {
    if (!swingable) engine.setSwing(0.5);
  }, [engine, swing, swingable]);

  useEffect(() => {
    engine.setAccents(strong / 100, weak / 100);
  }, [engine, strong, weak]);

  /* eslint-disable react-hooks/set-state-in-effect */
  // ── Bar-boundary subscription ────────────────────────────────────
  // setTrainerBar fires from the engine's onBar callback (async, not
  // during render). React-19's lint can't see through the indirection.
  useEffect(() => {
    return engine.subscribeOnBar((bar: number) => setTrainerBar(bar));
  }, [engine]);

  // ── Speed trainer — cycles mode ──────────────────────────────────
  // BPM ramp triggered by bar-count boundaries — the bar count IS the
  // trigger we react to, so set-state-in-effect is the right pattern.
  // `from > to` ⇒ descending ramp (slow-down practice). The clamp is
  // toward `to` regardless of direction.
  useEffect(() => {
    if (!trainerOn || !playing) return;
    if (trainerCfg.mode === 'cycles' && trainerBar > 0 && trainerBar % trainerCfg.bars === 0) {
      const ascending = trainerCfg.from <= trainerCfg.to;
      setBpm((b) => ascending
        ? Math.min(trainerCfg.to, b + trainerCfg.step)
        : Math.max(trainerCfg.to, b - trainerCfg.step));
    }
    // setBpm intentionally not in deps — adding it would re-fire this
    // effect every BPM change (since setBpm closes over session.bpm),
    // looping. The trigger is trainerBar; setBpm is read at call time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainerBar, trainerOn, playing, trainerCfg]);

  // ── Speed trainer — time mode (countdown drives BpmHero/Trainer) ─
  // Interval-driven BPM ramp + cycle-start clock; the setInterval body
  // is cleanup-bound so React doesn't see it as a render-time write.
  useEffect(() => {
    if (!trainerOn || trainerCfg.mode !== 'time' || !playing) {
      setTrainerCycleStartMs(null);
      return;
    }
    setTrainerCycleStartMs(performance.now());
    const ascending = trainerCfg.from <= trainerCfg.to;
    const iv = setInterval(() => {
      setBpm((b) => ascending
        ? Math.min(trainerCfg.to, b + trainerCfg.step)
        : Math.max(trainerCfg.to, b - trainerCfg.step));
      setTrainerCycleStartMs(performance.now());
    }, trainerCfg.bars * 1000);
    return () => clearInterval(iv);
    // setBpm closure is captured at interval-creation; not in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainerOn, trainerCfg, playing]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Master volume (state + storage write-through) ────────────────
  const setMasterVolume = useCallback((v: number) => {
    setMasterVolumeState(v);
    engine.setMasterVolume(v);
    storeMasterVolume(v);
  }, [engine]);

  // ── Tap tempo ────────────────────────────────────────────────────
  // tapTimes ref so the callback always sees the latest list without
  // adding tapTimes to its dep array (would re-create callback per tap).
  // The effect-based sync sidesteps "no ref writes during render" — one
  // tick of staleness is unobservable at human tap-rates.
  const tapTimesRef = useRef<number[]>([]);
  useEffect(() => { tapTimesRef.current = tapTimes; }, [tapTimes]);

  const handleTap = useCallback(() => {
    const now = performance.now();
    const prev = tapTimesRef.current;
    const last = prev[prev.length - 1];
    const base = last !== undefined && (now - last) > TAP_RESET_MS ? [] : prev;
    const next = [...base, now].slice(-TAP_WINDOW);
    setTapTimes(next);
    if (next.length < TAP_MIN_TAPS) return;

    const window = next.slice(-Math.min(TAP_WINDOW, next.length));
    const intervals: number[] = [];
    for (let i = 1; i < window.length; i++) intervals.push(window[i] - window[i - 1]);
    const sorted = [...intervals].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    const medianMs = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
    if (medianMs <= 0) return;

    // Tap intervals are at the natural pulse rate by convention.
    const rawNaturalBpm = 60_000 / medianMs;
    const clamped = Math.max(30, Math.min(400, Math.round(rawNaturalBpm)));
    setBpm(clamped);
    engine.setNaturalBpm(clamped, denom);
    // setBpm closes over the live session; safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, denom]);

  const resetTaps = useCallback(() => setTapTimes([]), []);

  return {
    bpm, setBpm, handleTap, tapTimes, resetTaps,
    trainerOn, setTrainerOn, trainerCfg, setTrainerCfg, trainerBar, setTrainerBar, trainerCycleStartMs,
    countInBars, setCountInBars, countingIn, setCountingIn,
    strong, setStrong, weak, setWeak,
    swing, setSwing,
    masterVolume, setMasterVolume,
  };
}
