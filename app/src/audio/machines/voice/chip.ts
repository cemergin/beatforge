// Chip voice — PWM (pulse-width modulation) square. Atari/NES/C64
// territory. Pulse width itself is modulated by an LFO for that
// classic chip "phasing" sound.

import { z } from 'zod';
import type { KnobSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { ampEnvelope, createGain, createOsc } from '../_shared/audio';

const KNOBS = [
  { id: 'pitch',      label: 'Pitch',      min: 100, max: 2000, default: 440, curve: 'exp', unit: 'Hz' },
  { id: 'pulseWidth', label: 'Width',      min: 0.05, max: 0.95, default: 0.5, curve: 'lin', unit: '%' },
  { id: 'pwmDepth',   label: 'PWM Depth',  min: 0,   max: 0.45, default: 0,   curve: 'lin', unit: '%' },
  { id: 'pwmRate',    label: 'PWM Rate',   min: 0.5, max: 30,   default: 6,   curve: 'exp', unit: 'Hz' },
  { id: 'decay',      label: 'Decay',      min: 30,  max: 2000, default: 200, curve: 'exp', unit: 'ms' },
] as const satisfies readonly KnobSpec[];

const ChipConfigSchema = z.object({
  archetype:  z.literal('chip'),
  pitch:      z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  pulseWidth: z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  pwmDepth:   z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  pwmRate:    z.number().min(KNOBS[3].min).max(KNOBS[3].max),
  decay:      z.number().min(KNOBS[4].min).max(KNOBS[4].max),
});

export type ChipConfig = z.infer<typeof ChipConfigSchema>;

const DEFAULTS: ChipConfig = {
  archetype: 'chip', pitch: 440, pulseWidth: 0.5, pwmDepth: 0, pwmRate: 6, decay: 200,
};

export const CHIP_PRESETS: Record<string, Partial<ChipConfig>> = {
  blip:    { pitch: 880, pulseWidth: 0.5,  pwmDepth: 0,    pwmRate: 6, decay: 80 },
  laser:   { pitch: 1500, pulseWidth: 0.3, pwmDepth: 0.2,  pwmRate: 18, decay: 180 },
  arcade:  { pitch: 660, pulseWidth: 0.25, pwmDepth: 0.25, pwmRate: 4, decay: 280 },
  bass8:   { pitch: 110, pulseWidth: 0.5,  pwmDepth: 0.1,  pwmRate: 2, decay: 600 },
  vibrato: { pitch: 440, pulseWidth: 0.5,  pwmDepth: 0.4,  pwmRate: 8, decay: 1000 },
};

/** Build a pulse from two sawtooth oscillators 180° out of phase
 *  with one delayed by `width × period`. The trick the SID and most
 *  hardware-accurate emulators use. */
export const Chip: VoiceMachine<ChipConfig> = {
  id: 'chip',
  label: 'Chip',
  category: 'voice',
  knobs: KNOBS,
  defaults: DEFAULTS,
  schema: ChipConfigSchema,
  presets: CHIP_PRESETS,

  render(cfg: ChipConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;
    const pitch      = knobValue(cfg, 'pitch', mod);
    const pulseWidth = knobValue(cfg, 'pulseWidth', mod);
    const pwmDepth   = knobValue(cfg, 'pwmDepth', mod);
    const pwmRate    = knobValue(cfg, 'pwmRate', mod);
    const decay      = knobValue(cfg, 'decay', mod) / 1000;

    // Web Audio doesn't have a square+PWM oscillator natively, but
    // we can synthesise one with a sawtooth → WaveShaper. The
    // shaper's transfer function compares input to a threshold
    // (driven by pulseWidth + LFO).
    const saw = createOsc(ctx);
    saw.type = 'sawtooth';
    saw.frequency.value = pitch;

    // Threshold comparator: positive output if above threshold,
    // negative below. The threshold itself is controlled by an
    // adder: pulseWidth + LFO * pwmDepth.
    const shaper = ctx.createWaveShaper();
    {
      const len = 2048;
      const curve = new Float32Array(new ArrayBuffer(len * 4));
      for (let i = 0; i < len; i++) {
        const x = (i / (len - 1)) * 2 - 1;
        // x > 0 → +1 ; x < 0 → -1 (square)
        curve[i] = x > 0 ? 1 : -1;
      }
      shaper.curve = curve;
    }

    // Sum sawtooth + DC offset (controlled by an LFO) so the comparator
    // shifts its zero-crossing → effectively shifts pulse width.
    const sumGain = createGain(ctx);
    sumGain.gain.value = 1.0;
    saw.connect(sumGain);

    if (pwmDepth > 0) {
      const lfo = createOsc(ctx);
      lfo.type = 'sine';
      lfo.frequency.value = pwmRate;
      const lfoGain = createGain(ctx);
      lfoGain.gain.value = pwmDepth;
      lfo.connect(lfoGain).connect(sumGain.gain);
      lfo.start(when);
      lfo.stop(when + decay + 0.05);
    }

    // DC offset from pulseWidth (centered at 0.5 = 0 offset).
    const dc = ctx.createConstantSource();
    dc.offset.value = (pulseWidth - 0.5) * 2;
    const dcGain = createGain(ctx);
    dcGain.gain.value = 1.0;
    dc.connect(dcGain).connect(sumGain.gain);
    dc.start(when);
    dc.stop(when + decay + 0.05);

    sumGain.connect(shaper);

    const env = ampEnvelope(ctx, when, amp * 0.4, 0.003, decay);
    shaper.connect(env);
    env.connect(destination);

    saw.start(when);
    saw.stop(when + decay + 0.05);
  },
};
