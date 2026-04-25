// Shared AudioContext helper. Both the production AudioEngine and the
// Sound page's SoundEngine call this to create + resume a context with
// the iOS-Safari (webkitAudioContext) fallback path.
//
// Browsers needing the prefix: iOS Safari < 14.5, older desktop Safari.
// Standard `AudioContext` is the constructor on every modern engine.

declare global {
  interface Window {
    /** iOS / older-Safari prefix; standard `AudioContext` is preferred. */
    webkitAudioContext?: typeof AudioContext;
  }
}

/** Create an AudioContext, falling back to `webkitAudioContext` on
 *  older Safari. Returns null if neither is available (no Web Audio
 *  support — caller should surface a "your browser can't play sound"
 *  message). */
export function createAudioContext(): AudioContext | null {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  return new Ctor();
}

/** Resume the context if it's been suspended (autoplay policy). Idempotent. */
export async function resumeIfSuspended(ctx: AudioContext): Promise<void> {
  if (ctx.state === 'suspended') await ctx.resume();
}
