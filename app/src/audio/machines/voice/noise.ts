// Pure filtered noise voice. The simplest archetype but the most
// versatile — wind, breath, surf, white-noise riser, shaker, sweep.
// `pitch` adds a resonant boost ridable for tonal-noise effects.

import { z } from 'zod';
import type { DiscreteSpec, KnobSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { ampEnvelope, createBiquad, createNoise } from '../_shared/audio';

const KNOBS = [
  { id: 'cutoff', label: 'Cutoff', min: 100, max: 16000, default: 4000, curve: 'exp', unit: 'Hz' },
  { id: 'q',      label: 'Q',      min: 0.1, max: 12,    default: 1.0,  curve: 'lin', unit: '' },
  { id: 'decay',  label: 'Decay',  min: 30,  max: 3000,  default: 400,  curve: 'exp', unit: 'ms' },
  { id: 'pitch',  label: 'Boost',  min: 0,   max: 1,     default: 0.0,  curve: 'lin', unit: '%' },
] as const satisfies readonly KnobSpec[];

const DISCRETE = [
  { id: 'filter', label: 'Filter', options: ['lp', 'bp', 'hp'] as const, default: 'bp' as const },
] as const satisfies readonly DiscreteSpec[];

const NoiseConfigSchema = z.object({
  archetype: z.literal('noise'),
  cutoff:    z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  q:         z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  decay:     z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  pitch:     z.number().min(KNOBS[3].min).max(KNOBS[3].max),
  filter:    z.enum(['lp', 'bp', 'hp']),
});

export type NoiseConfig = z.infer<typeof NoiseConfigSchema>;

const DEFAULTS: NoiseConfig = {
  archetype: 'noise', cutoff: 4000, q: 1.0, decay: 400, pitch: 0, filter: 'bp',
};

export const NOISE_PRESETS: Record<string, Partial<NoiseConfig>> = {
  shaker:  { cutoff: 5500, q: 1.5,  decay: 200,  pitch: 0.2, filter: 'bp' },
  rainfall:{ cutoff: 2200, q: 0.5,  decay: 1200, pitch: 0.0, filter: 'bp' },
  wind:    { cutoff: 600,  q: 2.0,  decay: 2000, pitch: 0.4, filter: 'bp' },
  surf:    { cutoff: 8000, q: 0.4,  decay: 1500, pitch: 0.0, filter: 'lp' },
  riser:   { cutoff: 3000, q: 4.0,  decay: 1800, pitch: 0.6, filter: 'bp' },
  breath:  { cutoff: 4500, q: 0.6,  decay: 600,  pitch: 0.1, filter: 'hp' },
};

export const Noise: VoiceMachine<NoiseConfig> = {
  id: 'noise',
  label: 'Shaker',
  category: 'voice',
  knobs: KNOBS,
  discrete: DISCRETE,
  defaults: DEFAULTS,
  schema: NoiseConfigSchema,
  presets: NOISE_PRESETS,

  render(cfg: NoiseConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;
    const cutoff = knobValue(cfg, 'cutoff', mod);
    const q      = knobValue(cfg, 'q', mod);
    const decay  = knobValue(cfg, 'decay', mod) / 1000;
    const pitch  = knobValue(cfg, 'pitch', mod);

    const noise = createNoise(ctx, decay + 0.05);
    const filt = createBiquad(ctx);
    filt.type = cfg.filter === 'lp' ? 'lowpass' : cfg.filter === 'hp' ? 'highpass' : 'bandpass';
    filt.frequency.value = cutoff;
    // `pitch` boost: increase Q + nudge cutoff up so the filter
    // resonates more, giving a "tonal" ring through the noise.
    filt.Q.value = q + pitch * 6;
    const env = ampEnvelope(ctx, when, amp * 0.6, 0.005, decay);
    noise.connect(filt).connect(env);
    env.connect(destination);
    noise.start(when);
    noise.stop(when + decay + 0.02);
  },
};
