# Caucasus, Mediterranean, Diaspora & Sacred Pattern Library
## Playable Patterns for Web Drum Machine

### Notation Key
- Each character = one subdivision position in the cycle
- `x` = hit (normal), `X` = accented, `o` = open tone, `.` = rest
- `G` = ghost note, `s` = slap, `B` = bass tone, `T` = tone
- `+` = closed/muted, `K` = muted edge
- Pipe `|` marks bar/beat division
- For drum kit adaptation: KK = kick, SN = snare, HH = closed hi-hat, OH = open hi-hat, CR = crash

---

## RHYTHMIC CONCEPTS

### 1. The Caucasian Acceleration Principle
Nearly all Caucasian dance music follows a structural acceleration: slow beginning, medium development, fast climax. This is not random speeding up -- it is a formal structure. The Azerbaijani yalli explicitly marks three sections (Andante, Moderato, Allegro). The lezginka builds from moderate to blazing. Even the Georgian khorumi accelerates within its 5-beat cycle. When programming these patterns, consider building tempo automation that mirrors this natural arc.

### 2. The 5-Beat Asymmetry (Khorumi)
The khorumi's 5/4 meter (3+2) is unique in the Caucasian dance repertoire and extremely rare in world folk music. The asymmetry creates a compelling "lopsided march" feel -- forward momentum that never quite settles. This is different from Turkish 5/8 (which tends toward 2+3) or Balkan 5/8 (which can go either way). Khorumi is always 3+2.

### 3. Mediterranean Frame Drum Technique
The Southern Italian tamburello and the Middle Eastern daf/riq share a common ancestor but diverge in technique. The tamburello emphasizes continuous wrist motion with finger/palm alternation for rapid triplets. The daf emphasizes distinct stroke types (dum/tek/ka) in measured patterns. Both produce rhythms that can be notated on a step sequencer, but the tamburello's "hand roll" technique creates a continuous stream of sound that is harder to quantize.

### 4. Sacred Rhythm as Architecture
Devotional drumming across traditions (Sufi, Vodou, Candomblé, Santería) follows a common structural principle: the rhythm is not merely accompaniment -- it is the mechanism of spiritual transformation. Patterns are typically cyclical (repeating), gradually accelerating, and designed to synchronize with breathing and physical movement. The step-sequencer patterns below capture the basic groove, but the structural acceleration from slow to ecstatic is an essential dimension that requires tempo automation.

### 5. Diaspora Rhythm Survival
When African rhythmic traditions were forcibly transplanted to the Americas, they survived through adaptation. In Peru, drums were banned, so the cajón was invented from wooden boxes. In Trinidad, diverse North Indian drumming traditions merged into the tassa ensemble. In Brazil, Yoruba drum ensembles became Candomblé atabaque trios. The patterns below reflect these adaptations -- they are not "pure" African or Indian patterns, but creolized forms that carry ancestral memory in new shapes.

---

## PART I: CAUCASUS

---

### === 1. GEORGIAN DOLI — SUPRA (FEAST) PATTERN ===
Genre: Georgian traditional (feast/celebration)
Origin: Georgia, particularly Kakheti (Eastern Georgia)
BPM: 100-130
Time Sig: 4/4 (16-step cycle)
Difficulty: Beginner-Intermediate
Description: The doli (Georgian hand drum) pattern for supra (feast) gatherings. The doli creates the rhythmic backbone for toasting songs and spontaneous dancing between courses. Center strikes produce bass tones (B), edge strikes produce lighter tones (T). The pattern alternates strong and light hits, with accent on beat 1 and anticipation of beat 3. This pattern accompanies Kakhetian table songs where a bass drone (bani) supports two improvising soloists.

**Full Pattern (4/4, 16 steps):**

```
Doli Center (Bass):
|B...B...|B...B...|
 1 e + a 2 e + a 3 e + a 4 e + a

Doli Edge (Tone):
|..T.T.T.|..T.T.T.|
 1 e + a 2 e + a 3 e + a 4 e + a

Combined (single line):
|B.TBTBT.|B.TBTBT.|
```

```
Variation — Lively Supra (faster, more syncopated):
Doli Center:
|B..B..B.|..B.B...|
Doli Edge:
|.TT..TT.|TT.T.TT.|
```

**Performance notes:** At a supra, the doli player must be responsive to the tamada (toastmaster) — the pattern intensifies during drinking songs and relaxes during toasts. The doli is held under the left armpit or hung over the shoulder. Center hits use the full palm; edge hits use fingertips.

---

### === 2. GEORGIAN ACHARULI DANCE ===
Genre: Georgian folk dance (courtship)
Origin: Adjara region, southwestern Georgia (Black Sea coast)
BPM: 120-150
Time Sig: 2/4 (8-step cycle)
Difficulty: Beginner
Description: Acharuli is a joyful, flirtatious couple dance in 2/4 time. The rhythm is light and bouncy — men and women face each other with playful, teasing gestures. Accompanied by panduri (three-string lute), doli, gudastviri (bagpipe), salamuri (flute), and garmoni (accordion). The doli pattern is straightforward but must maintain a playful, lilting quality.

