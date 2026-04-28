import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { awardActivityXP } from '../services/progress';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { buildTrueFakeSet, buildScenarioTrueFakeItems, getTrueFakeMaxCount, SentenceItem, TRUE_FAKE_CONFIG, TrueFakeDifficulty } from '../data/trueOrFake';
import { ModuleResult, Scenario, UserProfile } from '../types';
import { tryParseJson } from '../services/json';
import { useAppTranslation } from '../i18n';

type Props = {
  onBack: () => void;
  runMode?: boolean;
  runSceneTitle?: string;
  onComplete?: (result: ModuleResult) => void;
  /** When provided, prioritises scene-specific phrases over generic bank. */
  scenario?: Scenario;
};

export default function TrueOrFakeScreen({ onBack, runMode = false, runSceneTitle, onComplete, scenario }: Props) {
  const t = useAppTranslation();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [difficulty, setDifficulty] = useState<TrueFakeDifficulty>('easy');
  const [questionCount, setQuestionCount] = useState(runMode ? 6 : TRUE_FAKE_CONFIG.easy.count);
  const [langCode, setLangCode] = useState('en');
  const [items, setItems] = useState<SentenceItem[]>([]);
  const [index, setIndex] = useState(0);
  const [clarityScore, setClarityScore] = useState(0);
  const [practiceRun, setPracticeRun] = useState(0);
  const [bestPracticeRun, setBestPracticeRun] = useState(0);
  const [, setNaturalRun] = useState(0);
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

  useEffect(() => {
    AsyncStorage.getItem('userProfile').then(raw => {
      if (!raw) return;
      const p = tryParseJson<UserProfile>(raw);
      if (p?.language?.code) setLangCode(p.language.code);
    });
  }, []);

  const resetQuestion = () => {
    setSelected(null);
    setFeedback(null);
    setAwaitingManualNext(false);
    timeoutHandledRef.current = false;
  };

  const startGame = (d: TrueFakeDifficulty) => {
    // Build scene-specific items first; fill remaining slots with generic bank
    const sceneItems = scenario
      ? buildScenarioTrueFakeItems(scenario.usefulPhrases, scenario.likelyMisunderstandings)
      : [];
    const remaining = Math.max(0, questionCount - sceneItems.length);
    const genericItems = buildTrueFakeSet(d, langCode, remaining);
    // Interleave: up to 3 scene items at start, rest generic, then shuffle tail
    const sceneHead = sceneItems.slice(0, Math.min(3, sceneItems.length));
    const tail = [...sceneItems.slice(3), ...genericItems].sort(() => Math.random() - 0.5);
    const set = [...sceneHead, ...tail].slice(0, questionCount);
    setDifficulty(d);
    setItems(set);
    setIndex(0);
    setClarityScore(0);
    setPracticeRun(0);
    setBestPracticeRun(0);
    setNaturalRun(0);
    setCorrectCount(0);
    setMistakes([]);
    setTimeLeft(TRUE_FAKE_CONFIG[d].seconds);
    resetQuestion();
    setPhase('playing');
  };

  const finishGame = async () => {
    const xp = Math.max(6, Math.min(30, Math.floor(clarityScore / 12) + Math.floor(bestPracticeRun / 2)));
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
      const nextPracticeRun = practiceRun + 1;
      const multiplier = nextPracticeRun >= 6 ? 1.8 : nextPracticeRun >= 4 ? 1.5 : nextPracticeRun >= 2 ? 1.2 : 1;
      const add = Math.round(10 * multiplier);
      setClarityScore(s => s + add);
      setPracticeRun(nextPracticeRun);
      setNaturalRun(st => st + 1);
      setBestPracticeRun(m => Math.max(m, nextPracticeRun));
      setCorrectCount(c => c + 1);
      setFeedback({
        correct: true,
        text: current.isReal ? 'Doğal geliyor' : 'Garipliği yakaladın',
        correction: current.isReal ? current.text : (current.correction ?? current.text),
        explanation: current.explanation,
      });
      setAwaitingManualNext(false);
    } else {
      setPracticeRun(0);
      setNaturalRun(0);
      if (!mistakes.includes(current.text)) {
        setMistakes(prev => [...prev, current.text]);
      }
      setFeedback({
        correct: false,
        text: current.isReal ? 'Aslında doğal bir cümleydi' : 'Bu kullanım sahnede garip kaçar',
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
          <Text style={styles.title}>{runMode ? t('mini.toneWarmup') : 'Ton provası'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {runMode
              ? 'Şimdi doğal tonu ayır'
              : scenario
                ? `${scenario.title} · ton provası`
                : 'Doğal mı, garip mi?'}
          </Text>
          <Text style={styles.cardSub}>
            {runMode
              ? `${runSceneTitle ?? scenario?.title ?? 'Bugünkü sahne'} başlamadan önce kulağını aç: hangi cümle gerçek hayatta doğal, hangisi sahneyi garipleştirir?`
              : scenario
                ? `Bu sahnede seni zorlayacak tonlar — hangisi doğal, hangisi fazla direkt ya da yanlış bağlamda?`
                : 'Bugünkü sahnede doğal kalmak için cümleyi gör, doğru tonu hızlı seç.'}
          </Text>

          {runMode ? (
            <View style={styles.runWhyBox}>
              <Text style={styles.runWhyTitle}>{t('mini.whyNow')}</Text>
              <Text style={styles.runWhyText}>
                {scenario
                  ? `"${scenario.title}" sahnesinde amaç çeviri yapmak değil; baskı altında kulağa doğal gelen cevabı seçmek.`
                  : 'Ana sahnede amaç çeviri yapmak değil; baskı altında kulağa doğal gelen cevabı seçmek.'}
              </Text>
            </View>
          ) : (
            <>
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

              <Text style={styles.countLabel}>{t('mini.questionCount')}</Text>
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
                  onPress={() => setQuestionCount(v => Math.min(getTrueFakeMaxCount(difficulty, langCode), v + 2))}
                >
                  <Text style={styles.countBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.countMeta}>Min 6 · Max {getTrueFakeMaxCount(difficulty, langCode)}</Text>
            </>
          )}

          <View style={styles.setupHintRow}>
            <Text style={styles.setupHintStrong}>{questionCount} ton kararı</Text>
            <Text style={styles.setupHintText}>Sahne öncesi doğal cevap provası</Text>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={() => startGame(difficulty)}>
            <Text style={styles.startBtnText}>{runMode ? t('mini.toneStart') : t('mini.start')}</Text>
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
      comboMax: bestPracticeRun,
      speed: 1 / Math.max(TRUE_FAKE_CONFIG[difficulty].seconds, 1),
    };

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{runMode ? t('mini.toneWarmup') : 'Ton provası'}</Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{runMode ? 'Sahne için hazırsın' : 'Ton provası tamamlandı'}</Text>
          <Text style={styles.resultScore}>%{accuracy}</Text>
          <Text style={styles.resultMeta}>Doğal seçim oranı</Text>
          <Text style={styles.resultMeta}>Bir sonraki prova için {mistakes.length > 0 ? 'garip kaçan cümleleri yumuşat' : 'aynı sakin ritmi koru'}.</Text>

          {mistakes.length > 0 && (
            <View style={styles.mistakeBox}>
              <Text style={styles.mistakeTitle}>Şöyle de denenebilir</Text>
              <Text style={styles.mistakeText}>{mistakes.slice(0, 5).join(' • ')}</Text>
            </View>
          )}

          {runMode && onComplete ? (
            <TouchableOpacity style={styles.startBtn} onPress={() => onComplete(result)}>
              <Text style={styles.startBtnText}>Bugünkü sahneye gir →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.startBtn} onPress={() => startGame(difficulty)}>
              <Text style={styles.startBtnText}>Bu anı tekrar çalış</Text>
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
        <Text style={styles.title}>{runMode ? t('mini.toneWarmup') : 'Ton provası'}</Text>
        <Text style={styles.scoreMini}>{index + 1}/{items.length}</Text>
      </View>

      <View style={styles.topRow}>
        <Text style={styles.topStat}>Akış {practiceRun}</Text>
        <Text style={styles.topStat}>Doğal seçim {correctCount}</Text>
        <Text style={styles.topStat}>Kalan {Math.ceil(timeLeft)}s</Text>
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
          <Text style={styles.pickText}>Doğal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pickBtn, styles.fakeBtn, selected !== null && selected !== false && styles.pickDim]}
          onPress={() => evaluate(false)}
          disabled={selected !== null}
        >
          <Text style={styles.pickText}>Garip</Text>
        </TouchableOpacity>
      </View>

      {feedback && (
        <View style={[styles.feedbackBox, feedback.correct ? styles.feedbackGood : styles.feedbackBad]}>
          <Text style={styles.feedbackMain}>{feedback.text}</Text>
          {!feedback.correct && (
            <Text style={styles.feedbackCorrection}>{t('mini.corrected', { text: feedback.correction })}</Text>
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
  container: { flex: 1, backgroundColor: colors.bgDeep, paddingTop: 56, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgMid, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.inkPrimary, fontSize: 20 },
  title: { color: colors.inkPrimary, fontSize: typography.size.lg, fontWeight: typography.weight.black, marginLeft: spacing.md, flex: 1 },
  scoreMini: { color: colors.accentWarm, fontWeight: typography.weight.bold },

  card: { marginTop: spacing.xl, backgroundColor: colors.bgMid, borderRadius: 18, padding: spacing.xl, borderWidth: 1, borderColor: colors.hairline },
  cardTitle: { color: colors.inkPrimary, fontSize: typography.size.xl, fontWeight: typography.weight.black, marginBottom: spacing.sm },
  cardSub: { color: colors.inkSecondary, fontSize: typography.size.sm, marginBottom: spacing.lg },
  diffRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  diffBtn: { flex: 1, alignItems: 'center', backgroundColor: colors.bgSoft, borderRadius: 12, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.hairline },
  diffBtnActive: { borderColor: colors.accentWarm, backgroundColor: colors.bgSoft },
  diffText: { color: colors.inkPrimary, fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  diffTextActive: { color: colors.accentWarm },
  diffMeta: { color: colors.inkTertiary, fontSize: typography.size.xs, marginTop: 2 },
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
  startBtn: { backgroundColor: colors.accentWarm, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center' },
  startBtnText: { color: colors.bgDeep, fontWeight: typography.weight.black, fontSize: typography.size.md },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  topStat: { color: colors.inkSecondary, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  timerBg: { height: 8, borderRadius: 99, backgroundColor: colors.bgMid, overflow: 'hidden', marginBottom: spacing.md },
  timerFill: { height: 8, borderRadius: 99, backgroundColor: colors.accentWarm },

  sentenceCard: { minHeight: 170, backgroundColor: colors.bgMid, borderRadius: 18, borderWidth: 1, borderColor: colors.hairline, padding: spacing.xl, justifyContent: 'center', marginBottom: spacing.md },
  sentenceText: { color: colors.inkPrimary, fontSize: 28, fontWeight: typography.weight.black, textAlign: 'center', lineHeight: 38 },

  buttonsRow: { flexDirection: 'row', gap: spacing.sm },
  pickBtn: { flex: 1, borderRadius: 14, paddingVertical: spacing.lg, alignItems: 'center', borderWidth: 1 },
  realBtn: { backgroundColor: colors.successSoft, borderColor: colors.success },
  fakeBtn: { backgroundColor: 'rgba(201,122,106,0.15)', borderColor: colors.errorDs },
  pickText: { color: colors.inkPrimary, fontSize: typography.size.md, fontWeight: typography.weight.black },
  pickDim: { opacity: 0.45 },

  feedbackBox: { marginTop: spacing.md, borderRadius: 12, padding: spacing.md, borderWidth: 1 },
  feedbackGood: { backgroundColor: colors.successSoft, borderColor: colors.success },
  feedbackBad: { backgroundColor: 'rgba(201,122,106,0.15)', borderColor: colors.errorDs },
  feedbackMain: { color: colors.inkPrimary, fontSize: typography.size.md, fontWeight: typography.weight.black },
  feedbackCorrection: { color: colors.accentWarm, fontSize: typography.size.sm, fontWeight: typography.weight.bold, marginTop: spacing.xs },
  feedbackExplain: { color: colors.inkSecondary, fontSize: typography.size.sm, marginTop: spacing.xs },
  nextBtn: { marginTop: spacing.sm, backgroundColor: colors.accentWarm, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  nextBtnText: { color: colors.bgDeep, fontWeight: typography.weight.black, fontSize: typography.size.sm },

  resultCard: { marginTop: spacing.xl, backgroundColor: colors.bgMid, borderRadius: 18, padding: spacing.xl, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center' },
  resultEmoji: { fontSize: 54 },
  resultTitle: { color: colors.inkPrimary, fontSize: typography.size.xl, fontWeight: typography.weight.black, marginTop: spacing.sm },
  resultScore: { color: colors.accentWarm, fontSize: 34, fontWeight: typography.weight.black, marginTop: spacing.sm },
  resultMeta: { color: colors.inkSecondary, fontSize: typography.size.sm, marginTop: spacing.xs },
  mistakeBox: { width: '100%', marginTop: spacing.md, backgroundColor: colors.bgSoft, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.hairline },
  mistakeTitle: { color: colors.accentWarm, fontSize: typography.size.sm, fontWeight: typography.weight.bold, marginBottom: spacing.xs },
  mistakeText: { color: colors.inkSecondary, fontSize: typography.size.sm, lineHeight: 20 },
});
