# Polyrhythmic Sequencer Architecture

## Technical Design for BeatForge's Universal Rhythm Engine

---

> The same data structure that handles a 16-step house beat must handle a 120-beat Ottoman Zencir
> and a 6-layer West African polyrhythmic ensemble. This document describes how.

---

# Part I: THE CORE INSIGHT

## 1. Why One Architecture Handles Everything

Every rhythmic system documented in the BeatForge research corpus — from 4/4 rock to Ewe polyrhythm to Ottoman compound usul to Carnatic tala to gamelan colotomic structure — can be modeled as combinations of two operations on **atomic patterns**:

1. **Sequential chaining**: Pattern A plays, then Pattern B plays, then Pattern C plays, then loop. (Ottoman Zencir, song mode, suite forms)
2. **Simultaneous layering with independent cycle lengths**: Track A is 12 steps, Track B is 4 steps, Track C is 7 steps, all running at the same tempo. (West African polyrhythm, Afro-Cuban cross-rhythm, gamelan)

These are not separate features. They are two views of the same underlying model: a **directed graph of atomic patterns** where edges can be sequential (play after) or parallel (play simultaneously).

A standard 16-step drum pattern is the degenerate case: all tracks have length 16, and there's one node in the graph.

---

# Part II: THE ATOMIC PATTERN

## 2. Data Model

The fundamental unit is the **AtomicPattern** — a single instrument track with its own cycle length.

```typescript
interface AtomicPattern {
  /** Unique identifier */
  id: string;

  /** Instrument/voice this pattern controls */
  instrument: InstrumentId;

  /** Number of steps in one cycle of this pattern */
  stepCount: number;

  /** How many steps constitute one beat (for tempo calculation)
   *  e.g., 4 = sixteenth notes, 3 = triplets, 2 = eighth notes
   *  This allows different tracks to use different subdivisions */
  stepsPerBeat: number;

  /** The hit pattern: array of length stepCount
   *  Each element is null (rest) or a Hit object */
  steps: (Hit | null)[];

  /** Beat grouping for visual display
   *  e.g., [2, 2, 2, 3] for 9/8 aksak
   *  Sum must equal stepCount / stepsPerBeat (number of beats) */
  beatGrouping?: number[];

  /** Group color assignments (maps group index to color) */
  groupColors?: string[];
}

interface Hit {
  /** Velocity: 0-127 (MIDI standard) */
  velocity: number;

  /** Optional: micro-timing offset in fractions of a step
   *  -0.5 to +0.5 (for swing, humanization, J Dilla-style feel) */
  offset?: number;

  /** Optional: probability of this hit firing (0-1)
   *  For generative/euclidean patterns */
  probability?: number;
}
```

### Examples

**Standard rock hi-hat (16 steps, 4/4):**
```typescript
{
  id: "hh-rock",
  instrument: "hihat-closed",
  stepCount: 16,
  stepsPerBeat: 4,
  steps: [
    { velocity: 100 }, null, { velocity: 80 }, null,
    { velocity: 100 }, null, { velocity: 80 }, null,
    { velocity: 100 }, null, { velocity: 80 }, null,
    { velocity: 100 }, null, { velocity: 80 }, null,
  ],
  beatGrouping: [1, 1, 1, 1], // standard 4/4
}
```

**Ewe bell pattern (12 steps, 12/8):**
```typescript
{
  id: "bell-ewe",
  instrument: "bell",
  stepCount: 12,
  stepsPerBeat: 3, // triplet subdivision (4 beats × 3 = 12)
  steps: [
    { velocity: 110 }, null, { velocity: 90 },
    null, { velocity: 90 }, null,
    { velocity: 110 }, null, null,
    { velocity: 90 }, null, { velocity: 90 },
  ],
  beatGrouping: [1, 1, 1, 1], // 4 beats of 3
}
```

**9/8 Aksak pattern (9 steps):**
```typescript
{
  id: "davul-aksak",
  instrument: "kick",
  stepCount: 9,
  stepsPerBeat: 1, // each step = one eighth note
  steps: [
    { velocity: 120 }, null, null,
    { velocity: 100 }, null,
    { velocity: 100 }, null,
    { velocity: 110 }, null,
  ],
  beatGrouping: [3, 2, 2, 2], // 9/8 as 3+2+2+2
  groupColors: ["#e17055", "#6c5ce7", "#6c5ce7", "#6c5ce7"],
}
```

