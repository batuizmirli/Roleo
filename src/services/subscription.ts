import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROLEO_PLUS_MATRIX } from '../data/plus';

export type SubscriptionPlan = 'free' | 'plus';

export type SubscriptionState = {
  plan: SubscriptionPlan;
  isPremium: boolean;
  dailySceneDate: string;
  dailySceneCount: number;
  dailyVoiceRepeatCount: number;
  paywallSeenAfterFirstValue: boolean;
};

export type SceneLimitState = {
  isPremium: boolean;
  freeLimit: number;
  usedToday: number;
  remainingDailyScenes: number;
  canStartScene: boolean;
};

const SUBSCRIPTION_KEY = 'roleoSubscriptionState';
const FREE_DAILY_SCENE_LIMIT = ROLEO_PLUS_MATRIX.free.dailySceneLimit === 'unlimited'
  ? Number.POSITIVE_INFINITY
  : ROLEO_PLUS_MATRIX.free.dailySceneLimit;
const FREE_DAILY_VOICE_REPEAT_LIMIT = ROLEO_PLUS_MATRIX.free.dailyVoiceRepeatLimit === 'unlimited'
  ? Number.POSITIVE_INFINITY
  : ROLEO_PLUS_MATRIX.free.dailyVoiceRepeatLimit;

const todayKey = () => new Date().toISOString().slice(0, 10);

const defaultSubscription = (): SubscriptionState => ({
  plan: 'free',
  isPremium: false,
  dailySceneDate: todayKey(),
  dailySceneCount: 0,
  dailyVoiceRepeatCount: 0,
  paywallSeenAfterFirstValue: false,
});

const normalize = (state?: Partial<SubscriptionState> | null): SubscriptionState => {
  const today = todayKey();
  const plan = state?.plan === 'plus' ? 'plus' : 'free';
  const sameDay = state?.dailySceneDate === today;
  return {
    plan,
    isPremium: plan === 'plus',
    dailySceneDate: today,
    dailySceneCount: sameDay ? Math.max(0, state?.dailySceneCount ?? 0) : 0,
    dailyVoiceRepeatCount: sameDay ? Math.max(0, state?.dailyVoiceRepeatCount ?? 0) : 0,
    paywallSeenAfterFirstValue: !!state?.paywallSeenAfterFirstValue,
  };
};

export const getSubscriptionState = async (): Promise<SubscriptionState> => {
  try {
    const raw = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const normalized = normalize(parsed);
    if (raw !== JSON.stringify(normalized)) {
      await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return defaultSubscription();
  }
};

export const setMockSubscriptionPlan = async (plan: SubscriptionPlan): Promise<SubscriptionState> => {
  const prev = await getSubscriptionState();
  const next = normalize({ ...prev, plan });
  await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(next));
  return next;
};

export const getSceneLimitState = async (): Promise<SceneLimitState> => {
  const state = await getSubscriptionState();
  const remaining = state.isPremium ? Number.POSITIVE_INFINITY : Math.max(0, FREE_DAILY_SCENE_LIMIT - state.dailySceneCount);
  return {
    isPremium: state.isPremium,
    freeLimit: FREE_DAILY_SCENE_LIMIT,
    usedToday: state.dailySceneCount,
    remainingDailyScenes: remaining,
    canStartScene: state.isPremium || remaining > 0,
  };
};

export const recordSceneRehearsalUse = async (): Promise<SubscriptionState> => {
  const state = await getSubscriptionState();
  if (state.isPremium) return state;
  const next = normalize({ ...state, dailySceneCount: state.dailySceneCount + 1 });
  await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(next));
  return next;
};

export const getVoiceRepeatLimitState = async () => {
  const state = await getSubscriptionState();
  const remaining = state.isPremium ? Number.POSITIVE_INFINITY : Math.max(0, FREE_DAILY_VOICE_REPEAT_LIMIT - state.dailyVoiceRepeatCount);
  return {
    isPremium: state.isPremium,
    freeLimit: FREE_DAILY_VOICE_REPEAT_LIMIT,
    usedToday: state.dailyVoiceRepeatCount,
    remainingDailyVoiceRepeats: remaining,
    canUseVoiceRepeat: state.isPremium || remaining > 0,
  };
};

export const recordVoiceRepeatUse = async (): Promise<SubscriptionState> => {
  const state = await getSubscriptionState();
  if (state.isPremium) return state;
  const next = normalize({ ...state, dailyVoiceRepeatCount: state.dailyVoiceRepeatCount + 1 });
  await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(next));
  return next;
};

export const shouldShowPostValuePaywall = async (): Promise<boolean> => {
  const state = await getSubscriptionState();
  return !state.isPremium && !state.paywallSeenAfterFirstValue && state.dailySceneCount >= 1;
};

export const markPostValuePaywallSeen = async (): Promise<void> => {
  const state = await getSubscriptionState();
  const next = { ...state, paywallSeenAfterFirstValue: true };
  await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(next));
};