**Full Pattern (2/4, 8 steps per bar):**

```
Doli (main):
|B.T.B.T.|B.T.B.T.|
 1 + 2 + 1 + 2 +

Doli (variation with pickup):
|B.T.BxT.|B.T.BxT.|

Panduri strum pattern (rhythmic guide):
|x.x.x.x.|x.x.x.x.|

Foot stamps (dancers):
|X...X...|X...X...|
```

```
Accelerated section (final dance):
Doli:
|BTxBTxBT|BTxBTxBT|

Here the pattern becomes almost continuous as the
dance reaches its joyful climax. The doli player
fills in all subdivisions with alternating bass
and tone strokes.
```

**Performance notes:** The 2/4 time is strict and regular — unlike the asymmetric meters of many Caucasian dances, Acharuli's charm lies in its simplicity and warmth. The playful character comes from dynamics (louder on strong beats, softer on weak) rather than rhythmic complexity.

---

### === 3. GEORGIAN KHORUMI (WAR DANCE) ===
Genre: Georgian traditional (war dance)
Origin: Adjara region, southwestern Georgia
BPM: 80-120 (accelerates through performance)
Time Sig: 5/4 or 5/8 (grouped 3+2)
Difficulty: Advanced
Description: Khorumi is the ONLY Georgian dance in 5-beat meter and one of the few 5/4 dances in world folk music. The 3+2 grouping creates an asymmetric, march-like feel — warriors advancing and retreating. Accompanied ONLY by doli (drum) and chiboni (bagpipe) — no vocal accompaniment, making it rhythmically unique in the Georgian repertoire. The dance depicts reconnaissance, battle, victory, and celebration.

**Full Pattern (5/8, 10 steps per 2-bar phrase):**

```
Doli (main):
|B.T.T|B.T..|
 1 2 3 1 2     (3+2 grouping)

Beat grouping:
|---3---|--2--|

Doli (battle section — more intense):
|BxTxT|BxT.x|
 1 2 3 1 2

Chiboni (bagpipe) rhythmic outline:
|x..x.x|x..x.|
```

```
Extended 5/4 phrase (4 bars):
Bar 1: |B.T.T|  — advance
Bar 2: |B.T..|  — pause/scout
Bar 3: |B.TxT|  — engage
Bar 4: |BxTxT|  — battle intensity

Foot stamps pattern (dancers in formation):
|X..|X.|X..|X.|X..|X.|X.x|Xx.|
```

```
Acceleration structure across performance:
Phase 1 (Reconnaissance): BPM 80, sparse pattern
Doli: |B...T|B....|

Phase 2 (March): BPM 95, steady pattern
Doli: |B.T.T|B.T..|

Phase 3 (Battle): BPM 110, dense pattern
Doli: |BxTxT|BxTxT|

Phase 4 (Victory): BPM 120, triumphant
Doli: |BXTXT|BXT.X|
```

**Performance notes:** The 5/8 meter is challenging for performers accustomed to even meters. The key is to feel the 3+2 grouping physically — three quick steps and two longer ones, like a limping march. This pattern has strong parallels to Turkish 5/8 aksak but with a distinctly martial character. The bagpipe drone provides a constant harmonic foundation over which the drum's asymmetric pattern unfolds.

---

### === 4. ARMENIAN KOCHARI (LINE DANCE) ===
Genre: Armenian folk dance (national dance)
Origin: Armenian Highlands (pan-Armenian, with regional variants)
BPM: 120-160 (moderate to fast)
Time Sig: 2/4 (8-step cycle)
Difficulty: Beginner-Intermediate
Description: Kochari ("knee-go") is THE national dance of Armenia — danced at every wedding, festival, and national celebration. Dancers form a line holding hands or with hands on neighbors' shoulders, performing high jumps and vigorous footwork. The dhol (large double-headed drum) drives the rhythm while the zurna provides piercing melody. Regional variants include heavy/grounded (Sasun), light/fast (Van), and shoulder-shaking (Erzurum).

**Full Pattern (2/4, 8 steps per bar):**

```
Dhol — Bass (thick stick, right hand):
|B...B...|B...B...|
 1 e + a 2 e + a

Dhol — Snap (thin stick, left hand):
|..s...s.|..s...s.|
 1 e + a 2 e + a

Combined Dhol:
|B.s.B.s.|B.s.B.s.|

Zurna rhythmic outline:
|x.x.xxxx|x.x.xxxx|
```

```
Variation — Sasun Kochari (heavy, grounded):
Dhol Bass:  |B..B.B..|B..B.B..|
Dhol Snap:  |...s..s.|...s..s.|
Foot Stamp: |X.....X.|X.....X.|

Variation — Van Kochari (lighter, faster, BPM 160):
Dhol Bass:  |B.B.B.B.|B.B.B.B.|
Dhol Snap:  |.s.s.s.s|.s.s.s.s|
```

