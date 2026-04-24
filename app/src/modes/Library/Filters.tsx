import type { Difficulty, Genre, KitId, RegionId } from '../../patterns/types';
import { REGIONS } from './regions';
import type { FilterState } from './filterState';

interface Props {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  allMeters: string[];
  allGenres: Genre[];
  allKits: KitId[];
  count: number;
  total: number;
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function Filters({
  filters, setFilters, allMeters, allGenres, allKits, count, total,
}: Props) {
  const ALL_LEVELS: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
  return (
    <div className="bf-lib-filters-block">
      <FilterRow
        label="meter"
        values={allMeters}
        selected={filters.meters}
        onToggle={(v) => setFilters({ ...filters, meters: toggle(filters.meters, v) })}
        onClear={() => setFilters({ ...filters, meters: [] })}
      />
      <FilterRow
        label="region"
        values={REGIONS.map((r) => r.id)}
        selected={filters.regions}
        renderLabel={(v) => REGIONS.find((r) => r.id === v)?.short ?? v}
        onToggle={(v) => setFilters({ ...filters, regions: toggle(filters.regions, v as RegionId) })}
        onClear={() => setFilters({ ...filters, regions: [] })}
      />
      <FilterRow
        label="genre"
        values={allGenres}
        selected={filters.genres}
        onToggle={(v) => setFilters({ ...filters, genres: toggle(filters.genres, v as Genre) })}
        onClear={() => setFilters({ ...filters, genres: [] })}
      />
      <FilterRow
        label="kit"
        values={allKits}
        selected={filters.kits}
        renderLabel={(v) => (v === 'frameDrum' ? 'frame' : v)}
        onToggle={(v) => setFilters({ ...filters, kits: toggle(filters.kits, v as KitId) })}
        onClear={() => setFilters({ ...filters, kits: [] })}
      />
      <FilterRow
        label="level"
        values={ALL_LEVELS}
        selected={filters.levels}
        onToggle={(v) => setFilters({ ...filters, levels: toggle(filters.levels, v as Difficulty) })}
        onClear={() => setFilters({ ...filters, levels: [] })}
      />

      <div className="bf-filter-row-wrap bf-filter-count-row">
        <span className="bf-lib-count">{count} / {total} match</span>
      </div>
    </div>
  );
}

interface RowProps<T extends string> {
  label: string;
  values: T[];
  selected: T[];
  onToggle: (v: T) => void;
  onClear: () => void;
  renderLabel?: (v: T) => string;
}

function FilterRow<T extends string>({
  label, values, selected, onToggle, onClear, renderLabel,
}: RowProps<T>) {
  return (
    <div className="bf-filter-row-wrap">
      <span className="bf-filter-label">{label}</span>
      <div className="bf-chip-row">
        <button
          className={`bf-chip sm ${selected.length === 0 ? 'on' : ''}`}
          onClick={onClear}
          type="button"
        >
          all
        </button>
        {values.map((v) => (
          <button
            key={v}
            className={`bf-chip sm ${selected.includes(v) ? 'on' : 'ghost'}`}
            onClick={() => onToggle(v)}
            type="button"
          >
            {renderLabel ? renderLabel(v) : v}
          </button>
        ))}
      </div>
    </div>
  );
}
