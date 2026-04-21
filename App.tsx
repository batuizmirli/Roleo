import React, { useState, useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, PlayfairDisplay_700Bold, PlayfairDisplay_900Black } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Scenario, StageResult } from './src/types';
import OnboardingScreen from './src/screens/OnboardingScreen';
import RoleoIntroScreen from './src/screens/RoleoIntroScreen';
import StartupLanguageScreen from './src/screens/StartupLanguageScreen';
import HomeScreen from './src/screens/HomeScreen';
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
import FlashPickScreen from './src/screens/FlashPickScreen';
import TrueOrFakeScreen from './src/screens/TrueOrFakeScreen';
import RunResultScreen from './src/screens/RunResultScreen';
import ScenarioPrepModal from './src/components/ScenarioPrepModal';
import { ModuleResult, UserProfile } from './src/types';
import { getFirstSessionScenario, getTodaysMissionScenario, getPersonalizedScenario } from './src/data/scenarios';
import { trackEvent } from './src/services/telemetry';

type Screen =
  | 'intro'
  | 'onboarding'
  | 'startup-language'
  | 'home'
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
  | 'debug';

export default function App() {
  type RunState = 'idle' | 'flash' | 'truefake' | 'scene' | 'complete';

  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, PlayfairDisplay_900Black });

  const [screen, setScreen] = useState<Screen>('onboarding');
  const [runState, setRunState] = useState<RunState>('idle');
  const [runResults, setRunResults] = useState<ModuleResult[]>([]);
  const [runScenario, setRunScenario] = useState<Scenario | null>(null);
  const [runGoalId, setRunGoalId] = useState<string | undefined>(undefined);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [stageResult, setStageResult] = useState<StageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [runType, setRunType] = useState<'normal' | 'first' | 'daily-mission'>('normal');
  const [showPrepModal, setShowPrepModal] = useState(false);
  const [prepBonus, setPrepBonus] = useState(0);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [currentPlayCount, setCurrentPlayCount] = useState(0);
  const [firstSessionScenario, setFirstSessionScenario] = useState<Scenario | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

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

  const startDailyMission = async () => {
    const profileRaw = await AsyncStorage.getItem('userProfile');
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    const languageCode = profile?.language?.code ?? 'es';
    const missionScenario = getTodaysMissionScenario(languageCode, profile?.identity, profile?.completedScenarios ?? []);

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

  const startDailyRun = async (goalId?: string) => {
    setRunResults([]);
    setRunScenario(null);
    setRunGoalId(goalId);
    setRunState('flash');
    await trackEvent('run_started', { source: 'home', goalId: goalId ?? 'none' });
  };

  const handleFlashComplete = async (result: ModuleResult) => {
    setRunResults(r => [...r, result]);
    setRunState('truefake');
    await trackEvent('module_completed', { module: 'flash', accuracy: result.accuracy, comboMax: result.comboMax });
  };

  const handleTrueFakeComplete = async (result: ModuleResult) => {
    setRunResults(r => [...r, result]);

    const profileRaw = await AsyncStorage.getItem('userProfile');
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    const languageCode = profile?.language?.code ?? 'es';
    const scenario = getTodaysMissionScenario(languageCode, profile?.identity, profile?.completedScenarios ?? []);
    setRunScenario(scenario);

    setRunState('scene');
    await trackEvent('module_completed', { module: 'truefake', accuracy: result.accuracy, comboMax: result.comboMax });
  };

  const handleSceneComplete = async (result: ModuleResult) => {
    setRunResults(r => [...r, result]);
    setRunState('complete');
    await trackEvent('module_completed', { module: 'scene', accuracy: result.accuracy, comboMax: result.comboMax });
    await trackEvent('run_completed', {
      moduleCount: 3,
      overallAccuracy: [...runResults, result].reduce((s, x) => s + x.accuracy, 0) / Math.max(runResults.length + 1, 1),
    });
  };

  const resetRun = () => {
    setRunResults([]);
    setRunScenario(null);
    setRunGoalId(undefined);
    setRunState('idle');
  };

  const renderScreen = () => {
    if (runState === 'flash') {
      return <FlashPickScreen onBack={resetRun} runMode onComplete={handleFlashComplete} />;
    }

    if (runState === 'truefake') {
      return <TrueOrFakeScreen onBack={resetRun} runMode onComplete={handleTrueFakeComplete} />;
    }

    if (runState === 'scene') {
      if (!runScenario) return null;
      const flash = runResults.find(r => r.module === 'flash');
      const trueFake = runResults.find(r => r.module === 'truefake');
      const easyStart = (flash?.accuracy ?? 0) > 0.7 && (trueFake?.accuracy ?? 0) > 0.7;
      return (
        <ScenarioScreen
          scenario={runScenario}
          onBack={resetRun}
          easyStart={easyStart}
          goalId={runGoalId}
          onRunComplete={handleSceneComplete}
          onStageComplete={() => {
            // handled by onRunComplete in Daily Run flow
          }}
        />
      );
    }

    if (runState === 'complete') {
      return <RunResultScreen results={runResults} onExit={() => { resetRun(); goTo('home'); }} />;
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
          onComplete={async () => {
            await AsyncStorage.setItem('firstSessionState', 'pending');
            const p = await AsyncStorage.getItem('userProfile');
            const prof = p ? JSON.parse(p) : null;
            await trackEvent('onboarding_completed', {
              targetLang: prof?.language?.code,
              nativeLang: prof?.nativeLanguage?.code,
              goal: prof?.goal?.id,
              identityGoal: prof?.identity?.goal,
              identityEmotion: prof?.identity?.emotion,
            });
            const scenario = getPersonalizedScenario(prof?.language?.code ?? 'es', prof?.identity);
            setFirstSessionScenario(scenario);
            setRunType('first');
            goTo('first-session-ready');
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
      return <FirstSessionNextScreen onContinueStage={() => goTo('scenarios')} onStartMission={startDailyMission} />;
    }

    if (screen === 'home') {
      return <HomeScreen onModeSelect={handleModeSelect} onStartDailyRun={(gid) => startDailyRun(gid)} onRevisitIntro={() => goTo('intro')} onDebug={() => goTo('debug')} onOpenInstantLearn={() => goTo('instant-learn')} onOpenPronunciation={() => goTo('pronunciation')} onOpenFlashPick={() => goTo('flash-pick')} onOpenTrueOrFake={() => goTo('true-or-fake')} onOpenProgress={() => goTo('progress')} onStartDailyMission={startDailyMission} />;
    }

    if (screen === 'instant-learn') {
      return <InstantLearnScreen onBack={() => goTo('home')} />;
    }

    if (screen === 'pronunciation') {
      return <PronunciationScreen onBack={() => goTo('home')} />;
    }

    if (screen === 'flash-pick') {
      return <FlashPickScreen onBack={() => goTo('home')} />;
    }

    if (screen === 'true-or-fake') {
      return <TrueOrFakeScreen onBack={() => goTo('home')} />;
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
            setPrepBonus(0);
            const progressRaw = await AsyncStorage.getItem('userProgress');
            const progress = progressRaw ? JSON.parse(progressRaw) : null;
            setCurrentPlayCount(progress?.scenarioPlayCounts?.[s.id] ?? 0);
            setShowPrepModal(true);
          }}
          onBack={() => goTo('home')}
        />
      );
    }

    if (screen === 'scenario' && selectedScenario) {
      return (
        <ScenarioScreen
          scenario={selectedScenario}
          firstSessionMode={runType === 'first'}
          prepBonus={prepBonus}
          onBack={() => goTo(runType === 'first' ? 'first-session-ready' : 'scenarios')}
          onStageComplete={async result => {
            const finalResult = prepBonus > 0
              ? { ...result, xpEarned: result.xpEarned + prepBonus }
              : result;
            await trackEvent('stage_completed', {
              scenarioId: finalResult.scenarioId,
              stageType: finalResult.stageType,
              xpEarned: finalResult.xpEarned,
              userLevel: finalResult.userLevel,
              messageCount: finalResult.userMessageCount,
              runType,
              prepBonusUsed: prepBonus > 0,
            });
            if (runType === 'daily-mission') {
              await trackEvent('daily_mission_completed', { scenarioId: finalResult.scenarioId });
            }
            if (runType === 'first') {
              await AsyncStorage.setItem('firstSessionState', 'done');
            }
            setStageResult(finalResult);
            goTo('stage-result');
          }}
        />
      );
    }

    if (screen === 'stage-result' && stageResult) {
      return (
        <StageResultScreen
          result={stageResult}
          firstSessionMode={runType === 'first'}
          onBackHome={() => goTo('home')}
          onGoScenarios={async () => {
            await trackEvent('next_stage_clicked', { source: 'result', runType });
            const wasFirst = runType === 'first';
            setRunType('normal');
            goTo(wasFirst ? 'first-session-next' : 'scenarios');
          }}
          onOpenVocab={() => goTo('vocab')}
          onOpenGrammar={() => goTo('grammar')}
          onOpenQuiz={() => goTo('quiz')}
        />
      );
    }

    if (screen === 'vocab') return <VocabScreen onBack={() => goTo('stage-result')} scenarioTitle={stageResult?.scenarioTitle} stageType={stageResult?.stageType} />;
    if (screen === 'grammar') return <GrammarScreen onBack={() => goTo('stage-result')} scenarioTitle={stageResult?.scenarioTitle} stageType={stageResult?.stageType} />;
    if (screen === 'quiz') return <QuizScreen onBack={() => goTo('stage-result')} scenarioTitle={stageResult?.scenarioTitle} stageType={stageResult?.stageType} />;
    if (screen === 'stories') return <QuotesScreen onBack={() => goTo('home')} />;
    if (screen === 'phrasebook') return <PhrasebookScreen onBack={() => goTo('home')} />;
    if (screen === 'progress') return <ProgressScreen onBack={() => goTo('home')} />;
    if (screen === 'debug') return <DebugPanelScreen onBack={() => goTo('home')} />;

    return null;
  };

  const FAB_HIDDEN_SCREENS: Screen[] = [
    'intro', 'onboarding', 'startup-language', 'first-session-ready',
    'first-session-next', 'instant-learn', 'stage-result', 'debug',
  ];
  const showFab = !loading && runState === 'idle' && !FAB_HIDDEN_SCREENS.includes(screen);

  if (loading || !fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F0E5' }}>
      <StatusBar style="dark" />
      <Animated.View style={{ flex: 1, backgroundColor: '#F6F0E5', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {renderScreen()}
      </Animated.View>
      {showFab && (
        <TouchableOpacity style={fabStyles.fab} onPress={() => goTo('instant-learn')} activeOpacity={0.85}>
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
