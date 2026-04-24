import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { awardActivityXP } from '../services/progress';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { buildFlashPickQuestions, DIFFICULTY_CONFIG, Difficulty, FlashQuestion, getFlashPickMaxCount } from '../data/flashPick';
import { ModuleResult } from '../types';

type PowerUp = 'fifty_fifty' | 'time_freeze' | 'hint';

type Props = {
  onBack: () => void;
  runMode?: boolean;
  onComplete?: (result: ModuleResult) => void;
};

const NEXT_DELAY_CORRECT_MS = 420;
const NEXT_DELAY_WRONG_MS = 1200;

const comboBadge = (combo: number) => {
  if (combo >= 5) return '🚀';
  if (combo >= 3) return '⚡';
  if (combo >= 2) return '🔥';
  return '';
};

export default function FlashPickScreen({ onBack, runMode = false, onComplete }: Props) {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [questionCount, setQuestionCount] = useState(DIFFICULTY_CONFIG.easy.questionCount);

  const [questions, setQuestions] = useState<FlashQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(6);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenOptionIds, setHiddenOptionIds] = useState<string[]>([]);
  const [hintOptionId, setHintOptionId] = useState<string | null>(null);
  const [frozenUntil, setFrozenUntil] = useState<number>(0);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const timeoutHandledRef = useRef(false);

  const [power, setPower] = useState({
    fifty_fifty: 1,
    time_freeze: 1,
    hint: 1,
    totalUsed: 0,
    maxUses: 2,
  });

  const config = DIFFICULTY_CONFIG[difficulty];
  const current = questions[index];
  const accuracy = questions.length ? Math.round((correctCount / Math.max(index, 1)) * 100) : 0;

  const visibleOptions = useMemo(() => {
    if (!current) return [];
    return current.options.filter(o => !hiddenOptionIds.includes(o.id));
  }, [current, hiddenOptionIds]);

  const resetQuestionUi = () => {
    setSelectedId(null);
    setHiddenOptionIds([]);
    setHintOptionId(null);
    setLastResult(null);
    setFrozenUntil(0);
    timeoutHandledRef.current = false;
  };

  const startGame = (nextDifficulty: Difficulty) => {
    const qs = buildFlashPickQuestions(nextDifficulty, questionCount);
    const c = DIFFICULTY_CONFIG[nextDifficulty];

    setDifficulty(nextDifficulty);
    setQuestions(qs);
    setIndex(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(c.lives);
    setTimeLeft(c.seconds);
    setCorrectCount(0);
    setWrongWords([]);
    setPower({ fifty_fifty: 1, time_freeze: 1, hint: 1, totalUsed: 0, maxUses: 2 });
    resetQuestionUi();
    setPhase('playing');
  };

  const finishGame = async () => {
    const xp = Math.max(6, Math.min(28, Math.floor(score / 10) + Math.floor(maxCombo / 2)));
    await awardActivityXP(xp);
    setPhase('result');
  };

  const goNext = async (remainingLives = lives) => {
    const isLast = index + 1 >= questions.length;
    if (remainingLives <= 0 || isLast) {
      await finishGame();
      return;
    }
    setIndex(v => v + 1);
    setTimeLeft(config.seconds);
    resetQuestionUi();
  };

  const applyWrong = async () => {
    const nextLives = Math.max(0, lives - 1);
    setSelectedId('__locked__');
    setCombo(0);
    setLives(nextLives);
    setLastResult('wrong');
    if (current && !wrongWords.includes(current.prompt)) {
      setWrongWords(prev => [...prev, current.prompt]);
    }

    setTimeout(() => {
      goNext(nextLives);
    }, NEXT_DELAY_WRONG_MS);
  };

  const handleOptionPress = async (optionId: string) => {
    if (!current || selectedId) return;

    setSelectedId(optionId);
    const isCorrect = optionId === current.correctOptionId;

    if (isCorrect) {
      const nextCombo = combo + 1;
      const comboBonus = nextCombo >= 5 ? 6 : nextCombo >= 3 ? 4 : nextCombo >= 2 ? 2 : 0;
      setScore(s => s + 10 + comboBonus);
      setCombo(nextCombo);
      setMaxCombo(m => Math.max(m, nextCombo));
      setCorrectCount(v => v + 1);
      setLastResult('correct');
      setTimeout(() => {
        goNext();
      }, NEXT_DELAY_CORRECT_MS);
      return;
    }

    await applyWrong();
  };

  useEffect(() => {
    if (phase !== 'playing' || !current || selectedId) return;

    lastTickRef.current = Date.now();

    const tick = () => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      if (frozenUntil <= now) {
        setTimeLeft(prev => {
          const next = Math.max(0, prev - dt);
          if (next <= 0.001 && !timeoutHandledRef.current) {
            timeoutHandledRef.current = true;
            applyWrong();
            return 0;
          }
          return next;
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [phase, current, selectedId, frozenUntil]);

  const canUsePower = (kind: PowerUp) => {
    if (phase !== 'playing' || selectedId || !current) return false;
    if (power.totalUsed >= power.maxUses) return false;
    return power[kind] > 0;
  };

  const consumePower = (kind: PowerUp) => {
    setPower(prev => ({
      ...prev,
      [kind]: Math.max(0, prev[kind] - 1),
      totalUsed: prev.totalUsed + 1,
    }));
  };

  const useFiftyFifty = () => {
    if (!current || !canUsePower('fifty_fifty')) return;
    const wrongIds = current.options.filter(o => o.id !== current.correctOptionId).map(o => o.id);
    const hidden = wrongIds.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptionIds(hidden);
    consumePower('fifty_fifty');
  };

  const useFreeze = () => {
    if (!canUsePower('time_freeze')) return;
    setFrozenUntil(Date.now() + 2000);
    consumePower('time_freeze');
  };

  const useHint = () => {
    if (!current || !canUsePower('hint')) return;
    setHintOptionId(current.correctOptionId);
    consumePower('hint');
  };

  if (phase === 'setup') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>⚡ Flash Pick</Text>
        </View>

        <View style={styles.setupCard}>
          <Text style={styles.setupTitle}>Hızlı seçim moduna hoş geldin</Text>
          <Text style={styles.setupSub}>Bugünkü sahnede takılmamak için kelimeyi gör, doğru görseli süre dolmadan seç.</Text>

          <View style={styles.diffRow}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
                onPress={() => {
                  setDifficulty(d);
                  setQuestionCount(DIFFICULTY_CONFIG[d].questionCount);
                }}
              >
                <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>{d.toUpperCase()}</Text>
                <Text style={styles.diffMeta}>{DIFFICULTY_CONFIG[d].seconds}s</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.countLabel}>Soru Sayısı</Text>
          <View style={styles.countRow}>
            <TouchableOpacity
              style={styles.countBtn}
              onPress={() => setQuestionCount(v => Math.max(4, v - 2))}
            >
              <Text style={styles.countBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.countValue}>{questionCount}</Text>
            <TouchableOpacity
              style={styles.countBtn}
              onPress={() => setQuestionCount(v => Math.min(getFlashPickMaxCount(), v + 2))}
            >
              <Text style={styles.countBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.countMeta}>Min 4 · Max {getFlashPickMaxCount()}</Text>

          <TouchableOpacity style={styles.startBtn} onPress={() => startGame(difficulty)}>
            <Text style={styles.startBtnText}>Başla →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (phase === 'result') {
    const totalAnswered = Math.max(index, 1);
    const badge = comboBadge(maxCombo);
    const result: ModuleResult = {
      module: 'flash',
      accuracy: correctCount / totalAnswered,
      comboMax: maxCombo,
      speed: 1 / Math.max(DIFFICULTY_CONFIG[difficulty].seconds, 1),
    };

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>⚡ Flash Pick</Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>{score >= 120 ? '🏆' : '🎯'}</Text>
          <Text style={styles.resultTitle}>Run bitti</Text>
          <Text style={styles.resultScore}>{score} puan</Text>
          <Text style={styles.resultMeta}>Max combo: {maxCombo} {badge}</Text>
          <Text style={styles.resultMeta}>Doğruluk: %{Math.round((correctCount / totalAnswered) * 100)}</Text>

          {wrongWords.length > 0 && (
            <View style={styles.troubleBox}>
              <Text style={styles.troubleTitle}>Zorlandığın kelimeler</Text>
              <Text style={styles.troubleText}>{wrongWords.slice(0, 6).join(', ')}</Text>
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
  const isFreezeActive = frozenUntil > Date.now();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚡ Flash Pick</Text>
        <Text style={styles.scoreMini}>Skor {score}</Text>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.stat}>❤️ {lives}</Text>
        <Text style={styles.stat}>Combo {combo} {comboBadge(combo)}</Text>
        <Text style={styles.stat}>#{index + 1}/{questions.length}</Text>
      </View>

      <View style={styles.timerBarBg}>
        <View style={[styles.timerBarFill, { width: `${timerPct}%` }, isFreezeActive && styles.timerFrozen]} />
      </View>
      <Text style={styles.timerText}>{timeLeft.toFixed(1)}s {isFreezeActive ? '⏸' : ''}</Text>

      <View style={styles.promptCard}>
        <Text style={styles.promptLabel}>WORD</Text>
        <Text style={styles.promptText}>{current?.prompt}</Text>
      </View>

      <View style={styles.grid}>
        {visibleOptions.map(opt => {
          const isSelected = selectedId === opt.id;
          const isCorrect = selectedId !== null && current?.correctOptionId === opt.id;
          const showHint = hintOptionId === opt.id && !selectedId;

          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.option,
                showHint && styles.optionHint,
                isSelected && !isCorrect && styles.optionWrong,
                isCorrect && styles.optionCorrect,
              ]}
              onPress={() => handleOptionPress(opt.id)}
              disabled={selectedId !== null}
              activeOpacity={0.84}
            >
              <Text style={styles.optionEmoji}>{opt.visual}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.powerRow}>
        <TouchableOpacity style={[styles.powerBtn, !canUsePower('fifty_fifty') && styles.powerBtnOff]} onPress={useFiftyFifty}>
          <Text style={styles.powerText}>50/50</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.powerBtn, !canUsePower('time_freeze') && styles.powerBtnOff]} onPress={useFreeze}>
          <Text style={styles.powerText}>+2s</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.powerBtn, !canUsePower('hint') && styles.powerBtnOff]} onPress={useHint}>
          <Text style={styles.powerText}>Hint</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.feedback, lastResult === 'correct' ? styles.feedbackGood : lastResult === 'wrong' ? styles.feedbackBad : null]}>
        {lastResult === 'correct' ? 'Doğru! Combo arttı.' : lastResult === 'wrong' ? 'Kaçırdın! Combo sıfırlandı.' : 'Hızlı ol, doğruyu kap.'}
      </Text>
      <Text style={styles.accText}>Doğruluk %{accuracy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 56, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontSize: 20 },
  title: { color: colors.textPrimary, fontSize: typography.size.lg, fontWeight: typography.weight.black, marginLeft: spacing.md, flex: 1 },
  scoreMini: { color: colors.primaryAccent, fontSize: typography.size.sm, fontWeight: typography.weight.bold },

  setupCard: { marginTop: spacing.xl, backgroundColor: colors.surface, borderRadius: 18, padding: spacing.xl, borderWidth: 1, borderColor: colors.divider },
  setupTitle: { color: colors.textPrimary, fontSize: typography.size.xl, fontWeight: typography.weight.black, marginBottom: spacing.sm },
  setupSub: { color: colors.textSecondary, fontSize: typography.size.sm, lineHeight: 20, marginBottom: spacing.lg },
  diffRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  diffBtn: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.divider },
  diffBtnActive: { borderColor: colors.primaryAccent, backgroundColor: '#2A1F44' },
  diffText: { color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  diffTextActive: { color: colors.primaryAccent },
  diffMeta: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 3 },
  countLabel: { color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, marginBottom: spacing.xs },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.xs },
  countBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  countBtnText: { color: colors.textPrimary, fontSize: 24, fontWeight: typography.weight.bold, lineHeight: 24 },
  countValue: { minWidth: 52, textAlign: 'center', color: colors.textPrimary, fontSize: typography.size.xl, fontWeight: typography.weight.black },
  countMeta: { color: colors.textMuted, fontSize: typography.size.xs, textAlign: 'center', marginBottom: spacing.lg },
  startBtn: { backgroundColor: colors.primaryAccent, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center' },
  startBtnText: { color: '#0B1020', fontWeight: typography.weight.black, fontSize: typography.size.md },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  stat: { color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  timerBarBg: { height: 8, borderRadius: 99, backgroundColor: colors.surface, overflow: 'hidden', marginBottom: spacing.xs },
  timerBarFill: { height: 8, borderRadius: 99, backgroundColor: '#EF4444' },
  timerFrozen: { backgroundColor: '#60A5FA' },
  timerText: { color: colors.textMuted, fontSize: typography.size.xs, marginBottom: spacing.md, textAlign: 'right' },

  promptCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, marginBottom: spacing.md, alignItems: 'center' },
  promptLabel: { color: colors.textMuted, fontSize: typography.size.xs, letterSpacing: 1.2, fontWeight: typography.weight.bold },
  promptText: { color: colors.textPrimary, fontSize: 30, fontWeight: typography.weight.black, marginTop: spacing.sm },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  option: { width: '48.5%', backgroundColor: colors.surface, borderRadius: 14, paddingVertical: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.divider },
  optionEmoji: { fontSize: 42 },
  optionLabel: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: spacing.xs, textTransform: 'capitalize' },
  optionHint: { borderColor: '#F5B800', shadowColor: '#F5B800', shadowOpacity: 0.3, shadowRadius: 8 },
  optionCorrect: { borderColor: '#22C55E', backgroundColor: '#102417' },
  optionWrong: { borderColor: '#EF4444', backgroundColor: '#2A1016' },

  powerRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  powerBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.divider },
  powerBtnOff: { opacity: 0.45 },
  powerText: { color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: typography.size.sm },

  feedback: { marginTop: spacing.md, textAlign: 'center', color: colors.textMuted, fontSize: typography.size.sm },
  feedbackGood: { color: '#22C55E', fontWeight: typography.weight.bold },
  feedbackBad: { color: '#EF4444', fontWeight: typography.weight.bold },
  accText: { textAlign: 'center', color: colors.textMuted, fontSize: typography.size.xs, marginTop: spacing.xs },

  resultCard: { marginTop: spacing.xl, backgroundColor: colors.surface, borderRadius: 18, padding: spacing.xl, borderWidth: 1, borderColor: colors.divider, alignItems: 'center' },
  resultEmoji: { fontSize: 54, marginBottom: spacing.sm },
  resultTitle: { color: colors.textPrimary, fontSize: typography.size.xl, fontWeight: typography.weight.black },
  resultScore: { color: colors.primaryAccent, fontSize: 34, fontWeight: typography.weight.black, marginTop: spacing.sm },
  resultMeta: { color: colors.textSecondary, fontSize: typography.size.sm, marginTop: spacing.xs },
  troubleBox: { width: '100%', marginTop: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.divider },
  troubleTitle: { color: '#F5B800', fontWeight: typography.weight.bold, fontSize: typography.size.sm, marginBottom: spacing.xs },
  troubleText: { color: colors.textSecondary, fontSize: typography.size.sm, lineHeight: 19 },
});
