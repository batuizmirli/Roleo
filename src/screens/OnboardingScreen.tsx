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
import { BlurView } from 'expo-blur';
import { Easing } from 'react-native';
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
  { id: 'travel',  label: 'Travel',  emoji: '✈️', description: 'Practice airport, hotel, and city moments' },
  { id: 'work',    label: 'Work',    emoji: '💼', description: 'Rehearse meetings and quick work replies' },
  { id: 'culture', label: 'Culture', emoji: '🎭', description: 'Talk about films, music, and local life' },
  { id: 'love',    label: 'Social',  emoji: '❤️', description: 'Prepare for casual, real conversations' },
  { id: 'exam',    label: 'Exam',    emoji: '📚', description: 'Turn study into practical scene practice' },
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

const ACCENT = colors.accentWarm;

// ─── Dream step — Turkish language names ──────────────────────────────────
const LANG_TR_NAMES: Record<string, string> = {
  es: 'İspanyolca',
  fr: 'Fransızca',
  de: 'Almanca',
  it: 'İtalyanca',
  pt: 'Portekizce',
  en: 'İngilizce',
};

// ─── Dream step — sahne-odaklı suggestion chip'leri (CLAUDE.md A10) ────────
const DREAM_SUGGESTIONS = [
  'Bir kafede sipariş vermek',
  'İş toplantısında konuşmak',
  'Şarkı sözlerini anlamak',
  'Maç yorumunu çözmek',
] as const;

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
    sub: 'Konuşmadan önce prova yap: kısa hazırlık, oyun gibi sahne, net geri bildirim.',
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
    sub: 'Sahnelerdeki cevap seçeneklerini ve ipuçlarını seviyene göre ayarlayalım.',
  },
  practiceFocus: {
    image: IMG_MEETING,
    overlay: ['rgba(8,10,24,0.52)', 'rgba(8,10,24,0.82)', 'rgba(8,10,24,0.97)'],
    accent: ACCENT,
    label: 'Bugünün odağı',
    headline: 'Pratikte önceliğin\nne?',
    sub: 'Bugün hangi gerçek konuşma anına hazırlanmak istediğini seç.',
  },
  goal: {
    image: IMG_SOCIAL,
    overlay: ['rgba(18,5,10,0.50)', 'rgba(18,5,10,0.80)', 'rgba(18,5,10,0.97)'],
    accent: ACCENT,
    label: 'Motivasyon',
    headline: 'Hangi anı\nprova ediyorsun?',
    sub: 'Hedefin, Roleo’da hangi anları prova edeceğini belirler.',
  },
  dailyGoal: {
    image: IMG_CAFE,
    overlay: ['rgba(4,10,22,0.52)', 'rgba(4,10,22,0.80)', 'rgba(4,10,22,0.97)'],
    accent: ACCENT,
    label: 'Günlük hedef',
    headline: 'Günlük\nkaç dakika?',
    sub: 'Her gün kısa bir sahne, gerçek anda ne söyleyeceğini netleştirir.',
  },
  dream: {
    image: IMG_CAFE,
    overlay: ['rgba(4,10,22,0.52)', 'rgba(4,10,22,0.80)', 'rgba(4,10,22,0.97)'],
    accent: ACCENT,
    label: 'Hayalin',
    headline: 'Hayalindeki\nan.',
    sub: 'Hangi konuşma anını Roleo’da önceden denemek istiyorsun?',
  },
  context: {
    image: IMG_CAFE,
    overlay: ['rgba(12,5,22,0.50)', 'rgba(12,5,22,0.80)', 'rgba(12,5,22,0.97)'],
    accent: ACCENT,
    label: 'Ortam',
    headline: 'Nerede,\nkiminle?',
    sub: 'Prova etmek istediğin sahneyi ve karşındaki kişiyi netleştir.',
  },
  emotion: {
    image: IMG_MEETING,
    overlay: ['rgba(20,12,4,0.50)', 'rgba(20,12,4,0.80)', 'rgba(20,12,4,0.97)'],
    accent: ACCENT,
    label: 'Duygu',
    headline: 'Nasıl\nhissetmek istersin?',
    sub: 'Her sahnede bu hissi hedefleyip cevabını ona göre seçeceksin.',
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
    // 'dream' step CTA is handled by DreamStepScreen
    context: { label: 'Devam Et', handler: handleContextContinue },
    emotion: { label: "Roleo'ya Başla", handler: handleEmotionContinue },
  };

  const footerCta = TEXT_STEPS[step];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Dream step renders its own full-screen editorial layout ── */}
      {step === 'dream' ? (
        <DreamStepScreen
          value={dreamText}
          onChange={setDreamText}
          onContinue={handleDreamContinue}
          onBack={handleBack}
          selectedLanguage={selectedLanguage}
        />
      ) : (
        <>
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
              <Text style={styles.quickTrySub}>Gerçek bir konuşma anını hemen prova et, sonra profilini tamamla.</Text>
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

          {step === 'context' && (
            <TextStep
              value={contextText}
              onChange={setContextText}
              hint={`e.g. "A busy café in La Rambla — a waiter waiting for my order."`}
              placeholder="Where are you, and who are you replying to..."
              accent={theme.accent}
            />
          )}

          {step === 'emotion' && (
            <TextStep
              value={emotionText}
              onChange={setEmotionText}
              hint={`e.g. "Calm enough to choose the right reply" — "Clear in the meeting"`}
              placeholder="How do you want to feel in that conversation..."
              accent={theme.accent}
            />
          )}

        </Animated.View>
      </ScrollView>

      {/* ── Fixed bottom CTA (welcome / native / practiceFocus / context / emotion steps) ── */}
      {footerCta && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.ctaBtn,
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
        </>
      )}

    </KeyboardAvoidingView>
  );
}

