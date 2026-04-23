import { useEffect, useRef, useState } from 'react';
import { AudioEngine } from './audio/engine';
import { Practice } from './modes/Practice/Practice';
import { Library } from './modes/Library/Library';
import type { KitId } from './patterns/types';
import './styles/app.css';

type Theme = 'warm' | 'noir' | 'paper';
type Tab = 'practice' | 'library';

export default function App() {
  const engineRef = useRef<AudioEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new AudioEngine();
  }
  const engine = engineRef.current;

  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('bf_theme') as Theme) || 'warm',
  );

  const [tab, setTab] = useState<Tab>(
    () => ((localStorage.getItem('bf_tab') as Tab) === 'library' ? 'library' : 'practice'),
  );

  const [patternId, setPatternId] = useState<string>(
    () => localStorage.getItem('bf_pattern') || 'karsilama',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('bf_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('bf_tab', tab);
  }, [tab]);

  useEffect(() => {
    const savedKit = (localStorage.getItem('bf_kit') as KitId) || '808';
    engine.setKit(savedKit);
    return () => { engine.stop(); };
  }, [engine]);

  // Switching tabs stops any in-flight playback from either mode.
  const switchTab = (next: Tab) => {
    if (next !== tab) {
      engine.stop();
      setTab(next);
    }
  };

  const loadInPractice = (id: string) => {
    engine.stop();
    setPatternId(id);
    setTab('practice');
  };

  return (
    <div className="bf-root" data-theme={theme}>
      <header className="bf-top">
        <div className="bf-brand">
          <span className="bf-logo" />
          <span className="bf-wordmark">BeatForge</span>
          <span className="bf-tag">/{tab}</span>
        </div>
        <nav className="bf-topnav">
          <button
            className={`bf-chip ${tab === 'practice' ? 'on' : 'ghost'}`}
            onClick={() => switchTab('practice')}
            type="button"
          >
            Practice
          </button>
          <button className="bf-chip ghost" disabled title="Coming next" type="button">Studio</button>
          <button
            className={`bf-chip ${tab === 'library' ? 'on' : 'ghost'}`}
            onClick={() => switchTab('library')}
            type="button"
          >
            Library
          </button>
        </nav>
        <div className="bf-topright">
          {tab === 'practice' && (
            <span className="bf-edit-hint">tap cells to edit</span>
          )}
          <div className="bf-theme-seg" role="group" aria-label="theme">
            {(['warm', 'noir', 'paper'] as Theme[]).map((t) => (
              <button
                key={t}
                className={`bf-theme-btn bf-theme-${t} ${theme === t ? 'on' : ''}`}
                onClick={() => setTheme(t)}
                title={t}
                aria-label={t}
                type="button"
              >
                <span className="bf-theme-swatch" />
                <span className="bf-theme-name">{t}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {tab === 'practice' ? (
        <Practice
          engine={engine}
          patternId={patternId}
          onPatternChange={setPatternId}
        />
      ) : (
        <Library
          engine={engine}
          onLoadInPractice={loadInPractice}
        />
      )}
    </div>
  );
}
