// Kit registry — the engine's trigger path looks up recipes here by
// KitId. Adding a kit = create a KitRecipe in its own file + add the
// import + the entry below.

import type { KitId } from '../../patterns/types';
import type { KitRecipe, VoiceCtx } from './types';
import { kit707, kit808, kit909 } from './drum-machine';
import { kit727 } from './tr-727';
import { kitFrameDrum } from './frame-drum';
import { kitTabla } from './tabla';
import { kitGamelan } from './gamelan';

export const kitRecipes: Record<KitId, KitRecipe> = {
  '808': kit808,
  '909': kit909,
  '707': kit707,
  '727': kit727,
  frameDrum: kitFrameDrum,
  tabla: kitTabla,
  gamelan: kitGamelan,
};

export type { KitRecipe, VoiceCtx } from './types';
export { connectVoice } from './types';

// Builds the VoiceCtx a renderer needs. Engine holds the live nodes;
// this helper keeps the shape coupling in one spot.
export function buildVoiceCtx(
  ctx: AudioContext,
  destination: AudioNode,
  reverbSend: GainNode | null,
): VoiceCtx {
  return { ctx, destination, reverbSend };
}
