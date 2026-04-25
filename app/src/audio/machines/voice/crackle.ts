// Crackle voice — random bursts of short filtered noise scattered
// across the trigger window. Density controls how many events fire;
// each event is a tiny exponential-decay noise hit through a shared
// bandpass. Vinyl, fire, rain, lo-fi atmosphere, percussive stutter.

import { z } from 'zod';
import type { KnobSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { createBiquad, createGain, createNoise } from '../_shared/audio';

const KNOBS = [
  { id: 'density', label: 'Density', min: 4,    max: 60,    default: 18,  curve: 'exp', unit: '/win' },
  { id: 'cutoff',  label: 'Cutoff',  min: 200,  max: 12000, default: 2200, curve: 'exp', unit: 'Hz' },
  { id: 'q',       label: 'Q',       min: 0.5,  max: 8,     default: 2.5, curve: 'lin', unit: '' },
  { id: 'decay',   label: 'Decay',   min: 200,  max: 3000,  default: 800, curve: 'exp', unit: 'ms' },
  { id: 'pitch',   label: 'Boost',   min: 0,    max: 1,     default: 0,   curve: 'lin', unit: '%' },
] as const satisfies readonly KnobSpec[];

const CrackleConfigSchema = z.object({
  archetype: z.literal('crackle'),
  density:   z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  cutoff:    z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  q:         z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  decay:     z.number().min(KNOBS[3].min).max(KNOBS[3].max),
  pitch:     z.number().min(KNOBS[4].min).max(KNOBS[4].max),
});

export type CrackleConfig = z.infer<typeof CrackleConfigSchema>;

const DEFAULTS: CrackleConfig = {
  archetype: 'crackle', density: 18, cutoff: 2200, q: 2.5, decay: 800, pitch: 0,
};

export const CRACKLE_PRESETS: Record<string, Partial<CrackleConfig>> = {
  vinyl: { density: 24, cutoff: 4000, q: 1.5, decay: 1500, pitch: 0.0 },
  fire:  { density: 40, cutoff: 1800, q: 3.0, decay: 1200, pitch: 0.2 },
  rain:  { density: 35, cutoff: 6000, q: 2.0, decay: 2200, pitch: 0.0 },
  twigs: { density: 8,  cutoff: 1200, q: 4.0, decay: 600,  pitch: 0.4 },
  geiger:{ density: 15, cutoff: 8000, q: 5.0, decay: 1000, pitch: 0.3 },
};

export const Crackle: VoiceMachine<CrackleConfig> = {
  id: 'crackle',
  label: 'Crackle',
  category: 'voice',
  knobs: KNOBS,
  defaults: DEFAULTS,
  schema: CrackleConfigSchema,
  presets: CRACKLE_PRESETS,

  render(cfg: CrackleConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;
    const density = Math.round(knobValue(cfg, 'density', mod));
    const cutoff  = knobValue(cfg, 'cutoff', mod);
    const q       = knobValue(cfg, 'q', mod);
    const decay   = knobValue(cfg, 'decay', mod) / 1000;
    const pitch   = knobValue(cfg, 'pitch', mod);

    // Shared bandpass for all bursts so they share a sonic family.
    const filt = createBiquad(ctx);
    filt.type = 'bandpass';
    filt.frequency.value = cutoff;
    filt.Q.value = q + pitch * 4;

    const overall = createGain(ctx);
    // Amplitude window: triangular envelope over the full decay so
    // scattered events fade in and out, not all at once.
    overall.gain.setValueAtTime(0, when);
    overall.gain.linearRampToValueAtTime(amp * 0.55, when + decay * 0.2);
    overall.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    filt.connect(overall);
    overall.connect(destination);

    // Schedule density bursts at random times across decay.
    const burstDur = 0.012;
    for (let i = 0; i < density; i++) {
      const t = when + Math.random() * decay;
      const noise = createNoise(ctx, burstDur);
      const ng = createGain(ctx);
      ng.gain.setValueAtTime(0.6 + Math.random() * 0.4, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + burstDur);
      noise.connect(ng).connect(filt);
      noise.start(t);
      noise.stop(t + burstDur + 0.005);
    }
  },
};
