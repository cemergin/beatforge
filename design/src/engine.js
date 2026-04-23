// BeatForge audio engine — synthesized 808/909/707 kit + lookahead scheduler.
// No samples. Pure Web Audio. Each track has its own cursor (for polyrhythm).

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.reverb = null;
    this.kit = '808';
    this.running = false;
    this.pattern = null;
    this.bpm = 120;
    this.swing = 0.5; // 0.5 = straight, up to 0.67 triplet
    this.strongAmp = 1.0;
    this.weakAmp = 0.5;
    this.onStep = null; // callback({cursors, absStep, time})
    this._lookaheadMs = 25;
    this._scheduleAheadS = 0.12;
    this._timerId = null;
    this._nextNoteTimes = {}; // per-track next-step time
    this._cursors = {}; // per-track step index
    this._absStep = 0;
    this._startTime = 0;
  }

  async ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 3;
      comp.attack.value = 0.003;
      comp.release.value = 0.1;
      this.master.connect(comp).connect(this.ctx.destination);
      // Simple convolver reverb
      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this._makeImpulse(1.4, 2.2);
      const revGain = this.ctx.createGain();
      revGain.gain.value = 0.18;
      this.reverb.connect(revGain).connect(this.master);
      this._revIn = this.ctx.createGain();
      this._revIn.gain.value = 0;
      this._revIn.connect(this.reverb);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  _makeImpulse(duration, decay) {
    const rate = this.ctx.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  setKit(k) { this.kit = k; }
  setBpm(b) { this.bpm = b; }
  setSwing(s) { this.swing = s; }
  setAccents(strong, weak) { this.strongAmp = strong; this.weakAmp = weak; }

  loadPattern(p) {
    this.pattern = p;
    this._cursors = {};
    Object.keys(p.tracks).forEach((tr) => { this._cursors[tr] = 0; });
  }

  start() {
    if (!this.pattern || this.running) return;
    this.running = true;
    const now = this.ctx.currentTime + 0.06;
    this._startTime = now;
    this._absStep = 0;
    Object.keys(this.pattern.tracks).forEach((tr) => {
      this._cursors[tr] = 0;
      this._nextNoteTimes[tr] = now;
    });
    this._tick();
  }

  stop() {
    this.running = false;
    if (this._timerId) clearTimeout(this._timerId);
  }

  // Seconds per step — BPM now means beats-per-minute where one "beat" is one grid step.
  // This matches how irregular meters (9/8, 7/8) are actually taught: the eighth-note pulse IS the beat.
  _stepSecs(_stepUnit) {
    return 60 / this.bpm;
  }
  }

  _trackCycle(track, trackName) {
    if (Array.isArray(track)) return { cycle: track.length, pattern: track };
    return { cycle: track.cycle, pattern: track.pattern };
  }

  _tick = () => {
    if (!this.running) return;
    const horizon = this.ctx.currentTime + this._scheduleAheadS;
    const p = this.pattern;
    const stepSec = this._stepSecs(p.stepUnit);

    // Schedule master "click" (for onStep visual callback) — use KK track length as visual frame cap if non-poly
    const masterSteps = p.steps;

    // Drive via a master cursor time that advances one step at a time
    while ((this._startTime + this._absStep * stepSec) < horizon) {
      const tStep = this._startTime + this._absStep * stepSec;
      // Swing delay for odd 16ths
      let tPlay = tStep;
      if (p.stepUnit === 16 && (this._absStep % 2 === 1)) {
        const swingDelay = (this.swing - 0.5) * 2 * stepSec; // 0..1*stepSec
        tPlay = tStep + swingDelay;
      }
      // For each track, if its own cursor aligns, fire
      for (const tr of Object.keys(p.tracks)) {
        const { cycle, pattern } = this._trackCycle(p.tracks[tr], tr);
        const idx = this._cursors[tr] % cycle;
        // Track step length: for non-poly (master array) the track moves 1-per-master-step.
        // For poly tracks with independent cycle, the cursor also advances 1 per master-step
        // but wraps at `cycle`. This keeps sixteenth-note resolution shared.
        const vel = pattern[idx];
        if (vel > 0) {
          this._trigger(tr, tPlay, vel);
        }
        this._cursors[tr] = (this._cursors[tr] + 1) % cycle;
      }

      // Visual callback
      const snap = { absStep: this._absStep, masterIdx: this._absStep % masterSteps, time: tStep, cursors: { ...this._cursors } };
      const delayMs = Math.max(0, (tStep - this.ctx.currentTime) * 1000);
      setTimeout(() => { if (this.onStep) this.onStep(snap); }, delayMs);

      this._absStep++;
    }

    this._timerId = setTimeout(this._tick, this._lookaheadMs);
  };

  _trigger(trackName, when, velLevel) {
    const amp = velLevel === 2 ? this.strongAmp : this.weakAmp;
    switch (trackName) {
      case 'KK': this._kick(when, amp); break;
      case 'SN': this._snare(when, amp); break;
      case 'HH': this._hat(when, amp, false); break;
      case 'OH': this._hat(when, amp, true); break;
      case 'CP': this._clap(when, amp); break;
      default: this._kick(when, amp);
    }
  }

  // ── 808/909/707 voices ───────────────────────────────────────────────
  _kick(when, amp) {
    const { kit } = this;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const f0 = kit === '909' ? 180 : kit === '707' ? 140 : 150;
    const f1 = kit === '909' ? 42 : kit === '707' ? 55 : 40;
    const dec = kit === '909' ? 0.35 : kit === '707' ? 0.28 : 0.6;
    osc.frequency.setValueAtTime(f0, when);
    osc.frequency.exponentialRampToValueAtTime(f1, when + 0.08);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(amp * 1.1, when + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dec);
    osc.connect(gain).connect(this.master);
    // click transient
    if (kit !== '808') {
      const click = this.ctx.createOscillator();
      const cg = this.ctx.createGain();
      click.frequency.value = 2400;
      click.type = 'square';
      cg.gain.setValueAtTime(amp * 0.2, when);
      cg.gain.exponentialRampToValueAtTime(0.0001, when + 0.01);
      click.connect(cg).connect(this.master);
      click.start(when); click.stop(when + 0.02);
    }
    osc.start(when);
    osc.stop(when + dec + 0.05);
  }

  _snare(when, amp) {
    const { kit } = this;
    // body (two oscillators)
    const o1 = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    o1.frequency.value = kit === '909' ? 220 : 185;
    o2.frequency.value = kit === '909' ? 380 : 349;
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0, when);
    og.gain.linearRampToValueAtTime(amp * 0.5, when + 0.002);
    og.gain.exponentialRampToValueAtTime(0.0001, when + 0.08);
    o1.connect(og); o2.connect(og);
    og.connect(this.master);
    o1.start(when); o2.start(when);
    o1.stop(when + 0.12); o2.stop(when + 0.12);
    // noise tail
    const noise = this._noise(0.18);
    const nFilt = this.ctx.createBiquadFilter();
    nFilt.type = 'bandpass';
    nFilt.frequency.value = kit === '909' ? 2400 : 1800;
    nFilt.Q.value = 0.6;
    const ng = this.ctx.createGain();
    const dec = kit === '707' ? 0.09 : 0.15;
    ng.gain.setValueAtTime(0, when);
    ng.gain.linearRampToValueAtTime(amp * 0.7, when + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0001, when + dec);
    noise.connect(nFilt).connect(ng).connect(this.master);
    noise.start(when); noise.stop(when + dec + 0.02);
  }

  _hat(when, amp, open) {
    const dec = open ? 0.32 : 0.05;
    const noise = this._noise(dec + 0.05);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 10000;
    bp.Q.value = 1.2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(amp * 0.4, when + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dec);
    noise.connect(hp).connect(bp).connect(g).connect(this.master);
    noise.start(when);
    noise.stop(when + dec + 0.05);
  }

  _clap(when, amp) {
    for (let i = 0; i < 3; i++) {
      const t = when + i * 0.012;
      const n = this._noise(0.05);
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 1200;
      f.Q.value = 0.8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp * 0.5, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      n.connect(f).connect(g).connect(this.master);
      n.start(t); n.stop(t + 0.08);
    }
  }

  _noise(dur) {
    const rate = this.ctx.sampleRate;
    const len = Math.ceil(rate * dur);
    const buf = this.ctx.createBuffer(1, len, rate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }
}
