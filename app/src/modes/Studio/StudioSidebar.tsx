// Studio left sidebar: metadata form + "Yours" list.

import type { Difficulty, Genre, KitId, Pattern, RegionId } from '../../patterns/types';
import type { LoadedUserPattern } from '../../lib/db';
import { REGIONS } from '../Library/regions';

const ALL_KITS: KitId[] = ['808', '909', '707', '727', 'frameDrum', 'tabla', 'gamelan'];
const DIFFS: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
const GENRES: Genre[] = [
  'folk-dance', 'classical', 'devotional', 'popular',
  'electronic', 'hip-hop', 'jazz', 'ceremonial', 'exercise',
];

interface Props {
  draft: Pattern;
  updateDraft: (partial: Partial<Pattern>) => void;
  updateBpm: (partial: Partial<Pattern['bpm']>) => void;
  yours: LoadedUserPattern[];
  currentId: string | null;
  onLoadPattern: (id: string) => void;
  onDeletePattern: (id: string) => void;
}

export function StudioSidebar({
  draft, updateDraft, updateBpm, yours, currentId, onLoadPattern, onDeletePattern,
}: Props) {
  return (
    <div className="bf-studio-sidebar">
      <div className="bf-panel">
        <div className="bf-panel-head">pattern info</div>
        <label className="bf-studio-field">
          <span className="bf-mini-label">name *</span>
          <input
            className="bf-studio-input"
            value={draft.name}
            onChange={(e) => updateDraft({ name: e.target.value })}
            placeholder="My Pattern"
          />
        </label>
        <label className="bf-studio-field">
          <span className="bf-mini-label">origin</span>
          <input
            className="bf-studio-input"
            value={draft.origin}
            onChange={(e) => updateDraft({ origin: e.target.value })}
            placeholder="e.g. Turkey · Thrace"
          />
        </label>
        <label className="bf-studio-field">
          <span className="bf-mini-label">tradition</span>
          <input
            className="bf-studio-input"
            value={draft.tradition}
            onChange={(e) => updateDraft({ tradition: e.target.value })}
            placeholder="e.g. Wedding dance"
          />
        </label>
        <label className="bf-studio-field">
          <span className="bf-mini-label">tags (comma)</span>
          <input
            className="bf-studio-input"
            value={draft.tags.join(', ')}
            onChange={(e) => updateDraft({
              tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
            })}
            placeholder="wedding, dance, romani"
          />
        </label>
        <label className="bf-studio-field">
          <span className="bf-mini-label">notes / story</span>
          <textarea
            className="bf-studio-input bf-studio-textarea"
            value={draft.story ?? ''}
            onChange={(e) => updateDraft({ story: e.target.value })}
            placeholder="How does this rhythm feel? When would you play it?"
            rows={3}
          />
        </label>
      </div>

      <div className="bf-panel">
        <div className="bf-panel-head">meta</div>
        <label className="bf-studio-field">
          <span className="bf-mini-label">region</span>
          <select
            className="bf-studio-input"
            value={draft.region}
            onChange={(e) => updateDraft({ region: e.target.value as RegionId })}
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </label>
        <label className="bf-studio-field">
          <span className="bf-mini-label">genre</span>
          <select
            className="bf-studio-input"
            value={draft.genre}
            onChange={(e) => updateDraft({ genre: e.target.value as Genre })}
          >
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label className="bf-studio-field">
          <span className="bf-mini-label">default kit</span>
          <select
            className="bf-studio-input"
            value={draft.defaultKit}
            onChange={(e) => updateDraft({ defaultKit: e.target.value as KitId })}
          >
            {ALL_KITS.map((k) => (
              <option key={k} value={k}>{k === 'frameDrum' ? 'frameDrum' : k}</option>
            ))}
          </select>
        </label>
        <label className="bf-studio-field">
          <span className="bf-mini-label">difficulty</span>
          <div className="bf-seg">
            {DIFFS.map((d) => (
              <button
                key={d}
                className={draft.difficulty === d ? 'on' : ''}
                onClick={() => updateDraft({ difficulty: d })}
                type="button"
              >
                {d}
              </button>
            ))}
          </div>
        </label>
        <label className="bf-studio-field">
          <span className="bf-mini-label">swingable</span>
          <div className="bf-seg">
            <button
              className={draft.swingable ? 'on' : ''}
              onClick={() => updateDraft({ swingable: true })}
              type="button"
            >
              on
            </button>
            <button
              className={!draft.swingable ? 'on' : ''}
              onClick={() => updateDraft({ swingable: false })}
              type="button"
            >
              off
            </button>
          </div>
        </label>
      </div>

      <div className="bf-panel">
        <div className="bf-panel-head">tempo</div>
        <div className="bf-studio-bpm-row">
          <label>
            <span className="bf-mini-label">default</span>
            <input
              type="number"
              className="bf-studio-input sm"
              min={30}
              max={800}
              value={draft.bpm.default}
              onChange={(e) => updateBpm({ default: Number(e.target.value) })}
            />
          </label>
          <label>
            <span className="bf-mini-label">min</span>
            <input
              type="number"
              className="bf-studio-input sm"
              min={30}
              max={800}
              value={draft.bpm.min}
              onChange={(e) => updateBpm({ min: Number(e.target.value) })}
            />
          </label>
          <label>
            <span className="bf-mini-label">max</span>
            <input
              type="number"
              className="bf-studio-input sm"
              min={30}
              max={800}
              value={draft.bpm.max}
              onChange={(e) => updateBpm({ max: Number(e.target.value) })}
            />
          </label>
        </div>
      </div>

      <div className="bf-panel">
        <div className="bf-panel-head">yours ({yours.length})</div>
        {yours.length === 0 ? (
          <div className="bf-studio-yours-empty">
            Your saved patterns will appear here.
          </div>
        ) : (
          <div className="bf-studio-yours-list">
            {yours.map((entry) => {
              if (!entry.pattern) {
                return (
                  <div key={entry.id} className="bf-studio-yours-row corrupt">
                    <span className="bf-studio-yours-name">
                      ⚠️ corrupted · {entry.id}
                    </span>
                    <button
                      className="bf-studio-yours-del"
                      onClick={() => {
                        if (confirm(`Delete quarantined pattern "${entry.id}"?`)) {
                          onDeletePattern(entry.id);
                        }
                      }}
                      type="button"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                );
              }
              const p = entry.pattern;
              const isCur = currentId === p.id;
              return (
                <div key={p.id} className={`bf-studio-yours-row ${isCur ? 'on' : ''}`}>
                  <button
                    className="bf-studio-yours-load"
                    onClick={() => onLoadPattern(p.id)}
                    title="Load into editor"
                    type="button"
                  >
                    <span className="bf-studio-yours-name">{p.name}</span>
                    <span className="bf-studio-yours-meta">
                      {p.timeSig} · {p.grouping.join('+')}
                    </span>
                  </button>
                  <button
                    className="bf-studio-yours-del"
                    onClick={() => {
                      if (confirm(`Delete "${p.name}"? This can't be undone.`)) {
                        onDeletePattern(p.id);
                      }
                    }}
                    type="button"
                    title="Delete"
                    aria-label={`Delete ${p.name}`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
