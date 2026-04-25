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

// ─── Goal-based context injection ───────────────────────────────────────────
export type GoalId =
  | 'b2-speaking'
  | 'phrasal-verbs'
  | 'meeting-confidence'
  | 'pronunciation'
  | 'small-talk'
  | 'travel-survival'
  | 'service-clarity'
  | 'written-tone'
  | 'media-summarize'
  | 'reasoned-pushback'
  | 'register-shading'
  | 'specialist-niche'
  | 'irony-nuance'
  | 'hard-negotiation';

export type GoalContext = {
  /** Short label shown in prompts */
  label: string;
  /** Injected into the system prompt to shape NPC behaviour */
  toneInstruction: string;
  /** Difficulty hint appended to prompts */
  difficultyNote: string;
  /** Friendly NPC opening flavour override (appended) */
  flavourHint: string;
};

const GOAL_CONTEXTS: Record<GoalId, GoalContext> = {
  'b2-speaking': {
    label: 'B2 konuşma',
    toneInstruction:
      `The user is practising B2-level English. Use a natural, balanced register — not too formal, not too casual. ` +
      `Favour richer vocabulary and slightly longer turns to practise clearer real-life replies. Gently rephrase if the user makes a B1-level error.`,
    difficultyNote: `Aim for B2-level options: nuanced but not overly academic.`,
    flavourHint: '',
  },
  'phrasal-verbs': {
    label: 'Phrasal verb',
    toneInstruction:
      `The user wants to learn phrasal verbs naturally. Weave 1-2 common phrasal verbs into your NPC lines each turn ` +
      `(e.g. "Could you look into that?", "I'll sort it out"). ` +
      `In options, one of the "good" choices must use a phrasal verb correctly. Keep tone everyday and conversational.`,
    difficultyNote: `One "good" option must contain a natural phrasal verb.`,
    flavourHint: '',
  },
  'meeting-confidence': {
    label: 'İş toplantısı',
    toneInstruction:
      `This is a professional business context. Use formal, precise English — hedging phrases ("I'd suggest...", "From my perspective..."), ` +
      `meeting vocabulary ("agenda", "action item", "follow up"), and polite directness. ` +
      `Avoid slang entirely. The "awkward" option should sound inappropriately casual for a meeting.`,
    difficultyNote: `Options should reflect professional register differences, not just grammar.`,
    flavourHint: '',
  },
  pronunciation: {
    label: 'Telaffuz',
    toneInstruction:
      `The user wants to sound clearer. Keep NPC sentences short and well-enunciated. ` +
      `Occasionally, after the user's turn, the NPC can naturally echo back a corrected form ` +
      `("You mean 'comfortable', right? Sure, let's do that."). Options should include one with a tricky-to-pronounce word.`,
    difficultyNote: `One option per turn should feature a word commonly mispronounced by Turkish speakers (e.g. "comfortable", "particularly", "literally").`,
    flavourHint: '',
  },
  'small-talk': {
    label: 'Small talk',
    toneInstruction:
      `This is light social conversation — a chat at a party, waiting room, or coffee queue. ` +
      `Keep it warm, playful and breezy. Use contractions, filler phrases ("Yeah, totally!", "Oh wow, really?"), ` +
      `and end each NPC turn with a friendly question to keep the chat going. ` +
      `The "awkward" option should feel socially strange or too blunt for casual chat.`,
    difficultyNote: `Options should feel like real small-talk choices, not a grammar exercise.`,
    flavourHint: '',
  },
  'travel-survival': {
    label: 'Seyahat',
    toneInstruction:
      `This is a real-world travel situation — airport, hotel check-in, directions, or a restaurant abroad. ` +
      `Keep NPC lines practical and slightly urgent. Use travel-specific vocabulary ` +
      `("boarding gate", "check out", "reservation", "platform"). ` +
      `The "good" option should solve the immediate travel problem clearly and confidently.`,
    difficultyNote: `Prioritise practical travel phrases; options should feel high-stakes and realistic.`,
    flavourHint: '',
  },
  'service-clarity': {
    label: 'Mağaza / servis',
    toneInstruction:
      `The user is practising clear requests in shops, cafés, or customer service (returns, sizes, wrong order, directions to the counter). ` +
      `NPCs are staff or fellow customers. Keep turns short and transactional; one "good" option must be polite and unambiguous.`,
    difficultyNote: `Options contrast vague vs clear requests; reward specific details (item, time, receipt).`,
    flavourHint: '',
  },
  'written-tone': {
    label: 'Yazılı iş iletişimi',
    toneInstruction:
      `Frame scenes as workplace writing: Slack, email, or a quick note to a colleague. ` +
      `NPC reactions should reflect how the message lands (too blunt, too vague, or just right). ` +
      `When the user "speaks", treat it as the message they would send — coach register and brevity.`,
    difficultyNote: `One option should model concise professional English; another too casual or rambling.`,
    flavourHint: '',
  },
  'media-summarize': {
    label: 'Haber / özet',
    toneInstruction:
      `NPCs share a quick news-style snippet, a headline, or a fast spoken update. ` +
      `Ask the user to respond with the gist, main risk, or next step. Push slightly dense but realistic phrasing.`,
    difficultyNote: `Good options capture the core idea without copying every detail; bad options miss the main point.`,
    flavourHint: '',
  },
  'reasoned-pushback': {
    label: 'Tartışma / karşı görüş',
    toneInstruction:
      `This is a respectful disagreement — planning meeting, debate, or friend disagreeing on plans. ` +
      `NPC pushes back with a counter-argument. Reward calm, specific pushback ("I see your point, but…") and penalise hostile or vague replies.`,
    difficultyNote: `Options differ by tone and reasoning quality, not only grammar.`,
    flavourHint: '',
  },
  'register-shading': {
    label: 'C1 register',
    toneInstruction:
      `C1-level register control: the same NPC relationship shifts between warm peer chat, neutral professional, and careful diplomatic distance. ` +
      `User must match subtle cues (first names vs titles, contractions vs full forms, hedging density). Wrong options should be grammatically fine but socially "off".`,
    difficultyNote: `Distinguish options by register fit, not vocabulary size alone.`,
    flavourHint: '',
  },
  'specialist-niche': {
    label: 'Niş uzman sohbeti',
    toneInstruction:
      `Pick a narrow domain (e.g. audio engineering, urban planning permits, wine tasting notes, climbing gear). ` +
      `NPC speaks as a knowledgeable specialist with precise jargon and implicit assumptions. User must ask clarifying questions, challenge assumptions politely, or contribute accurately.`,
    difficultyNote: `Good options show domain-appropriate precision; bad ones are vague, wrong register, or hand-wavy.`,
    flavourHint: '',
  },
  'irony-nuance': {
    label: 'İroni / nüans',
    toneInstruction:
      `NPC uses dry humour, understatement, or gentle sarcasm common among fluent native speakers. ` +
      `Include lines that could be read straight or ironic depending on tone. User responses should show they caught (or missed) the nuance.`,
    difficultyNote: `One option must reflect correct interpretation of subtext; trap options take sarcasm literally or over-react.`,
    flavourHint: '',
  },
  'hard-negotiation': {
    label: 'Sert müzakere',
    toneInstruction:
      `High-stakes but civil negotiation: refund dispute, contract edge case, neighbour conflict, or salary band pushback. ` +
      `NPC is firm and tests boundaries. Reward firm, specific language without insults; penalise emotional venting or empty threats.`,
    difficultyNote: `Options differ by strategic phrasing and boundary-setting, not politeness clichés alone.`,
    flavourHint: '',
  },
};

export const getGoalContext = (goalId: string | undefined): GoalContext | null => {
  if (!goalId) return null;
  return GOAL_CONTEXTS[goalId as GoalId] ?? null;
};

export const pickPersonaVariation = (stageType: StageKey, turnSeed: number) => {
  const list = PERSONAS[stageType].variationPrompts;
  return list[turnSeed % list.length];
};

export const getCelebrationByLevel = (level: UserLevel) => {
  if (level === 'advanced' || level === 'fluent') return 'Doğal ve sahneye uygundu. Harika performans!';
  if (level === 'intermediate') return 'Çok iyi gidiyorsun. Akışı tuttun!';
  return 'Harika başlangıç. Her tur daha iyi oluyorsun!';
};
