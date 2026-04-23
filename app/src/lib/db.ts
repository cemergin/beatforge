// IndexedDB persistence for user patterns (Studio output).
// See spec §8.3 — IndexedDB via Dexie, `userPatterns` keyed by `id`.

import Dexie, { type Table } from 'dexie';
import type {
  Difficulty,
  Genre,
  KitId,
  Pattern,
  RegionId,
  Track,
  VoiceId,
} from '../patterns/types';

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

const VOICE_IDS: VoiceId[] = ['KK', 'SN', 'HH', 'OH', 'CP'];
const KIT_IDS: KitId[] = ['808', '909', '707', '727', 'frameDrum', 'tabla', 'gamelan'];
const REGION_IDS: RegionId[] = [
  'turkey-ottoman', 'arabic-swana', 'persia', 'india', 'west-africa',
  'cuba-afrocaribbean', 'brazil', 'andean-south-america', 'caribbean',
  'balkans', 'iberia-flamenco', 'gamelan-southeast-asia', 'east-asia',
  'celtic-europe', 'electronic-western', 'exercise',
];
const GENRES: Genre[] = [
  'folk-dance', 'classical', 'devotional', 'popular', 'electronic',
  'hip-hop', 'jazz', 'ceremonial', 'exercise',
];
const DIFFS: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

function isVelocityArray(x: unknown): x is (0 | 1 | 2)[] {
  return Array.isArray(x) && x.every((v) => v === 0 || v === 1 || v === 2);
}

function isTrack(x: unknown): x is Track {
  if (isVelocityArray(x)) return true;
  if (x && typeof x === 'object' && 'pattern' in x) {
    const o = x as { pattern: unknown; subdivisions?: unknown; cycle?: unknown };
    if (!isVelocityArray(o.pattern)) return false;
    if (o.subdivisions !== undefined && typeof o.subdivisions !== 'number') return false;
    if (o.cycle !== undefined && typeof o.cycle !== 'number') return false;
    return true;
  }
  return false;
}

export function isValidPattern(p: unknown): p is Pattern {
  if (!p || typeof p !== 'object') return false;
  const o = p as Record<string, unknown>;

  if (typeof o.id !== 'string' || !o.id) return false;
  if (typeof o.name !== 'string' || !o.name) return false;
  if (typeof o.steps !== 'number' || o.steps < 1) return false;
  if (!Array.isArray(o.grouping) || !o.grouping.every((g) => typeof g === 'number' && g > 0)) return false;

  const groupingSum = (o.grouping as number[]).reduce((a, b) => a + b, 0);
  if (groupingSum !== o.steps) return false;

  if (!o.tracks || typeof o.tracks !== 'object') return false;
  const tracks = o.tracks as Record<string, unknown>;
  const tkeys = Object.keys(tracks);
  if (tkeys.length === 0) return false;
  for (const k of tkeys) {
    if (!(VOICE_IDS as string[]).includes(k)) return false;
    if (!isTrack(tracks[k])) return false;
  }

  if (!KIT_IDS.includes(o.defaultKit as KitId)) return false;
  if (!REGION_IDS.includes(o.region as RegionId)) return false;
  if (!GENRES.includes(o.genre as Genre)) return false;
  if (!DIFFS.includes(o.difficulty as Difficulty)) return false;
  if (!Array.isArray(o.tags) || !o.tags.every((t) => typeof t === 'string')) return false;
  if (typeof o.swingable !== 'boolean') return false;
  if (typeof o.timeSig !== 'string') return false;
  if (o.stepUnit !== 4 && o.stepUnit !== 8 && o.stepUnit !== 16) return false;

  if (!o.bpm || typeof o.bpm !== 'object') return false;
  const bpm = o.bpm as Record<string, unknown>;
  if (typeof bpm.default !== 'number' || typeof bpm.min !== 'number' || typeof bpm.max !== 'number') {
    return false;
  }

  return true;
}

export function isValidUserPattern(p: unknown): p is UserPattern {
  if (!isValidPattern(p)) return false;
  const o = p as unknown as Record<string, unknown>;
  return (
    o.user === true
    && typeof o.createdAt === 'number'
    && typeof o.updatedAt === 'number'
  );
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
