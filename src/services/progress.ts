import AsyncStorage from '@react-native-async-storage/async-storage';
import { LearningMemory, StageResult, UserProfile } from '../types';
import { scenarios } from '../data/scenarios';
import { tryParseJson } from './json';

export type ProgressState = {
  xp: number;
  streak: number;
  lastPlayedDate: string | null;
  completedScenarioIds: string[];
  scenarioPlayCounts: Record<string, number>;
  dailyXpLog: Record<string, number>;
  learningMemory?: LearningMemory;
  completedResultIds?: string[];
};

export type UnlockState = {
  unlockedStageTypes: Array<'cafe' | 'travel' | 'business' | 'social' | 'story' | 'survival'>;
  stageCounts: Record<'cafe' | 'travel' | 'business' | 'social' | 'story' | 'survival', number>;
  nextGoal: string;
  level: number;
  unlockedFeatureIds: ProgressionFeatureId[];
  progressionUnlocks: ProgressionUnlock[];
  nextFeature: ProgressionUnlock | null;
};

export type StageCompletionSummary = {
  progress: ProgressState;
  unlockState: UnlockState;
  newlyUnlocked: string[];
  newlyUnlockedFeatures: ProgressionUnlock[];
  appliedXp: number;
};

export type ProgressionFeatureId =
  | 'friendly_npc'
  | 'basic_scenes'
  | 'busy_npc'
  | 'realistic_pace'
  | 'replay_twists'
  | 'voice_repeat_step'
  | 'hard_mode'
  | 'work_scenes'
  | 'free_conversation';

export type ProgressionUnlock = {
  id: ProgressionFeatureId;
  level: number;
  title: string;
  description: string;
  unlocked: boolean;
};

const PROGRESS_KEY = 'roleoProgress';

const defaultProgress: ProgressState = {
  xp: 0,
  streak: 0,
  lastPlayedDate: null,
  completedScenarioIds: [],
  scenarioPlayCounts: {},
  dailyXpLog: {},
  learningMemory: {
    recentMistakeTypes: [],
    repeatedWeaknesses: [],
    savedPhrases: [],
    categoryStats: {},
    updatedAt: '',
  },
  completedResultIds: [],
};

const COMPLETED_RESULT_CAP = 30;

const MEMORY_MISTAKE_CAP = 8;
const MEMORY_WEAKNESS_CAP = 4;
const MEMORY_PHRASE_CAP = 8;

export const PROGRESSION_UNLOCKS: Array<Omit<ProgressionUnlock, 'unlocked'>> = [
  {
    id: 'friendly_npc',
    level: 1,
    title: 'Friendly NPC',
    description: 'Sahneler sabırlı, açıklayıcı ve düşük baskılı başlar.',
  },
  {
    id: 'basic_scenes',
    level: 1,
    title: 'Basic scenes',
    description: 'Kafe, seyahat, sosyal ve hikaye sahneleri açık.',
  },
  {
    id: 'busy_npc',
    level: 2,
    title: 'Busy NPC',
    description: 'Bazı karakterler daha aceleci davranır; cevapların daha net olmalı.',
  },
  {
    id: 'realistic_pace',
    level: 2,
    title: 'Daha gerçekçi tempo',
    description: 'Sahnelerde zaman baskısı ve daha doğal konuşma ritmi belirginleşir.',
  },
  {
    id: 'replay_twists',
    level: 3,
    title: 'Replay with twist',
    description: 'Aynı sahneyi farklı bir problemle tekrar prova edebilirsin.',
  },
  {
    id: 'voice_repeat_step',
    level: 4,
    title: 'Voice repeat step',
    description: 'Cevabını sesli tekrar etme adımı prova akışına eklenir.',
  },
  {
    id: 'hard_mode',
    level: 5,
    title: 'Hard mode',
    description: 'Daha az ipucu, daha hızlı NPC ve daha nüanslı cevaplar açılır.',
  },
  {
    id: 'work_scenes',
    level: 7,
    title: 'Work scenes',
    description: 'İş görüşmesi, toplantı ve profesyonel sahneler açılır.',
  },
  {
    id: 'free_conversation',
    level: 10,
    title: 'Free conversation mode',
    description: 'Serbest konuşma modu için yer hazırlanır.',
  },
];

