# North & East African Drum Pattern Library
## Comprehensive Playable Patterns for Web Drum Machine

### Notation Key
- Each character = one subdivision position in the cycle
- 12-step patterns = 12/8 time (compound meter, grouped 3+3+3+3)
- 16-step patterns = 4/4 time (simple meter, grouped 4+4+4+4)
- `x` = hit (normal), `X` = accented, `o` = open tone, `.` = rest
- `G` = ghost note, `s` = slap, `B` = bass tone, `T` = tone
- `+` = closed/muted, `K` = muted edge hit
- Pipe `|` marks cycle/beat boundaries
- For drum kit adaptation: KK = kick, SN = snare, HH = closed hi-hat, OH = open hi-hat, RD = ride, RS = rim shot, CP = clap

---

## RHYTHMIC CONCEPTS FOR THIS REGION

### 1. The 3:2 Hemiola as Trance Engine
The fundamental rhythmic relationship in North African trance music (Gnawa, Stambali) is the **3:2 hemiola** -- the simultaneous presence of duple and triple meter. The guembri typically implies one metric grouping while the qraqeb imply the other. This ambiguity is not an error or complexity for its own sake -- it is the mechanism of trance induction. When your brain cannot resolve the rhythm into a single, stable metric framework, ordinary perceptual processing is disrupted, creating the conditions for altered states of consciousness. The same principle operates in Afro-Cuban rumba, Haitian Vodou drumming, and Brazilian Candomblé -- all descendants of the same West African rhythmic technology.

### 2. Acceleration as Spiritual Technology
Many traditions in this collection feature **progressive tempo acceleration** as a core structural element. Gnawa lila ceremonies accelerate from ~87 to ~124+ BPM. Sudanese dhikr can go from 60 to 160+ BPM. Stambali progressively increases speed through its spirit pantheon. This is not merely "getting excited" -- it is a carefully controlled technique for driving participants toward ecstatic or trance states. When programming these patterns, consider implementing BeatForge's Speed Trainer to authentically replicate this acceleration.

### 3. The Chik-Chika: Ethiopia's Rhythmic DNA
The **chik-chika** is a 6/8 foundational rhythm that underlies virtually all Ethiopian music -- traditional, jazz, pop, and liturgical. It is to Ethiopian music what the clave is to Afro-Cuban music or the bell pattern is to Ewe drumming: the organizing principle around which everything else orients. Understanding chik-chika is essential to programming any Ethiopian pattern.

### 4. Cyclical Density vs. Linear Development
North African trance rhythms differ from West African drumming in their approach to form. Where a Ewe agbekor unfolds through carefully structured sections with the master drummer signaling transitions, a Gnawa suite builds intensity through **cyclical repetition with gradual intensification** -- the same pattern played faster, louder, denser. The development is vertical (more intense) rather than horizontal (new material). This distinction is important for how these patterns should be looped in BeatForge.

---

## PART I: NORTH AFRICA / MAGHREB

---

### === 1. GNAWA BASIC PATTERN ===
Genre: Gnawa spiritual/trance
Origin: Morocco, Gnawa communities (descendants of sub-Saharan enslaved peoples)
BPM: 90-120
Time Sig: 6/8 (12-step cycle, grouped 3+3+3+3)
Difficulty: Intermediate
Description: The foundational Gnawa groove featuring the guembri's bass ostinato against the qraqeb's metallic hemiola. The guembri establishes a ternary (triple) feel while the qraqeb pattern implies a binary (duple) division, creating the characteristic 3:2 tension. In a lila ceremony, this basic pattern would underpin the opening songs of each suite, before acceleration takes hold.

**Multi-Instrument Pattern (12 steps = one cycle of 6/8):**

```
Guembri (bass):
|B.T.T.|B.T.T.|
 1 2 3  4 5 6

The guembri plays a repeating 6-pulse pattern:
Bass (B) on 1, Tone (T) on 3 and 5, with rests on 2, 4, 6.
This clearly divides the cycle into two groups of 3 (ternary).
```

```
Qraqeb (iron castanets - Player 1):
|x.x.x.x.x.x.|
 1 2 3 4 5 6 7 8 9 10 11 12

Steady eighth-note pulse providing continuous metallic texture.
Individual qraqeb parts are simple; the complexity emerges
from multiple players with slightly offset patterns.
```

```
Qraqeb (Player 2 - offset):
|.x.x.x.x.x.x|

Second player displaced by one subdivision, creating
a continuous interlocking clatter.
```

```
Composite feel (how the 3:2 hemiola emerges):
Guembri: |B  . T | . T . | B  . T | . T . |  (groups of 3)
Qraqeb:  |x x . x| x . x x| . x x .| x x . |  (groups of 2)
          The listener hears BOTH groupings simultaneously.
```

**Drum Kit Adaptation:**
```
HH: |x.x.x.x.x.x.|  (steady eighths, mimicking qraqeb)
SN: |..x..x..x..x.|  (cross-rhythm, ghosted)
KK: |x..x..x..x...|  (guembri bass pattern)
```

---

### === 2. GNAWA LILA / TRANCE ACCELERATION ===
Genre: Gnawa ceremonial trance
Origin: Morocco, Gnawa lila/derdeba ceremony
BPM: 100-140 (starts slow, accelerates through performance)
Time Sig: 6/8 (12-step cycle)
Difficulty: Advanced
Description: During the trance-induction phase of a lila ceremony, the maalem increases tempo while the qraqeb ensemble intensifies. This pattern represents the heightened state: faster tempo, denser qraqeb patterns, and a more driving guembri line. The acceleration from ~100 to ~140 BPM may occur over 5-15 minutes within a single suite. The pattern itself does not change fundamentally -- the intensification comes through tempo, dynamics, and the layering of additional qraqeb players.

**Multi-Instrument Pattern (12 steps):**

