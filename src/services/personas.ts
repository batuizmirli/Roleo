import { Scenario, UserLevel } from '../types';

type StageKey = NonNullable<Scenario['stageType']>;

export type StagePersona = {
  name: string;
  roleLabel: string;
  tone: string;
  rewardLine: string;
  variationPrompts: string[];
  naturalTip: string;
  nextStageHint: string;
};

const PERSONAS: Record<StageKey, StagePersona> = {
  cafe: {
    name: 'Leo',
    roleLabel: 'friendly waiter',
    tone: 'warm, fast, welcoming',
    rewardLine: 'Garson seni anladı ✅',
    variationPrompts: [
      'Ask one short follow-up question after every user response.',
      'Use short, realistic service phrases and keep tempo lively.',
      'Sound natural and conversational, not instructional.',
    ],
    naturalTip: '“Can I get…” kalıbı siparişte daha doğal duyulur.',
    nextStageHint: 'Travel Stage',
  },
  travel: {
    name: 'Nora',
    roleLabel: 'helpful local guide',
    tone: 'clear, directional, slightly urgent',
    rewardLine: 'Yolu buldun, panik kontrol altında 🧭',
    variationPrompts: [
      'Create urgency with one concise time-pressure detail.',
      'Give navigation clues step by step.',
      'Keep answers practical and focused on outcome.',
    ],
    naturalTip: 'Yol sorarken “Excuse me, how can I get to…?” çok işe yarar.',
    nextStageHint: 'Survival Stage',
  },
  business: {
    name: 'Marta',
    roleLabel: 'professional meeting partner',
    tone: 'polite, concise, goal-oriented',
    rewardLine: 'Toplantıda net ve güvenli göründün 💼',
    variationPrompts: [
      'Push for clarity with one follow-up about goals or deadlines.',
      'Keep language professional and concise.',
      'Reflect user statements and ask practical next-step questions.',
    ],
    naturalTip: 'Toplantıda “In my view…” ifadesi daha profesyonel durur.',
    nextStageHint: 'Story Stage',
  },
  social: {
    name: 'Sofia',
    roleLabel: 'friendly local friend',
    tone: 'casual, playful, supportive',
    rewardLine: 'Sohbet akışını çok iyi tuttun 🎉',
    variationPrompts: [
      'Keep it playful and add one social opener each turn.',
      'React with emotion and ask one personal follow-up.',
      'Prioritize natural chat flow over formal instruction.',
    ],
    naturalTip: 'Sohbette “That sounds great!” gibi kısa tepkiler akışı güçlendirir.',
    nextStageHint: 'Business Stage',
  },
  story: {
    name: 'Aria',
    roleLabel: 'interactive story narrator',
    tone: 'immersive, cinematic, encouraging',
    rewardLine: 'Hikayeyi akıtarak ilerlettin 📖',
    variationPrompts: [
      'Add one tiny story beat after each user response.',
      'Keep narrative immersive but concise.',
      'Ask choice-like follow-up prompts to keep momentum.',
    ],
    naturalTip: 'Hikaye akışında kısa bağlaçlar (“then”, “after that”) konuşmayı toparlar.',
    nextStageHint: 'Travel Stage',
  },
  survival: {
    name: 'Kai',
    roleLabel: 'calm crisis coach',
    tone: 'focused, urgent, confidence-building',
    rewardLine: 'Baskı altında doğru cümleyi buldun 🛟',
    variationPrompts: [
      'Keep urgency high but reassuring.',
      'Give compact alternatives if user gets stuck.',
      'Prioritize action phrases and quick clarification.',
    ],
    naturalTip: 'Acil durumda kısa cümle: “I need help, please.” en güvenli başlangıçtır.',
    nextStageHint: 'Challenge Stage',
  },
};

export const getPersonaByStage = (stageType: StageKey): StagePersona => PERSONAS[stageType];

export const pickPersonaVariation = (stageType: StageKey, turnSeed: number) => {
  const list = PERSONAS[stageType].variationPrompts;
  return list[turnSeed % list.length];
};

export const getCelebrationByLevel = (level: UserLevel) => {
  if (level === 'advanced') return 'Doğal ve akıcıydı. Harika performans!';
  if (level === 'intermediate') return 'Çok iyi gidiyorsun. Akışı tuttun!';
  return 'Harika başlangıç. Her tur daha iyi oluyorsun!';
};
