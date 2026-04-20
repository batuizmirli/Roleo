import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { awardActivityXP } from '../services/progress';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { buildTrueFakeSet, getTrueFakeMaxCount, SentenceItem, TRUE_FAKE_CONFIG, TrueFakeDifficulty } from '../data/trueOrFake';
import { ModuleResult } from '../types';

type Props = {
  onBack: () => void;
  runMode?: boolean;
  onComplete?: (result: ModuleResult) => void;
};

const comboBadge = (combo: number) => {
  if (combo >= 6) return '🚀';
  if (combo >= 4) return '⚡';
  if (combo >= 2) return '🔥';
  return '';
};

export default function TrueOrFakeScreen({ onBack, runMode = false, onComplete }: Props) {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [difficulty, setDifficulty] = useState<TrueFakeDifficulty>('easy');
  const [questionCount, setQuestionCount] = useState(TRUE_FAKE_CONFIG.easy.count);
  const [items, setItems] = useState<SentenceItem[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [selected, setSelected] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string; correction: string; explanation: string } | null>(null);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [awaitingManualNext, setAwaitingManualNext] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const timeoutHandledRef = useRef(false);

  const config = TRUE_FAKE_CONFIG[difficulty];
  const current = items[index];

  const resetQuestion = () => {
    setSelected(null);
    setFeedback(null);
    setAwaitingManualNext(false);
    timeoutHandledRef.current = false;
  };

  const startGame = (d: TrueFakeDifficulty) => {
    const set = buildTrueFakeSet(d, questionCount);
    setDifficulty(d);
    setItems(set);
    setIndex(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setStreak(0);
    setCorrectCount(0);
    setMistakes([]);
    setTimeLeft(TRUE_FAKE_CONFIG[d].seconds);
    resetQuestion();
    setPhase('playing');
  };

  const finishGame = async () => {
    const xp = Math.max(6, Math.min(30, Math.floor(score / 12) + Math.floor(maxCombo / 2)));
    await awardActivityXP(xp);
    setPhase('result');
  };

  const next = async () => {
    const isLast = index + 1 >= items.length;
    if (isLast) {
      await finishGame();
      return;
    }
    setIndex(i => i + 1);
    setTimeLeft(config.seconds);
    resetQuestion();
  };

  const buildCorrectionText = (item: SentenceItem) => {
    if (!item.isReal) return item.correction ?? item.text;
    return item.text;
  };

  const evaluate = async (pickedReal: boolean) => {
    if (!current || selected !== null) return;

    setSelected(pickedReal);
    const isCorrect = pickedReal === current.isReal;

    if (isCorrect) {
      const nextCombo = combo + 1;
      const multiplier = nextCombo >= 6 ? 1.8 : nextCombo >= 4 ? 1.5 : nextCombo >= 2 ? 1.2 : 1;
      const add = Math.round(10 * multiplier);
      setScore(s => s + add);
      setCombo(nextCombo);
      setStreak(st => st + 1);
      setMaxCombo(m => Math.max(m, nextCombo));
      setCorrectCount(c => c + 1);
      setFeedback({
        correct: true,
        text: current.isReal ? '✅ Real' : '✅ Fake',
        correction: current.isReal ? current.text : (current.correction ?? current.text),
        explanation: current.explanation,
      });
      setAwaitingManualNext(false);
    } else {
      setCombo(0);
      setStreak(0);
      if (!mistakes.includes(current.text)) {
        setMistakes(prev => [...prev, current.text]);
      }
      setFeedback({
        correct: false,
        text: current.isReal ? '❌ Real' : '❌ Fake',
        correction: buildCorrectionText(current),
        explanation: current.explanation,
      });
      setAwaitingManualNext(true);
    }

    if (isCorrect) {
      setTimeout(() => {
        next();
      }, 760);
    }
  };

  useEffect(() => {
    if (phase !== 'playing' || !current || selected !== null) return;

    lastTickRef.current = Date.now();

    const tick = () => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setTimeLeft(prev => {
        const nextVal = Math.max(0, prev - dt);
        if (nextVal <= 0.001 && !timeoutHandledRef.current) {
          timeoutHandledRef.current = true;
          evaluate(!current.isReal);
          return 0;
        }
        return nextVal;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [phase, current, selected]);

  if (phase === 'setup') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>✅ True or Fake</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gerçek mi, fake mi?</Text>
          <Text style={styles.cardSub}>Cümleyi gör, 2 butondan seç, hızlı karar ver.</Text>

          <View style={styles.diffRow}>
            {(['easy', 'medium', 'hard'] as TrueFakeDifficulty[]).map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
                onPress={() => {
                  setDifficulty(d);
                  setQuestionCount(TRUE_FAKE_CONFIG[d].count);
                }}
              >
                <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>{d.toUpperCase()}</Text>
                <Text style={styles.diffMeta}>{TRUE_FAKE_CONFIG[d].seconds}s</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.countLabel}>Soru Sayısı</Text>
          <View style={styles.countRow}>
            <TouchableOpacity
              style={styles.countBtn}
              onPress={() => setQuestionCount(v => Math.max(6, v - 2))}
            >
              <Text style={styles.countBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.countValue}>{questionCount}</Text>
            <TouchableOpacity
              style={styles.countBtn}
              onPress={() => setQuestionCount(v => Math.min(getTrueFakeMaxCount(difficulty), v + 2))}
            >
              <Text style={styles.countBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.countMeta}>Min 6 · Max {getTrueFakeMaxCount(difficulty)}</Text>

          <TouchableOpacity style={styles.startBtn} onPress={() => startGame(difficulty)}>
            <Text style={styles.startBtnText}>Başla →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (phase === 'result') {
    const total = Math.max(items.length, 1);
    const accuracy = Math.round((correctCount / total) * 100);
    const result: ModuleResult = {
      module: 'truefake',
      accuracy: correctCount / total,
      comboMax: maxCombo,
      speed: 1 / Math.max(TRUE_FAKE_CONFIG[difficulty].seconds, 1),
    };

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>✅ True or Fake</Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>{score > 120 ? '🏆' : '🎯'}</Text>
          <Text style={styles.resultTitle}>Run bitti</Text>
          <Text style={styles.resultScore}>{score} puan</Text>
          <Text style={styles.resultMeta}>Max combo: {maxCombo} {comboBadge(maxCombo)}</Text>
          <Text style={styles.resultMeta}>Doğruluk: %{accuracy}</Text>

          {mistakes.length > 0 && (
            <View style={styles.mistakeBox}>
              <Text style={styles.mistakeTitle}>En çok hata yapılanlar</Text>
              <Text style={styles.mistakeText}>{mistakes.slice(0, 5).join(' • ')}</Text>
            </View>
          )}

          {runMode && onComplete ? (
            <TouchableOpacity style={styles.startBtn} onPress={() => onComplete(result)}>
              <Text style={styles.startBtnText}>Daily Run’da Devam Et →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.startBtn} onPress={() => startGame(difficulty)}>
              <Text style={styles.startBtnText}>Tekrar Oyna</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const timerPct = Math.max(0, Math.min((timeLeft / config.seconds) * 100, 100));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>✅ True or Fake</Text>
        <Text style={styles.scoreMini}>{score}</Text>
      </View>

      <View style={styles.topRow}>
        <Text style={styles.topStat}>Combo {combo} {comboBadge(combo)}</Text>
        <Text style={styles.topStat}>Streak {streak}</Text>
        <Text style={styles.topStat}>#{index + 1}/{items.length}</Text>
      </View>

      <View style={styles.timerBg}>
        <View style={[styles.timerFill, { width: `${timerPct}%` }]} />
      </View>

      <View style={styles.sentenceCard}>
        <Text style={styles.sentenceText}>{current?.text}</Text>
      </View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.pickBtn, styles.realBtn, selected !== null && selected !== true && styles.pickDim]}
          onPress={() => evaluate(true)}
          disabled={selected !== null}
        >
          <Text style={styles.pickText}>✅ Real</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pickBtn, styles.fakeBtn, selected !== null && selected !== false && styles.pickDim]}
          onPress={() => evaluate(false)}
          disabled={selected !== null}
        >
          <Text style={styles.pickText}>❌ Fake</Text>
        </TouchableOpacity>
      </View>

      {feedback && (
        <View style={[styles.feedbackBox, feedback.correct ? styles.feedbackGood : styles.feedbackBad]}>
          <Text style={styles.feedbackMain}>{feedback.text}</Text>
          {!feedback.correct && (
            <Text style={styles.feedbackCorrection}>Doğrusu: {feedback.correction}</Text>
          )}
          <Text style={styles.feedbackExplain}>{feedback.explanation}</Text>
          {!feedback.correct && awaitingManualNext && (
            <TouchableOpacity style={styles.nextBtn} onPress={next}>
              <Text style={styles.nextBtnText}>Sıradaki →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 56, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontSize: 20 },
  title: { color: colors.textPrimary, fontSize: typography.size.lg, fontWeight: typography.weight.black, marginLeft: spacing.md, flex: 1 },
  scoreMini: { color: colors.primaryAccent, fontWeight: typography.weight.bold },

  card: { marginTop: spacing.xl, backgroundColor: colors.surface, borderRadius: 18, padding: spacing.xl, borderWidth: 1, borderColor: colors.divider },
  cardTitle: { color: colors.textPrimary, fontSize: typography.size.xl, fontWeight: typography.weight.black, marginBottom: spacing.sm },
  cardSub: { color: colors.textSecondary, fontSize: typography.size.sm, marginBottom: spacing.lg },
  diffRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  diffBtn: { flex: 1, alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 12, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.divider },
  diffBtnActive: { borderColor: colors.primaryAccent, backgroundColor: '#2A1F44' },
  diffText: { color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  diffTextActive: { color: colors.primaryAccent },
  diffMeta: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2 },
  countLabel: { color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, marginBottom: spacing.xs },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.xs },
  countBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  countBtnText: { color: colors.textPrimary, fontSize: 24, fontWeight: typography.weight.bold, lineHeight: 24 },
  countValue: { minWidth: 52, textAlign: 'center', color: colors.textPrimary, fontSize: typography.size.xl, fontWeight: typography.weight.black },
  countMeta: { color: colors.textMuted, fontSize: typography.size.xs, textAlign: 'center', marginBottom: spacing.lg },
  startBtn: { backgroundColor: colors.primaryAccent, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center' },
  startBtnText: { color: '#0B1020', fontWeight: typography.weight.black, fontSize: typography.size.md },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  topStat: { color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  timerBg: { height: 8, borderRadius: 99, backgroundColor: colors.surface, overflow: 'hidden', marginBottom: spacing.md },
  timerFill: { height: 8, borderRadius: 99, backgroundColor: '#EF4444' },

  sentenceCard: { minHeight: 170, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.divider, padding: spacing.xl, justifyContent: 'center', marginBottom: spacing.md },
  sentenceText: { color: colors.textPrimary, fontSize: 28, fontWeight: typography.weight.black, textAlign: 'center', lineHeight: 38 },

  buttonsRow: { flexDirection: 'row', gap: spacing.sm },
  pickBtn: { flex: 1, borderRadius: 14, paddingVertical: spacing.lg, alignItems: 'center', borderWidth: 1 },
  realBtn: { backgroundColor: '#102417', borderColor: '#22C55E77' },
  fakeBtn: { backgroundColor: '#2A1016', borderColor: '#FB718577' },
  pickText: { color: '#F8FAFC', fontSize: typography.size.md, fontWeight: typography.weight.black },
  pickDim: { opacity: 0.45 },

  feedbackBox: { marginTop: spacing.md, borderRadius: 12, padding: spacing.md, borderWidth: 1 },
  feedbackGood: { backgroundColor: '#102417', borderColor: '#22C55E66' },
  feedbackBad: { backgroundColor: '#2A1016', borderColor: '#FB718566' },
  feedbackMain: { color: colors.textPrimary, fontSize: typography.size.md, fontWeight: typography.weight.black },
  feedbackCorrection: { color: '#FCD34D', fontSize: typography.size.sm, fontWeight: typography.weight.bold, marginTop: spacing.xs },
  feedbackExplain: { color: colors.textSecondary, fontSize: typography.size.sm, marginTop: spacing.xs },
  nextBtn: { marginTop: spacing.sm, backgroundColor: colors.primaryAccent, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  nextBtnText: { color: '#0B1020', fontWeight: typography.weight.black, fontSize: typography.size.sm },

  resultCard: { marginTop: spacing.xl, backgroundColor: colors.surface, borderRadius: 18, padding: spacing.xl, borderWidth: 1, borderColor: colors.divider, alignItems: 'center' },
  resultEmoji: { fontSize: 54 },
  resultTitle: { color: colors.textPrimary, fontSize: typography.size.xl, fontWeight: typography.weight.black, marginTop: spacing.sm },
  resultScore: { color: colors.primaryAccent, fontSize: 34, fontWeight: typography.weight.black, marginTop: spacing.sm },
  resultMeta: { color: colors.textSecondary, fontSize: typography.size.sm, marginTop: spacing.xs },
  mistakeBox: { width: '100%', marginTop: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.divider },
  mistakeTitle: { color: '#F5B800', fontSize: typography.size.sm, fontWeight: typography.weight.bold, marginBottom: spacing.xs },
  mistakeText: { color: colors.textSecondary, fontSize: typography.size.sm, lineHeight: 20 },
});
