import type { Pattern } from '../../patterns/types';
import { BeatDots } from '../../components/BeatDots';

interface Props {
  patterns: Pattern[];
  selected: string | null;
  onPick: (groupingKey: string | null) => void;
}

export function GroupingBrowser({ patterns, selected, onPick }: Props) {
  const counts = new Map<string, { grouping: number[]; count: number; steps: number }>();
  for (const p of patterns) {
    const key = p.grouping.join('+');
    const prev = counts.get(key);
    if (prev) {
      prev.count++;
    } else {
      counts.set(key, {
        grouping: p.grouping,
        count: 1,
        steps: p.grouping.reduce((a, b) => a + b, 0),
      });
    }
  }
  const entries = Array.from(counts.entries()).sort(
    (a, b) => b[1].count - a[1].count || a[1].steps - b[1].steps,
  );

  return (
    <div className="bf-grouping-browser">
      {entries.map(([key, info]) => (
        <button
          key={key}
          className={`bf-group-card ${selected === key ? 'on' : ''}`}
          onClick={() => onPick(selected === key ? null : key)}
          type="button"
        >
          <div className="bf-group-card-head">
            <span className="bf-group-card-key">{key}</span>
            <span className="bf-group-card-count">{info.count} rhythm{info.count === 1 ? '' : 's'}</span>
          </div>
          <BeatDots grouping={info.grouping} currentStep={-1} size={9} />
          <div className="bf-group-card-sum">{info.steps} steps</div>
        </button>
      ))}
    </div>
  );
}
