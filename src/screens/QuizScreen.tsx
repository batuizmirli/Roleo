import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson, tryParseJson } from '../services/json';
import { colors } from '../theme/colors';

type Question = { question: string; options: string[]; correct: number; explanation: string; };
type Props = { onBack: () => void; scenarioTitle?: string; stageType?: string; };

export default function QuizScreen({ onBack, scenarioTitle, stageType }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const questionTransition = useRef(new Animated.Value(1)).current;

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

      const sceneContext = scenarioTitle
        ? `Base the questions on vocabulary and phrases from a "${scenarioTitle}" scene (${stageType ?? 'general'} context).`
        : 'Mix vocabulary, simple grammar, fill-in-blank, translation questions.';
      const prompt = `Create 5 multiple choice quiz questions for a ${langName} beginner learner.
Goal: "${goalDesc}". Explain in ${nativeLang}.
${sceneContext}
Return ONLY valid JSON array:
[{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"(why, in ${nativeLang})"}]
correct is the index (0-3) of the correct answer.`;

      const response = await sendMessage(
        [{ id: '1', role: 'user', content: prompt, timestamp: new Date() }],
        '',
        { maxTokens: 1500 },
      );
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
    Animated.timing(questionTransition, {
      toValue: 0,
      duration: 170,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setCurrent(c => c + 1);
      setSelected(null);
      questionTransition.setValue(0);
      requestAnimationFrame(() => {
        Animated.timing(questionTransition, {
          toValue: 1,
          duration: 380,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }).start();
      });
    });
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
      <ActivityIndicator size="large" color={colors.accentWarm} />
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
      <Text style={styles.doneLabel}>
        {score >= 4 ? 'Mükemmel!' : score >= 3 ? 'İyi!' : 'Pratik yapmaya devam et!'}
      </Text>
      <TouchableOpacity style={styles.btnPrimary} onPress={loadQuiz}>
        <Text style={styles.btnPrimaryText}>Yeni Quiz →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnSecondary} onPress={onBack}>
        <Text style={styles.btnSecondaryText}>Geri Dön</Text>
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

      <Animated.View
        style={{
          opacity: questionTransition,
          transform: [{
            translateY: questionTransition.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }),
          }],
        }}
      >
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{q.question}</Text>
        </View>

        <View style={styles.options}>
          {q.options.map((opt, idx) => (
            <TouchableOpacity key={idx} style={optionStyle(idx)} onPress={() => handleAnswer(idx)}>
              <View style={styles.optionLetterWrap}>
                <Text style={styles.optionLetter}>{['A', 'B', 'C', 'D'][idx]}</Text>
              </View>
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
          <TouchableOpacity style={styles.btnPrimary} onPress={handleNext}>
            <Text style={styles.btnPrimaryText}>
              {current + 1 >= questions.length ? 'Sonucu Gör →' : 'Sonraki →'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  fullCenter: {
    flex: 1,
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  topBack: { position: 'absolute', top: 60, left: 24 },
  topBackText: { fontFamily: 'InterTight_500Medium', fontSize: 14, color: colors.inkSecondary },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.bgMid,
    borderWidth: 1, borderColor: colors.hairlineStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 18, color: colors.inkSecondary },
  title: { flex: 1, fontFamily: 'Fraunces_300Light', fontSize: 22, color: colors.inkPrimary, letterSpacing: -0.3 },
  progress: { fontFamily: 'InterTight_500Medium', fontSize: 13, color: colors.accentWarm },

  progressBar: { height: 2, backgroundColor: colors.hairlineStrong, borderRadius: 1, marginBottom: 28 },
  progressFill: { height: 2, backgroundColor: colors.accentWarm, borderRadius: 1 },

  questionCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  questionText: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 20,
    color: colors.inkPrimary,
    lineHeight: 30,
    letterSpacing: -0.2,
  },

  options: { gap: 10, marginBottom: 16 },
  option: {
    backgroundColor: colors.bgMid,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  optionCorrect: { borderColor: colors.successDs, backgroundColor: `${colors.successDs}15` },
  optionWrong: { borderColor: colors.errorDs, backgroundColor: `${colors.errorDs}15` },
  optionDimmed: { opacity: 0.35 },
  optionLetterWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.bgSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  optionLetter: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 12,
    color: colors.inkTertiary,
  },
  optionText: { flex: 1, fontFamily: 'InterTight_400Regular', fontSize: 14, color: colors.inkPrimary },
  tick: { fontSize: 16, color: colors.successDs },
  cross: { fontSize: 16, color: colors.errorDs },

  explanationBox: {
    backgroundColor: colors.bgMid,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${colors.accentWarm}30`,
    borderLeftWidth: 3,
    borderLeftColor: colors.accentWarm,
  },
  explanationText: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 20,
  },

  btnPrimary: {
    backgroundColor: colors.inkPrimary,
    borderRadius: 999,
    paddingVertical: 17,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  btnPrimaryText: { fontFamily: 'InterTight_600SemiBold', color: colors.bgDeep, fontSize: 15 },
  btnSecondary: {
    backgroundColor: colors.bgMid,
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  btnSecondaryText: { fontFamily: 'InterTight_500Medium', color: colors.inkSecondary, fontSize: 14 },

  loadingText: { fontFamily: 'InterTight_400Regular', color: colors.inkSecondary, fontSize: 14 },
  errorText: { fontFamily: 'InterTight_400Regular', color: colors.errorDs, fontSize: 14, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.inkPrimary,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  retryText: { fontFamily: 'InterTight_600SemiBold', color: colors.bgDeep, fontSize: 14 },

  doneEmoji: { fontSize: 64 },
  doneScore: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 52,
    color: colors.inkPrimary,
    letterSpacing: -1,
  },
  doneLabel: { fontFamily: 'InterTight_400Regular', fontSize: 16, color: colors.inkSecondary },
});
