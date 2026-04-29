import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Scenario, UserProfile } from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson, tryParseJson } from '../services/json';
import { colors } from '../theme/colors';
import { useAppTranslation } from '../i18n';

type GrammarLesson = { title: string; rule: string; examples: { sentence: string; translation: string; }[]; tip: string; };
type PhraseSupportSection = { title: string; phrases: Array<{ phrase: string; meaning: string; usage: string }> };
type Props = { onBack: () => void; scenarioTitle?: string; stageType?: string; scenario?: Scenario; };

const ACCORDION_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const buildPhraseSupportSections = (scenario: Scenario | undefined): PhraseSupportSection[] => {
  const useful = scenario?.usefulPhrases?.slice(0, 4).map(item => ({
    phrase: item.phrase,
    meaning: item.context,
    usage: 'Bu sahnede doğal cevap kurarken kullan.',
  })) ?? [];

  return [
    {
      title: 'İşe yarayan ifadeler',
      phrases: useful.length > 0 ? useful : [
        { phrase: 'Could you repeat that, please?', meaning: 'Tekrar eder misiniz?', usage: 'Cümleyi tam duymadığında.' },
        { phrase: 'I just want to confirm.', meaning: 'Sadece teyit etmek istiyorum.', usage: 'Yanlış anlamamak için.' },
        { phrase: 'Could you help me with this?', meaning: 'Bu konuda yardımcı olur musunuz?', usage: 'Karşı taraftan destek isterken.' },
      ],
    },
    {
      title: 'Kurtarıcı cümleler',
      phrases: [
        { phrase: 'I didn’t quite catch that.', meaning: 'Tam anlayamadım.', usage: 'Konuşma hızlandığında akışı koparmadan durdurmak için.' },
        { phrase: 'Could you say it another way?', meaning: 'Bunu başka şekilde söyleyebilir misiniz?', usage: 'Aynı cümle tekrar edilse de anlamadığında.' },
        { phrase: 'One moment, let me think.', meaning: 'Bir saniye, düşüneyim.', usage: 'Cevap vermeden önce zaman kazanmak için.' },
      ],
    },
  ];
};

const firstPhrase = (scenario: Scenario | undefined, fallback: string) =>
  scenario?.usefulPhrases?.[0]?.phrase ?? fallback;

const secondPhrase = (scenario: Scenario | undefined, fallback: string) =>
  scenario?.usefulPhrases?.[1]?.phrase ?? fallback;

