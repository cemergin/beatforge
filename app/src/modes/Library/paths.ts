// Curated starter paths. Each path lists pattern IDs in a reading order;
// Library runtime drops any ID that's not in the seed so the build stays
// green if a pattern ever gets renamed.
//
// These paths are designed to surface *connections* you wouldn't otherwise
// see: the same rhythmic DNA across continents, a genre's family tree,
// a meter's siblings. Clicking a path opens it inline in the Library
// (see Library.tsx).
//
// Translation policy:
//   - English fields are authoritative. The optional `i18n` map carries
//     per-locale overrides; missing entries fall back to EN at render
//     time via `localizedPath(path, lang)`.
//   - Pattern + tradition proper nouns (Karşılama, Bembé, Dilla, etc.)
//     stay in their original script across all locales.
//   - Music-tech terms (groove, swing, drill, phonk, BPM) stay English
//     where the loanword is the standard usage.

import type { Lang } from '../../i18n';

type LocaleOverrides = Partial<Record<Exclude<Lang, 'en'>, {
  title?: string;
  subtitle?: string;
  context?: string;
}>>;

export interface StarterPath {
  id: string;
  title: string;
  subtitle: string;
  context: string;
  i18n?: LocaleOverrides;
  patternIds: string[];
}

/** Resolve a path's user-facing fields against the active locale. EN
 *  is authoritative; any missing localized field falls back to EN. */
export function localizedPath(
  path: StarterPath,
  lang: Lang,
): { title: string; subtitle: string; context: string } {
  if (lang === 'en') {
    return { title: path.title, subtitle: path.subtitle, context: path.context };
  }
  const o = path.i18n?.[lang];
  return {
    title: o?.title ?? path.title,
    subtitle: o?.subtitle ?? path.subtitle,
    context: o?.context ?? path.context,
  };
}

