import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson, tryParseJson } from '../services/json';

type Phrase = { phrase: string; meaning: string; usage: string; };
type Category = { category: string; phrases: Phrase[]; };
type Props = { onBack: () => void; };

export default function PhrasebookScreen({ onBack }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number>(0);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => { loadPhrases(); }, []);

  const loadPhrases = async () => {
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

      const cacheKey = `phrasebook_${p.language?.code}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const cachedCategories = tryParseJson<Category[]>(cached);
        if (cachedCategories?.length) {
          setCategories(cachedCategories);
          setLoading(false);
          return;
        }
        await AsyncStorage.removeItem(cacheKey);
      }

      const prompt = `Create a survival phrasebook in ${langName} for someone who wants to: "${goalDesc}".
4 categories, 5 phrases each. Explain in ${nativeLang}.
Return ONLY valid JSON:
[{"category":"...","phrases":[{"phrase":"(${langName})","meaning":"(${nativeLang})","usage":"(when to use, in ${nativeLang})"}]}]`;

      const response = await sendMessage([{ id: '1', role: 'user', content: prompt, timestamp: new Date() }], '', { maxTokens: 1800 });
      const parsed = parseModelJson<Category[]>(response, 'array');
      if (parsed?.length) {
        setCategories(parsed);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(parsed));
      } else {
        setError('Phrasebook verisi eksik/bozuk geldi. Tekrar dene.');
      }
    } catch (e: any) {
      setError(`Hata: ${e.message ?? 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={styles.fullCenter}>
      <TouchableOpacity onPress={onBack} style={styles.topBack}>
        <Text style={styles.topBackText}>← Geri</Text>
      </TouchableOpacity>
      <ActivityIndicator size="large" color="#60A5FA" />
      <Text style={styles.loadingText}>Phrasebook hazırlanıyor...</Text>
    </View>
  );

  if (error) return (
    <View style={styles.fullCenter}>
      <TouchableOpacity onPress={onBack} style={styles.topBack}>
        <Text style={styles.topBackText}>← Geri</Text>
      </TouchableOpacity>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={loadPhrases} style={styles.retryBtn}>
        <Text style={styles.retryText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🗣️ Kurtarma Cümleleri</Text>
      </View>
      <Text style={styles.subtitle}>Her durumda işe yarayan ifadeler — {profile?.language?.flag}</Text>

      {categories.map((cat, i) => (
        <View key={i} style={styles.catCard}>
          <TouchableOpacity style={styles.catHeader} onPress={() => setExpanded(expanded === i ? -1 : i)}>
            <Text style={styles.catTitle}>{cat.category}</Text>
            <Text style={styles.chevron}>{expanded === i ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {expanded === i && (
            <View style={styles.phrasesList}>
              {cat.phrases?.map((p, j) => (
                <View key={j} style={styles.phraseCard}>
                  <Text style={styles.phrase}>{p.phrase}</Text>
                  <Text style={styles.meaning}>{p.meaning}</Text>
                  <Text style={styles.usage}>📌 {p.usage}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  fullCenter: { flex: 1, backgroundColor: '#0D0D1A', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  topBack: { position: 'absolute', top: 60, left: 24 },
  topBackText: { fontSize: 15, color: '#888', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: '#FFF' },
  title: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 28 },
  catCard: { backgroundColor: '#1A1A2E', borderRadius: 18, marginBottom: 12, borderWidth: 1.5, borderColor: '#2A2A3E', overflow: 'hidden' },
  catHeader: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  catTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#60A5FA' },
  chevron: { color: '#666', fontSize: 12 },
  phrasesList: { borderTopWidth: 1, borderTopColor: '#2A2A3E', padding: 12, gap: 10 },
  phraseCard: { backgroundColor: '#0D0D1A', borderRadius: 12, padding: 14, gap: 4 },
  phrase: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  meaning: { fontSize: 14, color: '#60A5FA' },
  usage: { fontSize: 12, color: '#555', marginTop: 4 },
  loadingText: { color: '#888', fontSize: 14 },
  errorText: { color: '#FF4D6D', fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#FF4D6D', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#FFF', fontWeight: '700' },
});
