// Filter — biquad with selectable mode (lp/hp/bp). All params live;
// no rebuild. Mode is a discrete instant switch (BiquadFilterNode
// supports type changes between samples without click).
//
//   input → dry ───────────────────┐
//         → biquad → wet ──────────┴→ output

import type { ControllableModule, ParamSpec } from '../../../modules/audio-graph';
import { rampParam } from './_shared';

const MODES = ['lp', 'hp', 'bp'] as const;
type FilterMode = typeof MODES[number];

const PARAMS: readonly ParamSpec[] = [
  { name: 'mode',   kind: 'discrete',   options: MODES, default: 'lp' },
  { name: 'cutoff', kind: 'continuous', min: 50, max: 12000, default: 1200, unit: 'Hz' },
  { name: 'q',      kind: 'continuous', min: 0.1, max: 12,   default: 1,    unit: '' },
  { name: 'mix',    kind: 'continuous', min: 0, max: 1,      default: 0.8,  unit: '' },
];

export interface FilterInit {
  mode?: FilterMode;
  cutoff?: number;
  q?: number;
  mix?: number;
}

function biquadType(m: FilterMode): BiquadFilterType {
  if (m === 'lp') return 'lowpass';
  if (m === 'hp') return 'highpass';
  return 'bandpass';
}

export function createFilter(
  ctx: AudioContext,
  init: FilterInit = {},
): ControllableModule {
  const mode   = init.mode   ?? 'lp';
  const cutoff = init.cutoff ?? 1200;
  const q      = init.q      ?? 1;
  const mix    = init.mix    ?? 0.8;

  const inG = ctx.createGain();
  const out = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  dry.gain.value = 1 - mix;
  wet.gain.value = mix;

  const filter = ctx.createBiquadFilter();
  filter.type = biquadType(mode);
  filter.frequency.value = cutoff;
  filter.Q.value = q;

  inG.connect(dry).connect(out);
  inG.connect(filter).connect(wet).connect(out);

  return {
    input: inG,
    output: out,
    params: PARAMS,
    set(name, value, opts) {
      if (name === 'mode' && typeof value === 'string'
          && (MODES as readonly string[]).includes(value)) {
        filter.type = biquadType(value as FilterMode);
      } else if (typeof value === 'number') {
        if (name === 'cutoff') rampParam(ctx, filter.frequency, value, opts);
        else if (name === 'q') rampParam(ctx, filter.Q, value, opts);
        else if (name === 'mix') {
          rampParam(ctx, dry.gain, 1 - value, opts);
          rampParam(ctx, wet.gain, value, opts);
        }
      }
    },
    dispose() {
      for (const n of [inG, dry, wet, filter, out]) {
        try { n.disconnect(); } catch { /* idempotent */ }
      }
    },
  };
}
