// Tabla — Indian Hindustani drum pair. Voice mapping:
//   KK → ge/ghe   (bayan bass with upward pitch bend — the "wump")
//   SN → na/ta    (dayan rim, modal resonator at ~600Hz)
//   HH → tin      (closed bell, short)
//   OH → tun      (open resonant, ~500Hz)
//   CP → dha      (composite: ge + na simultaneously)

import type { KitRecipe, VoiceRenderer } from './types';
import { connectVoice } from './types';
import { createBiquad, createGain, createNoise, createOsc } from './_util';

const ge: VoiceRenderer = (vc, when, amp) => {
  const { ctx } = vc;
  // Bayan bass with UPWARD pitch bend (62→92Hz) through a resonant LPF.
  const osc = createOsc(ctx);
  const g = createGain(ctx);
  const lp = createBiquad(ctx);
  lp.type = 'lowpass';
  lp.frequency.value = 400;
  lp.Q.value = 6;
  osc.frequency.setValueAtTime(62, when);
  osc.frequency.linearRampToValueAtTime(92, when + 0.08);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(amp * 1.0, when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.42);
  osc.connect(lp).connect(g);
  connectVoice(vc, g, 1.3);
  osc.start(when); osc.stop(when + 0.45);
};

const na: VoiceRenderer = (vc, when, amp) => {
  const { ctx } = vc;
  // Dayan rim — modal resonator at 600 + 1020Hz, with HP noise attack.
  const o1 = createOsc(ctx);
  const o2 = createOsc(ctx);
  o1.frequency.value = 600;
  o2.frequency.value = 1020;
  const g = createGain(ctx);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(amp * 0.5, when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.2);
  o1.connect(g); o2.connect(g);
  connectVoice(vc, g, 1.3);
  o1.start(when); o2.start(when);
  o1.stop(when + 0.22); o2.stop(when + 0.22);

  const n = createNoise(ctx, 0.02);
  const hp = createBiquad(ctx);
  hp.type = 'highpass';
  hp.frequency.value = 3000;
  const ng = createGain(ctx);
  ng.gain.setValueAtTime(amp * 0.2, when);
  ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.02);
  n.connect(hp).connect(ng);
  connectVoice(vc, ng);
  n.start(when); n.stop(when + 0.03);
};

const tin: VoiceRenderer = (vc, when, amp) => {
  const { ctx } = vc;
  const osc = createOsc(ctx);
  osc.frequency.value = 900;
  const g = createGain(ctx);
  g.gain.setValueAtTime(amp * 0.5, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
  osc.connect(g);
  connectVoice(vc, g);
  osc.start(when); osc.stop(when + 0.05);
};

const tun: VoiceRenderer = (vc, when, amp) => {
  const { ctx } = vc;
  const o1 = createOsc(ctx);
  const o2 = createOsc(ctx);
  o1.frequency.value = 500;
  o2.frequency.value = 980;
  const g = createGain(ctx);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(amp * 0.55, when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
  o1.connect(g); o2.connect(g);
  connectVoice(vc, g, 1.4);
  o1.start(when); o2.start(when);
  o1.stop(when + 0.52); o2.stop(when + 0.52);
};

// Dha = ge + na fired simultaneously. Composite behavior is preserved
// by calling the other renderers directly — not a recursive kit dispatch,
// so it stays independent of the engine's trigger path.
const dha: VoiceRenderer = (vc, when, amp) => {
  ge(vc, when, amp);
  na(vc, when, amp);
};

export const kitTabla: KitRecipe = {
  id: 'tabla',
  name: 'Tabla',
  reverbSend: 0.15,
  voices: {
    KK: ge,
    SN: na,
    HH: tin,
    OH: tun,
    CP: dha,
  },
};
