import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson, tryParseJson } from '../services/json';

type VocabWord = { word: string; meaning: string; example: string; exampleMeaning: string; };
type Props = { onBack: () => void; scenarioId?: string; scenarioTitle?: string; stageType?: string; };

export default function VocabScreen({ onBack, scenarioTitle, stageType }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [error, setError] = useState('');
  const flipValues = useRef<Record<number, Animated.Value>>({});

  useEffect(() => { loadVocab(); }, []);

  const loadVocab = async () => {
    setLoading(true); setError(''); setFlipped({});
    flipValues.current = {};
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
      const cacheKey = `vocab_${p.language?.code}_${new Date().toDateString()}${scenarioSlug}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const cachedWords = tryParseJson<VocabWord[]>(cached);
        if (cachedWords?.length) {
          setWords(cachedWords);
          setLoading(false);
          return;
        }
        await AsyncStorage.removeItem(cacheKey);
      }

      const sceneContext = scenarioTitle ? `Scene just completed: "${scenarioTitle}" (${stageType ?? 'general'} stage).` : '';
      const prompt = `Generate exactly 5 vocabulary words for a ${langName} learner.
${sceneContext}
Goal: "${goalDesc}". Native language: ${nativeLang}.
If a scene was provided, pick words relevant to that scene.
Return ONLY valid JSON array:
[{"word":"...","meaning":"(${nativeLang} translation)","example":"(${langName} sentence)","exampleMeaning":"(${nativeLang} translation)"}]`;

      const response = await sendMessage([{ id: '1', role: 'user', content: prompt, timestamp: new Date() }], '', { maxTokens: 1400 });
      const parsed = parseModelJson<VocabWord[]>(response, 'array');
      if (parsed?.length) {
        setWords(parsed);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(parsed));
      } else {
        setError('Kelimeler eksik/bozuk geldi. Tekrar dene.');
      }
    } catch (e: any) {
      setError(`Hata: ${e.message ?? 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  const getFlipValue = (index: number) => {
    if (!flipValues.current[index]) {
      flipValues.current[index] = new Animated.Value(0);
    }
    return flipValues.current[index];
  };

  const handleFlip = (index: number) => {
    const currentlyFlipped = !!flipped[index];
    const next = !currentlyFlipped;
    setFlipped(prev => ({ ...prev, [index]: next }));

    Animated.spring(getFlipValue(index), {
      toValue: next ? 1 : 0,
      speed: 16,
      bounciness: 2,
      useNativeDriver: true,
    }).start();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>💬 Günlük Kelime</Text>
      </View>
      <Text style={styles.subtitle}>{scenarioTitle ? `"${scenarioTitle}" sahnesinden kelimeler` : 'Bugünün 5 kelimesi — hedefe göre seçildi'}</Text>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F5B800" />
          <Text style={styles.loadingText}>Kelimeler hazırlanıyor...</Text>
        </View>
      )}

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadVocab} style={styles.retryBtn}>
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      )}

      {words.map((w, i) => {
        const rotateFront = getFlipValue(i).interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        });
        const rotateBack = getFlipValue(i).interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        });

        return (
          <TouchableOpacity key={i} style={styles.cardWrap} onPress={() => handleFlip(i)} activeOpacity={1}>
            <Animated.View style={[styles.card, styles.cardFace, { transform: [{ perspective: 1200 }, { rotateY: rotateFront }] }]}>
              <View style={styles.front}>
                <Text style={styles.wordNum}>{i + 1} / 5</Text>
                <Text style={styles.word}>{w.word}</Text>
                <Text style={styles.tapHint}>Çevir için dokun 👆</Text>
              </View>
            </Animated.View>

            <Animated.View style={[styles.card, styles.cardFace, styles.cardBackFace, { transform: [{ perspective: 1200 }, { rotateY: rotateBack }] }]}>
              <View style={styles.back}>
                <Text style={styles.meaning}>{w.meaning}</Text>
                <View style={styles.divider} />
                <Text style={styles.example}>{w.example}</Text>
                <Text style={styles.exampleMeaning}>{w.exampleMeaning}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        );
      })}

      {words.length > 0 && (
        <TouchableOpacity style={styles.refreshBtn} onPress={async () => {
          const p = profile;
          if (p) {
            const slug = scenarioTitle ? `_${scenarioTitle.replace(/\s+/g, '-').toLowerCase()}` : '';
            await AsyncStorage.removeItem(`vocab_${p.language?.code}_${new Date().toDateString()}${slug}`);
          }
          loadVocab();
        }}>
          <Text style={styles.refreshText}>🔄 Yeni Kelimeler</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A12' },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#16162A', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: '#FFF' },
  title: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 28 },
  center: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: '#888', fontSize: 14 },
  cardWrap: { minHeight: 160, marginBottom: 14, position: 'relative' },
  card: { backgroundColor: '#16162A', borderRadius: 20, padding: 24, borderWidth: 1.5, borderColor: '#252540', minHeight: 160 },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  cardBackFace: {
    justifyContent: 'center',
  },
  front: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  wordNum: { fontSize: 11, color: '#F5B800', fontWeight: '700', letterSpacing: 1 },
  word: { fontSize: 32, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  tapHint: { fontSize: 12, color: '#555' },
  back: { gap: 10 },
  meaning: { fontSize: 22, fontWeight: '800', color: '#F5B800' },
  divider: { height: 1, backgroundColor: '#252540' },
  example: { fontSize: 15, color: '#DDD', fontStyle: 'italic', lineHeight: 22 },
  exampleMeaning: { fontSize: 13, color: '#666', lineHeight: 20 },
  errorBox: { alignItems: 'center', padding: 24, gap: 12 },
  errorText: { color: '#E8324A', fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#E8324A', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#FFF', fontWeight: '700' },
  refreshBtn: { backgroundColor: '#16162A', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#252540', marginTop: 8 },
  refreshText: { color: '#F5B800', fontWeight: '700', fontSize: 15 },
});
