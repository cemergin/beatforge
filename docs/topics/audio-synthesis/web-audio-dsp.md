# Web Audio API & DSP Technical Reference
## For Professional Browser-Based Drum Machine Development

---

# PART 1: WEB AUDIO API DEEP DIVE

---

## 1. AudioContext Lifecycle

### States

An `AudioContext` exists in one of three states:

| State | Meaning |
|-------|---------|
| `"suspended"` | Time progression halted. No audio processing. CPU/battery conserved. |
| `"running"` | Normal operation. Audio graph is being processed. |
| `"closed"` | Permanently shut down. Cannot be resumed. All resources released. |

A fourth state, `"interrupted"`, is proposed (Edge/Chromium) for system-level interruptions (phone call, OS audio session change) that are outside the web app's control.

```js
const ctx = new AudioContext();
console.log(ctx.state); // "suspended" (before user gesture in Chrome)

ctx.addEventListener('statechange', () => {
  console.log('AudioContext state changed to:', ctx.state);
});
```

### Autoplay Policy

Modern browsers (Chrome 66+, Safari, Firefox) enforce autoplay policies:

- An `AudioContext` created **before any user gesture** starts in `"suspended"` state.
- You **must** call `ctx.resume()` inside a user-gesture event handler (click, touchstart, keydown).
- `resume()` returns a `Promise`.

**Robust initialization pattern:**

```js
let ctx;

function ensureAudioContext() {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    return ctx.resume();
  }
  return Promise.resolve();
}

// Attach to a user gesture — button click, first touch, etc.
document.getElementById('start-btn').addEventListener('click', async () => {
  await ensureAudioContext();
  // Now safe to play audio
});
```

**iOS Safari gotcha:** On iOS, you must also play a silent buffer during the first user gesture to "unlock" the context:

```js
function unlockiOSAudio(ctx) {
  const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
}
```

### suspend() and close()

```js
// Pause processing (reversible) — saves CPU/battery
await ctx.suspend();

// Permanently destroy (irreversible) — releases all hardware
await ctx.close();
// ctx.state === "closed"
// Cannot call ctx.resume() after close — will throw
```

**Best practice for a drum machine:** Create one `AudioContext` for the app lifetime. Call `suspend()` when idle, `resume()` when the user interacts. Never `close()` unless the user navigates away.

---

## 2. Audio Graph Architecture

### Node Categories

| Category | Examples | Inputs | Outputs |
|----------|---------|--------|---------|
| **Source** | `AudioBufferSourceNode`, `OscillatorNode`, `MediaElementAudioSourceNode`, `MediaStreamAudioSourceNode`, `ConstantSourceNode` | 0 | 1+ |
| **Processing** | `GainNode`, `BiquadFilterNode`, `DelayNode`, `DynamicsCompressorNode`, `WaveShaperNode`, `ConvolverNode`, `StereoPannerNode`, `PannerNode` | 1+ | 1+ |
| **Analysis** | `AnalyserNode` | 1 | 1 (pass-through) |
| **Destination** | `AudioDestinationNode` (ctx.destination) | 1 | 0 (hardware out) |
| **Channel** | `ChannelSplitterNode`, `ChannelMergerNode` | varies | varies |

### Connection Fundamentals

```js
// Basic chain: source -> processing -> destination
source.connect(gainNode);
gainNode.connect(ctx.destination);

// Disconnect
gainNode.disconnect();              // disconnect all outputs
gainNode.disconnect(ctx.destination); // disconnect specific target
```

### Fan-Out (one output to multiple inputs)

```js
// Same source feeds both a dry path and an effects path
source.connect(dryGain);     // dry path
source.connect(reverbSend);  // effects path
dryGain.connect(ctx.destination);
reverbSend.connect(convolver);
convolver.connect(ctx.destination);
```

### Fan-In (multiple outputs to one input)

```js
// Multiple sources mix into one gain (automatic summing)
kick.connect(masterGain);
snare.connect(masterGain);
hihat.connect(masterGain);
masterGain.connect(ctx.destination);
// The signals are summed at masterGain's input automatically
```

### Drum Machine Mixer Pattern

```js
function createMixer(ctx) {
  const channels = {};
  const master = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();
  master.connect(compressor);
  compressor.connect(ctx.destination);

  function createChannel(name) {
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();
    const eq = ctx.createBiquadFilter();
    eq.connect(gain);
    gain.connect(pan);
    pan.connect(master);
    channels[name] = { eq, gain, pan };
    return channels[name];
  }

  return { channels, master, compressor, createChannel };
}

const mixer = createMixer(ctx);
mixer.createChannel('kick');
mixer.createChannel('snare');
mixer.createChannel('hihat');
```

---

## 3. AudioParam Deep Dive

### a-rate vs k-rate

| Rate | Resolution | Meaning |
|------|-----------|---------|
| **a-rate** | Per-sample (128 values per render quantum) | Parameter changes every sample. Used for frequency, gain where smooth modulation matters. |
| **k-rate** | Per-block (1 value per 128-sample render quantum) | Parameter holds constant for the entire block. Used for less time-sensitive controls. More CPU efficient. |

Most built-in node parameters are a-rate. `BiquadFilterNode.Q`, `DynamicsCompressorNode.threshold`, etc. are k-rate.

### The Automation Timeline

Every `AudioParam` maintains an ordered list of automation events. The computed value at any point is determined by evaluating these events in order.

