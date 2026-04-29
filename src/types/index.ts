export type Language = {
  code: string;
  name: string;
  flag: string;
};

export type UserGoal = {
  id: string;
  label: string;
  emoji: string;
  description: string;
};

export type UserIdentity = {
  goal: string;
  context: string;
  emotion: string;
};

export type VocabHint = {
  word: string;
  meaning: string;
};

export type ScenarioUsefulPhrase = {
  phrase: string;
  context: string;
};

export type ScenarioDifficultyVariant = {
  systemPromptSuffix?: string;
  openingMessageOverride?: string;
};

export type Scenario = {
  id: string;
  title: string;
  location: string;
  emoji: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  stageType?: 'cafe' | 'travel' | 'business' | 'social' | 'story' | 'survival';
  sceneCategory?: 'daily' | 'travel' | 'work' | 'social' | 'sports' | 'food' | 'survival';
  sceneTopic?: string;
  modeType?: 'normal' | 'challenge' | 'survival' | 'story';
  estimatedMinutes?: number;
  levelRange?: Array<'beginner' | 'intermediate' | 'advanced'>;
  mission?: string;
  xpReward?: number;
  systemPrompt: string;
  openingMessage: string;
  vocabHints?: VocabHint[];
  backgroundImage?: string;

  // Dramatic enrichment fields — all optional, safe to ignore in legacy screens
  baseSituation?: string;
  dramaticBeats?: string[];
  likelyMisunderstandings?: string[];
  socialRisk?: string;
  usefulPhrases?: ScenarioUsefulPhrase[];
  difficultyVariants?: {
    easy?: ScenarioDifficultyVariant;
    medium?: ScenarioDifficultyVariant;
    hard?: ScenarioDifficultyVariant;
  };
  replayTwists?: string[];
  grammarFocus?: string;
  vocabularyFocus?: string;
};

export type UserLevel = 'beginner' | 'intermediate' | 'advanced' | 'fluent';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  correction?: string;
  timestamp: Date;
};

export type UserProfile = {
  language: Language;
  nativeLanguage: Language;
  goal: UserGoal;
  goalDescription: string;
  identity?: UserIdentity;
  streak: number;
  completedScenarios: string[];
  level?: UserLevel;
  /** Günlük hedef (dakika), onboarding. */
  dailyGoalMinutes?: number;
  displayName?: string;
  email?: string;
  xp?: number;
  coins?: number;
  hearts?: number;
  lastPlayedScenarioId?: string;
  completedMissions?: string[];
};

export type SceneFlowPath = 'smooth' | 'friction';

export type ReplayHookKind = 'fix_mistake' | 'keep_flow' | 'beat_combo' | 'perfect_run' | 'none';

export type SceneRunSnapshot = {
  ts: string;
  comboMax: number;
  accuracy: number;
  flowPath?: SceneFlowPath;
  hadAwkward: boolean;
  failed: boolean;
  turnCount: number;
  nearMiss?: boolean;
  hookKind?: ReplayHookKind;
  awkwardTurns?: number;
  /** Son tur(lar)daki üst üste garip seçim sayısı (fail CTA için) */
  trailingAwkward?: number;
};

export type RunComparePayload = {
  previous: SceneRunSnapshot | null;
  current: SceneRunSnapshot;
};

export type FriendChallengeTarget = {
  id: string;
  scenarioId: string;
  challengerName: string;
  challengerTitle: string;
  challengerCombo: number;
  challengerAccuracy: number;
  challengerFlow?: SceneFlowPath;
  challengerAwkward?: number;
  taunt: string;
};

export type FriendChallengeOutcome = {
  won: boolean;
  summary: string;
  diffLine: string;
  replayLine: string;
};

export type StageTurnReview = {
  npcMessage: string;
  selectedText: string;
  quality: 'good' | 'ok' | 'awkward';
  goodOption?: string;
  npcReaction?: string;
};

export type StageLearningSummary = {
  bestReply?: string;
  awkwardMoment?: string;
  betterAlternative?: string;
  nextFocus?: string;
};

export type VoiceAttempt = {
  id: string;
  targetText: string;
  transcript?: string;
  confidence?: number;
  feedback?: string;
  meaningClear?: boolean;
  missingKeywords?: string[];
  createdAt: string;
  scenarioId?: string;
  language?: string;
};

export type LearningMemoryCategoryStat = {
  plays: number;
  improvedRuns: number;
};

export type LearningMemory = {
  recentMistakeTypes: string[];
  repeatedWeaknesses: string[];
  savedPhrases: string[];
  lastSceneFocus?: string;
  nextRecommendedFocus?: string;
  categoryStats: Record<string, LearningMemoryCategoryStat>;
  updatedAt: string;
};

export type StageResult = {
  resultId?: string;
  scenarioId: string;
  scenarioTitle: string;
  stageType: NonNullable<Scenario['stageType']>;
  userLevel: UserLevel;
  userMessageCount: number;
  xpEarned: number;
  personaName?: string;
  rewardLine?: string;
  naturalTip?: string;
  suggestedNextStage?: string;
  /** Game layer: sahne performansı */
  comboMax?: number;
  sceneAccuracy?: number;
  flowPath?: SceneFlowPath;
  nativePhraseHighlight?: string;
  timedOutTurns?: number;
  awkwardTurns?: number;
  goodTurns?: number;
  /** Önceki koşu vs bu koşu — “one more run” metni için */
  runCompare?: RunComparePayload;
  turnReviews?: StageTurnReview[];
  learningSummary?: StageLearningSummary;
  voiceAttempts?: VoiceAttempt[];
  challengeTarget?: FriendChallengeTarget;
  challengeOutcome?: FriendChallengeOutcome;
};

export type ModuleResult = {
  module: 'flash' | 'truefake' | 'scene';
  accuracy: number;
  comboMax?: number;
  speed?: number;
  flowPath?: SceneFlowPath;
  nativePhrase?: string;
  voiceAttempts?: VoiceAttempt[];
};

export type GameMode = {
  id: 'scenarios' | 'grammar' | 'vocab' | 'quiz' | 'stories';
  title: string;
  description: string;
  emoji: string;
  color: string;
};

export type SceneSessionChoice = {
  turn: number;
  npcMessage: string;
  selectedText: string;
  quality: 'good' | 'ok' | 'awkward';
  goodOption: string;
};

export type SceneSessionScore = {
  accuracy: number;
  comboMax: number;
  xpEarned: number;
  flowPath: SceneFlowPath;
  goodTurns: number;
  awkwardTurns: number;
  timedOutTurns: number;
};

export type SceneSession = {
  sessionId: string;
  timestamp: string;
  source?: 'stage_result' | 'daily_run';
  scenarioId: string;
  scenarioTitle: string;
  stageType: string;
  language: string;
  npcPersona: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  userGoal?: string;
  identityGoal?: string;
  selectedChoices: SceneSessionChoice[];
  score: SceneSessionScore;
  bestLine?: string;
  awkwardMoment?: string;
  betterAlternative?: string;
  nextFocus?: string;
  dramaticBeat?: string;
  voiceAttempts?: VoiceAttempt[];
};
