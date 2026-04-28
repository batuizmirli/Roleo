import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SceneSession } from '../types';
import { getSubscriptionState } from './subscription';
import { ROLEO_PLUS_MATRIX } from '../data/plus';

const STORAGE_KEY = 'roleoSceneSessions';

const readRaw = async (): Promise<SceneSession[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveSceneSession = async (session: SceneSession): Promise<void> => {
  try {
    const subscription = await getSubscriptionState();
    const maxSessions = subscription.isPremium ? ROLEO_PLUS_MATRIX.plus.memoryLimit : ROLEO_PLUS_MATRIX.free.memoryLimit;
    const existing = await readRaw();
    const deduplicated = existing.filter(s => s.sessionId !== session.sessionId);
    const next = [session, ...deduplicated].slice(0, maxSessions);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage errors must never crash the app
  }
};

export const getSceneSessions = async (): Promise<SceneSession[]> => {
  return readRaw();
};

export const getLastSceneSession = async (): Promise<SceneSession | null> => {
  const sessions = await readRaw();
  return sessions[0] ?? null;
};

export const clearSceneSessions = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
