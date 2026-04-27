// Reverb — convolver with a synthesized noise-burst impulse. wet
// is a continuous master-wet gain; size + decay are structural
// (rebuild the impulse buffer). Live during playback: tails already
// scheduled finish under the old buffer, so a swap doesn't click.
//
//   input → convolver → wet → output
//
// `input` is the bus the channel strips' reverb sends connect into;
// `output` is summed back to the master gain in SoundEngine.

import type { ControllableModule, ParamSpec } from '../../../modules/audio-graph';
import { makeReverbImpulse, rampParam } from './_shared';

const PARAMS: readonly ParamSpec[] = [
  { name: 'wet',   kind: 'continuous', min: 0,   max: 1,   default: 0.5, unit: '' },
  { name: 'size',  kind: 'structural', min: 0.3, max: 4,   default: 1.8, unit: 's' },
  { name: 'decay', kind: 'structural', min: 1,   max: 6,   default: 2.2, unit: '' },
];

export interface ReverbInit {
  wet?: number;
  size?: number;
  decay?: number;
}

export function createReverb(
  ctx: AudioContext,
  init: ReverbInit = {},
): ControllableModule {
  const wet   = init.wet   ?? 0.5;
  let   size  = init.size  ?? 1.8;
  let   decay = init.decay ?? 2.2;

  const inG = ctx.createGain();
  const conv = ctx.createConvolver();
  conv.buffer = makeReverbImpulse(ctx, size, decay);
  const wetG = ctx.createGain();
  wetG.gain.value = wet;

  inG.connect(conv).connect(wetG);

  return {
    input: inG,
    output: wetG,
    params: PARAMS,
    set(name, value, opts) {
      if (typeof value !== 'number') return;
      if (name === 'wet') {
        rampParam(ctx, wetG.gain, Math.max(0, Math.min(1, value)), opts);
      } else if (name === 'size') {
        size = Math.max(0.3, Math.min(4, value));
        conv.buffer = makeReverbImpulse(ctx, size, decay);
      } else if (name === 'decay') {
        decay = Math.max(1, Math.min(6, value));
        conv.buffer = makeReverbImpulse(ctx, size, decay);
      }
    },
    dispose() {
      for (const n of [inG, conv, wetG]) {
        try { n.disconnect(); } catch { /* idempotent */ }
      }
    },
  };
}