const appendUniqueCapped = (list: string[], value: string, cap: number) => {
  const normalized = value.trim();
  if (!normalized) return list;
  if (list.includes(normalized)) return list;
  return [...list, normalized].slice(-cap);
};

const appendCapped = (list: string[], value: string, cap: number) => {
  const normalized = value.trim();
  if (!normalized) return list;
  return [...list, normalized].slice(-cap);
};

const buildNextRecommendedFocus = (weaknesses: string[]) => {
  if (weaknesses.includes('short_replies')) {
    return 'Son sahnelerde cevapların kısa kaldı. Bugün cevaba bir neden veya detay ekle.';
  }
  if (weaknesses.includes('direct_tone')) {
    return 'Bazen fazla direkt kalıyorsun. Bugün daha yumuşak ve nazik geçişler kullan.';
  }
  if (weaknesses.includes('awkward_tone')) {
    return 'Akışta garip kalan yanıtlar oldu. Bugün daha doğal ve temiz kalıplar seç.';
  }
  if (weaknesses.includes('time_pressure')) {
    return 'Süre baskısı kararını etkiliyor. Bugün bir beat erken cevap vererek ritmi koru.';
  }
  if (weaknesses.includes('politeness')) {
    return 'Nazik tonu güçlendirelim: bugün rica ve yumuşatma kalıpları ekleyerek cevapla.';
  }
  return 'Bugün bir tur daha temiz akış hedefle ve iyi cevap zincirini koru.';
};

const deriveLearningMemory = (result: StageResult, previous?: LearningMemory): LearningMemory => {
  const prior: LearningMemory = previous ?? {
    recentMistakeTypes: [],
    repeatedWeaknesses: [],
    savedPhrases: [],
    categoryStats: {},
    updatedAt: '',
  };

  const newMistakes = new Set<string>();
  const nextCategoryStats = { ...(prior.categoryStats ?? {}) };
  const stageKey = result.stageType ?? 'social';
  const currentCategory = nextCategoryStats[stageKey] ?? { plays: 0, improvedRuns: 0 };
  const didImprove =
    (result.runCompare?.previous && result.runCompare.current.accuracy > result.runCompare.previous.accuracy)
    || (result.runCompare?.current.comboMax ?? 0) > (result.runCompare?.previous?.comboMax ?? 0);
  nextCategoryStats[stageKey] = {
    plays: currentCategory.plays + 1,
    improvedRuns: currentCategory.improvedRuns + (didImprove ? 1 : 0),
  };

  if ((result.awkwardTurns ?? 0) > 0) {
    newMistakes.add('awkward_reply');
    newMistakes.add('politeness');
  }
  if ((result.sceneAccuracy ?? 1) < 0.68) {
    newMistakes.add('short_reply');
    newMistakes.add('direct_tone');
  }
  if ((result.timedOutTurns ?? 0) > 0) {
    newMistakes.add('time_pressure');
  }
  if ((result.goodTurns ?? 0) <= 1 && (result.userMessageCount ?? 0) >= 4) {
    newMistakes.add('short_reply');
  }

  let repeatedWeaknesses = [...(prior.repeatedWeaknesses ?? [])];
  let recentMistakeTypes = [...(prior.recentMistakeTypes ?? [])];
  newMistakes.forEach(m => {
    recentMistakeTypes = appendCapped(recentMistakeTypes, m, MEMORY_MISTAKE_CAP);
    const hits = recentMistakeTypes.filter(v => v === m).length;
    if (hits >= 2 && !repeatedWeaknesses.includes(m)) {
      repeatedWeaknesses = appendUniqueCapped(repeatedWeaknesses, m, MEMORY_WEAKNESS_CAP);
    }
  });

  const mappedWeaknesses = repeatedWeaknesses.map(w => {
    if (w === 'short_reply') return 'short_replies';
    if (w === 'direct_tone') return 'direct_tone';
    if (w === 'awkward_reply') return 'awkward_tone';
    if (w === 'time_pressure') return 'time_pressure';
    if (w === 'politeness') return 'politeness';
    return w;
  });
  const nextRecommendedFocus = buildNextRecommendedFocus(mappedWeaknesses);

  let savedPhrases = [...(prior.savedPhrases ?? [])];
  const candidatePhrases = [
    result.learningSummary?.betterAlternative,
    result.learningSummary?.bestReply,
    result.nativePhraseHighlight,
  ].filter((v): v is string => !!v && v.trim().length > 0);
  for (const phrase of candidatePhrases) {
    savedPhrases = appendUniqueCapped(savedPhrases, phrase, MEMORY_PHRASE_CAP);
  }

  return {
    recentMistakeTypes,
    repeatedWeaknesses: mappedWeaknesses,
    savedPhrases,
    lastSceneFocus: result.learningSummary?.nextFocus ?? result.naturalTip ?? undefined,
    nextRecommendedFocus,
    categoryStats: nextCategoryStats,
    updatedAt: new Date().toISOString(),
  };
};

