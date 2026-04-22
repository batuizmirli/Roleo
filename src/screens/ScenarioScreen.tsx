import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Scenario, StageResult, UserLevel, UserProfile, ModuleResult } from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson, tryParseJson } from '../services/json';
import { getPersonaByStage, getGoalContext } from '../services/personas';
import { trackEvent } from '../services/telemetry';

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
  q === 'good' ? '#3DD68C' : q === 'ok' ? '#F5B800' : '#1B9C5A';
const qLabel = (q: OptionQuality) =>
  q === 'good' ? '✨ Çok doğal' : q === 'ok' ? '👍 Anlaşıldı' : '😅 Biraz garip';

const getCombo = (n: number) =>
  n >= 4 ? { label: '🚀 Native flow', color: '#A78BFA' }
  : n >= 3 ? { label: '⚡ Fluent', color: '#F5B800' }
  : n >= 2 ? { label: '🔥 Warm', color: '#FF6B35' }
  : null;

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
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function ScenarioScreen({
  scenario, onBack, onStageComplete, onRunComplete, firstSessionMode = false, prepBonus = 0, easyStart = false, goalId,
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

  const scrollRef = useRef<ScrollView>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thinkingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const npcEntrance = useRef(new Animated.Value(1)).current;
  const npcReplyEntrance = useRef(new Animated.Value(1)).current;
  const optionsEntrance = useRef(new Animated.Value(1)).current;
  const optionsOpacity = useRef(new Animated.Value(1)).current;
  const feedbackEntrance = useRef(new Animated.Value(0)).current;
  const turnCacheRef = useRef<TurnCache>({});

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
    if (p === 'friendly') return 'NPC personality: Friendly. Warm, patient, encouraging. Forgives small mistakes.';
    if (p === 'busy') return 'NPC personality: Busy. Efficient, minimal words, not rude but pressed for time.';
    return 'NPC personality: Rude. Impatient, blunt, visibly annoyed by mistakes.';
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
      : pickByIndex(pack.followUp[lastQuality], idx);

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
    feedbackEntrance.setValue(0);
    const shuffled = [...turn.options].sort(() => Math.random() - 0.5);
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

    const prompt = isFirst
      ? `Turn-based language roleplay game.
Scene: "${scenario.title}" at ${scenario.location}.
Character: ${persona.name} (${persona.roleLabel}). ${personalityPrompt(personality)}
Target language: ${langName}. User native language: ${nativeLang}.
User goal: "${identityGoal}". Scene goal: "${scenario.mission ?? 'Complete the interaction naturally'}"${goalInject}

NPC opening line: "${openingMsg}"

Generate 3 response options (in ${langName}) — same intent, 3 different social registers:
"good" = polite and fluent, "ok" = minimal but understood, "awkward" = wrong grammar or socially odd.
NPC personality affects how reactions differ between qualities.
Shuffle options randomly. 1 sentence max each.${difficultyHint}

IMPORTANT: Do NOT include action narrations like *wipes the glass*, *smiles*, *leans forward* etc. NPC must speak only in dialogue. No asterisk actions, no stage directions, no narration.

Return ONLY valid JSON:
{"npc_message":"${openingMsg}","npc_mood":"neutral",${reactionFmt},"options":[{"text":"...","quality":"good"},{"text":"...","quality":"ok"},{"text":"...","quality":"awkward"}],"scene_complete":false}`
      : `Turn-based language roleplay.
Scene: "${scenario.title}" at ${scenario.location}. Character: ${persona.name}. ${personalityPrompt(personality)}
Target: ${langName}. Native: ${nativeLang}. Goal: "${identityGoal}"${goalInject}
Scene goal: "${scenario.mission ?? 'Complete the interaction naturally'}"

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

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null || optionsLoading || !options) return;
    setSelectedIdx(idx);
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
      setFailReaction(reaction);
      setPhase('lost');
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
    const goodCount = turnHistory.filter(t => t.quality === 'good').length;
    const total = Math.max(turnHistory.length, 1);
    const accuracy = goodCount / total;
    const xpBase = scenario.xpReward ?? 20;
    const bonus = accuracy >= 0.7 ? 8 : accuracy >= 0.4 ? 4 : 0;
    const userLevel: UserLevel = accuracy >= 0.7 ? 'advanced' : accuracy >= 0.4 ? 'intermediate' : 'beginner';
    onRunComplete?.({
      module: 'scene',
      accuracy,
      comboMax: consecutiveGood,
    });
    onStageComplete({ scenarioId: scenario.id, scenarioTitle: scenario.title, stageType: stageKey, userLevel, userMessageCount: total, xpEarned: xpBase + bonus, personaName: persona.name, rewardLine: persona.rewardLine, naturalTip: persona.naturalTip, suggestedNextStage: persona.nextStageHint });
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
          <TouchableOpacity style={styles.primaryBtn} onPress={() => startGame(savedState.turnHistory, savedState.currentNpcMessage, savedState.npcMood)}>
            <Text style={styles.primaryBtnText}>Kaldığım yerden devam et →</Text>
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
          <Text style={styles.introTitle}>{scenario.location} sahnesine giriyorsun.</Text>
          <Text style={styles.introSub}>{persona.name} sana yaklaşır:</Text>
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>"{scenario.openingMessage.split('\n')[0]}"</Text>
          </View>
          <Text style={styles.missionText}>🎯 {scenario.mission ?? 'Konuşmayı tamamla'}</Text>
          <View style={styles.howItWorksBox}>
            <Text style={styles.howTitle}>NASIL OYNANIR</Text>
            <Text style={styles.howItem}>1. NPC sana bir şey söyler</Text>
            <Text style={styles.howItem}>2. 3 yanıt seç — aynı fikir, farklı ton</Text>
            <Text style={styles.howItem}>3. NPC tepkisini hemen görürsün</Text>
            <Text style={styles.howItem}>4. Üst üste 2 garip cevap → sahne biter ❌</Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => startGame()}>
            <Text style={styles.primaryBtnText}>Sahneye Gir →</Text>
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
          <TouchableOpacity style={styles.primaryBtn} onPress={() => startGame()}>
            <Text style={styles.primaryBtnText}>Sahneye Gir →</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // LOST (scene fail)
  if (phase === 'lost') {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centerWrap}>
          <Text style={styles.bigEmoji}>😤</Text>
          <View style={styles.lostLabel}>
            <Text style={styles.lostLabelText}>DURUM KAYBEDİLDİ</Text>
          </View>
          <Text style={styles.bigTitle}>Konuşma koptu</Text>
          <Text style={styles.bigMeta}>NPC artık devam etmek istemiyor</Text>
          {!!failReaction && (
            <View style={styles.failReactionBox}>
              <Text style={styles.failReactionName}>{persona.name}:</Text>
              <Text style={styles.failReactionText}>"{failReaction}"</Text>
            </View>
          )}
          <View style={styles.failTip}>
            <Text style={styles.failTipText}>
              💡 İpucu: Üst üste garip cevap vermekten kaçın. Emin değilsen "ok" seçeneği daha güvenli.
            </Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => startGame()}>
            <Text style={styles.primaryBtnText}>🔁 Durumu Kurtarmayı Dene →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={onBack}>
            <Text style={styles.ghostBtnText}>Sahne seçimine dön</Text>
          </TouchableOpacity>
        </View>
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
    const outcomeText =
      goodCount === total ? 'Tereddütsüz ilerledi — mükemmel.' :
      hadNearMiss ? 'Bir ara kaybetmek üzeredin, ama toparladın.' :
      okCount >= Math.ceil(total * 0.5) ? 'Anlaşıldı, ama konuşma akıcı gitmedi.' :
      goalMet ? 'Sahneyi tamamladın — iyi iş.' :
      'Biraz zorlandın ama devam ettin.';
    const bestPhrase = turnHistory.find(t => t.quality === 'good')?.selectedText ?? null;

    return (
      <View style={styles.container}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.doneScroll}>
          <Text style={styles.bigEmoji}>{goalMet ? '🎉' : '💪'}</Text>
          <Text style={styles.bigTitle}>{goalMet ? 'Sahne tamamlandı!' : 'Neredeyse!'}</Text>
          <Text style={styles.outcomeText}>{outcomeText}</Text>
          {hadNearMiss && !hadNativeFlow && (
            <View style={styles.nearMissBadge}>
              <Text style={styles.nearMissText}>⚡ Near miss — toparladın</Text>
            </View>
          )}
          {hadNativeFlow && (
            <View style={styles.nativeFlowBadge}>
              <Text style={styles.nativeFlowText}>🚀 Native flow</Text>
            </View>
          )}

          <View style={[styles.goalRow, { borderColor: goalMet ? '#3DD68C' : '#F5B800' }]}>
            <Text style={styles.goalRowIcon}>{goalMet ? '✅' : '🎯'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.goalRowStatus, { color: goalMet ? '#3DD68C' : '#F5B800' }]}>
                {goalMet ? 'Hedef tamamlandı' : 'Hedef: devam et'}
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
              <Text style={[styles.doneStatVal, { color: '#1B9C5A' }]}>
                {turnHistory.filter(t => t.quality === 'awkward').length}
              </Text>
              <Text style={styles.doneStatLbl}>Garip seçim</Text>
            </View>
          </View>

          {bestPhrase && (
            <View style={styles.bestPhraseBox}>
              <Text style={styles.bestPhraseLabel}>EN İYİ İFADE</Text>
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

          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 8 }]} onPress={completeStage}>
            <Text style={styles.primaryBtnText}>XP'ni al →</Text>
          </TouchableOpacity>
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    );
  }

  // GAME (main)
  const turnNum = turnHistory.length + 1;
  const canFinishEarly = turnHistory.length >= 2 && selectedIdx === null && !optionsLoading;
  const isLastTurn = turnHistory.length + 1 >= MAX_TURNS;
  const combo = getCombo(consecutiveGood);

  return (
    <View style={styles.container}>
      {renderHeader(
        <View style={styles.turnBadge}>
          <Text style={styles.turnText}>{turnNum} / {MAX_TURNS}</Text>
        </View>
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
          <View style={styles.progressMeta}>
            {scenario.mission && (
              <Text style={styles.sceneGoalText} numberOfLines={1}>🎯 {scenario.mission}</Text>
            )}
            {combo && (
              <View style={[styles.comboBadge, { backgroundColor: combo.color + '20', borderColor: combo.color + '60' }]}>
                <Text style={[styles.comboText, { color: combo.color }]}>{combo.label}</Text>
              </View>
            )}
          </View>
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
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>
              {sceneComplete || isLastTurn ? '🏁 Sahneyi Bitir' : 'Sonraki Tur →'}
            </Text>
          </TouchableOpacity>
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
  introBadge: { color: '#1B9C5A', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  introTitle: { color: '#1A2B3C', fontSize: 26, fontWeight: '900', lineHeight: 34 },
  introSub: { color: '#9AABB8', fontSize: 14 },
  quoteBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E8EDF2' },
  quoteText: { color: '#1A2B3C', fontSize: 17, fontWeight: '700', lineHeight: 26 },
  missionText: { color: '#3DD68C', fontSize: 13, lineHeight: 20 },
  howItWorksBox: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, gap: 6, borderWidth: 1, borderColor: '#E8EDF2' },
  howTitle: { color: '#A78BFA', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  howItem: { color: '#6B7B8D', fontSize: 13, lineHeight: 22 },
  vocabTitle: { fontSize: 22, fontWeight: '800', color: '#1A2B3C' },
  vocabSubtitle: { fontSize: 14, color: '#9AABB8' },
  vocabGrid: { gap: 8 },
  vocabCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E8EDF2' },
  vocabWord: { fontSize: 15, fontWeight: '700', color: '#1A2B3C' },
  vocabMeaning: { fontSize: 13, color: '#1B9C5A', fontWeight: '600' },

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
    backgroundColor: '#1B9C5A',
    borderWidth: 0,
    borderColor: '#178A4F',
    borderRadius: 14,
    borderTopRightRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleName: { fontSize: 10, fontWeight: '900', color: '#1B9C5A', marginBottom: 3, letterSpacing: 0.6 },
  bubbleNameYou: { fontSize: 10, fontWeight: '900', color: '#178A4F', marginBottom: 3, letterSpacing: 0.6, textAlign: 'right' },
  npcBubbleText: { fontSize: 14, color: '#1A2B3C', lineHeight: 20 },
  userBubbleText: { fontSize: 14, color: '#FFFFFF', lineHeight: 20 },
  dotsRow: { flexDirection: 'row', gap: 7, justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotEmpty: { backgroundColor: '#E8EDF2' },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
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
});
