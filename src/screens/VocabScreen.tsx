import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson, tryParseJson } from '../services/json';
import { colors } from '../theme/colors';

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
  container: { flex: 1, backgroundColor: colors.bgDeep },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgMid, borderWidth: 1, borderColor: colors.hairlineStrong, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 18, color: colors.inkSecondary },
  title: { fontFamily: 'Fraunces_300Light', fontSize: 22, color: colors.inkPrimary, letterSpacing: -0.3 },
  subtitle: { fontFamily: 'InterTight_400Regular', fontSize: 13, color: colors.inkTertiary, marginBottom: 24, lineHeight: 19 },
  center: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontFamily: 'InterTight_400Regular', color: colors.inkTertiary, fontSize: 13 },
  cardWrap: { minHeight: 160, marginBottom: 12, position: 'relative' },
  card: { backgroundColor: colors.bgMid, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.hairlineStrong, minHeight: 160 },
  cardFace: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden' },
  cardBackFace: { justifyContent: 'center' },
  front: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  wordNum: { fontFamily: 'InterTight_500Medium', fontSize: 10, color: colors.accentWarmSoft, letterSpacing: 2 },
  word: { fontFamily: 'Fraunces_300Light', fontSize: 34, color: colors.inkPrimary, textAlign: 'center', letterSpacing: -0.5 },
  tapHint: { fontFamily: 'InterTight_400Regular', fontSize: 11, color: colors.inkTertiary },
  back: { gap: 10 },
  meaning: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 24, color: colors.accentWarm, letterSpacing: -0.3 },
  divider: { height: 1, backgroundColor: colors.hairline },
  example: { fontFamily: 'InterTight_400Regular', fontSize: 14, color: colors.inkSecondary, fontStyle: 'italic', lineHeight: 21 },
  exampleMeaning: { fontFamily: 'InterTight_400Regular', fontSize: 12, color: colors.inkTertiary, lineHeight: 18 },
  errorBox: { alignItems: 'center', padding: 24, gap: 12 },
  errorText: { fontFamily: 'InterTight_400Regular', color: colors.errorDs, fontSize: 13, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.inkPrimary, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12 },
  retryText: { fontFamily: 'InterTight_600SemiBold', color: colors.bgDeep, fontSize: 14 },
  refreshBtn: { backgroundColor: colors.bgMid, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.hairlineStrong, marginTop: 8 },
  refreshText: { fontFamily: 'InterTight_500Medium', color: colors.accentWarm, fontSize: 14 },
});
