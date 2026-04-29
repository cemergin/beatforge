// Region display metadata — labels + colors for the World Map blobs
// and the region filter row. Colors cycle through GROUP_COLORS so we
// don't introduce any new tokens.

import { GROUP_COLORS } from '../../components/visual-helpers';
import type { Lang } from '../../i18n';
import type { RegionId } from '../../patterns/types';

export interface RegionMeta {
  id: RegionId;
  label: string;
  short: string;
  color: string;
  intro: string;
  instruments?: string[];
  keyRhythms?: string[];
}

type BaseRegion = Omit<RegionMeta, 'color'>;

// Order roughly groups by continent for the World Map layout.
const BASE: BaseRegion[] = [
  {
    id: 'turkey-ottoman',
    label: 'Turkey / Ottoman',
    short: 'Turkey',
    intro:
      'Turkish rhythm is built on the usul — cycles of düm (deep) and tek (sharp) strokes that can run from 2 to 120 beats. The davul-zurna pairing still leads village weddings and circumcisions, while the light, silver-toned darbuka drives urban taverns and wedding halls. Aksak cycles like 9/8 (2+2+2+3) feel like a horse changing gait mid-stride, and the Ottoman court refined them into compositions of extraordinary depth. Anatolian folk adds the bendir frame drum and kaşık (wooden spoons), and contemporary arabesk and pop still foreground the darbuka as a lead voice, not a backing part.',
    instruments: ['davul', 'darbuka', 'bendir', 'kudüm', 'zurna'],
    keyRhythms: ['Aksak 9/8', 'Düyek 8/8', 'Çiftetelli', 'Türk Aksağı 5/8', 'Devr-i Hindi 7/8'],
  },
  {
    id: 'arabic-swana',
    label: 'Arabic / SWANA',
    short: 'SWANA',
    intro:
      'Across the Arabic-speaking world the iqa\'at system organizes time as cycles of dum and tak, with maqsum — the four-beat default of Egyptian and Levantine pop — as the closest thing to a lingua franca. The goblet-shaped darbuka (also called tabla or doumbek) sits at the center of the ensemble, flanked by the riq (tambourine with cymbals) for delicate filigree and the bendir frame drum for deeper trance music. Heavier iqa\'at like the 10-beat samai thaqil, the 8-beat masmoudi, and the 4-beat malfuf carry Sufi dhikr ceremonies, Egyptian film-music orchestras, and Gulf-region khaleeji in turn. The rhythms predate Islam — they come from the meters of classical Arabic poetry itself.',
    instruments: ['darbuka / tabla', 'riq', 'bendir', 'daf', 'frame drum'],
    keyRhythms: ['Maqsum', 'Masmoudi', 'Malfuf', 'Saidi', 'Samai Thaqil 10/8'],
  },
  {
    id: 'persia',
    label: 'Persia',
    short: 'Persia',
    intro:
      'Persian music thinks in long breaths. The tombak — a goblet drum of carved mulberry wood — is played with all ten fingers at once, producing a palette that can whisper or crack like a gunshot within the same phrase. The daf, a massive frame drum hung with rings, is the voice of Sufi samā ceremonies, pushing the listener toward trance through steady acceleration. Persian rhythmic cycles (usul-e iqa\'i) were codified in the Sassanid court and feed directly into the dastgah modal tradition. Regional traditions add their own accents: Khorasani dotar rhythms, Bandari coastal grooves with African influences, and Kurdish daf ceremonies that stretch for hours.',
    instruments: ['tombak', 'daf', 'dayereh', 'naqareh'],
    keyRhythms: ['Chahar Mezrab', 'Zarbi Fakhteh', 'Reng', 'Samā cycle'],
  },
  {
    id: 'india',
    label: 'India',
    short: 'India',
    intro:
      'Indian classical rhythm is organized into tāla — long cyclical frameworks counted on the hand, with claps (tali) and waves (khali) marking strong and empty beats. Hindustani tabla dominates the north, with the 16-beat Teental and 10-beat Jhaptal framing everything from kathak dance to qawwali; the Carnatic south keeps time on the barrel-shaped mridangam and the kanjira frame drum. What makes Indian rhythm distinct is the spoken vocabulary: every drum stroke has a syllable (bol), and master players can compose entire improvisations in words before playing a note. Folk and Bollywood lean on the dholak and the hourglass-shaped khol, plus the massive dhol for bhangra.',
    instruments: ['tabla', 'mridangam', 'dholak', 'kanjira', 'dhol'],
    keyRhythms: ['Teental 16', 'Jhaptal 10', 'Rupak 7', 'Dadra 6', 'Keherwa 8'],
  },
  {
    id: 'gamelan-southeast-asia',
    label: 'Gamelan / SE Asia',
    short: 'Gamelan',
    intro:
      'A Javanese or Balinese gamelan is not a collection of instruments — it is understood as a single being, with the great gong ageng holding its soul. Time is organized colotomically: long structural gongs mark the end of phrases, shorter kenong and kempul strokes subdivide them, and the kendang hand drum steers tempo in real time. Javanese gamelan favors slow, meditative refinement (halus); Balinese gong kebyar explodes in interlocking kotekan patterns played between paired instruments tuned slightly apart for a shimmering beat. Thai piphat, Filipino kulintang, and Vietnamese court ensembles share the colotomic logic — time marked by bells, not a backbeat.',
    instruments: ['gong ageng', 'kendang', 'bonang', 'kenong', 'kulintang'],
    keyRhythms: ['Lancaran', 'Ladrang', 'Kotekan interlocking', 'Gangsaran'],
  },
  {
    id: 'east-asia',
    label: 'East Asia',
    short: 'E. Asia',
    intro:
      'East Asian percussion traditions share a taste for massive drums and precise, ceremonial timing. Korean samulnori distilled centuries of outdoor farmers\' music (nongak) into four instruments — janggu hourglass drum, kkwaenggwari small gong, jing large gong, buk barrel drum — locked into changdan cycles that speed up into ecstatic acceleration. Japanese kumi-daiko ensembles center on the room-shaking ō-daiko and use jiuchi base patterns like don-don-ka to anchor everything above. Chinese lion and dragon dance drumming is built around the cavernous tanggu, and opera percussion uses the tiny bangu woodblock as the conductor\'s baton. Across the region, louder almost always means more sacred.',
    instruments: ['janggu', 'taiko (ō-daiko, chū-daiko)', 'tanggu', 'jing', 'bangu'],
    keyRhythms: ['Samulnori changdan', 'Jiuchi don-ko', 'Hwimori', 'Lion dance 7-beat'],
  },
  {
    id: 'west-africa',
    label: 'West Africa',
    short: 'W. Africa',
    intro:
      'West African ensembles think of rhythm as interlocking conversation, not a beat plus decoration. An Ewe drum circle layers a gankogui bell timeline, an axatse gourd rattle, two or three supporting drums, and a master atsimevu that improvises against all of them — the polyrhythm is the music. Mande djembe traditions from Guinea and Mali carry the same logic: kassa for harvest, dundunba for strong men, sunu for celebration, each with its own break-pattern (signal) from the lead. The talking drum (dundun in Yoruba, lunga in Dagomba) literally speaks tonal language, carrying names, proverbs, and praise across kilometers. This is the rhythmic DNA that the Middle Passage carried across the Atlantic.',
    instruments: ['djembe', 'dundun', 'talking drum', 'gankogui bell', 'axatse'],
    keyRhythms: ['Kassa', 'Dundunba', 'Sunu', 'Agbekor', 'Fanga'],
  },
  {
    id: 'cuba-afrocaribbean',
    label: 'Cuba / Afro-Caribbean',
    short: 'Cuba',
    intro:
      'Cuba is where Yoruba, Fon, Kongo, and Spanish musics met the densest African institutional presence in the Americas — the cabildos de nación — and produced a rhythmic vocabulary the whole world now speaks. The five-stroke clave (3-2 or 2-3) is the Rosetta Stone: every son, mambo, salsa, and timba is oriented around it. Sacred batá drums (iyá, itótele, okónkolo) still speak Yoruba to the Orishas in santería ceremonies, while secular rumba — guaguancó, yambú, columbia — plays out on tumbadoras and cajones in tenement courtyards. The conga drum, the bongo, and the cowbell pattern of the son cáscara all trace back here.',
    instruments: ['batá', 'conga / tumbadora', 'bongo', 'clave sticks', 'cajón'],
    keyRhythms: ['Son clave 3-2', 'Rumba clave', 'Guaguancó', 'Mambo bell', 'Cha-cha-chá'],
  },
  {
    id: 'caribbean',
    label: 'Caribbean',
    short: 'Caribbean',
    intro:
      'Beyond Cuba, the Caribbean is a constellation of distinct rhythmic nations. Jamaican music built itself around the one-drop — snare and kick landing on beat 3, not 1 — which gave reggae its floating weight. Trinidadian calypso and soca sit on a tight 2-bar engine-room pattern, with steel pans born from oil drums left behind after WWII. Haitian vodou drumming preserves Fon and Kongo repertoires on the three rada drums, while méringue and kompa keep the dancefloor moving. Puerto Rican bomba and plena are percussion-and-voice traditions where the dancer actually calls the drummer\'s accents, not the other way around. Dominican merengue and bachata add the scraping güira and the tamboura.',
    instruments: ['steel pan', 'tambora', 'güira', 'rada drums', 'bongó de monte'],
    keyRhythms: ['One-drop', 'Soca engine-room', 'Merengue', 'Bomba sicá', 'Plena'],
  },
  {
    id: 'brazil',
    label: 'Brazil',
    short: 'Brazil',
    intro:
      'Brazil received roughly 4.9 million enslaved Africans — ten times the number brought to North America — and became the deepest reservoir of African rhythm in the hemisphere. Samba is the national pulse, built on a 2/4 cell where the surdo marks the downbeat with a low thud, the tamborim cuts a syncopated 16th-note phrase on top, and the cuíca friction drum talks like a voice. Bahia\'s candomblé ceremonies still play Yoruba toques on the rum-rumpi-lé atabaque trio. Capoeira rolls in 6/8 under the berimbau\'s bow-and-string twang, maracatu thunders with the alfaia bass drum in Recife\'s carnival, and bossa nova quietly refolds samba into a whispered jazz.',
    instruments: ['surdo', 'tamborim', 'cuíca', 'atabaque', 'berimbau'],
    keyRhythms: ['Samba', 'Partido alto', 'Bossa nova', 'Maracatu', 'Capoeira Angola 6/8'],
  },
  {
    id: 'andean-south-america',
    label: 'Andean South America',
    short: 'Andes',
    intro:
      'Pre-Columbian Andean music centered on wind instruments played in interlocking pairs — the siku panpipes and quena notched flute — with percussion by the wankara bass drum and the small tinya hand drum played by women. After colonization, the huayno (a syncopated duple-meter song-dance) became the popular voice of the highlands from Peru to Bolivia, while coastal Peru developed Afro-Peruvian genres: festejo and landó on the wooden cajón box drum that Paco de Lucía later imported into flamenco. Argentine tango and zamba, Chilean cueca, and Uruguayan candombe (with its three-drum chico-repique-piano lineup) round out the region. Mountain music tends to feel airy and austere; coastal music swings.',
    instruments: ['cajón', 'wankara', 'bombo legüero', 'chico / repique / piano drums', 'charango'],
    keyRhythms: ['Huayno', 'Festejo', 'Landó', 'Candombe 6/8', 'Zamba'],
  },
  {
    id: 'balkans',
    label: 'Balkans',
    short: 'Balkans',
    intro:
      'The Balkans are the densest concentration of odd meters on the planet. Bulgarian folk alone documents meters from a regular 2/4 up to a staggering 22/16, with 7/8 (ruchenitsa) and 11/16 (kopanitsa) spinning village circle dances. The Ottoman aksak concept — unequal cells of 2 and 3 — sits at the root: you don\'t count "one-and-two-and," you count "short-long" or "long-short-short." The tapan (double-headed bass drum) and tarabuka drive dance music, while Roma brass bands from Serbia and Macedonia turn these asymmetric grooves into furious, virtuosic blowouts. Greek rebetiko on the bouzouki and Romanian lăutar fiddle-and-cimbalom traditions share the same rhythmic DNA.',
    instruments: ['tapan', 'tarabuka', 'tupan', 'def', 'Roma brass'],
    keyRhythms: ['Ruchenitsa 7/8', 'Kopanitsa 11/16', 'Daichovo 9/8', 'Paidushko 5/8', 'Kolo'],
  },
  {
    id: 'iberia-flamenco',
    label: 'Iberia / Flamenco',
    short: 'Iberia',
    intro:
      'Flamenco\'s heart is the compás — a 12-beat cycle with accents falling on 3, 6, 8, 10, and 12 that can sound simultaneously in 3/4 and 6/8. It\'s a rhythmic feel that requires the whole body: palmas (percussive handclaps in two tones, sordas and claras), zapateado (the dancer\'s hammered heel-and-toe counterpoint), and cajón (a Peruvian wooden box that Paco de Lucía introduced to flamenco in 1977 and that rewired the whole tradition). The palos — bulerías, soleá, alegrías, siguiriya — each have their own compás and emotional register. Outside Andalucía, Galician and Asturian gaita bagpipe traditions carry an older Celtic-Atlantic pulse, and the Basque txalaparta is two players on a single wooden plank.',
    instruments: ['cajón', 'palmas (hands)', 'zapateado (feet)', 'castanets', 'gaita'],
    keyRhythms: ['Bulerías 12', 'Soleá 12', 'Alegrías 12', 'Tangos 4/4', 'Rumba flamenca'],
  },
  {
    id: 'celtic-europe',
    label: 'Celtic / Europe',
    short: 'Celtic',
    intro:
      'Irish traditional music is organized by tune type — reel (4/4, driving), jig (6/8, lilting), slip jig (9/8, rolling), hornpipe (dotted 4/4, swung) — and each carries its own bodily feel for dancers. The bodhrán frame drum, promoted from rural novelty to concert instrument by Seán Ó Riada in the 1960s, uses a wooden tipper and a pitch-bending back hand. Scottish pipe bands layer snares and bass drum under the Highland pipes; Scandinavian polskas (not polkas) swing in an uneven triple meter where the second beat is shorter than the others; and klezmer weaves freylekhs and bulgars over a characteristic 8/8 accent pattern. The common thread is music made for dancers in rooms — not concert halls.',
    instruments: ['bodhrán', 'Highland pipes', 'fiddle', 'nyckelharpa', 'accordion'],
    keyRhythms: ['Reel', 'Jig 6/8', 'Slip jig 9/8', 'Polska', 'Freylekhs'],
  },
  {
    id: 'electronic-western',
    label: 'Electronic / Western',
    short: 'Electronic',
    intro:
      'The modern Western beat was built in stages: James Brown\'s 1965 shift to straight 16ths locked on "The One" gave funk its grid; Clyde Stubblefield\'s "Funky Drummer" and the Winstons\' "Amen" break became the most sampled bars in history. The Roland TR-808 (1980) and TR-909 (1983) hardwired those patterns into hip-hop, house, and techno — the 808\'s sub-kick is modern pop\'s low end, and the 909\'s tight kick-and-hat pattern is techno\'s engine. House, techno, jungle, drum & bass, trap, and footwork all orbit these two machines, Dilla\'s off-grid feel, and the four-on-the-floor kick that disco inherited from motorik krautrock. This is synthesized rhythm as a global vernacular.',
    instruments: ['TR-808', 'TR-909', 'sampler', 'drum machine', 'Linn LM-1'],
    keyRhythms: ['Boom bap', 'Four-on-the-floor', 'Amen break', 'Dilla feel', 'Trap hi-hats'],
  },
  {
    id: 'exercise',
    label: 'Polyrhythm Exercises',
    short: 'Exercises',
    intro:
      'Polyrhythm practice patterns — useful for internalizing common ratios like 3:2 and 4:3.',
  },
];