const emptyCounts: UnlockState['stageCounts'] = {
  cafe: 0,
  travel: 0,
  business: 0,
  social: 0,
  story: 0,
  survival: 0,
};

const getCompletedStageCounts = (completedScenarioIds: string[]) => {
  const counts = { ...emptyCounts };
  for (const id of completedScenarioIds) {
    const scenario = scenarios.find(s => s.id === id);
    const stage = scenario?.stageType ?? 'social';
    counts[stage] += 1;
  }
  return counts;
};

export const getUnlockState = (progress: ProgressState): UnlockState => {
  const counts = getCompletedStageCounts(progress.completedScenarioIds);
  const level = getLevelFromXp(progress.xp);
  const progressionUnlocks = getProgressionUnlocks(level);
  const unlockedFeatureIds = progressionUnlocks.filter(u => u.unlocked).map(u => u.id);
  const unlocked = new Set<UnlockState['unlockedStageTypes'][number]>(['cafe', 'travel', 'social', 'story']);

  if (level >= 2) unlocked.add('survival');
  if (level >= 7) unlocked.add('business');

  const nextFeature = getNextProgressionUnlock(level);
  const nextGoal = nextFeature
    ? `Seviye ${nextFeature.level}: ${nextFeature.title} açılır. ${nextFeature.description}`
    : 'Ana progression açık. Streak koru ve sahne repertuvarını genişlet.';

  return {
    unlockedStageTypes: Array.from(unlocked),
    stageCounts: counts,
    nextGoal,
    level,
    unlockedFeatureIds,
    progressionUnlocks,
    nextFeature,
  };
};

export const getProgressionUnlocks = (level: number): ProgressionUnlock[] =>
  PROGRESSION_UNLOCKS.map(unlock => ({
    ...unlock,
    unlocked: level >= unlock.level,
  }));

export const getNextProgressionUnlock = (level: number): ProgressionUnlock | null =>
  getProgressionUnlocks(level).find(unlock => !unlock.unlocked) ?? null;

export const getNewlyUnlockedProgression = (fromLevel: number, toLevel: number): ProgressionUnlock[] =>
  PROGRESSION_UNLOCKS
    .filter(unlock => unlock.level > fromLevel && unlock.level <= toLevel)
    .map(unlock => ({ ...unlock, unlocked: true }));

