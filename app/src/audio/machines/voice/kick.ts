// Kick voice machine — pitch sweep + optional click transient.
// Covers 808/909/707 kicks, sub-kick, dub kick.
//
// Synthesis recipe (matches the legacy 808/909/707 kick voices in
// audio/kits/drum-machine.ts but parameterized as data):
//   1. One sine oscillator pitched at `pitch`, exp-ramped to `pitchEnd`
//      over `pitchDecay` ms (the "thump").
//   2. Linear-attack / exp-decay amp envelope with `decay` ms tail.
//   3. Optional `click` (0..1) layer: short square burst at 2.4 kHz
//      mixed under the body. 0 = pure 808 sine; 1 = aggressive 909
//      transient.

import { z } from 'zod';
import type { KnobSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { ampEnvelope, createGain, createOsc } from '../_shared/audio';

const KNOBS = [
  { id: 'pitch',      label: 'Pitch',       min: 30,  max: 400,  default: 150, curve: 'exp', unit: 'Hz' },
  { id: 'pitchEnd',   label: 'Pitch End',   min: 20,  max: 200,  default: 40,  curve: 'exp', unit: 'Hz' },
  { id: 'pitchDecay', label: 'Pitch Decay', min: 5,   max: 500,  default: 80,  curve: 'exp', unit: 'ms' },
  { id: 'decay',      label: 'Decay',       min: 50,  max: 2000, default: 600, curve: 'exp', unit: 'ms' },
  { id: 'click',      label: 'Click',       min: 0,   max: 1,    default: 0,   curve: 'lin', unit: '%' },
] as const satisfies readonly KnobSpec[];

const KickConfigSchema = z.object({
  archetype: z.literal('kick'),
  pitch:      z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  pitchEnd:   z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  pitchDecay: z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  decay:      z.number().min(KNOBS[3].min).max(KNOBS[3].max),
  click:      z.number().min(KNOBS[4].min).max(KNOBS[4].max),
});

export type KickConfig = z.infer<typeof KickConfigSchema>;

const DEFAULTS: KickConfig = {
  archetype: 'kick',
  pitch: 150, pitchEnd: 40, pitchDecay: 80, decay: 600, click: 0,
};

/** Knob-value bundles matching the existing built-in kit voices.
 *  Phase 2 will reference these when migrating the 808/909/707 kits. */
export const KICK_PRESETS: Record<string, Partial<KickConfig>> = {
  '808': { pitch: 150, pitchEnd: 40, pitchDecay: 80, decay: 600, click: 0 },
  '909': { pitch: 180, pitchEnd: 42, pitchDecay: 80, decay: 350, click: 0.4 },
  '707': { pitch: 140, pitchEnd: 55, pitchDecay: 80, decay: 280, click: 0.3 },
  sub:   { pitch: 90,  pitchEnd: 30, pitchDecay: 120, decay: 900, click: 0 },
  punch: { pitch: 200, pitchEnd: 60, pitchDecay: 40, decay: 250, click: 0.6 },
};

export const Kick: VoiceMachine<KickConfig> = {
  id: 'kick',
  label: 'Kick',
  category: 'voice',
  knobs: KNOBS,
  defaults: DEFAULTS,
  schema: KickConfigSchema,
  presets: KICK_PRESETS,

  render(cfg: KickConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;

    const pitch      = knobValue(cfg, 'pitch', mod);
    const pitchEnd   = knobValue(cfg, 'pitchEnd', mod);
    const pitchDecay = knobValue(cfg, 'pitchDecay', mod) / 1000;
    const decay      = knobValue(cfg, 'decay', mod) / 1000;
    const click      = knobValue(cfg, 'click', mod);

    // Body: sine sweep + amp envelope.
    const osc = createOsc(ctx);
    osc.frequency.setValueAtTime(pitch, when);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(0.0001, pitchEnd),
      when + pitchDecay,
    );
    const env = ampEnvelope(ctx, when, amp * 1.1, 0.003, decay);
    osc.connect(env);
    env.connect(destination);
    osc.start(when);
    osc.stop(when + decay + 0.05);

    // Click: optional 2.4 kHz square burst layered with the body.
    if (click > 0) {
      const tick = createOsc(ctx);
      tick.type = 'square';
      tick.frequency.value = 2400;
      const cg = createGain(ctx);
      cg.gain.setValueAtTime(amp * 0.2 * click, when);
      cg.gain.exponentialRampToValueAtTime(0.0001, when + 0.01);
      tick.connect(cg);
      cg.connect(destination);
      tick.start(when);
      tick.stop(when + 0.02);
    }
  },
};
