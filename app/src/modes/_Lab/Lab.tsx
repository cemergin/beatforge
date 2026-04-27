// _Lab — hidden dev-only sandbox for the modular platform work.
//
// Reachable via ?tab=_lab in dev. Production builds skip this whole
// route. Each card here proves a piece of the modular plan
// (`docs/architecture/2026-04-27-modular-platform-plan.md`) is
// actually wired and not just paper. Add new demos as new cards.

import { useState } from 'react';
import { EventBusDemo } from './EventBusDemo';
import { ChainDemo } from './ChainDemo';

type Demo = 'home' | 'eventbus' | 'chain';

interface CardSpec {
  id: Demo;
  title: string;
  blurb: string;
  /** Migration step from the platform plan that this demo proves. */
  step: string;
}

const CARDS: readonly CardSpec[] = [
  {
    id: 'eventbus',
    title: 'Event bus',
    blurb: 'Typed pub/sub, listener-safe under unsubscribe-during-emit. Fire test events; see them log live.',
    step: 'Step 1 — modules/events',
  },
  {
    id: 'chain',
    title: 'Audio-graph compose',
    blurb: 'Build a signal chain (osc → lp → gain → out). Tweak knobs and hear the chain react.',
    step: 'Step 2 — modules/audio-graph',
  },
];

export function Lab() {
  const [demo, setDemo] = useState<Demo>('home');

  return (
    <main className="bf-lab">
      <header className="bf-lab-head">
        <h1 className="bf-lab-title">_lab</h1>
        <nav className="bf-lab-nav" aria-label="Lab demos">
          <button
            type="button"
            className={`bf-lab-tab ${demo === 'home' ? 'on' : ''}`}
            onClick={() => setDemo('home')}
          >
            home
          </button>
          {CARDS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`bf-lab-tab ${demo === c.id ? 'on' : ''}`}
              onClick={() => setDemo(c.id)}
            >
              {c.title.toLowerCase()}
            </button>
          ))}
        </nav>
      </header>

      {demo === 'home' && (
        <section className="bf-lab-grid">
          <p className="bf-lab-intro">
            A hidden sandbox where the modular-platform pieces (events
            bus, audio-graph compose ops, sequencer, MIDI…) get
            proven before they touch production code. Each card is a
            standalone playground for one module.
          </p>
          {CARDS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="bf-lab-card"
              onClick={() => setDemo(c.id)}
            >
              <span className="bf-lab-card-step">{c.step}</span>
              <h3 className="bf-lab-card-title">{c.title}</h3>
              <p className="bf-lab-card-blurb">{c.blurb}</p>
            </button>
          ))}
        </section>
      )}

      {demo === 'eventbus' && <EventBusDemo />}
      {demo === 'chain' && <ChainDemo />}
    </main>
  );
}
