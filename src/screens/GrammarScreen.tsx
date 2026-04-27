import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson, tryParseJson } from '../services/json';
import { colors } from '../theme/colors';
import { useAppTranslation } from '../i18n';

type GrammarLesson = { title: string; rule: string; examples: { sentence: string; translation: string; }[]; tip: string; };
type Props = { onBack: () => void; scenarioTitle?: string; stageType?: string; };

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

export default function GrammarScreen({ onBack, scenarioTitle, stageType }: Props) {
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

      const scenarioSlug = scenarioTitle ? `_${scenarioTitle.replace(/\s+/g, '-').toLowerCase()}` : '';
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

      const sceneContext = scenarioTitle ? `Focus on grammar patterns used in a "${scenarioTitle}" scene (${stageType ?? 'general'} context).` : 'Make lessons practical and scenario-based.';
      const prompt = `Create 4 beginner grammar lessons for ${langName} learners.
Context: user goal is "${goalDesc}". Explain in ${nativeLang}.
${sceneContext}
Return ONLY valid JSON array:
[{"title":"...","rule":"(explanation in ${nativeLang})","examples":[{"sentence":"(${langName})","translation":"(${nativeLang})"},{"sentence":"...","translation":"..."}],"tip":"(practical tip in ${nativeLang})"}]`;

      const response = await sendMessage([{ id: '1', role: 'user', content: prompt, timestamp: new Date() }], '', { maxTokens: 1700 });
      const parsed = parseModelJson<GrammarLesson[]>(response, 'array');
      if (parsed?.length) {
        setLessons(parsed);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(parsed));
      } else {
        setError(t('common.retry'));
      }
    } catch (e: any) {
      const msg = String(e?.message ?? 'Bilinmeyen hata');
      if (msg.includes('EXPO_PUBLIC_ANTHROPIC_API_KEY')) {
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
        <Text style={styles.title}>📚 {t('learn.patterns')}</Text>
      </View>
      <Text style={styles.subtitle}>
        {scenarioTitle ? `"${scenarioTitle}" sahnesi · ` : 'Kural + örnek mini dersler · '}
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
        <View key={i} style={styles.lessonCard}>
          <TouchableOpacity style={styles.lessonHeader} onPress={() => setExpanded(expanded === i ? -1 : i)}>
            <View style={styles.lessonNum}>
              <Text style={styles.lessonNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
            <Text style={styles.chevron}>{expanded === i ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {expanded === i && (
            <View style={styles.lessonBody}>
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
            </View>
          )}
        </View>
      ))}

      {lessons.length > 0 && (
        <TouchableOpacity style={styles.refreshBtn} onPress={async () => {
          if (profile) {
            const slug = scenarioTitle ? `_${scenarioTitle.replace(/\s+/g, '-').toLowerCase()}` : '';
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgMid, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.hairlineStrong },
  backText: { fontSize: 20, color: colors.inkPrimary },
  title: { fontSize: 22, fontFamily: 'InterTight_600SemiBold', color: colors.inkPrimary },
  subtitle: { fontSize: 14, color: colors.inkSecondary, marginBottom: 28 },
  center: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: colors.inkSecondary, fontSize: 14 },
  lessonCard: { backgroundColor: colors.bgMid, borderRadius: 18, marginBottom: 12, borderWidth: 1.5, borderColor: colors.hairlineStrong, overflow: 'hidden' },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12 },
  lessonNum: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bgSoft, alignItems: 'center', justifyContent: 'center' },
  lessonNumText: { color: colors.accentWarm, fontFamily: 'InterTight_600SemiBold', fontSize: 14 },
  lessonTitle: { flex: 1, fontSize: 16, fontFamily: 'InterTight_600SemiBold', color: colors.inkPrimary },
  chevron: { color: colors.inkTertiary, fontSize: 12 },
  lessonBody: { paddingHorizontal: 18, paddingBottom: 18, gap: 14, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 16 },
  ruleText: { fontSize: 14, color: colors.inkSecondary, lineHeight: 22 },
  examplesLabel: { fontSize: 11, fontFamily: 'InterTight_600SemiBold', color: colors.accentWarm, letterSpacing: 1.2 },
  exampleRow: { backgroundColor: colors.bgMid, borderRadius: 12, padding: 14, gap: 4 },
  exSentence: { fontSize: 15, color: colors.inkPrimary, fontFamily: 'InterTight_600SemiBold' },
  exTranslation: { fontSize: 13, color: colors.inkSecondary },
  tipBox: { flexDirection: 'row', gap: 8, backgroundColor: colors.bgSoft, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.hairlineStrong },
  tipIcon: { fontSize: 16 },
  tipText: { flex: 1, fontSize: 13, color: colors.accentWarm, lineHeight: 20 },
  errorBox: { alignItems: 'center', padding: 24, gap: 12 },
  errorText: { color: colors.errorDs, fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.accentWarm, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: colors.bgDeep, fontFamily: 'InterTight_600SemiBold' },
  refreshBtn: { backgroundColor: colors.bgMid, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.hairlineStrong, marginTop: 8 },
  refreshText: { color: colors.accentWarm, fontFamily: 'InterTight_600SemiBold', fontSize: 15 },
});
