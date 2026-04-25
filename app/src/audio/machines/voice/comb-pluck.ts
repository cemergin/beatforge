// Karplus-Strong "comb-pluck" voice machine. A tiny excitation
// (noise → click → tone, crossfaded by the `excitation` knob) hits a
// delay-line-with-feedback whose loop time = 1/pitch. A LP inside
// the loop damps high frequencies so the tone settles into a clean
// pitched ring. The recipe of bell, plucked string, kalimba, scrape.

import { z } from 'zod';
import type { KnobSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { createBiquad, createGain, createNoise, createOsc } from '../_shared/audio';

const KNOBS = [
  { id: 'pitch',      label: 'Pitch',      min: 80,  max: 1500, default: 220, curve: 'exp', unit: 'Hz' },
  { id: 'feedback',   label: 'Feedback',   min: 0.5, max: 0.99, default: 0.92, curve: 'lin', unit: '%' },
  { id: 'damping',    label: 'Damping',    min: 500, max: 12000, default: 4000, curve: 'exp', unit: 'Hz' },
  { id: 'excitation', label: 'Excitation', min: 0,   max: 1,    default: 0.3, curve: 'lin', unit: '%' },
  { id: 'decay',      label: 'Decay',      min: 100, max: 4000, default: 1200, curve: 'exp', unit: 'ms' },
] as const satisfies readonly KnobSpec[];

const CombPluckConfigSchema = z.object({
  archetype:  z.literal('comb-pluck'),
  pitch:      z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  feedback:   z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  damping:    z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  excitation: z.number().min(KNOBS[3].min).max(KNOBS[3].max),
  decay:      z.number().min(KNOBS[4].min).max(KNOBS[4].max),
});

export type CombPluckConfig = z.infer<typeof CombPluckConfigSchema>;

const DEFAULTS: CombPluckConfig = {
  archetype: 'comb-pluck',
  pitch: 220, feedback: 0.92, damping: 4000, excitation: 0.3, decay: 1200,
};

export const COMB_PLUCK_PRESETS: Record<string, Partial<CombPluckConfig>> = {
  string:   { pitch: 220, feedback: 0.94, damping: 4500, excitation: 0.0, decay: 1500 },
  kalimba:  { pitch: 440, feedback: 0.88, damping: 6000, excitation: 0.5, decay: 800 },
  tubular:  { pitch: 330, feedback: 0.97, damping: 3000, excitation: 0.85, decay: 3000 },
  scrape:   { pitch: 600, feedback: 0.85, damping: 1800, excitation: 0.05, decay: 600 },
  mbira:    { pitch: 580, feedback: 0.86, damping: 5000, excitation: 0.55, decay: 700 },
  tank:     { pitch: 280, feedback: 0.93, damping: 2400, excitation: 0.7, decay: 2000 },
};

export const CombPluck: VoiceMachine<CombPluckConfig> = {
  id: 'comb-pluck',
  label: 'Comb pluck',
  category: 'voice',
  knobs: KNOBS,
  defaults: DEFAULTS,
  schema: CombPluckConfigSchema,
  presets: COMB_PLUCK_PRESETS,

  render(cfg: CombPluckConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;
    const pitch      = knobValue(cfg, 'pitch', mod);
    const feedback   = knobValue(cfg, 'feedback', mod);
    const damping    = knobValue(cfg, 'damping', mod);
    const excitation = knobValue(cfg, 'excitation', mod);
    const decay      = knobValue(cfg, 'decay', mod) / 1000;

    const delayTime = 1 / pitch;

    // Loop: delay → fb gain → LP filter → back into delay.
    const delay = ctx.createDelay(0.05);
    delay.delayTime.value = delayTime;
    const fb = createGain(ctx);
    fb.gain.value = feedback;
    const lp = createBiquad(ctx);
    lp.type = 'lowpass';
    lp.frequency.value = damping;
    lp.Q.value = 0.5;
    delay.connect(lp).connect(fb).connect(delay);

    // Output amp envelope (limits ringing length to `decay`).
    const env = createGain(ctx);
    env.gain.setValueAtTime(amp * 0.6, when);
    env.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    delay.connect(env);
    env.connect(destination);

    // Excitation: crossfade noise (0) → click (0.5) → short tone (1).
    const excitDuration = 0.012;
    const excitGain = createGain(ctx);
    excitGain.gain.setValueAtTime(amp * 0.8, when);
    excitGain.gain.exponentialRampToValueAtTime(0.0001, when + excitDuration);
    excitGain.connect(delay);

    // Noise contribution: 1 - excitation (max at excitation=0).
    const noiseAmt = Math.max(0, 1 - 2 * excitation);
    if (noiseAmt > 0) {
      const noise = createNoise(ctx, excitDuration + 0.005);
      const ng = createGain(ctx);
      ng.gain.value = noiseAmt;
      noise.connect(ng).connect(excitGain);
      noise.start(when);
      noise.stop(when + excitDuration + 0.005);
    }
    // Tone contribution: excitation, max at excitation=1.
    const toneAmt = Math.max(0, 2 * excitation - 1);
    if (toneAmt > 0) {
      const osc = createOsc(ctx);
      osc.type = 'sine';
      osc.frequency.value = pitch;
      const og = createGain(ctx);
      og.gain.value = toneAmt;
      osc.connect(og).connect(excitGain);
      osc.start(when);
      osc.stop(when + excitDuration + 0.005);
    }
    // Click: peaks at excitation=0.5, fades at the extremes.
    const clickAmt = 1 - Math.abs(excitation - 0.5) * 2;
    if (clickAmt > 0) {
      const click = createOsc(ctx);
      click.type = 'square';
      click.frequency.value = pitch * 4;
      const cg = createGain(ctx);
      cg.gain.value = clickAmt * 0.4;
      click.connect(cg).connect(excitGain);
      click.start(when);
      click.stop(when + 0.003);
    }
  },
};