**Critical rule:** Each automation method's start time is anchored to the **previous** event's time (or the param's current value if no prior event exists). You almost always need to call `setValueAtTime()` first to establish an anchor.

### Automation Methods

#### setValueAtTime(value, startTime)
Instantly sets the value at the given time. This is the **anchor** for subsequent ramps.

```js
gain.gain.setValueAtTime(0, ctx.currentTime);
```

#### linearRampToValueAtTime(value, endTime)
Linear interpolation from the previous event's value to `value`, arriving at `endTime`.

```js
gain.gain.setValueAtTime(0, ctx.currentTime);
gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01); // 10ms fade-in
```

#### exponentialRampToValueAtTime(value, endTime)
Exponential curve from previous value to `value` at `endTime`.

**CRITICAL:** Neither the starting value nor the target value can be 0. Exponential curves are undefined at zero (you can't compute `0 * (target/0)^t`). Use a very small value like `0.0001` instead.

```js
gain.gain.setValueAtTime(1, ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
// NOT: gain.gain.exponentialRampToValueAtTime(0, ...) — this THROWS or is silent
```

#### setTargetAtTime(target, startTime, timeConstant)
Exponential approach toward `target`, starting at `startTime`. The `timeConstant` is the time (seconds) to reach ~63.2% of the way there. After 5 time constants, you're ~99.3% there.

```js
// Smooth release that asymptotically approaches 0
gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
// After 0.5s (5 * 0.1), gain is ~0.007
```

This method **can** target zero because it uses the formula: `v(t) = target + (startValue - target) * e^(-(t-startTime)/timeConstant)`.

#### setValueCurveAtTime(values, startTime, duration)
Follows an arbitrary curve defined by a `Float32Array` of values, evenly distributed across `duration`.

```js
// Custom envelope shape
const curve = new Float32Array([0, 0.8, 1.0, 0.9, 0.7, 0.5, 0.2, 0]);
gain.gain.setValueCurveAtTime(curve, ctx.currentTime, 0.5);
```

#### cancelScheduledValues(startTime)
Removes all scheduled events from `startTime` onwards.

```js
gain.gain.cancelScheduledValues(ctx.currentTime);
```

#### cancelAndHoldAtTime(startTime)
Cancels events from `startTime` onwards but **holds** the value the param would have had at that moment. Useful for interrupting an envelope mid-flight.

```js
// If a note-off arrives during the attack phase:
gain.gain.cancelAndHoldAtTime(ctx.currentTime);
// Now schedule the release from wherever we are
gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
```

### AudioParam Connection (Modulation)

You can connect an AudioNode output directly to an AudioParam for modulation:

```js
// LFO tremolo: oscillator modulates gain
const lfo = ctx.createOscillator();
lfo.frequency.value = 5; // 5 Hz tremolo
const lfoGain = ctx.createGain();
lfoGain.gain.value = 0.3; // modulation depth

lfo.connect(lfoGain);
lfoGain.connect(masterGain.gain); // connect to the PARAM, not the node
lfo.start();
// masterGain.gain now fluctuates: its value + (lfo output * 0.3)
```

---

## 4. AudioWorklet Deep Dive

### Architecture

```
Main Thread                      Audio Rendering Thread
============                     ======================
AudioWorkletNode  <--MessagePort-->  AudioWorkletProcessor
  .parameters                          process(inputs, outputs, params)
  .port                                .port
```

### Setup

```js
// main.js
const ctx = new AudioContext();
await ctx.audioWorklet.addModule('my-processor.js');
const node = new AudioWorkletNode(ctx, 'my-processor', {
  numberOfInputs: 1,
  numberOfOutputs: 1,
  outputChannelCount: [2],
  parameterData: { gain: 0.5 },
  processorOptions: { bufferSize: 4096 }
});
node.connect(ctx.destination);
```

```js
// my-processor.js (runs on audio thread)
class MyProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'gain',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0,
        automationRate: 'a-rate' // or 'k-rate'
      }
    ];
  }

  constructor(options) {
    super();
    // options.processorOptions === { bufferSize: 4096 }
    this.port.onmessage = (e) => {
      // Handle messages from main thread
    };
  }

  process(inputs, outputs, parameters) {
    // inputs[inputIndex][channelIndex][sampleIndex]
    // outputs[outputIndex][channelIndex][sampleIndex]
    // parameters.gain is Float32Array

    const output = outputs[0];
    const input = inputs[0];
    const gainParam = parameters.gain;

    // gainParam.length === 1 if k-rate or no automation active
    // gainParam.length === 128 if a-rate with active automation
    const useARate = gainParam.length === 128;

    for (let ch = 0; ch < output.length; ch++) {
      for (let i = 0; i < output[ch].length; i++) {
        const g = useARate ? gainParam[i] : gainParam[0];
        output[ch][i] = (input[ch] ? input[ch][i] : 0) * g;
      }
    }

    return true; // keep alive
  }
}

registerProcessor('my-processor', MyProcessor);
```

### The Render Quantum

- Each `process()` call handles exactly **128 samples** (called a "render quantum")
- At 44100 Hz, that is ~2.9ms per call
- At 48000 Hz, that is ~2.67ms per call
- You **must** finish processing within this time window or you get audio glitches (buffer underruns)
- Always check `array.length` rather than hardcoding 128 (the spec may allow variable sizes in the future)

### Memory Management on the Audio Thread

**The audio thread is a hard real-time context. The rules are strict:**

1. **No garbage collection** should be triggered. GC pauses cause audio glitches.
2. **Never allocate** objects or arrays inside `process()`. Pre-allocate everything in the constructor.
3. **Never use** `console.log()`, DOM access, or anything that touches the main thread.
4. **Avoid** closures that capture large scopes.
5. **Avoid** `Map`, `Set`, dynamic arrays — they trigger GC.

```js
// BAD — allocates every render quantum
process(inputs, outputs, parameters) {
  const temp = new Float32Array(128); // GC pressure!
  const result = inputs[0][0].map(x => x * 2); // .map() allocates!
  return true;
}

// GOOD — pre-allocate in constructor
constructor() {
  super();
  this._temp = new Float32Array(128);
}

process(inputs, outputs, parameters) {
  const temp = this._temp; // reference, no allocation
  const input = inputs[0][0];
  const output = outputs[0][0];
  for (let i = 0; i < 128; i++) {
    output[i] = input[i] * 2;
  }
  return true;
}
```

### MessagePort Communication

```js
// main.js — send data to processor
node.port.postMessage({ type: 'load-sample', buffer: floatArray });
node.port.onmessage = (e) => {
  console.log('From processor:', e.data);
};

// processor.js — receive on audio thread
constructor() {
  super();
  this.port.onmessage = (e) => {
    if (e.data.type === 'load-sample') {
      this._sampleBuffer = e.data.buffer; // Transferred, no copy
    }
  };
}
```

**Caution:** `postMessage` involves structured cloning (allocation). Use it for infrequent setup, not per-frame communication.

### SharedArrayBuffer Pattern (Lock-Free Communication)

For high-frequency data exchange (e.g., waveform visualization, level metering):

```js
// main.js
const sab = new SharedArrayBuffer(256 * Float32Array.BYTES_PER_ELEMENT);
const sharedArray = new Float32Array(sab);

const node = new AudioWorkletNode(ctx, 'meter-processor', {
  processorOptions: { sharedBuffer: sab }
});

// Read levels from shared memory in animation loop
function updateMeter() {
  const rms = sharedArray[0]; // written by processor
  const peak = sharedArray[1];
  drawMeter(rms, peak);
  requestAnimationFrame(updateMeter);
}
updateMeter();
```

```js
// meter-processor.js
class MeterProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this._sharedArray = new Float32Array(options.processorOptions.sharedBuffer);
  }

  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true;

    let sum = 0;
    let peak = 0;
    for (let i = 0; i < input.length; i++) {
      const s = Math.abs(input[i]);
      sum += input[i] * input[i];
      if (s > peak) peak = s;
    }

    // Write directly to shared memory — no postMessage overhead
    this._sharedArray[0] = Math.sqrt(sum / input.length); // RMS
    this._sharedArray[1] = peak;
    return true;
  }
}
registerProcessor('meter-processor', MeterProcessor);
```

**Ring buffer pattern** (for streaming audio data between threads):

```js
// Use Atomics for the read/write pointers, raw Float32Array for audio data
class RingBuffer {
  constructor(sab, capacity) {
    this._capacity = capacity;
    // First 8 bytes: read pointer (Int32) + write pointer (Int32)
    this._pointers = new Int32Array(sab, 0, 2);
    // Remaining bytes: audio data
    this._data = new Float32Array(sab, 8, capacity);
  }

  push(array) {
    const writePtr = Atomics.load(this._pointers, 1);
    for (let i = 0; i < array.length; i++) {
      this._data[(writePtr + i) % this._capacity] = array[i];
    }
    Atomics.store(this._pointers, 1, (writePtr + array.length) % this._capacity);
  }

  pull(length) {
    const readPtr = Atomics.load(this._pointers, 0);
    const result = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = this._data[(readPtr + i) % this._capacity];
    }
    Atomics.store(this._pointers, 0, (readPtr + length) % this._capacity);
    return result;
  }
}
```

### Return Value of process()

- Return `true`: keep the node alive (even if inputs are silent)
- Return `false`: allow the browser to garbage-collect the node when it has no active inputs and generates no output

For a drum machine, source-type processors should return `true` while playing and `false` when done.

---

## 5. OfflineAudioContext

### Purpose

Renders an audio graph **faster than real-time** to an `AudioBuffer`. Use cases:
- Export patterns to WAV
- Pre-render complex effects chains
- Bounce tracks

### Basic Usage

```js
// Render 4 seconds of stereo audio at 44100 Hz
const offline = new OfflineAudioContext(2, 44100 * 4, 44100);

// Build the same audio graph as you would with a real-time context
const source = offline.createBufferSource();
source.buffer = myDrumPattern; // an AudioBuffer
source.connect(offline.destination);
source.start(0);

// Render (returns a Promise<AudioBuffer>)
const renderedBuffer = await offline.startRendering();
```

### Differences from Real-Time AudioContext

| Feature | AudioContext | OfflineAudioContext |
|---------|-------------|-------------------|
| Processing speed | Real-time | As fast as CPU allows |
| `suspend()`/`resume()` | Pauses audio | Pauses rendering at specific time |
| Hardware output | Yes | No (renders to buffer) |
| `currentTime` | Advances in real-time | Advances per render quantum |
| AudioWorklet | Supported | Supported |

### Rendering a Pattern to WAV

```js
async function renderPatternToWav(ctx, patternData, bpm, sampleRate = 44100) {
  const patternDuration = (patternData.steps * 60) / (bpm * (patternData.stepsPerBeat || 4));
  const frameCount = Math.ceil(sampleRate * patternDuration);
  const offline = new OfflineAudioContext(2, frameCount, sampleRate);

  // Schedule all hits in the pattern
  for (const hit of patternData.hits) {
    const source = offline.createBufferSource();
    source.buffer = hit.sample;
    const gain = offline.createGain();
    gain.gain.value = hit.velocity;
    source.connect(gain);
    gain.connect(offline.destination);
    source.start(hit.time);
  }

  const rendered = await offline.startRendering();
  return audioBufferToWav(rendered);
}

// WAV encoder — writes a valid WAV file from an AudioBuffer
function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;

  // Interleave channels
  let interleaved;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    interleaved = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      interleaved[i * 2] = left[i];
      interleaved[i * 2 + 1] = right[i];
    }
  } else {
    interleaved = buffer.getChannelData(0);
  }

  const dataLength = interleaved.length * (bitsPerSample / 8);
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);                          // chunk size
  view.setUint16(20, format, true);                       // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true); // byte rate
  view.setUint16(32, numChannels * bitsPerSample / 8, true);             // block align
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM samples (convert float [-1,1] to int16)
  let offset = 44;
  for (let i = 0; i < interleaved.length; i++) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });

  function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
}

// Trigger download
function downloadWav(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## 6. Audio Node Connection Patterns

### Serial Chain

```js
source -> filter -> gain -> compressor -> destination
```

```js
source.connect(filter);
filter.connect(gain);
gain.connect(compressor);
compressor.connect(ctx.destination);
```

### Parallel Split (Dry/Wet)

```js
//          ┌─> dryGain ──────────────┐
// source ──┤                          ├──> destination
//          └─> effect ──> wetGain ───┘

source.connect(dryGain);
source.connect(effect);
effect.connect(wetGain);
dryGain.connect(ctx.destination);
wetGain.connect(ctx.destination);
```

### Feedback Loop (DelayNode Required)

The Web Audio API requires a `DelayNode` in any cycle to prevent infinite recursion in the graph traversal. The delay introduces one render quantum of latency minimum.

```js
//           ┌──────────────────────────────────┐
//           │                                  │
// source -> delay -> gain(output) -> destination
//              ^         |
//              |         v
//              └── feedbackGain
//                   (0.0–0.95)

const delay = ctx.createDelay(1.0); // max 1 second
const feedbackGain = ctx.createGain();
feedbackGain.gain.value = 0.6; // 60% feedback

source.connect(delay);
delay.connect(outputGain);
outputGain.connect(ctx.destination);

// The feedback loop
delay.connect(feedbackGain);
feedbackGain.connect(delay);
```

### Send/Return Bus (Effects Bus)

Professional mixing uses aux sends — each channel sends a portion of its signal to a shared effects bus:

```js
function createSendReturn(ctx, effectNode) {
  const sendBus = ctx.createGain(); // receives all sends
  const returnGain = ctx.createGain();
  sendBus.connect(effectNode);
  effectNode.connect(returnGain);
  return { sendBus, returnGain };
}

// Create a reverb bus
const convolver = ctx.createConvolver();
convolver.buffer = reverbIR;
const reverbBus = createSendReturn(ctx, convolver);
reverbBus.returnGain.connect(ctx.destination);

// Each channel gets its own send amount
function createChannelSend(channelOutput, sendBus, amount) {
  const sendGain = ctx.createGain();
  sendGain.gain.value = amount; // 0 = no send, 1 = full send
  channelOutput.connect(sendGain);
  sendGain.connect(sendBus);
  return sendGain;
}

createChannelSend(kickGain, reverbBus.sendBus, 0.1);  // kick: subtle reverb
createChannelSend(snareGain, reverbBus.sendBus, 0.4);  // snare: more reverb
createChannelSend(hihatGain, reverbBus.sendBus, 0.2);  // hihat: moderate
```

---

## 7. Channel Handling

### Channel Counts

| Format | Channels |
|--------|----------|
| Mono | 1 |
| Stereo | 2 |
| Quad | 4 |
| 5.1 | 6 |

### channelCount, channelCountMode, channelInterpretation

Every `AudioNode` has three channel properties:

**`channelCount`** — the number of channels used when up-mixing/down-mixing.

**`channelCountMode`:**
- `"max"` — use the maximum channel count among all connections (channelCount ignored)
- `"clamped-max"` — like `"max"` but clamped to channelCount
- `"explicit"` — use exactly channelCount, regardless of inputs

**`channelInterpretation`:**
- `"speakers"` — uses standard up/down-mix matrices (mono center, stereo L/R, etc.)
- `"discrete"` — channels map by index; extras are zeroed or dropped

### Up-Mixing Rules (speakers interpretation)

| From | To | Rule |
|------|----|------|
| Mono -> Stereo | `L = mono, R = mono` (centered) |
| Stereo -> Mono | `mono = 0.5 * (L + R)` |
| Mono -> 5.1 | Center channel only |

### ChannelSplitterNode / ChannelMergerNode

```js
// Split a stereo signal into two mono signals
const splitter = ctx.createChannelSplitter(2);
stereoSource.connect(splitter);

const leftGain = ctx.createGain();
const rightGain = ctx.createGain();
splitter.connect(leftGain, 0);  // output 0 = left channel
splitter.connect(rightGain, 1); // output 1 = right channel

// Process channels independently...

// Merge back to stereo
const merger = ctx.createChannelMerger(2);
leftGain.connect(merger, 0, 0);   // leftGain output 0 -> merger input 0
rightGain.connect(merger, 0, 1);  // rightGain output 0 -> merger input 1
merger.connect(ctx.destination);
```

---

# PART 2: DSP FUNDAMENTALS FOR AUDIO

---

## 1. Sampling Theory

### Nyquist-Shannon Sampling Theorem

To perfectly reconstruct a continuous signal from discrete samples, you must sample at a rate **at least twice** the highest frequency present in the signal:

```
f_sample >= 2 * f_max
```

The **Nyquist frequency** is half the sample rate. For CD audio (44100 Hz), the Nyquist frequency is 22050 Hz — just above the human hearing limit (~20 kHz).

### Aliasing

When a signal contains frequencies above the Nyquist limit, those frequencies "fold back" into the representable range, appearing as phantom lower frequencies. This is **aliasing** and it sounds terrible — inharmonic, metallic, digital artifacts.

**Example:** At 44100 Hz sample rate, a 23000 Hz sine wave aliases to 44100 - 23000 = 21100 Hz.

### Anti-Aliasing

- **Before sampling (analog):** A low-pass filter removes frequencies above Nyquist before the ADC.
- **In digital processing:** When generating signals that could exceed Nyquist (distortion, waveshaping, synthesis), use **oversampling**: process at 2x or 4x the sample rate, then low-pass filter and downsample.
- The `WaveShaperNode.oversample` property (`"none"`, `"2x"`, `"4x"`) does this automatically.

```js
const waveshaper = ctx.createWaveShaper();
waveshaper.oversample = '4x'; // anti-aliased distortion
```

---

## 2. Digital Filters

### FIR vs IIR

| Property | FIR (Finite Impulse Response) | IIR (Infinite Impulse Response) |
|----------|------|------|
| Feedback | No (uses only input samples) | Yes (uses input AND previous outputs) |
| Phase | Can be linear phase | Non-linear phase |
| Stability | Always stable | Can be unstable |
| Efficiency | Needs many taps for steep slopes | Very efficient for steep slopes |
| Web Audio | `IIRFilterNode` (confusingly, you provide both feedforward AND feedback coefficients) | `BiquadFilterNode` (second-order IIR) |

### Biquad Filter (the workhorse)

A biquad is a second-order IIR filter — two poles and two zeros. The `BiquadFilterNode` implements all common filter shapes:

| Type | Purpose | frequency | Q | gain |
|------|---------|-----------|---|------|
| `"lowpass"` | Passes below cutoff, attenuates above | Cutoff freq | Resonance peak (dB) | N/A |
| `"highpass"` | Passes above cutoff, attenuates below | Cutoff freq | Resonance peak (dB) | N/A |
| `"bandpass"` | Passes a frequency band | Center freq | Bandwidth (higher Q = narrower) | N/A |
| `"notch"` | Rejects a frequency band | Center freq | Bandwidth | N/A |
| `"allpass"` | Passes all frequencies, shifts phase | Transition freq | Sharpness of transition | N/A |
| `"peaking"` | Boosts/cuts around a frequency | Center freq | Bandwidth | Boost/cut in dB |
| `"lowshelf"` | Boosts/cuts below a frequency | Transition freq | Slope steepness | Boost/cut in dB |
| `"highshelf"` | Boosts/cuts above a frequency | Transition freq | Slope steepness | Boost/cut in dB |

```js
const filter = ctx.createBiquadFilter();
filter.type = 'lowpass';
filter.frequency.value = 1000; // 1kHz cutoff
filter.Q.value = 1;            // moderate resonance

// Automate a filter sweep
filter.frequency.setValueAtTime(100, ctx.currentTime);
filter.frequency.exponentialRampToValueAtTime(8000, ctx.currentTime + 2);
```

### Q Factor

**Q** (Quality factor) controls resonance or bandwidth:
- For lowpass/highpass: higher Q creates a resonant peak at the cutoff frequency. At very high Q (>20), the filter "rings" — it oscillates briefly at the cutoff frequency.
- For bandpass/notch: Q = centerFreq / bandwidth. Higher Q = narrower band.

### Filter Slope

A single biquad gives 12 dB/octave (second-order). For steeper slopes:
- 24 dB/octave: cascade two biquads
- 48 dB/octave: cascade four biquads

```js
// 24 dB/octave lowpass
const filter1 = ctx.createBiquadFilter();
const filter2 = ctx.createBiquadFilter();
filter1.type = filter2.type = 'lowpass';
filter1.frequency.value = filter2.frequency.value = 1000;
filter1.Q.value = filter2.Q.value = 0.707; // Butterworth (flat passband)

source.connect(filter1).connect(filter2).connect(ctx.destination);
```

### IIRFilterNode (Custom Filters)

For filters that cannot be expressed as a single biquad:

```js
// Example: 4th-order Butterworth lowpass (pre-computed coefficients)
const feedforward = [0.0002, 0.0008, 0.0012, 0.0008, 0.0002];
const feedback = [1.0, -3.1806, 3.8612, -2.1122, 0.4384];
const iir = ctx.createIIRFilter(feedforward, feedback);
```

---

## 3. Envelope Generators (ADSR)

### Concept

An ADSR envelope shapes amplitude (or filter cutoff, etc.) over time:

```
Level
1.0 |      /\
    |     /  \___________
    |    /    D    S      \
    |   / A              R \
0.0 |__/                    \___
    |--|---|----------|------|
    noteOn            noteOff
```

- **Attack** — time from 0 to peak (1.0)
- **Decay** — time from peak to sustain level
- **Sustain** — level held while note is on (not a time, a level)
- **Release** — time from sustain to 0 after note-off

### Implementation with AudioParam Automation

```js
function noteOn(gainNode, ctx, { attack, decay, sustain }) {
  const now = ctx.currentTime;
  const gain = gainNode.gain;

  gain.cancelScheduledValues(now);
  gain.setValueAtTime(0.0001, now); // anchor (cannot be 0 for exp ramp)

  if (attack > 0.001) {
    // Attack: exponential ramp to 1.0
    gain.exponentialRampToValueAtTime(1.0, now + attack);
  } else {
    gain.setValueAtTime(1.0, now + 0.001);
  }

  // Decay: exponential approach to sustain level
  // Use setTargetAtTime for natural-sounding decay
  gain.setTargetAtTime(sustain, now + attack, decay / 5);
  // timeConstant = decay/5 means ~99% reached by end of decay period
}

function noteOff(gainNode, ctx, { release }) {
  const now = ctx.currentTime;
  const gain = gainNode.gain;

  // Cancel any in-progress automation
  gain.cancelAndHoldAtTime(now);

  // Release: exponential approach to ~zero
  gain.setTargetAtTime(0.0001, now, release / 5);

  // Schedule a hard zero slightly after release completes
  gain.setValueAtTime(0, now + release);
}
```

### Why exponentialRampToValueAtTime Cannot Reach Zero

The formula for exponential interpolation is:

```
v(t) = v1 * (v2/v1) ^ ((t - t1) / (t2 - t1))
```

If `v1` or `v2` is 0, you get `0/0` or `log(0)` — both undefined. The workaround is to use `0.0001` (-80 dB, inaudible) as a proxy for zero, or use `setTargetAtTime(0, ...)` which uses a different formula that can reach zero asymptotically.

### Linear vs Exponential Curves

Human hearing is logarithmic. A linear ramp from 1.0 to 0.0 sounds like a sudden drop followed by a long tail. An exponential ramp sounds perceptually even. **Always use exponential curves for amplitude envelopes** unless you have a specific reason not to.

```js
// Linear fade: sounds unnatural for volume
gain.linearRampToValueAtTime(0.0001, now + 0.5);

// Exponential fade: sounds natural
gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

// setTargetAtTime: most natural, asymptotic
gain.setTargetAtTime(0, now, 0.1); // time constant 100ms
```

---

## 4. Oscillators

### Built-in Waveforms

```js
const osc = ctx.createOscillator();
osc.type = 'sine';      // pure tone, no harmonics
osc.type = 'square';    // odd harmonics (1, 3, 5, 7...) at 1/n amplitude
osc.type = 'sawtooth';  // all harmonics (1, 2, 3, 4...) at 1/n amplitude
osc.type = 'triangle';  // odd harmonics at 1/n^2 amplitude (softer than square)

osc.frequency.value = 440; // A4
osc.detune.value = 0;      // cents (100 cents = 1 semitone)
osc.start();
osc.stop(ctx.currentTime + 1);
```

### Custom Periodic Waves (Additive Synthesis)

You define a waveform via Fourier coefficients — arrays of cosine (real) and sine (imaginary) amplitudes:

```js
// Organ-like tone: fundamental + 2nd + 3rd harmonic
const real = new Float32Array([0, 1.0, 0.5, 0.25]); // cosine terms
const imag = new Float32Array([0, 0,   0,   0   ]); // sine terms
// Index 0 = DC offset (usually 0), index 1 = fundamental, index 2 = 2nd harmonic...

const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
const osc = ctx.createOscillator();
osc.setPeriodicWave(wave);
osc.frequency.value = 220;
osc.start();
```

**`disableNormalization: false`** (default) scales the waveform to peak at [-1, 1]. Set to `true` if you want exact amplitudes.

### Drum Synthesis with Oscillators

A classic 808-style kick drum:

```js
function play808Kick(ctx, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  // Pitch envelope: start high, sweep down
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.07);

  // Amplitude envelope
  gain.gain.setValueAtTime(1.0, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.5);

  osc.start(time);
  osc.stop(time + 0.5);
}
```

---

## 5. Noise Generation

### White Noise (AudioWorklet)

Equal energy at all frequencies. Flat spectrum.

```js
// white-noise-processor.js
class WhiteNoiseProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const output = outputs[0];
    for (let ch = 0; ch < output.length; ch++) {
      for (let i = 0; i < output[ch].length; i++) {
        output[ch][i] = Math.random() * 2 - 1;
      }
    }
    return true;
  }
}
registerProcessor('white-noise', WhiteNoiseProcessor);
```

### Pink Noise (-3 dB/octave)

Equal energy per octave. Sounds more "natural" than white noise. Uses the Voss-McCartney algorithm or a filter approximation:

```js
// pink-noise-processor.js
class PinkNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Paul Kellet's refined method — 6 state variables
    this.b0 = 0; this.b1 = 0; this.b2 = 0;
    this.b3 = 0; this.b4 = 0; this.b5 = 0; this.b6 = 0;
  }

  process(inputs, outputs) {
    const output = outputs[0][0];
    for (let i = 0; i < output.length; i++) {
      const white = Math.random() * 2 - 1;
      this.b0 = 0.99886 * this.b0 + white * 0.0555179;
      this.b1 = 0.99332 * this.b1 + white * 0.0750759;
      this.b2 = 0.96900 * this.b2 + white * 0.1538520;
      this.b3 = 0.86650 * this.b3 + white * 0.3104856;
      this.b4 = 0.55000 * this.b4 + white * 0.5329522;
      this.b5 = -0.7616 * this.b5 - white * 0.0168980;
      output[i] = (this.b0 + this.b1 + this.b2 + this.b3
                 + this.b4 + this.b5 + this.b6 + white * 0.5362) * 0.11;
      this.b6 = white * 0.115926;
    }
    // Copy to other channels
    for (let ch = 1; ch < outputs[0].length; ch++) {
      outputs[0][ch].set(output);
    }
    return true;
  }
}
registerProcessor('pink-noise', PinkNoiseProcessor);
```

### Brown/Red Noise (-6 dB/octave)

Integrated white noise (each sample is previous + random). Sounds like a waterfall or distant thunder.

```js
// brown-noise-processor.js
class BrownNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.lastOut = 0;
  }

  process(inputs, outputs) {
    const output = outputs[0][0];
    for (let i = 0; i < output.length; i++) {
      const white = Math.random() * 2 - 1;
      this.lastOut = (this.lastOut + (0.02 * white)) / 1.02;
      output[i] = this.lastOut * 3.5; // compensate for volume loss
    }
    for (let ch = 1; ch < outputs[0].length; ch++) {
      outputs[0][ch].set(output);
    }
    return true;
  }
}
registerProcessor('brown-noise', BrownNoiseProcessor);
```

### Drum Usage

Noise is essential for drums:
- **Snare:** Mix a short sine/triangle burst (body) with filtered white noise (snare wires)
- **Hi-hat:** Filtered white noise with a very short envelope, bandpass around 8-12 kHz
- **Clap:** Filtered pink noise with a multi-peak envelope (the "flutter" of multiple hands)

---

## 6. Distortion / Waveshaping

### WaveShaperNode

The `WaveShaperNode` maps input samples through a **transfer function** (a curve). Input values [-1, 1] are mapped to output values defined by the curve array.

```js
const waveshaper = ctx.createWaveShaper();
waveshaper.oversample = '4x'; // reduce aliasing artifacts
```

### Soft Clipping (Tube-Like)

```js
// Hyperbolic tangent — classic tube saturation
function makeSoftClipCurve(amount = 5, resolution = 44100) {
  const curve = new Float32Array(resolution);
  for (let i = 0; i < resolution; i++) {
    const x = (i * 2) / resolution - 1;
    curve[i] = Math.tanh(amount * x);
  }
  return curve;
}
waveshaper.curve = makeSoftClipCurve(3);
```

### Hard Clipping

```js
function makeHardClipCurve(threshold = 0.5, resolution = 44100) {
  const curve = new Float32Array(resolution);
  for (let i = 0; i < resolution; i++) {
    const x = (i * 2) / resolution - 1;
    curve[i] = Math.max(-threshold, Math.min(threshold, x));
  }
  return curve;
}
```

### Polynomial Soft Clip

```js
// f(x) = 1.5x - 0.5x^3  (derivative is 0 at clipping points)
function makePolynomialCurve(resolution = 44100) {
  const curve = new Float32Array(resolution);
  for (let i = 0; i < resolution; i++) {
    const x = (i * 2) / resolution - 1;
    curve[i] = 1.5 * x - 0.5 * x * x * x;
  }
  return curve;
}
```

### Asymmetric Tube Simulation

Real tubes clip differently on positive vs negative half-cycles:

```js
function makeTubeCurve(resolution = 44100) {
  const curve = new Float32Array(resolution);
  for (let i = 0; i < resolution; i++) {
    const x = (i * 2) / resolution - 1;
    if (x >= 0) {
      curve[i] = Math.tanh(2 * x);          // positive: moderate saturation
    } else {
      curve[i] = Math.tanh(4 * x) * 0.8;   // negative: harder clip, asymmetric
    }
  }
  return curve;
}
```

### Drive Control

Rather than generating different curves for different drive amounts, boost the signal before the waveshaper:

```js
const driveGain = ctx.createGain();
const waveshaper = ctx.createWaveShaper();
const outputGain = ctx.createGain();

