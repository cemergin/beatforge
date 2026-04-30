import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SessionProvider } from '../modules/session/session';
import { useMetronome } from './useMetronome';
import type { SoundEngine } from './runtime/sound-engine';
import type { Pattern } from '../patterns/types';

function fakeEngine(): SoundEngine {
  return {
    loadPattern: vi.fn(),
    setKit: vi.fn(),
    setMachines: vi.fn(),
    setNaturalBpm: vi.fn(),
    setSwing: vi.fn(),
    setAccents: vi.fn(),
    setMasterVolume: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
    stop: vi.fn(),
    subscribeOnBar: vi.fn(() => () => {}),
  } as unknown as SoundEngine;
}

function fourFour(): Pattern {
  return {
    id: 'test', name: 'Test', origin: '', tradition: 'test', genre: 'popular',
    timeSig: '4/4', grouping: [4, 4, 4, 4], steps: 16, stepUnit: 16,
    bpm: { default: 480, min: 240, max: 720 },
    tracks: { KK: [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0] },
    defaultKit: '808',
    region: 'electronic-western', difficulty: 'beginner', tags: [], swingable: false,
  };
}

function withProvider(engine: SoundEngine, pattern: Pattern) {
  return ({ children }: { children: ReactNode }) => (
    <SessionProvider engine={engine} initialPattern={pattern}>
      {children}
    </SessionProvider>
  );
}

describe('useMetronome — speed trainer', () => {
  it('cycles mode bumps BPM at every Nth bar boundary', () => {
    const engine = fakeEngine();
    const { result } = renderHook(
      () => useMetronome(engine, {
        stepUnit: 16, timeSig: '4/4', swingable: false,
        initialBpm: 120, initialSwing: 50, playing: true,
      }),
      { wrapper: withProvider(engine, fourFour()) },
    );

    act(() => {
      result.current.setBpm(120);
      result.current.setTrainerCfg({
        from: 120, to: 130, step: 5, bars: 4, seconds: 60, mode: 'cycles',
      });
      result.current.setTrainerOn(true);
    });

    act(() => { result.current.setTrainerBar(4); });
    expect(result.current.bpm).toBe(125);

    act(() => { result.current.setTrainerBar(8); });
    expect(result.current.bpm).toBe(130);
  });

  it('cycles mode fires onTrainerComplete one cycle after target reached', () => {
    const engine = fakeEngine();
    const onComplete = vi.fn();
    const { result } = renderHook(
      () => useMetronome(engine, {
        stepUnit: 16, timeSig: '4/4', swingable: false,
        initialBpm: 120, initialSwing: 50, playing: true,
        onTrainerComplete: onComplete,
      }),
      { wrapper: withProvider(engine, fourFour()) },
    );

    act(() => {
      result.current.setBpm(120);
      result.current.setTrainerCfg({
        from: 120, to: 130, step: 5, bars: 4, seconds: 60, mode: 'cycles',
      });
      result.current.setTrainerOn(true);
    });

    act(() => { result.current.setTrainerBar(4); });
    act(() => { result.current.setTrainerBar(8); });
    expect(result.current.bpm).toBe(130);
    expect(onComplete).not.toHaveBeenCalled();
    expect(result.current.trainerOn).toBe(true);

    act(() => { result.current.setTrainerBar(12); });
    expect(result.current.bpm).toBe(130);
    expect(result.current.trainerOn).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  // Regression: the time-mode interval used to capture setBpm, whose
  // closure read session.bpm from a stale snapshot. After the first
  // bump the BPM was stuck — only the FIRST tick changed anything.
  it('time mode bumps BPM on every interval tick (stale-closure regression)', async () => {
    vi.useFakeTimers();
    try {
      const engine = fakeEngine();
      const { result } = renderHook(
        () => useMetronome(engine, {
          stepUnit: 16, timeSig: '4/4', swingable: false,
          initialBpm: 120, initialSwing: 50, playing: true,
        }),
        { wrapper: withProvider(engine, fourFour()) },
      );

      act(() => {
        result.current.setBpm(100);
        result.current.setTrainerCfg({
          from: 100, to: 130, step: 5, bars: 4, seconds: 10, mode: 'time',
        });
        result.current.setTrainerOn(true);
      });

      await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
      expect(result.current.bpm).toBe(105);

      await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
      expect(result.current.bpm).toBe(110);

      await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
      expect(result.current.bpm).toBe(115);
    } finally {
      vi.useRealTimers();
    }
  });

  it('time mode auto-completes one interval after target reached', async () => {
    vi.useFakeTimers();
    try {
      const engine = fakeEngine();
      const onComplete = vi.fn();
      const { result } = renderHook(
        () => useMetronome(engine, {
          stepUnit: 16, timeSig: '4/4', swingable: false,
          initialBpm: 120, initialSwing: 50, playing: true,
          onTrainerComplete: onComplete,
        }),
        { wrapper: withProvider(engine, fourFour()) },
      );

      act(() => {
        result.current.setBpm(100);
        result.current.setTrainerCfg({
          from: 100, to: 110, step: 5, bars: 4, seconds: 10, mode: 'time',
        });
        result.current.setTrainerOn(true);
      });

      await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
      expect(result.current.bpm).toBe(105);

      await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
      expect(result.current.bpm).toBe(110);
      expect(onComplete).not.toHaveBeenCalled();

      await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
      expect(result.current.bpm).toBe(110);
      expect(result.current.trainerOn).toBe(false);
      expect(onComplete).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('descending ramp (from > to) auto-completes correctly', () => {
    const engine = fakeEngine();
    const onComplete = vi.fn();
    const { result } = renderHook(
      () => useMetronome(engine, {
        stepUnit: 16, timeSig: '4/4', swingable: false,
        initialBpm: 120, initialSwing: 50, playing: true,
        onTrainerComplete: onComplete,
      }),
      { wrapper: withProvider(engine, fourFour()) },
    );

    act(() => {
      result.current.setBpm(140);
      result.current.setTrainerCfg({
        from: 140, to: 130, step: 5, bars: 4, seconds: 60, mode: 'cycles',
      });
      result.current.setTrainerOn(true);
    });

    act(() => { result.current.setTrainerBar(4); });
    expect(result.current.bpm).toBe(135);

    act(() => { result.current.setTrainerBar(8); });
    expect(result.current.bpm).toBe(130);
    expect(onComplete).not.toHaveBeenCalled();

    act(() => { result.current.setTrainerBar(12); });
    expect(result.current.bpm).toBe(130);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
