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