waveshaper.curve = makeSoftClipCurve(1); // fixed curve
waveshaper.oversample = '4x';

// Drive: boost input to push into saturation
driveGain.gain.value = 4; // 4x overdrive
// Compensate output level
outputGain.gain.value = 0.25;

source.connect(driveGain).connect(waveshaper).connect(outputGain).connect(ctx.destination);
```

---

## 7. Convolution Reverb

### Loading Impulse Responses

```js
async function loadImpulseResponse(ctx, url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  return audioBuffer;
}

const convolver = ctx.createConvolver();
convolver.buffer = await loadImpulseResponse(ctx, '/ir/large-hall.wav');
convolver.normalize = true; // normalize IR to prevent extreme volume changes
```

### Typical Routing (Send/Return)

```js
// Dry signal goes direct; wet signal goes through convolver
const dryGain = ctx.createGain();
const wetGain = ctx.createGain();
dryGain.gain.value = 0.7;
wetGain.gain.value = 0.3;

source.connect(dryGain);
source.connect(convolver);
convolver.connect(wetGain);
dryGain.connect(ctx.destination);
wetGain.connect(ctx.destination);
```

### Creating Synthetic Impulse Responses

Exponentially decaying noise makes a surprisingly good reverb:

```js
function createSyntheticIR(ctx, duration = 2.0, decay = 2.0, reverse = false) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * decay);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
  }

  if (reverse) {
    for (let ch = 0; ch < 2; ch++) {
      buffer.getChannelData(ch).reverse();
    }
  }

  return buffer;
}

