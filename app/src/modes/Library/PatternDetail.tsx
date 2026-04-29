import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SoundEngine } from '../../audio/runtime/sound-engine';
import type { Pattern } from '../../patterns/types';
import { naturalTempo } from '../../audio/tempo';
import { PATTERNS, patternById } from '../../patterns/seed';
import { BeatDots } from '../../components/BeatDots';
import { useT } from '../../i18n';
import { isHighlighted, toggleHighlight } from '../../lib/storage';
import { REGION_BY_ID } from './regions';
import { sameGrouping, sameRegion, similarGroove } from './relatedRhythms';

interface Props {
  pattern: Pattern;
  engine: SoundEngine;
  onClose: () => void;
  onOpenPattern: (id: string) => void;
  onLoadInPractice: (id: string) => void;
  onOpenInStudio?: (pattern: Pattern) => void;
}

export function PatternDetail({
  pattern, engine, onClose, onOpenPattern, onLoadInPractice, onOpenInStudio,
}: Props) {
  const t = useT();
  const [starred, setStarred] = useState<boolean>(() => isHighlighted(pattern.id));
  const [previewing, setPreviewing] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // One smart share: short ?pattern=<id> for seed library entries,
  // ?p=<hash> for anything the recipient can't look up themselves.
  const copyShareLink = useCallback(async () => {
    try {
      const { buildSmartShareUrl } = await import('../../patterns/serialize');
      const seedIds = new Set(PATTERNS.map((p) => p.id));
      const url = await buildSmartShareUrl(pattern, (id) => seedIds.has(id));
      await navigator.clipboard.writeText(url);
      setShareToast(t('detail.link_copied'));
    } catch {
      setShareToast(t('detail.copy_failed'));
    }
    window.setTimeout(() => setShareToast(null), 1500);
  }, [pattern, t]);

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
        return;
      }
      if (e.code === 'Space') {
        const el = e.target as HTMLElement | null;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
        e.preventDefault();
        void togglePreview();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, togglePreview]);

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
                title={starred ? t('practice.unstar_title') : t('practice.star_title')}
                aria-label={starred ? t('practice.unstar_label') : t('practice.star_label')}
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
            aria-label={t('common.close')}
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
                <span><span className="bf-stop-ico" /> {t('detail.stop_preview')}</span>
              ) : (
                <span><span className="bf-play-ico" /> {t('detail.play_preview')}</span>
              )}
            </button>
            <BeatDots grouping={pattern.grouping} currentStep={-1} size={14} />
          </div>

          <div className="bf-detail-meta">
            <span className="bf-meta-badge">{pattern.timeSig}</span>
            <span className="bf-meta-badge alt">{pattern.grouping.join('+')}</span>
            {(() => {
              const tempo = naturalTempo(pattern.bpm.default, pattern.stepUnit, pattern.timeSig);
              return <span className="bf-meta-badge alt">{tempo.glyph}={tempo.value}</span>;
            })()}
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
              {pattern.tags.map((tag) => (
                <span key={tag} className="bf-tag-chip">#{tag}</span>
              ))}
            </div>
          )}

          {pattern.story && (
            <section className="bf-detail-section">
              <h3 className="bf-detail-h">{t('practice.story_heading')}</h3>
              <p className="bf-detail-story">{pattern.story}</p>
            </section>
          )}

          {pattern.instruments && pattern.instruments.length > 0 && (
            <section className="bf-detail-section">
              <h3 className="bf-detail-h">{t('detail.instruments_title')}</h3>
              <div className="bf-detail-tags">
                {pattern.instruments.map((ins) => (
                  <span key={ins} className="bf-tag-chip">{ins}</span>
                ))}
              </div>
            </section>
          )}

          {pattern.sources && pattern.sources.length > 0 && (
            <section className="bf-detail-section">
              <h3 className="bf-detail-h">{t('detail.sources_title')}</h3>
              <ul className="bf-detail-sources">
                {pattern.sources.map((src) => (
                  <li key={src}>{src}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="bf-detail-section">
            <h3 className="bf-detail-h">{t('detail.related_title')}</h3>
            <RelatedRow
              label={t('detail.same_grouping', { grouping: pattern.grouping.join('+') })}
              items={related.grouping}
              onPick={onOpenPattern}
            />
            <RelatedRow
              label={t('detail.same_region', { region: region?.short ?? pattern.region })}
              items={related.region}
              onPick={onOpenPattern}
            />
            <RelatedRow
              label={t('detail.similar_groove')}
              items={related.groove}
              onPick={onOpenPattern}
            />
            {pattern.relatedIds && pattern.relatedIds.length > 0 && (
              <RelatedRow
                label={t('detail.hand_curated')}
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
            {t('detail.load_practice')}
          </button>
          <button
            className="bf-chip ghost"
            onClick={copyShareLink}
            type="button"
            title={t('detail.share_title')}
          >
            {t('detail.share_link')}
          </button>
          <button
            className="bf-chip ghost"
            onClick={onOpenInStudio ? () => onOpenInStudio(pattern) : undefined}
            disabled={!onOpenInStudio}
            title={onOpenInStudio ? t('detail.studio_hint') : t('detail.studio_disabled')}
            type="button"
          >
            {t('detail.open_studio')}
          </button>
        </div>
      </div>
      {shareToast && (
        <div className="bf-studio-toast" role="status">{shareToast}</div>
      )}
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
