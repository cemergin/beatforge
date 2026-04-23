// BeatForge UI components — React (Babel) JSX
// All exports attached to window at the end for cross-script sharing.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Visual helpers ──────────────────────────────────────────────────────
const GROUP_COLORS = [
  'var(--grp-1)',
  'var(--grp-2)',
  'var(--grp-3)',
  'var(--grp-4)',
  'var(--grp-5)',
  'var(--grp-6)',
  'var(--grp-7)',
];

function groupIndexForStep(stepIdx, grouping) {
  let acc = 0;
  for (let i = 0; i < grouping.length; i++) {
    acc += grouping[i];
    if (stepIdx < acc) return i;
  }
  return grouping.length - 1;
}

function isGroupDownbeat(stepIdx, grouping) {
  let acc = 0;
  for (let i = 0; i < grouping.length; i++) {
    if (stepIdx === acc) return true;
    acc += grouping[i];
  }
  return false;
}

// ── Beat-group dots ─────────────────────────────────────────────────────
function BeatDots({ grouping, currentStep, size = 14 }) {
  const dots = [];
  let s = 0;
  for (let g = 0; g < grouping.length; g++) {
    for (let i = 0; i < grouping[g]; i++) {
      const isDownbeat = i === 0;
      const isCurrent = currentStep === s;
      dots.push(
        <span
          key={s}
          className={`bf-dot ${isDownbeat ? 'dn' : 'up'} ${isCurrent ? 'on' : ''}`}
          style={{
            background: GROUP_COLORS[g % GROUP_COLORS.length],
            width: size,
            height: size,
            opacity: isDownbeat ? 1 : 0.38,
          }}
        />
      );
      s++;
    }
    if (g < grouping.length - 1) {
      dots.push(<span key={'sep' + g} className="bf-dot-sep" />);
    }
  }
  return <div className="bf-dots">{dots}</div>;
}