convolver.buffer = createSyntheticIR(ctx, 1.5, 3.0);
```

### Impulse Response Quality Notes

- **Format:** 32-bit float WAV at 44.1 or 48 kHz for best results
- **Length:** 1-3 seconds for rooms, 3-8 seconds for halls/cathedrals
- **Stereo IRs** create a stereo reverb field even from mono input
- The `ConvolverNode` is computationally expensive — use the send/return bus pattern so all instruments share one convolver

---

## 8. Delay Effects

### Basic Delay with Feedback

```js
function createDelay(ctx, { time = 0.3, feedback = 0.5, mix = 0.5 } = {}) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const delay = ctx.createDelay(2.0);
  const feedbackGain = ctx.createGain();
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  delay.delayTime.value = time;
  feedbackGain.gain.value = feedback;
  dryGain.gain.value = 1 - mix;
  wetGain.gain.value = mix;

  // Dry path
  input.connect(dryGain);
  dryGain.connect(output);

  // Wet path with feedback
  input.connect(delay);
  delay.connect(wetGain);
  wetGain.connect(output);
  delay.connect(feedbackGain);
  feedbackGain.connect(delay);

  return { input, output, delay, feedbackGain, dryGain, wetGain };
}
```

### Ping-Pong Delay

Bounces between left and right channels:

```js
function createPingPongDelay(ctx, { time = 0.3, feedback = 0.5 } = {}) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const merger = ctx.createChannelMerger(2);
  const splitter = ctx.createChannelSplitter(2);

  const delayL = ctx.createDelay(2.0);
  const delayR = ctx.createDelay(2.0);
  const feedbackL = ctx.createGain();
  const feedbackR = ctx.createGain();

  delayL.delayTime.value = time;
  delayR.delayTime.value = time;
  feedbackL.gain.value = feedback;
  feedbackR.gain.value = feedback;

  // Input -> left delay -> right delay -> left delay (ping pong)
  input.connect(delayL);

  delayL.connect(feedbackL);
  feedbackL.connect(delayR);

  delayR.connect(feedbackR);
  feedbackR.connect(delayL);

  // Merge to stereo output
  delayL.connect(merger, 0, 0); // left delay -> left channel
  delayR.connect(merger, 0, 1); // right delay -> right channel
  merger.connect(output);

  return { input, output };
}
```

### Comb Filter

A very short delay (< 20ms) with feedback creates a resonant comb filter:

```js
function createCombFilter(ctx, { frequency = 500, feedback = 0.9 } = {}) {
  // Delay time = 1/frequency for the resonant peak
  const delay = ctx.createDelay(0.1);
  const feedbackGain = ctx.createGain();

  delay.delayTime.value = 1 / frequency;
  feedbackGain.gain.value = feedback;

  delay.connect(feedbackGain);
  feedbackGain.connect(delay);

  return { input: delay, output: delay };
}
```

### Flanger (Modulated Short Delay)

```js
function createFlanger(ctx, { rate = 0.5, depth = 0.002, feedback = 0.7 } = {}) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const delay = ctx.createDelay(0.02);
  const feedbackGain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  delay.delayTime.value = 0.005; // 5ms base delay
  feedbackGain.gain.value = feedback;
  lfo.frequency.value = rate;
  lfoGain.gain.value = depth; // modulation depth in seconds

  // LFO modulates delay time
  lfo.connect(lfoGain);
  lfoGain.connect(delay.delayTime);
  lfo.start();

  // Signal path
  input.connect(delay);
  delay.connect(feedbackGain);
  feedbackGain.connect(delay);
  delay.connect(wetGain);

  input.connect(dryGain);
  dryGain.connect(output);
  wetGain.connect(output);

  return { input, output, lfo, delay };
}
```

### Chorus (Modulated Medium Delay)

```js
function createChorus(ctx, { rate = 1.5, depth = 0.003, voices = 3 } = {}) {
  const input = ctx.createGain();
  const output = ctx.createGain();

  input.connect(output); // dry signal

  for (let v = 0; v < voices; v++) {
    const delay = ctx.createDelay(0.1);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const voiceGain = ctx.createGain();

    delay.delayTime.value = 0.02 + (v * 0.005); // stagger base delays
    lfo.frequency.value = rate + (v * 0.1);       // slightly different rates
    lfoGain.gain.value = depth;
    voiceGain.gain.value = 1 / (voices + 1);      // normalize volume

    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    input.connect(delay);
    delay.connect(voiceGain);
    voiceGain.connect(output);
    lfo.start();
  }

  return { input, output };
}
```

---

## 9. Dynamics Processing

### DynamicsCompressorNode Parameters

| Parameter | Default | Range | Type | Description |
|-----------|---------|-------|------|-------------|
| `threshold` | -24 dB | -100 to 0 | k-rate | Level above which compression begins |
| `knee` | 30 dB | 0 to 40 | k-rate | Range (dB) for smooth transition around threshold |
| `ratio` | 12 | 1 to 20 | k-rate | Input/output ratio above threshold |
| `attack` | 0.003 s | 0 to 1 | k-rate | Time for compressor to engage |
| `release` | 0.25 s | 0 to 1 | k-rate | Time for compressor to disengage |
| `reduction` | 0 dB | read-only | — | Current gain reduction being applied |

```js
const compressor = ctx.createDynamicsCompressor();
compressor.threshold.value = -20;
compressor.knee.value = 10;
compressor.ratio.value = 4;
compressor.attack.value = 0.005;
compressor.release.value = 0.1;

