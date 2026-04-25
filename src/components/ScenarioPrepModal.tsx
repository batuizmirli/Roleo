import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator,
} from 'react-native';
import { Scenario, UserProfile } from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson } from '../services/json';

type PrepQuestion = {
  type: 'fill_blank' | 'error_detect' | 'auto_complete';
  prompt: string;
  options: string[];
  correct: number;
  tip: string;
};

type Props = {
  visible: boolean;
  scenario: Scenario;
  profile: UserProfile | null;
  playCount?: number;
  onSkip: () => void;
  onEnter: (prepBonus: number) => void;
};

type Phase = 'choice' | 'loading' | 'quiz' | 'result';

export default function ScenarioPrepModal({ visible, scenario, profile, playCount = 0, onSkip, onEnter }: Props) {
  const [phase, setPhase] = useState<Phase>('choice');
  const [questions, setQuestions] = useState<PrepQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lastTip, setLastTip] = useState('');

  const reset = () => {
    setPhase('choice');
    setQuestions([]);
    setQIndex(0);
    setSelected(null);
    setScore(0);
    setLastTip('');
  };

  const handleSkip = () => { reset(); onSkip(); };

  const startPrep = async () => {
    setPhase('loading');
    try {
      const lang = profile?.language?.name ?? 'Spanish';
      const native = profile?.nativeLanguage?.name ?? 'Turkish';

      const prompt = `Generate exactly 3 quick warm-up questions for a ${lang} learner about to rehearse the "${scenario.title}" (${scenario.stageType ?? 'cafe'}) real-life scene.
Native language: ${native}. Keep prompts very short, practical, and tied to what they may say in the scene.
Mix types: fill_blank (blank in a useful reply), error_detect (awkward wording to fix), auto_complete (conversation opener).
Return ONLY valid JSON array:
[{"type":"fill_blank","prompt":"short sentence with ___","options":["a","b","c"],"correct":0,"tip":"short tip in ${native}"}]`;

      const res = await sendMessage(
        [{ id: 'prep', role: 'user', content: prompt, timestamp: new Date() }],
        '',
        { maxTokens: 600 }
      );

      const parsed = parseModelJson<PrepQuestion[]>(res, 'array');
      if (parsed?.length) {
        setQuestions(parsed);
        setQIndex(0);
        setSelected(null);
        setScore(0);
        setPhase('quiz');
      } else {
        handleSkip();
      }
    } catch {
      handleSkip();
    }
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[qIndex].correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    const isLast = qIndex + 1 >= questions.length;
    if (isLast) {
      setLastTip(questions[qIndex].tip);
      setPhase('result');
    } else {
      setQIndex(i => i + 1);
      setSelected(null);
    }
  };

  const prepBonus = score >= 3 ? 10 : score >= 2 ? 7 : 4;
  const accuracy = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const confidence = accuracy >= 80
    ? { label: 'Yüksek', color: '#8B5E45' }
    : accuracy >= 50
    ? { label: 'Orta', color: '#B07A5C' }
    : { label: 'Düşük', color: '#E05C5C' };

  const currentQ = questions[qIndex];

  const typeLabel = (type: PrepQuestion['type']) => {
    if (type === 'fill_blank') return 'Boşluğu Doldur';
    if (type === 'error_detect') return 'Hatayı Bul';
    return 'Tamamla';
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {phase === 'choice' && (
            <>
              <Text style={styles.emoji}>{scenario.emoji}</Text>
              <Text style={styles.title}>{scenario.title}</Text>
              <Text style={styles.location}>📍 {scenario.location}</Text>

              {playCount > 0 && (
                <View style={styles.returnBadge}>
                  <Text style={styles.returnText}>Tekrar oynuyorsun · {playCount}. kez</Text>
                </View>
              )}

              <TouchableOpacity style={styles.primaryBtn} onPress={() => { reset(); onEnter(0); }}>
                <Text style={styles.primaryBtnText}>Direkt sahneye gir</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.prepBtn} onPress={startPrep}>
                <View>
                  <Text style={styles.prepBtnTitle}>30 sn sahne hazırlığı</Text>
                  <Text style={styles.prepBtnSub}>3 pratik soru · sahnedeki cevabını hazırla · +10 XP</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backBtn} onPress={handleSkip}>
                <Text style={styles.backBtnText}>Geri</Text>
              </TouchableOpacity>
            </>
          )}

          {phase === 'loading' && (
            <View style={styles.center}>
              <ActivityIndicator color="#E8A840" size="large" />
              <Text style={styles.loadingText}>Isınma soruları hazırlanıyor...</Text>
            </View>
          )}

          {phase === 'quiz' && currentQ && (
            <>
              <View style={styles.quizTopRow}>
                <Text style={styles.typeLabel}>{typeLabel(currentQ.type)}</Text>
                <Text style={styles.quizProgress}>{qIndex + 1} / {questions.length}</Text>
              </View>

              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((qIndex + 1) / questions.length) * 100}%` }]} />
              </View>

              <View style={styles.questionBox}>
                <Text style={styles.questionText}>{currentQ.prompt}</Text>
              </View>

              <View style={styles.options}>
                {currentQ.options.map((opt, idx) => {
                  const isCorrect = selected !== null && idx === currentQ.correct;
                  const isWrong = selected === idx && idx !== currentQ.correct;
                  const isDim = selected !== null && selected !== idx && !isCorrect;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.option, isCorrect && styles.optionCorrect, isWrong && styles.optionWrong, isDim && styles.optionDim]}
                      onPress={() => handleAnswer(idx)}
                      disabled={selected !== null}
                    >
                      <Text style={styles.optionText}>{opt}</Text>
                      {isCorrect && <Text style={styles.tick}>✓</Text>}
                      {isWrong && <Text style={styles.cross}>✗</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selected !== null && (
                <View style={styles.tipBox}>
                  <Text style={styles.tipText}>💡 {currentQ.tip}</Text>
                </View>
              )}

              {selected !== null && (
                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                  <Text style={styles.nextBtnText}>
                    {qIndex + 1 >= questions.length ? 'Sonucu Gör →' : 'Sonraki →'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {phase === 'result' && (
            <>
              <Text style={styles.resultTitle}>Isınma tamamlandı 🔥</Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{accuracy}%</Text>
                  <Text style={styles.statLabel}>Doğruluk</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: confidence.color }]}>{confidence.label}</Text>
                  <Text style={styles.statLabel}>Hazırlık</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: '#F5B800' }]}>+{prepBonus}</Text>
                  <Text style={styles.statLabel}>XP bonus</Text>
                </View>
              </View>

              {!!lastTip && (
                <View style={styles.finalTipBox}>
                  <Text style={styles.finalTipText}>💡 {lastTip}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.primaryBtn} onPress={() => { reset(); onEnter(prepBonus); }}>
                <Text style={styles.primaryBtnText}>Sahneye Gir →</Text>
              </TouchableOpacity>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
    borderTopWidth: 1,
    borderColor: '#E8EDF2',
    minHeight: 300,
  },
  emoji: { fontSize: 36, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '900', color: '#1A2B3C', textAlign: 'center', fontFamily: 'Poppins_700Bold' },
  location: { fontSize: 13, color: '#6B7B8D', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  returnBadge: { backgroundColor: '#F4ECE5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#D5C4B8' },
  returnText: { color: '#8B5E45', fontSize: 12, fontWeight: '700' },
  primaryBtn: { backgroundColor: '#A66A4C', borderRadius: 16, padding: 17, alignItems: 'center', marginBottom: 10, shadowColor: '#A66A4C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  primaryBtnText: { color: '#FFFDF8', fontSize: 16, fontWeight: '800' },
  prepBtn: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: '#E8EDF2' },
  prepBtnTitle: { color: '#1A2B3C', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  prepBtnSub: { color: '#8B5E45', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 3 },
  backBtn: { padding: 12, alignItems: 'center' },
  backBtnText: { color: '#6B7B8D', fontSize: 14 },
  center: { alignItems: 'center', paddingVertical: 48, gap: 16 },
  loadingText: { color: '#6B7B8D', fontSize: 14 },
  quizTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeLabel: { fontSize: 11, fontWeight: '900', color: '#8B5E45', letterSpacing: 1 },
  quizProgress: { fontSize: 13, color: '#6B7B8D', fontWeight: '700' },
  progressBar: { height: 3, backgroundColor: '#E8EDF2', borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: '#A66A4C', borderRadius: 2 },
  questionBox: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E8EDF2' },
  questionText: { color: '#1A2B3C', fontSize: 17, fontWeight: '700', lineHeight: 26, textAlign: 'center' },
  options: { gap: 8, marginBottom: 12 },
  option: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#E8EDF2' },
  optionCorrect: { borderColor: '#A66A4C', backgroundColor: '#F4ECE5' },
  optionWrong: { borderColor: '#E05C5C', backgroundColor: '#FDECEC' },
  optionDim: { opacity: 0.3 },
  optionText: { color: '#1A2B3C', fontSize: 15, flex: 1 },
  tick: { color: '#8B5E45', fontWeight: '900', fontSize: 16 },
  cross: { color: '#E05C5C', fontWeight: '900', fontSize: 16 },
  tipBox: { backgroundColor: '#F4ECE5', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#D5C4B8' },
  tipText: { color: '#8B5E45', fontSize: 13, lineHeight: 20 },
  nextBtn: { backgroundColor: '#A66A4C', borderRadius: 14, padding: 16, alignItems: 'center' },
  nextBtnText: { color: '#FFFDF8', fontSize: 15, fontWeight: '800' },
  resultTitle: { fontSize: 20, fontWeight: '900', color: '#1A2B3C', textAlign: 'center', marginBottom: 24, fontFamily: 'Poppins_700Bold' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E8EDF2' },
  statValue: { fontSize: 22, fontWeight: '900', color: '#1A2B3C' },
  statLabel: { fontSize: 11, color: '#6B7B8D', marginTop: 4 },
  finalTipBox: { backgroundColor: '#F4ECE5', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#D5C4B8' },
  finalTipText: { color: '#8B5E45', fontSize: 13, lineHeight: 20 },
});
