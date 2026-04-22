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

export type Scenario = {
  id: string;
  title: string;
  location: string;
  emoji: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  stageType?: 'cafe' | 'travel' | 'business' | 'social' | 'story' | 'survival';
  modeType?: 'normal' | 'challenge' | 'survival' | 'story';
  estimatedMinutes?: number;
  levelRange?: Array<'beginner' | 'intermediate' | 'advanced'>;
  mission?: string;
  xpReward?: number;
  systemPrompt: string;
  openingMessage: string;
  vocabHints?: VocabHint[];
  backgroundImage?: string;
};

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';

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

export type StageResult = {
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
};

export type ModuleResult = {
  module: 'flash' | 'truefake' | 'scene';
  accuracy: number;
  comboMax?: number;
  speed?: number;
};

export type GameMode = {
  id: 'scenarios' | 'grammar' | 'vocab' | 'quiz' | 'stories' | 'phrasebook';
  title: string;
  description: string;
  emoji: string;
  color: string;
};
