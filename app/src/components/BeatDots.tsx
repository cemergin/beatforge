import { GROUP_COLORS } from './visual-helpers';

interface Props {
  grouping: number[];
  currentStep: number;
  size?: number;
}

export function BeatDots({ grouping, currentStep, size = 14 }: Props) {
  const dots: React.ReactNode[] = [];
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
