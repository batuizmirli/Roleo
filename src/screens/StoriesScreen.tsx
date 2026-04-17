import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson, tryParseJson } from '../services/json';
import AnimatedPressable from '../components/AnimatedPressable';

type Story = { title: string; content: { sentence: string; translation: string; }[]; };
type StoryQuizQuestion = { sentence: string; options: string[]; correct: number };
type Props = { onBack: () => void; };

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function StoriesScreen({ onBack }: Props) {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranslations, setShowTranslations] = useState<Record<number, boolean>>({});
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<'read' | 'game'>('read');
  const [questions, setQuestions] = useState<StoryQuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => { loadStory(); }, []);

  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  const buildQuiz = (data: Story) => {
    const sentences = data.content ?? [];
    if (!sentences.length) return [] as StoryQuizQuestion[];

    const chosen = shuffle(sentences).slice(0, Math.min(4, sentences.length));

    return chosen.map(item => {
      const distractors = shuffle(
        sentences
          .filter(s => s.translation !== item.translation)
          .map(s => s.translation)
      ).slice(0, 3);

      const options = shuffle([item.translation, ...distractors]);

      return {
        sentence: item.sentence,
        options,
        correct: options.findIndex(o => o === item.translation),
      };
    });
  };

  const resetGame = (storyData?: Story | null) => {
    const base = storyData ?? story;
    if (!base) return;
    setQuestions(buildQuiz(base));
    setQIndex(0);
    setSelected(null);
    setScore(0);
  };

  const loadStory = async () => {
    setLoading(true); setError(''); setShowTranslations({});
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

      const prompt = `Write a very short beginner story in ${langName} (8-10 sentences).
Theme related to: "${goalDesc}". Each sentence should be simple.
Return ONLY valid JSON:
{"title":"(story title in ${langName})","content":[{"sentence":"(${langName})","translation":"(${nativeLang})"}]}`;

      const response = await sendMessage([{ id: '1', role: 'user', content: prompt, timestamp: new Date() }], '', { maxTokens: 1600 });
      const parsed = parseModelJson<Story>(response, 'object');
      if (parsed?.content?.length) {
        setStory(parsed);
        setQuestions(buildQuiz(parsed));
        setQIndex(0);
        setSelected(null);
        setScore(0);
      } else {
        setError('Hikaye eksik/bozuk geldi. Tekrar dene.');
      }
    } catch (e: any) {
      setError(`Hata: ${e.message ?? 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSentence = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowTranslations(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const revealRate = story?.content?.length
    ? Math.round((Object.values(showTranslations).filter(Boolean).length / story.content.length) * 100)
    : 0;

  const currentQuestion = questions[qIndex];
  const gameDone = questions.length > 0 && qIndex >= questions.length;

  const onAnswer = (idx: number) => {
    if (selected !== null || !currentQuestion) return;
    setSelected(idx);
    if (idx === currentQuestion.correct) setScore(prev => prev + 1);
  };

  const onNextQuestion = () => {
    if (!currentQuestion) return;
    setQIndex(prev => prev + 1);
    setSelected(null);
  };

  if (loading) return (
    <View style={styles.fullCenter}>
      <TouchableOpacity onPress={onBack} style={styles.topBack}>
        <Text style={styles.topBackText}>← Geri</Text>
      </TouchableOpacity>
      <ActivityIndicator size="large" color="#34D399" />
      <Text style={styles.loadingText}>Hikaye hazırlanıyor...</Text>
    </View>
  );

  if (error) return (
    <View style={styles.fullCenter}>
      <TouchableOpacity onPress={onBack} style={styles.topBack}>
        <Text style={styles.topBackText}>← Geri</Text>
      </TouchableOpacity>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={loadStory} style={styles.retryBtn}>
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
        <Text style={styles.title}>📖 Hikayeler</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabBtn, mode === 'read' && styles.tabBtnActive]} onPress={() => setMode('read')}>
          <Text style={[styles.tabText, mode === 'read' && styles.tabTextActive]}>Oku</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, mode === 'game' && styles.tabBtnActive]} onPress={() => setMode('game')}>
          <Text style={[styles.tabText, mode === 'game' && styles.tabTextActive]}>Mini Oyun</Text>
        </TouchableOpacity>
      </View>

      {mode === 'read' && story && (
        <>
          <Text style={styles.subtitle}>Cümleye dokun, çeviriyi aç · İlerleme %{revealRate}</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${revealRate}%` }]} /></View>

          <View style={styles.storyCard}>
            <Text style={styles.storyTitle}>{story.title}</Text>
            <View style={styles.divider} />
            {story.content?.map((item, i) => (
              <AnimatedPressable key={i} style={styles.sentenceRow} onPress={() => toggleSentence(i)} delay={i * 30}>
                <Text style={styles.sentence}>{item.sentence}</Text>
                {showTranslations[i] && <Text style={styles.translation}>{item.translation}</Text>}
              </AnimatedPressable>
            ))}
          </View>
        </>
      )}

      {mode === 'game' && (
        <View style={styles.gameCard}>
          <Text style={styles.gameTitle}>🎮 Hikaye Challenge</Text>
          {!gameDone && currentQuestion && (
            <>
              <Text style={styles.gameProgress}>Soru {qIndex + 1}/{questions.length}</Text>
              <Text style={styles.gamePrompt}>Bu cümlenin doğru çevirisi hangisi?</Text>
              <View style={styles.quoteBox}><Text style={styles.quoteText}>{currentQuestion.sentence}</Text></View>

              {currentQuestion.options.map((option, idx) => {
                const isCorrect = selected !== null && idx === currentQuestion.correct;
                const isWrongPick = selected === idx && idx !== currentQuestion.correct;
                return (
                  <AnimatedPressable
                    key={idx}
                    style={[
                      styles.optionBtn,
                      isCorrect && styles.optionCorrect,
                      isWrongPick && styles.optionWrong,
                      selected !== null && selected !== idx && !isCorrect && styles.optionDim,
                    ]}
                    onPress={() => onAnswer(idx)}
                    disabled={selected !== null}
                    delay={idx * 40}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </AnimatedPressable>
                );
              })}

              {selected !== null && (
                <TouchableOpacity style={styles.nextBtn} onPress={onNextQuestion}>
                  <Text style={styles.nextBtnText}>Sonraki →</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {gameDone && (
            <>
              <Text style={styles.doneEmoji}>{score >= 3 ? '🏆' : '⭐'}</Text>
              <Text style={styles.doneText}>Skor: {score}/{questions.length}</Text>
              <TouchableOpacity style={styles.nextBtn} onPress={() => resetGame()}>
                <Text style={styles.nextBtnText}>Tekrar Oyna</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {story && (
        <TouchableOpacity style={styles.refreshBtn} onPress={loadStory}>
          <Text style={styles.refreshText}>📖 Yeni Hikaye</Text>
        </TouchableOpacity>
      )}
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
  title: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabBtn: { backgroundColor: '#1A1A2E', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#2A2A3E' },
  tabBtnActive: { borderColor: '#34D399', backgroundColor: '#0F221C' },
  tabText: { color: '#888', fontWeight: '700' },
  tabTextActive: { color: '#34D399' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 10 },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: '#1A1A2E', marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#34D399' },
  storyCard: { backgroundColor: '#1A1A2E', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#2A2A3E' },
  storyTitle: { fontSize: 20, fontWeight: '800', color: '#34D399', marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#2A2A3E', marginBottom: 12 },
  sentenceRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#22263A', gap: 4 },
  sentence: { fontSize: 16, color: '#FFF', lineHeight: 24 },
  translation: { fontSize: 14, color: '#34D399', lineHeight: 20, fontStyle: 'italic' },
  gameCard: { backgroundColor: '#1A1A2E', borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: '#2A2A3E' },
  gameTitle: { fontSize: 18, color: '#34D399', fontWeight: '800', marginBottom: 10 },
  gameProgress: { color: '#888', marginBottom: 8, fontSize: 13 },
  gamePrompt: { color: '#DDD', marginBottom: 10, fontSize: 14 },
  quoteBox: { backgroundColor: '#0D0D1A', borderRadius: 12, padding: 12, marginBottom: 12 },
  quoteText: { color: '#FFF', fontSize: 16, lineHeight: 22, fontStyle: 'italic' },
  optionBtn: { backgroundColor: '#0D0D1A', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2A2A3E' },
  optionCorrect: { borderColor: '#4CAF50', backgroundColor: '#0F2516' },
  optionWrong: { borderColor: '#FF4D6D', backgroundColor: '#2A1016' },
  optionDim: { opacity: 0.45 },
  optionText: { color: '#FFF', fontSize: 14 },
  nextBtn: { marginTop: 10, backgroundColor: '#34D399', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  nextBtnText: { color: '#032014', fontWeight: '800' },
  doneEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 6 },
  doneText: { color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  loadingText: { color: '#888', fontSize: 14 },
  errorText: { color: '#FF4D6D', fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#FF4D6D', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#FFF', fontWeight: '700' },
  refreshBtn: { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A3E', marginTop: 14 },
  refreshText: { color: '#34D399', fontWeight: '700', fontSize: 15 },
});