source.connect(compressor);
compressor.connect(ctx.destination);

// Monitor compression amount
setInterval(() => {
  console.log('Gain reduction:', compressor.reduction, 'dB');
}, 100);
```

### Limiter (Infinite Ratio Compressor)

```js
function createLimiter(ctx, { ceiling = -1 } = {}) {
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = ceiling;
  limiter.knee.value = 0;     // hard knee
  limiter.ratio.value = 20;   // 20:1 is effectively limiting
  limiter.attack.value = 0.001;
  limiter.release.value = 0.01;
  return limiter;
}
```

### Sidechain Compression (AudioWorklet Implementation)

The built-in `DynamicsCompressorNode` does not support sidechain input. You must implement it yourself:

```js
// sidechain-compressor.js (AudioWorklet)
class SidechainCompressor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'threshold', defaultValue: -20, minValue: -100, maxValue: 0 },
      { name: 'ratio', defaultValue: 4, minValue: 1, maxValue: 20 },
      { name: 'attack', defaultValue: 0.003, minValue: 0, maxValue: 1 },
      { name: 'release', defaultValue: 0.25, minValue: 0, maxValue: 1 }
    ];
  }

  constructor() {
    super();
    this._envelope = 0;
  }

  process(inputs, outputs, parameters) {
    // inputs[0] = audio signal to compress
    // inputs[1] = sidechain signal (detector)
    const signal = inputs[0][0];
    const sidechain = inputs[1] && inputs[1][0] ? inputs[1][0] : signal;
    const output = outputs[0][0];

    if (!signal || !output) return true;

    const threshold = Math.pow(10, parameters.threshold[0] / 20);
    const ratio = parameters.ratio[0];
    const attackCoeff = Math.exp(-1 / (sampleRate * parameters.attack[0]));
    const releaseCoeff = Math.exp(-1 / (sampleRate * parameters.release[0]));

    for (let i = 0; i < signal.length; i++) {
      // Detect level from sidechain input
      const scLevel = Math.abs(sidechain[i]);

      // Envelope follower
      if (scLevel > this._envelope) {
        this._envelope = attackCoeff * this._envelope + (1 - attackCoeff) * scLevel;
      } else {
        this._envelope = releaseCoeff * this._envelope + (1 - releaseCoeff) * scLevel;
      }

      // Compute gain reduction
      let gainReduction = 1.0;
      if (this._envelope > threshold) {
        const dbOver = 20 * Math.log10(this._envelope / threshold);
        const dbReduction = dbOver * (1 - 1 / ratio);
        gainReduction = Math.pow(10, -dbReduction / 20);
      }

      output[i] = signal[i] * gainReduction;
    }

    // Copy to other channels
    for (let ch = 1; ch < outputs[0].length; ch++) {
      for (let i = 0; i < output.length; i++) {
        outputs[0][ch][i] = inputs[0][ch] ? inputs[0][ch][i] * (output[i] / (signal[i] || 1)) : 0;
      }
    }

    return true;
  }
}
registerProcessor('sidechain-compressor', SidechainCompressor);
```

Usage:

```js
// Main thread — kick sidechains the bass
const compNode = new AudioWorkletNode(ctx, 'sidechain-compressor', {
  numberOfInputs: 2,
  numberOfOutputs: 1
});

