// Client-side persistence for quick-access state. No backend, per spec.

import type { KitId } from '../patterns/types';

const HIGHLIGHTS_KEY = 'bf_highlights';
const RECENT_KEY = 'bf_recent';
const KIT_OVERRIDES_KEY = 'bf_kit_overrides';
const RECENT_MAX = 20;

function read(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function write(key: string, ids: string[]): void {
  try { localStorage.setItem(key, JSON.stringify(ids)); } catch {}
}

export function getHighlights(): string[] { return read(HIGHLIGHTS_KEY); }

export function toggleHighlight(id: string): string[] {
  const cur = read(HIGHLIGHTS_KEY);
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  write(HIGHLIGHTS_KEY, next);
  return next;
}

export function isHighlighted(id: string): boolean {
  return read(HIGHLIGHTS_KEY).includes(id);
}

export function getRecent(): string[] { return read(RECENT_KEY); }

export function pushRecent(id: string): string[] {
  const cur = read(RECENT_KEY).filter((x) => x !== id);
  const next = [id, ...cur].slice(0, RECENT_MAX);
  write(RECENT_KEY, next);
  return next;
}

// ── Per-pattern kit overrides ────────────────────────────────────────
// Persists the user's preferred kit for a given pattern so it sticks
// across sessions (spec §9 v1.3). Keyed by patternId → KitId.

const VALID_KITS: readonly KitId[] = [
  '808', '909', '707', '727', 'frameDrum', 'tabla', 'gamelan',
];

function readKitOverrides(): Record<string, KitId> {
  try {
    const raw = localStorage.getItem(KIT_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, KitId> = {};
    for (const [id, kit] of Object.entries(parsed)) {
      if (typeof id === 'string' && typeof kit === 'string'
          && (VALID_KITS as readonly string[]).includes(kit)) {
        out[id] = kit as KitId;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeKitOverrides(map: Record<string, KitId>): void {
  try { localStorage.setItem(KIT_OVERRIDES_KEY, JSON.stringify(map)); } catch {}
}

export function getKitOverride(id: string): KitId | null {
  return readKitOverrides()[id] ?? null;
}

export function setKitOverride(id: string, kit: KitId): void {
  const map = readKitOverrides();
  map[id] = kit;
  writeKitOverrides(map);
}

export function clearKitOverride(id: string): void {
  const map = readKitOverrides();
  if (id in map) {
    delete map[id];
    writeKitOverrides(map);
  }
}
