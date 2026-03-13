# BeatForge Content Presentation Design

## How 48,000 Lines of Research Become a Learning Experience

**Date:** 2026-03-13
**Status:** Draft
**Relates to:** Product spec §8 (Library Mode), research corpus (48K+ lines across 31 documents)

---

## 1. Problem Statement

BeatForge's research corpus contains deep cultural histories, musicological analysis, econopolitical context, instrument genealogies, geographic connection maps, and 380+ notated patterns spanning every inhabited continent. This content is the product's educational soul — but it currently exists as markdown files readable only by developers and AI agents.

The challenge: deliver this knowledge to users in a way that feels like discovery and adventure, not academic lecture, while keeping the instrument (the sequencer) as the primary experience.

---

## 2. Design Principles

These emerged from the brainstorming session:

1. **Instrument-first.** The sequencer is always primary. Content enriches the playing experience; it never displaces it.
2. **Storyteller voice.** Narrative pull with direct address. "When you play this pattern, you're playing the same rhythm that King Jammy recorded on a $100 Casio in 1985." Not encyclopedia tone.
3. **Progressive depth.** Four layers from glance to deep dive. Users choose how deep to go.
4. **Hypertext-first.** Dense cross-linking is the foundation. Everything connects to everything via typed relationships. Users follow their curiosity.
5. **Trails as editorial polish.** Curated thematic narratives are built on top of the hypertext web, not the other way around. The system works without trails; trails make it better.
6. **Relevance-driven.** Content type (cultural, musical, historical, economic, geographic, technical) is surfaced based on what's most relevant to the specific pattern, not a fixed hierarchy.
7. **Machine-readable.** The content graph serves AI agents and humans equally. Structured data first, rendered views second.

---

## 3. The Four Depth Layers

Inspired by museum exhibition design (MoMA's layered interpretation, Smithsonian's multi-modal approach) and non-fiction storytelling (narrative non-fiction structure, "show don't tell").

### Layer 1: Tagline

**Where:** Everywhere — Practice mode, Studio mode, pattern cards, search results, mini-previews.
**Length:** One line, max ~80 characters.
**Purpose:** Instant cultural anchor. Tells you *what this is* and *why it matters* in a glance.
**Voice:** Evocative fragment, not a full sentence.

Examples:
- `Thracian wedding dance · "face to face" · 9/8`
- `The beat that launched digital dancehall · Kingston 1985`
- `Ewe master drummers · the timeline that organizes everything`
- `Chicago 1987 · a knob twist that invented acid house`

**Data field:** `tagline: string` on each pattern.

### Layer 2: Story Card

**Where:** Expandable panel in Practice and Studio modes. Default view in Library pattern cards on hover/tap.
**Length:** 2-3 paragraphs (~150-250 words).
**Purpose:** The "wall label" — enough to understand the pattern's cultural context and musical significance. Contains inline hyperlinks to related patterns, traditions, and themes.
**Voice:** Storyteller + direct address.

Example (Sleng Teng riddim):
> In 1985, Wayne Smith walked into King Jammy's studio in Waterhouse, Kingston, with a rhythm he'd found on a preset in his Casio MT-40 — a consumer keyboard that cost about $100. What happened next changed Jamaican music forever.
>
> The Sleng Teng riddim was the first major dancehall hit built entirely on digital electronics, no live instruments. It was also the first to prove that a riddim could be endlessly reused — over 300 different artists have voiced their own songs over this same backing track. When you play this pattern, you're playing the sound of an entire genre being born.
>
> The pattern itself is deceptively simple: a four-on-the-floor kick with a syncopated snare and that iconic Casio preset bass. But its simplicity is the point — it's a *platform*, not a performance. The riddim exists to be sung over, danced to, and reinvented. → [The Riddim Economy](#riddim-economy) → [Digital Dancehall](#digital-dancehall)

**Data field:** `story: string` (markdown with internal links) on each pattern.

### Layer 3: Full Article

