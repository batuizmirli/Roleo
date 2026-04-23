import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson, tryParseJson } from '../services/json';

type GrammarLesson = { title: string; rule: string; examples: { sentence: string; translation: string; }[]; tip: string; };
type Props = { onBack: () => void; scenarioTitle?: string; stageType?: string; };

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
      const langName = p.language?.name ?? 'Spanish';
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
      setError(`Hata: ${e.message ?? 'Bilinmeyen hata'}`);
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
        <Text style={styles.title}>📚 Gramer</Text>
      </View>
      <Text style={styles.subtitle}>
        {scenarioTitle ? `"${scenarioTitle}" sahnesi · ` : 'Kural + örnek mini dersler · '}
        {profile?.language?.flag} {profile?.language?.name}
      </Text>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#A78BFA" />
          <Text style={styles.loadingText}>Dersler hazırlanıyor...</Text>
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
          <Text style={styles.refreshText}>🔄 Yeni Dersler</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: '#1A2B3C' },
  title: { fontSize: 22, fontWeight: '800', color: '#1A2B3C' },
  subtitle: { fontSize: 14, color: '#9AABB8', marginBottom: 28 },
  center: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: '#9AABB8', fontSize: 14 },
  lessonCard: { backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 12, borderWidth: 1.5, borderColor: '#E8EDF2', overflow: 'hidden' },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12 },
  lessonNum: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#A78BFA22', alignItems: 'center', justifyContent: 'center' },
  lessonNumText: { color: '#A78BFA', fontWeight: '800', fontSize: 14 },
  lessonTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1A2B3C' },
  chevron: { color: '#9AABB8', fontSize: 12 },
  lessonBody: { paddingHorizontal: 18, paddingBottom: 18, gap: 14, borderTopWidth: 1, borderTopColor: '#E8EDF2', paddingTop: 16 },
  ruleText: { fontSize: 14, color: '#CCC', lineHeight: 22 },
  examplesLabel: { fontSize: 11, fontWeight: '700', color: '#A78BFA', letterSpacing: 1.2 },
  exampleRow: { backgroundColor: '#F5F7FA', borderRadius: 12, padding: 14, gap: 4 },
  exSentence: { fontSize: 15, color: '#1A2B3C', fontWeight: '600' },
  exTranslation: { fontSize: 13, color: '#9AABB8' },
  tipBox: { flexDirection: 'row', gap: 8, backgroundColor: '#F5F7FA', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#A78BFA33' },
  tipIcon: { fontSize: 16 },
  tipText: { flex: 1, fontSize: 13, color: '#A78BFA', lineHeight: 20 },
  errorBox: { alignItems: 'center', padding: 24, gap: 12 },
  errorText: { color: '#1B9C5A', fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#1B9C5A', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#1A2B3C', fontWeight: '700' },
  refreshBtn: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E8EDF2', marginTop: 8 },
  refreshText: { color: '#A78BFA', fontWeight: '700', fontSize: 15 },
});
