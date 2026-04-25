// Local-storage-backed quick-access state. We stub localStorage with a
// Map-backed shim so each test starts clean + can simulate quota / JSON
// corruption failures. `./log` is mocked to avoid noisy console output
// during tests.

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./log', () => ({
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

function installFakeStorage(): Map<string, string> {
  const store = new Map<string, string>();
  const fake: Storage = {
    get length() { return store.size; },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    key: (i) => Array.from(store.keys())[i] ?? null,
  };
  vi.stubGlobal('localStorage', fake);
  return store;
}

// ── highlights ───────────────────────────────────────────────────────

describe('highlights', () => {
  beforeEach(() => { installFakeStorage(); });

  it('toggleHighlight adds when absent', async () => {
    const { toggleHighlight, isHighlighted } = await import('./storage');
    const next = toggleHighlight('pat-1');
    expect(next).toEqual(['pat-1']);
    expect(isHighlighted('pat-1')).toBe(true);
  });

  it('toggleHighlight removes when present', async () => {
    const { toggleHighlight, isHighlighted } = await import('./storage');
    toggleHighlight('pat-1');
    const next = toggleHighlight('pat-1');
    expect(next).toEqual([]);
    expect(isHighlighted('pat-1')).toBe(false);
  });

  it('getHighlights survives invalid JSON', async () => {
    const store = installFakeStorage();
    store.set('bf_highlights', '{not json');
    const { getHighlights } = await import('./storage');
    expect(getHighlights()).toEqual([]);
  });

  it('filters non-string entries from corrupted array', async () => {
    const store = installFakeStorage();
    store.set('bf_highlights', JSON.stringify(['good', 42, null, 'alsoGood']));
    const { getHighlights } = await import('./storage');
    expect(getHighlights()).toEqual(['good', 'alsoGood']);
  });
});

// ── recent ───────────────────────────────────────────────────────────

describe('recent', () => {
  beforeEach(() => { installFakeStorage(); });

  it('pushRecent prepends most-recent first', async () => {
    const { pushRecent, getRecent } = await import('./storage');
    pushRecent('a');
    pushRecent('b');
    pushRecent('c');
    expect(getRecent()).toEqual(['c', 'b', 'a']);
  });

  it('pushRecent dedups — repeat id moves to front', async () => {
    const { pushRecent } = await import('./storage');
    pushRecent('a');
    pushRecent('b');
    const next = pushRecent('a');
    expect(next).toEqual(['a', 'b']);
  });

  it('pushRecent caps at 20', async () => {
    const { pushRecent } = await import('./storage');
    let last: string[] = [];
    for (let i = 0; i < 30; i++) last = pushRecent(`id-${i}`);
    expect(last.length).toBe(20);
    expect(last[0]).toBe('id-29');
    expect(last[19]).toBe('id-10');
  });
});

// ── kit overrides ────────────────────────────────────────────────────

describe('kit overrides', () => {
  beforeEach(() => { installFakeStorage(); });

  it('getKitOverride returns null for unknown pattern', async () => {
    const { getKitOverride } = await import('./storage');
    expect(getKitOverride('unknown')).toBeNull();
  });

  it('setKitOverride persists + roundtrips', async () => {
    const { setKitOverride, getKitOverride } = await import('./storage');
    setKitOverride('pat-1', 'tabla');
    expect(getKitOverride('pat-1')).toBe('tabla');
  });

  it('clearKitOverride removes the entry', async () => {
    const { setKitOverride, getKitOverride, clearKitOverride } = await import('./storage');
    setKitOverride('pat-1', '909');
    clearKitOverride('pat-1');
    expect(getKitOverride('pat-1')).toBeNull();
  });

  it('clearKitOverride on missing id is a no-op', async () => {
    const { clearKitOverride } = await import('./storage');
    expect(() => clearKitOverride('never-existed')).not.toThrow();
  });

  it('ignores invalid kit ids in stored payload', async () => {
    const store = installFakeStorage();
    store.set('bf_kit_overrides', JSON.stringify({ 'pat-1': 'not-a-kit', 'pat-2': '909' }));
    const { getKitOverride } = await import('./storage');
    expect(getKitOverride('pat-1')).toBeNull();
    expect(getKitOverride('pat-2')).toBe('909');
  });

  it('survives invalid JSON in storage', async () => {
    const store = installFakeStorage();
    store.set('bf_kit_overrides', '{oops');
    const { getKitOverride } = await import('./storage');
    expect(getKitOverride('anything')).toBeNull();
  });

  it('survives when payload is an array, not an object', async () => {
    const store = installFakeStorage();
    store.set('bf_kit_overrides', JSON.stringify(['a', 'b']));
    const { getKitOverride } = await import('./storage');
    expect(getKitOverride('any')).toBeNull();
  });

  it('setKitOverride over existing id updates value', async () => {
    const { setKitOverride, getKitOverride } = await import('./storage');
    setKitOverride('pat-1', '808');
    setKitOverride('pat-1', 'tabla');
    expect(getKitOverride('pat-1')).toBe('tabla');
  });
});