bass.connect(compNode, 0, 0);  // signal input
kick.connect(compNode, 0, 1);  // sidechain input
compNode.connect(ctx.destination);
```

---

## 10. Bit Crushing and Sample Rate Reduction

```js
// bitcrusher-processor.js
class BitCrusherProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'bitDepth', defaultValue: 16, minValue: 1, maxValue: 16, automationRate: 'a-rate' },
      { name: 'frequencyReduction', defaultValue: 1, minValue: 1, maxValue: 40, automationRate: 'a-rate' }
    ];
  }

  constructor() {
    super();
    this._lastSample = 0;
    this._sampleCount = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    for (let ch = 0; ch < output.length; ch++) {
      const inputChannel = input[ch] || new Float32Array(128);
      const outputChannel = output[ch];
      const bitDepthArr = parameters.bitDepth;
      const freqRedArr = parameters.frequencyReduction;

      for (let i = 0; i < outputChannel.length; i++) {
        const bitDepth = bitDepthArr.length > 1 ? bitDepthArr[i] : bitDepthArr[0];
        const freqRed = freqRedArr.length > 1 ? freqRedArr[i] : freqRedArr[0];

        // Sample rate reduction: hold the last sample for N samples
        this._sampleCount++;
        if (this._sampleCount >= freqRed) {
          this._sampleCount = 0;
          this._lastSample = inputChannel[i];
        }

        // Bit depth reduction: quantize to fewer levels
        const step = Math.pow(2, bitDepth);
        const crushed = Math.round(this._lastSample * step) / step;

        outputChannel[i] = crushed;
      }
    }

    return true;
  }
}
registerProcessor('bitcrusher', BitCrusherProcessor);
```

### The Math Behind Resolution Reduction

**Bit depth reduction** quantizes the amplitude:
- 16-bit: 65,536 possible values (CD quality)
- 8-bit: 256 possible values (retro game consoles)
- 4-bit: 16 possible values (very crunchy)
- 1-bit: 2 possible values (pure square wave)

Formula: `output = round(input * 2^bits) / 2^bits`

**Sample rate reduction** holds each sample for N frames:
- Reduction factor 1: no change
- Reduction factor 2: effective sample rate halved (22050 Hz at 44100)
- Reduction factor 10: very "digital" and lo-fi (4410 Hz effective)

---

## 11. Stereo Processing

### Mid/Side Encoding

**Mid** = (L + R) / 2 — the "center" of the stereo field
**Side** = (L - R) / 2 — the "edges" of the stereo field

```js
// mid-side-processor.js
class MidSideProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'midGain', defaultValue: 1.0, minValue: 0, maxValue: 2 },
      { name: 'sideGain', defaultValue: 1.0, minValue: 0, maxValue: 2 }
    ];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (input.length < 2 || output.length < 2) return true;

    const left = input[0];
    const right = input[1];
    const outL = output[0];
    const outR = output[1];
    const midGain = parameters.midGain[0];
    const sideGain = parameters.sideGain[0];

    for (let i = 0; i < left.length; i++) {
      // Encode to M/S
      const mid = (left[i] + right[i]) * 0.5;
      const side = (left[i] - right[i]) * 0.5;

      // Process (apply gains)
      const processedMid = mid * midGain;
      const processedSide = side * sideGain;

      // Decode back to L/R
      outL[i] = processedMid + processedSide;
      outR[i] = processedMid - processedSide;
    }

    return true;
  }
}
registerProcessor('mid-side', MidSideProcessor);
```

**Stereo width control:** `sideGain = 0` collapses to mono. `sideGain = 2` doubles the width.

### Haas Effect

A short delay (10-35ms) on one channel creates a perceived spatial widening without a distinct echo:

```js
function createHaasEffect(ctx, { delayMs = 20, side = 'right' } = {}) {
  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);
  const delay = ctx.createDelay(0.1);

  delay.delayTime.value = delayMs / 1000;

  const delayChannel = side === 'right' ? 1 : 0;
  const directChannel = side === 'right' ? 0 : 1;

  splitter.connect(merger, directChannel, directChannel); // direct
  splitter.connect(delay, delayChannel);                   // to delay
  delay.connect(merger, 0, delayChannel);                  // delayed

  return { input: splitter, output: merger };
}
```

---

# PART 3: THE LOOKAHEAD SCHEDULING PATTERN

---

## 1. The Two Clocks Problem

There are two timing systems in the browser, and they do not agree:

| Clock | Precision | Thread | Background Tab Behavior |
|-------|-----------|--------|------------------------|
| `setTimeout` / `setInterval` | ~4ms minimum, often 10-15ms jitter | Main thread | Throttled to 1/sec (or 1/min after 5 min) |
| `AudioContext.currentTime` | Sample-accurate (~0.02ms at 48kHz) | Audio thread | Not throttled |

**The problem:** If you use `setTimeout` to schedule individual note playback at exactly the right moment, jitter of 10-15ms is audible as sloppy timing. But `AudioContext.currentTime` only tells you the current time — it cannot call your code at a specific time.

**The solution:** Use `setTimeout` as an imprecise "wake-up alarm" that fires frequently enough, and within each callback, schedule notes onto the Web Audio clock with precise `startTime` values. This is the **lookahead scheduler**.

## 2. Full Implementation

```js
class DrumScheduler {
  constructor(audioContext, { tempo = 120, stepsPerBeat = 4, totalSteps = 16 } = {}) {
    this.ctx = audioContext;
    this.tempo = tempo;
    this.stepsPerBeat = stepsPerBeat;
    this.totalSteps = totalSteps;
    this.swing = 0;           // 0 = straight, 0.5 = heavy shuffle

    this.currentStep = 0;
    this.nextStepTime = 0;    // AudioContext time of the next step

    this.isPlaying = false;
    this._timerId = null;

    // --- Tuning parameters ---
    this.scheduleAheadTime = 0.1;   // seconds: how far ahead to schedule
    this.lookAheadInterval = 25;     // ms: how often to check

    // Callback: called for each step with (stepNumber, time)
    this.onStep = null;
  }

  get secondsPerStep() {
    return 60 / this.tempo / this.stepsPerBeat;
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05; // slight offset
    this._schedule();
  }

  stop() {
    this.isPlaying = false;
    if (this._timerId !== null) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }
  }

  _schedule() {
    // Schedule all steps that fall within the lookahead window
    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this._scheduleStep(this.currentStep, this.nextStepTime);
      this._advanceStep();
    }

    // Set the next callback
    this._timerId = setTimeout(() => this._schedule(), this.lookAheadInterval);
  }

  _scheduleStep(step, time) {
    if (this.onStep) {
      this.onStep(step, time);
    }
  }

  _advanceStep() {
    const stepDuration = this.secondsPerStep;

    // Apply swing: offset even-numbered sixteenth notes
    let swingOffset = 0;
    if (this.currentStep % 2 === 1) {
      // Odd steps (the "e" and "a" in "1-e-and-a") are pushed forward
      swingOffset = stepDuration * this.swing;
    }

    this.nextStepTime += stepDuration + swingOffset;

    // If the previous step was swung, the NEXT step comes sooner
    // to maintain the overall beat duration
    if (this.currentStep % 2 === 0 && this.swing > 0) {
      // Even steps compensate: they come slightly earlier
      // (already handled because we only add swing to odd steps)
    }

    this.currentStep = (this.currentStep + 1) % this.totalSteps;
  }

  setTempo(newTempo) {
    this.tempo = newTempo;
    // No need to restart — the next _advanceStep() will use the new tempo
  }
}
```

### Usage:

```js
const ctx = new AudioContext();
const scheduler = new DrumScheduler(ctx, { tempo: 120, totalSteps: 16 });

// Load samples
const kickBuffer = await loadSample(ctx, '/samples/kick.wav');
const snareBuffer = await loadSample(ctx, '/samples/snare.wav');

// Define pattern
const pattern = {
  kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
  snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
};

scheduler.onStep = (step, time) => {
  if (pattern.kick[step]) playSample(ctx, kickBuffer, time);
  if (pattern.snare[step]) playSample(ctx, snareBuffer, time);
};

function playSample(ctx, buffer, time) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(time);
}

// Start on user gesture
document.getElementById('play').addEventListener('click', () => {
  ctx.resume().then(() => scheduler.start());
});
```

## 3. Choosing scheduleAheadTime and lookAheadInterval

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `scheduleAheadTime` | 0.1s (100ms) | Must be longer than the worst-case setTimeout jitter (~15ms). 100ms gives a comfortable buffer. |
| `lookAheadInterval` | 25ms | Must be shorter than `scheduleAheadTime` to guarantee overlap. 25ms means we check 4 times per lookahead window. |

**Trade-offs:**
- Longer `scheduleAheadTime` = more resilient to jitter, but changes (stop, tempo, pattern) feel delayed
- Shorter `scheduleAheadTime` = more responsive, but risk of "late" scheduling if setTimeout is delayed
- `lookAheadInterval` should be roughly 1/3 to 1/4 of `scheduleAheadTime`

## 4. Handling Tempo Changes Mid-Pattern

The scheduler above handles this naturally: `secondsPerStep` is computed each time `_advanceStep()` runs, so changing `this.tempo` takes effect at the next step. For smooth tempo ramps:

```js
// Gradual tempo change over N steps
function rampTempo(scheduler, targetTempo, steps) {
  const startTempo = scheduler.tempo;
  const increment = (targetTempo - startTempo) / steps;
  let count = 0;

  const originalOnStep = scheduler.onStep;
  scheduler.onStep = (step, time) => {
    if (count < steps) {
      scheduler.tempo = startTempo + increment * count;
      count++;
    }
    originalOnStep(step, time);
  };
}
```

## 5. Swing Implementation (Detailed)

Swing delays every other subdivision. For 16th-note swing:

```
Straight: |1...2...3...4...|  (evenly spaced)
Swing 50%:|1....2..3....4..|  (every other 16th pushed late)
Swing 67%:|1.....2.3.....2.|  (triplet feel)
```

The math:

```js
// In _advanceStep():
const baseStepDuration = 60 / this.tempo / this.stepsPerBeat;

if (this.currentStep % 2 === 1) {
  // Odd steps get delayed (pushed later)
  this.nextStepTime += baseStepDuration * (1 + this.swing);
} else {
  // Even steps come sooner to compensate
  this.nextStepTime += baseStepDuration * (1 - this.swing);
}
// Total of two steps still equals 2 * baseStepDuration
```

At `swing = 0`: both steps are equal (`1.0 * duration` each)
At `swing = 0.33`: triplet feel (`0.67 * duration` + `1.33 * duration`)
At `swing = 0.5`: heavy shuffle (`0.5 * duration` + `1.5 * duration`)

## 6. Web Worker Scheduler (Background Tab Resilience)

When a tab goes to the background, `setTimeout` on the main thread is throttled to once per second (or once per minute after 5 min). This destroys audio scheduling.

**Solution:** Move the timer into a Web Worker, where `setTimeout`/`setInterval` are NOT throttled.

```js
// scheduler-worker.js
let timerId = null;
let interval = 25;

self.onmessage = (e) => {
  if (e.data.command === 'start') {
    interval = e.data.interval || 25;
    timerId = setInterval(() => {
      self.postMessage('tick');
    }, interval);
  } else if (e.data.command === 'stop') {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  } else if (e.data.command === 'interval') {
    interval = e.data.interval;
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = setInterval(() => {
        self.postMessage('tick');
      }, interval);
    }
  }
};
```

```js
// main.js — replace setTimeout with Worker messages
class WorkerScheduler extends DrumScheduler {
  constructor(ctx, options) {
    super(ctx, options);
    this._worker = new Worker('scheduler-worker.js');
    this._worker.onmessage = () => {
      if (this.isPlaying) this._schedule();
    };
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this._worker.postMessage({ command: 'start', interval: this.lookAheadInterval });
  }

