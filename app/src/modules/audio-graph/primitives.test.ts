import { describe, expect, it, vi } from 'vitest';
import {
  bandpass,
  delay,
  gain,
  highpass,
  lowpass,
  panner,
  shaper,
  SHAPER_CURVES,
} from './primitives';

// Stub AudioContext + Web Audio nodes — assertions check the
// ControllableModule contract: every primitive exposes its params,
// .set() forwards to the right AudioParam (continuous) or property
// (discrete/structural), and .dispose() disconnects all owned nodes.

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

interface NodeStub {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

function node(): NodeStub {
  // Real AudioNode.connect returns the destination so a.connect(b).connect(c)
  // chains. Mirror that so the delay primitive's wiring code works.
  const stub: NodeStub = {
    connect: vi.fn((dest: unknown) => dest),
    disconnect: vi.fn(),
  };
  return stub;
}

interface GainStub extends NodeStub { gain: AudioParamStub; }
function gainNode(value = 1): GainStub {
  return { ...node(), gain: audioParam(value) };
}

interface PannerStub extends NodeStub { pan: AudioParamStub; }
function pannerNode(value = 0): PannerStub {
  return { ...node(), pan: audioParam(value) };
}

interface BiquadStub extends NodeStub {
  type: string;
  frequency: AudioParamStub;
  Q: AudioParamStub;
}
function biquadNode(): BiquadStub {
  return { ...node(), type: 'lowpass', frequency: audioParam(1000), Q: audioParam(0.7) };
}

interface DelayStub extends NodeStub { delayTime: AudioParamStub; }
function delayNode(): DelayStub {
  return { ...node(), delayTime: audioParam(0.25) };
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
    panners: [] as PannerStub[],
    biquads: [] as BiquadStub[],
    delays: [] as DelayStub[],
    shapers: [] as ShaperStub[],
  };
  const make = {
    createGain: () => { const n = gainNode(1); created.gains.push(n); return n; },
    createStereoPanner: () => { const n = pannerNode(0); created.panners.push(n); return n; },
    createBiquadFilter: () => { const n = biquadNode(); created.biquads.push(n); return n; },
    createDelay: (max: number) => {
      void max;
      const n = delayNode(); created.delays.push(n); return n;
    },
    createWaveShaper: () => { const n = shaperNode(); created.shapers.push(n); return n; },
    currentTime: 0,
  };
  return { ctx: make as unknown as AudioContext, created };
}

describe('gain primitive', () => {
  it('exposes a single continuous "value" param and forwards .set to the AudioParam', () => {
    const { ctx: c, created } = ctx();
    const g = gain(c, 0.7);
    expect(g.params).toHaveLength(1);
    expect(g.params[0].name).toBe('value');
    expect(g.params[0].kind).toBe('continuous');
    g.set('value', 0.3, { ramp: 0.02 });
    const param = created.gains[0].gain;
    expect(param.cancelScheduledValues).toHaveBeenCalled();
    expect(param.linearRampToValueAtTime).toHaveBeenCalledWith(0.3, expect.any(Number));
  });

  it('ignores unknown params + non-numbers', () => {
    const { ctx: c, created } = ctx();
    const g = gain(c, 0.5);
    g.set('nope', 1);
    g.set('value', 'string' as unknown as number);
    expect(created.gains[0].gain.linearRampToValueAtTime).not.toHaveBeenCalled();
  });

  it('dispose disconnects', () => {
    const { ctx: c, created } = ctx();
    gain(c, 1).dispose();
    expect(created.gains[0].disconnect).toHaveBeenCalled();
  });
});

describe('panner primitive', () => {
  it('forwards .set to the pan AudioParam', () => {
    const { ctx: c, created } = ctx();
    const p = panner(c, 0);
    p.set('pan', -0.6);
    expect(created.panners[0].pan.linearRampToValueAtTime).toHaveBeenCalledWith(-0.6, expect.any(Number));
  });
});

