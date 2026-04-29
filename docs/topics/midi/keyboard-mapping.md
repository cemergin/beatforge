# Web-Based Drum Machine: Keyboard Control Reference

A comprehensive product design reference for making a web-based drum machine fully playable and controllable via computer keyboard.

---

## Table of Contents

1. [Keyboard-as-Instrument](#1-keyboard-as-instrument)
2. [Keyboard Shortcuts for Production](#2-keyboard-shortcuts-for-production)
3. [JavaScript Implementation](#3-javascript-implementation)
4. [Computer Keyboard as Performance Tool](#4-computer-keyboard-as-performance-tool)
5. [Recommended Keybinding Tables](#5-recommended-keybinding-tables)
6. [Complete JavaScript Implementation Examples](#6-complete-javascript-implementation-examples)

---

## 1. Keyboard-as-Instrument

### 1.1 How Existing Software Maps QWERTY to Drum Pads

#### Ableton Live (Computer MIDI Keyboard)

Ableton uses a piano-chromatic layout across the QWERTY keyboard:

| Row | Keys | Function |
|-----|-------|----------|
| Middle row | A S D F G H J K | White keys (C D E F G A B C) |
| Top row | W E T Y U | Black keys (C# D# F# G# A#) |
| Bottom row | Z / X | Octave down / Octave up |
| Bottom row | C / V | Velocity down / Velocity up |

The Drum Rack maps instruments chromatically starting at C1. Since the computer keyboard defaults to C3, you must press Z twice to reach the drum rack's first pad. This is a known friction point -- the chromatic piano layout does not map intuitively to a 4x4 drum pad grid.

**Key insight:** Ableton prioritizes musical/chromatic consistency over drum-specific ergonomics.

#### FL Studio (Channel Rack / FPC)

FL Studio takes a different approach with its step sequencer and FPC:

- **Channel Rack**: Uses number keys 1-9 to select patterns. The typing keyboard triggers notes chromatically similar to Ableton.
- **FPC Plugin**: Has a dedicated "MIDI Note Learn" mode -- click a pad, click "Learn", then press any key to assign it. Supports "Map notes for entire bank" for batch assignment.
- **Step Sequencer**: Left-click toggles steps on/off. The keyboard is primarily used for navigation and transport rather than live triggering.

**Key insight:** FL Studio emphasizes assignability and step-entry workflow over live keyboard performance.

#### Logic Pro (Musical Typing)

Activated via Command-K, Musical Typing uses:

| Row | Keys | Function |
|-----|-------|----------|
| Middle row | A S D F G H J K L | White keys starting at C |
| Top row | W E R T Y U I O P | Black keys (sharps/flats) |
| Z / X | | Octave down / up |
| C / V | | Velocity down / up |
| 1 / 2 | | Pitch bend down / up |
| 3 | | Mod wheel off |
| 4-8 | | Mod wheel increments |

**Key insight:** Logic adds pitch bend and mod wheel controls to the keyboard, useful for expressive drum performance (e.g., controlling hi-hat openness via mod wheel mapped to notes 4-8).

#### Native Instruments Maschine (Software Mode)

Maschine's software has a computer keyboard MIDI input mode:

- **Pad Mode (default)**: Each key maps to a different sound in the group (like a drum kit)
- **Keyboard Mode**: Pads represent 16 chromatic pitches for a single sound
- **Chord Mode**: Single pad triggers chord voicings

**Key insight:** Maschine separates "trigger different sounds" mode from "play one sound melodically" mode -- a useful conceptual split for web drum machines.

#### Online Tools

**Drumbit** (drumbit.app):
- Arrow keys navigate the step grid
- X or Numpad 0 toggles steps on/off
- Numpad 1-4 switches patterns
- Ctrl+C / Ctrl+V for copy/paste
- Has a dedicated "Keys Mode" for QWERTY triggering

**Sampulator**:
- Full QWERTY keyboard mapped to samples
- Color-coded by sound type (percussion, keys, vocals)
- Shift starts recording
- Alt+drag copies sounds in the grid
- 46 samples spread across the entire keyboard

**drum-pad.com**:
- Uses W A S D J K L keys for core drum sounds
- Minimal mapping focused on two-hand split

### 1.2 Ergonomic Layout Considerations

#### Physical Keyboard Zones

```
Zone 1 (Left hand - home position):
  Top:    Q  W  E  R  T
  Home:   A  S  D  F  G
  Bottom: Z  X  C  V  B

Zone 2 (Right hand - home position):
  Top:    Y  U  I  O  P
  Home:   H  J  K  L  ;
  Bottom: N  M  ,  .  /

Zone 3 (Thumbs):
  Space bar

Zone 4 (Pinkies - modifiers):
  Shift, Ctrl, Alt (left)
  Shift, Ctrl, Alt (right)
```

#### Reachability Tiers

**Tier 1 -- Easiest to reach (home row, index/middle fingers):**
- Left: D, F, S, E, R
- Right: J, K, L, I, O

**Tier 2 -- Comfortable reach:**
- Left: A, W, C, V, G, T
- Right: H, U, M, ;, N, P

**Tier 3 -- Stretch required:**
- Left: Q, Z, X, B
- Right: Y, ,, ., /

**Recommendation for drum layout:**
- Map the most-hit drums (kick, snare, hi-hat) to Tier 1 keys
- Map secondary percussion (toms, cymbals) to Tier 2
- Keep modifiers (Shift, Ctrl) for velocity layers
- Reserve Space for play/stop (most natural "big button")

#### Two-Hand Drumming Patterns

Real drumming splits between hands. Optimal QWERTY mapping should mirror this:

```
LEFT HAND (hi-hat/snare territory):    RIGHT HAND (kick/toms/cymbals):
  Q  W  E  R                              U  I  O  P
  A  S  D  F                              J  K  L  ;
  Z  X  C  V                              M  ,  .  /
```

This allows:
- Left hand plays hi-hat patterns (e.g., D for closed, E for open)
- Right hand plays kick and snare (e.g., K for kick, J for snare)
- Both hands can hit simultaneously (keyboard rollover permitting)
- Mirrors the real hand independence a drummer develops

### 1.3 Velocity Simulation on Keyboard

Standard computer keyboards are binary switches -- they report only pressed/not-pressed, with no pressure sensitivity. Approaches to simulate velocity:

#### Approach 1: Fixed Velocity
- All hits play at a single velocity (e.g., 100 out of 127)
- Simplest implementation
- Best for step programming, not performance

#### Approach 2: Modifier Keys for Velocity Layers

| Modifier | Velocity | Use Case |
|----------|----------|----------|
| Ctrl + key | 40 (soft / ghost note) | Ghost notes, subtle textures |
| No modifier | 100 (medium) | Normal playing |
| Shift + key | 127 (hard / accent) | Accents, emphasis |
| Alt + key | 70 (medium-soft) | Optional fourth layer |

**Pros:** Intuitive, only 2-3 velocity values needed for realistic patterns.
**Cons:** Modifier keys on some OSes trigger system actions (Ctrl, Alt menus).

#### Approach 3: Alternating / Humanize Velocity
- Auto-vary velocity within a range (e.g., 90-110) with slight randomization
- Can alternate between two values for hi-hat patterns (accent every other hit)
- Mimics natural human inconsistency

#### Approach 4: Velocity Mode Toggle
- Press a key (e.g., V) to cycle through velocity levels: soft -> medium -> hard
- Current velocity shown in UI
- All subsequent hits use that velocity until changed

#### Approach 5: Rapid Double-Tap for Accent
- Single press = normal velocity
- Double-tap within 80ms = accent velocity
- Requires careful timing threshold tuning

**Recommendation:** Combine Approach 2 (modifier keys) with Approach 3 (slight randomization). Shift = accent, no modifier = normal with +/- 10 random variation, Ctrl = ghost. This gives the best balance of control and realism.

### 1.4 Key Repeat and Debouncing

When a key is held down, the OS generates repeated `keydown` events after an initial delay. The `KeyboardEvent.repeat` property distinguishes the first press from auto-repeats.

#### The Problem
```
User holds 'D' (hi-hat):
  keydown {key: 'd', repeat: false}  // Initial press
  keydown {key: 'd', repeat: true}   // ~500ms later (OS repeat delay)
  keydown {key: 'd', repeat: true}   // ~33ms later (OS repeat rate)
  keydown {key: 'd', repeat: true}   // ...continues
  keyup   {key: 'd'}                 // Release
```

Without handling, each repeat event would retrigger the sound, creating an uncontrolled machine-gun effect.

#### Solution 1: Ignore Repeats (One-Shot Mode)
```javascript
document.addEventListener('keydown', (e) => {
  if (e.repeat) return; // Ignore OS key repeat
  triggerDrum(e.code);
});
```
Best for: Drum hits that should play once per keypress.

#### Solution 2: Controlled Retrigger (Note Repeat Mode)
```javascript
// Use key repeat intentionally but at a musical rate
const repeatIntervals = { '1/4': 500, '1/8': 250, '1/16': 125, '1/32': 62.5 };
let repeatTimer = null;

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  triggerDrum(e.code);
  // Start musical repeat while held
  repeatTimer = setInterval(() => triggerDrum(e.code), repeatIntervals['1/16']);
});

document.addEventListener('keyup', (e) => {
  clearInterval(repeatTimer);
});
```
Best for: Drum rolls, hi-hat patterns, note repeat features.

### 1.5 Multi-Key Simultaneous Press (Polyphonic Input)

Detecting multiple simultaneous keys is essential for playing kick + hi-hat together, or any chord-like drum hit.

#### Implementation: Key State Map
```javascript
const keysPressed = new Set();

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  keysPressed.add(e.code);
  triggerDrum(e.code);
});

document.addEventListener('keyup', (e) => {
  keysPressed.delete(e.code);
});

// Check state anytime:
function isKeyHeld(code) {
  return keysPressed.has(code);
}
```

This lets you detect that both `KeyD` (hi-hat) and `KeyK` (kick) are held simultaneously.

### 1.6 Ghost Key Limitations (Key Rollover)

#### The Physics Problem

Most consumer keyboards use a **key matrix** -- rows and columns of wires with switches at intersections. When three keys that form an "L" or rectangle in the matrix are pressed, the keyboard may:

1. **Ghost**: Report a fourth key as pressed (one that wasn't actually pressed)
2. **Block/Jam**: Refuse to register the third key at all

#### Rollover Ratings

| Type | Simultaneous Keys | Typical Hardware |
|------|-------------------|------------------|
| 2KRO | 2 keys | Cheapest keyboards |
| 6KRO | 6 keys | Standard USB keyboards |
| NKRO | Unlimited | Mechanical/gaming keyboards |

**Note:** USB HID protocol limits standard keyboards to 6KRO (6 simultaneous non-modifier keys + any modifier keys). PS/2 protocol supports true NKRO.

#### Safe Combinations for Drum Machines

Modifier keys (Shift, Ctrl, Alt) are on separate circuits and **never ghost**. Additionally, these key groups are generally safe to combine on most keyboards:

- Keys in the same row rarely ghost with each other
- WASD + JKL is a common safe combo (games rely on this)
- Space + any letter is almost always safe
- F-keys are usually on a separate circuit

#### Design Recommendations

1. Map core drum sounds to keys known to work together (D, F, J, K, Space)
2. Warn users in documentation that cheap keyboards may limit simultaneous hits
3. Test your default mapping on a variety of keyboards
4. Avoid requiring 4+ simultaneous letter keys from the same matrix region
5. Consider a "keyboard test" mode that shows which combos work on the user's hardware

---

## 2. Keyboard Shortcuts for Production

### 2.1 Transport Controls

Based on conventions from Ableton, FL Studio, Logic Pro, Bitwig, and Reason:

| Action | Recommended Key | Ableton | FL Studio | Logic Pro | Bitwig |
|--------|----------------|---------|-----------|-----------|--------|
| Play / Pause | Space | Space | Space | Space | Space |
| Stop | Space (double) | Space | Space | 0 (numpad) | Space |
| Record | R | F9 | R | R / * | F9 |
| Loop toggle | L | Ctrl+L | / | C | -- |
| Tempo up (+1 BPM) | ] | -- | -- | -- | -- |
| Tempo down (-1 BPM) | [ | -- | -- | -- | -- |
| Tempo up (+10 BPM) | Shift+] | -- | -- | -- | -- |
| Tempo down (-10 BPM) | Shift+[ | -- | -- | -- | -- |
| Metronome toggle | M | -- | -- | K | -- |
| Tap tempo | T | -- | -- | -- | -- |

### 2.2 Pattern Navigation

| Action | Recommended Key | Notes |
|--------|----------------|-------|
| Next pattern | PageDown or Shift+Right | Move to next pattern slot |
| Previous pattern | PageUp or Shift+Left | Move to previous pattern slot |
| Select pattern by number | 1-9 | Direct pattern selection (FL Studio convention) |
| Duplicate pattern | Ctrl+D | Copy current pattern to next empty slot |
| Clear pattern | Ctrl+Backspace | Clear all steps in current pattern |
| Rename pattern | F2 | Standard rename convention |

### 2.3 Step Editing (Grid Navigation)

| Action | Recommended Key | Notes |
|--------|----------------|-------|
| Move cursor right | Right Arrow | Next step |
| Move cursor left | Left Arrow | Previous step |
| Move cursor up | Up Arrow | Previous track/instrument |
| Move cursor down | Down Arrow | Next track/instrument |
| Toggle step on/off | Enter or X | Activate/deactivate step |
| Increase step velocity | Shift+Up | +10 velocity |
| Decrease step velocity | Shift+Down | -10 velocity |
| Set step velocity soft | 1 (in velocity mode) | Velocity = 40 |
| Set step velocity medium | 2 (in velocity mode) | Velocity = 100 |
| Set step velocity hard | 3 (in velocity mode) | Velocity = 127 |
| Jump to first step | Home | |
| Jump to last step | End | |
| Select range | Shift+Arrow | Extend selection |
| Copy selection | Ctrl+C | |
| Paste selection | Ctrl+V | |
| Cut selection | Ctrl+X | |
| Undo | Ctrl+Z | |
| Redo | Ctrl+Shift+Z or Ctrl+Y | |
| Select all steps in track | Ctrl+A | |
| Delete selected steps | Delete or Backspace | |

### 2.4 Sound / Track Selection

| Action | Recommended Key | Notes |
|--------|----------------|-------|
| Next track | Down or Tab | Cycle through instruments |
| Previous track | Up or Shift+Tab | |
| Mute track | Ctrl+M or click | Toggle mute for focused track |
| Solo track | Ctrl+S override or S | Toggle solo |
| Select track 1-8 | Alt+1 through Alt+8 | Direct track selection |

### 2.5 View Switching

| Action | Recommended Key | Notes |
|--------|----------------|-------|
| Grid / Sequencer view | F1 | Main step sequencer |
| Pad view | F2 | Pad performance view |
| Mixer view | F3 | Volume/pan/effects |
| Song / Arrangement view | F4 | Chain patterns into song |
| Settings / Kit view | F5 | Sample assignment, tuning |
| Toggle sidebar | B | Browser/sample browser |
| Fullscreen | F11 | |

### 2.6 Modifier Workflows

| Modifier Pattern | Action | Convention Source |
|-----------------|--------|-------------------|
| Click | Select single item | Universal |
| Shift+Click | Range select (from last click) | Ableton, FL Studio, Logic |
| Ctrl+Click (Cmd+Click) | Add to / remove from selection | Universal |
| Alt+Drag | Duplicate/copy while dragging | Ableton, Logic |
| Shift+Drag | Constrain to axis (H or V) | Design tools convention |
| Ctrl+Drag | Fine adjustment | Ableton (fine tempo, volume) |
| Double-click | Edit value / rename | Universal |
| Right-click | Context menu | Universal |

### 2.7 DAW Shortcut Scheme Comparison

**Common patterns across all DAWs:**
- Space = play/stop (universal)
- Ctrl+Z = undo (universal)
- Ctrl+C/V/X = copy/paste/cut (universal)
- Arrow keys = navigation (universal)
- Tab = switch view or cycle focus (Ableton, FL Studio)

**Divergences:**
- Record: R (Logic, FL Studio) vs F9 (Ableton, Bitwig)
- Loop: L (custom) vs Ctrl+L (Ableton) vs / (FL Studio)
- Metronome: varies wildly (no consensus)

### 2.8 Vim-Like Modal Editing for Power Users

Modal editing enables single-key shortcuts without modifiers, dramatically speeding up workflow for experienced users.

#### Mode Design

| Mode | Entry Key | Indicator Color | Purpose |
|------|-----------|----------------|---------|
| **Normal** (default) | Escape | Blue | Navigation, transport, view switching |
| **Insert** | I | Green | Step entry -- keys trigger drum sounds and write to grid |
| **Velocity** | V | Orange | Arrow keys / number keys adjust velocity of selected steps |
| **Probability** | P | Purple | Adjust probability of selected steps (for generative patterns) |
| **Select** | S | Yellow | Arrow keys extend selection, d = delete, y = yank/copy |
| **Timing** | T | Red | Micro-adjust timing offset of selected steps (humanize) |

#### Normal Mode Key Map

| Key | Action |
|-----|--------|
| h / l | Move left / right (previous / next step) |
| j / k | Move down / up (next / previous track) |
| i | Enter Insert mode |
| v | Enter Velocity mode |
| p | Enter Probability mode (or paste after yank) |
| s | Enter Select mode |
| x | Toggle current step on/off |
| dd | Delete current track's pattern |
| yy | Yank (copy) current track's pattern |
| u | Undo |
| Ctrl+R | Redo |
| Space | Play / Stop |
| . | Repeat last action |
| / | Search / filter sounds |
| : | Command palette (e.g., `:bpm 120`, `:kit 808`) |
| gg | Jump to first step |
| G | Jump to last step |
| 0 | Jump to beginning of current bar |
| $ | Jump to end of current bar |

#### Velocity Mode Key Map

| Key | Action |
|-----|--------|
| 1-9 | Set velocity (1=14, 2=28, ... 9=127) |
| + / - | Increment / decrement by 10 |
| h | Humanize (add +/- random variation) |
| Escape | Return to Normal mode |

#### Command Palette Examples

```
:bpm 140          -- Set tempo to 140
:swing 60         -- Set swing to 60%
:kit 808          -- Load 808 kit
:save mybeat      -- Save pattern
:export wav       -- Export as WAV
:length 32        -- Set pattern to 32 steps
:scale 1/16       -- Set step resolution
```

---

## 3. JavaScript Implementation

### 3.1 KeyboardEvent Handling

#### `key` vs `code` Properties

| Property | Value for QWERTY 'A' | Value for AZERTY 'A' position | Use Case |
|----------|----------------------|-------------------------------|----------|
| `event.key` | "a" | "q" | Text input, character-aware |
| `event.code` | "KeyA" | "KeyA" | **Physical position -- use this for instruments** |
| `event.keyCode` | 65 | 65 | Deprecated, avoid |

**Always use `event.code` for drum machine mappings.** It refers to the physical key position regardless of keyboard layout (QWERTY, AZERTY, Dvorak, etc.). A French user's physical 'A' key will report `code: "KeyQ"` but you want to map by position, not by letter.

#### Event Flow

```
keydown  --> fires when key is first pressed (use for triggering sounds)
keydown  --> fires repeatedly if key is held (repeat = true)
keyup    --> fires when key is released (use for stopping sustain / note-off)
```

### 3.2 Preventing Default Browser Shortcuts

Certain key combinations trigger browser actions that must be intercepted:

| Shortcut | Default Browser Action | Can Override? |
|----------|----------------------|---------------|
| Space | Scroll page down | Yes |
| Ctrl+S | Save page | Yes |
| Ctrl+Z | Browser undo | Yes |
| Ctrl+P | Print | Yes (most browsers) |
| Ctrl+W | Close tab | **No** -- cannot intercept |
| Ctrl+T | New tab | **No** -- cannot intercept |
| Ctrl+N | New window | **No** -- cannot intercept |
| F5 | Refresh | Yes |
| F11 | Fullscreen | Browser-dependent |
| Alt+F4 | Close window (Windows) | **No** |
| Cmd+Q | Quit app (macOS) | **No** |

```javascript
document.addEventListener('keydown', (e) => {
  // Prevent Space from scrolling
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
  }

  // Prevent Ctrl+S from saving
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
    e.preventDefault();
    saveProject(); // Your save function
  }

  // Prevent Ctrl+Z from browser undo
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
  }
});
```

**Important caveat:** Overriding Ctrl+S, Ctrl+Z, etc. only works when the document/app has focus. Some browsers (especially Chrome) may still intercept certain combos in some contexts. Always provide alternative controls (toolbar buttons) as fallback.

### 3.3 Managing Keyboard State

```javascript
class KeyboardStateManager {
  constructor() {
    this.keysDown = new Map(); // code -> { timestamp, velocity }
    this.mode = 'normal'; // For vim-like modal editing

    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    // Handle window losing focus -- release all keys
    window.addEventListener('blur', this.releaseAll.bind(this));
  }

  handleKeyDown(e) {
    if (e.repeat) return; // Ignore OS key repeat by default

    this.keysDown.set(e.code, {
      timestamp: performance.now(),
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey || e.metaKey,
      altKey: e.altKey,
    });
  }

  handleKeyUp(e) {
    this.keysDown.delete(e.code);
  }

  releaseAll() {
    // When user Alt-Tabs away, release everything
    for (const code of this.keysDown.keys()) {
      this.keysDown.delete(code);
    }
  }

  isDown(code) {
    return this.keysDown.has(code);
  }

  getHeldKeys() {
    return [...this.keysDown.keys()];
  }

  getHoldDuration(code) {
    const entry = this.keysDown.get(code);
    if (!entry) return 0;
    return performance.now() - entry.timestamp;
  }
}
```

The `window.blur` handler is critical -- without it, if a user holds a key and Alt-Tabs away, the `keyup` event never fires and the app thinks the key is still held.

### 3.4 Hold-to-Retrigger (Note Repeat)

```javascript
class NoteRepeat {
  constructor(audioEngine, bpm = 120) {
    this.audioEngine = audioEngine;
    this.bpm = bpm;
    this.division = 16; // 1/16 note
    this.activeRepeats = new Map(); // code -> intervalId
    this.enabled = false;
  }

  get intervalMs() {
    // Calculate interval from BPM and division
    const beatMs = 60000 / this.bpm;
    return (beatMs * 4) / this.division; // 4 = whole note
  }

  startRepeat(code, drumId) {
    if (this.activeRepeats.has(code)) return;

    // Trigger immediately
    this.audioEngine.trigger(drumId);

    // Then repeat at division rate
    const id = setInterval(() => {
      this.audioEngine.trigger(drumId);
    }, this.intervalMs);

    this.activeRepeats.set(code, id);
  }

  stopRepeat(code) {
    const id = this.activeRepeats.get(code);
    if (id) {
      clearInterval(id);
      this.activeRepeats.delete(code);
    }
  }

  stopAll() {
    for (const [code, id] of this.activeRepeats) {
      clearInterval(id);
    }
    this.activeRepeats.clear();
  }

  setDivision(div) {
    this.division = div;
    // Restart all active repeats with new timing
    const active = [...this.activeRepeats.keys()];
    this.stopAll();
    // Re-triggering would need drum ID mapping -- simplified here
  }
}
```

### 3.5 Low-Latency Key-to-Sound Triggering

The key to low-latency audio is using the **Web Audio API** directly, not `<audio>` elements.

#### Architecture

```
KeyboardEvent -> Lookup drum mapping -> Create AudioBufferSourceNode
     |                                        |
     v                                        v
  ~1-3ms                              Connect to AudioContext.destination
  (event dispatch)                            |
                                              v
                                        Call .start(0)
                                              |
                                              v
                                        ~3-10ms to speaker
                                        (depending on buffer size)
```

Total latency budget: **5-15ms** (well under the 20ms perceptual threshold).

#### Critical Implementation Details

1. **Pre-decode all samples** at app startup into `AudioBuffer` objects
2. **Create a new `AudioBufferSourceNode`** for each hit (they are one-shot and lightweight)
3. **Never use `setTimeout` or `setInterval`** for timing audio -- use `AudioContext.currentTime`
4. **Resume AudioContext on first user gesture** (browsers require this)
5. **Use `playbackRate` for pitch adjustment** rather than re-decoding

### 3.6 Focus Management

#### The Problem

If a user clicks on an `<input>`, `<select>`, or `<textarea>`, keyboard events go to that element instead of your drum machine. Similarly, if focus leaves the app entirely (clicking browser URL bar), keyboard events stop reaching the app.

#### Solutions

```javascript
class FocusManager {
  constructor(appContainer) {
    this.appContainer = appContainer;
    this.isAppFocused = true;

    // Make the app container focusable
    appContainer.setAttribute('tabindex', '0');
    appContainer.style.outline = 'none'; // Remove focus ring on container

    // Track focus
    appContainer.addEventListener('focusin', () => {
      this.isAppFocused = true;
    });

    appContainer.addEventListener('focusout', (e) => {
      // Check if focus moved outside the app
      if (!appContainer.contains(e.relatedTarget)) {
        this.isAppFocused = false;
      }
    });

    // Return focus to app when form interactions complete
    this.setupFormFieldHandlers();
  }

  setupFormFieldHandlers() {
    // When user finishes editing a text field, return focus to app
    const inputs = this.appContainer.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' || e.code === 'Enter') {
          e.preventDefault();
          this.appContainer.focus();
        }
        // Don't let drum keys fire while typing in inputs
        e.stopPropagation();
      });
    });
  }

  refocus() {
    this.appContainer.focus();
  }
}
```

#### Pattern: Keyboard Event Delegation

```javascript
// Attach keyboard listener to the app container, not document
const app = document.getElementById('drum-machine');
app.setAttribute('tabindex', '0');

app.addEventListener('keydown', (e) => {
  // Only handle events when app is focused
  // Skip if user is in a text input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    // Only intercept Escape (to return focus to app)
    if (e.code === 'Escape') {
      app.focus();
      e.preventDefault();
    }
    return; // Let other keys work normally in inputs
  }

  handleDrumKey(e);
});
```

### 3.7 Accessibility Considerations

#### Do Not Break Screen Reader Navigation

Screen readers use Tab, Arrow keys, Enter, Space, and other keys extensively. A drum machine that captures all keyboard input will render the app unusable for screen reader users.

**Guidelines:**

1. **Only capture keys when the instrument area has explicit focus** (not globally via `document`)
2. **Provide an ARIA `role="application"`** on the instrument container -- this tells screen readers that the widget handles its own keyboard interaction
3. **Implement `role="grid"`** for the step sequencer with proper `role="row"` and `role="gridcell"` for each step
4. **Announce state changes** with `aria-live` regions (e.g., "Pattern 1 playing", "Step 5 toggled on, velocity 100")
5. **Support Escape to exit** the instrument back to normal page navigation
6. **Never suppress Tab** globally -- only within modal dialogs

```html
<div id="drum-machine"
     role="application"
     aria-label="Drum Machine"
     tabindex="0"
     aria-describedby="keyboard-help">

  <div id="keyboard-help" class="sr-only">
    Press I to enter instrument mode and play drums with your keyboard.
    Press Escape to return to normal navigation.
    Press question mark for full keyboard shortcuts.
  </div>

  <div role="grid" aria-label="Step Sequencer">
    <div role="row" aria-label="Kick">
      <div role="gridcell" aria-label="Step 1, off" tabindex="-1"></div>
      <div role="gridcell" aria-label="Step 2, on, velocity 100" tabindex="-1"></div>
      <!-- ... -->
    </div>
  </div>
</div>
```

#### Screen Reader Announcements

```javascript
const announcer = document.createElement('div');
announcer.setAttribute('aria-live', 'polite');
announcer.setAttribute('aria-atomic', 'true');
announcer.classList.add('sr-only');
document.body.appendChild(announcer);

function announce(message) {
  announcer.textContent = message;
}

// Usage:
announce('Step 5 on Kick track toggled on. Velocity 100.');
announce('Pattern 2 selected.');
announce('Tempo set to 140 BPM.');
```

---

## 4. Computer Keyboard as Performance Tool

### 4.1 Finger Drumming on QWERTY -- Techniques and Limitations

#### Limitations vs. MIDI Pads

| Factor | MIDI Pad Controller | Computer Keyboard |
|--------|-------------------|-------------------|
| Velocity sensitivity | Yes (127 levels) | No (binary on/off) |
| Aftertouch | Often yes | No |
| Key travel | ~2-4mm, tactile | ~3-4mm, varies |
| Simultaneous keys | 16+ (dedicated circuits) | 2-6 (matrix dependent) |
| Layout | 4x4 grid (spatial) | Staggered rows (linear) |
| Latency | ~1-3ms (direct USB MIDI) | ~5-15ms (OS + browser) |

#### Adapting Technique

**Think "tapping" not "pressing":** On a keyboard, the switch registers at roughly the same point in travel regardless of force. Quick, decisive taps produce the most reliable timing.

**Use finger tips, not pads:** Unlike MIDI pads where you use finger pads for velocity, on a keyboard, using fingertips gives the fastest actuation.

**Home position anchor:** Keep fingers anchored on home row. Develop muscle memory for drum positions relative to home row, like a typist.

### 4.2 Can Key Press Velocity Be Detected?

**Short answer: No.** Standard keyboard hardware does not report press force or speed.

**Workarounds:**

1. **Timing between keydown events:** You can measure the inter-onset interval (time between consecutive presses of the same key). Faster repetition could map to higher velocity -- but this changes the meaning of velocity from "force" to "rate."

2. **Key-down to key-up duration:** You can measure how long a key is held. However, this is not useful for drum hits (which are instantaneous) -- it is useful for sustain behaviors (open hi-hat).

3. **Modifier key layers (recommended):** As described in section 1.3 -- Shift for accents, Ctrl for ghost notes.

4. **MIDI velocity via Web MIDI API:** If the user has a MIDI controller, use the Web MIDI API to receive true velocity data alongside keyboard input. Provide this as an upgrade path.

```javascript
// Web MIDI API for velocity-sensitive input
if (navigator.requestMIDIAccess) {
  navigator.requestMIDIAccess().then((midi) => {
    for (const input of midi.inputs.values()) {
      input.onmidimessage = (msg) => {
        const [status, note, velocity] = msg.data;
        if ((status & 0xf0) === 0x90 && velocity > 0) {
          // Note On with velocity
          triggerDrumByNote(note, velocity);
        }
      };
    }
  });
}
```

### 4.3 Sustain / Hold Behavior for Open Hi-Hats

Hi-hat behavior is unique among drum sounds: the open hi-hat should sustain while held and be "choked" by the closed hi-hat.

#### Implementation: Choke Groups

```javascript
const CHOKE_GROUPS = {
  hihat: ['hihat_closed', 'hihat_open', 'hihat_pedal'],
  // Add more choke groups as needed (e.g., crash/choke)
};

class DrumEngine {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.activeSources = new Map(); // chokeGroup -> sourceNode
    this.buffers = {};              // drumId -> AudioBuffer
  }

  trigger(drumId, velocity = 100) {
    // Find choke group for this drum
    const chokeGroup = this.findChokeGroup(drumId);

    // If in a choke group, stop any currently playing sound in that group
    if (chokeGroup && this.activeSources.has(chokeGroup)) {
      const oldSource = this.activeSources.get(chokeGroup);
      oldSource.gainNode.gain.exponentialRampToValueAtTime(
        0.001, this.ctx.currentTime + 0.02 // 20ms fade out to avoid click
      );
      oldSource.source.stop(this.ctx.currentTime + 0.02);
    }

    // Create and play new source
    const source = this.ctx.createBufferSource();
    const gainNode = this.ctx.createGain();

    source.buffer = this.buffers[drumId];
    gainNode.gain.value = velocity / 127;

    source.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    source.start(0);

    // Store reference for choke group
    if (chokeGroup) {
      this.activeSources.set(chokeGroup, { source, gainNode });
    }
  }

  findChokeGroup(drumId) {
    for (const [group, members] of Object.entries(CHOKE_GROUPS)) {
      if (members.includes(drumId)) return group;
    }
    return null;
  }
}
```

#### Keyboard Mapping for Hi-Hat

```
Key held:  D = open hi-hat sustaining
Key up:    D released = hi-hat chokes (fades out)
Key tap:   F = closed hi-hat (also chokes any open hi-hat)
```

```javascript
// Hi-hat sustain on key hold
document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'KeyD') {
    drumEngine.trigger('hihat_open');
  }
  if (e.code === 'KeyF') {
    drumEngine.trigger('hihat_closed'); // Chokes open hi-hat via choke group
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'KeyD') {
    // Choke the open hi-hat on key release
    drumEngine.chokeGroup('hihat');
  }
});
```

### 4.4 Roll / Flam Techniques on Keyboard

#### Flam (Grace Note + Main Hit)

A flam is two hits in rapid succession (10-40ms apart). On a keyboard:

**Technique 1: Two-finger flam.** Hit the same key with two different fingers in rapid succession. Due to key debounce, this may not register as two separate events.

**Technique 2: Two-key flam.** Map the same drum sound to two adjacent keys (e.g., D and F both trigger snare). Hit D then F in rapid succession.

```javascript
// Automatic flam detection
let lastHitTime = {};

function triggerWithFlamDetection(drumId, velocity) {
  const now = performance.now();
  const lastTime = lastHitTime[drumId] || 0;
  const delta = now - lastTime;

  if (delta < 40 && delta > 5) {
    // This is a flam -- play the second hit slightly quieter
    drumEngine.trigger(drumId, velocity * 0.7);
  } else {
    drumEngine.trigger(drumId, velocity);
  }

  lastHitTime[drumId] = now;
}
```

#### Rolls (Sustained Rapid Hits)

Use the Note Repeat system (section 3.4) with divisions of 1/32 or 1/64 for buzz rolls. The user holds the key and the engine auto-triggers at the selected subdivision.

### 4.5 Practice Workflows: Keyboard-Only Beat Creation

#### Workflow 1: Step-Record Mode
1. Press Space to start playback (hear metronome)
2. Press I to enter Insert mode
3. As the playhead moves, press drum keys at the right moment
4. Hits are quantized to the nearest step and written to the grid
5. Press Escape to exit Insert mode
6. Loop plays back what you entered

#### Workflow 2: Real-Time Record
1. Press R to arm recording
2. Press Space to start (with count-in)
3. Play drums on keyboard in real-time
4. Press Space to stop -- quantized pattern appears on grid
5. Press Q to quantize strength (100%, 75%, 50%, off)

#### Workflow 3: Pattern Paint
1. Navigate grid with arrow keys
2. Press X to toggle steps (like a pixel art canvas)
3. Hold Shift+Arrow to paint multiple steps
4. Press V, then 1-9 to set velocity per step
5. Press P, then 1-9 to set probability per step

---

## 5. Recommended Keybinding Tables

### 5.1 Drum Pad Layout (Performance Mode)

Designed for two-hand independence, ergonomic reach, and common keyboard rollover compatibility:

```
+-------+-------+-------+-------+    +-------+-------+-------+-------+
|  Q    |  W    |  E    |  R    |    |  U    |  I    |  O    |  P    |
| Crash |Ride   |OpenHH |Ride   |    | Tom1  | Tom2  | Tom3  | Tom4  |
| Bell  |Cymbal |       |Bow    |    | High  | Mid-H | Mid-L | Low   |
+-------+-------+-------+-------+    +-------+-------+-------+-------+
|  A    |  S    |  D    |  F    |    |  J    |  K    |  L    |  ;    |
| Rim-  | Clap/ |Closed |Open   |    |Snare  | Kick  | Kick  | Side  |
| shot  | Snap  | HH    | HH    |    |       | Main  | Alt   | Stick |
+-------+-------+-------+-------+    +-------+-------+-------+-------+
|  Z    |  X    |  C    |  V    |    |  M    |  ,    |  .    |  /    |
| Perc1 | Perc2 | Perc3 | Perc4 |    | Shaker|Tambour|Cowbell| Claves|
| Conga | Bongo |Agogo  |Cabasa |    |       | ine   |       |       |
+-------+-------+-------+-------+    +-------+-------+-------+-------+

                    +---------------------+
                    |     Space Bar       |
                    |    Play / Stop      |
                    +---------------------+
```

**Rationale:**
- **Left hand = hi-hat & cymbal territory** (D/F for hi-hats, A/S for snare accents, Q/W/E for cymbals) -- mirrors a right-handed drummer's left hand on hi-hat
- **Right hand = kick & snare** (K for kick -- strongest right-hand finger on home row, J for snare)
- **Two kicks** (K and L) for double-bass patterns
- **D (closed HH) and F (open HH)** are adjacent for fast switching, and F key-release chokes the open hi-hat
- **Bottom rows** for auxiliary percussion -- less frequently used
- **Space** for transport -- universally expected

### 5.2 Velocity Modifiers (Apply to Any Drum Key)

| Modifier | Velocity | MIDI Value | Label |
|----------|----------|------------|-------|
| Ctrl/Cmd + key | Ghost | 30 | ppp |
| No modifier | Normal | 100 | mf |
| Shift + key | Accent | 127 | fff |

### 5.3 Transport & Global Shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Stop |
| Shift+Space | Play from beginning |
| R | Toggle record |
| L | Toggle loop |
| M | Toggle metronome |
| T | Tap tempo (hit repeatedly) |
| [ | Tempo -1 BPM |
| ] | Tempo +1 BPM |
| Shift+[ | Tempo -10 BPM |
| Shift+] | Tempo +10 BPM |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+S | Save project |
| Ctrl+C | Copy selection |
| Ctrl+V | Paste |
| Ctrl+X | Cut |
| Ctrl+A | Select all |
| ? | Show keyboard shortcuts overlay |

### 5.4 Navigation & Editing Shortcuts

| Key | Action |
|-----|--------|
| Arrow keys | Navigate grid (step/track) |
| Enter or X | Toggle step on/off |
| Shift+Up/Down | Adjust step velocity (+/-10) |
| Home / End | Jump to first / last step |
| PageUp / PageDown | Previous / next pattern |
| 1-9 | Select pattern (or velocity in V mode) |
| Ctrl+D | Duplicate pattern |
| Delete / Backspace | Clear step or selection |
| Tab | Cycle through panels |
| Escape | Return to normal mode / deselect |
| F1-F5 | View switching (grid, pads, mixer, song, settings) |
| N | Toggle note repeat on/off |
| Shift+N | Set note repeat division (opens selector) |
| G | Toggle grid resolution (1/8, 1/16, 1/32) |

### 5.5 Vim-Like Modal Shortcuts

| Key (Normal Mode) | Action |
|--------------------|--------|
| i | Enter Insert/Record mode |
| v | Enter Velocity editing mode |
| p | Enter Probability editing mode |
| s | Enter Select mode |
| t | Enter Timing offset mode |
| Escape | Return to Normal mode |
| h j k l | Navigate (left, down, up, right) |
| x | Toggle step |
| dd | Delete current row pattern |
| yy | Copy current row pattern |
| pp | Paste pattern |
| u | Undo |
| . | Repeat last action |
| : | Open command palette |
| / | Search sounds |
| gg | Go to first step |
| G | Go to last step |

---

## 6. Complete JavaScript Implementation Examples

### 6.1 Full Drum Machine Keyboard Controller

```javascript
// ============================================================
// DrumMachineKeyboard - Complete keyboard controller
// ============================================================

class DrumMachineKeyboard {
  constructor(audioEngine, sequencer, ui) {
    this.audio = audioEngine;
    this.seq = sequencer;
    this.ui = ui;

    // Keyboard state
    this.keysDown = new Set();
    this.mode = 'normal'; // 'normal', 'insert', 'velocity', 'probability', 'select'

    // Drum pad mapping: event.code -> drum ID
    this.padMap = {
      // Left hand - hi-hats & cymbals
      'KeyQ': 'crash',
      'KeyW': 'ride',
      'KeyE': 'hihat_open',
      'KeyR': 'ride_bell',
      'KeyA': 'rimshot',
      'KeyS': 'clap',
      'KeyD': 'hihat_closed',
      'KeyF': 'hihat_open',  // With sustain behavior
      'KeyZ': 'perc_1',
      'KeyX': 'perc_2',
      'KeyC': 'perc_3',
      'KeyV': 'perc_4',
      // Right hand - kick, snare, toms
      'KeyU': 'tom_high',
      'KeyI': 'tom_mid_high',
      'KeyO': 'tom_mid_low',
      'KeyP': 'tom_low',
      'KeyJ': 'snare',
      'KeyK': 'kick',
      'KeyL': 'kick_alt',
      'Semicolon': 'sidestick',
      'KeyM': 'shaker',
      'Comma': 'tambourine',
      'Period': 'cowbell',
      'Slash': 'claves',
    };

    // Note repeat
    this.noteRepeat = {
      enabled: false,
      division: 16,    // 1/16 note
      timers: new Map(), // code -> intervalId
    };

    // Bind events
    this.bindEvents();
  }

  bindEvents() {
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    window.addEventListener('blur', this.onBlur.bind(this));
  }

  // ---- Velocity Calculation ----

  getVelocity(e) {
    if (e.ctrlKey || e.metaKey) return 30;   // Ghost note
    if (e.shiftKey) return 127;               // Accent
    // Normal with slight humanization
    return 95 + Math.floor(Math.random() * 15); // 95-109
  }

  // ---- Key Down Handler ----

  onKeyDown(e) {
    // Skip if focused on input elements
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      if (e.code === 'Escape') {
        e.target.blur();
        document.getElementById('drum-machine').focus();
      }
      return;
    }

    // Prevent browser defaults for our shortcuts
    if (this.shouldPreventDefault(e)) {
      e.preventDefault();
    }

    // Ignore OS key repeat for drum triggers (but not for transport)
    if (e.repeat && this.padMap[e.code]) return;

    // Track key state
    this.keysDown.add(e.code);

    // Route based on mode
    switch (this.mode) {
      case 'normal':
        this.handleNormalMode(e);
        break;
      case 'insert':
        this.handleInsertMode(e);
        break;
      case 'velocity':
        this.handleVelocityMode(e);
        break;
      case 'probability':
        this.handleProbabilityMode(e);
        break;
      case 'select':
        this.handleSelectMode(e);
        break;
    }
  }

  // ---- Key Up Handler ----

  onKeyUp(e) {
    this.keysDown.delete(e.code);

    // Stop note repeat for this key
    if (this.noteRepeat.timers.has(e.code)) {
      clearInterval(this.noteRepeat.timers.get(e.code));
      this.noteRepeat.timers.delete(e.code);
    }

    // Hi-hat open sustain: choke on release
    if (e.code === 'KeyF') {
      this.audio.chokeGroup('hihat');
    }
  }

  // ---- Window Blur Handler ----

  onBlur() {
    // Release all keys and stop all note repeats
    this.keysDown.clear();
    for (const [code, id] of this.noteRepeat.timers) {
      clearInterval(id);
    }
    this.noteRepeat.timers.clear();
  }

  // ---- Prevent Default Logic ----

  shouldPreventDefault(e) {
    // Space - prevent scroll
    if (e.code === 'Space') return true;
    // Ctrl+S - prevent save dialog
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') return true;
    // Ctrl+Z - prevent browser undo
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') return true;
    // Ctrl+D - prevent bookmark
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD') return true;
    // Slash - prevent quick find in Firefox
    if (e.code === 'Slash' && !e.ctrlKey && !e.metaKey) return true;
    return false;
  }

  // ---- Normal Mode ----

  handleNormalMode(e) {
    const code = e.code;

    // === Drum triggers ===
    if (this.padMap[code]) {
      const drumId = this.padMap[code];
      const velocity = this.getVelocity(e);
      this.audio.trigger(drumId, velocity);
      this.ui.flashPad(drumId);

      // Note repeat
      if (this.noteRepeat.enabled && !this.noteRepeat.timers.has(code)) {
        const intervalMs = this.getNoteRepeatInterval();
        const id = setInterval(() => {
          this.audio.trigger(drumId, velocity);
          this.ui.flashPad(drumId);
        }, intervalMs);
        this.noteRepeat.timers.set(code, id);
      }
      return;
    }

    // === Transport ===
    switch (code) {
      case 'Space':
        e.shiftKey ? this.seq.playFromStart() : this.seq.togglePlayStop();
        break;
      case 'KeyR':
        if (!e.ctrlKey && !e.metaKey) this.seq.toggleRecord();
        break;
      case 'KeyL':
        if (!e.ctrlKey && !e.metaKey) this.seq.toggleLoop();
        break;
      case 'KeyM':
        if (!e.ctrlKey && !e.metaKey) this.seq.toggleMetronome();
        break;
      case 'KeyT':
        this.seq.tapTempo();
        break;
      case 'BracketLeft':
        this.seq.adjustTempo(e.shiftKey ? -10 : -1);
        break;
      case 'BracketRight':
        this.seq.adjustTempo(e.shiftKey ? 10 : 1);
        break;

      // === Grid Navigation ===
      case 'ArrowRight':
        this.seq.moveCursor(1, 0);
        break;
      case 'ArrowLeft':
        this.seq.moveCursor(-1, 0);
        break;
      case 'ArrowDown':
        this.seq.moveCursor(0, 1);
        break;
      case 'ArrowUp':
        this.seq.moveCursor(0, -1);
        break;
      case 'Enter':
        this.seq.toggleCurrentStep();
        break;
      case 'Home':
        this.seq.jumpToStep(0);
        break;
      case 'End':
        this.seq.jumpToStep(this.seq.patternLength - 1);
        break;

      // === Pattern Navigation ===
      case 'PageDown':
        this.seq.nextPattern();
        break;
      case 'PageUp':
        this.seq.previousPattern();
        break;

      // === Mode Switching ===
      case 'KeyI':
        this.setMode('insert');
        break;
      case 'KeyV':
        if (!e.ctrlKey && !e.metaKey) this.setMode('velocity');
        break;
      case 'KeyP':
        if (!e.ctrlKey && !e.metaKey) this.setMode('probability');
        break;
      case 'KeyS':
        if (!e.ctrlKey && !e.metaKey) this.setMode('select');
        break;

      // === View Switching ===
      case 'F1': this.ui.switchView('grid'); break;
      case 'F2': this.ui.switchView('pads'); break;
      case 'F3': this.ui.switchView('mixer'); break;
      case 'F4': this.ui.switchView('song'); break;
      case 'F5': this.ui.switchView('settings'); break;

      // === Note Repeat Toggle ===
      case 'KeyN':
        if (e.shiftKey) {
          this.ui.showNoteRepeatDivisionPicker();
        } else {
          this.noteRepeat.enabled = !this.noteRepeat.enabled;
          this.ui.showNoteRepeatState(this.noteRepeat.enabled);
        }
        break;

      // === Grid Resolution Toggle ===
      case 'KeyG':
        this.seq.cycleGridResolution(); // 1/8 -> 1/16 -> 1/32
        break;

      // === Edit Commands ===
      case 'Delete':
      case 'Backspace':
        this.seq.deleteSelection();
        break;

      // === Standard Clipboard ===
      default:
        if (e.ctrlKey || e.metaKey) {
          switch (code) {
            case 'KeyZ':
              e.shiftKey ? this.seq.redo() : this.seq.undo();
              break;
            case 'KeyC': this.seq.copySelection(); break;
            case 'KeyV': this.seq.paste(); break;
            case 'KeyX': this.seq.cutSelection(); break;
            case 'KeyA': this.seq.selectAll(); break;
            case 'KeyD': this.seq.duplicatePattern(); break;
            case 'KeyS': this.seq.saveProject(); break;
          }
        }
    }

    // === Pattern Select by Number ===
    const numMatch = code.match(/^Digit(\d)$/);
    if (numMatch && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const num = parseInt(numMatch[1]);
      if (num >= 1 && num <= 9) {
        this.seq.selectPattern(num);
      }
    }

    // === Help ===
    if (e.key === '?') {
      this.ui.toggleShortcutsOverlay();
    }
  }

  // ---- Insert Mode ----

  handleInsertMode(e) {
    if (e.code === 'Escape') {
      this.setMode('normal');
      return;
    }

    // In insert mode, drum keys write to the grid at current cursor
    if (this.padMap[e.code]) {
      const drumId = this.padMap[e.code];
      const velocity = this.getVelocity(e);
      this.audio.trigger(drumId, velocity); // Audition
      this.seq.writeStep(drumId, velocity); // Write to grid
      this.seq.moveCursor(1, 0);            // Advance cursor
    }

    // Arrow keys still navigate
    if (e.code === 'ArrowRight') this.seq.moveCursor(1, 0);
    if (e.code === 'ArrowLeft') this.seq.moveCursor(-1, 0);
    if (e.code === 'ArrowUp') this.seq.moveCursor(0, -1);
    if (e.code === 'ArrowDown') this.seq.moveCursor(0, 1);
  }

  // ---- Velocity Mode ----

  handleVelocityMode(e) {
    if (e.code === 'Escape') {
      this.setMode('normal');
      return;
    }

    // Number keys set velocity
    const numMatch = e.code.match(/^Digit(\d)$/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      if (num >= 1 && num <= 9) {
        const velocity = Math.round((num / 9) * 127);
        this.seq.setSelectionVelocity(velocity);
      }
    }

    // Arrow keys adjust
    if (e.code === 'ArrowUp') this.seq.adjustSelectionVelocity(10);
    if (e.code === 'ArrowDown') this.seq.adjustSelectionVelocity(-10);
    if (e.code === 'ArrowLeft') this.seq.moveCursor(-1, 0);
    if (e.code === 'ArrowRight') this.seq.moveCursor(1, 0);

    // H for humanize
    if (e.code === 'KeyH') this.seq.humanizeSelectionVelocity();
  }

  // ---- Probability Mode ----

  handleProbabilityMode(e) {
    if (e.code === 'Escape') {
      this.setMode('normal');
      return;
    }

    // Number keys set probability percentage
    const numMatch = e.code.match(/^Digit(\d)$/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      const probability = num === 0 ? 100 : num * 10; // 1=10%, 2=20%...9=90%, 0=100%
      this.seq.setSelectionProbability(probability);
    }

    if (e.code === 'ArrowLeft') this.seq.moveCursor(-1, 0);
    if (e.code === 'ArrowRight') this.seq.moveCursor(1, 0);
  }

  // ---- Select Mode ----

  handleSelectMode(e) {
    if (e.code === 'Escape') {
      this.setMode('normal');
      this.seq.clearSelection();
      return;
    }

    // Arrow keys extend selection
    if (e.code === 'ArrowRight') this.seq.extendSelection(1, 0);
    if (e.code === 'ArrowLeft') this.seq.extendSelection(-1, 0);
    if (e.code === 'ArrowUp') this.seq.extendSelection(0, -1);
    if (e.code === 'ArrowDown') this.seq.extendSelection(0, 1);

    // d = delete selection
    if (e.code === 'KeyD') {
      this.seq.deleteSelection();
      this.setMode('normal');
    }
    // y = yank (copy) selection
    if (e.code === 'KeyY') {
      this.seq.copySelection();
      this.setMode('normal');
    }
  }

  // ---- Helpers ----

  setMode(newMode) {
    this.mode = newMode;
    this.ui.showMode(newMode);
    this.announceMode(newMode);
  }

  announceMode(mode) {
    const names = {
      normal: 'Normal mode',
      insert: 'Insert mode - keys write to grid',
      velocity: 'Velocity mode - number keys set velocity',
      probability: 'Probability mode - number keys set probability',
      select: 'Select mode - arrow keys extend selection',
    };
    // Screen reader announcement
    const announcer = document.getElementById('mode-announcer');
    if (announcer) announcer.textContent = names[mode] || mode;
  }

  getNoteRepeatInterval() {
    const beatMs = 60000 / this.seq.bpm;
    return (beatMs * 4) / this.noteRepeat.division;
  }
}
```

### 6.2 Web Audio Engine with Sample Loading

```javascript
// ============================================================
// AudioEngine - Low-latency sample playback
// ============================================================

class AudioEngine {
  constructor() {
    this.ctx = null;         // AudioContext (created on first user gesture)
    this.buffers = {};       // drumId -> AudioBuffer
    this.activeSources = new Map(); // chokeGroup -> {source, gain}
    this.masterGain = null;

    this.chokeGroups = {
      hihat: ['hihat_closed', 'hihat_open', 'hihat_pedal'],
    };
  }

  async init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
  }

  async ensureResumed() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  async loadKit(kitDefinition) {
    // kitDefinition: { kick: 'url', snare: 'url', ... }
    const loadPromises = Object.entries(kitDefinition).map(
      async ([drumId, url]) => {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        this.buffers[drumId] = await this.ctx.decodeAudioData(arrayBuffer);
      }
    );
    await Promise.all(loadPromises);
  }

  trigger(drumId, velocity = 100) {
    if (!this.ctx || !this.buffers[drumId]) return;

    this.ensureResumed();

    // Handle choke groups
    const chokeGroup = this.getChokeGroup(drumId);
    if (chokeGroup) {
      this.choke(chokeGroup);
    }

    // Create one-shot source
    const source = this.ctx.createBufferSource();
    const gainNode = this.ctx.createGain();

    source.buffer = this.buffers[drumId];
    gainNode.gain.value = velocity / 127;

    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(0);

    // Track for choke groups
    if (chokeGroup) {
      this.activeSources.set(chokeGroup, { source, gain: gainNode });
    }

    // Clean up when done
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };
  }

  choke(chokeGroup) {
    const active = this.activeSources.get(chokeGroup);
    if (active) {
      // Quick fade to avoid click
      active.gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + 0.015
      );
      active.source.stop(this.ctx.currentTime + 0.015);
      this.activeSources.delete(chokeGroup);
    }
  }

  chokeGroup(groupName) {
    this.choke(groupName);
  }

  getChokeGroup(drumId) {
    for (const [group, members] of Object.entries(this.chokeGroups)) {
      if (members.includes(drumId)) return group;
    }
    return null;
  }

  setMasterVolume(value) {
    // value: 0.0 to 1.0
    if (this.masterGain) {
      this.masterGain.gain.value = value;
    }
  }
}
```

### 6.3 Initialization and Wiring

```javascript
// ============================================================
// App Bootstrap
// ============================================================

async function initDrumMachine() {
  const audio = new AudioEngine();
  await audio.init();

  // Load default kit
  await audio.loadKit({
    kick:         '/samples/808/kick.wav',
    kick_alt:     '/samples/808/kick-alt.wav',
    snare:        '/samples/808/snare.wav',
    hihat_closed: '/samples/808/hihat-closed.wav',
    hihat_open:   '/samples/808/hihat-open.wav',
    hihat_pedal:  '/samples/808/hihat-pedal.wav',
    clap:         '/samples/808/clap.wav',
    rimshot:      '/samples/808/rimshot.wav',
    crash:        '/samples/808/crash.wav',
    ride:         '/samples/808/ride.wav',
    ride_bell:    '/samples/808/ride-bell.wav',
    tom_high:     '/samples/808/tom-high.wav',
    tom_mid_high: '/samples/808/tom-mid-high.wav',
    tom_mid_low:  '/samples/808/tom-mid-low.wav',
    tom_low:      '/samples/808/tom-low.wav',
    sidestick:    '/samples/808/sidestick.wav',
    cowbell:      '/samples/808/cowbell.wav',
    claves:       '/samples/808/claves.wav',
    shaker:       '/samples/808/shaker.wav',
    tambourine:   '/samples/808/tambourine.wav',
    perc_1:       '/samples/808/conga.wav',
    perc_2:       '/samples/808/bongo.wav',
    perc_3:       '/samples/808/agogo.wav',
    perc_4:       '/samples/808/cabasa.wav',
  });

  // Create sequencer and UI (implementation depends on your framework)
  const sequencer = new Sequencer(audio, { bpm: 120, steps: 16 });
  const ui = new DrumMachineUI(sequencer);

  // Create keyboard controller
  const keyboard = new DrumMachineKeyboard(audio, sequencer, ui);

  // Ensure AudioContext is resumed on first interaction
  const resumeAudio = () => {
    audio.ensureResumed();
    document.removeEventListener('click', resumeAudio);
    document.removeEventListener('keydown', resumeAudio);
  };
  document.addEventListener('click', resumeAudio);
  document.addEventListener('keydown', resumeAudio);

  // Focus the app container
  document.getElementById('drum-machine').focus();
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', initDrumMachine);
```

### 6.4 Keyboard Shortcut Help Overlay (HTML)

```html
<div id="shortcuts-overlay" class="shortcuts-overlay hidden" role="dialog" aria-label="Keyboard Shortcuts">
  <div class="shortcuts-content">
    <h2>Keyboard Shortcuts</h2>
    <button class="close-btn" aria-label="Close">&times;</button>

    <div class="shortcuts-columns">
      <section>
        <h3>Transport</h3>
        <dl>
          <dt><kbd>Space</kbd></dt><dd>Play / Stop</dd>
          <dt><kbd>Shift</kbd>+<kbd>Space</kbd></dt><dd>Play from start</dd>
          <dt><kbd>R</kbd></dt><dd>Record</dd>
          <dt><kbd>L</kbd></dt><dd>Loop on/off</dd>
          <dt><kbd>M</kbd></dt><dd>Metronome on/off</dd>
          <dt><kbd>T</kbd></dt><dd>Tap tempo</dd>
          <dt><kbd>[</kbd> / <kbd>]</kbd></dt><dd>Tempo -/+ 1 BPM</dd>
        </dl>
      </section>

      <section>
        <h3>Grid Editing</h3>
        <dl>
          <dt><kbd>&larr;</kbd> <kbd>&rarr;</kbd> <kbd>&uarr;</kbd> <kbd>&darr;</kbd></dt><dd>Navigate</dd>
          <dt><kbd>Enter</kbd> / <kbd>X</kbd></dt><dd>Toggle step</dd>
          <dt><kbd>Shift</kbd>+<kbd>&uarr;</kbd>/<kbd>&darr;</kbd></dt><dd>Adjust velocity</dd>
          <dt><kbd>Ctrl</kbd>+<kbd>C</kbd>/<kbd>V</kbd>/<kbd>X</kbd></dt><dd>Copy / Paste / Cut</dd>
          <dt><kbd>Ctrl</kbd>+<kbd>Z</kbd></dt><dd>Undo</dd>
        </dl>
      </section>

      <section>
        <h3>Modes (Vim-like)</h3>
        <dl>
          <dt><kbd>I</kbd></dt><dd>Insert mode</dd>
          <dt><kbd>V</kbd></dt><dd>Velocity mode</dd>
          <dt><kbd>P</kbd></dt><dd>Probability mode</dd>
          <dt><kbd>S</kbd></dt><dd>Select mode</dd>
          <dt><kbd>Esc</kbd></dt><dd>Back to Normal</dd>
        </dl>
      </section>

      <section>
        <h3>Velocity</h3>
        <dl>
          <dt><kbd>Ctrl</kbd>+key</dt><dd>Ghost note (soft)</dd>
          <dt>Key alone</dt><dd>Normal</dd>
          <dt><kbd>Shift</kbd>+key</dt><dd>Accent (hard)</dd>
        </dl>
      </section>

      <section>
        <h3>Views</h3>
        <dl>
          <dt><kbd>F1</kbd>-<kbd>F5</kbd></dt><dd>Grid / Pads / Mixer / Song / Settings</dd>
          <dt><kbd>?</kbd></dt><dd>This help screen</dd>
        </dl>
      </section>
    </div>
  </div>
</div>
```

---

## Appendix: General MIDI Drum Map Reference

Standard MIDI note numbers for percussion (channel 10):

| Note | Sound | Note | Sound |
|------|-------|------|-------|
| 35 | Bass Drum 2 | 51 | Ride Cymbal 1 |
| 36 | Bass Drum 1 | 52 | Chinese Cymbal |
| 37 | Side Stick | 53 | Ride Bell |
| 38 | Snare Drum 1 | 54 | Tambourine |
| 39 | Hand Clap | 55 | Splash Cymbal |
| 40 | Snare Drum 2 | 56 | Cowbell |
| 41 | Low Floor Tom | 57 | Crash Cymbal 2 |
| 42 | Closed Hi-Hat | 59 | Ride Cymbal 2 |
| 43 | High Floor Tom | 60 | Hi Bongo |
| 44 | Pedal Hi-Hat | 61 | Low Bongo |
| 45 | Low Tom | 62 | Mute Hi Conga |
| 46 | Open Hi-Hat | 63 | Open Hi Conga |
| 47 | Low-Mid Tom | 64 | Low Conga |
| 48 | Hi-Mid Tom | 65 | High Timbale |
| 49 | Crash Cymbal 1 | 66 | Low Timbale |
| 50 | High Tom | 75 | Claves |

---

## Sources

- [Ableton Reference Manual -- Keyboard Shortcuts](https://www.ableton.com/en/manual/live-keyboard-shortcuts/)
- [Ableton Computer Keyboard as MIDI Controller (Sonic Bloom)](https://sonicbloom.net/ableton-live-tutorial-computer-keyboard-as-midi-controller/)
- [FL Studio Keyboard & Mouse Shortcuts](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/basics_shortcuts.htm)
- [FL Studio FPC Plugin Manual](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/plugins/FPC.htm)
- [Logic Pro -- Play Software Instruments (Apple Support)](https://support.apple.com/guide/logicpro/play-software-instruments-lgcpb19cbd34/mac)
- [Logic Pro -- Step Sequencer Key Commands (Apple Support)](https://support.apple.com/guide/logicpro/step-sequencer-key-commands-lgcp1d6a34a9/10.7/mac/11.0)
- [Maschine MK3 Manual -- Playing on the Controller](https://www.native-instruments.com/ni-tech-manuals/maschine-mk3-manual/en/playing-on-the-controller)
- [Drumbit Online Drum Machine](https://drumbit.app/)
- [Sampulator Review -- Building Beats](https://buildingbeats.org/blog/2020/9/sampulator)
- [Bitwig Keyboard Shortcuts (muted.io)](https://muted.io/bitwig-keyboard-shortcuts/)
- [MDN -- KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [MDN -- KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)
- [MDN -- KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key)
- [MDN -- Element: keydown event](https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event)
- [MDN -- Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MDN -- Using the Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)
- [MDN -- Simple Synth Keyboard Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Simple_synth)
- [Web Audio API Book -- Timing and Latency (O'Reilly)](https://www.oreilly.com/library/view/web-audio-api/9781449332679/ch02.html)
- [A Tale of Two Clocks -- Audio Scheduling (web.dev)](https://web.dev/articles/audio-scheduling)
- [Key Rollover -- Wikipedia](https://en.wikipedia.org/wiki/Key_rollover)
- [NKRO Guide (The Keyboard Company)](https://www.thekeyboardco.com/blog/index.php/2016/03/what-is-nkro-our-guide-to-rollover-anti-ghosting-and-choosing-the-right-keyboard/)
- [Rollover, Blocking and Ghosting (Deskthority Wiki)](https://deskthority.net/wiki/Rollover,_blocking_and_ghosting)
- [Keyboard Accessibility (WebAIM)](https://webaim.org/techniques/keyboard/)
- [ARIA Design Patterns -- Keyboard Interface (W3C)](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [Focus Management and Inert (CSS-Tricks)](https://css-tricks.com/focus-management-and-inert/)
- [Overriding Browser Shortcuts with JavaScript](https://www.robin-drexler.com/2015/07/07/overriding-default-browser-shortcuts/)
- [Mousetrap -- Keyboard Shortcuts in JavaScript](https://craig.is/killing/mice)
- [Melodics -- Playing Drums with Your Computer Keyboard](https://melodics.com/blog/playing-drums-with-your-computer-keyboard)
- [Quest for Groove -- Basic Finger Drumming Technique](https://questforgroove.com/basic-finger-drumming-technique-pad-layout/)
- [Master Drum Rudiments on Virtual Drum Set (VirtualDrums.org)](https://virtualdrums.org/blog/master-7-essential-drum-rudiments-on-your-virtual-drum-set-keyboard-drumming-basics)
- [General MIDI Drum Note Numbers (Sound Programming)](https://soundprogramming.net/file-formats/general-midi-drum-note-numbers/)
- [MIDI Drum Chart (Zendrum)](https://www.zendrum.com/resource-site/drumnotes.htm)
- [Andrico's Blog -- event.code vs event.key](https://blog.andri.co/022-should-i-use-ecode-or-ekey-when-handling-keyboard-events/)
- [Chrome Blog -- KeyboardEvent Keys and Codes](https://developer.chrome.com/blog/keyboardevent-keys-codes)
- [Terminal DAW (Hackaday)](https://hackaday.com/2025/04/30/terminal-daw-does-it-in-style/)
