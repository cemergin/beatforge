import type { Difficulty, Genre, KitId, RegionId } from '../../patterns/types';

export interface FilterState {
  meters: string[];
  regions: RegionId[];
  genres: Genre[];
  kits: KitId[];
  levels: Difficulty[];
}

export const DEFAULT_FILTERS: FilterState = {
  meters: [],
  regions: [],
  genres: [],
  kits: [],
  levels: [],
};
