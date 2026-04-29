import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Animated, Easing } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { awardActivityXP } from '../services/progress';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { buildFlashPickQuestions, DIFFICULTY_CONFIG, Difficulty, FlashQuestion, getFlashPickMaxCount } from '../data/flashPick';
import { ModuleResult, UserProfile } from '../types';
import { tryParseJson } from '../services/json';
import { useAppTranslation } from '../i18n';

type PowerUp = 'fifty_fifty' | 'time_freeze' | 'hint';

type Props = {
  onBack: () => void;
  runMode?: boolean;
  runSceneTitle?: string;
  onComplete?: (result: ModuleResult) => void;
  backgroundImage?: string;
};

const NEXT_DELAY_CORRECT_MS = 420;
const NEXT_DELAY_WRONG_MS = 1200;
const RUN_READY_THRESHOLD = 0.6;

export default function FlashPickScreen({ onBack, runMode = false, runSceneTitle, onComplete, backgroundImage }: Props) {
  const t = useAppTranslation();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [questionCount, setQuestionCount] = useState(runMode ? 4 : DIFFICULTY_CONFIG.easy.questionCount);
  const [langCode, setLangCode] = useState('en');

  const [questions, setQuestions] = useState<FlashQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [practiceScore, setPracticeScore] = useState(0);
  const [practiceRun, setPracticeRun] = useState(0);
  const [bestPracticeRun, setBestPracticeRun] = useState(0);
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
  const questionTransition = useRef(new Animated.Value(1)).current;
  const phaseTransition = useRef(new Animated.Value(1)).current;

  const [power, setPower] = useState({
    fifty_fifty: 1,
    time_freeze: 1,
    hint: 1,
    totalUsed: 0,
    maxUses: 2,
  });

  const config = DIFFICULTY_CONFIG[difficulty];
  const current = questions[index];
  const accuracy = questions.length ? Math.round((correctCount / Math.max(index + 1, 1)) * 100) : 0;

  useEffect(() => {
    AsyncStorage.getItem('userProfile').then(raw => {
      if (!raw) return;
      const p = tryParseJson<UserProfile>(raw);
      const code = p?.language?.code;
      if (!code) return;
      setLangCode(code);
      setQuestionCount(v => Math.min(v, getFlashPickMaxCount(code)));
    });
  }, []);

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

  const transitionPhase = (nextPhase: typeof phase, beforeChange?: () => void) => {
    Animated.timing(phaseTransition, {
      toValue: 0,
      duration: 170,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      beforeChange?.();
      setPhase(nextPhase);
      phaseTransition.setValue(0);
      requestAnimationFrame(() => {
        Animated.timing(phaseTransition, {
          toValue: 1,
          duration: 420,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }).start();
      });
    });
  };

  const startGame = (nextDifficulty: Difficulty) => {
    const qs = buildFlashPickQuestions(nextDifficulty, langCode, questionCount);
    const c = DIFFICULTY_CONFIG[nextDifficulty];

    transitionPhase('playing', () => {
      setDifficulty(nextDifficulty);
      setQuestions(qs);
      setIndex(0);
      setPracticeScore(0);
      setPracticeRun(0);
      setBestPracticeRun(0);
      setLives(c.lives);
      setTimeLeft(c.seconds);
      setCorrectCount(0);
      setWrongWords([]);
      setPower({ fifty_fifty: 1, time_freeze: 1, hint: 1, totalUsed: 0, maxUses: 2 });
      questionTransition.setValue(1);
      resetQuestionUi();
    });
  };

  const finishGame = async () => {
    const xp = Math.max(6, Math.min(28, Math.floor(practiceScore / 10) + Math.floor(bestPracticeRun / 2)));
    await awardActivityXP(xp);
    transitionPhase('result');
  };

  const goNext = async (remainingLives = lives) => {
    const isLast = index + 1 >= questions.length;
    if (remainingLives <= 0 || isLast) {
      await finishGame();
      return;
    }
    Animated.timing(questionTransition, {
      toValue: 0,
      duration: 170,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIndex(v => v + 1);
      setTimeLeft(config.seconds);
      resetQuestionUi();
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

  const applyWrong = async () => {
    const nextLives = Math.max(0, lives - 1);
    setSelectedId('__locked__');
    setPracticeRun(0);
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
      const nextPracticeRun = practiceRun + 1;
      const runBonus = nextPracticeRun >= 5 ? 6 : nextPracticeRun >= 3 ? 4 : nextPracticeRun >= 2 ? 2 : 0;
      setPracticeScore(s => s + 10 + runBonus);
      setPracticeRun(nextPracticeRun);
      setBestPracticeRun(m => Math.max(m, nextPracticeRun));
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

  const renderContainer = (children: React.ReactNode) =>
    backgroundImage ? (
      <ImageBackground source={{ uri: backgroundImage }} style={styles.container} imageStyle={{ opacity: 0.45 }}>
        <LinearGradient colors={['rgba(10,14,20,0.65)', 'rgba(10,14,20,0.97)']} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <Animated.View
          style={{
            opacity: phaseTransition,
            transform: [{
              translateY: phaseTransition.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }),
            }],
          }}
        >
          {children}
        </Animated.View>
      </ImageBackground>
    ) : (
      <View style={styles.container}>
        <Animated.View
          style={{
            opacity: phaseTransition,
            transform: [{
              translateY: phaseTransition.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }),
            }],
          }}
        >
          {children}
        </Animated.View>
      </View>
    );

  if (phase === 'setup') {
    return renderContainer(
      <>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{runMode ? t('mini.flashWarmup') : '⚡ Flash Pick'}</Text>
        </View>

        <View style={styles.setupCard}>
          <Text style={styles.setupTitle}>{runMode ? 'Önce kelime refleksini aç' : 'Hızlı seçim moduna hoş geldin'}</Text>
          <Text style={styles.setupSub}>
            {runMode
              ? `${runSceneTitle ?? 'Bugünkü sahne'} içinde takılmamak için kilit kelimeyi görünce anlamı hemen yakala. Zorluk ve süre hazır; sadece kısa ısınmayı bitir.`
              : 'Bugünkü sahnede takılmamak için kelimeyi gör, doğru görseli süre dolmadan seç.'}
          </Text>

          {runMode ? (
            <View style={styles.runWhyBox}>
              <Text style={styles.runWhyTitle}>{t('mini.whyNow')}</Text>
              <Text style={styles.runWhyText}>Sahnede cevap seçerken beynin kelimeyi aramasın; kararını konuşmanın tonuna ayır.</Text>
            </View>
          ) : (
            <>
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

              <Text style={styles.countLabel}>{t('mini.questionCount')}</Text>
              <View style={styles.countRow}>
                <TouchableOpacity style={styles.countBtn} onPress={() => setQuestionCount(v => Math.max(4, v - 2))}>
                  <Text style={styles.countBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.countValue}>{questionCount}</Text>
                <TouchableOpacity style={styles.countBtn} onPress={() => setQuestionCount(v => Math.min(getFlashPickMaxCount(langCode), v + 2))}>
                  <Text style={styles.countBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.countMeta}>Min 4 · Max {getFlashPickMaxCount(langCode)}</Text>
            </>
          )}

          <View style={styles.setupHintRow}>
            <Text style={styles.setupHintStrong}>{questionCount} hızlı seçim</Text>
            <Text style={styles.setupHintText}>Sahne öncesi kelime refleksi</Text>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={() => startGame(difficulty)}>
            <Text style={styles.startBtnText}>{runMode ? t('mini.flashStart') : t('mini.start')}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  if (phase === 'result') {
    const totalAnswered = Math.max(index + 1, 1);
    const resultAccuracy = correctCount / totalAnswered;
    const resultPercent = Math.round(resultAccuracy * 100);
    const shouldRepeatWarmup = runMode && resultAccuracy < RUN_READY_THRESHOLD;
    const result: ModuleResult = {
      module: 'flash',
      accuracy: resultAccuracy,
      comboMax: bestPracticeRun,
      speed: 1 / Math.max(DIFFICULTY_CONFIG[difficulty].seconds, 1),
    };

    return renderContainer(
      <>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{runMode ? t('mini.flashWarmup') : 'Kelime ısınması'}</Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{shouldRepeatWarmup ? 'Bir tur daha iyi olur' : runMode ? t('mini.flashReady') : t('mini.runDone')}</Text>
          <Text style={styles.resultScore}>%{resultPercent}</Text>
          <Text style={styles.resultMeta}>Kelime refleksi</Text>
          <Text style={styles.resultMeta}>Kesintisiz doğru seçim: {bestPracticeRun}</Text>
          <Text style={styles.resultMeta}>{t('mini.accuracy', { value: resultPercent })}</Text>
          {shouldRepeatWarmup && <Text style={styles.resultAdvice}>%60'ın altında kaldın. Sahneye geçmeden önce kelimeleri bir kez daha ısıtalım.</Text>}

          {wrongWords.length > 0 && (
            <View style={styles.troubleBox}>
              <Text style={styles.troubleTitle}>Zorlandığın kelimeler</Text>
              <Text style={styles.troubleText}>{wrongWords.slice(0, 6).join(', ')}</Text>
            </View>
          )}

          {runMode && onComplete ? (
            shouldRepeatWarmup ? (
              <>
                <TouchableOpacity style={styles.startBtn} onPress={() => startGame(difficulty)}>
                  <Text style={styles.startBtnText}>Kelime ısınmasını tekrar et</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => onComplete(result)}>
                  <Text style={styles.secondaryBtnText}>Yine de ton ısınmasına geç</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.startBtn} onPress={() => onComplete(result)}>
                <Text style={styles.startBtnText}>Ton ısınmasına geç →</Text>
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity style={styles.startBtn} onPress={() => startGame(difficulty)}>
              <Text style={styles.startBtnText}>{t('mini.playAgain')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {runMode && (
          <View style={styles.runStepsCard}>
            <Text style={styles.runStepsEyebrow}>SAHNE AKIŞI</Text>
            <View style={styles.runStepRow}>
              <View style={[styles.runStepDot, shouldRepeatWarmup ? styles.runStepDotActive : styles.runStepDotDone]} />
              <View style={[styles.runStepLine, shouldRepeatWarmup && styles.runStepLineDim]} />
              <View style={[styles.runStepDot, shouldRepeatWarmup ? styles.runStepDotDim : styles.runStepDotActive]} />
              <View style={[styles.runStepLine, styles.runStepLineDim]} />
              <View style={[styles.runStepDot, styles.runStepDotDim]} />
            </View>
            <View style={styles.runStepLabels}>
              <Text style={[styles.runStepLabel, shouldRepeatWarmup ? styles.runStepLabelActive : styles.runStepLabelDone]}>Kelime{'\n'}ısınması</Text>
              <Text style={[styles.runStepLabel, shouldRepeatWarmup ? styles.runStepLabelDim : styles.runStepLabelActive]}>Ton{'\n'}provası</Text>
              <Text style={[styles.runStepLabel, styles.runStepLabelDim]}>Sahne</Text>
            </View>
          </View>
        )}
      </>
    );
  }

  const timerPct = Math.max(0, Math.min((timeLeft / config.seconds) * 100, 100));
  const isFreezeActive = frozenUntil > Date.now();

  return renderContainer(
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{runMode ? t('mini.flashWarmup') : 'Kelime ısınması'}</Text>
        <Text style={styles.scoreMini}>{index + 1}/{questions.length}</Text>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.stat}>Hak {lives}</Text>
        <Text style={styles.stat}>Akış {practiceRun}</Text>
        <Text style={styles.stat}>Kalan {Math.ceil(timeLeft)}s</Text>
      </View>

      <View style={styles.timerBarBg}>
        <View style={[styles.timerBarFill, { width: `${timerPct}%` }, isFreezeActive && styles.timerFrozen]} />
      </View>
      <Text style={styles.timerText}>{timeLeft.toFixed(1)}s {isFreezeActive ? '⏸' : ''}</Text>

      <Animated.View
        style={{
          opacity: questionTransition,
          transform: [{
            translateY: questionTransition.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }),
          }],
        }}
      >
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
                <View style={styles.optionIconPlate}>
                  <FontAwesome5
                    name={opt.visual as any}
                    size={34}
                    color={isCorrect ? colors.successDs : isSelected && !isCorrect ? colors.errorDs : colors.accentWarm}
                  />
                </View>
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
          {lastResult === 'correct' ? t('mini.correct') : lastResult === 'wrong' ? t('mini.wrong') : t('mini.fast')}
        </Text>
        <Text style={styles.accText}>Doğruluk %{accuracy}</Text>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep, paddingTop: 56, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgMid, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.inkPrimary, fontSize: 20 },
  title: { color: colors.inkPrimary, fontSize: typography.size.lg, fontWeight: typography.weight.black, marginLeft: spacing.md, flex: 1 },
  scoreMini: { color: colors.accentWarm, fontSize: typography.size.sm, fontWeight: typography.weight.bold },

  setupCard: { marginTop: spacing.xl, backgroundColor: colors.bgMid, borderRadius: 18, padding: spacing.xl, borderWidth: 1, borderColor: colors.hairline },
  setupTitle: { color: colors.inkPrimary, fontSize: typography.size.xl, fontWeight: typography.weight.black, marginBottom: spacing.sm },
  setupSub: { color: colors.inkSecondary, fontSize: typography.size.sm, lineHeight: 20, marginBottom: spacing.lg },
  diffRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  diffBtn: { flex: 1, backgroundColor: colors.bgSoft, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.hairline },
  diffBtnActive: { borderColor: colors.accentWarm, backgroundColor: colors.bgSoft },
  diffText: { color: colors.inkPrimary, fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  diffTextActive: { color: colors.accentWarm },
  diffMeta: { color: colors.inkTertiary, fontSize: typography.size.xs, marginTop: 3 },
  countLabel: { color: colors.inkSecondary, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, marginBottom: spacing.xs },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.xs },
  countBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.bgSoft, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center' },
  countBtnText: { color: colors.inkPrimary, fontSize: 24, fontWeight: typography.weight.bold, lineHeight: 24 },
  countValue: { minWidth: 52, textAlign: 'center', color: colors.inkPrimary, fontSize: typography.size.xl, fontWeight: typography.weight.black },
  countMeta: { color: colors.inkTertiary, fontSize: typography.size.xs, textAlign: 'center', marginBottom: spacing.lg },
  setupHintRow: { backgroundColor: colors.bgSoft, borderRadius: 14, padding: spacing.md, borderWidth: 1, borderColor: colors.hairlineStrong, marginBottom: spacing.lg, gap: 3 },
  setupHintStrong: { color: colors.inkPrimary, fontSize: typography.size.sm, fontWeight: typography.weight.black },
  setupHintText: { color: colors.inkSecondary, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  runWhyBox: { backgroundColor: colors.bgSoft, borderRadius: 14, padding: spacing.md, borderWidth: 1, borderColor: colors.hairlineStrong, marginBottom: spacing.lg },
  runWhyTitle: { color: colors.accentWarm, fontSize: typography.size.xs, fontWeight: typography.weight.black, letterSpacing: 1, marginBottom: spacing.xs },
  runWhyText: { color: colors.inkSecondary, fontSize: typography.size.sm, lineHeight: 20, fontWeight: typography.weight.semibold },
  startBtn: { backgroundColor: colors.accentWarm, borderRadius: 12, paddingVertical: 18, alignItems: 'center', marginTop: spacing.md, alignSelf: 'stretch' },
  startBtnText: { color: colors.bgDeep, fontFamily: 'InterTight_600SemiBold', fontSize: 15 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  stat: { color: colors.inkSecondary, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  timerBarBg: { height: 8, borderRadius: 99, backgroundColor: colors.bgMid, overflow: 'hidden', marginBottom: spacing.xs },
  timerBarFill: { height: 8, borderRadius: 99, backgroundColor: colors.accentWarm },
  timerFrozen: { backgroundColor: 'rgba(95,124,168,0.5)' },
  timerText: { color: colors.inkTertiary, fontSize: typography.size.xs, marginBottom: spacing.md, textAlign: 'right' },

  promptCard: { backgroundColor: colors.bgMid, borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, padding: spacing.lg, marginBottom: spacing.md, alignItems: 'center' },
  promptLabel: { color: colors.inkTertiary, fontSize: typography.size.xs, letterSpacing: 1.2, fontWeight: typography.weight.bold },
  promptText: { color: colors.inkPrimary, fontSize: 30, fontWeight: typography.weight.black, marginTop: spacing.sm },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  option: { width: '48.5%', backgroundColor: colors.bgMid, borderRadius: 14, paddingVertical: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.hairline },
  optionIconPlate: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232,181,118,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232,181,118,0.16)',
  },
  optionLabel: { color: colors.inkTertiary, fontSize: typography.size.xs, marginTop: spacing.xs, textTransform: 'capitalize' },
  optionHint: { borderColor: colors.accentWarm, shadowColor: colors.accentWarm, shadowOpacity: 0.22, shadowRadius: 8 },
  optionCorrect: { borderColor: colors.successDs, backgroundColor: colors.successDsSoft },
  optionWrong: { borderColor: colors.errorDs, backgroundColor: colors.errorDsSoft },

  powerRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  powerBtn: { flex: 1, backgroundColor: colors.bgMid, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.hairline },
  powerBtnOff: { opacity: 0.45 },
  powerText: { color: colors.inkPrimary, fontWeight: typography.weight.bold, fontSize: typography.size.sm },

  feedback: { marginTop: spacing.md, textAlign: 'center', color: colors.inkTertiary, fontSize: typography.size.sm },
  feedbackGood: { color: colors.success, fontWeight: typography.weight.bold },
  feedbackBad: { color: colors.errorDs, fontWeight: typography.weight.bold },
  accText: { textAlign: 'center', color: colors.inkTertiary, fontSize: typography.size.xs, marginTop: spacing.xs },

  resultCard: { marginTop: spacing.xl, backgroundColor: colors.bgMid, borderRadius: 18, padding: spacing.xl, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center' },
  resultEmoji: { fontSize: 54, marginBottom: spacing.sm },
  resultTitle: { color: colors.inkPrimary, fontSize: typography.size.xl, fontWeight: typography.weight.black },
  resultScore: { color: colors.accentWarm, fontSize: 34, fontWeight: typography.weight.black, marginTop: spacing.sm },
  resultMeta: { color: colors.inkSecondary, fontSize: typography.size.sm, marginTop: spacing.xs },
  resultAdvice: { color: colors.inkPrimary, fontSize: typography.size.sm, lineHeight: 20, textAlign: 'center', marginTop: spacing.md, opacity: 0.86 },
  secondaryBtn: { marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center' },
  secondaryBtnText: { color: colors.inkSecondary, fontFamily: 'InterTight_500Medium', fontSize: 13 },
  troubleBox: { width: '100%', marginTop: spacing.md, backgroundColor: colors.bgSoft, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.hairline },
  troubleTitle: { color: colors.accentWarm, fontWeight: typography.weight.bold, fontSize: typography.size.sm, marginBottom: spacing.xs },
  troubleText: { color: colors.inkSecondary, fontSize: typography.size.sm, lineHeight: 19 },

  runStepsCard: { marginTop: spacing.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.lg },
  runStepsEyebrow: { color: colors.inkTertiary, fontSize: 10, letterSpacing: 2.4, fontFamily: 'InterTight_500Medium', textTransform: 'uppercase', textAlign: 'center', marginBottom: spacing.lg },
  runStepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  runStepDot: { width: 10, height: 10, borderRadius: 5 },
  runStepDotDone: { backgroundColor: colors.accentWarmSoft },
  runStepDotActive: { width: 13, height: 13, borderRadius: 7, backgroundColor: colors.accentWarm, shadowColor: colors.accentWarm, shadowOpacity: 0.5, shadowRadius: 6 },
  runStepDotDim: { backgroundColor: colors.bgSoft, borderWidth: 1, borderColor: colors.hairlineStrong },
  runStepLine: { flex: 1, height: 1, backgroundColor: colors.accentWarmSoft, marginHorizontal: spacing.sm, maxWidth: 64 },
  runStepLineDim: { backgroundColor: colors.hairline },
  runStepLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  runStepLabel: { fontSize: 11, textAlign: 'center', lineHeight: 15, flex: 1 },
  runStepLabelDone: { color: colors.accentWarmSoft, fontFamily: 'InterTight_400Regular' },
  runStepLabelActive: { color: colors.accentWarm, fontFamily: 'InterTight_600SemiBold' },
  runStepLabelDim: { color: colors.inkTertiary, fontFamily: 'InterTight_400Regular' },
});