// ─── DreamStepScreen — Editorial "A" variant ──────────────────────────────

type DreamStepScreenProps = {
  value: string;
  onChange: (t: string) => void;
  onContinue: () => void;
  onBack: () => void;
  selectedLanguage: Language | null;
};

function DreamStepScreen({
  value,
  onChange,
  onContinue,
  onBack,
  selectedLanguage,
}: DreamStepScreenProps) {
  const langName = selectedLanguage
    ? (LANG_TR_NAMES[selectedLanguage.code] ?? selectedLanguage.name)
    : 'İspanyolca';

  // ── Stagger entrance — RN Animated (Reanimated yerine) ──
  const eyebrowAv  = useRef(new Animated.Value(0)).current;
  const titleAv    = useRef(new Animated.Value(0)).current;
  const subtitleAv = useRef(new Animated.Value(0)).current;
  const inputAv    = useRef(new Animated.Value(0)).current;
  const chipsAv    = useRef(new Animated.Value(0)).current;
  const ctaAv      = useRef(new Animated.Value(0)).current;
  // Progress bar slide: translateX(-100% → 0), mockup cubic-bezier(0.65,0,0.35,1)
  const barFillAv  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const E = Easing.bezier(0.25, 0.1, 0.25, 1);
    const Emech = Easing.bezier(0.65, 0, 0.35, 1);
    const stagger = (av: Animated.Value, delay: number, duration: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(av, { toValue: 1, duration, easing: E, useNativeDriver: true }),
      ]);
    Animated.parallel([
      // Progress bar slides in immediately
      Animated.timing(barFillAv, { toValue: 1, duration: 1400, easing: Emech, useNativeDriver: true }),
      stagger(eyebrowAv,  200, 700),
      stagger(titleAv,    400, 800),
      stagger(subtitleAv, 600, 800),
      stagger(inputAv,    800, 800),
      stagger(chipsAv,   1000, 800),
      stagger(ctaAv,     1200, 800),
    ]).start();
  }, []);

  // ── Animated styles ──
  const eyebrowAnimStyle = {
    opacity: eyebrowAv,
    transform: [{ translateY: eyebrowAv.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };
  const titleAnimStyle = {
    opacity: titleAv,
    transform: [{ translateY: titleAv.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };
  const subtitleAnimStyle = {
    opacity: subtitleAv,
    transform: [{ translateY: subtitleAv.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };
  const inputAnimStyle = {
    opacity: inputAv,
    transform: [{ translateY: inputAv.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };
  const chipsAnimStyle = {
    opacity: chipsAv,
    transform: [{ translateY: chipsAv.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };
  const ctaAnimStyle = {
    opacity: ctaAv,
    transform: [{ translateY: ctaAv.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };

  const charCount = value.length;

  return (
    <View style={dreamStyles.root}>
      {/* ── Atmospheric layers ── */}
      {/* Warm glow — top right (hayal) */}
      <View style={dreamStyles.glowWarm} />
      {/* Cool glow — bottom left (mevcut hal) */}
      <View style={dreamStyles.glowCool} />
      {/* Grain overlay (4% — film feel; requires grain asset for full effect) */}
      <View style={dreamStyles.grainOverlay} />

      {/* ── Progress row ── */}
      <View style={dreamStyles.progressRow}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={dreamStyles.backBtn}
        >
          <Text style={dreamStyles.backArrowText}>←</Text>
        </TouchableOpacity>
        <View style={dreamStyles.progressBars}>
          {/* 4 segment bars — represent identity phase (dream / context / emotion + completion) */}
          {([0, 1, 2, 3] as const).map(i => (
            <View key={i} style={dreamStyles.progressBarTrack}>
              {i === 0 && (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      transform: [{
                        translateX: barFillAv.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-200, 0],
                        }),
                      }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[colors.accentWarmSoft, colors.accentWarm]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              )}
            </View>
          ))}
        </View>
        <Text style={dreamStyles.stepLabel}>01 / 04</Text>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={dreamStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Eyebrow */}
        <Animated.View style={eyebrowAnimStyle}>
          <Text style={dreamStyles.eyebrow}>İLK ADIM</Text>
        </Animated.View>

        {/* Title — dynamic language name in italic accent */}
        <Animated.View style={titleAnimStyle}>
          <Text style={dreamStyles.title}>
            {'Bir gün '}
            <Text style={dreamStyles.titleAccent}>{langName}</Text>
            {' konuştuğunda\nnerede olmak istersin?'}
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={subtitleAnimStyle}>
          <Text style={dreamStyles.subtitle}>
            Hayalini yaz. Bir cümle, bir sahne, bir an. Roleo bütün öğrenme yolculuğunu bu cevap üzerine kuracak.
          </Text>
        </Animated.View>

        {/* Input card — frosted glass */}
        <Animated.View style={inputAnimStyle}>
          <BlurView intensity={20} tint="dark" style={dreamStyles.inputCard}>
            {/* Gradient tint over blur */}
            <LinearGradient
              colors={['rgba(26,34,48,0.6)', 'rgba(18,24,34,0.4)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Top shimmer line */}
            <LinearGradient
              colors={['transparent', 'rgba(232,181,118,0.25)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={dreamStyles.inputTopLine}
            />
            <TextInput
              style={dreamStyles.textInput}
              placeholder="Mesela — Barcelona'da bir kafede oturuyorum, garsona kahvemi İspanyolca söylüyorum…"
              placeholderTextColor={colors.inkTertiary}
              multiline
              numberOfLines={4}
              value={value}
              onChangeText={onChange}
              selectionColor={colors.accentWarm}
              textAlignVertical="top"
            />
            {/* Meta row */}
            <View style={dreamStyles.inputMeta}>
              <View style={dreamStyles.inputHint}>
                <Text style={dreamStyles.inputHintIcon}>✦</Text>
                <Text style={dreamStyles.inputHintText}>Ne kadar somut, o kadar iyi</Text>
              </View>
              <Text style={dreamStyles.charCount}>{charCount} / 280</Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* Suggestion chips */}
        <Animated.View style={chipsAnimStyle}>
          <Text style={dreamStyles.suggestionsLabel}>Başlangıç için</Text>
          <View style={dreamStyles.chipRow}>
            {DREAM_SUGGESTIONS.map(chip => (
              <TouchableOpacity
                key={chip}
                style={dreamStyles.chip}
                onPress={() => onChange(chip)}
                activeOpacity={0.7}
              >
                <Text style={dreamStyles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Footer CTA ── */}
      <Animated.View style={[dreamStyles.footer, ctaAnimStyle]}>
        <TouchableOpacity
          style={dreamStyles.ctaButton}
          onPress={onContinue}
          activeOpacity={0.85}
        >
          <Text style={dreamStyles.ctaButtonText}>Devam et</Text>
          <Text style={dreamStyles.ctaArrow}>→</Text>
        </TouchableOpacity>
        <Text style={dreamStyles.footerMeta}>
          Henüz emin değilsen — birkaç kelime yeterli
        </Text>
      </Animated.View>
    </View>
  );
}

// ─── Dream step styles ─────────────────────────────────────────────────────
const dreamStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  // Glow blobs — CSS filter:blur approximation via shadow on iOS
  glowWarm: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(232, 181, 118, 0.10)',
    top: -120,
    right: -100,
    shadowColor: '#E8B576',
    shadowOpacity: 0.22,
    shadowRadius: 80,
    shadowOffset: { width: 0, height: 0 },
  },
  glowCool: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(95, 124, 168, 0.10)',
    bottom: -80,
    left: -80,
    shadowColor: '#5F7CA8',
    shadowOpacity: 0.18,
    shadowRadius: 80,
    shadowOffset: { width: 0, height: 0 },
  },
  // Grain overlay — subtle film texture (4% opacity; add a grain PNG asset for full effect)
  grainOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.04,
    // backgroundColor as placeholder; replace with grain Image asset for full effect
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 62 : 40,
    paddingHorizontal: 28,
    marginBottom: 40,
  },
  backBtn: {
    marginRight: 14,
  },
  backArrowText: {
    color: colors.inkTertiary,
    fontSize: 20,
    fontFamily: 'InterTight_400Regular',
  },
  progressBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  progressBarTrack: {
    flex: 1,
    height: 2,
    backgroundColor: colors.hairlineStrong,
    borderRadius: 1,
    overflow: 'hidden',
  },
  stepLabel: {
    marginLeft: 14,
    fontSize: 11,
    color: colors.inkTertiary,
    letterSpacing: 1.5,
    fontFamily: 'InterTight_500Medium',
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingBottom: 32,
  },
  eyebrow: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 10,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    color: colors.accentWarm,
    marginBottom: 22,
  },
  title: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 36,
    lineHeight: 43,
    letterSpacing: -0.7,
    color: colors.inkPrimary,
    marginBottom: 14,
  },
  titleAccent: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 36,
    lineHeight: 43,
    letterSpacing: -0.7,
    color: colors.accentWarm,
  },
  subtitle: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkSecondary,
    marginBottom: 28,
  },
  inputCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  inputTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.6,
  },
  textInput: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 17,
    lineHeight: 26,
    color: colors.inkPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
  },
  inputMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  inputHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputHintIcon: {
    fontSize: 11,
    color: colors.accentWarmSoft,
  },
  inputHintText: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 11,
    color: colors.inkTertiary,
  },
  charCount: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 11,
    color: colors.inkTertiary,
  },
  suggestionsLabel: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.inkTertiary,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  chipText: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 12.5,
    color: colors.inkSecondary,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    paddingTop: 16,
  },
  ctaButton: {
    backgroundColor: colors.inkPrimary,
    borderRadius: 999,
    paddingVertical: 17,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaButtonText: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.15,
    color: colors.bgDeep,
  },
  ctaArrow: {
    fontSize: 15,
    color: colors.bgDeep,
    fontFamily: 'InterTight_600SemiBold',
  },
  footerMeta: {
    textAlign: 'center',
    marginTop: 14,
    fontFamily: 'InterTight_400Regular',
    fontSize: 11,
    color: colors.inkTertiary,
    letterSpacing: 0.5,
  },
});

// ─── Sub-components ────────────────────────────────────────────────────────

function WelcomeVisual({ accent }: { accent: string }) {
  return (
    <View style={{ paddingVertical: 12, gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, height: 2, backgroundColor: `${accent}40`, borderRadius: 1 }} />
        <View style={{ flex: 2, height: 2, backgroundColor: accent, borderRadius: 1 }} />
        <View style={{ flex: 1, height: 2, backgroundColor: `${accent}40`, borderRadius: 1 }} />
      </View>
    </View>
  );
}

const LEVEL_OPTIONS: { id: UserLevel; emoji: string; title: string; sub: string }[] = [
  { id: 'beginner', emoji: '🌱', title: 'Başlangıç', sub: 'Temel kalıplarla sahneye güvenli başla' },
  { id: 'intermediate', emoji: '🌿', title: 'Orta', sub: 'Cevaplarını daha doğal ve net seç' },
  { id: 'advanced', emoji: '🌍', title: 'İleri', sub: 'Baskı altında ton ve nüans çalış' },
  { id: 'fluent', emoji: '🚀', title: 'Rahat konuşan', sub: 'Zor sahnelerde daha temiz akış prova et' },
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
      <View style={[subStyles.divider, { backgroundColor: colors.hairline }]} />
      <TextInput
        style={subStyles.textInput}
        placeholder={placeholder}
        placeholderTextColor={colors.inkTertiary}
        multiline
        numberOfLines={4}
        value={value}
        onChangeText={onChange}
        selectionColor={colors.accentWarm}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.hairlineStrong,
    zIndex: 10,
  },
  progressFill: {
    height: 2,
    borderRadius: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 58,
    paddingBottom: 156,
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  backArrow: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 22,
    lineHeight: 30,
    color: colors.inkTertiary,
    width: 32,
  },
  logoText: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 20,
    letterSpacing: -0.3,
    color: colors.accentWarm,
  },
  stepCounter: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.inkTertiary,
    width: 42,
    textAlign: 'right',
  },
  eyebrow: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 10,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    color: colors.accentWarm,
    marginBottom: 10,
  },
  headline: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: colors.inkPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkSecondary,
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
    borderRadius: 999,
    paddingVertical: 17,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: colors.inkPrimary,
  },
  ctaText: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.15,
    color: colors.bgDeep,
  },
  quickTryBtn: {
    marginTop: 12,
    backgroundColor: colors.bgSoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  quickTryTitle: {
    fontFamily: 'InterTight_600SemiBold',
    color: colors.inkPrimary,
    fontSize: 14,
    marginBottom: 4,
  },
  quickTrySub: {
    fontFamily: 'InterTight_400Regular',
    color: colors.inkSecondary,
    fontSize: 12,
    lineHeight: 18,
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
    backgroundColor: colors.bgMid,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingVertical: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  flag: {
    fontSize: 0,
    width: 0,
  },
  langName: {
    fontFamily: 'InterTight_500Medium',
    color: colors.inkSecondary,
    fontSize: 14,
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
    backgroundColor: colors.bgMid,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingVertical: 26,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bigFlag: {
    fontSize: 0,
    height: 0,
  },
  bigLangName: {
    fontFamily: 'InterTight_500Medium',
    color: colors.inkSecondary,
    fontSize: 15,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontFamily: 'InterTight_600SemiBold',
    color: colors.bgDeep,
    fontSize: 11,
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.bgMid,
    paddingVertical: 20,
    alignItems: 'center',
  },
  dailyChipTitle: {
    fontFamily: 'Fraunces_300Light',
    color: colors.inkPrimary,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  dailyChipSub: {
    fontFamily: 'InterTight_400Regular',
    color: colors.inkTertiary,
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  langPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  langPillText: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 12,
  },
  goalRow: {
    backgroundColor: colors.bgMid,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  goalEmoji: {
    fontSize: 22,
  },
  goalTextWrap: {
    flex: 1,
  },
  goalLabel: {
    fontFamily: 'InterTight_500Medium',
    color: colors.inkPrimary,
    fontSize: 15,
    marginBottom: 2,
  },
  goalDesc: {
    fontFamily: 'InterTight_400Regular',
    color: colors.inkTertiary,
    fontSize: 12,
    lineHeight: 18,
  },
  goalCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCheck: {
    fontFamily: 'InterTight_600SemiBold',
    color: colors.bgDeep,
    fontSize: 11,
  },

  inputBox: {
    backgroundColor: colors.bgMid,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    padding: 20,
  },
  hintText: {
    fontFamily: 'Fraunces_300Light_Italic',
    color: colors.inkTertiary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    marginBottom: 14,
    backgroundColor: colors.hairline,
  },
  textInput: {
    fontFamily: 'InterTight_400Regular',
    color: colors.inkPrimary,
    fontSize: 15,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 110,
  },
});
