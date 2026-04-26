// Color FX builders for the per-channel ColorFx slot. Three types:
// overdrive (WaveShaper soft-clip + tone LP), bitcrush (WaveShaper
// quantization + LP fakes sample-rate reduction), filter (BiquadFilter
// with selectable mode). All three share the same topology:
//
//   input → wet path → wetGain ┐
//         → dryGain  ──────────┴→ output
//
// Dry/wet mix gives the user finer control than a hard insert. The
// dispatcher buildColorFx() returns null for type='none' — ChannelStrip
// already handles that case by reconnecting its passthrough.
//
// Rules: every node owned by an FxInstance must be disconnected in
// dispose(). ChannelStrip calls dispose() before swapping types; nodes
// left connected become orphaned but kept alive by the audio graph,
// which leaks memory across kit edits.

import type { ColorFx } from '../../patterns/types-sound';

export interface ColorFxInstance {
  input: AudioNode;
  output: AudioNode;
  dispose(): void;
}

export function buildColorFx(cfg: ColorFx, ctx: AudioContext): ColorFxInstance | null {
  switch (cfg.type) {
    case 'none':      return null;
    case 'overdrive': return buildOverdrive(cfg, ctx);
    case 'bitcrush':  return buildBitcrush(cfg, ctx);
    case 'filter':    return buildFilter(cfg, ctx);
  }
}

// ── Overdrive ────────────────────────────────────────────────────
// Soft-clip via WaveShaper. The drive knob simultaneously boosts the
// input and steepens the curve, so 0 = clean and 1 = heavy clip. Tone
// is a post-LP because saturation generates upper harmonics that can
// sound harsh; the LP rolls them off into "warm" territory.
function buildOverdrive(
  cfg: { drive: number; tone: number; mix: number },
  ctx: AudioContext,
): ColorFxInstance {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  dryGain.gain.value = 1 - cfg.mix;
  wetGain.gain.value = cfg.mix;

  const driveBoost = ctx.createGain();
  driveBoost.gain.value = 1 + cfg.drive * 12;

  const shaper = ctx.createWaveShaper();
  shaper.curve = makeOverdriveCurve(cfg.drive);
  // 4× oversampling: nonlinearities create supersonic harmonics that
  // alias back into the audible band at 44.1k. 4× pushes the worst
  // foldback up where the post-LP can catch it.
  shaper.oversample = '4x';

  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = cfg.tone;
  tone.Q.value = 0.5;

  // Trim — soft-clip pumps RMS up; pull it back so the FX isn't
  // unilaterally louder. Roughly cancels the driveBoost.
  const trim = ctx.createGain();
  trim.gain.value = 1 / Math.sqrt(1 + cfg.drive * 6);

  input.connect(dryGain).connect(output);
  input.connect(driveBoost).connect(shaper).connect(tone).connect(trim).connect(wetGain).connect(output);

  return {
    input, output,
    dispose() {
      try {
        input.disconnect();
        dryGain.disconnect();
        wetGain.disconnect();
        driveBoost.disconnect();
        shaper.disconnect();
        tone.disconnect();
        trim.disconnect();
        output.disconnect();
      } catch { /* idempotent */ }
    },
  };
}

// Note: explicit `Float32Array<ArrayBuffer>` return — strict TS5+
// distinguishes ArrayBuffer from SharedArrayBuffer and WaveShaper.curve
// only accepts the former. Allocating via `new ArrayBuffer(...)` makes
// that concrete; the type annotation makes it survive return widening.
function makeOverdriveCurve(drive: number, length = 4096): Float32Array<ArrayBuffer> {
  const k = drive * 100 + 1;
  const curve = new Float32Array(new ArrayBuffer(length * 4));
  const deg = Math.PI / 180;
  for (let i = 0; i < length; i++) {
    const x = (i / (length - 1)) * 2 - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

// ── Bitcrush ─────────────────────────────────────────────────────
// Bits via WaveShaper quantization. Rate as an LP cutoff fakes the
// brightness loss of true sample-rate reduction (which would also
// alias — that needs an AudioWorklet, which is overkill for this slot
// right now). Pair gives a recognizable "lo-fi" character.
function buildBitcrush(
  cfg: { bits: number; rate: number; mix: number },
  ctx: AudioContext,
): ColorFxInstance {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  dryGain.gain.value = 1 - cfg.mix;
  wetGain.gain.value = cfg.mix;

  const shaper = ctx.createWaveShaper();
  shaper.curve = makeBitcrushCurve(cfg.bits);

  const rateLp = ctx.createBiquadFilter();
  rateLp.type = 'lowpass';
  rateLp.frequency.value = Math.max(200, Math.min(20000, cfg.rate));
  rateLp.Q.value = 0.5;

  input.connect(dryGain).connect(output);
  input.connect(shaper).connect(rateLp).connect(wetGain).connect(output);

  return {
    input, output,
    dispose() {
      try {
        input.disconnect();
        dryGain.disconnect();
        wetGain.disconnect();
        shaper.disconnect();
        rateLp.disconnect();
        output.disconnect();
      } catch { /* idempotent */ }
    },
  };
}

function makeBitcrushCurve(bits: number, length = 65536): Float32Array<ArrayBuffer> {
  // Quantize the unit interval to 2^bits levels. Below ~3 bits the
  // signal collapses to ±1 ±0 territory — gnarly but musical for
  // accents and transients.
  const levels = Math.max(2, Math.pow(2, Math.max(1, bits)));
  const curve = new Float32Array(new ArrayBuffer(length * 4));
  for (let i = 0; i < length; i++) {
    const x = (i / (length - 1)) * 2 - 1;
    curve[i] = Math.round(x * levels) / levels;
  }
  return curve;
}

// ── Filter ───────────────────────────────────────────────────────
// BiquadFilter wrapping. Mode picks lp/hp/bp; cutoff + Q shape it.
// Mix lets the user blend dry signal back in (useful for parallel
// filter color rather than a hard cut).
function buildFilter(
  cfg: { mode: 'lp' | 'hp' | 'bp'; cutoff: number; q: number; mix: number },
  ctx: AudioContext,
): ColorFxInstance {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  dryGain.gain.value = 1 - cfg.mix;
  wetGain.gain.value = cfg.mix;

  const filter = ctx.createBiquadFilter();
  filter.type = cfg.mode === 'lp' ? 'lowpass'
              : cfg.mode === 'hp' ? 'highpass'
              :                     'bandpass';
  filter.frequency.value = cfg.cutoff;
  filter.Q.value = cfg.q;

  input.connect(dryGain).connect(output);
  input.connect(filter).connect(wetGain).connect(output);

  return {
    input, output,
    dispose() {
      try {
        input.disconnect();
        dryGain.disconnect();
        wetGain.disconnect();
        filter.disconnect();
        output.disconnect();
      } catch { /* idempotent */ }
    },
  };
}
