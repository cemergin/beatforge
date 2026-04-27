// ChainDemo — assemble a tiny signal chain with the audio-graph
// compose ops + tweak its params live. Proves:
//   - chain() wires modules in order
//   - ControllableModule.set() ramps params correctly
//   - dispose() cascades and leaves no orphan nodes
//
// The chain: oscillator (wrapped raw OSC) → lowpass → gain → master.
// User picks oscillator type + tweaks cutoff/Q/gain via knobs.

import { useEffect, useRef, useState } from 'react';
import {
  chain,
  gain as gainModule,
  lowpass,
  sink,
  wrap,
  type AudioModule,
  type ControllableModule,
} from '../../modules/audio-graph';

type Wave = OscillatorType;

export function ChainDemo() {
  const [running, setRunning] = useState(false);
  const [wave, setWave] = useState<Wave>('sawtooth');
  const [pitch, setPitch] = useState(220);
  const [cutoff, setCutoff] = useState(1200);
  const [q, setQ] = useState(0.7);
  const [level, setLevel] = useState(0.4);

  // Hold the live audio context + composed chain across re-renders.
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<ControllableModule | null>(null);
  const gainRef = useRef<ControllableModule | null>(null);
  const composedRef = useRef<AudioModule | null>(null);

  const start = () => {
    if (running) return;
    const Ctx = window.AudioContext;
    const ctx = new Ctx();
    ctxRef.current = ctx;

    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = pitch;
    oscRef.current = osc;

    const lp = lowpass(ctx, cutoff, q);
    const lvl = gainModule(ctx, level);
    filterRef.current = lp;
    gainRef.current = lvl;

    const composed = chain(
      wrap(osc),                          // pure source — input ignored
      lp,
      lvl,
      sink(ctx.destination),              // pure sink — output null
    );
    composedRef.current = composed;

    osc.start();
    setRunning(true);
  };

  const stop = () => {
    if (!running) return;
    try { oscRef.current?.stop(); } catch { /* osc may already be stopped */ }
    composedRef.current?.dispose();
    void ctxRef.current?.close();
    ctxRef.current = null;
    oscRef.current = null;
    filterRef.current = null;
    gainRef.current = null;
    composedRef.current = null;
    setRunning(false);
  };

  useEffect(() => () => { stop(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  // Live param updates. Each setter is the universal `set(name, value)`
  // call exposed by the ControllableModule — the same API the router
  // will dispatch ParamEvents through.
  useEffect(() => { filterRef.current?.set('cutoff', cutoff); }, [cutoff]);
  useEffect(() => { filterRef.current?.set('q', q); }, [q]);
  useEffect(() => { gainRef.current?.set('value', level); }, [level]);
  useEffect(() => {
    if (oscRef.current) oscRef.current.frequency.value = pitch;
  }, [pitch]);
  useEffect(() => {
    if (oscRef.current) oscRef.current.type = wave;
  }, [wave]);

  return (
    <section className="bf-lab-section">
      <div className="bf-lab-controls">
        {!running && (
          <button type="button" className="bf-lab-btn" onClick={start}>
            ▶ start chain
          </button>
        )}
        {running && (
          <button type="button" className="bf-lab-btn" onClick={stop}>
            ■ stop
          </button>
        )}
      </div>

      <div className="bf-lab-chain-diagram">
        wrap(osc) → lowpass → gain → sink(destination)
      </div>

      <div className="bf-lab-knobs">
        <Field label="wave">
          <select
            value={wave}
            onChange={(e) => setWave(e.target.value as Wave)}
            className="bf-lab-select"
          >
            <option value="sine">sine</option>
            <option value="triangle">triangle</option>
            <option value="sawtooth">sawtooth</option>
            <option value="square">square</option>
          </select>
        </Field>
        <Field label={`pitch ${pitch} Hz`}>
          <input
            type="range" min={80} max={1200} step={1}
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
          />
        </Field>
        <Field label={`cutoff ${cutoff} Hz`}>
          <input
            type="range" min={80} max={12000} step={20}
            value={cutoff}
            onChange={(e) => setCutoff(Number(e.target.value))}
          />
        </Field>
        <Field label={`Q ${q.toFixed(1)}`}>
          <input
            type="range" min={0.1} max={20} step={0.1}
            value={q}
            onChange={(e) => setQ(Number(e.target.value))}
          />
        </Field>
        <Field label={`level ${level.toFixed(2)}`}>
          <input
            type="range" min={0} max={1} step={0.01}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          />
        </Field>
      </div>

      <p className="bf-lab-fineprint">
        Each knob calls the module&rsquo;s universal <code>set(name, value)</code>{' '}
        — the same call the router will make for ParamEvents. Stop / start
        rebuilds the chain via <code>chain()</code> and tears it down via{' '}
        <code>dispose()</code>.
      </p>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="bf-lab-field">
      <span className="bf-lab-field-label">{label}</span>
      {children}
    </label>
  );
}
