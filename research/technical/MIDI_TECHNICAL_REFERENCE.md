# MIDI Technical Reference for Browser-Based Drum Machines

> Comprehensive developer reference covering the MIDI 1.0 protocol, General MIDI drum mapping, Web MIDI API, and Standard MIDI File format. All code examples are in JavaScript.

---

## Table of Contents

1. [MIDI Protocol Fundamentals](#1-midi-protocol-fundamentals)
2. [Channel Voice Messages](#2-channel-voice-messages)
3. [System Messages](#3-system-messages)
4. [General MIDI Drum Map](#4-general-midi-drum-map)
5. [MIDI Velocity](#5-midi-velocity)
6. [MIDI Control Change (CC) Reference](#6-midi-control-change-cc-reference)
7. [MIDI Clock and Timing](#7-midi-clock-and-timing)
8. [MIDI Channels](#8-midi-channels)
9. [MIDI 2.0](#9-midi-20)
10. [Web MIDI API](#10-web-midi-api)
11. [Web MIDI Code Examples](#11-web-midi-code-examples)
12. [MIDI File Format (.mid)](#12-midi-file-format-mid)
13. [Generating MIDI Files in JavaScript](#13-generating-midi-files-in-javascript)

---

## 1. MIDI Protocol Fundamentals

### 1.1 Physical Layer (Historical Context)

MIDI 1.0 (1983) uses a unidirectional serial protocol at 31,250 baud (bits/second). Each byte is transmitted as 1 start bit + 8 data bits + 1 stop bit = 10 bits per byte. This yields a throughput of 3,125 bytes/second. A typical 3-byte Note On message takes ~960 microseconds to transmit.

In modern contexts (USB MIDI, Web MIDI), the physical serial layer is abstracted away. USB MIDI uses 32-bit USB-MIDI Event Packets. The Web MIDI API operates on raw MIDI byte arrays regardless of transport.

### 1.2 Message Structure

Every MIDI message begins with a **status byte** followed by zero or more **data bytes**.

```
Status Byte:  1xxxxxxx  (bit 7 = 1, range 0x80-0xFF)
Data Byte:    0xxxxxxx  (bit 7 = 0, range 0x00-0x7F)
```

This single-bit distinction is the foundation of the entire protocol. A receiver always knows whether an incoming byte is a new message (status) or a continuation (data).

**Message categories by status byte range:**

| Range         | Category                  |
|---------------|---------------------------|
| `0x80-0xEF`   | Channel Messages (voice + mode) |
| `0xF0-0xF7`   | System Common Messages    |
| `0xF8-0xFF`   | System Real-Time Messages |

### 1.3 Channel Messages — Status Byte Encoding

For channel messages (`0x80`-`0xEF`), the status byte encodes both the message type and the channel:

```
Status byte = (message_type << 4) | channel

Where:
  message_type = upper nibble (0x8-0xE)
  channel      = lower nibble (0x0-0xF, representing channels 1-16)
```

JavaScript extraction:

```javascript
function parseChannelMessage(statusByte) {
  const messageType = statusByte & 0xF0; // Upper nibble
  const channel = statusByte & 0x0F;     // Lower nibble (0-15)
  return { messageType, channel: channel + 1 }; // Channel as 1-16
}
```

### 1.4 Running Status

To reduce bandwidth, MIDI supports **running status**: if consecutive messages share the same status byte, the status byte can be omitted from subsequent messages. The receiver remembers the last status byte and applies it to incoming data bytes.

```
Normal:          0x90 0x3C 0x7F  0x90 0x40 0x7F  0x90 0x43 0x7F
Running Status:  0x90 0x3C 0x7F       0x40 0x7F       0x43 0x7F
```

Rules:
- Running status applies only to Channel Messages (`0x80`-`0xEF`)
- System Real-Time messages (`0xF8`-`0xFF`) do NOT cancel running status (they can be interleaved)
- System Common messages (`0xF0`-`0xF7`) DO cancel running status
- A new status byte always resets running status

**Note:** Running status is rarely relevant in Web MIDI since USB MIDI packets always include the status byte. However, you may encounter it when parsing raw serial MIDI streams or MIDI files.

### 1.5 Complete Message Type Summary

| Status Byte | Message              | Data Bytes | Description                        |
|-------------|----------------------|------------|------------------------------------|
| `0x80-0x8F` | Note Off            | 2          | note number, velocity              |
| `0x90-0x9F` | Note On             | 2          | note number, velocity              |
| `0xA0-0xAF` | Poly Aftertouch     | 2          | note number, pressure              |
| `0xB0-0xBF` | Control Change      | 2          | controller number, value           |
| `0xC0-0xCF` | Program Change      | 1          | program number                     |
| `0xD0-0xDF` | Channel Aftertouch  | 1          | pressure value                     |
| `0xE0-0xEF` | Pitch Bend          | 2          | LSB, MSB (14-bit value)            |
| `0xF0`      | SysEx Start         | variable   | manufacturer ID + data + 0xF7      |
| `0xF1`      | MIDI Time Code QF   | 1          | time code data                     |
| `0xF2`      | Song Position Ptr   | 2          | LSB, MSB (14-bit, in MIDI beats)   |
| `0xF3`      | Song Select         | 1          | song number                        |
| `0xF4`      | (Undefined)         | -          |                                    |
| `0xF5`      | (Undefined)         | -          |                                    |
| `0xF6`      | Tune Request        | 0          | triggers oscillator tuning         |
| `0xF7`      | SysEx End (EOX)     | 0          | terminates SysEx message           |
| `0xF8`      | Timing Clock        | 0          | 24 per quarter note                |
| `0xF9`      | (Undefined)         | -          |                                    |
| `0xFA`      | Start               | 0          | start sequence playback            |
| `0xFB`      | Continue            | 0          | continue from stopped position     |
| `0xFC`      | Stop                | 0          | stop sequence playback             |
| `0xFD`      | (Undefined)         | -          |                                    |
| `0xFE`      | Active Sensing      | 0          | heartbeat (~300ms interval)        |
| `0xFF`      | System Reset        | 0          | reset to power-up state            |

---

## 2. Channel Voice Messages

### 2.1 Note On — `0x90` + channel

```
[0x9n, note_number, velocity]
```

- **note_number** (0-127): MIDI note. Middle C = 60. Range covers C-1 (0) to G9 (127).
- **velocity** (1-127): How hard the note is struck. Higher = louder/brighter.
- **velocity = 0**: Treated as Note Off (this is extremely common; many devices use Note On with velocity 0 instead of explicit Note Off).

**For drum machines:** On channel 10 (index 9), note numbers map to specific drum sounds per the General MIDI drum map. Note 36 = Bass Drum 1, Note 38 = Acoustic Snare, etc.

```javascript
// Send a kick drum hit at full velocity on channel 10
const CHANNEL_10 = 9; // 0-indexed
const KICK = 36;
output.send([0x90 | CHANNEL_10, KICK, 127]);
```

### 2.2 Note Off — `0x80` + channel

```
[0x8n, note_number, velocity]
```

- **note_number**: Must match the Note On to release.
- **velocity**: "Release velocity" — how fast the key is released. Most instruments ignore this. Range 0-127.

**Practical note:** Most implementations use Note On with velocity 0 as Note Off. This enables running status optimization (all messages share `0x9n` status). For drums, Note Off is often irrelevant (the sound is a one-shot), but you should still send it to be spec-compliant.

```javascript
// Note Off — two equivalent approaches
output.send([0x80 | channel, note, 64]);     // Explicit Note Off
output.send([0x90 | channel, note, 0]);       // Note On vel=0 (more common)
```

### 2.3 Control Change — `0xB0` + channel

```
[0xBn, controller_number, value]
```

- **controller_number** (0-127): Which controller. See Section 6 for complete list.
- **value** (0-127): 7-bit controller value.

Used for volume, pan, modulation, sustain pedal, and hundreds of other continuous parameters. Essential for expressive drum machine control (e.g., hi-hat openness mapped to a CC).

```javascript
// Set volume to 100 on channel 10
output.send([0xB0 | 9, 7, 100]);

// Set pan to center (64) on channel 10
output.send([0xB0 | 9, 10, 64]);
```

### 2.4 Program Change — `0xC0` + channel

```
[0xCn, program_number]
```

- **program_number** (0-127): Selects the instrument/patch. Only 1 data byte.
- In General MIDI, channel 10 programs select drum kits: 0 = Standard Kit, 8 = Room Kit, 16 = Power Kit, 24 = Electronic Kit, 25 = TR-808 Kit, 32 = Jazz Kit, 40 = Brush Kit, 48 = Orchestra Kit, 56 = SFX Kit.

```javascript
// Select TR-808 drum kit on channel 10
output.send([0xC0 | 9, 25]);
```

### 2.5 Pitch Bend — `0xE0` + channel

```
[0xEn, lsb, msb]
```

- **14-bit value**: `(msb << 7) | lsb`, range 0-16383, center = 8192.
- Default bend range is +/- 2 semitones (configurable via RPN).
- Less commonly used for drums, but can create pitch-drop effects on toms/kicks.

```javascript
// Parse pitch bend
function parsePitchBend(lsb, msb) {
  const raw = (msb << 7) | lsb;     // 0 to 16383
  const centered = raw - 8192;       // -8192 to +8191
  const normalized = centered / 8192; // -1.0 to ~+1.0
  return { raw, centered, normalized };
}

// Send pitch bend center (no bend)
output.send([0xE0 | channel, 0x00, 0x40]); // LSB=0, MSB=64 → 8192
```

### 2.6 Channel Aftertouch (Channel Pressure) — `0xD0` + channel

```
[0xDn, pressure]
```

- **pressure** (0-127): Single pressure value for the entire channel.
- One data byte only. Cheaper than polyphonic aftertouch.
- Useful for adding expression after a drum hit (e.g., controlling cymbal swell).

### 2.7 Polyphonic Key Pressure (Poly Aftertouch) — `0xA0` + channel

```
[0xAn, note_number, pressure]
```

- **note_number** (0-127): Which note the pressure applies to.
- **pressure** (0-127): Per-note pressure value.
- Allows independent pressure control on each note. Rare on controllers; more common in MIDI 2.0.

---

## 3. System Messages

### 3.1 System Exclusive (SysEx) — `0xF0`

```
[0xF0, manufacturer_id..., data..., 0xF7]
```

SysEx provides an escape hatch for manufacturer-specific data. Structure:

```
0xF0                        Start of SysEx
  manufacturer_id           1 byte (0x01-0x7C) or 3 bytes (0x00, 0xLL, 0xMM)
  [device_id]               Optional
  [sub_id / model_id]       Optional
  data...                   Any number of bytes (each 0x00-0x7F)
0xF7                        End of SysEx (EOX)
```

**Universal SysEx IDs:**
- `0x7E` — Non-Real-Time Universal SysEx (GM System On, Identity Request, etc.)
- `0x7F` — Real-Time Universal SysEx (Master Volume, MMC, etc.)

**GM System On message:**
```javascript
// Enable General MIDI mode
output.send([0xF0, 0x7E, 0x7F, 0x09, 0x01, 0xF7]);
```

**Important for Web MIDI:** SysEx access requires explicit permission:
```javascript
navigator.requestMIDIAccess({ sysex: true });
```

### 3.2 MIDI Real-Time Messages

These are single-byte messages that can be interleaved anywhere (even within other messages):

| Byte   | Message        | Purpose                                      |
|--------|----------------|----------------------------------------------|
| `0xF8` | Timing Clock   | Sent 24 times per quarter note (24 PPQN)     |
| `0xFA` | Start          | Start playback from the beginning             |
| `0xFB` | Continue       | Resume playback from the stopped position     |
| `0xFC` | Stop           | Stop playback                                 |
| `0xFE` | Active Sensing | Keepalive signal (~300ms); optional            |
| `0xFF` | System Reset   | Reset all devices to power-on state           |

**For drum machine sync**, the critical messages are `0xF8` (Clock), `0xFA` (Start), `0xFB` (Continue), and `0xFC` (Stop). See Section 7 for detailed clock implementation.

### 3.3 System Common Messages

| Byte   | Message             | Data Bytes | Description                              |
|--------|---------------------|------------|------------------------------------------|
| `0xF1` | MTC Quarter Frame   | 1          | SMPTE time code fragment                 |
| `0xF2` | Song Position Pointer | 2        | 14-bit value: number of MIDI beats (1 beat = 6 MIDI clocks) since song start |
| `0xF3` | Song Select         | 1          | Select song number (0-127)               |
| `0xF6` | Tune Request        | 0          | Request analog synths to re-tune         |
| `0xF7` | EOX (End of SysEx)  | 0          | Terminates a SysEx message               |

**Song Position Pointer** is important for drum machines that need to sync mid-song:

```javascript
function parseSongPosition(lsb, msb) {
  const midiBeats = (msb << 7) | lsb; // 0-16383 MIDI beats
  const sixteenthNotes = midiBeats;     // 1 MIDI beat = 1 sixteenth note
  const quarterNotes = midiBeats / 4;
  const bars4_4 = midiBeats / 16;       // In 4/4 time
  return { midiBeats, sixteenthNotes, quarterNotes, bars4_4 };
}
```

---

## 4. General MIDI Drum Map

In General MIDI, **channel 10** (index 9 in 0-based) is reserved for percussion. Each note number triggers a specific drum/percussion sound. This is the **complete GM Level 1 Percussion Key Map**:

| Note | Name                    | Note | Name                    |
|------|-------------------------|------|-------------------------|
| 27   | High Q                  | 28   | Slap                    |
| 29   | Scratch Push            | 30   | Scratch Pull            |
| 31   | Sticks                  | 32   | Square Click            |
| 33   | Metronome Click         | 34   | Metronome Bell          |
| **35** | **Acoustic Bass Drum** | **36** | **Bass Drum 1 (Kick)** |
| 37   | Side Stick              | **38** | **Acoustic Snare**     |
| 39   | Hand Clap               | 40   | Electric Snare          |
| 41   | Low Floor Tom           | **42** | **Closed Hi-Hat**      |
| 43   | High Floor Tom          | **44** | **Pedal Hi-Hat**       |
| 45   | Low Tom                 | **46** | **Open Hi-Hat**        |
| 47   | Low-Mid Tom             | 48   | Hi-Mid Tom              |
| 49   | Crash Cymbal 1          | 50   | High Tom                |
| **51** | **Ride Cymbal 1**     | 52   | Chinese Cymbal          |
| 53   | Ride Bell               | 54   | Tambourine              |
| 55   | Splash Cymbal           | 56   | Cowbell                 |
| 57   | Crash Cymbal 2          | 58   | Vibraslap               |
| 59   | Ride Cymbal 2           | 60   | Hi Bongo                |
| 61   | Low Bongo               | 62   | Mute Hi Conga           |
| 63   | Open Hi Conga           | 64   | Low Conga               |
| 65   | High Timbale            | 66   | Low Timbale             |
| 67   | High Agogo              | 68   | Low Agogo               |
| 69   | Cabasa                  | 70   | Maracas                 |
| 71   | Short Whistle           | 72   | Long Whistle            |
| 73   | Short Guiro             | 74   | Long Guiro              |
| 75   | Claves                  | 76   | Hi Wood Block           |
| 77   | Low Wood Block          | 78   | Mute Cuica              |
| 79   | Open Cuica              | 80   | Mute Triangle           |
| 81   | Open Triangle           |      |                         |

**Notes 27-34** are GM Level 2 / GS extensions. The core GM Level 1 map is **notes 35-81**.

### Drum Map as a JavaScript Object

```javascript
const GM_DRUM_MAP = {
  27: 'High Q',              28: 'Slap',
  29: 'Scratch Push',        30: 'Scratch Pull',
  31: 'Sticks',              32: 'Square Click',
  33: 'Metronome Click',     34: 'Metronome Bell',
  35: 'Acoustic Bass Drum',  36: 'Bass Drum 1',
  37: 'Side Stick',          38: 'Acoustic Snare',
  39: 'Hand Clap',           40: 'Electric Snare',
  41: 'Low Floor Tom',       42: 'Closed Hi-Hat',
  43: 'High Floor Tom',      44: 'Pedal Hi-Hat',
  45: 'Low Tom',             46: 'Open Hi-Hat',
  47: 'Low-Mid Tom',         48: 'Hi-Mid Tom',
  49: 'Crash Cymbal 1',      50: 'High Tom',
  51: 'Ride Cymbal 1',       52: 'Chinese Cymbal',
  53: 'Ride Bell',           54: 'Tambourine',
  55: 'Splash Cymbal',       56: 'Cowbell',
  57: 'Crash Cymbal 2',      58: 'Vibraslap',
  59: 'Ride Cymbal 2',       60: 'Hi Bongo',
  61: 'Low Bongo',           62: 'Mute Hi Conga',
  63: 'Open Hi Conga',       64: 'Low Conga',
  65: 'High Timbale',        66: 'Low Timbale',
  67: 'High Agogo',          68: 'Low Agogo',
  69: 'Cabasa',              70: 'Maracas',
  71: 'Short Whistle',       72: 'Long Whistle',
  73: 'Short Guiro',         74: 'Long Guiro',
  75: 'Claves',              76: 'Hi Wood Block',
  77: 'Low Wood Block',      78: 'Mute Cuica',
  79: 'Open Cuica',          80: 'Mute Triangle',
  81: 'Open Triangle',
};

// Reverse lookup: name → note number
const DRUM_NAME_TO_NOTE = Object.fromEntries(
  Object.entries(GM_DRUM_MAP).map(([k, v]) => [v, parseInt(k)])
);

// Common drum kit shorthand for a basic drum machine
const DRUM_KIT = {
  kick:       36,
  snare:      38,
  closedHat:  42,
  openHat:    46,
  pedalHat:   44,
  clap:       39,
  rimshot:    37,  // Side Stick
  lowTom:     45,
  midTom:     47,
  highTom:    50,
  crash:      49,
  ride:       51,
  rideBell:   53,
  cowbell:    56,
  tambourine: 54,
};
```

---

## 5. MIDI Velocity

### 5.1 Range and Meaning

Velocity is a 7-bit value (0-127):

| Value | Meaning                                    |
|-------|--------------------------------------------|
| 0     | Note Off (when used with Note On `0x9n`)   |
| 1-31  | Pianissimo (very soft)                     |
| 32-63 | Piano to Mezzo-Piano (soft)                |
| 64    | Mezzo-Forte (medium — default/center)       |
| 65-95 | Forte (loud)                               |
| 96-127| Fortissimo (very loud)                     |
| 127   | Maximum velocity                           |

### 5.2 Velocity Curves

Raw MIDI velocity is linear (1-127), but human perception of loudness is logarithmic. Drum machines typically apply a velocity curve to make the response feel natural.

```javascript
// Linear (no transformation)
function linearCurve(velocity) {
  return velocity / 127;
}

// Logarithmic (more dynamic range at low velocities — feels more natural)
function logCurve(velocity) {
  return Math.log(1 + velocity) / Math.log(128);
}

// Exponential (more dynamic range at high velocities — aggressive)
function expCurve(velocity) {
  return Math.pow(velocity / 127, 2);
}

// S-Curve (soft at extremes, responsive in middle)
function sCurve(velocity) {
  const x = velocity / 127;
  return x * x * (3 - 2 * x); // Smoothstep
}

// Fixed velocity (ignore input dynamics)
function fixedCurve(fixedValue) {
  return () => fixedValue / 127;
}

// Apply velocity to gain (for Web Audio)
function velocityToGain(velocity, curve = 'log') {
  const curves = { linear: linearCurve, log: logCurve, exp: expCurve, s: sCurve };
  return curves[curve](velocity);
}
```

### 5.3 Velocity in Drum Context

For drum machines, velocity is critical because:
- It controls **volume** (louder hits vs ghost notes)
- It can control **sample selection** (different samples for soft vs hard hits)
- It can control **filter cutoff** (brighter sound at higher velocities)
- Typical "accent" is velocity 127; typical "ghost note" is velocity 30-50
- A velocity of 100 is a good default for programmed patterns

---

## 6. MIDI Control Change (CC) Reference

### 6.1 Complete CC Table

| CC  | Name                          | Range    | Notes                                    |
|-----|-------------------------------|----------|------------------------------------------|
| 0   | Bank Select MSB               | 0-127    | Used with CC32 for bank selection        |
| 1   | Modulation Wheel MSB          | 0-127    | Vibrato/tremolo depth                    |
| 2   | Breath Controller MSB         | 0-127    | Wind controller expression               |
| 3   | Undefined                     | 0-127    |                                          |
| 4   | Foot Controller MSB           | 0-127    |                                          |
| 5   | Portamento Time MSB           | 0-127    | Glide time between notes                 |
| 6   | Data Entry MSB                | 0-127    | Value for RPN/NRPN parameter             |
| 7   | Channel Volume MSB            | 0-127    | Main volume control                      |
| 8   | Balance MSB                   | 0-127    | Stereo balance                           |
| 9   | Undefined                     | 0-127    |                                          |
| 10  | Pan MSB                       | 0-127    | 0=left, 64=center, 127=right            |
| 11  | Expression MSB                | 0-127    | Sub-volume for dynamics within volume    |
| 12  | Effect Control 1 MSB          | 0-127    |                                          |
| 13  | Effect Control 2 MSB          | 0-127    |                                          |
| 14-15 | Undefined                   | 0-127    |                                          |
| 16-19 | General Purpose 1-4 MSB     | 0-127    | Freely assignable                        |
| 20-31 | Undefined                   | 0-127    |                                          |
| 32  | Bank Select LSB               | 0-127    | Fine bank selection                      |
| 33  | Modulation Wheel LSB          | 0-127    | Fine modulation                          |
| 34  | Breath Controller LSB         | 0-127    |                                          |
| 35  | Undefined                     | 0-127    |                                          |
| 36  | Foot Controller LSB           | 0-127    |                                          |
| 37  | Portamento Time LSB           | 0-127    |                                          |
| 38  | Data Entry LSB                | 0-127    |                                          |
| 39  | Channel Volume LSB            | 0-127    |                                          |
| 40  | Balance LSB                   | 0-127    |                                          |
| 41  | Undefined                     | 0-127    |                                          |
| 42  | Pan LSB                       | 0-127    |                                          |
| 43  | Expression LSB                | 0-127    |                                          |
| 44-45 | Effect Control 1-2 LSB      | 0-127    |                                          |
| 46-47 | Undefined                   | 0-127    |                                          |
| 48-51 | General Purpose 1-4 LSB     | 0-127    |                                          |
| 52-63 | Undefined                   | 0-127    |                                          |
| **64** | **Sustain Pedal (Damper)** | 0-127    | **<63=off, >=64=on (switch)**           |
| 65  | Portamento On/Off             | 0-127    | <63=off, >=64=on                        |
| 66  | Sostenuto                     | 0-127    | <63=off, >=64=on                        |
| 67  | Soft Pedal                    | 0-127    | <63=off, >=64=on                        |
| 68  | Legato Footswitch             | 0-127    | <63=off, >=64=on                        |
| 69  | Hold 2                        | 0-127    | <63=off, >=64=on                        |
| 70  | Sound Variation / Timber      | 0-127    | Sound Controller 1                       |
| 71  | Timber / Harmonic Intensity   | 0-127    | Sound Controller 2 — often filter resonance |
| 72  | Release Time                  | 0-127    | Sound Controller 3                       |
| 73  | Attack Time                   | 0-127    | Sound Controller 4                       |
| 74  | Brightness / Cutoff Frequency | 0-127    | Sound Controller 5 — often filter cutoff |
| 75  | Decay Time                    | 0-127    | Sound Controller 6 (GM2)                 |
| 76  | Vibrato Rate                  | 0-127    | Sound Controller 7 (GM2)                 |
| 77  | Vibrato Depth                 | 0-127    | Sound Controller 8 (GM2)                 |
| 78  | Vibrato Delay                 | 0-127    | Sound Controller 9 (GM2)                 |
| 79  | Sound Controller 10           | 0-127    | Undefined / GM2                          |
| 80-83 | General Purpose 5-8         | 0-127    | Freely assignable                        |
| 84  | Portamento Control            | 0-127    | Source note for portamento               |
| 85-87 | Undefined                   | 0-127    |                                          |
| 88  | High Resolution Velocity Prefix | 0-127 | LSB of velocity (rare)                   |
| 89-90 | Undefined                   | 0-127    |                                          |
| 91  | Effects 1 Depth (Reverb)      | 0-127    | Reverb send level                        |
| 92  | Effects 2 Depth (Tremolo)     | 0-127    | Tremolo depth                            |
| 93  | Effects 3 Depth (Chorus)      | 0-127    | Chorus send level                        |
| 94  | Effects 4 Depth (Detune)      | 0-127    | Celeste/detune depth                     |
| 95  | Effects 5 Depth (Phaser)      | 0-127    | Phaser depth                             |
| 96  | Data Increment (RPN/NRPN)     | 0-127    | Increment data value by 1                |
| 97  | Data Decrement (RPN/NRPN)     | 0-127    | Decrement data value by 1                |
| 98  | NRPN LSB                      | 0-127    | Non-Registered Parameter Number LSB      |
| 99  | NRPN MSB                      | 0-127    | Non-Registered Parameter Number MSB      |
| 100 | RPN LSB                       | 0-127    | Registered Parameter Number LSB          |
| 101 | RPN MSB                       | 0-127    | Registered Parameter Number MSB          |
| 102-119 | Undefined                 | 0-127    | Available for custom mapping             |
| **120** | **All Sound Off**         | 0        | **Immediately silence all voices**       |
| **121** | **Reset All Controllers**  | 0        | **Reset CCs to defaults**               |
| 122 | Local Control On/Off          | 0/127    | 0=off, 127=on                           |
| **123** | **All Notes Off**         | 0        | **Release all notes (respects envelope)**|
| 124 | Omni Mode Off                 | 0        | + All Notes Off                          |
| 125 | Omni Mode On                  | 0        | + All Notes Off                          |
| 126 | Mono Mode On                  | 0-16     | + All Notes Off; value=channel count     |
| 127 | Poly Mode On                  | 0        | + All Notes Off                          |

### 6.2 CCs Most Relevant to Drum Machines

```javascript
const DRUM_MACHINE_CCS = {
  VOLUME:      7,   // Channel volume
  PAN:         10,  // Stereo positioning per channel
  EXPRESSION:  11,  // Dynamic volume (useful for automation)
  CUTOFF:      74,  // Filter brightness — velocity-to-brightness
  RESONANCE:   71,  // Filter resonance
  ATTACK:      73,  // Amp attack time
  DECAY:       75,  // Amp decay time
  RELEASE:     72,  // Amp release time
  REVERB:      91,  // Reverb send level
  CHORUS:      93,  // Chorus send level
  ALL_NOTES_OFF: 123, // Panic button
  ALL_SOUND_OFF: 120, // Hard panic
};
```

### 6.3 14-bit CC (High Resolution)

CCs 0-31 can be paired with CCs 32-63 for 14-bit resolution (16,384 steps instead of 128):

```javascript
// Send 14-bit volume value of 10000
const value14bit = 10000;
const msb = (value14bit >> 7) & 0x7F;
const lsb = value14bit & 0x7F;
output.send([0xB0 | channel, 7, msb]);   // CC7 MSB (volume)
output.send([0xB0 | channel, 39, lsb]);  // CC39 LSB (volume fine)
```

### 6.4 RPN (Registered Parameter Numbers)

RPNs provide standardized access to parameters like pitch bend range:

```javascript
// Set pitch bend range to +/- 12 semitones
function setPitchBendRange(output, channel, semitones, cents = 0) {
  const ch = channel - 1; // Convert 1-16 to 0-15
  output.send([0xB0 | ch, 101, 0]);    // RPN MSB = 0
  output.send([0xB0 | ch, 100, 0]);    // RPN LSB = 0 (Pitch Bend Sensitivity)
  output.send([0xB0 | ch, 6, semitones]); // Data Entry MSB
  output.send([0xB0 | ch, 38, cents]);    // Data Entry LSB
  output.send([0xB0 | ch, 101, 127]);  // RPN NULL (de-select)
  output.send([0xB0 | ch, 100, 127]);
}
```

---

## 7. MIDI Clock and Timing

### 7.1 MIDI Clock (24 PPQN)

MIDI clock sends **24 clock ticks per quarter note** (24 PPQN — Pulses Per Quarter Note). This is the fundamental sync resolution.

**Deriving tempo from clock messages:**

```
BPM = 60,000,000 / (microseconds_between_clocks * 24)
```

Or more practically in JavaScript:

```javascript
class MIDIClockReceiver {
  constructor() {
    this.lastClockTime = null;
    this.clockIntervals = [];
    this.tickCount = 0;
    this.isPlaying = false;
  }

  onMessage(event) {
    const [status] = event.data;

    switch (status) {
      case 0xF8: // Clock tick
        this.handleClock(event.timeStamp);
        break;
      case 0xFA: // Start
        this.tickCount = 0;
        this.isPlaying = true;
        this.onStart();
        break;
      case 0xFB: // Continue
        this.isPlaying = true;
        this.onContinue();
        break;
      case 0xFC: // Stop
        this.isPlaying = false;
        this.onStop();
        break;
    }
  }

  handleClock(timestamp) {
    if (this.lastClockTime !== null) {
      const interval = timestamp - this.lastClockTime;
      this.clockIntervals.push(interval);

      // Keep a rolling window of 24 ticks (1 quarter note) for averaging
      if (this.clockIntervals.length > 24) {
        this.clockIntervals.shift();
      }
    }

    this.lastClockTime = timestamp;
    this.tickCount++;

    if (this.isPlaying) {
      this.onTick(this.tickCount);
    }
  }

  get bpm() {
    if (this.clockIntervals.length < 2) return 0;
    const avgInterval = this.clockIntervals.reduce((a, b) => a + b, 0)
                        / this.clockIntervals.length;
    return 60000 / (avgInterval * 24); // ms → BPM
  }

  // Tick position within musical grid
  get position() {
    const tick = this.tickCount;
    return {
      totalTicks: tick,
      quarterNote: Math.floor(tick / 24),
      sixteenthNote: Math.floor(tick / 6),   // 24/4 = 6 ticks per 16th
      bar4_4: Math.floor(tick / 96),          // 24*4 = 96 ticks per bar
      tickWithinBeat: tick % 24,
      tickWithin16th: tick % 6,
    };
  }

  // Override these
  onStart() {}
  onContinue() {}
  onStop() {}
  onTick(tickCount) {}
}
```

### 7.2 Sending MIDI Clock (as Master)

```javascript
class MIDIClockSender {
  constructor(output, bpm = 120) {
    this.output = output;
    this.bpm = bpm;
    this.intervalId = null;
    this.tickCount = 0;
  }

  get tickIntervalMs() {
    // 24 ticks per quarter note
    return 60000 / (this.bpm * 24);
  }

  start() {
    this.tickCount = 0;
    this.output.send([0xFA]); // Start message
    this._startClock();
  }

  continue_() {
    this.output.send([0xFB]); // Continue message
    this._startClock();
  }

  stop() {
    this.output.send([0xFC]); // Stop message
    this._stopClock();
  }

  _startClock() {
    this._stopClock();

    // Use a high-resolution approach for better timing
    const interval = this.tickIntervalMs;
    let expected = performance.now() + interval;

    const tick = () => {
      const drift = performance.now() - expected;
      this.output.send([0xF8]); // Clock tick
      this.tickCount++;

      expected += interval;
      this.intervalId = setTimeout(tick, Math.max(0, interval - drift));
    };

    this.output.send([0xF8]); // First tick
    this.tickCount++;
    this.intervalId = setTimeout(tick, interval);
  }

  _stopClock() {
    if (this.intervalId !== null) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  setBpm(bpm) {
    this.bpm = bpm;
    if (this.intervalId !== null) {
      // Restart clock with new tempo
      this._startClock();
    }
  }
}
```

### 7.3 Timing Resolution Table

| Musical Division    | MIDI Clocks | At 120 BPM (ms) |
|---------------------|-------------|------------------|
| Whole note          | 96          | 2000             |
| Half note           | 48          | 1000             |
| Quarter note        | 24          | 500              |
| Eighth note         | 12          | 250              |
| Sixteenth note      | 6           | 125              |
| Thirty-second note  | 3           | 62.5             |
| Eighth triplet      | 8           | 166.67           |
| Sixteenth triplet   | 4           | 83.33            |

### 7.4 Jitter Considerations

MIDI clock jitter is a real problem, especially in browser environments:

- **USB MIDI latency**: ~1-3ms typical, can spike to 5-10ms
- **Browser timer resolution**: `setTimeout` has ~4ms minimum in background tabs; `requestAnimationFrame` is ~16ms
- **Audio worklet timing**: Much better — can achieve <1ms jitter using `AudioContext.currentTime`

**Best practice for clock generation in a drum machine:**

```javascript
// Use AudioWorklet for jitter-free timing
// In your AudioWorkletProcessor:
class ClockProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samplesPerTick = 0;
    this.sampleCounter = 0;
    this.bpm = 120;
    this.updateSamplesPerTick();
  }

  updateSamplesPerTick() {
    // sampleRate ticks per second / (bpm/60 beats per second * 24 clocks per beat)
    this.samplesPerTick = Math.round(sampleRate / (this.bpm / 60 * 24));
  }

  process(inputs, outputs, parameters) {
    for (let i = 0; i < outputs[0][0].length; i++) {
      this.sampleCounter++;
      if (this.sampleCounter >= this.samplesPerTick) {
        this.sampleCounter = 0;
        this.port.postMessage({ type: 'tick' });
      }
    }
    return true;
  }
}
```

### 7.5 Song Position Pointer

When a device receives a **Continue** (`0xFB`) message, it resumes from the last known position. To jump to a specific position, send a Song Position Pointer before Continue:

```javascript
function sendSongPosition(output, sixteenthNote) {
  // Song Position is in "MIDI beats" (= sixteenth notes)
  const position = sixteenthNote & 0x3FFF; // 14-bit max
  const lsb = position & 0x7F;
  const msb = (position >> 7) & 0x7F;
  output.send([0xF2, lsb, msb]);
}

// Jump to bar 5 (in 4/4 time) and continue
sendSongPosition(output, 4 * 16); // Bar 5 = 64 sixteenth notes
output.send([0xFB]); // Continue
```

---

## 8. MIDI Channels

### 8.1 Channel Assignment

MIDI supports **16 channels** (1-16), encoded as 0-15 in the status byte. Each channel is independent and can have its own instrument, volume, pan, and other settings.

**General MIDI Channel Conventions:**

| Channel | Convention                                |
|---------|-------------------------------------------|
| 1-9     | Melodic instruments                       |
| **10**  | **Percussion/Drums (reserved in GM)**     |
| 11-16   | Melodic instruments                       |

**Channel 10 is special:** In General MIDI, this channel always uses the percussion sound map. Program Change on channel 10 selects different drum kits rather than melodic instruments.

### 8.2 Multi-timbral Drum Machine Considerations

For a drum machine, you have two approaches:

1. **Single channel (GM style):** All drums on channel 10, different note numbers for different sounds.
2. **Multi-channel:** Each drum sound on its own channel. This allows per-drum CC control (individual volume, pan, effects). Some drum machines use channels 1-8 for individual drum voices + channel 10 for the combined kit.

```javascript
// Approach 1: All drums on channel 10
function triggerDrumGM(output, noteNumber, velocity) {
  output.send([0x99, noteNumber, velocity]); // 0x99 = Note On, channel 10
}

// Approach 2: Per-channel drums (for individual CC control)
const drumChannelMap = {
  kick:   0,  // Channel 1
  snare:  1,  // Channel 2
  hihat:  2,  // Channel 3
  // ... etc
};

function triggerDrumMulti(output, drumName, velocity) {
  const ch = drumChannelMap[drumName];
  const note = 36; // Use same note number; channel determines sound
  output.send([0x90 | ch, note, velocity]);
}
```

---

## 9. MIDI 2.0

MIDI 2.0 was ratified in February 2020 by the MIDI Manufacturers Association (MMA) and AMEI. It is backward-compatible with MIDI 1.0.

### 9.1 Universal MIDI Packet (UMP)

MIDI 2.0 replaces the byte-stream format with **Universal MIDI Packets** of fixed sizes:

| Packet Type | Size     | Contents                              |
|-------------|----------|---------------------------------------|
| Type 0      | 32 bits  | Utility Messages (timestamps, etc.)   |
| Type 1      | 32 bits  | System Real-Time and System Common    |
| Type 2      | 32 bits  | MIDI 1.0 Channel Voice Messages       |
| Type 3      | 64 bits  | Data Messages (SysEx7)                |
| Type 4      | 64 bits  | **MIDI 2.0 Channel Voice Messages**   |
| Type 5      | 128 bits | Data Messages (SysEx8)                |

### 9.2 Resolution Improvements

| Parameter        | MIDI 1.0     | MIDI 2.0        |
|------------------|--------------|-----------------|
| Velocity         | 7-bit (128)  | **16-bit (65,536)** |
| CC Value         | 7-bit (128)  | **32-bit (4,294,967,296)** |
| Pitch Bend       | 14-bit       | **32-bit**       |
| Aftertouch       | 7-bit        | **32-bit**       |
| Note Number      | 7-bit (128)  | 7-bit + **16-bit pitch attribute** |
| Articulation     | N/A          | **Per-note attribute** |

### 9.3 Per-Note Controllers

One of the most significant MIDI 2.0 features. Instead of CCs applying to the whole channel, controllers can target individual notes:

- **Per-Note Pitch Bend**: Bend a single note without affecting others
- **Per-Note CC**: Apply modulation, filter, etc. to a single note
- **Per-Note Management**: Detach/re-attach note state

For drum machines, this means you could apply unique filter sweeps to just the hi-hat while leaving the kick dry, all on the same channel.

### 9.4 Profiles

Profiles allow devices to auto-configure for specific use cases. A "Drum Machine" profile could automatically:
- Set up channel assignments
- Configure CC mappings
- Set drum note assignments
- Define velocity response curves

### 9.5 Property Exchange

JSON-based bidirectional communication for:
- Querying device capabilities
- Getting/setting device parameters by name
- Exchanging configuration data
- No more guessing what CCs do on an unknown device

### 9.6 MIDI-CI (Capability Inquiry)

The negotiation protocol that enables MIDI 2.0 features:

1. **Discovery**: Devices find each other and exchange identity
2. **Protocol Negotiation**: Agree on MIDI 1.0 or MIDI 2.0
3. **Profile Configuration**: Exchange supported profiles
4. **Property Exchange**: Query/set named parameters

### 9.7 Current Browser Support

As of early 2026, the Web MIDI API still operates with MIDI 1.0 byte streams. MIDI 2.0 UMP is not yet exposed in browsers. USB MIDI 2.0 device class support is in progress at the OS level (Windows, macOS, Linux). For now, browser drum machines should target MIDI 1.0.

---

## 10. Web MIDI API

### 10.1 Requesting Access

```javascript
// Basic access (no SysEx)
async function initMIDI() {
  if (!navigator.requestMIDIAccess) {
    throw new Error('Web MIDI API not supported in this browser');
  }

  try {
    const midiAccess = await navigator.requestMIDIAccess();
    return midiAccess;
  } catch (err) {
    throw new Error(`MIDI access denied: ${err.message}`);
  }
}

// With SysEx access (triggers more prominent permission prompt)
async function initMIDIWithSysEx() {
  const midiAccess = await navigator.requestMIDIAccess({ sysex: true });
  return midiAccess;
}
```

**Permission requirements:**
- Must be served over HTTPS (secure context)
- Browser will show a permission prompt to the user
- SysEx access requires a separate, more prominent permission
- Permission can be gated by the `Permissions-Policy: midi` HTTP header

### 10.2 MIDIAccess Object

```javascript
// midiAccess.inputs  — MIDIInputMap (Map-like, id → MIDIInput)
// midiAccess.outputs — MIDIOutputMap (Map-like, id → MIDIOutput)
// midiAccess.sysexEnabled — boolean
// midiAccess.onstatechange — event handler for device connect/disconnect

const midiAccess = await navigator.requestMIDIAccess();

// List all inputs
for (const [id, input] of midiAccess.inputs) {
  console.log(`Input: ${input.name} (${input.manufacturer}) [${id}]`);
  console.log(`  State: ${input.state}, Connection: ${input.connection}`);
}

// List all outputs
for (const [id, output] of midiAccess.outputs) {
  console.log(`Output: ${output.name} (${output.manufacturer}) [${id}]`);
}
```

### 10.3 MIDIPort Properties (shared by MIDIInput and MIDIOutput)

| Property       | Type   | Description                                               |
|----------------|--------|-----------------------------------------------------------|
| `id`           | string | Unique persistent identifier                              |
| `manufacturer` | string | Device manufacturer name (may be empty)                   |
| `name`         | string | Device/port name                                          |
| `type`         | string | `"input"` or `"output"`                                   |
| `version`      | string | Port version (may be empty)                               |
| `state`        | string | `"connected"` or `"disconnected"`                         |
| `connection`   | string | `"open"`, `"closed"`, or `"pending"`                      |

Methods:
- `open()` — Returns a Promise. Opens the port (happens implicitly when you attach a listener or call send).
- `close()` — Returns a Promise. Closes the port.

### 10.4 MIDIInput — Receiving Messages

```javascript
function setupInput(midiAccess) {
  for (const [id, input] of midiAccess.inputs) {
    input.onmidimessage = (event) => {
      // event.data — Uint8Array of MIDI bytes
      // event.timeStamp — DOMHighResTimeStamp (ms since page load)
      const [status, data1, data2] = event.data;
      console.log(`[${event.timeStamp.toFixed(1)}ms] ${hex(status)} ${hex(data1)} ${hex(data2)}`);
    };
  }
}

function hex(byte) {
  return byte !== undefined ? '0x' + byte.toString(16).toUpperCase().padStart(2, '0') : '';
}
```

### 10.5 MIDIOutput — Sending Messages

```javascript
function sendNoteOn(output, channel, note, velocity) {
  output.send([0x90 | (channel - 1), note, velocity]);
}

function sendNoteOff(output, channel, note) {
  output.send([0x80 | (channel - 1), note, 0]);
}

// Scheduled sending with timestamp (ms relative to MIDIAccess creation time)
// Uses the same time base as performance.now()
function sendScheduled(output, data, delayMs) {
  output.send(data, performance.now() + delayMs);
}

// Schedule a drum pattern hit 100ms from now
output.send([0x99, 36, 100], performance.now() + 100);
```

The timestamp parameter in `send()` allows sub-millisecond scheduling precision, which is critical for tight drum machine timing.

### 10.6 Device Hot-Plugging

```javascript
function setupHotPlug(midiAccess) {
  midiAccess.onstatechange = (event) => {
    const port = event.port;
    console.log(`MIDI ${port.type} "${port.name}" ${port.state}`);

    if (port.type === 'input' && port.state === 'connected') {
      // Re-attach listener to newly connected input
      port.onmidimessage = handleMIDIMessage;
    }

    // Refresh your UI device list
    updateDeviceList(midiAccess);
  };
}

function updateDeviceList(midiAccess) {
  const inputs = [...midiAccess.inputs.values()].filter(p => p.state === 'connected');
  const outputs = [...midiAccess.outputs.values()].filter(p => p.state === 'connected');
  // Update UI...
  return { inputs, outputs };
}
```

### 10.7 Error Handling

```javascript
class MIDIManager {
  constructor() {
    this.access = null;
    this.inputs = new Map();
    this.outputs = new Map();
  }

  async init() {
    // Feature detection
    if (!navigator.requestMIDIAccess) {
      return { supported: false, error: 'Web MIDI API not supported' };
    }

    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false });
    } catch (err) {
      // Common errors:
      // - "Permission denied" — user rejected the prompt
      // - "SecurityError" — not a secure context (HTTP instead of HTTPS)
      // - "AbortError" — permission policy blocks MIDI
      return { supported: true, error: err.message };
    }

    this._scan();
    this.access.onstatechange = () => this._scan();
    return { supported: true, error: null };
  }

  _scan() {
    this.inputs.clear();
    this.outputs.clear();
    for (const [id, port] of this.access.inputs) {
      if (port.state === 'connected') this.inputs.set(id, port);
    }
    for (const [id, port] of this.access.outputs) {
      if (port.state === 'connected') this.outputs.set(id, port);
    }
  }

  getOutputByName(nameSubstring) {
    for (const output of this.outputs.values()) {
      if (output.name.toLowerCase().includes(nameSubstring.toLowerCase())) {
        return output;
      }
    }
    return null;
  }
}
```

### 10.8 Browser Support

| Browser          | Support | Notes                                         |
|------------------|---------|-----------------------------------------------|
| Chrome           | 43+     | Full support since 2015                       |
| Edge             | 79+     | Chromium-based Edge                           |
| Opera            | 30+     | Chromium-based                                |
| Firefox          | 108+    | Added in late 2022, behind no flag since 108  |
| Safari (macOS)   | None    | Not supported as of early 2026                |
| Safari (iOS)     | None    | Not supported                                 |
| Chrome Android   | 43+     | Supported                                     |
| Firefox Android  | 108+    | Supported                                     |
| Samsung Internet | 4+      | Supported                                     |
| WebView Android  | 43+     | Supported                                     |

**Safari workaround:** For Safari, consider using the [WebMIDI.js](https://github.com/niccolofulgenzi/webmidi) polyfill backed by a Jazz plugin, or direct users to Chrome/Firefox. There is no native workaround.

### 10.9 Latency Considerations

| Transport          | Typical Latency | Jitter      | Notes                          |
|--------------------|-----------------|-------------|--------------------------------|
| USB MIDI           | 1-3 ms          | <1 ms       | Best for real-time performance |
| Bluetooth MIDI     | 10-30 ms        | 5-15 ms     | Noticeable; compensate in code |
| Virtual MIDI (IAC) | <1 ms           | <0.5 ms     | macOS inter-app routing        |
| Network MIDI (RTP) | 5-20 ms         | 2-10 ms     | LAN only; compensate           |
| Web MIDI → Audio   | +3-10 ms        | varies      | Browser audio pipeline adds latency |

**Latency compensation for Bluetooth MIDI:**

```javascript
class LatencyCompensator {
  constructor(compensationMs = 20) {
    this.compensation = compensationMs;
    this.timestamps = [];
  }

  // When receiving, subtract compensation to estimate when the event "really" happened
  adjustInputTimestamp(event) {
    return event.timeStamp - this.compensation;
  }

  // When sending, add compensation to schedule ahead
  adjustOutputTimestamp(desiredTime) {
    return desiredTime + this.compensation;
  }

  // Auto-calibrate by measuring round-trip time
  measureRoundTrip(input, output) {
    return new Promise((resolve) => {
      const testNote = [0x90, 60, 1]; // Quiet test note
      const noteOff = [0x80, 60, 0];
      const sendTime = performance.now();

      const handler = (event) => {
        if (event.data[0] === 0x90 && event.data[1] === 60) {
          const roundTrip = performance.now() - sendTime;
          input.onmidimessage = null;
          output.send(noteOff);
          resolve(roundTrip / 2); // One-way estimate
        }
      };

      input.onmidimessage = handler;
      output.send(testNote);

      // Timeout after 1 second
      setTimeout(() => {
        input.onmidimessage = null;
        resolve(null);
      }, 1000);
    });
  }
}
```

---

## 11. Web MIDI Code Examples

### 11.1 Complete MIDI Message Parser

```javascript
class MIDIParser {
  static parse(data) {
    if (!data || data.length === 0) return null;

    const status = data[0];

    // System Real-Time (single byte, 0xF8-0xFF)
    if (status >= 0xF8) {
      return MIDIParser.parseRealTime(status);
    }

    // System Common (0xF0-0xF7)
    if (status >= 0xF0) {
      return MIDIParser.parseSystemCommon(status, data);
    }

    // Channel messages (0x80-0xEF)
    const type = status & 0xF0;
    const channel = (status & 0x0F) + 1;

    switch (type) {
      case 0x80: return { type: 'noteoff', channel, note: data[1], velocity: data[2] };
      case 0x90:
        if (data[2] === 0) {
          return { type: 'noteoff', channel, note: data[1], velocity: 0 };
        }
        return { type: 'noteon', channel, note: data[1], velocity: data[2] };
      case 0xA0: return { type: 'polyaftertouch', channel, note: data[1], pressure: data[2] };
      case 0xB0: return { type: 'cc', channel, controller: data[1], value: data[2] };
      case 0xC0: return { type: 'programchange', channel, program: data[1] };
      case 0xD0: return { type: 'channelaftertouch', channel, pressure: data[1] };
      case 0xE0: return {
        type: 'pitchbend', channel,
        value: ((data[2] << 7) | data[1]) - 8192, // -8192 to +8191
        raw: (data[2] << 7) | data[1],             // 0 to 16383
      };
      default: return { type: 'unknown', data: [...data] };
    }
  }

  static parseRealTime(status) {
    const types = {
      0xF8: 'clock', 0xF9: 'undefined', 0xFA: 'start',
      0xFB: 'continue', 0xFC: 'stop', 0xFD: 'undefined',
      0xFE: 'activesensing', 0xFF: 'reset',
    };
    return { type: types[status] || 'unknown', status };
  }

  static parseSystemCommon(status, data) {
    switch (status) {
      case 0xF0: return {
        type: 'sysex',
        data: [...data.slice(1, data.indexOf(0xF7))],
        raw: [...data],
      };
      case 0xF1: return { type: 'mtc', data: data[1] };
      case 0xF2: return {
        type: 'songposition',
        position: (data[2] << 7) | data[1], // In MIDI beats (sixteenth notes)
      };
      case 0xF3: return { type: 'songselect', song: data[1] };
      case 0xF6: return { type: 'tunerequest' };
      case 0xF7: return { type: 'eox' };
      default: return { type: 'unknown', status };
    }
  }
}
```

### 11.2 Drum Pad Input Handler

```javascript
class DrumPadReceiver {
  constructor(midiAccess) {
    this.listeners = new Map(); // note → Set<callback>
    this.allNoteListeners = new Set();

    for (const [, input] of midiAccess.inputs) {
      input.onmidimessage = (event) => this._handleMessage(event);
    }
  }

  _handleMessage(event) {
    const msg = MIDIParser.parse(event.data);
    if (!msg) return;

    if (msg.type === 'noteon' && msg.channel === 10) {
      const drum = GM_DRUM_MAP[msg.note] || `Note ${msg.note}`;

      // Notify specific listeners
      const listeners = this.listeners.get(msg.note);
      if (listeners) {
        for (const cb of listeners) {
          cb({ note: msg.note, drum, velocity: msg.velocity, timestamp: event.timeStamp });
        }
      }

      // Notify catch-all listeners
      for (const cb of this.allNoteListeners) {
        cb({ note: msg.note, drum, velocity: msg.velocity, timestamp: event.timeStamp });
      }
    }
  }

  // Listen for a specific drum hit
  on(noteNumber, callback) {
    if (!this.listeners.has(noteNumber)) {
      this.listeners.set(noteNumber, new Set());
    }
    this.listeners.get(noteNumber).add(callback);
    return () => this.listeners.get(noteNumber)?.delete(callback);
  }

  // Listen for any drum hit
  onAny(callback) {
    this.allNoteListeners.add(callback);
    return () => this.allNoteListeners.delete(callback);
  }
}

// Usage
const pads = new DrumPadReceiver(midiAccess);
pads.on(36, ({ velocity }) => console.log(`Kick! vel=${velocity}`));
pads.on(38, ({ velocity }) => console.log(`Snare! vel=${velocity}`));
pads.onAny(({ drum, velocity }) => console.log(`${drum}: ${velocity}`));
```

### 11.3 MIDI Output — Sending Drum Patterns

```javascript
class DrumSequencer {
  constructor(output, bpm = 120) {
    this.output = output;
    this.bpm = bpm;
    this.steps = 16;
    this.pattern = new Map(); // noteNumber → boolean[16]
    this.velocities = new Map(); // noteNumber → number[16]
    this.currentStep = 0;
    this.isPlaying = false;
    this.channel = 9; // Channel 10 (0-indexed)
  }

  setStep(note, step, on, velocity = 100) {
    if (!this.pattern.has(note)) {
      this.pattern.set(note, new Array(this.steps).fill(false));
      this.velocities.set(note, new Array(this.steps).fill(100));
    }
    this.pattern.get(note)[step] = on;
    this.velocities.get(note)[step] = velocity;
  }

  start() {
    this.currentStep = 0;
    this.isPlaying = true;
    this._scheduleNext();
  }

  stop() {
    this.isPlaying = false;
    // All notes off
    this.output.send([0xB0 | this.channel, 123, 0]);
  }

  _scheduleNext() {
    if (!this.isPlaying) return;

    const stepDuration = (60000 / this.bpm) / 4; // 16th note duration in ms
    const now = performance.now();

    // Trigger all active notes at this step
    for (const [note, steps] of this.pattern) {
      if (steps[this.currentStep]) {
        const vel = this.velocities.get(note)[this.currentStep];
        this.output.send([0x90 | this.channel, note, vel], now);
        // Schedule note off slightly before next step
        this.output.send([0x80 | this.channel, note, 0], now + stepDuration * 0.9);
      }
    }

    this.currentStep = (this.currentStep + 1) % this.steps;

    // Use setTimeout with drift compensation
    const elapsed = performance.now() - now;
    setTimeout(() => this._scheduleNext(), stepDuration - elapsed);
  }
}

// Usage: classic drum pattern
const seq = new DrumSequencer(output, 120);

// Kick on 1 and 3 (steps 0,8 of a 16-step pattern)
seq.setStep(36, 0, true, 127);
seq.setStep(36, 8, true, 110);

// Snare on 2 and 4 (steps 4, 12)
seq.setStep(38, 4, true, 120);
seq.setStep(38, 12, true, 120);

// Closed hi-hat on every 8th note
for (let i = 0; i < 16; i += 2) {
  seq.setStep(42, i, true, i % 4 === 0 ? 100 : 70);
}

// Open hi-hat before snare
seq.setStep(46, 3, true, 90);
seq.setStep(46, 11, true, 90);

seq.start();
```

### 11.4 MIDI Learn Implementation

```javascript
class MIDILearn {
  constructor(midiAccess) {
    this.midiAccess = midiAccess;
    this.mappings = new Map(); // paramName → { channel, controller, min, max }
    this.paramCallbacks = new Map(); // paramName → callback(value)
    this.learnMode = false;
    this.learnTarget = null;
    this.learnResolve = null;

    // Listen on all inputs
    for (const [, input] of midiAccess.inputs) {
      input.onmidimessage = (event) => this._handleMessage(event);
    }
  }

  _handleMessage(event) {
    const msg = MIDIParser.parse(event.data);
    if (!msg) return;

    // If in learn mode, capture the first CC or note
    if (this.learnMode && this.learnResolve) {
      if (msg.type === 'cc') {
        const mapping = { channel: msg.channel, controller: msg.controller };
        this.mappings.set(this.learnTarget, mapping);
        this.learnMode = false;
        this.learnResolve(mapping);
        this.learnResolve = null;
        return;
      }
    }

    // Normal operation: route CCs to mapped parameters
    if (msg.type === 'cc') {
      for (const [paramName, mapping] of this.mappings) {
        if (msg.channel === mapping.channel && msg.controller === mapping.controller) {
          const callback = this.paramCallbacks.get(paramName);
          if (callback) {
            // Normalize 0-127 to 0.0-1.0
            const normalized = msg.value / 127;
            // Scale to parameter range if defined
            const min = mapping.min ?? 0;
            const max = mapping.max ?? 1;
            const scaled = min + normalized * (max - min);
            callback(scaled, msg.value);
          }
        }
      }
    }
  }

  // Enter learn mode for a parameter. Returns a Promise.
  learn(paramName) {
    return new Promise((resolve) => {
      this.learnMode = true;
      this.learnTarget = paramName;
      this.learnResolve = resolve;
      console.log(`Move a knob/fader to assign it to "${paramName}"...`);
    });
  }

  // Register a callback for a parameter
  onParam(paramName, callback, { min = 0, max = 1 } = {}) {
    this.paramCallbacks.set(paramName, callback);
    const existing = this.mappings.get(paramName);
    if (existing) {
      existing.min = min;
      existing.max = max;
    }
  }

  // Cancel learn mode
  cancelLearn() {
    this.learnMode = false;
    this.learnTarget = null;
    if (this.learnResolve) {
      this.learnResolve(null);
      this.learnResolve = null;
    }
  }

  // Save/restore mappings
  exportMappings() {
    return JSON.stringify([...this.mappings]);
  }

  importMappings(json) {
    this.mappings = new Map(JSON.parse(json));
  }
}

// Usage
const learn = new MIDILearn(midiAccess);

// Register parameters
learn.onParam('tempo', (value) => {
  sequencer.bpm = 60 + value * 180; // 60-240 BPM
}, { min: 60, max: 240 });

learn.onParam('kickVolume', (value) => {
  mixer.setLevel('kick', value);
}, { min: 0, max: 1 });

learn.onParam('filterCutoff', (value) => {
  filter.frequency.value = value;
}, { min: 100, max: 10000 });

// MIDI Learn: user clicks a knob in UI, then:
await learn.learn('tempo');       // "Move a knob/fader..."
await learn.learn('kickVolume');
await learn.learn('filterCutoff');

// Save for next session
localStorage.setItem('midiMappings', learn.exportMappings());
```

### 11.5 MIDI Clock Sync (Slave to External Clock)

```javascript
class DrumMachineClockSlave {
  constructor(midiAccess, onStep) {
    this.tickCount = 0;
    this.isPlaying = false;
    this.onStep = onStep; // callback(stepIndex)
    this.stepsPerBeat = 4; // 16th notes
    this.ticksPerStep = 24 / this.stepsPerBeat; // 6 ticks per 16th note

    for (const [, input] of midiAccess.inputs) {
      input.onmidimessage = (event) => this._handle(event);
    }
  }

  _handle(event) {
    const status = event.data[0];

    switch (status) {
      case 0xFA: // Start
        this.tickCount = 0;
        this.isPlaying = true;
        this.onStep(0);
        break;

      case 0xFB: // Continue
        this.isPlaying = true;
        break;

      case 0xFC: // Stop
        this.isPlaying = false;
        break;

      case 0xF8: // Clock tick
        if (!this.isPlaying) break;
        this.tickCount++;
        if (this.tickCount % this.ticksPerStep === 0) {
          const stepIndex = (this.tickCount / this.ticksPerStep) % 16;
          this.onStep(stepIndex);
        }
        break;

      case 0xF2: // Song Position Pointer
        const beats = (event.data[2] << 7) | event.data[1];
        this.tickCount = beats * 6; // Convert MIDI beats to ticks
        break;
    }
  }
}

// Usage
const slave = new DrumMachineClockSlave(midiAccess, (step) => {
  console.log(`Step ${step}`);
  triggerDrumsAtStep(step);
});
```

---

## 12. MIDI File Format (.mid)

### 12.1 Overview

Standard MIDI Files (SMF) use the `.mid` extension. The format stores MIDI events with delta-time offsets, allowing playback at any tempo.

**Three file types:**
- **Type 0**: Single track containing all channels merged together
- **Type 1**: Multiple tracks, played simultaneously. Track 1 typically contains tempo/time signature. Most common format.
- **Type 2**: Multiple independent tracks (rarely used)

### 12.2 File Structure

```
[Header Chunk]
  "MThd" (4 bytes)
  Chunk length (4 bytes, always 6)
  Format type (2 bytes: 0, 1, or 2)
  Number of tracks (2 bytes)
  Division (2 bytes: ticks per quarter note)

[Track Chunk 1]
  "MTrk" (4 bytes)
  Chunk length (4 bytes)
  [delta_time] [event] [delta_time] [event] ...

[Track Chunk 2]  (if Type 1 or 2)
  ...
```

### 12.3 Header Chunk (MThd) — Byte by Byte

```
Offset  Bytes  Value          Description
0       4      0x4D546864     "MThd" (ASCII)
4       4      0x00000006     Chunk data length (always 6)
8       2      0x0000/01/02   Format type
10      2      0x0001+        Number of track chunks
12      2      varies         Division (timing resolution)
```

**Division field:**
- If bit 15 = 0: Value is **ticks per quarter note** (TPQN). Common values: 96, 120, 240, 480, 960.
- If bit 15 = 1: SMPTE time division (negative SMPTE frame rate in upper byte, ticks per frame in lower byte). Rarely used.

### 12.4 Variable-Length Quantity (VLQ)

Delta times and some other values use variable-length encoding:

- Each byte uses 7 data bits (bits 0-6) and 1 continuation bit (bit 7)
- Bit 7 = 1 means "more bytes follow"; bit 7 = 0 means "last byte"
- Big-endian: most significant bits come first

```
Value       VLQ Encoding
0x00        0x00
0x7F        0x7F
0x80        0x81, 0x00
0x2000      0xC0, 0x00
0x3FFF      0xFF, 0x7F
0x4000      0x81, 0x80, 0x00
0x1FFFFF    0xFF, 0xFF, 0x7F
0x200000    0x81, 0x80, 0x80, 0x00
0x0FFFFFFF  0xFF, 0xFF, 0xFF, 0x7F  (maximum)
```

**JavaScript encode/decode:**

```javascript
function encodeVLQ(value) {
  if (value < 0) throw new Error('VLQ value must be non-negative');

  const bytes = [];
  bytes.push(value & 0x7F);
  value >>= 7;

  while (value > 0) {
    bytes.push((value & 0x7F) | 0x80);
    value >>= 7;
  }

  return bytes.reverse();
}

function decodeVLQ(bytes, offset = 0) {
  let value = 0;
  let bytesRead = 0;

  while (true) {
    const byte = bytes[offset + bytesRead];
    value = (value << 7) | (byte & 0x7F);
    bytesRead++;

    if ((byte & 0x80) === 0) break; // Last byte
    if (bytesRead > 4) throw new Error('VLQ too long');
  }

  return { value, bytesRead };
}
```

### 12.5 Track Events

Track data consists of `<delta_time><event>` pairs. Delta time is VLQ-encoded ticks since the previous event.

**MIDI Events:** Standard channel messages (Note On, Note Off, CC, etc.) stored without the running status optimization in many implementations, but running status is valid in SMF.

**Meta Events:** Track metadata, prefixed with `0xFF`:

```
0xFF <type> <length (VLQ)> <data...>
```

| Type   | Name              | Data                                      |
|--------|-------------------|-------------------------------------------|
| `0x00` | Sequence Number   | 2 bytes: MSB, LSB                         |
| `0x01` | Text Event        | ASCII text                                |
| `0x02` | Copyright Notice  | ASCII text                                |
| `0x03` | Track Name        | ASCII text                                |
| `0x04` | Instrument Name   | ASCII text                                |
| `0x05` | Lyric             | ASCII text                                |
| `0x06` | Marker            | ASCII text                                |
| `0x07` | Cue Point         | ASCII text                                |
| `0x20` | MIDI Channel Prefix | 1 byte: channel (0-15)                  |
| `0x2F` | **End of Track**  | 0 bytes (mandatory, must be last event)   |
| `0x51` | **Set Tempo**     | 3 bytes: microseconds per quarter note    |
| `0x54` | SMPTE Offset      | 5 bytes: hr, mn, se, fr, ff               |
| `0x58` | **Time Signature** | 4 bytes: nn, dd, cc, bb                  |
| `0x59` | Key Signature     | 2 bytes: sf (sharps/flats), mi (major/minor) |
| `0x7F` | Sequencer Specific | Variable-length proprietary data         |

**Set Tempo detail:**

```
microseconds_per_quarter_note = (byte1 << 16) | (byte2 << 8) | byte3
BPM = 60,000,000 / microseconds_per_quarter_note
```

For 120 BPM: `60,000,000 / 120 = 500,000 = 0x07A120`

**Time Signature detail:**

```
nn = numerator (e.g., 4 for 4/4)
dd = denominator as power of 2 (e.g., 2 for 4/4 because 2^2 = 4)
cc = MIDI clocks per metronome click (typically 24)
bb = number of 32nd notes per 24 MIDI clocks (typically 8)
```

For 4/4 time: `[0x04, 0x02, 0x18, 0x08]`

### 12.6 SysEx Events in MIDI Files

Two forms in SMF:

```
0xF0 <length VLQ> <data... ending with 0xF7>   // Complete SysEx
0xF7 <length VLQ> <data...>                     // Escape or continuation
```

---

## 13. Generating MIDI Files in JavaScript

### 13.1 Complete MIDI File Writer

```javascript
class MIDIFileWriter {
  constructor(ticksPerQuarterNote = 480) {
    this.tpqn = ticksPerQuarterNote;
    this.tracks = [];
  }

  // Add a new track, returns the track index
  addTrack() {
    const track = [];
    this.tracks.push(track);
    return this.tracks.length - 1;
  }

  // Add an event to a track: { delta, data: [...bytes] }
  addEvent(trackIndex, delta, data) {
    this.tracks[trackIndex].push({ delta, data });
  }

  // Convenience: Add a meta event
  addMeta(trackIndex, delta, type, data) {
    this.addEvent(trackIndex, delta, [0xFF, type, ...encodeVLQ(data.length), ...data]);
  }

  // Set track name
  setTrackName(trackIndex, name) {
    const bytes = [...name].map(c => c.charCodeAt(0));
    this.addMeta(trackIndex, 0, 0x03, bytes);
  }

  // Set tempo (BPM)
  setTempo(trackIndex, delta, bpm) {
    const uspqn = Math.round(60000000 / bpm);
    this.addMeta(trackIndex, delta, 0x51, [
      (uspqn >> 16) & 0xFF,
      (uspqn >> 8) & 0xFF,
      uspqn & 0xFF,
    ]);
  }

  // Set time signature
  setTimeSignature(trackIndex, delta, numerator, denominatorPower, clocksPerClick = 24, thirtySecondsPerQuarter = 8) {
    this.addMeta(trackIndex, delta, 0x58, [
      numerator, denominatorPower, clocksPerClick, thirtySecondsPerQuarter,
    ]);
  }

  // Add Note On
  noteOn(trackIndex, delta, channel, note, velocity) {
    this.addEvent(trackIndex, delta, [0x90 | (channel & 0x0F), note, velocity]);
  }

  // Add Note Off
  noteOff(trackIndex, delta, channel, note, velocity = 0) {
    this.addEvent(trackIndex, delta, [0x80 | (channel & 0x0F), note, velocity]);
  }

  // Add Control Change
  controlChange(trackIndex, delta, channel, controller, value) {
    this.addEvent(trackIndex, delta, [0xB0 | (channel & 0x0F), controller, value]);
  }

  // Add Program Change
  programChange(trackIndex, delta, channel, program) {
    this.addEvent(trackIndex, delta, [0xC0 | (channel & 0x0F), program]);
  }

  // End of Track (mandatory)
  endTrack(trackIndex, delta = 0) {
    this.addMeta(trackIndex, delta, 0x2F, []);
  }

  // Build the complete MIDI file as Uint8Array
  build() {
    const chunks = [];

    // Header chunk
    const format = this.tracks.length > 1 ? 1 : 0;
    const header = new Uint8Array([
      0x4D, 0x54, 0x68, 0x64, // "MThd"
      0x00, 0x00, 0x00, 0x06, // Chunk length = 6
      0x00, format,            // Format type
      (this.tracks.length >> 8) & 0xFF, this.tracks.length & 0xFF, // Number of tracks
      (this.tpqn >> 8) & 0xFF, this.tpqn & 0xFF, // Ticks per quarter note
    ]);
    chunks.push(header);

    // Track chunks
    for (const track of this.tracks) {
      const trackData = [];

      for (const event of track) {
        trackData.push(...encodeVLQ(event.delta));
        trackData.push(...event.data);
      }

      const trackChunk = new Uint8Array([
        0x4D, 0x54, 0x72, 0x6B, // "MTrk"
        (trackData.length >> 24) & 0xFF,
        (trackData.length >> 16) & 0xFF,
        (trackData.length >> 8) & 0xFF,
        trackData.length & 0xFF,
        ...trackData,
      ]);
      chunks.push(trackChunk);
    }

    // Concatenate all chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  // Download as .mid file
  download(filename = 'pattern.mid') {
    const data = this.build();
    const blob = new Blob([data], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

### 13.2 Export a Drum Pattern to MIDI File

```javascript
function exportDrumPattern(pattern, bpm = 120, filename = 'drum-pattern.mid') {
  // pattern format:
  // { noteNumber: [velocity_or_0, velocity_or_0, ...] } for N steps
  //
  // Example:
  // { 36: [127,0,0,0, 127,0,0,0, 127,0,0,0, 127,0,0,0],   // kick
  //   38: [0,0,0,0,   120,0,0,0, 0,0,0,0,   120,0,0,0],   // snare
  //   42: [100,0,100,0,100,0,100,0,100,0,100,0,100,0,100,0] } // hihat

  const TPQN = 480;
  const midi = new MIDIFileWriter(TPQN);
  const DRUM_CHANNEL = 9; // Channel 10

  // Determine the number of steps from the pattern
  const steps = Object.values(pattern)[0]?.length || 16;
  const ticksPerStep = TPQN / 4; // Assuming 16th note steps (4 per beat)
  const noteDuration = Math.round(ticksPerStep * 0.8); // 80% gate

  // Track 0: Tempo and time signature
  const t0 = midi.addTrack();
  midi.setTrackName(t0, 'Tempo');
  midi.setTempo(t0, 0, bpm);
  midi.setTimeSignature(t0, 0, 4, 2); // 4/4
  midi.endTrack(t0);

  // Track 1: Drum pattern
  const t1 = midi.addTrack();
  midi.setTrackName(t1, 'Drums');
  midi.programChange(t1, 0, DRUM_CHANNEL, 0); // Standard drum kit

  // Collect all events with absolute tick positions
  const events = [];

  for (const [noteStr, velocities] of Object.entries(pattern)) {
    const note = parseInt(noteStr);

    for (let step = 0; step < steps; step++) {
      const vel = velocities[step];
      if (vel > 0) {
        const tickOn = step * ticksPerStep;
        const tickOff = tickOn + noteDuration;
        events.push({ tick: tickOn, type: 'on', note, velocity: vel });
        events.push({ tick: tickOff, type: 'off', note });
      }
    }
  }

  // Sort by tick, then note offs before note ons at the same tick
  events.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    if (a.type === 'off' && b.type === 'on') return -1;
    if (a.type === 'on' && b.type === 'off') return 1;
    return 0;
  });

  // Convert absolute ticks to delta times
  let lastTick = 0;
  for (const event of events) {
    const delta = event.tick - lastTick;
    if (event.type === 'on') {
      midi.noteOn(t1, delta, DRUM_CHANNEL, event.note, event.velocity);
    } else {
      midi.noteOff(t1, delta, DRUM_CHANNEL, event.note);
    }
    lastTick = event.tick;
  }

  // End of track
  midi.endTrack(t1, ticksPerStep); // Small gap after last event

  midi.download(filename);
}

// Example usage: Classic rock beat
exportDrumPattern({
  36: [127, 0, 0, 0,   0, 0, 0, 0,   127, 0, 0, 0,   0, 0, 0, 0  ], // Kick
  38: [0,   0, 0, 0,   120,0, 0, 0,   0,   0, 0, 0,   120,0, 0, 0 ], // Snare
  42: [100, 0, 100, 0, 100,0, 100, 0, 100, 0, 100, 0, 100,0, 100,0], // Closed HH
  46: [0,   0, 0,   90, 0, 0, 0,  0,  0,   0, 0,  90, 0,  0, 0, 0 ], // Open HH
}, 120, 'rock-beat.mid');
```

### 13.3 Parsing a MIDI File

```javascript
class MIDIFileReader {
  static parse(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    let offset = 0;

    // Parse header
    const headerTag = String.fromCharCode(...data.slice(0, 4));
    if (headerTag !== 'MThd') throw new Error('Not a MIDI file');

    const headerLen = readUint32(data, 4);
    const format = readUint16(data, 8);
    const numTracks = readUint16(data, 10);
    const division = readUint16(data, 12);

    const tpqn = (division & 0x8000) === 0 ? division : null;
    offset = 14;

    // Parse tracks
    const tracks = [];
    for (let t = 0; t < numTracks; t++) {
      const tag = String.fromCharCode(...data.slice(offset, offset + 4));
      if (tag !== 'MTrk') throw new Error(`Expected MTrk at offset ${offset}`);

      const trackLen = readUint32(data, offset + 4);
      offset += 8;

      const trackEnd = offset + trackLen;
      const events = [];
      let runningStatus = 0;

      while (offset < trackEnd) {
        // Read delta time
        const vlq = decodeVLQ(data, offset);
        const delta = vlq.value;
        offset += vlq.bytesRead;

        // Read event
        let statusByte = data[offset];

        if (statusByte === 0xFF) {
          // Meta event
          offset++;
          const metaType = data[offset++];
          const lenVlq = decodeVLQ(data, offset);
          offset += lenVlq.bytesRead;
          const metaData = [...data.slice(offset, offset + lenVlq.value)];
          offset += lenVlq.value;

          events.push({ delta, type: 'meta', metaType, data: metaData });
        } else if (statusByte === 0xF0 || statusByte === 0xF7) {
          // SysEx
          offset++;
          const lenVlq = decodeVLQ(data, offset);
          offset += lenVlq.bytesRead;
          const sysexData = [...data.slice(offset, offset + lenVlq.value)];
          offset += lenVlq.value;

          events.push({ delta, type: 'sysex', data: sysexData });
        } else {
          // MIDI event (channel message)
          if (statusByte & 0x80) {
            runningStatus = statusByte;
            offset++;
          } else {
            statusByte = runningStatus;
          }

          const msgType = statusByte & 0xF0;
          const channel = statusByte & 0x0F;

          let eventData;
          if (msgType === 0xC0 || msgType === 0xD0) {
            // 1 data byte
            eventData = [data[offset++]];
          } else {
            // 2 data bytes
            eventData = [data[offset++], data[offset++]];
          }

          events.push({ delta, type: 'midi', status: statusByte, channel, msgType, data: eventData });
        }
      }

      tracks.push(events);
    }

    return { format, numTracks, tpqn, division, tracks };
  }
}

function readUint32(data, offset) {
  return (data[offset] << 24) | (data[offset+1] << 16) | (data[offset+2] << 8) | data[offset+3];
}

function readUint16(data, offset) {
  return (data[offset] << 8) | data[offset+1];
}

// Usage: Load and parse a MIDI file
async function loadMIDIFile(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const midi = MIDIFileReader.parse(buffer);

  console.log(`Format: ${midi.format}, Tracks: ${midi.numTracks}, TPQN: ${midi.tpqn}`);

  // Extract drum notes from all tracks
  const drumNotes = [];
  let absoluteTick = 0;

  for (const track of midi.tracks) {
    absoluteTick = 0;
    for (const event of track) {
      absoluteTick += event.delta;
      if (event.type === 'midi' && event.channel === 9 && event.msgType === 0x90 && event.data[1] > 0) {
        drumNotes.push({
          tick: absoluteTick,
          note: event.data[0],
          velocity: event.data[1],
          drum: GM_DRUM_MAP[event.data[0]] || `Note ${event.data[0]}`,
        });
      }
    }
  }

  return { midi, drumNotes };
}
```

### 13.4 Import MIDI File to Drum Grid

```javascript
function midiFileToDrumGrid(midiData, stepsPerBar = 16) {
  const { tpqn, tracks } = midiData;
  const ticksPerStep = (tpqn * 4) / stepsPerBar; // Assuming 4/4 time

  // Find tempo from meta events
  let tempo = 120; // Default
  for (const track of tracks) {
    for (const event of track) {
      if (event.type === 'meta' && event.metaType === 0x51) {
        const uspqn = (event.data[0] << 16) | (event.data[1] << 8) | event.data[2];
        tempo = Math.round(60000000 / uspqn);
        break;
      }
    }
  }

  // Collect drum events with absolute ticks
  const drumHits = [];
  for (const track of tracks) {
    let tick = 0;
    for (const event of track) {
      tick += event.delta;
      if (event.type === 'midi' && event.channel === 9) {
        if (event.msgType === 0x90 && event.data[1] > 0) {
          drumHits.push({ tick, note: event.data[0], velocity: event.data[1] });
        }
      }
    }
  }

  // Find the total length in ticks
  const maxTick = drumHits.reduce((max, h) => Math.max(max, h.tick), 0);
  const totalSteps = Math.ceil(maxTick / ticksPerStep) + 1;
  const totalBars = Math.ceil(totalSteps / stepsPerBar);

  // Quantize hits to the grid
  const grid = {}; // noteNumber → velocity[totalSteps]

  for (const hit of drumHits) {
    const step = Math.round(hit.tick / ticksPerStep);
    if (!grid[hit.note]) {
      grid[hit.note] = new Array(totalBars * stepsPerBar).fill(0);
    }
    if (step < grid[hit.note].length) {
      grid[hit.note][step] = hit.velocity;
    }
  }

  return { grid, tempo, totalBars };
}
```

---

## Appendix A: Quick Reference — Bit Masks and Constants

```javascript
// Status byte extraction
const STATUS_MASK     = 0xF0;
const CHANNEL_MASK    = 0x0F;

// Message types (upper nibble of status byte)
const NOTE_OFF        = 0x80;
const NOTE_ON         = 0x90;
const POLY_AFTERTOUCH = 0xA0;
const CONTROL_CHANGE  = 0xB0;
const PROGRAM_CHANGE  = 0xC0;
const CHAN_AFTERTOUCH  = 0xD0;
const PITCH_BEND      = 0xE0;

// System messages
const SYSEX_START     = 0xF0;
const MTC_QUARTER     = 0xF1;
const SONG_POSITION   = 0xF2;
const SONG_SELECT     = 0xF3;
const TUNE_REQUEST    = 0xF6;
const SYSEX_END       = 0xF7;
const TIMING_CLOCK    = 0xF8;
const MIDI_START      = 0xFA;
const MIDI_CONTINUE   = 0xFB;
const MIDI_STOP       = 0xFC;
const ACTIVE_SENSING  = 0xFE;
const SYSTEM_RESET    = 0xFF;

// Timing
const CLOCKS_PER_QUARTER_NOTE = 24;
const CLOCKS_PER_16TH         = 6;
const CLOCKS_PER_8TH          = 12;

// Drum channel
const GM_DRUM_CHANNEL = 9; // 0-indexed (= channel 10 in 1-indexed)

// Data byte range
const MIDI_MIN_DATA   = 0;
const MIDI_MAX_DATA   = 127;

// Pitch bend center
const PITCH_BEND_CENTER = 8192;
```

## Appendix B: Note Number to Frequency

```javascript
// MIDI note 69 = A4 = 440 Hz
function midiNoteToFrequency(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function frequencyToMidiNote(freq) {
  return Math.round(12 * Math.log2(freq / 440) + 69);
}

// Reference table (useful for tuned percussion)
// C4 = 60 = 261.63 Hz
// A4 = 69 = 440.00 Hz
```

## Appendix C: Common Drum Machine Patterns as MIDI Data

```javascript
// Patterns are arrays of 16 velocity values (0 = off) per instrument
// Each position is a sixteenth note

const PATTERNS = {
  'Four on the Floor': {
    36: [127,0,0,0, 127,0,0,0, 127,0,0,0, 127,0,0,0], // Kick every beat
    42: [100,0,100,0,100,0,100,0,100,0,100,0,100,0,100,0], // 8th note hats
    38: [0,0,0,0, 120,0,0,0, 0,0,0,0, 120,0,0,0], // Snare on 2 & 4
  },

  'Boom Bap': {
    36: [120,0,0,0, 0,0,0,0, 0,0,120,0, 0,0,0,0],  // Kick: 1 and "3-and"
    38: [0,0,0,0, 110,0,0,0, 0,0,0,0, 110,0,0,0],   // Snare on 2 & 4
    42: [90,0,80,0, 90,0,80,0, 90,0,80,0, 90,0,80,0], // Hats: accent on beats
    46: [0,0,0,0, 0,0,0,80, 0,0,0,0, 0,0,0,80],       // Open hat upbeat
  },

  'Bossa Nova': {
    36: [110,0,0,0, 0,0,100,0, 0,0,110,0, 0,0,0,0],
    37: [0,0,0,100, 0,0,0,0, 0,0,0,100, 0,100,0,0],  // Side stick
    42: [80,0,80,0, 80,0,80,0, 80,0,80,0, 80,0,80,0],
  },

  'Drum and Bass': {
    36: [127,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,110,0],
    38: [0,0,0,0, 120,0,0,0, 0,0,0,0, 120,0,0,0],
    42: [100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],
  },

  'Reggaeton': {
    36: [127,0,0,110, 0,0,0,0, 127,0,0,110, 0,0,0,0],
    38: [0,0,0,0, 120,0,0,0, 0,0,0,0, 120,0,0,0],
    42: [90,0,90,0, 90,0,90,0, 90,0,90,0, 90,0,90,0],
  },
};
```

---

*This document is based on the MIDI 1.0 Detailed Specification (MMA/AMEI), the General MIDI Level 1 specification, the Web MIDI API specification (W3C), and the MIDI 2.0 specification. All code examples are vanilla JavaScript with no dependencies.*
