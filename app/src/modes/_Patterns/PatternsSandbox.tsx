// Dev-only sandbox for validating extracted draft patterns (spec section 5.4).
//
// Loads drafts from `app/patterns-drafts/<region>/<id>.json` via
// `import.meta.glob` so Vite lazy-loads them. For each draft the user can:
//   - Play it through the shared AudioEngine (same wiring as Library's
//     PatternDetail mini-player).
//   - Mark verdict: approve / reject / needs-fix — verdicts are session-only.
//   - Copy the promoted pattern JSON to the clipboard so they can paste into
//     `app/src/patterns/seed/<region>.ts`.
//
// Nothing in this file is imported by production builds (App.tsx gates the
// tab on `import.meta.env.DEV`), but the module stays tree-shakeable because
// import.meta.glob with `eager: false` only emits fetch-on-demand chunks.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AudioEngine } from '../../audio/engine';
import { naturalTempo } from '../../audio/tempo';
import type { KitId, Pattern, RegionId, VoiceId, Velocity } from '../../patterns/types';
import { BeatDots } from '../../components/BeatDots';

interface DraftMeta {
  extractionWarnings?: string[];
  rawBlocks?: string[];
  rawProse?: string;
  sourceFile?: string;
}

interface DraftFile extends Pattern {
  _draft?: DraftMeta;
}

interface DraftEntry {
  path: string;              // e.g. '../../../patterns-drafts/turkey-ottoman/karsilama.json'
  region: string;            // extracted from path
  filename: string;
  loader: () => Promise<DraftFile>;
}

type Verdict = 'pending' | 'approved' | 'rejected' | 'needs-fix';

// Vite glob — lazy-loaded so drafts don't balloon the JS bundle.
// The path is resolved at build time; if `app/patterns-drafts/` is empty or
// only contains `.gitkeep`, the map is just empty. JSON modules resolve to
// the parsed object directly (not a `{ default: … }` wrapper).
const rawGlob: Record<string, () => Promise<unknown>> = import.meta.glob(
  '../../../patterns-drafts/**/*.json',
  { eager: false },
);

