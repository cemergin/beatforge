// Primitive ControllableModule factories — the leaves of the audio
// graph. Each one wraps a small Web Audio sub-graph and exposes its
// tunable knobs as ParamSpecs so the router / MIDI / UI / automation
// can target them by name.
//
// Apply semantics for continuous params:
//   cancelScheduledValues(when) → setValueAtTime(current, when) →
//   linearRampToValueAtTime(value, when + ramp)
// This pattern defeats zipper noise on UI-rate updates AND lets
// future-scheduled events live cleanly alongside immediate ones.

import type { ControllableModule, ParamSpec, SetOptions } from './types';

/** Apply a continuous AudioParam change with anti-zip ramp + future
 *  scheduling support. Shared by every primitive's set() so behaviour
 *  is uniform — also where to add modulation matrix hooks later. */
function rampParam(
  ctx: AudioContext,
  param: AudioParam,
  value: number,
  opts: SetOptions = {},
): void {
  const when = opts.when ?? ctx.currentTime;
  const ramp = opts.ramp ?? 0.015;
  param.cancelScheduledValues(when);
  param.setValueAtTime(param.value, when);
  param.linearRampToValueAtTime(value, when + ramp);
}

// ── gain ─────────────────────────────────────────────────────────

export function gain(ctx: AudioContext, init = 1): ControllableModule {
  const node = ctx.createGain();
  node.gain.value = init;
  const params: readonly ParamSpec[] = [
    { name: 'value', kind: 'continuous', min: 0, max: 4, default: init, unit: '' },
  ];
  return {
    input: node, output: node, params,
    set(name, value, opts) {
      if (name !== 'value' || typeof value !== 'number') return;
      rampParam(ctx, node.gain, value, opts);
    },
    dispose: () => { try { node.disconnect(); } catch { /* idempotent */ } },
  };
}

// ── panner (StereoPanner) ────────────────────────────────────────

export function panner(ctx: AudioContext, init = 0): ControllableModule {
  const node = ctx.createStereoPanner();
  node.pan.value = init;
  const params: readonly ParamSpec[] = [
    { name: 'pan', kind: 'continuous', min: -1, max: 1, default: init, unit: '' },
  ];
  return {
    input: node, output: node, params,
    set(name, value, opts) {
      if (name !== 'pan' || typeof value !== 'number') return;
      rampParam(ctx, node.pan, value, opts);
    },
    dispose: () => { try { node.disconnect(); } catch { /* idempotent */ } },
  };
}

// ── biquad (lp / hp / bp) ────────────────────────────────────────
//
// One factory shared by lowpass / highpass / bandpass — the only
// difference is the default biquad type, which the discrete `mode`
// param can flip at runtime.

const FILTER_TYPES = ['lowpass', 'highpass', 'bandpass'] as const;
type FilterMode = typeof FILTER_TYPES[number];

function biquad(
  ctx: AudioContext,
  initType: FilterMode,
  initFreq: number,
  initQ: number,
): ControllableModule {
  const node = ctx.createBiquadFilter();
  node.type = initType;
  node.frequency.value = initFreq;
  node.Q.value = initQ;
  const params: readonly ParamSpec[] = [
    { name: 'cutoff', kind: 'continuous', min: 20, max: 20000, default: initFreq, unit: 'Hz' },
    { name: 'q',      kind: 'continuous', min: 0.1, max: 24,   default: initQ,    unit: '' },
    { name: 'mode',   kind: 'discrete',   options: FILTER_TYPES, default: initType },
  ];
  return {
    input: node, output: node, params,
    set(name, value, opts) {
      if (name === 'cutoff' && typeof value === 'number') {
        rampParam(ctx, node.frequency, value, opts);
      } else if (name === 'q' && typeof value === 'number') {
        rampParam(ctx, node.Q, value, opts);
      } else if (name === 'mode' && typeof value === 'string'
                 && (FILTER_TYPES as readonly string[]).includes(value)) {
        node.type = value as FilterMode;
      }
    },
    dispose: () => { try { node.disconnect(); } catch { /* idempotent */ } },
  };
}

export const lowpass  = (ctx: AudioContext, fc = 1200, q = 0.7): ControllableModule => biquad(ctx, 'lowpass',  fc, q);
export const highpass = (ctx: AudioContext, fc = 200,  q = 0.7): ControllableModule => biquad(ctx, 'highpass', fc, q);
export const bandpass = (ctx: AudioContext, fc = 1000, q = 1.0): ControllableModule => biquad(ctx, 'bandpass', fc, q);

