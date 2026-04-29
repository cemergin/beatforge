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
// `short` + `label` translate into all 6 non-EN locales for the
// chrome (filter chips, world-map blobs, modal headers).
//
// `intro` translates into all 6 non-EN locales for the 16 region
// metadata blocks defined in BASE. The 7 RegionIds without a BASE
// block (modern-african, north-east-african, etc.) only get short +
// label translations — they have no intro to translate.
//
// `instruments` and `keyRhythms` arrays stay EN-only: they're proper
// nouns (darbuka, tabla, surdo, clave) that read better untranslated.

type RegionLabels = { short: string; label: string; intro?: string };
type RegionTranslations = Partial<Record<Exclude<Lang, 'en'>, RegionLabels>>;

const REGION_I18N: Record<RegionId, RegionTranslations> = {
  'turkey-ottoman': {
    tr: {
      short: 'Türkiye',
      label: 'Türkiye / Osmanlı',
      intro: `Türk ritmi usul üzerine kuruludur — düm (derin) ve tek (keskin) vuruşlardan oluşan, 2'den 120'ye kadar uzanabilen döngüler. Davul-zurna ikilisi köy düğünlerine ve sünnet törenlerine eşlik eder; hafif, gümüş tınılı darbuka şehir meyhanelerini ve düğün salonlarını sürükler. 9/8 (2+2+2+3) gibi aksak döngüler, atın yürüyüş arasında tavır değiştirmesi gibi hissedilir; Osmanlı sarayı bunları olağanüstü derinlikte bestelere işledi. Anadolu halk müziği bendir ve kaşığı katar; çağdaş arabesk ve pop hâlâ darbukayı baş ses olarak öne çıkarır.`,
    },
    es: {
      short: 'Turquía',
      label: 'Turquía / Otomano',
      intro: `El ritmo turco se construye sobre el usul — ciclos de düm (graves) y tek (agudos) que pueden ir de 2 a 120 pulsos. La pareja davul-zurna lidera bodas y circuncisiones rurales, mientras que la darbuka, ligera y de tono plateado, mueve las tabernas urbanas y los salones de boda. Ciclos aksak como 9/8 (2+2+2+3) se sienten como un caballo cambiando de paso, y la corte otomana los refinó hasta composiciones de extraordinaria profundidad. El folk anatolio suma el bendir y las kaşık (cucharas de madera); el arabesk y el pop contemporáneos siguen poniendo la darbuka al frente, no como acompañante.`,
    },
    zh: {
      short: '土耳其',
      label: '土耳其 / 奥斯曼',
      intro: `土耳其节奏建立于乌苏尔之上 —— 由 düm（低沉）和 tek（清脆）击点构成的循环,长度可从 2 拍延展到 120 拍。davul–zurna 组合至今仍引领乡村婚礼与割礼,而轻盈、银亮的 darbuka 则驱动着城市酒馆与婚宴大厅。像 9/8（2+2+2+3）这样的 aksak 循环,听起来如同骏马于行进中突然换步;奥斯曼宫廷将其雕琢成结构极为深邃的乐曲。安纳托利亚民乐再加上 bendir 框架鼓与 kaşık（木勺),当代 Arabesk 与流行乐仍把 darbuka 作为主声部,而非伴奏。`,
    },
    fr: {
      short: 'Turquie',
      label: 'Turquie / Ottoman',
      intro: `Le rythme turc se construit sur l'usul — des cycles de düm (graves) et tek (aigus) pouvant aller de 2 à 120 temps. Le duo davul-zurna mène toujours les mariages et circoncisions de village, tandis que la darbuka, légère au timbre argenté, fait vivre les tavernes urbaines et les salles de mariage. Des cycles aksak comme le 9/8 (2+2+2+3) se sentent comme un cheval changeant d'allure en pleine course ; la cour ottomane les a affinés en compositions d'une profondeur extraordinaire. Le folk anatolien ajoute le bendir et les kaşık (cuillères en bois) ; arabesk et pop contemporains font toujours de la darbuka une voix principale, pas un simple accompagnement.`,
    },
    hi: {
      short: 'तुर्की',
      label: 'तुर्की / ओस्मानी',
      intro: `तुर्की लय उसूल पर टिकी है — düm (गहरे) और tek (तीव्र) स्ट्रोक के चक्र, जो 2 से 120 मात्राओं तक चल सकते हैं। davul-zurna जोड़ी आज भी ग्रामीण विवाहों और सुन्नत समारोहों का नेतृत्व करती है, जबकि हल्की, चाँदी जैसी darbuka शहरी मेखानों और विवाह-मंडपों को चलाती है। 9/8 (2+2+2+3) जैसे aksak चक्र ऐसे महसूस होते हैं मानो दौड़ते घोड़े ने बीच चाल में चाल बदल दी हो; ओस्मानी दरबार ने इन्हें अद्वितीय गहराई की रचनाओं में निखारा। अनातोलियन लोक में bendir फ्रेम-ड्रम और kaşık (लकड़ी के चम्मच) जुड़ते हैं; समकालीन Arabesk व पॉप अब भी darbuka को साथी नहीं, मुख्य आवाज़ बनाते हैं।`,
    },
    ru: {
      short: 'Турция',
      label: 'Турция / Османы',
      intro: `Турецкий ритм строится на усуле — циклах ударов düm (глухой) и tek (острый), длина которых может тянуться от 2 до 120 долей. Пара davul-zurna до сих пор ведёт сельские свадьбы и обрезания, тогда как лёгкий, серебристо-звучащий darbuka движет городскими тавернами и свадебными залами. Циклы аксак вроде 9/8 (2+2+2+3) ощущаются как конь, сменяющий аллюр на полном ходу; османский двор отшлифовал их в композиции невероятной глубины. Анатолийский фольк добавляет рамочный bendir и kaşık (деревянные ложки); современный арабеск и поп по-прежнему ставят darbuka на передний план, а не в подложку.`,
    },
  },
  'arabic-swana': {
    tr: {
      short: 'SWANA',
      label: 'Arap / SWANA',
      intro: `Arapça konuşulan dünya boyunca iqa'at sistemi zamanı dum ve tak döngüleri olarak örer; Mısır ve Levant pop'unun dört vuruşluk varsayılanı maqsum, ortak dile en yakın olanıdır. Kadeh biçimli darbuka (tabla ya da doumbek olarak da bilinir) topluluğun merkezidir; yanında ince işçilik için riq (zilli def) ve daha derin trans müziği için bendir çerçeve davulu yer alır. 10 vuruşluk samai thaqil, 8 vuruşluk masmoudi ve 4 vuruşluk malfuf gibi ağır iqa'at sırasıyla Sufi zikr törenlerini, Mısır film orkestralarını ve Körfez khaleeji'sini taşır. Bu ritimler İslam'dan eskidir — klasik Arap şiirinin vezninden gelir.`,
    },
    es: {
      short: 'SWANA',
      label: 'Árabe / SWANA',
      intro: `En el mundo de habla árabe, el sistema iqa'at organiza el tiempo en ciclos de dum y tak; el maqsum — el patrón de cuatro pulsos del pop egipcio y levantino — funciona como lengua franca. La darbuka con forma de copa (también llamada tabla o doumbek) ocupa el centro del ensamble, flanqueada por el riq (pandero con címbalos) para filigranas delicadas y el bendir para la música de trance más profunda. Iqa'at más pesados como el samai thaqil de 10 tiempos, el masmoudi de 8 y el malfuf de 4 sostienen, respectivamente, las ceremonias sufíes de dhikr, las orquestas de cine egipcio y el khaleeji del Golfo. Los ritmos preceden al Islam — vienen de la métrica de la poesía árabe clásica.`,
    },
    zh: {
      short: 'SWANA',
      label: '阿拉伯 / SWANA',
      intro: `在阿拉伯语世界,iqa'at 体系把时间组织为 dum 与 tak 的循环;maqsum —— 埃及与黎凡特流行乐的四拍底板 —— 是最接近通用语言的节奏。高脚杯形的 darbuka(也称 tabla 或 doumbek)位于乐队中心,两侧是用于细腻装饰的 riq(带钹小手鼓)与用于深度入神的 bendir 框鼓。更重的 iqa'at,如 10 拍 samai thaqil、8 拍 masmoudi、4 拍 malfuf,分别承载苏菲 dhikr 仪式、埃及电影乐团与海湾 khaleeji。这些节奏比伊斯兰更古老 —— 它们源自古典阿拉伯诗歌的格律本身。`,
    },
    fr: {
      short: 'SWANA',
      label: 'Arabe / SWANA',
      intro: `Dans le monde arabophone, le système iqa'at organise le temps en cycles de dum et tak ; le maqsum — la base à quatre temps de la pop égyptienne et levantine — joue le rôle de lingua franca. La darbuka en forme de calice (aussi appelée tabla ou doumbek) trône au centre de l'ensemble, flanquée du riq (tambourin à cymbales) pour la dentelle rythmique et du bendir pour la musique de transe la plus profonde. Des iqa'at plus lourds comme le samai thaqil à 10 temps, le masmoudi à 8 temps et le malfuf à 4 temps portent respectivement les cérémonies soufies de dhikr, les orchestres de cinéma égyptiens et le khaleeji du Golfe. Ces rythmes précèdent l'islam — ils viennent du mètre de la poésie arabe classique.`,
    },
    hi: {
      short: 'SWANA',
      label: 'अरब / SWANA',
      intro: `अरबी-भाषी विश्व भर में iqa'at प्रणाली समय को dum और tak के चक्रों में बाँधती है; maqsum — मिस्री और लेवेंट पॉप का चार-मात्रा का डिफ़ॉल्ट — सबसे क़रीबी भाषा-संपर्क की भूमिका निभाता है। प्याले-आकार का darbuka (जिसे tabla या doumbek भी कहा जाता है) समूह के केंद्र में बैठता है; उसके बग़ल में नाज़ुक काम के लिए riq (झालर वाला डफ़) और गहरे trance संगीत के लिए bendir फ्रेम-ड्रम। 10-मात्रा का samai thaqil, 8-मात्रा का masmoudi, 4-मात्रा का malfuf जैसे भारी iqa'at क्रमशः सूफ़ी zikr समारोहों, मिस्री फ़िल्म-संगीत के अर्केस्ट्रा और खाड़ी khaleeji को थामते हैं। ये लय इस्लाम से भी पुरानी हैं — शास्त्रीय अरबी काव्य के छंद से आती हैं।`,
    },
    ru: {
      short: 'SWANA',
      label: 'Арабский / SWANA',
      intro: `По всему арабскому миру система iqa'at организует время в циклы dum и tak; maqsum — четырёхдольная основа египетской и левантийской попсы — играет роль лингва франка. Кубковидная darbuka (также tabla или doumbek) сидит в центре ансамбля; рядом — riq (бубен с тарелками) для тонкой филиграни и рамочный bendir для глубокой трансовой музыки. Более тяжёлые iqa'at — десятидольный samai thaqil, восьмидольный masmoudi и четырёхдольный malfuf — несут соответственно суфийские церемонии zikr, оркестры египетского кино и khaleeji Залива. Эти ритмы древнее ислама — они приходят из метрики классической арабской поэзии.`,
    },
  },
  'persia': {
    tr: {
      short: 'İran',
      label: 'İran',
      intro: `İran müziği uzun nefeslerle düşünür. Tombak — oyma dut ağacından bir kadeh davul — on parmakla aynı anda çalınır; aynı tümce içinde fısıldayabilir ya da silah patlaması gibi çatlayabilir. Daf, halka asılı dev bir çerçeve davul, Sufi semâ törenlerinin sesidir; istikrarlı bir hızlanmayla dinleyiciyi transa iter. Pers ritmik döngüleri (usul-e iqa'i) Sasani sarayında yazıya geçirildi ve doğrudan dastgah modal geleneğine besler. Bölgesel gelenekler kendi vurgularını ekler: Horasanlı dotar ritimleri, Afrika etkili Bandari kıyı groove'ları ve saatlerce uzayan Kürt daf törenleri.`,
    },
    es: {
      short: 'Persia',
      label: 'Persia',
      intro: `La música persa piensa en respiraciones largas. El tombak — un tambor con forma de cáliz tallado en morera — se toca con los diez dedos a la vez; produce una paleta capaz de susurrar o de estallar como un disparo dentro de una misma frase. El daf, un enorme tambor de marco con anillos colgantes, es la voz de las ceremonias sufíes samā: empuja al oyente al trance mediante una aceleración constante. Los ciclos rítmicos persas (usul-e iqa'i) se codificaron en la corte sasánida y alimentan directamente la tradición modal del dastgah. Las tradiciones regionales añaden sus acentos: ritmos del dotar de Khorasan, grooves costeros bandari con influencias africanas, y ceremonias kurdas de daf que duran horas.`,
    },
    zh: {
      short: '波斯',
      label: '波斯',
      intro: `波斯音乐以长气息思考。tombak —— 一种用桑木雕成的高脚杯鼓 —— 由十指同时演奏,在同一乐句中能从耳语骤变为枪响。daf,挂着金属环的大型框鼓,是苏菲 samā 仪式的声音,通过稳定的加速将聆听者推向出神。波斯节奏循环(usul-e iqa'i)在萨珊宫廷中被编纂,直接喂养着 dastgah 调式传统。各地传统增添各自的腔调:呼罗珊的 dotar 节奏、带非洲影响的 Bandari 海岸律动、以及连绵数小时的库尔德 daf 仪式。`,
    },
    fr: {
      short: 'Perse',
      label: 'Perse',
      intro: `La musique persane pense en longues respirations. Le tombak — un tambour-calice taillé dans le mûrier — se joue avec les dix doigts à la fois ; il déploie une palette qui peut chuchoter ou claquer comme un coup de feu au sein de la même phrase. Le daf, immense tambour sur cadre cerclé d'anneaux, est la voix des cérémonies soufies samā : il pousse l'auditeur vers la transe par une accélération régulière. Les cycles rythmiques persans (usul-e iqa'i) furent codifiés à la cour sassanide et nourrissent directement la tradition modale du dastgah. Les traditions régionales y ajoutent leurs accents : rythmes du dotar du Khorasan, grooves côtiers bandari aux influences africaines, et cérémonies kurdes de daf qui s'étirent sur des heures.`,
    },
    hi: {
      short: 'पर्शिया',
      label: 'पर्शिया',
      intro: `पर्शियन संगीत लंबी साँसों में सोचता है। tombak — शहतूत की लकड़ी से तराशा प्याला-ड्रम — दसों उंगलियों से एक साथ बजता है; एक ही पंक्ति में फुसफुसाहट से लेकर बंदूक की गूँज तक का परिवेश रचता है। daf, छल्ले लटकता विशाल फ्रेम-ड्रम, सूफ़ी समा समारोहों की आवाज़ है: स्थिर गति-वृद्धि से श्रोता को ट्रांस की ओर धकेलता है। पर्शियन लय-चक्र (usul-e iqa'i) सस्सानी दरबार में सूत्रबद्ध हुए और सीधे dastgah मोडल परंपरा को सींचते हैं। क्षेत्रीय परंपराएँ अपने रंग जोड़ती हैं: ख़ुरासानी dotar की लय, अफ़्रीकी प्रभाव वाली Bandari तटीय groove, और घंटों चलने वाले कुर्द daf समारोह।`,
    },
    ru: {
      short: 'Персия',
      label: 'Персия',
      intro: `Персидская музыка мыслит длинными вдохами. Тамбак — кубковидный барабан из резного шелковичного дерева — играют десятью пальцами одновременно; в одной фразе он может шептать и выстреливать, как пистолет. Даф, огромный рамочный барабан с подвешенными кольцами, — голос суфийских церемоний samā: он толкает слушателя к трансу через ровное ускорение. Персидские ритмические циклы (usul-e iqa'i) были кодифицированы при сасанидском дворе и напрямую питают модальную традицию dastgah. Региональные традиции добавляют свои акценты: хорасанские ритмы dotar, прибрежные грувы bandari с африканским влиянием, многочасовые курдские церемонии daf.`,
    },
  },
  'india': {
    tr: {
      short: 'Hindistan',
      label: 'Hindistan',
      intro: `Hint klasik ritmi tāla halinde örgütlenir — el üzerinde sayılan uzun döngüsel çerçeveler; tali (alkış) ve khali (dalga) güçlü ve boş vuruşları işaretler. Hindustani tabla kuzeye hâkimdir; 16 vuruşluk Teental ve 10 vuruşluk Jhaptal kathak dansından kavvalîye kadar her şeyi çerçeveler. Carnatic güney ise zamanı varil biçimli mridangam ve kanjira çerçeve davulu üzerinde tutar. Hint ritmini ayırt eden konuşma sözcüğüdür: her davul vuruşunun bir hecesi (bol) vardır; usta çalgıcılar tek nota bile çalmadan kelimelerle bütün doğaçlamalar besteleyebilir. Halk ve Bollywood, dholak ile kum saati biçimli khol'a yaslanır; bhangra için devasa dhol vardır.`,
    },
    es: {
      short: 'India',
      label: 'India',
      intro: `El ritmo clásico indio se organiza en tāla — marcos cíclicos largos contados sobre la mano, con palmas (tali) y ondas (khali) que marcan pulsos fuertes y vacíos. La tabla hindustaní domina el norte: el Teental de 16 pulsos y el Jhaptal de 10 enmarcan desde la danza kathak hasta el qawwali; el sur carnático lleva el tiempo sobre el mridangam (tambor de barril) y el kanjira (pandero). Lo que hace distinto al ritmo indio es el vocabulario hablado: cada golpe tiene su sílaba (bol), y los maestros componen improvisaciones enteras en palabras antes de tocar una sola nota. El folk y Bollywood se apoyan en el dholak y el khol con forma de reloj de arena, más el dhol descomunal del bhangra.`,
    },
    zh: {
      short: '印度',
      label: '印度',
      intro: `印度古典节奏以塔拉组织 —— 在手上数算的长循环框架,以拍掌(tali)与挥手(khali)标记强拍与空拍。北方由兴都斯坦塔布拉主导:16 拍 Teental 与 10 拍 Jhaptal 框出从卡塔克舞到 qawwali 的一切;南方卡纳提克在桶形的 mridangam 与 kanjira 框鼓上守时。印度节奏的独特之处在于它的口头词汇:每一击都有它的音节(bol),大师能在落下一个音符前用文字编排整段即兴。民间与宝莱坞依赖 dholak 与沙漏形的 khol,加上巨大的 dhol 用于 bhangra。`,
    },
    fr: {
      short: 'Inde',
      label: 'Inde',
      intro: `Le rythme classique indien s'organise en tāla — de longs cadres cycliques comptés sur la main, où les claps (tali) et les ondes (khali) marquent les temps forts et vides. Le tabla hindoustani domine le nord : le Teental à 16 temps et le Jhaptal à 10 encadrent tout, du kathak au qawwali ; le sud carnatique tient le temps sur le mridangam (tambour-tonneau) et la kanjira (frame drum). Ce qui distingue le rythme indien, c'est son vocabulaire parlé : chaque frappe a sa syllabe (bol), et les maîtres composent des improvisations entières en mots avant de jouer une note. Le folk et Bollywood s'appuient sur le dholak et le khol en forme de sablier, plus l'énorme dhol du bhangra.`,
    },
    hi: {
      short: 'भारत',
      label: 'भारत',
      intro: `भारतीय शास्त्रीय लय ताल में गुँथी जाती है — हाथ पर गिने जाने वाले लंबे चक्रीय ढाँचे, जहाँ ताली (clap) और खाली (wave) सम और ख़ाली मात्राओं को दर्शाती हैं। हिंदुस्तानी तबला उत्तर पर हावी है: 16-मात्रा का तीनताल और 10-मात्रा का झपताल कथक नृत्य से क़व्वाली तक हर चीज़ का ढाँचा रचते हैं; कर्नाटक दक्षिण बेलनाकार मृदंगम और कांजीरा फ्रेम-ड्रम पर समय रखता है। भारतीय लय की विशेषता उसकी मौखिक शब्दावली है: हर स्ट्रोक का अपना बोल होता है, और उस्ताद एक नोट बजाने से पहले शब्दों में पूरा आशुप्रवाह रच सकते हैं। लोक और बॉलीवुड ढोलक तथा घड़ियाली खोल पर टिके हैं, साथ ही भांगड़ा के लिए विशाल ढोल।`,
    },
    ru: {
      short: 'Индия',
      label: 'Индия',
      intro: `Индийская классическая ритмика организована в тāла — длинные циклические рамки, отсчитываемые на руке: tali (хлопок) и khali (взмах) отмечают сильные и пустые доли. Хиндустанская табла властвует на севере: 16-дольный Teental и 10-дольный Jhaptal обрамляют всё — от катхака до каввали. На юге карнатская традиция держит время на бочковидном mridangam и рамочной kanjira. Индийский ритм отличает его проговариваемый словарь: у каждого удара своё слогом (bol), и мастера сочиняют целые импровизации в словах прежде, чем сыграть хоть ноту. Фольк и Болливуд опираются на dholak и песочные часы khol, плюс огромный dhol для бхангры.`,
    },
  },
  'gamelan-southeast-asia': {
    tr: {
      short: 'Gamelan',
      label: 'Gamelan / GD Asya',
      intro: `Bir Cava ya da Bali gamelanı bir çalgılar topluluğu değildir — tek bir varlık olarak anlaşılır; ruhunu büyük gong ageng tutar. Zaman kolotomik biçimde örgütlenir: uzun yapısal gonglar tümcelerin sonunu işaret eder, daha kısa kenong ve kempul vuruşları onları böler, kendang el davulu ise tempoyu canlı yönetir. Cava gamelanı yavaş, meditatif rafine (halus) tercih eder; Bali gong kebyar, bir titreşim için hafif farklı akortlanmış çalgı çiftleri arasında çalınan iç içe geçen kotekan örüntülerinde patlar. Tay piphat, Filipin kulintang ve Vietnam saray toplulukları aynı kolotomik mantığı paylaşır — zaman, vuruş değil, çanlarla işaretlenir.`,
    },
    es: {
      short: 'Gamelán',
      label: 'Gamelán / SE Asia',
      intro: `Un gamelán javanés o balinés no es una colección de instrumentos: se entiende como un solo ser, con el gran gong ageng sosteniendo su alma. El tiempo se organiza colotómicamente: los gongs estructurales largos cierran las frases, los kenong y kempul más cortos las subdividen, y el tambor de mano kendang dirige el tempo en vivo. El gamelán javanés cultiva el refinamiento lento y meditativo (halus); el gong kebyar balinés explota en patrones kotekan entrelazados, ejecutados entre instrumentos pareados afinados ligeramente distintos para producir un latido tornasolado. El piphat tailandés, el kulintang filipino y los ensambles cortesanos vietnamitas comparten la misma lógica colotómica — tiempo marcado por campanas, no por backbeat.`,
    },
    zh: {
      short: '甘美兰',
      label: '甘美兰 / 东南亚',
      intro: `爪哇或巴厘岛的甘美兰不是一组乐器 —— 它被理解为一个生命整体,巨大的 gong ageng 持着它的灵魂。时间以 colotomic 方式组织:长结构性大锣标记乐句结束,较短的 kenong 与 kempul 击点细分,kendang 手鼓实时引导速度。爪哇甘美兰偏向缓慢、冥想式的精炼(halus);巴厘岛 gong kebyar 则在配对乐器之间的 kotekan 互锁模式中爆发,两者音高微差以制造闪烁的拍频。泰国 piphat、菲律宾 kulintang 与越南宫廷合奏共享同一 colotomic 逻辑 —— 时间由钟标记,而非反拍。`,
    },
    fr: {
      short: 'Gamelan',
      label: 'Gamelan / Asie du SE',
      intro: `Un gamelan javanais ou balinais n'est pas une collection d'instruments — il est compris comme un être unique, le grand gong ageng en tient l'âme. Le temps s'organise colotomiquement : de longs gongs structurels marquent la fin des phrases, des frappes plus courtes de kenong et kempul les subdivisent, et le tambour à main kendang dirige le tempo en direct. Le gamelan javanais privilégie un raffinement lent et méditatif (halus) ; le gong kebyar balinais explose en motifs kotekan entrelacés joués entre instruments par paires accordées légèrement différemment pour produire un battement scintillant. Le piphat thaï, le kulintang philippin et les ensembles de cour vietnamiens partagent la même logique colotomique — un temps marqué par des cloches, pas par un backbeat.`,
    },
    hi: {
      short: 'गमेलान',
      label: 'गमेलान / द.पू. एशिया',
      intro: `जावानी या बाली का गमेलान वाद्य-समूह नहीं है — इसे एक जीव-इकाई माना जाता है, जिसकी आत्मा विशाल gong ageng रखती है। समय colotomic तरीक़े से रचा जाता है: लंबे संरचनात्मक गोंग वाक्य का अंत चिह्नित करते हैं, छोटे kenong और kempul उन्हें उपविभाजित करते हैं, और kendang हाथ-ढोल लाइव गति का संचालन करता है। जावानी गमेलान धीमी, ध्यानमयी परिष्कृति (halus) पसंद करता है; बाली का gong kebyar जोड़े गए वाद्यों के बीच इंटरलॉकिंग kotekan पैटर्न में फूट पड़ता है, जो हल्के से अलग ट्यून किए गए हैं ताकि कांपती धड़कन रचे। थाई piphat, फ़िलिपिनो kulintang और वियतनामी दरबारी समूह उसी colotomic तर्क को साझा करते हैं — समय घंटियों से चिह्नित होता है, बैकबीट से नहीं।`,
    },
    ru: {
      short: 'Гамелан',
      label: 'Гамелан / ЮВ Азия',
      intro: `Яванский или балийский гамелан — это не набор инструментов: его понимают как единое существо, душу которого хранит большой gong ageng. Время организовано колотомически: длинные структурные гонги отмечают концы фраз, короткие удары kenong и kempul их подразделяют, а ручной барабан kendang ведёт темп вживую. Яванский гамелан тяготеет к медленной медитативной утончённости (halus); балийский gong kebyar взрывается переплетающимися kotekan-паттернами на парных инструментах, настроенных с лёгкой разницей ради мерцающего биения. Тайский piphat, филиппинский kulintang и вьетнамские придворные ансамбли разделяют ту же колотомическую логику — время отмечают колокола, а не backbeat.`,
    },
  },
  'east-asia': {
    tr: {
      short: 'D. Asya',
      label: 'Doğu Asya',
      intro: `Doğu Asya perküsyon gelenekleri, devasa davullar ve hassas, törensel zamanlama zevkini paylaşır. Kore samulnori, yüzyıllarca açık havada çiftçi müziğini (nongak) dört çalgıya damıttı — kum saati biçimli janggu, küçük gong kkwaenggwari, büyük gong jing, varil davulu buk — coşkulu ivmelenmeye doğru hızlanan changdan döngülerine kilitlenmiş. Japon kumi-daiko toplulukları odayı sallayan ō-daiko etrafında merkezlenir ve don-don-ka gibi jiuchi temel örüntülerini üstte her şeyi sabitlemek için kullanır. Çin aslan ve ejder dansı vurmalı çalgıları derin tanggu üzerine kuruludur; opera perküsyonu küçük bangu tahta blokunu şefin asası olarak kullanır. Bölge boyunca daha yüksek ses neredeyse her zaman daha kutsal anlamına gelir.`,
    },
    es: {
      short: 'E. Asia',
      label: 'Asia Oriental',
      intro: `Las tradiciones percusivas de Asia Oriental comparten gusto por tambores enormes y un timing ceremonial preciso. El samulnori coreano destiló siglos de música campesina al aire libre (nongak) en cuatro instrumentos — janggu (tambor de reloj de arena), kkwaenggwari (gong pequeño), jing (gong grande), buk (tambor de barril) — encajados en ciclos changdan que aceleran hacia el éxtasis. Los ensambles japoneses kumi-daiko se centran en el ō-daiko que hace temblar la sala y usan patrones jiuchi como don-don-ka para anclar todo lo demás. La percusión china de danzas del león y el dragón se construye en torno al cavernoso tanggu; la percusión de ópera usa el pequeño bangu como batuta del director. En toda la región, más fuerte casi siempre significa más sagrado.`,
    },
    zh: {
      short: '东亚',
      label: '东亚',
      intro: `东亚打击乐传统共享对庞大鼓与精确仪式性时序的偏好。韩国 samulnori 把数百年农民户外音乐(nongak)浓缩为四件乐器 —— 沙漏形 janggu、小锣 kkwaenggwari、大锣 jing、桶鼓 buk —— 锁入 changdan 循环,加速到狂喜。日本 kumi-daiko 合奏以撼动屋宇的 ō-daiko 为中心,使用 don-don-ka 等 jiuchi 基底节奏稳住其上的一切。中国狮龙舞鼓乐围绕深空 tanggu 构建,戏曲打击乐以小巧的 bangu 木块为指挥的指挥棒。整个区域,更响几乎总是更神圣。`,
    },
    fr: {
      short: 'Asie de l\'E.',
      label: 'Asie de l\'Est',
      intro: `Les traditions percussives d'Asie de l'Est partagent un goût pour les énormes tambours et un timing cérémoniel précis. Le samulnori coréen a distillé des siècles de musique paysanne en plein air (nongak) en quatre instruments — janggu (sablier), kkwaenggwari (petit gong), jing (grand gong), buk (tambour-tonneau) — verrouillés dans des cycles changdan qui accélèrent jusqu'à l'extase. Les ensembles japonais kumi-daiko se centrent sur l'ō-daiko qui ébranle la pièce et utilisent des motifs jiuchi comme don-don-ka pour ancrer tout le reste. La percussion chinoise des danses du lion et du dragon se construit autour du tanggu caverneux ; la percussion d'opéra utilise le minuscule bloc de bois bangu comme baguette du chef. Dans toute la région, plus fort signifie presque toujours plus sacré.`,
    },
    hi: {
      short: 'पू. एशिया',
      label: 'पूर्वी एशिया',
      intro: `पूर्वी एशियाई पर्क्यूशन परंपराएँ विशाल ढोलों और सटीक, अनुष्ठानिक समय के स्वाद को साझा करती हैं। कोरियाई samulnori ने सदियों के खुले-आसमान वाले किसान संगीत (nongak) को चार वाद्यों में निचोड़ा — रेत-घड़ी आकार janggu, छोटा गोंग kkwaenggwari, बड़ा गोंग jing, बैरल-ढोल buk — changdan चक्रों में बंधे जो उल्लासमय गति-वृद्धि तक चढ़ते हैं। जापानी kumi-daiko समूह कमरे को हिला देने वाले ō-daiko पर केंद्रित होते हैं और don-don-ka जैसे jiuchi बेस-पैटर्न से ऊपर सब कुछ टिकाते हैं। चीनी सिंह व ड्रैगन-नृत्य का ढोल-वादन गहरे tanggu पर बना है, ऑपेरा पर्क्यूशन में नन्हा bangu लकड़ी ब्लॉक संचालक की डंडी है। पूरे क्षेत्र में, अधिक तेज़ का अर्थ लगभग हमेशा अधिक पवित्र होता है।`,
    },
    ru: {
      short: 'В. Азия',
      label: 'Восточная Азия',
      intro: `Восточноазиатские перкуссионные традиции объединяет вкус к огромным барабанам и точному, церемониальному таймингу. Корейский samulnori вычленил столетия крестьянской музыки под открытым небом (nongak) в четыре инструмента — janggu (барабан-песочные часы), kkwaenggwari (малый гонг), jing (большой гонг), buk (барабан-бочка) — запертые в циклы changdan, ускоряющиеся до экстаза. Японские ансамбли kumi-daiko строятся вокруг сотрясающего комнату ō-daiko и используют базовые паттерны jiuchi вроде don-don-ka, чтобы заякорить всё остальное. Китайская перкуссия танцев льва и дракона строится вокруг гулкого tanggu, а оперная — на крошечном деревянном bangu, который служит дирижёрской палочкой. По всему региону громче почти всегда означает священнее.`,
    },
  },
  'west-africa': {
    tr: {
      short: 'Batı Afrika',
      label: 'Batı Afrika',
      intro: `Batı Afrika toplulukları ritmi süslemeli bir nabız değil, iç içe geçmiş bir konuşma olarak düşünür. Bir Ewe davul çemberi gankogui çan zaman çizgisini, axatse su kabağı çıngırağını, iki ya da üç destek davulunu ve tüm bunlara karşı doğaçlama yapan bir master atsimevu'yu üst üste yığar — polyritmi müziğin kendisidir. Mande djembe gelenekleri Gine ve Mali'den aynı mantığı taşır: hasat için kassa, güçlü erkekler için dununba, kutlama için sunu — her birinin lider tarafından verilen kendi sinyali (kırılması) vardır. Konuşan davul (Yoruba dilinde dundun, Dagomba'da lunga) tonal dili tam anlamıyla konuşur; kilometrelerce isimleri, atasözlerini ve övgüleri taşır. Atlas geçişinin Atlantik'in karşısına taşıdığı ritmik DNA budur.`,
    },
    es: {
      short: 'África O.',
      label: 'África Occidental',
      intro: `Los ensambles de África Occidental conciben el ritmo como una conversación entrelazada, no como un pulso con adornos. Un círculo de tambores ewe superpone una línea temporal en la campana gankogui, una maraca-calabaza axatse, dos o tres tambores de apoyo y un master atsimevu que improvisa contra todo lo demás — la polirritmia ES la música. Las tradiciones mandé del djembe en Guinea y Malí cargan la misma lógica: kassa para la cosecha, dununba para los hombres fuertes, sunu para la celebración — cada una con su patrón de ruptura (señal) lanzado por el líder. El tambor parlante (dundun en yoruba, lunga en dagomba) literalmente habla la lengua tonal: lleva nombres, proverbios y alabanzas a kilómetros. Este es el ADN rítmico que el Pasaje del Medio cargó a través del Atlántico.`,
    },
    zh: {
      short: '西非',
      label: '西非',
      intro: `西非合奏把节奏视为彼此交织的对话,而非"打个底,再添花"。一个 Ewe 鼓圈把 gankogui 钟的时间线、axatse 葫芦响铃、两到三只副鼓,以及在它们之上即兴的主鼓 atsimevu 层层叠加 —— 复合节奏本身就是音乐。几内亚和马里的曼德 djembe 传统沿用同一逻辑:kassa 庆祝丰收、dununba 颂强壮男子、sunu 用于欢庆,各自带着主鼓抛出的"破解"信号。会说话的鼓(约鲁巴语 dundun、达戈姆巴语 lunga)真的能说出声调语言,将姓名、谚语与赞辞带到几公里之外。这就是中央航段(Middle Passage)跨越大西洋时所携带的节奏 DNA。`,
    },
    fr: {
      short: 'Afr. de l\'O.',
      label: 'Afrique de l\'Ouest',
      intro: `Les ensembles ouest-africains conçoivent le rythme comme une conversation entrelacée, et non comme une pulsation décorée. Un cercle ewe superpose une ligne temporelle de cloche gankogui, un hochet-courge axatse, deux ou trois tambours de soutien et un atsimevu maître qui improvise contre tout le reste — la polyrythmie EST la musique. Les traditions djembé mandé de Guinée et du Mali portent la même logique : kassa pour la moisson, dununba pour les hommes forts, sunu pour la fête — chacun avec son motif de rupture (signal) lancé par le maître. Le tambour parlant (dundun en yoruba, lunga en dagomba) parle littéralement la langue tonale, transportant noms, proverbes et louanges à des kilomètres. C'est l'ADN rythmique que le passage du milieu a emporté de l'autre côté de l'Atlantique.`,
    },
    hi: {
      short: 'प. अफ्रीका',
      label: 'पश्चिम अफ्रीका',
      intro: `पश्चिम अफ्रीकी समूह लय को सजा हुआ बीट नहीं, गुँथी हुई बातचीत मानते हैं। एक Ewe ढोल-वृत्त gankogui घंटी की समय-रेखा, axatse लौकी की झुन-झुन, दो-तीन सहायक ढोल और सबके विरुद्ध इम्प्रोवाइज़ करते हुए लीड atsimevu को परत-दर-परत बिछाता है — पॉलीरिदम ही संगीत है। गिनी और माली की मांडे djembe परंपराएँ यही तर्क ढोती हैं: फसल के लिए kassa, बलिष्ठ पुरुषों के लिए dununba, उत्सव के लिए sunu — हर एक का अपना ब्रेक-पैटर्न (signal) लीड से आता है। बोलने वाला ढोल (योरूबा में dundun, दगोम्बा में lunga) सचमुच टोनल भाषा बोलता है, नामों, कहावतों और प्रशंसाओं को किलोमीटरों दूर ले जाता है। यह वही लय-डीएनए है जिसे मध्य-प्रवास ने अटलांटिक पार पहुँचाया।`,
    },
    ru: {
      short: 'З. Африка',
      label: 'Западная Африка',
      intro: `Западноафриканские ансамбли мыслят ритм не как пульс с украшениями, а как переплетающийся разговор. Эвейский барабанный круг наслаивает временную линию колокола gankogui, погремушку-тыкву axatse, два-три поддерживающих барабана и мастер-atsimevu, который импровизирует против всех остальных, — полиритм и есть сама музыка. Манде-традиции джембе из Гвинеи и Мали несут ту же логику: kassa для урожая, dununba для сильных мужчин, sunu для праздника — у каждого свой break-паттерн (сигнал), задаваемый лидером. Говорящий барабан (dundun у йоруба, lunga у дагомба) буквально говорит на тоновом языке, разнося имена, пословицы и хвалы на километры. Это та ритмическая ДНК, которую Срединный переход унёс через Атлантику.`,
    },
  },
  'cuba-afrocaribbean': {
    tr: {
      short: 'Küba',
      label: 'Küba / Afro-Karayip',
      intro: `Küba, Yoruba, Fon, Kongo ve İspanyol müziklerinin Amerika kıtasındaki en yoğun Afrika kurumsal varlığıyla — cabildos de nación — buluştuğu yerdir; sonuçta tüm dünyanın artık konuştuğu bir ritmik söz dağarcığı doğdu. Beş vuruşlu clave (3-2 ya da 2-3) Rosetta Taşı'dır: her son, mambo, salsa ve timba ona göre yönlenir. Kutsal bata davulları (iyá, itótele, okónkolo) santería törenlerinde Orisha'lara hâlâ Yoruba konuşur; seküler rumba — guaguancó, yambú, columbia — tumbadora ve cajón üzerinde gecekondu avlularında oynanır. Konga, bongo ve son cáscara'nın çan örüntüsü hep buraya kadar uzanır.`,
    },
    es: {
      short: 'Cuba',
      label: 'Cuba / Afrocaribeño',
      intro: `Cuba es donde las músicas yoruba, fon, kongo e hispana se encontraron con la presencia institucional africana más densa de las Américas — los cabildos de nación — y produjeron un vocabulario rítmico que el mundo entero habla ahora. La clave de cinco golpes (3-2 o 2-3) es la piedra de Rosetta: cada son, mambo, salsa y timba se orienta a su alrededor. Los batá sagrados (iyá, itótele, okónkolo) todavía hablan yoruba a los orishas en ceremonias santeras, mientras la rumba secular — guaguancó, yambú, columbia — se desarrolla sobre tumbadoras y cajones en patios de tenement. La conga, el bongó y el patrón de cencerro del son cáscara remontan todos hasta aquí.`,
    },
    zh: {
      short: '古巴',
      label: '古巴 / 非洲-加勒比',
      intro: `古巴是约鲁巴、丰、刚果与西班牙音乐与美洲最密集的非洲制度性存在 —— 民族会馆(cabildos de nación)—— 相遇之地,催生了一套如今全世界都在使用的节奏词汇。五击 clave(3-2 或 2-3)是罗塞塔石碑:son、mambo、salsa、timba 全都围绕它定位。神圣的 batá 鼓(iyá、itótele、okónkolo)仍在 santería 仪式中以约鲁巴语向 Orishas 说话;世俗 rumba —— guaguancó、yambú、columbia —— 在公寓后院的 tumbadora 与 cajón 上展开。康加鼓、bongo,以及 son cáscara 的牛铃模式,都源自这里。`,
    },
    fr: {
      short: 'Cuba',
      label: 'Cuba / Afro-Caraïbe',
      intro: `Cuba est l'endroit où les musiques yoruba, fon, kongo et espagnole ont rencontré la présence institutionnelle africaine la plus dense des Amériques — les cabildos de nación — et ont engendré un vocabulaire rythmique que le monde entier parle aujourd'hui. La clave à cinq frappes (3-2 ou 2-3) est la pierre de Rosette : chaque son, mambo, salsa et timba s'oriente autour. Les batá sacrés (iyá, itótele, okónkolo) parlent encore yoruba aux orishas dans les cérémonies de santería ; la rumba profane — guaguancó, yambú, columbia — se déploie sur tumbadoras et cajones dans les cours d'immeubles. Le conga, le bongo et le motif de cencerro du son cáscara remontent tous jusqu'ici.`,
    },
    hi: {
      short: 'क्यूबा',
      label: 'क्यूबा / अफ़्रो-कैरेबियन',
      intro: `क्यूबा वह जगह है जहाँ योरूबा, फ़ोन, कोंगो और स्पैनिश संगीत अमेरिकाओं की सबसे सघन अफ़्रीकी संस्थागत उपस्थिति — cabildos de nación — से मिले और एक ऐसी लय-शब्दावली रची जिसे आज पूरी दुनिया बोलती है। पाँच-स्ट्रोक clave (3-2 या 2-3) रोज़ेट्टा स्टोन है: हर son, mambo, salsa और timba इसके चारों ओर उन्मुख होते हैं। पवित्र batá ढोल (iyá, itótele, okónkolo) santería समारोहों में Orishas से अब भी योरूबा में बोलते हैं; धर्मनिरपेक्ष rumba — guaguancó, yambú, columbia — चालों के आँगनों में tumbadora और cajón पर बजती है। कोंगा ढोल, bongo, और son cáscara का काउबेल पैटर्न — सब यहीं से आते हैं।`,
    },
    ru: {
      short: 'Куба',
      label: 'Куба / Афро-Карибы',
      intro: `Куба — это место, где йорубская, фон, конго и испанская музыки встретились с самым плотным африканским институциональным присутствием в Америках — кабильдо де насьон — и породили ритмический словарь, на котором теперь говорит весь мир. Пятиударный клаве (3-2 или 2-3) — это Розеттский камень: каждый сон, мамбо, сальса и тимба ориентируются вокруг него. Священные barabany batá (iyá, itótele, okónkolo) до сих пор говорят на йоруба с ориша в церемониях сантерии; светская румба — guaguancó, yambú, columbia — играется на тумбадорах и кахонах во дворах доходных домов. Конга, бонго и каунбелл сон-каскары — всё родом отсюда.`,
    },
  },
  'caribbean': {
    tr: {
      short: 'Karayip',
      label: 'Karayip',
      intro: `Küba'nın ötesinde Karayipler ayrı ritmik ulusların takımyıldızıdır. Jamaika müziği kendini one-drop etrafında kurdu — snare ve kick 1'in değil 3'ün üstüne düşer — ve reggae'ye yüzen ağırlığını verdi. Trinidad calypso ve soca sıkı 2 ölçülük bir motor odası deseni üzerine oturur; çelik tencereler İkinci Dünya Savaşı sonrası geride bırakılan petrol varillerinden doğdu. Haiti vodou davulu Fon ve Kongo repertuvarlarını üç rada davulu üzerinde korur; méringue ve kompa pisti hareketli tutar. Porto Riko bomba ve plena'sında dansçı çalgıcının vurgularını çağırır, tersi değil. Dominik merengue ve bachata kazıyan güira ile tambora'yı ekler.`,
    },
    es: {
      short: 'Caribe',
      label: 'Caribe',
      intro: `Más allá de Cuba, el Caribe es una constelación de naciones rítmicas distintas. La música jamaicana se construyó sobre el one-drop — caja y bombo cayendo en el 3, no en el 1 — que le dio al reggae su peso flotante. El calypso y la soca trinitenses se asientan sobre un patrón compacto de "engine room" en 2 compases; las steel pans nacieron de los bidones de petróleo dejados tras la Segunda Guerra. La percusión vodou haitiana preserva los repertorios fon y kongo en los tres rada drums, mientras méringue y kompa mueven la pista. La bomba y la plena puertorriqueñas son tradiciones de percusión-y-voz donde la bailarina llama los acentos del percusionista, no al revés. El merengue y la bachata dominicanos suman la güira que rasca y la tambora.`,
    },
    zh: {
      short: '加勒比',
      label: '加勒比',
      intro: `古巴之外,加勒比是一系列各异的节奏国度。牙买加音乐围绕 one-drop 构建 —— 军鼓与底鼓落在第 3 拍,而非第 1 —— 这赋予 reggae 漂浮的重量。特立尼达 calypso 与 soca 坐在紧凑的 2 小节"engine room"模式上;steel pan 是二战后留下的油桶变出来的乐器。海地 vodou 鼓乐在三只 rada 鼓上保存 Fon 与 Kongo 曲目,méringue 与 kompa 让舞池继续。波多黎各的 bomba 与 plena 是打击乐与人声的传统,舞者反向"召唤"鼓手的重音。多米尼加 merengue 与 bachata 增加刮擦的 güira 与 tambora。`,
    },
    fr: {
      short: 'Caraïbe',
      label: 'Caraïbes',
      intro: `Au-delà de Cuba, les Caraïbes sont une constellation de nations rythmiques distinctes. La musique jamaïcaine s'est construite autour du one-drop — caisse claire et grosse caisse tombant sur le 3, pas sur le 1 — ce qui a donné au reggae son poids flottant. Le calypso et le soca trinidadiens reposent sur un motif d'engine room serré sur 2 mesures, avec les steel pans nés des bidons de pétrole laissés après la Seconde Guerre. La percussion vaudou haïtienne préserve les répertoires fon et kongo sur les trois tambours rada, tandis que méringue et kompa font tourner la piste. La bomba et la plena portoricaines sont des traditions percussion-et-voix où la danseuse appelle les accents du percussionniste, et non l'inverse. Le merengue et la bachata dominicains ajoutent la güira qui gratte et la tambora.`,
    },
    hi: {
      short: 'कैरेबियन',
      label: 'कैरेबियन',
      intro: `क्यूबा से परे कैरेबियन अलग-अलग लय-राष्ट्रों का समूह है। जमैकी संगीत one-drop पर रचा गया — स्नेयर और किक तीसरी मात्रा पर गिरते हैं, पहली पर नहीं — और यही reggae को उसका तैरता हुआ भार देता है। त्रिनिदाद calypso और soca एक तंग 2-बार "engine room" पैटर्न पर बैठते हैं; steel pan द्वितीय विश्वयुद्ध के बाद बचे तेल के पीपों से जन्मे। हाइतियाई vodou ढोल-वादन तीन rada ढोलों पर Fon और Kongo रेपरटुअर सहेजता है, जबकि méringue व kompa डांसफ़्लोर को चलाते हैं। प्यूर्टोरिकन bomba और plena परक्यूशन-व-गायन परंपराएँ हैं जहाँ नर्तकी ढोलकिये की वज़न-थाप को बुलाती है, उल्टा नहीं। डोमिनिकन merengue और bachata खुरचने वाली güira और tambora जोड़ते हैं।`,
    },
    ru: {
      short: 'Карибы',
      label: 'Карибы',
      intro: `За пределами Кубы Карибы — созвездие отдельных ритмических наций. Ямайская музыка выстроилась вокруг one-drop — малый и бочка падают на 3-ю долю, а не на 1-ю — что и дало reggae его парящую тяжесть. Тринидадские calypso и soca садятся на плотный двухтактовый "engine room" паттерн; steel pans родились из нефтяных бочек, оставшихся после Второй мировой. Гаитянская vodou-перкуссия хранит репертуары фон и конго на трёх rada-барабанах, а méringue и kompa движут танцпол. Пуэрториканские bomba и plena — это традиции "перкуссия и голос", где танцовщица вызывает акценты барабанщика, а не наоборот. Доминиканские merengue и bachata добавляют скребущую güira и tambora.`,
    },
  },
  'brazil': {
    tr: {
      short: 'Brezilya',
      label: 'Brezilya',
      intro: `Brezilya yaklaşık 4,9 milyon köleleştirilmiş Afrikalıyı aldı — Kuzey Amerika'ya getirilenin on katı — ve yarımkürenin en derin Afrika ritim havzası oldu. Samba ulusal nabızdır; 2/4'lük bir hücre üzerine kuruludur: surdo derin bir vuruşla downbeat'i işaretler, üstte tamborim senkoplu bir 16'lık deseni keser, cuíca sürtme davulu bir ses gibi konuşur. Bahia'nın candomblé törenleri rum-rumpi-lé atabaque üçlüsünde hâlâ Yoruba toques'leri çalar. Capoeira berimbau'nun yay-tel tıkırtısı altında 6/8'de yuvarlanır; maracatu Recife karnavalında alfaia bas davulu ile gürler; bossa nova ise samba'yı sessizce tekrar katlayıp fısıltılı bir caza dönüştürür.`,
    },
    es: {
      short: 'Brasil',
      label: 'Brasil',
      intro: `Brasil recibió aproximadamente 4,9 millones de africanos esclavizados — diez veces los que llegaron a Norteamérica — y se convirtió en el reservorio más profundo de ritmo africano del hemisferio. La samba es el pulso nacional, construida sobre una célula de 2/4: el surdo marca el downbeat con un golpe grave, el tamborim corta una frase sincopada en semicorcheas encima, y la cuíca de fricción habla como una voz. Las ceremonias candomblé de Bahía aún tocan toques yoruba en la trinidad de atabaques rum-rumpi-lé. La capoeira gira en 6/8 bajo el tañido del berimbau, el maracatu retumba con el alfaia en el carnaval de Recife, y la bossa nova vuelve a plegar la samba en susurro de jazz.`,
    },
    zh: {
      short: '巴西',
      label: '巴西',
      intro: `巴西接收了约 490 万名被奴役的非洲人 —— 是被带到北美数量的十倍 —— 并因此成为半球内最深的非洲节奏蓄水池。Samba 是国家的脉搏,建立在 2/4 单元上:surdo 用低沉的一击落在下拍,tamborim 在上方切出 16 分音符的切分乐句,cuíca 摩擦鼓像声音一样讲话。巴伊亚的 candomblé 仪式至今仍在 rum-rumpi-lé 三只 atabaque 上演奏约鲁巴 toques。Capoeira 在 berimbau 弓-弦的拨叩声下以 6/8 翻滚,maracatu 在累西腓狂欢节用 alfaia 大鼓轰鸣,bossa nova 则把 samba 悄悄折叠成低声吟唱的爵士。`,
    },
    fr: {
      short: 'Brésil',
      label: 'Brésil',
      intro: `Le Brésil a reçu environ 4,9 millions d'Africains réduits en esclavage — dix fois plus que l'Amérique du Nord — et est devenu le réservoir le plus profond de rythme africain de l'hémisphère. La samba est la pulsation nationale, construite sur une cellule en 2/4 : le surdo marque le temps fort d'un coup grave, le tamborim découpe une phrase syncopée en doubles croches au-dessus, et la cuíca à friction parle comme une voix. Les cérémonies candomblé de Bahia jouent toujours des toques yoruba sur le trio d'atabaques rum-rumpi-lé. La capoeira roule en 6/8 sous le pincement du berimbau, le maracatu tonne avec l'alfaia au carnaval de Recife, et la bossa nova replie discrètement la samba en jazz murmuré.`,
    },
    hi: {
      short: 'ब्राज़ील',
      label: 'ब्राज़ील',
      intro: `ब्राज़ील ने लगभग 49 लाख दास बनाए गए अफ़्रीकियों को लिया — उत्तरी अमेरिका में लाए गए लोगों से दस गुना — और गोलार्ध का सबसे गहरा अफ़्रीकी लय-संरक्षक बन गया। Samba राष्ट्रीय धड़कन है, 2/4 की कोशिका पर रची: surdo एक गहरी थाप से downbeat को चिह्नित करता है, ऊपर tamborim 16th-नोट सिंकोपेटेड वाक्य काटता है, cuíca घर्षण-ढोल आवाज़ की तरह बोलता है। बाहिया के candomblé समारोह आज भी rum-rumpi-lé atabaque त्रयी पर योरूबा toques बजाते हैं। Capoeira berimbau की धनुष-तार झंकार के नीचे 6/8 में लुढ़कता है, maracatu रेसीफ़े के कार्निवल में alfaia बेस-ड्रम के साथ गरजता है, और bossa nova samba को धीरे से एक फुसफुसाते हुए jazz में मोड़ देता है।`,
    },
    ru: {
      short: 'Бразилия',
      label: 'Бразилия',
      intro: `Бразилия приняла около 4,9 миллиона порабощённых африканцев — в десять раз больше, чем Северная Америка — и стала глубочайшим резервуаром африканского ритма в полушарии. Самба — национальный пульс, выстроенная на ячейке 2/4: surdo отмечает сильную долю глухим ударом, tamborim сверху нарезает синкопированную фразу шестнадцатыми, а фрикционный cuíca говорит, как голос. Церемонии candomblé в Баии всё ещё играют йорубские toques на триаде atabaque (rum-rumpi-lé). Капоэйра катится в 6/8 под звон berimbau, maracatu гремит alfaia на карнавале в Ресифи, а босса-нова тихо складывает самбу в шёпот джаза.`,
    },
  },
  'andean-south-america': {
    tr: {
      short: 'Andlar',
      label: 'And Güney Amerika',
      intro: `Kolomb öncesi And müziği, iç içe çiftler halinde çalınan üflemeli çalgılar etrafında merkezlenirdi — siku panpipeleri ve quena çentikli flüt — ve perküsyon olarak wankara bas davulu ve kadınlar tarafından çalınan küçük tinya el davulu. Sömürgeleştirme sonrası huayno (senkoplu çift ölçülü şarkı-dans) Peru'dan Bolivya'ya yaylaların popüler sesi oldu; kıyı Peru'su Afro-Peru türlerini geliştirdi: festejo ve landó, sonradan Paco de Lucía'nın flamenkoya soktuğu ahşap cajón kutu davulu üzerinde. Arjantin tango ile zamba, Şili cueca'sı, Uruguay candombe (üç davullu chico-repique-piano dizilimi) bölgeyi tamamlar. Dağ müziği havadar ve sade hissedilir; kıyı müziği ise sallanır.`,
    },
    es: {
      short: 'Andes',
      label: 'Sudamérica Andina',
      intro: `La música andina precolombina giraba en torno a instrumentos de viento tocados en parejas entrelazadas — los sikus de panpipe y la quena con muesca — más la percusión del wankara (bombo grave) y la pequeña tinya (tambor de mano que tocaban las mujeres). Tras la colonización, el huayno (canción-danza sincopada en compás binario) se volvió la voz popular del altiplano, de Perú a Bolivia, mientras la costa peruana desarrollaba géneros afroperuanos: festejo y landó sobre el cajón de madera que Paco de Lucía importó después al flamenco. El tango y la zamba argentinos, la cueca chilena y el candombe uruguayo (con su trío chico-repique-piano) cierran la región. La música de montaña tiende a sentirse aireada y austera; la costa, en cambio, oscila.`,
    },
    zh: {
      short: '安第斯',
      label: '安第斯南美',
      intro: `前哥伦布时期的安第斯音乐围绕成对吹奏的乐器展开 —— siku 排箫与 quena 缺口长笛 —— 配上 wankara 大鼓与女子手持的小型 tinya 手鼓。殖民化之后,huayno(切分二拍歌舞)成为秘鲁到玻利维亚高原的流行声音,沿海秘鲁则发展出非裔秘鲁流派:festejo 与 landó,均以 cajón 木箱鼓为底 —— Paco de Lucía 后来把它带入弗拉门戈。阿根廷 tango 与 zamba、智利 cueca、乌拉圭 candombe(三鼓 chico-repique-piano 阵容)填满整个区域。山地音乐空灵而朴素,沿海音乐则摇摆。`,
    },
    fr: {
      short: 'Andes',
      label: 'Amérique du Sud andine',
      intro: `La musique andine précolombienne s'organisait autour d'instruments à vent joués en paires entrelacées — les flûtes de Pan siku et la quena à encoche — avec la percussion du wankara (grosse caisse) et de la petite tinya (tambour à main joué par les femmes). Après la colonisation, le huayno (chant-danse syncopé en mesure binaire) est devenu la voix populaire des hauts plateaux, du Pérou à la Bolivie, tandis que la côte péruvienne développait des genres afro-péruviens : festejo et landó sur le cajón en bois que Paco de Lucía importa plus tard dans le flamenco. Le tango et la zamba argentins, la cueca chilienne et le candombe uruguayen (avec son trio chico-repique-piano) complètent la région. La musique de montagne tend vers l'aérien et l'austère ; la musique côtière, elle, swingue.`,
    },
    hi: {
      short: 'एंडीज',
      label: 'एंडीयन द. अमेरिका',
      intro: `कोलंबस-पूर्व एंडीयन संगीत जोड़ी में बजने वाले फूँक-वाद्यों के इर्द-गिर्द केंद्रित था — siku पनप्राइप्स और quena नोच-वाली बाँसुरी — और पर्क्यूशन में wankara बेस-ड्रम तथा महिलाओं द्वारा बजाया जाने वाला छोटा tinya हाथ-ढोल। उपनिवेशीकरण के बाद, huayno (सिंकोपेटेड द्वि-मात्रा गीत-नृत्य) पेरू से बोलिविया तक की ऊँचाई का लोकप्रिय स्वर बना; तटीय पेरू ने अफ़्रो-पेरूवियन शैलियाँ विकसित कीं: cajón लकड़ी के बक्से-ड्रम पर festejo और landó — जिसे बाद में Paco de Lucía फ्लेमेंको में लाए। अर्जेंटीनी tango और zamba, चिली cueca, और उरुग्वे का candombe (तीन-ढोल chico-repique-piano संरचना) क्षेत्र को पूरा करते हैं। पहाड़ी संगीत हवादार और सरल लगता है; तटीय संगीत झूलता है।`,
    },
    ru: {
      short: 'Анды',
      label: 'Андская Юж. Америка',
      intro: `Доколумбова андская музыка строилась вокруг духовых инструментов, на которых играли переплетающимися парами — флейты Пана siku и зарубочная quena — с перкуссией от баса wankara и маленькой ручной tinya, на которой играли женщины. После колонизации huayno (синкопированный двухдольный песенный танец) стал популярным голосом высокогорья от Перу до Боливии, а прибрежный Перу развил афроперуанские жанры: festejo и landó на деревянном cajón, который Пако де Лусия позже привёз во фламенко. Аргентинские tango и zamba, чилийская cueca и уругвайский candombe (с трио барабанов chico-repique-piano) замыкают регион. Горная музыка ощущается воздушной и аскетичной; прибрежная — раскачивается.`,
    },
  },
  'balkans': {
    tr: {
      short: 'Balkanlar',
      label: 'Balkanlar',
      intro: `Balkanlar gezegendeki tek-sayılı ölçülerin en yoğun konsantrasyonudur. Sadece Bulgar halk müziği bile düzenli 2/4'ten 22/16'ya kadar ölçüleri belgeler; 7/8 (ruchenitsa) ve 11/16 (kopanitsa) köy halay danslarını döndürür. Osmanlı aksak kavramı — eşit olmayan 2 ve 3 hücreleri — köktedir: "bir-iki-üç-dört" saymazsın, "kısa-uzun" ya da "uzun-kısa-kısa" sayarsın. Çift kafalı bas davul tapan ile tarabuka dans müziğini sürer; Sırbistan ve Makedonya'nın Roman bando takımları bu asimetrik groove'ları öfkeli, virtüöz patlamalara çevirir. Yunan rebetiko (bouzouki üzerinde) ve Romen lăutar (keman ve cimbalom) gelenekleri aynı ritmik DNA'yı paylaşır.`,
    },
    es: {
      short: 'Balcanes',
      label: 'Balcanes',
      intro: `Los Balcanes son la concentración más densa de compases impares del planeta. Solo el folk búlgaro documenta métricas que van de un 2/4 regular a un asombroso 22/16, con 7/8 (ruchenitsa) y 11/16 (kopanitsa) hilando danzas circulares de aldea. El concepto otomano del aksak — células desiguales de 2 y 3 — está en la raíz: no cuentas "uno-y-dos-y," cuentas "corto-largo" o "largo-corto-corto." El tapan (bombo de doble parche) y la tarabuka mueven la música de baile, mientras las brass bands romaníes de Serbia y Macedonia convierten estos grooves asimétricos en estallidos virtuosos furiosos. El rebétiko griego sobre bouzouki y la tradición lăutar rumana de violín y cimbalom comparten el mismo ADN rítmico.`,
    },
    zh: {
      short: '巴尔干',
      label: '巴尔干',
      intro: `巴尔干是地球上奇数拍最密集的所在。仅保加利亚民乐就记录了从 2/4 到惊人 22/16 的拍号,7/8(ruchenitsa)和 11/16(kopanitsa)旋转着村庄圆舞。奥斯曼 aksak 概念 —— 不等的 2 与 3 单元 —— 是根:你不数"一二三四",而是数"短长"或"长短短"。tapan(双面大鼓)与 tarabuka 推动舞曲;塞尔维亚和马其顿的罗姆铜管乐队把这些不对称律动化为狂烈炫技。希腊 rebetiko(布祖基)与罗马尼亚 lăutar(小提琴-辛巴龙)传统共享同一节奏 DNA。`,
    },
    fr: {
      short: 'Balkans',
      label: 'Balkans',
      intro: `Les Balkans sont la concentration la plus dense de mesures impaires de la planète. Le folk bulgare à lui seul documente des métriques allant d'un 2/4 régulier à un stupéfiant 22/16, avec le 7/8 (ruchenitsa) et le 11/16 (kopanitsa) qui font tourner les danses circulaires de village. Le concept ottoman de l'aksak — cellules inégales de 2 et 3 — est à la racine : on ne compte pas « un-et-deux-et », on compte « court-long » ou « long-court-court ». Le tapan (grosse caisse à deux peaux) et la tarabuka portent la musique de danse, tandis que les fanfares roms de Serbie et de Macédoine transforment ces grooves asymétriques en explosions virtuoses furieuses. Le rebetiko grec au bouzouki et la tradition roumaine lăutar (violon et cymbalum) partagent le même ADN rythmique.`,
    },
    hi: {
      short: 'बाल्कन',
      label: 'बाल्कन',
      intro: `बाल्कन ग्रह पर विषम तालों का सबसे सघन समूह है। केवल बल्गेरियाई लोक संगीत ही 2/4 से लेकर चौंकाने वाले 22/16 तक के तालों को दर्ज करता है — 7/8 (ruchenitsa) और 11/16 (kopanitsa) गाँव की वृत्तीय नृत्यें घुमाते हैं। ओस्मानी aksak अवधारणा — 2 और 3 की असमान कोशिकाएँ — जड़ है: "एक-और-दो-और" नहीं गिनते, "छोटा-लंबा" या "लंबा-छोटा-छोटा" गिनते हैं। tapan (दो-शीर्ष बेस-ड्रम) और tarabuka नृत्य संगीत चलाते हैं, जबकि सर्बिया और मैसेडोनिया के रोमा ब्रास बैंड इन विषम groove को क्रोधित, चमत्कारी विस्फोटों में बदल देते हैं। ग्रीक rebetiko (बौज़ुकी पर) और रोमानियाई lăutar (वायलिन-सिंबलोम) परंपराएँ वही लय-DNA साझा करती हैं।`,
    },
    ru: {
      short: 'Балканы',
      label: 'Балканы',
      intro: `Балканы — самая плотная концентрация нечётных размеров на планете. Один только болгарский фольк документирует размеры от ровного 2/4 до ошеломляющего 22/16; 7/8 (ruchenitsa) и 11/16 (kopanitsa) вращают деревенские круговые танцы. Османское понятие aksak — неравные ячейки из 2 и 3 — в корне: ты считаешь не "раз-и-два-и", а "коротко-длинно" или "длинно-коротко-коротко". Tapan (двусторонний бас-барабан) и tarabuka двигают танцевальную музыку, а ромские духовые оркестры из Сербии и Македонии превращают эти асимметричные грувы в яростные виртуозные взрывы. Греческое rebetiko на бузуки и румынская традиция lăutar (скрипка-цимбалы) разделяют ту же ритмическую ДНК.`,
    },
  },
  'iberia-flamenco': {
    tr: {
      short: 'İberya',
      label: 'İberya / Flamenko',
      intro: `Flamenkonun kalbi compás'tır — 3, 6, 8, 10 ve 12'de düşen vurgularla 12 vuruşluk bir döngü; aynı anda hem 3/4 hem 6/8 olarak duyulabilir. Bütün bedeni gerektiren bir ritmik histir: palmas (iki tonda perküsif el çırpmalar — sordas ve claras), zapateado (dansçının çekiçli topuk-burun karşı sesi) ve cajón (Paco de Lucía'nın 1977'de flamenkoya soktuğu ve tüm geleneği yeniden bağlayan Peru ahşap kutusu). Palolar — bulerías, soleá, alegrías, siguiriya — her biri kendi compás'ı ve duygusal kayıtlarıyla. Endülüs dışında Galiçya ve Asturya gaita gayda gelenekleri daha eski bir Kelt-Atlantik nabzı taşır; Bask txalaparta tek bir tahta üstündeki iki çalıcıdır.`,
    },
    es: {
      short: 'Iberia',
      label: 'Iberia / Flamenco',
      intro: `El corazón del flamenco es el compás — un ciclo de 12 pulsos con acentos en 3, 6, 8, 10 y 12 que puede sonar simultáneamente en 3/4 y 6/8. Es una sensación rítmica que pide todo el cuerpo: palmas (palmas percutivas en dos tonos — sordas y claras), zapateado (el contrapunto de tacón y punta de la bailaora) y cajón (la caja peruana que Paco de Lucía introdujo en el flamenco en 1977 y que recableó la tradición entera). Los palos — bulerías, soleá, alegrías, siguiriya — cada uno con su compás y registro emocional. Fuera de Andalucía, las tradiciones gallegas y asturianas de gaita llevan un pulso celta-atlántico más antiguo, y la txalaparta vasca son dos tocadores sobre una sola tabla de madera.`,
    },
    zh: {
      short: '伊比利亚',
      label: '伊比利亚 / 弗拉门戈',
      intro: `弗拉门戈的核心是 compás —— 一个 12 拍循环,重音落在 3、6、8、10、12 上,可以同时听作 3/4 与 6/8。这是一种需要全身的节奏感觉:palmas(两种音色的击掌 — sordas 与 claras)、zapateado(舞者跟脚尖锤击的对位)与 cajón(秘鲁木箱,1977 年由 Paco de Lucía 引入弗拉门戈,重塑了整个传统)。palos —— bulerías、soleá、alegrías、siguiriya —— 各有自己的 compás 与情感色域。安达卢西亚之外,加利西亚与阿斯图里亚斯的 gaita 风笛传统承载更古老的凯尔特-大西洋脉搏,巴斯克 txalaparta 是两人合敲一块木板。`,
    },
    fr: {
      short: 'Ibérie',
      label: 'Ibérie / Flamenco',
      intro: `Le cœur du flamenco est le compás — un cycle de 12 temps avec des accents tombant sur 3, 6, 8, 10 et 12 qui peut sonner simultanément en 3/4 et en 6/8. C'est une sensation rythmique qui exige tout le corps : palmas (frappes de mains percussives en deux tons, sordas et claras), zapateado (le contrepoint martelé talon-pointe de la danseuse) et cajón (la caisse péruvienne en bois que Paco de Lucía a introduite dans le flamenco en 1977 et qui a recâblé toute la tradition). Les palos — bulerías, soleá, alegrías, siguiriya — ont chacun leur compás et leur registre émotionnel. Hors d'Andalousie, les traditions de cornemuses gaita galiciennes et asturiennes portent une pulsation celto-atlantique plus ancienne, et la txalaparta basque, c'est deux joueurs sur une même planche de bois.`,
    },
    hi: {
      short: 'इबेरिया',
      label: 'इबेरिया / फ्लेमेंको',
      intro: `फ़्लेमेंको का हृदय compás है — 12-मात्रा का चक्र जिसमें वज़न 3, 6, 8, 10 और 12 पर पड़ते हैं और जो एक साथ 3/4 तथा 6/8 दोनों में सुनाई दे सकता है। यह पूरा शरीर माँगने वाली लय-अनुभूति है: palmas (दो स्वर-छायाओं में टक्करदार ताली — sordas और claras), zapateado (नर्तकी का एड़ी-पंजे का काउंटरपॉइंट), और cajón (पेरूवियन लकड़ी का बक्सा जिसे Paco de Lucía ने 1977 में फ़्लेमेंको में जोड़ा और पूरी परंपरा को फिर से सजा दिया)। palos — bulerías, soleá, alegrías, siguiriya — हर एक का अपना compás और भावनात्मक रंग होता है। अंदलूसिया के बाहर गालिशियन तथा एस्टुरियन gaita बैगपाइप परंपराएँ एक पुरानी सेल्टिक-अटलांटिक धड़कन रखती हैं, और बास्क txalaparta में दो खिलाड़ी एक ही लकड़ी के तख़्ते पर बजाते हैं।`,
    },
    ru: {
      short: 'Иберия',
      label: 'Иберия / Фламенко',
      intro: `Сердце фламенко — это compás, цикл из 12 долей с акцентами на 3, 6, 8, 10 и 12, способный звучать одновременно в 3/4 и в 6/8. Это ритмическое ощущение требует всего тела: palmas (перкуссивные хлопки в двух тонах — sordas и claras), zapateado (молотящий каблук-носок контрапункт танцовщицы) и cajón (перуанский деревянный ящик, который Paco de Lucía привёз во фламенко в 1977-м и перепрошил всю традицию). Palos — bulerías, soleá, alegrías, siguiriya — у каждого свой compás и эмоциональный регистр. Вне Андалусии галисийские и астурийские традиции волынки gaita несут более древний кельтско-атлантический пульс, а баскская txalaparta — это двое игроков на одной деревянной доске.`,
    },
  },
  'celtic-europe': {
    tr: {
      short: 'Kelt',
      label: 'Kelt / Avrupa',
      intro: `İrlanda geleneksel müziği parça türüne göre örgütlenir — reel (4/4, sürükleyici), jig (6/8, ezgili), slip jig (9/8, yuvarlanan), hornpipe (noktalı 4/4, swing'li) — ve her biri dansçılar için kendi bedensel hissini taşır. Bodhrán çerçeve davulu, 1960'larda Seán Ó Riada tarafından kırsal yenilikten konser çalgısına yükseltildi; ahşap bir tipper ve perde büken arka el kullanır. İskoç pipe band'leri snare ve bas davulu Highland gaydaları altında katmanlar; İskandinav polskaları (polka değil) ikinci vuruşun diğerlerinden kısa olduğu eşit olmayan üçlü ölçüde sallanır; klezmer ise karakteristik bir 8/8 vurgu örüntüsü üzerinde freylekhs ve bulgar dokur. Ortak iplik: salonlar için değil odalardaki dansçılar için yapılan müzik.`,
    },
    es: {
      short: 'Celta',
      label: 'Celta / Europa',
      intro: `La música tradicional irlandesa se organiza por tipo de tonada — reel (4/4, lanzado), jig (6/8, cantarín), slip jig (9/8, rodante), hornpipe (4/4 con puntillo, balanceado) — y cada uno carga su propio sentir corporal para los bailarines. El bodhrán (tambor de marco), promovido de novedad rural a instrumento de concierto por Seán Ó Riada en los 60, usa un tipper de madera y una mano trasera que dobla el tono. Las pipe bands escocesas apilan cajas y bombo bajo las gaitas Highland; las polskas escandinavas (no polkas) oscilan en un compás ternario desigual donde el segundo pulso es más corto que los demás; y el klezmer teje freylekhs y bulgars sobre un patrón característico de acentos en 8/8. El hilo común: música hecha para bailarines en habitaciones, no para salas de concierto.`,
    },
    zh: {
      short: '凯尔特',
      label: '凯尔特 / 欧洲',
      intro: `爱尔兰传统音乐按曲调类型组织 —— reel(4/4,推进)、jig(6/8,起伏)、slip jig(9/8,翻滚)、hornpipe(附点 4/4,带摇摆)—— 每一种都有自己对舞者身体的感觉。bodhrán 框鼓由 Seán Ó Riada 在 1960 年代从乡村新奇物升格为音乐会乐器,使用木制 tipper 与可弯曲音高的反手。苏格兰风笛乐队在 Highland 风笛之下叠加军鼓与大鼓;斯堪的纳维亚 polskas(不是 polkas)在不均匀的三拍中摇摆,第二拍比其他拍更短;klezmer 在特征性的 8/8 重音模式上编织 freylekhs 与 bulgars。共同主线是:为房间里的舞者而非音乐厅而作的音乐。`,
    },
    fr: {
      short: 'Celte',
      label: 'Celte / Europe',
      intro: `La musique traditionnelle irlandaise s'organise par type d'air — reel (4/4, lancé), jig (6/8, chantant), slip jig (9/8, roulant), hornpipe (4/4 pointé, swingué) — et chacun porte sa propre sensation corporelle pour les danseurs. Le bodhrán, tambour sur cadre, promu par Seán Ó Riada dans les années 60 de curiosité rurale à instrument de concert, utilise un tipper en bois et une main arrière qui plie la hauteur. Les pipe bands écossais empilent caisses claires et grosse caisse sous les Highland pipes ; les polskas scandinaves (et non polkas) swinguent dans une mesure ternaire inégale où le deuxième temps est plus court que les autres ; le klezmer tisse freylekhs et bulgars sur un motif d'accents en 8/8 caractéristique. Le fil commun : une musique faite pour des danseurs dans des pièces — pas pour des salles de concert.`,
    },
    hi: {
      short: 'सेल्टिक',
      label: 'सेल्टिक / यूरोप',
      intro: `आयरिश पारंपरिक संगीत धुन-प्रकार के अनुसार सजता है — reel (4/4, ज़ोरदार), jig (6/8, हिचकोले लेता), slip jig (9/8, लुढ़कता), hornpipe (बिंदुदार 4/4, झूलता) — और हर एक नर्तकों के लिए अपनी देह-अनुभूति लाता है। bodhrán फ्रेम-ड्रम, जिसे Seán Ó Riada ने 1960 के दशक में ग्रामीण नवीनता से कंसर्ट वाद्य तक उठाया, लकड़ी का tipper और स्वर मोड़ने वाली पीछे की हथेली प्रयोग करता है। स्कॉटिश पाइप-बैंड Highland पाइप्स के नीचे स्नेयर और बेस-ड्रम परतें बिछाते हैं; स्कैंडिनेवियाई polskas (polkas नहीं) एक असमान त्रि-मात्रा में झूलते हैं जिसमें दूसरी मात्रा अन्यों से छोटी होती है; और klezmer एक विशिष्ट 8/8 वज़न-पैटर्न पर freylekhs और bulgars बुनता है। आम सूत्र: कक्षों में नर्तकों के लिए बना संगीत — कंसर्ट हॉल के लिए नहीं।`,
    },
    ru: {
      short: 'Кельты',
      label: 'Кельты / Европа',
      intro: `Ирландская традиционная музыка организована по типу мелодии — reel (4/4, гонкий), jig (6/8, напевный), slip jig (9/8, катящийся), hornpipe (пунктирный 4/4, со свингом) — и каждый несёт своё телесное ощущение для танцоров. Рамочный bodhrán, поднятый Шоном О Риадой в 1960-х из деревенской диковинки до концертного инструмента, играют деревянной палочкой tipper и тыловой ладонью, гнущей высоту звука. Шотландские pipe-bands наслаивают малые и бас-барабаны под Highland pipes; скандинавские polskas (не polkas) свингуют в неровном трёхдольном размере, где вторая доля короче остальных; клезмер плетёт freylekhs и bulgars поверх характерного акцентного рисунка 8/8. Общая нить: музыка для танцоров в комнатах, а не для концертных залов.`,
    },
  },
  'electronic-western': {
    tr: {
      short: 'Elektronik',
      label: 'Elektronik / Batı',
      intro: `Modern Batı vuruşu kademeli olarak inşa edildi: James Brown'un 1965'te "The One"a kilitli düz 16'lıklara geçişi funk'a ızgarasını verdi; Clyde Stubblefield'ın "Funky Drummer"ı ve Winstons'ın "Amen" break'i tarihin en çok örneklenen ölçüleri oldu. Roland TR-808 (1980) ve TR-909 (1983) bu örüntüleri hip-hop, house ve techno'ya kabloladı — 808'in sub-kick'i modern pop'un bas tarafıdır; 909'un sıkı kick-and-hat örüntüsü techno'nun motorudur. House, techno, jungle, drum & bass, trap ve footwork — hepsi bu iki makinenin, Dilla'nın ızgara dışı hissinin ve disco'nun motorik krautrock'tan miras aldığı four-on-the-floor kick'in etrafında döner. Bu, küresel halk dili olarak sentezlenmiş ritimdir.`,
    },
    es: {
      short: 'Electrónica',
      label: 'Electrónica / Occidental',
      intro: `El beat occidental moderno se construyó por capas: el viraje de James Brown en 1965 a semicorcheas rectas trabadas en "The One" le dio al funk su grilla; el "Funky Drummer" de Clyde Stubblefield y el break "Amen" de los Winstons se volvieron los compases más sampleados de la historia. La Roland TR-808 (1980) y la TR-909 (1983) cablearon esos patrones al hip-hop, el house y el techno — el sub-kick del 808 es el bajo del pop moderno, y el patrón de kick y hat del 909 es el motor del techno. House, techno, jungle, drum & bass, trap y footwork orbitan estas dos máquinas, el feel fuera-de-grilla de Dilla, y el bombo en cuatro que el disco heredó del krautrock motorik. Esto es ritmo sintetizado como lengua vernácula global.`,
    },
    zh: {
      short: '电子',
      label: '电子 / 西方',
      intro: `现代西方节拍是阶段性建成的:1965 年 James Brown 转向锁定在"The One"上的直 16 分音符,赋予 funk 以网格;Clyde Stubblefield 的 "Funky Drummer" 与 Winstons 的 "Amen" break 成为史上被采样最多的小节。Roland TR-808(1980)与 TR-909(1983)把这些模式硬接入 hip-hop、house 与 techno —— 808 的 sub-kick 是现代流行乐的低端,909 紧凑的 kick 与 hat 模式是 techno 的引擎。House、techno、jungle、drum & bass、trap 与 footwork 都围绕着这两台机器、Dilla 偏离网格的律动,以及 disco 从 motorik krautrock 继承的四拍铛击运转。这就是作为全球俗语的合成节奏。`,
    },
    fr: {
      short: 'Électro',
      label: 'Électronique / Occidental',
      intro: `Le beat occidental moderne s'est construit par étapes : le virage de James Brown en 1965 vers des doubles croches droites verrouillées sur "The One" a donné au funk sa grille ; le "Funky Drummer" de Clyde Stubblefield et le break "Amen" des Winstons sont devenus les mesures les plus samplées de l'histoire. Les Roland TR-808 (1980) et TR-909 (1983) ont câblé ces motifs dans le hip-hop, la house et la techno — le sub-kick de la 808 est le grave de la pop moderne, et le motif kick-and-hat serré de la 909 est le moteur de la techno. House, techno, jungle, drum & bass, trap et footwork orbitent autour de ces deux machines, du feel hors-grille de Dilla, et du four-on-the-floor que le disco a hérité du krautrock motorik. C'est le rythme synthétisé devenu langue vernaculaire mondiale.`,
    },
    hi: {
      short: 'इलेक्ट्रॉनिक',
      label: 'इलेक्ट्रॉनिक / पश्चिमी',
      intro: `आधुनिक पश्चिमी बीट क्रमशः बनी: 1965 में James Brown का "The One" पर सीधे 16th-नोट्स पर लॉक करना funk को उसकी ग्रिड दे गया; Clyde Stubblefield का "Funky Drummer" और Winstons का "Amen" ब्रेक इतिहास में सबसे ज़्यादा सैंपल किए गए बार बने। Roland TR-808 (1980) और TR-909 (1983) ने इन पैटर्न्स को hip-hop, house और techno में हार्डवायर कर दिया — 808 का sub-kick आधुनिक पॉप का नीचे का छोर है, और 909 का सख़्त kick-and-hat पैटर्न techno का इंजन। house, techno, jungle, drum & bass, trap और footwork — सब इन्हीं दो मशीनों, Dilla के off-grid feel, और motorik krautrock से disco को विरासत में मिली four-on-the-floor kick के इर्द-गिर्द घूमते हैं। यह सिंथेसाइज़्ड लय का वैश्विक देशज रूप है।`,
    },
    ru: {
      short: 'Электро',
      label: 'Электронная / Западная',
      intro: `Современный западный бит строился поэтапно: в 1965-м Джеймс Браун переключился на ровные шестнадцатые, запертые на "The One", и дал funk его сетку; "Funky Drummer" Клайда Стаббл­филда и "Amen" брейк Winstons стали самыми сэмплированными тактами в истории. Roland TR-808 (1980) и TR-909 (1983) впаяли эти паттерны в hip-hop, house и techno — sub-kick 808-й — это низ современной попсы, а тугой kick-and-hat паттерн 909-й — двигатель техно. House, techno, jungle, drum & bass, trap и footwork — всё крутится вокруг этих двух машин, "off-grid" фила Диллы и four-on-the-floor, который disco унаследовало от motorik krautrock. Это синтезированный ритм как глобальный разговорный язык.`,
    },
  },
  'exercise': {
    tr: {
      short: 'Egzersizler',
      label: 'Polyritmi Egzersizleri',
      intro: `3:2 ve 4:3 gibi yaygın oranları içselleştirmek için faydalı polyritmi pratik desenleri.`,
    },
    es: {
      short: 'Ejercicios',
      label: 'Ejercicios de Polirritmia',
      intro: `Patrones de práctica de polirritmia — útiles para internalizar relaciones comunes como 3:2 y 4:3.`,
    },
    zh: {
      short: '练习',
      label: '复合节奏练习',
      intro: `复合节奏练习模式 —— 适合用来内化 3:2 与 4:3 等常见比例。`,
    },
    fr: {
      short: 'Exercices',
      label: 'Exercices de Polyrythmie',
      intro: `Motifs d'entraînement à la polyrythmie — utiles pour intérioriser les rapports courants comme 3:2 et 4:3.`,
    },
    hi: {
      short: 'अभ्यास',
      label: 'पॉलीरिदम अभ्यास',
      intro: `पॉलीरिदम अभ्यास पैटर्न — 3:2 और 4:3 जैसे सामान्य अनुपातों को आत्मसात करने के लिए उपयोगी।`,
    },
    ru: {
      short: 'Упражнения',
      label: 'Полиритм. упражнения',
      intro: `Упражнения по полиритмии — полезны для интернализации распространённых соотношений вроде 3:2 и 4:3.`,
    },
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

/** Resolve a region's user-facing labels + intro for a given locale.
 *  Falls back to the English values per-field — a locale can supply
 *  short + label without an intro and the intro renders English. */
export function localizedRegion(
  region: RegionMeta,
  lang: Lang,
): { short: string; label: string; intro: string } {
  const en = { short: region.short, label: region.label, intro: region.intro };
  if (lang === 'en') return en;
  const o = REGION_I18N[region.id]?.[lang];
  if (!o) return en;
  return {
    short: o.short ?? en.short,
    label: o.label ?? en.label,
    intro: o.intro ?? en.intro,
  };
}
