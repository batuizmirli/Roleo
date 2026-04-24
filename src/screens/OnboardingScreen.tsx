import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ImageBackground,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, UserGoal, UserProfile, UserLevel } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { defaultPracticeTarget, type PracticeTarget } from '../data/practiceGoals';
import PracticeFocusGoalCard from '../components/PracticeFocusGoalCard';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Images ────────────────────────────────────────────────────────────────
const IMG_CROWD    = require('../../assets/onboarding/crowd-conversation.jpg');
const IMG_TRAVEL   = require('../../assets/onboarding/travel-outcome.jpg');
const IMG_SOCIAL   = require('../../assets/onboarding/friends-social.jpg');
const IMG_CAFE     = require('../../assets/onboarding/cafe-order.jpg');
const IMG_MEETING  = require('../../assets/onboarding/meeting-confidence.jpg');

// ─── Data ──────────────────────────────────────────────────────────────────
const LEARNING_LANGUAGES: Language[] = [
  { code: 'es', name: 'Spanish',    flag: '🇪🇸' },
  { code: 'fr', name: 'French',     flag: '🇫🇷' },
  { code: 'de', name: 'German',     flag: '🇩🇪' },
  { code: 'it', name: 'Italian',    flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'en', name: 'English',    flag: '🇬🇧' },
];