  stop() {
    this.isPlaying = false;
    this._worker.postMessage({ command: 'stop' });
  }

  _schedule() {
    // Same lookahead logic, but now driven by Worker ticks
    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this._scheduleStep(this.currentStep, this.nextStepTime);
      this._advanceStep();
    }
    // No setTimeout here — the Worker handles timing
  }
}
```

**Inline Worker alternative** (no separate file):

```js
function createWorkerFromFunction(fn) {
  const blob = new Blob([`(${fn.toString()})()`], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

const timerWorker = createWorkerFromFunction(() => {
  let timerId = null;
  self.onmessage = (e) => {
    if (e.data.command === 'start') {
      timerId = setInterval(() => self.postMessage('tick'), e.data.interval || 25);
    } else if (e.data.command === 'stop') {
      clearInterval(timerId);
      timerId = null;
    }
  };
});
```

---

# PART 4: AUDIO VISUALIZATION

---

## 1. AnalyserNode Configuration

```js
const analyser = ctx.createAnalyser();

// FFT size: must be power of 2 between 32 and 32768
analyser.fftSize = 2048;  // default
// frequencyBinCount = fftSize / 2 = 1024

// Smoothing: 0 = no smoothing (raw), 1 = maximum smoothing (very slow response)
analyser.smoothingTimeConstant = 0.8; // default

// dB range for frequency data
analyser.minDecibels = -100; // default
analyser.maxDecibels = -30;  // default
```

**fftSize trade-offs:**

| fftSize | frequencyBinCount | Frequency Resolution (at 44100Hz) | Time Resolution |
|---------|------------------|-----------------------------------|-----------------|
| 256 | 128 | 172 Hz per bin | 5.8ms |
| 512 | 256 | 86 Hz per bin | 11.6ms |
| 1024 | 512 | 43 Hz per bin | 23.2ms |
| 2048 | 1024 | 21.5 Hz per bin | 46.4ms |
| 8192 | 4096 | 5.4 Hz per bin | 185.7ms |

Higher fftSize = better frequency detail but slower time response. For a drum machine:
- **Spectrum analyzer**: fftSize = 2048 or 4096 (good frequency detail)
- **Waveform display**: fftSize = 2048 (enough samples for a smooth wave)
- **Level meter**: fftSize = 256 (fast response)

### Data Retrieval Methods

```js
// Frequency domain — Uint8Array (0-255)
const freqData = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(freqData);
// Each value: 0 = minDecibels, 255 = maxDecibels

// Frequency domain — Float32Array (actual dB values)
const freqFloat = new Float32Array(analyser.frequencyBinCount);
analyser.getFloatFrequencyData(freqFloat);
// Each value: actual dB (e.g., -45.2)

// Time domain — Uint8Array (0-255)
const timeData = new Uint8Array(analyser.fftSize);
analyser.getByteTimeDomainData(timeData);
// 128 = zero crossing, 0 = -1.0, 255 = +1.0

// Time domain — Float32Array (-1.0 to 1.0)
const timeFloat = new Float32Array(analyser.fftSize);
analyser.getFloatTimeDomainData(timeFloat);
```

### Connection Pattern

The AnalyserNode is a pass-through — it does not modify the signal:

```js
source.connect(analyser);
analyser.connect(ctx.destination); // still hear audio
// OR: just connect to analyser without connecting to destination (silent analysis)
```

---

## 2. Drawing Waveforms (Oscilloscope)

```js
function drawWaveform(canvasCtx, analyser, width, height) {
  const bufferLength = analyser.fftSize;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);

    // Background
    canvasCtx.fillStyle = '#1a1a2e';
    canvasCtx.fillRect(0, 0, width, height);

    // Waveform line
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = '#00ff88';
    canvasCtx.beginPath();

    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;  // normalize: 1.0 = center
      const y = (v * height) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    canvasCtx.lineTo(width, height / 2);
    canvasCtx.stroke();
  }

  draw();
}
```

---

## 3. Drawing Spectrum Analyzers

```js
function drawSpectrum(canvasCtx, analyser, width, height) {
  analyser.fftSize = 256; // fewer bins = wider, more visible bars
  const bufferLength = analyser.frequencyBinCount; // 128 bins
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = '#1a1a2e';
    canvasCtx.fillRect(0, 0, width, height);

    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height;

      // Color gradient: green -> yellow -> red
      const ratio = dataArray[i] / 255;
      const r = Math.floor(ratio > 0.5 ? 255 : ratio * 2 * 255);
      const g = Math.floor(ratio < 0.5 ? 255 : (1 - ratio) * 2 * 255);
      canvasCtx.fillStyle = `rgb(${r}, ${g}, 50)`;

      canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }

  draw();
}
```

### Logarithmic Frequency Scale

Linear frequency bins don't match human perception. For a perceptually accurate display:

```js
function drawLogSpectrum(canvasCtx, analyser, width, height) {
  analyser.fftSize = 4096;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  const sampleRate = analyser.context.sampleRate;

  // Define logarithmic frequency bands
  const numBands = 64;
  const minFreq = 20;
  const maxFreq = 20000;

  function draw() {
    requestAnimationFrame(draw);
    analyser.getFloatFrequencyData(dataArray);

    canvasCtx.fillStyle = '#1a1a2e';
    canvasCtx.fillRect(0, 0, width, height);

    const bandWidth = width / numBands;

    for (let band = 0; band < numBands; band++) {
      // Logarithmic frequency range for this band
      const freqLow = minFreq * Math.pow(maxFreq / minFreq, band / numBands);
      const freqHigh = minFreq * Math.pow(maxFreq / minFreq, (band + 1) / numBands);

      // Convert frequencies to FFT bin indices
      const binLow = Math.floor(freqLow * analyser.fftSize / sampleRate);
      const binHigh = Math.ceil(freqHigh * analyser.fftSize / sampleRate);

      // Average the bins in this range
      let sum = 0;
      let count = 0;
      for (let i = binLow; i <= binHigh && i < bufferLength; i++) {
        sum += dataArray[i];
        count++;
      }
      const avgDb = count > 0 ? sum / count : -100;

      // Normalize dB to 0-1 range
      const normalized = Math.max(0, (avgDb - analyser.minDecibels)
                        / (analyser.maxDecibels - analyser.minDecibels));

      const barHeight = normalized * height;
      const x = band * bandWidth;

      const hue = 120 - normalized * 120; // green to red
      canvasCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      canvasCtx.fillRect(x, height - barHeight, bandWidth - 1, barHeight);
    }
  }

  draw();
}
```

---

## 4. VU Meters / Peak Meters

### RMS Level Meter

```js
class LevelMeter {
  constructor(analyser) {
    this.analyser = analyser;
    this.analyser.fftSize = 256; // fast response
    this._dataArray = new Float32Array(this.analyser.fftSize);
    this._peak = 0;
    this._peakHoldTime = 0;
    this._peakDecayRate = 0.95;
  }

  // Call this in requestAnimationFrame
  getLevel() {
    this.analyser.getFloatTimeDomainData(this._dataArray);

    // RMS (Root Mean Square) — true loudness measurement
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < this._dataArray.length; i++) {
      const sample = this._dataArray[i];
      sum += sample * sample;
      const abs = Math.abs(sample);
      if (abs > peak) peak = abs;
    }
    const rms = Math.sqrt(sum / this._dataArray.length);

    // Peak hold with decay
    if (peak >= this._peak) {
      this._peak = peak;
      this._peakHoldTime = 30; // hold for 30 frames
    } else {
      if (this._peakHoldTime > 0) {
        this._peakHoldTime--;
      } else {
        this._peak *= this._peakDecayRate;
      }
    }

    return {
      rms: rms,
      rmsDb: 20 * Math.log10(Math.max(rms, 0.00001)),
      peak: peak,
      peakDb: 20 * Math.log10(Math.max(peak, 0.00001)),
      heldPeak: this._peak,
      heldPeakDb: 20 * Math.log10(Math.max(this._peak, 0.00001)),
      clipping: peak >= 1.0
    };
  }
}
```

### Drawing the Meter

```js
function drawMeter(canvasCtx, meter, x, y, w, h) {
  const level = meter.getLevel();

  // Background
  canvasCtx.fillStyle = '#222';
  canvasCtx.fillRect(x, y, w, h);

  // RMS bar (main level)
  const rmsHeight = Math.max(0, (level.rmsDb + 60) / 60) * h; // -60dB to 0dB range
  const gradient = canvasCtx.createLinearGradient(x, y + h, x, y);
  gradient.addColorStop(0, '#00cc44');    // green (quiet)
  gradient.addColorStop(0.6, '#00cc44');  // green
  gradient.addColorStop(0.8, '#ffcc00');  // yellow (loud)
  gradient.addColorStop(1.0, '#ff3300');  // red (near clip)
  canvasCtx.fillStyle = gradient;
  canvasCtx.fillRect(x, y + h - rmsHeight, w, rmsHeight);

  // Peak indicator line
  const peakY = y + h - Math.max(0, (level.heldPeakDb + 60) / 60) * h;
  canvasCtx.fillStyle = level.clipping ? '#ff0000' : '#ffffff';
  canvasCtx.fillRect(x, peakY, w, 2);

  // Clipping indicator
  if (level.clipping) {
    canvasCtx.fillStyle = '#ff0000';
    canvasCtx.fillRect(x, y, w, 5);
  }

  // dB scale markings
  canvasCtx.fillStyle = '#888';
  canvasCtx.font = '9px monospace';
  canvasCtx.textAlign = 'left';
  const dbMarks = [0, -6, -12, -24, -48];
  for (const db of dbMarks) {
    const markY = y + h - ((db + 60) / 60) * h;
    canvasCtx.fillText(`${db}`, x + w + 3, markY + 3);
    canvasCtx.fillRect(x, markY, w, 1);
  }
}
```

### Stereo Meter

```js
function createStereoMeter(ctx, sourceNode) {
  const splitter = ctx.createChannelSplitter(2);
  const analyserL = ctx.createAnalyser();
  const analyserR = ctx.createAnalyser();
  analyserL.fftSize = analyserR.fftSize = 256;

  sourceNode.connect(splitter);
  splitter.connect(analyserL, 0);
  splitter.connect(analyserR, 1);

  const meterL = new LevelMeter(analyserL);
  const meterR = new LevelMeter(analyserR);

  return { meterL, meterR };
}
```

---

## 5. requestAnimationFrame Loop Patterns

### Basic Pattern

```js
let animationId;