export const STARTER_PATHS: StarterPath[] = [
  // ── Foundations ────────────────────────────────────────────────────
  {
    id: 'beginners-world-tour',
    title: "Beginner's World Tour",
    subtitle: 'One friendly rhythm from ten traditions',
    context:
      'A gentle loop around the globe. Each stop is a beginner-friendly entry into a tradition — feel it once, then branch out to the region that speaks loudest.',
    i18n: {
      tr: {
        title: 'Yeni Başlayanlar İçin Dünya Turu',
        subtitle: 'On gelenekten birer dost ritim',
        context: 'Yeryüzünde nazik bir tur. Her durak bir geleneğe yeni başlayanlar için açılan kapıdır — bir kez hisset, sonra sana en çok seslenen bölgeye dal.',
      },
      es: {
        title: 'Tour Mundial para Principiantes',
        subtitle: 'Un ritmo amable de diez tradiciones',
        context: 'Una vuelta suave al globo. Cada parada es una entrada amistosa a una tradición — siéntelo una vez y luego ramifícate hacia la región que más te llame.',
      },
      zh: {
        title: '新手世界之旅',
        subtitle: '十个传统中各取一个友好的节奏',
        context: '环游地球的轻松一圈。每一站都是某种传统的入门门户 —— 先感受一次,再深入最打动你的那个地区。',
      },
      fr: {
        title: 'Tour du Monde pour Débutants',
        subtitle: 'Un rythme accessible de dix traditions',
        context: 'Un tour du monde en douceur. Chaque étape est une porte d\'entrée vers une tradition — ressens-le une fois, puis bifurque vers la région qui parle le plus fort.',
      },
      hi: {
        title: 'शुरुआती की विश्व यात्रा',
        subtitle: 'दस परंपराओं से एक-एक सुगम लय',
        context: 'पृथ्वी की एक सौम्य परिक्रमा। हर पड़ाव किसी परंपरा का सरल परिचय है — एक बार महसूस करें, फिर जो क्षेत्र सबसे ज़ोर से बुलाए, उधर मुड़ें।',
      },
      ru: {
        title: 'Мировой тур для начинающих',
        subtitle: 'По одному дружелюбному ритму из десяти традиций',
        context: 'Мягкий круг по планете. Каждая остановка — лёгкий вход в традицию: почувствуй один раз и отправляйся в тот регион, который зовёт громче всего.',
      },
    },
    patternIds: [
      'son-clave', 'maqsoum', 'keherwa', 'fanga', 'baiao',
      'reggaeton-dembow', 'tangos-flamenco', 'irish-reel',
      'duyek', 'boom-bap',
    ],
  },
  {
    id: 'meet-the-meters',
    title: 'Meet the Meters',
    subtitle: 'Ten time signatures, one at a time',
    context:
      "4/4 is one meter among many. Each pattern here lives in a different time — 2/4, 3/4, 4/4, 5/8, 6/8, 7/8, 8/8, 9/8, 11/8, 12/8 — so you can feel what 'odd' actually means.",
    i18n: {
      tr: {
        title: 'Ölçülerle Tanış',
        subtitle: 'On farklı ölçü, teker teker',
        context: '4/4 birçok ölçüden sadece biridir. Buradaki her desen farklı bir zamanda yaşar — 2/4, 3/4, 4/4, 5/8, 6/8, 7/8, 8/8, 9/8, 11/8, 12/8 — böylece "tek sayılı" ölçünün ne demek olduğunu hissedebilirsin.',
      },
      es: {
        title: 'Conoce los Compases',
        subtitle: 'Diez compases, uno a uno',
        context: '4/4 es un compás entre muchos. Cada patrón aquí vive en un tiempo distinto — 2/4, 3/4, 4/4, 5/8, 6/8, 7/8, 8/8, 9/8, 11/8, 12/8 — para que sientas lo que realmente significa "compás impar".',
      },
      zh: {
        title: '认识拍号',
        subtitle: '十种拍号,逐一感受',
        context: '4/4 只是众多拍号之一。这里的每个图案都活在不同的时间里 —— 2/4、3/4、4/4、5/8、6/8、7/8、8/8、9/8、11/8、12/8 —— 你才能真正感受"奇数拍"到底是什么意思。',
      },
      fr: {
        title: 'Découvre les Mesures',
        subtitle: 'Dix mesures, une par une',
        context: '4/4 n\'est qu\'une mesure parmi d\'autres. Chaque motif ici vit dans un temps différent — 2/4, 3/4, 4/4, 5/8, 6/8, 7/8, 8/8, 9/8, 11/8, 12/8 — pour que tu sentes ce que "mesure impaire" veut vraiment dire.',
      },
      hi: {
        title: 'तालों से मिलें',
        subtitle: 'दस ताल, एक-एक करके',
        context: '4/4 केवल कई ताल में से एक है। यहाँ हर पैटर्न अलग-अलग समय में रहता है — 2/4, 3/4, 4/4, 5/8, 6/8, 7/8, 8/8, 9/8, 11/8, 12/8 — ताकि आप महसूस कर सकें कि "विषम ताल" का सच्चा अर्थ क्या है।',
      },
      ru: {
        title: 'Знакомство с размерами',
        subtitle: 'Десять размеров, по одному',
        context: '4/4 — лишь один из размеров среди многих. Каждый паттерн здесь живёт в своём времени — 2/4, 3/4, 4/4, 5/8, 6/8, 7/8, 8/8, 9/8, 11/8, 12/8 — чтобы ты по-настоящему почувствовал, что значит "нечётный".',
      },
    },
    patternIds: [
      'son-clave', 'jig', 'turk-aksagi', 'bembe', 'horon',
      'duyek', 'karsilama', 'kopanitsa', 'samba-enredo',
      'curcuna',
    ],
  },

  // ── Regional 101 paths ────────────────────────────────────────────
  {
    id: 'turkish-usul-101',
    title: 'Turkish Usul 101',
    subtitle: 'Five steps through Ottoman time',
    context:
      'Ottoman classical and folk traditions organize time into usul — asymmetric cycles named for their shape. Düyek is even ground; Türk Aksağı limps in 5; Karşılama skips in 9/8 (2+2+2+3); Curcuna doubles that skip into 10. Zeybek is the heaviest — a warrior\'s walk.',
    i18n: {
      tr: {
        title: 'Türk Usulü 101',
        subtitle: 'Osmanlı zamanına beş adım',
        context: 'Osmanlı klasik ve halk gelenekleri zamanı usule göre düzenler — şekilleriyle adlandırılan asimetrik döngüler. Düyek düz zemindir; Türk Aksağı 5\'te aksar; Karşılama 9/8\'de (2+2+2+3) atlar; Curcuna o atlamayı 10\'a katlar. Zeybek en ağırıdır — bir savaşçı yürüyüşü.',
      },
      es: {
        title: 'Usul Turco 101',
        subtitle: 'Cinco pasos por el tiempo otomano',
        context: 'Las tradiciones clásicas y folclóricas otomanas organizan el tiempo en usul — ciclos asimétricos nombrados por su forma. Düyek es terreno parejo; Türk Aksağı cojea en 5; Karşılama salta en 9/8 (2+2+2+3); Curcuna duplica ese salto en 10. Zeybek es el más pesado — el paso de un guerrero.',
      },
      zh: {
        title: '土耳其乌苏尔 101',
        subtitle: '走进奥斯曼时间的五步',
        context: '奥斯曼古典与民间传统将时间组织为乌苏尔（usul）—— 以形状命名的不对称循环。Düyek 是平稳基底;Türk Aksağı 在 5 拍中跛行;Karşılama 在 9/8（2+2+2+3）中跳跃;Curcuna 把那次跳跃倍增到 10。Zeybek 最沉重 —— 像一位战士的步伐。',
      },
      fr: {
        title: 'Usul Turc 101',
        subtitle: 'Cinq pas dans le temps ottoman',
        context: 'Les traditions classiques et folkloriques ottomanes organisent le temps en usul — des cycles asymétriques nommés d\'après leur forme. Düyek est un sol égal ; Türk Aksağı boite en 5 ; Karşılama saute en 9/8 (2+2+2+3) ; Curcuna double ce saut jusqu\'à 10. Zeybek est le plus lourd — le pas d\'un guerrier.',
      },
      hi: {
        title: 'तुर्की उसूल 101',
        subtitle: 'ओस्मानी समय में पाँच कदम',
        context: 'ओस्मानी शास्त्रीय और लोक परंपराएँ समय को उसूल में बाँधती हैं — अपनी आकृति से नामित विषम चक्र। Düyek समतल ज़मीन है; Türk Aksağı 5 में लंगड़ाता है; Karşılama 9/8 (2+2+2+3) में छलाँग लगाता है; Curcuna उस छलाँग को 10 तक दुगना करता है। Zeybek सबसे भारी है — एक योद्धा की चाल।',
      },
      ru: {
        title: 'Турецкий усуль 101',
        subtitle: 'Пять шагов сквозь османское время',
        context: 'Османские классические и народные традиции организуют время через усуль — асимметричные циклы, названные по форме. Düyek — ровная почва; Türk Aksağı хромает на 5; Karşılama прыгает в 9/8 (2+2+2+3); Curcuna удваивает этот прыжок до 10. Zeybek — тяжелейший: походка воина.',
      },
    },
    patternIds: ['duyek', 'turk-aksagi', 'karsilama', 'curcuna', 'zeybek'],
  },
  {
    id: 'indian-tal-basics',
    title: 'Indian Tal Basics',
    subtitle: 'Five tals that map the Hindustani core',
    context:
      'Hindustani music organises time into tal — cycles of beats with internal accent structure (tali = clap, khali = wave). These five cover 6, 7, 8, 10, and 16 beats: the repertoire base for classical tabla study.',
    i18n: {
      tr: {
        title: 'Hint Tal Temelleri',
        subtitle: 'Hindustani çekirdeğini haritalayan beş tal',
        context: 'Hindustani müziği zamanı tale göre örer — iç vurgu yapısı olan vuruş döngüleri (tali = el çırpma, khali = dalga). Bu beş tal 6, 7, 8, 10 ve 16 vuruşu kapsar: klasik tabla eğitiminin repertuvar tabanıdır.',
      },
      es: {
        title: 'Bases del Tal Indio',
        subtitle: 'Cinco tals que mapean el núcleo hindustaní',
        context: 'La música hindustaní organiza el tiempo en tal — ciclos de pulsos con estructura interna de acentos (tali = palma, khali = onda). Estos cinco cubren 6, 7, 8, 10 y 16 pulsos: la base del repertorio para el estudio clásico de tabla.',
      },
      zh: {
        title: '印度塔拉基础',
        subtitle: '勾勒兴都斯坦核心的五个塔拉',
        context: '兴都斯坦音乐以塔拉（tal）组织时间 —— 带有内部重音结构的拍子循环（tali = 拍掌,khali = 挥手）。这五个塔拉涵盖 6、7、8、10、16 拍:古典塔布拉学习的曲目基石。',
      },
      fr: {
        title: 'Bases du Tal Indien',
        subtitle: 'Cinq tals qui cartographient le noyau hindoustani',
        context: 'La musique hindoustanie organise le temps en tal — des cycles de battements avec une structure d\'accents interne (tali = battement de mains, khali = vague). Ces cinq couvrent 6, 7, 8, 10 et 16 temps : la base du répertoire de l\'étude classique du tabla.',
      },
      hi: {
        title: 'भारतीय ताल — मूल बातें',
        subtitle: 'हिंदुस्तानी सार को रेखांकित करने वाले पाँच ताल',
        context: 'हिंदुस्तानी संगीत समय को ताल में पिरोता है — अंतर्गत वज़न-संरचना के साथ मात्राओं के चक्र (ताली = ताली, खाली = झटका)। ये पाँच ताल 6, 7, 8, 10 और 16 मात्राओं को समेटते हैं: शास्त्रीय तबला अध्ययन का आधार-रेपरटुअर।',
      },
      ru: {
        title: 'Индийский тал — основы',
        subtitle: 'Пять талов, очерчивающих хиндустанское ядро',
        context: 'Хиндустанская музыка организует время через тал — циклы долей с внутренней акцентной структурой (тали = хлопок, кхали = взмах). Эти пять охватывают 6, 7, 8, 10 и 16 долей: репертуарная база классической школы табла.',
      },
    },
    patternIds: ['keherwa', 'dadra', 'rupak', 'jhaptal', 'tintal'],
  },
  {
    id: 'afro-cuban-foundations',
    title: 'Afro-Cuban Foundations',
    subtitle: 'Cáscara, clave, rumba, bembé',
    context:
      'The spine of Cuban dance music. Cáscara drives the timbales, clave sets the law, mambo and guaguancó fill out the son montuno ensemble, and bembé reaches back through the 12/8 Yoruba bell to West Africa itself.',
    i18n: {
      tr: {
        title: 'Afro-Küba Temelleri',
        subtitle: 'Cáscara, clave, rumba, bembé',
        context: 'Küba dans müziğinin omurgası. Cáscara timballeri sürer, clave kuralı koyar, mambo ve guaguancó son montuno topluluğunu doldurur, bembé ise 12/8 Yoruba çanı üzerinden Batı Afrika\'ya uzanır.',
      },
      es: {
        title: 'Cimientos Afrocubanos',
        subtitle: 'Cáscara, clave, rumba, bembé',
        context: 'La espina de la música bailable cubana. La cáscara mueve los timbales, la clave dicta la ley, el mambo y el guaguancó completan el ensamble de son montuno, y el bembé alcanza, a través de la campana yoruba en 12/8, hasta el África Occidental.',
      },
      zh: {
        title: '非洲-古巴根基',
        subtitle: 'Cáscara、clave、rumba、bembé',
        context: '古巴舞蹈音乐的脊梁。Cáscara 推动 timbales,clave 立下法则,mambo 与 guaguancó 充实 son montuno 合奏,bembé 则透过 12/8 约鲁巴铃声回溯至西非本土。',
      },
      fr: {
        title: 'Fondations Afro-Cubaines',
        subtitle: 'Cáscara, clave, rumba, bembé',
        context: 'L\'épine dorsale de la musique de danse cubaine. La cáscara propulse les timbales, la clave fait la loi, le mambo et le guaguancó garnissent l\'ensemble son montuno, et le bembé remonte, via la cloche yoruba en 12/8, jusqu\'à l\'Afrique de l\'Ouest.',
      },
      hi: {
        title: 'अफ़्रो-क्यूबा आधार',
        subtitle: 'Cáscara, clave, rumba, bembé',
        context: 'क्यूबाई नृत्य संगीत की रीढ़। Cáscara टिम्बेल को चलाती है, clave क़ानून तय करती है, mambo और guaguancó son montuno समूह को भरते हैं, और bembé 12/8 की योरूबा घंटी के ज़रिए वापस पश्चिम अफ़्रीका तक पहुँचता है।',
      },
      ru: {
        title: 'Афро-кубинский фундамент',
        subtitle: 'Cáscara, clave, rumba, bembé',
        context: 'Хребет кубинской танцевальной музыки. Cáscara ведёт тимбалес, clave диктует закон, mambo и guaguancó дополняют ансамбль son montuno, а bembé уходит через 12/8 йорубский колокол в саму Западную Африку.',
      },
    },
    patternIds: ['cascara', 'son-clave', 'mambo', 'guaguanco', 'bembe'],
  },
  {
    id: 'balkan-asymmetrics',
    title: 'Balkan Asymmetrics',
    subtitle: 'From 7/8 up to 11/8 stomping',
    context:
      "The Balkan playground — aksak (\"limping\") meters inherited from five centuries of Ottoman contact, sharpened into dance. Ruchenitsa skips in 7, Daichovo and Karşılama share a 9/8 skeleton from opposite sides of the old empire, Kopanitsa pushes to 11.",
    i18n: {
      tr: {
        title: 'Balkan Aksakları',
        subtitle: '7/8\'den 11/8\'e basa basa',
        context: 'Balkan oyun alanı — beş yüzyıllık Osmanlı temasından miras kalan aksak ölçüler, dansa keskinleştirilmiş. Ruchenitsa 7\'de atlar, Daichovo ile Karşılama eski imparatorluğun iki yakasından 9/8 iskeletini paylaşır, Kopanitsa 11\'e taşar.',
      },
      es: {
        title: 'Asimétricos Balcánicos',
        subtitle: 'De 7/8 a 11/8 a pisotón',
        context: 'El patio de juegos balcánico — métricas aksak ("cojeando") heredadas de cinco siglos de contacto otomano, afiladas en danza. La Ruchenitsa salta en 7, Daichovo y Karşılama comparten un esqueleto en 9/8 desde lados opuestos del viejo imperio, Kopanitsa empuja hasta 11.',
      },
      zh: {
        title: '巴尔干不对称',
        subtitle: '从 7/8 跺到 11/8',
        context: '巴尔干的游乐场 —— 继承自五个世纪奥斯曼接触的 aksak（"跛行"）拍子,被舞蹈打磨得锋利。Ruchenitsa 在 7 中跳跃;Daichovo 与 Karşılama 从旧帝国两端共享 9/8 骨架;Kopanitsa 推到 11。',
      },
      fr: {
        title: 'Asymétriques Balkaniques',
        subtitle: 'Du 7/8 jusqu\'au 11/8 piétiné',
        context: 'Le terrain de jeu balkanique — des mesures aksak ("boitantes") héritées de cinq siècles de contact ottoman, affûtées par la danse. La Ruchenitsa saute en 7, Daichovo et Karşılama partagent un squelette en 9/8 depuis les deux flancs de l\'ancien empire, la Kopanitsa pousse jusqu\'à 11.',
      },
      hi: {
        title: 'बाल्कन विषम लय',
        subtitle: '7/8 से 11/8 तक की धमक',
        context: 'बाल्कन का खेल मैदान — पाँच सदियों की ओस्मानी निकटता से मिले aksak ("लंगड़ाते") ताल, नृत्य से तेज़ हुए। Ruchenitsa 7 में छलाँग लगाता है; Daichovo और Karşılama पुराने साम्राज्य के दो छोरों से 9/8 का ढाँचा साझा करते हैं; Kopanitsa 11 तक पहुँचता है।',
      },
      ru: {
        title: 'Балканские асимметрики',
        subtitle: 'От 7/8 до 11/8 — с прытью',
        context: 'Балканская игровая площадка — аксак ("прихрамывающие") размеры, унаследованные от пяти веков контакта с Османской империей и заточенные танцем. Ручница прыгает в 7, Daichovo и Karşılama делят 9/8-каркас с разных краёв старой империи, Kopanitsa дотягивает до 11.',
      },
    },
    patternIds: ['ruchenitsa', 'daichovo', 'karsilama', 'kopanitsa', 'lesnoto'],
  },
  {
    id: 'west-african-ensembles',
    title: 'West African Ensembles',
    subtitle: 'Mande djembe and Ewe bell traditions',
    context:
      'Two great percussion lineages. Kuku and Soli are Mande djembe repertoire from Guinea/Mali. Agbekor is the Ewe war dance from Ghana-Togo. Bembé (the 12/8 bell) binds them — the "standard pattern" that migrated through the Atlantic slave trade into Cuba, Brazil, and Andalusia.',
    i18n: {
      tr: {
        title: 'Batı Afrika Toplulukları',
        subtitle: 'Mande djembe\'si ve Ewe çan gelenekleri',
        context: 'İki büyük perküsyon soyağacı. Kuku ve Soli Gine/Mali\'den Mande djembe repertuvarıdır. Agbekor Gana-Togo\'nun Ewe savaş dansıdır. Bembé (12/8 çanı) onları bağlar — Atlantik köle ticareti boyunca Küba, Brezilya ve Endülüs\'e göç eden "standart örüntü".',
      },
      es: {
        title: 'Ensambles de África Occidental',
        subtitle: 'Tradiciones de djembe mandé y campana ewe',
        context: 'Dos grandes linajes de percusión. Kuku y Soli son repertorio de djembe mandé de Guinea/Malí. Agbekor es la danza de guerra ewe de Ghana-Togo. El bembé (la campana en 12/8) los une — el "patrón estándar" que migró por la trata atlántica a Cuba, Brasil y Andalucía.',
      },
      zh: {
        title: '西非合奏',
        subtitle: 'Mande djembe 与 Ewe 钟声两大传统',
        context: '两支伟大的打击乐谱系。Kuku 与 Soli 是几内亚/马里 Mande djembe 的曲目。Agbekor 是来自加纳-多哥的 Ewe 战舞。Bembé（12/8 钟声）把它们绑在一起 —— 这条"标准节奏"经由跨大西洋奴隶贸易迁徙到古巴、巴西与安达卢西亚。',
      },
      fr: {
        title: 'Ensembles d\'Afrique de l\'Ouest',
        subtitle: 'Traditions du djembé mandé et de la cloche ewe',
        context: 'Deux grandes lignées de percussions. Kuku et Soli sont du répertoire de djembé mandé venu de Guinée/Mali. Agbekor est la danse guerrière ewe du Ghana-Togo. Le bembé (la cloche en 12/8) les relie — le "motif standard" qui a migré via la traite atlantique vers Cuba, le Brésil et l\'Andalousie.',
      },
      hi: {
        title: 'पश्चिम अफ़्रीकी समूह',
        subtitle: 'मांडे djembe और Ewe घंटी की परंपराएँ',
        context: 'दो महान पर्क्यूशन वंश। Kuku और Soli गिनी/माली का Mande djembe रेपरटुअर हैं। Agbekor घाना-टोगो की Ewe युद्ध-नृत्य है। Bembé (12/8 की घंटी) उन्हें बाँधती है — "मानक पैटर्न" जो ट्रांसअटलांटिक दास-व्यापार के साथ क्यूबा, ब्राज़ील और अंदलूसिया तक पहुँचा।',
      },
      ru: {
        title: 'Западноафриканские ансамбли',
        subtitle: 'Манде-джембе и эвейская колокольная традиция',
        context: 'Две великие линии перкуссии. Kuku и Soli — джембе-репертуар манде из Гвинеи/Мали. Agbekor — эвейский военный танец из Ганы-Того. Bembé (колокол в 12/8) связывает их — "стандартный паттерн", переселившийся через атлантическую работорговлю на Кубу, в Бразилию и в Андалусию.',
      },
    },
    patternIds: ['djembe-standard', 'kuku', 'soli', 'agbekor', 'bembe-68'],
  },

  // ── Cross-cultural DNA paths ───────────────────────────────────────
  {
    id: 'clave-universe',
    title: 'Clave Universe',
    subtitle: 'The 5-stroke cell across the Afro-Atlantic',
    context:
      'Son clave is a 3+2 framework that spread from Cuba across the hemisphere. Hear it in son, rumba, bolero, guaguancó, bembé — and its diaspora cousins in Brazilian samba, Puerto Rican bomba, and African-ancestor 12/8 bells.',
    i18n: {
      tr: {
        title: 'Clave Evreni',
        subtitle: 'Afro-Atlantik\'te 5 vuruşluk hücre',
        context: 'Son clave 3+2 çatısıdır; Küba\'dan yarım küreye yayıldı. Onu son, rumba, bolero, guaguancó, bembé\'de duy — ve diasporadaki kuzenlerini Brezilya samba\'sında, Porto Riko bomba\'sında ve Afrika atası 12/8 çanlarında.',
      },
      es: {
        title: 'Universo de la Clave',
        subtitle: 'La célula de 5 golpes por el Afro-Atlántico',
        context: 'La clave de son es un marco 3+2 que se extendió desde Cuba por todo el hemisferio. Escúchala en son, rumba, bolero, guaguancó, bembé — y sus primas de la diáspora en la samba brasileña, la bomba puertorriqueña y las campanas en 12/8 de antepasados africanos.',
      },
      zh: {
        title: 'Clave 宇宙',
        subtitle: '横跨非洲-大西洋的 5 击单元',
        context: 'Son clave 是一个 3+2 框架,从古巴蔓延到整个半球。在 son、rumba、bolero、guaguancó、bembé 中听见它 —— 在巴西 samba、波多黎各 bomba,以及非洲祖先的 12/8 钟声中遇见它的离散表亲。',
      },
      fr: {
        title: 'L\'Univers de la Clave',
        subtitle: 'La cellule à 5 frappes à travers l\'Afro-Atlantique',
        context: 'La son clave est un cadre 3+2 qui s\'est répandu depuis Cuba sur tout l\'hémisphère. Entends-la dans le son, la rumba, le bolero, le guaguancó, le bembé — et ses cousines de la diaspora dans la samba brésilienne, la bomba portoricaine et les cloches africaines en 12/8.',
      },
      hi: {
        title: 'Clave का ब्रह्माण्ड',
        subtitle: 'अफ़्रो-अटलांटिक की 5-स्ट्रोक कोशिका',
        context: 'Son clave एक 3+2 ढाँचा है जो क्यूबा से पूरे गोलार्ध में फैला। इसे son, rumba, bolero, guaguancó, bembé में सुनें — और इसके डायस्पोरा भाई-बहनों को ब्राज़ीली samba, प्यूर्तो रिको bomba, तथा अफ़्रीकी पूर्वजों की 12/8 घंटियों में।',
      },
      ru: {
        title: 'Вселенная клаве',
        subtitle: '5-ударная клетка через Афро-Атлантику',
        context: 'Son clave — каркас 3+2, который распространился из Кубы по полушарию. Слышишь его в сон, румбе, болеро, гуагуанко, бембе — и в диаспоральных кузенах: бразильской самбе, пуэрториканской бомбе и колоколах 12/8 африканских предков.',
      },
    },
    patternIds: [
      'son-clave', 'rumba-clave-3-2', 'bolero', 'guaguanco',
      'bembe', 'samba-partido-alto', 'bomba-sica',
    ],
  },
  {
    id: 'aksak-family',
    title: 'The Aksak Family',
    subtitle: '2+2+2+3 around the silk road',
    context:
      "The 9/8 aksak limp — Turkish for \"limping\" — isn't Turkish alone. It travels from Thrace (Karşılama) east through Bulgaria (Daichovo), across the Aegean (Zeibekiko), and all the way into Xinjiang via the Uyghur Muqam tradition. Different languages, one pulse.",
    i18n: {
      tr: {
        title: 'Aksak Ailesi',
        subtitle: 'İpek yolu boyunca 2+2+2+3',
        context: '9/8\'lik aksak — "aksamak" fiilinden — yalnız Türk değildir. Trakya\'dan (Karşılama) doğuya Bulgaristan\'a (Daichovo), Ege\'yi aşıp (Zeibekiko), Uygur Muqam geleneğiyle Sincan\'a kadar gider. Farklı diller, tek nabız.',
      },
      es: {
        title: 'La Familia Aksak',
        subtitle: '2+2+2+3 alrededor de la Ruta de la Seda',
        context: 'La cojera aksak en 9/8 — "aksak" es turco para "cojeando" — no es solo turca. Viaja desde Tracia (Karşılama) al este por Bulgaria (Daichovo), cruza el Egeo (Zeibekiko) y llega hasta Xinjiang vía la tradición Muqam uigur. Distintos idiomas, un mismo pulso.',
      },
      zh: {
        title: 'Aksak 家族',
        subtitle: '丝绸之路上的 2+2+2+3',
        context: '9/8 的 aksak 跛脚 —— 土耳其语意为"跛行" —— 并非只属于土耳其。它从色雷斯（Karşılama）一路东行,经由保加利亚（Daichovo）、跨越爱琴海（Zeibekiko）、最后借由维吾尔木卡姆传统抵达新疆。不同语言,同一脉搏。',
      },
      fr: {
        title: 'La Famille Aksak',
        subtitle: '2+2+2+3 le long de la route de la soie',
        context: 'La claudication aksak en 9/8 — "aksak" signifie "boiter" en turc — n\'est pas qu\'une affaire turque. Elle voyage de la Thrace (Karşılama) vers l\'est en Bulgarie (Daichovo), traverse l\'Égée (Zeïbékiko) et va jusqu\'au Xinjiang via la tradition ouïghoure du Muqam. Langues différentes, même pulsation.',
      },
      hi: {
        title: 'Aksak कुटुम्ब',
        subtitle: 'रेशम मार्ग पर 2+2+2+3',
        context: '9/8 की aksak लंगड़ाहट — तुर्की में "aksak" का अर्थ है "लंगड़ाते हुए" — सिर्फ़ तुर्की नहीं है। यह थ्रेस (Karşılama) से पूर्व बुल्गारिया (Daichovo) तक, ईजियन पार (Zeibekiko), और उइगुर मुक़ाम परंपरा से होकर शिनजियांग तक यात्रा करती है। भाषाएँ अलग, धड़कन एक।',
      },
      ru: {
        title: 'Семейство аксак',
        subtitle: '2+2+2+3 вдоль Великого шёлкового пути',
        context: 'Aksak-хромота в 9/8 — по-турецки "хромающий" — вовсе не только турецкая. Она идёт из Фракии (Karşılama) на восток через Болгарию (Daichovo), пересекает Эгейское море (Zeibekiko) и через уйгурский Мукам добирается до Синьцзяна. Разные языки, один пульс.',
      },
    },
    patternIds: [
      'karsilama', 'daichovo', 'roman-havasi', 'zeibekiko',
      'uyghur-muqam-78', 'aksak',
    ],
  },
  {
    id: '12-8-bell-circuit',
    title: 'The 12/8 Bell Circuit',
    subtitle: 'West Africa → Cuba → Puerto Rico → Andalusia',
    context:
      'One of the deepest musical migrations on record. The West African 12/8 bell pattern (Agbekor, Bembé 6/8) crosses the Atlantic into Cuban bembé ceremonies, Puerto Rican bomba holandé, Bahian ijexá — and, via Morisco and Romani routes, finds its way into the 12-beat compás of flamenco bulería.',
    i18n: {
      tr: {
        title: '12/8 Çan Devresi',
        subtitle: 'Batı Afrika → Küba → Porto Riko → Endülüs',
        context: 'Tarihin en derin müzikal göçlerinden biri. Batı Afrika\'nın 12/8 çan kalıbı (Agbekor, Bembé 6/8) Atlantik\'i geçip Küba bembé törenlerine, Porto Riko bomba holandé\'sine, Bahia ijexá\'sına ulaşır — ve Morisko ile Roman yollarıyla flamenko bulería\'nın 12-vuruşluk compás\'ına süzülür.',
      },
      es: {
        title: 'El Circuito de la Campana en 12/8',
        subtitle: 'África Occidental → Cuba → Puerto Rico → Andalucía',
        context: 'Una de las migraciones musicales más profundas registradas. El patrón de campana en 12/8 de África Occidental (Agbekor, Bembé 6/8) cruza el Atlántico a las ceremonias de bembé cubano, a la bomba holandé puertorriqueña, al ijexá bahiano — y por rutas moriscas y gitanas se cuela en el compás de 12 de la bulería flamenca.',
      },
      zh: {
        title: '12/8 钟声回路',
        subtitle: '西非 → 古巴 → 波多黎各 → 安达卢西亚',
        context: '有史以来最深的一次音乐迁徙之一。西非 12/8 钟声节奏（Agbekor、Bembé 6/8）跨越大西洋进入古巴 bembé 仪式、波多黎各 bomba holandé、巴伊亚 ijexá —— 经由摩里斯科与罗姆人路径,又渗入弗拉门戈 bulería 的 12 拍 compás。',
      },
      fr: {
        title: 'Le Circuit de la Cloche en 12/8',
        subtitle: 'Afrique de l\'Ouest → Cuba → Porto Rico → Andalousie',
        context: 'L\'une des migrations musicales les plus profondes connues. Le motif de cloche ouest-africain en 12/8 (Agbekor, Bembé 6/8) traverse l\'Atlantique jusqu\'aux cérémonies bembé cubaines, à la bomba holandé portoricaine, à l\'ijexá bahianais — et via les routes morisques et romanies, il s\'invite dans le compás à 12 temps de la bulería flamenca.',
      },
      hi: {
        title: '12/8 घंटी सर्किट',
        subtitle: 'पश्चिम अफ़्रीका → क्यूबा → प्यूर्तो रिको → अंदलूसिया',
        context: 'इतिहास के सबसे गहरे संगीत-प्रवासों में से एक। पश्चिम अफ़्रीकी 12/8 घंटी पैटर्न (Agbekor, Bembé 6/8) अटलांटिक पार करके क्यूबा के bembé समारोहों में, प्यूर्तो रिकन bomba holandé में, बाहियाई ijexá में पहुँचता है — और Morisco व रोमानी मार्गों से होकर flamenco bulería के 12-मात्रा compás में घुस जाता है।',
      },
      ru: {
        title: 'Контур колокола 12/8',
        subtitle: 'Западная Африка → Куба → Пуэрто-Рико → Андалусия',
        context: 'Одна из глубочайших задокументированных музыкальных миграций. Западноафриканский колокольный паттерн 12/8 (Agbekor, Bembé 6/8) пересекает Атлантику и попадает в кубинские церемонии бембе, пуэрториканскую bomba holandé, баийскую ijexá — а через мориско-цыганские маршруты прокрадывается в 12-дольный компас фламенко-булерии.',
      },
    },
    patternIds: [
      'agbekor', 'bembe-68', 'bembe', 'rumba-columbia',
      'bomba-holande', 'ijexa', 'buleria',
    ],
  },
  {
    id: 'swana-maqsoum-trail',
    title: 'The Maqsoum Trail',
    subtitle: 'From Cairo street bands to mahraganat',
    context:
      'Maqsoum is the most ubiquitous SWANA rhythm — doum-tek-tek-doum-tek in 4/4. Hear it carried through Egyptian shaabi, Gulf wedding music, North African raï, Zanzibari taarab, and finally through Cairo drum machines as mahraganat, the soundtrack of the 2011 revolution.',
    i18n: {
      tr: {
        title: 'Maqsoum Yolu',
        subtitle: 'Kahire sokak ekiplerinden mahraganat\'a',
        context: 'Maqsoum SWANA bölgesinin en yaygın ritmidir — 4/4\'te dum-tek-tek-dum-tek. Onu Mısır şaabi\'sinde, Körfez düğün müziğinde, Kuzey Afrika raï\'sinde, Zanzibar taarab\'ında ve nihayet 2011 devriminin sound\'u olan Kahire mahraganat ritim makinelerinde duy.',
      },
      es: {
        title: 'La Senda del Maqsoum',
        subtitle: 'De las bandas callejeras de El Cairo al mahraganat',
        context: 'El maqsoum es el ritmo más omnipresente de SWANA — dum-tek-tek-dum-tek en 4/4. Escúchalo a través del shaabi egipcio, la música de bodas del Golfo, el raï norteafricano, el taarab zanzibarí y, por fin, a través de las cajas de ritmos cairotas como mahraganat, banda sonora de la revolución de 2011.',
      },
      zh: {
        title: 'Maqsoum 之路',
        subtitle: '从开罗街头乐队到 mahraganat',
        context: 'Maqsoum 是 SWANA 地区最普及的节奏 —— 4/4 中的 dum-tek-tek-dum-tek。听它流经埃及 shaabi、海湾婚礼音乐、北非 raï、桑给巴尔 taarab,最终经由开罗的鼓机化身为 mahraganat —— 2011 年革命的配乐。',
      },
      fr: {
        title: 'La Piste du Maqsoum',
        subtitle: 'Des fanfares de rue du Caire au mahraganat',
        context: 'Le maqsoum est le rythme le plus omniprésent de la zone SWANA — doum-tek-tek-doum-tek en 4/4. Entends-le porté par le shaabi égyptien, la musique de mariage du Golfe, le raï nord-africain, le taarab zanzibari, et enfin par les boîtes à rythme du Caire dans le mahraganat, bande-son de la révolution de 2011.',
      },
      hi: {
        title: 'Maqsoum का पथ',
        subtitle: 'काहिरा के सड़क-दलों से mahraganat तक',
        context: 'Maqsoum SWANA की सबसे व्यापक लय है — 4/4 में doum-tek-tek-doum-tek। इसे मिस्र shaabi, खाड़ी के विवाह संगीत, उत्तर अफ़्रीकी raï, ज़ांज़ीबारी taarab और अंत में काहिरा के ड्रम मशीनों से उपजे mahraganat — 2011 क्रांति का साउंडट्रैक — में सुनें।',
      },
      ru: {
        title: 'Тропа Maqsoum',
        subtitle: 'От уличных бэндов Каира до mahraganat',
        context: 'Maqsoum — самый вездесущий ритм SWANA: dum-tek-tek-dum-tek в 4/4. Слышишь его в египетском shaabi, свадебной музыке Залива, североафриканском raï, занзибарском taarab — и, наконец, в каирских драм-машинах в виде mahraganat, саундтреке революции 2011 года.',
      },
    },
    patternIds: [
      'maqsoum', 'baladi', 'saidi', 'shaabi-egyptian',
      'rai-electric', 'taarab', 'mahraganat',
    ],
  },
  {
    id: 'afrobeat-lineage',
    title: 'Afrobeat → Afrobeats',
    subtitle: 'Tony Allen to Amapiano via Highlife',
    context:
      "Tony Allen's Afrobeat (with Fela) in 1970s Lagos was already a synthesis of Yoruba percussion, jazz, and funk. Highlife is its cousin across Ghana and eastern Nigeria. Modern Afrobeats (with the 's') is the grandchild that took over global pop in the 2010s. Amapiano is the South African branch that replaced the drummer with the log drum.",
    i18n: {
      tr: {
        title: 'Afrobeat → Afrobeats',
        subtitle: 'Tony Allen\'dan Highlife üzerinden Amapiano\'ya',
        context: '1970\'lerin Lagos\'unda Tony Allen\'ın (Fela ile) Afrobeat\'i, Yoruba perküsyonu, caz ve funk\'ın sentezindeydi zaten. Highlife, Gana ve doğu Nijerya\'daki kuzenidir. Modern Afrobeats (\'s\' ile) ise 2010\'larda küresel pop\'u devralan torundur. Amapiano davulcuyu log drum ile değiştiren Güney Afrika koludur.',
      },
      es: {
        title: 'Afrobeat → Afrobeats',
        subtitle: 'De Tony Allen a Amapiano vía Highlife',
        context: 'El Afrobeat de Tony Allen (con Fela) en el Lagos de los 70 ya era una síntesis de percusión yoruba, jazz y funk. El Highlife es su primo en Ghana y el este de Nigeria. El Afrobeats moderno (con la "s") es el nieto que se apoderó del pop global en los 2010. El Amapiano es la rama sudafricana que cambió al baterista por el log drum.',
      },
      zh: {
        title: 'Afrobeat → Afrobeats',
        subtitle: '从 Tony Allen 经 Highlife 到 Amapiano',
        context: '1970 年代拉各斯,Tony Allen（与 Fela 合作）的 Afrobeat 已经是约鲁巴打击乐、爵士与放克的综合。Highlife 是它在加纳与尼日利亚东部的表亲。现代 Afrobeats（带着 "s"）则是 2010 年代席卷全球流行的孙辈。Amapiano 是南非分支,用 log drum 取代了鼓手。',
      },
      fr: {
        title: 'Afrobeat → Afrobeats',
        subtitle: 'De Tony Allen à l\'Amapiano via le Highlife',
        context: 'L\'Afrobeat de Tony Allen (avec Fela) à Lagos dans les années 70 était déjà une synthèse de percussions yoruba, de jazz et de funk. Le Highlife est son cousin au Ghana et dans l\'est du Nigeria. L\'Afrobeats moderne (avec un "s") est le petit-fils qui a pris la pop mondiale dans les années 2010. L\'Amapiano est la branche sud-africaine qui a remplacé le batteur par le log drum.',
      },
      hi: {
        title: 'Afrobeat → Afrobeats',
        subtitle: 'Tony Allen से Amapiano तक — Highlife के रास्ते',
        context: '1970 के दशक के Lagos में Tony Allen का Afrobeat (Fela के साथ) पहले से ही Yoruba पर्क्यूशन, jazz और funk का संश्लेषण था। Highlife इसका Ghana और पूर्वी नाइजीरिया का चचेरा भाई है। आधुनिक Afrobeats ("s" के साथ) पोता है जिसने 2010 के दशक में वैश्विक पॉप पर क़ब्ज़ा किया। Amapiano दक्षिण अफ़्रीकी शाखा है जिसने ड्रमर की जगह log drum लगा ली।',
      },
      ru: {
        title: 'Afrobeat → Afrobeats',
        subtitle: 'От Тони Аллена к Amapiano через Highlife',
        context: 'Afrobeat Тони Аллена (с Фелой) в Лагосе 1970-х уже был синтезом йорубской перкуссии, джаза и фанка. Highlife — его кузен в Гане и восточной Нигерии. Современный Afrobeats (с "s" на конце) — это внук, захвативший мировой поп в 2010-х. Amapiano — южноафриканская ветвь, заменившая барабанщика лог-драмом.',
      },
    },
    patternIds: [
      'afrobeat-tony-allen', 'highlife-ghana', 'highlife-nigeria',
      'juju', 'afrobeats-modern', 'amapiano-groove', 'azonto',
    ],
  },
  {
    id: 'trance-grooves',
    title: 'Trance Grooves',
    subtitle: 'Sufi, Gnawa, Bandari, Qawwali',
    context:
      'A transcultural trance circuit. Gnawa and Stambali carry sub-Saharan spiritual music across the Sahara into Morocco and Tunisia. Sufi dhikr spirals on a single pulse across the Muslim world. Bandari — the music of Iran\'s Gulf coast — mirrors all of it through Indian Ocean slave-trade routes. Qawwali accelerates the idea in South Asia.',
    i18n: {
      tr: {
        title: 'Trans Groove\'ları',
        subtitle: 'Sufi, Gnawa, Bandari, Qawwali',
        context: 'Kültürlerarası bir trans devresi. Gnawa ve Stambali, Sahra-altı manevi müziğini Sahra\'yı aşıp Fas ve Tunus\'a taşır. Sufi zikri tüm İslam dünyasında tek nabız üzerinde dönerek yükselir. Bandari — İran\'ın Körfez kıyısının müziği — Hint Okyanusu köle ticareti yollarıyla tüm bunları yansıtır. Qawwali aynı fikri Güney Asya\'da hızlandırır.',
      },
      es: {
        title: 'Grooves de Trance',
        subtitle: 'Sufí, Gnawa, Bandari, Qawwali',
        context: 'Un circuito de trance transcultural. Gnawa y Stambali llevan la música espiritual subsahariana a través del Sáhara a Marruecos y Túnez. El dhikr sufí gira sobre un solo pulso por todo el mundo musulmán. El bandari — la música de la costa iraní del Golfo — refleja todo eso por las rutas esclavistas del Índico. El qawwali acelera la idea en el sur de Asia.',
      },
      zh: {
        title: '出神律动',
        subtitle: '苏菲、Gnawa、Bandari、Qawwali',
        context: '一条跨文化的出神回路。Gnawa 与 Stambali 把撒哈拉以南的灵性音乐越过沙漠带入摩洛哥与突尼斯。苏菲 dhikr 在穆斯林世界各地围绕单一脉搏盘旋。Bandari —— 伊朗波斯湾岸的音乐 —— 通过印度洋奴隶贸易航线映照这一切。Qawwali 在南亚把这一理念加速。',
      },
      fr: {
        title: 'Grooves de Transe',
        subtitle: 'Soufi, Gnawa, Bandari, Qawwali',
        context: 'Un circuit de transe transculturel. Gnawa et Stambali portent la musique spirituelle sub-saharienne à travers le Sahara jusqu\'au Maroc et à la Tunisie. Le dhikr soufi tourne sur un même pouls à travers le monde musulman. Le bandari — la musique de la côte iranienne du Golfe — fait écho à tout cela par les routes esclavagistes de l\'océan Indien. Le qawwali accélère l\'idée en Asie du Sud.',
      },
      hi: {
        title: 'समाधि-लय',
        subtitle: 'सूफ़ी, Gnawa, Bandari, Qawwali',
        context: 'एक अंतर-सांस्कृतिक trance परिपथ। Gnawa और Stambali सहारा-दक्षिणी आध्यात्मिक संगीत को सहारा पार करके मोरक्को और ट्यूनीशिया तक ले जाते हैं। सूफ़ी zikr मुस्लिम विश्व भर में एक ही नब्ज़ पर घूमती है। Bandari — ईरान के खाड़ी तट का संगीत — हिंद महासागर के दास-व्यापार मार्गों से यही सब प्रतिबिंबित करता है। Qawwali दक्षिण एशिया में इस विचार को तीव्र करता है।',
      },
      ru: {
        title: 'Трансовые гувы',
        subtitle: 'Суфи, Gnawa, Bandari, Qawwali',
        context: 'Транскультурный трансовый контур. Gnawa и Stambali несут субсахарскую духовную музыку через Сахару в Марокко и Тунис. Суфийский зикр кружится на одном пульсе по всему мусульманскому миру. Bandari — музыка иранского побережья Залива — отражает всё это через работорговые маршруты Индийского океана. Qawwali ускоряет эту идею в Южной Азии.',
      },
    },
    patternIds: [
      'gnawa-lila', 'gnawa-banga', 'stambali', 'bandari',
      'qawwali', 'sufi-dhikr-sudan', 'daf-zikr', 'dhamaal-sufi',
    ],
  },

  // ── Modern / electronic paths ─────────────────────────────────────
  {
    id: 'drill-family',
    title: 'Drill Family Tree',
    subtitle: 'Chicago → New York → London → Jersey',
    context:
      'Drill started with sliding 808 sub-bass and triplet hi-hats in Chicago\'s South Side (2012). Brooklyn MCs picked it up around 2018 — harder kicks, darker melodies. UK drill pushed the tempo lower and the hats busier. Jersey club contributes the bed-squeak kick pattern to the family.',
    i18n: {
      tr: {
        title: 'Drill Soyağacı',
        subtitle: 'Chicago → New York → Londra → Jersey',
        context: 'Drill, Chicago South Side\'da (2012) kayan 808 sub-bass\'i ve üçleme hi-hat\'lerle başladı. Brooklyn MC\'leri 2018 dolayında devraldı — daha sert kick\'ler, daha karanlık melodiler. UK drill tempoyu düşürdü, hat\'leri sıklaştırdı. Jersey club ise yatak gıcırtısı kick desenini aileye kattı.',
      },
      es: {
        title: 'Árbol Genealógico del Drill',
        subtitle: 'Chicago → Nueva York → Londres → Jersey',
        context: 'El drill arrancó con sub-bajos 808 deslizantes y hi-hats con tresillo en el South Side de Chicago (2012). Los MCs de Brooklyn lo agarraron hacia 2018 — kicks más duros, melodías más oscuras. El drill británico bajó el tempo y atareó los hats. El Jersey club aporta el patrón de bombo "bed-squeak" a la familia.',
      },
      zh: {
        title: 'Drill 家族树',
        subtitle: '芝加哥 → 纽约 → 伦敦 → 泽西',
        context: 'Drill 起源于 2012 年芝加哥南区的滑动 808 次低音和三连音 hi-hat。Brooklyn 的 MC 们在 2018 年前后接过来 —— 更硬的 kick、更阴暗的旋律。UK drill 把节奏拉慢、hat 变密。Jersey club 把"床咯吱"kick 模式带入家族。',
      },
      fr: {
        title: 'Arbre Généalogique du Drill',
        subtitle: 'Chicago → New York → Londres → Jersey',
        context: 'Le drill a démarré avec des sub-basses 808 glissantes et des hi-hats en triolets dans le South Side de Chicago (2012). Les MCs de Brooklyn s\'en sont emparés vers 2018 — kicks plus durs, mélodies plus sombres. Le drill britannique a baissé le tempo et chargé les hats. Le Jersey club apporte le motif de kick "bed-squeak" à la famille.',
      },
      hi: {
        title: 'Drill परिवार वृक्ष',
        subtitle: 'Chicago → New York → London → Jersey',
        context: 'Drill 2012 में Chicago के South Side में फिसलते 808 sub-bass और triplet hi-hat के साथ शुरू हुआ। Brooklyn के MC ने 2018 के आसपास इसे उठाया — कड़े kick, गहरे मेलोडी। UK drill ने टेम्पो धीमा किया और hats व्यस्त। Jersey club परिवार में bed-squeak kick पैटर्न जोड़ता है।',
      },
      ru: {
        title: 'Семейное древо Drill',
        subtitle: 'Чикаго → Нью-Йорк → Лондон → Джерси',
        context: 'Drill начался со скользящих 808-сабов и триольных хэтов в чикагском South Side (2012). Бруклинские MC подхватили его около 2018-го — кики жёстче, мелодии темнее. UK drill замедлил темп и насытил хэты. Jersey club добавил в семью "скрип кровати" в кик-паттерне.',
      },
    },
    patternIds: [
      'chicago-drill', 'ny-drill', 'uk-drill', 'jersey-club',
      'footwork-juke',
    ],
  },
  {
    id: 'phonk-lineage',
    title: 'Phonk Lineage',
    subtitle: 'Memphis tapes to TikTok drift',
    context:
      'Phonk began as lo-fi Memphis rap cassettes in the 1990s — cowbell, chopped vocals, gritty 808s. It resurfaced online in the late 2010s, got the "drift" association through Russian-produced YouTube edits, then exploded on TikTok. Brazilian and fish (hyper-drift) variants followed.',
    i18n: {
      tr: {
        title: 'Phonk Soyu',
        subtitle: 'Memphis kasetlerinden TikTok drift\'ine',
        context: 'Phonk 1990\'larda lo-fi Memphis rap kasetleri olarak başladı — cowbell, doğranmış vokaller, çiğ 808\'ler. 2010\'ların sonunda online olarak yeniden ortaya çıktı, Rus yapımı YouTube edit\'leri ile "drift" çağrışımı kazandı, sonra TikTok\'ta patladı. Brezilya ve fish (hyper-drift) varyantları izledi.',
      },
      es: {
        title: 'Linaje del Phonk',
        subtitle: 'Cintas de Memphis al drift de TikTok',
        context: 'El phonk nació como cassettes de rap lo-fi en Memphis en los 90 — cencerro, vocales picadas, 808 ásperos. Resurgió en línea a finales de los 2010, se asoció al "drift" gracias a edits de YouTube hechos en Rusia, y explotó en TikTok. Luego llegaron las variantes brasileñas y fish (hyper-drift).',
      },
      zh: {
        title: 'Phonk 谱系',
        subtitle: '从孟菲斯录音带到 TikTok 漂移',
        context: 'Phonk 起源于 1990 年代孟菲斯的 lo-fi 说唱卡带 —— 牛铃、切碎人声、粗砺 808。2010 年代末在网络上重新浮现,通过俄制 YouTube 剪辑获得"drift"标签,随后在 TikTok 上爆红。巴西版本与 fish（hyper-drift）变体接踵而至。',
      },
      fr: {
        title: 'Lignage du Phonk',
        subtitle: 'Des cassettes de Memphis au drift TikTok',
        context: 'Le phonk est né en cassettes de rap lo-fi à Memphis dans les années 90 — cowbell, voix hachées, 808 rugueuses. Il est ressorti en ligne à la fin des années 2010, a gagné l\'étiquette "drift" via des edits YouTube made in Russia, puis a explosé sur TikTok. Les variantes brésiliennes et fish (hyper-drift) ont suivi.',
      },
      hi: {
        title: 'Phonk वंशावली',
        subtitle: 'Memphis कैसेट से TikTok drift तक',
        context: 'Phonk 1990 के दशक में Memphis के lo-fi rap कैसेट के रूप में शुरू हुआ — cowbell, कटी हुई आवाज़ें, खुरदरी 808। 2010 के अंत में ऑनलाइन फिर उभरा, रूसी YouTube edits से "drift" का जुड़ाव मिला, फिर TikTok पर फट पड़ा। Brazilian और fish (hyper-drift) रूप उसके बाद आए।',
      },
      ru: {
        title: 'Линия Phonk',
        subtitle: 'От кассет Мемфиса к TikTok-drift',
        context: 'Phonk начинался как lo-fi мемфисские рэп-кассеты 1990-х — ковбелл, нарезанный вокал, грязные 808-е. Всплыл в сети в конце 2010-х, обрёл связь с "drift" через российские YouTube-эдиты и взорвался в TikTok. Затем подтянулись бразильские и fish (hyper-drift) варианты.',
      },
    },
    patternIds: [
      'hiphop-phonk', 'phonk-drift', 'phonk-brazilian', 'phonk-fish',
    ],
  },
  {
    id: 'internet-born',
    title: 'Internet-Born Genres',
    subtitle: 'Vaporwave, lo-fi, hyperpop',
    context:
      "Genres that couldn't exist without bedroom producers and streaming. Vaporwave stretched 80s corporate muzak into something haunted. Lo-fi hip-hop turned J Dilla's swung timing into study music. Hyperpop crashed trap, ska, happy-hardcore and nightcore together. Future funk danced on vaporwave's grave.",
    i18n: {
      tr: {
        title: 'İnternet Doğumlu Türler',
        subtitle: 'Vaporwave, lo-fi, hyperpop',
        context: 'Yatak odası prodüktörleri ve streaming olmadan var olamayacak türler. Vaporwave 80\'lerin kurumsal muzak\'ını perili bir şeye uzattı. Lo-fi hip-hop, J Dilla\'nın swing\'li timing\'ini ders müziğine çevirdi. Hyperpop trap, ska, happy-hardcore ve nightcore\'u birbirine çarptırdı. Future funk vaporwave\'in mezarı üstünde dans etti.',
      },
      es: {
        title: 'Géneros Nacidos en Internet',
        subtitle: 'Vaporwave, lo-fi, hyperpop',
        context: 'Géneros que no existirían sin productores de cuarto y streaming. El vaporwave estiró la muzak corporativa de los 80 hasta algo encantado. El lo-fi hip-hop convirtió el swing de J Dilla en música para estudiar. El hyperpop chocó trap, ska, happy-hardcore y nightcore. El future funk bailó sobre la tumba del vaporwave.',
      },
      zh: {
        title: '互联网原生流派',
        subtitle: 'Vaporwave、lo-fi、hyperpop',
        context: '没有卧室制作人和流媒体就无法存在的流派。Vaporwave 把 80 年代企业 muzak 拉伸成幽灵感的东西。Lo-fi hip-hop 把 J Dilla 的摇摆时序变成学习音乐。Hyperpop 把 trap、ska、happy-hardcore 与 nightcore 撞在一起。Future funk 则在 vaporwave 的坟上起舞。',
      },
      fr: {
        title: 'Genres Nés sur Internet',
        subtitle: 'Vaporwave, lo-fi, hyperpop',
        context: 'Des genres qui n\'existeraient pas sans producteurs en chambre et streaming. La vaporwave a étiré le muzak d\'entreprise des années 80 en quelque chose de hanté. Le lo-fi hip-hop a transformé le swing de J Dilla en musique pour réviser. La hyperpop a percuté trap, ska, happy-hardcore et nightcore. La future funk a dansé sur la tombe de la vaporwave.',
      },
      hi: {
        title: 'इंटरनेट-जन्मा शैलियाँ',
        subtitle: 'Vaporwave, lo-fi, hyperpop',
        context: 'ऐसी शैलियाँ जो bedroom producers और streaming के बिना संभव नहीं थीं। Vaporwave ने 80\'s कॉर्पोरेट muzak को एक भुतहा रूप में खींचा। Lo-fi hip-hop ने J Dilla के swung timing को पढ़ाई-संगीत में बदला। Hyperpop ने trap, ska, happy-hardcore और nightcore को एक साथ टकराया। Future funk ने vaporwave की क़ब्र पर नाचा।',
      },
      ru: {
        title: 'Жанры, рождённые в интернете',
        subtitle: 'Vaporwave, lo-fi, hyperpop',
        context: 'Жанры, которых не было бы без bedroom-продюсеров и стриминга. Vaporwave растянул корпоративный muzak 80-х в нечто призрачное. Lo-fi hip-hop превратил свинг Джея Диллы в музыку для учёбы. Hyperpop столкнул trap, ска, happy-hardcore и nightcore. Future funk танцевал на могиле vaporwave.',
      },
    },
    patternIds: [
      'vaporwave', 'future-funk', 'lofi-hiphop-standard',
      'nightcore', 'hyperpop',
    ],
  },

  // ── Microtiming / feel ─────────────────────────────────────────────
  {
    id: 'the-swing-spectrum',
    title: 'The Swing Spectrum',
    subtitle: 'Straight → shuffled → fully swung, across traditions',
    context:
      "Swing isn't a jazz thing — it's a microtiming dimension every tradition tunes differently. The strokes on the page can be identical; where they actually land is the culture. Start straight with Detroit techno, walk the dial up through Cuban son, funk, and Dilla-style lag, then cross into explicit triplet territory: rockabilly shuffle, blues shuffle, Purdie half-time, and full jazz swing. The last four are 12/8 patterns — the triplet isn't a swing setting, it's baked into the grid.",
    i18n: {
      tr: {
        title: 'Swing Spektrumu',
        subtitle: 'Düz → shuffle → tam swing, gelenekler boyunca',
        context: 'Swing sadece caza özgü değildir — her geleneğin farklı ayarladığı bir mikro-zamanlama boyutudur. Sayfadaki vuruşlar aynı olabilir; gerçekten nereye düştüğü kültürdür. Detroit techno ile düz başla, Küba son\'u, funk ve Dilla tarzı lag\'a kadar kadranı yükselt, sonra açık üçleme bölgesine geç: rockabilly shuffle, blues shuffle, Purdie half-time ve tam jazz swing. Son dördü 12/8 desenlerdir — üçleme bir swing ayarı değil, doğrudan ızgaraya işlenmiştir.',
      },
      es: {
        title: 'El Espectro del Swing',
        subtitle: 'Recto → shuffle → plenamente swungueado, entre tradiciones',
        context: 'El swing no es cosa exclusiva del jazz — es una dimensión microtemporal que cada tradición afina distinto. Los golpes en la partitura pueden ser idénticos; dónde caen de verdad es la cultura. Empieza recto con techno de Detroit, sube el dial pasando por el son cubano, el funk y el lag a lo Dilla, luego cruza al territorio explícito del tresillo: shuffle rockabilly, shuffle de blues, Purdie half-time y full jazz swing. Los últimos cuatro son patrones en 12/8 — el tresillo no es un ajuste de swing, viene horneado en la cuadrícula.',
      },
      zh: {
        title: 'Swing 光谱',
        subtitle: '直拍 → shuffle → 完全 swing,贯穿各传统',
        context: 'Swing 不是爵士专利 —— 它是每个传统各自调校的微观时序维度。谱面上的击打可以一样,真正落在哪里就是文化。从底特律 techno 的直拍出发,顺着古巴 son、放克和 Dilla 式 lag 把刻度往上拨,然后跨入显式三连音地带:rockabilly shuffle、blues shuffle、Purdie half-time 与完整爵士 swing。最后四首是 12/8 节奏 —— 三连音并非 swing 设定,而是直接刻在网格里。',
      },
      fr: {
        title: 'Le Spectre du Swing',
        subtitle: 'Droit → chaloupé → pleinement swingué, à travers les traditions',
        context: 'Le swing n\'est pas qu\'une affaire de jazz — c\'est une dimension de micro-timing que chaque tradition règle différemment. Les frappes sur la page peuvent être identiques ; là où elles tombent vraiment, c\'est la culture. Commence droit avec la techno de Detroit, monte le cadran via le son cubain, le funk et le lag à la Dilla, puis franchis le territoire explicite du triolet : shuffle rockabilly, shuffle blues, Purdie half-time et full jazz swing. Les quatre derniers sont des motifs en 12/8 — le triolet n\'est pas un réglage de swing, il est cuit dans la grille.',
      },
      hi: {
        title: 'Swing स्पेक्ट्रम',
        subtitle: 'सीधा → shuffle → पूर्ण swing, परंपराओं भर',
        context: 'Swing सिर्फ़ jazz की बात नहीं — यह एक micro-timing आयाम है जिसे हर परंपरा अलग ढंग से सजाती है। पन्ने पर stroke समान हो सकते हैं; वे असल में कहाँ गिरते हैं — वही संस्कृति है। Detroit techno से सीधे शुरू करें, Cuban son, funk और Dilla जैसे lag से होते हुए dial बढ़ाएँ, फिर स्पष्ट triplet क्षेत्र में जाएँ: rockabilly shuffle, blues shuffle, Purdie half-time और पूरा jazz swing। अंतिम चार 12/8 पैटर्न हैं — triplet एक swing सेटिंग नहीं, ग्रिड में ही पका है।',
      },
      ru: {
        title: 'Спектр свинга',
        subtitle: 'Ровно → шафл → полный свинг, через традиции',
        context: 'Свинг — не только джаз. Это микротайминговое измерение, которое каждая традиция настраивает по-своему. На бумаге удары могут быть одинаковыми; где они реально приземлятся — это культура. Начни ровно с детройтского техно, прокрути циферблат через кубинский сон, фанк и диловский lag, а затем перейди в явную триольную зону: rockabilly shuffle, блюзовый шафл, Purdie half-time и полный джазовый свинг. Последние четыре — паттерны 12/8: триоль здесь не настройка свинга, а зашита прямо в сетку.',
      },
    },
    patternIds: [
      'techno-detroit',       // 0.50 — straight reference
      'son-clave',            // 0.52 — Cuban behind-the-beat
      'funk-funky-drummer',   // 0.55 — the Clyde Stubblefield push
      'lofi-hiphop-standard', // 0.58 — J Dilla lag
      'shuffle-rock',         // 12/8 pulse — rockabilly
      'blues-shuffle',        // 12/8 ding-a ride — electric blues
      'half-time-shuffle',    // 12/8 half-time — Purdie / Porcaro
      'jazz-swing-medium',    // 4/4 at 0.67 — full triplet, jazz comping
    ],
  },

  // ── Polyrhythm + rhythmic technique ───────────────────────────────
  {
    id: 'polyrhythm-progression',
    title: 'Polyrhythm Progression',
    subtitle: '3:2 up to 7:4, one step at a time',
    context:
      "Five pure polyrhythm exercises at increasing difficulty. Hemiola (3 over 2) is the easiest — three notes where two would go. Then 3:4 (triplets over quarters), 4:3, 5:4 (Carnatic khanda territory), and 7:4 (konnakol-level).",
    i18n: {
      tr: {
        title: 'Polyritmi Adım Adım',
        subtitle: '3:2\'den 7:4\'e, tek tek',
        context: 'Artan zorlukta beş saf polyritmi egzersizi. Hemiola (2 üstüne 3) en kolayıdır — iki notanın yerine üç. Sonra 3:4 (dörtlükler üstüne üçlemeler), 4:3, 5:4 (Carnatic khanda bölgesi) ve 7:4 (konnakol seviyesi).',
      },
      es: {
        title: 'Progresión Polirrítmica',
        subtitle: 'De 3:2 a 7:4, paso a paso',
        context: 'Cinco ejercicios de polirritmia pura, de dificultad creciente. La hemiola (3 sobre 2) es la más fácil — tres notas donde irían dos. Luego 3:4 (tresillos sobre negras), 4:3, 5:4 (territorio khanda carnático) y 7:4 (nivel konnakol).',
      },
      zh: {
        title: '复合节奏进阶',
        subtitle: '从 3:2 到 7:4,逐步推进',
        context: '五个难度递增的纯复合节奏练习。Hemiola（3 比 2）最简单 —— 在两拍位置塞入三音。然后是 3:4（三连音对四分音符）、4:3、5:4（卡纳提克 khanda 领域）以及 7:4（konnakol 级别）。',
      },
      fr: {
        title: 'Progression Polyrythmique',
        subtitle: 'Du 3:2 au 7:4, étape par étape',
        context: 'Cinq exercices de polyrythmie pure de difficulté croissante. L\'hémiole (3 contre 2) est la plus facile — trois notes là où il y en aurait deux. Ensuite 3:4 (triolets sur noires), 4:3, 5:4 (territoire khanda carnatique) et 7:4 (niveau konnakol).',
      },
      hi: {
        title: 'पॉलीरिदम प्रगति',
        subtitle: '3:2 से 7:4 तक, एक-एक कदम',
        context: 'बढ़ती कठिनाई के पाँच शुद्ध पॉलीरिदम अभ्यास। Hemiola (3 के ऊपर 2) सबसे आसान — जहाँ दो होतीं वहाँ तीन। फिर 3:4 (quarter पर triplet), 4:3, 5:4 (कर्नाटिक khanda क्षेत्र) और 7:4 (konnakol स्तर)।',
      },
      ru: {
        title: 'Прогрессия полиритма',
        subtitle: 'От 3:2 до 7:4, шаг за шагом',
        context: 'Пять чистых полиритмических упражнений по нарастающей сложности. Гемиола (3 на 2) — самая простая: три ноты там, где было бы две. Затем 3:4 (триоли против четвертей), 4:3, 5:4 (карнатская зона khanda) и 7:4 (уровень konnakol).',
      },
    },
    patternIds: [
      'hemiola-3-2', 'triplet-over-quarters', 'four-over-three',
      'five-over-four', 'seven-over-four',
    ],
  },
];