const NATIVE_LANGUAGES: Language[] = [
  { code: 'tr', name: 'Türkçe',    flag: '🇹🇷' },
  { code: 'en', name: 'English',   flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch',   flag: '🇩🇪' },
  { code: 'fr', name: 'Français',  flag: '🇫🇷' },
  { code: 'es', name: 'Español',   flag: '🇪🇸' },
  { code: 'it', name: 'Italiano',  flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский',   flag: '🇷🇺' },
];

const GOALS: UserGoal[] = [
  { id: 'travel',  label: 'Travel',  emoji: '✈️', description: 'Navigate new cities with ease' },
  { id: 'work',    label: 'Work',    emoji: '💼', description: 'Speak up in meetings' },
  { id: 'culture', label: 'Culture', emoji: '🎭', description: 'Music, film, literature' },
  { id: 'love',    label: 'Social',  emoji: '❤️', description: 'Build real connections' },
  { id: 'exam',    label: 'Exam',    emoji: '📚', description: 'Get certified' },
];

// ─── Step config ───────────────────────────────────────────────────────────
type Step =
  | 'welcome'
  | 'level'
  | 'practiceFocus'
  | 'native'
  | 'language'
  | 'goal'
  | 'dailyGoal'
  | 'dream'
  | 'context'
  | 'emotion';
const STEPS: Step[] = ['welcome', 'level', 'native', 'practiceFocus', 'language', 'goal', 'dailyGoal', 'dream', 'context', 'emotion'];

const ACCENT = colors.primaryAccent;

type StepTheme = {
  image: any;
  overlay: [string, string, string];
  accent: string;
  label: string;
  headline: string;
  sub: string;
};

const THEMES: Record<Step, StepTheme> = {
  welcome: {
    image: IMG_TRAVEL,
    overlay: ['rgba(20,18,16,0.45)', 'rgba(20,18,16,0.72)', 'rgba(20,18,16,0.92)'],
    accent: ACCENT,
    label: 'Roleo',
    headline: 'Gerçek konuşmayı\nönce burada dene.',
    sub: 'Her gün bir gerçek hayat sahnesi: kısa hazırlık, oyun gibi prova, net geri bildirim.',
  },
  native: {
    image: IMG_CROWD,
    overlay: ['rgba(6,6,18,0.55)', 'rgba(6,6,18,0.78)', 'rgba(6,6,18,0.97)'],
    accent: ACCENT,
    label: 'Ana dilin',
    headline: 'Ana dilin\nhangisi?',
    sub: 'İpuçlarını ve açıklamaları bu dilde göstereceğiz.',
  },
  language: {
    image: IMG_TRAVEL,
    overlay: ['rgba(4,14,10,0.50)', 'rgba(4,14,10,0.78)', 'rgba(4,14,10,0.97)'],
    accent: ACCENT,
    label: 'Hedef dil',
    headline: 'Hangi dili\nkonuşmak istiyorsun?',
    sub: 'Bugünün sahnesini bu dilde oynayacaksın.',
  },
  level: {
    image: IMG_SOCIAL,
    overlay: ['rgba(18,5,10,0.50)', 'rgba(18,5,10,0.80)', 'rgba(18,5,10,0.97)'],
    accent: ACCENT,
    label: 'Seviye',
    headline: 'Şu anki seviyen\nnerede? 🎯',
    sub: 'Dersleri ve ipuçlarını seviyene göre kişiselleştirelim.',
  },
  practiceFocus: {
    image: IMG_MEETING,
    overlay: ['rgba(8,10,24,0.52)', 'rgba(8,10,24,0.82)', 'rgba(8,10,24,0.97)'],
    accent: ACCENT,
    label: 'Bugünün odağı',
    headline: 'Pratikte önceliğin\nne?',
    sub: 'Ayrı bir adım: hedefini seç; ardından öğreneceğin dili soracağız.',
  },
  goal: {
    image: IMG_SOCIAL,
    overlay: ['rgba(18,5,10,0.50)', 'rgba(18,5,10,0.80)', 'rgba(18,5,10,0.97)'],
    accent: ACCENT,
    label: 'Motivasyon',
    headline: 'Neden\nöğreniyorsun?',
    sub: 'Hedefin, bugünün sahnesini nasıl seçeceğimizi belirler.',
  },
  dailyGoal: {
    image: IMG_CAFE,
    overlay: ['rgba(4,10,22,0.52)', 'rgba(4,10,22,0.80)', 'rgba(4,10,22,0.97)'],
    accent: ACCENT,
    label: 'Günlük hedef',
    headline: 'Günlük\nkaç dakika?',
    sub: 'Her gün kısa prova, gerçek anlarda ne söyleyeceğini netleştirir.',
  },
  dream: {
    image: IMG_CAFE,
    overlay: ['rgba(4,10,22,0.52)', 'rgba(4,10,22,0.80)', 'rgba(4,10,22,0.97)'],
    accent: ACCENT,
    label: 'Hayalin',
    headline: 'Hayalindeki\nan.',
    sub: 'Hangi gerçek konuşma anına hazırlanmak istiyorsun?',
  },
  context: {
    image: IMG_CAFE,
    overlay: ['rgba(12,5,22,0.50)', 'rgba(12,5,22,0.80)', 'rgba(12,5,22,0.97)'],
    accent: ACCENT,
    label: 'Ortam',
    headline: 'Nerede,\nkiminle?',
    sub: 'Mekân ve karşıdaki kişiyi netleştir.',
  },
  emotion: {
    image: IMG_MEETING,
    overlay: ['rgba(20,12,4,0.50)', 'rgba(20,12,4,0.80)', 'rgba(20,12,4,0.97)'],
    accent: ACCENT,
    label: 'Duygu',
    headline: 'Nasıl\nhissetmek istersin?',
    sub: 'Her pratikte bu duyguyu hatırlatacağız.',
  },
};

// ─── Props ─────────────────────────────────────────────────────────────────
type Props = {
  onComplete: () => void;
  onTryQuickScene?: () => void;
  startAfterPreview?: boolean;
};

// ─── Component ─────────────────────────────────────────────────────────────
export default function OnboardingScreen({ onComplete, onTryQuickScene, startAfterPreview = false }: Props) {
  const steps = startAfterPreview
    ? (['goal', 'dailyGoal', 'dream', 'context', 'emotion'] as Step[])
    : STEPS;
  const defaultNative = NATIVE_LANGUAGES.find(l => l.code === 'tr') ?? NATIVE_LANGUAGES[0];
  const defaultLearningLang = LEARNING_LANGUAGES.find(l => l.code === 'en') ?? LEARNING_LANGUAGES[0];
  const [step, setStep] = useState<Step>(startAfterPreview ? 'goal' : 'welcome');
  const [selectedNative, setSelectedNative] = useState<Language | null>(startAfterPreview ? defaultNative : null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(startAfterPreview ? defaultLearningLang : null);
  const [selectedLevel, setSelectedLevel] = useState<UserLevel | null>(startAfterPreview ? 'beginner' : null);
  const [practiceTarget, setPracticeTarget] = useState<PracticeTarget | null>(startAfterPreview ? defaultPracticeTarget() : null);
  const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(20);
  const [dreamText, setDreamText] = useState('');
  const [contextText, setContextText] = useState('');
  const [emotionText, setEmotionText] = useState('');

  const fadeAnim   = useRef(new Animated.Value(1)).current;
  const slideAnim  = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentIdx = steps.indexOf(step);
  const theme = THEMES[step];

  // animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentIdx + 1) / steps.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [step, currentIdx, steps.length]);

  const transition = (nextStep: Step) => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -24, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleBack = () => {
    const prev = steps[currentIdx - 1];
    if (prev) transition(prev);
  };

  const handleNativeSelect = (lang: Language) => {
    setSelectedNative(lang);
  };

  const handleNativeContinue = () => {
    if (!selectedNative) {
      Alert.alert('Ana dilini seç', 'Devam etmek için listeden bir dil seç.');
      return;
    }
    transition('practiceFocus');
  };

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
    setTimeout(() => transition('goal'), 80);
  };

  const handleLevelSelect = (lvl: UserLevel) => {
    setSelectedLevel(lvl);
    setTimeout(() => transition('native'), 80);
  };

  const handlePracticeFocusContinue = () => {
    if (!practiceTarget) {
      Alert.alert('Bir hedef seç', 'Listeden bugünün odağını seçerek devam edebilirsin.');
      return;
    }
    transition('language');
  };

  const handleGoalSelect = (goal: UserGoal) => {
    setSelectedGoal(goal);
    setTimeout(() => transition('dailyGoal'), 80);
  };

  const handleDailyGoalPick = (mins: number) => {
    setDailyGoalMinutes(mins);
    setTimeout(() => transition('dream'), 220);
  };

  const handleDreamContinue = () => {
    if (!dreamText.trim()) { Alert.alert('Write your dream', 'Describe a moment that motivates you.'); return; }
    transition('context');
  };

  const handleContextContinue = () => {
    if (!contextText.trim()) { Alert.alert('Set the scene', 'Where are you and who are you talking to?'); return; }
    transition('emotion');
  };

  const handleEmotionContinue = async () => {
    if (!emotionText.trim()) { Alert.alert('Add the feeling', 'How do you want to feel?'); return; }
    const pt = practiceTarget ?? defaultPracticeTarget();
    const profile: UserProfile = {
      language: selectedLanguage!,
      nativeLanguage: selectedNative!,
      goal: selectedGoal!,
      goalDescription: pt.label,
      identity: {
        goal: dreamText.trim(),
        context: contextText.trim(),
        emotion: emotionText.trim(),
      },
      streak: 0,
      completedScenarios: [],
      xp: 0,
      level: selectedLevel ?? 'beginner',
      dailyGoalMinutes,
    };
    await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
    onComplete();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const TEXT_STEPS: Partial<Record<Step, { label: string; handler: () => void }>> = {
    welcome: { label: 'Başla', handler: () => transition('level') },
    native: { label: 'Devam Et', handler: handleNativeContinue },
    practiceFocus: { label: 'Devam Et', handler: handlePracticeFocusContinue },
    dream: { label: 'Devam Et', handler: handleDreamContinue },
    context: { label: 'Devam Et', handler: handleContextContinue },
    emotion: { label: "Roleo'ya Başla", handler: handleEmotionContinue },
  };

  const footerCta = TEXT_STEPS[step];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Bugünün odağı: foto filtresi yok, ortada mavi gradient ── */}
      {step === 'practiceFocus' ? (
        <LinearGradient
          colors={['#0c2744', '#1d4ed8', '#2563eb', '#1e3a8a', '#0f172a']}
          locations={[0, 0.28, 0.48, 0.72, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <ImageBackground source={theme.image} style={StyleSheet.absoluteFill} resizeMode="cover">
          <LinearGradient
            colors={theme.overlay}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      )}

      {/* ── Progress bar ── */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: theme.accent }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Top bar ── */}
          <View style={styles.topBar}>
            {currentIdx > 0 ? (
              <TouchableOpacity onPress={handleBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={[styles.backArrow, { color: theme.accent }]}>←</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 32 }} />
            )}
            <Text style={[styles.logoText, { color: theme.accent }]}>Roleo</Text>
            <Text style={styles.stepCounter}>{currentIdx + 1} / {steps.length}</Text>
          </View>

          {/* ── Step label / headline (Bugünün odağı kartında birleştirildi) ── */}
          {step !== 'practiceFocus' ? (
            <>
              <Text style={[styles.eyebrow, { color: theme.accent }]}>{theme.label}</Text>
              <Text style={styles.headline}>{theme.headline}</Text>
              <Text style={styles.subtitle}>{theme.sub}</Text>
            </>
          ) : null}

          {/* ── Step content ── */}
          {step === 'welcome' ? <WelcomeVisual accent={theme.accent} /> : null}
          {step === 'welcome' && !!onTryQuickScene && (
            <TouchableOpacity style={styles.quickTryBtn} onPress={onTryQuickScene} activeOpacity={0.86}>
              <Text style={styles.quickTryTitle}>Hızlı sahne dene (60 sn)</Text>
              <Text style={styles.quickTrySub}>Roleo'yu hemen hisset, sonra profilini tamamla.</Text>
            </TouchableOpacity>
          )}

          {step === 'level' && (
            <LevelStep selected={selectedLevel} onSelect={handleLevelSelect} accent={theme.accent} />
          )}

          {step === 'native' && (
            <NativeStep
              selected={selectedNative}
              onSelect={handleNativeSelect}
              accent={theme.accent}
            />
          )}

          {step === 'practiceFocus' && (
            <PracticeFocusGoalCard
              variant="onboarding"
              selected={practiceTarget}
              onSelect={setPracticeTarget}
              title="Bugünün odağı"
            />
          )}

          {step === 'language' && (
            <LanguageStep
              selected={selectedLanguage}
              excluded={selectedNative?.code}
              onSelect={handleLanguageSelect}
              accent={theme.accent}
            />
          )}

          {step === 'goal' && (
            <GoalStep
              selected={selectedGoal}
              language={selectedLanguage}
              onSelect={handleGoalSelect}
              accent={theme.accent}
            />
          )}

          {step === 'dailyGoal' && (
            <DailyGoalStep selectedMinutes={dailyGoalMinutes} onSelect={handleDailyGoalPick} accent={theme.accent} />
          )}

          {step === 'dream' && (
            <TextStep
              value={dreamText}
              onChange={setDreamText}
              hint={`e.g. "Ordering coffee in Barcelona, and the waiter smiles back."`}
              placeholder="Describe your dream moment..."
              accent={theme.accent}
            />
          )}

          {step === 'context' && (
            <TextStep
              value={contextText}
              onChange={setContextText}
              hint={`e.g. "A busy café in La Rambla — a waiter waiting for my order."`}
              placeholder="Where are you, who's there..."
              accent={theme.accent}
            />
          )}

          {step === 'emotion' && (
            <TextStep
              value={emotionText}
              onChange={setEmotionText}
              hint={`e.g. "Cool, relaxed, totally natural" — "Confident in the meeting"`}
              placeholder="Describe how that feels..."
              accent={theme.accent}
            />
          )}

        </Animated.View>
      </ScrollView>

      {/* ── Fixed bottom CTA (dream / context / emotion steps) ── */}
      {footerCta && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.ctaBtn,
              { backgroundColor: theme.accent },
              (step === 'native' && !selectedNative) || (step === 'practiceFocus' && !practiceTarget)
                ? { opacity: 0.45 }
                : null,
            ]}
            onPress={footerCta.handler}
            activeOpacity={0.85}
            disabled={
              (step === 'native' && !selectedNative) || (step === 'practiceFocus' && !practiceTarget)
            }
          >
            <Text style={styles.ctaText}>{footerCta.label}</Text>
          </TouchableOpacity>
        </View>
      )}

    </KeyboardAvoidingView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function WelcomeVisual({ accent }: { accent: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 20,
          backgroundColor: `${accent}28`,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: `${accent}55`,
        }}
      >
        <Text style={{ fontSize: 36 }}>🎭</Text>
      </View>
    </View>
  );
}