```
Dance accent pattern (jumps and stamps):
|X...X...|X..XX...|
 Jump    Jump   double-stamp
```

**Performance notes:** The 2/4 is strict and driving — this is not subtle music. The dhol hits hard and the zurna screams. The two sticks (one thick for bass, one thin for sharp accents) create a natural timbral contrast on the dhol. In large group performance, the synchronized footwork of dozens of dancers adds a massive percussive layer that is as much a part of the rhythm as the drum itself. UNESCO inscribed kochari in 2017.

---

### === 5. ARMENIAN YARKHUSHTA (CLAPPING WAR DANCE) ===
Genre: Armenian traditional (war dance)
Origin: Armenian Highlands (ancient, pre-Christian origins)
BPM: 140-180 (fast)
Time Sig: 6/8 (12-step cycle)
Difficulty: Intermediate-Advanced
Description: Yarkhushta is a war dance defined by its dramatic hand-clapping between facing dancers. The claps create a sharp percussive layer over the dhol and double zurna. The dance is intensely athletic: high jumps, rapid kicks, and the force of dozens of men clapping in unison create an overwhelming wall of rhythmic sound. One zurna plays melody, the other maintains a steady drone. The dhol used for yarkhushta is said to be four times larger than a normal dhol, struck with special sticks of apricot wood.

**Full Pattern (6/8, 12 steps per cycle):**

```
Dhol (large, apricot-wood sticks):
|B..s..B..s..|
 1  2  3  4  5  6  7  8  9  10 11 12

Hand Claps (facing dancers):
|X.....X.....|
 1           7

Zurna 1 (melody rhythmic outline):
|x.xx.xx.xx.x|

Zurna 2 (drone rhythmic pulse):
|x..x..x..x..|
```

```
Intensified battle section (BPM 170+):
Dhol:       |BxsBxsBxsBxs|
Hand Claps: |X..X..X..X..|
Foot Stamps:|..X..X..X..X|

The claps, stamps, and dhol interlock to create
a three-layer polyrhythmic texture.
```

```
Full 2-bar phrase with pickup:
Bar 1: |B..s..B..s.x|
Bar 2: |B.xs..BxXs..|
        ↑             ↑
        clap          stamp+clap unison
```

**Performance notes:** The hand clapping is not random — facing dancers must synchronize their claps precisely, creating a single unified percussion sound from multiple bodies. This collective clapping is one of the most distinctive sounds in Caucasian music. The fast 6/8 creates a galloping, martial feel. The connection to pre-Christian warrior ritual gives this dance deep cultural weight.

---

### === 6. ARMENIAN BAR DANCE (SLOW CEREMONIAL) ===
Genre: Armenian folk dance (ceremonial/ritual)
Origin: Armenian Highlands (pan-Armenian)
BPM: 60-80 (slow, stately)
Time Sig: 4/4 (16-step cycle)
Difficulty: Beginner
Description: Bar (or Par, literally "dance") refers to a family of slow, dignified line dances in 4/4 time. Associated with rituals, ceremonies, weddings, and solemn occasions. The rhythm is spacious and deliberate, with the dhol playing a slower, more measured pattern than the driving kochari or yarkhushta. The mood is contemplative — dancers move as one body, connected by linked hands, steps small and grounded.

**Full Pattern (4/4, 16 steps):**

```
Dhol Bass:
|B.......B.......|
 1 e + a 2 e + a 3 e + a 4 e + a

Dhol Tone:
|....T.......T...|
 1 e + a 2 e + a 3 e + a 4 e + a

Combined:
|B...T...B...T...|

Duduk rhythmic outline (rubato, approximate):
|x...........x...|
```

```
Variation — Wedding Bar (slightly more active):
Dhol Bass:  |B.....B.B.......|
Dhol Tone:  |...T.....T..T...|
Combined:   |B..T..B.B.T..T..|
```

```
Ceremonial variation (2-bar phrase):
Bar 1: |B...T...B.......|  (statement)
Bar 2: |B...T...B...T.T.|  (response with fill)
```

**Performance notes:** The bar dance is where the Armenian duduk truly shines. The duduk's long, breath-driven phrases float over the dhol's sparse rhythm in rubato (free time), creating a tension between the drum's strict pulse and the melody's emotional freedom. This is the rhythmic universe of Armenian music at its most meditative — the opposite of kochari's explosive energy. Both exist in the same tradition, and the contrast is essential to understanding Armenian musical aesthetics.

---

### === 7. AZERBAIJANI YALLI (CIRCLE DANCE) ===
Genre: Azerbaijani folk dance (UNESCO-inscribed, circle/chain dance)
Origin: Azerbaijan, particularly Nakhchivan region
BPM: 90-160 (three-stage acceleration: Andante → Moderato → Allegro)
Time Sig: 6/8 (12-step cycle)
Difficulty: Intermediate
Description: Yalli is a circle/chain dance performed by men and women holding hands or linking arms, incorporating elements of games, pantomime (bird and animal imitations), and physical exercises. The dance explicitly follows a three-part acceleration structure. Accompanied typically by two zurnas and one naghara (drum). UNESCO inscribed yalli in 2018.

