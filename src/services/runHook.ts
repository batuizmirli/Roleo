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

export type PlayerIdentityState = {
  runs: number;
  lastLabel: string;
  stableStreak: number;
  movingScore: number;
};

export type PlayerIdentitySnapshot = {
  label: string;
  descriptor: string;
  egoLine: string;
  evolutionLine: string;
};

const PLAYER_IDENTITY_KEY = 'roleoPlayerIdentityState';

const getPlayerIdentityState = async (): Promise<PlayerIdentityState | null> => {
  const raw = await AsyncStorage.getItem(PLAYER_IDENTITY_KEY);
  const parsed = raw ? tryParseJson<PlayerIdentityState>(raw) : null;
  if (!parsed) return null;
  if (typeof parsed.runs !== 'number' || typeof parsed.movingScore !== 'number') return null;
  if (typeof parsed.lastLabel !== 'string' || typeof parsed.stableStreak !== 'number') return null;
  return parsed;
};

const savePlayerIdentityState = async (state: PlayerIdentityState): Promise<void> => {
  await AsyncStorage.setItem(PLAYER_IDENTITY_KEY, JSON.stringify(state));
};

const performanceScore = (result: StageResult): number => {
  const acc = result.sceneAccuracy ?? 0;
  const combo = result.comboMax ?? 0;
  const awkward = result.awkwardTurns ?? 0;
  const timeout = result.timedOutTurns ?? 0;
  const rescue = result.runCompare?.previous?.failed && !result.runCompare?.current?.failed ? 0.08 : 0;
  return acc * 0.6 + Math.min(combo, 6) * 0.06 - awkward * 0.05 - timeout * 0.06 + rescue;
};

const deriveIdentityLabel = (result: StageResult): { label: string; descriptor: string; egoLine: string } => {
  const acc = result.sceneAccuracy ?? 0;
  const combo = result.comboMax ?? 0;
  const awkward = result.awkwardTurns ?? 0;
  const timeout = result.timedOutTurns ?? 0;
  const recovered = !!(result.runCompare?.previous?.failed && !result.runCompare?.current?.failed);

  if (combo >= 4 && acc >= 0.78 && awkward <= 1) {
    return {
      label: 'Smooth Speaker',
      descriptor: 'You keep conversations clean under pressure.',
      egoLine: 'Protect this title next run: stay sharp and uninterrupted.',
    };
  }
  if (timeout <= 0 && combo >= 2 && acc >= 0.62) {
    return {
      label: 'Flow Keeper',
      descriptor: 'You hold rhythm and keep momentum alive.',
      egoLine: 'Guard your flow streak before it cools down.',
    };
  }
  if (timeout === 0 && result.userMessageCount <= 4 && acc >= 0.52) {
    return {
      label: 'Fast Thinker',
      descriptor: 'You decide quickly without freezing.',
      egoLine: 'Own the pace again while your instincts are hot.',
    };
  }
  if (recovered) {
    return {
      label: 'Awkward Survivor',
      descriptor: 'You recover after messy turns and still finish.',
      egoLine: 'Turn survival into domination on the very next run.',
    };
  }
  if (awkward >= 3) {
    return {
      label: 'Risk Taker',
      descriptor: 'You push bold answers and learn in real time.',
      egoLine: 'Keep the courage, trim the rough edges next run.',
    };
  }
  return {
    label: 'Steady Climber',
    descriptor: 'You are building range run by run.',
    egoLine: 'Climb again now before this momentum fades.',
  };
};

export const resolvePlayerIdentity = async (result: StageResult): Promise<PlayerIdentitySnapshot> => {
  const base = deriveIdentityLabel(result);
  const prev = await getPlayerIdentityState();
  const score = performanceScore(result);
  const movingScore = prev ? prev.movingScore * 0.72 + score * 0.28 : score;
  const stableStreak = prev ? (prev.lastLabel === base.label ? prev.stableStreak + 1 : 1) : 1;
  const runs = (prev?.runs ?? 0) + 1;

  let evolutionLine = 'Identity starts now — lock this in on the next run.';
  if (prev) {
    if (prev.lastLabel === base.label && stableStreak >= 3) {
      evolutionLine = `You are cementing ${base.label}. ${stableStreak} runs in a row.`;
    } else if (movingScore > prev.movingScore + 0.025) {
      evolutionLine = "You're becoming more consistent — it shows in your rhythm.";
    } else if (movingScore + 0.03 < prev.movingScore) {
      evolutionLine = `This run dipped — win back your ${prev.lastLabel} energy right away.`;
    } else if (prev.lastLabel !== base.label) {
      evolutionLine = `New title unlocked: ${base.label}. Keep it for a few runs to own it.`;
    } else {
      evolutionLine = `You are holding ${base.label}. One cleaner run makes it unquestioned.`;
    }
  }

  await savePlayerIdentityState({
    runs,
    lastLabel: base.label,
    stableStreak,
    movingScore,
  });

  return {
    label: base.label,
    descriptor: base.descriptor,
    egoLine: base.egoLine,
    evolutionLine,
  };
};