```
Guembri (driving bass):
|B.TT.B|.TT.B.|
 1     4     7    10

More active bass line with consecutive tones (TT) creating
forward momentum. The pattern becomes more insistent.
```

```
Qraqeb (full ensemble, 3+ players interlocking):
|xxXxxX|xxXxxX|
 1 2 3 4 5 6 7 8 9 10 11 12

Accents (X) on 3 and 6 create a driving pulse within
the continuous metallic wash. Volume and intensity increase.
```

```
Handclaps (participants):
|x..x..|x..x..|

Handclaps from ceremony participants add another
rhythmic layer, typically on beats 1 and 4.
```

**Drum Kit Adaptation:**
```
HH: |xxXxxX|xxXxxX|  (qraqeb pattern, accents on X)
SN: |..s..s|..s..s|  (slap accents matching qraqeb)
KK: |x..x.x|..x.x.|  (guembri bass, driving)
CP: |x..x..|x..x..|  (handclap layer)
```

**BeatForge Speed Trainer suggestion:** Start at 100 BPM, increase by 5 BPM every 8 bars, target 140 BPM. This replicates the gradual trance acceleration of a real lila.

---

### === 3. GNAWA BANGA RHYTHM ===
Genre: Gnawa processional/outdoor
Origin: Morocco, Gnawa outdoor procession (aada)
BPM: 110-130
Time Sig: 4/4 (16-step cycle)
Difficulty: Intermediate
Description: Banga refers to the outdoor processional music that precedes the indoor lila ceremony. Played with the tbel (large double-headed drum) and qraqeb, it has a more martial, driving quality than the indoor guembri-based music. The tbel provides a thunderous foundation while the qraqeb maintain their characteristic interlocking patterns. This is public Gnawa -- announcing the ceremony, gathering participants, building anticipation.

**Multi-Instrument Pattern (16 steps = one bar of 4/4):**

```
Tbel (large drum - bass hits):
|X...x..X|...x..X.|
 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16

Heavy accented bass (X) on 1, 9 (downbeats), with
lighter hits (x) providing syncopated fill.
```

```
Tbel (edge/rim hits):
|..x...x.|.x...x..|

Higher-pitched rim strikes creating polyrhythmic
interplay with the bass hits.
```

```
Qraqeb (outdoor ensemble):
|x.xx.xx.|x.xx.xx.|

Dense 16th-note-based pattern with characteristic
groupings of 2+2+3 within the bar.
```

**Drum Kit Adaptation:**
```
HH: |x.xx.xx.|x.xx.xx.|  (qraqeb pattern)
SN: |..x...x.|.x...x..|  (tbel rim on snare)
KK: |X...x..X|...x..X.|  (tbel bass on kick)
```

---

### === 4. MOROCCAN CHAABI (WEDDING) ===
Genre: Moroccan chaabi (popular folk)
Origin: Morocco, urban popular tradition
BPM: 120-150
Time Sig: 6/8 (12-step cycle)
Difficulty: Beginner-Intermediate
Description: The buoyant 6/8 groove that drives Moroccan wedding celebrations. The bendir provides the main rhythmic framework with its distinctive buzzing snare texture, while the darbuka adds accents and fills. This is joyful, communal music -- everyone claps, everyone dances. The bendir's internal snare wires give it a sound not unlike a Western snare drum, making this pattern particularly well-suited to drum kit adaptation.

**Multi-Instrument Pattern (12 steps):**

```
Bendir (frame drum with snares):
|B..T.T|B..T.T|
 1 2 3 4 5 6 7 8 9 10 11 12

Bass (B) on 1 and 7, Tones (T) on 4,6 and 10,12.
The bendir's snare buzz activates on every strike,
adding continuous texture.
```

```
Darbuka (goblet drum):
|T.K.TK|T.K.TK|
 1 2 3 4 5 6

Dum on 1, Tek on 3, Tek-Ka on 5-6.
Classic North African goblet drum pattern.
```

```
Handclaps:
|x..x..|x..x..|

Community clapping on beats 1 and 4 of the 6/8 cycle.
```

**Drum Kit Adaptation:**
```
HH: |x.x.xx|x.x.xx|  (darbuka tek pattern on hi-hat)
SN: |..x..x|..x..x|  (bendir tone hits, snare buzz)
KK: |x..x..|x..x..|  (bendir bass, strong downbeats)
```

---

### === 5. ALGERIAN RAÏ (DERBOUKA + KIT) ===
Genre: Algerian raï (pop-folk hybrid)
Origin: Oran, Algeria
BPM: 100-130
Time Sig: 4/4 (16-step cycle)
Difficulty: Beginner-Intermediate
Description: The driving 4/4 groove that powers modern raï music. Rooted in traditional derbouka patterns (specifically the North African adaptation of maqsum), this pattern has been adapted to drum machines and kit since the 1980s. The characteristic raï feel comes from the syncopated accent on the "and" of beat 2, combined with a strong downbeat and the continuous hi-hat drive. This is the rhythm behind Cheb Khaled's "Didi," Rachid Taha's punk-raï explosions, and a million Algerian wedding celebrations.

**Derbouka Pattern (traditional):**

```
Derbouka (D=dum, T=tek, K=ka):
|D.T.TD..|T.K.T.K.|
 1 e & a 2 e & a 3 e & a 4 e & a

Dum (bass center) on 1, Tek (edge) on &, Tek on 2,
Dum on & of 2. This creates the characteristic
syncopated "push" that defines the raï feel.

Simplified notation:
|D . T . | T D . . | T . K . | T . K . |
```

**Drum Kit Adaptation:**
```
HH: |x.x.x.x.|x.x.x.x.|x.x.x.x.|x.x.x.x.|  (straight 8ths)
SN: |....X...|....X...|....X...|....X...|  (backbeat on 2 and 4)
KK: |X..X..X.|..X..X..|X..X..X.|..X..X..|  (derbouka dum pattern)
```