const buildScenarioOfflineLessons = (scenario: Scenario, langName: string): GrammarLesson[] => {
  const stageType = scenario.stageType ?? 'social';
  const phraseA = firstPhrase(scenario, langName === 'English' ? 'Could I get a coffee, please?' : scenario.openingMessage);
  const phraseB = secondPhrase(scenario, langName === 'English' ? 'I see your point, but I need a little more context.' : phraseA);
  const beat = scenario.dramaticBeats?.[0] ?? scenario.baseSituation ?? scenario.mission ?? scenario.title;
  const vocab = scenario.vocabularyFocus ?? scenario.vocabHints?.map(v => v.word).slice(0, 3).join(', ') ?? 'sahne kelimeleri';

  if (stageType === 'business') {
    return [
      {
        title: 'Yumuşak itiraz kur',
        rule: 'İş sahnesinde direkt karşı çıkmak yerine önce karşı tarafı duyduğunu göster, sonra kendi noktana geç.',
        examples: [
          { sentence: phraseB, translation: 'Fikrini daha yumuşak bir geçişle savun.' },
          { sentence: 'I see your point, but I’d suggest one change.', translation: 'Ne demek istediğini anlıyorum ama bir değişiklik önereceğim.' },
        ],
        tip: `${beat} anında önce kabul sinyali ver, sonra önerini ekle.`,
      },
      {
        title: 'Gerekçe ekle',
        rule: 'Profesyonel cevaplar tek cümlede kalınca sert duyulabilir. Çünkü/örnek/sonuç eklemek tonu dengeler.',
        examples: [
          { sentence: phraseA, translation: 'Sahnede kullanacağın ana cümle.' },
          { sentence: 'The reason is that the timeline is tight.', translation: 'Sebebi takvimin sıkışık olması.' },
        ],
        tip: `Odak kelimeler: ${vocab}. Birini gerekçeye bağla.`,
      },
    ];
  }

  if (stageType === 'travel' || stageType === 'survival') {
    return [
      {
        title: 'Yön ve yardım sorusu',
        rule: 'Seyahat sahnesinde kısa emir yerine nazik soru kalıbı kullan. Bu hem anlaşılır hem güvenli duyulur.',
        examples: [
          { sentence: phraseA, translation: 'Sahnedeki temel yardım cümlesi.' },
          { sentence: 'How do I get to the station?', translation: 'İstasyona nasıl giderim?' },
        ],
        tip: `${beat} anında konumu, hedefi ve ricayı aynı cümlede tut.`,
      },
      {
        title: 'Teyit al',
        rule: 'Yanlış anlamayı azaltmak için cevabı duyduktan sonra kısa bir teyit cümlesi kur.',
        examples: [
          { sentence: phraseB, translation: 'Teyit veya devam cümlesi.' },
          { sentence: 'So I should take this line, right?', translation: 'Yani bu hattı kullanmalıyım, doğru mu?' },
        ],
        tip: `Odak kelimeler: ${vocab}. Teyit cümlesinde birini kullan.`,
      },
    ];
  }

  if (stageType === 'cafe') {
    return [
      {
        title: 'Nazik istek',
        rule: 'Kafe sahnesinde “istiyorum” anlaşılır ama “rica ederim / alabilir miyim” daha doğal duyulur.',
        examples: [
          { sentence: phraseA, translation: 'Sipariş verirken kullanacağın doğal cümle.' },
          { sentence: 'Could I get a coffee, please?', translation: 'Bir kahve alabilir miyim, lütfen?' },
        ],
        tip: `${beat} anında isteği kısa tut, sona nezaket ekle.`,
      },
      {
        title: 'Ek soru cevapla',
        rule: 'Barista ek soru sorduğunda tek kelime yerine kısa tercih cümlesi kurmak akışı temizler.',
        examples: [
          { sentence: phraseB, translation: 'Tercih belirtme cümlesi.' },
          { sentence: 'With milk, please.', translation: 'Sütlü olsun, lütfen.' },
        ],
        tip: `Odak kelimeler: ${vocab}. Tercihi net ve sakin söyle.`,
      },
    ];
  }

  return [
    {
      title: 'Sahneye uygun ton',
      rule: 'Bu sahnede amaç doğru çeviri değil; karşı tarafla ilişkiye uygun cümle kurmak.',
      examples: [
        { sentence: phraseA, translation: 'Bu sahnede kullanabileceğin doğal cümle.' },
        { sentence: phraseB, translation: 'Aynı akışı sürdüren ikinci cümle.' },
      ],
      tip: `${beat} anında önce akışı koru, sonra detay ekle.`,
    },
    {
      title: 'Kısa cevap yerine bağla',
      rule: 'Tek kelimelik cevaplar konuşmayı durdurur. Bir neden, tercih veya takip sorusu ekle.',
      examples: [
        { sentence: phraseB, translation: 'Konuşmayı ileri taşıyan cümle.' },
        { sentence: 'Can you tell me a little more?', translation: 'Biraz daha anlatabilir misiniz?' },
      ],
      tip: `Odak kelimeler: ${vocab}. Cevaba bir tanesini doğalca bağla.`,
    },
  ];
};