---

## 3. Pattern Composition: The Two Operators

### Operator 1: `stack()` — Simultaneous Layering (Polyrhythm)

`stack()` takes multiple AtomicPatterns and plays them simultaneously. Each pattern cycles independently at the same tempo.

```typescript
interface StackedPattern {
  type: "stack";
  id: string;
  name: string;

  /** The tempo in BPM (shared by all layers) */
  tempo: number;

  /** The atomic patterns playing simultaneously */
  layers: AtomicPattern[];

  /** Computed: the super-cycle length (LCM of all layer stepCounts,
   *  adjusted for stepsPerBeat differences) */
  superCycleSteps: number;
}
```

**The LCM Calculation:**

When tracks have different cycle lengths, they create a **super-cycle** — the point where all tracks simultaneously return to step 0. This is the Least Common Multiple of the cycle lengths.

```typescript
function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function superCycleLength(layers: AtomicPattern[]): number {
  // Normalize all step counts to a common subdivision
  // (e.g., convert everything to 48th notes as common denominator)
  const normalized = layers.map(l => {
    const commonSub = 48; // 48 = LCM(2, 3, 4, 6, 8, 12, 16)
    const multiplier = commonSub / l.stepsPerBeat;
    return l.stepCount * multiplier;
  });
  return normalized.reduce(lcm);
}
```

**Example — Ewe Ensemble:**
```
Bell:      12 steps (stepsPerBeat: 3) → 12 × (48/3) = 192 normalized
Shaker:     4 steps (stepsPerBeat: 1) →  4 × (48/1) = 192 normalized
Kidi drum:  8 steps (stepsPerBeat: 2) →  8 × (48/2) = 192 normalized
Kagan:      4 steps (stepsPerBeat: 1) →  4 × (48/1) = 192 normalized
Master:    12 steps (stepsPerBeat: 3) → 12 × (48/3) = 192 normalized

LCM(192, 192, 192, 192, 192) = 192 normalized steps = 4 beats
Super-cycle = 4 beats (all tracks aligned, as expected for 4-feel music)
```

**Example — 3:4 Cross-Rhythm:**
```
Track A:  3 steps (stepsPerBeat: 1) →  3 × 48 = 144
Track B:  4 steps (stepsPerBeat: 1) →  4 × 48 = 192

LCM(144, 192) = 576 normalized steps = 12 beats
Super-cycle = 12 beats (classic 3-against-4 resolves every 12)
```

**Example — 7:12 (complex polyrhythm):**
```
Track A:  7 steps (stepsPerBeat: 1) →  7 × 48 = 336
Track B: 12 steps (stepsPerBeat: 3) → 12 × 16 = 192

LCM(336, 192) = 2016 normalized steps = 42 beats
Super-cycle = 42 beats (resolves after a long time — audibly complex)
```

### Operator 2: `chain()` — Sequential Chaining (Compound Forms)

`chain()` takes multiple patterns (which can themselves be stacks) and plays them in sequence.

```typescript
interface ChainedPattern {
  type: "chain";
  id: string;
  name: string;

  /** The links in the chain, played in order */
  links: ChainLink[];

  /** Whether to loop the entire chain */
  loop: boolean;
}

interface ChainLink {
  /** The pattern to play (can be a StackedPattern or a simple group) */
  pattern: StackedPattern;

  /** How many times to repeat this link before advancing */
  repeatCount: number;

  /** Tempo for this link (allows tempo changes between sections) */
  tempo: number;

  /** Display color for this link in the chain view */
  color?: string;
}
```