**Where:** Dedicated page in Library mode, reachable from pattern card, search, or trail.
**Length:** 500-2000 words, sectioned.
**Purpose:** The complete story — cultural history, musical analysis, geographic connections, instrument context, economic/political background. Everything relevant to this pattern, organized by what matters most for this specific subject.
**Voice:** Long-form narrative non-fiction. Storyteller voice sustained across sections.
**Structure (flexible, adapted per pattern):**
- **The Story** — narrative opening, historical context
- **The Sound** — musical analysis, what makes this pattern distinctive, how the beat grouping works
- **The Connections** — cross-cultural links, geographic journey, related traditions
- **The Context** — economic, political, or technological forces that shaped this music (when relevant)
- **Listen / Play** — embedded playable pattern with the full ensemble tracks, suggested variations

**Data field:** Full articles are stored as entries in the knowledge graph (see §4), linked from pattern metadata via `themes` and `tradition` fields.

### Layer 4: Rabbit Holes

**Where:** Linked from full articles, accessible from Library home, browsable as standalone content.
**Length:** 1000-5000 words.
**Purpose:** Thematic deep dives that connect multiple patterns, traditions, and ideas. These are the stories that can't be told from a single pattern's perspective — they're about movements, migrations, economic forces, and the threads that connect disparate musical traditions.
**Voice:** Long-form narrative non-fiction at its most ambitious. These are the pieces that make someone say "I had no idea" and share the link.

Example rabbit holes (derived from existing research):
- "The 3+3+2 Pattern: How One Rhythm Traveled from West Africa to Global Pop"
- "Why Cheap Rent Creates Music Scenes: The Economics of Innovation"
- "How Jamaica's Loose Copyright Created a Musical Superpower"
- "The Machines That Made the Music: From Moog to the Modular Revival"
- "The Chain That Lasts 10 Minutes: Inside Ottoman Zencir"
- "Playlist Payola: How 'Algorithmic' Playlists Really Work"
- "The Death of the Big Band: How Economics Reshapes Ensembles"
- "One Pattern, 300 Songs: The Riddim Economy"
- "Face to Face: How Wedding Music Encodes Cultural Identity Across 6 Continents"

**Data:** Rabbit holes are `Article` entities in the knowledge graph with `type: "thematic"`.

---

## 4. Content Data Model

Two complementary data structures: pattern-level metadata and a knowledge graph.

### 4a. Pattern Metadata

Each pattern JSON (already defined in the product spec §9.1) gains these content fields:

```typescript
interface PatternContent {
  /** Layer 1: One-line cultural anchor (~80 chars) */
  tagline: string;

  /** Layer 2: Story card (2-3 paragraphs, markdown with internal links) */
  story: string;

  /** Tags for search, filtering, and connection discovery */
  tags: string[];

  /** Reference to the tradition this pattern belongs to */
  tradition: string; // ID into knowledge graph

  /** Geographic origin */
  region: string; // ID into knowledge graph

  /** Traditional instruments associated with this pattern */
  instruments: string[];

  /** IDs of directly related patterns (variants, family members) */
  relatedPatterns: string[];

  /** IDs of themes/articles this pattern connects to */
  themes: string[];

  /** Content priority hints: which content types matter most
   *  for this specific pattern. Determines what the story card
   *  leads with and how the full article is structured.
   *  Ordered by relevance — first item is the lead. */
  contentPriority: ContentType[];
}

type ContentType =
  | "cultural"      // Cultural stories, ceremonies, social context
  | "musical"       // Analysis of rhythm, structure, feel
  | "historical"    // Historical narrative, key figures, timeline
  | "economic"      // Econopolitics, industry, copyright
  | "geographic"    // Migration, cross-cultural connection
  | "technical";    // Instruments, technology, production
```

### 4b. Knowledge Graph

A separate JSON structure that ships with the app. Three entity types:

