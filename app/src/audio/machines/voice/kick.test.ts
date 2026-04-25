// Kick machine tests — schema validation + preset coverage. Audio
// rendering tests need OfflineAudioContext which the test env doesn't
// fully expose; runtime behavior gets verified via the Sound page.

import { describe, expect, it } from 'vitest';
import { Kick, KICK_PRESETS, type KickConfig } from './kick';

describe('Kick machine', () => {
  it('declares the expected metadata', () => {
    expect(Kick.id).toBe('kick');
    expect(Kick.category).toBe('voice');
    expect(Kick.knobs).toHaveLength(5);
  });

  it('every knob has consistent default within its range', () => {
    for (const k of Kick.knobs) {
      expect(k.default).toBeGreaterThanOrEqual(k.min);
      expect(k.default).toBeLessThanOrEqual(k.max);
    }
  });

  it('defaults satisfy the schema', () => {
    expect(() => Kick.schema.parse(Kick.defaults)).not.toThrow();
  });

  it('rejects out-of-range pitch', () => {
    const bad = { ...Kick.defaults, pitch: 9999 };
    expect(() => Kick.schema.parse(bad)).toThrow();
  });

  it('rejects wrong archetype discriminator', () => {
    const bad = { ...Kick.defaults, archetype: 'snare' as const };
    expect(() => Kick.schema.parse(bad)).toThrow();
  });

  it('every preset is a valid partial config', () => {
    for (const [name, preset] of Object.entries(KICK_PRESETS)) {
      const merged: KickConfig = { ...Kick.defaults, ...preset };
      expect(
        () => Kick.schema.parse(merged),
        `preset "${name}" failed validation`,
      ).not.toThrow();
    }
  });

  it('ships 808/909/707 presets with distinct decay values', () => {
    expect(KICK_PRESETS['808']?.decay).toBe(600);
    expect(KICK_PRESETS['909']?.decay).toBe(350);
    expect(KICK_PRESETS['707']?.decay).toBe(280);
  });
});
