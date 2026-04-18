import React, { useState, useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Scenario, StageResult } from './src/types';
import OnboardingScreen from './src/screens/OnboardingScreen';
import StartupLanguageScreen from './src/screens/StartupLanguageScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScenariosScreen from './src/screens/ScenariosScreen';
import ScenarioScreen from './src/screens/ScenarioScreen';
import VocabScreen from './src/screens/VocabScreen';
import GrammarScreen from './src/screens/GrammarScreen';
import QuizScreen from './src/screens/QuizScreen';
import StoriesScreen from './src/screens/StoriesScreen';
import PhrasebookScreen from './src/screens/PhrasebookScreen';
import StageResultScreen from './src/screens/StageResultScreen';
import FirstSessionReadyScreen from './src/screens/FirstSessionReadyScreen';
import FirstSessionNextScreen from './src/screens/FirstSessionNextScreen';
import DebugPanelScreen from './src/screens/DebugPanelScreen';
import InstantLearnScreen from './src/screens/InstantLearnScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ScenarioPrepModal from './src/components/ScenarioPrepModal';
import { UserProfile } from './src/types';
import { getFirstSessionScenario, getTodaysMissionScenario, getPersonalizedScenario } from './src/data/scenarios';
import { trackEvent } from './src/services/telemetry';

type Screen =
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
  | 'progress'
  | 'debug';

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');
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
        setScreen('onboarding');
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
          setScreen('first-session-ready');
        } else {
          setScreen('startup-language');
        }
      } catch {
        await AsyncStorage.removeItem('userProfile');
        setScreen('onboarding');
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

  const renderScreen = () => {
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
      return <HomeScreen onModeSelect={handleModeSelect} onDebug={() => goTo('debug')} onOpenInstantLearn={() => goTo('instant-learn')} onOpenProgress={() => goTo('progress')} onStartDailyMission={startDailyMission} />;
    }

    if (screen === 'instant-learn') {
      return <InstantLearnScreen onBack={() => goTo('home')} />;
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
    if (screen === 'stories') return <StoriesScreen onBack={() => goTo('home')} />;
    if (screen === 'phrasebook') return <PhrasebookScreen onBack={() => goTo('home')} />;
    if (screen === 'progress') return <ProgressScreen onBack={() => goTo('home')} />;
    if (screen === 'debug') return <DebugPanelScreen onBack={() => goTo('home')} />;

    return null;
  };

  const FAB_HIDDEN_SCREENS: Screen[] = [
    'onboarding', 'startup-language', 'first-session-ready',
    'first-session-next', 'instant-learn', 'stage-result', 'debug',
  ];
  const showFab = !loading && !FAB_HIDDEN_SCREENS.includes(screen);

  if (loading) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A12' }}>
      <StatusBar style="light" />
      <Animated.View style={{ flex: 1, backgroundColor: '#0A0A12', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {renderScreen()}
      </Animated.View>
      {showFab && (
        <TouchableOpacity style={fabStyles.fab} onPress={() => goTo('instant-learn')} activeOpacity={0.85}>
          <Text style={fabStyles.fabIcon}>⚡</Text>
        </TouchableOpacity>
      )}
      {selectedScenario && (
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
    backgroundColor: '#E8324A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8324A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 22,
  },
});