**Full Pattern (6/8, 12 steps per cycle):**

```
STAGE 1 — ANDANTE (BPM 90):
Naghara:
|B.....B.....|
 1  2  3  4  5  6  7  8  9  10 11 12

Zurna rhythmic outline:
|x..x..x..x..|

Foot pattern:
|X.....X.....|
```

```
STAGE 2 — MODERATO (BPM 120):
Naghara:
|B..T..B..T..|
 1  2  3  4  5  6  7  8  9  10 11 12

Zurna:
|x.xx.xx.xx.x|

Foot pattern:
|X..x..X..x..|
```

```
STAGE 3 — ALLEGRO (BPM 150-160):
Naghara:
|BxTxBxBxTxBx|
 1  2  3  4  5  6  7  8  9  10 11 12

Zurna (rapid):
|xxxxxxxxxxxx|

Foot pattern (running):
|XxXxXxXxXxXx|
```

```
Full naghara 2-bar phrase (Moderato):
|B..T..B..T.x|B..T.xB..T..|
```

**Performance notes:** The three-stage acceleration is not gradual — each stage is a distinct section with its own energy. The transition points are dramatic moments in the dance. The naghara player must signal the acceleration clearly. Yalli involves imitation (birds, animals) and physical games within the circle, so the rhythm must be clear enough for dancers to coordinate these elements. The zurna pair (one melody, one drone) creates a piercing outdoor sound designed to carry across village squares.

---

### === 8. AZERBAIJANI NAGHARA + ZURNA ENSEMBLE ===
Genre: Azerbaijani folk celebration music
Origin: Azerbaijan (pan-Azerbaijani)
BPM: 130-170
Time Sig: 6/8 (12-step cycle)
Difficulty: Intermediate
Description: The zurna (loud double-reed) + naghara (cylindrical drum) ensemble is the quintessential Azerbaijani outdoor celebration sound — used for weddings, festivals, and public gatherings. Two zurnas play (one melody, one drone) while the naghara drives the rhythm. The naghara is played with hands and palms, resting in the lap tilted to one side. This pattern represents the standard wedding celebration groove.

**Full Ensemble Pattern (6/8, 12 steps):**

```
Naghara — Center (Bass):
|B.....B.B...|
 1  2  3  4  5  6  7  8  9  10 11 12

Naghara — Edge (Tone):
|..T.T....T.T|

Combined Naghara:
|B.T.T.B.BT.T|

Zurna 1 (melody rhythm):
|x.xx.xx.x.xx|

Zurna 2 (drone pulse):
|x..x..x..x..|
```

```
Variation — Intense celebration:
Naghara: |BxTxTxBxBTxT|

Variation — Processional (moderate):
Naghara: |B..T..B..T..|
```

```
Extended 4-bar phrase:
Bar 1: |B.T.T.B.BT.T|  (establish)
Bar 2: |B.T.T.B.BT.T|  (maintain)
Bar 3: |BxTxT.BxBTxT|  (intensify)
Bar 4: |BXTXTXBXBTXT|  (climax)
```

**Performance notes:** The naghara's playing technique resembles goblet drum (tonbak/darbuka) technique — the player tilts the drum with one arm resting on top, both hands on the same head. Center strikes (B) are deep and resonant; edge strikes (T) are sharp and high. The relationship between mugham (art music) and folk music is important: the same naghara player may perform delicate gaval patterns for mugham and powerful naghara patterns for dance — completely different instruments, completely different musical worlds, same cultural tradition.

---

### === 9. LEZGINKA (PAN-CAUCASIAN FAST DANCE) ===
Genre: Caucasian folk dance (shared across all Caucasian peoples)
Origin: Lezgin people of Dagestan; adopted pan-Caucasus
BPM: 140-200+ (fast, accelerating)
Time Sig: 6/8 (12-step cycle)
Difficulty: Intermediate-Advanced
Description: The lezginka is THE dance of the Caucasus — fast, fiery, and dramatic. The man dances on his toes like an eagle (arms outstretched, spinning, dropping to knees), while the woman glides like a swan. The drum drives a relentless 6/8 with syncopated accents that propel the dancer's footwork. The tempo typically starts moderate and builds to blazing speed. Every Caucasian people has their own variant — Chechen, Georgian, Azerbaijani, Circassian, Ossetian — but the core rhythmic structure is shared.

**Full Pattern (6/8, 12 steps):**

```
Drum (naghara/doli):
|B..T..B..TxT|
 1  2  3  4  5  6  7  8  9  10 11 12

Accented version:
|B..T..B..TXT|

Zurna/accordion rhythmic outline:
|x.xx.xx.xxxx|
```

```
Chechen variant (tighter, more syncopated):
Drum:  |B.xT.xB.xTxT|
Claps: |X.....X.....|

Georgian variant (slightly heavier):
Doli:  |B..T.xB..TxT|

Circassian variant (with pkhachich wooden clappers):
Drum:     |B..T..B..TxT|
Clappers: |..x..x..x..x|
```

