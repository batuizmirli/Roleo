import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator,
} from 'react-native';
import { Scenario, UserProfile } from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson } from '../services/json';
import { colors } from '../theme/colors';

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
  const confidence = accuracy >= 80 ? 'Yüksek' : accuracy >= 50 ? 'Orta' : 'Düşük';
  const currentQ = questions[qIndex];

  const typeLabel = (type: PrepQuestion['type']) => {
    if (type === 'fill_blank') return 'BOŞLUĞU DOLDUR';
    if (type === 'error_detect') return 'HATAYI BUL';
    return 'TAMAMLA';
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {phase === 'choice' && (
            <>
              <Text style={styles.emoji}>{scenario.emoji}</Text>
              <Text style={styles.title}>{scenario.title}</Text>
              <Text style={styles.location}>{scenario.location}</Text>

              {playCount > 0 && (
                <View style={styles.returnBadge}>
                  <Text style={styles.returnText}>Tekrar oynuyorsun · {playCount}. kez</Text>
                </View>
              )}

              <TouchableOpacity style={styles.primaryBtn} onPress={() => { reset(); onEnter(0); }}>
                <Text style={styles.primaryBtnText}>Direkt sahneye gir</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.prepBtn} onPress={startPrep}>
                <Text style={styles.prepBtnTitle}>30 sn sahne hazırlığı</Text>
                <Text style={styles.prepBtnSub}>3 kısa karar · gerçek hayata hazır cümle</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backBtn} onPress={handleSkip}>
                <Text style={styles.backBtnText}>Geri</Text>
              </TouchableOpacity>
            </>
          )}

          {phase === 'loading' && (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accentWarm} size="large" />
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
                <View style={[styles.progressFill, { width: `${((qIndex + 1) / questions.length) * 100}%` as any }]} />
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
                      {isCorrect && <Text style={styles.tick}>Doğal</Text>}
                      {isWrong && <Text style={styles.cross}>Şöyle de denenebilir</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selected !== null && (
                <View style={styles.tipBox}>
                  <Text style={styles.tipText}>{currentQ.tip}</Text>
                </View>
              )}
              {selected !== null && (
                <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
                  <Text style={styles.primaryBtnText}>
                    {qIndex + 1 >= questions.length ? 'Sahne odağını gör →' : 'Sonraki →'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {phase === 'result' && (
            <>
              <Text style={styles.resultTitle}>Isınma tamamlandı</Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{accuracy}%</Text>
                  <Text style={styles.statLabel}>Doğruluk</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.accentWarm }]}>{confidence}</Text>
                  <Text style={styles.statLabel}>Hazırlık</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.accentWarm }]}>+{prepBonus}</Text>
                  <Text style={styles.statLabel}>Hazırlık katkısı</Text>
                </View>
              </View>
              {!!lastTip && (
                <View style={styles.tipBox}>
                  <Text style={styles.tipText}>{lastTip}</Text>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgMid,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 48,
    borderTopWidth: 1,
    borderColor: colors.hairlineStrong,
    minHeight: 300,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hairlineStrong,
    alignSelf: 'center',
    marginBottom: 20,
  },

  emoji: { fontSize: 36, textAlign: 'center', marginBottom: 8 },
  title: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 22,
    color: colors.inkPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  location: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 13,
    color: colors.inkTertiary,
    textAlign: 'center',
    marginBottom: 20,
  },
  returnBadge: {
    backgroundColor: `${colors.accentWarm}18`,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${colors.accentWarm}30`,
  },
  returnText: {
    fontFamily: 'InterTight_500Medium',
    color: colors.accentWarmSoft,
    fontSize: 12,
  },

  primaryBtn: {
    backgroundColor: colors.inkPrimary,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    fontFamily: 'InterTight_600SemiBold',
    color: colors.bgDeep,
    fontSize: 15,
  },
  prepBtn: {
    backgroundColor: colors.bgSoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    gap: 4,
  },
  prepBtnTitle: {
    fontFamily: 'InterTight_600SemiBold',
    color: colors.inkPrimary,
    fontSize: 14,
  },
  prepBtnSub: {
    fontFamily: 'InterTight_400Regular',
    color: colors.accentWarmSoft,
    fontSize: 12,
  },
  backBtn: { padding: 12, alignItems: 'center' },
  backBtnText: {
    fontFamily: 'InterTight_400Regular',
    color: colors.inkTertiary,
    fontSize: 14,
  },

  center: { alignItems: 'center', paddingVertical: 48, gap: 16 },
  loadingText: {
    fontFamily: 'InterTight_400Regular',
    color: colors.inkSecondary,
    fontSize: 14,
  },

  quizTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeLabel: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 10,
    color: colors.accentWarm,
    letterSpacing: 2,
  },
  quizProgress: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 13,
    color: colors.inkTertiary,
  },
  progressBar: {
    height: 2,
    backgroundColor: colors.hairlineStrong,
    borderRadius: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: { height: 2, backgroundColor: colors.accentWarm, borderRadius: 1 },

  questionBox: {
    backgroundColor: colors.bgSoft,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  questionText: {
    fontFamily: 'Fraunces_300Light',
    color: colors.inkPrimary,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  options: { gap: 8, marginBottom: 12 },
  option: {
    backgroundColor: colors.bgSoft,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  optionCorrect: { borderColor: colors.successDs, backgroundColor: `${colors.successDs}15` },
  optionWrong: { borderColor: colors.errorDs, backgroundColor: `${colors.errorDs}15` },
  optionDim: { opacity: 0.3 },
  optionText: {
    fontFamily: 'InterTight_400Regular',
    color: colors.inkPrimary,
    fontSize: 14,
    flex: 1,
  },
  tick: { color: colors.successDs, fontSize: 16, fontFamily: 'InterTight_600SemiBold' },
  cross: { color: colors.errorDs, fontSize: 16, fontFamily: 'InterTight_600SemiBold' },

  tipBox: {
    backgroundColor: `${colors.accentWarm}12`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: `${colors.accentWarm}25`,
    borderLeftWidth: 3,
    borderLeftColor: colors.accentWarm,
  },
  tipText: {
    fontFamily: 'InterTight_400Regular',
    color: colors.inkSecondary,
    fontSize: 13,
    lineHeight: 20,
  },

  resultTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 22,
    color: colors.inkPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 20,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: colors.bgSoft,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  statValue: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 22,
    color: colors.inkPrimary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 11,
    color: colors.inkTertiary,
    marginTop: 4,
  },
});
