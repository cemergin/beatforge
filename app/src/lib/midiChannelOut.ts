// Persistence for the MIDI tab's per-channel output routing. Same
// localStorage approach as midiMappings.ts — secret tab is dev-only,
// data is small + non-sensitive.

import { DEFAULT_CHANNEL_OUT, type ChannelOutConfig } from '../modules/midi/sink';

const KEY = 'bf_midi_channel_out_v1';

/** Load N rows of channel-output config. Always returns exactly
 *  `count` entries — missing rows fall back to DEFAULT_CHANNEL_OUT
 *  so the UI can render a stable 5-row table from day one. */
export function loadChannelOuts(count: number): ChannelOutConfig[] {
  const out: ChannelOutConfig[] = [];
  let saved: unknown[] = [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) saved = parsed;
    }
  } catch { /* fall through to defaults */ }

  for (let i = 0; i < count; i++) {
    const candidate = saved[i];
    if (isChannelOutConfig(candidate)) out.push(candidate);
    else out.push({ ...DEFAULT_CHANNEL_OUT });
  }
  return out;
}

export function saveChannelOuts(rows: readonly ChannelOutConfig[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
  } catch { /* storage full / disabled — silently drop */ }
}

function isChannelOutConfig(v: unknown): v is ChannelOutConfig {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.enabled === 'boolean'
    && typeof o.outputId === 'string'
    && typeof o.midiChannel === 'number'
    && typeof o.note === 'number'
    && typeof o.velocityScale === 'number';
}
