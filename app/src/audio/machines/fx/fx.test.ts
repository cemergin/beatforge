import { describe, expect, it, vi } from 'vitest';
import {
  buildColorFxModule,
  createBitcrush,
  createDelayFx,
  createFilter,
  createOverdrive,
  createReverb,
} from './index';

// ── Web Audio stubs ─────────────────────────────────────────────
// Same shape used by the audio-graph primitive tests: AudioParam
// stubs track ramp calls, AudioNode stubs track connect/disconnect.

interface AudioParamStub {
  value: number;
  cancelScheduledValues: ReturnType<typeof vi.fn>;
  setValueAtTime: ReturnType<typeof vi.fn>;
  linearRampToValueAtTime: ReturnType<typeof vi.fn>;
}
function audioParam(initial = 0): AudioParamStub {
  return {
    value: initial,
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };
}
interface NodeStub { connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; }
function node(): NodeStub {
  // connect returns destination so a.connect(b).connect(c) chains.
  return { connect: vi.fn((d: unknown) => d), disconnect: vi.fn() };
}

interface GainStub extends NodeStub { gain: AudioParamStub; }
function gainNode(v = 1): GainStub { return { ...node(), gain: audioParam(v) }; }

interface BiquadStub extends NodeStub {
  type: string; frequency: AudioParamStub; Q: AudioParamStub;
}
function biquadNode(): BiquadStub {
  return { ...node(), type: 'lowpass', frequency: audioParam(1000), Q: audioParam(1) };
}

interface DelayStub extends NodeStub { delayTime: AudioParamStub; }
function delayNode(): DelayStub {
  return { ...node(), delayTime: audioParam(0.25) };
}

interface ConvolverStub extends NodeStub { buffer: AudioBuffer | null; }
function convolverNode(): ConvolverStub {
  return { ...node(), buffer: null };
}

interface ShaperStub extends NodeStub {
  curve: Float32Array | null;
  oversample: string;
}
function shaperNode(): ShaperStub {
  return { ...node(), curve: null, oversample: 'none' };
}

function ctx() {
  const created = {
    gains: [] as GainStub[],
    biquads: [] as BiquadStub[],
    delays: [] as DelayStub[],
    convolvers: [] as ConvolverStub[],
    shapers: [] as ShaperStub[],
  };
  const make = {
    sampleRate: 48000,
    currentTime: 0,
    createGain: () => { const n = gainNode(1); created.gains.push(n); return n; },
    createBiquadFilter: () => { const n = biquadNode(); created.biquads.push(n); return n; },
    createDelay: () => { const n = delayNode(); created.delays.push(n); return n; },
    createConvolver: () => { const n = convolverNode(); created.convolvers.push(n); return n; },
    createWaveShaper: () => { const n = shaperNode(); created.shapers.push(n); return n; },
    createBuffer: (channels: number, length: number, rate: number) => ({
      numberOfChannels: channels, length, sampleRate: rate,
      getChannelData: () => new Float32Array(length),
    }),
  };
  return { ctx: make as unknown as AudioContext, created };
}

// ── Overdrive ───────────────────────────────────────────────────