```
Extended 16-step grid:
HH: |x.x.x.x.x.x.x.x.|  (steady eighths)
SN: |....x.......x.....|  (beats 2 and 4)
KK: |x.....x.x......x..|  (syncopated bass)
```

**Modern Raï (drum machine style):**
```
HH: |xxxxxxxxxxxxxxxx|  (16th-note hi-hat, machine-gun)
SN: |....X.......X...|  (hard backbeat)
KK: |X..X..X...X..X..|  (syncopated kick, influenced by derbouka)
CP: |....x.......x...|  (electronic clap doubling snare)
```

---

### === 6. TUNISIAN STAMBALI ===
Genre: Stambali trance-healing ritual
Origin: Tunisia, communities descended from sub-Saharan enslaved peoples
BPM: 80-140 (accelerates through ceremony)
Time Sig: Variable -- cycles of 3, 4, or 5 beats depending on the spirit invoked
Difficulty: Advanced
Description: Stambali uses short, dense, incessantly repeated rhythmic cycles that accompany the gumbri's melodic ostinatos. The shqashiq (iron castanets, related to Gnawa qraqeb) create interlocking metallic patterns while the tabla (double-headed barrel drum, distinct from Indian tabla) provides a heavier rhythmic foundation. The key structural feature is the use of different cycle lengths for different spirits: some spirits require 3-beat cycles, others 4 or 5, each creating a distinct trance quality.

**4-Beat Cycle (most common):**

```
Gumbri (bass lute):
|B.T.| (repeating)
 1 2 3 4

Simple two-note ostinato creating hypnotic repetition.
```

```
Shqashiq (iron castanets, multiple players):
Player 1: |x.x.| (repeating)
Player 2: |.x.x| (offset, interlocking)

Combined:  |xxxx| -- continuous metallic wash
```

```
Tabla (barrel drum):
|B..s| (repeating)
 1 2 3 4

Bass on 1, slap on 4. The asymmetric placement
creates a "limping" feel that drives toward the next cycle.
```

**5-Beat Cycle (for specific spirits):**

```
Gumbri:  |B.T.T| (repeating)
Shqashiq:|x.x.x| / |.x.x.| (interlocking)
Tabla:   |B...s| (bass-1, slap-5)
```

**3-Beat Cycle (fastest, highest intensity):**

```
Gumbri:  |B.T| (repeating)
Shqashiq:|x.x| / |.xx| (interlocking)
Tabla:   |B.s| (bass and slap alternating)
```

**Drum Kit Adaptation (4-beat cycle, 16 steps in 4/4):**
```
HH: |x.x.x.x.x.x.x.x.|  (shqashiq wash)
SN: |...x...x...x...x|  (tabla slap)
KK: |x...x...x...x...|  (gumbri/tabla bass)
```

---

### === 7. TUAREG TENDE DRUM ===
Genre: Tuareg traditional (tende ceremony)
Origin: Saharan region, Tuareg (Kel Tamasheq) communities -- Mali, Niger, Algeria
BPM: 90-120
Time Sig: 6/8 (12-step cycle)
Difficulty: Beginner-Intermediate
Description: The tende (mortar drum) pattern mimics the gaits of camels -- a direct sonic representation of the animal that is central to Tuareg nomadic life. This pattern evokes the loping, swaying walk of a camel caravan crossing the desert. Traditionally played by women, with female vocal chorus and handclaps. The simplicity of the pattern is deceptive: the groove relies on a specific micro-timing and swing that gives it an organic, breathing quality.

**Multi-Instrument Pattern (12 steps):**

```
Tende drum (mortar drum):
|X..x..|X..x..|
 1 2 3 4 5 6 7 8 9 10 11 12

Accented (X) on 1 and 7, lighter hit (x) on 4 and 10.
This creates the "camel walk" feel: heavy-light-rest,
heavy-light-rest -- mimicking the asymmetric gait of a camel.
```

```
Handclaps (female chorus):
|x..x..x..x..|
 1  4  7  10

Steady quarter-note pulse providing the skeletal framework.
```

```
Vocal rhythm (call-and-response, shown as rhythmic hits):
|..x..x|..x.x.|

The vocal melody creates its own rhythmic counterpoint
to the drum and claps.
```

**Drum Kit Adaptation:**
```
HH: |x..x..x..x..|  (handclap pattern)
SN: |..x..x..x..x|  (tende lighter hits, cross-stick)
KK: |x.....x.....|  (tende bass hits)
```

---

### === 8. DESERT BLUES / TISHOUMAREN (KIT ADAPTATION) ===
Genre: Tuareg desert blues / ishumar guitar rock
Origin: Mali, Niger, broader Saharan region (Tinariwen, Bombino, Mdou Moctar)
BPM: 110-140
Time Sig: 6/8 or 12/8 (12-step cycle)
Difficulty: Intermediate
Description: The drum kit pattern underlying desert blues / tishoumaren guitar music. This is the tende drum pattern evolved for modern band context -- the camel-gait groove translated to kick, snare, and hi-hat. The key is the loping, asymmetric feel in 6/8 that distinguishes desert blues from Western rock (which sits squarely in 4/4). The hi-hat should have a hypnotic, relentless quality -- like the metallic shimmer of qraqeb or the ringing of tende overtones.

**Standard Desert Blues Kit Pattern (12 steps):**

```
HH: |x.x.x.x.x.x.|  (steady compound eighths, ride-like)
SN: |...x.....x...|  (beats 4 and 10 -- off the main pulse)
KK: |x..x..x..x...|  (quarter note pulse, camel walk)
```

**Driving Variation (Tinariwen-style, higher energy):**
```
HH: |x.xx.xx.xx.x|  (busier, more tende-like)
SN: |..X..X..X..X|  (cross-rhythm against 6/8, evenly spaced)
KK: |x.....x.....|  (half-note bass, sparse and deep)
```

