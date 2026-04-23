// Region display metadata — labels + colors for the World Map blobs
// and the region filter row. Colors cycle through GROUP_COLORS so we
// don't introduce any new tokens.

import { GROUP_COLORS } from '../../components/visual-helpers';
import type { RegionId } from '../../patterns/types';

export interface RegionMeta {
  id: RegionId;
  label: string;
  short: string;
  color: string;
}

// Order roughly groups by continent for the World Map layout.
const BASE: { id: RegionId; label: string; short: string }[] = [
  { id: 'turkey-ottoman', label: 'Turkey / Ottoman', short: 'Turkey' },
  { id: 'arabic-swana', label: 'Arabic / SWANA', short: 'SWANA' },
  { id: 'persia', label: 'Persia', short: 'Persia' },
  { id: 'india', label: 'India', short: 'India' },
  { id: 'gamelan-southeast-asia', label: 'Gamelan / SE Asia', short: 'Gamelan' },
  { id: 'east-asia', label: 'East Asia', short: 'E. Asia' },
  { id: 'west-africa', label: 'West Africa', short: 'W. Africa' },
  { id: 'cuba-afrocaribbean', label: 'Cuba / Afro-Caribbean', short: 'Cuba' },
  { id: 'caribbean', label: 'Caribbean', short: 'Caribbean' },
  { id: 'brazil', label: 'Brazil', short: 'Brazil' },
  { id: 'andean-south-america', label: 'Andean South America', short: 'Andes' },
  { id: 'balkans', label: 'Balkans', short: 'Balkans' },
  { id: 'iberia-flamenco', label: 'Iberia / Flamenco', short: 'Iberia' },
  { id: 'celtic-europe', label: 'Celtic / Europe', short: 'Celtic' },
  { id: 'electronic-western', label: 'Electronic / Western', short: 'Electronic' },
  { id: 'exercise', label: 'Polyrhythm Exercises', short: 'Exercises' },
];

export const REGIONS: RegionMeta[] = BASE.map((r, i) => ({
  ...r,
  color: GROUP_COLORS[i % GROUP_COLORS.length],
}));

export const REGION_BY_ID: Record<RegionId, RegionMeta> = REGIONS.reduce(
  (acc, r) => { acc[r.id] = r; return acc; },
  {} as Record<RegionId, RegionMeta>,
);

export function regionLabel(id: RegionId): string {
  return REGION_BY_ID[id]?.label ?? id;
}