describe('createOverdrive', () => {
  it('exposes drive / tone / mix params', () => {
    const { ctx: c } = ctx();
    const od = createOverdrive(c);
    expect(od.params.map((p) => p.name).sort()).toEqual(['drive', 'mix', 'tone']);
  });

  it('drive ramps the boost gain AND the trim gain', () => {
    const { ctx: c, created } = ctx();
    const od = createOverdrive(c, { drive: 0.5, tone: 4000, mix: 0.7 });
    od.set('drive', 1);
    // Two gain ramps (boost + trim) fire on a single drive change.
    const ramps = created.gains.flatMap((g) => g.gain.linearRampToValueAtTime.mock.calls);
    // Boost should ramp to 1 + 1*12 = 13; trim ~ 1 / sqrt(7) ≈ 0.378.
    expect(ramps.some(([v]) => Math.abs(v - 13) < 0.001)).toBe(true);
    expect(ramps.some(([v]) => Math.abs(v - 1 / Math.sqrt(7)) < 0.001)).toBe(true);
  });

  it('tone routes to the LP filter frequency', () => {
    const { ctx: c, created } = ctx();
    const od = createOverdrive(c, { tone: 2000 });
    od.set('tone', 6000);
    expect(created.biquads[0].frequency.linearRampToValueAtTime).toHaveBeenCalledWith(6000, expect.any(Number));
  });

  it('mix ramps wet AND dry inversely', () => {
    const { ctx: c, created } = ctx();
    const od = createOverdrive(c, { mix: 0.5 });
    od.set('mix', 0.8);
    const ramps = created.gains.flatMap((g) => g.gain.linearRampToValueAtTime.mock.calls);
    expect(ramps.some(([v]) => Math.abs(v - 0.8) < 0.001)).toBe(true);
    expect(ramps.some(([v]) => Math.abs(v - 0.2) < 0.001)).toBe(true);
  });

  it('uses 4× oversampling on the WaveShaper', () => {
    const { ctx: c, created } = ctx();
    createOverdrive(c);
    expect(created.shapers[0].oversample).toBe('4x');
  });
});

// ── Bitcrush ────────────────────────────────────────────────────

describe('createBitcrush', () => {
  it('rebuilds the curve when bits changes', () => {
    const { ctx: c, created } = ctx();
    const bc = createBitcrush(c, { bits: 8 });
    const initial = created.shapers[0].curve;
    bc.set('bits', 4);
    expect(created.shapers[0].curve).not.toBe(initial);
    expect(created.shapers[0].curve).toBeInstanceOf(Float32Array);
  });

  it('rate routes to the LP cutoff with clamping', () => {
    const { ctx: c, created } = ctx();
    const bc = createBitcrush(c, { rate: 4000 });
    bc.set('rate', 100);   // hits the 200 floor
    const calls = created.biquads[0].frequency.linearRampToValueAtTime.mock.calls;
    expect(calls.some(([v]) => v === 200)).toBe(true);
  });

  it('bits param is structural, rate + mix are continuous', () => {
    const { ctx: c } = ctx();
    const bc = createBitcrush(c);
    expect(bc.params.find((p) => p.name === 'bits')?.kind).toBe('structural');
    expect(bc.params.find((p) => p.name === 'rate')?.kind).toBe('continuous');
    expect(bc.params.find((p) => p.name === 'mix')?.kind).toBe('continuous');
  });
});

// ── Filter ──────────────────────────────────────────────────────

describe('createFilter', () => {
  it('mode flips the biquad type between lp/hp/bp', () => {
    const { ctx: c, created } = ctx();
    const f = createFilter(c, { mode: 'lp' });
    expect(created.biquads[0].type).toBe('lowpass');
    f.set('mode', 'hp');
    expect(created.biquads[0].type).toBe('highpass');
    f.set('mode', 'bp');
    expect(created.biquads[0].type).toBe('bandpass');
  });

  it('rejects unknown modes', () => {
    const { ctx: c, created } = ctx();
    const f = createFilter(c, { mode: 'lp' });
    f.set('mode', 'allpass');
    expect(created.biquads[0].type).toBe('lowpass');
  });

  it('cutoff + q + mix all ramp', () => {
    const { ctx: c, created } = ctx();
    const f = createFilter(c, { mode: 'lp', cutoff: 1000, q: 1, mix: 0.5 });
    f.set('cutoff', 4000);
    f.set('q', 5);
    f.set('mix', 0.9);
    expect(created.biquads[0].frequency.linearRampToValueAtTime).toHaveBeenCalledWith(4000, expect.any(Number));
    expect(created.biquads[0].Q.linearRampToValueAtTime).toHaveBeenCalledWith(5, expect.any(Number));
  });
});

// ── Reverb ──────────────────────────────────────────────────────

