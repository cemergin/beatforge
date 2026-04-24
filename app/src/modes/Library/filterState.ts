import type { Genre, KitId, RegionId } from '../../patterns/types';

export interface FilterState {
  meters: string[];
  regions: RegionId[];
  genres: Genre[];
  kits: KitId[];
}

export const DEFAULT_FILTERS: FilterState = {
  meters: [],
  regions: [],
  genres: [],
  kits: [],
};
