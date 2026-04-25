// Cowbell voice machine — 2 detuned squares. Covers 727 cowbell,
// clave, agogo, woodblock, rim. The two-square recipe is ancient
// drum-machine territory (TR-808/909/727 cowbells were all this).

import { z } from 'zod';
import type { KnobSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { ampEnvelope, createOsc } from '../_shared/audio';

const KNOBS = [
  { id: 'pitch',  label: 'Pitch',  min: 200,  max: 2000, default: 540, curve: 'exp', unit: 'Hz' },
  { id: 'ratio',  label: 'Ratio',  min: 1.05, max: 2.5,  default: 1.5, curve: 'lin', unit: '×' },
  { id: 'decay',  label: 'Decay',  min: 30,   max: 1200, default: 300, curve: 'exp', unit: 'ms' },
  { id: 'detune', label: 'Detune', min: 0,    max: 50,   default: 8,   curve: 'lin', unit: '¢' },
] as const satisfies readonly KnobSpec[];

const CowbellConfigSchema = z.object({
  archetype: z.literal('cowbell'),
  pitch:     z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  ratio:     z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  decay:     z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  detune:    z.number().min(KNOBS[3].min).max(KNOBS[3].max),
});

export type CowbellConfig = z.infer<typeof CowbellConfigSchema>;

const DEFAULTS: CowbellConfig = {
  archetype: 'cowbell', pitch: 540, ratio: 1.5, decay: 300, detune: 8,
};

export const COWBELL_PRESETS: Record<string, Partial<CowbellConfig>> = {
  '727':    { pitch: 540, ratio: 1.5,  decay: 300, detune: 8 },
  clave:    { pitch: 1300, ratio: 1.13, decay: 60, detune: 0 },
  agogo:    { pitch: 880, ratio: 1.33, decay: 200, detune: 6 },
  woodblock:{ pitch: 800, ratio: 1.07, decay: 80,  detune: 4 },
  rim:      { pitch: 320, ratio: 1.85, decay: 50,  detune: 2 },
};

export const Cowbell: VoiceMachine<CowbellConfig> = {
  id: 'cowbell',
  label: 'Cowbell',
  category: 'voice',
  knobs: KNOBS,
  defaults: DEFAULTS,
  schema: CowbellConfigSchema,
  presets: COWBELL_PRESETS,

  render(cfg: CowbellConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;
    const pitch  = knobValue(cfg, 'pitch', mod);
    const ratio  = knobValue(cfg, 'ratio', mod);
    const decay  = knobValue(cfg, 'decay', mod) / 1000;
    const detune = knobValue(cfg, 'detune', mod);

    const o1 = createOsc(ctx);
    o1.type = 'square';
    o1.frequency.value = pitch;
    o1.detune.value = -detune;
    const o2 = createOsc(ctx);
    o2.type = 'square';
    o2.frequency.value = pitch * ratio;
    o2.detune.value = detune;

    const env = ampEnvelope(ctx, when, amp * 0.4, 0.002, decay);
    o1.connect(env); o2.connect(env);
    env.connect(destination);
    o1.start(when); o2.start(when);
    o1.stop(when + decay + 0.05); o2.stop(when + decay + 0.05);
  },
};
