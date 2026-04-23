// Gamelan — Indonesian metal percussion.
// Every voice shares one recipe: inharmonic modal resonators (sine
// partials at non-integer ratios), higher partials decaying faster.
// Each voice differs only in (fundamental, partials[], decay).

import type { KitRecipe, VoiceCtx, VoiceRenderer } from './types';
import { connectVoice } from './types';
import { createBiquad, createGain, createNoise, createOsc } from './_util';

function gamelanTone(
  vc: VoiceCtx,
  when: number,
  amp: number,
  fundamental: number,
  partials: number[],
  decay: number,
): void {
  const { ctx } = vc;
  partials.forEach((ratio, i) => {
    const osc = createOsc(ctx);
    osc.type = 'sine';
    osc.frequency.value = fundamental * ratio;
    const g = createGain(ctx);
    // Higher partials decay faster (classic inharmonic metal shape).
    const partialDecay = decay * (1 / (1 + i * 0.4));
    const partialAmp = amp * (0.6 / (1 + i * 0.3));
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(partialAmp, when + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, when + partialDecay);
    osc.connect(g);
    connectVoice(vc, g, 1.5);
    osc.start(when);
    osc.stop(when + partialDecay + 0.05);
  });
  // Brief metallic click transient.
  const n = createNoise(ctx, 0.01);
  const hp = createBiquad(ctx);
  hp.type = 'highpass';
  hp.frequency.value = 3000;
  const ng = createGain(ctx);
  ng.gain.setValueAtTime(amp * 0.18, when);
  ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.01);
  n.connect(hp).connect(ng);
  connectVoice(vc, ng);
  n.start(when); n.stop(when + 0.015);
}

// Gong ageng — deepest, 2.5s decay.
const gongAgeng: VoiceRenderer = (vc, when, amp) =>
  gamelanTone(vc, when, amp * 1.1, 55, [1, 1.78, 2.72, 4.05, 6.3], 2.5);

// Kenong — mid kettle.
const kenong: VoiceRenderer = (vc, when, amp) =>
  gamelanTone(vc, when, amp * 0.9, 220, [1, 2.05, 3.1, 4.8], 0.8);

// Saron pulse — bright short.
const saron: VoiceRenderer = (vc, when, amp) =>
  gamelanTone(vc, when, amp * 0.75, 660, [1, 2.02], 0.18);

// Kempul — hanging gong, mid.
const kempul: VoiceRenderer = (vc, when, amp) =>
  gamelanTone(vc, when, amp * 0.95, 140, [1, 1.84, 2.9, 4.2], 1.2);

// Kempyang — high bell.
const kempyang: VoiceRenderer = (vc, when, amp) =>
  gamelanTone(vc, when, amp * 0.7, 1180, [1, 2.1], 0.3);

export const kitGamelan: KitRecipe = {
  id: 'gamelan',
  name: 'Gamelan',
  reverbSend: 0.35,
  voices: {
    KK: gongAgeng,
    SN: kenong,
    HH: saron,
    OH: kempul,
    CP: kempyang,
  },
};
