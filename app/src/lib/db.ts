// IndexedDB persistence for user patterns (Studio output).
// See spec §8.3 — IndexedDB via Dexie, `userPatterns` keyed by `id`.
//
// As of v2, also persists Sound-page patterns in a parallel
// `soundPatterns` table. The two schemas are incompatible (voice-keyed
// vs positional channels), so they coexist until the old Studio is
// retired and a one-shot migration lifts userPatterns → soundPatterns.

import Dexie, { type Table } from 'dexie';
import type { Pattern } from '../patterns/types';
import type { SoundPattern } from '../patterns/types-sound';
import { PatternSchema, UserPatternSchema } from '../patterns/schema';

export interface UserPattern extends Pattern {
  user: true;
  createdAt: number;
  updatedAt: number;
}

class BFDatabase extends Dexie {
  userPatterns!: Table<UserPattern, string>;
  soundPatterns!: Table<SoundPattern, string>;

  constructor() {
    super('beatforge');
    this.version(1).stores({
      userPatterns: 'id, region, createdAt, updatedAt',
    });
    // v2: add soundPatterns. No migration needed — Dexie just creates
    // the new object store; existing userPatterns are untouched.
    this.version(2).stores({
      userPatterns: 'id, region, createdAt, updatedAt',
      soundPatterns: 'id, updatedAt',
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

// ── Sound-page patterns (v2) ───────────────────────────────────────
// Lighter-touch validation than userPatterns: we control both sides of
// the read/write contract (no seed library to validate against), so a
// shape check is enough to refuse genuinely corrupted IDB rows.

export function isValidSoundPattern(p: unknown): p is SoundPattern {
  if (!p || typeof p !== 'object') return false;
  const o = p as Record<string, unknown>;
  return typeof o.id === 'string'
    && typeof o.name === 'string'
    && typeof o.bpm === 'number'
    && Array.isArray(o.grouping)
    && (o.stepUnit === 4 || o.stepUnit === 8 || o.stepUnit === 16)
    && Array.isArray(o.sequence)
    && Array.isArray(o.channels)
    && typeof o.createdAt === 'number'
    && typeof o.updatedAt === 'number';
}

export async function saveSoundPattern(p: SoundPattern): Promise<void> {
  await db.soundPatterns.put(p);
}

export async function deleteSoundPattern(id: string): Promise<void> {
  await db.soundPatterns.delete(id);
}

/** Returns valid SoundPatterns sorted by updatedAt desc. Corrupted rows
 *  are silently skipped (the Studio-side loadAllSafe surfaces them for
 *  user inspection; for Sound we just drop — corruption is rarer in a
 *  schema we both own). */
export async function listSoundPatterns(): Promise<SoundPattern[]> {
  const raws = await db.soundPatterns.toArray();
  return raws
    .filter(isValidSoundPattern)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
