export type {
  AudioModule,
  ControllableModule,
  ParamSpec,
  SetOptions,
} from './types';
export { chain, parallel, sink, tap, wrap } from './compose';
export {
  bandpass,
  delay,
  gain,
  highpass,
  lowpass,
  panner,
  shaper,
  SHAPER_CURVES,
} from './primitives';
export type { ShaperCurveBuilder } from './primitives';