export const getProgress = async (): Promise<ProgressState> => {
  const raw = await AsyncStorage.getItem(PROGRESS_KEY);
  if (!raw) return defaultProgress;

  const parsed = tryParseJson<ProgressState>(raw);
  if (!parsed) {
    await AsyncStorage.removeItem(PROGRESS_KEY);
    return defaultProgress;
  }

  // migrate old toDateString() format to ISO date
  let lastPlayedDate = parsed.lastPlayedDate;
  if (lastPlayedDate && lastPlayedDate.includes(' ')) {
    const d = new Date(lastPlayedDate);
    lastPlayedDate = isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  return {
    ...defaultProgress,
    ...parsed,
    lastPlayedDate,
    scenarioPlayCounts: parsed.scenarioPlayCounts ?? {},
    dailyXpLog: parsed.dailyXpLog ?? {},
    learningMemory: parsed.learningMemory ?? defaultProgress.learningMemory,
    completedResultIds: parsed.completedResultIds ?? [],
  };
};

export const completeStage = async (result: StageResult): Promise<StageCompletionSummary> => {
  const progress = await getProgress();
  const beforeUnlock = getUnlockState(progress);
  const resultId = result.resultId?.trim();
  const alreadyCompleted = !!(resultId && progress.completedResultIds?.includes(resultId));
  if (alreadyCompleted) {
    const unlock = getUnlockState(progress);
    return {
      progress,
      unlockState: unlock,
      newlyUnlocked: [],
      newlyUnlockedFeatures: [],
      appliedXp: 0,
    };
  }

  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  const todayStr = toISODate(new Date());
  const yesterdayStr = toISODate(new Date(Date.now() - 86400000));

  if (progress.lastPlayedDate === yesterdayStr) {
    progress.streak += 1;
  } else if (progress.lastPlayedDate !== todayStr) {
    progress.streak = 1;
  }

  progress.lastPlayedDate = todayStr;
  const previousLevel = getLevelFromXp(progress.xp);
  progress.xp += result.xpEarned;
  const nextLevel = getLevelFromXp(progress.xp);
  if (!progress.dailyXpLog) progress.dailyXpLog = {};
  progress.dailyXpLog[todayStr] = (progress.dailyXpLog[todayStr] ?? 0) + result.xpEarned;

  if (!progress.completedScenarioIds.includes(result.scenarioId)) {
    progress.completedScenarioIds.push(result.scenarioId);
  }

  if (!progress.scenarioPlayCounts) progress.scenarioPlayCounts = {};
  progress.scenarioPlayCounts[result.scenarioId] = (progress.scenarioPlayCounts[result.scenarioId] ?? 0) + 1;
  progress.learningMemory = deriveLearningMemory(result, progress.learningMemory);
  if (!progress.completedResultIds) progress.completedResultIds = [];
  if (resultId) {
    progress.completedResultIds = [...progress.completedResultIds, resultId].slice(-COMPLETED_RESULT_CAP);
  }

  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));

  const profileRaw = await AsyncStorage.getItem('userProfile');
  const profile = profileRaw ? tryParseJson<UserProfile>(profileRaw) : null;
  if (profile) {
    const updated: UserProfile = {
      ...profile,
      streak: progress.streak,
      xp: progress.xp,
      lastPlayedScenarioId: result.scenarioId,
      level: result.userLevel,
      completedScenarios: Array.from(new Set([...(profile.completedScenarios ?? []), result.scenarioId])),
    };
    await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
  }

  const afterUnlock = getUnlockState(progress);
  const newlyUnlockedStageTypes = afterUnlock.unlockedStageTypes.filter(s => !beforeUnlock.unlockedStageTypes.includes(s));
  const newlyUnlockedFeatures = getNewlyUnlockedProgression(previousLevel, nextLevel);

  return {
    progress,
    unlockState: afterUnlock,
    newlyUnlocked: newlyUnlockedStageTypes,
    newlyUnlockedFeatures,
    appliedXp: result.xpEarned,
  };
};

export const awardActivityXP = async (xp: number): Promise<void> => {
  const progress = await getProgress();
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  const todayStr = toISODate(new Date());
  const yesterdayStr = toISODate(new Date(Date.now() - 86400000));

  if (progress.lastPlayedDate === yesterdayStr) {
    progress.streak += 1;
  } else if (progress.lastPlayedDate !== todayStr) {
    progress.streak = 1;
  }
  progress.lastPlayedDate = todayStr;
  progress.xp += xp;
  if (!progress.dailyXpLog) progress.dailyXpLog = {};
  progress.dailyXpLog[todayStr] = (progress.dailyXpLog[todayStr] ?? 0) + xp;

  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));

  const profileRaw = await AsyncStorage.getItem('userProfile');
  const profile = profileRaw ? tryParseJson<UserProfile>(profileRaw) : null;
  if (profile) {
    await AsyncStorage.setItem('userProfile', JSON.stringify({ ...profile, xp: progress.xp, streak: progress.streak }));
  }
};

export const getLevelFromXp = (xp: number) => Math.floor(xp / 100) + 1;
export const getLevelProgress = (xp: number) => (xp % 100) / 100;

const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt'];

export type DailyXpEntry = { date: string; label: string; xp: number };

export const getWeeklyXp = (log: Record<string, number>): DailyXpEntry[] => {
  const result: DailyXpEntry[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    result.push({ date: iso, label: DAY_LABELS[d.getDay()], xp: log[iso] ?? 0 });
  }
  return result;
};