**Hypnotic Variation (Bombino-style, more groove):**
```
HH: |x.x.x.x.x.x.|  (steady)
SN: |......x....x.|  (minimal, placed on 7 and 12)
KK: |x..x..x..x...|  (even quarter notes, meditative)
OH: |..........x...|  (open hat accent on 11)
```

---

## PART II: HORN OF AFRICA

---

### === 9. ETHIOPIAN ESKISTA (6/8 SHOULDER DANCE) ===
Genre: Ethiopian traditional dance
Origin: Ethiopia, Amhara ethnic group
BPM: 130-170
Time Sig: 6/8 (12-step cycle)
Difficulty: Intermediate
Description: The driving 6/8 pattern that powers the eskista shoulder dance. Built on the chik-chika rhythmic foundation, this pattern features the kebero drum's alternating high/low pitches creating a bouncing, energetic groove that propels the characteristic shoulder-rolling movements. The tempo is typically fast -- eskista is an athletic dance demanding remarkable upper-body control. The kebero's two heads (small/high and large/low) create a built-in call-and-response within a single instrument.

**Multi-Instrument Pattern (12 steps):**

```
Kebero (double-headed drum):
High head:  |..x..x|..x..x|
Low head:   |x..x..|x..x..|
Combined:   |x.xx.x|x.xx.x|
             1 2 3 4 5 6

The alternation between low (1,4) and high (3,6)
creates the bouncing "shoulder-roll" feel.
```

```
Handclaps:
|x..x..|x..x..|

Strong claps on 1 and 4, providing the skeletal
quarter-note framework for dancers.
```

```
Masinko (one-string fiddle, rhythmic bowing):
|x.x.x.|x.x.x.|

Rapid bowing creates a continuous rhythmic wash
that fills the space between kebero hits.
```

**Drum Kit Adaptation:**
```
HH: |x.x.x.x.x.x.|  (masinko-style continuous)
SN: |..x..x..x..x|  (kebero high head)
KK: |x..x..x..x..|  (kebero low head)
```

**Fast Eskista (party tempo, 160+ BPM):**
```
HH: |xxxxxxxxxxxx|  (12th notes, relentless energy)
SN: |..X..X..X..X|  (accented high hits)
KK: |X..X..X..X..|  (driving bass)
CP: |x.....x.....|  (crowd claps on 1 and 7)
```

---

### === 10. ETHIOPIAN TIZITA RHYTHM (SLOW 12/8) ===
Genre: Ethiopian tizita (nostalgic/melancholic mode)
Origin: Ethiopia, cross-regional
BPM: 60-85
Time Sig: 12/8 (12-step cycle, slow and spacious)
Difficulty: Beginner-Intermediate
Description: The rhythmic feel underlying tizita-mode songs -- Ethiopia's equivalent of the slow blues. Tizita means "nostalgia" or "remembrance," and the rhythmic accompaniment is spacious, understated, and deeply expressive. The chik-chika pattern is present but relaxed, with rubato phrasing and room for melodic ornamentation. The kebero plays gently, and the emphasis is on creating a contemplative rhythmic cushion for the vocalist's emotional expression.

**Multi-Instrument Pattern (12 steps, slow tempo):**

```
Kebero (gentle):
|B..T..|B..T..|
 1 2 3 4 5 6 7 8 9 10 11 12

Sparse bass-tone alternation. The kebero breathes
with the singer, sometimes stretching or compressing
the pattern to follow the vocal rubato.
```

```
Krar (lyre, rhythmic strumming):
|x.x.x.|x.x.x.|

Gentle, even subdivision providing the chik-chika
backbone. In practice, the krar embellishes freely.
```

```
Handclaps (soft, if present):
|x.....x.....|

Minimal -- tizita is intimate, not celebratory.
```

**Drum Kit Adaptation:**
```
HH: |x.x.x.x.x.x.|  (gentle, closed, chik-chika)
SN: |...G.....G...|  (ghost notes only, brushes)
KK: |x.....x......|  (deep, sparse bass on 1 and 7)
RD: |..........x..|  (occasional ride bell accent)
```

---

### === 11. ETHIOPIAN BATI RHYTHM ===
Genre: Ethiopian bati mode (energetic, urgent)
Origin: Ethiopia, cross-regional
BPM: 110-150
Time Sig: 6/8 (12-step cycle)
Difficulty: Intermediate
Description: The rhythmic feel for bati-mode compositions -- faster, more dynamic, and more rhythmically assertive than tizita. Bati is favored for dance music and energetic celebrations. The chik-chika pattern is driven harder, with sharper accents and a more propulsive forward motion. The minor-third coloring of the bati scale gives it an urgency that the rhythm reflects.

**Multi-Instrument Pattern (12 steps):**

```
Kebero (driving):
|B.sB.s|B.sB.s|
 1 2 3 4 5 6

Bass and slap alternating rapidly. The kebero
is more active than in tizita, pushing energy.
```

```
Washint (bamboo flute) or krar rhythm:
|x.xx.x|x.xx.x|

Busier subdivision with characteristic grouping.
The added note on beat 3 creates forward pull.
```

```
Handclaps (energetic):
|x..x.x|x..x.x|

More complex clap pattern with syncopated addition
on beat 5, driving the dance.
```

**Drum Kit Adaptation:**
```
HH: |x.xx.xx.xx.x|  (busy, energetic)
SN: |..x..x..x..x|  (sharp rim clicks)
KK: |x..x..x..x..|  (driving quarter notes)
CP: |x..x.x.x..x.|  (syncopated claps)
```

---