// ── Circular grid (radial) ──────────────────────────────────────────────
function CircularGrid({ pattern, cursors, size = 380, onToggle }) {
  const tracks = Object.keys(pattern.tracks);
  const steps = pattern.steps;
  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.47;
  const ringGap = (size * 0.09);
  const ringWidth = (outer - ringGap * 1.5) / (tracks.length + 1);

  // Group arcs in outermost ring
  const groupArcs = [];
  let acc = 0;
  pattern.grouping.forEach((len, gi) => {
    const a0 = (acc / steps) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((acc + len) / steps) * Math.PI * 2 - Math.PI / 2;
    const r = outer;
    const padA = 0.012;
    const large = (a1 - a0) > Math.PI ? 1 : 0;
    const x0 = cx + Math.cos(a0 + padA) * r;
    const y0 = cy + Math.sin(a0 + padA) * r;
    const x1 = cx + Math.cos(a1 - padA) * r;
    const y1 = cy + Math.sin(a1 - padA) * r;
    groupArcs.push(
      <path
        key={'ga' + gi}
        d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`}
        stroke={GROUP_COLORS[gi % GROUP_COLORS.length]}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />
    );
    acc += len;
  });

  // step tick marks on master ring + labels
  const stepMarks = [];
  for (let s = 0; s < steps; s++) {
    const ang = (s / steps) * Math.PI * 2 - Math.PI / 2;
    const gi = groupIndexForStep(s, pattern.grouping);
    const isDown = isGroupDownbeat(s, pattern.grouping);
    const r1 = outer - 10;
    const r2 = outer - (isDown ? 22 : 16);
    const x1 = cx + Math.cos(ang) * r1;
    const y1 = cy + Math.sin(ang) * r1;
    const x2 = cx + Math.cos(ang) * r2;
    const y2 = cy + Math.sin(ang) * r2;
    stepMarks.push(
      <line
        key={'m' + s}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={GROUP_COLORS[gi % GROUP_COLORS.length]}
        strokeWidth={isDown ? 2.5 : 1.2}
        opacity={isDown ? 1 : 0.4}
      />
    );
  }

  // Track rings
  const trackRings = tracks.map((tr, ti) => {
    const rMid = outer - ringGap - (ti + 1) * ringWidth;
    const rad = Math.max(8, ringWidth * 0.42);
    const trackData = pattern.tracks[tr];
    const isPoly = !Array.isArray(trackData);
    const cycle = isPoly ? trackData.cycle : trackData.length;
    const data = isPoly ? trackData.pattern : trackData;
    const cursor = cursors[tr] !== undefined ? (cursors[tr] + cycle - 1) % cycle : 0;
    // Draw cells — one per cycle position, positioned around circle
    const nodes = [];
    for (let s = 0; s < cycle; s++) {
      const ang = (s / cycle) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(ang) * rMid;
      const y = cy + Math.sin(ang) * rMid;
      const vel = data[s];
      // For master-aligned tracks, use the master grouping color. For poly tracks, cycle through group colors based on local beat.
      const gi = isPoly ? (s % GROUP_COLORS.length) : groupIndexForStep(s, pattern.grouping);
      const color = GROUP_COLORS[gi % GROUP_COLORS.length];
      const active = vel > 0;
      const fill = active ? color : 'transparent';
      const opacity = active ? (vel === 2 ? 1 : 0.45) : 1;
      const isCursor = s === cursor;
      nodes.push(
        <g key={tr + s} data-toggle onClick={() => onToggle && onToggle(tr, s)} style={{ cursor: onToggle ? 'pointer' : 'default' }}>
          <circle cx={x} cy={y} r={rad} fill={fill} stroke={color} strokeWidth={active ? 0 : 1.2} opacity={opacity} />
          {isCursor && (
            <circle cx={x} cy={y} r={rad + 4} fill="none" stroke="var(--fg)" strokeWidth={2} opacity={0.85} />
          )}
        </g>
      );
    }
    // Ring label
    const lx = cx - outer + 2;
    return (
      <g key={tr}>
        <circle cx={cx} cy={cy} r={rMid} fill="none" stroke="var(--line)" strokeWidth={0.6} opacity={0.5} />
        {nodes}
        <text x={cx - rMid - 10} y={cy + 3} textAnchor="end" fontSize="10" fill="var(--muted)" style={{ fontFamily: 'var(--mono)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
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

// ── Linear grid ─────────────────────────────────────────────────────────
function LinearGrid({ pattern, cursors, onToggle }) {
  const tracks = Object.keys(pattern.tracks);
  const steps = pattern.steps;
  const styleVar = { '--steps': steps };
  return (
    <div className="bf-linear" style={styleVar}>
      <div className="bf-linear-head" style={styleVar}>
        <div className="bf-linear-label" />
        {Array.from({ length: steps }).map((_, s) => {
          const gi = groupIndexForStep(s, pattern.grouping);
          const isDown = isGroupDownbeat(s, pattern.grouping);
          return (
            <div
              key={s}
              className={`bf-linear-head-cell ${isDown ? 'down' : ''}`}
              style={{ color: GROUP_COLORS[gi % GROUP_COLORS.length] }}
            >
              <span>{isDown ? Math.floor(s / Math.max(1, pattern.grouping[0])) + 1 : '·'}</span>
            </div>
          );
        })}
      </div>
      {tracks.map((tr) => {
        const td = pattern.tracks[tr];
        const isPoly = !Array.isArray(td);
        const cycle = isPoly ? td.cycle : td.length;
        const data = isPoly ? td.pattern : td;
        const cursor = cursors[tr] !== undefined ? (cursors[tr] + cycle - 1) % cycle : 0;
        return (
          <div key={tr} className="bf-linear-row" style={styleVar}>
            <div className="bf-linear-label">{tr}</div>
            {Array.from({ length: steps }).map((_, s) => {
              const localIdx = isPoly ? (s % cycle) : s;
              const vel = data[localIdx];
              const gi = isPoly ? ((localIdx) % GROUP_COLORS.length) : groupIndexForStep(s, pattern.grouping);
              const color = GROUP_COLORS[gi % GROUP_COLORS.length];
              const active = vel > 0;
              const isCur = isPoly ? (localIdx === cursor) : (s === cursor);
              return (
                <div
                  key={s}
                  className={`bf-cell ${active ? 'on' : ''} ${isCur ? 'cur' : ''}`}
                  style={{
                    background: active ? color : 'transparent',
                    borderColor: color,
                    opacity: active ? (vel === 2 ? 1 : 0.5) : 0.9,
                  }}
                  onClick={() => onToggle && onToggle(tr, localIdx)}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Pill view — chunked by beat group ──────────────────────────────────
function PillGrid({ pattern, cursors, onToggle }) {
  const tracks = Object.keys(pattern.tracks);
  const groups = pattern.grouping;
  // Compute start-step for each group
  const groupStarts = [];
  let acc = 0;
  groups.forEach((g) => { groupStarts.push(acc); acc += g; });

  return (
    <div className="bf-pill">
      {tracks.map((tr) => {
        const td = pattern.tracks[tr];
        const isPoly = !Array.isArray(td);
        const cycle = isPoly ? td.cycle : td.length;
        const data = isPoly ? td.pattern : td;
        const cursor = cursors[tr] !== undefined ? (cursors[tr] + cycle - 1) % cycle : 0;
        return (
          <div key={tr} className="bf-pill-row">
            <div className="bf-pill-label">{tr}</div>
            <div className="bf-pill-groups">
              {groups.map((glen, gi) => (
                <div
                  key={gi}
                  className="bf-pill-group"
                  style={{ borderColor: GROUP_COLORS[gi % GROUP_COLORS.length] }}
                >
                  {Array.from({ length: glen }).map((_, i) => {
                    const s = groupStarts[gi] + i;
                    const localIdx = isPoly ? (s % cycle) : s;
                    const vel = data[localIdx];
                    const color = GROUP_COLORS[gi % GROUP_COLORS.length];
                    const active = vel > 0;
                    const isCur = isPoly ? (localIdx === cursor) : (s === cursor);
                    return (
                      <div
                        key={i}
                        className={`bf-cell ${active ? 'on' : ''} ${isCur ? 'cur' : ''}`}
                        style={{
                          background: active ? color : 'transparent',
                          borderColor: color,
                          opacity: active ? (vel === 2 ? 1 : 0.5) : 0.9,
                        }}
                        onClick={() => onToggle && onToggle(tr, localIdx)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { BeatDots, CircularGrid, LinearGrid, PillGrid, GROUP_COLORS, groupIndexForStep, isGroupDownbeat });
