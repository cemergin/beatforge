// Circular knob component — drag-to-rotate, optional exponential
// curve, value readout below. SVG so it stays crisp at any size.
//
// Interaction:
//   - Click + drag UP increases value, DOWN decreases.
//   - 200px drag covers the full range. Shift to slow 5×.
//   - Mouse wheel: fine adjustment (1% of range per tick).
//   - Double click: reset to default.

import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  defaultValue: number;
  curve?: 'lin' | 'exp';
  unit?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  size?: number;
}

const SWEEP_DEG = 270;
const ANGLE_OFFSET = -135;
const DRAG_PIXELS_FULL = 200;

function valueToNorm(value: number, min: number, max: number, curve: 'lin' | 'exp'): number {
  if (curve === 'exp' && min > 0 && max > 0) {
    return Math.log(value / min) / Math.log(max / min);
  }
  return (value - min) / (max - min);
}

function normToValue(norm: number, min: number, max: number, curve: 'lin' | 'exp'): number {
  const c = Math.max(0, Math.min(1, norm));
  if (curve === 'exp' && min > 0 && max > 0) {
    return min * Math.pow(max / min, c);
  }
  return min + c * (max - min);
}

export function Knob({
  label, value, min, max, defaultValue,
  curve = 'lin', unit, format, onChange, size = 56,
}: Props) {
  const norm = Math.max(0, Math.min(1, valueToNorm(value, min, max, curve)));
  const angle = ANGLE_OFFSET + norm * SWEEP_DEG;

  // Drag state lives in a ref so the global pointermove/up handlers
  // (attached during drag only) read the latest start values.
  const dragStateRef = useRef<{
    startY: number;
    startNorm: number;
    shift: boolean;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      startY: e.clientY,
      startNorm: valueToNorm(value, min, max, curve),
      shift: e.shiftKey,
    };
    setIsDragging(true);
  }, [value, min, max, curve]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const s = dragStateRef.current;
    if (!s) return;
    e.preventDefault();
    const speed = e.shiftKey || s.shift ? 0.2 : 1;
    const dy = (s.startY - e.clientY) / DRAG_PIXELS_FULL;
    const nextNorm = Math.max(0, Math.min(1, s.startNorm + dy * speed));
    onChange(normToValue(nextNorm, min, max, curve));
  }, [min, max, curve, onChange]);

  const onPointerUp = useCallback(() => {
    dragStateRef.current = null;
    setIsDragging(false);
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const cur = valueToNorm(value, min, max, curve);
    const delta = -Math.sign(e.deltaY) * 0.01 * (e.shiftKey ? 0.2 : 1);
    const nextNorm = Math.max(0, Math.min(1, cur + delta));
    onChange(normToValue(nextNorm, min, max, curve));
  }, [value, min, max, curve, onChange]);

  const onDoubleClick = useCallback(() => {
    onChange(defaultValue);
  }, [onChange, defaultValue]);

  // Native wheel listener — React's onWheel synth event is passive
  // so preventDefault() doesn't stop page scroll. Attach a non-passive
  // listener to the wrapper for proper wheel-without-scroll behavior.
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      // Re-derive deltas inside since this is a native event.
      const cur = valueToNorm(value, min, max, curve);
      const delta = -Math.sign(e.deltaY) * 0.01 * (e.shiftKey ? 0.2 : 1);
      const nextNorm = Math.max(0, Math.min(1, cur + delta));
      onChange(normToValue(nextNorm, min, max, curve));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [value, min, max, curve, onChange]);

  // Geometry — the arc shows the current value as a partial sweep
  // around the dial.
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const startA = (ANGLE_OFFSET - 90) * Math.PI / 180;
  const endA = (ANGLE_OFFSET - 90 + norm * SWEEP_DEG) * Math.PI / 180;
  const arcPath = describeArc(cx, cy, r, startA, endA);

  // Pointer line for the indicator.
  const pointerInner = r - 4;
  const pointerOuter = r + 1;
  const pa = (angle - 90) * Math.PI / 180;
  const px1 = cx + Math.cos(pa) * pointerInner;
  const py1 = cy + Math.sin(pa) * pointerInner;
  const px2 = cx + Math.cos(pa) * pointerOuter;
  const py2 = cy + Math.sin(pa) * pointerOuter;

  const display = format ? format(value)
    : Math.abs(value) >= 100 ? value.toFixed(0)
    : Math.abs(value) >= 10 ? value.toFixed(1)
    : value.toFixed(2);

  return (
    <div
      ref={wrapperRef}
      className={`bf-knob ${isDragging ? 'dragging' : ''}`}
      onWheel={onWheel}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
      >
        {/* Track (full sweep) */}
        <path
          d={describeArc(cx, cy, r, startA, (ANGLE_OFFSET - 90 + SWEEP_DEG) * Math.PI / 180)}
          stroke="var(--line)"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        {/* Active arc (current value) */}
        <path
          d={arcPath}
          stroke="var(--accent)"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        {/* Knob body */}
        <circle
          cx={cx} cy={cy} r={r - 6}
          fill="var(--bg-2)"
          stroke="var(--line)"
          strokeWidth={1}
        />
        {/* Pointer */}
        <line
          x1={px1} y1={py1} x2={px2} y2={py2}
          stroke="var(--fg)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
      <div className="bf-knob-label">{label}</div>
      <div className="bf-knob-val">
        {display}{unit ? ` ${unit}` : ''}
      </div>
    </div>
  );
}

/** Build an SVG arc path from center + radius + angles (radians). */
function describeArc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const x0 = cx + Math.cos(a0) * r;
  const y0 = cy + Math.sin(a0) * r;
  const x1 = cx + Math.cos(a1) * r;
  const y1 = cy + Math.sin(a1) * r;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}
