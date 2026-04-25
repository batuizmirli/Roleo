import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson, tryParseJson } from '../services/json';
import { colors } from '../theme/colors';

type GrammarLesson = { title: string; rule: string; examples: { sentence: string; translation: string; }[]; tip: string; };
type Props = { onBack: () => void; scenarioTitle?: string; stageType?: string; };

const buildOfflineLessons = (langName: string): GrammarLesson[] => {
  const isSpanish = /spanish|ispanyol/i.test(langName);
  if (isSpanish) {
    return [
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
        title: 'Soru Kalıbı: ¿Dónde está...?',
        rule: 'Yol/yön sorarken en pratik kalıp "¿Dónde está...?" ile başlar.',
        examples: [
          { sentence: '¿Dónde está la estación?', translation: 'İstasyon nerede?' },
          { sentence: '¿Dónde está el baño?', translation: 'Tuvalet nerede?' },
        ],
        tip: 'Kalıbı ezberle, sadece son kelimeyi değiştirerek onlarca soru kurarsın.',
      },
      {
        title: 'Basit Geçmişte Zaman İşaretleri',
        rule: 'Dün/az önce gibi işaretler geçmiş zamanı daha anlaşılır yapar.',
        examples: [
          { sentence: 'Ayer hablé con mi jefe.', translation: 'Dün patronumla konuştum.' },
          { sentence: 'Hace un minuto terminé.', translation: 'Az önce bitirdim.' },
        ],
        tip: 'Konuşurken önce zamanı söylemek akışı güçlendirir.',
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
  }
  return [
    {
      title: 'Polite Requests',
      rule: 'A polite request sounds more natural than a direct command.',
      examples: [
        { sentence: 'Could I get a coffee, please?', translation: 'Bir kahve alabilir miyim, lütfen?' },
        { sentence: 'I want a coffee.', translation: 'Bir kahve istiyorum.' },
      ],
      tip: 'In first contact, default to polite forms.',
    },
    {
      title: 'Useful Question Frame',
      rule: 'Use one stable frame and swap one keyword.',
      examples: [
        { sentence: 'Where is the station?', translation: 'İstasyon nerede?' },
        { sentence: 'Where is the gate?', translation: 'Kapı nerede?' },
      ],
      tip: 'Fixed frames reduce hesitation under pressure.',
    },
    {
      title: 'Time Anchors',
      rule: 'Add time words to make tense clear quickly.',
      examples: [
        { sentence: 'Yesterday I called my manager.', translation: 'Dün yöneticimi aradım.' },
        { sentence: 'A minute ago I finished.', translation: 'Az önce bitirdim.' },
      ],
      tip: 'Say time first when nervous.',
    },
    {
      title: 'Connect Ideas Naturally',
      rule: 'Use connectors like but/because/so to sound fluent.',
      examples: [
        { sentence: 'I want to go, but I am tired.', translation: 'Gitmek istiyorum ama yorgunum.' },
        { sentence: 'I stayed home because it was late.', translation: 'Geç olduğu için evde kaldım.' },
      ],
      tip: 'Add one connector to every short answer.',
    },
  ];
};

export default function GrammarScreen({ onBack, scenarioTitle, stageType }: Props) {
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
      if (!profileData) { setError('Profil bulunamadı.'); setLoading(false); return; }

      const p = tryParseJson<UserProfile>(profileData);
      if (!p) {
        await AsyncStorage.removeItem('userProfile');
        setError('Profil verisi bozuk. Lütfen uygulamayı yeniden başlatıp tekrar giriş yap.');
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
        setError('Dersler eksik/bozuk geldi. Tekrar dene.');
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
        <Text style={styles.title}>📚 Sahne Kalıpları</Text>
      </View>
      <Text style={styles.subtitle}>
        {scenarioTitle ? `"${scenarioTitle}" sahnesi · ` : 'Kural + örnek mini dersler · '}
        {profile?.language?.flag} {profile?.language?.name}
      </Text>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryAccent} />
          <Text style={styles.loadingText}>Sahne kalıpları hazırlanıyor...</Text>
        </View>
      )}

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadGrammar} style={styles.retryBtn}>
            <Text style={styles.retryText}>Tekrar Dene</Text>
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
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  backText: { fontSize: 20, color: colors.textPrimary },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 28 },
  center: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  lessonCard: { backgroundColor: colors.surface, borderRadius: 18, marginBottom: 12, borderWidth: 1.5, borderColor: colors.primaryBorder, overflow: 'hidden' },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12 },
  lessonNum: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primaryAccentSoft, alignItems: 'center', justifyContent: 'center' },
  lessonNumText: { color: colors.terracottaDark, fontWeight: '800', fontSize: 14 },
  lessonTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  chevron: { color: colors.textMuted, fontSize: 12 },
  lessonBody: { paddingHorizontal: 18, paddingBottom: 18, gap: 14, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 16 },
  ruleText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  examplesLabel: { fontSize: 11, fontWeight: '700', color: colors.primaryAccent, letterSpacing: 1.2 },
  exampleRow: { backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 14, gap: 4 },
  exSentence: { fontSize: 15, color: colors.textPrimary, fontWeight: '600' },
  exTranslation: { fontSize: 13, color: colors.textSecondary },
  tipBox: { flexDirection: 'row', gap: 8, backgroundColor: colors.warningSoft, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  tipIcon: { fontSize: 16 },
  tipText: { flex: 1, fontSize: 13, color: colors.terracottaDark, lineHeight: 20 },
  errorBox: { alignItems: 'center', padding: 24, gap: 12 },
  errorText: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primaryAccent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: colors.textOnAccent, fontWeight: '700' },
  refreshBtn: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder, marginTop: 8 },
  refreshText: { color: colors.primaryAccent, fontWeight: '700', fontSize: 15 },
});
