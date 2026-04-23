// 727 — Roland's Latin percussion machine. Unlike 808/909/707 this kit
// doesn't have a kick/snare/hat/clap kit; it has congas/cowbell/agogo/
// claves. We remap onto the closed 5-voice set:
//
//   KK → low conga     SN → high conga
//   HH → cowbell       OH → agogo
//   CP → claves

import type { KitRecipe, VoiceCtx } from './types';
import { connectVoice } from './types';
import { createBiquad, createGain, createOsc } from './_util';

function lowConga(vc: VoiceCtx, when: number, amp: number): void {
  const { ctx } = vc;
  const osc = createOsc(ctx);
  const g = createGain(ctx);
  osc.frequency.setValueAtTime(180, when);
  osc.frequency.exponentialRampToValueAtTime(130, when + 0.1);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(amp * 0.9, when + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.35);
  osc.connect(g);
  connectVoice(vc, g);
  osc.start(when); osc.stop(when + 0.4);
}

function highConga(vc: VoiceCtx, when: number, amp: number): void {
  const { ctx } = vc;
  const osc = createOsc(ctx);
  const g = createGain(ctx);
  osc.frequency.setValueAtTime(300, when);
  osc.frequency.exponentialRampToValueAtTime(220, when + 0.08);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(amp * 0.8, when + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
  osc.connect(g);
  connectVoice(vc, g);
  osc.start(when); osc.stop(when + 0.3);
}

// Cowbell (HH) / Agogo (OH) — same synth shape, different pitches/decays.
function bellVoice(kind: 'cowbell' | 'agogo'): (vc: VoiceCtx, when: number, amp: number) => void {
  return (vc, when, amp) => {
    const { ctx } = vc;
    const isCow = kind === 'cowbell';
    const osc = createOsc(ctx);
    const osc2 = createOsc(ctx);
    osc.type = 'square'; osc2.type = 'square';
    osc.frequency.value = isCow ? 800 : 620;
    osc2.frequency.value = isCow ? 540 : 420;
    const bp = createBiquad(ctx);
    bp.type = 'bandpass';
    bp.frequency.value = isCow ? 1800 : 1400;
    bp.Q.value = 1.2;
    const g = createGain(ctx);
    const dec = isCow ? 0.14 : 0.35;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(amp * 0.4, when + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dec);
    osc.connect(bp); osc2.connect(bp);
    bp.connect(g);
    connectVoice(vc, g);
    osc.start(when); osc2.start(when);
    osc.stop(when + dec + 0.05); osc2.stop(when + dec + 0.05);
  };
}

function claves(vc: VoiceCtx, when: number, amp: number): void {
  const { ctx } = vc;
  const osc = createOsc(ctx);
  const g = createGain(ctx);
  osc.frequency.value = 2500;
  g.gain.setValueAtTime(amp * 0.9, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.03);
  osc.connect(g);
  connectVoice(vc, g);
  osc.start(when); osc.stop(when + 0.04);
}

export const kit727: KitRecipe = {
  id: '727',
  name: 'TR-727',
  reverbSend: 0.12,
  voices: {
    KK: lowConga,
    SN: highConga,
    HH: bellVoice('cowbell'),
    OH: bellVoice('agogo'),
    CP: claves,
  },
};