### === 12. ETHIOPIAN KEBERO CHURCH DRUMMING ===
Genre: Ethiopian Orthodox liturgical music (mezmur)
Origin: Ethiopia, Ethiopian Orthodox Tewahedo Church (tradition from Saint Yared, c. 505-571 CE)
BPM: 70-100
Time Sig: Irregular / 6/8 (12-step cycle, with rubato)
Difficulty: Advanced (interpretive complexity)
Description: This is possibly the oldest continuous tradition of Christian liturgical drumming in the world, attributed to Saint Yared in the 6th century. The large kebero's two heads represent the Old Testament (smaller, higher) and New Testament (larger, deeper) -- the alternating strikes between the two create a theological dialogue in sound. The pattern accompanies aquaquam (sacred dance) with prayer staffs (mequamia) and sistra (metal rattles). The rhythm is NOT strictly metronomic -- it breathes with the chant, expanding and contracting as the liturgical text demands.

**Multi-Instrument Pattern (12 steps, approximate -- real performance is more fluid):**

```
Kebero (large, ceremonial):
Low head (New Testament): |B.....B.....|
High head (Old Testament):|...T.....T..|
Combined:                  |B..T..B..T..|
                            1 2 3 4 5 6 7 8 9 10 11 12

Slow, deliberate alternation between the two pitches.
Each strike has theological weight.
```

```
Sistrum (tsenatsel -- metal rattle):
|x.x.x.x.x.x.|

Continuous, shimmering metallic texture. The sistrum
provides the rhythmic continuity while the kebero
marks the structural beats.
```

```
Prayer staff (mequamia, tapping on ground):
|x.....x.....|

Slow pulse marking the liturgical meter.
Priests stamp the mequamia in coordination with
processional movement.
```

**Drum Kit Adaptation (for respectful representation):**
```
RD: |x.x.x.x.x.x.|  (sistrum shimmer on ride cymbal)
SN: |...x.....x...|  (kebero high head on cross-stick)
KK: |x.....x......|  (kebero low head, deep and resonant)
```

*Note: This is sacred music. BeatForge should present it with appropriate cultural context, acknowledging its liturgical origin and ongoing religious significance.*

---

### === 13. ERITREAN GUAYLA DANCE ===
Genre: Eritrean Tigrinya traditional dance
Origin: Eritrea, Tigrinya ethnic group
BPM: 120-160
Time Sig: 5/8 or 10/8 (10-step cycle, grouped 2+3+2+3 or 3+2+3+2)
Difficulty: Advanced (unusual meter)
Description: The guayla's distinctive five-beat cyclical pattern sets it apart from the 6/8 and 4/4 norms of the region. This unusual meter (5/8) creates an asymmetric, propulsive groove that drives the circular dance and shoulder movements. The kebero provides the rhythmic foundation while call-and-response vocals soar above. The five-beat cycle creates a "limping" or "turning" sensation that mirrors the anti-clockwise rotation of the dancers.

**Multi-Instrument Pattern (10 steps = two cycles of 5/8):**

```
Kebero:
|X.x.x|X.x.x|
 1 2 3 4 5 6 7 8 9 10

Accented on 1 and 6 (start of each 5-beat cycle).
Lighter hits on 3,5 and 8,10 fill the cycle.
Grouping: 2+3 | 2+3 (or heard as 3+2 | 3+2)
```

```
Handclaps:
|x....|x....|

Clap only on beat 1 of each 5-beat cycle.
The clap anchors the asymmetric meter.
```

```
Vocal rhythm (call-and-response framework):
Call:     |x.x..|
Response: |.....x.x..|

The vocal lines create additional rhythmic interplay
against the drum's 5-beat cycle.
```

**Drum Kit Adaptation (10 steps per phrase):**
```
HH: |x.x.x|x.x.x|  (continuous, matching kebero)
SN: |..x.x|..x.x|  (kebero lighter hits)
KK: |X....|X....|  (strong downbeat of each cycle)
```

*Note: 5/8 meter is unusual and may require special handling in BeatForge's sequencer. Consider implementing as 10/8 (two groups of 5) for easier programming.*

---

### === 14. SOMALI DHAANTO ===
Genre: Somali traditional/modern dance
Origin: Somalia, pastoral nomadic communities (now pan-Somali diaspora)
BPM: 120-150
Time Sig: 4/4 (16-step cycle)
Difficulty: Beginner
Description: Dhaanto's driving 4/4 groove is designed for communal dancing with rhythmic clapping and foot-stomping. The pattern emphasizes strong beats with syncopated claps, creating an upbeat, unified energy. Modern dhaanto adds drum machines and keyboards, but the underlying rhythm retains its pastoral origins. The key feel is bright and propulsive -- this is music of celebration and community solidarity.

**Traditional Pattern (16 steps):**

```
Durbaan (frame drum):
|X...x...X...x...|
 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16

Strong bass on 1 and 9, lighter tone on 5 and 13.
Steady, march-like foundation.
```

```
Handclaps:
|....x.......x...|

Claps on beats 2 and 4 (Western backbeat position).
Dancers alternate which hand goes on top.
```

```
Foot stomps:
|x.......x.......|

Heavy foot-stamp on 1 and 9 (downbeats).
Creates a visceral, grounded pulse.
```

**Drum Kit Adaptation:**
```
HH: |x.x.x.x.x.x.x.x.|  (steady eighths)
SN: |....x.......x.....|  (backbeat claps on 2 and 4)
KK: |x.......x.........|  (strong downbeat pulse)
```

**Modern Dhaanto (drum machine + keyboard style):**
```
HH: |x.x.x.x.x.x.x.x.|  (tight closed hi-hat)
SN: |....X.......X.....|  (hard electronic snare)
KK: |x..x....x..x.....|  (syncopated kick)
CP: |....x.......x.....|  (electronic clap doubling)
```

---

## PART III: SWAHILI COAST

---

