import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing,
  ImageBackground, Dimensions, Platform,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import {
  Scenario, StageResult, UserLevel, UserProfile, ModuleResult, SceneFlowPath,
  SceneRunSnapshot, ReplayHookKind, FriendChallengeTarget, StageLearningSummary, StageTurnReview, VoiceAttempt,
} from '../types';
import { sendMessage } from '../services/claude';
import { getSessionTurns } from '../data/scenarioDialogues';
import { parseModelJson, tryParseJson } from '../services/json';
import { getPersonaByStage, getGoalContext } from '../services/personas';
import { trackEvent } from '../services/telemetry';
import { useAppTranslation } from '../i18n';
import {
  getSceneSnapshot,
  saveSceneSnapshot,
  computeFailNearMiss,
  deriveSuccessHook,
  buildLostReplayCta,
} from '../services/runHook';
import { getLastSceneSession } from '../services/sessionMemory';
import {
  cleanupVoiceRecording,
  createVoiceAttempt,
  evaluateVoiceAttempt,
  requestMicrophonePermission,
  speakNpcLine,
  startVoiceRecording,
  stopNpcSpeech,
  stopVoiceRecording,
  transcribeVoice,
} from '../services/voice';
import { getVoiceRepeatLimitState, recordVoiceRepeatUse } from '../services/subscription';
import AnimatedPressable from '../components/AnimatedPressable';

// ─── Types ─────────────────────────────────────────────────────────────────

type NpcMood = 'happy' | 'neutral' | 'confused' | 'impatient';
type OptionQuality = 'good' | 'ok' | 'awkward';
type NpcPersonality = 'friendly' | 'busy' | 'rude';

type DialogOption = { text: string; quality: OptionQuality; feedback?: string; why?: string };

type TurnRecord = {
  npcMessage: string;
  selectedText: string;
  quality: OptionQuality;
  goodOption: string;
  npcReaction: string;
  inputMode?: 'written' | 'voice';
  transcript?: string;
};

type GameTurn = {
  npc_message: string;
  npc_mood: NpcMood;
  options: DialogOption[];
  reactions: { good: string; ok: string; awkward: string };
  scene_complete?: boolean;
  sceneState?: {
    tension?: 'low' | 'medium' | 'high';
    progress?: 'opening' | 'complication' | 'resolution';
    nextBeat?: string;
  };
};

type AiChoice = {
  text: string;
  quality: OptionQuality;
  feedback?: string;
  why?: string;
};