**Example — Zencir (120 beats):**
```typescript
const zencir: ChainedPattern = {
  type: "chain",
  id: "zencir-120",
  name: "Zencir",
  loop: true,
  links: [
    {
      pattern: cifteDuyek,  // 16-beat stack (kudum + bendir patterns)
      repeatCount: 1,
      tempo: 40,            // Very slow for classical performance
      color: "#e17055",     // Coral — distinct visual identity
    },
    {
      pattern: fahte,       // 20-beat stack
      repeatCount: 1,
      tempo: 40,
      color: "#fdcb6e",     // Gold
    },
    {
      pattern: cenber,      // 24-beat stack
      repeatCount: 1,
      tempo: 40,
      color: "#00b894",     // Green
    },
    {
      pattern: devrIKebir,  // 28-beat stack
      repeatCount: 1,
      tempo: 40,
      color: "#6c5ce7",     // Purple
    },
    {
      pattern: berefsan,    // 32-beat stack
      repeatCount: 1,
      tempo: 40,
      color: "#0984e3",     // Blue
    },
  ],
};
// Total: 16 + 20 + 24 + 28 + 32 = 120 beats
// At 40 BPM: 120 / 40 = 3 minutes per cycle (traditional fast tempo)
// At 12 BPM: 120 / 12 = 10 minutes per cycle (traditional slow tempo)
```

**Example — Song Mode (Verse-Chorus):**
```typescript
const song: ChainedPattern = {
  type: "chain",
  id: "my-song",
  name: "Demo Song",
  loop: true,
  links: [
    { pattern: verse,  repeatCount: 2, tempo: 120, color: "#636e72" },
    { pattern: chorus, repeatCount: 1, tempo: 120, color: "#e17055" },
    { pattern: verse,  repeatCount: 2, tempo: 120, color: "#636e72" },
    { pattern: chorus, repeatCount: 1, tempo: 120, color: "#e17055" },
    { pattern: bridge, repeatCount: 1, tempo: 115, color: "#6c5ce7" },
    { pattern: chorus, repeatCount: 2, tempo: 120, color: "#e17055" },
  ],
};
```

---

# Part III: THE SCHEDULING ENGINE

## 4. How the Engine Plays These Patterns

The scheduling engine extends the lookahead scheduler from `web-audio-dsp-reference.md` to handle polyrhythmic stacks and chains.

### Core Scheduling Principle

The engine does NOT pre-compute the entire super-cycle. Instead, it maintains a **cursor** for each active track that advances independently:

```typescript
interface TrackCursor {
  /** The AtomicPattern this cursor belongs to */
  pattern: AtomicPattern;

  /** Current step within the pattern (0 to stepCount-1) */
  currentStep: number;

  /** AudioContext time of the next step for this track */
  nextStepTime: number;

  /** Duration of one step in seconds (derived from tempo + stepsPerBeat) */
  stepDuration: number;
}
```

The main scheduler loop:
1. For each active track cursor, check if `nextStepTime` falls within the lookahead window
2. If yes, schedule the hit (if any) at that time, advance `currentStep`, compute next `nextStepTime`
3. When `currentStep` wraps past `stepCount`, reset to 0 (the track has completed one cycle)

This approach is **O(n)** in the number of active tracks, regardless of cycle length. A 120-step Zencir pattern is no more expensive to schedule than a 4-step shaker — each track just advances its own cursor.

