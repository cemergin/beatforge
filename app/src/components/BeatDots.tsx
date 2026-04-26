import { GROUP_COLORS } from './visual-helpers';

interface Props {
  grouping: number[];
  currentStep: number;
  size?: number;
  /** When provided, opacity is driven by the per-step velocity rather
   *  than down/off-beat. 0 = faint, 1 = solid, 2 = solid + accent ring.
   *  Lets the same component double as a per-channel rhythm preview. */
  velocities?: number[];
}

export function BeatDots({ grouping, currentStep, size = 14, velocities }: Props) {
  const dots: React.ReactNode[] = [];
  let s = 0;
  for (let g = 0; g < grouping.length; g++) {
    for (let i = 0; i < grouping[g]; i++) {
      const isDownbeat = i === 0;
      const isCurrent = currentStep === s;
      let opacity: number;
      let accent = false;
      if (velocities) {
        const v = velocities[s] ?? 0;
        opacity = v === 2 ? 1 : v === 1 ? 0.75 : 0.12;
        accent = v === 2;
      } else {
        opacity = isDownbeat ? 1 : 0.38;
      }
      dots.push(
        <span
          key={s}
          className={`bf-dot ${isDownbeat ? 'dn' : 'up'} ${isCurrent ? 'on' : ''} ${accent ? 'acc' : ''}`}
          style={{
            background: GROUP_COLORS[g % GROUP_COLORS.length],
            width: size,
            height: size,
            opacity,
          }}
        />,
      );
      s++;
    }
    if (g < grouping.length - 1) {
      dots.push(<span key={`sep${g}`} className="bf-dot-sep" />);
    }
  }
  return <div className="bf-dots">{dots}</div>;
}
