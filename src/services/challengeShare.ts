import * as ExpoLinking from 'expo-linking';
import type { FriendChallengeOutcome, FriendChallengeTarget, StageResult } from '../types';

type ChallengePayload = {
  v: 1;
  id: string;
  sid: string;
  n: string;
  t: string;
  c: number;
  a: number;
  f?: 'smooth' | 'friction';
  w?: number;
  q: string;
};

const safeEncode = (obj: object) => encodeURIComponent(JSON.stringify(obj));
const safeDecode = (raw: string): ChallengePayload | null => {
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as ChallengePayload;
    if (!parsed || parsed.v !== 1) return null;
    if (!parsed.sid || !parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const buildChallengeLink = (target: FriendChallengeTarget): string => {
  const payload: ChallengePayload = {
    v: 1,
    id: target.id,
    sid: target.scenarioId,
    n: target.challengerName,
    t: target.challengerTitle,
    c: target.challengerCombo,
    a: target.challengerAccuracy,
    f: target.challengerFlow,
    w: target.challengerAwkward,
    q: target.taunt,
  };
  return ExpoLinking.createURL('challenge', { queryParams: { c: safeEncode(payload) } });
};

export const parseChallengeLink = (url: string): FriendChallengeTarget | null => {
  const p = ExpoLinking.parse(url);
  const raw = typeof p.queryParams?.c === 'string' ? p.queryParams.c : null;
  if (!raw) return null;
  const payload = safeDecode(raw);
  if (!payload) return null;
  return {
    id: payload.id,
    scenarioId: payload.sid,
    challengerName: payload.n || 'Your friend',
    challengerTitle: payload.t || 'Flow Keeper',
    challengerCombo: payload.c ?? 0,
    challengerAccuracy: payload.a ?? 0,
    challengerFlow: payload.f,
    challengerAwkward: payload.w,
    taunt: payload.q || 'Can you beat me?',
  };
};

export const buildResultEmotionalLine = (result: StageResult): string => {
  const awkward = result.awkwardTurns ?? 0;
  if ((result.runCompare?.current.nearMiss ?? false) && awkward > 0) {
    return awkward >= 2
      ? `You dropped flow with ${awkward} rough turns.`
      : 'You lost the flow on one rough turn.';
  }
  if ((result.timedOutTurns ?? 0) > 0) return 'The clock pushed you into awkwardness.';
  if (result.flowPath === 'smooth') return 'You held the flow under pressure.';
  return 'You survived social pressure and finished.';
};

const challengeDiff = (result: StageResult, target: FriendChallengeTarget): number => {
  const myCombo = result.comboMax ?? 0;
  const myAcc = result.sceneAccuracy ?? 0;
  return (myCombo - target.challengerCombo) * 0.18 + (myAcc - target.challengerAccuracy);
};

export const computeChallengeOutcome = (
  result: StageResult,
  target: FriendChallengeTarget
): FriendChallengeOutcome => {
  const myCombo = result.comboMax ?? 0;
  const myAccPct = Math.round((result.sceneAccuracy ?? 0) * 100);
  const theirAccPct = Math.round(target.challengerAccuracy * 100);
  const diff = challengeDiff(result, target);
  const won = diff >= 0;

  const diffLine = won
    ? `You: combo ${myCombo}, ${myAccPct}% vs ${target.challengerName}: combo ${target.challengerCombo}, ${theirAccPct}%.`
    : `${target.challengerName} stays ahead: combo ${target.challengerCombo}, ${theirAccPct}% vs your combo ${myCombo}, ${myAccPct}%.`;

  if (won) {
    return {
      won: true,
      summary: `You beat ${target.challengerName}.`,
      diffLine,
      replayLine: 'You beat them — can you do it again?',
    };
  }
  return {
    won: false,
    summary: `You almost beat ${target.challengerName}.`,
    diffLine,
    replayLine: 'Try again and win this time.',
  };
};