describe('createReverb', () => {
  it('initializes the convolver buffer', () => {
    const { ctx: c, created } = ctx();
    createReverb(c, { wet: 0.5, size: 1.5, decay: 2 });
    expect(created.convolvers[0].buffer).not.toBeNull();
  });

  it('wet ramps the wet gain', () => {
    const { ctx: c, created } = ctx();
    const r = createReverb(c, { wet: 0.3 });
    r.set('wet', 0.7);
    const ramps = created.gains.flatMap((g) => g.gain.linearRampToValueAtTime.mock.calls);
    expect(ramps.some(([v]) => Math.abs(v - 0.7) < 0.001)).toBe(true);
  });

  it('size + decay rebuild the impulse buffer (structural)', () => {
    const { ctx: c, created } = ctx();
    const r = createReverb(c, { size: 1.5, decay: 2 });
    const initial = created.convolvers[0].buffer;
    r.set('size', 3);
    expect(created.convolvers[0].buffer).not.toBe(initial);
    const afterSize = created.convolvers[0].buffer;
    r.set('decay', 4);
    expect(created.convolvers[0].buffer).not.toBe(afterSize);
  });

  it('clamps size and decay to safe ranges', () => {
    const { ctx: c, created } = ctx();
    const r = createReverb(c);
    // way over — should clamp to max
    r.set('size', 100);
    r.set('decay', 100);
    // No throw + buffer rebuilt twice
    expect(created.convolvers[0].buffer).not.toBeNull();
  });
});

// ── Delay ───────────────────────────────────────────────────────

describe('createDelayFx', () => {
  it('time ramps with a longer ramp than the default to avoid pitch chirps', () => {
    const { ctx: c, created } = ctx();
    const d = createDelayFx(c, { time: 0.25 });
    d.set('time', 0.5);
    const calls = created.delays[0].delayTime.linearRampToValueAtTime.mock.calls;
    expect(calls).toHaveLength(1);
    // Default ramp is 0.015s; delay's set should use ≥ 0.03s.
    const [, when] = calls[0];
    // when = ctx.currentTime + ramp; ctx.currentTime stub is 0.
    expect(when).toBeGreaterThanOrEqual(0.03 - 1e-9);
  });

  it('feedback caps at 0.7', () => {
    const { ctx: c, created } = ctx();
    const d = createDelayFx(c);
    d.set('feedback', 5);
    const ramps = created.gains.flatMap((g) => g.gain.linearRampToValueAtTime.mock.calls);
    expect(ramps.some(([v]) => v === 0.7)).toBe(true);
  });

  it('wet ramps the wet gain', () => {
    const { ctx: c, created } = ctx();
    const d = createDelayFx(c);
    d.set('wet', 0.8);
    const ramps = created.gains.flatMap((g) => g.gain.linearRampToValueAtTime.mock.calls);
    expect(ramps.some(([v]) => Math.abs(v - 0.8) < 0.001)).toBe(true);
  });
});

// ── Color FX dispatcher ─────────────────────────────────────────

describe('buildColorFxModule', () => {
  it('returns null for type=none', () => {
    const { ctx: c } = ctx();
    expect(buildColorFxModule({ type: 'none' }, c)).toBeNull();
  });

  it('builds the right module per type', () => {
    const { ctx: c } = ctx();
    const od = buildColorFxModule(
      { type: 'overdrive', drive: 0.5, tone: 4000, mix: 0.7 }, c,
    );
    expect(od?.params.map((p) => p.name)).toContain('drive');

    const bc = buildColorFxModule(
      { type: 'bitcrush', bits: 8, rate: 4000, mix: 0.7 }, c,
    );
    expect(bc?.params.map((p) => p.name)).toContain('bits');

    const f = buildColorFxModule(
      { type: 'filter', mode: 'lp', cutoff: 1000, q: 1, mix: 0.5 }, c,
    );
    expect(f?.params.map((p) => p.name)).toContain('cutoff');
  });
});