export const REGIONS: RegionMeta[] = BASE.map((r, i) => ({
  ...r,
  color: GROUP_COLORS[i % GROUP_COLORS.length],
}));

export const REGION_BY_ID: Record<RegionId, RegionMeta> = REGIONS.reduce(
  (acc, r) => { acc[r.id] = r; return acc; },
  {} as Record<RegionId, RegionMeta>,
);

export function regionLabel(id: RegionId): string {
  return REGION_BY_ID[id]?.label ?? id;
}

// ── Translations ────────────────────────────────────────────────────
//
// Region `intro` paragraphs stay English on purpose — translating
// 16 long musicology paragraphs into 6 locales is a separate per-PR
// content pass, not blocking i18n shipping. `instruments` and
// `keyRhythms` arrays also stay English: they're proper nouns
// (darbuka, tabla, surdo) that read better untranslated.
//
// Only `short` (filter chip + abbreviated badges) and `label` (full
// region name in modal headers) are translated here, because those
// are everywhere in the chrome.

type RegionLabels = { short: string; label: string };
type RegionTranslations = Partial<Record<Exclude<Lang, 'en'>, RegionLabels>>;

const REGION_I18N: Record<RegionId, RegionTranslations> = {
  'turkey-ottoman': {
    tr: { short: 'Türkiye', label: 'Türkiye / Osmanlı' },
    es: { short: 'Turquía', label: 'Turquía / Otomano' },
    zh: { short: '土耳其', label: '土耳其 / 奥斯曼' },
    fr: { short: 'Turquie', label: 'Turquie / Ottoman' },
    hi: { short: 'तुर्की', label: 'तुर्की / ओस्मानी' },
    ru: { short: 'Турция', label: 'Турция / Османы' },
  },
  'arabic-swana': {
    tr: { short: 'SWANA', label: 'Arap / SWANA' },
    es: { short: 'SWANA', label: 'Árabe / SWANA' },
    zh: { short: 'SWANA', label: '阿拉伯 / SWANA' },
    fr: { short: 'SWANA', label: 'Arabe / SWANA' },
    hi: { short: 'SWANA', label: 'अरब / SWANA' },
    ru: { short: 'SWANA', label: 'Арабский / SWANA' },
  },
  'persia': {
    tr: { short: 'İran', label: 'İran' },
    es: { short: 'Persia', label: 'Persia' },
    zh: { short: '波斯', label: '波斯' },
    fr: { short: 'Perse', label: 'Perse' },
    hi: { short: 'पर्शिया', label: 'पर्शिया' },
    ru: { short: 'Персия', label: 'Персия' },
  },
  'india': {
    tr: { short: 'Hindistan', label: 'Hindistan' },
    es: { short: 'India', label: 'India' },
    zh: { short: '印度', label: '印度' },
    fr: { short: 'Inde', label: 'Inde' },
    hi: { short: 'भारत', label: 'भारत' },
    ru: { short: 'Индия', label: 'Индия' },
  },
  'gamelan-southeast-asia': {
    tr: { short: 'Gamelan', label: 'Gamelan / GD Asya' },
    es: { short: 'Gamelán', label: 'Gamelán / SE Asia' },
    zh: { short: '甘美兰', label: '甘美兰 / 东南亚' },
    fr: { short: 'Gamelan', label: 'Gamelan / Asie du SE' },
    hi: { short: 'गमेलान', label: 'गमेलान / द.पू. एशिया' },
    ru: { short: 'Гамелан', label: 'Гамелан / ЮВ Азия' },
  },
  'east-asia': {
    tr: { short: 'D. Asya', label: 'Doğu Asya' },
    es: { short: 'E. Asia', label: 'Asia Oriental' },
    zh: { short: '东亚', label: '东亚' },
    fr: { short: 'Asie de l\'E.', label: 'Asie de l\'Est' },
    hi: { short: 'पू. एशिया', label: 'पूर्वी एशिया' },
    ru: { short: 'В. Азия', label: 'Восточная Азия' },
  },
  'west-africa': {
    tr: { short: 'Batı Afrika', label: 'Batı Afrika' },
    es: { short: 'África O.', label: 'África Occidental' },
    zh: { short: '西非', label: '西非' },
    fr: { short: 'Afr. de l\'O.', label: 'Afrique de l\'Ouest' },
    hi: { short: 'प. अफ्रीका', label: 'पश्चिम अफ्रीका' },
    ru: { short: 'З. Африка', label: 'Западная Африка' },
  },
  'cuba-afrocaribbean': {
    tr: { short: 'Küba', label: 'Küba / Afro-Karayip' },
    es: { short: 'Cuba', label: 'Cuba / Afrocaribeño' },
    zh: { short: '古巴', label: '古巴 / 非洲-加勒比' },
    fr: { short: 'Cuba', label: 'Cuba / Afro-Caraïbe' },
    hi: { short: 'क्यूबा', label: 'क्यूबा / अफ़्रो-कैरेबियन' },
    ru: { short: 'Куба', label: 'Куба / Афро-Карибы' },
  },
  'caribbean': {
    tr: { short: 'Karayip', label: 'Karayip' },
    es: { short: 'Caribe', label: 'Caribe' },
    zh: { short: '加勒比', label: '加勒比' },
    fr: { short: 'Caraïbe', label: 'Caraïbes' },
    hi: { short: 'कैरेबियन', label: 'कैरेबियन' },
    ru: { short: 'Карибы', label: 'Карибы' },
  },
  'brazil': {
    tr: { short: 'Brezilya', label: 'Brezilya' },
    es: { short: 'Brasil', label: 'Brasil' },
    zh: { short: '巴西', label: '巴西' },
    fr: { short: 'Brésil', label: 'Brésil' },
    hi: { short: 'ब्राज़ील', label: 'ब्राज़ील' },
    ru: { short: 'Бразилия', label: 'Бразилия' },
  },
  'andean-south-america': {
    tr: { short: 'Andlar', label: 'And Güney Amerika' },
    es: { short: 'Andes', label: 'Sudamérica Andina' },
    zh: { short: '安第斯', label: '安第斯南美' },
    fr: { short: 'Andes', label: 'Amérique du Sud andine' },
    hi: { short: 'एंडीज', label: 'एंडीयन द. अमेरिका' },
    ru: { short: 'Анды', label: 'Андская Юж. Америка' },
  },
  'balkans': {
    tr: { short: 'Balkanlar', label: 'Balkanlar' },
    es: { short: 'Balcanes', label: 'Balcanes' },
    zh: { short: '巴尔干', label: '巴尔干' },
    fr: { short: 'Balkans', label: 'Balkans' },
    hi: { short: 'बाल्कन', label: 'बाल्कन' },
    ru: { short: 'Балканы', label: 'Балканы' },
  },
  'iberia-flamenco': {
    tr: { short: 'İberya', label: 'İberya / Flamenko' },
    es: { short: 'Iberia', label: 'Iberia / Flamenco' },
    zh: { short: '伊比利亚', label: '伊比利亚 / 弗拉门戈' },
    fr: { short: 'Ibérie', label: 'Ibérie / Flamenco' },
    hi: { short: 'इबेरिया', label: 'इबेरिया / फ्लेमेंको' },
    ru: { short: 'Иберия', label: 'Иберия / Фламенко' },
  },
  'celtic-europe': {
    tr: { short: 'Kelt', label: 'Kelt / Avrupa' },
    es: { short: 'Celta', label: 'Celta / Europa' },
    zh: { short: '凯尔特', label: '凯尔特 / 欧洲' },
    fr: { short: 'Celte', label: 'Celte / Europe' },
    hi: { short: 'सेल्टिक', label: 'सेल्टिक / यूरोप' },
    ru: { short: 'Кельты', label: 'Кельты / Европа' },
  },
  'electronic-western': {
    tr: { short: 'Elektronik', label: 'Elektronik / Batı' },
    es: { short: 'Electrónica', label: 'Electrónica / Occidental' },
    zh: { short: '电子', label: '电子 / 西方' },
    fr: { short: 'Électro', label: 'Électronique / Occidental' },
    hi: { short: 'इलेक्ट्रॉनिक', label: 'इलेक्ट्रॉनिक / पश्चिमी' },
    ru: { short: 'Электро', label: 'Электронная / Западная' },
  },
  'exercise': {
    tr: { short: 'Egzersizler', label: 'Polyritmi Egzersizleri' },
    es: { short: 'Ejercicios', label: 'Ejercicios de Polirritmia' },
    zh: { short: '练习', label: '复合节奏练习' },
    fr: { short: 'Exercices', label: 'Exercices de Polyrythmie' },
    hi: { short: 'अभ्यास', label: 'पॉलीरिदम अभ्यास' },
    ru: { short: 'Упражнения', label: 'Полиритм. упражнения' },
  },
  // RegionIds present in the type union but not in the BASE list yet —
  // their patterns use these region tags in the seed data, so we still
  // localize the labels for filter chips even if there's no full region
  // metadata block.
  'modern-african': {
    tr: { short: 'Modern Afrika', label: 'Modern Afrika' },
    es: { short: 'África Mod.', label: 'África Moderna' },
    zh: { short: '现代非洲', label: '现代非洲' },
    fr: { short: 'Afr. moderne', label: 'Afrique moderne' },
    hi: { short: 'आधुनिक अफ्रीका', label: 'आधुनिक अफ्रीका' },
    ru: { short: 'Совр. Африка', label: 'Современная Африка' },
  },
  'north-east-african': {
    tr: { short: 'Kuzey-Doğu Afrika', label: 'Kuzey-Doğu Afrika' },
    es: { short: 'África NE', label: 'África Nororiental' },
    zh: { short: '东北非', label: '东北非' },
    fr: { short: 'Afr. NE', label: 'Afrique du Nord-Est' },
    hi: { short: 'उत्तर-पूर्व अफ्रीका', label: 'उत्तर-पूर्व अफ्रीका' },
    ru: { short: 'СВ Африка', label: 'Северо-Восточная Африка' },
  },
  'caucasus-mediterranean': {
    tr: { short: 'Kafkaslar/Akdeniz', label: 'Kafkaslar / Akdeniz' },
    es: { short: 'Cáucaso/Med.', label: 'Cáucaso / Mediterráneo' },
    zh: { short: '高加索/地中海', label: '高加索 / 地中海' },
    fr: { short: 'Caucase/Méd.', label: 'Caucase / Méditerranée' },
    hi: { short: 'कौकेसस/मेड.', label: 'कौकेसस / भूमध्यसागरीय' },
    ru: { short: 'Кавказ/Средиз.', label: 'Кавказ / Средиземноморье' },
  },
  'central-asian-pacific': {
    tr: { short: 'Orta Asya/Pasifik', label: 'Orta Asya / Pasifik' },
    es: { short: 'Asia C./Pacífico', label: 'Asia Central / Pacífico' },
    zh: { short: '中亚/太平洋', label: '中亚 / 太平洋' },
    fr: { short: 'Asie C./Pacif.', label: 'Asie Centrale / Pacifique' },
    hi: { short: 'मध्य एशिया/प्रशांत', label: 'मध्य एशिया / प्रशांत' },
    ru: { short: 'Ср. Азия/Тихий', label: 'Центр. Азия / Тихий океан' },
  },
  'global-electronic': {
    tr: { short: 'Küresel Elektronik', label: 'Küresel Elektronik' },
    es: { short: 'Electr. Global', label: 'Electrónica Global' },
    zh: { short: '全球电子', label: '全球电子' },
    fr: { short: 'Électro globale', label: 'Électronique Globale' },
    hi: { short: 'वैश्विक इलेक्ट्र.', label: 'वैश्विक इलेक्ट्रॉनिक' },
    ru: { short: 'Глоб. электро', label: 'Глобальная электроника' },
  },
  'underground-electronic': {
    tr: { short: 'Yeraltı Elektronik', label: 'Yeraltı Elektronik' },
    es: { short: 'Electr. Underground', label: 'Electrónica Underground' },
    zh: { short: '地下电子', label: '地下电子' },
    fr: { short: 'Électro under.', label: 'Électronique Underground' },
    hi: { short: 'अंडरग्राउंड इलेक्ट्र.', label: 'अंडरग्राउंड इलेक्ट्रॉनिक' },
    ru: { short: 'Андеграунд электро', label: 'Андеграунд электроника' },
  },
  'internet-born': {
    tr: { short: 'İnternet Doğumlu', label: 'İnternet Doğumlu' },
    es: { short: 'Nacido en Internet', label: 'Nacido en Internet' },
    zh: { short: '网生流派', label: '网生流派' },
    fr: { short: 'Né sur internet', label: 'Né sur Internet' },
    hi: { short: 'इंटरनेट-जन्मा', label: 'इंटरनेट-जन्मा' },
    ru: { short: 'Интернет-рождённое', label: 'Рождённое в интернете' },
  },
};

/** Resolve a region's user-facing labels for a given locale.
 *  Falls back to the English `short` / `label` if a locale is missing. */
export function localizedRegion(region: RegionMeta, lang: Lang): RegionLabels {
  if (lang === 'en') return { short: region.short, label: region.label };
  return REGION_I18N[region.id]?.[lang] ?? { short: region.short, label: region.label };
}
