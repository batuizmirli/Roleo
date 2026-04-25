import React, { useState, useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ExpoLinking from 'expo-linking';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
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
import PhrasebookScreen from './src/screens/PhrasebookScreen';
import StageResultScreen from './src/screens/StageResultScreen';
import FirstSessionReadyScreen from './src/screens/FirstSessionReadyScreen';
import FirstSessionNextScreen from './src/screens/FirstSessionNextScreen';
import DebugPanelScreen from './src/screens/DebugPanelScreen';
import InstantLearnScreen from './src/screens/InstantLearnScreen';
import PronunciationScreen from './src/screens/PronunciationScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import AccountScreen from './src/screens/AccountScreen';
import FlashPickScreen from './src/screens/FlashPickScreen';
import TrueOrFakeScreen from './src/screens/TrueOrFakeScreen';
import RunResultScreen from './src/screens/RunResultScreen';
import ScenarioPrepModal from './src/components/ScenarioPrepModal';
import { ModuleResult, UserProfile } from './src/types';
import { getFirstSessionScenario, getTodaysMissionScenario, getPersonalizedScenario, scenarios } from './src/data/scenarios';
import { getProgress } from './src/services/progress';
import { getDailyRunSnapshot, saveDailyRunSnapshot, type DailyRunSnapshot } from './src/services/runHook';
import { trackEvent } from './src/services/telemetry';
import type { SceneFlowPath } from './src/types';
import { computeChallengeOutcome, parseChallengeLink } from './src/services/challengeShare';

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
  | 'phrasebook'
  | 'stage-result'
  | 'first-session-ready'
  | 'first-session-next'
  | 'instant-learn'
  | 'pronunciation'
  | 'flash-pick'
  | 'true-or-fake'
  | 'progress'
  | 'account'
  | 'debug';

export default function App() {
  type RunState = 'idle' | 'briefing' | 'flash' | 'truefake' | 'scene' | 'complete';

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
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
  /** Grammar ekranına hangi ekrandan girildiğini ayırt etmek için. */
  const grammarEntryRef = useRef<'home' | 'learn-hub' | 'practice-hub' | 'profile-hub' | 'stage-result'>('stage-result');
  /** Mini oyun / araç ekranlarından geri dönüş hedefi (mevcut ekran anlık kopyası). */
  const toolReturnScreenRef = useRef<Screen>('home');
  const scenariosReturnRef = useRef<Screen>('practice-hub');
  const progressReturnRef = useRef<Screen>('profile-hub');
  const dailyMissionReturnRef = useRef<'home' | 'practice-hub'>('home');
  const dailyRunExitRef = useRef<'home' | 'practice-hub'>('practice-hub');

  useEffect(() => {
    const bootstrap = async () => {
      const p = await AsyncStorage.getItem('userProfile');
      if (!p) {
        setScreen('intro');
        setLoading(false);
        return;
      }

      try {
        const profile = JSON.parse(p);
        const firstSessionState = await AsyncStorage.getItem('firstSessionState');
        if (firstSessionState === 'pending') {
          const scenario = getPersonalizedScenario(profile?.language?.code ?? 'es', profile?.identity);
          setFirstSessionScenario(scenario);
          setRunType('first');
          setScreen('intro');
        } else {
          setScreen('intro');
        }

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
      goTo('scenario');
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
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 8, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      setScreen(next);
      slideAnim.setValue(-8);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleModeSelect = (mode: 'scenarios' | 'stories' | 'phrasebook') => {
    animateScreenChange(mode === 'scenarios' ? 'scenarios' : (mode as Screen));
  };

  const goTo = (next: Screen) => animateScreenChange(next);

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
    goTo('scenario');
  };

  const startDailyMission = async (returnTo: 'home' | 'practice-hub' = 'home') => {
    dailyMissionReturnRef.current = returnTo;
    const profileRaw = await AsyncStorage.getItem('userProfile');
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    const languageCode = profile?.language?.code ?? 'es';
    const missionScenario = getTodaysMissionScenario(languageCode, profile?.identity, profile?.completedScenarios ?? []);
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
    goTo('scenario');
  };

  const startDailyRun = async (goalId?: string, returnTo: 'home' | 'practice-hub' = 'practice-hub') => {
    dailyRunExitRef.current = returnTo;
    setRunResults([]);
    setDailyRunBoard(null);
    setRunGoalId(goalId);
    const profileRaw = await AsyncStorage.getItem('userProfile');
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    const languageCode = profile?.language?.code ?? 'es';
    const scenario = getTodaysMissionScenario(languageCode, profile?.identity, profile?.completedScenarios ?? []);
    const progress = await getProgress();
    setCurrentPlayCount(progress.scenarioPlayCounts?.[scenario.id] ?? 0);
    setRunScenario(scenario);
    setRunState('briefing');
    await trackEvent('run_started', { source: returnTo, goalId: goalId ?? 'none', scenarioId: scenario.id });
  };

  const handleFlashComplete = async (result: ModuleResult) => {
    setRunResults(r => [...r, result]);
    setRunState('truefake');
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

    setRunState('scene');
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
    setRunState('complete');
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
    setRunState('idle');
  };

  const renderDailyRunBriefing = () => {
    if (!runScenario) return null;
    const minutes = runScenario.estimatedMinutes ?? 3;
    return (
      <View style={runBriefingStyles.container}>
        <View style={runBriefingStyles.card}>
          <Text style={runBriefingStyles.eyebrow}>BUGÜNKÜ ROLEO LOOP</Text>
          <Text style={runBriefingStyles.title}>Önce ısın, sonra sahneye gir.</Text>
          <Text style={runBriefingStyles.subtitle}>
            Bugünkü görev tek akış: kelime refleksi, doğal ton kontrolü, ardından gerçek konuşma provası.
          </Text>

          <View style={runBriefingStyles.sceneCard}>
            <Text style={runBriefingStyles.sceneLabel}>Seçili sahne</Text>
            <Text style={runBriefingStyles.sceneTitle}>{runScenario.title}</Text>
            <Text style={runBriefingStyles.sceneMeta}>{runScenario.location} · ~{minutes} dk</Text>
          </View>

          <View style={runBriefingStyles.stepList}>
            <Text style={runBriefingStyles.step}>1. Warm-up · Kilit kelimeleri hızlı tanı</Text>
            <Text style={runBriefingStyles.step}>2. Warm-up · Doğal cümle tonunu ayır</Text>
            <Text style={runBriefingStyles.step}>3. Scene · Aynı sahneyi baskı altında prova et</Text>
            <Text style={runBriefingStyles.step}>4. Result · Bir sonraki odak noktanı gör</Text>
          </View>

          <TouchableOpacity style={runBriefingStyles.primaryBtn} onPress={() => setRunState('flash')} activeOpacity={0.9}>
            <Text style={runBriefingStyles.primaryText}>Günlük koşuya başla →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={runBriefingStyles.secondaryBtn} onPress={resetRun} activeOpacity={0.85}>
            <Text style={runBriefingStyles.secondaryText}>Şimdilik çık</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderScreen = () => {
    if (runState === 'briefing') {
      return renderDailyRunBriefing();
    }

    if (runState === 'flash') {
      return <FlashPickScreen onBack={resetRun} runMode runSceneTitle={runScenario?.title} onComplete={handleFlashComplete} />;
    }

    if (runState === 'truefake') {
      return <TrueOrFakeScreen onBack={resetRun} runMode runSceneTitle={runScenario?.title} onComplete={handleTrueFakeComplete} />;
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
          onBack={resetRun}
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
          onExit={() => { resetRun(); goTo(dailyRunExitRef.current); }}
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
            goTo('scenario');
          }}
          onComplete={async () => {
            await AsyncStorage.setItem('firstSessionState', onboardingAfterPreview ? 'done' : 'pending');
            const p = await AsyncStorage.getItem('userProfile');
            const prof = p ? JSON.parse(p) : null;
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
          onComplete={() => goTo('home')}
          onReset={() => goTo('onboarding')}
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
            />
          )}
          {screen === 'learn-hub' && (
            <LearnHubScreen
              onOpenFlashPick={() => openToolScreen('flash-pick')}
              onOpenPronunciation={() => openToolScreen('pronunciation')}
              onOpenInstantLearn={() => openToolScreen('instant-learn')}
              onOpenGrammar={() => openGrammarFrom('learn-hub')}
              onOpenTrueOrFake={() => openToolScreen('true-or-fake')}
              onOpenPhrasebook={() => openToolScreen('phrasebook')}
              onOpenStories={() => openToolScreen('stories')}
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
              onOpenTrueOrFake={() => openToolScreen('true-or-fake')}
              onOpenInstantLearn={() => openToolScreen('instant-learn')}
              onContinueScenarios={() => {
                scenariosReturnRef.current = 'practice-hub';
                handleModeSelect('scenarios');
              }}
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
          onBack={() => goTo('profile-hub')}
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
      return <InstantLearnScreen onBack={() => goTo(toolReturnScreenRef.current)} />;
    }

    if (screen === 'pronunciation') {
      return <PronunciationScreen onBack={() => goTo(toolReturnScreenRef.current)} />;
    }

    if (screen === 'flash-pick') {
      return <FlashPickScreen onBack={() => goTo(toolReturnScreenRef.current)} />;
    }

    if (screen === 'true-or-fake') {
      return <TrueOrFakeScreen onBack={() => goTo(toolReturnScreenRef.current)} />;
    }

    if (screen === 'scenarios') {
      return (
        <ScenariosScreen
          onScenarioSelect={async s => {
            const profileRaw = await AsyncStorage.getItem('userProfile');
            const profile = profileRaw ? JSON.parse(profileRaw) : null;
            setCurrentProfile(profile);
            setSelectedScenario(s);
            setRunType('normal');
            setActiveChallenge(null);
            setPrepBonus(0);
            const progress = await getProgress();
            setCurrentPlayCount(progress?.scenarioPlayCounts?.[s.id] ?? 0);
            setShowPrepModal(true);
          }}
          onBack={() => goTo(scenariosReturnRef.current)}
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
            goTo(
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
            if (runType === 'first') {
              await AsyncStorage.setItem('firstSessionState', 'done');
            }
            setStageResult(withChallenge);
            setActiveChallenge(null);
            goTo('stage-result');
          }}
        />
      );
    }

    if (screen === 'stage-result' && stageResult) {
      return (
        <StageResultScreen
          result={stageResult}
          firstSessionMode={runType === 'first' || runType === 'onboarding-preview'}
          onBackHome={() => goTo(runType === 'onboarding-preview' ? 'onboarding' : 'home')}
          onGoScenarios={async () => {
            await trackEvent('next_stage_clicked', { source: 'result', runType });
            const wasFirst = runType === 'first';
            const wasPreview = runType === 'onboarding-preview';
            if (wasFirst) {
              setRunType('normal');
              goTo('first-session-next');
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
            const progress = await getProgress();
            setSelectedScenario(replayScenario);
            setCurrentPlayCount(progress.scenarioPlayCounts?.[replayScenario.id] ?? 0);
            setPrepBonus(0);
            setActiveChallenge(null);
            setRunType('normal');
            goTo('scenario');
          }}
          onOpenVocab={() => goTo('vocab')}
          onOpenGrammar={openGrammarFromStageResult}
          onOpenQuiz={() => goTo('quiz')}
        />
      );
    }

    if (screen === 'vocab') return <VocabScreen onBack={() => goTo('stage-result')} scenarioTitle={stageResult?.scenarioTitle} stageType={stageResult?.stageType} />;
    if (screen === 'grammar') {
      const gOrigin = grammarEntryRef.current;
      const grammarBackTarget: Screen =
        gOrigin === 'stage-result' ? 'stage-result' : (gOrigin as Screen);
      const fromStage = gOrigin === 'stage-result';
      return (
        <GrammarScreen
          onBack={() => goTo(grammarBackTarget)}
          scenarioTitle={fromStage ? stageResult?.scenarioTitle : undefined}
          stageType={fromStage ? stageResult?.stageType : undefined}
        />
      );
    }
    if (screen === 'quiz') return <QuizScreen onBack={() => goTo('stage-result')} scenarioTitle={stageResult?.scenarioTitle} stageType={stageResult?.stageType} />;
    if (screen === 'stories') return <QuotesScreen onBack={() => goTo(toolReturnScreenRef.current)} />;
    if (screen === 'phrasebook') return <PhrasebookScreen onBack={() => goTo(toolReturnScreenRef.current)} />;
    if (screen === 'progress') return <ProgressScreen onBack={() => goTo(progressReturnRef.current)} />;
    if (screen === 'debug') return <DebugPanelScreen onBack={() => goTo('home')} />;

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
      <View style={{ flex: 1, backgroundColor: '#F6F0E5' }}>
        <StatusBar style="dark" />
        <Animated.View style={{ flex: 1, backgroundColor: '#F6F0E5', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {renderScreen()}
        </Animated.View>
        {showFab && (
          <TouchableOpacity
            style={fabStyles.fab}
            onPress={() => {
              toolReturnScreenRef.current = screen;
              goTo('instant-learn');
            }}
            activeOpacity={0.85}
          >
            <Text style={fabStyles.fabIcon}>⚡</Text>
          </TouchableOpacity>
        )}
        {runState === 'idle' && selectedScenario && (
          <ScenarioPrepModal
            visible={showPrepModal}
            scenario={selectedScenario}
            profile={currentProfile}
            playCount={currentPlayCount}
            onSkip={() => { setShowPrepModal(false); goTo('scenario'); }}
            onEnter={(bonus) => { setPrepBonus(bonus); setShowPrepModal(false); goTo('scenario'); }}
          />
        )}
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
    backgroundColor: '#F6F0E5',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FCF9F8',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(136, 76, 50, 0.16)',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  eyebrow: {
    color: '#B06D50',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: '#1B1C1C',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 10,
  },
  subtitle: {
    color: '#53433E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    marginBottom: 18,
  },
  sceneCard: {
    backgroundColor: '#884C32',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  sceneLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 5,
  },
  sceneTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
  },
  sceneMeta: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  stepList: {
    gap: 8,
    marginBottom: 20,
  },
  step: {
    color: '#53433E',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#B06D50',
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#7A5B4A',
    fontSize: 13,
    fontWeight: '800',
  },
});
