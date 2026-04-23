// IndexedDB persistence for user patterns (Studio output).
// See spec §8.3 — IndexedDB via Dexie, `userPatterns` keyed by `id`.

import Dexie, { type Table } from 'dexie';
import type { Pattern } from '../patterns/types';
import { PatternSchema, UserPatternSchema } from '../patterns/schema';

export interface UserPattern extends Pattern {
  user: true;
  createdAt: number;
  updatedAt: number;
}

class BFDatabase extends Dexie {
  userPatterns!: Table<UserPattern, string>;

  constructor() {
    super('beatforge');
    this.version(1).stores({
      userPatterns: 'id, region, createdAt, updatedAt',
    });
  }
}

export const db = new BFDatabase();

export async function saveUserPattern(p: UserPattern): Promise<void> {
  await db.userPatterns.put(p);
}

export async function deleteUserPattern(id: string): Promise<void> {
  await db.userPatterns.delete(id);
  // GC any kit override tied to this pattern — prevents bf_kit_overrides
  // from accumulating stale ids as user patterns churn.
  try {
    const { clearKitOverride } = await import('./storage');
    clearKitOverride(id);
  } catch { /* storage unreachable — already warned there */ }
}

export async function listUserPatterns(): Promise<UserPattern[]> {
  // Sort by updatedAt desc for "most recent first" in UI.
  const all = await db.userPatterns.toArray();
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function bulkImport(patterns: UserPattern[]): Promise<void> {
  await db.userPatterns.bulkPut(patterns);
}

// ── Validation ──────────────────────────────────────────────────────
// Delegated to Zod schemas in patterns/schema.ts — one source of truth
// for Pattern shape across seed loading (build-time) and user-pattern
// loading (IDB). The signatures stay unchanged so callers don't care.

export function isValidPattern(p: unknown): p is Pattern {
  return PatternSchema.safeParse(p).success;
}

export function isValidUserPattern(p: unknown): p is UserPattern {
  return UserPatternSchema.safeParse(p).success;
}

// Wrapper used when loading from IDB — returns pattern OR null if corrupted,
// never throws so app keeps running.
export interface LoadedUserPattern {
  id: string;
  pattern: UserPattern | null;    // null → corrupted
  raw: unknown;                    // keep around so user can inspect / export
}

export async function loadAllSafe(): Promise<LoadedUserPattern[]> {
  const raws = await db.userPatterns.toArray();
  return raws
    .map<LoadedUserPattern>((raw) => {
      if (isValidUserPattern(raw)) {
        return { id: raw.id, pattern: raw, raw };
      }
      // Try to salvage an id so the quarantined card can still offer deletion.
      const maybeId = raw && typeof raw === 'object' && 'id' in raw
        ? String((raw as { id: unknown }).id)
        : 'unknown-' + Math.random().toString(36).slice(2, 8);
      return { id: maybeId, pattern: null, raw };
    })
    .sort((a, b) => {
      const au = a.pattern?.updatedAt ?? 0;
      const bu = b.pattern?.updatedAt ?? 0;
      return bu - au;
    });
}