const LEVEL_OPTIONS: { id: UserLevel; emoji: string; title: string; sub: string }[] = [
  { id: 'beginner', emoji: '🌱', title: 'Başlangıç', sub: 'Yeni başlıyorum; temel kalıplar ve güven' },
  { id: 'intermediate', emoji: '🌿', title: 'Orta', sub: 'Temelleri biliyorum; akıcılığı güçlendiriyorum' },
  { id: 'advanced', emoji: '🌍', title: 'İleri', sub: 'Konuşmaya rahatım; hız ve nüans istiyorum' },
  { id: 'fluent', emoji: '🚀', title: 'Akıcı / Ustalık', sub: 'İnce ayar; native seviyeye yakın pratik' },
];

function LevelStep({
  selected,
  onSelect,
  accent,
}: {
  selected: UserLevel | null;
  onSelect: (lvl: UserLevel) => void;
  accent: string;
}) {
  return (
    <View style={subStyles.goalList}>
      {LEVEL_OPTIONS.map(opt => {
        const active = selected === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[subStyles.goalRow, active && { borderColor: accent, backgroundColor: `${accent}14` }]}
            onPress={() => onSelect(opt.id)}
            activeOpacity={0.7}
          >
            <Text style={subStyles.goalEmoji}>{opt.emoji}</Text>
            <View style={subStyles.goalTextWrap}>
              <Text style={[subStyles.goalLabel, active && { color: accent }]}>{opt.title}</Text>
              <Text style={subStyles.goalDesc}>{opt.sub}</Text>
            </View>
            <View style={[subStyles.goalCircle, active && { backgroundColor: accent, borderColor: accent }]}>
              {active ? <Text style={subStyles.goalCheck}>✓</Text> : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const MINUTE_CHOICES = [10, 20, 30, 60, 90] as const;

function DailyGoalStep({
  selectedMinutes,
  onSelect,
  accent,
}: {
  selectedMinutes: number;
  onSelect: (m: number) => void;
  accent: string;
}) {
  return (
    <View style={subStyles.dailyGrid}>
      {MINUTE_CHOICES.map(m => {
        const active = selectedMinutes === m;
        return (
          <TouchableOpacity
            key={m}
            style={[subStyles.dailyChip, active && { borderColor: accent, backgroundColor: `${accent}18` }]}
            onPress={() => onSelect(m)}
            activeOpacity={0.85}
          >
            <Text style={[subStyles.dailyChipTitle, active && { color: accent }]}>{m}</Text>
            <Text style={subStyles.dailyChipSub}>dakika</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function NativeStep({ selected, onSelect, accent }: {
  selected: Language | null;
  onSelect: (l: Language) => void;
  accent: string;
}) {
  return (
    <View style={subStyles.grid}>
      {NATIVE_LANGUAGES.map(lang => {
        const active = selected?.code === lang.code;
        return (
          <TouchableOpacity
            key={lang.code}
            style={[subStyles.langCard, active && { borderColor: accent, backgroundColor: `${accent}18` }]}
            onPress={() => onSelect(lang)}
            activeOpacity={0.7}
          >
            <Text style={subStyles.flag}>{lang.flag}</Text>
            <Text style={[subStyles.langName, active && { color: accent }]}>{lang.name}</Text>
            {active && <View style={[subStyles.activeDot, { backgroundColor: accent }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function LanguageStep({ selected, excluded, onSelect, accent }: {
  selected: Language | null;
  excluded?: string;
  onSelect: (l: Language) => void;
  accent: string;
}) {
  const langs = LEARNING_LANGUAGES.filter(l => l.code !== excluded);
  return (
    <View style={subStyles.langBigGrid}>
      {langs.map(lang => {
        const active = selected?.code === lang.code;
        return (
          <TouchableOpacity
            key={lang.code}
            style={[subStyles.langBigCard, active && { borderColor: accent, backgroundColor: `${accent}18` }]}
            onPress={() => onSelect(lang)}
            activeOpacity={0.7}
          >
            <Text style={subStyles.bigFlag}>{lang.flag}</Text>
            <Text style={[subStyles.bigLangName, active && { color: accent }]}>{lang.name}</Text>
            {active && <View style={[subStyles.checkBadge, { backgroundColor: accent }]}>
              <Text style={subStyles.checkMark}>✓</Text>
            </View>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function GoalStep({ selected, language, onSelect, accent }: {
  selected: UserGoal | null;
  language: Language | null;
  onSelect: (g: UserGoal) => void;
  accent: string;
}) {
  return (
    <View style={subStyles.goalList}>
      {language && (
        <View style={[subStyles.langPill, { borderColor: `${accent}60` }]}>
          <Text style={[subStyles.langPillText, { color: accent }]}>
            {language.flag} {language.name}
          </Text>
        </View>
      )}
      {GOALS.map(goal => {
        const active = selected?.id === goal.id;
        return (
          <TouchableOpacity
            key={goal.id}
            style={[subStyles.goalRow, active && { borderColor: accent, backgroundColor: `${accent}14` }]}
            onPress={() => onSelect(goal)}
            activeOpacity={0.7}
          >
            <Text style={subStyles.goalEmoji}>{goal.emoji}</Text>
            <View style={subStyles.goalTextWrap}>
              <Text style={[subStyles.goalLabel, active && { color: accent }]}>{goal.label}</Text>
              <Text style={subStyles.goalDesc}>{goal.description}</Text>
            </View>
            <View style={[subStyles.goalCircle, active && { backgroundColor: accent, borderColor: accent }]}>
              {active && <Text style={subStyles.goalCheck}>✓</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TextStep({ value, onChange, hint, placeholder, accent }: {
  value: string;
  onChange: (t: string) => void;
  hint: string;
  placeholder: string;
  accent: string;
}) {
  return (
    <View style={[subStyles.inputBox, { borderColor: `${accent}40` }]}>
      <Text style={subStyles.hintText}>{hint}</Text>
      <View style={[subStyles.divider, { backgroundColor: `${accent}30` }]} />
      <TextInput
        style={subStyles.textInput}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.25)"
        multiline
        numberOfLines={4}
        value={value}
        onChangeText={onChange}
        selectionColor={accent}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050508',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
    zIndex: 10,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 58,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  backArrow: {
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 30,
    width: 32,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    fontFamily: 'Poppins_700Bold',
  },
  stepCounter: {
    color: 'rgba(255,255,255,0.30)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    width: 42,
    textAlign: 'right',
  },
  eyebrow: {
    ...typography.lingua.caption,
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  headline: {
    ...typography.lingua.heading2,
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  subtitle: {
    ...typography.lingua.description,
    color: 'rgba(255,255,255,0.58)',
    marginBottom: 28,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  ctaBtn: {
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
    fontFamily: 'Poppins_600SemiBold',
  },
  quickTryBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  quickTryTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
  },
  quickTrySub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins_500Medium',
  },
});

const subStyles = StyleSheet.create({
  // Native / Language small grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  langCard: {
    width: (SCREEN_W - 58) / 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  flag: {
    fontSize: 22,
  },
  langName: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    position: 'absolute',
    top: 10,
    right: 10,
  },

  // Language big grid
  langBigGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  langBigCard: {
    width: (SCREEN_W - 60) / 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bigFlag: {
    fontSize: 40,
    marginBottom: 10,
  },
  bigLangName: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 15,
    fontWeight: '700',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Goal list
  goalList: {
    gap: 10,
  },
  dailyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  dailyChip: {
    width: (SCREEN_W - 60) / 2,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 18,
    alignItems: 'center',
  },
  dailyChipTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Poppins_700Bold',
  },
  dailyChipSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins_500Medium',
  },
  langPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  langPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  goalRow: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  goalEmoji: {
    fontSize: 26,
  },
  goalTextWrap: {
    flex: 1,
  },
  goalLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Poppins_600SemiBold',
  },
  goalDesc: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 12,
    fontWeight: '400',
  },
  goalCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  inputBox: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
  },
  hintText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    marginBottom: 14,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
    textAlignVertical: 'top',
    minHeight: 110,
  },
});