```
Acceleration structure:
Opening (BPM 140):
|B..T..B..T..|

Building (BPM 160):
|B..T..B..TxT|

Climax (BPM 180):
|BxTxTxBxTxTx|

Maximum (BPM 200+):
|BXTXTXBXTXTX|
At maximum speed, every subdivision is
articulated — pure rhythmic energy.
```

```
Extended phrase (2-bar, moderate):
Bar 1: |B..T..B..TxT|  (statement)
Bar 2: |B..TxTB.xTxT|  (variation/fill)
```

**Performance notes:** The lezginka is one of those rhythms where the tempo itself is a structural element — the acceleration from moderate to blazing is not optional, it IS the form. The dancer's footwork must match the drum exactly, and the drum must match the dancer's increasing intensity. At maximum speed (200+ BPM in dotted quarter), the pattern becomes a continuous stream of articulated subdivisions. For the drum machine, building a lezginka requires tempo automation — a single static tempo misses the point entirely.

---

## PART II: MEDITERRANEAN

---

### === 10. CRETAN SYRTOS ===
Genre: Cretan folk dance (circle/chain dance)
Origin: Crete, Greece
BPM: 100-130
Time Sig: 2/4 (8-step cycle) — NOTE: Cretan syrtos is 2/4, NOT the 7/8 of mainland Greek syrtos
Difficulty: Beginner
Description: The most common Cretan dance. Dancers form a chain with linked hands, led by a leader who breaks out to improvise. Cretan syrtos differs fundamentally from mainland Greek syrtos (kalamatianos) in its time signature — 2/4 vs 7/8. This is one of the clearest examples of regional rhythmic divergence in Mediterranean music. The lyra plays the melody while the laouto provides a driving, percussive strumming pattern that functions as the rhythmic backbone.

**Full Pattern (2/4, 8 steps per bar):**

```
Laouto strum (percussive):
|x.x.x.x.|x.x.x.x.|
 1 + 2 +   1 + 2 +

Daouli (drum, when present):
|B...B...|B...B...|

Lyra melodic rhythm:
|x.xxx.xx|x.xxx.xx|

Dance step pattern:
|X...X...|X...X...|
 step   step
```

```
Variation — Livelier syrtos:
Laouto: |x.xxx.xx|x.xxx.xx|
Daouli: |B.T.B.T.|B.T.B.T.|

Variation — Leader solo section:
Laouto: |xxxx.xxx|xxxx.xxx|
Daouli: |B.T.BxT.|B.T.BxT.|
```

**Performance notes:** The Cretan laouto is THE rhythm instrument of Cretan music. Though it is a stringed instrument, its playing style is fundamentally percussive — rapid, rhythmic strumming that could be notated on a step sequencer. In BeatForge, the laouto strumming pattern is the equivalent of a hi-hat pattern: the constant subdivision over which everything else floats. The 2/4 meter is simple but the ornamental richness of the lyra melody creates rhythmic interest.

---

### === 11. CRETAN PENTOZALI (FAST WARRIOR DANCE) ===
Genre: Cretan folk dance (fast, athletic)
Origin: Crete, Greece (particularly western Crete)
BPM: 140-180 (fast, accelerating)
Time Sig: 8/8 (grouped 3+2+3 or 3+3+2, 8 steps per cycle)
Difficulty: Intermediate-Advanced
Description: Pentozali ("five steps") is the fast, signature dance of Crete — a showcase for male athletic ability with high jumps, spins, and acrobatic feats. Performed in an extended circle or line. The asymmetric 8/8 grouping creates a driving, slightly off-balance feel that demands precise footwork. The lyra plays the main melody while the laouto drives in a percussive, almost drum-like fashion.

**Full Pattern (8/8, grouped 3+2+3):**

```
Laouto (percussive strumming):
|x.x|x.|x.x|
 1 2 3 1 2 1 2 3
 --3-- -2- --3--

Daouli:
|B..|B.|B.T|
 --3-- -2- --3--

Dance steps (5 steps):
|X..|X.|X.X|
 step  step step-step
 (+ 5th step falls on next bar's beat 1)
```

```
Alternative grouping (3+3+2):
Laouto: |x.x|x.x|x.|
         --3-- --3-- -2-
Daouli: |B.T|B.T|B.|

The grouping can shift between regional variants.
Both feel "asymmetric" relative to simple 4/4.
```

```
Fast variation (BPM 170+):
Laouto: |xxx|xx|xxx|
Daouli: |BxT|Bx|BxT|

At top speed, every subdivision fills in
and the asymmetric grouping is felt through
accent rather than gaps.
```

```
Leader solo section (pyrichios/high jumps):
Laouto: |xxx|xx|xxx|  (continuous drive)
Daouli: |B..|B.|BXT|  (sparse, punctuating jumps)
```

**Performance notes:** The 8/8 meter places pentozali in the same rhythmic family as some Balkan dances (it shares DNA with aksak traditions through centuries of Ottoman influence on Crete). The grouping is felt in the body through the five named steps, with the "extra" beats creating the characteristic surge that powers the jumps. The lead dancer uses the asymmetric pulse to time aerial movements — landing on strong beats, launching on the upbeats.

