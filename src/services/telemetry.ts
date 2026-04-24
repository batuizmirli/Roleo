import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Event Types ───────────────────────────────────────────────
export type TelemetryEventName =
  | 'app_opened'
  | 'onboarding_completed'
  | 'first_session_ready_seen'
  | 'first_stage_started'
  | 'first_user_message_sent'
  | 'instant_learn_used'
  | 'stage_started'
  | 'stage_completed'
  | 'stage_retried'
  | 'result_seen'
  | 'next_stage_clicked'
  | 'daily_mission_started'
  | 'daily_mission_completed'
  | 'screen_view'
  | 'run_started'
  | 'module_completed'
  | 'run_completed'
  | 'first_session_next_stage_clicked'
  | 'first_session_next_mission_clicked'
  | 'scene_failed'
  | 'scene_answer_timeout'
  | 'friend_challenge_opened'
  | 'friend_challenge_shared';

export type EventPayload = Record<string, string | number | boolean | null | undefined>;

export type TelemetryEvent = {
  name: TelemetryEventName;
  ts: number;
  isoTime: string;
  sessionId: string;
  payload?: EventPayload;
};

// ─── Keys ──────────────────────────────────────────────────────
const EVENTS_KEY = 'roleo_telemetry';
const USER_ID_KEY = 'roleo_anon_id';
const MAX_EVENTS = 1000;

// ─── Session & User ID ────────────────────────────────────────
let _sessionId: string | null = null;
let _userId: string | null = null;

const generateId = () =>
  `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const getSessionId = (): string => {
  if (!_sessionId) _sessionId = generateId();
  return _sessionId;
};

export const getUserId = async (): Promise<string> => {
  if (_userId) return _userId;
  const stored = await AsyncStorage.getItem(USER_ID_KEY);
  if (stored) { _userId = stored; return stored; }
  _userId = `anon_${generateId()}`;
  await AsyncStorage.setItem(USER_ID_KEY, _userId);
  return _userId;
};

// ─── Core Track ────────────────────────────────────────────────
export const trackEvent = async (name: TelemetryEventName, payload?: EventPayload) => {
  try {
    const event: TelemetryEvent = {
      name,
      ts: Date.now(),
      isoTime: new Date().toISOString(),
      sessionId: getSessionId(),
      payload,
    };

    const raw = await AsyncStorage.getItem(EVENTS_KEY);
    const events: TelemetryEvent[] = raw ? JSON.parse(raw) : [];
    events.push(event);
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    // silent — never crash for telemetry
  }
};

// ─── Read ──────────────────────────────────────────────────────
export const getTelemetryEvents = async (): Promise<TelemetryEvent[]> => {
  try {
    const raw = await AsyncStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getRecentEvents = async (count = 20): Promise<TelemetryEvent[]> => {
  const all = await getTelemetryEvents();
  return all.slice(-count);
};

// ─── Funnel Analysis ───────────────────────────────────────────
export type FunnelStep = {
  name: string;
  event: TelemetryEventName;
  count: number;
  conversionFromPrev: number | null;
};

export const getFirstSessionFunnel = async (): Promise<FunnelStep[]> => {
  const events = await getTelemetryEvents();

  const steps: { name: string; event: TelemetryEventName }[] = [
    { name: 'Onboarding Done', event: 'onboarding_completed' },
    { name: 'Ready Screen', event: 'first_session_ready_seen' },
    { name: 'Stage Started', event: 'first_stage_started' },
    { name: 'First Message', event: 'first_user_message_sent' },
    { name: 'Stage Done', event: 'stage_completed' },
    { name: 'Result Seen', event: 'result_seen' },
    { name: 'Next Clicked', event: 'next_stage_clicked' },
  ];

  const sessionCounts = steps.map(s =>
    new Set(events.filter(e => e.name === s.event).map(e => e.sessionId)).size
  );

  return steps.map((s, i) => ({
    name: s.name,
    event: s.event,
    count: sessionCounts[i],
    conversionFromPrev: i === 0 ? null
      : sessionCounts[i - 1] > 0
        ? Math.round((sessionCounts[i] / sessionCounts[i - 1]) * 100)
        : 0,
  }));
};

// ─── Drop Detection ────────────────────────────────────────────
export type DropPoint = {
  label: string;
  description: string;
  detected: boolean;
};

export const detectDropPoints = async (): Promise<DropPoint[]> => {
  const events = await getTelemetryEvents();
  const has = (n: TelemetryEventName) => events.some(e => e.name === n);

  return [
    {
      label: 'Post-Onboarding Drop',
      description: 'Onboarding bitti ama ilk sahneye girmedi',
      detected: has('onboarding_completed') && !has('first_stage_started'),
    },
    {
      label: 'First Message Fear',
      description: 'Sahneye girdi ama mesaj atmadı',
      detected: has('first_stage_started') && !has('first_user_message_sent'),
    },
    {
      label: 'Mid-Stage Abandon',
      description: 'Mesaj attı ama sahneyi bitirmedi',
      detected: has('first_user_message_sent') && !has('stage_completed'),
    },
    {
      label: 'Result Bounce',
      description: 'Result gördü ama devam etmedi',
      detected: has('result_seen') && !has('next_stage_clicked'),
    },
  ];
};

// ─── Stats ─────────────────────────────────────────────────────
export const getDailyEventCount = async (): Promise<number> => {
  const events = await getTelemetryEvents();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return events.filter(e => e.ts >= todayStart.getTime()).length;
};

export const clearTelemetry = async () => {
  await AsyncStorage.removeItem(EVENTS_KEY);
};
