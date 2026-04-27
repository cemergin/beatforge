import { describe, expect, it, vi } from 'vitest';
import { makeVoiceController } from './voice-controller';
import { VOICE_MACHINES } from './registry';

function kickCfg() { return { ...VOICE_MACHINES.kick.defaults }; }

describe('makeVoiceController', () => {
  it('exposes archetype + every knob the active machine declares', () => {
    const ctrl = makeVoiceController(kickCfg());
    const names = ctrl.params.map((p) => p.name);
    expect(names).toContain('archetype');
    expect(names).toContain('pitch');
    expect(names).toContain('decay');
  });

  it('archetype param is discrete with every voice id as an option', () => {
    const ctrl = makeVoiceController(kickCfg());
    const arche = ctrl.params.find((p) => p.name === 'archetype');
    expect(arche?.kind).toBe('discrete');
    expect(arche?.options).toEqual(expect.arrayContaining(['kick', 'snare', 'hat', 'tom', 'fm', 'modal']));
  });

  it('knob update fires onChange with the new config', () => {
    const onChange = vi.fn();
    const ctrl = makeVoiceController(kickCfg(), onChange);
    ctrl.set('pitch', 200);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ archetype: 'kick', pitch: 200 }));
  });

  it('getCurrent reflects the last accepted update', () => {
    const ctrl = makeVoiceController(kickCfg());
    ctrl.set('pitch', 220);
    // MachineConfig is a discriminated union — knobs aren't on the
    // base type. Reading via index keeps the test framework-agnostic.
    expect((ctrl.getCurrent() as unknown as Record<string, unknown>).pitch).toBe(220);
  });

  it('archetype swap resets the cfg + rebuilds params', () => {
    const onChange = vi.fn();
    const ctrl = makeVoiceController(kickCfg(), onChange);
    expect(ctrl.params.map((p) => p.name)).toContain('pitch');
    ctrl.set('archetype', 'noise');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ archetype: 'noise' }));
    // After swap, params reflect the noise machine's surface.
    expect(ctrl.params.map((p) => p.name)).toContain('cutoff');
  });

  it('rejects unknown archetype', () => {
    const onChange = vi.fn();
    const ctrl = makeVoiceController(kickCfg(), onChange);
    ctrl.set('archetype', 'unicorn');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects knob updates the active machine does not declare', () => {
    const onChange = vi.fn();
    const ctrl = makeVoiceController(kickCfg(), onChange);
    ctrl.set('reverbAmount', 1);   // not a kick knob
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects non-number values on continuous knobs', () => {
    const onChange = vi.fn();
    const ctrl = makeVoiceController(kickCfg(), onChange);
    ctrl.set('pitch', 'high');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('routes a discrete knob (noise.filter) when the active machine declares one', () => {
    const onChange = vi.fn();
    const ctrl = makeVoiceController({ ...VOICE_MACHINES.noise.defaults }, onChange);
    ctrl.set('filter', 'hp');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ filter: 'hp' }));
  });

  it('rejects discrete values not in the spec options', () => {
    const onChange = vi.fn();
    const ctrl = makeVoiceController({ ...VOICE_MACHINES.noise.defaults }, onChange);
    ctrl.set('filter', 'allpass');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('input + output are null (voices are triggered, not streamed)', () => {
    const ctrl = makeVoiceController(kickCfg());
    expect(ctrl.input).toBeNull();
    expect(ctrl.output).toBeNull();
  });
});