---

### === 12. CRETAN SOUSTA (BOUNCY COUPLE DANCE) ===
Genre: Cretan folk dance (couple dance)
Origin: Crete, Greece (also Dodecanese islands)
BPM: 110-140
Time Sig: 2/4 (8-step cycle, with bouncy/swing feel)
Difficulty: Beginner-Intermediate
Description: Sousta is a couple dance with ancient roots, possibly derived from war dance elements. A man courts a woman through approach and retreat — turns, jumps, and playful gestures expressing a love story. The rhythm has a bouncy, almost swung quality that distinguishes it from the more straightforward syrtos. The "bounce" comes from a slight lilt in the subdivision — not quite swing, not quite straight.

**Full Pattern (2/4, 8 steps with swing feel):**

```
Laouto (bouncy strumming):
|x..x.x.x|x..x.x.x|
 1  + 2 + a  1  + 2 + a
 (slight swing on subdivisions)

Lyra rhythmic outline:
|x.xx..xx|x.xx..xx|

Dance steps (bounce):
|X..X.X..|X..X.X..|
 bounce-bounce-step
```

```
Variation — Animated courtship section:
Laouto: |x.xx.xxx|x.xx.xxx|
Daouli: |B.T.B.T.|B.T.B.T.|

Straight 2/4 reference (without bounce):
Laouto: |x.x.x.x.|x.x.x.x.|
```

**Performance notes:** The sousta's "bounce" is its defining characteristic and its greatest challenge for sequencing. A strict, quantized grid misses the quality entirely. Consider using a light swing setting (55-60% swing) to approximate the lilt. The courtship dynamic is reflected in the rhythm: the man's more active movements correspond to accented beats, the woman's graceful responses to lighter beats.

---

### === 13. SICILIAN TAMBURELLO PATTERN ===
Genre: Southern Italian/Sicilian folk (tarantella family)
Origin: Sicily and Southern Italy
BPM: 140-180 (fast)
Time Sig: 6/8 (12-step cycle)
Difficulty: Intermediate-Advanced
Description: The tamburello (frame drum) is the heartbeat of Southern Italian folk music. The playing technique uses continuous wrist motion with finger/palm alternation for rapid triplets, creating a stream of articulated sound punctuated by powerful thumb slaps at the center (bass). The pizzica and tarantella rhythms are almost always fast triplet-based patterns. Historically connected to the tarantism healing tradition and fertility rites — most ancient iconography shows women playing these drums.

**Full Pattern (6/8, 12 steps):**

```
Tamburello — Bass (thumb slap, center):
|B.....B.....|
 1  2  3  4  5  6  7  8  9  10 11 12

Tamburello — Tone (fingers, edge):
|.TT.TT.TT.TT|
 (continuous triplet fill between bass hits)

Combined:
|BTT.TTBTT.TT|

Jingles (sounding continuously from wrist motion):
|xxxxxxxxxxxx|
```

```
Pizzica variation (Puglia — trance rhythm):
Bass:   |B..B..B..B..|
Tone:   |.TT.TT.TT.TT|
Combined:|BTTBTTBTTBTt|

The pizzica feels faster and more relentless
because the bass hits are more frequent,
creating a "heartbeat" underneath the triplets.
```

```
Tammurriata variation (Campania — heavier, 4/4):
(Switch to 4/4, 16 steps)
Tammorra Bass: |B...B...B...B...|
Tammorra Tone: |.TT..TT..TT..TT.|
Combined:      |BTT.BTT.BTT.BTT.|

Tammurriata is slower and deeper, using the
larger tammorra drum. Associated with Black
Madonna worship.
```

```
Sicilian ballettu variation (with bagpipe duet):
Tamburello:     |B.T.TTB.T.TT|
Bagpipe rhythm: |x..x..x..x..|

More moderate than the frenzied pizzica —
the bagpipe provides melodic structure.
```

**Performance notes:** The key to authentic tamburello rhythm is the CONTINUOUS stream of sound. The wrist of the holding hand moves constantly, activating the jingles, while the striking hand alternates between bass (center thumb slap), tone (edge fingers), and ghost notes. At full speed, the tamburello produces a dense, shimmering rhythmic texture that has a trance-inducing quality comparable to Sufi daf or Vodou drumming. In BeatForge, achieving this requires a very dense hi-hat/shaker pattern layered over the bass-tone pattern.

---

## PART III: DIASPORA & FUSION

---

### === 14. INDO-CARIBBEAN CHUTNEY (TASSA + DHOLAK) ===
Genre: Indo-Caribbean fusion (Indian + Caribbean)
Origin: Trinidad and Tobago / Guyana (Indian diaspora)
BPM: 120-150
Time Sig: 4/4 (16-step cycle)
Difficulty: Intermediate
Description: Chutney music fuses North Indian (Bhojpuri) folk rhythms with Caribbean soca energy. The core rhythm combines the dholak (Indian double-headed hand drum) with the dhantal (iron rod, providing a metallic hi-hat-like pattern) and tassa (ensemble drums from the Hosay festival tradition). Modern chutney layers these traditional elements over electronic production. The tassa rhythms (called "hands" or "taal") include tikora, wedding hand, chutney, and soca variations.