const buildOfflineLessons = (langName: string): GrammarLesson[] => {
  const l = langName.toLowerCase();

  if (/spanish|ispanyol|español/.test(l)) return [
    {
      title: 'Nazik İstek: Quiero vs Quisiera',
      rule: '"Quiero" anlaşılır ama direkt gelir. "Quisiera" daha nazik ve sosyal olarak daha doğal.',
      examples: [
        { sentence: 'Quisiera un café, por favor.', translation: 'Bir kahve rica ederim, lütfen.' },
        { sentence: 'Quiero un café.', translation: 'Bir kahve istiyorum.' },
      ],
      tip: 'Yeni biriyle konuşurken bir adım daha nazik tonda başla.',
    },
    {
      title: 'Ser vs Estar: İki "Olmak" Fiili',
      rule: '"Ser" kalıcı özellikler için, "estar" geçici durumlar için kullanılır.',
      examples: [
        { sentence: 'Estoy cansado hoy.', translation: 'Bugün yorgunum. (geçici)' },
        { sentence: 'Soy estudiante.', translation: 'Öğrenciyim. (kalıcı)' },
      ],
      tip: 'His ve durumlar için estar, kimlik ve özellikler için ser.',
    },
    {
      title: 'Soru Kalıbı: ¿Dónde está...?',
      rule: 'Yol/yön sorarken en pratik kalıp "¿Dónde está...?" ile başlar.',
      examples: [
        { sentence: '¿Dónde está la estación?', translation: 'İstasyon nerede?' },
        { sentence: '¿Dónde está el baño?', translation: 'Tuvalet nerede?' },
      ],
      tip: 'Kalıbı ezberle, sadece son kelimeyi değiştirerek onlarca soru kurarsın.',
    },
    {
      title: 'Bağlaçlarla Akışı Uzat',
      rule: '"pero", "porque", "entonces" gibi bağlaçlar cümleyi doğal hale getirir.',
      examples: [
        { sentence: 'Quiero ir, pero estoy cansado.', translation: 'Gitmek istiyorum ama yorgunum.' },
        { sentence: 'No fui porque estaba enfermo.', translation: 'Gitmedim çünkü hastaydım.' },
      ],
      tip: 'Tek cümlelik cevap yerine bağlaçla ikinci parça ekle.',
    },
  ];

  if (/french|fransız|français/.test(l)) return [
    {
      title: 'Avoir vs Être: "Olmak" ve "Sahip Olmak"',
      rule: 'Fransızcada "avoir" (sahip olmak) pek çok durumda Türkçedeki "olmak" gibi kullanılır.',
      examples: [
        { sentence: 'J\'ai faim.', translation: 'Açım. (lit: açlığım var)' },
        { sentence: 'J\'ai froid.', translation: 'Üşüyorum. (lit: soğuğum var)' },
      ],
      tip: 'Açlık, susuzluk, sıcaklık hisleri için avoir kullanılır, être değil.',
    },
    {
      title: 'Kibarca Sipariş: Je voudrais',
      rule: '"Je veux" direkt ve biraz kabalır. "Je voudrais" çok daha nazik bir alternatif.',
      examples: [
        { sentence: 'Je voudrais un café, s\'il vous plaît.', translation: 'Bir kahve rica ederim, lütfen.' },
        { sentence: 'Je voudrais réserver une table.', translation: 'Bir masa rezerve etmek istiyorum.' },
      ],
      tip: 'Restoran ve otellerde her zaman je voudrais kullan.',
    },
    {
      title: 'Passé Composé: Geçmiş Zaman',
      rule: 'Geçmişte tamamlanan eylemler için avoir veya être + participe passé kullanılır.',
      examples: [
        { sentence: 'J\'ai mangé au restaurant hier.', translation: 'Dün restoranda yedim.' },
        { sentence: 'Je suis allé à Paris.', translation: 'Paris\'e gittim.' },
      ],
      tip: 'Hareket fiilleri (aller, venir, partir...) être ile, geri kalanlar avoir ile kullanılır.',
    },
    {
      title: 'Bağlaçlarla Akışı Güçlendir',
      rule: '"mais", "parce que", "donc" gibi bağlaçlar konuşmayı doğallaştırır.',
      examples: [
        { sentence: 'Je veux venir, mais je suis fatigué.', translation: 'Gelmek istiyorum ama yorgunum.' },
        { sentence: 'Je reste parce qu\'il fait froid.', translation: 'Soğuk olduğu için kalıyorum.' },
      ],
      tip: 'Her kısa cevabın arkasına bir bağlaçla devam ekle.',
    },
  ];

  if (/german|alman|deutsch/.test(l)) return [
    {
      title: 'Kibarca Sipariş: Ich möchte',
      rule: '"Ich will" doğrudan ve biraz serttir. "Ich möchte" çok daha kibar.',
      examples: [
        { sentence: 'Ich möchte einen Kaffee, bitte.', translation: 'Bir kahve istiyorum, lütfen.' },
        { sentence: 'Ich möchte die Rechnung, bitte.', translation: 'Hesabı istiyorum, lütfen.' },
      ],
      tip: 'Yabancılarla konuşurken her zaman möchte kullan.',
    },
    {
      title: 'Haben vs Sein: İki Temel Fiil',
      rule: '"Haben" sahip olmak için, "sein" var olmak/durum belirtmek için.',
      examples: [
        { sentence: 'Ich habe Hunger.', translation: 'Açım. (lit: açlığım var)' },
        { sentence: 'Ich bin müde.', translation: 'Yorgunum.' },
      ],
      tip: 'Açlık, susuzluk, ağrı için haben; his ve durum için sein.',
    },
    {
      title: 'Soru Kalıpları: Wo / Wie / Was',
      rule: 'W-soruları Almancada fiil ikinci sıradadır.',
      examples: [
        { sentence: 'Wo ist der Bahnhof?', translation: 'İstasyon nerede?' },
        { sentence: 'Wie komme ich zum Hotel?', translation: 'Otele nasıl gidebilirim?' },
      ],
      tip: 'W-sorusunu öğren, fiilin ikinci sıraya geldiğini unutma.',
    },
    {
      title: 'Bağlaçlarla Akıcı Konuş',
      rule: '"aber", "weil", "deshalb" gibi bağlaçlar cümleyi zenginleştirir.',
      examples: [
        { sentence: 'Ich möchte kommen, aber ich bin müde.', translation: 'Gelmek istiyorum ama yorgunum.' },
        { sentence: 'Ich bleibe, weil es kalt ist.', translation: 'Soğuk olduğu için kalıyorum.' },
      ],
      tip: 'Dikkat: weil cümlelerinde fiil sona gider.',
    },
  ];

  if (/italian|italyan|italiano/.test(l)) return [
    {
      title: 'Kibarca Sipariş: Vorrei',
      rule: '"Voglio" direkt ve biraz kabalır. "Vorrei" çok daha nazik bir sipariş kalıbı.',
      examples: [
        { sentence: 'Vorrei un caffè, per favore.', translation: 'Bir kahve rica ederim, lütfen.' },
        { sentence: 'Vorrei prenotare un tavolo.', translation: 'Bir masa rezerve etmek istiyorum.' },
      ],
      tip: 'Restoran ve kafelerde her zaman vorrei ile başla.',
    },
    {
      title: 'Avere vs Essere: İki "Olmak"',
      rule: '"Avere" (sahip olmak) Türkçede "olmak" gibi kullanıldığı durumlar var.',
      examples: [
        { sentence: 'Ho fame.', translation: 'Açım. (lit: açlığım var)' },
        { sentence: 'Ho freddo.', translation: 'Üşüyorum. (lit: soğuğum var)' },
      ],
      tip: 'Açlık, susuzluk, sıcaklık, yaş için avere kullanılır.',
    },
    {
      title: 'Passato Prossimo: Geçmiş Zaman',
      rule: 'Tamamlanan eylemler için avere veya essere + participio passato.',
      examples: [
        { sentence: 'Ho mangiato al ristorante ieri.', translation: 'Dün restoranda yedim.' },
        { sentence: 'Sono andato a Roma.', translation: 'Roma\'ya gittim.' },
      ],
      tip: 'Hareket fiilleri (andare, venire...) essere ile; geri kalanlar avere ile kullanılır.',
    },
    {
      title: 'Bağlaçlarla Akışı Güçlendir',
      rule: '"ma", "perché", "quindi" bağlaçları konuşmayı doğallaştırır.',
      examples: [
        { sentence: 'Voglio venire, ma sono stanco.', translation: 'Gelmek istiyorum ama yorgunum.' },
        { sentence: 'Resto perché fa freddo.', translation: 'Soğuk olduğu için kalıyorum.' },
      ],
      tip: 'Her kısa cevabın arkasına bir bağlaç ve devam ekle.',
    },
  ];

  if (/portuguese|portekiz|português|portugues/.test(l)) return [
    {
      title: 'Kibarca Sipariş: Eu gostaria',
      rule: '"Eu quero" anlaşılır ama direkt gelir. "Eu gostaria" daha nazik bir sipariş kalıbıdır.',
      examples: [
        { sentence: 'Eu gostaria de um café, por favor.', translation: 'Bir kahve rica ederim, lütfen.' },
        { sentence: 'Eu gostaria de reservar uma mesa.', translation: 'Bir masa rezerve etmek istiyorum.' },
      ],
      tip: 'Restoran ve kafelerde eu gostaria ile başla.',
    },
    {
      title: 'Ter vs Ser/Estar: Türkçedeki "Olmak"',
      rule: 'Portekizcede açlık, yaş ve bazı hisler için "ter" kullanılır.',
      examples: [
        { sentence: 'Tenho fome.', translation: 'Açım. (lit: açlığım var)' },
        { sentence: 'Tenho vinte anos.', translation: 'Yirmi yaşındayım.' },
      ],
      tip: 'Açlık, susuzluk, yaş için ser/estar değil ter kullan.',
    },
    {
      title: 'Soru Kalıpları: Onde / Como / Quanto',
      rule: 'Günlük sahnelerde yer, yöntem ve fiyat soruları bu üç kalıpla hızlı kurulur.',
      examples: [
        { sentence: 'Onde fica a estação?', translation: 'İstasyon nerede?' },
        { sentence: 'Quanto custa?', translation: 'Ne kadar tutuyor?' },
      ],
      tip: 'Yön için onde fica, fiyat için quanto custa ezberle.',
    },
    {
      title: 'Bağlaçlarla Akışı Güçlendir',
      rule: '"mas", "porque", "então" gibi bağlaçlar kısa cevapları doğal konuşmaya çevirir.',
      examples: [
        { sentence: 'Quero ir, mas estou cansado.', translation: 'Gitmek istiyorum ama yorgunum.' },
        { sentence: 'Fiquei em casa porque estava tarde.', translation: 'Geç olduğu için evde kaldım.' },
      ],
      tip: 'Kısa cevabın arkasına mas/porque/então ile bir parça daha ekle.',
    },
  ];

  // Default: English
  return [
    {
      title: 'Polite Requests',
      rule: '"I want" is understood but direct. "Could I get / I\'d like" sounds far more natural.',
      examples: [
        { sentence: 'Could I get a coffee, please?', translation: 'Bir kahve alabilir miyim, lütfen?' },
        { sentence: 'I\'d like a table for two.', translation: 'İki kişilik bir masa istiyorum.' },
      ],
      tip: 'Default to "could" or "I\'d like" when speaking to strangers.',
    },
    {
      title: 'Useful Question Frame',
      rule: 'Memorise one frame and swap the last word.',
      examples: [
        { sentence: 'Where is the station?', translation: 'İstasyon nerede?' },
        { sentence: 'Where is the nearest exit?', translation: 'En yakın çıkış nerede?' },
      ],
      tip: 'Fixed frames reduce hesitation under pressure.',
    },
    {
      title: 'Time Anchors',
      rule: 'Adding a time word at the start makes tense immediately clear.',
      examples: [
        { sentence: 'Yesterday I called my manager.', translation: 'Dün yöneticimi aradım.' },
        { sentence: 'A minute ago I finished.', translation: 'Az önce bitirdim.' },
      ],
      tip: 'Say the time word first — it sets context before the verb.',
    },
    {
      title: 'Connect Ideas Naturally',
      rule: '"but", "because", "so" turn short answers into fluent speech.',
      examples: [
        { sentence: 'I want to go, but I\'m tired.', translation: 'Gitmek istiyorum ama yorgunum.' },
        { sentence: 'I stayed home because it was late.', translation: 'Geç olduğu için evde kaldım.' },
      ],
      tip: 'Add one connector to every short answer.',
    },
  ];
};