function buildDraftIndex(): DraftEntry[] {
  const entries: DraftEntry[] = [];
  for (const [path, loader] of Object.entries(rawGlob)) {
    // path: '../../../patterns-drafts/<region>/<slug>.json'
    const parts = path.split('/');
    const filename = parts[parts.length - 1];
    const region = parts[parts.length - 2] ?? 'unknown';
    entries.push({
      path,
      region,
      filename,
      loader: async () => {
        const mod = await loader();
        // Vite wraps default-exported JSON in `{ default: … }` when transforming;
        // safe to check both forms.
        if (mod && typeof mod === 'object' && 'default' in mod) {
          return (mod as { default: DraftFile }).default;
        }
        return mod as DraftFile;
      },
    });
  }
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

interface Props {
  engine: AudioEngine;
}

export function PatternsSandbox({ engine }: Props) {
  const drafts = useMemo(() => buildDraftIndex(), []);
  const [loaded, setLoaded] = useState<Record<string, DraftFile | Error>>({});
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [playingPath, setPlayingPath] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Group by region.
  const byRegion = useMemo(() => {
    const m = new Map<string, DraftEntry[]>();
    for (const d of drafts) {
      const list = m.get(d.region) ?? [];
      list.push(d);
      m.set(d.region, list);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [drafts]);

  // Stop playback when unmounting the sandbox.
  useEffect(() => {
    return () => { engine.stop(); };
  }, [engine]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  // Lazy-load every draft on mount. We need metadata for card rendering;
  // the JSON itself is tiny (<5KB each) so loading them all up-front here
  // is fine and keeps the UI simple.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const d of drafts) {
        try {
          const p = await d.loader();
          if (cancelled) return;
          setLoaded((prev) => ({ ...prev, [d.path]: p }));
        } catch (err) {
          if (cancelled) return;
          setLoaded((prev) => ({
            ...prev,
            [d.path]: err instanceof Error ? err : new Error(String(err)),
          }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [drafts]);

  const togglePlay = useCallback(async (path: string, draft: DraftFile) => {
    await engine.ensureCtx();
    if (playingPath === path) {
      engine.stop();
      setPlayingPath(null);
      return;
    }
    // Validate before loading — unplayable drafts get flagged rather than crash.
    const err = validateForPlayback(draft);
    if (err) {
      alert(`Cannot play: ${err}`);
      return;
    }
    engine.loadPattern(draft);
    engine.setBpm(draft.bpm.default);
    engine.setKit(draft.defaultKit);
    engine.start(0);
    setPlayingPath(path);
  }, [engine, playingPath]);

  const copyPromoted = useCallback(async (path: string, draft: DraftFile) => {
    const clean = stripDraftMeta(draft);
    const text = JSON.stringify(clean, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPath(path);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopiedPath(null), 2500);
    } catch {
      alert('Clipboard write failed — open the draft JSON directly.');
    }
  }, []);

  const setVerdict = useCallback((path: string, v: Verdict) => {
    setVerdicts((prev) => ({ ...prev, [path]: v }));
  }, []);

  const counts = useMemo(() => {
    const total = drafts.length;
    const approved = Object.values(verdicts).filter((v) => v === 'approved').length;
    const rejected = Object.values(verdicts).filter((v) => v === 'rejected').length;
    const needsFix = Object.values(verdicts).filter((v) => v === 'needs-fix').length;
    return { total, approved, rejected, needsFix };
  }, [drafts.length, verdicts]);

  return (
    <main className="bf-lib-page">
      <header className="bf-lib-hero">
        <div>
          <h1 className="bf-lib-title">Patterns Sandbox</h1>
          <p className="bf-lib-sub">
            Dev-only (hidden in production). Validates draft patterns extracted
            from the research corpus. Approve → copy JSON → paste into
            <code> src/patterns/seed/&lt;region&gt;.ts</code>.
          </p>
        </div>
        <div className="bf-lib-search">
          <div className="bf-sandbox-counts">
            <span>{counts.total} drafts</span>
            <span style={{ color: 'var(--grp-2)' }}>✓ {counts.approved}</span>
            <span style={{ color: 'var(--grp-1)' }}>✗ {counts.rejected}</span>
            <span style={{ color: 'var(--muted)' }}>⚠ {counts.needsFix}</span>
          </div>
        </div>
      </header>

      {drafts.length === 0 && (
        <section className="bf-lib-zone">
          <div className="bf-lib-empty">
            No drafts found. Generate some with:
            <pre style={{ marginTop: 8 }}>
              bun scripts/extract-patterns.ts &lt;research-file&gt; --region &lt;regionId&gt;
            </pre>
            Drafts land in <code>app/patterns-drafts/&lt;region&gt;/</code>.
          </div>
        </section>
      )}

      {byRegion.map(([region, entries]) => (
        <section key={region} className="bf-lib-zone">
          <div className="bf-zone-head">
            <h2 className="bf-zone-title">{region}</h2>
            <span className="bf-zone-sub">{entries.length} draft(s)</span>
          </div>
          <div className="bf-lib-full-grid">
            {entries.map((entry) => {
              const data = loaded[entry.path];
              if (!data) {
                return (
                  <div key={entry.path} className="bf-sandbox-card muted">
                    loading {entry.filename}…
                  </div>
                );
              }
              if (data instanceof Error) {
                return (
                  <div key={entry.path} className="bf-sandbox-card error">
                    <strong>{entry.filename}</strong>
                    <div>{data.message}</div>
                  </div>
                );
              }
              return (
                <DraftCard
                  key={entry.path}
                  entry={entry}
                  draft={data}
                  playing={playingPath === entry.path}
                  verdict={verdicts[entry.path] ?? 'pending'}
                  expanded={expanded === entry.path}
                  copied={copiedPath === entry.path}
                  onTogglePlay={() => togglePlay(entry.path, data)}
                  onToggleExpand={() => setExpanded(expanded === entry.path ? null : entry.path)}
                  onSetVerdict={(v) => setVerdict(entry.path, v)}
                  onCopyPromoted={() => copyPromoted(entry.path, data)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}

interface DraftCardProps {
  entry: DraftEntry;
  draft: DraftFile;
  playing: boolean;
  verdict: Verdict;
  expanded: boolean;
  copied: boolean;
  onTogglePlay: () => void;
  onToggleExpand: () => void;
  onSetVerdict: (v: Verdict) => void;
  onCopyPromoted: () => void;
}

function DraftCard({
  entry, draft, playing, verdict, expanded, copied,
  onTogglePlay, onToggleExpand, onSetVerdict, onCopyPromoted,
}: DraftCardProps) {
  const warnings = draft._draft?.extractionWarnings ?? [];
  const playable = validateForPlayback(draft) === null;

  return (
    <div className={`bf-sandbox-card ${verdict}`}>
      <div className="bf-sandbox-card-head">
        <div>
          <div className="bf-sandbox-name">{draft.name || draft.id}</div>
          <div className="bf-modal-sub">
            {draft.origin || '—'} · {draft.region}
          </div>
        </div>
        <span className={`bf-verdict bf-verdict-${verdict}`}>
          {verdict === 'approved' && '✓'}
          {verdict === 'rejected' && '✗'}
          {verdict === 'needs-fix' && '⚠'}
          {verdict === 'pending' && '·'}
        </span>
      </div>

      <div className="bf-detail-meta">
        <span className="bf-meta-badge">{draft.timeSig}</span>
        <span className="bf-meta-badge alt">{draft.grouping.join('+')}</span>
        {(() => {
          const t = naturalTempo(draft.bpm.default, draft.stepUnit, draft.timeSig);
          return <span className="bf-meta-badge alt">{t.glyph}={t.value}</span>;
        })()}
        <span className="bf-meta-badge alt">{draft.defaultKit}</span>
      </div>

      <BeatDots grouping={draft.grouping} currentStep={-1} size={10} />

      <div className="bf-sandbox-actions">
        <button
          className={`bf-chip ${playing ? 'on' : 'ghost'}`}
          onClick={onTogglePlay}
          type="button"
          disabled={!playable}
          title={playable ? undefined : 'No playable tracks — fill in KK/SN/HH'}
        >
          {playing ? '■ stop' : '▶ play'}
        </button>
        <button
          className={`bf-chip ${verdict === 'approved' ? 'on' : 'ghost'}`}
          onClick={() => onSetVerdict(verdict === 'approved' ? 'pending' : 'approved')}
          type="button"
        >
          ✓ approve
        </button>
        <button
          className={`bf-chip ${verdict === 'rejected' ? 'on' : 'ghost'}`}
          onClick={() => onSetVerdict(verdict === 'rejected' ? 'pending' : 'rejected')}
          type="button"
        >
          ✗ reject
        </button>
        <button
          className={`bf-chip ${verdict === 'needs-fix' ? 'on' : 'ghost'}`}
          onClick={() => onSetVerdict(verdict === 'needs-fix' ? 'pending' : 'needs-fix')}
          type="button"
        >
          ⚠ needs fix
        </button>
      </div>

      {verdict === 'approved' && (
        <div className="bf-sandbox-promote">
          <button
            className="bf-chip on"
            onClick={onCopyPromoted}
            type="button"
          >
            {copied ? 'copied — paste into seed/' : 'copy promoted JSON'}
          </button>
          <span className="bf-modal-sub">
            paste into <code>src/patterns/seed/{entry.region}.ts</code>
          </span>
        </div>
      )}

      {warnings.length > 0 && (
        <ul className="bf-sandbox-warnings">
          {warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}
        </ul>
      )}

      <div className="bf-sandbox-checklist">
        <strong>Proof-hearing checklist</strong>
        <ul>
          <li>Kick on canonical downbeats of the grouping?</li>
          {(() => {
            const t = naturalTempo(draft.bpm.default, draft.stepUnit, draft.timeSig);
            return <li>Tempo feels natural at {t.glyph}={t.value}?</li>;
          })()}
          <li>Meter matches {draft.timeSig}?</li>
          <li>Default kit ({draft.defaultKit}) is culturally coherent?</li>
        </ul>
      </div>

      <button
        className="bf-linkbtn"
        onClick={onToggleExpand}
        type="button"
      >
        {expanded ? 'hide raw' : 'show raw extraction'}
      </button>
      {expanded && (
        <div className="bf-sandbox-raw">
          {draft._draft?.sourceFile && (
            <div className="bf-modal-sub">source: {draft._draft.sourceFile}</div>
          )}
          {draft._draft?.rawBlocks && draft._draft.rawBlocks.length > 0 && (
            <>
              <strong>raw notation blocks</strong>
              {draft._draft.rawBlocks.map((b, i) => (
                <pre key={i}>{b}</pre>
              ))}
            </>
          )}
          <strong>current JSON</strong>
          <pre>{JSON.stringify(stripDraftMeta(draft), null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

function validateForPlayback(p: DraftFile): string | null {
  if (!p.tracks || Object.keys(p.tracks).length === 0) {
    return 'no tracks';
  }
  const anyNonEmpty = Object.values(p.tracks).some((t) => {
    if (!t) return false;
    if (Array.isArray(t)) return t.length > 0;
    return t.pattern && t.pattern.length > 0;
  });
  if (!anyNonEmpty) return 'all tracks are empty';
  if (!isKitId(p.defaultKit)) return `unknown kit: ${p.defaultKit}`;
  if (!isRegionId(p.region)) return `unknown region: ${p.region}`;
  if (!p.bpm || typeof p.bpm.default !== 'number') return 'missing bpm.default';
  if (!Number.isInteger(p.steps) || p.steps <= 0) return 'invalid steps';

  // Voice sanity — every track key must map to a known voice.
  const voices: VoiceId[] = ['KK', 'SN', 'HH', 'OH', 'CP'];
  for (const k of Object.keys(p.tracks)) {
    if (!voices.includes(k as VoiceId)) return `unknown voice in tracks: ${k}`;
  }
  // Velocity sanity for array-form tracks.
  for (const t of Object.values(p.tracks)) {
    if (!t || !Array.isArray(t)) continue;
    for (const v of t as Velocity[]) {
      if (v !== 0 && v !== 1 && v !== 2) return 'velocity must be 0/1/2';
    }
  }
  return null;
}

function stripDraftMeta(draft: DraftFile): Pattern {
  const out: DraftFile = { ...draft };
  delete out._draft;
  return out;
}

function isKitId(k: string): k is KitId {
  return [
    '808', '909', '707', '727', 'frameDrum', 'tabla', 'gamelan',
  ].includes(k);
}

function isRegionId(r: string): r is RegionId {
  return [
    'turkey-ottoman', 'arabic-swana', 'persia', 'india',
    'west-africa', 'cuba-afrocaribbean', 'brazil',
    'andean-south-america', 'caribbean', 'balkans',
    'iberia-flamenco', 'gamelan-southeast-asia',
    'east-asia', 'celtic-europe', 'electronic-western', 'exercise',
  ].includes(r);
}
