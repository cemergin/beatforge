# Web Audio Technical Reference for Professional Drum Machine Development

> Comprehensive developer reference covering WAM 2.0, Tone.js internals, and the broader web audio ecosystem.

---

## Table of Contents

1. [WAM 2.0 (Web Audio Modules)](#wam-20-web-audio-modules)
2. [Tone.js Deep Dive](#tonejs-deep-dive)
3. [Other Relevant Libraries](#other-relevant-libraries)

---

# WAM 2.0 (Web Audio Modules)

## 1. What WAM Is

WAM (Web Audio Modules) 2.0 is the **VST/AU equivalent for the web browser**. It is an open standard that defines a plugin API for audio processors and instruments running inside the Web Audio API. Just as VST plugins work inside DAWs like Ableton or Logic, WAM plugins work inside web-based audio hosts (browser DAWs, drum machines, effects racks).

**Key properties:**
- Standardized plugin format: any WAM host can load any WAM plugin
- Supports both audio effects and virtual instruments
- Built on top of `AudioWorklet` for real-time audio processing on a dedicated thread
- Supports MIDI input/output, parameter automation, transport sync, OSC, and MPE
- Plugin UIs are plain HTML/CSS/JS -- can use React, Svelte, vanilla DOM, or anything
- Plugins are loaded via URL (ES module `import()`), enabling remote plugin hosting
- JSON-serializable state for preset save/load

**WAM vs Native Plugins:**

| Aspect | VST/AU | WAM 2.0 |
|--------|--------|---------|
| Runtime | Native (C/C++) | JavaScript / WebAssembly |
| Thread model | Dedicated audio thread | AudioWorklet (separate thread) |
| Latency | ~1-5ms typical | ~5-20ms (128-sample buffer common) |
| Distribution | Binary files | URL-based ES modules |
| GUI | Custom frameworks (JUCE, etc.) | HTML/CSS/JS |
| MIDI | Full MIDI spec | MIDI, MPE, OSC, SysEx |
| CPU overhead | Minimal | 2-5x overhead vs native (JS), ~1.2-1.5x (Wasm) |
| Plugin discovery | Scan filesystem | URL registry / manifest |
| Sandboxing | None (trusted code) | Browser sandbox, group-based security |

## 2. Architecture

WAM 2.0 has a **dual-thread architecture** mirroring the Web Audio API's separation of main thread and audio thread:

```
┌─────────────────────────────────────────────────────────┐
│                      MAIN THREAD                         │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │  WAM Host    │    │  WamNode     │ (extends          │
│  │  (your app)  │───▶│              │  AudioNode)       │
│  └──────────────┘    └──────┬───────┘                   │
│                             │ MessagePort               │
├─────────────────────────────┼───────────────────────────┤
│                      AUDIO THREAD                        │
│                             │                            │
│  ┌──────────────┐    ┌──────▼───────┐                   │
│  │  WamEnv      │    │ WamProcessor │ (extends          │
│  │  (singleton) │───▶│              │  AudioWorklet-    │
│  └──────────────┘    └──────────────┘   Processor)      │
│                                                          │
│  ┌──────────────┐                                        │
│  │  WamGroup    │ (security boundary, event routing)    │
│  └──────────────┘                                        │
└─────────────────────────────────────────────────────────┘
```

### WamNode (Main Thread)

`WamNode` extends the native `AudioNode`. It is the main-thread interface your host interacts with. It forwards calls to `WamProcessor` over the internal `MessagePort`.

**Properties:**
- `module` -- reference to the parent `WebAudioModule` instance
- `groupId` -- identifies the WAM group (host session)
- `moduleId` -- identifies the plugin type
- `instanceId` -- unique per instance

**Methods:**

```typescript
// Parameter discovery and control
getParameterInfo(...parameterIds: string[]): Promise<WamParameterInfoMap>
getParameterValues(normalized?: boolean, ...parameterIds: string[]): Promise<WamParameterDataMap>
setParameterValues(parameterValues: WamParameterDataMap): Promise<void>

// State persistence (presets, undo/redo)
getState(): Promise<WamState>
setState(state: WamState): Promise<void>

// Latency reporting
getCompensationDelay(): Promise<number>  // in samples

// Event scheduling
scheduleEvents(...events: WamEvent[]): void
clearEvents(): void

// WAM-to-WAM event routing
connectEvents(toId: string): void
disconnectEvents(toId?: string): void

// Cleanup
destroy(): Promise<void>
```

### WamProcessor (Audio Thread)

`WamProcessor` extends `AudioWorkletProcessor`. It runs on the audio rendering thread with realtime priority. It mirrors the WamNode API but executes synchronously in the audio callback.

**Key responsibilities:**
- Process audio buffers in `process(inputs, outputs, parameters)`
- Handle scheduled events at sample-accurate timing
- Emit events to downstream connected WAMs
- Register/unregister with the WamEnv

```javascript
class MyProcessor extends WamProcessor {
  constructor(options) {
    super(options);
    // Register with environment
    const { moduleId, instanceId } = options.processorOptions;
    const { currentTime } = globalThis;
    // Access WamEnv
    globalThis.webAudioModules.addWam(this);
  }

  // Called every audio quantum (~128 samples at 44.1kHz = ~2.9ms)
  process(inputs, outputs, parameters) {
    // Your DSP here
    return true; // keep alive
  }

  // Emit events to downstream WAMs
  _processEvent(event) {
    // Handle MIDI, automation, transport events
    this.emitEvents(event);
  }

  destroy() {
    globalThis.webAudioModules.removeWam(this);
    super.destroy();
  }
}
```

### WamEnv (Audio Thread Environment)

`WamEnv` is a **global singleton** on the audio thread (`globalThis.webAudioModules`). It manages all WAM groups and provides module-scope dependency injection.

**Methods:**

```typescript
interface WamEnv {
  apiVersion: string;

  // Group management
  addGroup(group: WamGroup): void;
  removeGroup(groupId: string): void;
  getGroup(groupId: string, groupKey: string): WamGroup;

  // Module dependency injection (replaces ES imports on audio thread)
  getModuleScope(moduleId: string): object;

  // Proxy methods (delegated to WamGroup)
  addWam(processor: WamProcessor): void;
  removeWam(instanceId: string): void;
  connectEvents(groupId: string, fromId: string, toId: string): void;
  disconnectEvents(groupId: string, fromId: string, toId?: string): void;
  emitEvents(processor: WamProcessor, ...events: WamEvent[]): void;
}
```

### WamGroup (Security & Routing Boundary)

Each host creates a `WamGroup` with a public `groupId` and a secret `groupKey`. Only the host knows the key. This prevents malicious plugins from accessing other groups' processors.

```typescript
interface WamGroup {
  groupId: string;
  validate(groupKey: string): boolean;

  addWam(processor: WamProcessor): void;
  removeWam(instanceId: string): void;

  // Event routing graph
  connectEvents(fromId: string, toId: string): void;
  disconnectEvents(fromId: string, toId?: string): void;
  emitEvents(fromId: string, ...events: WamEvent[]): void;
}
```

## 3. Plugin API

### Parameter System

WAM parameters are described by `WamParameterInfo` and controlled via `WamParameterData`:

```typescript
interface WamParameterInfo {
  id: string;                  // unique identifier, e.g. "gain", "cutoff"
  label: string;               // human-readable name
  type: 'float' | 'int' | 'boolean' | 'choice';
  defaultValue: number;
  minValue: number;
  maxValue: number;
  discreteStep: number;        // step size for int/choice types
  exponent: number;            // for non-linear scaling (1 = linear)
  choices: string[];           // for 'choice' type
  units: string;               // "dB", "Hz", "%", etc.
}

interface WamParameterData {
  id: string;
  value: number;
  normalized: boolean;         // true = 0..1 range
}

type WamParameterInfoMap = Record<string, WamParameterInfo>;
type WamParameterDataMap = Record<string, WamParameterData>;
```

**Usage from host:**

```javascript
// Discover all parameters
const info = await wamNode.getParameterInfo();
// info = { "gain": { id: "gain", label: "Gain", type: "float", min: 0, max: 1, ... }, ... }

// Read current values
const values = await wamNode.getParameterValues(true); // normalized
// values = { "gain": { id: "gain", value: 0.75, normalized: true } }

// Set a parameter
await wamNode.setParameterValues({
  gain: { id: "gain", value: 0.5, normalized: true }
});

// Save/restore entire plugin state (includes parameters + internal state)
const state = await wamNode.getState();
localStorage.setItem('preset_1', JSON.stringify(state));

// Later...
const saved = JSON.parse(localStorage.getItem('preset_1'));
await wamNode.setState(saved);
```

### WamDescriptor

Every WAM plugin must provide metadata:

```typescript
interface WamDescriptor {
  name: string;
  vendor: string;
  version: string;
  apiVersion: string;
  thumbnail: string;          // URL to plugin image
  keywords: string[];         // e.g. ["effect", "delay", "stereo"]
  description: string;
  website: string;

  // I/O capability flags
  hasAudioInput: boolean;
  hasAudioOutput: boolean;
  hasMidiInput: boolean;
  hasMidiOutput: boolean;
  hasSysexInput: boolean;
  hasSysexOutput: boolean;
  hasAutomationInput: boolean;
  hasAutomationOutput: boolean;
  hasMpeInput: boolean;
  hasMpeOutput: boolean;
  hasOscInput: boolean;
  hasOscOutput: boolean;

  isInstrument: boolean;      // true = MIDI instrument (synth, sampler)
}
```

## 4. WAM Events

The event system is the backbone of WAM inter-plugin communication:

```typescript
// Base event type
interface WamEvent {
  type: 'wam-automation' | 'wam-midi' | 'wam-transport'
        | 'wam-sysex' | 'wam-mpe' | 'wam-osc';
  data: WamEventData;
  time?: number;  // AudioContext.currentTime; undefined = ASAP
}

// --- MIDI Events ---
interface WamMidiData {
  bytes: [number, number, number];  // standard 3-byte MIDI message
}
// Examples:
// Note On:  { type: 'wam-midi', data: { bytes: [0x90, 60, 127] } }
// Note Off: { type: 'wam-midi', data: { bytes: [0x80, 60, 0] } }
// CC:       { type: 'wam-midi', data: { bytes: [0xB0, 1, 64] } }

// --- Automation Events ---
interface WamAutomationData {
  id: string;          // parameter ID
  value: number;
  normalized: boolean;
}
// Example:
// { type: 'wam-automation', data: { id: 'cutoff', value: 0.7, normalized: true }, time: 1.5 }

// --- Transport Events ---
interface WamTransportData {
  currentBar: number;
  currentBarStarted: number;  // AudioContext time when current bar started
  tempo: number;              // BPM
  timeSigNumerator: number;
  timeSigDenominator: number;
  playing: boolean;
}
// Example:
// { type: 'wam-transport', data: { tempo: 120, playing: true, timeSigNumerator: 4, timeSigDenominator: 4, currentBar: 1, currentBarStarted: 0.5 } }

// --- SysEx Events ---
interface WamSysexData {
  bytes: Uint8Array;  // variable-length system exclusive data
}

// --- MPE Events ---
interface WamMpeData {
  bytes: [number, number, number];  // MPE MIDI message
}

// --- OSC Events ---
interface WamOscData {
  address: string;     // OSC address pattern, e.g. "/synth/filter/cutoff"
  args: any[];         // typed arguments
}
```

**Scheduling events from the host:**

```javascript
const now = audioContext.currentTime;

// Schedule a note-on 100ms from now
wamNode.scheduleEvents({
  type: 'wam-midi',
  data: { bytes: [0x90, 36, 100] },  // C2, velocity 100
  time: now + 0.1
});

// Schedule automation ramp
for (let i = 0; i < 100; i++) {
  wamNode.scheduleEvents({
    type: 'wam-automation',
    data: { id: 'filterCutoff', value: i / 100, normalized: true },
    time: now + (i * 0.01)
  });
}

// Send transport info to all connected plugins
wamNode.scheduleEvents({
  type: 'wam-transport',
  data: {
    tempo: 120,
    playing: true,
    timeSigNumerator: 4,
    timeSigDenominator: 4,
    currentBar: 1,
    currentBarStarted: now
  }
});
```

**WAM-to-WAM event routing:**

```javascript
// Connect MIDI output of sequencer to synth input
sequencerNode.connectEvents(synthNode.instanceId);

// Connect synth automation output to effect parameter input
synthNode.connectEvents(effectNode.instanceId);

// Later disconnect
sequencerNode.disconnectEvents(synthNode.instanceId);
```

## 5. WAM SDK -- Creating a Plugin from Scratch

### Step 1: Project Structure

```
my-wam-plugin/
  src/
    index.js          # Main entry: WebAudioModule subclass
    processor.js      # AudioWorklet processor
    gui.js            # UI factory
  dist/               # Built output
  package.json
```

### Step 2: Plugin Entry (index.js)

```javascript
import { WebAudioModule } from '@webaudiomodules/sdk';

export default class MyDrumSynth extends WebAudioModule {
  // Metadata
  static descriptor = {
    name: 'MyDrumSynth',
    vendor: 'MyCompany',
    version: '1.0.0',
    apiVersion: '2.0.0',
    thumbnail: '',
    keywords: ['instrument', 'drum', 'synth'],
    description: 'A synthesized drum module',
    website: '',
    hasAudioInput: false,
    hasAudioOutput: true,
    hasMidiInput: true,
    hasMidiOutput: false,
    hasSysexInput: false,
    hasSysexOutput: false,
    hasAutomationInput: true,
    hasAutomationOutput: false,
    hasMpeInput: false,
    hasMpeOutput: false,
    hasOscInput: false,
    hasOscOutput: false,
    isInstrument: true,
  };

  async createAudioNode(initialState) {
    // Initialize the WamEnv and WamGroup on the audio thread
    await this.initializeAudioWorklet(this.moduleId);

    // Register processor
    const processorUrl = new URL('./processor.js', import.meta.url).href;
    await this.audioContext.audioWorklet.addModule(processorUrl);

    // Create the node
    const node = new AudioWorkletNode(this.audioContext, this.moduleId, {
      processorOptions: {
        moduleId: this.moduleId,
        instanceId: this.instanceId,
      },
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });

    // Wrap as WamNode (adds WAM API methods)
    this._wamNode = this.createWamNode(node);

    // Restore state if provided
    if (initialState) await this._wamNode.setState(initialState);

    return this._wamNode;
  }

  async createGui() {
    const guiModule = await import('./gui.js');
    return guiModule.createElement(this);
  }
}
```

### Step 3: Audio Processor (processor.js)

```javascript
import { WamProcessor } from '@webaudiomodules/sdk';

class MyDrumProcessor extends WamProcessor {
  // Define parameters
  static generateWamParameterInfo() {
    return {
      pitch: {
        id: 'pitch',
        label: 'Pitch',
        type: 'float',
        defaultValue: 60,
        minValue: 20,
        maxValue: 200,
        units: 'Hz',
      },
      decay: {
        id: 'decay',
        label: 'Decay',
        type: 'float',
        defaultValue: 0.3,
        minValue: 0.01,
        maxValue: 2.0,
        units: 's',
      },
      drive: {
        id: 'drive',
        label: 'Drive',
        type: 'float',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        units: '',
      }
    };
  }

  constructor(options) {
    super(options);
    this._phase = 0;
    this._envelope = 0;
    this._triggered = false;
  }

  // Handle incoming MIDI events
  _onMidi(midiData) {
    const [status, note, velocity] = midiData.bytes;
    const command = status & 0xF0;

    if (command === 0x90 && velocity > 0) {
      // Note On -- trigger the drum
      this._envelope = velocity / 127;
      this._phase = 0;
      this._triggered = true;
    }
  }

  // Handle incoming automation
  _onAutomation(automationData) {
    const { id, value, normalized } = automationData;
    // Parameters are automatically updated via WamProcessor base class
  }

  // Main DSP
  _processAudio(startSample, endSample, inputs, outputs) {
    const output = outputs[0];
    const left = output[0];
    const right = output[1];

    const pitch = this._parameterState.pitch.value;
    const decay = this._parameterState.decay.value;
    const drive = this._parameterState.drive.value;

    const sampleRate = globalThis.sampleRate;

    for (let i = startSample; i < endSample; i++) {
      if (this._triggered) {
        // Exponential decay envelope
        this._envelope *= Math.exp(-1 / (decay * sampleRate));

        // Pitch sweep (kick drum character)
        const currentPitch = pitch + (pitch * 2) * this._envelope;

        // Sine oscillator with pitch sweep
        this._phase += (2 * Math.PI * currentPitch) / sampleRate;
        let sample = Math.sin(this._phase) * this._envelope;

        // Optional drive/distortion
        if (drive > 0) {
          sample = Math.tanh(sample * (1 + drive * 10));
        }

        left[i] = sample;
        right[i] = sample;

        if (this._envelope < 0.001) {
          this._triggered = false;
          this._envelope = 0;
        }
      } else {
        left[i] = 0;
        right[i] = 0;
      }
    }
  }
}

registerProcessor('MyDrumSynth', MyDrumProcessor);
```

### Step 4: GUI (gui.js)

```javascript
export async function createElement(plugin) {
  const container = document.createElement('div');
  container.style.cssText = `
    background: #1a1a2e; color: #eee; padding: 16px;
    border-radius: 8px; font-family: monospace; width: 280px;
  `;

  const title = document.createElement('h3');
  title.textContent = plugin.name;
  container.appendChild(title);

  // Get parameter info from the audio thread
  const paramInfo = await plugin.audioNode.getParameterInfo();
  const paramValues = await plugin.audioNode.getParameterValues(true);

  for (const [id, info] of Object.entries(paramInfo)) {
    const row = document.createElement('div');
    row.style.cssText = 'margin: 8px 0;';

    const label = document.createElement('label');
    label.textContent = `${info.label}: `;
    label.style.display = 'inline-block';
    label.style.width = '80px';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 1;
    slider.step = 0.001;
    slider.value = paramValues[id]?.value ?? info.defaultValue;

    slider.addEventListener('input', () => {
      plugin.audioNode.setParameterValues({
        [id]: { id, value: parseFloat(slider.value), normalized: true }
      });
    });

    row.appendChild(label);
    row.appendChild(slider);
    container.appendChild(row);
  }

  return container;
}
```

## 6. WAM Host Implementation

A host is responsible for:
1. Initializing the WAM environment on the audio thread
2. Creating WAM groups (security boundaries)
3. Loading plugins via dynamic `import()`
4. Connecting plugin audio nodes to the Web Audio graph
5. Routing WAM events between plugins
6. Managing plugin lifecycle (create, destroy, save/restore state)

```javascript
import { initializeWamHost } from '@webaudiomodules/sdk';

class DrumMachineHost {
  constructor() {
    this.audioContext = null;
    this.plugins = new Map();
    this.groupId = 'drum-machine-host';
    this.groupKey = crypto.randomUUID(); // secret key
  }

  async initialize() {
    this.audioContext = new AudioContext({ sampleRate: 44100 });

    // Initialize WAM environment on the audio thread
    // This sets up globalThis.webAudioModules (WamEnv)
    const [hostGroupId, hostGroupKey] = await initializeWamHost(
      this.audioContext,
      this.groupId
    );

    this.groupId = hostGroupId;
    this.groupKey = hostGroupKey;
  }

  async loadPlugin(pluginUrl, slotId) {
    // Dynamic import of the WAM module
    const { default: PluginClass } = await import(pluginUrl);

    // Create an instance
    const instance = await PluginClass.createInstance(
      this.audioContext,
      this.groupId,
      this.groupKey
    );

    // Get the audio node
    const audioNode = instance.getAudioNode();

    // Connect to audio graph
    audioNode.connect(this.audioContext.destination);

    // Optionally create and mount GUI
    const gui = await instance.createGui();
    document.getElementById(slotId).appendChild(gui);

    this.plugins.set(slotId, { instance, audioNode, gui });
    return instance;
  }

  // Connect MIDI from a sequencer plugin to an instrument plugin
  connectMidi(fromSlot, toSlot) {
    const from = this.plugins.get(fromSlot);
    const to = this.plugins.get(toSlot);
    from.audioNode.connectEvents(to.audioNode.instanceId);
  }

  // Send MIDI note to a specific plugin
  triggerNote(slotId, note, velocity, time) {
    const { audioNode } = this.plugins.get(slotId);
    audioNode.scheduleEvents(
      { type: 'wam-midi', data: { bytes: [0x90, note, velocity] }, time },
      // Auto note-off after 100ms
      { type: 'wam-midi', data: { bytes: [0x80, note, 0] }, time: time + 0.1 }
    );
  }

  // Broadcast transport to all plugins
  setTransport(tempo, playing) {
    const now = this.audioContext.currentTime;
    for (const { audioNode } of this.plugins.values()) {
      audioNode.scheduleEvents({
        type: 'wam-transport',
        data: {
          tempo,
          playing,
          timeSigNumerator: 4,
          timeSigDenominator: 4,
          currentBar: 0,
          currentBarStarted: now,
        }
      });
    }
  }

  // Save all plugin states (for project save)
  async saveProject() {
    const states = {};
    for (const [slotId, { audioNode }] of this.plugins) {
      states[slotId] = await audioNode.getState();
    }
    return JSON.stringify(states);
  }

  // Restore all plugin states
  async loadProject(json) {
    const states = JSON.parse(json);
    for (const [slotId, state] of Object.entries(states)) {
      const plugin = this.plugins.get(slotId);
      if (plugin) await plugin.audioNode.setState(state);
    }
  }

  async unloadPlugin(slotId) {
    const plugin = this.plugins.get(slotId);
    if (plugin) {
      plugin.audioNode.disconnect();
      await plugin.audioNode.destroy();
      plugin.gui?.remove();
      this.plugins.delete(slotId);
    }
  }
}
```

## 7. Existing WAM Plugins

### Official Examples (webaudiomodules/wam-examples)
- **LiveGain** -- Gain effect (React + TypeScript)
- **PingPongDelay** -- Stereo ping-pong delay (CompositeNode)
- **QuadraFuzz** -- Multi-band distortion/fuzz (CompositeNode)

### Community & Research Projects
- **FAUST-based WAMs** -- DSP effects compiled from FAUST language to WebAssembly, wrapped as WAM plugins (reverbs, filters, compressors, synthesizers)
- **burns-audio** -- Collection of WAM effects and instruments
- **wam-opcode** -- WAM wrapper around OPL/FM synthesis
- **Michel Buffa's pedalboard** -- Guitar effects pedalboard host loading WAM plugins (demonstrated at Web Audio Conference)

### Plugin Categories Available:
- **Effects:** Delay, Reverb, Distortion, Chorus, Flanger, Phaser, EQ, Compressor, Limiter
- **Instruments:** FM synths, Subtractive synths, Samplers, Drum machines
- **Utilities:** Gain, Oscilloscope, Spectrum analyzer, MIDI monitor

## 8. WAM vs Native Plugins -- Performance

**Overhead sources:**
- JavaScript interpretation overhead (mitigated by JIT, but still ~2-5x slower than C++)
- WebAssembly narrows the gap to ~1.2-1.5x overhead for computation-heavy DSP
- Audio thread runs in a separate OS thread via AudioWorklet, so the main thread UI cannot block audio
- `SharedArrayBuffer` enables zero-copy parameter passing between threads (when available)
- 128-sample processing quantum is fixed (cannot go lower), setting a floor of ~2.9ms latency at 44.1kHz

**Practical limitations:**
- No SIMD in AudioWorklet (Chrome supports Wasm SIMD, but AudioWorklet context support varies)
- No direct filesystem access (samples must be fetched over network)
- Garbage collection pauses can cause glitches in JavaScript-heavy processors (use object pools, pre-allocate)
- Memory limited to browser process allocation

**Mitigation strategies for a drum machine:**
- Pre-decode all samples into `AudioBuffer` on load
- Use `Float32Array` ring buffers for sample playback in the processor
- Avoid allocations in `process()` -- no `new`, no array creation, no closures
- Use WebAssembly for DSP-heavy operations (filters, waveshaping, granular synthesis)

## 9. WAM and AudioWorklet

WAM is built on top of the Web Audio API's `AudioWorklet` system. Here is how the layers connect:

```
┌─────────────────────────────────────┐
│           WAM Plugin API            │  ← Plugin developer interface
├─────────────────────────────────────┤
│           WAM SDK                   │  ← Handles parameter management,
│   (WamNode, WamProcessor,          │     event routing, state serialization,
│    WamEnv, WamGroup)               │     MessagePort communication
├─────────────────────────────────────┤
│       AudioWorklet API              │  ← Browser-provided API
│   (AudioWorkletNode,               │     Separate thread for audio
│    AudioWorkletProcessor)          │     128-sample processing quantum
├─────────────────────────────────────┤
│       Web Audio API                 │  ← AudioContext, AudioNode graph
│   (AudioContext, GainNode,          │     Hardware audio I/O
│    AudioBuffer, etc.)              │
├─────────────────────────────────────┤
│       OS Audio Driver               │  ← CoreAudio, ALSA, WASAPI
└─────────────────────────────────────┘
```

**WAM SDK initialization sequence on the audio thread:**

1. Host calls `initializeWamHost(audioContext)` which adds `initializeWamEnv` module to AudioWorklet
2. This creates the `globalThis.webAudioModules` singleton (WamEnv) on the audio thread
3. Host creates a `WamGroup` with `groupId` + secret `groupKey`
4. Plugin's `createAudioNode()` adds its processor module to AudioWorklet
5. Processor constructor calls `globalThis.webAudioModules.addWam(this)` to register
6. MessagePort is used for main-thread <-> audio-thread method calls
7. `getModuleScope(moduleId)` provides dependency injection (avoids ES import issues in AudioWorklet)

## 10. Real-World WAM Implementations

- **Amped Studio** (ampedstudio.com) -- Online DAW using WAM for plugin architecture
- **Michel Buffa's Guitar Pedalboard** -- Academic project demonstrating WAM plugin chains for guitar effects
- **WAM Sequencer projects** -- MIDI sequencers that output WAM events to connected instruments
- **FAUST Web IDE** -- Compiles FAUST DSP code and wraps output as WAM plugins
- **Burns Audio WAM Collection** -- Community plugin suite
- **Web Audio Conference demos** -- Annual conference showcases multiple WAM-based projects

---

# Tone.js Deep Dive

## 1. Architecture Overview

Tone.js (v15.x) is a high-level Web Audio framework that wraps the native Web Audio API with musical abstractions. Three pillars:

```
┌─────────────────────────────────────────────┐
│                  Your Code                   │
├──────────┬──────────────┬───────────────────┤
│Transport │  Instruments │  Effects          │
│(timing)  │  & Sources   │  & Processing     │
├──────────┴──────────────┴───────────────────┤
│              Tone.Context                    │
│         (wraps AudioContext)                 │
├─────────────────────────────────────────────┤
│            Tone.Destination                  │
│         (wraps ctx.destination)              │
├─────────────────────────────────────────────┤
│           Web Audio API                      │
└─────────────────────────────────────────────┘
```

**Tone.Context:** Wraps the native `AudioContext`. Provides `Tone.now()` (current audio time + lookAhead), manages the Transport clock, handles `Tone.start()` for user-gesture gate. All Tone objects reference a shared context by default.

**Tone.Destination:** The master output. Wraps `audioContext.destination`. You can insert master effects, metering, or limiting here via `Tone.Destination.chain(limiter)`.

**Tone.Transport:** A virtual transport that provides musical timing independent of the audio clock. Think of it as a DAW's timeline. It can be started, stopped, paused, looped, and has a BPM property that affects all tempo-relative scheduling.

**Critical startup requirement:**

```javascript
// MUST be called from a user gesture (click/keydown) handler
document.getElementById('start').addEventListener('click', async () => {
  await Tone.start();
  console.log('Audio context running');
});
```

## 2. Transport

The Transport is a singleton that acts as the master clock for all scheduled musical events.

### Properties

```javascript
// Tempo
Tone.getTransport().bpm.value = 120;              // BPM (default: 120)
Tone.getTransport().bpm.rampTo(140, 4);           // ramp to 140 over 4 seconds

// Time signature
Tone.getTransport().timeSignature = 4;             // beats per measure (default: 4)
Tone.getTransport().timeSignature = [6, 8];        // compound: 6/8

// Swing
Tone.getTransport().swing = 0.5;                   // 0-1, amount of swing
Tone.getTransport().swingSubdivision = '8n';       // which note value swings

// PPQ (Pulses Per Quarter note) -- resolution of the transport timeline
Tone.getTransport().PPQ = 192;                     // default: 192

// Position -- current playhead
Tone.getTransport().position;                      // "0:0:0" (bars:beats:sixteenths)
Tone.getTransport().seconds;                       // current time in seconds
Tone.getTransport().ticks;                         // current position in ticks
Tone.getTransport().progress;                      // 0-1 if looping

// Looping
Tone.getTransport().loop = true;
Tone.getTransport().loopStart = '0:0:0';
Tone.getTransport().loopEnd = '4:0:0';            // loop 4 bars

// State
Tone.getTransport().state;                         // 'started', 'stopped', 'paused'

// Look-ahead (scheduling window)
Tone.getContext().lookAhead = 0.1;                 // seconds (default: 0.1)
Tone.getContext().updateInterval = 0.05;           // how often the scheduler ticks
```

### Scheduling Methods

```javascript
const transport = Tone.getTransport();

// schedule(callback, time) -- fire once at a transport time
const eventId = transport.schedule((time) => {
  // `time` is the AudioContext time (seconds) for sample-accurate scheduling
  synth.triggerAttackRelease('C4', '8n', time);
}, '0:0:0');

// scheduleOnce(callback, time) -- fire once, auto-removed after execution
transport.scheduleOnce((time) => {
  player.start(time);
}, '2:0:0');

// scheduleRepeat(callback, interval, startTime, duration)
const repeatId = transport.scheduleRepeat((time) => {
  kick.triggerAttackRelease('C1', '16n', time);
}, '4n', '0:0:0');  // every quarter note from the beginning

// Clear scheduled events
transport.clear(eventId);
transport.clear(repeatId);
transport.cancel();  // remove all scheduled events after current position
transport.cancel(0); // remove all events

// Playback control
transport.start();                    // start from current position
transport.start('+0.1');              // start 100ms from now
transport.start('+0.1', '0:0:0');    // start from beginning, 100ms from now
transport.stop();
transport.pause();

// Jump to position
transport.position = '2:0:0';        // jump to bar 3
transport.seconds = 5.0;             // jump to 5 seconds
```

### Transport Events

```javascript
transport.on('start', (time, offset) => { /* playback started */ });
transport.on('stop', (time) => { /* playback stopped */ });
transport.on('pause', (time) => { /* playback paused */ });
transport.on('loop', (time) => { /* loop point reached */ });
```

## 3. Instruments Relevant to Drums

### MembraneSynth (Kick Drums)

Simulates a drum membrane using a pitched oscillator with an exponential pitch decay envelope. The oscillator starts at a high frequency and sweeps down, mimicking the initial "click" and sustained "boom" of a kick drum.

```javascript
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.05,          // time (seconds) for pitch to sweep down (0.05 = snappy, 0.5 = boomy)
  octaves: 10,               // number of octaves the pitch sweeps (10 = dramatic sweep)
  oscillator: {
    type: 'sine',            // 'sine' | 'square' | 'sawtooth' | 'triangle'
                             // 'sine' = cleanest kick, 'triangle' = slightly brighter
                             // Can use partials: 'sine4' (first 4 harmonics)
  },
  envelope: {
    attack: 0.001,           // seconds -- near-instant attack for drums
    decay: 0.4,              // seconds -- controls the "body" length
    sustain: 0.01,           // 0-1 -- near-zero for percussive
    release: 1.4,            // seconds -- tail after note-off
    attackCurve: 'exponential',  // 'linear' | 'exponential' | 'sine' | 'cosine' | 'bounce' | 'ripple' | 'step'
    decayCurve: 'exponential',
    releaseCurve: 'exponential',
  },
}).toDestination();

// Trigger
kick.triggerAttackRelease('C1', '8n');           // note, duration
kick.triggerAttackRelease('C1', '8n', time, 0.8); // + scheduled time, velocity (0-1)

// Tuning for different kick characters:
// Deep 808 kick:   { pitchDecay: 0.08, octaves: 8, oscillator: { type: 'sine' }, envelope: { decay: 0.8 } }
// Punchy rock kick: { pitchDecay: 0.02, octaves: 4, oscillator: { type: 'sine' }, envelope: { decay: 0.2 } }
// Sub bass kick:    { pitchDecay: 0.12, octaves: 6, oscillator: { type: 'sine' }, envelope: { decay: 1.2 } }
```

**Internals:** MembraneSynth uses an `OscillatorNode` connected through an `AmplitudeEnvelope` (wrapping `GainNode` with scheduled automation). The pitch sweep uses `exponentialRampToValueAtTime` on the oscillator's `frequency` AudioParam.

### MetalSynth (Hi-Hats, Cymbals, Bells)

Uses a bank of slightly-detuned square wave oscillators fed through a resonant bandpass filter to create inharmonic metallic tones. Designed for hi-hats, cymbals, cowbells, and metallic percussion.

```javascript
const hihat = new Tone.MetalSynth({
  frequency: 200,            // base frequency in Hz (higher = brighter)
  harmonicity: 5.1,          // ratio of overtone frequencies to base (non-integer = inharmonic = metallic)
  modulationIndex: 32,       // depth of FM modulation (higher = more complex spectrum)
  octaves: 1.5,              // octave range of the resonant filter sweep
  resonance: 4000,           // center frequency of the resonant filter (Hz)
  envelope: {
    attack: 0.001,           // near-instant for percussion
    decay: 0.1,              // closed hi-hat: 0.05-0.1, open hi-hat: 0.3-0.8
    release: 0.01,           // short release
  },
  volume: -10,               // dB
}).toDestination();

// Trigger -- MetalSynth does NOT take a note, only duration and velocity
hihat.triggerAttackRelease('32n', time, 0.7);

// Preset recipes:
// Closed hi-hat:  { frequency: 400, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, envelope: { decay: 0.05 } }
// Open hi-hat:    { frequency: 400, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, envelope: { decay: 0.4, release: 0.3 } }
// Ride cymbal:    { frequency: 300, harmonicity: 7.1, modulationIndex: 20, resonance: 5000, envelope: { decay: 0.8 } }
// Crash cymbal:   { frequency: 300, harmonicity: 6.1, modulationIndex: 40, resonance: 3000, envelope: { decay: 1.5 } }
// Cowbell:        { frequency: 560, harmonicity: 3.5, modulationIndex: 2, resonance: 800, octaves: 0.5, envelope: { decay: 0.15 } }
```

**Internals:** MetalSynth creates 6 oscillators. Each is a square wave at `frequency * harmonicity^n` for n=0..5. These feed into a `BiquadFilterNode` (bandpass) at `resonance` frequency. The filter frequency sweeps down over `octaves` range. All goes through an `AmplitudeEnvelope`.

### NoiseSynth (Snares, Claps, Percussion)

Generates filtered noise through an amplitude envelope. Essential for snare drums (often layered with MembraneSynth for the "body") and hand claps.

```javascript
const snareNoise = new Tone.NoiseSynth({
  noise: {
    type: 'white',           // 'white' | 'pink' | 'brown'
                             // white = bright/crispy (snare), pink = warmer, brown = deep rumble
    playbackRate: 3,         // speeds up noise (higher = brighter/thinner)
    fadeIn: 0,               // seconds
    fadeOut: 0,              // seconds
  },
  envelope: {
    attack: 0.001,           // instant for percussion
    decay: 0.13,             // snare: 0.1-0.2, clap: 0.15-0.3
    sustain: 0,              // 0 for percussion
    release: 0.03,
  },
  volume: -10,
}).toDestination();

// Trigger -- NoiseSynth does not take a pitch
snareNoise.triggerAttackRelease('16n', time);

// Layered snare (noise body + pitched click)
const snareBody = new Tone.MembraneSynth({
  pitchDecay: 0.01,
  octaves: 6,
  oscillator: { type: 'sine' },
  envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 }
}).toDestination();

// Trigger both simultaneously for a complete snare:
function triggerSnare(time, velocity) {
  snareNoise.triggerAttackRelease('16n', time, velocity);
  snareBody.triggerAttackRelease('E2', '16n', time, velocity);
}

// Preset recipes:
// Tight snare:   { noise: { type: 'white', playbackRate: 5 }, envelope: { decay: 0.08 } }
// Fat snare:     { noise: { type: 'pink', playbackRate: 2 }, envelope: { decay: 0.25 } }
// Clap:          { noise: { type: 'white', playbackRate: 3 }, envelope: { attack: 0.01, decay: 0.2, release: 0.1 } }
// Brush:         { noise: { type: 'brown', playbackRate: 1 }, envelope: { attack: 0.05, decay: 0.5 } }
```

**Internals:** NoiseSynth uses a `Noise` source (generates random samples at the specified `type` distribution) connected through an `AmplitudeEnvelope`. The noise buffer is pre-generated and looped, with `playbackRate` controlling the `BufferSourceNode.playbackRate` parameter.

### PluckSynth (Metallic Percussion, Clave, Rim Shot)

Based on the Karplus-Strong algorithm -- a short burst of noise fed through a tuned delay line with feedback. Creates plucked-string and metallic percussion tones.

```javascript
const clave = new Tone.PluckSynth({
  attackNoise: 1,            // 0-5+ : intensity of initial noise burst
  dampening: 4000,           // Hz: lowpass filter on the feedback loop
                             // lower = darker/warmer, higher = brighter
  resonance: 0.7,            // 0-1: feedback amount (0.99 = long sustain, 0.5 = short)
  release: 1,                // seconds: time after note-off before silence
  volume: -5,
}).toDestination();

// PluckSynth takes a note
clave.triggerAttack('D5', time);

// Recipes:
// Clave:       { attackNoise: 4, dampening: 6000, resonance: 0.5, release: 0.3 }
// Rim shot:    { attackNoise: 5, dampening: 8000, resonance: 0.3, release: 0.2 }
// Wood block:  { attackNoise: 2, dampening: 2000, resonance: 0.6, release: 0.4 }
// Kalimba:     { attackNoise: 1, dampening: 3000, resonance: 0.96, release: 2 }
```

### Sampler (Multi-Sample Instrument)

Maps audio files to MIDI notes. Pitch-shifts samples to fill unmapped notes. Essential for realistic drum kits.

```javascript
const drumKit = new Tone.Sampler({
  urls: {
    C1: 'kick.wav',
    D1: 'snare.wav',
    'F#1': 'closed-hihat.wav',
    'A#1': 'open-hihat.wav',
    E1: 'clap.wav',
    C2: 'tom-low.wav',
    D2: 'tom-mid.wav',
    E2: 'tom-high.wav',
    'F#2': 'ride.wav',
    'A#2': 'crash.wav',
  },
  baseUrl: '/samples/drums/',
  onload: () => console.log('Drum kit loaded'),

  // Optional settings
  attack: 0,                 // attack time in seconds (fade in)
  release: 1,                // release time after triggerRelease
  curve: 'exponential',      // release curve: 'linear' | 'exponential'
  volume: 0,                 // dB
}).toDestination();

// Wait for samples to load
await Tone.loaded();

// Trigger drums
drumKit.triggerAttackRelease('C1', '4n', time, 1.0);   // kick, full velocity
drumKit.triggerAttackRelease('D1', '8n', time, 0.8);   // snare
drumKit.triggerAttackRelease('F#1', '32n', time, 0.6);  // closed hi-hat

// Velocity layers (map multiple samples to same note at different velocities):
// Sampler doesn't have built-in velocity layers -- you implement this manually:
class VelocityLayeredSampler {
  constructor(layers, options) {
    // layers = [ { minVel: 0, maxVel: 42, urls: {...} }, { minVel: 43, maxVel: 84, ... }, ... ]
    this.layers = layers.map(l => ({
      ...l,
      sampler: new Tone.Sampler({ urls: l.urls, ...options })
    }));
  }

  triggerAttackRelease(note, duration, time, velocity = 1) {
    const vel = Math.floor(velocity * 127);
    const layer = this.layers.find(l => vel >= l.minVel && vel <= l.maxVel);
    if (layer) {
      layer.sampler.triggerAttackRelease(note, duration, time, velocity);
    }
  }
}
```

### Player (Single Sample Playback)

For playing individual audio files. Simpler than Sampler when you just need one-shot playback.

```javascript
const kickPlayer = new Tone.Player({
  url: '/samples/kick-808.wav',
  loop: false,
  autostart: false,
  fadeIn: 0,
  fadeOut: 0.01,             // tiny fade-out prevents clicks
  playbackRate: 1,           // 0.5 = half speed (octave down), 2 = double speed (octave up)
  reverse: false,
  volume: 0,
  onload: () => console.log('Loaded'),
}).toDestination();

await Tone.loaded();

// Playback
kickPlayer.start(time);                    // start at scheduled time
kickPlayer.start(time, 0.01);              // start 10ms into the sample (skip click)
kickPlayer.start(time, 0, '8n');           // play for an 8th note duration

kickPlayer.stop(time + 0.5);              // stop at specific time
kickPlayer.playbackRate.value = 1.2;       // pitch up
kickPlayer.reverse = true;                 // reverse playback

// For multiple simultaneous triggers (re-triggering), use Players or a pool:
const players = new Tone.Players({
  kick: '/samples/kick.wav',
  snare: '/samples/snare.wav',
  hihat: '/samples/hihat.wav',
}).toDestination();

players.player('kick').start(time);
players.player('snare').start(time);

// Important: Player can only play one instance at a time!
// For polyphonic sample playback, create a pool:
class SamplePool {
  constructor(url, poolSize = 8) {
    this.players = Array.from({ length: poolSize },
      () => new Tone.Player(url).toDestination()
    );
    this.index = 0;
  }

  start(time) {
    const player = this.players[this.index % this.players.length];
    player.start(time);
    this.index++;
  }
}
```

### GrainPlayer (Granular Synthesis)

Granular playback engine that chops audio into tiny grains and reassembles them. Allows independent control of pitch and playback speed, plus textural effects.

```javascript
const grainPlayer = new Tone.GrainPlayer({
  url: '/samples/ambient-pad.wav',
  grainSize: 0.1,           // seconds -- size of each grain (0.01 = glitchy, 0.2 = smooth)
  overlap: 0.05,             // seconds -- crossfade between grains
  playbackRate: 1,           // speed WITHOUT changing pitch
  detune: 0,                 // cents -- pitch shift WITHOUT changing speed
  drift: 0,                  // seconds -- random offset per grain (adds texture/movement)
  loop: true,
  loopStart: 0,              // seconds
  loopEnd: 0,                // seconds (0 = end of buffer)
  reverse: false,
  volume: 0,
}).toDestination();

await Tone.loaded();
grainPlayer.start();

// Drum machine applications:
// - Texture pads behind drum patterns
// - Time-stretching breakbeats without pitch change
// - Glitch effects on drum loops
// - Freeze/stutter effects (tiny grainSize + no drift)
```

## 4. Tone.js Effects -- Complete Catalog

### Dynamics

```javascript
// Compressor -- reduces dynamic range
new Tone.Compressor({
  threshold: -24,    // dB: level above which compression starts
  ratio: 12,         // compression ratio (12:1 = heavy limiting)
  attack: 0.003,     // seconds
  release: 0.25,     // seconds
  knee: 30,          // dB: smoothness of threshold transition
});

// Limiter -- brickwall limiter
new Tone.Limiter({
  threshold: -6,     // dB: nothing passes above this
});

// Gate -- silences signal below threshold
new Tone.Gate({
  threshold: -30,    // dB
  smoothing: 0.1,    // seconds: attack/release of gate
});

// MultibandCompressor
new Tone.MultibandCompressor({
  low: { threshold: -12, ratio: 4, attack: 0.02, release: 0.1 },
  mid: { threshold: -12, ratio: 3, attack: 0.01, release: 0.1 },
  high: { threshold: -12, ratio: 2, attack: 0.005, release: 0.05 },
  lowFrequency: 250,   // Hz: crossover point low->mid
  highFrequency: 2000,  // Hz: crossover point mid->high
});
```

### Delay-Based

```javascript
// FeedbackDelay
new Tone.FeedbackDelay({
  delayTime: '8n',   // tempo-synced or seconds
  feedback: 0.4,     // 0-1
  wet: 0.3,
  maxDelay: 1,       // seconds: max buffer
});

// PingPongDelay -- alternates left/right
new Tone.PingPongDelay({
  delayTime: '8n',
  feedback: 0.3,
  wet: 0.25,
});
```

### Reverb

```javascript
// Reverb -- convolution-based (realistic)
new Tone.Reverb({
  decay: 2.5,        // seconds
  preDelay: 0.01,    // seconds before reverb onset
  wet: 0.3,
});

// JCReverb -- Schroeder reverb (algorithmic, lighter CPU)
new Tone.JCReverb({
  roomSize: 0.5,     // 0-1
  wet: 0.3,
});

// Freeverb -- Freeverb algorithm
new Tone.Freeverb({
  roomSize: 0.7,     // 0-1
  dampening: 3000,   // Hz: high-frequency damping
  wet: 0.3,
});
```

### Filter-Based

```javascript
// Filter
new Tone.Filter({
  frequency: 1000,   // Hz
  type: 'lowpass',   // 'lowpass' | 'highpass' | 'bandpass' | 'lowshelf' | 'highshelf' | 'notch' | 'allpass' | 'peaking'
  rolloff: -12,      // dB/octave: -12 | -24 | -48 | -96
  Q: 1,              // resonance / quality factor
  gain: 0,           // dB (only for shelf/peaking types)
});

// AutoFilter -- LFO-modulated filter
new Tone.AutoFilter({
  frequency: '4n',   // LFO rate
  baseFrequency: 200,
  octaves: 2.6,
  type: 'sine',      // LFO waveform
  depth: 1,          // LFO depth (0-1)
  wet: 1,
  filter: { type: 'lowpass', rolloff: -12, Q: 1 },
}).start();

// AutoWah -- envelope-follower filter
new Tone.AutoWah({
  baseFrequency: 100,
  octaves: 6,
  sensitivity: 0,    // dB: input sensitivity
  Q: 2,
  gain: 2,
  follower: { attack: 0.3, release: 0.1 },
});

// EQ3 -- three-band EQ
new Tone.EQ3({
  low: 0,            // dB
  mid: 0,            // dB
  high: 0,           // dB
  lowFrequency: 400, // Hz
  highFrequency: 2500, // Hz
});

// BiquadFilter -- direct access to native BiquadFilterNode
new Tone.BiquadFilter({ frequency: 440, type: 'lowpass', Q: 1 });
```

### Distortion

```javascript
// Distortion -- waveshaper
new Tone.Distortion({
  distortion: 0.8,   // 0-1
  oversample: '4x',  // 'none' | '2x' | '4x' (reduces aliasing)
  wet: 1,
});

// Chebyshev -- polynomial waveshaping
new Tone.Chebyshev({
  order: 50,         // harmonic order (higher = more harmonics)
  oversample: '4x',
  wet: 1,
});

// BitCrusher
new Tone.BitCrusher({
  bits: 4,           // 1-16 (lower = more crushed)
  wet: 1,
});
```

### Modulation

```javascript
// Chorus
new Tone.Chorus({
  frequency: 1.5,    // Hz: LFO rate
  delayTime: 3.5,    // ms
  depth: 0.7,        // 0-1
  spread: 180,       // degrees: stereo spread
  wet: 0.5,
}).start();

// Phaser
new Tone.Phaser({
  frequency: 0.5,    // Hz: LFO rate
  octaves: 3,        // range of allpass sweep
  stages: 10,        // number of allpass filters
  Q: 10,
  baseFrequency: 350,
  wet: 0.5,
});

// Tremolo
new Tone.Tremolo({
  frequency: 10,     // Hz
  type: 'sine',      // LFO waveform
  depth: 0.5,        // 0-1
  spread: 0,         // stereo degrees
  wet: 1,
}).start();

// Vibrato
new Tone.Vibrato({
  frequency: 5,      // Hz
  depth: 0.1,        // 0-1
  type: 'sine',
  wet: 1,
});
```

### Stereo & Spatial

```javascript
// StereoWidener
new Tone.StereoWidener({ width: 0.8 }); // 0-1

// Panner
new Tone.Panner({ pan: 0 }); // -1 (left) to 1 (right)

// Panner3D
new Tone.Panner3D({
  positionX: 0, positionY: 0, positionZ: 0,
  panningModel: 'HRTF',     // 'HRTF' | 'equalpower'
  distanceModel: 'inverse',
});

// FeedbackCombFilter
new Tone.FeedbackCombFilter({ delayTime: 0.1, resonance: 0.5 });
```

### Utility

```javascript
// Gain
new Tone.Gain({ gain: 0.5 });

// Volume (in dB)
new Tone.Volume({ volume: -12 });

// Channel -- mono/stereo routing
new Tone.Channel({ volume: -6, pan: 0.2, mute: false, solo: false });

// Mono -- force mono
new Tone.Mono();

// MidSideCompressor
new Tone.MidSideCompressor({
  mid: { threshold: -12, ratio: 3 },
  side: { threshold: -12, ratio: 6 },
});

// Analyser -- FFT / waveform data
const analyser = new Tone.Analyser({ type: 'fft', size: 1024 });
// analyser.getValue() returns Float32Array

// Meter -- signal level
const meter = new Tone.Meter({ smoothing: 0.8 });
// meter.getValue() returns dB level

// FFT
const fft = new Tone.FFT(2048);
// fft.getValue() returns frequency domain data

// Waveform
const waveform = new Tone.Waveform(1024);
// waveform.getValue() returns time domain data
```

### Chaining and Routing

```javascript
// Serial chain
synth.chain(distortion, reverb, Tone.Destination);

// Parallel routing
const split = new Tone.Split();  // split stereo to two mono
const merge = new Tone.Merge();  // merge two mono to stereo

// Send/return (aux bus)
const reverbBus = new Tone.Reverb(2).toDestination();
const channel = new Tone.Channel().toDestination();
channel.send(reverbBus, -12); // send -12dB to reverb bus

// Fan out to multiple destinations
synth.connect(effect1);
synth.connect(effect2);  // both receive the same signal
```

## 5. Signal Processing

Tone.js wraps AudioParam with `Tone.Signal` for sample-accurate, schedulable parameter control:

```javascript
// Tone.Signal wraps AudioParam
const signal = new Tone.Signal(440, 'frequency');

signal.value = 880;                          // immediate set
signal.linearRampTo(880, 0.5);               // linear ramp over 0.5s
signal.exponentialRampTo(880, 0.5);          // exponential ramp
signal.rampTo(880, 0.5);                     // default ramp (exponential for frequency)
signal.setValueAtTime(440, '+1');            // set at future time
signal.linearRampToValueAtTime(880, '+2');   // ramp to value at future time
signal.cancelScheduledValues('+0');          // clear future automation
signal.setTargetAtTime(880, '+0', 0.1);     // exponential approach with time constant

// Math operations on signals (all sample-accurate in the audio graph)
const multiplied = new Tone.Multiply(2);     // signal * 2
const added = new Tone.Add(100);             // signal + 100
const negated = new Tone.Negate();           // signal * -1
const abs = new Tone.Abs();                  // |signal|
const pow = new Tone.Pow(2);                 // signal^2
const scale = new Tone.Scale(0, 1);          // map input range to 0..1
const scaleExp = new Tone.ScaleExp(0, 1, 2); // exponential scaling
const gte = new Tone.GreaterThan(0.5);       // outputs 1 if input > 0.5, else 0

// LFO (Low Frequency Oscillator) -- automated modulation
const lfo = new Tone.LFO({
  frequency: '4n',        // rate: Hz or tempo-synced notation
  min: 200,               // output minimum
  max: 2000,              // output maximum
  type: 'sine',           // 'sine' | 'square' | 'sawtooth' | 'triangle'
  phase: 0,               // degrees offset
  amplitude: 1,           // 0-1
}).start();

lfo.connect(filter.frequency);  // modulate filter cutoff
```

## 6. Sequence vs Pattern vs Loop vs Part

### Tone.Sequence -- Ordered Note Sequence

Best for step sequencers and drum patterns where events happen at regular subdivisions.

```javascript
// Sequence fires callback for each element at the given subdivision
const hihatPattern = new Tone.Sequence(
  (time, note) => {
    hihat.triggerAttackRelease('32n', time, note === 'x' ? 0.8 : 0.4);
  },
  ['x', 'o', 'x', 'o', 'x', 'o', 'x', 'o'],  // events array
  '8n'  // subdivision -- each element = one 8th note
).start(0);

// Supports nested arrays for subdivisions
const complexHat = new Tone.Sequence(
  (time, vel) => { if (vel) hihat.triggerAttackRelease('32n', time, vel); },
  [0.8, [0.4, 0.4], 0.8, [0.4, null, 0.4], 0.8, 0.4, [0.8, 0.4], 0.4],
  '8n'
).start(0);
// Nested arrays subdivide the time slot: [0.4, 0.4] plays two 16th notes in one 8th note slot
// null = rest

hihatPattern.loop = true;
hihatPattern.loopStart = 0;
hihatPattern.loopEnd = '1m';  // loop every measure

// Must start transport
Tone.getTransport().start();
```

### Tone.Pattern -- Arpeggiator-Style Patterns

Iterates through an array of values using various pattern types. Less common for drum machines, but useful for melodic percussion.

```javascript
const pattern = new Tone.Pattern(
  (time, note) => {
    synth.triggerAttackRelease(note, '8n', time);
  },
  ['C4', 'E4', 'G4', 'B4'],
  'upDown'  // pattern type
);

// Pattern types:
// 'up'           -- C E G B C E G B ...
// 'down'         -- B G E C B G E C ...
// 'upDown'       -- C E G B G E C E G B ...
// 'downUp'       -- B G E C E G B G E C ...
// 'alternateUp'  -- C E G B B G E C C E G B ...
// 'alternateDown'
// 'random'       -- random order
// 'randomOnce'   -- shuffle then repeat
// 'randomWalk'   -- random walk (step +/- 1)

pattern.interval = '8n';
pattern.start(0);
```

### Tone.Loop -- Simple Repeating Callback

Simplest option. A callback that fires at a regular interval. No note data -- just timing.

```javascript
const kickLoop = new Tone.Loop((time) => {
  kick.triggerAttackRelease('C1', '8n', time);
}, '4n').start(0);  // every quarter note

kickLoop.iterations = Infinity;  // default: Infinity
kickLoop.interval = '4n';       // can change dynamically
kickLoop.humanize = 0.01;       // add random timing offset (seconds) for "human" feel

// Great for simple, steady drum parts:
const hihatLoop = new Tone.Loop((time) => {
  hihat.triggerAttackRelease('32n', time, 0.5 + Math.random() * 0.3);
}, '8n').start(0);
```

### Tone.Part -- Arbitrary Timed Events

Most flexible. Schedule events at arbitrary (non-uniform) times. Best for complex drum patterns with varying velocities and non-grid timings.

```javascript
const drumPattern = new Tone.Part(
  (time, event) => {
    switch (event.drum) {
      case 'kick':
        kick.triggerAttackRelease('C1', '8n', time, event.velocity);
        break;
      case 'snare':
        snare.triggerAttackRelease('16n', time, event.velocity);
        break;
      case 'hihat':
        hihat.triggerAttackRelease('32n', time, event.velocity);
        break;
    }
  },
  [
    // time, event data
    { time: '0:0:0', drum: 'kick', velocity: 1.0 },
    { time: '0:0:0', drum: 'hihat', velocity: 0.7 },
    { time: '0:1:0', drum: 'hihat', velocity: 0.5 },
    { time: '0:2:0', drum: 'snare', velocity: 0.9 },
    { time: '0:2:0', drum: 'hihat', velocity: 0.7 },
    { time: '0:3:0', drum: 'hihat', velocity: 0.5 },
    { time: '0:3:2', drum: 'kick', velocity: 0.8 },  // ghost note on the "and"
  ]
);

drumPattern.loop = true;
drumPattern.loopEnd = '1m';
drumPattern.start(0);

// Add/remove events dynamically
drumPattern.add({ time: '0:1:2', drum: 'kick', velocity: 0.6 });
drumPattern.remove('0:3:2');  // remove event at this time

// Humanize timing
drumPattern.humanize = '32n';  // random offset up to 32nd note
```

### When to Use Which

| Class | Use Case | Grid-Based? | Data Format |
|-------|----------|-------------|-------------|
| `Sequence` | Step sequencer, even divisions | Yes | Array of values |
| `Pattern` | Arpeggios, cycling through notes | Yes | Array + pattern type |
| `Loop` | Simple repeating action | Yes (single interval) | Callback only |
| `Part` | Complex, non-uniform patterns | No | Array of {time, data} |

**For a drum machine:** Use `Tone.Sequence` for the step sequencer grid (each track = one Sequence), or `Tone.Part` for more complex patterns with velocity variation and non-quantized hits.

## 7. Time Representations

Tone.js accepts time values in multiple formats:

```javascript
// Notation -- musical note values
'1n'     // whole note
'2n'     // half note
'4n'     // quarter note
'8n'     // eighth note
'16n'    // sixteenth note
'32n'    // thirty-second note
'1n.'    // dotted whole note (1.5x duration)
'2n.'    // dotted half note
'4t'     // quarter note triplet (2/3 of quarter)
'8t'     // eighth note triplet
'16t'    // sixteenth note triplet

// Transport time -- bars:beats:sixteenths
'0:0:0'  // start
'1:0:0'  // bar 2
'0:2:0'  // beat 3 (0-indexed)
'0:0:2'  // third sixteenth note
'4:3:1'  // bar 5, beat 4, second sixteenth

// Seconds
1.5      // 1.5 seconds
'1.5'    // also 1.5 seconds (string)

// Frequency (converted to period)
'440hz'  // 1/440 seconds

// Ticks
'100i'   // 100 ticks (PPQ-based)

// Relative time (from Tone.now())
'+0.1'   // 100ms from now
'+4n'    // one quarter note from now

// Combining with Tone.Time for calculations
Tone.Time('4n').toSeconds();         // quarter note in seconds at current tempo
Tone.Time('1m').toSeconds();         // one measure in seconds
Tone.Time('8n').toMilliseconds();    // 8th note in ms
Tone.Time('4n').toTicks();           // quarter note in ticks
Tone.Time('4n').toNotation();        // normalize to notation
Tone.Time('4n + 8n').toSeconds();    // addition!
Tone.Time('4n * 3').toSeconds();     // multiplication!
Tone.Time(1.5).toBarsBeatsSixteenths(); // convert seconds to transport time

// Tone.Frequency
Tone.Frequency('C4').toFrequency();  // 261.63
Tone.Frequency(440).toNote();        // "A4"
Tone.Frequency('A4').transpose(7);   // perfect fifth up
Tone.Frequency('A4').harmonize([0, 4, 7]); // major chord
```

## 8. Performance Optimization

### General Principles

```javascript
// 1. Pre-create and reuse instruments -- never allocate in scheduling callbacks
const instruments = {
  kick: new Tone.MembraneSynth().toDestination(),
  snare: new Tone.NoiseSynth().toDestination(),
  hihat: new Tone.MetalSynth().toDestination(),
};

// 2. Use Tone.loaded() to ensure all samples are decoded before starting
await Tone.loaded();

// 3. Dispose unused resources
oldSynth.dispose();  // releases all Web Audio nodes and event listeners

// 4. Limit polyphony
const polySynth = new Tone.PolySynth(Tone.Synth, { maxPolyphony: 8 });

// 5. Use offline rendering for bouncing/exporting
const offlineBuffer = await Tone.Offline(({ transport }) => {
  const synth = new Tone.Synth().toDestination();
  transport.schedule((time) => {
    synth.triggerAttackRelease('C4', '4n', time);
  }, 0);
  transport.start(0);
}, 4);  // 4 seconds of audio
// offlineBuffer is a Tone.ToneAudioBuffer

// 6. Adjust lookAhead and updateInterval
Tone.getContext().lookAhead = 0.05;      // smaller = lower latency, higher CPU
Tone.getContext().updateInterval = 0.025; // how often the scheduler checks

// 7. Minimize connections -- each connection = CPU work per audio quantum
// BAD:  each drum -> separate reverb -> destination
// GOOD: all drums -> one submix bus -> one shared reverb -> destination

// 8. Use Channel for mixing (built-in gain + pan, solo/mute)
const drumBus = new Tone.Channel({ volume: -3 }).toDestination();
kick.connect(drumBus);
snare.connect(drumBus);

// 9. Avoid creating Tone objects during playback
// Pre-allocate everything during initialization

// 10. Audio buffer pool for re-triggerable samples
// Use Players or a manual pool of Player instances
```

### Memory Management

```javascript
// Always dispose when removing instruments/effects
function destroyDrumMachine(instruments, effects) {
  Object.values(instruments).forEach(i => i.dispose());
  Object.values(effects).forEach(e => e.dispose());
}

// Check for context state
if (Tone.getContext().state === 'suspended') {
  await Tone.start();
}

// Monitor audio graph size (debugging)
console.log('Active audio nodes:', Tone.getContext().rawContext._nativeAudioContext
  ? 'Use browser DevTools Web Audio inspector'
  : 'unknown');
```

## 9. Tone.js + Framework Integration

### React Pattern

```jsx
import { useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';

function DrumMachine() {
  const instruments = useRef(null);
  const sequence = useRef(null);
  const isInitialized = useRef(false);

  // Initialize audio on first user interaction
  const initAudio = useCallback(async () => {
    if (isInitialized.current) return;

    await Tone.start();

    instruments.current = {
      kick: new Tone.MembraneSynth({
        pitchDecay: 0.05, octaves: 10,
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
      }).toDestination(),
      snare: new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.03 }
      }).toDestination(),
      hihat: new Tone.MetalSynth({
        frequency: 400, harmonicity: 5.1, modulationIndex: 32,
        resonance: 4000, envelope: { attack: 0.001, decay: 0.05, release: 0.01 }
      }).toDestination(),
    };

    isInitialized.current = true;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sequence.current?.dispose();
      if (instruments.current) {
        Object.values(instruments.current).forEach(i => i.dispose());
      }
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
    };
  }, []);

  const startPattern = useCallback((pattern) => {
    // pattern = { kick: [1,0,0,0,1,0,0,0,...], snare: [...], hihat: [...] }
    sequence.current?.dispose();

    const steps = pattern.kick.length;
    sequence.current = new Tone.Sequence(
      (time, step) => {
        if (pattern.kick[step]) {
          instruments.current.kick.triggerAttackRelease('C1', '8n', time, pattern.kick[step]);
        }
        if (pattern.snare[step]) {
          instruments.current.snare.triggerAttackRelease('16n', time, pattern.snare[step]);
        }
        if (pattern.hihat[step]) {
          instruments.current.hihat.triggerAttackRelease('32n', time, pattern.hihat[step]);
        }
      },
      Array.from({ length: steps }, (_, i) => i),
      '16n'
    ).start(0);

    Tone.getTransport().start();
  }, []);

  return (
    <div onClick={initAudio}>
      {/* UI components */}
    </div>
  );
}
```

### Svelte Pattern

```svelte
<script>
  import * as Tone from 'tone';
  import { onMount, onDestroy } from 'svelte';

  let isPlaying = false;
  let bpm = 120;
  let instruments = {};
  let initialized = false;

  async function init() {
    if (initialized) return;
    await Tone.start();

    instruments = {
      kick: new Tone.MembraneSynth().toDestination(),
      snare: new Tone.NoiseSynth().toDestination(),
      hihat: new Tone.MetalSynth({ envelope: { decay: 0.05 } }).toDestination(),
    };

    initialized = true;
  }

  // Reactive BPM
  $: if (initialized) {
    Tone.getTransport().bpm.value = bpm;
  }

  function togglePlay() {
    if (!initialized) return;
    if (isPlaying) {
      Tone.getTransport().stop();
    } else {
      Tone.getTransport().start();
    }
    isPlaying = !isPlaying;
  }

  onDestroy(() => {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    Object.values(instruments).forEach(i => i.dispose());
  });
</script>

<button on:click={init}>Initialize Audio</button>
<button on:click={togglePlay}>{isPlaying ? 'Stop' : 'Play'}</button>
<input type="range" bind:value={bpm} min="60" max="200" />
```

---

# Other Relevant Libraries

## 1. Howler.js

**What it is:** A lightweight audio playback library (~7kb gzipped) that abstracts Web Audio API and HTML5 Audio with automatic fallback. Designed for games and simple audio playback rather than music production.

**When to use vs Tone.js:**
- Use Howler.js for: simple sample playback, game audio, sprite sheets, spatial audio, when you do NOT need synthesis, scheduling, or effects chains
- Use Tone.js for: music production, synthesis, complex scheduling, effects processing, anything requiring Transport or musical timing

### API

```javascript
// --- Howl (individual sound) ---
const sound = new Howl({
  src: ['/audio/drums.webm', '/audio/drums.mp3'],  // format fallback order
  sprite: {
    kick:  [0, 500],        // [offset_ms, duration_ms]
    snare: [500, 400],
    hihat: [900, 200],
    clap:  [1100, 350],
    open:  [1450, 800, true],  // third param = loop this sprite
  },
  volume: 0.8,
  rate: 1.0,                 // 0.5-4.0 playback rate
  loop: false,
  autoplay: false,
  html5: false,              // true = force HTML5 Audio (for streaming large files)
  preload: true,
  pool: 5,                   // number of inactive sounds to keep for reuse
  format: ['webm', 'mp3'],  // explicit format specification
  xhr: {                     // customize fetch requests
    method: 'GET',
    headers: { Authorization: 'Bearer token' },
    withCredentials: false,
  },

  // Events
  onload: () => console.log('Loaded'),
  onloaderror: (id, err) => console.error('Load error', err),
  onplayerror: (id, err) => console.error('Play error', err),
  onplay: (id) => console.log('Playing', id),
  onend: (id) => console.log('Ended', id),
  onstop: (id) => console.log('Stopped', id),
  onpause: (id) => console.log('Paused', id),
  onfade: (id) => console.log('Fade complete', id),
});

// Playback
const soundId = sound.play('kick');      // play sprite, returns unique ID
sound.play('snare');                     // can play multiple simultaneously
sound.pause(soundId);
sound.stop(soundId);
sound.seek(0.1, soundId);               // seek to 100ms

// Volume and rate per-sound
sound.volume(0.5, soundId);             // set volume for specific sound
sound.rate(1.5, soundId);               // speed up specific sound
sound.mute(true, soundId);

// Fading
sound.fade(1.0, 0, 1000, soundId);     // fade from 1.0 to 0 over 1 second

// State
sound.playing(soundId);                  // boolean
sound.duration('kick');                  // sprite duration in seconds
sound.state();                           // 'unloaded' | 'loading' | 'loaded'

// Event binding
sound.on('end', (id) => { /* ... */ });
sound.once('load', () => { /* ... */ });
sound.off('end');

// --- Howler (global) ---
Howler.volume(0.5);                      // master volume (affects all sounds)
Howler.mute(true);                       // mute everything
Howler.stop();                           // stop all sounds
Howler.codecs('mp3');                    // check codec support (boolean)

// --- Spatial Audio (howler.spatial.js plugin) ---
const spatial = new Howl({
  src: ['/audio/ambient.mp3'],
  pannerAttr: {
    panningModel: 'HRTF',               // 'HRTF' | 'equalpower'
    distanceModel: 'inverse',           // 'linear' | 'inverse' | 'exponential'
    refDistance: 1,
    maxDistance: 10000,
    rolloffFactor: 1,
    coneInnerAngle: 360,
    coneOuterAngle: 360,
    coneOuterGain: 0,
  },
});

spatial.pos(1, 2, -1, soundId);          // x, y, z position
spatial.orientation(0, 0, -1, soundId);  // direction vector
Howler.pos(0, 0, 0);                    // listener position
Howler.orientation(0, 0, -1, 0, 1, 0);  // listener orientation + up vector
```

## 2. standardized-audio-context

**What it is:** A ponyfill (non-polluting polyfill) that provides a strict W3C Web Audio API implementation across all browsers. It does NOT modify globals -- you import its classes directly.

**When to use:** When you need guaranteed spec-compliant behavior across Safari, Firefox, and Chrome, especially for `AudioWorklet`, `OfflineAudioContext`, and edge cases where browsers diverge from the spec.

```javascript
import { AudioContext, OfflineAudioContext } from 'standardized-audio-context';

const ctx = new AudioContext();
const osc = ctx.createOscillator();
osc.connect(ctx.destination);
osc.start();

// Same API as native, but consistent across browsers
// Notable: does NOT support deprecated createScriptProcessor()
// AudioWorklet works but cannot match native performance (fundamental limitation)
```

**Key differences from native:**
- Consistent `decodeAudioData()` behavior (returns Promise everywhere)
- Consistent `AudioWorklet` registration
- Consistent `OfflineAudioContext` behavior
- Does not support deprecated ScriptProcessorNode
- ~25KB gzipped

## 3. soundfont-player

**What it is:** Loads GM (General MIDI) SoundFont instruments in the browser. Fetches pre-rendered samples from a CDN and plays them via Web Audio API.

```javascript
import Soundfont from 'soundfont-player';

// Load an instrument (fetches from gleitz.github.io by default)
const audioContext = new AudioContext();
const piano = await Soundfont.instrument(audioContext, 'acoustic_grand_piano');
// Available: all 128 GM instruments + percussion

// Play a note
piano.play('C4');                            // plays middle C
piano.play('C4', audioContext.currentTime, { duration: 1, gain: 0.8 });

// Schedule multiple notes
piano.schedule(audioContext.currentTime, [
  { note: 'C4', time: 0, duration: 0.5 },
  { note: 'E4', time: 0.5, duration: 0.5 },
  { note: 'G4', time: 1.0, duration: 0.5 },
]);

// Stop
piano.stop();

// Options
const inst = await Soundfont.instrument(audioContext, 'steel_drums', {
  soundfont: 'MusyngKite',    // 'MusyngKite' | 'FluidR3_GM'
  format: 'mp3',              // 'mp3' | 'ogg'
  gain: 1,
  attack: 0.01,
  decay: 0.1,
  sustain: 0.9,
  release: 0.3,
  from: 'https://my-cdn.com/soundfonts/',  // custom sample source
});

// Drum kit: use 'percussion' channel or load specific percussion instruments
```

**Limitation:** Not true SoundFont (.sf2) parsing -- it uses pre-converted individual MP3/OGG files per note. For true SF2 loading, look at `sf2-parser` or `WebAudioFont`.

## 4. Elementary Audio

**What it is:** A functional reactive audio framework. You describe your audio graph as a pure function of time and parameters, and Elementary's rendering engine efficiently diffs and updates the underlying audio graph. Think React for audio.

**Architecture:**
- **Core Library (`@elemaudio/core`):** Pure JavaScript functions that describe audio signal graphs
- **Renderers:** Execute the graph on a backend:
  - `WebAudioRenderer` -- runs in browser via AudioWorklet
  - `NodeRenderer` -- runs in Node.js (offline processing, testing)
  - Native renderer -- C++ for desktop apps

```javascript
import { el } from '@elemaudio/core';
import { WebAudioRenderer } from '@elemaudio/web-renderer';

const ctx = new AudioContext();
const core = new WebAudioRenderer();

// Connect to audio output
const node = await core.initialize(ctx, {
  numberOfInputs: 0,
  numberOfOutputs: 1,
  outputChannelCount: [2],
});
node.connect(ctx.destination);

// Describe audio as function composition:

// Simple sine wave
core.render(el.cycle(440), el.cycle(440));  // left, right

// Drum synth: sine with pitch sweep and amplitude envelope
function kickDrum(trigger, pitch = 60, decay = 0.3) {
  // trigger = 0 or 1 signal
  const env = el.adsr(0.001, decay, 0, 0.01, trigger);
  const pitchEnv = el.adsr(0.001, 0.05, 0, 0.01, trigger);
  const freq = el.add(pitch, el.mul(pitch * 4, pitchEnv));
  return el.mul(el.cycle(freq), env);
}

// Noise snare
function snareDrum(trigger, decay = 0.15) {
  const env = el.adsr(0.001, decay, 0, 0.01, trigger);
  return el.mul(el.noise(), env);
}

// Hi-hat (filtered noise)
function hihat(trigger, decay = 0.05) {
  const env = el.adsr(0.001, decay, 0, 0.005, trigger);
  const noise = el.noise();
  const filtered = el.highpass(8000, 1, noise);
  return el.mul(filtered, env);
}

// Available Elementary primitives:
// Oscillators: el.cycle (sine), el.saw, el.square, el.triangle, el.noise, el.train (pulse)
// Filters: el.lowpass, el.highpass, el.bandpass, el.allpass, el.notch, el.peak, el.lowshelf, el.highshelf
// el.biquad -- generic biquad filter
// Math: el.add, el.sub, el.mul, el.div, el.mod, el.pow, el.sqrt, el.abs, el.min, el.max
// el.sin, el.cos, el.tan, el.tanh (waveshaping!)
// Delay: el.delay(size, delayTimeSamples, input), el.tapIn, el.tapOut (multi-tap)
// Dynamics: el.compress (compressor), el.env (envelope follower)
// Sampling: el.sample({path, channel}, trigger, rate), el.table (wavetable lookup)
// Signal: el.const(value), el.sr() (sample rate), el.time() (sample counter)
// el.select(gate, a, b) -- signal switch
// el.latch(trigger, input) -- sample and hold
// el.seq2({seq: [1,0,1,0], hold: true}, trigger) -- step sequencer!
// el.convolve({path}, input) -- convolution reverb
// el.metro({interval}) -- metronome trigger signal

// Render the mix
core.render(
  el.add(kickDrum(kickTrig), snareDrum(snareTrig), hihat(hihatTrig)),
  el.add(kickDrum(kickTrig), snareDrum(snareTrig), hihat(hihatTrig))
);
```

**Key advantage for drum machines:** `el.seq2` provides a built-in step sequencer primitive, and `el.metro` provides clock triggers. Combined, you can build an entire drum machine in the audio thread with zero main-thread scheduling jitter.

## 5. FAUST to WebAssembly Pipeline

**FAUST** (Functional AUdio STream) is a domain-specific language for audio DSP that compiles to highly optimized code for multiple targets including WebAssembly + AudioWorklet.

### Writing FAUST DSP

```faust
// kick.dsp -- Simple kick drum synthesizer
import("stdfaust.lib");

// Parameters
freq = hslider("freq", 60, 20, 200, 1);
decay = hslider("decay", 0.3, 0.01, 2, 0.01);
click = hslider("click", 0.5, 0, 1, 0.01);
gate = button("gate");

// Pitch envelope (exponential sweep down)
pitchEnv = en.are(0.001, decay * 0.2, gate);
oscFreq = freq + freq * 4 * pitchEnv;

// Amplitude envelope
ampEnv = en.are(0.001, decay, gate);

// Sine oscillator with drive
osc = os.osc(oscFreq);
driven = ma.tanh(osc * (1 + click * 5));

process = driven * ampEnv <: _, _;  // stereo output
```

### Compilation Pipeline

```bash
# Install FAUST
# macOS: brew install faust
# Or: https://faust.grame.fr/downloads/

# Compile to WebAssembly AudioWorklet
faust2wasm -worklet kick.dsp
# Produces:
#   kick.wasm           -- WebAssembly binary
#   kick.js             -- AudioWorklet processor wrapper
#   kick-node.js        -- AudioWorkletNode wrapper (main thread)

# Or compile to a standalone HTML page
faust2wasm -poly kick.dsp    # polyphonic version (for MIDI)

# Alternative: use faustwasm npm package for runtime compilation
npm install @grame/faustwasm
```

### Using in JavaScript

```javascript
// Option 1: Pre-compiled .wasm + generated JS wrappers
import createKickNode from './kick-node.js';

const ctx = new AudioContext();
const kick = await createKickNode(ctx, '/dsp/');
kick.connect(ctx.destination);

// Access FAUST parameters (auto-generated from hslider/button)
kick.setParamValue('/kick/freq', 80);
kick.setParamValue('/kick/decay', 0.5);
kick.setParamValue('/kick/gate', 1);  // trigger
setTimeout(() => kick.setParamValue('/kick/gate', 0), 10);

// Option 2: Runtime compilation with @grame/faustwasm
import { instantiateFaustModuleFromFile, FaustMonoDspGenerator } from '@grame/faustwasm';

const faustModule = await instantiateFaustModuleFromFile('/path/to/libfaust-wasm.js');
const generator = new FaustMonoDspGenerator();
await generator.compile(faustModule, 'kick', `
  import("stdfaust.lib");
  freq = hslider("freq", 60, 20, 200, 1);
  decay = hslider("decay", 0.3, 0.01, 2, 0.01);
  gate = button("gate");
  ampEnv = en.are(0.001, decay, gate);
  process = os.osc(freq) * ampEnv <: _, _;
`);

const node = await generator.createNode(ctx);
node.connect(ctx.destination);

// Option 3: Wrap as WAM plugin
// Use @nicholasgriffintn/faust-wam or similar wrapper to package
// FAUST DSP as a WAM 2.0 plugin with full parameter/event support
```

**Performance:** FAUST-compiled WebAssembly runs at near-native speed (~1.2-1.5x overhead). The compiler applies aggressive optimizations: loop vectorization, constant folding, dead code elimination. A typical FAUST effect uses 5-20% of the CPU compared to equivalent hand-written JavaScript AudioWorklet code.

### FAUST Libraries Available

```faust
import("stdfaust.lib");  // includes all of:
// os.lib  -- oscillators: osc, sawtooth, square, triangle, impulse, noise
// fi.lib  -- filters: lowpass, highpass, bandpass, resonlp, resonhp, dcblocker
// en.lib  -- envelopes: adsr, asr, are (attack-release exponential), smoothEnvelope
// ef.lib  -- effects: echo, flanger, phaser, chorus, compressor, limiter
// de.lib  -- delays: delay, fdelay (fractional), sdelay (smooth)
// an.lib  -- analyzers: rms, amp_follower, spectral analysis
// ma.lib  -- math: tanh, clip, SR (sample rate), PI
// re.lib  -- reverbs: mono_freeverb, stereo_freeverb, jcrev, zita_rev1
// ve.lib  -- virtual analog: moog_vcf, wah, crybaby, diodeLadder
// no.lib  -- noise generators: noise, pink_noise, lfnoise
// ba.lib  -- basics: beat, countdown, pulse, if-then-else
// si.lib  -- signal: bus, block, smooth (one-pole smoothing)
// dm.lib  -- demos: complete effects and instruments
```

## 6. lamejs -- MP3 Encoding in JavaScript

**What it is:** A pure JavaScript LAME MP3 encoder. Port of the LAME C library to JavaScript. Runs entirely in the browser -- no server needed. Useful for exporting drum patterns as MP3 files.

```javascript
import lamejs from 'lamejs';

// Encode a Tone.js offline render to MP3
async function exportToMp3(toneAudioBuffer, bitrate = 128) {
  const channels = toneAudioBuffer.numberOfChannels;
  const sampleRate = toneAudioBuffer.sampleRate;
  const samples = toneAudioBuffer.length;

  // Initialize encoder
  const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);
  // channels: 1 (mono) or 2 (stereo)
  // sampleRate: 44100, 48000, etc.
  // bitrate: 64, 96, 128, 192, 256, 320 (kbps)

  const mp3Data = [];

  // Convert Float32 to Int16 (lamejs requires Int16)
  const leftF32 = toneAudioBuffer.getChannelData(0);
  const rightF32 = channels > 1 ? toneAudioBuffer.getChannelData(1) : leftF32;

  const leftI16 = new Int16Array(samples);
  const rightI16 = new Int16Array(samples);

  for (let i = 0; i < samples; i++) {
    leftI16[i] = Math.max(-32768, Math.min(32767, Math.round(leftF32[i] * 32767)));
    rightI16[i] = Math.max(-32768, Math.min(32767, Math.round(rightF32[i] * 32767)));
  }

  // Encode in chunks (1152 samples per frame for MP3)
  const CHUNK_SIZE = 1152;
  for (let i = 0; i < samples; i += CHUNK_SIZE) {
    const leftChunk = leftI16.subarray(i, Math.min(i + CHUNK_SIZE, samples));
    const rightChunk = rightI16.subarray(i, Math.min(i + CHUNK_SIZE, samples));

    let mp3buf;
    if (channels === 2) {
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    }

    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  // Flush remaining data
  const end = mp3encoder.flush();
  if (end.length > 0) {
    mp3Data.push(end);
  }

  // Create blob for download
  const blob = new Blob(mp3Data, { type: 'audio/mp3' });
  return blob;
}

// Usage with Tone.js offline rendering:
async function bounceAndExport(duration) {
  const buffer = await Tone.Offline(({ transport }) => {
    // Set up your drum pattern here
    const kick = new Tone.MembraneSynth().toDestination();
    const seq = new Tone.Sequence((time) => {
      kick.triggerAttackRelease('C1', '8n', time);
    }, [0, null, null, null], '4n').start(0);
    transport.start(0);
  }, duration);

  const mp3Blob = await exportToMp3(buffer);

  // Trigger download
  const url = URL.createObjectURL(mp3Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'drum-pattern.mp3';
  a.click();
  URL.revokeObjectURL(url);
}
```

**Encoder options (via constructor):**
- Channels: 1 (mono) or 2 (stereo)
- Sample rate: 8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000
- Bitrate: 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320 kbps
- VBR mode not directly exposed; CBR encoding

**Performance:** Encoding is CPU-intensive. A 4-second stereo loop at 44.1kHz/128kbps takes ~50-200ms on modern hardware. Use a Web Worker for non-blocking export:

```javascript
// worker.js
importScripts('lamejs.min.js');

self.onmessage = function(e) {
  const { leftChannel, rightChannel, sampleRate, bitrate } = e.data;
  const encoder = new lamejs.Mp3Encoder(2, sampleRate, bitrate);
  // ... encode ...
  self.postMessage({ mp3Blob });
};
```

## 7. Meyda -- Audio Feature Extraction

**What it is:** A JavaScript library for extracting audio features in real-time or offline. Useful for visualizations, beat detection, spectral analysis, and adaptive effects.

### Available Features

```javascript
import Meyda from 'meyda';

// All extractable features:
const features = [
  'rms',                    // Root Mean Square (loudness/energy)
  'energy',                 // Total energy of the signal
  'zcr',                    // Zero Crossing Rate (noise vs tone indicator)
  'amplitudeSpectrum',      // Magnitude spectrum (Float32Array)
  'powerSpectrum',          // Power spectrum (Float32Array)
  'spectralCentroid',       // "Brightness" -- weighted mean frequency
  'spectralFlatness',       // Noise vs tone (1 = white noise, 0 = pure tone)
  'spectralSlope',          // Spectral tilt (positive = more high freq)
  'spectralRolloff',        // Frequency below which N% of energy is concentrated
  'spectralSpread',         // Bandwidth around centroid
  'spectralSkewness',       // Asymmetry of spectrum
  'spectralKurtosis',       // "Peakedness" of spectrum
  'loudness',               // { specific: Float32Array, total: number } (Zwicker model)
  'perceptualSpread',       // Bandwidth of loudness distribution
  'perceptualSharpness',    // Psychoacoustic sharpness
  'mfcc',                   // Mel-Frequency Cepstral Coefficients (13 coefficients)
                            // -- the gold standard for timbre characterization
  'chroma',                 // Chromagram (12 pitch classes, C through B)
  'buffer',                 // Raw time-domain buffer
  'complexSpectrum',        // Complex FFT output { real, imag }
];
```

### Real-Time Extraction (Online)

```javascript
const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(stream); // or any AudioNode

const analyzer = Meyda.createMeydaAnalyzer({
  audioContext,
  source,
  bufferSize: 512,           // 256 | 512 | 1024 | 2048 (power of 2)
                             // smaller = more responsive, less frequency resolution
  featureExtractors: ['rms', 'spectralCentroid', 'mfcc', 'zcr'],
  callback: (features) => {
    // Called every bufferSize samples
    console.log('RMS:', features.rms);
    console.log('Brightness:', features.spectralCentroid);
    console.log('MFCC:', features.mfcc); // array of 13 coefficients
    console.log('ZCR:', features.zcr);

    // Use for:
    // - VU meter visualization (rms)
    // - Spectral display (amplitudeSpectrum)
    // - Beat detection (track rms peaks over time)
    // - Adaptive effects (spectralCentroid controlling filter cutoff)
  },
  numberOfMFCCCoefficients: 13,  // default: 13
  sampleRate: audioContext.sampleRate,
});

analyzer.start();
// ... later
analyzer.stop();
```

### Offline Extraction

```javascript
// Extract features from a pre-recorded buffer
const features = Meyda.extract(
  ['rms', 'spectralCentroid', 'zcr'],
  audioBuffer.getChannelData(0).slice(0, 512)  // must be bufferSize length
);
// features = { rms: 0.23, spectralCentroid: 1523.4, zcr: 42 }

// Windowing functions available:
Meyda.windowing = 'hanning';   // 'hanning' | 'hamming' | 'blackman' | 'sine' | 'rect'
```

### Drum Machine Applications

```javascript
// Beat detection using RMS envelope following
class BeatDetector {
  constructor(audioContext, source) {
    this.history = [];
    this.threshold = 0;

    this.analyzer = Meyda.createMeydaAnalyzer({
      audioContext,
      source,
      bufferSize: 512,
      featureExtractors: ['rms'],
      callback: ({ rms }) => {
        this.history.push(rms);
        if (this.history.length > 43) this.history.shift(); // ~1 second at 44100/512

        const avg = this.history.reduce((a, b) => a + b, 0) / this.history.length;
        const variance = this.history.reduce((sum, val) => sum + (val - avg) ** 2, 0) / this.history.length;
        this.threshold = avg + Math.sqrt(variance) * 1.5;

        if (rms > this.threshold && rms > 0.01) {
          this.onBeat?.(rms);
        }
      },
    });
    this.analyzer.start();
  }
}

// Spectral analysis for drum sound classification
function classifyDrumHit(spectrum) {
  const lowEnergy = spectrum.slice(0, 10).reduce((a, b) => a + b, 0);
  const midEnergy = spectrum.slice(10, 50).reduce((a, b) => a + b, 0);
  const highEnergy = spectrum.slice(50, 200).reduce((a, b) => a + b, 0);

  if (lowEnergy > midEnergy * 3 && lowEnergy > highEnergy * 5) return 'kick';
  if (midEnergy > lowEnergy && highEnergy > lowEnergy) return 'snare';
  if (highEnergy > midEnergy * 2 && highEnergy > lowEnergy * 5) return 'hihat';
  return 'unknown';
}
```

---

## Quick Comparison Matrix

| Library | Size | Synthesis | Sampling | Effects | Scheduling | MIDI | Best For |
|---------|------|-----------|----------|---------|------------|------|----------|
| **Tone.js** | ~150KB | Full | Yes | Full chain | Transport + musical time | No native | Complete music apps |
| **WAM 2.0** | SDK ~30KB | Via plugins | Via plugins | Via plugins | Via transport events | Full MIDI | Plugin ecosystems |
| **Howler.js** | ~7KB | No | Yes (sprites) | No | Basic | No | Simple playback |
| **Elementary** | ~50KB | Functional DSP | el.sample | Built-in primitives | el.metro + el.seq2 | No native | Audio-thread DSP |
| **FAUST** | Varies | Full DSP language | Via tables | Full DSP | External | Via WAM wrapper | High-perf DSP |
| **standardized-audio-context** | ~25KB | Via Web Audio | Via Web Audio | Via Web Audio | Via Web Audio | No | Cross-browser compat |
| **soundfont-player** | ~5KB | No | GM SoundFonts | No | Basic schedule | Instrument-level | Quick instrument access |
| **lamejs** | ~180KB | No | No | No | No | No | MP3 export |
| **Meyda** | ~15KB | No | No | No | No | No | Audio analysis |

---

## Recommended Architecture for a Professional Drum Machine

```
┌──────────────────────────────────────────────────────────────┐
│                        UI Layer                               │
│    React/Svelte/Vanilla -- Step Sequencer Grid, Knobs, Pads  │
├──────────────────────────────────────────────────────────────┤
│                     Tone.js Transport                         │
│    Master clock, BPM, time signature, swing, scheduling      │
├──────────────────────────────────────────────────────────────┤
│                    Sound Engine (choose one)                  │
│                                                              │
│  Option A: Tone.js instruments                               │
│    MembraneSynth (kicks), NoiseSynth (snares),               │
│    MetalSynth (hats), Player/Sampler (samples)               │
│                                                              │
│  Option B: WAM 2.0 plugins                                   │
│    Load drum synth WAMs, connect via WAM event routing       │
│    Supports third-party plugin loading                        │
│                                                              │
│  Option C: Elementary Audio                                   │
│    Functional DSP in AudioWorklet                            │
│    el.seq2 + el.metro for zero-jitter sequencing             │
│                                                              │
│  Option D: FAUST → WebAssembly                               │
│    Write drum synths in FAUST, compile to AudioWorklet       │
│    Near-native performance                                    │
├──────────────────────────────────────────────────────────────┤
│                    Effects Chain                              │
│    Tone.js effects OR WAM effect plugins                     │
│    Per-track: EQ, Compression, Distortion                    │
│    Master bus: Limiter, Reverb send, Compressor              │
├──────────────────────────────────────────────────────────────┤
│                    Export / Analysis                           │
│    lamejs for MP3 export                                     │
│    Tone.Offline for WAV bounce                               │
│    Meyda for visualization / beat detection                  │
├──────────────────────────────────────────────────────────────┤
│                    Web Audio API                              │
│    AudioContext, AudioWorklet, AudioBuffer                    │
└──────────────────────────────────────────────────────────────┘
```

**Pragmatic recommendation:** Start with **Tone.js** for the transport, scheduling, and built-in instruments/effects. It covers 90% of drum machine needs. Add **lamejs** for MP3 export and **Meyda** for visualizations. Consider WAM 2.0 or Elementary Audio only if you need a plugin ecosystem or ultra-low-jitter audio-thread sequencing.
