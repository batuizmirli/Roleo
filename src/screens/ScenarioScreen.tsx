import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Scenario, StageResult, UserLevel, UserProfile, ModuleResult, SceneFlowPath,
  SceneRunSnapshot, ReplayHookKind, FriendChallengeTarget, StageLearningSummary, StageTurnReview,
} from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson, tryParseJson } from '../services/json';
import { getPersonaByStage, getGoalContext } from '../services/personas';
import { trackEvent } from '../services/telemetry';
import { recordDailySceneScore } from '../services/leaderboard';
import {
  getSceneSnapshot,
  saveSceneSnapshot,
  computeFailNearMiss,
  deriveSuccessHook,
  buildLostReplayCta,
} from '../services/runHook';
import AnimatedPressable from '../components/AnimatedPressable';

// ─── Types ─────────────────────────────────────────────────────────────────

type NpcMood = 'happy' | 'neutral' | 'confused' | 'impatient';
type OptionQuality = 'good' | 'ok' | 'awkward';
type NpcPersonality = 'friendly' | 'busy' | 'rude';

type DialogOption = { text: string; quality: OptionQuality };

type TurnRecord = {
  npcMessage: string;
  selectedText: string;
  quality: OptionQuality;
  goodOption: string;
  npcReaction: string;
};

type GameTurn = {
  npc_message: string;
  npc_mood: NpcMood;
  options: DialogOption[];
  reactions: { good: string; ok: string; awkward: string };
  scene_complete?: boolean;
};

type SavedGameState = {
  turnHistory: TurnRecord[];
  currentNpcMessage: string;
  npcMood: NpcMood;
  savedAt: string;
};

type TurnCache = Record<string, GameTurn>;

type Phase = 'init' | 'intro' | 'vocab' | 'resume' | 'game' | 'lost' | 'done';

// ─── Constants ─────────────────────────────────────────────────────────────

const CONV_KEY = (id: string) => `conversation_${id}`;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_TURNS = 6;
const REACTION_DELAY_MS = 160;

const MOOD_EMOJI: Record<NpcMood, string> = {
  happy: '😊', neutral: '😐', confused: '😕', impatient: '😤',
};
const MOOD_LABEL: Record<NpcMood, string> = {
  happy: 'Harika gidiyor', neutral: 'Normal', confused: 'Karıştı', impatient: 'Sabırsızlandı',
};
const PERSONALITY_LABEL: Record<NpcPersonality, string> = {
  friendly: '😊 Friendly', busy: '⏱ Busy', rude: '😤 Rude',
};
const PERSONALITY_COLOR: Record<NpcPersonality, string> = {
  friendly: '#3DD68C', busy: '#F5B800', rude: '#1B9C5A',
};

const qColor = (q: OptionQuality) =>
  q === 'good' ? '#3DD68C' : q === 'ok' ? '#F5B800' : '#A66A4C';
const qLabel = (q: OptionQuality) =>
  q === 'good' ? '✨ Çok doğal' : q === 'ok' ? '👍 Anlaşıldı' : '😅 Biraz garip';

type ComboTier = {
  hype: string;
  sub: string;
  color: string;
  emoji: string;
  glow: string;
};

/** Escalating combo copy — visible “power” curve */
const getComboTier = (n: number): ComboTier | null => {
  if (n < 1) return null;
  if (n === 1) return { hype: 'Nice', sub: 'Doğru ton', color: '#22C55E', emoji: '👍', glow: '#22C55E55' };
  if (n === 2) return { hype: 'Smooth', sub: 'Akış yakalanıyor', color: '#38BDF8', emoji: '✨', glow: '#38BDF866' };
  if (n === 3) return { hype: "You're on fire", sub: 'Üst üste çok doğal', color: '#F97316', emoji: '🔥', glow: '#F9731688' };
  return { hype: 'You sound native', sub: 'Native ritim', color: '#A855F7', emoji: '🚀', glow: '#A855F799' };
};

const timerUrgencyRgb = (left: number, total: number) => {
  if (total <= 0) return '#22C55E';
  const r = left / total;
  if (r > 0.45) return '#22C55E';
  if (r > 0.2) return '#F97316';
  return '#EF4444';
};

// combo >= 2 → combo koruma: impatient yerine confused (mood daha kolay toparlanır)
const computeMood = (history: TurnRecord[], latest: OptionQuality, combo: number): NpcMood => {
  const tail = [...history.map(t => t.quality), latest].slice(-2);
  const awkwardCount = tail.filter(q => q === 'awkward').length;
  if (awkwardCount >= 2) return combo >= 2 ? 'confused' : 'impatient';
  if (latest === 'awkward') return 'confused';
  if (latest === 'good' && history.length >= 1) return 'happy';
  return 'neutral';
};

// personality'e göre fail koşulu; comboGuard: combo ≥ 3 ise ilk awkward affedilir
const shouldSceneFail = (
  p: NpcPersonality,
  chosen: OptionQuality,
  consecutiveBad: number,
  prevQuality: OptionQuality | null,
  comboGuard: number,
): boolean => {
  // Flow state koruma: combo ≥ 3 iken ilk awkward fail zinciri başlatmaz
  if (comboGuard >= 3 && chosen === 'awkward' && consecutiveBad === 0) return false;

  const newBad = chosen === 'awkward' ? consecutiveBad + 1 : consecutiveBad;
  if (p === 'friendly') return newBad >= 3;
  if (p === 'busy') return chosen === 'awkward' && newBad >= 2;
  // rude: 2 awkward VEYA awkward+ok kombinasyonu
  if (chosen === 'awkward' && newBad >= 2) return true;
  if (p === 'rude' && prevQuality !== null) {
    const lastTwo = [prevQuality, chosen];
    if (lastTwo.includes('awkward') && lastTwo.includes('ok')) return true;
  }
  return false;
};

const pickPersonality = (): NpcPersonality => {
  const r = Math.random();
  return r < 0.5 ? 'friendly' : r < 0.8 ? 'busy' : 'rude';
};

const computeFlowPath = (history: TurnRecord[]): SceneFlowPath => {
  const tail = history.slice(-2);
  if (tail.some(t => t.quality === 'awkward')) return 'friction';
  if (history.some(t => t.quality === 'awkward')) return 'friction';
  if (tail.length === 2 && tail.every(t => t.quality === 'good')) return 'smooth';
  return 'smooth';
};

const answerSecondsFor = (p: NpcPersonality, firstSession: boolean) => {
  const base = p === 'friendly' ? 16 : p === 'busy' ? 11 : 8;
  return Math.round(base * (firstSession ? 1.45 : 1));
};

// ─── Props ─────────────────────────────────────────────────────────────────