type AiTurnPayload = Partial<GameTurn> & {
  npcLine?: string;
  choices?: AiChoice[];
  sceneState?: GameTurn['sceneState'];
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
const REACTION_DELAY_MS = 360;
const VOICE_REPEAT_SECONDS = 3.2;
const VOICE_REPLY_SECONDS = 7;
const AI_TURN_TIMEOUT_MS = 8500;
const GAME_EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const GAME_EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PHOTO_HEIGHT = SCREEN_HEIGHT * 0.60;

// Stage → background photo mapping (Unsplash CDN)
const SCENE_PHOTOS: Record<string, { uri: string }> = {
  cafe:     { uri: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&q=85&fit=crop' },
  travel:   { uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=900&q=85&fit=crop' },
  business: { uri: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&q=85&fit=crop' },
  social:   { uri: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=900&q=85&fit=crop' },
  story:    { uri: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=85&fit=crop' },
  survival: { uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&q=85&fit=crop' },
};
const DEFAULT_SCENE_PHOTO: { uri: string } = { uri: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&q=85&fit=crop' };

// Turkish role label per stage
const STAGE_ROLE_TR: Record<string, string> = {
  cafe:     'Garson',
  travel:   'Yerel Rehber',
  business: 'İş Ortağı',
  social:   'Arkadaş',
  story:    'Karakter',
  survival: 'Yerli',
};

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
  friendly: colors.successDs, busy: colors.accentWarmSoft, rude: colors.errorDs,
};

const qColor = (q: OptionQuality) =>
  q === 'good' ? colors.successDs : q === 'ok' ? colors.accentWarmSoft : colors.errorDs;
const qLabel = (q: OptionQuality) =>
  q === 'good' ? '✨ Çok doğal' : q === 'ok' ? '👍 Anlaşıldı' : '😅 Biraz garip';

const normalizeVoiceText = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const voiceTokensFor = (text: string) =>
  Array.from(new Set(normalizeVoiceText(text).split(' ').filter(token => token.length > 2)));

const scoreVoiceMatch = (transcript: string, optionText: string) => {
  const spoken = normalizeVoiceText(transcript);
  const optionTokens = voiceTokensFor(optionText);
  if (!spoken || optionTokens.length === 0) return 0;
  const matched = optionTokens.filter(token => spoken.includes(token)).length;
  return matched / optionTokens.length;
};

type ComboTier = {
  hype: string;
  sub: string;
  color: string;
  emoji: string;
  glow: string;
};

/** Subtle flow copy for consecutive natural replies. */
const getComboTier = (n: number): ComboTier | null => {
  if (n < 1) return null;
  if (n === 1) return { hype: 'Doğru ton', sub: 'Cevap sahneye uydu', color: colors.successDs, emoji: '', glow: '#22C55E55' };
  if (n === 2) return { hype: 'Akış yakalanıyor', sub: 'İki doğal cevap üst üste', color: colors.accentWarm, emoji: '', glow: '#38BDF866' };
  if (n === 3) return { hype: 'Sahne ritmi oturdu', sub: 'Üst üste çok doğal', color: colors.accentWarm, emoji: '', glow: '#F9731688' };
  return { hype: 'Temiz sahne akışı', sub: 'Gerçek hayata hazır ritim', color: colors.accentWarm, emoji: '', glow: '#A855F799' };
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

const normalizeSceneLine = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const similarSceneLine = (a?: string, b?: string) => {
  const left = normalizeSceneLine(a ?? '');
  const right = normalizeSceneLine(b ?? '');
  if (!left || !right) return false;
  if (left === right) return true;
  const leftTokens = new Set(left.split(' ').filter(token => token.length > 3));
  const rightTokens = right.split(' ').filter(token => token.length > 3);
  if (rightTokens.length === 0) return false;
  const overlap = rightTokens.filter(token => leftTokens.has(token)).length / rightTokens.length;
  return overlap >= 0.72;
};

const stageBeatFor = (stage: NonNullable<Scenario['stageType']>, turnIndex: number) => {
  const beats: Record<NonNullable<Scenario['stageType']>, string[]> = {
    cafe: [
      'Take the main order.',
      'Ask a concrete follow-up: size, side, milk, sugar, refill, to-go, or one extra item.',
      'Confirm the order and ask one practical detail.',
      'Move toward payment/check or closing the order.',
      'Resolve the final small detail and complete the interaction.',
    ],
    travel: [
      'Find out where the user wants to go.',
      'Ask or explain the line/platform/direction.',
      'Add a transfer, ticket, stop, or timing detail.',
      'Confirm the route so the user can leave confidently.',
      'Close the travel help interaction.',
    ],
    business: [
      'Open the professional topic.',
      'Ask for one concrete opinion, deadline, example, or clarification.',
      'Introduce a small disagreement, risk, or constraint.',
      'Ask the user to repair, soften, or clarify the point.',
      'Close with a next step.',
    ],
    social: [
      'Start the social contact.',
      'Ask one personal/contextual follow-up.',
      'Introduce a small social choice, invitation, or misunderstanding.',
      'Let the user keep or repair the flow.',
      'Close the exchange naturally.',
    ],
    story: [
      'Establish what happened.',
      'Ask for the user perspective.',
      'Introduce a consequence or decision.',
      'Ask for a repair or compromise.',
      'Resolve the scene.',
    ],
    survival: [
      'Identify the urgent need.',
      'Ask for one precise symptom, place, document, or problem detail.',
      'Give one instruction or ask for confirmation.',
      'Check if the user understood the next action.',
      'Close with the safest next step.',
    ],
  };
  const list = beats[stage] ?? beats.social;
  return list[Math.min(turnIndex, list.length - 1)];
};

const survivalResponsesByLang: Record<string, string[]> = {
  en: [
    'Sorry, could you repeat that?',
    'One moment, please.',
    "I'm not sure I understood.",
    'Could you say that more slowly?',
  ],
  es: [
    'Perdón, ¿podrías repetir eso?',
    'Un momento, por favor.',
    'No estoy seguro de haber entendido.',
    '¿Podrías decirlo más despacio?',
  ],
  fr: [
    'Pardon, vous pouvez répéter ?',
    'Un moment, s’il vous plaît.',
    'Je ne suis pas sûr d’avoir compris.',
    'Vous pouvez parler plus lentement ?',
  ],
  de: [
    'Entschuldigung, können Sie das wiederholen?',
    'Einen Moment, bitte.',
    'Ich bin nicht sicher, ob ich das verstanden habe.',
    'Können Sie das langsamer sagen?',
  ],
  it: [
    'Scusi, può ripetere?',
    'Un momento, per favore.',
    'Non sono sicuro di aver capito.',
    'Può dirlo più lentamente?',
  ],
  pt: [
    'Desculpe, pode repetir?',
    'Um momento, por favor.',
    'Não tenho certeza se entendi.',
    'Pode falar mais devagar?',
  ],
};

const getSurvivalResponse = (lang: string, turnIndex: number): DialogOption => {
  const bank = survivalResponsesByLang[lang] ?? survivalResponsesByLang.en;
  return {
    text: bank[turnIndex % bank.length],
    quality: 'ok',
    feedback: 'Zaman baskısında konuşmayı koparmadan yardım istedin.',
    why: 'Survival response: anlamadığında sahneyi kurtarır ve karşı tarafı tekrar etmeye davet eder.',
  };
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
  guidedRunMode?: boolean;
  /** Goal id from home screen target selector */
  goalId?: string;
  /** Completed count for this scenario — harder / less hand-holding on replay */
  playCount?: number;
  challengeTarget?: FriendChallengeTarget | null;
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function ScenarioScreen({
  scenario, onBack, onStageComplete, onRunComplete, firstSessionMode = false, prepBonus = 0, easyStart = false, goalId,
  guidedRunMode = false,
  playCount = 0,
  challengeTarget = null,
}: Props) {
  const t = useAppTranslation();
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
  const [voiceStep, setVoiceStep] = useState<'idle' | 'ready' | 'recording' | 'processing' | 'review' | 'skipped' | 'locked'>('idle');
  const [voiceAttempts, setVoiceAttempts] = useState<VoiceAttempt[]>([]);
  const [currentVoiceAttempt, setCurrentVoiceAttempt] = useState<VoiceAttempt | null>(null);
  const [voiceMessage, setVoiceMessage] = useState('');
  const [voiceTargetText, setVoiceTargetText] = useState('');
  const [voiceCaptureMode, setVoiceCaptureMode] = useState<'scene' | 'repeat' | null>(null);
  const [voiceInputMode, setVoiceInputMode] = useState<'hybrid' | 'written'>('hybrid');
  const [lastVoiceTranscript, setLastVoiceTranscript] = useState('');

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
  const handleSelectRef = useRef<(idx: number, meta?: { timedOut?: boolean; inputMode?: 'written' | 'voice'; transcript?: string }) => void>(() => {});
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
  const timerGlow = useRef(new Animated.Value(1)).current;
  const doneHeroScale = useRef(new Animated.Value(1)).current;
  const flowPulse = useRef(new Animated.Value(1)).current;
  const rewardOpacity = useRef(new Animated.Value(0)).current;
  const timerProgress = useRef(new Animated.Value(1)).current;
  const npcCardFlip = useRef(new Animated.Value(0)).current;
  const timerGlowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // ── Scene editorial UI state ───────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecsLeft, setRecordingSecsLeft] = useState(3.2);
  const [npcCardSide, setNpcCardSide] = useState<'front' | 'translation'>('front');
  const [npcTranslation, setNpcTranslation] = useState<string | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const recordingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingUriRef = useRef<string | undefined>(undefined);
  const voiceCaptureModeRef = useRef<'scene' | 'repeat' | null>(null);
  const translationCacheRef = useRef<Record<string, string>>({});

  // Animation: mic ripple (two concentric rings)
  const micRipple1 = useRef(new Animated.Value(0)).current;
  const micRipple2 = useRef(new Animated.Value(0)).current;
  // Animation: waveform bars (12 bars)
  const waveAnims = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(0.3))
  ).current;
  // Animation: scene meta dot pulse
  const metaDotPulse = useRef(new Animated.Value(1)).current;
  // Animation: screen entrance
  const sceneEntrance = useRef(new Animated.Value(0)).current;

  const animateNpcEntrance = () => {
    npcEntrance.setValue(0);
    Animated.parallel([
      Animated.timing(npcEntrance, { toValue: 1, duration: 560, easing: GAME_EASE_OUT, useNativeDriver: true }),
    ]).start();
  };

  const animateNpcReplyEntrance = () => {
    npcReplyEntrance.setValue(0);
    Animated.timing(npcReplyEntrance, { toValue: 1, duration: 620, easing: GAME_EASE_OUT, useNativeDriver: true }).start();
  };

  const resetNpcCardFace = () => {
    npcCardFlip.setValue(0);
    setNpcCardSide('front');
    setNpcTranslation(null);
    setTranslationLoading(false);
  };

  const animateOptionsIn = () => {
    optionsEntrance.setValue(0);
    optionsOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(optionsEntrance, { toValue: 1, duration: 520, easing: GAME_EASE_OUT, useNativeDriver: true }),
      Animated.timing(optionsOpacity, { toValue: 1, duration: 460, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  };

  const animateOptionsOut = () =>
    new Promise<void>(resolve => {
      Animated.parallel([
        Animated.timing(optionsEntrance, {
          toValue: 0,
          duration: 420,
          easing: GAME_EASE_IN_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(optionsOpacity, {
          toValue: 0,
          duration: 360,
          easing: GAME_EASE_IN_OUT,
          useNativeDriver: true,
        }),
      ]).start(() => resolve());
    });

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (firstSessionMode) return;
    if (guidedRunMode) {
      startGame();
      return;
    }
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
      trackEvent('stage_started', { scenarioId: scenario.id, stageType: stageKey, firstSessionMode, guidedRunMode });
    }
    return () => {
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
      if (thinkingTimer.current) clearInterval(thinkingTimer.current);
      void stopNpcSpeech();
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'game') return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, [phase, npcMessage, selectedIdx]);

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
    return history
      .map(h => `${h.quality}:${normalizeSceneLine(h.selectedText).slice(0, 28)}`)
      .join('|');
  };

  const startThinkingCountdown = () => {
    if (thinkingTimer.current) clearInterval(thinkingTimer.current);
    let current = 3;
    setThinkingCountdown(current);
    thinkingTimer.current = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        if (thinkingTimer.current) clearInterval(thinkingTimer.current);
        thinkingTimer.current = null;
        setThinkingCountdown(null);
        return;
      }
      setThinkingCountdown(current);
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
  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T | null> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      return await Promise.race([
        promise,
        new Promise<null>(resolve => {
          timeoutId = setTimeout(() => resolve(null), ms);
        }),
      ]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const pickByIndex = (arr: string[], idx: number) => arr[idx % arr.length];

  const getLanguagePack = (lang: string) => {
    const baseByLang: Record<string, {
      sceneOptions: Record<string, { good: string[]; ok: string[]; awkward: string[] }>;
      followUp: { good: string[]; ok: string[]; awkward: string[] };
      reactions: { good: string[]; ok: string[]; awkward: string[] };
    }> = {
      es: {
        sceneOptions: {
          cafe: { good: ['Quisiera un café, por favor.', '¿Podría traerme la carta?', 'Me gustaría pedir algo sencillo.'], ok: ['Quiero un café.', 'La carta, por favor.', 'Necesito pedir.'], awkward: ['Dame café ahora.', 'Yo querer carta.', 'Rápido, café.'] },
          travel: { good: ['¿Podría indicarme la línea correcta?', 'Perdón, ¿esta dirección va al centro?', '¿Me ayuda a confirmar esta parada?'], ok: ['¿Dónde está la línea?', 'Voy al centro.', 'Necesito esta parada.'], awkward: ['Yo perdido, tú decir.', '¿Centro dónde rápido?', 'Esta parada, sí o no.'] },
          business: { good: ['Me gustaría explicar la propuesta con un ejemplo.', 'En mi opinión, este punto necesita más contexto.', 'Podemos revisar el plazo antes de decidir.'], ok: ['Creo que está bien.', 'Necesito más tiempo.', 'Podemos hablar del proyecto.'], awkward: ['Tu idea no sirve.', 'Yo digo que sí.', 'Esto mal, cambiamos.'] },
          social: { good: ['Qué gusto conocerte, ¿cómo conoces al grupo?', 'Me encanta este ambiente, ¿vienes a menudo?', 'Soy nuevo aquí, pero me alegra hablar contigo.'], ok: ['Hola, ¿qué tal?', 'Vengo por la música.', 'Soy nuevo aquí.'], awkward: ['Habla conmigo ahora.', 'No sé, tú dime.', 'Estoy aquí, ya está.'] },
          story: { good: ['Entiendo la situación; intentemos resolverlo con calma.', 'Antes de decidir, quiero escuchar tu versión.', 'Podemos buscar una salida que funcione para ambos.'], ok: ['Vale, entiendo.', 'No sé qué hacer.', 'Podemos hablar.'], awkward: ['Eso es tu problema.', 'No me importa mucho.', 'Hazlo tú.'] },
          survival: { good: ['Necesito ayuda, ¿podría explicarlo más despacio?', 'No me encuentro bien; ¿qué me recomienda?', 'Perdón, quiero asegurarme de entender bien.'], ok: ['Necesito ayuda.', 'No entiendo bien.', '¿Puede repetir?'], awkward: ['Ayuda, rápido.', 'No entiendo nada.', 'Tú arregla esto.'] },
        },
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
        sceneOptions: {
          cafe: { good: ['Je voudrais un café, s’il vous plaît.', 'Est-ce que je peux voir la carte ?', 'J’aimerais commander quelque chose de simple.'], ok: ['Je veux un café.', 'La carte, s’il vous plaît.', 'Je veux commander.'], awkward: ['Donne-moi un café.', 'Moi vouloir la carte.', 'Vite, café.'] },
          travel: { good: ['Vous pourriez m’indiquer la bonne ligne ?', 'Pardon, cette direction va vers le centre ?', 'Vous pouvez m’aider à confirmer cet arrêt ?'], ok: ['Où est la ligne ?', 'Je vais au centre.', 'J’ai besoin de cet arrêt.'], awkward: ['Moi perdu, vous dire.', 'Centre où vite ?', 'Cet arrêt, oui ou non.'] },
          business: { good: ['J’aimerais expliquer la proposition avec un exemple.', 'À mon avis, ce point mérite plus de contexte.', 'Nous pouvons revoir le délai avant de décider.'], ok: ['Je pense que ça va.', 'J’ai besoin de plus de temps.', 'On peut parler du projet.'], awkward: ['Ton idée ne marche pas.', 'Moi je dis oui.', 'C’est mauvais, on change.'] },
          social: { good: ['Enchanté, tu connais le groupe comment ?', 'J’aime beaucoup l’ambiance, tu viens souvent ?', 'Je suis nouveau ici, mais je suis content de discuter.'], ok: ['Salut, ça va ?', 'Je viens pour la musique.', 'Je suis nouveau ici.'], awkward: ['Parle avec moi maintenant.', 'Je ne sais pas, dis-moi.', 'Je suis ici, voilà.'] },
          story: { good: ['Je comprends la situation; essayons de régler ça calmement.', 'Avant de décider, je veux entendre ta version.', 'On peut chercher une solution qui marche pour nous deux.'], ok: ['D’accord, je comprends.', 'Je ne sais pas quoi faire.', 'On peut parler.'], awkward: ['C’est ton problème.', 'Ça m’est égal.', 'Fais-le toi-même.'] },
          survival: { good: ['J’ai besoin d’aide, vous pouvez expliquer plus lentement ?', 'Je ne me sens pas bien; qu’est-ce que vous me conseillez ?', 'Pardon, je veux être sûr de bien comprendre.'], ok: ['J’ai besoin d’aide.', 'Je ne comprends pas bien.', 'Vous pouvez répéter ?'], awkward: ['Aide, vite.', 'Je comprends rien.', 'Vous réparez ça.'] },
        },
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
        sceneOptions: {
          cafe: { good: ['Ich hätte gern einen Kaffee, bitte.', 'Könnte ich bitte die Karte sehen?', 'Ich möchte etwas Einfaches bestellen.'], ok: ['Ich will einen Kaffee.', 'Die Karte, bitte.', 'Ich möchte bestellen.'], awkward: ['Gib mir Kaffee.', 'Ich wollen Karte.', 'Schnell, Kaffee.'] },
          travel: { good: ['Könnten Sie mir die richtige Linie zeigen?', 'Entschuldigung, fährt diese Richtung ins Zentrum?', 'Können Sie mir helfen, diese Haltestelle zu bestätigen?'], ok: ['Wo ist die Linie?', 'Ich gehe ins Zentrum.', 'Ich brauche diese Haltestelle.'], awkward: ['Ich verloren, du sagen.', 'Zentrum wo schnell?', 'Diese Haltestelle, ja oder nein.'] },
          business: { good: ['Ich möchte den Vorschlag mit einem Beispiel erklären.', 'Meiner Meinung nach braucht dieser Punkt mehr Kontext.', 'Wir können die Frist prüfen, bevor wir entscheiden.'], ok: ['Ich denke, das ist okay.', 'Ich brauche mehr Zeit.', 'Wir können über das Projekt sprechen.'], awkward: ['Deine Idee ist schlecht.', 'Ich sage ja.', 'Das falsch, wir ändern.'] },
          social: { good: ['Freut mich, wie kennst du die Gruppe?', 'Ich mag die Stimmung hier, kommst du öfter?', 'Ich bin neu hier, aber freue mich zu reden.'], ok: ['Hallo, wie geht’s?', 'Ich bin wegen der Musik hier.', 'Ich bin neu hier.'], awkward: ['Sprich jetzt mit mir.', 'Keine Ahnung, du sag.', 'Ich bin hier, fertig.'] },
          story: { good: ['Ich verstehe die Situation; lass uns das ruhig lösen.', 'Bevor wir entscheiden, möchte ich deine Sicht hören.', 'Wir können eine Lösung finden, die für beide passt.'], ok: ['Okay, ich verstehe.', 'Ich weiß nicht, was ich tun soll.', 'Wir können reden.'], awkward: ['Das ist dein Problem.', 'Ist mir egal.', 'Mach du das.'] },
          survival: { good: ['Ich brauche Hilfe, könnten Sie das langsamer erklären?', 'Mir geht es nicht gut; was empfehlen Sie?', 'Entschuldigung, ich möchte sicher sein, dass ich es richtig verstehe.'], ok: ['Ich brauche Hilfe.', 'Ich verstehe nicht gut.', 'Können Sie das wiederholen?'], awkward: ['Hilfe, schnell.', 'Ich verstehe nichts.', 'Du machst das.'] },
        },
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
        sceneOptions: {
          cafe: { good: ['Could I get a coffee, please?', 'Could I see the menu for a moment?', 'I’d like to order something simple.'], ok: ['I want a coffee.', 'The menu, please.', 'I need to order.'], awkward: ['Give me coffee now.', 'Me want menu.', 'Coffee. Fast.'] },
          travel: { good: ['Could you point me to the right line?', 'Sorry, does this direction go downtown?', 'Could you help me confirm this stop?'], ok: ['Where is the line?', 'I go downtown.', 'I need this stop.'], awkward: ['I lost, you tell.', 'Downtown where fast?', 'This stop, yes or no.'] },
          business: { good: ['I’d like to explain the proposal with one example.', 'In my view, this point needs more context.', 'Could we review the timeline before deciding?'], ok: ['I think it is okay.', 'I need more time.', 'We can talk about the project.'], awkward: ['Your idea does not work.', 'I say yes.', 'This bad, we change.'] },
          social: { good: ['Nice to meet you, how do you know everyone here?', 'I love the atmosphere, do you come here often?', 'I’m new here, but I’m glad we started talking.'], ok: ['Hi, how are you?', 'I came for the music.', 'I am new here.'], awkward: ['Talk to me now.', 'I don’t know, you tell me.', 'I am here, that is all.'] },
          story: { good: ['I understand the situation; let’s handle it calmly.', 'Before we decide, I’d like to hear your side.', 'We can look for a solution that works for both of us.'], ok: ['Okay, I understand.', 'I don’t know what to do.', 'We can talk.'], awkward: ['That is your problem.', 'I do not care much.', 'You do it.'] },
          survival: { good: ['I need help; could you explain that more slowly?', 'I’m not feeling well; what would you recommend?', 'Sorry, I want to make sure I understood correctly.'], ok: ['I need help.', 'I don’t understand well.', 'Could you repeat that?'], awkward: ['Help, fast.', 'I understand nothing.', 'You fix this.'] },
        },
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

    const extraByLang: Partial<typeof baseByLang> = {
      it: {
        sceneOptions: {
          cafe: { good: ['Vorrei un caffè, per favore.', 'Posso vedere il menù?', 'Vorrei ordinare qualcosa di semplice.'], ok: ['Voglio un caffè.', 'Il menù, per favore.', 'Devo ordinare.'], awkward: ['Dammi caffè ora.', 'Io volere menù.', 'Caffè. Veloce.'] },
          travel: { good: ['Può indicarmi la linea giusta?', 'Scusi, questa direzione va in centro?', 'Mi aiuta a confermare questa fermata?'], ok: ['Dov’è la linea?', 'Vado in centro.', 'Mi serve questa fermata.'], awkward: ['Io perso, tu dire.', 'Centro dove veloce?', 'Questa fermata, sì o no.'] },
          business: { good: ['Vorrei spiegare la proposta con un esempio.', 'Secondo me, questo punto richiede più contesto.', 'Possiamo rivedere la scadenza prima di decidere?'], ok: ['Penso che vada bene.', 'Ho bisogno di più tempo.', 'Possiamo parlare del progetto.'], awkward: ['La tua idea non va.', 'Io dico sì.', 'Questo male, cambiamo.'] },
          social: { good: ['Piacere, come conosci il gruppo?', 'Mi piace molto l’atmosfera, vieni spesso?', 'Sono nuovo qui, ma sono contento di parlare con te.'], ok: ['Ciao, come va?', 'Sono venuto per la musica.', 'Sono nuovo qui.'], awkward: ['Parla con me ora.', 'Non so, dimmi tu.', 'Sono qui, basta.'] },
          story: { good: ['Capisco la situazione; proviamo a risolverla con calma.', 'Prima di decidere, vorrei sentire la tua versione.', 'Possiamo cercare una soluzione che funzioni per entrambi.'], ok: ['Va bene, capisco.', 'Non so cosa fare.', 'Possiamo parlare.'], awkward: ['È un problema tuo.', 'Non mi importa.', 'Fallo tu.'] },
          survival: { good: ['Ho bisogno di aiuto, può spiegarmelo più lentamente?', 'Non mi sento bene; cosa mi consiglia?', 'Scusi, voglio essere sicuro di aver capito.'], ok: ['Ho bisogno di aiuto.', 'Non capisco bene.', 'Può ripetere?'], awkward: ['Aiuto, veloce.', 'Non capisco niente.', 'Tu sistemi questo.'] },
        },
        followUp: {
          good: ['Perfetto, qualcos’altro?', 'Molto bene, continuiamo.', 'Ottimo, e poi?'],
          ok: ['Capisco, ma sii più preciso.', 'Va bene, dammi qualche dettaglio in più.', 'Funziona, ma può essere più naturale.'],
          awkward: ['Non capisco bene. Puoi ripetere?', 'Hmm... suona strano.', 'Qui non è molto naturale.'],
        },
        reactions: {
          good: ['Molto naturale 👌', 'Perfetto ✅', 'Ottima scelta ✨'],
          ok: ['Si capisce 👍', 'Funziona, ma è un po’ secco.', 'Corretto, ma poco naturale.'],
          awkward: ['Un po’ strano 😅', 'Suona poco naturale.', 'Meglio riformulare.'],
        },
      },
      pt: {
        sceneOptions: {
          cafe: { good: ['Eu gostaria de um café, por favor.', 'Posso ver o cardápio?', 'Gostaria de pedir algo simples.'], ok: ['Eu quero um café.', 'O cardápio, por favor.', 'Preciso pedir.'], awkward: ['Me dá café agora.', 'Eu querer cardápio.', 'Café. Rápido.'] },
          travel: { good: ['Pode me indicar a linha certa?', 'Desculpe, esta direção vai para o centro?', 'Pode me ajudar a confirmar esta estação?'], ok: ['Onde fica a linha?', 'Vou para o centro.', 'Preciso desta estação.'], awkward: ['Eu perdido, você fala.', 'Centro onde rápido?', 'Esta estação, sim ou não.'] },
          business: { good: ['Gostaria de explicar a proposta com um exemplo.', 'Na minha opinião, este ponto precisa de mais contexto.', 'Podemos rever o prazo antes de decidir?'], ok: ['Acho que está bom.', 'Preciso de mais tempo.', 'Podemos falar do projeto.'], awkward: ['Sua ideia não presta.', 'Eu digo sim.', 'Isso ruim, mudamos.'] },
          social: { good: ['Prazer, como você conhece o pessoal?', 'Gosto muito do clima daqui, você vem sempre?', 'Sou novo aqui, mas fico feliz de conversar.'], ok: ['Oi, tudo bem?', 'Vim pela música.', 'Sou novo aqui.'], awkward: ['Fala comigo agora.', 'Não sei, você diz.', 'Estou aqui, só isso.'] },
          story: { good: ['Entendo a situação; vamos resolver com calma.', 'Antes de decidir, quero ouvir o seu lado.', 'Podemos procurar uma solução boa para os dois.'], ok: ['Tá bom, entendo.', 'Não sei o que fazer.', 'Podemos conversar.'], awkward: ['Isso é problema seu.', 'Não me importo.', 'Faz você.'] },
          survival: { good: ['Preciso de ajuda, pode explicar mais devagar?', 'Não estou me sentindo bem; o que recomenda?', 'Desculpe, quero ter certeza de que entendi.'], ok: ['Preciso de ajuda.', 'Não entendi bem.', 'Pode repetir?'], awkward: ['Ajuda, rápido.', 'Não entendi nada.', 'Você resolve isso.'] },
        },
        followUp: {
          good: ['Perfeito, mais alguma coisa?', 'Muito bem, vamos continuar.', 'Ótimo, e agora?'],
          ok: ['Entendo, mas seja mais específico.', 'Certo, me dê mais detalhes.', 'Funciona, mas pode soar melhor.'],
          awkward: ['Não entendi bem. Pode repetir?', 'Hmm... isso soa estranho.', 'Não fica natural aqui.'],
        },
        reactions: {
          good: ['Muito natural 👌', 'Perfeito ✅', 'Ótima escolha ✨'],
          ok: ['Dá para entender 👍', 'Funciona, mas soa direto.', 'Correto, mas pouco natural.'],
          awkward: ['Um pouco estranho 😅', 'Soa pouco natural.', 'Melhor reformular.'],
        },
      },
    };

    return baseByLang[lang] ?? extraByLang[lang] ?? baseByLang.en;
  };

  const buildLocalTurn = (history: TurnRecord[], openingMsg: string): GameTurn => {
    const pack = getLanguagePack(scenario.language);
    const idx = history.length;
    const stageOptions = pack.sceneOptions[stageKey] ?? pack.sceneOptions.social;
    const currentBeat = scenario.dramaticBeats?.[idx % (scenario.dramaticBeats?.length || 1)] ?? stageBeatFor(stageKey, idx);
    const usefulPhrase = scenario.usefulPhrases?.[idx % (scenario.usefulPhrases?.length || 1)]?.phrase;

    const good = pickByIndex(stageOptions.good, idx);
    const ok = pickByIndex(stageOptions.ok, idx);
    const awkward = pickByIndex(stageOptions.awkward, idx);

    const lastQuality = history[history.length - 1]?.quality ?? 'good';
    const localNpcByLang: Record<string, Partial<Record<NonNullable<Scenario['stageType']>, string[]>>> = {
      en: {
        cafe: [
          openingMsg,
          'Got it. Would you like anything on the side with that?',
          'No problem. Is that for here or to go?',
          'Perfect. Anything else before I bring the check?',
          'All set. I’ll put that in for you now.',
        ],
        travel: [
          openingMsg,
          'Sure. Which station are you trying to reach?',
          'You’ll need the right direction first. Do you want the fastest route or the easiest one?',
          'There is one transfer. Do you want me to repeat where to change?',
          'That should get you there. Need anything else before you go?',
        ],
        business: [
          openingMsg,
          'That makes sense. Can you give me one concrete example?',
          'I see the point, but the timeline may be tight. How would you adjust it?',
          'Before we decide, can you soften that into a clear next step?',
          'Good. Let’s agree on the next action.',
        ],
        social: [
          openingMsg,
          'Nice. What brought you here tonight?',
          'That’s interesting. Do you know anyone else here?',
          'I might join the others in a minute. Want to come with me?',
          'Great talking to you. Let’s keep in touch.',
        ],
        survival: [
          openingMsg,
          'Okay, tell me exactly what you need help with.',
          'I understand. Where is the problem happening right now?',
          'I can help, but I need one more detail before we move.',
          'Good. Follow this next step and you’ll be okay.',
        ],
        story: [
          openingMsg,
          'I hear you. What do you think happened first?',
          'That changes things. What do you want to do now?',
          'Before we decide, can you say that more calmly?',
          'Okay, that gives us a way forward.',
        ],
      },
      es: {
        cafe: [openingMsg, 'Entiendo. ¿Quieres algo más con eso?', 'Claro. ¿Es para tomar aquí o para llevar?', 'Perfecto. ¿Algo más antes de la cuenta?', 'Muy bien, ahora preparo el pedido.'],
        travel: [openingMsg, 'Claro. ¿A qué estación quieres llegar?', 'Primero necesitas la dirección correcta. ¿Quieres la ruta rápida o la fácil?', 'Hay un transbordo. ¿Quieres que repita dónde cambiar?', 'Listo. Con eso llegas bien.'],
        business: [openingMsg, 'Entiendo. ¿Puedes darme un ejemplo concreto?', 'Veo el punto, pero el plazo está ajustado. ¿Cómo lo cambiarías?', 'Antes de decidir, dilo como próximo paso claro.', 'Bien. Acordemos la siguiente acción.'],
        social: [openingMsg, 'Qué bien. ¿Qué te trae por aquí?', 'Interesante. ¿Conoces a alguien más aquí?', 'Voy con el grupo en un momento. ¿Quieres venir?', 'Me gustó hablar contigo. Seguimos en contacto.'],
        survival: [openingMsg, 'Vale, dime exactamente qué necesitas.', 'Entiendo. ¿Dónde está pasando el problema ahora?', 'Puedo ayudar, pero necesito un detalle más.', 'Bien. Sigue este paso y estarás bien.'],
        story: [openingMsg, 'Te entiendo. ¿Qué crees que pasó primero?', 'Eso cambia la situación. ¿Qué quieres hacer ahora?', 'Antes de decidir, dilo con más calma.', 'Bien, eso nos da una salida.'],
      },
    };
    const localStageLines = localNpcByLang[scenario.language]?.[stageKey] ?? localNpcByLang.en[stageKey] ?? localNpcByLang.en.social;
    const fallbackNpcLine = pickByIndex(pack.followUp[lastQuality], idx + playCount);
    const candidateNpcLine = history.length === 0 ? openingMsg : (localStageLines?.[Math.min(idx, (localStageLines.length ?? 1) - 1)] ?? fallbackNpcLine);
    const priorNpcLines = history.map(t => t.npcMessage);
    const npcLine = priorNpcLines.some(line => similarSceneLine(line, candidateNpcLine)) ? fallbackNpcLine : candidateNpcLine;

    const dialogOptions: DialogOption[] = [
      {
        text: good,
        quality: 'good',
        feedback: usefulPhrase ? `Bu cevap sahnenin doğal kalıbına yakın: "${usefulPhrase}".` : 'Doğal, nazik ve sahne hedefini ilerletiyor.',
        why: currentBeat ? `Dramatic beat’e uyuyor: ${currentBeat}` : 'Sosyal tonu koruyup konuşmayı ileri taşır.',
      },
      {
        text: ok,
        quality: 'ok',
        feedback: 'Anlaşılıyor ama biraz kısa; NPC ek açıklama isteyebilir.',
        why: 'İletişimi koparmaz fakat sosyal tonu güçlendirmez.',
      },
      {
        text: awkward,
        quality: 'awkward',
        feedback: 'Bu cevap fazla direkt veya kırık duyulur.',
        why: 'Sahne içinde karşı tarafı durdurabilir ya da açıklama istemesine yol açabilir.',
      },
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
      sceneState: {
        tension: lastQuality === 'awkward' ? 'high' : lastQuality === 'ok' ? 'medium' : 'low',
        progress: history.length <= 1 ? 'opening' : history.length >= 4 ? 'resolution' : 'complication',
        nextBeat: currentBeat ?? scenario.baseSituation ?? scenario.mission,
      },
    };
  };

  const normalizeAiTurn = (payload: AiTurnPayload | null, openingMsg: string): GameTurn | null => {
    if (!payload) return null;
    const rawOptions = payload.options ?? payload.choices ?? [];
    const options = rawOptions
      .filter((option): option is DialogOption => {
        const quality = option?.quality;
        return !!option?.text && (quality === 'good' || quality === 'ok' || quality === 'awkward');
      })
      .slice(0, 3);

    if (options.length < 3) return null;
    const npcLine = payload.npc_message ?? payload.npcLine ?? openingMsg;
    const optionTexts = options.map(o => normalizeSceneLine(o.text));
    if (new Set(optionTexts).size < 3) return null;
    if (options.some((option, idx) => optionTexts.slice(0, idx).some(prev => similarSceneLine(prev, option.text)))) return null;

    return {
      npc_message: npcLine,
      npc_mood: payload.npc_mood ?? (payload.sceneState?.tension === 'high' ? 'impatient' : 'neutral'),
      options,
      reactions: payload.reactions ?? {
        good: options.find(o => o.quality === 'good')?.feedback ?? 'That lands naturally.',
        ok: options.find(o => o.quality === 'ok')?.feedback ?? 'Clear enough, but a bit flat.',
        awkward: options.find(o => o.quality === 'awkward')?.feedback ?? 'That feels off in this scene.',
      },
      scene_complete: payload.scene_complete,
      sceneState: payload.sceneState,
    };
  };

  const applyTurnToUi = (turn: GameTurn, history: TurnRecord[], openingMsg: string) => {
    stopThinkingCountdown();
    clearAnswerTimer();
    setOptionsLoading(false);
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
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 80);
  };

  const requestTurn = async (history: TurnRecord[], openingMsg: string): Promise<GameTurn | null> => {
    const p = await getProfile();
    const lastSession = await getLastSceneSession();
    const nativeLang = p?.nativeLanguage?.name ?? 'Turkish';
    const langName = p?.language?.name ?? 'Spanish';
    const identityGoal = p?.identity?.goal ?? p?.goalDescription ?? '';
    const isFirst = history.length === 0;
    const currentBeat =
      scenario.dramaticBeats?.[Math.min(history.length, Math.max((scenario.dramaticBeats?.length ?? 1) - 1, 0))]
      ?? scenario.baseSituation
      ?? scenario.mission
      ?? 'Keep the conversation moving naturally.';
    const memoryIsRelevant =
      !!lastSession
      && (lastSession.scenarioId === scenario.id || lastSession.stageType === stageKey || lastSession.language === p?.language?.code);
    const memoryContext = memoryIsRelevant
      ? [
        `Last session weakness: ${lastSession.awkwardMoment ?? lastSession.betterAlternative ?? 'none recorded'}`,
        `Last session best line: ${lastSession.bestLine ?? 'none recorded'}`,
        `Next focus: ${lastSession.nextFocus ?? 'keep the scene flow natural'}`,
      ].join('\n')
      : 'No relevant prior scene memory.';
    const usefulPhrases = scenario.usefulPhrases?.slice(0, 4)
      .map(p => `- "${p.phrase}" (${p.context})`)
      .join('\n') || 'No fixed phrase list. Generate natural scene-specific lines.';
    const likelyMisunderstandings = scenario.likelyMisunderstandings?.slice(0, 3).map(item => `- ${item}`).join('\n') || 'None recorded.';
    const vocabFocus = scenario.vocabularyFocus ?? scenario.vocabHints?.slice(0, 4).map(v => v.word).join(', ') ?? 'scene vocabulary';

    const historyText = history
      .map((t, i) => `Turn ${i + 1}: NPC: "${t.npcMessage}" → User: "${t.selectedText}" (${t.quality})`)
      .join('\n');
    const priorNpcLines = history.map((t, i) => `NPC line ${i + 1}: "${t.npcMessage}"`).join('\n') || 'none yet';
    const priorUserReplies = history.map((t, i) => `User reply ${i + 1}: "${t.selectedText}"`).join('\n') || 'none yet';

    const reactionFmt = `"reactions":{"good":"(warm NPC reply in ${langName}, 1 sentence)","ok":"(brief/neutral reply in ${langName}, 1 sentence)","awkward":"(confused/impatient reply in ${langName}, 1 sentence)"}`;
    const choiceSchema = `"choices":[{"text":"...","quality":"good","feedback":"why this is natural","why":"social reason"},{"text":"...","quality":"ok","feedback":"what is missing","why":"social reason"},{"text":"...","quality":"awkward","feedback":"why this creates friction","why":"social reason"}]`;

    const okSlowHint = history.length > 0 && history[history.length - 1].quality === 'ok'
      ? `\nThe user's last response was "ok" quality (understood but blunt/minimal). NPC should ask a short clarifying follow-up instead of progressing — show that "ok" choices create friction and slow the scene down.`
      : '';

    const difficultyHint = consecutiveBad >= 2
      ? '\nUser is struggling. Make the "good" option distinctly more natural so it stands out.'
      : consecutiveBad === 1
      ? '\nUser made an error. Keep options realistic but make the natural option somewhat clearer.'
      : consecutiveGood >= 3
      ? '\nUser is on a clean-reply streak. Options can be slightly more nuanced and subtle.'
      : '';

    const goalInject = goalCtx
      ? `\nLearning focus — ${goalCtx.label}: ${goalCtx.toneInstruction}\n${goalCtx.difficultyNote}`
      : '';

    const flowPath = computeFlowPath(history);
    const branchNote = flowPath === 'friction'
      ? '\nArc: TENSION PATH — NPC is colder/more guarded; lines shorter; progress toward goal should feel earned.'
      : '\nArc: SMOOTH PATH — NPC is cooperative; natural forward momentum.';

    const replayNote = playCount >= 2
      ? '\nReplay challenge: user has rehearsed this scene multiple times — vary beats and vocabulary; make "good" less telegraphed; avoid repeating prior NPC lines.'
      : playCount >= 1
      ? '\nReplay: change specific wording vs a first play; slightly subtler differences between options.'
      : '';

    const npcContext = scenario.systemPrompt
      ? `NPC context: ${scenario.systemPrompt.split('\n')[0]}\n`
      : '';

    const requiredBeat = stageBeatFor(stageKey, history.length);
    const sharedContext = `SCENE CONTEXT
- User identity goal: "${identityGoal || 'not provided'}"
- Target language: ${langName} (${p?.language?.code ?? scenario.language})
- User native language: ${nativeLang}
- Current scenario: "${scenario.title}" at ${scenario.location}
- Scene mission: ${scenario.mission ?? 'Complete the interaction naturally'}
- Dramatic beat now: ${currentBeat}
- Required scene progress now: ${requiredBeat}
- NPC persona: ${persona.name} (${persona.roleLabel}); ${PERSONALITY_LABEL[personality]}
- Difficulty: scenario=${scenario.difficulty}; replayCount=${playCount}; personality=${personality}
- Last session memory:
${memoryContext}
- Grammar focus: ${scenario.grammarFocus ?? 'choose register and polite forms that fit the scene'}
- Vocabulary focus: ${vocabFocus}
- Useful phrases to inspire, NOT copy-paste blindly:
${usefulPhrases}
- Likely misunderstandings:
${likelyMisunderstandings}

Generate choices as scene-relevant replies, not grammar quiz answers. The three choices should answer the NPC's current question and move the current beat forward.
Do not paste vocabHint words into unnatural templates. Use vocabulary only if it fits the sentence naturally.

ANTI-LOOP RULES:
- Every NPC line must move the scene to a new concrete beat. Do not ask generic "anything else?" unless the current beat is closing/payment.
- Do not repeat prior NPC lines, prior user replies, or the same intent in new wording.
- The NPC line must reference or logically react to the user's last reply, then add one new concrete detail/question.
- Choices must answer the current NPC line directly. They must not be random useful phrases.
- Choices must not reuse earlier reply topics. If the user already ordered coffee, the next choices must be about side item, milk, to-go, payment, refill, etc. depending on the beat.
- The good/ok/awkward options may share the same immediate intent, but the content must be new for this turn and tied to the new NPC question.
- If the mission is already satisfied after 3+ user turns, set scene_complete true instead of extending the conversation.`;

    const prompt = isFirst
      ? `Turn-based language roleplay game.
${sharedContext}
Character instruction: ${personalityPrompt(personality)}
${npcContext}${goalInject}
${branchNote}${replayNote}

NPC opening line: "${openingMsg}"

Generate 3 response choices (in ${langName}) — same intent, 3 different social registers:
"good" = polite and natural, "ok" = minimal but understood, "awkward" = wrong grammar or socially odd.
NPC personality affects how reactions differ between qualities.
1 sentence max each.${difficultyHint}

IMPORTANT: Do NOT include action narrations like *wipes the glass*, *smiles*, *leans forward* etc. NPC must speak only in dialogue. No asterisk actions, no stage directions, no narration.

Return ONLY valid JSON:
{"npcLine":"${openingMsg}",${choiceSchema},"sceneState":{"tension":"low","progress":"opening","nextBeat":"..."},"npc_mood":"neutral",${reactionFmt},"scene_complete":false}`
      : `Turn-based language roleplay.
${sharedContext}
Character instruction: ${personalityPrompt(personality)}
${npcContext}${goalInject}
${branchNote}${replayNote}

History:\n${historyText}
Prior NPC lines to avoid:\n${priorNpcLines}
Prior user replies to avoid copying:\n${priorUserReplies}

Write NPC's next line (react naturally based on personality + last user choice).
The NPC must progress this exact next beat: ${requiredBeat}
Generate 3 response choices that answer this new NPC line. They should test register and clarity, but the topic/content must be new compared with prior user replies.
Choices must feel like real choices a person might make, not a grammar test.
scene_complete:true after turn ${history.length} if the mission is naturally achieved (min 3 turns). Do not stretch the scene beyond 5 user turns unless there is unresolved friction.${okSlowHint}${difficultyHint}

IMPORTANT: Do NOT include action narrations like *wipes the glass*, *smiles*, *leans forward* etc. NPC must speak only in dialogue. No asterisk actions, no stage directions, no narration.

Return ONLY valid JSON:
{"npcLine":"...","choices":[{"text":"...","quality":"good","feedback":"...","why":"..."},{"text":"...","quality":"ok","feedback":"...","why":"..."},{"text":"...","quality":"awkward","feedback":"...","why":"..."}],"sceneState":{"tension":"low|medium|high","progress":"opening|complication|resolution","nextBeat":"..."},"npc_mood":"neutral",${reactionFmt},"scene_complete":false}`;

    const res = await sendMessage(
      [{ id: `t${history.length}`, role: 'user', content: prompt, timestamp: new Date() }],
      '',
      { maxTokens: 520 },
    );

    const normalized = normalizeAiTurn(parseModelJson<AiTurnPayload>(res, 'object'), openingMsg);
    if (!normalized) return null;
    const repeatedNpcLine = history.some(turn => similarSceneLine(turn.npcMessage, normalized.npc_message));
    const repeatedChoiceIntent = normalized.options.some(option =>
      history.some(turn => similarSceneLine(turn.selectedText, option.text)),
    );
    if (repeatedNpcLine || repeatedChoiceIntent) return null;
    return normalized;
  };

  const translateNpcLine = async (text: string): Promise<string> => {
    const clean = text.replace(/^["“]|["”]$/g, '').trim();
    if (!clean) return t('scenario.translationUnavailable');
    const profile = await getProfile();
    const nativeLanguage = profile?.nativeLanguage?.name ?? 'Turkish';
    const cacheKey = `${profile?.nativeLanguage?.code ?? 'tr'}:${clean}`;
    if (translationCacheRef.current[cacheKey]) return translationCacheRef.current[cacheKey];

    try {
      const translated = await sendMessage(
        [{
          id: `translate-${Date.now()}`,
          role: 'user',
          content: `Translate this line into ${nativeLanguage}. Return only the translation, no quotes, no explanation:\n${clean}`,
          timestamp: new Date(),
        }],
        'You are a precise in-app translator for a language learning scene. Preserve the meaning and tone. Return only the translated sentence.',
        { maxTokens: 80 },
      );
      const compact = translated.trim().replace(/^["“]|["”]$/g, '');
      translationCacheRef.current[cacheKey] = compact || t('scenario.translationUnavailable');
      return translationCacheRef.current[cacheKey];
    } catch {
      return t('scenario.translationUnavailable');
    }
  };

  const flipNpcCard = async (text: string) => {
    const nextSide = npcCardSide === 'front' ? 'translation' : 'front';
    if (nextSide === 'translation' && !npcTranslation) {
      setTranslationLoading(true);
      void translateNpcLine(text).then(translated => {
        setNpcTranslation(translated);
        setTranslationLoading(false);
      });
    }

    Animated.timing(npcCardFlip, {
      toValue: 0.5,
      duration: 135,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setNpcCardSide(nextSide);
      Animated.timing(npcCardFlip, {
        toValue: nextSide === 'translation' ? 1 : 0,
        duration: 165,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
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

    setOptionsLoading(true);
    setOptions(null);
    setCurrentReactions(null);
    setNpcReaction(null);
    setReactionVisible(false);
    setHintIdx(null);
    resetNpcCardFace();

    if (cached?.options?.length) {
      if (minDelayMs > 0) await wait(minDelayMs);
      applyTurnToUi(cached, history, openingMsg);
      return;
    }

    // ── Static dialogue path (default) ──────────────────────────────────────
    const staticPool = getSessionTurns(stageKey, scenario.language, playCount);
    if (staticPool) {
      const staticTurn = staticPool[history.length] ?? staticPool[staticPool.length - 1];
      const gameTurn: GameTurn = {
        npc_message: staticTurn.npc_message,
        npc_mood: staticTurn.npc_mood,
        options: staticTurn.options.map(o => ({
          text: o.text,
          quality: o.quality,
          feedback: o.feedback,
          why: o.correction,
        })),
        reactions: {
          good: staticTurn.options.find(o => o.quality === 'good')?.feedback ?? '',
          ok: staticTurn.options.find(o => o.quality === 'ok')?.feedback ?? '',
          awkward: staticTurn.options.find(o => o.quality === 'awkward')?.feedback ?? '',
        },
        scene_complete: staticTurn.scene_complete ?? history.length >= 4,
        sceneState: {
          tension: 'low',
          progress: history.length <= 1 ? 'opening' : history.length >= 4 ? 'resolution' : 'complication',
          nextBeat: staticTurn.npc_message,
        },
      };
      if (minDelayMs > 0) await wait(minDelayMs);
      turnCacheRef.current[key] = gameTurn;
      applyTurnToUi(gameTurn, history, openingMsg);
      return;
    }
    // ── AI fallback (no static pool for this stageType/language) ────────────

    const localTurn = buildLocalTurn(history, openingMsg);
    if (minDelayMs > 0) await wait(minDelayMs);

    const parsed = await withTimeout(requestTurn(history, openingMsg), AI_TURN_TIMEOUT_MS).catch(() => null);
    const turn = parsed?.options?.length ? parsed : localTurn;
    turnCacheRef.current[key] = turn;
    applyTurnToUi(turn, history, openingMsg);

    const activeNpcMessage = history.length === 0 ? openingMsg : (turn.npc_message || localTurn.npc_message || npcMessage);
    void prefetchNextTurns(history, openingMsg, turn, activeNpcMessage);
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
    resetNpcCardFace();
    setVoiceStep('idle');
    setIsRecording(false);
    if (countdownInterval.current) { clearInterval(countdownInterval.current); countdownInterval.current = null; }
    if (recordingTimer.current) { clearTimeout(recordingTimer.current); recordingTimer.current = null; }
    setVoiceAttempts([]);
    setCurrentVoiceAttempt(null);
    setVoiceMessage('');
    setVoiceTargetText('');
    setVoiceCaptureMode(null);
    voiceCaptureModeRef.current = null;
    setVoiceInputMode('hybrid');
    setLastVoiceTranscript('');
    setSceneComplete(false);
    setConsecutiveGood(0);
    setConsecutiveBad(0);
    setHintIdx(null);
    setPhase('game');
    loadTurn(history, msg);
  };

  const handleSelect = (idx: number, meta?: { timedOut?: boolean; inputMode?: 'written' | 'voice'; transcript?: string }, providedOptions?: DialogOption[]) => {
    const activeOptions = providedOptions ?? options;
    if (selectedIdxRef.current !== null || optionsLoading || !activeOptions) return;
    const picked = activeOptions[idx];
    if (!picked) return;
    clearAnswerTimer();
    setSelectedIdx(idx);
    setVoiceTargetText(picked.text);
    if (meta?.inputMode !== 'voice') setCurrentVoiceAttempt(null);
    setVoiceMessage('');
    setLastVoiceTranscript(meta?.transcript ?? '');
    if (meta?.inputMode === 'voice') {
      setVoiceStep('review');
      setVoiceMessage('Sesli cevabın sahneye işlendi.');
    } else {
      getVoiceRepeatLimitState()
        .then(limit => {
          if (limit.canUseVoiceRepeat) {
            setVoiceStep('ready');
          } else {
            setVoiceStep('locked');
            setVoiceMessage(t('scenario.voiceLocked'));
          }
        })
        .catch(() => setVoiceStep('ready'));
    }
    if (picked.quality === 'good') {
      const tier = getComboTier(consecutiveGood + 1);
      if (tier) setRewardText(tier.hype);
    }
    setReactionVisible(false);
    feedbackEntrance.setValue(0);
    Animated.timing(feedbackEntrance, {
      toValue: 1,
      duration: 560,
      easing: GAME_EASE_OUT,
      useNativeDriver: true,
    }).start();
    // Micro delay before NPC reaction appears
    const reaction = currentReactions?.[picked.quality] ?? picked.feedback ?? null;
    reactionTimer.current = setTimeout(() => {
      setNpcReaction(reaction);
      setReactionVisible(true);
      animateNpcReplyEntrance();
      setNpcMood(computeMood(turnHistory, picked.quality, consecutiveGood));
    }, REACTION_DELAY_MS);
  };

  const handleTimeoutFallback = () => {
    const activeOptions = optionsRef.current;
    if (selectedIdxRef.current !== null || !activeOptions?.length) return;
    const survival = getSurvivalResponse(scenario.language, turnHistory.length);
    const nextOptions = [...activeOptions, survival];
    const survivalIndex = nextOptions.length - 1;
    optionsRef.current = nextOptions;
    setOptions(nextOptions);
    timedOutTurnsRef.current += 1;
    void trackEvent('scene_answer_timeout', {
      scenarioId: scenario.id,
      personality,
      fallback: 'survival_response',
    });
    handleSelect(survivalIndex, { timedOut: true }, nextOptions);
    setTimeout(() => {
      void handleNextRef.current?.();
    }, REACTION_DELAY_MS + 1300);
  };

  const handleNext = async () => {
    if (selectedIdx === null || !options) return;

    await animateOptionsOut();

    const chosen = options[selectedIdx];
    const goodOption = options.find(o => o.quality === 'good')?.text ?? chosen.text;
    const reaction = currentReactions?.[chosen.quality] ?? '';

    const newHistory: TurnRecord[] = [
      ...turnHistory,
      {
        npcMessage,
        selectedText: lastVoiceTranscript || chosen.text,
        quality: chosen.quality,
        goodOption,
        npcReaction: reaction,
        inputMode: lastVoiceTranscript ? 'voice' : 'written',
        transcript: lastVoiceTranscript || undefined,
      },
    ];
    setTurnHistory(newHistory);
    setSelectedIdx(null);
    setNpcReaction(null);
    setReactionVisible(false);
    setVoiceStep('idle');
    setCurrentVoiceAttempt(null);
    setVoiceMessage('');
    setVoiceTargetText('');
    setVoiceCaptureMode(null);
    setLastVoiceTranscript('');
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
            : `Aynı sakin ritmi bir sonraki provada bir tur daha koru.`;
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
      voiceAttempts,
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
      voiceAttempts,
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
      handleTimeoutFallback();
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
    timerGlowLoopRef.current?.stop();
    timerGlow.setValue(1);
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

    return () => {
      timerGlowLoopRef.current?.stop();
      timerGlowLoopRef.current = null;
    };
  }, [phase, answerTimeLeft, selectedIdx, timerGlow]);

  useEffect(() => {
    if (phase !== 'done') return;
    setDoneDetailsOpen(false);
    void getSceneSnapshot(scenario.id).then(setDonePrevSnap);
  }, [phase, scenario.id]);

  // Scene meta dot pulse loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(metaDotPulse, { toValue: 0.5, duration: 1250, useNativeDriver: true }),
        Animated.timing(metaDotPulse, { toValue: 1, duration: 1250, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [metaDotPulse]);

  // Scene entrance animation on game start
  useEffect(() => {
    if (phase !== 'game') return;
    sceneEntrance.setValue(0);
    Animated.timing(sceneEntrance, {
      toValue: 1,
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();
  }, [phase, sceneEntrance]);

  // Mic ripple animation while recording
  useEffect(() => {
    if (!isRecording) {
      micRipple1.setValue(0);
      micRipple2.setValue(0);
      return;
    }
    const ripple = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 2500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
    const r1 = ripple(micRipple1, 0);
    const r2 = ripple(micRipple2, 1250);
    r1.start();
    r2.start();
    return () => { r1.stop(); r2.stop(); };
  }, [isRecording, micRipple1, micRipple2]);

  // Waveform animation while recording
  useEffect(() => {
    if (!isRecording) {
      waveAnims.forEach(a => a.setValue(0.3));
      return;
    }
    const loops = waveAnims.map((anim, i) => {
      const heights = [0.4, 0.7, 1.0, 0.6, 0.85, 0.5, 0.75, 0.45, 0.9, 0.55, 0.7, 0.35];
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(i * 80),
          Animated.timing(anim, { toValue: heights[i], duration: 400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      );
      loop.start();
      return loop;
    });
    return () => loops.forEach(l => l.stop());
  }, [isRecording, waveAnims]);

  const replayNpcLine = () => {
    const text = reactionVisible && npcReaction ? npcReaction : npcMessage;
    void speakNpcLine(text, scenario.language);
  };

  const beginVoiceRecording = async (mode: 'scene' | 'repeat', seconds: number) => {
    const allowed = await requestMicrophonePermission();
    if (!allowed) {
      setVoiceStep(mode === 'scene' ? 'idle' : 'skipped');
      setVoiceMessage(t('scenario.voicePermissionDenied'));
      setVoiceCaptureMode(null);
      voiceCaptureModeRef.current = null;
      return;
    }
    try {
      const started = await startVoiceRecording();
      recordingUriRef.current = started.uri;
      setVoiceCaptureMode(mode);
      voiceCaptureModeRef.current = mode;
      setIsRecording(true);
      setVoiceStep('recording');
      setVoiceMessage('');
      setRecordingSecsLeft(seconds);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      const startedAt = Date.now();
      countdownInterval.current = setInterval(() => {
        const elapsed = (Date.now() - startedAt) / 1000;
        setRecordingSecsLeft(Math.max(0, +(seconds - elapsed).toFixed(1)));
      }, 100);
      if (recordingTimer.current) clearTimeout(recordingTimer.current);
      recordingTimer.current = setTimeout(() => {
        void stopRecording();
      }, seconds * 1000);
    } catch {
      setIsRecording(false);
      setVoiceCaptureMode(null);
      voiceCaptureModeRef.current = null;
      setVoiceStep(mode === 'scene' ? 'idle' : 'skipped');
      setVoiceMessage(t('scenario.voiceUnavailable'));
    }
  };

  const skipVoiceStep = () => {
    if (isRecording) return;
    setVoiceStep('skipped');
    setVoiceMessage(t('scenario.voiceSkipped'));
  };

  const startRecording = async () => {
    if (selectedIdx === null || !voiceTargetText || voiceStep === 'locked') return;
    await beginVoiceRecording('repeat', VOICE_REPEAT_SECONDS);
  };

  const startSceneVoiceReply = async () => {
    if (selectedIdx !== null || optionsLoading || !options?.length || isRecording) return;
    clearAnswerTimer();
    setVoiceInputMode('hybrid');
    setCurrentVoiceAttempt(null);
    setLastVoiceTranscript('');
    setVoiceTargetText('');
    await beginVoiceRecording('scene', VOICE_REPLY_SECONDS);
  };

  const handleSceneVoiceTranscript = async (transcript: string) => {
    const spoken = transcript.trim();
    if (!spoken || !optionsRef.current?.length) {
      setVoiceStep('idle');
      setVoiceCaptureMode(null);
      voiceCaptureModeRef.current = null;
      setVoiceMessage('Ses net alınamadı. İstersen tekrar konuş veya yazılı cevabı seç.');
      return;
    }

    const activeOptions = optionsRef.current;
    const scored = activeOptions
      .map((option, index) => ({ index, option, score: scoreVoiceMatch(spoken, option.text) }))
      .sort((a, b) => b.score - a.score);
    const best = scored[0];
    const quality: OptionQuality = best?.score >= 0.68
      ? best.option.quality
      : best?.score >= 0.36
        ? 'ok'
        : 'awkward';
    const voiceOption: DialogOption = {
      text: spoken,
      quality,
      feedback: quality === 'awkward'
        ? 'Cevabın duyuldu ama sahne için biraz daha net bir cümle gerekebilir.'
        : 'Sesli cevabın sahneye işlendi.',
      why: 'voice-transcript',
    };
    const nextOptions = [...activeOptions, voiceOption];
    const voiceIndex = nextOptions.length - 1;
    optionsRef.current = nextOptions;
    setOptions(nextOptions);
    setVoiceTargetText(spoken);
    setLastVoiceTranscript(spoken);
    setVoiceMessage('Sesli cevabın sahneye işlendi.');
    const evaluation = await evaluateVoiceAttempt(best?.option.text ?? spoken, spoken, scenario.language);
    const attempt = createVoiceAttempt({
      targetText: best?.option.text ?? spoken,
      transcript: spoken,
      evaluation: { ...evaluation, meaningClear: quality !== 'awkward' || evaluation.meaningClear },
      scenarioId: scenario.id,
      language: scenario.language,
    });
    setVoiceAttempts(prev => [...prev, attempt]);
    setCurrentVoiceAttempt(attempt);
    handleSelect(voiceIndex, { inputMode: 'voice', transcript: spoken }, nextOptions);
  };

  const stopRecording = async () => {
    if (recordingTimer.current) clearTimeout(recordingTimer.current);
    if (countdownInterval.current) { clearInterval(countdownInterval.current); countdownInterval.current = null; }
    const mode = voiceCaptureModeRef.current;
    setIsRecording(false);
    setVoiceStep('processing');
    try {
      const stopped = await stopVoiceRecording();
      const uri = stopped.uri ?? recordingUriRef.current ?? '';
      const transcription = uri ? await transcribeVoice(uri, scenario.language) : { transcript: '', confidence: undefined };
      if (mode === 'scene') {
        await handleSceneVoiceTranscript(transcription.transcript);
        setVoiceCaptureMode(null);
        voiceCaptureModeRef.current = null;
        return;
      }
      if (!voiceTargetText) {
        setVoiceStep('skipped');
        setVoiceCaptureMode(null);
        voiceCaptureModeRef.current = null;
        return;
      }
      const evaluation = await evaluateVoiceAttempt(voiceTargetText, transcription.transcript, scenario.language);
      const attempt = createVoiceAttempt({
        targetText: voiceTargetText,
        transcript: transcription.transcript,
        evaluation: { ...evaluation, confidence: transcription.confidence ?? evaluation.confidence },
        scenarioId: scenario.id,
        language: scenario.language,
      });
      await recordVoiceRepeatUse();
      setVoiceAttempts(prev => [...prev, attempt]);
      setCurrentVoiceAttempt(attempt);
      setVoiceMessage(attempt.feedback ?? '');
      setVoiceStep('review');
    } catch {
      await cleanupVoiceRecording(recordingUriRef.current);
      if (mode === 'scene') {
        setVoiceStep('idle');
        setVoiceMessage(t('scenario.voiceUnavailable'));
        setVoiceCaptureMode(null);
        voiceCaptureModeRef.current = null;
        return;
      }
      const evaluation = await evaluateVoiceAttempt(voiceTargetText, '', scenario.language);
      const attempt = createVoiceAttempt({
        targetText: voiceTargetText,
        transcript: '',
        evaluation,
        scenarioId: scenario.id,
        language: scenario.language,
      });
      setVoiceAttempts(prev => [...prev, attempt]);
      setCurrentVoiceAttempt(attempt);
      setVoiceMessage(attempt.feedback ?? t('scenario.voiceUnavailable'));
      setVoiceStep('review');
    } finally {
      if (mode !== 'scene') {
        setVoiceCaptureMode(null);
        voiceCaptureModeRef.current = null;
      }
    }
  };

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
          <Text style={styles.headerLocation}>{scenario.location}</Text>
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
    const introBg = scenario.backgroundImage
      ? { uri: scenario.backgroundImage }
      : (SCENE_PHOTOS[stageKey] ?? DEFAULT_SCENE_PHOTO);
    return (
      <View style={styles.container}>
        <ImageBackground source={introBg} style={styles.introBgPhoto} resizeMode="cover">
          <LinearGradient
            colors={['rgba(10,14,20,0.25)', 'rgba(10,14,20,0.65)', colors.bgDeep]}
            locations={[0, 0.50, 0.88]}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>

        <TouchableOpacity onPress={onBack} style={styles.introBackBtn}>
          <Feather name="arrow-left" size={18} color={colors.inkSecondary} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.introScroll} showsVerticalScrollIndicator={false}>
          <View style={{ height: PHOTO_HEIGHT * 0.40 }} />

          <Text style={styles.introBadge}>{scenario.location.toUpperCase()}</Text>
          <Text style={styles.introTitle}>{scenario.title}</Text>
          <Text style={styles.introSub}>{persona.name} sana yaklaşır:</Text>

          <BlurView intensity={22} tint="dark" style={styles.quoteBox}>
            <Text style={styles.quoteText}>"{scenario.openingMessage.split('\n')[0]}"</Text>
          </BlurView>

          <View style={styles.missionRow}>
            <Feather name="target" size={13} color={colors.accentWarm} />
            <Text style={styles.missionText}>{scenario.mission ?? 'Konuşmayı tamamla'}</Text>
          </View>

          {!!challengeTarget && (
            <View style={styles.challengeIntroCard}>
              <Text style={styles.challengeIntroLabel}>ARKADAŞ PROVASI</Text>
              <Text style={styles.challengeIntroTitle}>{challengeTarget.challengerName} aynı sahneyi prova etti</Text>
              <Text style={styles.challengeIntroSub}>
                {challengeTarget.challengerTitle} · doğal akış {challengeTarget.challengerCombo} · %{Math.round(challengeTarget.challengerAccuracy * 100)}
              </Text>
              <Text style={styles.challengeIntroTaunt}>{challengeTarget.taunt}</Text>
            </View>
          )}

          <View style={styles.howItWorksBox}>
            <Text style={styles.howTitle}>NASIL ÇALIŞIR</Text>
            {['NPC sana bir şey söyler', '3 yanıt arasından en doğal tonu seç', 'Garip cevaplar akışı zorlar, temizler sahneyi taşır', 'Sonunda hangi anı gerçek hayata hazır gördüğünü öğrenirsin'].map((item, i) => (
              <View key={i} style={styles.howItemRow}>
                <Text style={styles.howItemNum}>{i + 1}</Text>
                <Text style={styles.howItem}>{item}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.preStartBtn} onPress={() => startGame()}>
            <Text style={styles.preStartBtnText}>Sahneye Gir</Text>
            <Feather name="arrow-right" size={15} color={colors.bgDeep} />
          </TouchableOpacity>
          <View style={{ height: 36 }} />
        </ScrollView>
      </View>
    );
  }

  // VOCAB
  if (phase === 'vocab' && scenario.vocabHints) {
    const vocabBg = scenario.backgroundImage
      ? { uri: scenario.backgroundImage }
      : (SCENE_PHOTOS[stageKey] ?? DEFAULT_SCENE_PHOTO);
    return (
      <View style={styles.container}>
        <ImageBackground source={vocabBg} style={styles.introBgPhoto} resizeMode="cover">
          <LinearGradient
            colors={['rgba(10,14,20,0.25)', 'rgba(10,14,20,0.65)', colors.bgDeep]}
            locations={[0, 0.50, 0.88]}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>

        <TouchableOpacity onPress={onBack} style={styles.introBackBtn}>
          <Feather name="arrow-left" size={18} color={colors.inkSecondary} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.introScroll} showsVerticalScrollIndicator={false}>
          <View style={{ height: PHOTO_HEIGHT * 0.35 }} />
          <Text style={styles.introBadge}>SAHNEYE HAZIRLIK</Text>
          <Text style={styles.introTitle}>Söylemeden önce ısın</Text>
          <Text style={styles.introSub}>Bu kelimeler sahnedeki cevabını daha net seçtirir.</Text>
          <View style={styles.vocabGrid}>
            {scenario.vocabHints.map((hint, i) => (
              <BlurView key={i} intensity={20} tint="dark" style={styles.vocabCard}>
                <Text style={styles.vocabWord}>{hint.word}</Text>
                <Text style={styles.vocabMeaning}>{hint.meaning}</Text>
              </BlurView>
            ))}
          </View>
          <TouchableOpacity style={styles.preStartBtn} onPress={() => startGame()}>
            <Text style={styles.preStartBtnText}>Sahneye Gir</Text>
            <Feather name="arrow-right" size={15} color={colors.bgDeep} />
          </TouchableOpacity>
          <View style={{ height: 36 }} />
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
    const dominantTitle = failNearMiss ? 'ONE REPLY AWAY' : 'THE SCENE LOST FLOW';
    const dominantSub = failNearMiss
      ? 'Bir daha dene: o anı daha temiz bir cevapla açabilirsin.'
      : 'Son seçimler sahnenin akışını bozdu. Aynı anı yeniden prova et.';

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
      ? 'Bu prova kaydı — olur.'
      : personality === 'busy'
      ? 'Karşı taraf uzaklaştı — daha net cevapla geri alabilirsin.'
      : 'Tansiyon yükseldi — sahneyi daha yumuşak kurabilirsin.';
    const lossSub = personality === 'friendly'
      ? 'Bu yüzden prova var: garip cevabı yakala, bir sonraki turda düzelt.'
      : personality === 'busy'
      ? 'Baskıyı hissettin. Bir sonraki denemede bir beat erken cevap ver.'
      : 'Sert çizgiye yaklaştın. Bir sonraki denemede net kal, sıcaklığı kaybetme.';

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
      goodCount === total ? 'Baştan sona temiz bir sahne akışı kurdun.' :
      hadNearMiss ? 'Sahne ortasında zorlandın, sonra akışı geri topladın.' :
      okCount >= Math.ceil(total * 0.5) ? 'Anlaşıldın; şimdi ritmi biraz daha doğal hale getirme zamanı.' :
      goalMet ? 'Sahne tamamlandı; bu anı gerçek hayata taşıyabilirsin.' :
      'Sahneyi zorlanarak da olsa tamamladın; bir sonraki odak daha sakin cevap.';

    const bestPhrase = turnHistory.find(t => t.quality === 'good')?.selectedText ?? null;

    let claimCta = 'Provayı kaydet →';
    if (almostPerfectRun) {
      claimCta = awkwardCount >= 2
        ? `${awkwardCount} cevabı yumuşatıp provayı kaydet →`
        : 'Tek cevabı yumuşatıp provayı kaydet →';
    } else if (timeoutCount >= 2) {
      claimCta = `${timeoutCount} zaman baskısı notuyla provayı kaydet →`;
    } else if (timeoutCount === 1) {
      claimCta = 'Zaman odağıyla provayı kaydet →';
    }

    return (
      <View style={styles.container}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.doneScroll}>
          {almostPerfectRun ? (
            <View style={styles.doneMotivationHero}>
              <Text style={styles.doneMotivationEyebrow}>SAHNE TAMAMLANDI</Text>
              <Text style={styles.doneMotivationTitle}>Bir cevabı daha yumuşatırsan bu an gerçek hayata hazır</Text>
              <Text style={styles.doneMotivationBody}>
                {awkwardCount >= 2
                  ? `${awkwardCount} cevabı tekrar kurmaya değer. Kaydet, sonra bu anları yeniden prova et.`
                  : 'Tek cevap daha temiz kurulabilir. Kaydet, an tazeyken tekrar prova et.'}
              </Text>
            </View>
          ) : (
            <Animated.View style={{ transform: [{ scale: doneHeroScale }], alignItems: 'center', width: '100%' }}>
              <Text style={styles.bigTitle}>{goalMet ? 'Sahne tamamlandı' : 'Akışı bırakmadın'}</Text>
              <Text style={styles.doneVictoryHint}>
                {goalMet ? 'En güçlü cevapların sahneyi ileri taşıdı.' : 'Bir daha temiz cevap bu anın hissini değiştirir.'}
              </Text>
            </Animated.View>
          )}
          {!almostPerfectRun && <Text style={styles.outcomeText}>{outcomeText}</Text>}
          {almostPerfectRun && (
            <TouchableOpacity style={styles.doneDetailsToggle} onPress={() => setDoneDetailsOpen(o => !o)} activeOpacity={0.85}>
              <Text style={styles.doneDetailsToggleText}>
                {doneDetailsOpen ? 'Tur özetini gizle ↑' : 'Tur özetini göster ↓'}
              </Text>
            </TouchableOpacity>
          )}

          {showFullDetails && (
            <>
              {!almostPerfectRun && goodCount < total && accRatio >= 0.55 && (
                <View style={styles.almostPerfectBanner}>
                  <Text style={styles.almostPerfectTitle}>Gerçek hayata çok yakın</Text>
                  <Text style={styles.almostPerfectBody}>
                    Bir daha temiz cümle bu provayı gerçek hayata hazır hissettirir.
                  </Text>
                </View>
              )}
              {donePrevSnap && (
                <View style={styles.journeyCard}>
                  <Text style={styles.journeyLabel}>BİR SONRAKİ PROVA</Text>
                  {donePrevSnap.failed ? (
                    <Text style={styles.journeyText}>
                      Geçen sefer sahne erken koptu. Bu kez akışı taşıdın; tazeyken bir kez daha prova et.
                    </Text>
                  ) : (
                    <Text style={styles.journeyText}>
                      Önceki prova: doğal akış {donePrevSnap.comboMax} · %{Math.round(donePrevSnap.accuracy * 100)}
                      {donePrevSnap.flowPath === 'friction' ? ' — akışın nerede kırılganlaştığını biliyorsun.' : ' — bu anı daha temiz kurmak için tekrar et.'}
                    </Text>
                  )}
                </View>
              )}
              {hadNearMiss && !hadNativeFlow && !almostPerfectRun && (
                <View style={styles.nearMissBadge}>
                  <Text style={styles.nearMissText}>Akış bozuldu, sonra sahneyi toparladın</Text>
                </View>
              )}
              {hadNativeFlow && (
                <View style={styles.nativeFlowBadge}>
                  <Text style={styles.nativeFlowText}>Temiz sahne akışı yakaladın</Text>
                </View>
              )}

              <View style={[styles.goalRow, { borderColor: goalMet ? colors.successDs : colors.accentWarm }]}>
                <Text style={styles.goalRowIcon}>{goalMet ? '✓' : '•'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.goalRowStatus, { color: goalMet ? colors.successDs : colors.accentWarm }]}>
                    {goalMet ? 'Sahne tamamlandı' : 'Sahne odağı devam ediyor'}
                  </Text>
                  <Text style={styles.goalRowText} numberOfLines={2}>
                    {scenario.mission ?? 'Konuşmayı tamamla'}
                  </Text>
                </View>
              </View>

              <View style={styles.doneStats}>
                <View style={styles.doneStat}>
                  <Text style={[styles.doneStatVal, { color: colors.successDs }]}>{goodCount}/{total}</Text>
                  <Text style={styles.doneStatLbl}>Doğal seçim</Text>
                </View>
                <View style={styles.doneStat}>
                  <Text style={[styles.doneStatVal, { color: colors.accentWarm }]}>{comboPeakRef.current}</Text>
                  <Text style={styles.doneStatLbl}>Doğal akış</Text>
                </View>
                <View style={styles.doneStat}>
                  <Text style={[styles.doneStatVal, { color: colors.errorDs }]}>{awkwardCount}</Text>
                  <Text style={styles.doneStatLbl}>Garip</Text>
                </View>
              </View>

              <View style={styles.donePathRow}>
                <Text style={styles.donePathLabel}>Dallanma</Text>
                <Text style={styles.donePathVal}>
                  {computeFlowPath(turnHistory) === 'smooth' ? 'Temiz akış' : 'Gergin / pürüzlü'}
                </Text>
              </View>
              {timeoutCount > 0 && (
                <Text style={styles.timeoutNote}>
                  {timeoutCount} turda süre doldu — gerçek anda daha erken cevap vermeyi prova et.
                </Text>
              )}

              {bestPhrase && (
                <View style={styles.bestPhraseBox}>
                  <Text style={styles.bestPhraseLabel}>SAHNEDE İŞE YARAYAN İFADE</Text>
                  <Text style={styles.bestPhraseText}>"{bestPhrase}"</Text>
                </View>
              )}

              <Text style={styles.replayTitle}>SORULAR KRONOLOJIK SIRADA</Text>
              {turnHistory.map((t, i) => (
                <View key={i} style={styles.replayItem}>
                  <View style={styles.replayHeader}>
                    <View style={[styles.replayQuestionBadge, { borderColor: qColor(t.quality) }]}>
                      <Text style={[styles.replayQuestionBadgeText, { color: qColor(t.quality) }]}>
                        {i + 1}. soru
                      </Text>
                    </View>
                    <Text style={styles.replayNpc} numberOfLines={1}>{t.npcMessage}</Text>
                  </View>
                  <Text style={[styles.replayChosen, { color: qColor(t.quality) }]}>
                    {qLabel(t.quality)}  "{t.selectedText}"
                  </Text>
                  {t.quality !== 'good' && t.goodOption !== t.selectedText && (
                    <Text style={styles.replayBetter}>Daha doğal: "{t.goodOption}"</Text>
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
              ? 'Sonraki ekran, bu sahneyi neden tekrar prova edeceğini gösterecek.'
              : 'Sonraki ekran, hangi cevabı gerçek hayata taşımaya hazır olduğunu gösterecek.'}
          </Text>
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    );
  }

  // GAME (main) — editorial scene design
  const turnNum = turnHistory.length + 1;
  const canFinishEarly = turnHistory.length >= 2 && selectedIdx === null && !optionsLoading;
  const isLastTurn = turnHistory.length + 1 >= MAX_TURNS;
  const comboTier = getComboTier(consecutiveGood);
  const livePath = computeFlowPath(turnHistory);

  const scenePhoto = scenario.backgroundImage
    ? { uri: scenario.backgroundImage }
    : (SCENE_PHOTOS[stageKey] ?? DEFAULT_SCENE_PHOTO);
  const npcRoleTr = STAGE_ROLE_TR[stageKey] ?? '';
  const turnLabel = `${String(turnNum).padStart(2, '0')} / ${String(MAX_TURNS).padStart(2, '0')}`;
  const sceneCaptionText = scenario.mission ?? scenario.title;
  const visibleNpcLine = reactionVisible && npcReaction ? npcReaction : npcMessage;
  const npcCardRotation = npcCardFlip.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '0deg'],
  });

  // Ripple ring scale/opacity for mic button
  const ripple1Scale = micRipple1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const ripple1Opacity = micRipple1.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.6, 0] });
  const ripple2Scale = micRipple2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const ripple2Opacity = micRipple2.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.6, 0] });

  return (
    <View style={gStyles.root}>
      {/* ── Photo backdrop ─────────────────────────────────────── */}
      <ImageBackground
        source={scenePhoto}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: PHOTO_HEIGHT }}
        resizeMode="cover"
      >
        {/* Photo tint — birebir mockup değerleri */}
        <LinearGradient
          colors={[
            'rgba(10,14,20,0.32)',
            'rgba(10,14,20,0.12)',
            'rgba(10,14,20,0.58)',
            'rgba(10,14,20,0.95)',
          ]}
          locations={[0, 0.30, 0.80, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      {/* Lower dark fade — mockup: top: 50% (ekranın ortası) */}
      <LinearGradient
        colors={['transparent', colors.bgDeep, colors.bgDeep]}
        locations={[0, 0.30, 1]}
        style={gStyles.lowerFade}
        pointerEvents="none"
      />


      {/* ── Combo reward toast (floating) ──────────────────────── */}
      {!!rewardText && (
        <Animated.View pointerEvents="none" style={[gStyles.rewardToast, { opacity: rewardOpacity }]}>
          <BlurView intensity={24} tint="dark" style={gStyles.rewardToastInner}>
            <Text style={[gStyles.rewardToastText, comboTier ? { color: comboTier.color } : undefined]}>
              {rewardText}
            </Text>
          </BlurView>
        </Animated.View>
      )}

      {/* ── Screen content ─────────────────────────────────────── */}
      <Animated.View
        style={[
          gStyles.screenContent,
          {
            opacity: sceneEntrance,
            transform: [{ translateY: sceneEntrance.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          },
        ]}
      >
        {/* Top bar */}
        <View style={gStyles.topBar}>
          {/* Scene meta pill */}
          <BlurView intensity={20} tint="dark" style={gStyles.sceneMeta}>
            <Animated.View style={[gStyles.sceneMetaDot, { opacity: metaDotPulse }]} />
            <Text style={gStyles.sceneMetaText} numberOfLines={1}>
              <Text style={gStyles.sceneMetaLocation}>{scenario.location}</Text>
            </Text>
          </BlurView>

          {/* Top actions */}
          <View style={gStyles.topActions}>
            {/* Turn counter */}
            <BlurView intensity={20} tint="dark" style={gStyles.iconBtn}>
              <Feather name="clock" size={16} color={colors.inkSecondary} />
            </BlurView>
            {/* Exit */}
            <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
              <BlurView intensity={20} tint="dark" style={gStyles.iconBtn}>
                <Feather name="x" size={16} color={colors.inkSecondary} />
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scene caption — frosted panel below photo area */}
        <Animated.View
          style={[
            gStyles.sceneCaption,
            {
              opacity: sceneEntrance,
              transform: [{ translateY: sceneEntrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
            },
          ]}
        >
          <BlurView intensity={28} tint="dark" style={gStyles.sceneCaptionBlur}>
            <Text style={gStyles.sceneCaptionEyebrow}>SAHNE {String(turnNum).padStart(2, '0')}</Text>
            <Text style={gStyles.sceneCaptionText}>{sceneCaptionText}</Text>
          </BlurView>
        </Animated.View>

        {/* Timer — kept outside the scroll so it is visible as soon as the scene loads */}
        {answerTimeLeft !== null && answerTimeTotal > 0 && selectedIdx === null && !!options && (
          <Animated.View style={[gStyles.timerWrap, { opacity: timerGlow }]}>
            <View style={gStyles.timerLabelRow}>
              <Text style={gStyles.timerLabel}>KALAN SÜRE</Text>
              <Text style={[gStyles.timerValue, answerTimeLeft <= 5 && gStyles.timerValueHot]}>{answerTimeLeft}s</Text>
            </View>
            <View style={gStyles.timerTrack}>
              <Animated.View
                style={[
                  gStyles.timerFill,
                  {
                    width: timerProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    backgroundColor: answerTimeLeft <= 3 ? colors.errorDs : colors.accentWarmSoft,
                  },
                ]}
              />
            </View>
          </Animated.View>
        )}

        {/* Scrollable dialogue section */}
        <ScrollView
          ref={scrollRef}
          style={gStyles.dialogueScroll}
          contentContainerStyle={gStyles.dialogueScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Subtle turn history (dimmed) */}
          {turnHistory.length > 0 && (
            <View style={gStyles.historyWrap}>
              {turnHistory.slice(-2).map((t, i) => (
                <View key={i} style={gStyles.historyRow}>
                  <View style={[gStyles.historyDot, { backgroundColor: qColor(t.quality) + '99' }]} />
                  <Text style={gStyles.historyText} numberOfLines={1}>{t.selectedText}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Combo / flow indicator (subtle) */}
          {(comboTier || livePath === 'friction') && (
            <Animated.View
              style={[
                gStyles.flowBadge,
                {
                  transform: [{ scale: flowPulse }],
                  borderColor: livePath === 'smooth' && comboTier
                    ? comboTier.color + '66'
                    : livePath === 'friction'
                    ? colors.errorDs + '88'
                    : colors.hairlineStrong,
                },
              ]}
            >
              {comboTier ? (
                <Text style={[gStyles.flowBadgeText, { color: comboTier.color }]}>
                  {comboTier.emoji} {comboTier.hype}
                </Text>
              ) : (
                <Text style={[gStyles.flowBadgeText, { color: colors.errorDs }]}>
                  Sahne akışı sarsıldı — toparla
                </Text>
              )}
            </Animated.View>
          )}

          {/* ── NPC card ─────────────────────────────────────────── */}
          <Animated.View
            style={[
              gStyles.npcLine,
              isRecording && { opacity: 0.52 },
              {
                opacity: npcEntrance,
                transform: [
                  { perspective: 900 },
                  { translateX: npcEntrance.interpolate({ inputRange: [0, 1], outputRange: [64, 0] }) },
                  { rotateY: npcCardRotation },
                ],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => { void flipNpcCard(visibleNpcLine); }}
            >
              {/* Top shimmer line */}
              <LinearGradient
                colors={['transparent', colors.accentWarm + '4D', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={gStyles.npcTopLine}
              />
              {/* NPC meta row */}
              <View style={gStyles.npcMeta}>
                <View style={gStyles.npcAvatar}>
                  <Text style={gStyles.npcAvatarText}>{persona.name[0]}</Text>
                </View>
                <Text style={gStyles.npcName}>
                  {npcCardSide === 'translation' ? t('scenario.translationBack') : persona.name}
                  {npcCardSide === 'front' && npcRoleTr ? <Text style={gStyles.npcRole}> · {npcRoleTr}</Text> : null}
                </Text>
                {npcMood !== 'neutral' && npcCardSide === 'front' && (
                  <Text style={gStyles.npcMoodEmoji}>{MOOD_EMOJI[npcMood]}</Text>
                )}
                <TouchableOpacity style={gStyles.speakerBtn} onPress={replayNpcLine} activeOpacity={0.72}>
                  <Feather name={npcCardSide === 'translation' ? 'rotate-ccw' : 'volume-2'} size={13} color={colors.accentWarm} />
                </TouchableOpacity>
              </View>

              {npcCardSide === 'translation' ? (
                <View style={gStyles.npcTranslationFace}>
                  <Text style={gStyles.npcTranslationLabel}>{t('scenario.translationLabel')}</Text>
                  <Text style={gStyles.npcTranslationText}>
                    {translationLoading ? t('scenario.translationLoading') : (npcTranslation ?? t('scenario.translationUnavailable'))}
                  </Text>
                  <Text style={gStyles.npcTranslationHint}>{t('scenario.translationTapBack')}</Text>
                </View>
              ) : reactionVisible && npcReaction ? (
                <>
                  <Animated.View
                    style={{
                      opacity: npcReplyEntrance,
                      transform: [{ translateY: npcReplyEntrance.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
                    }}
                  >
                    <Text style={gStyles.npcText}>"{npcReaction}"</Text>
                  </Animated.View>
                  <Text style={gStyles.npcPrevText}>{npcMessage}</Text>
                  <Text style={gStyles.npcTranslationHint}>{t('scenario.translationTap')}</Text>
                </>
              ) : (
                <>
                  <Text style={gStyles.npcText}>"{npcMessage}"</Text>
                  <Text style={gStyles.npcTranslationHint}>{t('scenario.translationTap')}</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* ── User prompt card ─────────────────────────────────── */}
          <Animated.View
            style={[
              gStyles.userPrompt,
              {
                opacity: optionsOpacity,
                transform: [{ translateY: optionsEntrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              },
            ]}
          >
            <BlurView intensity={22} tint="dark" style={gStyles.userPromptBlur}>
              {/* Prompt meta row */}
              <View style={gStyles.promptMeta}>
                <Text style={gStyles.promptLabel}>
                  {selectedIdx !== null ? 'CEVABINI VERDİN' : 'SENIN SIRAN'}
                </Text>
                {selectedIdx === null && !isRecording && !!scenario.mission && (
                  <Text style={gStyles.promptHint} numberOfLines={2}>
                    {voiceInputMode === 'written' ? 'Yazılı seçeneklerden birini seçebilirsin.' : scenario.mission}
                  </Text>
                )}
              </View>

              {/* Recording / voice processing state */}
              {isRecording || (voiceCaptureMode === 'scene' && voiceStep === 'processing') ? (
                <View style={gStyles.recordingWrap}>
                  {/* Waveform */}
                  <View style={gStyles.waveform}>
                    {waveAnims.map((anim, i) => (
                      <Animated.View
                        key={i}
                        style={[
                          gStyles.waveBar,
                          { transform: [{ scaleY: anim }] },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={gStyles.recordingHint}>{voiceStep === 'processing' ? 'CEVABIN İŞLENİYOR' : t('scenario.listening')}</Text>
                  <Text style={gStyles.recordingCountdown}>
                    {voiceStep === 'processing' ? 'Söylediğin cümle sahneye çevriliyor' : `${recordingSecsLeft.toFixed(1)}s`}
                  </Text>
                  {voiceStep === 'processing' ? (
                    <View style={gStyles.voiceProcessingIndicator}>
                      <Animated.View style={gStyles.voiceProcessingDot} />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={gStyles.stopBtn}
                      onPress={stopRecording}
                      activeOpacity={0.8}
                    >
                      <View style={gStyles.stopBtnInner} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : selectedIdx !== null ? (
                /* Selected state — show result */
                <Animated.View
                  style={[
                    gStyles.selectedWrap,
                    {
                      opacity: feedbackEntrance,
                      transform: [{ translateY: feedbackEntrance.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
                    },
                  ]}
                >
                  {(() => {
                    const opt = options?.[selectedIdx];
                    if (!opt) return null;
                    const c = qColor(opt.quality);
                    return (
                      <>
                        <Text style={[gStyles.selectedText, { color: c }]}>
                          "{opt.text}"
                        </Text>
                        <View>
                          <Text style={[gStyles.qualityTag, { color: c }]}>{qLabel(opt.quality)}</Text>
                        </View>
                        {voiceStep !== 'idle' && (
                          <View style={gStyles.voiceRepeatBox}>
                            <Text style={gStyles.voiceRepeatEyebrow}>{t('scenario.voiceEyebrow')}</Text>
                            <Text style={gStyles.voiceRepeatTitle}>{t('scenario.voicePrompt')}</Text>
                            {voiceStep === 'processing' ? (
                              <Text style={gStyles.voiceRepeatSub}>Ses işleniyor…</Text>
                            ) : voiceStep === 'recording' ? (
                              <Text style={gStyles.voiceRepeatSub}>{t('scenario.voiceRecording')}</Text>
                            ) : currentVoiceAttempt ? (
                              <Text style={gStyles.voiceRepeatSub}>
                                {currentVoiceAttempt.transcript
                                  ? currentVoiceAttempt.feedback
                                  : 'Ses kaydedildi · Telaffuz değerlendirmesi bu cihazda yapılamadı.'}
                              </Text>
                            ) : voiceMessage ? (
                              <Text style={gStyles.voiceRepeatSub}>{voiceMessage}</Text>
                            ) : (
                              <Text style={gStyles.voiceRepeatSub}>{t('scenario.voiceReady')}</Text>
                            )}
                            {voiceStep === 'ready' ? (
                              <Text style={gStyles.voicePrivacy}>{t('scenario.voicePrivacy')}</Text>
                            ) : null}
                            {currentVoiceAttempt?.transcript ? (
                              <Text style={gStyles.voiceTranscript} numberOfLines={2}>
                                "{currentVoiceAttempt.transcript}"
                              </Text>
                            ) : null}
                            <View style={gStyles.voiceActions}>
                              {voiceStep === 'ready' || voiceStep === 'skipped' || voiceStep === 'locked' ? (
                                <TouchableOpacity
                                  style={[gStyles.voicePrimary, voiceStep === 'locked' && gStyles.voicePrimaryDisabled]}
                                  onPress={startRecording}
                                  disabled={voiceStep === 'locked'}
                                  activeOpacity={0.82}
                                >
                                  <Feather name="mic" size={13} color={colors.bgDeep} />
                                  <Text style={gStyles.voicePrimaryText}>{t('scenario.voiceStart')}</Text>
                                </TouchableOpacity>
                              ) : voiceStep === 'recording' ? (
                                <TouchableOpacity style={gStyles.voicePrimary} onPress={stopRecording} activeOpacity={0.82}>
                                  <Feather name="square" size={12} color={colors.bgDeep} />
                                  <Text style={gStyles.voicePrimaryText}>{t('scenario.voiceStop')}</Text>
                                </TouchableOpacity>
                              ) : voiceStep === 'processing' ? (
                                <View style={gStyles.voiceProcessingIndicator}>
                                  <Animated.View style={gStyles.voiceProcessingDot} />
                                </View>
                              ) : null}
                              {voiceStep !== 'processing' && (
                                <TouchableOpacity style={gStyles.voiceSecondary} onPress={skipVoiceStep} activeOpacity={0.72}>
                                  <Text style={gStyles.voiceSecondaryText}>{t('scenario.voiceSkip')}</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </Animated.View>
              ) : (
                /* Idle — options list */
                <>
                  {/* Cue text */}
                  {optionsLoading ? (
                    <Text style={gStyles.loadingCue}>
                      {t('scenario.thinking', { name: persona.name })}
                    </Text>
                  ) : (
                    <View style={gStyles.optionsList}>
                      {(options ?? []).map((opt, idx) => {
                        const isHinted = hintIdx === idx;
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[gStyles.option, isHinted && gStyles.optionHinted]}
                            onPress={() => handleSelect(idx)}
                            activeOpacity={0.68}
                          >
                            <Text style={gStyles.optionText}>{opt.text}</Text>
                            {isHinted && <View style={gStyles.optionHintDot} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Mic row */}
                  {!optionsLoading && (
                    <View style={gStyles.micRow}>
                      {/* Mic button with ripple */}
                      <View style={gStyles.micButtonWrap}>
                        {/* Ripple rings */}
                        <Animated.View
                          style={[
                            gStyles.micRippleRing,
                            { transform: [{ scale: ripple1Scale }], opacity: ripple1Opacity },
                          ]}
                        />
                        <Animated.View
                          style={[
                            gStyles.micRippleRing,
                            { transform: [{ scale: ripple2Scale }], opacity: ripple2Opacity },
                          ]}
                        />
                        <TouchableOpacity
                          style={gStyles.micButton}
                          onPress={() => { void startSceneVoiceReply(); }}
                          activeOpacity={0.85}
                        >
                          <Feather name="mic" size={22} color={colors.bgDeep} />
                        </TouchableOpacity>
                      </View>
                      <View style={gStyles.micInstruction}>
                        <Text style={gStyles.micInstructionMain}>{t('scenario.speak')}</Text>
                        <Text style={gStyles.micInstructionSub}>
                          {voiceMessage || t('scenario.chooseAbove')}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </BlurView>
          </Animated.View>
        </ScrollView>

        {/* ── Bottom actions ─────────────────────────────────────── */}
        <View style={gStyles.bottomActions}>
          {/* Row 1: CTA pill — sadece seçim yapıldıysa veya erken bitirilebiliyorsa */}
          {selectedIdx !== null ? (
            <AnimatedPressable
              style={gStyles.ctaBtn}
              onPress={() => { void handleNext(); }}
              pressScale={0.97}
            >
              <Text style={gStyles.ctaBtnText}>
                {sceneComplete || isLastTurn ? t('scenario.finish') : t('scenario.nextTurn')}
              </Text>
            </AnimatedPressable>
          ) : canFinishEarly ? (
            <TouchableOpacity
              style={gStyles.ctaBtnSecondary}
              onPress={() => setPhase('done')}
              activeOpacity={0.7}
            >
              <Text style={gStyles.ctaBtnSecondaryText}>{t('scenario.finish')}</Text>
            </TouchableOpacity>
          ) : null}

          {/* Row 2: Ghost links — mockup Variant A sol/sağ, Variant B kayıt sırasında */}
          <View style={gStyles.bottomLinks}>
            <TouchableOpacity
              style={[gStyles.bottomLink, isRecording && { opacity: 0 }]}
              onPress={replayNpcLine}
              activeOpacity={0.6}
            >
              <View style={gStyles.bottomLinkInner}>
                <Feather name="rotate-ccw" size={12} color={colors.inkTertiary} />
                <Text style={gStyles.bottomLinkText}>{t('scenario.replay')}</Text>
              </View>
            </TouchableOpacity>

            {isRecording ? (
              <TouchableOpacity
                style={gStyles.bottomLink}
                activeOpacity={0.6}
                onPress={() => { void stopRecording(); }}
              >
                <Text style={gStyles.bottomLinkText}>{t('scenario.release')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={gStyles.bottomLink}
                activeOpacity={0.6}
                onPress={() => {
                  setVoiceInputMode('written');
                  setVoiceMessage('Yazılı seçenekler açık. İstersen cevabını buradan seç.');
                  if (voiceCaptureMode === 'scene') {
                    setVoiceCaptureMode(null);
                    voiceCaptureModeRef.current = null;
                  }
                }}
              >
                <View style={gStyles.bottomLinkInner}>
                  <Text style={gStyles.bottomLinkText}>{t('scenario.write')}</Text>
                  <Feather name="edit-2" size={12} color={colors.inkTertiary} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },

  header: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.bgDeep, borderBottomWidth: 1, borderBottomColor: colors.hairline, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgMid, borderWidth: 1, borderColor: colors.hairlineStrong, alignItems: 'center', justifyContent: 'center' },
  backText: { fontFamily: 'InterTight_400Regular', fontSize: 18, color: colors.inkSecondary },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerEmoji: { fontSize: 22 },
  headerTitle: { fontFamily: 'InterTight_500Medium', fontSize: 14, color: colors.inkPrimary },
  headerLocation: { fontFamily: 'InterTight_400Regular', fontSize: 11, color: colors.inkTertiary, marginTop: 1 },
  turnBadge: { backgroundColor: colors.bgMid, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.hairlineStrong },
  turnText: { fontFamily: 'InterTight_600SemiBold', color: colors.accentWarmSoft, fontSize: 11 },

  centerWrap: { flex: 1, paddingHorizontal: 24, paddingTop: 40, alignItems: 'center', justifyContent: 'center', gap: 12 },
  bigEmoji: { fontSize: 48, marginBottom: 4 },
  bigTitle: { fontFamily: 'Fraunces_300Light', fontSize: 24, letterSpacing: -0.5, color: colors.inkPrimary, textAlign: 'center' },
  bigMeta: { fontFamily: 'InterTight_400Regular', fontSize: 13, color: colors.inkSecondary, marginBottom: 8 },

  primaryBtn: { backgroundColor: colors.inkPrimary, borderRadius: 999, paddingVertical: 17, paddingHorizontal: 24, alignItems: 'center', width: '100%' },
  primaryBtnText: { fontFamily: 'InterTight_600SemiBold', color: colors.bgDeep, fontSize: 15, letterSpacing: -0.15 },
  ghostBtn: { paddingVertical: 14, alignItems: 'center', width: '100%' },
  ghostBtnText: { fontFamily: 'InterTight_400Regular', color: colors.inkTertiary, fontSize: 14 },
  earlyExitBtn: { backgroundColor: colors.bgMid, borderRadius: 999, paddingVertical: 14, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: colors.hairlineStrong },
  earlyExitText: { fontFamily: 'InterTight_400Regular', color: colors.inkSecondary, fontSize: 14 },

  introBgPhoto: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  introBackBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(10,14,20,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introScroll: { paddingHorizontal: 24, paddingBottom: 48, gap: 16 },
  introBadge: { fontFamily: 'InterTight_500Medium', color: colors.accentWarm, fontSize: 10, letterSpacing: 2.6, textTransform: 'uppercase' },
  introTitle: { fontFamily: 'Fraunces_300Light', color: colors.inkPrimary, fontSize: 30, lineHeight: 37, letterSpacing: -0.6 },
  introSub: { fontFamily: 'InterTight_400Regular', color: colors.inkSecondary, fontSize: 14 },
  quoteBox: {
    borderRadius: 16,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  quoteText: { fontFamily: 'Fraunces_300Light_Italic', color: colors.inkPrimary, fontSize: 17, lineHeight: 27 },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  missionText: { fontFamily: 'InterTight_400Regular', color: colors.accentWarmSoft, fontSize: 13, lineHeight: 20, flex: 1 },
  howItWorksBox: { backgroundColor: `${colors.bgMid}CC`, borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.hairline },
  howTitle: { fontFamily: 'InterTight_500Medium', color: colors.accentWarm, fontSize: 10, letterSpacing: 2.6, textTransform: 'uppercase', marginBottom: 2 },
  howItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  howItemNum: { fontFamily: 'InterTight_600SemiBold', color: colors.accentWarmSoft, fontSize: 12, width: 16, lineHeight: 20 },
  howItem: { fontFamily: 'InterTight_400Regular', color: colors.inkSecondary, fontSize: 13, lineHeight: 20, flex: 1 },
  vocabTitle: { fontFamily: 'Fraunces_300Light', fontSize: 24, letterSpacing: -0.5, color: colors.inkPrimary },
  vocabSubtitle: { fontFamily: 'InterTight_400Regular', fontSize: 14, color: colors.inkSecondary },
  vocabGrid: { gap: 8 },
  vocabCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  vocabWord: { fontFamily: 'InterTight_500Medium', fontSize: 15, color: colors.inkPrimary },
  vocabMeaning: { fontFamily: 'InterTight_400Regular', fontSize: 13, color: colors.accentWarmSoft },
  preStartBtn: {
    backgroundColor: colors.inkPrimary,
    borderRadius: 999,
    paddingVertical: 17,
    paddingHorizontal: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  preStartBtnText: { fontFamily: 'InterTight_600SemiBold', color: colors.bgDeep, fontSize: 15, letterSpacing: -0.15 },
  challengeIntroCard: {
    width: '100%',
    backgroundColor: colors.bgMid,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    gap: 4,
  },
  challengeIntroLabel: { fontFamily: 'InterTight_500Medium', color: colors.accentWarm, fontSize: 10, letterSpacing: 2.6, textTransform: 'uppercase' },
  challengeIntroTitle: { fontFamily: 'Fraunces_300Light', color: colors.inkPrimary, fontSize: 18, letterSpacing: -0.3 },
  challengeIntroSub: { fontFamily: 'InterTight_400Regular', color: colors.inkSecondary, fontSize: 12 },
  challengeIntroTaunt: { fontFamily: 'Fraunces_300Light_Italic', color: colors.accentWarm, fontSize: 13, marginTop: 4 },

  // Lost
  failReactionBox: { width: '100%', backgroundColor: colors.bgMid, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.hairlineStrong },
  failReactionName: { fontFamily: 'InterTight_500Medium', fontSize: 10, color: colors.errorDs, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  failReactionText: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 16, color: colors.inkPrimary, lineHeight: 24 },
  failTip: { width: '100%', backgroundColor: colors.bgMid, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.hairline },
  failTipText: { fontFamily: 'InterTight_400Regular', fontSize: 13, color: colors.inkSecondary, lineHeight: 20 },

  // Game
  gameScroll: { paddingHorizontal: 20, paddingTop: 16 },
  progressSection: { marginBottom: 18, gap: 8 },
  chatHistoryWrap: { marginBottom: 14, gap: 8 },
  chatHistoryTitle: { fontSize: 10, fontFamily: 'InterTight_600SemiBold', color: colors.inkTertiary, letterSpacing: 1.4, paddingHorizontal: 2 },
  chatTurnBlock: { gap: 6 },
  npcBubbleRow: { alignItems: 'flex-start' },
  userBubbleRow: { alignItems: 'flex-end' },
  npcBubble: {
    maxWidth: '88%',
    backgroundColor: colors.bgMid,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: 14,
    borderTopLeftRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userBubble: {
    maxWidth: '88%',
    backgroundColor: 'rgba(40,30,22,0.85)',
    borderWidth: 1,
    borderColor: colors.accentGlow,
    borderRadius: 14,
    borderTopRightRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleName: { fontFamily: 'InterTight_500Medium', fontSize: 10, color: colors.accentWarm, marginBottom: 3, letterSpacing: 1.2 },
  bubbleNameYou: { fontFamily: 'InterTight_500Medium', fontSize: 10, color: colors.accentWarmSoft, marginBottom: 3, letterSpacing: 1.2, textAlign: 'right' },
  npcBubbleText: { fontFamily: 'InterTight_400Regular', fontSize: 14, color: colors.inkPrimary, lineHeight: 20 },
  userBubbleText: { fontFamily: 'InterTight_400Regular', fontSize: 14, color: colors.inkPrimary, lineHeight: 20 },
  dotsRow: { flexDirection: 'row', gap: 7, justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotEmpty: { backgroundColor: colors.hairlineStrong },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, flexWrap: 'wrap', gap: 8 },
  sceneGoalText: { fontFamily: 'InterTight_400Regular', fontSize: 11, color: colors.inkTertiary, flex: 1 },
  comboBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  comboText: { fontFamily: 'InterTight_500Medium', fontSize: 11 },
  warningText: { fontFamily: 'InterTight_400Regular', fontSize: 11, color: colors.accentWarmSoft, textAlign: 'center' },

  npcCard: { flexDirection: 'row', gap: 14, marginBottom: 20, backgroundColor: 'rgba(40,30,22,0.82)', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.accentGlow },
  npcAvatarWrap: { alignItems: 'center', gap: 6 },
  npcAvatarEmoji: { fontSize: 28 },
  moodPill: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  moodPillEmoji: { fontSize: 14 },
  npcContent: { flex: 1, gap: 4 },
  npcNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' },
  npcName: { fontFamily: 'InterTight_500Medium', fontSize: 11, color: colors.accentWarm, letterSpacing: 1.2 },
  personalityTag: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  personalityText: { fontFamily: 'InterTight_500Medium', fontSize: 9 },
  npcMoodLabel: { fontFamily: 'InterTight_400Regular', fontSize: 10 },
  npcText: { fontFamily: 'Fraunces_300Light', fontSize: 18, color: colors.inkPrimary, lineHeight: 26, letterSpacing: -0.2 },
  npcReactionText: { fontFamily: 'Fraunces_300Light', fontSize: 18, color: colors.inkPrimary, lineHeight: 26, letterSpacing: -0.2 },
  npcPrevText: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 12, color: colors.inkTertiary, marginTop: 4 },

  yourTurnLabel: { fontFamily: 'InterTight_500Medium', fontSize: 10, color: colors.inkTertiary, letterSpacing: 2.6, textTransform: 'uppercase', marginBottom: 10 },
  loadingWrap: { minHeight: 1 },

  optionsList: { gap: 10, overflow: 'hidden' },
  option: { backgroundColor: colors.bgMid, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.hairlineStrong },
  optionDim: { opacity: 0.3 },
  optionHint: { borderColor: `${colors.accentWarm}50`, backgroundColor: colors.bgSoft },
  optionHintStrong: { borderColor: `${colors.accentWarm}88`, backgroundColor: colors.bgSoft },
  optionText: { fontFamily: 'InterTight_400Regular', color: colors.inkPrimary, fontSize: 15, lineHeight: 22 },
  optionQualityTag: { fontFamily: 'InterTight_500Medium', fontSize: 12, marginTop: 6 },
  hintDot: { fontFamily: 'InterTight_400Regular', fontSize: 14, color: colors.accentWarmSoft, position: 'absolute', right: 14, top: 14 },

  bottomBar: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12, backgroundColor: colors.bgDeep, borderTopWidth: 1, borderTopColor: colors.hairline },

  // Done
  doneScroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48, alignItems: 'center', gap: 14 },
  goalRow: { width: '100%', flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: colors.bgMid, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.hairlineStrong },
  goalRowIcon: { fontSize: 18, marginTop: 2 },
  goalRowStatus: { fontFamily: 'InterTight_600SemiBold', fontSize: 12, marginBottom: 2 },
  goalRowText: { fontFamily: 'InterTight_400Regular', fontSize: 12, color: colors.inkSecondary, lineHeight: 18 },
  doneStats: { flexDirection: 'row', gap: 10, width: '100%' },
  doneStat: { flex: 1, backgroundColor: colors.bgMid, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.hairlineStrong },
  doneStatVal: { fontFamily: 'Fraunces_300Light', fontSize: 26, letterSpacing: -0.5, color: colors.inkPrimary },
  doneStatLbl: { fontFamily: 'InterTight_400Regular', fontSize: 11, color: colors.inkTertiary, marginTop: 4 },
  bestPhraseBox: { width: '100%', backgroundColor: colors.bgMid, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.hairlineStrong },
  bestPhraseLabel: { fontFamily: 'InterTight_500Medium', fontSize: 10, color: colors.accentWarm, letterSpacing: 2.6, textTransform: 'uppercase', marginBottom: 6 },
  bestPhraseText: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 16, color: colors.inkPrimary, lineHeight: 24 },
  replayTitle: { width: '100%', fontFamily: 'InterTight_500Medium', fontSize: 10, color: colors.inkTertiary, letterSpacing: 2.6, textTransform: 'uppercase', marginBottom: -4 },
  replayItem: { width: '100%', backgroundColor: colors.bgMid, borderRadius: 12, padding: 14, gap: 4, borderWidth: 1, borderColor: colors.hairline },
  replayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replayDot: { width: 7, height: 7, borderRadius: 4 },
  replayQuestionBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  replayQuestionBadgeText: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.2,
  },
  replayNpc: { fontFamily: 'InterTight_400Regular', fontSize: 11, color: colors.inkTertiary, flex: 1 },
  replayChosen: { fontFamily: 'InterTight_500Medium', fontSize: 13, paddingLeft: 15 },
  replayBetter: { fontFamily: 'InterTight_400Regular', fontSize: 12, color: colors.accentWarmSoft, paddingLeft: 15, lineHeight: 18 },
  nativeFlowBadge: { backgroundColor: colors.accentGlow, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: `${colors.accentWarm}44` },
  nativeFlowText: { fontFamily: 'InterTight_500Medium', color: colors.accentWarm, fontSize: 12 },
  outcomeText: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 14, color: colors.inkSecondary, textAlign: 'center', marginTop: -4 },
  nearMissBadge: { backgroundColor: `${colors.accentWarmSoft}18`, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: `${colors.accentWarmSoft}50` },
  nearMissText: { fontFamily: 'InterTight_500Medium', color: colors.accentWarmSoft, fontSize: 12 },
  lostLabel: { backgroundColor: colors.bgMid, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.hairlineStrong },
  lostLabelText: { fontFamily: 'InterTight_500Medium', color: colors.errorDs, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },

  lostGradient: { flex: 1, marginHorizontal: 16, marginBottom: 28, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 32, alignItems: 'center', gap: 12 },
  lostGradientDominant: { paddingTop: 40, paddingBottom: 44, gap: 20, justifyContent: 'center' },
  lostDominantTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 28,
    color: colors.inkPrimary,
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  lostDominantSub: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 15,
    color: colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  lostNpcWhisper: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 14,
    color: colors.inkTertiary,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 4,
    paddingHorizontal: 8,
  },
  primaryBtnLostDominant: { paddingVertical: 18, minHeight: 58, width: '100%', marginTop: 12 },
  primaryBtnTextLostDominant: { fontSize: 15, letterSpacing: -0.15 },
  lostColdLine: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 15, color: colors.inkSecondary, textAlign: 'center', marginBottom: 4 },
  lostBigEmoji: { fontSize: 48 },
  lostLabelOnDark: { backgroundColor: colors.bgSoft, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: colors.hairlineStrong },
  lostLabelTextOnDark: { fontFamily: 'InterTight_500Medium', color: colors.errorDs, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  lostHeroTitle: { fontFamily: 'Fraunces_300Light', fontSize: 24, color: colors.inkPrimary, textAlign: 'center', lineHeight: 30, letterSpacing: -0.5 },
  lostHeroSub: { fontFamily: 'InterTight_400Regular', fontSize: 14, color: colors.inkSecondary, textAlign: 'center', lineHeight: 22 },
  lostDismiss: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 13, color: colors.inkTertiary, textAlign: 'center', lineHeight: 20, marginTop: 4 },
  nearMissCallout: {
    width: '100%',
    backgroundColor: colors.bgMid,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: `${colors.accentWarm}44`,
    marginTop: 8,
  },
  nearMissTitle: { fontFamily: 'Fraunces_300Light', fontSize: 18, color: colors.accentWarm, marginBottom: 6, letterSpacing: -0.3 },
  nearMissBody: { fontFamily: 'InterTight_400Regular', fontSize: 13, color: colors.inkSecondary, lineHeight: 20 },
  flowTailLine: { fontFamily: 'InterTight_400Regular', fontSize: 13, color: colors.errorDs, textAlign: 'center', marginTop: 8 },

  journeyCard: {
    width: '100%',
    backgroundColor: colors.bgSoft,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    marginTop: 8,
  },
  journeyLabel: { fontFamily: 'InterTight_500Medium', fontSize: 10, color: colors.accentWarm, letterSpacing: 2.6, textTransform: 'uppercase', marginBottom: 6 },
  journeyText: { fontFamily: 'InterTight_400Regular', fontSize: 13, color: colors.inkSecondary, lineHeight: 20 },
  almostPerfectBanner: {
    width: '100%',
    backgroundColor: colors.bgMid,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    marginTop: 6,
  },
  almostPerfectTitle: { fontFamily: 'InterTight_500Medium', fontSize: 13, color: colors.accentWarm, marginBottom: 4 },
  almostPerfectBody: { fontFamily: 'InterTight_400Regular', fontSize: 12, color: colors.inkSecondary, lineHeight: 18 },
  failReactionBoxDark: { width: '100%', backgroundColor: colors.bgSoft, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.hairlineStrong },
  failReactionNameDark: { fontFamily: 'InterTight_500Medium', fontSize: 10, color: colors.errorDs, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  failReactionTextDark: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 16, color: colors.inkPrimary, lineHeight: 24 },
  failTipDark: { width: '100%', backgroundColor: colors.bgMid, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.hairline },
  failTipTextDark: { fontFamily: 'InterTight_400Regular', fontSize: 13, color: colors.inkSecondary, lineHeight: 20 },
  primaryBtnLost: { backgroundColor: colors.inkPrimary, borderRadius: 999, paddingVertical: 17, paddingHorizontal: 24, alignItems: 'center', width: '100%', marginTop: 8 },
  primaryBtnTextLost: { fontFamily: 'InterTight_600SemiBold', color: colors.bgDeep, fontSize: 15, letterSpacing: -0.15 },
  ghostBtnLost: { paddingVertical: 14, alignItems: 'center', width: '100%' },
  ghostBtnTextLost: { fontFamily: 'InterTight_400Regular', color: colors.inkTertiary, fontSize: 14 },

  metaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', alignItems: 'center', maxWidth: '52%' },
  pathChip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, backgroundColor: colors.bgMid },
  pathChipText: { fontFamily: 'InterTight_500Medium', fontSize: 10 },
  timerWrap: { marginBottom: 12, gap: 6 },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerLabel: { fontFamily: 'InterTight_400Regular', fontSize: 11, color: colors.inkTertiary, letterSpacing: 0.5 },
  timerCount: { fontFamily: 'InterTight_600SemiBold', fontSize: 13, color: colors.accentWarmSoft },
  timerCountUrgent: { color: colors.errorDs, transform: [{ scale: 1.08 }] },
  timerTrack: { height: 2, borderRadius: 1, backgroundColor: colors.hairlineStrong, overflow: 'hidden' },
  timerFill: { height: 2, borderRadius: 1 },
  timerPulseHint: { fontFamily: 'InterTight_400Regular', fontSize: 11, color: colors.errorDs, textAlign: 'center', marginTop: 6 },

  flowRail: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  flowRailTitle: { fontFamily: 'InterTight_500Medium', fontSize: 15 },
  flowRailSub: { fontFamily: 'InterTight_400Regular', fontSize: 12, marginTop: 4, lineHeight: 18 },

  comboCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    maxWidth: '100%',
  },
  comboEmoji: { fontSize: 24 },
  comboHype: { fontFamily: 'Fraunces_300Light', fontSize: 18, letterSpacing: -0.3 },
  comboSub: { fontFamily: 'InterTight_400Regular', fontSize: 11, color: colors.inkTertiary, marginTop: 2 },

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
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingVertical: 12,
    paddingHorizontal: 22,
    overflow: 'hidden',
  },
  rewardToastText: { fontFamily: 'Fraunces_300Light', fontSize: 18, letterSpacing: -0.3, color: colors.inkPrimary },

  doneVictoryHint: { fontFamily: 'InterTight_400Regular', fontSize: 13, color: colors.inkSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  doneMotivationHero: {
    width: '100%',
    backgroundColor: colors.bgMid,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    marginBottom: 4,
  },
  doneMotivationEyebrow: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 10,
    color: colors.accentWarm,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  doneMotivationTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.inkPrimary,
    lineHeight: 28,
    marginBottom: 12,
  },
  doneMotivationBody: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 14,
    color: colors.inkSecondary,
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
    fontFamily: 'InterTight_500Medium',
    fontSize: 13,
    color: colors.accentWarmSoft,
    textDecorationLine: 'underline',
  },

  donePathRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.bgMid, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.hairlineStrong },
  donePathLabel: { fontFamily: 'InterTight_400Regular', fontSize: 11, color: colors.inkTertiary },
  donePathVal: { fontFamily: 'InterTight_500Medium', fontSize: 13, color: colors.inkPrimary },
  timeoutNote: { fontFamily: 'InterTight_400Regular', fontSize: 12, color: colors.accentWarmSoft, textAlign: 'center' },
  doneHintBelow: { fontFamily: 'InterTight_400Regular', fontSize: 12, color: colors.inkTertiary, textAlign: 'center', marginTop: -4, lineHeight: 18 },
});

// ─── Game Scene Styles (editorial / photo-realist) ─────────────────────────

const gStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },

  // Lower dark fade — top: 50% of screen (mockup: .lower-fade { top: 50% })
  lowerFade: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.50,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Ambient warm bloom at center
  ambientWarm: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.50,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: colors.accentGlow,
    borderRadius: 999,
    alignSelf: 'center',
    width: '100%',
    opacity: 0.8,
  },

  // Screen content — full height, column
  screenContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
  },

  // ── Top bar ──────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  sceneMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    backgroundColor: 'rgba(10,14,20,0.45)',
    maxWidth: '60%',
  },

  sceneMetaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentWarm,
    shadowColor: colors.accentWarm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },

  sceneMetaText: {
    ...typography.body,
    fontSize: 11,
    color: colors.inkSecondary,
    letterSpacing: 0.04,
  },

  sceneMetaLocation: {
    ...typography.bodyMedium,
    color: colors.inkPrimary,
  },

  topActions: {
    flexDirection: 'row',
    gap: 8,
  },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    backgroundColor: 'rgba(10,14,20,0.45)',
  },

  // ── Scene caption ─────────────────────────────────────────────
  sceneCaption: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    maxWidth: '92%',
  },

  sceneCaptionBlur: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    backgroundColor: 'rgba(5,8,12,0.58)',
  },

  sceneCaptionEyebrow: {
    ...typography.eyebrow,
    color: colors.accentWarm,
    marginBottom: 5,
    fontSize: 10,
  },

  sceneCaptionText: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 16,
    lineHeight: 23,
    color: colors.inkPrimary,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.82)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },

  // ── Dialogue scroll ───────────────────────────────────────────
  dialogueScroll: {
    flex: 1,
  },

  dialogueScrollContent: {
    flexGrow: 1,
    gap: 12,
    paddingTop: 8,
    paddingBottom: 80,
  },

  // Dimmed turn history
  historyWrap: {
    gap: 4,
    opacity: 0.45,
    marginBottom: 4,
  },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  historyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  historyText: {
    ...typography.body,
    fontSize: 11,
    color: colors.inkTertiary,
    flex: 1,
  },

  // Flow / combo badge
  flowBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderColor: colors.hairlineStrong,
    backgroundColor: 'rgba(10,14,20,0.4)',
  },

  flowBadgeText: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.inkTertiary,
  },

  // Timer
  timerWrap: {
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(5,8,12,0.46)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },

  timerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timerLabel: {
    ...typography.eyebrow,
    fontSize: 8,
    color: 'rgba(255,255,255,0.74)',
    letterSpacing: 1.8,
  },

  timerValue: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.inkPrimary,
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  timerValueHot: {
    color: colors.errorDs,
  },

  timerTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.22)',
  },

  timerFill: {
    height: '100%',
    borderRadius: 999,
    shadowColor: colors.accentWarmSoft,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 6,
  },

  timerHint: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.errorDs,
    textAlign: 'right',
    marginTop: 2,
  },

  // ── NPC card ──────────────────────────────────────────────────
  npcLine: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.accentGlow,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(40,30,22,0.82)',
  },

  npcTopLine: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
  },

  npcMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },

  npcAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(107,72,48,1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  npcAvatarText: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 11,
    color: colors.accentWarm,
  },

  npcName: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.inkTertiary,
    letterSpacing: 0.8,
    flex: 1,
  },

  npcRole: {
    ...typography.body,
    fontSize: 10,
    color: colors.inkTertiary,
    letterSpacing: 0,
    textTransform: 'none',
  },

  npcMoodEmoji: {
    fontSize: 13,
  },

  npcText: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 18,
    lineHeight: 27,
    color: colors.inkPrimary,
    letterSpacing: -0.3,
  },

  npcPrevText: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 12,
    color: colors.inkTertiary,
    marginTop: 4,
    lineHeight: 18,
  },

  npcTranslationRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },

  npcTranslationFace: {
    gap: 8,
  },

  npcTranslationLabel: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.accentWarm,
    letterSpacing: 1.6,
  },

  npcTranslationText: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 18,
    color: colors.inkPrimary,
    lineHeight: 27,
    letterSpacing: -0.3,
  },

  npcTranslationHint: {
    ...typography.body,
    fontSize: 11,
    color: 'rgba(232,234,237,0.62)',
    fontStyle: 'italic',
    marginTop: 10,
    alignSelf: 'center',
    textAlign: 'center',
  },

  // ── User prompt card ──────────────────────────────────────────
  userPrompt: {
    borderRadius: 18,
    overflow: 'hidden',
  },

  userPromptBlur: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    gap: 12,
    backgroundColor: 'rgba(10,14,20,0.82)',
  },

  promptMeta: {
    gap: 4,
  },

  promptLabel: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.inkTertiary,
    letterSpacing: 2.4,
  },

  promptHint: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 19,
  },

  // Options list
  optionsList: {
    gap: 8,
  },

  option: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  optionHinted: {
    borderColor: colors.accentWarmSoft + '88',
    backgroundColor: 'rgba(232,181,118,0.06)',
  },

  optionText: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 15,
    color: colors.inkPrimary,
    lineHeight: 22,
    flex: 1,
  },

  optionHintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentWarm,
    marginLeft: 8,
  },

  // Loading cue
  loadingCue: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 15,
    color: colors.inkSecondary,
    lineHeight: 22,
    letterSpacing: -0.2,
  },

  // Selected state
  selectedWrap: {
    gap: 8,
  },

  selectedText: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 17,
    lineHeight: 25,
    color: colors.inkPrimary,
    letterSpacing: -0.2,
  },

  qualityTag: {
    ...typography.eyebrow,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.inkTertiary,
  },

  // ── Mic row ───────────────────────────────────────────────────
  micRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 4,
  },

  micButtonWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  micRippleRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.accentWarm,
  },

  micButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.inkPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  micInstruction: {
    flex: 1,
    gap: 2,
  },

  micInstructionMain: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.inkPrimary,
  },

  micInstructionSub: {
    ...typography.body,
    fontSize: 11,
    color: colors.inkTertiary,
  },

  // ── Recording state (Variant B) ───────────────────────────────
  recordingWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },

  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 32,
  },

  waveBar: {
    width: 3,
    height: 32,
    backgroundColor: colors.accentWarm,
    borderRadius: 2,
  },

  recordingHint: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.inkTertiary,
    letterSpacing: 1.6,
  },
  recordingCountdown: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 13,
    color: colors.accentWarm,
    letterSpacing: 0.5,
  },
  voiceProcessingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  voiceProcessingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentWarm,
    opacity: 0.7,
  },

  speakerBtn: {
    marginLeft: 'auto',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232,181,118,0.10)',
    borderWidth: 1,
    borderColor: colors.accentGlow,
  },

  voiceRepeatBox: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(255,255,255,0.035)',
    padding: 12,
    gap: 7,
  },

  voiceRepeatEyebrow: {
    ...typography.eyebrow,
    fontSize: 8.5,
    color: colors.accentWarm,
  },

  voiceRepeatTitle: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.inkPrimary,
  },

  voiceRepeatSub: {
    ...typography.body,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkTertiary,
  },

  voicePrivacy: {
    ...typography.body,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.inkTertiary,
    opacity: 0.78,
  },

  voiceTranscript: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.inkSecondary,
  },

  voiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 2,
  },

  voicePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: colors.inkPrimary,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  voicePrimaryDisabled: {
    opacity: 0.45,
  },

  voicePrimaryText: {
    ...typography.bodyMedium,
    fontSize: 12,
    color: colors.bgDeep,
  },

  voiceSecondary: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },

  voiceSecondaryText: {
    ...typography.bodyMedium,
    fontSize: 12,
    color: colors.inkTertiary,
  },

  stopBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentWarm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentWarm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },

  stopBtnInner: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.bgDeep,
  },

  // ── Bottom actions ─────────────────────────────────────────────
  bottomActions: {
    flexDirection: 'column',
    gap: 8,
    paddingTop: 8,
  },

  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  bottomLink: {
    paddingVertical: 6,
  },

  bottomLinkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  bottomLinkText: {
    ...typography.body,
    fontSize: 12,
    color: colors.inkTertiary,
  },

  ctaBtn: {
    backgroundColor: colors.inkPrimary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaBtnSecondary: {
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },

  ctaBtnSecondaryText: {
    ...typography.button,
    fontSize: 14,
    color: colors.inkSecondary,
  },

  ctaBtnText: {
    ...typography.button,
    fontSize: 14,
    color: colors.bgDeep,
  },

  // ── Reward toast ──────────────────────────────────────────────
  rewardToast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    alignSelf: 'center',
    zIndex: 99,
  },

  rewardToastInner: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    backgroundColor: 'rgba(10,14,20,0.6)',
  },

  rewardToastText: {
    ...typography.eyebrow,
    fontSize: 11,
    color: colors.inkPrimary,
    letterSpacing: 1.4,
  },
});