```typescript
/** A cultural tradition or musical system */
interface Tradition {
  id: string;
  title: string;
  region: string;
  story: string;          // Full article, markdown
  patterns: string[];     // Pattern IDs belonging to this tradition
  themes: string[];       // Theme IDs
  relatedTraditions: string[];
}

/** A thematic article — the rabbit holes */
interface Article {
  id: string;
  title: string;
  type: "thematic" | "econopolitics" | "instrument-history"
      | "geographic-connection" | "movement";
  tagline: string;        // For article cards
  story: string;          // Full article, markdown
  patterns: string[];     // Pattern IDs referenced
  traditions: string[];   // Tradition IDs referenced
  relatedArticles: string[];
}

/** A curated trail — ordered sequence through the graph */
interface Trail {
  id: string;
  title: string;
  tagline: string;        // One-line hook
  coverColor: string;     // Visual identity
  /** Ordered sequence of stops on the trail.
   *  Each stop is a node in the graph (pattern, tradition,
   *  or article) with optional editorial glue text. */
  stops: TrailStop[];
}

interface TrailStop {
  /** What this stop references */
  nodeType: "pattern" | "tradition" | "article";
  nodeId: string;
  /** Optional editorial text that bridges from the previous stop
   *  to this one. This is the "curatorial voice" that gives
   *  trails their narrative arc. */
  bridgeText?: string;
}

/** The complete knowledge graph */
interface KnowledgeGraph {
  traditions: Record<string, Tradition>;
  articles: Record<string, Article>;
  trails: Record<string, Trail>;
  /** Region hierarchy for geographic navigation */
  regions: Record<string, Region>;
}

interface Region {
  id: string;
  name: string;
  parentRegion?: string;  // For nesting: "turkey-thrace" → "turkey" → "mediterranean"
  traditions: string[];
}
```

### 4c. Relationship Types

The graph supports these typed relationships:

| From | Relationship | To | Example |
|------|-------------|-----|---------|
| Pattern | `belongsTo` | Tradition | Karsilama → Ottoman Folk |
| Pattern | `relatedTo` | Pattern | Karsilama → Roman Havasi |
| Pattern | `featuredIn` | Article | Sleng Teng → "The Riddim Economy" |
| Pattern | `taggedWith` | Theme | Son Clave → "clave-system" |
| Tradition | `relatedTo` | Tradition | Ottoman Folk → Balkan Folk |
| Tradition | `fromRegion` | Region | Ottoman Folk → Turkey |
| Article | `references` | Pattern | "The 3+3+2 Journey" → [Ewe Bell, Tresillo, Son Clave...] |
| Article | `relatedTo` | Article | "Riddim Economy" → "Copyright and Creativity" |
| Trail | `contains` | Pattern/Tradition/Article | (ordered sequence) |

All relationships are stored as ID arrays on the source entity. The graph is fully traversable in both directions at build time (invert the relationships to generate back-links).

---

## 5. UI Integration

### 5a. Practice Mode / Studio Mode (Layers 1-2)

The instrument remains primary. Content appears as contextual enrichment:

**Tagline:** Always visible below the pattern name in the header area. One line, subtle but present.

```
┌─────────────────────────────────────────────┐
│  Karşılama          ▶ 120 BPM    9/8       │
│  Thracian wedding dance · "face to face"    │  ← tagline
├─────────────────────────────────────────────┤
│  [sequencer grid]                           │
```

**Story Card:** Expandable via a small "Learn more" or book icon. Slides in as a panel (right side on desktop, bottom sheet on mobile). Contains the 2-3 paragraph story with hyperlinks. Links navigate to Library mode.

### 5b. Library Mode (All 4 Layers)

Library mode is the content hub. Three entry points:

**1. Featured Trails** (top of Library home)
Horizontal scrollable row of trail cards. Each card shows title, tagline, cover color, and pattern count. Clicking a trail opens a scrollable narrative view with embedded playable patterns.

```
┌────────────────────────────────────────────────────────┐
│  EXPLORE TRAILS                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ 3+3+2:   │ │ Cheap    │ │ Jamaica's│ │ The Chain│ │
│  │ West     │ │ Rent     │ │ Riddim   │ │ That     │ │
│  │ Africa → │ │ Creates  │ │ Economy  │ │ Lasts 10 │ │
│  │ Global   │ │ Music    │ │          │ │ Minutes  │ │
│  │ Pop      │ │ Scenes   │ │          │ │          │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
├────────────────────────────────────────────────────────┤
```

**2. Pattern Grid** (main area, below trails)
Searchable, filterable grid of all patterns. Each card shows: name, tagline, mini-grid preview (colored by beat grouping), region flag, time signature badge, difficulty. Clicking opens the pattern's full article page.

