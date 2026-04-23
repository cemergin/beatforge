// Shared Web Audio node-creation helpers used by every kit recipe.
// Previously lived on AudioEngine as `_createOsc` / `_createGain` /
// `_createBiquad` / `_noise`. Split out so kit files don't need a
// backref to the engine — they only ever see a VoiceCtx.

export function createOsc(ctx: AudioContext): OscillatorNode {
  return ctx.createOscillator();
}

export function createGain(ctx: AudioContext): GainNode {
  return ctx.createGain();
}

export function createBiquad(ctx: AudioContext): BiquadFilterNode {
  return ctx.createBiquadFilter();
}

// Short-lived white-noise buffer source. Matches legacy behavior: fills
// `dur` seconds of [-1, 1] uniform noise and returns an unstarted source.
export function createNoise(ctx: AudioContext, dur: number): AudioBufferSourceNode {
  const rate = ctx.sampleRate;
  const len = Math.ceil(rate * dur);
  const buf = ctx.createBuffer(1, len, rate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}
