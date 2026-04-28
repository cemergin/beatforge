// Persistence for the secret MIDI tab's mapping table. Plain
// localStorage — the secret tab is dev-only and the mapping data is
// small + non-sensitive. No IDB ceremony needed.

import type { MidiInputMap } from '../modules/midi';

const KEY = 'bf_midi_mappings_v1';

/** Read the saved mapping list. Returns [] for first-run, parse
 *  failures, and storage-unavailable cases — the MIDI tab treats
 *  "no mappings" as the legitimate empty state. */
export function loadMidiMappings(): MidiInputMap[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMidiInputMap);
  } catch {
    return [];
  }
}

export function saveMidiMappings(maps: MidiInputMap[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(maps));
  } catch { /* storage full / disabled — silently drop */ }
}

/** Structural check — `maps` came from JSON.parse so we can't trust
 *  TS types. Reject anything that doesn't look like one of the two
 *  union variants. */
function isMidiInputMap(v: unknown): v is MidiInputMap {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  if (o.kind === 'note') {
    return typeof o.toAddress === 'string';
  }
  if (o.kind === 'cc') {
    return typeof o.toAddress === 'string' && typeof o.cc === 'number';
  }
  return false;
}