```typescript
class PolyrhythmicScheduler {
  private ctx: AudioContext;
  private cursors: TrackCursor[] = [];
  private isPlaying = false;
  private timerId: number | null = null;

  // Chain state
  private chain: ChainedPattern | null = null;
  private currentLinkIndex = 0;
  private currentLinkRepeat = 0;

  // Lookahead parameters
  private scheduleAheadTime = 0.1;  // seconds
  private lookAheadInterval = 25;    // ms

  /** Start playing a stacked pattern */
  playStack(stack: StackedPattern): void {
    this.stop();
    this.cursors = stack.layers.map(pattern => ({
      pattern,
      currentStep: 0,
      nextStepTime: this.ctx.currentTime + 0.05,
      stepDuration: 60 / stack.tempo / pattern.stepsPerBeat,
    }));
    this.isPlaying = true;
    this.schedule();
  }

  /** Start playing a chained pattern */
  playChain(chain: ChainedPattern): void {
    this.stop();
    this.chain = chain;
    this.currentLinkIndex = 0;
    this.currentLinkRepeat = 0;
    this.loadLink(chain.links[0]);
    this.isPlaying = true;
    this.schedule();
  }

  private loadLink(link: ChainLink): void {
    const startTime = this.cursors.length > 0
      ? Math.max(...this.cursors.map(c => c.nextStepTime))
      : this.ctx.currentTime + 0.05;

    this.cursors = link.pattern.layers.map(pattern => ({
      pattern,
      currentStep: 0,
      nextStepTime: startTime,
      stepDuration: 60 / link.tempo / pattern.stepsPerBeat,
    }));
  }

  private schedule(): void {
    const deadline = this.ctx.currentTime + this.scheduleAheadTime;

    for (const cursor of this.cursors) {
      while (cursor.nextStepTime < deadline) {
        const hit = cursor.pattern.steps[cursor.currentStep];

        if (hit !== null) {
          // Apply micro-timing offset
          const offset = hit.offset ?? 0;
          const time = cursor.nextStepTime + (offset * cursor.stepDuration);

          // Apply probability
          if (hit.probability === undefined || Math.random() < hit.probability) {
            this.triggerHit(cursor.pattern.instrument, hit.velocity, time);
          }
        }

        // Emit step event for UI (visualizer, grid highlight)
        this.onStep?.(cursor.pattern.id, cursor.currentStep, cursor.nextStepTime);

        // Advance cursor
        cursor.currentStep++;
        cursor.nextStepTime += cursor.stepDuration;

        // Check for cycle completion
        if (cursor.currentStep >= cursor.pattern.stepCount) {
          cursor.currentStep = 0;
          // If this is the longest track in a chain link,
          // check if we need to advance to the next link
          this.checkChainAdvance(cursor);
        }
      }
    }

    if (this.isPlaying) {
      this.timerId = window.setTimeout(
        () => this.schedule(),
        this.lookAheadInterval
      );
    }
  }

  private checkChainAdvance(completedCursor: TrackCursor): void {
    if (!this.chain) return;

    // In chain mode, advance when the LONGEST track in the current
    // link completes its cycle. This ensures all tracks finish together.
    const allAtZero = this.cursors.every(c => c.currentStep === 0);
    if (!allAtZero) return;

    const link = this.chain.links[this.currentLinkIndex];
    this.currentLinkRepeat++;

    if (this.currentLinkRepeat >= link.repeatCount) {
      // Move to next link
      this.currentLinkIndex++;
      this.currentLinkRepeat = 0;

      if (this.currentLinkIndex >= this.chain.links.length) {
        if (this.chain.loop) {
          this.currentLinkIndex = 0;
        } else {
          this.stop();
          return;
        }
      }

      this.loadLink(this.chain.links[this.currentLinkIndex]);
      this.onChainAdvance?.(this.currentLinkIndex);
    }
  }

  private triggerHit(instrument: InstrumentId, velocity: number, time: number): void {
    // Delegate to the synth engine (808/909 voice, sampled hit, etc.)
    // This connects to the audio engine from web-audio-dsp-reference.md
    this.synthEngine.trigger(instrument, velocity, time);
  }

  stop(): void {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.cursors = [];
    this.chain = null;
  }

  // Callbacks for UI
  onStep: ((patternId: string, step: number, time: number) => void) | null = null;
  onChainAdvance: ((linkIndex: number) => void) | null = null;
}
```

### Swing / Shuffle Implementation

Swing is applied per-track by adjusting the timing of even-numbered steps:

```typescript
function applySwing(stepDuration: number, stepIndex: number, swingAmount: number): number {
  // swingAmount: 0 = straight, 0.5 = full triplet swing
  // Only affect even-indexed steps (the "ands")
  if (stepIndex % 2 === 1) {
    return stepDuration * (1 + swingAmount);
  } else {
    return stepDuration * (1 - swingAmount);
  }
}
```

Different tracks can have different swing amounts — a hi-hat might swing while the kick stays straight, creating the "lazy" feel of J Dilla-style production.

---

# Part IV: UI VISUALIZATION

## 5. How to Display Polyrhythm

The UI challenge is showing multiple tracks with different cycle lengths in a way that is intuitive and beautiful.

### Strategy 1: Linear Grid with Visual Repetition

Each track is a horizontal row. Short tracks visually repeat to fill the super-cycle length:

```
Bell  (12): [X . x . x . X . . x . x]
Shaker (4): [X . . .|X . . .|X . . .]  ← repeats 3×
Kidi   (8): [X . x . X . . x|X . x . X . . x]  ← repeats 1.5×
                                         ↑ faded to show repetition
```

Pros: Familiar grid layout, shows alignment points clearly
Cons: Gets wide for large super-cycles, repetition can be confusing

### Strategy 2: Circular/Radial Display