describe('biquad primitives', () => {
  it('lowpass exposes cutoff/q/mode', () => {
    const { ctx: c } = ctx();
    const lp = lowpass(c, 1500, 0.5);
    const names = lp.params.map((p) => p.name).sort();
    expect(names).toEqual(['cutoff', 'mode', 'q']);
  });

  it('discrete "mode" param flips the biquad type', () => {
    const { ctx: c, created } = ctx();
    const lp = lowpass(c, 1500, 0.5);
    expect(created.biquads[0].type).toBe('lowpass');
    lp.set('mode', 'highpass');
    expect(created.biquads[0].type).toBe('highpass');
    lp.set('mode', 'bandpass');
    expect(created.biquads[0].type).toBe('bandpass');
  });

  it('rejects mode values not in the option set', () => {
    const { ctx: c, created } = ctx();
    const lp = lowpass(c, 1500, 0.5);
    lp.set('mode', 'allpass'); // not in options
    expect(created.biquads[0].type).toBe('lowpass'); // unchanged
  });

  it('continuous cutoff/q go through the AudioParam ramp', () => {
    const { ctx: c, created } = ctx();
    const lp = lowpass(c, 1500, 0.5);
    lp.set('cutoff', 4000);
    lp.set('q', 3.0);
    expect(created.biquads[0].frequency.linearRampToValueAtTime).toHaveBeenCalledWith(4000, expect.any(Number));
    expect(created.biquads[0].Q.linearRampToValueAtTime).toHaveBeenCalledWith(3.0, expect.any(Number));
  });

  it('highpass + bandpass factories produce different default types', () => {
    const a = ctx(); highpass(a.ctx);
    const b = ctx(); bandpass(b.ctx);
    expect(a.created.biquads[0].type).toBe('highpass');
    expect(b.created.biquads[0].type).toBe('bandpass');
  });
});

describe('delay primitive', () => {
  it('exposes time / feedback / wet', () => {
    const { ctx: c } = ctx();
    const d = delay(c, 0.3, 0.4, 0.6);
    const names = d.params.map((p) => p.name).sort();
    expect(names).toEqual(['feedback', 'time', 'wet']);
  });

  it('clamps feedback to [0, 0.7]', () => {
    const { ctx: c, created } = ctx();
    const d = delay(c);
    d.set('feedback', 5);   // way over cap
    const fbGain = created.gains[2]; // 4 gains created in delay; index varies, so use last meaningful
    void fbGain;
    // Look at all gain ramps to find one with the clamped value.
    const ramped = created.gains.flatMap((g) =>
      g.gain.linearRampToValueAtTime.mock.calls,
    );
    expect(ramped.some(([v]) => v === 0.7)).toBe(true);
  });

  it('time goes through the delayTime AudioParam', () => {
    const { ctx: c, created } = ctx();
    const d = delay(c);
    d.set('time', 0.5);
    expect(created.delays[0].delayTime.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, expect.any(Number));
  });
});

describe('shaper primitive', () => {
  it('exposes a structural curve param with the curve options', () => {
    const { ctx: c } = ctx();
    const s = shaper(c, 'soft');
    expect(s.params[0].kind).toBe('structural');
    expect(s.params[0].options).toEqual(SHAPER_CURVES);
  });

  it('switches the WaveShaper curve when set("curve", "<id>")', () => {
    const { ctx: c, created } = ctx();
    const s = shaper(c, 'soft');
    const initial = created.shapers[0].curve;
    s.set('curve', 'hard');
    const after = created.shapers[0].curve;
    expect(after).not.toBe(initial);
    expect(after).toBeInstanceOf(Float32Array);
  });

  it('ignores unknown curve ids', () => {
    const { ctx: c, created } = ctx();
    const s = shaper(c, 'soft');
    const initial = created.shapers[0].curve;
    s.set('curve', 'nope');
    expect(created.shapers[0].curve).toBe(initial);
  });
});
