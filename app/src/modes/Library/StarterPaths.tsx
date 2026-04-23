import type { Pattern } from '../../patterns/types';
import { STARTER_PATHS, type StarterPath } from './paths';

interface Props {
  patterns: Pattern[];
  onPickPath: (path: StarterPath) => void;
  progress: Record<string, number>;
}

export function StarterPaths({ patterns, onPickPath, progress }: Props) {
  const known = new Set(patterns.map((p) => p.id));
  return (
    <div className="bf-starter-grid">
      {STARTER_PATHS.map((path) => {
        const valid = path.patternIds.filter((id) => known.has(id));
        const at = progress[path.id] ?? 0;
        return (
          <button
            key={path.id}
            className="bf-starter-card"
            onClick={() => onPickPath(path)}
            type="button"
            disabled={valid.length === 0}
          >
            <div className="bf-starter-head">
              <div className="bf-starter-title">{path.title}</div>
              <div className="bf-starter-count">{valid.length} patterns</div>
            </div>
            <div className="bf-starter-sub">{path.subtitle}</div>
            <p className="bf-starter-context">{path.context}</p>
            {at > 0 && at < valid.length && (
              <div className="bf-starter-progress">
                <span>step {at + 1} of {valid.length}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
