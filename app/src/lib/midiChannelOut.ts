// Persistence for the MIDI tab's per-channel output routing. Same
// localStorage approach as midiMappings.ts — secret tab is dev-only,
// data is small + non-sensitive.

import { DEFAULT_CHANNEL_OUT, type ChannelOutConfig } from '../modules/midi/sink';
import { clampMidiByte, clampMidiChannel } from '../modules/midi/types';

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
    if (isChannelOutConfig(candidate)) {
      // Clamp persisted numerics so corrupt or out-of-range values
      // (manual edit, schema migration, future-version data) can't
      // flow through bit-shifting and misroute MIDI traffic.
      out.push({
        ...candidate,
        midiChannel: clampMidiChannel(candidate.midiChannel),
        note: clampMidiByte(candidate.note),
        velocityScale: Number.isFinite(candidate.velocityScale)
          ? Math.max(0, Math.min(1, candidate.velocityScale))
          : 1,
      });
    } else {
      out.push({ ...DEFAULT_CHANNEL_OUT });
    }
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
  // Persisted form may have outputId === '' from before the null
  // refactor; normalise on read so callers can treat unset as null
  // uniformly.
  if (o.outputId === '') o.outputId = null;
  const outputIdOk = o.outputId === null || typeof o.outputId === 'string';
  return typeof o.enabled === 'boolean'
    && outputIdOk
    && typeof o.midiChannel === 'number'
    && typeof o.note === 'number'
    && typeof o.velocityScale === 'number';
}
