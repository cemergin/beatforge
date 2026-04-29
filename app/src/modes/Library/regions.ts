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
// `intro` translates only into TR + ES (BeatForge's launch locales
// outside English). The other 4 locales (ZH/FR/HI/RU) intentionally
// fall through to the EN intro — translating 16 long musicology
// paragraphs into every locale is a per-PR contribution flow, not
// infra-blocking. Native speakers welcome to add their locale's
// intro in regional PRs.
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
    zh: { short: '土耳其', label: '土耳其 / 奥斯曼' },
    fr: { short: 'Turquie', label: 'Turquie / Ottoman' },
    hi: { short: 'तुर्की', label: 'तुर्की / ओस्मानी' },
    ru: { short: 'Турция', label: 'Турция / Османы' },
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
    zh: { short: 'SWANA', label: '阿拉伯 / SWANA' },
    fr: { short: 'SWANA', label: 'Arabe / SWANA' },
    hi: { short: 'SWANA', label: 'अरब / SWANA' },
    ru: { short: 'SWANA', label: 'Арабский / SWANA' },
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
    zh: { short: '波斯', label: '波斯' },
    fr: { short: 'Perse', label: 'Perse' },
    hi: { short: 'पर्शिया', label: 'पर्शिया' },
    ru: { short: 'Персия', label: 'Персия' },
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
    zh: { short: '印度', label: '印度' },
    fr: { short: 'Inde', label: 'Inde' },
    hi: { short: 'भारत', label: 'भारत' },
    ru: { short: 'Индия', label: 'Индия' },
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
    zh: { short: '甘美兰', label: '甘美兰 / 东南亚' },
    fr: { short: 'Gamelan', label: 'Gamelan / Asie du SE' },
    hi: { short: 'गमेलान', label: 'गमेलान / द.पू. एशिया' },
    ru: { short: 'Гамелан', label: 'Гамелан / ЮВ Азия' },
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
    zh: { short: '东亚', label: '东亚' },
    fr: { short: 'Asie de l\'E.', label: 'Asie de l\'Est' },
    hi: { short: 'पू. एशिया', label: 'पूर्वी एशिया' },
    ru: { short: 'В. Азия', label: 'Восточная Азия' },
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
    zh: { short: '西非', label: '西非' },
    fr: { short: 'Afr. de l\'O.', label: 'Afrique de l\'Ouest' },
    hi: { short: 'प. अफ्रीका', label: 'पश्चिम अफ्रीका' },
    ru: { short: 'З. Африка', label: 'Западная Африка' },
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
    zh: { short: '古巴', label: '古巴 / 非洲-加勒比' },
    fr: { short: 'Cuba', label: 'Cuba / Afro-Caraïbe' },
    hi: { short: 'क्यूबा', label: 'क्यूबा / अफ़्रो-कैरेबियन' },
    ru: { short: 'Куба', label: 'Куба / Афро-Карибы' },
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
    zh: { short: '加勒比', label: '加勒比' },
    fr: { short: 'Caraïbe', label: 'Caraïbes' },
    hi: { short: 'कैरेबियन', label: 'कैरेबियन' },
    ru: { short: 'Карибы', label: 'Карибы' },
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
    zh: { short: '巴西', label: '巴西' },
    fr: { short: 'Brésil', label: 'Brésil' },
    hi: { short: 'ब्राज़ील', label: 'ब्राज़ील' },
    ru: { short: 'Бразилия', label: 'Бразилия' },
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
    zh: { short: '安第斯', label: '安第斯南美' },
    fr: { short: 'Andes', label: 'Amérique du Sud andine' },
    hi: { short: 'एंडीज', label: 'एंडीयन द. अमेरिका' },
    ru: { short: 'Анды', label: 'Андская Юж. Америка' },
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
    zh: { short: '巴尔干', label: '巴尔干' },
    fr: { short: 'Balkans', label: 'Balkans' },
    hi: { short: 'बाल्कन', label: 'बाल्कन' },
    ru: { short: 'Балканы', label: 'Балканы' },
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
    zh: { short: '伊比利亚', label: '伊比利亚 / 弗拉门戈' },
    fr: { short: 'Ibérie', label: 'Ibérie / Flamenco' },
    hi: { short: 'इबेरिया', label: 'इबेरिया / फ्लेमेंको' },
    ru: { short: 'Иберия', label: 'Иберия / Фламенко' },
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
    zh: { short: '凯尔特', label: '凯尔特 / 欧洲' },
    fr: { short: 'Celte', label: 'Celte / Europe' },
    hi: { short: 'सेल्टिक', label: 'सेल्टिक / यूरोप' },
    ru: { short: 'Кельты', label: 'Кельты / Европа' },
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
    zh: { short: '电子', label: '电子 / 西方' },
    fr: { short: 'Électro', label: 'Électronique / Occidental' },
    hi: { short: 'इलेक्ट्रॉनिक', label: 'इलेक्ट्रॉनिक / पश्चिमी' },
    ru: { short: 'Электро', label: 'Электронная / Западная' },
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
