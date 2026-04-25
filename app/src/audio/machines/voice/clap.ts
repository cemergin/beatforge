// Clap voice machine — stacked filtered-noise bursts for the
// classic 808-CP clap sound. Multiple short bursts with a small time
// offset gives the "ensemble" feel; the long final burst becomes the
// tail.

import { z } from 'zod';
import type { KnobSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { createBiquad, createGain, createNoise } from '../_shared/audio';

const KNOBS = [
  { id: 'density', label: 'Bursts',  min: 2,    max: 6,    default: 4,    curve: 'lin', unit: '' },
  { id: 'spread',  label: 'Spread',  min: 5,    max: 40,   default: 12,   curve: 'exp', unit: 'ms' },
  { id: 'decay',   label: 'Decay',   min: 100,  max: 1500, default: 350,  curve: 'exp', unit: 'ms' },
  { id: 'cutoff',  label: 'Cutoff',  min: 500,  max: 5000, default: 1400, curve: 'exp', unit: 'Hz' },
  { id: 'pitch',   label: 'Tone',    min: 0,    max: 1,    default: 0.5,  curve: 'lin', unit: '%' },
] as const satisfies readonly KnobSpec[];

const ClapConfigSchema = z.object({
  archetype: z.literal('clap'),
  density:   z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  spread:    z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  decay:     z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  cutoff:    z.number().min(KNOBS[3].min).max(KNOBS[3].max),
  pitch:     z.number().min(KNOBS[4].min).max(KNOBS[4].max),
});

export type ClapConfig = z.infer<typeof ClapConfigSchema>;

const DEFAULTS: ClapConfig = {
  archetype: 'clap', density: 4, spread: 12, decay: 350, cutoff: 1400, pitch: 0.5,
};

export const CLAP_PRESETS: Record<string, Partial<ClapConfig>> = {
  '808':  { density: 4, spread: 12, decay: 350, cutoff: 1400, pitch: 0.5 },
  finger: { density: 1, spread: 0,  decay: 80,  cutoff: 2400, pitch: 0.7 },
  slap:   { density: 2, spread: 8,  decay: 180, cutoff: 800,  pitch: 0.4 },
  hands:  { density: 6, spread: 20, decay: 500, cutoff: 1100, pitch: 0.3 },
};

export const Clap: VoiceMachine<ClapConfig> = {
  id: 'clap',
  label: 'Clap',
  category: 'voice',
  knobs: KNOBS,
  defaults: DEFAULTS,
  schema: ClapConfigSchema,
  presets: CLAP_PRESETS,

  render(cfg: ClapConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;
    const density = Math.round(knobValue(cfg, 'density', mod));
    const spread  = knobValue(cfg, 'spread', mod) / 1000;
    const decay   = knobValue(cfg, 'decay', mod) / 1000;
    const cutoff  = knobValue(cfg, 'cutoff', mod);
    const pitch   = knobValue(cfg, 'pitch', mod);

    // Filter that all bursts share — bandpass tuned to `cutoff`,
    // brightened by `pitch`.
    const filt = createBiquad(ctx);
    filt.type = 'bandpass';
    filt.frequency.value = cutoff + pitch * 800;
    filt.Q.value = 0.6 + pitch * 1.5;

    // First (density-1) bursts are short; the final burst carries the tail.
    for (let i = 0; i < density; i++) {
      const isLast = i === density - 1;
      const burstDecay = isLast ? decay : 0.018;
      const t = when + i * spread;
      const noise = createNoise(ctx, burstDecay + 0.03);
      const env = createGain(ctx);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(amp * (isLast ? 0.6 : 0.45), t + 0.001);
      env.gain.exponentialRampToValueAtTime(0.0001, t + burstDecay);
      noise.connect(filt).connect(env);
      env.connect(destination);
      noise.start(t);
      noise.stop(t + burstDecay + 0.02);
    }
  },
};
