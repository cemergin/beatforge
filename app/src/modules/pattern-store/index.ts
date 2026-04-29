// Pattern-store facade. One module that hides the two-table dance
// (soundPatterns + userPatterns) behind a unified StudioPattern shape.

export type { StudioPattern, StudioPatternListItem } from './types';
export {
  saveStudioPattern,
  loadStudioPattern,
  listStudioPatterns,
  deleteStudioPattern,
  mergeSoundAndMeta,
  buildSoundPattern,
  buildUserPatternView,
  sequenceFromTracks,
} from './store';
export { defaultMetadata, nextPatternName } from './defaults';
export type { StudioMetadataDefaults } from './defaults';
