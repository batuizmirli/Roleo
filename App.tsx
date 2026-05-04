import React, { useState, useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ExpoLinking from 'expo-linking';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Fraunces_300Light } from '@expo-google-fonts/fraunces/300Light';
import { Fraunces_300Light_Italic } from '@expo-google-fonts/fraunces/300Light_Italic';
import { InterTight_400Regular } from '@expo-google-fonts/inter-tight/400Regular';
import { InterTight_500Medium } from '@expo-google-fonts/inter-tight/500Medium';
import { InterTight_600SemiBold } from '@expo-google-fonts/inter-tight/600SemiBold';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FriendChallengeTarget, Scenario, StageResult } from './src/types';
import OnboardingScreen from './src/screens/OnboardingScreen';
import RoleoIntroScreen from './src/screens/RoleoIntroScreen';
import StartupLanguageScreen from './src/screens/StartupLanguageScreen';
import HomeScreen from './src/screens/HomeScreen';
import LearnHubScreen from './src/screens/LearnHubScreen';
import PracticeHubScreen from './src/screens/PracticeHubScreen';
import ProfileHubScreen from './src/screens/ProfileHubScreen';
import BottomTabBar, { type MainTabId } from './src/components/BottomTabBar';
import ScenariosScreen from './src/screens/ScenariosScreen';
import ScenarioScreen from './src/screens/ScenarioScreen';
import VocabScreen from './src/screens/VocabScreen';
import GrammarScreen from './src/screens/GrammarScreen';
import QuizScreen from './src/screens/QuizScreen';
import QuotesScreen from './src/screens/QuotesScreen';
import StageResultScreen from './src/screens/StageResultScreen';
import FirstSessionReadyScreen from './src/screens/FirstSessionReadyScreen';
import FirstSessionNextScreen from './src/screens/FirstSessionNextScreen';
import DebugPanelScreen from './src/screens/DebugPanelScreen';
import InstantLearnScreen from './src/screens/InstantLearnScreen';
import PronunciationScreen from './src/screens/PronunciationScreen';
import ListeningScreen from './src/screens/ListeningScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import AccountScreen from './src/screens/AccountScreen';
import JournalScreen from './src/screens/JournalScreen';
import StripeHomeScreen from './src/screens/StripeHomeScreen';
import TravelHomeScreen from './src/screens/TravelHomeScreen';
import FlashPickScreen from './src/screens/FlashPickScreen';
import TrueOrFakeScreen from './src/screens/TrueOrFakeScreen';
import RunResultScreen from './src/screens/RunResultScreen';
import ScenarioPrepModal from './src/components/ScenarioPrepModal';
import RoleoPlusPaywall from './src/components/RoleoPlusPaywall';
import { ModuleResult, UserProfile } from './src/types';
import { getFirstSessionScenario, getTodaysMissionScenario, getPersonalizedScenario, scenarios } from './src/data/scenarios';
import { getProgress, completeStage } from './src/services/progress';
import { getDailyRunSnapshot, saveDailyRunSnapshot, type DailyRunSnapshot } from './src/services/runHook';
import { saveSceneSession } from './src/services/sessionMemory';
import {
  getSceneLimitState,
  markPostValuePaywallSeen,
  recordSceneRehearsalUse,
  setMockSubscriptionPlan,
  shouldShowPostValuePaywall,
  type SceneLimitState,
} from './src/services/subscription';
import { trackEvent } from './src/services/telemetry';
import type { SceneFlowPath } from './src/types';
import { computeChallengeOutcome, parseChallengeLink } from './src/services/challengeShare';
import { colors } from './src/theme/colors';
import { createTranslator, getUiLanguageFromProfile } from './src/i18n';
import { getScenarioPlusGateCopy, isAdvancedTravelScenario, PLUS_GATE_COPY } from './src/data/plus';

type Screen =
  | 'intro'
  | 'onboarding'
  | 'startup-language'
  | 'home'
  | 'learn-hub'
  | 'practice-hub'
  | 'profile-hub'
  | 'scenarios'
  | 'scenario'
  | 'vocab'
  | 'grammar'
  | 'quiz'
  | 'stories'
  | 'stage-result'
  | 'first-session-ready'
  | 'first-session-next'
  | 'instant-learn'
  | 'pronunciation'
  | 'flash-pick'
  | 'true-or-fake'
  | 'progress'
  | 'account'
  | 'journal'
  | 'listening'
  | 'debug'
  | 'stripe-home'
  | 'travel-home';

