// Engine adapters — translate addressable router targets into
// per-channel state pushes on SoundEngine.
//
// Master FX (reverb / delay) are registered DIRECTLY by their
// ControllableModule from machines/fx — see registerEngineMaster
// below. The shims that wrapped engine.setReverb*/setDelay* used
// to live here; now that the FX modules expose .set() in the same
// shape, the router targets them without an intermediary.
//
// Channel-level adapters DO live here because they wrap multiple
// engine-state slots (level + pan + sends; or color cfg; or
// machine cfg) that no single ControllableModule owns. They
// maintain their own state cache and call the engine's bulk
// setters when a param changes.
//
// Address tree (registered by Sound.tsx):
//   master.gain.value            → engine.setMasterVolume (still
//                                  via thin shim — master gain
//                                  isn't yet a ControllableModule)
//   master.reverb.{wet,size,decay}        → engine.getReverbFx().set
//   master.delay.{wet,time,feedback}      → engine.getDelayFx().set
//   channel.<n>.{level,pan,reverbSend,delaySend}  → cached + applyChannelParams
//   channel.<n>.color.{type, …}           → cached + applyChannelColorFx
//   channel.<n>.machine.{archetype, …}    → cached + applyChannelMachine

import type { ControllableModule, ParamSpec } from '../../modules/audio-graph';
import type { SoundEngine } from './sound-engine';
import type { ChannelEffects, ColorFx } from '../../patterns/types-sound';
import type { MachineConfig } from '../machines/types';
import { makeVoiceController } from '../machines/voice-controller';

/** Build a no-op AudioModule shape — input/output null, dispose
 *  no-op. The dispatch shape lives in the params + set wired by
 *  caller. Keeps each adapter compact. */
function adapter(
  params: readonly ParamSpec[],
  set: ControllableModule['set'],
): ControllableModule {
  return { input: null, output: null, params, set, dispose: () => {} };
}

export function engineMasterGain(engine: SoundEngine): ControllableModule {
  return adapter(
    [{ name: 'value', kind: 'continuous', min: 0, max: 1, default: 0.85, unit: '' }],
    (name, value) => {
      if (name === 'value' && typeof value === 'number') {
        engine.setMasterVolume(value);
      }
    },
  );
}

/** Register the three master modules on a router. Returns one
 *  unsubscribe that tears all of them down.
 *
 *  Master gain still goes through a thin shim because the engine
 *  owns the master GainNode privately. Reverb and delay are the
 *  actual ControllableModules from machines/fx — the router calls
 *  their .set() directly with no extra translation.
 *
 *  Caller MUST await engine.ensureCtx() before calling this; the
 *  reverb / delay modules don't exist until the AudioContext is
 *  initialized. */
export function registerEngineMaster(
  router: import('../../modules/router').Router,
  engine: SoundEngine,
): () => void {
  const offs: Array<() => void> = [];
  offs.push(router.registerModule('master.gain', engineMasterGain(engine)));
  const reverb = engine.getReverbFx();
  if (reverb) offs.push(router.registerModule('master.reverb', reverb));
  const delay = engine.getDelayFx();
  if (delay) offs.push(router.registerModule('master.delay', delay));
  return () => { for (const off of offs) off(); };
}

// ── Per-channel mixer ────────────────────────────────────────────
//
// Each channel exposes 4 continuous params at `channel.<n>`:
//   level, pan, reverbSend, delaySend
//
// The adapter holds its own canonical state cache so partial updates
// (set one param) push a complete ChannelStripParams object to the
// engine, which is what applyChannelParams expects.

type MixerParam = 'level' | 'pan' | 'reverbSend' | 'delaySend';

const MIXER_PARAMS: readonly ParamSpec[] = [
  { name: 'level',      kind: 'continuous', min: 0,  max: 1, default: 0.85, unit: '' },
  { name: 'pan',        kind: 'continuous', min: -1, max: 1, default: 0,    unit: '' },
  { name: 'reverbSend', kind: 'continuous', min: 0,  max: 1, default: 0,    unit: '' },
  { name: 'delaySend',  kind: 'continuous', min: 0,  max: 1, default: 0,    unit: '' },
];

const MIXER_PARAM_NAMES: ReadonlySet<MixerParam> = new Set([
  'level', 'pan', 'reverbSend', 'delaySend',
]);

export function engineChannelMixer(
  engine: SoundEngine,
  channelIdx: number,
  initial: Pick<ChannelEffects, MixerParam>,
): ControllableModule {
  const cache: Record<MixerParam, number> = {
    level:      initial.level,
    pan:        initial.pan,
    reverbSend: initial.reverbSend,
    delaySend:  initial.delaySend,
  };
  return adapter(MIXER_PARAMS, (name, value) => {
    if (typeof value !== 'number') return;
    if (!MIXER_PARAM_NAMES.has(name as MixerParam)) return;
    cache[name as MixerParam] = value;
    engine.applyChannelParams(channelIdx, { ...cache });
  });
}

// ── Per-channel color FX ─────────────────────────────────────────
//
// One adapter per channel registered at `channel.<n>.color`. The
// `type` param is structural — flipping it rebuilds the FX subgraph
// inside the channel strip via applyColorFx + a fresh ColorFx config
// of the new type's defaults. Per-color-type knobs live as
// continuous params; the adapter ignores any knob that doesn't apply
// to the currently active type.

