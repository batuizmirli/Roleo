import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SceneFlowPath, SceneRunSnapshot, ReplayHookKind, StageResult } from '../types';
import { tryParseJson } from './json';

export type DailyRunSnapshot = {
  ts: string;
  overallAccuracy: number;
  maxCombo: number;
  sceneAccuracy?: number;
  sceneFlow?: SceneFlowPath;
};

const sceneKey = (scenarioId: string) => `roleoSceneSnap_${scenarioId}`;
const DAILY_SNAP_KEY = 'roleoDailyRunSnap';

export const getSceneSnapshot = async (scenarioId: string): Promise<SceneRunSnapshot | null> => {
  const raw = await AsyncStorage.getItem(sceneKey(scenarioId));
  const p = raw ? tryParseJson<SceneRunSnapshot>(raw) : null;
  return p && typeof p.comboMax === 'number' && typeof p.accuracy === 'number' ? p : null;
};

export const saveSceneSnapshot = async (scenarioId: string, s: SceneRunSnapshot): Promise<void> => {
  await AsyncStorage.setItem(sceneKey(scenarioId), JSON.stringify(s));
};

export const getDailyRunSnapshot = async (): Promise<DailyRunSnapshot | null> => {
  const raw = await AsyncStorage.getItem(DAILY_SNAP_KEY);
  const p = raw ? tryParseJson<DailyRunSnapshot>(raw) : null;
  return p && typeof p.overallAccuracy === 'number' ? p : null;
};

export const saveDailyRunSnapshot = async (s: DailyRunSnapshot): Promise<void> => {
  await AsyncStorage.setItem(DAILY_SNAP_KEY, JSON.stringify(s));
};

export const computeFailNearMiss = (params: {
  turnCount: number;
  goodCount: number;
  awkwardCount: number;
  comboPeak: number;
}): boolean => {
  const { turnCount, goodCount, awkwardCount, comboPeak } = params;
  if (turnCount <= 0) return false;
  if (comboPeak >= 3) return true;
  if (goodCount >= turnCount - 1 && awkwardCount <= 2) return true;
  if (goodCount >= 2 && turnCount >= 4 && awkwardCount <= turnCount - 2) return true;
  return false;
};

export const deriveSuccessHook = (prev: SceneRunSnapshot | null, cur: SceneRunSnapshot): ReplayHookKind => {
  const perfect = cur.accuracy >= 0.999 && !cur.hadAwkward;
  if (perfect) return 'perfect_run';
  if (prev?.failed && !cur.failed) return 'keep_flow';
  if (cur.hadAwkward || cur.flowPath === 'friction') return 'keep_flow';
  if (prev && !prev.failed && prev.comboMax > cur.comboMax) return 'beat_combo';
  if (cur.nearMiss) return 'fix_mistake';
  return 'none';
};

export const sceneReplayPrimaryLabel = (hook: ReplayHookKind, nearMiss?: boolean): string => {
  if (hook === 'fix_mistake' || nearMiss) return 'Fix the last mistake →';
  if (hook === 'keep_flow') return 'Keep the flow this time →';
  if (hook === 'beat_combo') return 'Beat your last combo →';
  if (hook === 'perfect_run') return 'Go for a perfect run →';
  return '🔁 Aynı sahneyi yeniden oyna';
};

export type LostCtaContext = {
  hook: ReplayHookKind;
  nearMiss: boolean;
  trailingAwkward: number;
  totalAwkward: number;
  turnsPlayed: number;
  lostFlowInLastTwo: boolean;
};

/** Kayıp ekranı — tam sebebe göre CTA */
export const buildLostReplayCta = (c: LostCtaContext): string => {
  if (c.lostFlowInLastTwo || c.trailingAwkward >= 2)
    return `Fix the last ${c.trailingAwkward} mistakes →`;
  if (c.trailingAwkward === 1) return 'Fix that last mistake →';
  if (c.nearMiss) return 'You were one pick away — run it again →';
  if (c.hook === 'keep_flow') return 'Keep the flow for 3 more turns →';
  return sceneReplayPrimaryLabel(c.hook, c.nearMiss);
};

