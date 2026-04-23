export const GROUP_COLORS = [
  'var(--grp-1)',
  'var(--grp-2)',
  'var(--grp-3)',
  'var(--grp-4)',
  'var(--grp-5)',
  'var(--grp-6)',
  'var(--grp-7)',
];

export function groupIndexForStep(stepIdx: number, grouping: number[]): number {
  let acc = 0;
  for (let i = 0; i < grouping.length; i++) {
    acc += grouping[i];
    if (stepIdx < acc) return i;
  }
  return grouping.length - 1;
}

export function isGroupDownbeat(stepIdx: number, grouping: number[]): boolean {
  let acc = 0;
  for (let i = 0; i < grouping.length; i++) {
    if (stepIdx === acc) return true;
    acc += grouping[i];
  }
  return false;
}
