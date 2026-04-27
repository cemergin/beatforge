// Engine adapters — wrap SoundEngine's master / reverb / delay
// setters as ControllableModules so the Router can dispatch
// ParamEvents to them. The adapters don't own audio nodes
// themselves; they just translate set(name, value) into the
// engine's existing setter calls.
//
// Address conventions:
//   master.gain.value           → engine.setMasterVolume
//   master.reverb.wet           → engine.setReverbWet
//   master.reverb.size          → engine.setReverbSize
//   master.reverb.decay         → engine.setReverbDecay
//   master.delay.wet            → engine.setDelayWet
//   master.delay.time           → engine.setDelayTime
//   master.delay.feedback       → engine.setDelayFeedback
//
// Adapters look like ControllableModules (params + set + dispose)
// but their input/output are null — they're not audio nodes, just
// dispatch shims. The Router only cares about params + set, so this
// is a clean fit.

import type { ControllableModule, ParamSpec } from '../../modules/audio-graph';
import type { SoundEngine } from './sound-engine';
import type { ChannelEffects, ColorFx } from '../../patterns/types-sound';
import type { MachineConfig } from '../machines/types';
import { VOICE_MACHINES, type VoiceArchetypeId } from '../machines/registry';

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

export function engineReverb(engine: SoundEngine): ControllableModule {
  return adapter(
    [
      { name: 'wet',   kind: 'continuous', min: 0,   max: 1,   default: 0.5, unit: '' },
      { name: 'size',  kind: 'continuous', min: 0.3, max: 4,   default: 1.8, unit: 's' },
      { name: 'decay', kind: 'continuous', min: 1,   max: 6,   default: 2.2, unit: '' },
    ],
    (name, value) => {
      if (typeof value !== 'number') return;
      if (name === 'wet') engine.setReverbWet(value);
      else if (name === 'size') engine.setReverbSize(value);
      else if (name === 'decay') engine.setReverbDecay(value);
    },
  );
}

export function engineDelay(engine: SoundEngine): ControllableModule {
  return adapter(
    [
      { name: 'wet',      kind: 'continuous', min: 0,    max: 1,   default: 0.5,  unit: '' },
      { name: 'time',     kind: 'continuous', min: 0.02, max: 2.0, default: 0.25, unit: 's' },
      { name: 'feedback', kind: 'continuous', min: 0,    max: 0.7, default: 0.35, unit: '' },
    ],
    (name, value) => {
      if (typeof value !== 'number') return;
      if (name === 'wet') engine.setDelayWet(value);
      else if (name === 'time') engine.setDelayTime(value);
      else if (name === 'feedback') engine.setDelayFeedback(value);
    },
  );
}

/** All-in-one helper: register every engine-side master adapter on a
 *  router. Returns an unsubscribe that tears down all registrations. */
export function registerEngineMaster(
  router: import('../../modules/router').Router,
  engine: SoundEngine,
): () => void {
  const offGain = router.registerModule('master.gain', engineMasterGain(engine));
  const offRev  = router.registerModule('master.reverb', engineReverb(engine));
  const offDly  = router.registerModule('master.delay', engineDelay(engine));
  return () => { offGain(); offRev(); offDly(); };
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
// Because the param surface depends on the active archetype, the
// adapter rebuilds its params list whenever archetype changes. The
// router cares about (address, paramName); rebuilding params doesn't
// affect dispatch — set(name, value) handles whatever the current
// machine knows.

function machineParams(cfg: MachineConfig): readonly ParamSpec[] {
  const machine = VOICE_MACHINES[cfg.archetype as VoiceArchetypeId];
  if (!machine) {
    return [{ name: 'archetype', kind: 'discrete',
              options: Object.keys(VOICE_MACHINES), default: cfg.archetype }];
  }
  const params: ParamSpec[] = [
    { name: 'archetype', kind: 'discrete',
      options: Object.keys(VOICE_MACHINES), default: cfg.archetype },
  ];
  for (const k of machine.knobs) {
    params.push({
      name: k.id,
      kind: 'continuous',
      min: k.min,
      max: k.max,
      default: k.default,
      unit: k.unit,
    });
  }
  if (machine.discrete) {
    for (const d of machine.discrete) {
      params.push({
        name: d.id,
        kind: 'discrete',
        options: d.options,
        default: d.default,
      });
    }
  }
  return params;
}

export function engineChannelMachine(
  engine: SoundEngine,
  channelIdx: number,
  initial: MachineConfig,
): ControllableModule {
  let cache: MachineConfig = { ...initial };
  let params: readonly ParamSpec[] = machineParams(cache);
  // Mutable params — the router holds a reference, so we mutate the
  // exposed `params` array in place on archetype swaps to keep any
  // UI generator that read once still in sync. Adapters using this
  // pattern should treat params as a snapshot and re-read after a
  // structural change.
  const mod: ControllableModule = {
    input: null, output: null,
    params,
    set(name, value) {
      if (name === 'archetype' && typeof value === 'string') {
        const machine = VOICE_MACHINES[value as VoiceArchetypeId];
        if (!machine) return;
        cache = { ...machine.defaults };
        params = machineParams(cache);
        // Replace the params reference in place where possible.
        Object.assign(mod, { params });
        engine.applyChannelMachine(channelIdx, cache);
        return;
      }
      // Knob updates: validate against the current machine's knobs.
      const machine = VOICE_MACHINES[cache.archetype as VoiceArchetypeId];
      if (!machine) return;
      const knob = machine.knobs.find((k) => k.id === name);
      if (knob && typeof value === 'number') {
        cache = { ...cache, [name]: value };
        engine.applyChannelMachine(channelIdx, cache);
        return;
      }
      const disc = machine.discrete?.find((d) => d.id === name);
      if (disc && typeof value === 'string'
          && (disc.options as readonly string[]).includes(value)) {
        cache = { ...cache, [name]: value };
        engine.applyChannelMachine(channelIdx, cache);
      }
    },
    dispose: () => {},
  };
  return mod;
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