// ── delay ────────────────────────────────────────────────────────
//
// Delay line + feedback, with wet/dry mix and time/feedback knobs.
// Internal layout:
//   in → dry → out
//      ↘ wet → delay ↘ → out
//                 ↻ feedback (capped)

export function delay(
  ctx: AudioContext,
  initTime = 0.25,
  initFeedback = 0.35,
  initWet = 0.5,
  maxTime = 2.0,
): ControllableModule {
  const inG = ctx.createGain();
  const dry = ctx.createGain();
  const sendWet = ctx.createGain();
  sendWet.gain.value = initWet;
  const line = ctx.createDelay(maxTime);
  line.delayTime.value = initTime;
  const fb = ctx.createGain();
  fb.gain.value = initFeedback;
  const out = ctx.createGain();

  inG.connect(dry).connect(out);
  inG.connect(sendWet).connect(line);
  line.connect(fb).connect(line);
  line.connect(out);

  const params: readonly ParamSpec[] = [
    { name: 'time',     kind: 'continuous', min: 0.02, max: maxTime, default: initTime,     unit: 's' },
    { name: 'feedback', kind: 'continuous', min: 0,    max: 0.7,     default: initFeedback, unit: '' },
    { name: 'wet',      kind: 'continuous', min: 0,    max: 1,       default: initWet,      unit: '' },
  ];
  return {
    input: inG, output: out, params,
    set(name, value, opts) {
      if (typeof value !== 'number') return;
      if (name === 'time') rampParam(ctx, line.delayTime, value, { ...opts, ramp: opts?.ramp ?? 0.03 });
      else if (name === 'feedback') rampParam(ctx, fb.gain, Math.max(0, Math.min(0.7, value)), opts);
      else if (name === 'wet') rampParam(ctx, sendWet.gain, value, opts);
    },
    dispose: () => {
      for (const n of [inG, dry, sendWet, line, fb, out]) {
        try { n.disconnect(); } catch { /* idempotent */ }
      }
    },
  };
}

// ── shaper (waveshaper for overdrive / bitcrush / etc) ───────────
//
// Curve is structural — swapping it requires building a new
// Float32Array. Set 'curve' with the structural ParamSpec — caller
// passes the curve as a stringified id ("soft" | "hard" | "fold")
// and the module picks the corresponding curve. Custom curves can
// also be supplied to the factory.

export type ShaperCurveBuilder = (length: number) => Float32Array<ArrayBuffer>;

// Each builder returns Float32Array<ArrayBuffer> explicitly — strict
// TS5+ distinguishes it from SharedArrayBuffer and WaveShaper.curve
// only accepts the former. Same pattern as runtime/colorFx.ts.
const CURVE_BUILDERS: Record<string, ShaperCurveBuilder> = {
  soft: (n): Float32Array<ArrayBuffer> => {
    const c = new Float32Array(new ArrayBuffer(n * 4));
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      c[i] = Math.tanh(x * 2);
    }
    return c;
  },
  hard: (n): Float32Array<ArrayBuffer> => {
    const c = new Float32Array(new ArrayBuffer(n * 4));
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      c[i] = Math.max(-0.85, Math.min(0.85, x * 1.6));
    }
    return c;
  },
  fold: (n): Float32Array<ArrayBuffer> => {
    const c = new Float32Array(new ArrayBuffer(n * 4));
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      c[i] = Math.sin(x * Math.PI);
    }
    return c;
  },
};

export const SHAPER_CURVES = Object.keys(CURVE_BUILDERS);

export function shaper(
  ctx: AudioContext,
  initCurve: keyof typeof CURVE_BUILDERS = 'soft',
  oversample: OverSampleType = '4x',
  length = 2048,
): ControllableModule {
  const node = ctx.createWaveShaper();
  node.curve = CURVE_BUILDERS[initCurve](length);
  node.oversample = oversample;
  const params: readonly ParamSpec[] = [
    { name: 'curve', kind: 'structural', options: SHAPER_CURVES, default: initCurve },
  ];
  return {
    input: node, output: node, params,
    set(name, value) {
      if (name !== 'curve' || typeof value !== 'string') return;
      const builder = CURVE_BUILDERS[value];
      if (builder) node.curve = builder(length);
    },
    dispose: () => { try { node.disconnect(); } catch { /* idempotent */ } },
  };
}