Each track is a concentric ring in a circular display. The outermost ring is the longest cycle. Steps are positioned radially. The playhead is a single rotating line that sweeps all rings simultaneously.

```
         ╭──────────╮
       ╱   ╭──────╮   ╲
     ╱   ╱  ╭────╮  ╲   ╲
    │   │  │ kick │  │   │     ← innermost: 4-step kick
    │   │  ╰────╯  │   │     ← middle: 8-step kidi
     ╲   ╲  ________╱  ╱     ← outer: 12-step bell
       ╲   ╰──────╯   ╱
         ╰──────────╯
```

Pros: Naturally shows cyclical nature, compact, beautiful, culturally resonant (many traditions think of rhythm as circular)
Cons: Less familiar to users trained on linear DAWs, harder to edit individual steps

### Strategy 3: Hybrid (Recommended for BeatForge)

- **Default view**: Linear grid. All tracks same length (standard mode). This is what 90% of users see.
- **Polyrhythm view**: Linear grid where each track shows its own cycle length. Shorter tracks show faint repetitions. A "super-cycle bar" at the top shows progress through the full LCM.
- **Circular view**: Available as a visualization/performance mode (not primary editing). Beautiful for Library mode when exploring world rhythms.

### Chain View (for Zencir / Song Mode)

A horizontal timeline showing colored blocks for each link:

```
┌─────────┬───────────┬─────────────┬───────────────┬─────────────────┐
│ Ç.Düyek │   Fahte   │   Cenber    │  Devr-i Kebir │    Berefşan     │
│   16    │    20     │     24      │      28       │       32        │
│  coral  │   gold    │   green     │    purple     │      blue       │
└─────────┴───────────┴─────────────┴───────────────┴─────────────────┘
                        ▲ currently playing
```

Clicking a block zooms into that link's pattern grid for editing.

---

# Part V: BEAT GROUPING — THE KILLER FEATURE

## 6. How Beat Grouping Unifies Everything

Beat grouping is the visual system that makes all of this accessible. It answers the question: "How do I *feel* this pattern?"

### The Concept

Any pattern can be grouped into beats of different sizes. The grouping tells the performer (and the visual display) where the strong and weak beats fall:

| Pattern | Steps | Grouping | Visual |
|---------|-------|----------|--------|
| 4/4 rock | 16 | 4+4+4+4 | `████ ████ ████ ████` |
| 9/8 aksak | 9 | 2+2+2+3 | `██ ██ ██ ███` |
| 7/8 (Devr-i Hindi) | 7 | 3+2+2 | `███ ██ ██` |
| 12/8 Afro | 12 | 3+3+3+3 | `███ ███ ███ ███` |
| 5/4 | 5 | 3+2 or 2+3 | `███ ██` or `██ ███` |
| Çifte Düyek (16) | 16 | 4+4+4+4 | `████ ████ ████ ████` |
| Fahte (20) | 20 | 4+4+4+4+4 | `████ ████ ████ ████ ████` |
| Cenber (24) | 24 | 4+4+4+4+4+4 | 6 groups of 4 |
| Devr-i Kebir (28) | 28 | 6+4+4+6+4+4 | `██████ ████ ████ ██████ ████ ████` |
| Berefşan (32) | 32 | 4+4+4+4+4+4+4+4 | 8 groups of 4 |

### Color Coding

Each beat group gets a distinct color. This is how BeatForge makes complex meters intuitive:

- In **9/8 as 2+2+2+3**: groups 1-3 are purple (short), group 4 is coral (long)
- In **Zencir chain view**: each of the 5 component usuls gets its own color
- In **polyrhythm view**: each track's grouping colors are independent, so the user can see the internal structure of each layer

### Interactive Grouping

Users can **click** to change groupings. Tapping on a group boundary in the grid splits or merges groups. This lets users explore how the same 9 steps feel as 2+2+2+3 vs 3+2+2+2 vs 3+3+3 — which is exactly the kind of exploration that builds rhythmic understanding.

---

# Part VI: WHAT THIS ARCHITECTURE ENABLES

## 7. Coverage of World Rhythm Systems