### === 15. TAARAB (ZANZIBARI) ===
Genre: Taarab (Arabic-Indian-African fusion)
Origin: Zanzibar, coastal Tanzania and Kenya
BPM: 80-110
Time Sig: 4/4 (16-step cycle), sometimes 2/4
Difficulty: Intermediate
Description: The percussion pattern underlying taarab music -- a hybrid of Arab iqa'at (rhythmic modes) with African rhythmic sensibility. The darbuka provides the primary pattern (based on maqsum or similar Arab rhythmic modes), while the riqq adds ornamental fills. The feel is stately and sensuous, providing a cushion for the vocal poetry that is taarab's raison d'être. The darbuka's dum-tek vocabulary is adapted to the Swahili context with slightly more rhythmic swing than its Egyptian or Levantine counterparts.

**Multi-Instrument Pattern (16 steps):**

```
Darbuka (goblet drum -- D=dum/bass, T=tek/edge, K=ka/muted):
|D..T..TK|D..T..D.|
 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16

Based on maqsum iqa': Dum-Tek-Tek-Dum-Tek
Adapted to Swahili context with slightly relaxed timing.
```

```
Riqq (small tambourine):
|x.xx.xx.|x.xx.xx.|

Dense, ornamental pattern filling the rhythmic space.
The riqq jingles add continuous metallic shimmer.
```

```
Bass (acoustic, walking):
|x...x...|x...x...|

Root notes on 1 and 5, providing harmonic anchoring.
```

**Drum Kit Adaptation:**
```
HH: |x.xx.xx.x.xx.xx.|  (riqq pattern on closed hat)
SN: |...x..x....x..x.|  (darbuka tek on snare rim)
KK: |x......x.x.......|  (darbuka dum on kick)
```

---

### === 16. CHAKACHA (SWAHILI WEDDING) ===
Genre: Swahili coast traditional dance
Origin: Coastal Kenya and Tanzania, Swahili communities
BPM: 90-120
Time Sig: 12/8 (12-step cycle, compound meter)
Difficulty: Beginner-Intermediate
Description: Chakacha uses a triplet-based 12/8 feel that supports the slow, sensuous hip movements of the women's wedding dance. The msondo drums and marimba create a lush, layered percussion bed. The rhythm has an inherent sway -- a gentle rocking motion that mirrors the hip movements it accompanies. Despite (or because of) its apparent simplicity, chakacha groove requires precise micro-timing to achieve the proper feel.

**Multi-Instrument Pattern (12 steps):**

```
Msondo drum (lead):
|X..x..X..x..|
 1 2 3 4 5 6 7 8 9 10 11 12

Accented bass on 1 and 7, lighter tone on 4 and 10.
Creates a gentle, rocking two-feel within the 12/8.
```

```
Marimba (rhythmic pattern):
|x.x.x.x.x.x.|

Continuous triplet-based subdivision, providing
the "twelve beats on hi-hat" texture that defines chakacha.
```

```
Chapuo (shaker/rattle):
|..x..x..x..x|

Offbeat accents creating a gentle cross-rhythm
against the msondo's on-beat emphasis.
```

```
Handclaps:
|x..x..x..x..|

Quarter-note claps anchoring the pulse.
Women clap while moving hips.
```

**Drum Kit Adaptation:**
```
HH: |x.x.x.x.x.x.|  (marimba subdivision on hat)
SN: |..x..x..x..x|  (chapuo pattern, cross-stick)
KK: |x.....x.....|  (msondo bass, half-note pulse)
```

---

### === 17. BENGA (KENYAN KIT ADAPTATION) ===
Genre: Benga (Kenyan guitar pop)
Origin: Kenya, Luo people, Lake Victoria region
BPM: 120-160
Time Sig: 4/4 (16-step cycle)
Difficulty: Beginner-Intermediate
Description: Benga's drum kit pattern is a propulsive 4/4 groove designed to support the bright, cascading guitar lines that define the genre. The pattern is built on the standard backbeat (snare on 2 and 4) but with a syncopated kick that creates a bouncing, forward-leaning feel. The hi-hat drives steady eighths with occasional open-hat lifts at phrase endings. The key is the interaction between the steady top (hi-hat) and the syncopated bottom (kick) -- this push-pull creates the dance groove.

**Standard Benga Kit Pattern (16 steps):**

```
HH: |x.x.x.x.x.x.x.x.|
     1 e & a 2 e & a 3 e & a 4 e & a

Steady eighth notes. Tight, closed, bright.
```

```
SN: |....X.......X.....|
     Beats 2 and 4. Clean backbeat.
```

```
KK: |x..x....x.x.....|
     Beat 1, syncopated hit on "a" of 1,
     beat 3, and "and" of 3.
     This syncopation creates the benga "bounce."
```

**Variation (busier hi-hat, nyatiti-influenced):**
```
HH: |x.xxx.x.x.xxx.x.|  (broken pattern, mimicking nyatiti)
SN: |....X.......X.....|  (steady backbeat)
KK: |x.....x.x........|  (sparse kick, letting guitar drive)
OH: |..............x...|  (open hat on "a" of 4, phrase ending)
```

**Guitar rhythm reference (for melodic sequencing):**
```
The lead guitar typically plays rapid 16th-note picking
patterns that cascade across the beat. On a step sequencer,
this would look like dense, syncopated melodic content
riding on top of the sparse kit pattern above.
```

---

### === 18. BONGO FLAVA (TANZANIAN MODERN) ===
Genre: Bongo Flava (Tanzanian hip-hop/pop/Afrobeats hybrid)
Origin: Dar es Salaam, Tanzania
BPM: 95-120
Time Sig: 4/4 (16-step cycle)
Difficulty: Beginner
Description: Bongo Flava's beat borrows the Afrobeats 3+2 / 2+3 drum pattern (ultimately derived from the son clave) and layers it with synthesized bass, taarab-influenced melodies, and Swahili vocal styles. The result is a laid-back, groove-heavy beat that sits somewhere between Afrobeats and hip-hop. The kick pattern is the key: its grouping of 3+3+2 (or 2+3+3) within the 8 eighth-note bar creates the characteristic swing.

**Standard Bongo Flava Beat (16 steps):**

