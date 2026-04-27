// Delay — single-tap delay line with capped feedback + master wet.
//
//   input → delayLine → wet → output
//                ↻ feedback (capped at 0.7)
//
// time / feedback / wet are continuous (linear ramps). `time` uses
// a longer ramp than the default to avoid pitch chirps when the
// delay-line read head moves. Feedback is hard-capped to keep the
// loop from self-oscillating across automated parameter sweeps.

import type { ControllableModule, ParamSpec } from '../../../modules/audio-graph';
import { rampParam } from './_shared';

const PARAMS: readonly ParamSpec[] = [
  { name: 'wet',      kind: 'continuous', min: 0,    max: 1,   default: 0.5,  unit: '' },
  { name: 'time',     kind: 'continuous', min: 0.02, max: 2.0, default: 0.25, unit: 's' },
  { name: 'feedback', kind: 'continuous', min: 0,    max: 0.7, default: 0.35, unit: '' },
];

export interface DelayInit {
  wet?: number;
  time?: number;
  feedback?: number;
  /** Maximum delay-line length, hard cap. Default 2.0 s. */
  maxTime?: number;
}

export function createDelayFx(
  ctx: AudioContext,
  init: DelayInit = {},
): ControllableModule {
  const wet      = init.wet      ?? 0.5;
  const time     = init.time     ?? 0.25;
  const feedback = init.feedback ?? 0.35;
  const maxTime  = init.maxTime  ?? 2.0;

  const inG = ctx.createGain();
  const line = ctx.createDelay(maxTime);
  line.delayTime.value = Math.max(0.02, Math.min(maxTime, time));
  const fb = ctx.createGain();
  fb.gain.value = Math.max(0, Math.min(0.7, feedback));
  const wetG = ctx.createGain();
  wetG.gain.value = wet;

  inG.connect(line);
  line.connect(fb).connect(line);
  line.connect(wetG);

  return {
    input: inG,
    output: wetG,
    params: PARAMS,
    set(name, value, opts) {
      if (typeof value !== 'number') return;
      if (name === 'time') {
        rampParam(ctx, line.delayTime,
          Math.max(0.02, Math.min(maxTime, value)),
          { ...opts, ramp: opts?.ramp ?? 0.03 });
      } else if (name === 'feedback') {
        rampParam(ctx, fb.gain, Math.max(0, Math.min(0.7, value)), opts);
      } else if (name === 'wet') {
        rampParam(ctx, wetG.gain, Math.max(0, Math.min(1, value)), opts);
      }
    },
    dispose() {
      for (const n of [inG, line, fb, wetG]) {
        try { n.disconnect(); } catch { /* idempotent */ }
      }
    },
  };
}
