import type { Pattern, VoiceId } from '../patterns/types';
import { GROUP_COLORS, groupIndexForStep, isGroupDownbeat } from './visual-helpers';

interface Props {
  pattern: Pattern;
  cursors: Record<string, number>;
  size?: number;
  onToggle?: (track: VoiceId, step: number) => void;
}

export function CircularGrid({ pattern, cursors, size = 380, onToggle }: Props) {
  const tracks = Object.keys(pattern.tracks) as VoiceId[];
  const steps = pattern.steps;
  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.47;
  const ringGap = size * 0.09;
  const ringWidth = (outer - ringGap * 1.5) / (tracks.length + 1);

  const groupArcs: React.ReactNode[] = [];
  let acc = 0;
  pattern.grouping.forEach((len, gi) => {
    const a0 = (acc / steps) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((acc + len) / steps) * Math.PI * 2 - Math.PI / 2;
    const r = outer;
    const padA = 0.012;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + Math.cos(a0 + padA) * r;
    const y0 = cy + Math.sin(a0 + padA) * r;
    const x1 = cx + Math.cos(a1 - padA) * r;
    const y1 = cy + Math.sin(a1 - padA) * r;
    groupArcs.push(
      <path
        key={`ga${gi}`}
        d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`}
        stroke={GROUP_COLORS[gi % GROUP_COLORS.length]}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />,
    );
    acc += len;
  });

  const stepMarks: React.ReactNode[] = [];
  for (let s = 0; s < steps; s++) {
    const ang = (s / steps) * Math.PI * 2 - Math.PI / 2;
    const gi = groupIndexForStep(s, pattern.grouping);
    const isDown = isGroupDownbeat(s, pattern.grouping);
    const r1 = outer - 10;
    const r2 = outer - (isDown ? 22 : 16);
    stepMarks.push(
      <line
        key={`m${s}`}
        x1={cx + Math.cos(ang) * r1}
        y1={cy + Math.sin(ang) * r1}
        x2={cx + Math.cos(ang) * r2}
        y2={cy + Math.sin(ang) * r2}
        stroke={GROUP_COLORS[gi % GROUP_COLORS.length]}
        strokeWidth={isDown ? 2.5 : 1.2}
        opacity={isDown ? 1 : 0.4}
      />,
    );
  }

  const trackRings = tracks.map((tr, ti) => {
    const rMid = outer - ringGap - (ti + 1) * ringWidth;
    const rad = Math.max(8, ringWidth * 0.42);
    const trackData = pattern.tracks[tr]!;
    const isPoly = !Array.isArray(trackData);
    const cycle = isPoly ? trackData.cycle : trackData.length;
    const data = isPoly ? trackData.pattern : trackData;
    const cursor = cursors[tr] !== undefined ? (cursors[tr] + cycle - 1) % cycle : 0;

    const nodes: React.ReactNode[] = [];
    for (let s = 0; s < cycle; s++) {
      const ang = (s / cycle) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(ang) * rMid;
      const y = cy + Math.sin(ang) * rMid;
      const vel = data[s];
      const gi = isPoly ? s % GROUP_COLORS.length : groupIndexForStep(s, pattern.grouping);
      const color = GROUP_COLORS[gi % GROUP_COLORS.length];
      const active = vel > 0;
      const fill = active ? color : 'transparent';
      const opacity = active ? (vel === 2 ? 1 : 0.45) : 1;
      const isCursor = s === cursor;
      nodes.push(
        <g
          key={`${tr}${s}`}
          onClick={() => onToggle?.(tr, s)}
          style={{ cursor: onToggle ? 'pointer' : 'default' }}
        >
          <circle
            cx={x}
            cy={y}
            r={rad}
            fill={fill}
            stroke={color}
            strokeWidth={active ? 0 : 1.2}
            opacity={opacity}
          />
          {isCursor && (
            <circle
              cx={x}
              cy={y}
              r={rad + 4}
              fill="none"
              stroke="var(--fg)"
              strokeWidth={2}
              opacity={0.85}
            />
          )}
        </g>,
      );
    }

    return (
      <g key={tr}>
        <circle cx={cx} cy={cy} r={rMid} fill="none" stroke="var(--line)" strokeWidth={0.6} opacity={0.5} />
        {nodes}
        <text
          x={cx - rMid - 10}
          y={cy + 3}
          textAnchor="end"
          fontSize="10"
          fill="var(--muted)"
          style={{
            fontFamily: 'var(--mono)',
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {tr}
        </text>
      </g>
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bf-circ">
      {groupArcs}
      {stepMarks}
      {trackRings}
    </svg>
  );
}
