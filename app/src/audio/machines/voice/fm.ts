// FM voice machine — 2-op frequency modulation (carrier + modulator).
// Iconic synthesis architecture: connect the modulator's output to
// the carrier's frequency parameter; the modulator's amplitude (the
// "index") sets how far the carrier's pitch swings. Different
// `ratio`s give wildly different timbres — small integer ratios are
// clean (kalimba, bell), non-integer ratios are clangy/inharmonic.

import { z } from 'zod';
import type { KnobSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { ampEnvelope, createGain, createOsc } from '../_shared/audio';

const KNOBS = [
  { id: 'pitch',    label: 'Pitch',    min: 80,   max: 1500, default: 440, curve: 'exp', unit: 'Hz' },
  { id: 'ratio',    label: 'Ratio',    min: 0.25, max: 8,    default: 2,   curve: 'lin', unit: '×' },
  { id: 'index',    label: 'Index',    min: 0,    max: 800,  default: 200, curve: 'exp', unit: 'Hz' },
  { id: 'decay',    label: 'Decay',    min: 50,   max: 3000, default: 600, curve: 'exp', unit: 'ms' },
  { id: 'feedback', label: 'Feedback', min: 0,    max: 0.9,  default: 0,   curve: 'lin', unit: '%' },
] as const satisfies readonly KnobSpec[];

const FmConfigSchema = z.object({
  archetype: z.literal('fm'),
  pitch:     z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  ratio:     z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  index:     z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  decay:     z.number().min(KNOBS[3].min).max(KNOBS[3].max),
  feedback:  z.number().min(KNOBS[4].min).max(KNOBS[4].max),
});

export type FmConfig = z.infer<typeof FmConfigSchema>;

const DEFAULTS: FmConfig = {
  archetype: 'fm', pitch: 440, ratio: 2, index: 200, decay: 600, feedback: 0,
};

export const FM_PRESETS: Record<string, Partial<FmConfig>> = {
  kalimba:    { pitch: 440, ratio: 3,    index: 250, decay: 500,  feedback: 0 },
  marimba:    { pitch: 330, ratio: 4,    index: 180, decay: 350,  feedback: 0 },
  glock:      { pitch: 880, ratio: 5,    index: 320, decay: 1200, feedback: 0 },
  bell:       { pitch: 540, ratio: 1.41, index: 600, decay: 2000, feedback: 0 },
  ep:         { pitch: 220, ratio: 7,    index: 90,  decay: 800,  feedback: 0 },
  metal:      { pitch: 350, ratio: 2.83, index: 700, decay: 600,  feedback: 0.5 },
  blip:       { pitch: 880, ratio: 1,    index: 100, decay: 80,   feedback: 0 },
  // World — plucked / struck pitched percussion.
  mbira:      { pitch: 440, ratio: 2,    index: 280, decay: 600,  feedback: 0 },
  saz:        { pitch: 300, ratio: 1,    index: 110, decay: 700,  feedback: 0.15 },
  oud:        { pitch: 200, ratio: 1,    index: 90,  decay: 600,  feedback: 0.1 },
  music_box:  { pitch: 660, ratio: 6,    index: 280, decay: 900,  feedback: 0 },
  sitar:      { pitch: 280, ratio: 2.41, index: 380, decay: 1200, feedback: 0.3 },
};

export const Fm: VoiceMachine<FmConfig> = {
  id: 'fm',
  label: 'Pluck',
  category: 'voice',
  knobs: KNOBS,
  defaults: DEFAULTS,
  schema: FmConfigSchema,
  presets: FM_PRESETS,

  render(cfg: FmConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;
    const pitch    = knobValue(cfg, 'pitch', mod);
    const ratio    = knobValue(cfg, 'ratio', mod);
    const index    = knobValue(cfg, 'index', mod);
    const decay    = knobValue(cfg, 'decay', mod) / 1000;
    const feedback = knobValue(cfg, 'feedback', mod);

    // Carrier — the audible oscillator we route to the destination.
    const carrier = createOsc(ctx);
    carrier.type = 'sine';
    carrier.frequency.value = pitch;

    // Modulator — its output drives the carrier's frequency. Amp
    // envelope on the modulator gain gives FM's "tine attack" → "pure
    // sine tail" behaviour as the index decays away.
    const modOsc = createOsc(ctx);
    modOsc.type = 'sine';
    modOsc.frequency.value = pitch * ratio;
    const modGain = createGain(ctx);
    modGain.gain.setValueAtTime(index, when);
    modGain.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    modOsc.connect(modGain);
    modGain.connect(carrier.frequency);

    // Optional self-feedback on modulator (DX7-style "FB" knob).
    if (feedback > 0) {
      const fbGain = createGain(ctx);
      fbGain.gain.value = feedback * pitch * ratio * 0.5;
      modOsc.connect(fbGain);
      fbGain.connect(modOsc.frequency);
    }

    const env = ampEnvelope(ctx, when, amp * 0.7, 0.003, decay);
    carrier.connect(env);
    env.connect(destination);

    carrier.start(when); modOsc.start(when);
    carrier.stop(when + decay + 0.05); modOsc.stop(when + decay + 0.05);
  },
};
