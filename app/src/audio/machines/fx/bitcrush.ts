// Bitcrush — bits via WaveShaper quantization (structural, rebuilds
// curve when bits changes), `rate` simulates sample-rate reduction
// as an LP cutoff (live), mix wet/dry blend (live).
//
//   input → dry ───────────────────────────────┐
//         → shaper(quantize) → rateLP → wet ───┴→ output
//
// Bits is the only structural param — its curve must be rebuilt on
// change. The rebuild is cheap (one Float32Array fill) and audibly
// click-free because we replace `.curve` between samples.

import type { ControllableModule, ParamSpec } from '../../../modules/audio-graph';
import { bitcrushCurve, rampParam } from './_shared';

const PARAMS: readonly ParamSpec[] = [
  { name: 'bits', kind: 'structural', min: 1,   max: 16,    default: 8,    unit: 'bits' },
  { name: 'rate', kind: 'continuous', min: 100, max: 16000, default: 4000, unit: 'Hz' },
  { name: 'mix',  kind: 'continuous', min: 0,   max: 1,     default: 0.7,  unit: '' },
];

export interface BitcrushInit {
  bits?: number;
  rate?: number;
  mix?: number;
}

export function createBitcrush(
  ctx: AudioContext,
  init: BitcrushInit = {},
): ControllableModule {
  const bits = init.bits ?? 8;
  const rate = init.rate ?? 4000;
  const mix  = init.mix  ?? 0.7;

  const inG = ctx.createGain();
  const out = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  dry.gain.value = 1 - mix;
  wet.gain.value = mix;

  const shaper = ctx.createWaveShaper();
  shaper.curve = bitcrushCurve(bits);

  const rateLp = ctx.createBiquadFilter();
  rateLp.type = 'lowpass';
  rateLp.frequency.value = Math.max(200, Math.min(20000, rate));
  rateLp.Q.value = 0.5;

  inG.connect(dry).connect(out);
  inG.connect(shaper).connect(rateLp).connect(wet).connect(out);

  return {
    input: inG,
    output: out,
    params: PARAMS,
    set(name, value, opts) {
      if (typeof value !== 'number') return;
      if (name === 'bits') {
        // Structural — rebuild the curve. Discrete steps; small jumps
        // are audible but expected for bit reduction.
        shaper.curve = bitcrushCurve(Math.max(1, Math.min(16, Math.round(value))));
      } else if (name === 'rate') {
        rampParam(ctx, rateLp.frequency, Math.max(200, Math.min(20000, value)), opts);
      } else if (name === 'mix') {
        rampParam(ctx, dry.gain, 1 - value, opts);
        rampParam(ctx, wet.gain, value, opts);
      }
    },
    dispose() {
      for (const n of [inG, dry, wet, shaper, rateLp, out]) {
        try { n.disconnect(); } catch { /* idempotent */ }
      }
    },
  };
}
