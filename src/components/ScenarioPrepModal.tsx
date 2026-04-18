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

      const prompt = `Generate exactly 3 quick warm-up questions for a ${lang} learner about to do a "${scenario.title}" (${scenario.stageType ?? 'cafe'}) scene.
Native language: ${native}. Keep prompts very short and practical.
Mix types: fill_blank (blank in sentence), error_detect (wrong word to fix), auto_complete (conversation opener).
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
    ? { label: 'Yüksek', color: '#3DD68C' }
    : accuracy >= 50
    ? { label: 'Orta', color: '#F5B800' }
    : { label: 'Düşük', color: '#E8324A' };

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
                <Text style={styles.primaryBtnText}>⚡ Try Now</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.prepBtn} onPress={startPrep}>
                <View>
                  <Text style={styles.prepBtnTitle}>🧠 Quick Warm-up</Text>
                  <Text style={styles.prepBtnSub}>3 soru · ~30 sn · +10 XP bonus</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backBtn} onPress={handleSkip}>
                <Text style={styles.backBtnText}>Geri</Text>
              </TouchableOpacity>
            </>
          )}

          {phase === 'loading' && (
            <View style={styles.center}>
              <ActivityIndicator color="#E8324A" size="large" />
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0F0F1A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
    borderTopWidth: 1,
    borderColor: '#252540',
    minHeight: 300,
  },
  emoji: { fontSize: 36, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  location: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  returnBadge: { backgroundColor: '#1E1E35', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'center', marginBottom: 16 },
  returnText: { color: '#A78BFA', fontSize: 12, fontWeight: '700' },
  primaryBtn: { backgroundColor: '#E8324A', borderRadius: 16, padding: 17, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  prepBtn: { backgroundColor: '#16162A', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: '#252540' },
  prepBtnTitle: { color: '#FFF', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  prepBtnSub: { color: '#3DD68C', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 3 },
  backBtn: { padding: 12, alignItems: 'center' },
  backBtnText: { color: '#555', fontSize: 14 },
  center: { alignItems: 'center', paddingVertical: 48, gap: 16 },
  loadingText: { color: '#888', fontSize: 14 },
  quizTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeLabel: { fontSize: 11, fontWeight: '900', color: '#E8324A', letterSpacing: 1 },
  quizProgress: { fontSize: 13, color: '#888', fontWeight: '700' },
  progressBar: { height: 4, backgroundColor: '#16162A', borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#E8324A', borderRadius: 2 },
  questionBox: { backgroundColor: '#16162A', borderRadius: 14, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#252540' },
  questionText: { color: '#FFF', fontSize: 17, fontWeight: '700', lineHeight: 26, textAlign: 'center' },
  options: { gap: 8, marginBottom: 12 },
  option: { backgroundColor: '#16162A', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#252540' },
  optionCorrect: { borderColor: '#3DD68C', backgroundColor: '#0D1A10' },
  optionWrong: { borderColor: '#E8324A', backgroundColor: '#1A0A0E' },
  optionDim: { opacity: 0.35 },
  optionText: { color: '#FFF', fontSize: 15, flex: 1 },
  tick: { color: '#3DD68C', fontWeight: '900', fontSize: 16 },
  cross: { color: '#E8324A', fontWeight: '900', fontSize: 16 },
  tipBox: { backgroundColor: '#0D1A10', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#1A3020' },
  tipText: { color: '#3DD68C', fontSize: 13, lineHeight: 20 },
  nextBtn: { backgroundColor: '#E8324A', borderRadius: 14, padding: 16, alignItems: 'center' },
  nextBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  resultTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#16162A', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#252540' },
  statValue: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  finalTipBox: { backgroundColor: '#16162A', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#252540' },
  finalTipText: { color: '#A78BFA', fontSize: 13, lineHeight: 20 },
});