const COLOR_TYPES = ['none', 'overdrive', 'bitcrush', 'filter'] as const;

const COLOR_PARAMS: readonly ParamSpec[] = [
  { name: 'type',  kind: 'discrete',   options: COLOR_TYPES, default: 'none' },
  // Overdrive
  { name: 'drive', kind: 'continuous', min: 0, max: 1, default: 0.5, unit: '' },
  { name: 'tone',  kind: 'continuous', min: 0, max: 1, default: 0.5, unit: '' },
  { name: 'mix',   kind: 'continuous', min: 0, max: 1, default: 0.7, unit: '' },
  // Bitcrush — bits, rate (mix shared with overdrive intentionally)
  { name: 'bits',  kind: 'continuous', min: 1, max: 16, default: 8, unit: 'bits' },
  { name: 'rate',  kind: 'continuous', min: 100, max: 16000, default: 4000, unit: 'Hz' },
  // Filter
  { name: 'cutoff', kind: 'continuous', min: 50, max: 12000, default: 1200, unit: 'Hz' },
  { name: 'q',      kind: 'continuous', min: 0.1, max: 12, default: 1, unit: '' },
  { name: 'mode',   kind: 'discrete',   options: ['lp', 'hp', 'bp'], default: 'lp' },
];

function defaultColorFxOfType(type: typeof COLOR_TYPES[number]): ColorFx {
  if (type === 'overdrive') return { type, drive: 0.5, tone: 0.5, mix: 0.7 };
  if (type === 'bitcrush')  return { type, bits: 8, rate: 4000, mix: 0.7 };
  if (type === 'filter')    return { type, mode: 'lp', cutoff: 1200, q: 1, mix: 0.8 };
  return { type: 'none' };
}

export function engineChannelColor(
  engine: SoundEngine,
  channelIdx: number,
  initial: ColorFx,
): ControllableModule {
  let cache: ColorFx = { ...initial } as ColorFx;
  return adapter(COLOR_PARAMS, (name, value) => {
    if (name === 'type' && typeof value === 'string'
        && (COLOR_TYPES as readonly string[]).includes(value)) {
      cache = defaultColorFxOfType(value as typeof COLOR_TYPES[number]);
    } else if (cache.type !== 'none') {
      // Update only if the param is meaningful for this color type.
      // We narrow per-branch so the assignment is type-safe.
      if (cache.type === 'overdrive' && (name === 'drive' || name === 'tone' || name === 'mix') && typeof value === 'number') {
        cache = { ...cache, [name]: value };
      } else if (cache.type === 'bitcrush' && (name === 'bits' || name === 'rate' || name === 'mix') && typeof value === 'number') {
        cache = { ...cache, [name]: value };
      } else if (cache.type === 'filter') {
        if ((name === 'cutoff' || name === 'q' || name === 'mix') && typeof value === 'number') {
          cache = { ...cache, [name]: value };
        } else if (name === 'mode' && typeof value === 'string'
                   && (value === 'lp' || value === 'hp' || value === 'bp')) {
          cache = { ...cache, mode: value };
        } else {
          return;
        }
      } else {
        return;
      }
    } else {
      return;  // type='none' ignores all continuous knobs
    }
    engine.applyChannelColorFx(channelIdx, cache);
  });
}

// ── Per-channel voice machine ───────────────────────────────────
//
// `channel.<n>.machine` exposes:
//   - `archetype` (discrete) — swap the voice machine; resets cfg
//     to the new archetype's defaults
//   - one continuous ParamSpec per knob defined by the active
//     machine's KnobSpec list
//   - any DiscreteSpec the machine declares (e.g. filter type for
//     the noise voice) as a discrete param
//
// The whole knob-validation + archetype-swap surface lives in
// makeVoiceController (machines/voice-controller.ts). The engine
// adapter is a thin wrapper that hooks the controller's onChange
// callback to engine.applyChannelMachine(idx, cfg) — every accepted
// .set() pushes the new config to the running scheduler.

export function engineChannelMachine(
  engine: SoundEngine,
  channelIdx: number,
  initial: MachineConfig,
): ControllableModule {
  return makeVoiceController(initial, (cfg) => {
    engine.applyChannelMachine(channelIdx, cfg);
  });
}

// ── Whole-channel registration helper ────────────────────────────
//
// One channel produces three registered modules:
//   channel.<n>          → mixer
//   channel.<n>.color    → color FX
//   channel.<n>.machine  → voice machine

export function registerEngineChannel(
  router: import('../../modules/router').Router,
  engine: SoundEngine,
  channelIdx: number,
  initial: { effects: ChannelEffects; machine: MachineConfig },
): () => void {
  const offMix    = router.registerModule(`channel.${channelIdx}`,         engineChannelMixer(engine, channelIdx, initial.effects));
  const offColor  = router.registerModule(`channel.${channelIdx}.color`,   engineChannelColor(engine, channelIdx, initial.effects.colorFx));
  const offMach   = router.registerModule(`channel.${channelIdx}.machine`, engineChannelMachine(engine, channelIdx, initial.machine));
  return () => { offMach(); offColor(); offMix(); };
}