```
HH: |x.x.x.x.x.x.x.x.|  (straight eighths)
SN: |....x.......x.....|  (backbeat on 2 and 4)
KK: |x..x..x.x..x..x..|  (3+3+2 grouping pattern)
```

```
The kick pattern decoded:
x . . x . . x . | x . . x . . x . .
3     3     2       3     3     2

This is the Afrobeats "3+3+2" pattern that Bongo Flava
adopted from the West African diaspora. It creates a
rolling, asymmetric groove that resists locking into
a simple duple or triple feel.
```

**With Percussion (shaker/ngoma accent):**
```
HH: |x.x.x.x.x.x.x.x.|  (closed hat)
SN: |....x.......x.....|  (electronic snare)
KK: |x..x..x.x..x..x..|  (3+3+2 kick)
SH: |..x..x..x..x..x..|  (shaker/ngoma ghost)
CP: |........x.........|  (occasional clap accent)
```

**Diamond Platnumz-style variation (heavier, more dancehall influence):**
```
HH: |xxxxxxxxxxxxxxxx|  (16th hat, dancehall-influenced)
SN: |....X.......X...|  (hard snare)
KK: |x..x..x...x..x.|  (slightly modified 3+3+2)
```

---

## PART IV: SUDANESE TRADITIONS

---

### === 19. SUFI DHIKR (ACCELERATING DEVOTIONAL) ===
Genre: Sufi devotional drumming
Origin: Sudan, Sufi brotherhoods (Qadiriyya, Tijaniyya, Shadhiliyya, Khatmiyya)
BPM: 60-170 (extreme acceleration over 20-60 minutes)
Time Sig: 4/4 (16-step cycle), shifting to 2/4 as tempo accelerates
Difficulty: Intermediate (pattern is simple; tempo control is the challenge)
Description: The Sudanese dhikr rhythm is deceptively simple in structure but profoundly powerful in execution. It accompanies the collective chanting of divine names (e.g., "Allah," "La ilaha illallah") and progressive physical movement (swaying, bowing, stepping) that builds toward ecstatic states. The key structural feature is the **extreme tempo acceleration**: beginning at a meditative 60-70 BPM and building over 20-60 minutes to an intense 150-170 BPM. The pattern itself remains fundamentally the same throughout -- the transformation is purely through tempo and intensity.

**Phase 1: Meditative (60-80 BPM, 16 steps):**

```
Frame drum (daluka or tar):
|B...T...|B...T...|
 1 2 3 4 5 6 7 8

Slow, spacious. Bass on 1, Tone on 5.
Each hit resonates fully before the next.
```

```
Handclaps (circle of participants):
|x.......x.......|

Claps on 1 and 9 only. Slow, deliberate, meditative.
Synchronized with the inhalation of "Allah."
```

```
Foot movement:
|x...x...|x...x...|

Gentle swaying or stepping in time.
```

**Phase 2: Building (100-130 BPM, 16 steps):**

```
Frame drum:
|B.T.B.T.|B.T.B.T.|

Doubled activity -- bass and tone alternate on every
other subdivision. The rhythm becomes more insistent.
```

```
Handclaps:
|x...x...|x...x...|

Claps now on every beat. Participants are swaying
more actively, voices rising.
```

```
Additional drums join:
|..x...x.|..x...x.|

A second drum enters with an offset pattern,
creating polyrhythmic density.
```

**Phase 3: Ecstatic Peak (150-170+ BPM, 8 steps -- effectively 2/4):**

```
Frame drums (multiple):
|BTTBTTBT|

Near-continuous striking. The individual beats blur
into a roaring rhythmic wash.
```

```
Handclaps:
|xxxxxxxx|

Continuous clapping. Voices are shouting. Bodies are
swaying violently or spinning. Some participants may
enter trance (wajd/hal).
```

**Drum Kit Adaptation (composite, at building tempo):**
```
HH: |x.x.x.x.x.x.x.x.|  (steady, building intensity)
SN: |..x...x...x...x..|  (frame drum pattern)
KK: |x...x...x...x....|  (bass hits, quarter notes)
CP: |x...x...x...x....|  (communal claps)
```

**BeatForge Speed Trainer suggestion:** This is the ultimate Speed Trainer pattern. Start at 60 BPM, increase by 2 BPM every 4 bars, target 170 BPM. The entire arc takes approximately 15-20 minutes -- a compressed but authentic replication of a dhikr ceremony's rhythmic trajectory.

---

### === 20. NUBIAN RHYTHM ===
Genre: Nubian traditional (festive/dance)
Origin: Southern Egypt / Northern Sudan, Nubian communities of the Nile Valley
BPM: 120-160
Time Sig: 4/4 (16-step cycle)
Difficulty: Intermediate
Description: Nubian festive rhythms are characterized by their driving energy, pentatonic melodic context, and the distinctive sound of three interlocking tar (frame drum) players creating a dense polyrhythmic texture enhanced by community handclapping. The classic Nubian gathering features men singing in call-and-response with intricate handclapping patterns while the tar players beat the rhythm. The overall feel is relentlessly festive -- heavy drum patterns and fast tempos make Nubian music inherently exciting and danceable.

**Multi-Instrument Pattern (16 steps):**

```
Tar Player 1 (def, frame drum -- bass):
|X...x...|X...x...|
 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16

Main pulse: accented bass on 1 and 9, lighter hit on 5 and 13.
```

```
Tar Player 2 (offset):
|..x...x.|..x...x.|

Second tar fills the gaps left by Player 1,
creating a conversation between the two drums.
```

```
Tar Player 3 (ornamenting):
|.x.x.x.x|.x.x.x.x|

Third tar plays a busier pattern, adding ornamental
density to the composite texture.
```

```
Composite tar pattern (all three players):
|XxxxXxx.|XxxxXxx.|

Dense, interlocking pattern with strong accents
on 1 and 5. The combination of three simple parts
creates a complex rhythmic tapestry.
```

