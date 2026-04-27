// Overdrive — soft-clip via a fixed tanh curve, with the `drive`
// knob ramping the input boost gain INTO that curve. Topology:
//
//   input → dry ─────────────────────────────────────────────┐
//         → driveBoost → shaper(tanh) → toneLP → trim → wet ─┴→ output
//
// Why fixed curve + variable boost: the legacy version rebuilt the
// WaveShaper.curve on every drive change, which clicks audibly during
// a knob drag. A fixed sharper-than-needed tanh + variable input gain
// produces nearly the same spectrum but with zero rebuilds. trim is
// a soft-knee gain compensator so dialing drive doesn't make the
// channel unilaterally louder.

import type { ControllableModule, ParamSpec } from '../../../modules/audio-graph';
import { rampParam, tanhCurve } from './_shared';

const PARAMS: readonly ParamSpec[] = [
  { name: 'drive', kind: 'continuous', min: 0,   max: 1,     default: 0.5,  unit: '' },
  { name: 'tone',  kind: 'continuous', min: 200, max: 12000, default: 4000, unit: 'Hz' },
  { name: 'mix',   kind: 'continuous', min: 0,   max: 1,     default: 0.7,  unit: '' },
];

export interface OverdriveInit {
  drive?: number;
  tone?: number;
  mix?: number;
}

/** Map drive 0..1 → input boost factor 1..13. Linear feels good here;
 *  the tanh curve is what gives the perceived nonlinear shape. */
function driveBoost(d: number): number {
  return 1 + Math.max(0, Math.min(1, d)) * 12;
}

/** Match the legacy trim formula so 0..1 drive doesn't blow up the
 *  channel level — RMS roughly cancels with this curve. */
function driveTrim(d: number): number {
  return 1 / Math.sqrt(1 + Math.max(0, Math.min(1, d)) * 6);
}

export function createOverdrive(
  ctx: AudioContext,
  init: OverdriveInit = {},
): ControllableModule {
  const drive = init.drive ?? 0.5;
  const tone  = init.tone  ?? 4000;
  const mix   = init.mix   ?? 0.7;

  const inG = ctx.createGain();
  const out = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  dry.gain.value = 1 - mix;
  wet.gain.value = mix;

  const boost = ctx.createGain();
  boost.gain.value = driveBoost(drive);

  const shaper = ctx.createWaveShaper();
  shaper.curve = tanhCurve(2048, 5);
  // 4× oversampling — tanh harmonics generate supersonic content
  // that aliases at 44.1k; oversample lets the post-LP catch it.
  shaper.oversample = '4x';

  const toneLp = ctx.createBiquadFilter();
  toneLp.type = 'lowpass';
  toneLp.frequency.value = tone;
  toneLp.Q.value = 0.5;

  const trim = ctx.createGain();
  trim.gain.value = driveTrim(drive);

  inG.connect(dry).connect(out);
  inG.connect(boost).connect(shaper).connect(toneLp).connect(trim).connect(wet).connect(out);

  return {
    input: inG,
    output: out,
    params: PARAMS,
    set(name, value, opts) {
      if (typeof value !== 'number') return;
      if (name === 'drive') {
        rampParam(ctx, boost.gain, driveBoost(value), opts);
        rampParam(ctx, trim.gain,  driveTrim(value),  opts);
      } else if (name === 'tone') {
        rampParam(ctx, toneLp.frequency, value, opts);
      } else if (name === 'mix') {
        rampParam(ctx, dry.gain, 1 - value, opts);
        rampParam(ctx, wet.gain, value, opts);
      }
    },
    dispose() {
      for (const n of [inG, dry, wet, boost, shaper, toneLp, trim, out]) {
        try { n.disconnect(); } catch { /* idempotent */ }
      }
    },
  };
}
