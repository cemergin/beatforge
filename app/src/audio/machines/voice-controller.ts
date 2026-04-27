// Voice controller — wraps a VoiceMachine + its config in a
// ControllableModule. Knobs become params, .set() updates the config,
// and an `onChange` callback fires after every accepted update so the
// host (engine adapter, save-state mirror, automation recorder) sees
// the new config. archetype swap rebuilds params + resets to the new
// machine's defaults.
//
// Voices are TRIGGERED, not streamed — the audio output happens once
// per render() call inside SoundEngine.tick(). That's why this
// module's input/output are null: there's no continuous signal to
// connect. The ControllableModule shape is borrowed for its addressable
// parameter surface, which is exactly what the router needs.
//
// Why a separate factory: the ChannelStrip's voice slot, a future
// "audition" panel, a saved-state migrator, and any other consumer
// that wants to drive a voice through the address tree all share the
// SAME knob-validation + archetype-swap logic. Centralizing it here
// keeps engine-adapters.ts thin and lets us write one set of tests.

import type { ControllableModule, ParamSpec } from '../../modules/audio-graph';
import type { MachineConfig } from './types';
import { VOICE_MACHINES, type VoiceArchetypeId } from './registry';

/** Build the ParamSpec list for a given config: archetype (discrete,
 *  every registered voice id) + each knob the active machine
 *  declares + each discrete spec. Single source of truth for "what
 *  knobs does this voice expose right now?". */
function paramsFor(cfg: MachineConfig): readonly ParamSpec[] {
  const machine = VOICE_MACHINES[cfg.archetype as VoiceArchetypeId];
  const out: ParamSpec[] = [
    {
      name: 'archetype',
      kind: 'discrete',
      options: Object.keys(VOICE_MACHINES),
      default: cfg.archetype,
    },
  ];
  if (!machine) return out;
  for (const k of machine.knobs) {
    out.push({
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
      out.push({
        name: d.id,
        kind: 'discrete',
        options: d.options,
        default: d.default,
      });
    }
  }
  return out;
}

export interface VoiceController extends ControllableModule {
  /** Read the current config. Mutation here is unsupported — go
   *  through .set() so onChange fires + validation runs. */
  getCurrent(): MachineConfig;
}

/** Create a controllable wrapper for a voice config. `onChange` fires
 *  after any accepted update with the new config object so the host
 *  can mirror to its own state (engine, React, IDB).
 *
 *  Validation rules:
 *   - archetype: must be a key in VOICE_MACHINES; sets cache to new
 *     machine's defaults, rebuilds params.
 *   - knob (continuous): must be one of the active machine's knobs;
 *     value must be a number. Bounds clamping is the engine's
 *     responsibility — we accept any number so MIDI / automation
 *     ramps don't get clipped at the boundary.
 *   - discrete: must be one of the spec's options.
 *  Anything else is silently ignored — saves dropping random MIDI
 *  CCs through the bus from breaking playback. */
export function makeVoiceController(
  initial: MachineConfig,
  onChange?: (cfg: MachineConfig) => void,
): VoiceController {
  let cfg: MachineConfig = { ...initial };
  let params: readonly ParamSpec[] = paramsFor(cfg);
  const fire = (next: MachineConfig) => { cfg = next; if (onChange) onChange(cfg); };

  const mod: VoiceController = {
    input: null,
    output: null,
    params,
    getCurrent: () => cfg,
    set(name, value) {
      if (name === 'archetype' && typeof value === 'string') {
        const machine = VOICE_MACHINES[value as VoiceArchetypeId];
        if (!machine) return;
        params = paramsFor(machine.defaults);
        // Mutate in place so consumers that already read .params see
        // the updated surface without re-fetching the module reference.
        Object.assign(mod, { params });
        fire({ ...machine.defaults });
        return;
      }
      const machine = VOICE_MACHINES[cfg.archetype as VoiceArchetypeId];
      if (!machine) return;
      const knob = machine.knobs.find((k) => k.id === name);
      if (knob && typeof value === 'number') {
        fire({ ...cfg, [name]: value });
        return;
      }
      const disc = machine.discrete?.find((d) => d.id === name);
      if (disc && typeof value === 'string'
          && (disc.options as readonly string[]).includes(value)) {
        fire({ ...cfg, [name]: value });
      }
    },
    dispose: () => {},
  };
  return mod;
}