type Props = {
  scenario: Scenario;
  onBack: () => void;
  onStageComplete: (result: StageResult) => void;
  onRunComplete?: (result: ModuleResult) => void;
  firstSessionMode?: boolean;
  prepBonus?: number;
  easyStart?: boolean;
  /** Goal id from home screen target selector */
  goalId?: string;
  /** Completed count for this scenario — harder / less hand-holding on replay */
  playCount?: number;
  challengeTarget?: FriendChallengeTarget | null;
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function ScenarioScreen({
  scenario, onBack, onStageComplete, onRunComplete, firstSessionMode = false, prepBonus = 0, easyStart = false, goalId,
  playCount = 0,
  challengeTarget = null,
}: Props) {
  const stageKey = scenario.stageType ?? 'social';
  const persona = getPersonaByStage(stageKey);
  const goalCtx = getGoalContext(goalId);

  const [phase, setPhase] = useState<Phase>(firstSessionMode ? 'intro' : 'init');
  const [savedState, setSavedState] = useState<SavedGameState | null>(null);

  // NPC personality — fixed for this session
  const [personality] = useState<NpcPersonality>(easyStart ? 'friendly' : pickPersonality());

  // Game state
  const [npcMessage, setNpcMessage] = useState(scenario.openingMessage);
  const [options, setOptions] = useState<DialogOption[] | null>(null);
  const [currentReactions, setCurrentReactions] = useState<GameTurn['reactions'] | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [npcMood, setNpcMood] = useState<NpcMood>('neutral');
  const [npcReaction, setNpcReaction] = useState<string | null>(null);
  const [reactionVisible, setReactionVisible] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [turnHistory, setTurnHistory] = useState<TurnRecord[]>([]);
  const [sceneComplete, setSceneComplete] = useState(false);
  const [failReaction, setFailReaction] = useState('');

  // Combo + hint
  const [consecutiveGood, setConsecutiveGood] = useState(0);
  const [consecutiveBad, setConsecutiveBad] = useState(0);
  const [hintIdx, setHintIdx] = useState<number | null>(null); // smart hint
  const [thinkingCountdown, setThinkingCountdown] = useState<number | null>(null);
  const [answerTimeLeft, setAnswerTimeLeft] = useState<number | null>(null);
  const [answerTimeTotal, setAnswerTimeTotal] = useState(0);
  const [rewardText, setRewardText] = useState<string | null>(null);
  const [failHook, setFailHook] = useState<ReplayHookKind>('none');
  const [failNearMiss, setFailNearMiss] = useState(false);
  const [failFlowTail, setFailFlowTail] = useState(false);
  const [donePrevSnap, setDonePrevSnap] = useState<SceneRunSnapshot | null>(null);
  const [doneDetailsOpen, setDoneDetailsOpen] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thinkingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const comboPeakRef = useRef(0);
  const timedOutTurnsRef = useRef(0);
  const failMetricsRef = useRef({ trailingAwk: 0, totalAwk: 0, turns: 0, flowTail: false });
  const handleNextRef = useRef<(() => Promise<void>) | null>(null);
  const handleSelectRef = useRef<(idx: number, meta?: { timedOut?: boolean }) => void>(() => {});
  const optionsRef = useRef<DialogOption[] | null>(null);
  const selectedIdxRef = useRef<number | null>(null);

  optionsRef.current = options;
  selectedIdxRef.current = selectedIdx;
  const npcEntrance = useRef(new Animated.Value(1)).current;
  const npcReplyEntrance = useRef(new Animated.Value(1)).current;
  const optionsEntrance = useRef(new Animated.Value(1)).current;
  const optionsOpacity = useRef(new Animated.Value(1)).current;
  const feedbackEntrance = useRef(new Animated.Value(0)).current;
  const turnCacheRef = useRef<TurnCache>({});
  const comboCardScale = useRef(new Animated.Value(1)).current;
  const lostDimOpacity = useRef(new Animated.Value(0)).current;
  const timerShake = useRef(new Animated.Value(0)).current;
  const timerGlow = useRef(new Animated.Value(1)).current;
  const doneHeroScale = useRef(new Animated.Value(1)).current;
  const flowPulse = useRef(new Animated.Value(1)).current;
  const rewardOpacity = useRef(new Animated.Value(0)).current;
  const timerProgress = useRef(new Animated.Value(1)).current;
  const timerShakeLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const timerGlowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const animateNpcEntrance = () => {
    npcEntrance.setValue(0);
    Animated.parallel([
      Animated.timing(npcEntrance, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  };

  const animateNpcReplyEntrance = () => {
    npcReplyEntrance.setValue(0);
    Animated.timing(npcReplyEntrance, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  };

  const animateOptionsIn = () => {
    optionsEntrance.setValue(0);
    optionsOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(optionsEntrance, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(optionsOpacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  };

  const animateOptionsOut = () =>
    new Promise<void>(resolve => {
      Animated.parallel([
        Animated.timing(optionsEntrance, {
          toValue: 0,
          duration: 260,
          easing: Easing.bezier(0.22, 0.8, 0.18, 1),
          useNativeDriver: true,
        }),
        Animated.timing(optionsOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => resolve());
    });

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (firstSessionMode) return;
    const bootstrap = async () => {
      const raw = await AsyncStorage.getItem(CONV_KEY(scenario.id));
      if (raw) {
        const saved = tryParseJson<SavedGameState>(raw);
        if (saved?.turnHistory?.length && Date.now() - new Date(saved.savedAt).getTime() < MAX_AGE_MS) {
          setSavedState(saved);
          setPhase('resume');
          return;
        }
        await AsyncStorage.removeItem(CONV_KEY(scenario.id));
      }
      if (scenario.vocabHints?.length) {
        setPhase('vocab');
      } else {
        setPhase('game');
        loadTurn([], scenario.openingMessage);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (phase === 'game') {
      trackEvent('stage_started', { scenarioId: scenario.id, stageType: stageKey, firstSessionMode });
    }
    return () => {
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
      if (thinkingTimer.current) clearInterval(thinkingTimer.current);
    };
  }, [phase]);

  // ── AI ────────────────────────────────────────────────────────────────────

  const getProfile = async (): Promise<UserProfile | null> => {
    const raw = await AsyncStorage.getItem('userProfile');
    return raw ? tryParseJson<UserProfile>(raw) : null;
  };

  const personalityPrompt = (p: NpcPersonality) => {
    if (p === 'friendly') {
      return 'NPC personality: Friendly — warm, patient, encouraging. On mistakes: gentle deflection, still tries to keep rapport; tolerance HIGH (several weak lines before sounding done).';
    }
    if (p === 'busy') {
      return 'NPC personality: Busy — clipped, efficient, always short on time. On mistakes: audible impatience, asks to hurry; tolerance MEDIUM.';
    }
    return 'NPC personality: Rude — blunt, minimal patience, dry sarcasm OK (no slurs/harassment). On mistakes: sharp, dismissive tone; tolerance LOW.';
  };

  const historyKey = (history: TurnRecord[]) => {
    if (!history.length) return 'root';
    return history.map(h => h.quality).join('|');
  };

  const startThinkingCountdown = () => {
    if (thinkingTimer.current) clearInterval(thinkingTimer.current);
    let current = 3;
    setThinkingCountdown(current);
    setNpcMessage(`${persona.name}'dan cümle geliyor... ${current}`);
    thinkingTimer.current = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        if (thinkingTimer.current) clearInterval(thinkingTimer.current);
        thinkingTimer.current = null;
        setThinkingCountdown(null);
        return;
      }
      setThinkingCountdown(current);
      setNpcMessage(`${persona.name}'dan cümle geliyor... ${current}`);
    }, 1000);
  };

  const stopThinkingCountdown = () => {
    if (thinkingTimer.current) {
      clearInterval(thinkingTimer.current);
      thinkingTimer.current = null;
    }
    setThinkingCountdown(null);
  };

  const clearAnswerTimer = () => {
    if (answerTimerRef.current) {
      clearInterval(answerTimerRef.current);
      answerTimerRef.current = null;
    }
    setAnswerTimeLeft(null);
    timerProgress.setValue(1);
  };

  const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

  const pickByIndex = (arr: string[], idx: number) => arr[idx % arr.length];

  const getLanguagePack = (lang: string) => {
    const baseByLang: Record<string, {
      good: string[];
      ok: string[];
      awkward: string[];
      followUp: { good: string[]; ok: string[]; awkward: string[] };
      reactions: { good: string[]; ok: string[]; awkward: string[] };
    }> = {
      es: {
        good: ['Me gustaría', '¿Podría pedir', 'Quisiera'],
        ok: ['Quiero', 'Necesito', 'Vale,'],
        awkward: ['Yo querer', 'Dame', 'Eh... yo'],
        followUp: {
          good: ['Perfecto, ¿algo más?', 'Genial. ¿Quieres añadir algo?', 'Muy bien, seguimos.'],
          ok: ['Entiendo. ¿Puedes concretar un poco?', 'Vale. Dame un poco más de detalle.', 'Sí, pero necesito más información.'],
          awkward: ['No te sigo bien. ¿Puedes repetir?', 'Hmm... eso suena raro. ¿Otra forma?', 'No queda claro, intenta de nuevo.'],
        },
        reactions: {
          good: ['Muy natural 👌', 'Suena perfecto ✅', 'Excelente elección ✨'],
          ok: ['Se entiende, ama suena corto 👍', 'Correcto, pero poco natural.', 'Funciona, aunque puede sonar mejor.'],
          awkward: ['Se entiende poco 😅', 'Suena raro en esta situación.', 'Mejor reformular esa frase.'],
        },
      },
      fr: {
        good: ['Je voudrais', 'Est-ce que je peux avoir', 'J’aimerais'],
        ok: ['Je veux', 'D’accord,', 'Bon,'],
        awkward: ['Moi vouloir', 'Donne-moi', 'Euh... moi'],
        followUp: {
          good: ['Parfait, autre chose ?', 'Très bien, on continue.', 'Super, et ensuite ?'],
          ok: ['Je comprends, mais sois plus précis.', 'OK, donne un peu plus de détail.', 'Oui, mais formule un peu mieux.'],
          awkward: ['Je ne comprends pas bien. Réessaie ?', 'Hmm... c’est étrange.', 'Ce n’est pas naturel ici.'],
        },
        reactions: {
          good: ['Très naturel 👌', 'Parfait ✅', 'Excellent choix ✨'],
          ok: ['Compréhensible 👍', 'Ça passe, mais c’est court.', 'Correct, mais peu naturel.'],
          awkward: ['Un peu bizarre 😅', 'Formulation maladroite.', 'Mieux vaut reformuler.'],
        },
      },
      de: {
        good: ['Ich hätte gern', 'Könnte ich bitte', 'Ich möchte'],
        ok: ['Ich will', 'Okay,', 'Gut,'],
        awkward: ['Ich wollen', 'Gib mir', 'Äh... ich'],
        followUp: {
          good: ['Perfekt, noch etwas?', 'Sehr gut, wir machen weiter.', 'Top, was noch?'],
          ok: ['Verstanden, aber bitte etwas genauer.', 'Okay, gib mir mehr Details.', 'Ja, aber es klingt etwas knapp.'],
          awkward: ['Ich verstehe nicht ganz. Nochmal?', 'Hm... das klingt seltsam.', 'Das passt hier nicht gut.'],
        },
        reactions: {
          good: ['Sehr natürlich 👌', 'Perfekt ✅', 'Starke Wahl ✨'],
          ok: ['Verständlich 👍', 'Geht, aber klingt knapp.', 'Richtig, aber nicht natürlich genug.'],
          awkward: ['Etwas seltsam 😅', 'Klingt unnatürlich.', 'Besser neu formulieren.'],
        },
      },
      en: {
        good: ['I’d like', 'Could I please get', 'I would like'],
        ok: ['I want', 'Okay,', 'Fine,'],
        awkward: ['Me want', 'Give me', 'Uh... me'],
        followUp: {
          good: ['Perfect, anything else?', 'Great, let’s continue.', 'Nice. What next?'],
          ok: ['I understand, can you be more specific?', 'Okay, give me a bit more detail.', 'Works, but make it clearer.'],
          awkward: ['I can’t follow that well. Try again?', 'Hmm... that sounds odd here.', 'That phrasing feels off.'],
        },
        reactions: {
          good: ['Very natural 👌', 'Perfect choice ✅', 'Excellent ✨'],
          ok: ['Understandable 👍', 'Works, but a bit blunt.', 'Correct, not very natural though.'],
          awkward: ['A bit awkward 😅', 'Sounds unnatural in this context.', 'Try a cleaner phrasing.'],
        },
      },
    };

    return baseByLang[lang] ?? baseByLang.en;
  };

  const buildLocalTurn = (history: TurnRecord[], openingMsg: string): GameTurn => {
    const pack = getLanguagePack(scenario.language);
    const idx = history.length;
    const baseWord = scenario.vocabHints?.[idx % (scenario.vocabHints?.length || 1)]?.word ?? persona.name;
    const punctuation = idx % 2 === 0 ? '.' : '?';

    const good = `${pickByIndex(pack.good, idx)} ${baseWord}${punctuation}`;
    const ok = `${pickByIndex(pack.ok, idx)} ${baseWord}${punctuation}`;
    const awkward = `${pickByIndex(pack.awkward, idx)} ${baseWord}${punctuation}`;

    const lastQuality = history[history.length - 1]?.quality ?? 'good';
    const npcLine = history.length === 0
      ? openingMsg
      : pickByIndex(pack.followUp[lastQuality], idx + playCount);

    const dialogOptions: DialogOption[] = [
      { text: good, quality: 'good' },
      { text: ok, quality: 'ok' },
      { text: awkward, quality: 'awkward' },
    ];

    return {
      npc_message: npcLine,
      npc_mood: lastQuality === 'awkward' ? 'confused' : lastQuality === 'good' ? 'happy' : 'neutral',
      options: [...dialogOptions].sort(() => Math.random() - 0.5),
      reactions: {
        good: pickByIndex(pack.reactions.good, idx),
        ok: pickByIndex(pack.reactions.ok, idx),
        awkward: pickByIndex(pack.reactions.awkward, idx),
      },
      scene_complete: history.length >= 4,
    };
  };

  const applyTurnToUi = (turn: GameTurn, history: TurnRecord[], openingMsg: string) => {
    stopThinkingCountdown();
    clearAnswerTimer();
    feedbackEntrance.setValue(0);
    const shuffleKey = (playCount * 31 + history.length * 7 + (scenario.id?.length ?? 0)) % 6;
    const perms: number[][] = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    const order = perms[shuffleKey] ?? [0, 1, 2];
    const baseOpts = [...turn.options];
    const shuffled = playCount > 0 ? order.map(i => baseOpts[i]) : [...turn.options].sort(() => Math.random() - 0.5);
    const isFirst = history.length === 0;
    if (!isFirst && turn.npc_message) {
      setNpcMessage(turn.npc_message);
      animateNpcEntrance();
    } else if (isFirst) {
      setNpcMessage(openingMsg);
    }
    setOptions(shuffled);
    setCurrentReactions(turn.reactions ?? null);
    setNpcMood(turn.npc_mood ?? 'neutral');
    if (turn.scene_complete && history.length >= 3) setSceneComplete(true);

    if (consecutiveBad >= 1) {
      const goodPos = shuffled.findIndex(o => o.quality === 'good');
      if (goodPos !== -1) setHintIdx(goodPos);
    }

    animateOptionsIn();
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const requestTurn = async (history: TurnRecord[], openingMsg: string): Promise<GameTurn | null> => {
    const p = await getProfile();
    const nativeLang = p?.nativeLanguage?.name ?? 'Turkish';
    const langName = p?.language?.name ?? 'Spanish';
    const identityGoal = p?.identity?.goal ?? p?.goalDescription ?? '';
    const isFirst = history.length === 0;

    const historyText = history
      .map((t, i) => `Turn ${i + 1}: NPC: "${t.npcMessage}" → User: "${t.selectedText}" (${t.quality})`)
      .join('\n');

    const reactionFmt = `"reactions":{"good":"(warm NPC reply in ${langName}, 1 sentence)","ok":"(brief/neutral reply in ${langName}, 1 sentence)","awkward":"(confused/impatient reply in ${langName}, 1 sentence)"}`;

    const okSlowHint = history.length > 0 && history[history.length - 1].quality === 'ok'
      ? `\nThe user's last response was "ok" quality (understood but blunt/minimal). NPC should ask a short clarifying follow-up instead of progressing — show that "ok" choices create friction and slow the scene down.`
      : '';

    const difficultyHint = consecutiveBad >= 2
      ? '\nUser is struggling. Make the "good" option distinctly more natural so it stands out.'
      : consecutiveBad === 1
      ? '\nUser made an error. Keep options realistic but make the natural option somewhat clearer.'
      : consecutiveGood >= 3
      ? '\nUser is on a fluency streak. Options can be slightly more nuanced and subtle.'
      : '';

    const goalInject = goalCtx
      ? `\nLearning focus — ${goalCtx.label}: ${goalCtx.toneInstruction}\n${goalCtx.difficultyNote}`
      : '';

    const flowPath = computeFlowPath(history);
    const branchNote = flowPath === 'friction'
      ? '\nArc: TENSION PATH — NPC is colder/more guarded; lines shorter; progress toward goal should feel earned.'
      : '\nArc: SMOOTH PATH — NPC is cooperative; natural forward momentum.';

    const replayNote = playCount >= 2
      ? '\nReplay challenge: user has played this scenario multiple times — vary beats and vocabulary; make "good" less telegraphed; avoid repeating prior NPC lines.'
      : playCount >= 1
      ? '\nReplay: change specific wording vs a first play; slightly subtler differences between options.'
      : '';

    const prompt = isFirst
      ? `Turn-based language roleplay game.
Scene: "${scenario.title}" at ${scenario.location}.
Character: ${persona.name} (${persona.roleLabel}). ${personalityPrompt(personality)}
Target language: ${langName}. User native language: ${nativeLang}.
User goal: "${identityGoal}". Scene goal: "${scenario.mission ?? 'Complete the interaction naturally'}"${goalInject}
${branchNote}${replayNote}

NPC opening line: "${openingMsg}"

Generate 3 response options (in ${langName}) — same intent, 3 different social registers:
"good" = polite and natural, "ok" = minimal but understood, "awkward" = wrong grammar or socially odd.
NPC personality affects how reactions differ between qualities.
Shuffle options randomly. 1 sentence max each.${difficultyHint}

IMPORTANT: Do NOT include action narrations like *wipes the glass*, *smiles*, *leans forward* etc. NPC must speak only in dialogue. No asterisk actions, no stage directions, no narration.

Return ONLY valid JSON:
{"npc_message":"${openingMsg}","npc_mood":"neutral",${reactionFmt},"options":[{"text":"...","quality":"good"},{"text":"...","quality":"ok"},{"text":"...","quality":"awkward"}],"scene_complete":false}`
      : `Turn-based language roleplay.
Scene: "${scenario.title}" at ${scenario.location}. Character: ${persona.name}. ${personalityPrompt(personality)}
Target: ${langName}. Native: ${nativeLang}. Goal: "${identityGoal}"${goalInject}
Scene goal: "${scenario.mission ?? 'Complete the interaction naturally'}"
${branchNote}${replayNote}

History:\n${historyText}

Write NPC's next line (react naturally based on personality + last user choice).
Generate 3 response options — same intent, 3 social registers.
Options must feel like real choices a person might make, not a grammar test.
scene_complete:true only after turn ${history.length} if scene goal naturally achieved (min 3 turns).${okSlowHint}${difficultyHint}

IMPORTANT: Do NOT include action narrations like *wipes the glass*, *smiles*, *leans forward* etc. NPC must speak only in dialogue. No asterisk actions, no stage directions, no narration.

Return ONLY valid JSON:
{"npc_message":"...","npc_mood":"neutral",${reactionFmt},"options":[{"text":"...","quality":"good"},{"text":"...","quality":"ok"},{"text":"...","quality":"awkward"}],"scene_complete":false}`;

    const res = await sendMessage(
      [{ id: `t${history.length}`, role: 'user', content: prompt, timestamp: new Date() }],
      '',
      { maxTokens: 520 },
    );

    return parseModelJson<GameTurn>(res, 'object');
  };

  const prefetchNextTurns = async (
    history: TurnRecord[],
    openingMsg: string,
    turn: GameTurn,
    activeNpcMessage: string,
  ) => {
    const goodOption = turn.options.find(o => o.quality === 'good')?.text ?? turn.options[0]?.text ?? '';

    const jobs = turn.options.map(async (opt) => {
      const reaction = turn.reactions?.[opt.quality] ?? '';
      const nextHistory: TurnRecord[] = [
        ...history,
        {
          npcMessage: activeNpcMessage,
          selectedText: opt.text,
          quality: opt.quality,
          goodOption,
          npcReaction: reaction,
        },
      ];

      if (nextHistory.length >= MAX_TURNS) return;

      const key = historyKey(nextHistory);
      if (turnCacheRef.current[key]) return;

      try {
        const nextTurn = await requestTurn(nextHistory, openingMsg);
        if (nextTurn?.options?.length) turnCacheRef.current[key] = nextTurn;
      } catch {
        // prefetch is best-effort only
      }
    });

    await Promise.all(jobs);
  };

  const loadTurn = async (history: TurnRecord[], openingMsg: string, minDelayMs: number = 0) => {
    const key = historyKey(history);
    const cached = turnCacheRef.current[key];

    setOptionsLoading(false);
    setOptions(null);
    setCurrentReactions(null);
    setNpcReaction(null);
    setReactionVisible(false);
    setHintIdx(null);

    if (cached?.options?.length) {
      if (minDelayMs > 0) await wait(minDelayMs);
      applyTurnToUi(cached, history, openingMsg);
      return;
    }

    const localTurn = buildLocalTurn(history, openingMsg);
    turnCacheRef.current[key] = localTurn;
    if (minDelayMs > 0) await wait(minDelayMs);
    applyTurnToUi(localTurn, history, openingMsg);

    const activeNpcMessage = history.length === 0 ? openingMsg : (localTurn.npc_message || npcMessage);
    void prefetchNextTurns(history, openingMsg, localTurn, activeNpcMessage);

    void requestTurn(history, openingMsg)
      .then(parsed => {
        if (!parsed?.options?.length) return;
        turnCacheRef.current[key] = parsed;
        void prefetchNextTurns(
          history,
          openingMsg,
          parsed,
          history.length === 0 ? openingMsg : (parsed.npc_message || localTurn.npc_message || npcMessage),
        );
      })
      .catch(() => {
        // local-first fallback already active
      });
  };

  // ── Game actions ──────────────────────────────────────────────────────────

  const startGame = (history: TurnRecord[] = [], msg = scenario.openingMessage, mood: NpcMood = 'neutral') => {
    turnCacheRef.current = {};
    comboPeakRef.current = 0;
    timedOutTurnsRef.current = 0;
    setFailHook('none');
    setFailNearMiss(false);
    setFailFlowTail(false);
    setTurnHistory(history);
    setNpcMessage(msg);
    setNpcMood(mood);
    setSelectedIdx(null);
    setNpcReaction(null);
    setReactionVisible(false);
    setSceneComplete(false);
    setConsecutiveGood(0);
    setConsecutiveBad(0);
    setHintIdx(null);
    setPhase('game');
    loadTurn(history, msg);
  };

  const handleSelect = (idx: number, _meta?: { timedOut?: boolean }) => {
    if (selectedIdx !== null || optionsLoading || !options) return;
    clearAnswerTimer();
    setSelectedIdx(idx);
    if (options[idx].quality === 'good') {
      const tier = getComboTier(consecutiveGood + 1);
      if (tier) setRewardText(tier.hype);
    }
    setReactionVisible(false);
    feedbackEntrance.setValue(0);
    Animated.timing(feedbackEntrance, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    // Micro delay before NPC reaction appears
    const reaction = currentReactions?.[options[idx].quality] ?? null;
    reactionTimer.current = setTimeout(() => {
      setNpcReaction(reaction);
      setReactionVisible(true);
      animateNpcReplyEntrance();
      setNpcMood(computeMood(turnHistory, options[idx].quality, consecutiveGood));
    }, REACTION_DELAY_MS);
  };

  const handleNext = async () => {
    if (selectedIdx === null || !options) return;

    await animateOptionsOut();

    const chosen = options[selectedIdx];
    const goodOption = options.find(o => o.quality === 'good')?.text ?? chosen.text;
    const reaction = currentReactions?.[chosen.quality] ?? '';

    const newHistory: TurnRecord[] = [
      ...turnHistory,
      { npcMessage, selectedText: chosen.text, quality: chosen.quality, goodOption, npcReaction: reaction },
    ];
    setTurnHistory(newHistory);
    setSelectedIdx(null);
    setNpcReaction(null);
    setReactionVisible(false);
    startThinkingCountdown();

    // Combo + fail logic
    const prevQuality = turnHistory.length > 0 ? turnHistory[turnHistory.length - 1].quality : null;

    if (chosen.quality === 'good') {
      comboPeakRef.current = Math.max(comboPeakRef.current, consecutiveGood + 1);
      setConsecutiveGood(c => c + 1);
      setConsecutiveBad(0);
    } else if (chosen.quality === 'ok') {
      // ok: combo sıfırlar ama risk yaratmaz
      setConsecutiveGood(0);
      // consecutiveBad unchanged
    } else {
      // awkward
      setConsecutiveGood(0);
      setConsecutiveBad(c => c + 1);
    }

    if (shouldSceneFail(personality, chosen.quality, consecutiveBad, prevQuality, consecutiveGood)) {
      await AsyncStorage.removeItem(CONV_KEY(scenario.id));
      clearAnswerTimer();
      setFailReaction(reaction);
      const goods = newHistory.filter(t => t.quality === 'good').length;
      const awks = newHistory.filter(t => t.quality === 'awkward').length;
      const nm = computeFailNearMiss({
        turnCount: newHistory.length,
        goodCount: goods,
        awkwardCount: awks,
        comboPeak: comboPeakRef.current,
      });
      const tail2 = newHistory.slice(-2);
      const flowTail = tail2.length === 2 && tail2.every(t => t.quality === 'awkward');
      setFailFlowTail(flowTail);
      setFailNearMiss(nm);
      let trailingAwk = 0;
      for (let i = newHistory.length - 1; i >= 0; i--) {
        if (newHistory[i].quality === 'awkward') trailingAwk += 1;
        else break;
      }
      failMetricsRef.current = { trailingAwk, totalAwk: awks, turns: newHistory.length, flowTail };
      let hook: ReplayHookKind = 'none';
      if (nm) hook = 'fix_mistake';
      else if (computeFlowPath(newHistory) === 'friction') hook = 'keep_flow';
      setFailHook(hook);
      const acc = goods / Math.max(newHistory.length, 1);
      const snap: SceneRunSnapshot = {
        ts: new Date().toISOString(),
        comboMax: comboPeakRef.current,
        accuracy: acc,
        flowPath: computeFlowPath(newHistory),
        hadAwkward: awks > 0,
        failed: true,
        turnCount: newHistory.length,
        nearMiss: nm,
        hookKind: hook,
        awkwardTurns: awks,
        trailingAwkward: trailingAwk,
      };
      void saveSceneSnapshot(scenario.id, snap);
      setPhase('lost');
      void trackEvent('scene_failed', { scenarioId: scenario.id, personality, quality: chosen.quality });
      return;
    }

    if (sceneComplete || newHistory.length >= MAX_TURNS) {
      setOptions(null);
      setPhase('done');
      return;
    }

    await AsyncStorage.setItem(CONV_KEY(scenario.id), JSON.stringify({
      turnHistory: newHistory, currentNpcMessage: npcMessage, npcMood,
      savedAt: new Date().toISOString(),
    } as SavedGameState));

    await loadTurn(newHistory, scenario.openingMessage, 3050);
  };

  const completeStage = async () => {
    await AsyncStorage.removeItem(CONV_KEY(scenario.id));
    const prevSnap = await getSceneSnapshot(scenario.id);
    const goodCount = turnHistory.filter(t => t.quality === 'good').length;
    const total = Math.max(turnHistory.length, 1);
    const accuracy = goodCount / total;
    const xpBase = scenario.xpReward ?? 20;
    const bonus = accuracy >= 0.7 ? 8 : accuracy >= 0.4 ? 4 : 0;
    const comboBonus = Math.min(12, comboPeakRef.current * 3);
    const timeoutTax = timedOutTurnsRef.current > 0 ? 3 : 0;
    const xpEarned = Math.max(8, xpBase + bonus + comboBonus - timeoutTax);
    const userLevel: UserLevel = accuracy >= 0.7 ? 'advanced' : accuracy >= 0.4 ? 'intermediate' : 'beginner';
    const flowPath = computeFlowPath(turnHistory);
    const goods = turnHistory.filter(t => t.quality === 'good').map(t => t.selectedText);
    const nativePhraseHighlight = goods.sort((a, b) => b.length - a.length)[0] ?? persona.naturalTip ?? '';

    const profile = await getProfile();
    await recordDailySceneScore({
      accuracy,
      comboMax: comboPeakRef.current,
      xpEarned,
      displayName: profile?.displayName,
    });

    const hadAwk = turnHistory.some(t => t.quality === 'awkward');
    const almostPerfect = accuracy < 1 && accuracy >= 0.55 && hadAwk;
    const awkwardTurns = turnHistory.filter(t => t.quality === 'awkward').length;
    const turnReviews: StageTurnReview[] = turnHistory.map(t => ({
      npcMessage: t.npcMessage,
      selectedText: t.selectedText,
      quality: t.quality,
      goodOption: t.goodOption,
      npcReaction: t.npcReaction,
    }));
    const bestTurn = turnHistory.find(t => t.quality === 'good') ?? null;
    const awkwardTurn = turnHistory.find(t => t.quality === 'awkward') ?? null;
    const nextFocusLine =
      timedOutTurnsRef.current > 0
        ? `Clock pressure hit ${timedOutTurnsRef.current} turn${timedOutTurnsRef.current > 1 ? 's' : ''}; answer one beat earlier.`
        : awkwardTurns > 0
          ? `You had ${awkwardTurns} awkward turn${awkwardTurns > 1 ? 's' : ''}; keep cleaner social tone.`
          : flowPath === 'friction'
            ? 'Keep the flow steady for 2 more turns before taking risks.'
            : `Protect your combo (${comboPeakRef.current}) and push one turn further next run.`;
    const learningSummary: StageLearningSummary = {
      bestReply: bestTurn?.selectedText ?? (nativePhraseHighlight || undefined),
      awkwardMoment: awkwardTurn?.selectedText ?? (awkwardTurns > 0 ? `${awkwardTurns} awkward turn(s) in this run.` : undefined),
      betterAlternative: awkwardTurn?.goodOption && awkwardTurn.goodOption !== awkwardTurn.selectedText
        ? awkwardTurn.goodOption
        : undefined,
      nextFocus: nextFocusLine,
    };
    const currentSnap: SceneRunSnapshot = {
      ts: new Date().toISOString(),
      comboMax: comboPeakRef.current,
      accuracy,
      flowPath,
      hadAwkward: hadAwk,
      failed: false,
      turnCount: total,
      nearMiss: almostPerfect,
      awkwardTurns,
    };
    currentSnap.hookKind = deriveSuccessHook(prevSnap, currentSnap);
    await saveSceneSnapshot(scenario.id, currentSnap);

    onRunComplete?.({
      module: 'scene',
      accuracy,
      comboMax: comboPeakRef.current,
      flowPath,
      nativePhrase: nativePhraseHighlight || undefined,
    });
    onStageComplete({
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      stageType: stageKey,
      userLevel,
      userMessageCount: total,
      xpEarned,
      personaName: persona.name,
      rewardLine: persona.rewardLine,
      naturalTip: persona.naturalTip,
      suggestedNextStage: persona.nextStageHint,
      comboMax: comboPeakRef.current,
      sceneAccuracy: accuracy,
      flowPath,
      nativePhraseHighlight: nativePhraseHighlight || undefined,
      timedOutTurns: timedOutTurnsRef.current,
      awkwardTurns,
      goodTurns: goodCount,
      runCompare: { previous: prevSnap, current: currentSnap },
      turnReviews,
      learningSummary,
    });
  };

  handleSelectRef.current = handleSelect;
  handleNextRef.current = handleNext;

  useEffect(() => {
    clearAnswerTimer();
    if (phase !== 'game' || !options || optionsLoading || selectedIdx !== null) return undefined;

    const total = answerSecondsFor(personality, !!firstSessionMode);
    setAnswerTimeTotal(total);
    setAnswerTimeLeft(total);
    timerProgress.setValue(1);
    const barAnim = Animated.timing(timerProgress, {
      toValue: 0,
      duration: total * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    barAnim.start();
    let left = total;

    answerTimerRef.current = setInterval(() => {
      left -= 1;
      setAnswerTimeLeft(left);
      if (left > 0) return;
      if (answerTimerRef.current) {
        clearInterval(answerTimerRef.current);
        answerTimerRef.current = null;
      }
      const opts = optionsRef.current;
      if (selectedIdxRef.current !== null || !opts?.length) return;
      const scored = opts.map((o, i) => ({ i, s: o.quality === 'awkward' ? 0 : o.quality === 'ok' ? 1 : 2 }));
      scored.sort((a, b) => a.s - b.s);
      const worstI = scored[0]?.i ?? 0;
      timedOutTurnsRef.current += 1;
      void trackEvent('scene_answer_timeout', { scenarioId: scenario.id, personality });
      handleSelectRef.current(worstI, { timedOut: true });
      setTimeout(() => {
        void handleNextRef.current?.();
      }, REACTION_DELAY_MS + 720);
    }, 1000);

    return () => {
      barAnim.stop();
      if (answerTimerRef.current) {
        clearInterval(answerTimerRef.current);
        answerTimerRef.current = null;
      }
    };
  }, [phase, options, optionsLoading, selectedIdx, personality, firstSessionMode, scenario.id, timerProgress]);

  useEffect(() => {
    if (!rewardText) return undefined;
    rewardOpacity.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(rewardOpacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.delay(780),
      Animated.timing(rewardOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
    ]);
    anim.start(({ finished }) => {
      if (finished) setRewardText(null);
    });
    return () => anim.stop();
  }, [rewardText, rewardOpacity]);

  useEffect(() => {
    if (phase !== 'game' || consecutiveGood < 1) return;
    comboCardScale.setValue(0.88);
    Animated.spring(comboCardScale, {
      toValue: 1,
      friction: 5,
      tension: 170,
      useNativeDriver: true,
    }).start();
  }, [consecutiveGood, phase, comboCardScale]);

  useEffect(() => {
    flowPulse.stopAnimation?.();
    flowPulse.setValue(1);
    if (phase !== 'game') return undefined;
    if (computeFlowPath(turnHistory) !== 'friction') return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flowPulse, {
          toValue: 1.018,
          duration: 480,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(flowPulse, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [turnHistory, phase, flowPulse]);

  useEffect(() => {
    if (phase !== 'lost') {
      lostDimOpacity.setValue(0);
      return;
    }
    lostDimOpacity.setValue(0);
    Animated.timing(lostDimOpacity, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [phase, lostDimOpacity]);

  useEffect(() => {
    if (phase !== 'done') {
      doneHeroScale.setValue(1);
      return;
    }
    doneHeroScale.setValue(0.78);
    Animated.spring(doneHeroScale, {
      toValue: 1,
      friction: 7,
      tension: 88,
      useNativeDriver: true,
    }).start();
  }, [phase, doneHeroScale]);

  useEffect(() => {
    timerShakeLoopRef.current?.stop();
    timerGlowLoopRef.current?.stop();
    timerShake.setValue(0);
    timerGlow.setValue(1);
    timerShakeLoopRef.current = null;
    timerGlowLoopRef.current = null;

    if (phase !== 'game' || selectedIdx !== null || answerTimeLeft === null || answerTimeLeft <= 0) {
      return undefined;
    }

    if (answerTimeLeft <= 5) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(timerGlow, { toValue: 0.68, duration: 240, useNativeDriver: true }),
          Animated.timing(timerGlow, { toValue: 1, duration: 240, useNativeDriver: true }),
        ]),
      );
      glow.start();
      timerGlowLoopRef.current = glow;
    }

    if (answerTimeLeft <= 3) {
      const sh = Animated.loop(
        Animated.sequence([
          Animated.timing(timerShake, { toValue: 1, duration: 42, useNativeDriver: true }),
          Animated.timing(timerShake, { toValue: -1, duration: 42, useNativeDriver: true }),
          Animated.timing(timerShake, { toValue: 1, duration: 42, useNativeDriver: true }),
          Animated.timing(timerShake, { toValue: 0, duration: 42, useNativeDriver: true }),
        ]),
      );
      sh.start();
      timerShakeLoopRef.current = sh;
    }

    return () => {
      timerShakeLoopRef.current?.stop();
      timerGlowLoopRef.current?.stop();
      timerShakeLoopRef.current = null;
      timerGlowLoopRef.current = null;
    };
  }, [phase, answerTimeLeft, selectedIdx, timerShake, timerGlow]);

  useEffect(() => {
    if (phase !== 'done') return;
    setDoneDetailsOpen(false);
    void getSceneSnapshot(scenario.id).then(setDonePrevSnap);
  }, [phase, scenario.id]);

  // ── Shared header ─────────────────────────────────────────────────────────

  const renderHeader = (extra?: React.ReactNode) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <Text style={styles.headerEmoji}>{scenario.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{scenario.title}</Text>
          <Text style={styles.headerLocation}>📍 {scenario.location}</Text>
        </View>
      </View>
      {extra}
    </View>
  );

  // ── Renders ───────────────────────────────────────────────────────────────

  if (phase === 'init') return null;

  // RESUME
  if (phase === 'resume' && savedState) {
    const diffMin = Math.round((Date.now() - new Date(savedState.savedAt).getTime()) / 60000);
    const timeLabel = diffMin < 60 ? `${diffMin} dk önce` : `${Math.round(diffMin / 60)} saat önce`;
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centerWrap}>
          <Text style={styles.bigEmoji}>🎮</Text>
          <Text style={styles.bigTitle}>Yarım kalan sahne</Text>
          <Text style={styles.bigMeta}>{timeLabel} · {savedState.turnHistory.length} tur</Text>
          <TouchableOpacity style={styles.preStartBtn} onPress={() => startGame(savedState.turnHistory, savedState.currentNpcMessage, savedState.npcMood)}>
            <Text style={styles.preStartBtnText}>Kaldığım yerden devam et →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={async () => { await AsyncStorage.removeItem(CONV_KEY(scenario.id)); startGame(); }}>
            <Text style={styles.ghostBtnText}>Baştan başla</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // INTRO
  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.introScroll}>
          <Text style={styles.introBadge}>SAHNE</Text>
          <Text style={styles.introTitle}>{scenario.location} sahnesini şimdi prova ediyorsun.</Text>
          <Text style={styles.introSub}>{persona.name} sana yaklaşır:</Text>
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>"{scenario.openingMessage.split('\n')[0]}"</Text>
          </View>
          <Text style={styles.missionText}>🎯 Bu sahnede hedefin: {scenario.mission ?? 'Konuşmayı tamamla'}</Text>
          {!!challengeTarget && (
            <View style={styles.challengeIntroCard}>
              <Text style={styles.challengeIntroLabel}>FRIEND CHALLENGE</Text>
              <Text style={styles.challengeIntroTitle}>Beat {challengeTarget.challengerName}'s run</Text>
              <Text style={styles.challengeIntroSub}>
                {challengeTarget.challengerTitle} · combo {challengeTarget.challengerCombo} · %{Math.round(challengeTarget.challengerAccuracy * 100)}
              </Text>
              <Text style={styles.challengeIntroTaunt}>{challengeTarget.taunt}</Text>
            </View>
          )}
          <View style={styles.howItWorksBox}>
            <Text style={styles.howTitle}>ANA LOOP</Text>
            <Text style={styles.howItem}>1. NPC sana bir şey söyler</Text>
            <Text style={styles.howItem}>2. 3 yanıt seç — aynı fikir, farklı ton</Text>
            <Text style={styles.howItem}>3. NPC tepkisini hemen görürsün</Text>
            <Text style={styles.howItem}>4. Üst üste garip cevaplar → sahneyi kaybedersin ❌</Text>
            <Text style={styles.howItem}>5. Sonunda geri bildirim alır, aynı sahneyi tekrar oynarsın 🔁</Text>
          </View>
          <TouchableOpacity style={styles.preStartBtn} onPress={() => startGame()}>
            <Text style={styles.preStartBtnText}>Sahneye Gir →</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // VOCAB
  if (phase === 'vocab' && scenario.vocabHints) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.introScroll}>
          <Text style={styles.vocabTitle}>Sahneye girmeden önce</Text>
          <Text style={styles.vocabSubtitle}>Bu kelimeleri bilirsen çok daha kolay olacak 👇</Text>
          <View style={styles.vocabGrid}>
            {scenario.vocabHints.map((hint, i) => (
              <View key={i} style={styles.vocabCard}>
                <Text style={styles.vocabWord}>{hint.word}</Text>
                <Text style={styles.vocabMeaning}>{hint.meaning}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.preStartBtn} onPress={() => startGame()}>
            <Text style={styles.preStartBtnText}>Sahneye Gir →</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // LOST (scene fail)
  if (phase === 'lost') {
    const mx = failMetricsRef.current;
    const lostCta = buildLostReplayCta({
      hook: failHook,
      nearMiss: failNearMiss,
      trailingAwkward: mx.trailingAwk,
      totalAwkward: mx.totalAwk,
      turnsPlayed: mx.turns,
      lostFlowInLastTwo: mx.flowTail,
    });
    const lostFocus = failNearMiss || failFlowTail;
    const dominantTitle = failNearMiss ? 'YOU WERE RIGHT THERE' : 'THE FLOW SNAPPED AT THE END';
    const dominantSub = failNearMiss
      ? 'You can taste the win — one cleaner answer and that door stays open for you.'
      : 'Two rough picks in a row shut the scene. You still own the very next run.';

    if (lostFocus) {
      return (
        <View style={styles.container}>
          {renderHeader()}
          <Animated.View style={{ flex: 1, opacity: lostDimOpacity }}>
            <LinearGradient colors={['#1A0508', '#0D0204', '#050102']} style={[styles.lostGradient, styles.lostGradientDominant]}>
              <Text style={styles.lostDominantTitle}>{dominantTitle}</Text>
              <Text style={styles.lostDominantSub}>{dominantSub}</Text>
              {!!failReaction && (
                <Text style={styles.lostNpcWhisper} numberOfLines={4}>
                  {persona.name}: "{failReaction}"
                </Text>
              )}
              <TouchableOpacity style={[styles.primaryBtnLost, styles.primaryBtnLostDominant]} onPress={() => startGame()}>
                <Text style={[styles.primaryBtnTextLost, styles.primaryBtnTextLostDominant]}>{lostCta}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtnLost} onPress={onBack}>
                <Text style={styles.ghostBtnTextLost}>Step back to scene list</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      );
    }

    const lossHeadline = personality === 'friendly'
      ? 'This run slipped — that happens to you sometimes.'
      : personality === 'busy'
      ? 'They walked away — you can pull them back.'
      : 'The tension broke — you can rebuild the room.';
    const lossSub = personality === 'friendly'
      ? 'You are not bad at this; you just hit a rough pocket. Shake it off and step back in.'
      : personality === 'busy'
      ? 'You felt the pressure — next time you answer a beat earlier and keep them with you.'
      : 'You pushed into sharp edges — next time you ride the line without losing warmth.';

    return (
      <View style={styles.container}>
        {renderHeader()}
        <Animated.View style={{ flex: 1, opacity: lostDimOpacity }}>
        <LinearGradient colors={['#1A0508', '#0D0204', '#050102']} style={styles.lostGradient}>
          <Text style={styles.lostHeroTitle}>{lossHeadline}</Text>
          <Text style={styles.lostHeroSub}>{lossSub}</Text>
          {!!failReaction && (
            <View style={styles.failReactionBoxDark}>
              <Text style={styles.failReactionNameDark}>{persona.name}</Text>
              <Text style={styles.failReactionTextDark}>"{failReaction}"</Text>
            </View>
          )}
          <TouchableOpacity style={styles.primaryBtnLost} onPress={() => startGame()}>
            <Text style={styles.primaryBtnTextLost}>{lostCta}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtnLost} onPress={onBack}>
            <Text style={styles.ghostBtnTextLost}>Step back to scene list</Text>
          </TouchableOpacity>
        </LinearGradient>
        </Animated.View>
      </View>
    );
  }

  // DONE
  if (phase === 'done') {
    const goodCount = turnHistory.filter(t => t.quality === 'good').length;
    const total = turnHistory.length;
    const goalMet = goodCount >= Math.ceil(total * 0.5);
    const hadNativeFlow = goodCount >= 4;
    const hadNearMiss = turnHistory.some((t, i) =>
      t.quality === 'awkward' && turnHistory[i + 1]?.quality === 'good'
    );
    const okCount = turnHistory.filter(t => t.quality === 'ok').length;
    const awkwardCount = turnHistory.filter(t => t.quality === 'awkward').length;
    const accRatio = goodCount / Math.max(total, 1);
    const almostPerfectRun = goodCount < total && accRatio >= 0.55 && awkwardCount > 0;
    const showFullDetails = !almostPerfectRun || doneDetailsOpen;
    const timeoutCount = timedOutTurnsRef.current;

    const outcomeText =
      goodCount === total ? 'You moved clean from start to finish — that is yours.' :
      hadNearMiss ? 'You wobbled mid-scene, then pulled yourself back in — I saw it.' :
      okCount >= Math.ceil(total * 0.5) ? 'You stayed understood, but the rhythm never fully relaxed.' :
      goalMet ? 'You crossed the line — you earned this finish.' :
      'You fought for every beat — keep that stubborn energy.';

    const bestPhrase = turnHistory.find(t => t.quality === 'good')?.selectedText ?? null;

    let claimCta = 'Claim your XP — I want you hungry for another run →';
    if (almostPerfectRun) {
      claimCta = awkwardCount >= 2
        ? `Claim XP — you left ${awkwardCount} rough lines behind. Hunt them next →`
        : 'Claim XP — one rough line kept you from flawless. Erase it next →';
    } else if (timeoutCount >= 2) {
      claimCta = `Claim XP — you let the clock steal ${timeoutCount} turns from you →`;
    } else if (timeoutCount === 1) {
      claimCta = 'Claim XP — beat the clock on that turn next run →';
    }

    return (
      <View style={styles.container}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.doneScroll}>
          {almostPerfectRun ? (
            <View style={styles.doneMotivationHero}>
              <Text style={styles.doneMotivationEyebrow}>YOU FINISHED — WITH AN EDGE LEFT</Text>
              <Text style={styles.doneMotivationTitle}>You are one sharp beat away from a run you brag about</Text>
              <Text style={styles.doneMotivationBody}>
                {awkwardCount >= 2
                  ? `You still have ${awkwardCount} answers you would rewrite if I dared you — and I do. Claim XP, then chase them down immediately.`
                  : 'You still have one answer that keeps this from feeling spotless. Claim XP, then wipe it on the replay while it still stings.'}
              </Text>
            </View>
          ) : (
            <Animated.View style={{ transform: [{ scale: doneHeroScale }], alignItems: 'center', width: '100%' }}>
              <Text style={styles.bigEmoji}>{goalMet ? '🎉' : '💪'}</Text>
              <Text style={styles.bigTitle}>{goalMet ? 'You made it through' : 'You hung in there'}</Text>
              <Text style={styles.doneVictoryHint}>
                {goalMet ? 'Every strong pick landed — I want you to feel that in your chest.' : 'You are closer than you think — one cleaner streak changes the whole read.'}
              </Text>
            </Animated.View>
          )}
          {!almostPerfectRun && <Text style={styles.outcomeText}>{outcomeText}</Text>}
          {almostPerfectRun && (
            <TouchableOpacity style={styles.doneDetailsToggle} onPress={() => setDoneDetailsOpen(o => !o)} activeOpacity={0.85}>
              <Text style={styles.doneDetailsToggleText}>
                {doneDetailsOpen ? 'Hide turn-by-turn breakdown ↑' : 'Show turn-by-turn breakdown ↓'}
              </Text>
            </TouchableOpacity>
          )}

          {showFullDetails && (
            <>
              {!almostPerfectRun && goodCount < total && accRatio >= 0.55 && (
                <View style={styles.almostPerfectBanner}>
                  <Text style={styles.almostPerfectTitle}>Near-perfect run</Text>
                  <Text style={styles.almostPerfectBody}>
                    You were one cleaner line away from a flawless feel — I am already queueing the next run for you in my head.
                  </Text>
                </View>
              )}
              {donePrevSnap && (
                <View style={styles.journeyCard}>
                  <Text style={styles.journeyLabel}>FOR YOUR NEXT RUN</Text>
                  {donePrevSnap.failed ? (
                    <Text style={styles.journeyText}>
                      Last time the scene cut early on you. This time you walked it to the end — ride that revenge energy straight into another try.
                    </Text>
                  ) : (
                    <Text style={styles.journeyText}>
                      Last run: combo {donePrevSnap.comboMax} · natural %{Math.round(donePrevSnap.accuracy * 100)}
                      {donePrevSnap.flowPath === 'friction' ? ' — now you know you can hold the flow longer.' : ' — stack a higher bar while it is hot.'}
                    </Text>
                  )}
                </View>
              )}
              {hadNearMiss && !hadNativeFlow && !almostPerfectRun && (
                <View style={styles.nearMissBadge}>
                  <Text style={styles.nearMissText}>⚡ You almost lost the room — then you clawed it back</Text>
                </View>
              )}
              {hadNativeFlow && (
                <View style={styles.nativeFlowBadge}>
                  <Text style={styles.nativeFlowText}>🚀 You found native-level flow</Text>
                </View>
              )}

              <View style={[styles.goalRow, { borderColor: goalMet ? '#3DD68C' : '#F5B800' }]}>
                <Text style={styles.goalRowIcon}>{goalMet ? '✅' : '🎯'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.goalRowStatus, { color: goalMet ? '#3DD68C' : '#F5B800' }]}>
                    {goalMet ? 'Mission cleared' : 'Mission: keep pushing'}
                  </Text>
                  <Text style={styles.goalRowText} numberOfLines={2}>
                    {scenario.mission ?? 'Konuşmayı tamamla'}
                  </Text>
                </View>
              </View>

              <View style={styles.doneStats}>
                <View style={styles.doneStat}>
                  <Text style={[styles.doneStatVal, { color: '#3DD68C' }]}>{goodCount}/{total}</Text>
                  <Text style={styles.doneStatLbl}>Doğal seçim</Text>
                </View>
                <View style={styles.doneStat}>
                  <Text style={[styles.doneStatVal, { color: '#A78BFA' }]}>{comboPeakRef.current}</Text>
                  <Text style={styles.doneStatLbl}>Max combo</Text>
                </View>
                <View style={styles.doneStat}>
                  <Text style={[styles.doneStatVal, { color: '#1B9C5A' }]}>{awkwardCount}</Text>
                  <Text style={styles.doneStatLbl}>Garip</Text>
                </View>
              </View>

              <View style={styles.donePathRow}>
                <Text style={styles.donePathLabel}>Dallanma</Text>
                <Text style={styles.donePathVal}>
                  {computeFlowPath(turnHistory) === 'smooth' ? '✨ Akıcı sohbet' : '⚡ Gergin / pürüzlü'}
                </Text>
              </View>
              {timeoutCount > 0 && (
                <Text style={styles.timeoutNote}>
                  ⏱ {timeoutCount} turn{timeoutCount >= 2 ? 's' : ''} where time ran out — the clock counted against you.
                </Text>
              )}

              {bestPhrase && (
                <View style={styles.bestPhraseBox}>
                  <Text style={styles.bestPhraseLabel}>ANA DİL SEVİYESİ İFADE</Text>
                  <Text style={styles.bestPhraseText}>"{bestPhrase}"</Text>
                </View>
              )}

              <Text style={styles.replayTitle}>TUR ÖZETI</Text>
              {turnHistory.map((t, i) => (
                <View key={i} style={styles.replayItem}>
                  <View style={styles.replayHeader}>
                    <View style={[styles.replayDot, { backgroundColor: qColor(t.quality) }]} />
                    <Text style={styles.replayNpc} numberOfLines={1}>{t.npcMessage}</Text>
                  </View>
                  <Text style={[styles.replayChosen, { color: qColor(t.quality) }]}>
                    {qLabel(t.quality)}  "{t.selectedText}"
                  </Text>
                  {t.quality !== 'good' && t.goodOption !== t.selectedText && (
                    <Text style={styles.replayBetter}>💡 Daha doğal: "{t.goodOption}"</Text>
                  )}
                </View>
              ))}
            </>
          )}

          <AnimatedPressable style={[styles.primaryBtn, { marginTop: 8 }]} onPress={completeStage} pressScale={0.96}>
            <Text style={styles.primaryBtnText}>{claimCta}</Text>
          </AnimatedPressable>
          <Text style={styles.doneHintBelow}>
            {almostPerfectRun && !doneDetailsOpen
              ? 'Next screen doubles down on why you should replay — numbers stay tucked until you open them.'
              : 'Next screen leads with why you should run this scene again — stats follow your motivation.'}
          </Text>
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    );
  }

  // GAME (main)
  const turnNum = turnHistory.length + 1;
  const canFinishEarly = turnHistory.length >= 2 && selectedIdx === null && !optionsLoading;
  const isLastTurn = turnHistory.length + 1 >= MAX_TURNS;
  const comboTier = getComboTier(consecutiveGood);
  const livePath = computeFlowPath(turnHistory);
  const timerColor = answerTimeLeft !== null && answerTimeTotal > 0
    ? timerUrgencyRgb(answerTimeLeft, answerTimeTotal)
    : '#22C55E';

  return (
    <View style={styles.container}>
      {renderHeader(
        <View style={styles.turnBadge}>
          <Text style={styles.turnText}>{turnNum} / {MAX_TURNS}</Text>
        </View>
      )}

      {!!rewardText && (
        <Animated.View pointerEvents="none" style={[styles.rewardToast, { opacity: rewardOpacity }]}>
          <View style={[styles.rewardToastInner, comboTier ? { borderColor: comboTier.color + '99', shadowColor: comboTier.color } : undefined]}>
            <Text style={[styles.rewardToastText, comboTier ? { color: comboTier.color } : undefined]}>{rewardText}</Text>
          </View>
        </Animated.View>
      )}

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.gameScroll}>

        {/* Progress + goal + combo */}
        <View style={styles.progressSection}>
          <View style={styles.dotsRow}>
            {turnHistory.map((t, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: qColor(t.quality) }]} />
            ))}
            {Array.from({ length: MAX_TURNS - turnHistory.length }).map((_, i) => (
              <View key={`e${i}`} style={[styles.dot, styles.dotEmpty]} />
            ))}
          </View>

          <Animated.View
            style={[
              styles.flowRail,
              {
                transform: [{ scale: flowPulse }],
                borderColor: livePath === 'smooth' ? '#22C55E' : '#EA580C',
                backgroundColor: livePath === 'smooth' ? '#DCFCE7' : '#FFEDD5',
              },
            ]}
          >
            <Text style={[styles.flowRailTitle, { color: livePath === 'smooth' ? '#166534' : '#9A3412' }]}>
              {livePath === 'smooth' ? 'Smooth flow' : 'You lost the flow'}
            </Text>
            <Text style={[styles.flowRailSub, { color: livePath === 'smooth' ? '#15803D' : '#C2410C' }]}>
              {livePath === 'smooth' ? 'Konuşma dengede — böyle devam.' : 'Garip seçim akışı kesti — toparla.'}
            </Text>
          </Animated.View>

          <View style={styles.progressMeta}>
            {scenario.mission && (
              <Text style={styles.sceneGoalText} numberOfLines={1}>🎯 {scenario.mission}</Text>
            )}
            <View style={styles.metaChips}>
              {comboTier && (
                <Animated.View
                  style={[
                    styles.comboCard,
                    {
                      transform: [{ scale: comboCardScale }],
                      borderColor: comboTier.color + 'AA',
                      backgroundColor: comboTier.glow,
                      shadowColor: comboTier.color,
                    },
                  ]}
                >
                  <Text style={styles.comboEmoji}>{comboTier.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.comboHype, { color: comboTier.color }]}>{comboTier.hype}</Text>
                    <Text style={styles.comboSub}>{comboTier.sub}</Text>
                  </View>
                </Animated.View>
              )}
            </View>
          </View>
          {answerTimeLeft !== null && answerTimeTotal > 0 && selectedIdx === null && !!options && (
            <Animated.View
              style={[
                styles.timerWrap,
                {
                  opacity: timerGlow,
                  transform: [{
                    translateX: timerShake.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [-8, 0, 8],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.timerRow}>
                <Text style={styles.timerLabel}>Süre baskısı</Text>
                <Text style={[
                  styles.timerCount,
                  answerTimeLeft <= 3 ? styles.timerCountUrgent : { color: timerColor },
                ]}>
                  {answerTimeLeft}s
                </Text>
              </View>
              <View style={styles.timerTrack}>
                <Animated.View
                  style={[
                    styles.timerFill,
                    {
                      width: timerProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: timerColor,
                    },
                  ]}
                />
              </View>
              {answerTimeLeft <= 5 && (
                <Text style={styles.timerPulseHint}>⚡ Hızlan — düşünce süresi bitiyor</Text>
              )}
            </Animated.View>
          )}
          {consecutiveBad === 1 && (
            <Text style={styles.warningText}>
              {personality === 'friendly'
                ? '😕 Karşı taraf biraz kafası karıştı — devam edebilirsin'
                : personality === 'busy'
                ? '⏱ NPC\'nin sabrı azalıyor...'
                : '😤 Karşı tarafın sabrı tükenmek üzere'}
            </Text>
          )}
        </View>

        {/* Chat history (WhatsApp-like flow) */}
        {turnHistory.length > 0 && (
          <View style={styles.chatHistoryWrap}>
            <Text style={styles.chatHistoryTitle}>SOHBET AKIŞI</Text>
            {turnHistory.map((t, i) => (
              <View key={`chat-${i}`} style={styles.chatTurnBlock}>
                <View style={styles.npcBubbleRow}>
                  <View style={styles.npcBubble}>
                    <Text style={styles.bubbleName}>{persona.name}</Text>
                    <Text style={styles.npcBubbleText}>{t.npcMessage}</Text>
                  </View>
                </View>
                <View style={styles.userBubbleRow}>
                  <View style={styles.userBubble}>
                    <Text style={styles.bubbleNameYou}>Sen</Text>
                    <Text style={styles.userBubbleText}>{t.selectedText}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* NPC card */}
        <Animated.View
          style={[
            styles.npcCard,
            {
              opacity: npcEntrance,
              transform: [
                {
                  translateX: npcEntrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [84, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.npcAvatarWrap}>
            <Text style={styles.npcAvatarEmoji}>{scenario.emoji}</Text>
            <View style={[styles.moodPill, { backgroundColor: PERSONALITY_COLOR[personality] + '20' }]}>
              <Text style={styles.moodPillEmoji}>{MOOD_EMOJI[npcMood]}</Text>
            </View>
          </View>
          <View style={styles.npcContent}>
            <View style={styles.npcNameRow}>
              <Text style={styles.npcName}>{persona.name}</Text>
              <View style={[styles.personalityTag, { borderColor: PERSONALITY_COLOR[personality] + '50' }]}>
                <Text style={[styles.personalityText, { color: PERSONALITY_COLOR[personality] }]}>
                  {PERSONALITY_LABEL[personality]}
                </Text>
              </View>
              {npcMood !== 'neutral' && (
                <Text style={[styles.npcMoodLabel, {
                  color: npcMood === 'happy' ? '#3DD68C' : npcMood === 'confused' ? '#F5B800' : '#1B9C5A',
                }]}>
                  · {MOOD_LABEL[npcMood]}
                </Text>
              )}
            </View>
            {reactionVisible && npcReaction ? (
              <>
                <Animated.View
                  style={{
                    opacity: npcReplyEntrance,
                    transform: [{
                      translateX: npcReplyEntrance.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }),
                    }],
                  }}
                >
                  <Text style={styles.npcReactionText}>{npcReaction}</Text>
                </Animated.View>
                <Text style={styles.npcPrevText}>{npcMessage}</Text>
              </>
            ) : (
              <Text style={styles.npcText}>{npcMessage}</Text>
            )}
          </View>
        </Animated.View>

        <Text style={styles.yourTurnLabel}>
          {selectedIdx !== null ? 'NPC TEPKİSİ' : 'CEVABINI SEÇ'}
        </Text>

        {/* Options */}
        {optionsLoading ? (
          <View style={styles.loadingWrap} />
        ) : options ? (
          <Animated.View
            style={[
              styles.optionsList,
              {
                opacity: optionsOpacity,
                transform: [{
                  translateY: optionsEntrance.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
                }],
              },
            ]}
          >
            {(() => {
              const center = (options.length - 1) / 2;
              return options.map((opt, idx) => {
                const isSelected = selectedIdx === idx;
                const revealed = selectedIdx !== null;
                const isDim = revealed && !isSelected;
                const isHinted = !revealed && hintIdx === idx;
                const color = revealed ? qColor(opt.quality) : '#E8EDF2';
                const towardCenter = (center - idx) * 26;

                return (
                  <Animated.View
                    key={idx}
                    style={{
                      opacity: optionsOpacity,
                      transform: [
                        {
                          translateY: optionsEntrance.interpolate({
                            inputRange: [0, 1],
                            outputRange: [towardCenter, 0],
                          }),
                        },
                        {
                          scale: optionsEntrance.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.68, 1],
                          }),
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.option,
                        isSelected && { borderColor: color, backgroundColor: color + '14' },
                        isDim && styles.optionDim,
                        isHinted && (consecutiveBad >= 2 ? styles.optionHintStrong : styles.optionHint),
                      ]}
                      onPress={() => handleSelect(idx)}
                      disabled={revealed}
                      activeOpacity={0.72}
                    >
                      <Text style={[styles.optionText, isSelected && { color }]}> 
                        {opt.text}
                      </Text>
                      {isSelected && (
                        <Animated.View
                          style={{
                            opacity: feedbackEntrance,
                            transform: [{
                              translateY: feedbackEntrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
                            }],
                          }}
                        >
                          <Text style={[styles.optionQualityTag, { color }]}> 
                            {qLabel(opt.quality)}
                          </Text>
                        </Animated.View>
                      )}
                      {isHinted && <Text style={styles.hintDot}>•</Text>}
                    </TouchableOpacity>
                  </Animated.View>
                );
              });
            })()}
          </Animated.View>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        {selectedIdx !== null ? (
          <AnimatedPressable style={styles.primaryBtn} onPress={() => { void handleNext(); }} pressScale={0.97}>
            <Text style={styles.primaryBtnText}>
              {sceneComplete || isLastTurn ? '🏁 Sahneyi Bitir' : 'Sonraki Tur →'}
            </Text>
          </AnimatedPressable>
        ) : canFinishEarly ? (
          <TouchableOpacity style={styles.earlyExitBtn} onPress={() => setPhase('done')}>
            <Text style={styles.earlyExitText}>Sahneyi Bitir</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#F5F7FA', borderBottomWidth: 1, borderBottomColor: '#FFFFFF', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: '#1A2B3C' },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerEmoji: { fontSize: 26 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#1A2B3C' },
  headerLocation: { fontSize: 11, color: '#B0BEC5', marginTop: 1 },
  turnBadge: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#E8EDF2' },
  turnText: { color: '#1B9C5A', fontSize: 11, fontWeight: '900' },

  centerWrap: { flex: 1, paddingHorizontal: 24, paddingTop: 40, alignItems: 'center', justifyContent: 'center', gap: 12 },
  bigEmoji: { fontSize: 56, marginBottom: 4 },
  bigTitle: { fontSize: 22, fontWeight: '900', color: '#1A2B3C', textAlign: 'center' },
  bigMeta: { fontSize: 14, color: '#9AABB8', marginBottom: 8 },

  primaryBtn: { backgroundColor: '#1B9C5A', borderRadius: 16, paddingVertical: 17, paddingHorizontal: 24, alignItems: 'center', width: '100%' },
  primaryBtnText: { color: '#1A2B3C', fontSize: 16, fontWeight: '800' },
  ghostBtn: { paddingVertical: 14, alignItems: 'center', width: '100%' },
  ghostBtnText: { color: '#B0BEC5', fontSize: 14 },
  earlyExitBtn: { backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#E8EDF2' },
  earlyExitText: { color: '#9AABB8', fontSize: 14, fontWeight: '700' },

  introScroll: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 48, gap: 14 },
  introBadge: { color: '#8B5E45', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  introTitle: { color: '#1A2B3C', fontSize: 26, fontWeight: '900', lineHeight: 34 },
  introSub: { color: '#9AABB8', fontSize: 14 },
  quoteBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2D7CF' },
  quoteText: { color: '#1A2B3C', fontSize: 17, fontWeight: '700', lineHeight: 26 },
  missionText: { color: '#8B5E45', fontSize: 13, lineHeight: 20 },
  howItWorksBox: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, gap: 6, borderWidth: 1, borderColor: '#E2D7CF' },
  howTitle: { color: '#8B5E45', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  howItem: { color: '#6B7B8D', fontSize: 13, lineHeight: 22 },
  vocabTitle: { fontSize: 22, fontWeight: '800', color: '#1A2B3C' },
  vocabSubtitle: { fontSize: 14, color: '#6B7B8D' },
  vocabGrid: { gap: 8 },
  vocabCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2D7CF' },
  vocabWord: { fontSize: 15, fontWeight: '700', color: '#1A2B3C' },
  vocabMeaning: { fontSize: 13, color: '#8B5E45', fontWeight: '600' },
  preStartBtn: {
    backgroundColor: '#A66A4C',
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#A66A4C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  preStartBtnText: { color: '#FFFDF8', fontSize: 16, fontWeight: '800' },
  challengeIntroCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 4,
  },
  challengeIntroLabel: { color: '#38BDF8', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  challengeIntroTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },
  challengeIntroSub: { color: '#CBD5E1', fontSize: 12, fontWeight: '700' },
  challengeIntroTaunt: { color: '#FBBF24', fontSize: 12, fontWeight: '800', marginTop: 4 },

  // Lost
  failReactionBox: { width: '100%', backgroundColor: '#FEECEC', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#F7CACA' },
  failReactionName: { fontSize: 11, fontWeight: '900', color: '#EF4444', letterSpacing: 1, marginBottom: 6 },
  failReactionText: { fontSize: 16, color: '#1A2B3C', fontWeight: '700', lineHeight: 24 },
  failTip: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E8EDF2' },
  failTipText: { fontSize: 13, color: '#6B7B8D', lineHeight: 20 },

  // Game
  gameScroll: { paddingHorizontal: 20, paddingTop: 16 },
  progressSection: { marginBottom: 18, gap: 8 },
  chatHistoryWrap: { marginBottom: 14, gap: 8 },
  chatHistoryTitle: { fontSize: 10, fontWeight: '900', color: '#B0BEC5', letterSpacing: 1.4, paddingHorizontal: 2 },
  chatTurnBlock: { gap: 6 },
  npcBubbleRow: { alignItems: 'flex-start' },
  userBubbleRow: { alignItems: 'flex-end' },
  npcBubble: {
    maxWidth: '88%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDF2',
    borderRadius: 14,
    borderTopLeftRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userBubble: {
    maxWidth: '88%',
    backgroundColor: '#A66A4C',
    borderWidth: 1,
    borderColor: '#8B5E45',
    borderRadius: 14,
    borderTopRightRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleName: { fontSize: 10, fontWeight: '900', color: '#1B9C5A', marginBottom: 3, letterSpacing: 0.6 },
  bubbleNameYou: { fontSize: 10, fontWeight: '900', color: '#F4ECE5', marginBottom: 3, letterSpacing: 0.6, textAlign: 'right' },
  npcBubbleText: { fontSize: 14, color: '#1A2B3C', lineHeight: 20 },
  userBubbleText: { fontSize: 14, color: '#FFFFFF', lineHeight: 20 },
  dotsRow: { flexDirection: 'row', gap: 7, justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotEmpty: { backgroundColor: '#E8EDF2' },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, flexWrap: 'wrap', gap: 8 },
  sceneGoalText: { fontSize: 11, color: '#B0BEC5', flex: 1 },
  comboBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  comboText: { fontSize: 11, fontWeight: '900' },
  warningText: { fontSize: 11, color: '#1B9C5A', fontWeight: '700', textAlign: 'center' },

  npcCard: { flexDirection: 'row', gap: 14, marginBottom: 20, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E8EDF2' },
  npcAvatarWrap: { alignItems: 'center', gap: 6 },
  npcAvatarEmoji: { fontSize: 30 },
  moodPill: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  moodPillEmoji: { fontSize: 14 },
  npcContent: { flex: 1, gap: 4 },
  npcNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' },
  npcName: { fontSize: 11, fontWeight: '900', color: '#1B9C5A', letterSpacing: 1 },
  personalityTag: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  personalityText: { fontSize: 9, fontWeight: '800' },
  npcMoodLabel: { fontSize: 10, fontWeight: '700' },
  npcText: { fontSize: 18, color: '#1A2B3C', fontWeight: '700', lineHeight: 26 },
  npcReactionText: { fontSize: 18, color: '#1A2B3C', fontWeight: '700', lineHeight: 26 },
  npcPrevText: { fontSize: 12, color: '#6B7B8D', marginTop: 4, fontStyle: 'italic' },

  yourTurnLabel: { fontSize: 10, fontWeight: '900', color: '#B0BEC5', letterSpacing: 1.5, marginBottom: 10 },
  loadingWrap: { minHeight: 1 },

  optionsList: { gap: 10, overflow: 'hidden' },
  option: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#E8EDF2' },
  optionDim: { opacity: 0.3 },
  optionHint: { borderColor: '#D9D2FF', backgroundColor: '#F6F3FF' },
  optionHintStrong: { borderColor: '#B8ABFF', backgroundColor: '#F1EEFF' },
  optionText: { color: '#1A2B3C', fontSize: 15, lineHeight: 22 },
  optionQualityTag: { fontSize: 12, fontWeight: '800', marginTop: 6 },
  hintDot: { fontSize: 18, color: '#7C6CF2', position: 'absolute', right: 14, top: 14 },

  bottomBar: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12, backgroundColor: '#F5F7FA', borderTopWidth: 1, borderTopColor: '#E8EDF2' },

  // Done
  doneScroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48, alignItems: 'center', gap: 14 },
  goalRow: { width: '100%', flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1 },
  goalRowIcon: { fontSize: 20, marginTop: 2 },
  goalRowStatus: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  goalRowText: { fontSize: 12, color: '#9AABB8', lineHeight: 18 },
  doneStats: { flexDirection: 'row', gap: 10, width: '100%' },
  doneStat: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E8EDF2' },
  doneStatVal: { fontSize: 22, fontWeight: '900', color: '#1A2B3C' },
  doneStatLbl: { fontSize: 11, color: '#9AABB8', marginTop: 4 },
  bestPhraseBox: { width: '100%', backgroundColor: '#F0FAF4', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#D4E8DC' },
  bestPhraseLabel: { fontSize: 10, fontWeight: '900', color: '#1B9C5A', letterSpacing: 1, marginBottom: 6 },
  bestPhraseText: { fontSize: 16, color: '#1A2B3C', fontWeight: '700', lineHeight: 24 },
  replayTitle: { width: '100%', fontSize: 10, fontWeight: '900', color: '#6B7B8D', letterSpacing: 1.5, marginBottom: -4 },
  replayItem: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, gap: 4, borderWidth: 1, borderColor: '#E8EDF2' },
  replayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replayDot: { width: 7, height: 7, borderRadius: 4 },
  replayNpc: { fontSize: 11, color: '#B0BEC5', flex: 1 },
  replayChosen: { fontSize: 13, fontWeight: '700', paddingLeft: 15 },
  replayBetter: { fontSize: 12, color: '#7C6CF2', paddingLeft: 15, lineHeight: 18 },
  nativeFlowBadge: { backgroundColor: '#F1EEFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#D9D2FF' },
  nativeFlowText: { color: '#7C6CF2', fontSize: 13, fontWeight: '900' },
  outcomeText: { fontSize: 14, color: '#9AABB8', textAlign: 'center', fontStyle: 'italic', marginTop: -4 },
  nearMissBadge: { backgroundColor: '#F5B80018', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#F5B80050' },
  nearMissText: { color: '#F5B800', fontSize: 12, fontWeight: '800' },
  lostLabel: { backgroundColor: '#FEECEC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#F7CACA' },
  lostLabelText: { color: '#EF4444', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },

  lostGradient: { flex: 1, marginHorizontal: 16, marginBottom: 28, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 32, alignItems: 'center', gap: 12 },
  lostGradientDominant: { paddingTop: 40, paddingBottom: 44, gap: 20, justifyContent: 'center' },
  lostDominantTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF8F5',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: 0.4,
  },
  lostDominantSub: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FECACA',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  lostNpcWhisper: {
    fontSize: 14,
    color: '#A8A29E',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 21,
    marginTop: 4,
    paddingHorizontal: 8,
  },
  primaryBtnLostDominant: { paddingVertical: 18, minHeight: 58, width: '100%', marginTop: 12 },
  primaryBtnTextLostDominant: { fontSize: 16, letterSpacing: 0.2 },
  lostColdLine: { fontSize: 15, fontStyle: 'italic', color: '#FCA5A5', textAlign: 'center', marginBottom: 4, opacity: 0.95 },
  lostBigEmoji: { fontSize: 56 },
  lostLabelOnDark: { backgroundColor: '#FFFFFF18', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#FFFFFF30' },
  lostLabelTextOnDark: { color: '#FECACA', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  lostHeroTitle: { fontSize: 22, fontWeight: '900', color: '#FFF8F5', textAlign: 'center', lineHeight: 30 },
  lostHeroSub: { fontSize: 14, color: '#C4B5B5', textAlign: 'center', lineHeight: 22 },
  lostDismiss: { fontSize: 13, color: '#A8A29E', textAlign: 'center', fontStyle: 'italic', lineHeight: 20, marginTop: 4 },
  nearMissCallout: {
    width: '100%',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginTop: 8,
  },
  nearMissTitle: { fontSize: 16, fontWeight: '900', color: '#92400E', marginBottom: 6 },
  nearMissBody: { fontSize: 13, fontWeight: '700', color: '#78350F', lineHeight: 20 },
  flowTailLine: { fontSize: 13, fontWeight: '800', color: '#FCA5A5', textAlign: 'center', marginTop: 8 },

  journeyCard: {
    width: '100%',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginTop: 8,
  },
  journeyLabel: { fontSize: 10, fontWeight: '900', color: '#4F46E5', letterSpacing: 1.2, marginBottom: 6 },
  journeyText: { fontSize: 13, fontWeight: '700', color: '#312E81', lineHeight: 20 },
  almostPerfectBanner: {
    width: '100%',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    marginTop: 6,
  },
  almostPerfectTitle: { fontSize: 13, fontWeight: '900', color: '#047857', marginBottom: 4 },
  almostPerfectBody: { fontSize: 12, fontWeight: '700', color: '#065F46', lineHeight: 18 },
  failReactionBoxDark: { width: '100%', backgroundColor: '#00000033', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FFFFFF22' },
  failReactionNameDark: { fontSize: 11, fontWeight: '900', color: '#FCA5A5', letterSpacing: 1, marginBottom: 6 },
  failReactionTextDark: { fontSize: 16, color: '#FFF8F5', fontWeight: '700', lineHeight: 24 },
  failTipDark: { width: '100%', backgroundColor: '#FFFFFF10', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FFFFFF18' },
  failTipTextDark: { fontSize: 13, color: '#DDD6D6', lineHeight: 20 },
  primaryBtnLost: { backgroundColor: '#F97316', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', width: '100%', marginTop: 8 },
  primaryBtnTextLost: { color: '#1A0A06', fontSize: 16, fontWeight: '900' },
  ghostBtnLost: { paddingVertical: 14, alignItems: 'center', width: '100%' },
  ghostBtnTextLost: { color: '#C4B5FD', fontSize: 14, fontWeight: '700' },

  metaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', alignItems: 'center', maxWidth: '52%' },
  pathChip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, backgroundColor: '#FFFFFF' },
  pathChipText: { fontSize: 10, fontWeight: '900' },
  timerWrap: { marginBottom: 12, gap: 6 },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
  timerCount: { fontSize: 13, fontWeight: '900', color: '#1B9C5A' },
  timerCountUrgent: { color: '#DC2626', transform: [{ scale: 1.08 }] },
  timerTrack: { height: 6, borderRadius: 4, backgroundColor: '#E8EDF2', overflow: 'hidden' },
  timerFill: { height: 6, borderRadius: 4 },
  timerPulseHint: { fontSize: 11, fontWeight: '800', color: '#EA580C', textAlign: 'center', marginTop: 6 },

  flowRail: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  flowRailTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.2 },
  flowRailSub: { fontSize: 12, fontWeight: '700', marginTop: 4, lineHeight: 18 },

  comboCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    maxWidth: '100%',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  comboEmoji: { fontSize: 28 },
  comboHype: { fontSize: 17, fontWeight: '900', letterSpacing: 0.2 },
  comboSub: { fontSize: 11, fontWeight: '700', color: '#64748B', marginTop: 2 },

  rewardToast: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    zIndex: 50,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  rewardToastInner: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    paddingHorizontal: 22,
    backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  rewardToastText: { fontSize: 20, fontWeight: '900', color: '#0F172A' },

  doneVictoryHint: { fontSize: 13, color: '#64748B', fontWeight: '700', textAlign: 'center', marginTop: 6, lineHeight: 20 },

  doneMotivationHero: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 4,
  },
  doneMotivationEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  doneMotivationTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    lineHeight: 28,
    marginBottom: 12,
  },
  doneMotivationBody: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
    lineHeight: 22,
  },
  doneDetailsToggle: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  doneDetailsToggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B9C5A',
    textDecorationLine: 'underline',
  },

  donePathRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#E8EDF2' },
  donePathLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8' },
  donePathVal: { fontSize: 13, fontWeight: '900', color: '#1A2B3C' },
  timeoutNote: { fontSize: 12, color: '#B45309', fontWeight: '700', textAlign: 'center' },
  doneHintBelow: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: -4, lineHeight: 18 },
});