```
Handclaps (community):
|x..x..x.|x..x..x.|

Three-against-four cross-rhythm: claps group in 3s
(every 5-6 steps) against the drum's 4-beat framework.
This creates the rhythmic tension that drives Nubian dance.
```

```
Kither/Tambour (5-string lute, rhythmic strumming):
|x.x.x.x.x.x.x.x.|

Continuous eighth-note strumming providing harmonic
and rhythmic foundation in the pentatonic scale.
```

**Drum Kit Adaptation:**
```
HH: |x.x.x.x.x.x.x.x.|  (kither strumming on hat)
SN: |..x...x...x...x..|  (Tar Player 2 on snare)
KK: |X...x...X...x....|  (Tar Player 1 on kick)
RS: |.x.x.x.x.x.x.x.x|  (Tar Player 3 on rim shot)
```

**Variation (faster, more driving):**
```
HH: |xxxxxxxxxxxxxxxx|  (16ths, frantic energy)
SN: |..x.x.x...x.x.x|  (dense interlocking)
KK: |X.....X.X.....X.|  (heavy downbeats)
CP: |x..x..x.x..x..x.|  (cross-rhythm claps)
```

---

## APPENDIX: PATTERN SUMMARY TABLE

| # | Pattern | Region | Time Sig | BPM | Difficulty | Key Feature |
|---|---------|--------|----------|-----|------------|-------------|
| 1 | Gnawa Basic | Morocco | 6/8 | 90-120 | Intermediate | 3:2 hemiola, guembri + qraqeb |
| 2 | Gnawa Lila/Trance | Morocco | 6/8 | 100-140 | Advanced | Acceleration, trance induction |
| 3 | Gnawa Banga | Morocco | 4/4 | 110-130 | Intermediate | Processional, tbel drum |
| 4 | Moroccan Chaabi | Morocco | 6/8 | 120-150 | Beg-Int | Wedding groove, bendir buzz |
| 5 | Algerian Raï | Algeria | 4/4 | 100-130 | Beg-Int | Derbouka syncopation, pop hybrid |
| 6 | Tunisian Stambali | Tunisia | 3,4,5-beat | 80-140 | Advanced | Variable cycle, trance healing |
| 7 | Tuareg Tende | Sahara | 6/8 | 90-120 | Beg-Int | Camel-gait groove, women's drum |
| 8 | Desert Blues Kit | Sahara | 6/8 | 110-140 | Intermediate | Tishoumaren, loping groove |
| 9 | Ethiopian Eskista | Ethiopia | 6/8 | 130-170 | Intermediate | Shoulder dance, chik-chika |
| 10 | Ethiopian Tizita | Ethiopia | 12/8 | 60-85 | Beg-Int | Nostalgic, spacious, slow blues |
| 11 | Ethiopian Bati | Ethiopia | 6/8 | 110-150 | Intermediate | Energetic, urgent, danceable |
| 12 | Kebero Church | Ethiopia | 6/8 | 70-100 | Advanced | Oldest Christian drumming, sacred |
| 13 | Eritrean Guayla | Eritrea | 5/8 | 120-160 | Advanced | 5-beat cycle, asymmetric meter |
| 14 | Somali Dhaanto | Somalia | 4/4 | 120-150 | Beginner | Communal dance, clap-driven |
| 15 | Taarab | Zanzibar | 4/4 | 80-110 | Intermediate | Arab-African fusion, darbuka |
| 16 | Chakacha | Swahili Coast | 12/8 | 90-120 | Beg-Int | Wedding dance, hip movement |
| 17 | Benga | Kenya | 4/4 | 120-160 | Beg-Int | Guitar pop, nyatiti influence |
| 18 | Bongo Flava | Tanzania | 4/4 | 95-120 | Beginner | Afrobeats 3+3+2, modern hybrid |
| 19 | Sufi Dhikr | Sudan | 4/4→2/4 | 60-170 | Intermediate | Extreme acceleration, devotional |
| 20 | Nubian | Sudan/Egypt | 4/4 | 120-160 | Intermediate | 3 interlocking tars, pentatonic |

---

## CROSS-REFERENCES

### Related Patterns in Other BeatForge Libraries:
- **West African**: Gnawa's 3:2 hemiola connects directly to Ewe agbekor bell pattern and Mande djembe rhythms
- **Turkish/Arabic**: Raï derbouka patterns relate to maqsum and saidi iqa'at in `turkish-arabic-indian.md`
- **Brazilian**: The Gnawa → Atlantic slave trade → Candomblé connection places Gnawa rhythms in dialogue with Brazilian terreiro patterns
- **Afro-Cuban**: The 3:2 hemiola in Gnawa is the same fundamental relationship as in Cuban rumba clave
- **Electronic/Hip-Hop**: Bongo Flava patterns connect to Afrobeats production in `western-genres.md`

### BeatForge Implementation Notes:
1. **Speed Trainer patterns**: Gnawa Lila (#2) and Sufi Dhikr (#19) are ideal for the Speed Trainer feature -- their defining characteristic IS acceleration
2. **Unusual meters**: Eritrean Guayla (#13) uses 5/8, requiring special sequencer handling. Consider implementing as 10/8 (two groups of 5)
3. **Stambali variable cycles**: Pattern #6 uses 3-, 4-, and 5-beat cycles. This could be implemented as a "suite" of linked patterns
4. **Cultural sensitivity**: Kebero Church (#12), Sufi Dhikr (#19), Gnawa Lila (#2), and Stambali (#6) are sacred/spiritual patterns. Include appropriate cultural context in the Library view
5. **Synthesis notes**: The qraqeb/shqashiq metallic castanet sound could be synthesized with filtered noise bursts + metallic resonances. The guembri/gumbri bass could use a filtered saw/triangle with envelope shaping to get the characteristic "buzz"