/** Sonuç ekranı birincil CTA — tekrar için */
export const buildStageReplayCta = (result: StageResult): string => {
  const cur = result.runCompare?.current;
  const prev = result.runCompare?.previous;
  const awk = result.awkwardTurns ?? 0;
  const to = result.timedOutTurns ?? 0;

  if (to >= 2) return `Beat the clock on those ${to} slow turns →`;
  if (to === 1) return 'Beat the clock on that slow turn →';

  if (cur?.nearMiss && awk >= 2) return `Fix those ${awk} rough picks — right now →`;
  if (cur?.nearMiss && awk === 1) return 'Fix that one line — instant replay →';

  if (cur?.hookKind === 'keep_flow' || result.flowPath === 'friction') return 'Keep the flow for 3 more turns →';
  if (cur?.hookKind === 'beat_combo' && prev) return `Beat your combo ${prev.comboMax} (you hit ${cur.comboMax}) →`;
  if (cur?.hookKind === 'perfect_run') return 'Lock in another perfect run →';
  if (prev?.failed && !cur?.failed) return 'Chain a cleaner run — you already proved it →';

  return 'One more run — while it stings →';
};

/** Tek ana mesaj — dikkat burada */
export const getMotivationHero = (result: StageResult): { title: string; subtitle: string } => {
  const cur = result.runCompare?.current;
  const prev = result.runCompare?.previous;
  const awk = result.awkwardTurns ?? 0;
  const acc = result.sceneAccuracy ?? 0;

  if (cur?.nearMiss) {
    return {
      title: 'YOU WERE THAT CLOSE',
      subtitle:
        awk <= 1
          ? 'You are one natural answer away from a clean win — I want to see you grab it next tap.'
          : `Those ${awk} picks stole the shine — you can erase them on the next run.`,
    };
  }
  if (prev?.failed && !cur?.failed) {
    return {
      title: 'YOU CRAWLED OUT OF THE HOLE',
      subtitle: 'Last run the room went cold; this time you stayed. Ride that heat straight into another try.',
    };
  }
  if (cur?.hookKind === 'beat_combo' && prev) {
    return {
      title: `YOUR HIGH COMBO IS ${prev.comboMax}`,
      subtitle: `You clocked ${cur.comboMax} today — bite back and beat that number before you leave.`,
    };
  }
  if (cur?.hookKind === 'keep_flow' || result.flowPath === 'friction') {
    return {
      title: 'THE FLOW STUTTERED',
      subtitle: 'Next run I want smooth turns, not safe ones — string clean answers longer.',
    };
  }
  if (acc >= 0.85) {
    return {
      title: 'YOU SHOWED UP',
      subtitle: 'That felt sharp. Hit it again before the edge fades — mastery loves momentum.',
    };
  }
  if (!prev) {
    return {
      title: 'THIS RUN IS YOUR BAR',
      subtitle: 'Nothing to beat yet except yourself — stamp a higher mark next time you open this scene.',
    };
  }
  return {
    title: 'STAY IN THE RING',
    subtitle: 'You are stacking reps on this scene — one more run keeps the story moving.',
  };
};

export const oneLineRunDelta = (result: StageResult): string | null => {
  const prev = result.runCompare?.previous;
  const cur = result.runCompare?.current;
  if (!prev || !cur) return null;
  if (cur.comboMax > prev.comboMax) return `Combo up: ${prev.comboMax} → ${cur.comboMax}.`;
  if (cur.accuracy > prev.accuracy + 0.04) return `You sharpened accuracy vs last time.`;
  if (prev.failed && !cur.failed) return `You finished after a rough last run — that matters.`;
  return null;
};