export default function GrammarScreen({ onBack, scenarioTitle, stageType, scenario }: Props) {
  const t = useAppTranslation();
  const [lessons, setLessons] = useState<GrammarLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number>(0);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => { loadGrammar(); }, []);

  const loadGrammar = async () => {
    setLoading(true); setError('');
    try {
      const profileData = await AsyncStorage.getItem('userProfile');
      if (!profileData) { setError(t('common.notReadyProfile')); setLoading(false); return; }

      const p = tryParseJson<UserProfile>(profileData);
      if (!p) {
        await AsyncStorage.removeItem('userProfile');
        setError(t('common.notReadyProfile'));
        setLoading(false);
        return;
      }
      setProfile(p);
      const nativeLang = p.nativeLanguage?.name ?? 'English';
      const langName = p.language?.name ?? 'English';
      const goalDesc = p.goalDescription ?? '';

      const activeScenarioTitle = scenario?.title ?? scenarioTitle;
      const scenarioVersion = scenario
        ? `${scenario.id}_${scenario.grammarFocus ?? 'no-focus'}_${scenario.vocabularyFocus ?? 'no-vocab'}`
        : activeScenarioTitle?.replace(/\s+/g, '-').toLowerCase();
      const scenarioSlug = scenarioVersion ? `_${scenarioVersion}` : '';
      const cacheKey = `grammar_${p.language?.code}_${new Date().toDateString()}${scenarioSlug}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const cachedLessons = tryParseJson<GrammarLesson[]>(cached);
        if (cachedLessons?.length) {
          setLessons(cachedLessons);
          setLoading(false);
          return;
        }
        await AsyncStorage.removeItem(cacheKey);
      }

      const activeTitle = scenario?.title ?? scenarioTitle;
      const activeStageType = scenario?.stageType ?? stageType;
      const grammarFocus = scenario?.grammarFocus;
      const vocabFocus = scenario?.vocabularyFocus;
      const usefulPhrases = scenario?.usefulPhrases?.slice(0, 3).map(p => `"${p.phrase}" (${p.context})`).join('; ') ?? '';

      let sceneContext = activeTitle
        ? `Focus on grammar patterns used in a "${activeTitle}" scene (${activeStageType ?? 'general'} context).`
        : 'Make lessons practical and scenario-based.';
      if (grammarFocus) sceneContext += `\nPrioritise this grammar focus: ${grammarFocus}.`;
      if (vocabFocus) sceneContext += `\nKey vocabulary area: ${vocabFocus}.`;
      if (usefulPhrases) sceneContext += `\nScene phrases to anchor lessons around: ${usefulPhrases}.`;

      const prompt = `Create 4 grammar lessons for ${langName} learners focused on real conversation scenarios.
Context: user goal is "${goalDesc}". Explain in ${nativeLang}.
${sceneContext}
Each lesson should feel like rehearsing a real moment, not studying. Teach the difference between what sounds natural and what sounds awkward or overly direct.
Return ONLY valid JSON array:
[{"title":"...","rule":"(explanation in ${nativeLang})","examples":[{"sentence":"(${langName})","translation":"(${nativeLang})"},{"sentence":"...","translation":"..."}],"tip":"(practical tip in ${nativeLang})"}]`;

      const response = await sendMessage([{ id: '1', role: 'user', content: prompt, timestamp: new Date() }], '', { maxTokens: 1700 });
      const parsed = parseModelJson<GrammarLesson[]>(response, 'array');
      if (parsed?.length) {
        setLessons(parsed);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(parsed));
      } else {
        setLessons(scenario ? buildScenarioOfflineLessons(scenario, langName) : buildOfflineLessons(langName));
        setError('');
      }
    } catch (e: any) {
      const msg = String(e?.message ?? 'Bilinmeyen hata');
      if (scenario) {
        const profileData = await AsyncStorage.getItem('userProfile');
        const p = profileData ? tryParseJson<UserProfile>(profileData) : null;
        setLessons(buildScenarioOfflineLessons(scenario, p?.language?.name ?? 'English'));
        setError('');
      } else if (msg.includes('EXPO_PUBLIC_ANTHROPIC_API_KEY')) {
        const profileData = await AsyncStorage.getItem('userProfile');
        const p = profileData ? tryParseJson<UserProfile>(profileData) : null;
        setLessons(buildOfflineLessons(p?.language?.name ?? 'English'));
        setError('');
      } else {
        setError(`Hata: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {scenario ? 'Bu sahnede işine yarayacak yapı' : `📚 ${t('learn.patterns')}`}
        </Text>
      </View>
      <Text style={styles.subtitle}>
        {scenario
          ? `"${scenario.title}" · ${scenario.grammarFocus ? scenario.grammarFocus.split(' — ')[0] : 'Sahne kalıpları'} · `
          : scenarioTitle
            ? `"${scenarioTitle}" sahnesi · `
            : 'Kural + örnek mini dersler · '}
        {profile?.language?.flag} {profile?.language?.name}
      </Text>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accentWarm} />
          <Text style={styles.loadingText}>{t('learn.patterns')}...</Text>
        </View>
      )}

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadGrammar} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {lessons.map((lesson, i) => (
        <GrammarLessonAccordion
          key={i}
          lesson={lesson}
          index={i}
          expanded={expanded === i}
          onToggle={() => setExpanded(expanded === i ? -1 : i)}
        />
      ))}

      {lessons.length > 0 && (
        <>
          <Text style={styles.supportSectionTitle}>Sahne ifadeleri</Text>
          {buildPhraseSupportSections(scenario).map((section, i) => (
            <PhraseSupportAccordion
              key={section.title}
              section={section}
              expanded={expanded === lessons.length + i}
              onToggle={() => setExpanded(expanded === lessons.length + i ? -1 : lessons.length + i)}
            />
          ))}
        </>
      )}

      {lessons.length > 0 && (
        <TouchableOpacity style={styles.refreshBtn} onPress={async () => {
          if (profile) {
            const activeT = scenario?.title ?? scenarioTitle;
            const version = scenario
              ? `${scenario.id}_${scenario.grammarFocus ?? 'no-focus'}_${scenario.vocabularyFocus ?? 'no-vocab'}`
              : activeT?.replace(/\s+/g, '-').toLowerCase();
            const slug = version ? `_${version}` : '';
            await AsyncStorage.removeItem(`grammar_${profile.language?.code}_${new Date().toDateString()}${slug}`);
          }
          loadGrammar();
        }}>
          <Text style={styles.refreshText}>🔄 Yeni Kalıplar</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function GrammarLessonAccordion({
  lesson,
  index,
  expanded,
  onToggle,
}: {
  lesson: GrammarLesson;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const anim = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const fallbackHeight = 230 + (lesson.examples?.length ?? 0) * 76;
  const bodyHeight = measuredHeight || fallbackHeight;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: expanded ? 1 : 0,
      duration: 420,
      easing: ACCORDION_EASE,
      useNativeDriver: false,
    }).start();
  }, [anim, expanded]);

  return (
    <View style={styles.lessonCard}>
      <TouchableOpacity style={styles.lessonHeader} onPress={onToggle} activeOpacity={0.82}>
        <View style={styles.lessonNum}>
          <Text style={styles.lessonNumText}>{index + 1}</Text>
        </View>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Animated.Text
          style={[
            styles.chevron,
            {
              transform: [{
                rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
              }],
            },
          ]}
        >
          ▼
        </Animated.Text>
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.lessonBodyWrap,
          {
            height: anim.interpolate({ inputRange: [0, 1], outputRange: [0, bodyHeight] }),
            opacity: anim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.lessonBody,
            {
              transform: [{
                translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }),
              }],
            },
          ]}
          onLayout={(event) => {
            const nextHeight = Math.ceil(event.nativeEvent.layout.height);
            setMeasuredHeight(prev => (prev === nextHeight ? prev : nextHeight));
          }}
        >
          <Text style={styles.ruleText}>{lesson.rule}</Text>
          <Text style={styles.examplesLabel}>Örnekler</Text>
          {lesson.examples?.map((ex, j) => (
            <View key={j} style={styles.exampleRow}>
              <Text style={styles.exSentence}>{ex.sentence}</Text>
              <Text style={styles.exTranslation}>{ex.translation}</Text>
            </View>
          ))}
          <View style={styles.tipBox}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>{lesson.tip}</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function PhraseSupportAccordion({
  section,
  expanded,
  onToggle,
}: {
  section: PhraseSupportSection;
  expanded: boolean;
  onToggle: () => void;
}) {
  const anim = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const fallbackHeight = Math.max(0, section.phrases.length * 108 + 24);
  const bodyHeight = measuredHeight || fallbackHeight;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: expanded ? 1 : 0,
      duration: 420,
      easing: ACCORDION_EASE,
      useNativeDriver: false,
    }).start();
  }, [anim, expanded]);

  return (
    <View style={styles.lessonCard}>
      <TouchableOpacity style={styles.lessonHeader} onPress={onToggle} activeOpacity={0.82}>
        <View style={styles.lessonNum}>
          <Text style={styles.lessonNumText}>＋</Text>
        </View>
        <Text style={styles.lessonTitle}>{section.title}</Text>
        <Animated.Text
          style={[
            styles.chevron,
            { transform: [{ rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] },
          ]}
        >
          ▼
        </Animated.Text>
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.lessonBodyWrap,
          {
            height: anim.interpolate({ inputRange: [0, 1], outputRange: [0, bodyHeight] }),
            opacity: anim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.lessonBody,
            { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] },
          ]}
          onLayout={(event) => {
            const nextHeight = Math.ceil(event.nativeEvent.layout.height);
            setMeasuredHeight(prev => (prev === nextHeight ? prev : nextHeight));
          }}
        >
          {section.phrases.map((item, idx) => (
            <View key={`${item.phrase}-${idx}`} style={styles.exampleRow}>
              <Text style={styles.exSentence}>{item.phrase}</Text>
              <Text style={styles.exTranslation}>{item.meaning}</Text>
              <Text style={styles.supportUsage}>{item.usage}</Text>
            </View>
          ))}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgMid, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.hairlineStrong },
  backText: { fontSize: 20, color: colors.inkPrimary },
  title: { fontSize: 22, fontFamily: 'InterTight_600SemiBold', color: colors.inkPrimary },
  subtitle: { fontSize: 14, color: colors.inkSecondary, marginBottom: 28 },
  supportSectionTitle: { fontSize: 11, fontFamily: 'InterTight_600SemiBold', color: colors.accentWarm, letterSpacing: 2.2, textTransform: 'uppercase', marginTop: 10, marginBottom: 10 },
  center: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: colors.inkSecondary, fontSize: 14 },
  lessonCard: { backgroundColor: colors.bgMid, borderRadius: 18, marginBottom: 12, borderWidth: 1.5, borderColor: colors.hairlineStrong, overflow: 'hidden' },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12 },
  lessonNum: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bgSoft, alignItems: 'center', justifyContent: 'center' },
  lessonNumText: { color: colors.accentWarm, fontFamily: 'InterTight_600SemiBold', fontSize: 14 },
  lessonTitle: { flex: 1, fontSize: 16, fontFamily: 'InterTight_600SemiBold', color: colors.inkPrimary },
  chevron: { color: colors.inkTertiary, fontSize: 12 },
  lessonBodyWrap: { overflow: 'hidden', borderTopWidth: 1, borderTopColor: colors.hairline },
  lessonBody: { paddingHorizontal: 18, paddingBottom: 18, gap: 14, paddingTop: 16 },
  ruleText: { fontSize: 14, color: colors.inkSecondary, lineHeight: 22 },
  examplesLabel: { fontSize: 11, fontFamily: 'InterTight_600SemiBold', color: colors.accentWarm, letterSpacing: 1.2 },
  exampleRow: { backgroundColor: colors.bgMid, borderRadius: 12, padding: 14, gap: 4 },
  exSentence: { fontSize: 15, color: colors.inkPrimary, fontFamily: 'InterTight_600SemiBold' },
  exTranslation: { fontSize: 13, color: colors.inkSecondary },
  tipBox: { flexDirection: 'row', gap: 8, backgroundColor: colors.bgSoft, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.hairlineStrong },
  tipIcon: { fontSize: 16 },
  tipText: { flex: 1, fontSize: 13, color: colors.accentWarm, lineHeight: 20 },
  supportUsage: { fontSize: 12, color: colors.inkTertiary, marginTop: 4 },
  errorBox: { alignItems: 'center', padding: 24, gap: 12 },
  errorText: { color: colors.errorDs, fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.accentWarm, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: colors.bgDeep, fontFamily: 'InterTight_600SemiBold' },
  refreshBtn: { backgroundColor: colors.bgMid, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.hairlineStrong, marginTop: 8 },
  refreshText: { color: colors.accentWarm, fontFamily: 'InterTight_600SemiBold', fontSize: 15 },
});