function startVisualization() {
  function loop() {
    animationId = requestAnimationFrame(loop);

    // Clear canvas
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all visualizations
    drawWaveform(canvasCtx, waveformAnalyser, canvas.width, 100);
    drawSpectrum(canvasCtx, spectrumAnalyser, canvas.width, 200);
    drawMeter(canvasCtx, meterL, 10, 310, 20, 150);
    drawMeter(canvasCtx, meterR, 35, 310, 20, 150);
  }
  loop();
}

function stopVisualization() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}
```

### Performance-Optimized Pattern

```js
class VisualizationManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._running = false;
    this._drawFns = [];

    // Handle canvas resizing
    this._resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      this.ctx.scale(devicePixelRatio, devicePixelRatio);
    });
    this._resizeObserver.observe(canvas);
  }

  addDrawFunction(fn) {
    this._drawFns.push(fn);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._loop();
  }

  stop() {
    this._running = false;
  }

  _loop() {
    if (!this._running) return;
    requestAnimationFrame(() => this._loop());

    // Only redraw if the tab is visible
    if (document.hidden) return;

    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.ctx.clearRect(0, 0, w, h);

    for (const fn of this._drawFns) {
      fn(this.ctx, w, h);
    }
  }
}
```

### Separating Audio Processing from Visual Rendering

**Critical rule:** Never trigger visual updates from the audio thread or audio callbacks. Always use `requestAnimationFrame` for drawing.

```js
// WRONG — causes layout thrashing on audio thread
scriptProcessor.onaudioprocess = (e) => {
  document.getElementById('meter').style.height = level + 'px'; // BAD
};

// RIGHT — use shared state, read in animation frame
// Audio thread writes level to SharedArrayBuffer (or simple variable)
// Animation frame reads and draws
```

---

# QUICK REFERENCE: COMPLETE DRUM MACHINE ARCHITECTURE

```
                        ┌─────────────────────────────────────────┐
                        │           Web Worker                     │
                        │  setInterval(25ms) -> postMessage('tick')│
                        └──────────────┬──────────────────────────┘
                                       │ tick
                        ┌──────────────▼──────────────────────────┐
                        │         Scheduler (Main Thread)          │
                        │  Lookahead window: 100ms                 │
                        │  Schedule notes on AudioContext clock     │
                        └──────────────┬──────────────────────────┘
                                       │ source.start(preciseTime)
    ┌──────────────────────────────────▼──────────────────────────────┐
    │                    Audio Graph (Audio Thread)                     │
    │                                                                  │
    │  [Kick BufferSource]──┐                                          │
    │  [Snare BufferSource]─┤──>[Channel Gains]──>[EQ]──>[Pan]──┐     │
    │  [HiHat BufferSource]─┤                                    │     │
    │  [Clap BufferSource]──┘                                    │     │
    │                                                            v     │
    │                                              ┌──>[Master Gain]   │
    │                                              │        │          │
    │  [Send Gains]──>[Reverb (Convolver)]────────┘        │          │
    │  [Send Gains]──>[Delay (Feedback)]──────────┘        v          │
    │                                              [Compressor/Limiter]│
    │                                                      │          │
    │                                              [AnalyserNode]──>viz│
    │                                                      │          │
    │                                              [ctx.destination]   │
    └──────────────────────────────────────────────────────────────────┘
```

---

Sources:
- [MDN: BaseAudioContext state property](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state)
- [MDN: AudioContext resume()](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume)
- [Chrome Autoplay Policy](https://developer.chrome.com/blog/autoplay)
- [MDN: AudioParam](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam)
- [MDN: AudioParam setValueAtTime()](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setValueAtTime)
- [MDN: AudioParam linearRampToValueAtTime()](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/linearRampToValueAtTime)
- [MDN: Background Audio Processing Using AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet)
- [MDN: AudioWorkletProcessor process()](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process)
- [Chrome: Audio Worklet Design Pattern](https://developer.chrome.com/blog/audio-worklet-design-pattern)
- [Chrome: Audio Worklet default](https://developer.chrome.com/blog/audio-worklet)
- [AudioWorklet Performance Pitfall](https://cprimozic.net/blog/webaudio-audioworklet-optimization/)
- [Paul Adenot: ringbuf.js (SharedArrayBuffer ring buffer)](https://github.com/padenot/ringbuf.js/)
- [Paul Adenot: Wait-Free SPSC Ring Buffer](https://blog.paul.cx/post/a-wait-free-spsc-ringbuffer-for-the-web/)
- [Mozilla Hacks: High Performance Web Audio with AudioWorklet](https://hacks.mozilla.org/2020/05/high-performance-web-audio-with-audioworklet-in-firefox/)
- [A Tale of Two Clocks (Chris Wilson)](https://web.dev/articles/audio-scheduling)
- [MDN: Advanced Techniques — Creating and Sequencing Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques)
- [Loophole Letters: Web Audio Scheduling](https://loophole-letters.vercel.app/web-audio-scheduling)
- [Understanding The Web Audio Clock](https://sonoport.github.io/web-audio-clock.html)
- [HackWild: Web Worker Timers](https://hackwild.com/article/web-worker-timers/)
- [MDN: OfflineAudioContext](https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext)
- [MDN: OfflineAudioContext startRendering()](https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext/startRendering)
- [MDN: AudioNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioNode)
- [MDN: Basic Concepts Behind Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Basic_concepts_behind_Web_Audio_API)
- [MDN: ChannelSplitterNode](https://developer.mozilla.org/en-US/docs/Web/API/ChannelSplitterNode)
- [MDN: ChannelMergerNode](https://developer.mozilla.org/en-US/docs/Web/API/ChannelMergerNode)
- [MDN: AudioNode channelCountMode](https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/channelCountMode)
- [MDN: BiquadFilterNode](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode)
- [MDN: Using IIR Filters](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_IIR_filters)
- [EarLevel Engineering: Biquad Calculator](https://www.earlevel.com/main/2021/09/02/biquad-calculator-v3/)
- [Wikipedia: Digital Biquad Filter](https://en.wikipedia.org/wiki/Digital_biquad_filter)
- [ADSR Envelope Scheduling Issue](https://github.com/WebAudio/web-audio-api/issues/510)
- [MDN: setTargetAtTime()](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime)
- [Building Synthesizer with Web Audio API: Envelopes](https://dobrian.github.io/cmp/topics/building-a-synthesizer-with-web-audio-api/4.envelopes.html)
- [fastidious-envelope-generator](https://github.com/rsimmons/fastidious-envelope-generator)
- [MDN: OscillatorNode](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode)
- [MDN: createPeriodicWave()](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createPeriodicWave)
- [SitePoint: Using Fourier Transforms with the Web Audio API](https://www.sitepoint.com/using-fourier-transforms-web-audio-api/)
- [Noisehack: Generate Noise with Web Audio API](https://noisehack.com/generate-noise-web-audio-api/)
- [Generating Pink Noise for Audio Worklets](https://whoisryosuke.com/blog/2025/generating-pink-noise-for-audio-worklets)
- [MDN: WaveShaperNode](https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode)
- [musicdsp.org: Variable-Hardness Clipping Function](https://www.musicdsp.org/en/latest/Effects/104-variable-hardness-clipping-function.html)
- [MDN: ConvolverNode](https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode)
- [reverbGen: Synthetic Impulse Response Generation](https://github.com/adelespinasse/reverbGen)
- [Tom Hazledine: Building a Delay Effect](https://tomhazledine.com/web-audio-delay/)
- [Chris Lowis: Creating Dub Delay Effects](https://chrislowis.co.uk/2014/07/23/dub-delay-web-audio-api.html)
- [MDN: DynamicsCompressorNode](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode)
- [Sidechain Compressor AudioWorklet](https://github.com/jadujoel/sidechain-compressor-audio-worklet)
- [Chrome Web Audio Samples: BitCrusher](https://googlechromelabs.github.io/web-audio-samples/audio-worklet/basic/bit-crusher/)
- [Alex Ramsdell: Bitcrushing Audio with JavaScript](https://alexramsdell.com/writing/bitcrushing-in-javascript/)
- [MDN: Visualizations with Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API)
- [MDN: AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode)
- [MDN: AnalyserNode fftSize](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize)
- [web-audio-peak-meter](https://esonderegger.github.io/web-audio-peak-meter/)
- [Chris Wilson: Volume Meter](https://github.com/cwilso/volume-meter)
- [Metering with the Web Audio API](https://www.rpy.xyz/posts/20190119/web-audio-meters.html)
- [audiobuffer-to-wav](https://www.npmjs.com/package/audiobuffer-to-wav)
- [Nyquist-Shannon Sampling Theorem (Wikipedia)](https://en.wikipedia.org/wiki/Nyquist%E2%80%93Shannon_sampling_theorem)
- [MDN: DelayNode](https://developer.mozilla.org/en-US/docs/Web/API/DelayNode)
