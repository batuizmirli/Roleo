import AsyncStorage from '@react-native-async-storage/async-storage';

export type LearnMode = 'vocab' | 'pronunciation' | 'listening';

type DayActivity = Partial<Record<LearnMode, number>>;

const todayKey = () => {
  const today = new Date().toISOString().slice(0, 10);
  return `learnActivity_${today}`;
};

export const recordLearnOpen = async (mode: LearnMode): Promise<void> => {
  const key = todayKey();
  const raw = await AsyncStorage.getItem(key);
  const current: DayActivity = raw ? JSON.parse(raw) : {};
  current[mode] = (current[mode] ?? 0) + 1;
  await AsyncStorage.setItem(key, JSON.stringify(current));
};

export const getLearnFills = async (): Promise<Record<LearnMode, number>> => {
  const key = todayKey();
  const raw = await AsyncStorage.getItem(key);
  const activity: DayActivity = raw ? JSON.parse(raw) : {};
  const fill = (mode: LearnMode) => Math.min(1, (activity[mode] ?? 0) / 3);
  return {
    vocab: fill('vocab'),
    pronunciation: fill('pronunciation'),
    listening: fill('listening'),
  };
};
