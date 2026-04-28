import type { Scenario } from '../types';

export type PlanFeatureMatrix = {
  dailySceneLimit: number | 'unlimited';
  memoryLimit: number;
  basicScenes: boolean;
  basicTravel: boolean;
  customScenes: boolean;
  advancedNpc: boolean;
  replayTwists: boolean | 'limited';
  workScenes: boolean;
  advancedTravel: boolean;
  survivalMoments: boolean;
  voicePractice: boolean | 'limited';
  dailyVoiceRepeatLimit: number | 'unlimited';
  deeperFeedback: boolean;
  weeklyProgressSummary: boolean;
};

export const ROLEO_PLUS_MATRIX: Record<'free' | 'plus', PlanFeatureMatrix> = {
  free: {
    dailySceneLimit: 1,
    memoryLimit: 2,
    basicScenes: true,
    basicTravel: true,
    customScenes: false,
    advancedNpc: false,
    replayTwists: 'limited',
    workScenes: false,
    advancedTravel: false,
    survivalMoments: false,
    voicePractice: 'limited',
    dailyVoiceRepeatLimit: 1,
    deeperFeedback: false,
    weeklyProgressSummary: false,
  },
  plus: {
    dailySceneLimit: 'unlimited',
    memoryLimit: 20,
    basicScenes: true,
    basicTravel: true,
    customScenes: true,
    advancedNpc: true,
    replayTwists: true,
    workScenes: true,
    advancedTravel: true,
    survivalMoments: true,
    voicePractice: true,
    dailyVoiceRepeatLimit: 'unlimited',
    deeperFeedback: true,
    weeklyProgressSummary: true,
  },
};

export const PLUS_BENEFITS_TR = [
  'Sınırsız sahne provası',
  'Kendi gerçek hayat sahneni oluştur',
  'Sesli cevap pratiği',
  'Daha zor NPC’ler ve replay twist’ler',
  'Work, travel ve social confidence sahneleri',
  'Kişisel gelişim hafızası',
];

export const PLUS_BENEFITS_EN = [
  'Unlimited scene rehearsal',
  'Create your own real-life scene',
  'Voice answer practice',
  'Harder NPCs and replay twists',
  'Work, travel, and social confidence scenes',
  'Personal progress memory',
];

export const PREMIUM_SCENE_PACKS = [
  {
    id: 'basic_travel',
    title: 'Basic Travel',
    plan: 'free',
    description: 'Low-pressure travel scenes for everyday movement.',
    scenes: ['Café order', 'Hotel check-in basic', 'Asking directions', 'Restaurant order'],
  },
  {
    id: 'advanced_travel',
    title: 'Advanced Travel',
    plan: 'plus',
    description: 'Real travel problems, pressure, and repair moments.',
    scenes: ['Wrong order correction', 'Payment issue', 'Missed train / platform confusion', 'Lost luggage', 'Hotel room not ready'],
  },
  {
    id: 'work_confidence',
    title: 'Work Confidence',
    plan: 'plus',
    description: 'Professional scenes for opinions, clarification, and disagreement.',
    scenes: ['Meeting small talk', 'Giving an opinion', 'Soft disagreement', 'Asking for clarification', 'Following up after meeting'],
  },
  {
    id: 'social_confidence',
    title: 'Social Confidence',
    plan: 'plus',
    description: 'Social repair and confidence scenes for real-life group moments.',
    scenes: ['Joining a group conversation', 'Politely declining an invitation', 'Fixing a misunderstanding', 'Making casual plans', 'Meeting someone new'],
  },
  {
    id: 'survival_moments',
    title: 'Survival Moments',
    plan: 'plus',
    description: 'High-pressure help, delay, pharmacy, and emergency moments.',
    scenes: ['Pharmacy problem', 'Emergency directions', 'Phone appointment', 'Travel delay', 'Help request under pressure'],
  },
] as const;

export const PLUS_GATE_COPY = {
  advancedTravel: 'Bu sahne gerçek seyahat problemlerini prova ettirir. Roleo Plus ile açılır.',
  workConfidence: 'Toplantı, fikir belirtme ve soft disagreement sahneleri Roleo Plus ile açılır.',
  socialConfidence: 'Grup sohbeti, yanlış anlaşılma düzeltme ve sosyal güven sahneleri Roleo Plus ile açılır.',
  survivalMoments: 'Baskı altında yardım isteme ve acil anları prova etmek Roleo Plus ile açılır.',
  customScene: 'Kendi gerçek hayat konuşmanı sahneye çevirmek için Roleo Plus gerekir.',
  memory: 'Roleo’nun önceki provalarını hatırlaması ve sana göre öneri üretmesi Plus ile açılır.',
  voice: 'Sesli cevap pratiği ve kendi cümleni söyleme adımı Roleo Plus ile açılır.',
  voiceLimit: 'Sesli prova Roleo Plus ile açılır.',
  voiceLimitEn: 'Voice rehearsal unlocks with Roleo Plus.',
  voiceCta: 'Sesli provayı sınırsız aç',
  voiceCtaEn: 'Unlock unlimited voice rehearsal',
  replayTwist: 'Aynı sahneyi farklı problemlerle tekrar prova etmek Roleo Plus ile açılır.',
  dailyLimit: 'Free planda günde 1 scene rehearsal hakkın var. Sınırsız prova Roleo Plus ile açılır.',
};

export const PLUS_SOFT_UPSELL = {
  title: 'Zorlandığın anları Roleo’nun hatırlamasını ister misin?',
  subtitle: 'Plus ile uzun süreli pratik hafızası ve kişisel öneriler açılır.',
};

export const APP_STORE_SCREENSHOT_COPY = {
  tr: [
    'Gerçek konuşmaları önceden prova et',
    'Kafede, otelde, toplantıda ne söyleyeceğini çalış',
    'AI karakterlerle gerçek hayat sahnelerine gir',
    'Zorlandığın anları Roleo hatırlar',
    'Kendi sahneni oluştur',
    'Sadece kelime değil, sosyal an pratiği',
  ],
  en: [
    'Rehearse real conversations before they happen',
    'Practice cafés, hotels, meetings, and daily moments',
    'Step into scenes with AI characters',
    'Roleo remembers where you struggled',
    'Create your own real-life scene',
    'Not just words. Practice the moment.',
  ],
};

export const isAdvancedTravelScenario = (scenario: Scenario) => {
  if (scenario.stageType !== 'travel') return false;
  const text = `${scenario.id} ${scenario.title} ${scenario.mission ?? ''} ${scenario.difficulty ?? ''} ${scenario.modeType ?? ''}`.toLowerCase();
  return scenario.difficulty === 'advanced'
    || scenario.modeType === 'survival'
    || /emergency|urgent|lost|delay|cancel|missed|luggage|platform|payment|wrong|hotel room|problem|complaint|hard/.test(text);
};

export const getScenarioPlusGateCopy = (scenario: Scenario) => {
  if (isAdvancedTravelScenario(scenario)) return PLUS_GATE_COPY.advancedTravel;
  if (scenario.stageType === 'business') return PLUS_GATE_COPY.workConfidence;
  if (scenario.stageType === 'survival') return PLUS_GATE_COPY.survivalMoments;
  if (scenario.stageType === 'social' && scenario.difficulty === 'advanced') return PLUS_GATE_COPY.socialConfidence;
  return PLUS_GATE_COPY.dailyLimit;
};
