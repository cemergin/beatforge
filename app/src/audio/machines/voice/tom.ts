// Tom voice machine — pitch sweep without the click transient. Sits
// between kick (deep + clicky) and a clean melodic perc voice.

import { z } from 'zod';
import type { KnobSpec, DiscreteSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { ampEnvelope, createOsc } from '../_shared/audio';

const KNOBS = [
  { id: 'pitch',    label: 'Pitch',     min: 60,  max: 600,  default: 200, curve: 'exp', unit: 'Hz' },
  { id: 'pitchEnd', label: 'Pitch End', min: 40,  max: 400,  default: 110, curve: 'exp', unit: 'Hz' },
  { id: 'decay',    label: 'Decay',     min: 100, max: 2500, default: 700, curve: 'exp', unit: 'ms' },
  { id: 'tone',     label: 'Tone',      min: 0,   max: 1,    default: 0.2, curve: 'lin', unit: '%' },
] as const satisfies readonly KnobSpec[];

const DISCRETE = [
  { id: 'wave', label: 'Wave', options: ['sine', 'triangle'] as const, default: 'sine' as const },
] as const satisfies readonly DiscreteSpec[];

const TomConfigSchema = z.object({
  archetype: z.literal('tom'),
  pitch:     z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  pitchEnd:  z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  decay:     z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  tone:      z.number().min(KNOBS[3].min).max(KNOBS[3].max),
  wave:      z.enum(['sine', 'triangle']),
});

export type TomConfig = z.infer<typeof TomConfigSchema>;

const DEFAULTS: TomConfig = {
  archetype: 'tom', pitch: 200, pitchEnd: 110, decay: 700, tone: 0.2, wave: 'sine',
};

export const TOM_PRESETS: Record<string, Partial<TomConfig>> = {
  low:     { pitch: 130, pitchEnd: 70,  decay: 900, tone: 0.15, wave: 'sine' },
  mid:     { pitch: 200, pitchEnd: 110, decay: 700, tone: 0.2,  wave: 'sine' },
  high:    { pitch: 290, pitchEnd: 170, decay: 500, tone: 0.25, wave: 'sine' },
  bongo:   { pitch: 400, pitchEnd: 220, decay: 300, tone: 0.5,  wave: 'triangle' },
  octban:  { pitch: 220, pitchEnd: 200, decay: 350, tone: 0.4,  wave: 'triangle' },
  // World — hand drums via the tom model. Pitched membrane voices.
  conga:   { pitch: 320, pitchEnd: 230, decay: 380, tone: 0.45, wave: 'sine' },
  djembe:  { pitch: 260, pitchEnd: 150, decay: 420, tone: 0.3,  wave: 'sine' },
  talking: { pitch: 240, pitchEnd: 360, decay: 500, tone: 0.5,  wave: 'sine' },
};

export const Tom: VoiceMachine<TomConfig> = {
  id: 'tom',
  label: 'Tom',
  category: 'voice',
  knobs: KNOBS,
  discrete: DISCRETE,
  defaults: DEFAULTS,
  schema: TomConfigSchema,
  presets: TOM_PRESETS,

  render(cfg: TomConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;
    const pitch    = knobValue(cfg, 'pitch', mod);
    const pitchEnd = knobValue(cfg, 'pitchEnd', mod);
    const decay    = knobValue(cfg, 'decay', mod) / 1000;
    const tone     = knobValue(cfg, 'tone', mod);

    const osc = createOsc(ctx);
    osc.type = cfg.wave;
    // Pitch sweep — softer than kick (no click), longer settle to
    // pitchEnd. Tone knob compresses the sweep range.
    const sweepEnd = pitchEnd + (pitch - pitchEnd) * tone;
    osc.frequency.setValueAtTime(pitch, when);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(0.0001, sweepEnd),
      when + Math.min(decay * 0.4, 0.25),
    );
    const env = ampEnvelope(ctx, when, amp * 0.95, 0.005, decay);
    osc.connect(env);
    env.connect(destination);
    osc.start(when);
    osc.stop(when + decay + 0.05);
  },
};
