import { describe, expect, it, vi } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SessionProvider } from './session';
import { useSession } from './context';
import type { SoundEngine } from '../../audio/runtime/sound-engine';
import type { Pattern } from '../../patterns/types';

function fakeEngine(): SoundEngine & { __calls: { loadPattern: ReturnType<typeof vi.fn>; setKit: ReturnType<typeof vi.fn>; setMachines: ReturnType<typeof vi.fn>; setNaturalBpm: ReturnType<typeof vi.fn>; setSwing: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> } } {
  const calls = {
    loadPattern: vi.fn(),
    setKit: vi.fn(),
    setMachines: vi.fn(),
    setNaturalBpm: vi.fn(),
    setSwing: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
    stop: vi.fn(),
  };
  return {
    loadPattern: calls.loadPattern,
    setKit: calls.setKit,
    setMachines: calls.setMachines,
    setNaturalBpm: calls.setNaturalBpm,
    setSwing: calls.setSwing,
    play: calls.play,
    stop: calls.stop,
    __calls: calls,
  } as unknown as SoundEngine & { __calls: typeof calls };
}

function fourFour(overrides: Partial<Pattern> = {}): Pattern {
  return {
    id: 'test', name: 'Test', origin: '', tradition: 'test', genre: 'popular',
    timeSig: '4/4', grouping: [4, 4, 4, 4], steps: 16, stepUnit: 16,
    bpm: { default: 480, min: 240, max: 720 },
    tracks: { KK: [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0] },
    defaultKit: '808',
    region: 'electronic-western', difficulty: 'beginner', tags: [], swingable: false,
    ...overrides,
  };
}

function withProvider(engine: SoundEngine, pattern: Pattern) {
  return ({ children }: { children: ReactNode }) => (
    <SessionProvider engine={engine} initialPattern={pattern}>
      {children}
    </SessionProvider>
  );
}

describe('SessionProvider', () => {
  it('seeds pattern + kit + bpm from the initial pattern', () => {
    const engine = fakeEngine();
    const p = fourFour({ defaultKit: '909' });
    const { result } = renderHook(() => useSession(), { wrapper: withProvider(engine, p) });
    expect(result.current.pattern).toBe(p);
    expect(result.current.kit).toBe('909');
    // 4/4 (denom 4) at stepBpm 480, stepUnit 16 → naturalBpm = 480*4/16 = 120
    expect(result.current.bpm).toBe(120);
  });

  it('loadPattern resets bpm + kit to the new pattern defaults', () => {
    const engine = fakeEngine();
    const p1 = fourFour({ defaultKit: '808' });
    const p2 = fourFour({ id: 'two', defaultKit: '909', bpm: { default: 320, min: 160, max: 640 } });
    const { result } = renderHook(() => useSession(), { wrapper: withProvider(engine, p1) });
    act(() => { result.current.loadPattern(p2); });
    expect(result.current.pattern).toBe(p2);
    expect(result.current.kit).toBe('909');
    // 320 stepBpm * 4 / 16 = 80
    expect(result.current.bpm).toBe(80);
    expect(engine.__calls.loadPattern).toHaveBeenCalledWith(p2);
    expect(engine.__calls.setKit).toHaveBeenCalledWith('909');
    expect(engine.__calls.setNaturalBpm).toHaveBeenCalledWith(80, 4);
  });

  it('setPattern is sticky — bpm + kit unchanged, engine sees the patch', () => {
    const engine = fakeEngine();
    const p1 = fourFour({ defaultKit: '808' });
    const { result } = renderHook(() => useSession(), { wrapper: withProvider(engine, p1) });

    // Simulate Studio editing a cell
    act(() => {
      result.current.setBpm(150);
      result.current.setPattern((prev: Pattern) => ({ ...prev, tracks: { ...prev.tracks, SN: [0, 0, 0, 0] } }));
    });

    expect(result.current.bpm).toBe(150);    // sticky
    expect(result.current.kit).toBe('808');  // sticky
    // Engine got the edited pattern through setPattern
    const lastLoad = engine.__calls.loadPattern.mock.calls.at(-1);
    expect(lastLoad?.[0].tracks.SN).toEqual([0, 0, 0, 0]);
  });

  it('setKit changes timbre but preserves pattern + bpm', () => {
    const engine = fakeEngine();
    const p = fourFour({ defaultKit: '808' });
    const { result } = renderHook(() => useSession(), { wrapper: withProvider(engine, p) });
    act(() => { result.current.setBpm(100); });
    act(() => { result.current.setKit('909'); });
    expect(result.current.kit).toBe('909');
    expect(result.current.bpm).toBe(100);
    expect(result.current.pattern).toBe(p);
  });

  it('setBpm + setSwing forward to the engine', () => {
    const engine = fakeEngine();
    const p = fourFour();
    const { result } = renderHook(() => useSession(), { wrapper: withProvider(engine, p) });
    act(() => { result.current.setBpm(140); });
    expect(engine.__calls.setNaturalBpm).toHaveBeenCalledWith(140, 4);
    act(() => { result.current.setSwing(75); });   // 50 → 0.5, 75 → 0.585
    const swingArgs = engine.__calls.setSwing.mock.calls.at(-1);
    expect(swingArgs?.[0]).toBeCloseTo(0.5 + 0.25 * 0.34, 3);
  });

  it('start + stop drive transport state', () => {
    const engine = fakeEngine();
    const { result } = renderHook(() => useSession(), { wrapper: withProvider(engine, fourFour()) });
    act(() => { result.current.start({ countInBars: 1 }); });
    expect(result.current.playing).toBe(true);
    expect(engine.__calls.play).toHaveBeenCalledWith({ countInBars: 1 });
    act(() => { result.current.stop(); });
    expect(result.current.playing).toBe(false);
    expect(engine.__calls.stop).toHaveBeenCalled();
  });

  it('useSession() outside a provider throws a clear error', () => {
    // Suppress React's expected error log noise.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Bare() { useSession(); return null; }
    expect(() => render(<Bare />)).toThrow(/SessionProvider/);
    errSpy.mockRestore();
  });
});
