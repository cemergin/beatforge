// Hi-hat voice machine — filtered noise + envelope.
// Covers closed/open hats, shaker, sizzle ride, pedal hat. The
// `character` discrete selector picks between HP-only (cymbal-ish)
// and HP→BP cascade (more focused metallic edge).

import { z } from 'zod';
import type { DiscreteSpec, KnobSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { ampEnvelope, createBiquad, createNoise } from '../_shared/audio';

const KNOBS = [
  { id: 'cutoff', label: 'Cutoff', min: 1000, max: 16000, default: 7000, curve: 'exp', unit: 'Hz' },
  { id: 'q',      label: 'Q',      min: 0.1,  max: 10,    default: 0.7,  curve: 'lin', unit: '' },
  { id: 'decay',  label: 'Decay',  min: 10,   max: 600,   default: 50,   curve: 'exp', unit: 'ms' },
  { id: 'pitch',  label: 'Pitch',  min: 0,    max: 1,     default: 0.4,  curve: 'lin', unit: '%' },
] as const satisfies readonly KnobSpec[];

const DISCRETE = [
  { id: 'character', label: 'Character', options: ['hp', 'bp'] as const, default: 'hp' as const },
] as const satisfies readonly DiscreteSpec[];

const HatConfigSchema = z.object({
  archetype: z.literal('hat'),
  cutoff:    z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  q:         z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  decay:     z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  pitch:     z.number().min(KNOBS[3].min).max(KNOBS[3].max),
  character: z.enum(['hp', 'bp']),
});

export type HatConfig = z.infer<typeof HatConfigSchema>;

// Legacy 808/909/707 closed/open hats were always HP→BP cascade with
// HP=7kHz and BP center=10kHz. Presets default to `bp` to match.
// `hp`-only is the cleaner "swept noise" character — useful for
// shakers, less for cymbal-derived sounds.
const DEFAULTS: HatConfig = {
  archetype: 'hat',
  cutoff: 7000, q: 0.7, decay: 50, pitch: 0.75, character: 'bp',
};

export const HAT_PRESETS: Record<string, Partial<HatConfig>> = {
  closed: { cutoff: 7000, q: 0.7,  decay: 50,  pitch: 0.75, character: 'bp' },
  open:   { cutoff: 7000, q: 0.7,  decay: 320, pitch: 0.75, character: 'bp' },
  pedal:  { cutoff: 5500, q: 0.6,  decay: 80,  pitch: 0.6,  character: 'bp' },
  ride:   { cutoff: 9000, q: 0.5,  decay: 600, pitch: 0.85, character: 'bp' },
  shaker: { cutoff: 4500, q: 0.4,  decay: 120, pitch: 0.2,  character: 'hp' },
  sizzle: { cutoff: 8500, q: 0.6,  decay: 240, pitch: 0.9,  character: 'bp' },
  // World — frame & gourd shakers / jingles.
  riq:    { cutoff: 6500, q: 1.2,  decay: 220, pitch: 0.8,  character: 'bp' },
  caxixi: { cutoff: 3800, q: 0.6,  decay: 90,  pitch: 0.15, character: 'hp' },
  maraca: { cutoff: 5200, q: 0.5,  decay: 130, pitch: 0.25, character: 'hp' },
};

export const Hat: VoiceMachine<HatConfig> = {
  id: 'hat',
  label: 'Hi-hat',
  category: 'voice',
  knobs: KNOBS,
  discrete: DISCRETE,
  defaults: DEFAULTS,
  schema: HatConfigSchema,
  presets: HAT_PRESETS,

  render(cfg: HatConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;

    const cutoff = knobValue(cfg, 'cutoff', mod);
    const q      = knobValue(cfg, 'q', mod);
    const decay  = knobValue(cfg, 'decay', mod) / 1000;
    const pitch  = knobValue(cfg, 'pitch', mod);

    const noise = createNoise(ctx, decay + 0.05);

    // Filter cascade. `hp` = HP only (broad cymbal); `bp` = HP→BP for
    // tighter metallic edge.
    const hp = createBiquad(ctx);
    hp.type = 'highpass';
    hp.frequency.value = cutoff;
    hp.Q.value = q;
    let tail: AudioNode = hp;
    if (cfg.character === 'bp') {
      const bp = createBiquad(ctx);
      bp.type = 'bandpass';
      // BP center scales with the pitch knob — gives "metallic boost"
      // when the user dials pitch up.
      bp.frequency.value = cutoff + pitch * 4000;
      bp.Q.value = q * 1.5;
      hp.connect(bp);
      tail = bp;
    }

    const env = ampEnvelope(ctx, when, amp * 0.5, 0.002, decay);
    noise.connect(hp);
    tail.connect(env);
    env.connect(destination);
    noise.start(when);
    noise.stop(when + decay + 0.02);
  },
};