| Tradition | Requirement | How This Architecture Handles It |
|-----------|-------------|----------------------------------|
| **Western 4/4** | 16-step grid, all tracks aligned | Stack with all tracks at stepCount=16 |
| **Odd meters** (Balkan, Turkish) | 7, 9, 11, 13 steps | AtomicPattern with any stepCount |
| **Aksak** (asymmetric) | Grouping visualization | beatGrouping + groupColors |
| **West African polyrhythm** | Bell (12) vs drum (4) vs drum (6) | Stack with independent stepCounts, LCM=12 |
| **Afro-Cuban** | Clave (16) vs tumbao (16) with 3:2 feel | Stack (same length, grouping shows 3:2) |
| **Ottoman compound usul** | Zencir (120 = 16+20+24+28+32) | Chain of 5 stacked patterns |
| **Carnatic tala** | Adi tala (8 beats = 4+2+2), tihai (3× phrase to resolve) | beatGrouping for structure, chain for tihai |
| **Gamelan colotomic** | Gong (256), kenong (64), ketuk (16), kempul (32) | Stack with stepCounts 256, 64, 16, 32 |
| **Euclidean rhythms** | Distribute k hits evenly across n steps | AtomicPattern generated by Euclidean algorithm |
| **Song mode** | Verse → Chorus → Bridge | Chain with repeatCount per link |
| **Speed trainer** | Same pattern, BPM increases | Chain with same pattern, different tempos per link |
| **Cross-rhythm** (3:4, 5:4, 7:4) | Different cycle lengths | Stack: one track at 3, another at 4 |

## 8. Progressive Disclosure

Most users never need the full power of this system. BeatForge should expose it gradually:

### Level 1: Standard Mode (Practice Mode default)
- All tracks: 16 steps, 4/4, same tempo
- Beat grouping shows 4+4+4+4
- This is 90% of use cases

### Level 2: Variable Step Count (Library Mode, Studio Mode)
- Tracks can have different step counts (for odd meters)
- Beat grouping shows asymmetric divisions
- Unlocked when exploring world rhythms in Library

### Level 3: Polyrhythmic Mode (Studio Mode)
- Tracks can have independent cycle lengths
- LCM visualization shows the super-cycle
- Unlocked in Studio Mode as an advanced feature

### Level 4: Chain Mode (Studio Mode)
- Patterns can be chained sequentially
- Each link can be a different meter, tempo, or pattern
- This is Song Mode / Zencir / suite forms

### Level 5: Chain + Polyrhythm (advanced)
- Each chain link can contain polyrhythmic stacks
- Full power for complex world rhythm representation
- Available but not prominently featured

---

# Part VII: IMPLEMENTATION NOTES

## 9. Performance Considerations

### Memory

An AtomicPattern with 120 steps and 8 properties per Hit is approximately:
`120 × 8 bytes = 960 bytes`

A Zencir with 5 component patterns, each with 4 instrument tracks:
`5 × 4 × (avg 24 steps × 8 bytes) = ~3.8 KB`

This is negligible. Even a complex composition with hundreds of patterns would fit in kilobytes.

### Scheduling Performance

The lookahead scheduler runs every 25ms and only processes steps within the 100ms lookahead window. At 120 BPM with 16th-note resolution:
- One step = 125ms
- At most 1-2 steps per track per scheduler invocation
- With 8 tracks: 8-16 step evaluations per 25ms tick

This is trivially fast for any modern browser. Even at 300 BPM (singeli territory) with 32nd-note resolution:
- One step ≈ 31ms
- At most 3-4 steps per track per invocation
- With 16 tracks: 48-64 step evaluations per tick

Still well within budget.

### Audio Timing

The lookahead scheduler (from `web-audio-dsp-reference.md`) schedules audio events using AudioContext.currentTime, which provides sub-millisecond precision. This is accurate enough for any polyrhythmic pattern — human perception of rhythmic displacement is approximately 10-20ms.

## 10. JSON Serialization (Pattern Format)

Patterns are stored as JSON for community contribution and sharing:

