// Kit synthesis contract — each kit exposes a KitRecipe that the engine
// looks up at trigger time. The engine owns the scheduler, master bus,
// and reverb node; kits own the synthesis recipes.
//
// VoiceCtx is the narrow slice of engine state a voice needs to render.
// Kits call `createConnect(vc)` to get a connector that wires a tail node
// into the master bus plus the reverb send (with an optional per-voice
// wet multiplier) — mirroring the previous `engine._connect(node, wet)`
// behavior without the engine backref.

import type { KitId, VoiceId } from '../../patterns/types';

export interface VoiceCtx {
  ctx: AudioContext;
  destination: AudioNode;       // master bus input
  reverbSend: GainNode | null;  // null before ensureCtx() has run
}

export type VoiceRenderer = (vc: VoiceCtx, when: number, amp: number) => void;

export interface KitRecipe {
  id: KitId;
  name: string;
  reverbSend: number;           // per-kit reverb send level (was KIT_REVERB_SEND)
  voices: Record<VoiceId, VoiceRenderer>;
}

// Routes a tail node to the master bus and taps a copy into the reverb
// send with an optional wet-amount multiplier. Returns the input node so
// call sites can chain (legacy `_connect` returned its arg unchanged).
export function connectVoice(
  vc: VoiceCtx,
  node: AudioNode,
  wetAmount = 1,
): AudioNode {
  node.connect(vc.destination);
  if (vc.reverbSend) {
    const tap = vc.ctx.createGain();
    tap.gain.value = wetAmount;
    node.connect(tap).connect(vc.reverbSend);
  }
  return node;
}
