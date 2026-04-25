// Real-time spectrum (and waveform) display fed by the Sound engine's
// AnalyserNode. ~80px tall, lives at the top of the Sound page so the
// user can see what they're hearing while tweaking.

import { useEffect, useRef, useState } from 'react';
import type { SoundEngine } from '../../audio/runtime/sound-engine';

interface Props {
  engine: SoundEngine;
}

type Mode = 'spectrum' | 'waveform';

export function SpectrumAnalyzer({ engine }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<Mode>('spectrum');

  useEffect(() => {
    let raf = 0;
    const cancelled = { v: false };

    const tick = () => {
      if (cancelled.v) return;
      const canvas = canvasRef.current;
      const analyser = engine.getAnalyser();
      if (!canvas || !analyser) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Read theme color from CSS — keeps the analyzer in sync with the
      // user's current theme.
      const accent = getComputedStyle(canvas).getPropertyValue('--accent').trim() || '#e17055';

      if (mode === 'spectrum') {
        const bins = analyser.frequencyBinCount;
        const data = new Uint8Array(bins);
        analyser.getByteFrequencyData(data);
        // Log frequency axis: 20 Hz → Nyquist mapped to 0..w. Each
        // pixel column samples a log-spaced bin.
        const sr = analyser.context.sampleRate;
        const minHz = 20;
        const maxHz = sr / 2;
        const minLog = Math.log10(minHz);
        const maxLog = Math.log10(maxHz);
        ctx.fillStyle = accent;
        for (let x = 0; x < w; x++) {
          const log = minLog + (x / w) * (maxLog - minLog);
          const hz = Math.pow(10, log);
          const binIdx = Math.min(bins - 1, Math.round((hz / maxHz) * bins));
          const v = data[binIdx] / 255;
          const barH = v * h;
          ctx.fillRect(x, h - barH, 1, barH);
        }
      } else {
        const len = analyser.fftSize;
        const data = new Uint8Array(len);
        analyser.getByteTimeDomainData(data);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < len; i++) {
          const v = data[i] / 128 - 1;   // [-1, 1]
          const x = (i / len) * w;
          const y = h / 2 + v * (h / 2 - 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled.v = true;
      cancelAnimationFrame(raf);
    };
  }, [engine, mode]);

  // Resize-to-container so the canvas tracks the layout width.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const apply = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="bf-sound-analyzer">
      <canvas ref={canvasRef} />
      <div className="bf-sound-analyzer-modes">
        <button
          className={mode === 'spectrum' ? 'on' : ''}
          onClick={() => setMode('spectrum')}
          type="button"
        >
          Spectrum
        </button>
        <button
          className={mode === 'waveform' ? 'on' : ''}
          onClick={() => setMode('waveform')}
          type="button"
        >
          Waveform
        </button>
      </div>
    </div>
  );
}
