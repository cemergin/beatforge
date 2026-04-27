// FX machine catalog — every effect lives here as a
// ControllableModule factory so anything that consumes an audio
// graph (channel strip, master bus, future user-FX rack) speaks the
// same language.
//
// Two flavours:
//
//   Channel color FX — overdrive / bitcrush / filter
//     Built per-channel by ChannelStrip via buildColorFxModule().
//     Mounted between the strip's color-in and color-out gain
//     stages. Type swap rebuilds the module; knob changes ramp live.
//
//   Master FX — reverb / delay
//     Built once by SoundEngine.initCtxOnce() and connected to the
//     reverb / delay buses. Knob changes ramp live; structural
//     changes (impulse rebuild for reverb size/decay) happen
//     between samples.
//
// All exports return ControllableModules so the router dispatches
// to them through the same set(name, value) call no matter what
// produced the param event (UI knob, MIDI CC, automation lane).

import type { ControllableModule } from '../../../modules/audio-graph';
import type { ColorFx } from '../../../patterns/types-sound';

export { createOverdrive, type OverdriveInit } from './overdrive';
export { createBitcrush,  type BitcrushInit }  from './bitcrush';
export { createFilter,    type FilterInit }    from './filter';
export { createReverb,    type ReverbInit }    from './reverb';
export { createDelayFx,   type DelayInit }     from './delay';

import { createOverdrive } from './overdrive';
import { createBitcrush }  from './bitcrush';
import { createFilter }    from './filter';

/** Dispatch a ColorFx config to its ControllableModule factory.
 *  Returns null for type='none' so the channel strip's caller can
 *  reconnect the passthrough without a module to dispose. */
export function buildColorFxModule(
  cfg: ColorFx,
  ctx: AudioContext,
): ControllableModule | null {
  switch (cfg.type) {
    case 'none':      return null;
    case 'overdrive': return createOverdrive(ctx, cfg);
    case 'bitcrush':  return createBitcrush(ctx,  cfg);
    case 'filter':    return createFilter(ctx,    cfg);
  }
}