export default function App() {
  type RunState = 'idle' | 'briefing' | 'flash' | 'truefake' | 'scene' | 'complete';

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Fraunces_300Light,
    Fraunces_300Light_Italic,
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
  });

  const [screen, setScreen] = useState<Screen>('onboarding');
  const [runState, setRunState] = useState<RunState>('idle');
  const [runResults, setRunResults] = useState<ModuleResult[]>([]);
  const [runScenario, setRunScenario] = useState<Scenario | null>(null);
  const [runGoalId, setRunGoalId] = useState<string | undefined>(undefined);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [stageResult, setStageResult] = useState<StageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [runType, setRunType] = useState<'normal' | 'first' | 'daily-mission' | 'onboarding-preview'>('normal');
  const [onboardingAfterPreview, setOnboardingAfterPreview] = useState(false);
  const [showPrepModal, setShowPrepModal] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string | undefined>(undefined);
  const [paywallContext, setPaywallContext] = useState<'default' | 'post_value'>('default');
  const [sceneLimit, setSceneLimit] = useState<SceneLimitState | null>(null);
  const [prepBonus, setPrepBonus] = useState(0);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [currentPlayCount, setCurrentPlayCount] = useState(0);
  const [firstSessionScenario, setFirstSessionScenario] = useState<Scenario | null>(null);
  const [dailyRunBoard, setDailyRunBoard] = useState<{
    prev: DailyRunSnapshot | null;
    overallAccuracy: number;
    maxCombo: number;
    sceneAccuracy: number;
    sceneFlow?: SceneFlowPath;
  } | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<FriendChallengeTarget | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const runBriefingExitAnim = useRef(new Animated.Value(1)).current;
  const SW = Dimensions.get('window').width;
  /** Grammar ekranına hangi ekrandan girildiğini ayırt etmek için. */
  const grammarEntryRef = useRef<'home' | 'learn-hub' | 'practice-hub' | 'profile-hub' | 'stage-result'>('stage-result');
  /** Mini oyun / araç ekranlarından geri dönüş hedefi (mevcut ekran anlık kopyası). */
  const toolReturnScreenRef = useRef<Screen>('home');
  const scenariosReturnRef = useRef<Screen>('practice-hub');
  const progressReturnRef = useRef<Screen>('profile-hub');
  const dailyMissionReturnRef = useRef<'home' | 'practice-hub'>('home');
  const dailyRunExitRef = useRef<'home' | 'practice-hub'>('practice-hub');
  const t = createTranslator(getUiLanguageFromProfile(currentProfile));

  const refreshSceneLimit = async () => {
    const next = await getSceneLimitState();
    setSceneLimit(next);
    return next;
  };

  const openPaywall = async (reason?: string, context: 'default' | 'post_value' = 'default') => {
    const next = await refreshSceneLimit();
    setPaywallReason(reason);
    setPaywallContext(context);
    setSceneLimit(next);
    setPaywallVisible(true);
  };

  const closePaywall = () => {
    setPaywallVisible(false);
    setPaywallReason(undefined);
    setPaywallContext('default');
  };

  const upgradeMockPlan = async () => {
    await setMockSubscriptionPlan('plus');
    await refreshSceneLimit();
    closePaywall();
    await trackEvent('plus_mock_upgrade_selected', { source: 'paywall' });
  };

  const ensureCanStartScene = async (reason = PLUS_GATE_COPY.dailyLimit) => {
    const limit = await refreshSceneLimit();
    if (limit.canStartScene) return true;
    await openPaywall(reason);
    await trackEvent('paywall_shown', { source: 'scene_limit', usedToday: limit.usedToday });
    return false;
  };

  const enterScenario = async (reason?: string) => {
    const allowed = await ensureCanStartScene(reason);
    if (!allowed) return;
    goTo('scenario');
  };

  const requiresPlusPack = (scenario: Scenario) => {
    const stageType = scenario.stageType ?? '';
    if (stageType === 'business' || stageType === 'survival') return true;
    if (stageType !== 'travel') return false;
    return isAdvancedTravelScenario(scenario);
  };

  const plusPackReasonFor = (scenario: Scenario) => getScenarioPlusGateCopy(scenario);

  const ensurePremiumFeature = async (reason: string) => {
    const limit = await refreshSceneLimit();
    if (limit.isPremium) return true;
    await openPaywall(reason);
    await trackEvent('paywall_shown', { source: 'premium_feature' });
    return false;
  };

  const openPremiumTool = async (tool: Screen, reason: string) => {
    const allowed = await ensurePremiumFeature(reason);
    if (!allowed) return;
    openToolScreen(tool);
  };

  const revealPostValuePaywallIfNeeded = async () => {
    if (!(await shouldShowPostValuePaywall())) return;
    await markPostValuePaywallSeen();
    await openPaywall(undefined, 'post_value');
    await trackEvent('paywall_shown', { source: 'post_first_value' });
  };

  useEffect(() => {
    const bootstrap = async () => {
      await refreshSceneLimit();
      const p = await AsyncStorage.getItem('userProfile');
      if (!p) {
        setScreen('intro');
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(p);
        setCurrentProfile(parsed);
        setScreen('home');
      } catch {
        await AsyncStorage.removeItem('userProfile');
        setScreen('intro');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    const openFromUrl = async (url: string) => {
      const challenge = parseChallengeLink(url);
      if (!challenge) return;
      const scenario = scenarios.find(s => s.id === challenge.scenarioId);
      if (!scenario) return;

      const progress = await getProgress();
      setCurrentPlayCount(progress.scenarioPlayCounts?.[scenario.id] ?? 0);
      setSelectedScenario(scenario);
      setRunType('normal');
      setActiveChallenge(challenge);
      await enterScenario('Arkadaş challenge sahneleri günlük free rehearsal hakkını kullanır. Sınırsız challenge provası Roleo Plus ile açılır.');
      void trackEvent('friend_challenge_opened', {
        scenarioId: challenge.scenarioId,
        challenger: challenge.challengerName,
      });
    };

    ExpoLinking.getInitialURL().then(url => {
      if (url) void openFromUrl(url);
    });
    const sub = ExpoLinking.addEventListener('url', ({ url }) => {
      void openFromUrl(url);
    });
    return () => sub.remove();
  }, []);

  const animateScreenChange = (next: Screen) => {
    if (screen === next) return;
    setScreen(next);
    fadeAnim.setValue(0);
    slideAnim.setValue(SW * 0.18);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const animateBackChange = (next: Screen, beforeChange?: () => void) => {
    if (screen === next && !beforeChange) return;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 130,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      beforeChange?.();
      setScreen(next);
      slideAnim.setValue(-SW * 0.04);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
      });
    });
  };

  const handleModeSelect = (mode: 'scenarios' | 'stories') => {
    animateScreenChange(mode === 'scenarios' ? 'scenarios' : (mode as Screen));
  };

  const goTo = (next: Screen) => animateScreenChange(next);
  const backTo = (next: Screen) => animateBackChange(next);

  const animateRunStateChange = (next: RunState) => {
    if (runState === next) return;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setRunState(next);
      slideAnim.setValue(SW * 0.08);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
      });
    });
  };

  const openToolScreen = (tool: Screen) => {
    toolReturnScreenRef.current = screen;
    goTo(tool);
  };

  const openGrammarFrom = (origin: 'home' | 'learn-hub' | 'practice-hub' | 'profile-hub') => {
    grammarEntryRef.current = origin;
    goTo('grammar');
  };

  const openGrammarFromStageResult = () => {
    grammarEntryRef.current = 'stage-result';
    goTo('grammar');
  };

  const startFirstSession = async () => {
    const profileRaw = await AsyncStorage.getItem('userProfile');
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    setCurrentProfile(profile);
    const languageCode = profile?.language?.code ?? 'es';
    const firstScenario = getPersonalizedScenario(languageCode, profile?.identity);

    setSelectedScenario(firstScenario);
    setRunType('first');
    await trackEvent('first_stage_started', {
      scenarioId: firstScenario.id,
      stageType: firstScenario.stageType ?? 'cafe',
      language: languageCode,
      runType: 'first',
    });
    await enterScenario();
  };

  const startDailyMission = async (returnTo: 'home' | 'practice-hub' = 'home') => {
    dailyMissionReturnRef.current = returnTo;
    const profileRaw = await AsyncStorage.getItem('userProfile');
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    setCurrentProfile(profile);
    const languageCode = profile?.language?.code ?? 'es';
    const missionScenario = getTodaysMissionScenario(languageCode, profile?.identity, profile?.completedScenarios ?? []);
    if (requiresPlusPack(missionScenario)) {
      const allowed = await ensurePremiumFeature(plusPackReasonFor(missionScenario));
      if (!allowed) return;
    }
    const progress = await getProgress();
    setCurrentPlayCount(progress.scenarioPlayCounts?.[missionScenario.id] ?? 0);

    setSelectedScenario(missionScenario);
    setRunType('daily-mission');
    await trackEvent('daily_mission_started', {
      scenarioId: missionScenario.id,
      stageType: missionScenario.stageType ?? 'cafe',
      language: languageCode,
      runType: 'daily-mission',
    });
    await enterScenario('Daily mission sahnesi günlük free rehearsal hakkını kullanır. Sınırsız sahne provası Roleo Plus ile açılır.');
  };

  const startDailyRun = async (goalId?: string, returnTo: 'home' | 'practice-hub' = 'practice-hub') => {
    dailyRunExitRef.current = returnTo;
    setRunResults([]);
    setDailyRunBoard(null);
    setRunGoalId(goalId);
    const profileRaw = await AsyncStorage.getItem('userProfile');
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    setCurrentProfile(profile);
    const languageCode = profile?.language?.code ?? 'es';
    const scenario = getTodaysMissionScenario(languageCode, profile?.identity, profile?.completedScenarios ?? []);
    if (requiresPlusPack(scenario)) {
      const allowed = await ensurePremiumFeature(plusPackReasonFor(scenario));
      if (!allowed) {
        resetRun();
        return;
      }
    }
    const progress = await getProgress();
    setCurrentPlayCount(progress.scenarioPlayCounts?.[scenario.id] ?? 0);
    setRunScenario(scenario);
    const allowed = await ensureCanStartScene('Daily run içindeki sahne provası günlük free hakkını kullanır. Sınırsız günlük run sahneleri Roleo Plus ile açılır.');
    if (!allowed) {
      resetRun();
      return;
    }
    runBriefingExitAnim.setValue(1);
    animateRunStateChange('briefing');
    await trackEvent('run_started', { source: returnTo, goalId: goalId ?? 'none', scenarioId: scenario.id });
  };

  const handleFlashComplete = async (result: ModuleResult) => {
    setRunResults(r => [...r, result]);
    animateRunStateChange('truefake');
    await trackEvent('module_completed', { module: 'flash', accuracy: result.accuracy, comboMax: result.comboMax });
  };

  const handleTrueFakeComplete = async (result: ModuleResult) => {
    setRunResults(r => [...r, result]);

    if (!runScenario) {
      const profileRaw = await AsyncStorage.getItem('userProfile');
      const profile = profileRaw ? JSON.parse(profileRaw) : null;
      const languageCode = profile?.language?.code ?? 'es';
      const scenario = getTodaysMissionScenario(languageCode, profile?.identity, profile?.completedScenarios ?? []);
      const progress = await getProgress();
      setCurrentPlayCount(progress.scenarioPlayCounts?.[scenario.id] ?? 0);
      setRunScenario(scenario);
    }

    animateRunStateChange('scene');
    await trackEvent('module_completed', { module: 'truefake', accuracy: result.accuracy, comboMax: result.comboMax });
  };

  const handleSceneComplete = async (result: ModuleResult) => {
    const prev = await getDailyRunSnapshot();
    const next = [...runResults, result];
    const overallAccuracy = next.reduce((s, x) => s + x.accuracy, 0) / Math.max(next.length, 1);
    const maxCombo = next.reduce((m, x) => Math.max(m, x.comboMax ?? 0), 0);
    await saveDailyRunSnapshot({
      ts: new Date().toISOString(),
      overallAccuracy,
      maxCombo,
      sceneAccuracy: result.accuracy,
      sceneFlow: result.flowPath,
    });
    setDailyRunBoard({
      prev,
      overallAccuracy,
      maxCombo,
      sceneAccuracy: result.accuracy,
      sceneFlow: result.flowPath,
    });
    setRunResults(next);
    animateRunStateChange('complete');
    if (runScenario) {
      const profileRaw = await AsyncStorage.getItem('userProfile');
      const profile = profileRaw ? JSON.parse(profileRaw) : null;
      const flowPath = result.flowPath ?? 'smooth';
      const xpBase = runScenario.xpReward ?? 20;
      const xpBonus = result.accuracy >= 0.7 ? 8 : result.accuracy >= 0.4 ? 4 : 0;
      const comboBonus = Math.min(12, (result.comboMax ?? 0) * 3);
      const runXp = Math.max(8, xpBase + xpBonus + comboBonus);
      const userLevel: 'beginner' | 'intermediate' | 'advanced' =
        result.accuracy >= 0.7 ? 'advanced' : result.accuracy >= 0.4 ? 'intermediate' : 'beginner';
      const sessionId = `daily-run-${runScenario.id}-${Date.now().toString(36)}`;
      await saveSceneSession({
        sessionId,
        timestamp: new Date().toISOString(),
        source: 'daily_run',
        scenarioId: runScenario.id,
        scenarioTitle: runScenario.title,
        stageType: runScenario.stageType ?? 'social',
        language: profile?.language?.code ?? runScenario.language,
        npcPersona: 'Daily Run',
        difficulty: userLevel,
        userGoal: profile?.goalDescription ?? undefined,
        identityGoal: profile?.identity?.goal ?? undefined,
        selectedChoices: [],
        score: {
          accuracy: result.accuracy,
          comboMax: result.comboMax ?? 0,
          xpEarned: runXp,
          flowPath,
          goodTurns: Math.round(result.accuracy * 6),
          awkwardTurns: flowPath === 'friction' ? 1 : 0,
          timedOutTurns: 0,
        },
        voiceAttempts: result.voiceAttempts,
        bestLine: result.nativePhrase,
        awkwardMoment: flowPath === 'friction'
          ? 'Daily run sahnesinde akış bir noktada gerildi.'
          : 'Daily run sahnesinde büyük bir kopuş kaydedilmedi.',
        nextFocus: flowPath === 'friction'
          ? 'Bir sonraki provada aynı sahnede daha yumuşak geçiş kur.'
          : 'Bir sonraki provada aynı sakin ritmi koru.',
        dramaticBeat: 'Daily run içinde tamamlanan sahne provası',
      });
      await completeStage({
        resultId: sessionId,
        scenarioId: runScenario.id,
        scenarioTitle: runScenario.title,
        stageType: runScenario.stageType ?? 'social',
        userLevel,
        userMessageCount: Math.round(result.accuracy * 6),
        xpEarned: runXp,
        sceneAccuracy: result.accuracy,
        comboMax: result.comboMax ?? 0,
        flowPath,
        goodTurns: Math.round(result.accuracy * 6),
        awkwardTurns: flowPath === 'friction' ? 1 : 0,
        timedOutTurns: 0,
        nativePhraseHighlight: result.nativePhrase,
      });
    }
    await recordSceneRehearsalUse();
    await revealPostValuePaywallIfNeeded();
    await trackEvent('module_completed', { module: 'scene', accuracy: result.accuracy, comboMax: result.comboMax });
    await trackEvent('run_completed', {
      moduleCount: 3,
      overallAccuracy,
    });
  };

  const resetRun = () => {
    setRunResults([]);
    setRunScenario(null);
    setRunGoalId(undefined);
    setDailyRunBoard(null);
    runBriefingExitAnim.setValue(1);
    setRunState('idle');
  };

  const resetRunWithBackTransition = (nextScreen: Screen = dailyRunExitRef.current) => {
    animateBackChange(nextScreen, resetRun);
  };

  const closeDailyRunBriefing = () => {
    Animated.timing(runBriefingExitAnim, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      animateBackChange(dailyRunExitRef.current, resetRun);
    });
  };

  const renderDailyRunBriefing = () => {
    if (!runScenario) return null;
    const minutes = runScenario.estimatedMinutes ?? 3;
    return (
      <View style={runBriefingStyles.container}>
        <View style={runBriefingStyles.glowWarm} pointerEvents="none" />
        <View style={runBriefingStyles.glowCool} pointerEvents="none" />
        <View style={runBriefingStyles.grain} pointerEvents="none" />
        <Animated.View
          style={[
            runBriefingStyles.card,
            {
              opacity: runBriefingExitAnim,
              transform: [
                {
                  scale: runBriefingExitAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.97, 1],
                  }),
                },
                {
                  translateY: runBriefingExitAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={runBriefingStyles.closeBtn}
            onPress={closeDailyRunBriefing}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('run.exit')}
          >
            <Feather name="x" size={18} color={colors.inkTertiary} />
          </TouchableOpacity>
          <Text style={runBriefingStyles.eyebrow}>{t('run.eyebrow')}</Text>
          <Text style={runBriefingStyles.title}>
            {t('run.title.before')} <Text style={runBriefingStyles.titleAccent}>{t('run.title.accent')}</Text>,{'\n'}{t('run.title.after')}
          </Text>
          <Text style={runBriefingStyles.subtitle}>
            {t('run.subtitle')}
          </Text>

          <View style={runBriefingStyles.sceneCard}>
            <Text style={runBriefingStyles.sceneLabel}>{t('run.selectedScene')}</Text>
            <Text style={runBriefingStyles.sceneTitle}>{runScenario.title}</Text>
            <Text style={runBriefingStyles.sceneMeta}>{runScenario.location} · ~{minutes} dk</Text>
          </View>

          <View style={runBriefingStyles.stepList}>
            {[
              t('run.steps.1'),
              t('run.steps.2'),
              t('run.steps.3'),
              t('run.steps.4'),
            ].map((step, index) => (
              <View key={step} style={runBriefingStyles.stepRow}>
                <Text style={runBriefingStyles.stepNumber}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={runBriefingStyles.step}>{step}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={runBriefingStyles.primaryBtn} onPress={() => animateRunStateChange('flash')} activeOpacity={0.9}>
            <Text style={runBriefingStyles.primaryText}>{t('run.start')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={runBriefingStyles.secondaryBtn} onPress={() => animateRunStateChange('scene')} activeOpacity={0.85}>
            <Text style={runBriefingStyles.secondaryText}>{t('run.skipWarmup')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderScreen = () => {
    if (runState === 'briefing') {
      return renderDailyRunBriefing();
    }

    if (runState === 'flash') {
      return <FlashPickScreen onBack={() => resetRunWithBackTransition()} runMode runSceneTitle={runScenario?.title} onComplete={handleFlashComplete} backgroundImage={runScenario?.backgroundImage} />;
    }

    if (runState === 'truefake') {
      return <TrueOrFakeScreen onBack={() => resetRunWithBackTransition()} runMode runSceneTitle={runScenario?.title} onComplete={handleTrueFakeComplete} scenario={runScenario ?? undefined} />;
    }

    if (runState === 'scene') {
      if (!runScenario) return null;
      const flash = runResults.find(r => r.module === 'flash');
      const trueFake = runResults.find(r => r.module === 'truefake');
      const easyStart = (flash?.accuracy ?? 0) > 0.7 && (trueFake?.accuracy ?? 0) > 0.7;
      return (
        <ScenarioScreen
          scenario={runScenario}
          playCount={currentPlayCount}
          onBack={() => resetRunWithBackTransition()}
          easyStart={easyStart}
          guidedRunMode
          goalId={runGoalId}
          onRunComplete={handleSceneComplete}
          onStageComplete={() => {
            // handled by onRunComplete in Daily Run flow
          }}
        />
      );
    }

    if (runState === 'complete') {
      return (
        <RunResultScreen
          results={runResults}
          dailyRunBoard={dailyRunBoard}
          onExit={() => resetRunWithBackTransition(dailyRunExitRef.current)}
          onReplay={() => startDailyRun(runGoalId, dailyRunExitRef.current)}
        />
      );
    }

    if (screen === 'intro') {
      return (
        <RoleoIntroScreen
          onFinish={async () => {
            const p = await AsyncStorage.getItem('userProfile');
            if (!p) {
              goTo('onboarding');
              return;
            }

            try {
              const profile = JSON.parse(p);
              const firstSessionState = await AsyncStorage.getItem('firstSessionState');
              if (firstSessionState === 'pending') {
                const scenario = getPersonalizedScenario(profile?.language?.code ?? 'es', profile?.identity);
                setFirstSessionScenario(scenario);
                setRunType('first');
                goTo('first-session-ready');
              } else {
                goTo('startup-language');
              }
            } catch {
              await AsyncStorage.removeItem('userProfile');
              goTo('onboarding');
            }
          }}
        />
      );
    }

    if (screen === 'onboarding') {
      return (
        <OnboardingScreen
          startAfterPreview={onboardingAfterPreview}
          onTryQuickScene={async () => {
            const previewScenario = getFirstSessionScenario('en');
            setSelectedScenario(previewScenario);
            setCurrentPlayCount(0);
            setRunType('onboarding-preview');
            setOnboardingAfterPreview(true);
            await trackEvent('stage_started', {
              scenarioId: previewScenario.id,
              stageType: previewScenario.stageType ?? 'cafe',
              runType: 'onboarding-preview',
            });
            await enterScenario();
          }}
          onComplete={async () => {
            await AsyncStorage.setItem('firstSessionState', onboardingAfterPreview ? 'done' : 'pending');
            const p = await AsyncStorage.getItem('userProfile');
            const prof = p ? JSON.parse(p) : null;
            setCurrentProfile(prof);
            await trackEvent('onboarding_completed', {
              targetLang: prof?.language?.code,
              nativeLang: prof?.nativeLanguage?.code,
              goal: prof?.goal?.id,
              identityGoal: prof?.identity?.goal,
              identityEmotion: prof?.identity?.emotion,
            });
            if (onboardingAfterPreview) {
              setOnboardingAfterPreview(false);
              setRunType('normal');
              goTo('startup-language');
            } else {
              const scenario = getPersonalizedScenario(prof?.language?.code ?? 'es', prof?.identity);
              setFirstSessionScenario(scenario);
              setRunType('first');
              goTo('first-session-ready');
            }
          }}
        />
      );
    }

    if (screen === 'startup-language') {
      return (
        <StartupLanguageScreen
          onComplete={async () => {
            const p = await AsyncStorage.getItem('userProfile');
            setCurrentProfile(p ? JSON.parse(p) : null);
            goTo('home');
          }}
          onReset={() => backTo('onboarding')}
          onSkip={() => backTo('home')}
        />
      );
    }

    if (screen === 'first-session-ready') {
      return <FirstSessionReadyScreen onStart={startFirstSession} scenario={firstSessionScenario} />;
    }

    if (screen === 'first-session-next') {
      return (
        <FirstSessionNextScreen
          onContinueStage={() => {
            scenariosReturnRef.current = 'practice-hub';
            goTo('scenarios');
          }}
          onStartMission={() => startDailyRun(undefined, 'practice-hub')}
        />
      );
    }

    const mainTabScreens: Screen[] = ['home', 'learn-hub', 'practice-hub', 'profile-hub'];
    if (mainTabScreens.includes(screen)) {
      const activeTab: MainTabId =
        screen === 'home' ? 'discover' : screen === 'learn-hub' ? 'learn' : screen === 'practice-hub' ? 'practice' : 'profile';
      const selectMainTab = (tab: MainTabId) => {
        if (tab === 'discover') goTo('home');
        else if (tab === 'learn') goTo('learn-hub');
        else if (tab === 'practice') goTo('practice-hub');
        else goTo('profile-hub');
      };
      return (
        <View style={{ flex: 1 }}>
          {screen === 'home' && (
            <HomeScreen
              onDebug={() => goTo('debug')}
              onOpenAccount={() => goTo('account')}
              onStartDailyMission={() => startDailyRun(undefined, 'home')}
              onOpenProgress={() => {
                progressReturnRef.current = 'home';
                goTo('progress');
              }}
              onOpenJournal={() => goTo('journal')}
            />
          )}
          {screen === 'learn-hub' && (
            <LearnHubScreen
              onOpenVocab={() => {
                toolReturnScreenRef.current = 'learn-hub';
                goTo('vocab');
              }}
              onOpenPronunciation={() => openPremiumTool('pronunciation', PLUS_GATE_COPY.voice)}
              onOpenListening={() => openToolScreen('listening')}
              onOpenInstantLearn={() => openPremiumTool('instant-learn', PLUS_GATE_COPY.customScene)}
              onOpenGrammar={() => openGrammarFrom('learn-hub')}
            />
          )}
          {screen === 'practice-hub' && (
            <PracticeHubScreen
              onOpenScenarios={() => {
                scenariosReturnRef.current = 'practice-hub';
                goTo('scenarios');
              }}
              onStartDailyMission={() => startDailyRun(undefined, 'practice-hub')}
              onStartDailyRun={gid => startDailyRun(gid, 'practice-hub')}
              onContinueScenarios={() => {
                scenariosReturnRef.current = 'practice-hub';
                handleModeSelect('scenarios');
              }}
              onOpenFlashPick={() => openToolScreen('flash-pick')}
              onOpenTrueOrFake={() => openToolScreen('true-or-fake')}
            />
          )}
          {screen === 'profile-hub' && (
            <ProfileHubScreen
              onOpenAccount={() => goTo('account')}
              onOpenProgress={() => {
                progressReturnRef.current = 'profile-hub';
                goTo('progress');
              }}
            />
          )}
          <BottomTabBar active={activeTab} onSelect={selectMainTab} />
        </View>
      );
    }

    if (screen === 'account') {
      return (
        <AccountScreen
          onBack={() => backTo('profile-hub')}
          onOpenScenarios={() => {
            scenariosReturnRef.current = 'account';
            goTo('scenarios');
          }}
          onOpenProgress={() => {
            progressReturnRef.current = 'account';
            goTo('progress');
          }}
          onRevisitIntro={() => goTo('intro')}
        />
      );
    }

    if (screen === 'instant-learn') {
      return <InstantLearnScreen onBack={() => backTo(toolReturnScreenRef.current)} />;
    }

    if (screen === 'pronunciation') {
      return <PronunciationScreen onBack={() => backTo(toolReturnScreenRef.current)} />;
    }

    if (screen === 'listening') {
      return <ListeningScreen onBack={() => backTo(toolReturnScreenRef.current)} />;
    }

    if (screen === 'flash-pick') {
      return <FlashPickScreen onBack={() => backTo(toolReturnScreenRef.current)} />;
    }

    if (screen === 'true-or-fake') {
      return <TrueOrFakeScreen onBack={() => backTo(toolReturnScreenRef.current)} />;
    }

    if (screen === 'scenarios') {
      return (
        <ScenariosScreen
          onScenarioSelect={async s => {
            const profileRaw = await AsyncStorage.getItem('userProfile');
            const profile = profileRaw ? JSON.parse(profileRaw) : null;
            setCurrentProfile(profile);
            if (requiresPlusPack(s)) {
              const allowed = await ensurePremiumFeature(plusPackReasonFor(s));
              if (!allowed) return;
            }
            setSelectedScenario(s);
            setRunType('normal');
            setActiveChallenge(null);
            setPrepBonus(0);
            const progress = await getProgress();
            setCurrentPlayCount(progress?.scenarioPlayCounts?.[s.id] ?? 0);
            setShowPrepModal(true);
          }}
          onBack={() => backTo(scenariosReturnRef.current)}
        />
      );
    }

    if (screen === 'scenario' && selectedScenario) {
      return (
        <ScenarioScreen
          scenario={selectedScenario}
          playCount={currentPlayCount}
          firstSessionMode={runType === 'first' || runType === 'onboarding-preview'}
          prepBonus={prepBonus}
          challengeTarget={activeChallenge}
          onBack={() =>
            backTo(
              runType === 'first'
                ? 'first-session-ready'
                : runType === 'onboarding-preview'
                  ? 'onboarding'
                  : runType === 'daily-mission'
                    ? dailyMissionReturnRef.current
                    : 'scenarios'
            )
          }
          onStageComplete={async result => {
            const finalResult = prepBonus > 0
              ? { ...result, xpEarned: result.xpEarned + prepBonus }
              : result;
            const withIdentity = {
              ...finalResult,
              resultId: finalResult.resultId ?? `${finalResult.scenarioId}-${Date.now().toString(36)}`,
            };
            const withChallenge = activeChallenge
              ? {
                  ...withIdentity,
                  challengeTarget: activeChallenge,
                  challengeOutcome: computeChallengeOutcome(withIdentity, activeChallenge),
                }
              : withIdentity;
            await trackEvent('stage_completed', {
              scenarioId: withChallenge.scenarioId,
              stageType: withChallenge.stageType,
              xpEarned: withChallenge.xpEarned,
              userLevel: withChallenge.userLevel,
              messageCount: withChallenge.userMessageCount,
              runType,
              prepBonusUsed: prepBonus > 0,
              challenge: !!activeChallenge,
            });
            if (runType === 'daily-mission') {
              await trackEvent('daily_mission_completed', { scenarioId: finalResult.scenarioId });
            }
            await recordSceneRehearsalUse();
            if (runType === 'first') {
              await AsyncStorage.setItem('firstSessionState', 'done');
            }
            setStageResult(withChallenge);
            setActiveChallenge(null);
            goTo('stage-result');
            await revealPostValuePaywallIfNeeded();
          }}
        />
      );
    }

    if (screen === 'stage-result' && stageResult) {
      return (
        <StageResultScreen
          result={stageResult}
          firstSessionMode={runType === 'first' || runType === 'onboarding-preview'}
          onBackHome={() => backTo(runType === 'onboarding-preview' ? 'onboarding' : 'home')}
          onGoScenarios={async () => {
            await trackEvent('next_stage_clicked', { source: 'result', runType });
            const wasFirst = runType === 'first';
            const wasPreview = runType === 'onboarding-preview';
            if (wasFirst) {
              setRunType('normal');
              goTo('home');
              return;
            }
            if (wasPreview) {
              setRunType('normal');
              goTo('onboarding');
              return;
            }

            const replayScenario = scenarios.find(s => s.id === stageResult.scenarioId) ?? null;
            if (!replayScenario) {
              setRunType('normal');
              scenariosReturnRef.current = 'practice-hub';
              goTo('scenarios');
              return;
            }
            if ((replayScenario.replayTwists?.length ?? 0) > 0) {
              const allowed = await ensurePremiumFeature(PLUS_GATE_COPY.replayTwist);
              if (!allowed) return;
            }
            const progress = await getProgress();
            setSelectedScenario(replayScenario);
            setCurrentPlayCount(progress.scenarioPlayCounts?.[replayScenario.id] ?? 0);
            setPrepBonus(0);
            setActiveChallenge(null);
            setRunType('normal');
            await enterScenario('Replay with twist ve sınırsız tekrarlar Roleo Plus ile açılır. Free planda bugünkü hakkın dolduysa yeni sahne için Plus gerekir.');
          }}
          onOpenVocab={() => goTo('vocab')}
          onOpenGrammar={openGrammarFromStageResult}
          onOpenQuiz={() => goTo('quiz')}
        />
      );
    }

    if (screen === 'vocab') {
      const backTarget = stageResult ? 'stage-result' : toolReturnScreenRef.current;
      return <VocabScreen onBack={() => backTo(backTarget)} scenarioTitle={stageResult?.scenarioTitle} stageType={stageResult?.stageType} />;
    }
    if (screen === 'grammar') {
      const gOrigin = grammarEntryRef.current;
      const grammarBackTarget: Screen =
        gOrigin === 'stage-result' ? 'stage-result' : (gOrigin as Screen);
      const fromStage = gOrigin === 'stage-result';
      return (
        <GrammarScreen
          onBack={() => backTo(grammarBackTarget)}
          scenarioTitle={fromStage ? stageResult?.scenarioTitle : undefined}
          stageType={fromStage ? stageResult?.stageType : undefined}
          scenario={fromStage ? scenarios.find(s => s.id === stageResult?.scenarioId) : undefined}
        />
      );
    }
    if (screen === 'quiz') return <QuizScreen onBack={() => backTo('stage-result')} scenarioTitle={stageResult?.scenarioTitle} stageType={stageResult?.stageType} />;
    if (screen === 'stories') return <QuotesScreen onBack={() => backTo(toolReturnScreenRef.current)} />;
    if (screen === 'progress') return <ProgressScreen onBack={() => backTo(progressReturnRef.current)} />;
    if (screen === 'journal') return <JournalScreen onBack={() => backTo('home')} />;
    if (screen === 'stripe-home') return <StripeHomeScreen onBack={() => backTo('home')} />;
    if (screen === 'travel-home') return <TravelHomeScreen onBack={() => backTo('home')} />;
    if (screen === 'debug') return <DebugPanelScreen onBack={() => backTo('home')} />;

    return null;
  };

  const FAB_HIDDEN_SCREENS: Screen[] = [
    'intro', 'onboarding', 'startup-language', 'first-session-ready',
    'first-session-next', 'instant-learn', 'stage-result', 'debug', 'home', 'learn-hub', 'practice-hub',
    'profile-hub', 'account',
  ];
  const showFab = !loading && runState === 'idle' && !FAB_HIDDEN_SCREENS.includes(screen);

  if (loading || !fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#0A0E14' }}>
        <StatusBar style="light" />
        <Animated.View style={{ flex: 1, backgroundColor: '#0A0E14', opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          {renderScreen()}
        </Animated.View>
        {/* FAB kaldırıldı — InstantLearn learn-hub'dan erişilebilir */}
        {runState === 'idle' && selectedScenario && (
          <ScenarioPrepModal
            visible={showPrepModal}
            scenario={selectedScenario}
            profile={currentProfile}
            playCount={currentPlayCount}
            onSkip={async () => { setShowPrepModal(false); await enterScenario(); }}
            onEnter={async (bonus) => { setPrepBonus(bonus); setShowPrepModal(false); await enterScenario(); }}
          />
        )}
        <RoleoPlusPaywall
          visible={paywallVisible}
          context={paywallContext}
          uiLanguage={getUiLanguageFromProfile(currentProfile)}
          reason={paywallReason}
          remainingDailyScenes={sceneLimit?.remainingDailyScenes}
          onClose={closePaywall}
          onUpgrade={upgradeMockPlan}
        />
      </View>
    </SafeAreaProvider>
  );
}

const fabStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 36,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#A66A4C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A66A4C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 22,
    color: '#FFFDF8',
  },
});

const runBriefingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDeep,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 32,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowWarm: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    top: -110,
    right: -120,
    backgroundColor: colors.accentGlow,
    opacity: 0.9,
  },
  glowCool: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    left: -120,
    bottom: -90,
    backgroundColor: 'rgba(95, 124, 168, 0.10)',
  },
  grain: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.035)',
    opacity: 0.5,
  },
  card: {
    backgroundColor: 'rgba(18, 24, 34, 0.86)',
    borderRadius: 28,
    padding: 22,
    paddingTop: 28,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.hairline,
    zIndex: 2,
  },
  eyebrow: {
    color: colors.accentWarm,
    fontFamily: 'InterTight_500Medium',
    fontSize: 11,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    color: colors.inkPrimary,
    fontFamily: 'Fraunces_300Light',
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  titleAccent: {
    color: colors.accentWarm,
    fontFamily: 'Fraunces_300Light_Italic',
  },
  subtitle: {
    color: colors.inkSecondary,
    fontFamily: 'InterTight_400Regular',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  sceneCard: {
    backgroundColor: 'rgba(40,30,22,0.86)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.accentGlow,
    padding: 16,
    marginBottom: 18,
  },
  sceneLabel: {
    color: colors.accentWarmSoft,
    fontFamily: 'InterTight_500Medium',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  sceneTitle: {
    color: colors.inkPrimary,
    fontFamily: 'Fraunces_300Light',
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.3,
  },
  sceneMeta: {
    color: colors.inkSecondary,
    fontFamily: 'InterTight_400Regular',
    fontSize: 13,
    marginTop: 6,
  },
  stepList: {
    gap: 10,
    marginBottom: 22,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumber: {
    color: colors.inkTertiary,
    fontFamily: 'InterTight_500Medium',
    fontSize: 10,
    letterSpacing: 1,
    width: 22,
    textAlign: 'right',
  },
  step: {
    color: colors.inkSecondary,
    fontFamily: 'InterTight_400Regular',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: colors.accentWarm,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryText: {
    color: colors.bgDeep,
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 15,
  },
  secondaryBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.inkTertiary,
    fontFamily: 'InterTight_500Medium',
    fontSize: 13,
  },
});