```json
{
  "type": "chain",
  "id": "zencir-120",
  "name": "Zencir (120 beats)",
  "metadata": {
    "tradition": "Ottoman Classical",
    "region": "Turkey",
    "difficulty": "Advanced",
    "description": "The longest classical usul — a chain of five component cycles.",
    "source": "research/technical/turkish-rhythmic-systems-reference.md"
  },
  "links": [
    {
      "name": "Çifte Düyek",
      "tempo": 40,
      "color": "#e17055",
      "repeatCount": 1,
      "pattern": {
        "type": "stack",
        "layers": [
          {
            "instrument": "kudum-dum",
            "stepCount": 16,
            "stepsPerBeat": 4,
            "beatGrouping": [1, 1, 1, 1],
            "steps": "X...x...X...x..."
          },
          {
            "instrument": "kudum-tek",
            "stepCount": 16,
            "stepsPerBeat": 4,
            "steps": "..x...x...x...x."
          }
        ]
      }
    }
  ]
}
```

The compact string notation (`"X...x...X...x..."`) maps:
- `X` = accented hit (velocity 110+)
- `x` = normal hit (velocity 80-100)
- `g` = ghost note (velocity 25-45)
- `.` = rest

This is the same notation used throughout the BeatForge pattern research files, making the research corpus directly convertible to playable patterns.

## 11. Euclidean Rhythm Generation

As a bonus, the atomic pattern model naturally supports **Euclidean rhythms** — the mathematical distribution of k hits across n steps that produces many traditional patterns:

```typescript
function euclidean(steps: number, hits: number, rotation: number = 0): (Hit | null)[] {
  // Bjorklund's algorithm
  const pattern: boolean[] = new Array(steps).fill(false);
  let bucket = 0;
  for (let i = 0; i < steps; i++) {
    bucket += hits;
    if (bucket >= steps) {
      bucket -= steps;
      pattern[i] = true;
    }
  }
  // Apply rotation
  const rotated = [...pattern.slice(rotation), ...pattern.slice(0, rotation)];
  return rotated.map(hit => hit ? { velocity: 100 } : null);
}

// E(3, 8) = Cuban tresillo: [x . . x . . x .]
// E(5, 8) = Cuban cinquillo: [x . x x . x x .]
// E(5, 12) = Ewe traditional: [x . . x . x . . x . x .]
// E(7, 12) = West African bell: [x . x x . x . x x . x .]
// E(7, 16) = Brazilian samba: [x . x . x . x x . x . x . x . x]
```

The UI could include a "Euclidean generator" that creates AtomicPatterns from (steps, hits, rotation) parameters — a powerful tool for both education and creative exploration.

---

# Part VIII: RELATIONSHIP TO PRODUCT SPEC

## 12. How This Maps to BeatForge Phases

| Phase | What's Available | Architecture Level |
|-------|------------------|-------------------|
| **Phase 0.5** | Foundation: audio engine, basic sequencer | Stack with fixed 16-step tracks |
| **Phase 1** | Practice Mode: metronome, presets, speed trainer | Stack with variable stepCount + beat grouping + chain (for speed trainer tempo ramp) |
| **Phase 2** | Studio Mode: step grid, song/chain mode | Full stack + chain |
| **Phase 3** | Library Mode: world rhythms, cultural context | Full stack + chain + polyrhythm (for ensemble patterns) |
| **Phase 4** | Polish: MIDI export, keyboard shortcuts | Export chain/stack to MIDI |

The architecture should be built in Phase 0.5 with the full data model, even though the UI initially only exposes Level 1 (standard 16-step grid). This avoids costly refactoring later — the engine is universal from day one; the UI progressively reveals its capabilities.

---

# Bibliography

- Toussaint, Godfried. *The Geometry of Musical Rhythm* (2013). Euclidean rhythms, mathematical analysis of world rhythm patterns.
- Agawu, Kofi. *Representing African Music* (2003). Polyrhythmic notation and analysis.
- Butler, Mark. *Unlocking the Groove* (2006). Rhythmic analysis of electronic dance music.
- Feldman, Walter. *Music of the Ottoman Court* (2006). Compound usul analysis.
- Pressing, Jeff. "Cognitive Isomorphisms Between Pitch and Rhythm in World Musics" (1983). Cross-cultural rhythmic structures.
- Bjorklund, Erik. "The Theory of Rep-Rate Pattern Generation in the SNS Timing System" (2003). The Euclidean rhythm algorithm.
- BeatForge Research: `technical/web-audio-dsp-reference.md` (scheduler), `technical/turkish-rhythmic-systems-reference.md` (usul system), `patterns/african-ensembles.md` (polyrhythmic notation).
