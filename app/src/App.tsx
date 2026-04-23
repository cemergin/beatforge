import { useEffect, useRef, useState } from 'react';
import { AudioEngine } from './audio/engine';
import { Practice } from './modes/Practice/Practice';
import type { KitId } from './patterns/types';
import './styles/app.css';

type Theme = 'warm' | 'noir' | 'paper';

export default function App() {
  const engineRef = useRef<AudioEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new AudioEngine();
  }
  const engine = engineRef.current;

  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('bf_theme') as Theme) || 'warm',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('bf_theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedKit = (localStorage.getItem('bf_kit') as KitId) || '808';
    engine.setKit(savedKit);
    return () => { engine.stop(); };
  }, [engine]);

  return (
    <div className="bf-root" data-theme={theme}>
      <header className="bf-top">
        <div className="bf-brand">
          <span className="bf-logo" />
          <span className="bf-wordmark">BeatForge</span>
          <span className="bf-tag">/practice</span>
        </div>
        <nav className="bf-topnav">
          <button className="bf-chip on">Practice</button>
          <button className="bf-chip ghost" disabled title="Coming next">Studio</button>
          <button className="bf-chip ghost" disabled title="Coming next">Library</button>
        </nav>
        <div className="bf-topright">
          <span className="bf-edit-hint">tap cells to edit</span>
          <div className="bf-theme-seg" role="group" aria-label="theme">
            {(['warm', 'noir', 'paper'] as Theme[]).map((t) => (
              <button
                key={t}
                className={`bf-theme-btn bf-theme-${t} ${theme === t ? 'on' : ''}`}
                onClick={() => setTheme(t)}
                title={t}
                aria-label={t}
              >
                <span className="bf-theme-swatch" />
                <span className="bf-theme-name">{t}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <Practice engine={engine} />
    </div>
  );
}
