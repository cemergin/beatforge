// Round-trip tests for the share-link codec. Skip if the runtime
// doesn't support CompressionStream (older Safari, some test envs).

import { describe, it, expect } from 'vitest';
import type { Pattern } from './types';
import { serializePattern, deserializePattern } from './serialize';

const SUPPORTED = typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

const sample: Pattern = {
  id: 'test-hash-pattern',
  name: 'Test Hash Pattern',
  origin: '—',
  tradition: 'Unit test',
  genre: 'exercise',
  timeSig: '4/4',
  grouping: [4, 4, 4, 4],
  steps: 16,
  stepUnit: 16,
  bpm: { default: 120, min: 60, max: 200 },
  difficulty: 'beginner',
  tracks: {
    KK: [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
    SN: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
    HH: [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
  },
  defaultKit: '909',
  region: 'exercise',
  tags: ['test', 'hash'],
  swingable: false,
};

describe.skipIf(!SUPPORTED)('serializePattern / deserializePattern', () => {
  it('round-trips a valid pattern', async () => {
    const hash = await serializePattern(sample);
    expect(hash.startsWith('p1:')).toBe(true);
    const restored = await deserializePattern(hash);
    expect(restored).not.toBeNull();
    expect(restored?.id).toBe(sample.id);
    expect(restored?.tracks.KK).toEqual(sample.tracks.KK);
    expect(restored?.bpm).toEqual(sample.bpm);
  });

  it('hash is URL-safe (no +, /, or = chars)', async () => {
    const hash = await serializePattern(sample);
    const payload = hash.slice(3);
    expect(payload).not.toMatch(/[+/=]/);
  });

  it('hash is < 2000 chars for a typical pattern', async () => {
    const hash = await serializePattern(sample);
    expect(hash.length).toBeLessThan(2000);
  });

  it('returns null for a missing version prefix', async () => {
    const restored = await deserializePattern('some-random-text');
    expect(restored).toBeNull();
  });

  it('returns null for corrupted base64', async () => {
    const restored = await deserializePattern('p1:!!!invalid!!!');
    expect(restored).toBeNull();
  });

  it('returns null for valid gzip but invalid Pattern shape', async () => {
    // Compress a plain JSON object that doesn't match the schema.
    const input = new TextEncoder().encode('{"not":"a pattern"}');
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(input);
    writer.close();
    const bytes = new Uint8Array(await new Response(cs.readable).arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const payload = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const restored = await deserializePattern(`p1:${payload}`);
    expect(restored).toBeNull();
  });
});
