import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AudioEngine } from '../../audio/engine';
import type { Pattern } from '../../patterns/types';
import { PATTERNS, patternById } from '../../patterns/seed';
import { BeatDots } from '../../components/BeatDots';
import { isHighlighted, toggleHighlight } from '../../lib/storage';
import { REGION_BY_ID } from './regions';
import { sameGrouping, sameRegion, similarGroove } from './relatedRhythms';

interface Props {
  pattern: Pattern;
  engine: AudioEngine;
  onClose: () => void;
  onOpenPattern: (id: string) => void;
  onLoadInPractice: (id: string) => void;
  onOpenInStudio?: (pattern: Pattern) => void;
}

export function PatternDetail({
  pattern, engine, onClose, onOpenPattern, onLoadInPractice, onOpenInStudio,
}: Props) {
  const [starred, setStarred] = useState<boolean>(() => isHighlighted(pattern.id));
  const [previewing, setPreviewing] = useState(false);

  const related = useMemo(() => ({
    grouping: sameGrouping(pattern, PATTERNS).slice(0, 6),
    region: sameRegion(pattern, PATTERNS).slice(0, 6),
    groove: similarGroove(pattern, PATTERNS, 5),
  }), [pattern]);

  // Stop preview on unmount.
  useEffect(() => {
    return () => {
      engine.stop();
    };
  }, [engine]);

  const togglePreview = useCallback(async () => {
    await engine.ensureCtx();
    if (previewing) {
      engine.stop();
      setPreviewing(false);
    } else {
      engine.loadPattern(pattern);
      engine.setBpm(pattern.bpm.default);
      engine.setKit(pattern.defaultKit);
      engine.start(0);
      setPreviewing(true);
    }
  }, [engine, pattern, previewing]);

  const toggleStar = useCallback(() => {
    const next = toggleHighlight(pattern.id);
    setStarred(next.includes(pattern.id));
  }, [pattern.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const loadHere = (id: string) => {
    engine.stop();
    setPreviewing(false);
    onLoadInPractice(id);
  };

  const region = REGION_BY_ID[pattern.region];

  return (
    <div className="bf-modal" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bf-modal-body bf-detail" onClick={(e) => e.stopPropagation()}>
        <div className="bf-modal-head">
          <div>
            <div className="bf-detail-headline">
              <h2 className="bf-modal-title">{pattern.name}</h2>
              <button
                className={`bf-star ${starred ? 'on' : ''}`}
                onClick={toggleStar}
                type="button"
                title={starred ? 'Unstar' : 'Star'}
                aria-label={starred ? 'Unstar pattern' : 'Star pattern'}
              >
                {starred ? '★' : '☆'}
              </button>
            </div>
            <div className="bf-modal-sub">
              {pattern.origin} · {pattern.tradition}
            </div>
          </div>
          <button
            className="bf-modal-x"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="bf-detail-scroll">
          <div className="bf-detail-player">
            <button
              className={`bf-play bf-detail-play ${previewing ? 'on' : ''}`}
              onClick={togglePreview}
              type="button"
            >
              {previewing ? (
                <span><span className="bf-stop-ico" /> stop preview</span>
              ) : (
                <span><span className="bf-play-ico" /> preview</span>
              )}
            </button>
            <BeatDots grouping={pattern.grouping} currentStep={-1} size={14} />
          </div>

          <div className="bf-detail-meta">
            <span className="bf-meta-badge">{pattern.timeSig}</span>
            <span className="bf-meta-badge alt">{pattern.grouping.join('+')}</span>
            <span className="bf-meta-badge alt">♩={pattern.bpm.default}</span>
            <span className={`bf-diff bf-diff-${pattern.difficulty}`}>{pattern.difficulty}</span>
            <span className="bf-meta-badge alt">{pattern.defaultKit}</span>
            {region && (
              <span className="bf-meta-badge alt" style={{ color: region.color }}>
                {region.label}
              </span>
            )}
            {pattern.poly && <span className="bf-poly-badge">poly</span>}
          </div>

          {pattern.tags.length > 0 && (
            <div className="bf-detail-tags">
              {pattern.tags.map((t) => (
                <span key={t} className="bf-tag-chip">#{t}</span>
              ))}
            </div>
          )}

          {pattern.story && (
            <section className="bf-detail-section">
              <h3 className="bf-detail-h">Story</h3>
              <p className="bf-detail-story">{pattern.story}</p>
            </section>
          )}

          {pattern.instruments && pattern.instruments.length > 0 && (
            <section className="bf-detail-section">
              <h3 className="bf-detail-h">Instruments</h3>
              <div className="bf-detail-tags">
                {pattern.instruments.map((ins) => (
                  <span key={ins} className="bf-tag-chip">{ins}</span>
                ))}
              </div>
            </section>
          )}

          <section className="bf-detail-section">
            <h3 className="bf-detail-h">Related</h3>
            <RelatedRow
              label={`Same grouping (${pattern.grouping.join('+')})`}
              items={related.grouping}
              onPick={onOpenPattern}
            />
            <RelatedRow
              label={`Same region (${region?.short ?? pattern.region})`}
              items={related.region}
              onPick={onOpenPattern}
            />
            <RelatedRow
              label="Similar groove"
              items={related.groove}
              onPick={onOpenPattern}
            />
            {pattern.relatedIds && pattern.relatedIds.length > 0 && (
              <RelatedRow
                label="Hand-curated"
                items={pattern.relatedIds.map(patternById).filter((p): p is Pattern => !!p)}
                onPick={onOpenPattern}
              />
            )}
          </section>
        </div>

        <div className="bf-detail-actions">
          <button
            className="bf-chip on"
            onClick={() => loadHere(pattern.id)}
            type="button"
          >
            Load in Practice
          </button>
          <button
            className="bf-chip ghost"
            onClick={onOpenInStudio ? () => onOpenInStudio(pattern) : undefined}
            disabled={!onOpenInStudio}
            title={onOpenInStudio ? 'Open a remix in Studio' : 'Studio unavailable'}
            type="button"
          >
            Open in Studio
          </button>
        </div>
      </div>
    </div>
  );
}

interface RelatedRowProps {
  label: string;
  items: Pattern[];
  onPick: (id: string) => void;
}

function RelatedRow({ label, items, onPick }: RelatedRowProps) {
  if (items.length === 0) return null;
  return (
    <div className="bf-related-row">
      <div className="bf-related-label">{label}</div>
      <div className="bf-related-chips">
        {items.map((p) => (
          <button
            key={p.id}
            className="bf-strip-chip"
            onClick={() => onPick(p.id)}
            type="button"
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
