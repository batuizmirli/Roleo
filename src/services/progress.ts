import AsyncStorage from '@react-native-async-storage/async-storage';
import { StageResult, UserProfile } from '../types';
import { scenarios } from '../data/scenarios';
import { tryParseJson } from './json';

export type ProgressState = {
  xp: number;
  streak: number;
  lastPlayedDate: string | null;
  completedScenarioIds: string[];
  scenarioPlayCounts: Record<string, number>;
  dailyXpLog: Record<string, number>;
};

export type UnlockState = {
  unlockedStageTypes: Array<'cafe' | 'travel' | 'business' | 'social' | 'story' | 'survival'>;
  stageCounts: Record<'cafe' | 'travel' | 'business' | 'social' | 'story' | 'survival', number>;
  nextGoal: string;
};

export type StageCompletionSummary = {
  progress: ProgressState;
  unlockState: UnlockState;
  newlyUnlocked: string[];
};

const PROGRESS_KEY = 'roleoProgress';

const defaultProgress: ProgressState = {
  xp: 0,
  streak: 0,
  lastPlayedDate: null,
  completedScenarioIds: [],
  scenarioPlayCounts: {},
  dailyXpLog: {},
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
  const unlocked = new Set<UnlockState['unlockedStageTypes'][number]>(['cafe', 'social', 'story']);

  if (counts.cafe >= 3) unlocked.add('travel');
  if (counts.travel >= 2) unlocked.add('survival');
  if (counts.social >= 2) unlocked.add('business');

  let nextGoal = '3 cafe stage tamamla → Travel aç';
  if (unlocked.has('travel') && !unlocked.has('survival')) {
    nextGoal = '2 travel stage tamamla → Survival aç';
  } else if (unlocked.has('travel') && !unlocked.has('business')) {
    nextGoal = '2 social stage tamamla → Business aç';
  } else if (unlocked.has('travel') && unlocked.has('survival') && unlocked.has('business')) {
    nextGoal = 'Tüm ana stage tipleri açık. Streak koru!';
  }

  return {
    unlockedStageTypes: Array.from(unlocked),
    stageCounts: counts,
    nextGoal,
  };
};

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
  };
};

export const completeStage = async (result: StageResult): Promise<StageCompletionSummary> => {
  const progress = await getProgress();
  const beforeUnlock = getUnlockState(progress);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  const todayStr = toISODate(new Date());
  const yesterdayStr = toISODate(new Date(Date.now() - 86400000));

  if (progress.lastPlayedDate === yesterdayStr) {
    progress.streak += 1;
  } else if (progress.lastPlayedDate !== todayStr) {
    progress.streak = 1;
  }

  progress.lastPlayedDate = todayStr;
  progress.xp += result.xpEarned;
  if (!progress.dailyXpLog) progress.dailyXpLog = {};
  progress.dailyXpLog[todayStr] = (progress.dailyXpLog[todayStr] ?? 0) + result.xpEarned;

  if (!progress.completedScenarioIds.includes(result.scenarioId)) {
    progress.completedScenarioIds.push(result.scenarioId);
  }

  if (!progress.scenarioPlayCounts) progress.scenarioPlayCounts = {};
  progress.scenarioPlayCounts[result.scenarioId] = (progress.scenarioPlayCounts[result.scenarioId] ?? 0) + 1;

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
  const newlyUnlocked = afterUnlock.unlockedStageTypes.filter(s => !beforeUnlock.unlockedStageTypes.includes(s));

  return {
    progress,
    unlockState: afterUnlock,
    newlyUnlocked,
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
