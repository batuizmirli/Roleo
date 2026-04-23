import AsyncStorage from '@react-native-async-storage/async-storage';
import { tryParseJson } from './json';

export type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  accuracyPct: number;
  comboMax: number;
  isSelf: boolean;
};

type StoredDay = {
  date: string;
  entries: (LeaderboardEntry & { rank?: number })[];
  lastUserScore?: number;
};

const dayKey = () => `roleoLeaderboard_${new Date().toISOString().slice(0, 10)}`;

const BOT_NAMES = ['Maya', 'Leo', 'Sora', 'Noah', 'Ivy', 'Kai', 'Zoe', 'Omar', 'Lina', 'Theo', 'Ada', 'Finn'];

const hashSeed = (iso: string) => {
  let h = 0;
  for (let i = 0; i < iso.length; i += 1) h = (h * 31 + iso.charCodeAt(i)) >>> 0;
  return h;
};

const seededRandom = (seed: number, i: number) => {
  const x = Math.sin(seed * 9999 + i * 127) * 10000;
  return x - Math.floor(x);
};

const buildBotEntries = (date: string): LeaderboardEntry[] => {
  const seed = hashSeed(date);
  return BOT_NAMES.map((name, i) => {
    const r = seededRandom(seed, i);
    const accuracyPct = 55 + Math.floor(r * 42);
    const comboMax = 1 + Math.floor(seededRandom(seed, i + 50) * 5);
    const score = Math.round(accuracyPct * 1.1 + comboMax * 18 + seededRandom(seed, i + 99) * 40);
    return {
      id: `bot_${i}`,
      name,
      score,
      accuracyPct,
      comboMax,
      isSelf: false,
    };
  });
};

const mergeAndRank = (bots: LeaderboardEntry[], self: LeaderboardEntry, keep = 12): (LeaderboardEntry & { rank: number })[] => {
  const merged = [...bots, self].sort((a, b) => b.score - a.score);
  const unique: LeaderboardEntry[] = [];
  const seen = new Set<string>();
  for (const e of merged) {
    const k = e.isSelf ? '__self__' : e.id;
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(e);
    if (unique.length >= keep) break;
  }
  return unique.map((e, idx) => ({ ...e, rank: idx + 1 }));
};

export const computeSceneLeaderScore = (accuracy: number, comboMax: number, xpEarned: number) =>
  Math.round(accuracy * 130 + comboMax * 28 + Math.min(xpEarned, 80) * 1.5);

export const getDailyLeaderboard = async (): Promise<(LeaderboardEntry & { rank: number })[]> => {
  const key = dayKey();
  const raw = await AsyncStorage.getItem(key);
  const parsed = raw ? tryParseJson<StoredDay>(raw) : null;
  if (parsed?.entries?.length) {
    return [...parsed.entries]
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }
  const bots = buildBotEntries(new Date().toISOString().slice(0, 10));
  const sorted = [...bots].sort((a, b) => b.score - a.score).slice(0, 12);
  const ranked = sorted.map((e, i) => ({ ...e, rank: i + 1 }));
  await AsyncStorage.setItem(key, JSON.stringify({ date: new Date().toISOString().slice(0, 10), entries: ranked } satisfies StoredDay));
  return ranked;
};

/** Records the user's best score for today and returns merged leaderboard (top 12). */
export const recordDailySceneScore = async (params: {
  accuracy: number;
  comboMax: number;
  xpEarned: number;
  displayName?: string;
}): Promise<(LeaderboardEntry & { rank: number })[]> => {
  const key = dayKey();
  const today = new Date().toISOString().slice(0, 10);
  const raw = await AsyncStorage.getItem(key);
  const parsed = raw ? tryParseJson<StoredDay>(raw) : null;
  const bots = buildBotEntries(today);
  const others = (parsed?.entries ?? []).filter(e => !e.isSelf);
  const baseList = others.length >= 4 ? others : bots;

  const name = params.displayName?.trim() || 'Sen';
  const score = computeSceneLeaderScore(params.accuracy, params.comboMax, params.xpEarned);
  const prevBest = parsed?.entries?.find(e => e.isSelf)?.score ?? 0;
  const self: LeaderboardEntry = {
    id: 'self',
    name,
    score: Math.max(score, prevBest),
    accuracyPct: Math.round(params.accuracy * 100),
    comboMax: params.comboMax,
    isSelf: true,
  };

  const ranked = mergeAndRank(baseList, self, 12);
  await AsyncStorage.setItem(key, JSON.stringify({
    date: today,
    entries: ranked,
    lastUserScore: self.score,
  } satisfies StoredDay));

  return ranked;
};