**Full Ensemble Pattern (4/4, 16 steps):**

```
Dholak — Bass (right hand, large head):
|B...B..B|B...B..B|
 1 e + a 2 e + a 3 e + a 4 e + a

Dholak — Slap/Tone (left hand, small head):
|..T...T.|..T.T.T.|
 1 e + a 2 e + a 3 e + a 4 e + a

Combined Dholak:
|B.T.B.TB|B.T.BTT.|

Dhantal (iron rod — metallic "hi-hat"):
|x.x.x.x.|x.x.x.x.|

Harmonium bass note (rhythmic pulse):
|x...x...|x...x...|
```

```
Tassa Tikora pattern (wedding rhythm):
Tassa Lead:   |X.x.X.x.|X.x.X.x.|
Tassa Bass:   |B.....B.|B.....B.|
Tassa Support:|..x.x..x|..x.x..x|
```

```
Chutney-Soca fusion variation:
Dholak:  |B.T.B.TB|B.T.BTT.|
Tassa:   |..X...X.|..X.X.X.|
Dhantal: |x.x.x.x.|x.x.x.x.|
Kick:    |x...x...|x...x...|  (soca four-on-floor influence)

This fusion pattern layers Indian hand-drum
rhythms over the Caribbean soca drive.
```

```
Fast chutney variation (BPM 150):
Dholak:  |BTBTBTBT|BTBTBTBT|
Dhantal: |xxxxxxxx|xxxxxxxx|
Tassa:   |X.xX.xXx|X.xX.xXx|

At higher tempos, the distinction between
Indian and Caribbean elements blurs into
pure dance energy.
```