**3. Search**
Full-text search across pattern names, taglines, stories, tags, tradition names, and article titles. Results grouped by type (patterns, traditions, articles).

### 5c. Full Article Page (Layer 3)

When a pattern is selected in Library:

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Library                                          │
│                                                             │
│  KARŞILAMA                                                  │
│  Thracian wedding dance · "face to face" · 9/8             │
│  Turkey · Thrace · Intermediate                             │
│                                                             │
│  ┌─ PLAY ─────────────────────────────────────────────────┐ │
│  │  [Interactive sequencer grid with beat grouping]        │ │
│  │  ▶ Play   [Practice]  [Studio]                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  THE STORY                                                  │
│  In the villages of Thrace, the karşılama is more than     │
│  a dance — it's a declaration of community...               │
│                                                             │
│  THE SOUND                                                  │
│  The 9/8 meter groups as 2+2+2+3, creating that            │
│  characteristic "long beat" at the end of each cycle...     │
│                                                             │
│  THE CONNECTIONS                                            │
│  → Roman Havası (Romani variant, same meter, wilder)       │
│  → Rŭchenitsa (Bulgarian cousin, 7/8 instead of 9/8)      │
│  → Kalamatianos (Greek, 7/8, similar wedding context)      │
│                                                             │
│  RABBIT HOLES                                               │
│  → Odd Meters Around the World: Why 7/8 and 9/8 Thrive    │
│  → Wedding Music and Cultural Identity                      │
│                                                             │
│  PART OF: Ottoman Folk Traditions                           │
│  TAGS: wedding · dance · aksak · 9/8 · thrace · davul     │
└─────────────────────────────────────────────────────────────┘
```

### 5d. Trail View (Layer 4)

A scrollable narrative with embedded patterns:

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Library                                          │
│                                                             │
│  THE 3+3+2 PATTERN                                         │
│  From West Africa to Global Pop                             │
│  ─────────────────────────────────────────                  │
│                                                             │
│  It starts with a bell. In an Ewe drumming ensemble         │
│  in southeastern Ghana, the gankogui bell plays a           │
│  pattern that has organized West African music for          │
│  centuries...                                               │
│                                                             │
│  ┌─ EWE STANDARD BELL ─────────────────────────────────┐   │
│  │  [playable pattern grid]                     ▶ Play  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  When enslaved Africans were brought to Cuba, they          │
│  carried this rhythm with them. In the cabildos —           │
│  mutual aid societies where African religious and           │
│  musical practices survived — the bell pattern              │
│  transformed into something new...                          │
│                                                             │
│  ┌─ SON CLAVE (3-2) ───────────────────────────────────┐   │
│  │  [playable pattern grid]                     ▶ Play  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ...                                                        │
│                                                             │
│  CONTINUE EXPLORING                                         │
│  → The Clave System: Music's Hidden Skeleton               │
│  → African Diaspora Rhythms                                 │
│  → The Riddim Economy                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Content Generation Strategy

### 6a. What Already Exists

The research corpus contains the raw material for virtually all content:

| Content Need | Source in Research Corpus |
|-------------|--------------------------|
| Pattern taglines | Can be derived from pattern descriptions in `patterns/*.md` |
| Story cards | Can be condensed from `musicology/*.md` cultural sections |
| Full articles | Direct adaptation of musicology reports |
| Rabbit holes (thematic) | Direct adaptation of thematic sections (econopolitics, instrument histories, geographic connections) |
| Knowledge graph relationships | Already documented in TOPIC-INDEX.md and PATTERN-INDEX.md |

### 6b. Content Pipeline

1. **Extract:** Parse existing research files into structured content units
2. **Adapt:** Rewrite from academic/report tone into storyteller voice
3. **Link:** Generate cross-references from existing INDEX/TOPIC-INDEX relationships
4. **Review:** Editorial pass for voice consistency and accuracy
5. **Enrich:** Add taglines (new), refine story cards (condensed from existing)

This can be substantially automated — the research files are well-structured with clear headings, and the index files already map relationships. AI-assisted extraction with human editorial review is the efficient path.

### 6c. Build Order (Hypertext-First)

1. **Phase 3a — Foundation (hypertext web):**
   - Pattern metadata (tagline, story, tags, relatedPatterns, themes) for all 380+ patterns
   - Knowledge graph JSON with traditions and regions
   - Pattern grid with search and filters
   - Full article pages generated from knowledge graph
   - Story card panels in Practice/Studio modes

2. **Phase 3b — Polish (curated trails):**
   - 5-8 initial trails covering the strongest cross-cultural stories
   - Trail view UI
   - Featured trails row on Library home
   - "Continue exploring" recommendations

3. **Phase 3c — Expansion (ongoing):**
   - Additional trails as editorial effort permits
   - Community-contributed content (stories, corrections, translations)
   - YouTube video links (per product spec §8.4)
   - Audio examples beyond the sequencer (field recordings, historical recordings where legally possible)

---

## 7. Methodology References

The design draws on established practices from:

### Museum Exhibition Design
- **Layered interpretation** (MoMA, Tate Modern): Multiple depth levels for different visitor engagement — wall label, gallery text, audio guide, catalog. Adapted as our four layers.
- **Thematic hang** (MoMA since 2004): Organizing by idea rather than chronology or geography. Adapted as our theme-first navigation.
- **Object-centered interpretation** (Smithsonian): The artifact is primary; context enriches it. Adapted as our instrument-first principle.
- **Trail guides** (British Museum, V&A): Self-guided paths through collections that tell a story across rooms/galleries. Adapted as our curated trails.

### Non-Fiction Storytelling
- **Narrative non-fiction structure** (John McPhee, Robert Caro): Lead with a scene or character, expand to the larger story, return to the specific. Our story cards follow this pattern.
- **The "nut graf"** (journalism): After the narrative opening, a paragraph that tells you what the story is actually about and why it matters. Every story card has one.
- **Show, don't tell** (creative writing): Instead of "this pattern is historically significant," we say "over 300 artists have voiced their own songs over this same backing track." Concrete details over abstract claims.
- **Hypertext fiction** (Eastgate School, Twine): Non-linear narrative where the reader creates their own path through linked nodes. Our content web follows this model.

### Information Architecture
- **Progressive disclosure** (UX design): Show only what's needed at each level, with clear paths to more depth.
- **Hub-and-spoke** (content strategy): Central index (the knowledge graph) with spokes to individual content pieces. Users can navigate hub-to-spoke or spoke-to-spoke.
- **Desire paths** (urban planning): Let users create their own routes through content, then observe which paths are most popular and formalize them as trails.

---

## 8. Relationship to Product Spec

This design extends product spec §8 (Library Mode) without contradicting it:

| Product Spec Says | This Design Adds |
|-------------------|------------------|
| 3-column layout (regions, cards, detail) | Featured trails row above the grid; region sidebar becomes a filter, not primary navigation |
| Pattern cards with mini grid preview | Pattern cards gain tagline field |
| Detail panel with cultural story (2-3 paragraphs) | Story card (Layer 2) matches this; full article (Layer 3) extends it |
| Related rhythms cross-links | Typed relationships in knowledge graph (relatedPatterns, themes, traditions) |
| Future: YouTube links | Unchanged — fits as enrichment on full article pages |
| Conversational tone | Formalized as "Storyteller + direct address" voice |

The four-layer system and knowledge graph are new additions that the product spec didn't envision, but they're consistent with its spirit: "Cultural depth feels like discovery and adventure, not academic lecture."

---

## 9. Open Questions

1. **Trail authoring:** Should trails be hand-authored JSON (editorial control, labor-intensive) or generated from the knowledge graph with editorial review (scalable, less control)?
2. **Internationalization:** Should content be translatable? The storyteller voice is hard to translate well. Start English-only, plan for translation later?
3. **Community contributions:** How do users suggest corrections, additions, or new stories? GitHub PRs on the content JSON? An in-app feedback mechanism?
4. **Content licensing:** Research files cite academic sources. Do we need to rephrase to avoid any copyright issues with adapted content? (Probably yes — the voice change naturally handles this.)
5. **Offline:** Does the full knowledge graph ship with the PWA, or is it fetched on demand? Given the "offline-first" constraint, it should ship. At ~380 patterns with stories, this is probably 1-3 MB of JSON — acceptable.
