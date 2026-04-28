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
  if (hook === 'fix_mistake' || nearMiss) return 'Son garip cevabı düzelt →';
  if (hook === 'keep_flow') return 'Bu kez sahne akışını koru →';
  if (hook === 'beat_combo') return 'Son doğal akışı bir tur ileri taşı →';
  if (hook === 'perfect_run') return 'Daha temiz bir prova yap →';
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
    return `Son ${c.trailingAwkward} cevabı düzelt →`;
  if (c.trailingAwkward === 1) return 'Son cevabı düzelt →';
  if (c.nearMiss) return 'Bir seçim kalmıştı — yeniden prova et →';
  if (c.hook === 'keep_flow') return 'Akışı 3 tur daha koru →';
  return sceneReplayPrimaryLabel(c.hook, c.nearMiss);
};

/** Sonuç ekranı birincil CTA — tekrar için */
export const buildStageReplayCta = (result: StageResult): string => {
  const cur = result.runCompare?.current;
  const prev = result.runCompare?.previous;
  const awk = result.awkwardTurns ?? 0;
  const to = result.timedOutTurns ?? 0;

  if (to >= 2) return `${to} yavaş turu daha hızlı prova et →`;
  if (to === 1) return 'O yavaş turu daha hızlı prova et →';

  if (cur?.nearMiss && awk >= 2) return `${awk} pürüzlü cevabı şimdi düzelt →`;
  if (cur?.nearMiss && awk === 1) return 'O tek cevabı şimdi düzelt →';

  if (cur?.hookKind === 'keep_flow' || result.flowPath === 'friction') return 'Akışı 3 tur daha koru →';
  if (cur?.hookKind === 'beat_combo' && prev) return `Doğal akışı ilerlet (${prev.comboMax} → ${cur.comboMax}) →`;
  if (cur?.hookKind === 'perfect_run') return 'Aynı anı bir kez daha temiz prova et →';
  if (prev?.failed && !cur?.failed) return 'Daha temiz bir tekrar yap →';

  return 'Bir kez daha prova et →';
};

/** Tek ana mesaj — dikkat burada */
export const getMotivationHero = (result: StageResult): { title: string; subtitle: string } => {
  const cur = result.runCompare?.current;
  const prev = result.runCompare?.previous;
  const awk = result.awkwardTurns ?? 0;
  const acc = result.sceneAccuracy ?? 0;

  if (cur?.nearMiss) {
    return {
      title: 'ONE REPLY AWAY',
      subtitle:
        awk <= 1
          ? 'Tek bir daha doğal cevap, bu sahneyi gerçek hayata daha hazır hissettirecek.'
          : `${awk} seçim akışı bozdu — bir sonraki provada temizleyebilirsin.`,
    };
  }
  if (prev?.failed && !cur?.failed) {
    return {
      title: 'YOU KEPT THE SCENE GOING',
      subtitle: 'Son provada sahne erken kopmuştu; bu kez sonuna kadar taşıdın. Bir kez daha dene.',
    };
  }
  if (cur?.hookKind === 'beat_combo' && prev) {
    return {
      title: `DOĞAL AKIŞIN ${cur.comboMax} TURA ULAŞTI`,
      subtitle: `Önceki provada ${prev.comboMax} turdu; aynı sahneyi tekrar prova edip ritmi güçlendir.`,
    };
  }
  if (cur?.hookKind === 'keep_flow' || result.flowPath === 'friction') {
    return {
      title: 'THE SCENE GOT ROUGH',
      subtitle: 'Bir sonraki provada güvenli değil, o ana uygun temiz cevapları üst üste getir.',
    };
  }
  if (acc >= 0.85) {
    return {
      title: 'READY TO REHEARSE IT AGAIN',
      subtitle: 'Cevapların sahneyi taşıdı. Aynı anı bir kez daha oynayıp daha da temizle.',
    };
  }
  if (!prev) {
    return {
      title: 'THIS RUN IS YOUR BAR',
      subtitle: 'Bu prova senin başlangıç noktan. Bir sonraki denemede aynı anı daha net geçir.',
    };
  }
  return {
    title: 'REHEARSE THE MOMENT AGAIN',
    subtitle: 'Bu sahnede tekrar ettikçe hangi cevabın gerçek anda işe yarayacağını görürsün.',
  };
};

export const oneLineRunDelta = (result: StageResult): string | null => {
  const prev = result.runCompare?.previous;
  const cur = result.runCompare?.current;
  if (!prev || !cur) return null;
  if (cur.comboMax > prev.comboMax) return `Doğal akış arttı: ${prev.comboMax} → ${cur.comboMax}.`;
  if (cur.accuracy > prev.accuracy + 0.04) return `Son provaya göre daha temiz cevaplar seçtin.`;
  if (prev.failed && !cur.failed) return `Geçen sefer kopan sahneyi bu kez tamamladın.`;
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
      label: 'Scene Flow Keeper',
      descriptor: 'You keep the rehearsal moving under pressure.',
      egoLine: 'Protect this next run: choose clean replies before the moment slips.',
    };
  }
  if (timeout <= 0 && combo >= 2 && acc >= 0.62) {
    return {
      label: 'Flow Keeper',
      descriptor: 'You hold the rhythm of the scene.',
      egoLine: 'Guard this flow before the moment cools down.',
    };
  }
  if (timeout === 0 && result.userMessageCount <= 4 && acc >= 0.52) {
    return {
      label: 'Fast Thinker',
      descriptor: 'You choose replies before the scene stalls.',
      egoLine: 'Own the pace again while the moment is fresh.',
    };
  }
  if (recovered) {
    return {
      label: 'Awkward Survivor',
      descriptor: 'You recover after messy replies and still finish.',
      egoLine: 'Turn recovery into a cleaner rehearsal next run.',
    };
  }
  if (awkward >= 3) {
    return {
      label: 'Risk Taker',
      descriptor: 'You test bold replies and see what breaks.',
      egoLine: 'Keep the courage, trim the rough edges next run.',
    };
  }
  return {
    label: 'Steady Climber',
    descriptor: 'You are building practical replies run by run.',
    egoLine: 'Rehearse again before the moment fades.',
  };
};

export const resolvePlayerIdentity = async (result: StageResult): Promise<PlayerIdentitySnapshot> => {
  const base = deriveIdentityLabel(result);
  const prev = await getPlayerIdentityState();
  const score = performanceScore(result);
  const movingScore = prev ? prev.movingScore * 0.72 + score * 0.28 : score;
  const stableStreak = prev ? (prev.lastLabel === base.label ? prev.stableStreak + 1 : 1) : 1;
  const runs = (prev?.runs ?? 0) + 1;

  let evolutionLine = 'Your rehearsal style starts here — lock it in on the next run.';
  if (prev) {
    if (prev.lastLabel === base.label && stableStreak >= 3) {
      evolutionLine = `You are cementing ${base.label}. ${stableStreak} runs in a row.`;
    } else if (movingScore > prev.movingScore + 0.025) {
      evolutionLine = 'Your replies are getting more consistent — it shows in the scene.';
    } else if (movingScore + 0.03 < prev.movingScore) {
      evolutionLine = `This run dipped — rehearse your way back to ${prev.lastLabel}.`;
    } else if (prev.lastLabel !== base.label) {
      evolutionLine = `New title unlocked: ${base.label}. Keep it for a few rehearsals to own it.`;
    } else {
      evolutionLine = `You are holding ${base.label}. One cleaner rehearsal makes it stronger.`;
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