**Performance notes:** The magic of chutney lies in the tension between Indian rhythmic language (the dholak's bass-slap vocabulary, derived from tabla bols) and Caribbean rhythmic energy (the drive toward four-on-the-floor that makes a crowd move). The dhantal provides the link — its metallic, offbeat pattern functions like a hi-hat in soca but sounds distinctly Indian. Tassa drumming has its own complex vocabulary of "hands" (rhythmic patterns) that varies between North and South Trinidad, reflecting different waves of Indian migration.

---

## PART IV: SACRED & DEVOTIONAL DRUMMING

---

### === 15. SUFI DHIKR STAGES (SLOW → MEDIUM → FAST → ECSTATIC) ===
Genre: Sufi devotional / spiritual trance music
Origin: Pan-Islamic (Turkey, Kurdistan, Iran, Central Asia, North Africa, South Asia)
BPM: 60 → 90 → 130 → 180+ (progressive acceleration through stages)
Time Sig: 4/4 (16-step cycle, shifting feel through stages)
Difficulty: Advanced (the difficulty is not in the individual patterns but in the structural arc)
Description: Sufi dhikr (remembrance of God) uses rhythmic drumming, chanting, breathing, and physical movement to facilitate fana (ego annihilation in divine unity). The daf (large Persian frame drum with metal rings) is the primary instrument. The performance follows a four-stage arc from meditative to ecstatic, with each stage having its own rhythmic density, tempo, and spiritual function. The nine traditional maqams for daf include "Hay Allah," "Hay Hu Hay Allah," "Dayim," "Hadadi," "Ghawsi," and others.

**STAGE 1 — MEDITATIVE (BPM 60):**

```
Daf:
|B...T...|B...T...|
 1 e + a 2 e + a 3 e + a 4 e + a

Chant rhythm ("La ilaha illallah"):
|x...x...|x...x...|

Breathing pattern:
|in.......|out......|

Ring shimmer (minimal):
|........x|........x|

The daf is played gently. Dum strokes at center
(B) and tek strokes at edge (T) are sparse
and deliberate. The metal rings barely sound.
Space between hits is as important as the hits.
```

**STAGE 2 — GATHERING (BPM 90):**

```
Daf:
|B.T.B.T.|B.T.B.T.|
 1 e + a 2 e + a

Chant ("Hay Allah"):
|x.x.x.x.|x.x.x.x.|

Ring shimmer (increasing):
|..x...x.|..x...x.|

Body sway matches the daf pulse.
The group finds collective rhythm.
Breathing synchronizes with the chant.
```

**STAGE 3 — DRIVING (BPM 130):**

```
Daf:
|B.TxB.Tx|B.TxB.Tx|

Chant ("Hay Hay Hay Allah"):
|xxxx.xxx|xxxx.xxx|

Ring shimmer (continuous):
|xxxxxxxx|xxxxxxxx|

Riz (roll) technique begins — rapid micro-strokes
create a continuous stream of articulated sound.
Physical movement intensifies — some participants
begin to stand, sway, or move.
```

**STAGE 4 — ECSTATIC (BPM 180+):**

```
Daf (continuous riz/roll with accents):
|BxxxxxxxxxBxxxxxxx|
 ↑ accent          ↑ accent

Or with more structure:
|BxTxBxTx|BxTxBxTx|

Chant (rapid repetition):
|xxxxxxxx|xxxxxxxx|
 "Hu Hu Hu Hu Hu Hu Hu Hu"

Ring shimmer (maximum — continuous sizzle):
|XXXXXXXX|XXXXXXXX|

At ecstatic tempo, the daf's metal rings
create a continuous wash of sound. Individual
strokes blur into a rhythmic stream. The wrist
shake that activates the rings becomes essential.
Participants may enter hal (spiritual state)
or wajd (ecstasy).
```

```
MEVLEVI (WHIRLING DERVISH) VARIANT:
Uses kudum (paired small kettledrums) + bendir

Kudum:
Stage 1 (BPM 60): |B.......B.......|
Stage 2 (BPM 80): |B...T...B...T...|
Stage 3 (BPM 110):|B.T.B.T.B.T.B.T.|
Stage 4 (BPM 140):|BxTxBxTxBxTxBxTx|

Bendir (frame drum):
|..T...T.|..T...T.| → |.T.T.T.T| → |TTTTTTTT|

Ney (reed flute) rhythm:
|x.......x.......| → |x...x...| → |x.x.x.x.| → |xxxxxxxx|

The sema ceremony builds from the haunting
solo ney meditation to full whirling ecstasy.
```

```
QAWWALI VARIANT (South Asian):
Uses dholak + tabla + hand claps

Dholak:
Stage 1: |B...T...|B...T...|
Stage 2: |B.T.B.T.|B.T.B.T.|
Stage 3: |BxTxBxTx|BxTxBxTx|
Stage 4: |BTTBTTBT|TBTTBTTB| (rapid hand patterns)

Hand Claps (audience):
Stage 1: |X.......|X.......|
Stage 2: |X...X...|X...X...|
Stage 3: |X.X.X.X.|X.X.X.X.|
Stage 4: |XXXXXXXX|XXXXXXXX|

Tabla:
Follows the tala cycle but accelerates through it.
16-beat tintal cycle compresses from BPM 60 to 180+.
```

**Performance notes:** The structural acceleration is the ESSENTIAL feature of dhikr drumming. Each stage is not merely faster — it represents a deeper level of spiritual engagement. The transition between stages should feel organic, not abrupt. In BeatForge, this requires:
1. Tempo automation (gradual acceleration)
2. Pattern density increase (more subdivisions filled in at each stage)
3. Ring/shimmer layer that increases from minimal to continuous
4. The understanding that this is a 20-60+ minute arc, not a 4-bar loop

The common thread across ALL these devotional traditions — Sufi, Vodou, Candomble, tarantella — is the use of repetitive, accelerating rhythm to alter consciousness. The specific spiritual framework differs, but the psychoacoustic mechanism is universal: rhythmic entrainment of brainwaves, synchronization of breathing and heartbeat with the drum, and the gradual dissolution of ordinary awareness into collective, transcendent experience.

---

## APPENDIX: QUICK REFERENCE

| # | Pattern | Origin | Time Sig | BPM | Difficulty |
|---|---------|--------|----------|-----|------------|
| 1 | Georgian Doli Supra | Georgia (Kakheti) | 4/4 | 100-130 | Beginner-Int |
| 2 | Georgian Acharuli | Georgia (Adjara) | 2/4 | 120-150 | Beginner |
| 3 | Georgian Khorumi | Georgia (Adjara) | 5/4 (3+2) | 80-120 | Advanced |
| 4 | Armenian Kochari | Armenian Highlands | 2/4 | 120-160 | Beginner-Int |
| 5 | Armenian Yarkhushta | Armenian Highlands | 6/8 | 140-180 | Int-Advanced |
| 6 | Armenian Bar | Armenian Highlands | 4/4 | 60-80 | Beginner |
| 7 | Azerbaijani Yalli | Azerbaijan (Nakhchivan) | 6/8 | 90-160 | Intermediate |
| 8 | Azerbaijani Naghara | Azerbaijan | 6/8 | 130-170 | Intermediate |
| 9 | Lezginka | Pan-Caucasus (Dagestan) | 6/8 | 140-200+ | Int-Advanced |
| 10 | Cretan Syrtos | Crete, Greece | 2/4 | 100-130 | Beginner |
| 11 | Cretan Pentozali | Crete, Greece | 8/8 (3+2+3) | 140-180 | Int-Advanced |
| 12 | Cretan Sousta | Crete, Greece | 2/4 (swing) | 110-140 | Beginner-Int |
| 13 | Sicilian Tamburello | Sicily/Southern Italy | 6/8 | 140-180 | Int-Advanced |
| 14 | Indo-Caribbean Chutney | Trinidad & Tobago | 4/4 | 120-150 | Intermediate |
| 15 | Sufi Dhikr Stages | Pan-Islamic | 4/4 | 60-180+ | Advanced |
