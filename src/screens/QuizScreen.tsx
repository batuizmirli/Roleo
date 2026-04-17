import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson, tryParseJson } from '../services/json';

type Question = { question: string; options: string[]; correct: number; explanation: string; };
type Props = { onBack: () => void; };

export default function QuizScreen({ onBack }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadQuiz(); }, []);

  const loadQuiz = async () => {
    setLoading(true); setError(''); setCurrent(0); setSelected(null); setScore(0); setDone(false);
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
      const nativeLang = p.nativeLanguage?.name ?? 'English';
      const langName = p.language?.name ?? 'Spanish';
      const goalDesc = p.goalDescription ?? '';

      const prompt = `Create 5 multiple choice quiz questions for a ${langName} beginner learner.
Goal: "${goalDesc}". Explain in ${nativeLang}.
Mix vocabulary, simple grammar, fill-in-blank, translation questions.
Return ONLY valid JSON array:
[{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"(why, in ${nativeLang})"}]
correct is the index (0-3) of the correct answer.`;

      const response = await sendMessage([{ id: '1', role: 'user', content: prompt, timestamp: new Date() }], '', { maxTokens: 1500 });
      const parsed = parseModelJson<Question[]>(response, 'array');
      if (parsed?.length) {
        setQuestions(parsed);
      } else {
        setError('Quiz verisi eksik/bozuk geldi. Tekrar dene.');
      }
    } catch (e: any) {
      setError(`Hata: ${e.message ?? 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[current].correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) { setDone(true); return; }
    setCurrent(c => c + 1);
    setSelected(null);
  };

  const optionStyle = (idx: number) => {
    if (selected === null) return styles.option;
    if (idx === questions[current].correct) return [styles.option, styles.optionCorrect];
    if (idx === selected) return [styles.option, styles.optionWrong];
    return [styles.option, styles.optionDimmed];
  };

  if (loading) return (
    <View style={styles.fullCenter}>
      <TouchableOpacity onPress={onBack} style={styles.topBack}>
        <Text style={styles.topBackText}>← Geri</Text>
      </TouchableOpacity>
      <ActivityIndicator size="large" color="#F59E0B" />
      <Text style={styles.loadingText}>Quiz hazırlanıyor...</Text>
    </View>
  );

  if (error) return (
    <View style={styles.fullCenter}>
      <TouchableOpacity onPress={onBack} style={styles.topBack}>
        <Text style={styles.topBackText}>← Geri</Text>
      </TouchableOpacity>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={loadQuiz} style={styles.retryBtn}>
        <Text style={styles.retryText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );

  if (done) return (
    <View style={styles.fullCenter}>
      <Text style={styles.doneEmoji}>{score >= 4 ? '🏆' : score >= 3 ? '⭐' : '📖'}</Text>
      <Text style={styles.doneScore}>{score} / {questions.length}</Text>
      <Text style={styles.doneLabel}>{score >= 4 ? 'Mükemmel!' : score >= 3 ? 'İyi!' : 'Pratik yapmaya devam et!'}</Text>
      <TouchableOpacity style={styles.btn} onPress={loadQuiz}>
        <Text style={styles.btnText}>Yeni Quiz →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backBtnLarge} onPress={onBack}>
        <Text style={styles.backBtnLargeText}>Ana Menü</Text>
      </TouchableOpacity>
    </View>
  );

  const q = questions[current];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚡ Hızlı Quiz</Text>
        <Text style={styles.progress}>{current + 1}/{questions.length}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((current + 1) / questions.length) * 100}%` as any }]} />
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{q.question}</Text>
      </View>

      <View style={styles.options}>
        {q.options.map((opt, idx) => (
          <TouchableOpacity key={idx} style={optionStyle(idx)} onPress={() => handleAnswer(idx)}>
            <Text style={styles.optionLetter}>{['A', 'B', 'C', 'D'][idx]}</Text>
            <Text style={styles.optionText}>{opt}</Text>
            {selected !== null && idx === q.correct && <Text style={styles.tick}>✓</Text>}
            {selected === idx && idx !== q.correct && <Text style={styles.cross}>✗</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {selected !== null && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>💡 {q.explanation}</Text>
        </View>
      )}

      {selected !== null && (
        <TouchableOpacity style={styles.btn} onPress={handleNext}>
          <Text style={styles.btnText}>{current + 1 >= questions.length ? 'Sonucu Gör →' : 'Sonraki →'}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: '#FFF' },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: '#FFF' },
  progress: { fontSize: 14, color: '#F59E0B', fontWeight: '700' },
  progressBar: { height: 4, backgroundColor: '#1A1A2E', borderRadius: 2, marginBottom: 28 },
  progressFill: { height: 4, backgroundColor: '#F59E0B', borderRadius: 2 },
  questionCard: { backgroundColor: '#1A1A2E', borderRadius: 18, padding: 24, marginBottom: 20, borderWidth: 1.5, borderColor: '#2A2A3E' },
  questionText: { fontSize: 18, color: '#FFF', fontWeight: '700', lineHeight: 28 },
  options: { gap: 10, marginBottom: 16 },
  option: { backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: '#2A2A3E' },
  optionCorrect: { borderColor: '#4CAF50', backgroundColor: '#0D2010' },
  optionWrong: { borderColor: '#FF4D6D', backgroundColor: '#200D10' },
  optionDimmed: { opacity: 0.4 },
  optionLetter: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#0D0D1A', color: '#888', fontWeight: '800', fontSize: 13, textAlign: 'center', lineHeight: 28 },
  optionText: { flex: 1, fontSize: 15, color: '#FFF' },
  tick: { fontSize: 18, color: '#4CAF50', fontWeight: '800' },
  cross: { fontSize: 18, color: '#FF4D6D', fontWeight: '800' },
  explanationBox: { backgroundColor: '#1A2A1A', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#2A3A2A' },
  explanationText: { fontSize: 14, color: '#7BC67E', lineHeight: 22 },
  btn: { backgroundColor: '#F59E0B', borderRadius: 16, padding: 18, alignItems: 'center' },
  btnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  loadingText: { color: '#888', fontSize: 14 },
  errorText: { color: '#FF4D6D', fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#FF4D6D', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#FFF', fontWeight: '700' },
  doneEmoji: { fontSize: 64 },
  doneScore: { fontSize: 48, fontWeight: '900', color: '#FFF' },
  doneLabel: { fontSize: 18, color: '#888', marginBottom: 16 },
  backBtnLarge: { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, alignItems: 'center', width: '100%' },
  backBtnLargeText: { color: '#888', fontWeight: '700', fontSize: 15 },
});
