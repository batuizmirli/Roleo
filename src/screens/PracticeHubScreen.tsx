import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { tryParseJson } from '../services/json';
import { getProgress } from '../services/progress';
import { getTodaysMissionScenario } from '../data/scenarios';
import { ALL_PRACTICE_TARGETS, defaultPracticeTarget } from '../data/practiceGoals';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAppTranslation } from '../i18n';

const { width: SW } = Dimensions.get('window');

type Props = {
  onOpenScenarios: () => void;
  onStartDailyMission: () => void;
  onStartDailyRun: (goalId: string) => void;
  onContinueScenarios: () => void;
  onOpenFlashPick: () => void;
  onOpenTrueOrFake: () => void;
};

export default function PracticeHubScreen({
  onOpenScenarios,
  onStartDailyMission,
  onStartDailyRun,
  onContinueScenarios,
  onOpenFlashPick,
  onOpenTrueOrFake,
}: Props) {
  const insets = useSafeAreaInsets();
  const t = useAppTranslation();
  const [selectedTargetId, setSelectedTargetId] = useState<string>(defaultPracticeTarget().id);
  const [todaySceneTitle, setTodaySceneTitle] = useState(t('home.defaultTitle'));
  const [todaySceneMeta, setTodaySceneMeta] = useState(t('home.defaultMeta'));
  const [todaySceneGoal, setTodaySceneGoal] = useState(t('home.defaultGoal'));

  useEffect(() => {
    (async () => {
      const data = await AsyncStorage.getItem('userProfile');
      if (!data) return;
      const parsed = tryParseJson<UserProfile>(data);
      if (!parsed) return;
      const savedLabel = parsed.goalDescription?.trim() || defaultPracticeTarget().label;
      const matched = ALL_PRACTICE_TARGETS.find(t => t.label === savedLabel) ?? defaultPracticeTarget();
      setSelectedTargetId(matched.id);

      const progress = await getProgress();
      const mission = getTodaysMissionScenario(
        parsed.language?.code ?? 'es',
        parsed.identity ?? null,
        parsed.completedScenarios ?? []
      );
      const minutes = mission.estimatedMinutes ?? 3;
      const playCount = progress.scenarioPlayCounts?.[mission.id] ?? 0;
      const awkwardCap = mission.difficulty === 'advanced' ? 1 : 2;
      const turnGoal = minutes >= 4 ? 6 : 5;
      setTodaySceneTitle(mission.title);
      setTodaySceneMeta(`${mission.location} · ~${minutes} min${playCount > 0 ? ` · ${playCount}×` : ''}`);
      setTodaySceneGoal(t('home.turnGoal', { turns: turnGoal, awkward: awkwardCap }));
    })();
  }, [t]);

  const bottomPad = Math.max(insets.bottom, 12) + 56;

  return (
    <View style={styles.root}>
      {/* Atmosphere */}
      <View style={styles.glow} pointerEvents="none" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.eyebrow}>{t('practice.eyebrow')}</Text>
        <Text style={styles.screenTitle}>{t('practice.title')}</Text>
        <Text style={styles.subtitle}>{t('practice.subtitle')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — günlük koşu */}
        <Text style={styles.sectionTitle}>{t('practice.main')}</Text>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['rgba(40,30,22,0.7)', 'rgba(18,24,34,0.9)']}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={['transparent', 'rgba(232,181,118,0.2)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.shimmer}
          />
          <Text style={styles.heroEyebrow}>{t('practice.dailyRun')}</Text>
          <Text style={styles.heroTitle} numberOfLines={2}>{todaySceneTitle}</Text>
          <Text style={styles.heroMeta} numberOfLines={1}>{todaySceneMeta}</Text>
          <View style={styles.heroGoalRow}>
            <Feather name="target" size={11} color={colors.accentWarm} />
            <Text style={styles.heroGoal}>{todaySceneGoal}</Text>
          </View>
          <TouchableOpacity style={styles.heroCta} activeOpacity={0.85} onPress={onStartDailyMission}>
            <Text style={styles.heroCtaText}>{t('home.enterScene')}</Text>
            <Feather name="arrow-right" size={15} color={colors.bgDeep} />
          </TouchableOpacity>
        </View>

        {/* Practice mode cards */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{t('practice.modes')}</Text>
        <View style={styles.modeGrid}>
          <TouchableOpacity style={styles.modeCard} onPress={onOpenScenarios} activeOpacity={0.8}>
            <View style={styles.modeIconCircle}>
              <Feather name="play-circle" size={20} color={colors.accentWarm} />
            </View>
            <Text style={styles.modeTitle}>{t('practice.sceneMode')}</Text>
            <Text style={styles.modeSub} numberOfLines={2}>{t('practice.sceneModeSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modeCard} onPress={onContinueScenarios} activeOpacity={0.8}>
            <View style={styles.modeIconCircle}>
              <Feather name="list" size={20} color={colors.accentWarmSoft} />
            </View>
            <Text style={styles.modeTitle}>{t('practice.sceneList')}</Text>
            <Text style={styles.modeSub} numberOfLines={2}>{t('practice.sceneListSub')}</Text>
          </TouchableOpacity>
        </View>

        {/* Goal run */}
        <TouchableOpacity
          style={styles.goalRow}
          onPress={() => onStartDailyRun(selectedTargetId)}
          activeOpacity={0.8}
        >
          <View style={styles.goalIcon}>
            <Feather name="navigation" size={16} color={colors.accentWarmSoft} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.goalTitle}>{t('practice.goalTitle')}</Text>
            <Text style={styles.goalSub}>{t('practice.goalSub')}</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.inkTertiary} />
        </TouchableOpacity>

        {/* Mini games */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('practice.miniGames')}</Text>
        <View style={styles.modeGrid}>
          <TouchableOpacity style={styles.modeCard} onPress={onOpenFlashPick} activeOpacity={0.8}>
            <View style={styles.modeIconCircle}>
              <Feather name="zap" size={20} color={colors.accentWarm} />
            </View>
            <Text style={styles.modeTitle}>Flash Pick</Text>
            <Text style={styles.modeSub} numberOfLines={2}>{t('practice.flashSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modeCard} onPress={onOpenTrueOrFake} activeOpacity={0.8}>
            <View style={styles.modeIconCircle}>
              <Feather name="check-circle" size={20} color={colors.successDs} />
            </View>
            <Text style={styles.modeTitle}>True or Fake</Text>
            <Text style={styles.modeSub} numberOfLines={2}>{t('practice.trueFakeSub')}</Text>
          </TouchableOpacity>
        </View>

        {/* Continue scenarios link */}
        <TouchableOpacity style={styles.continueRow} onPress={onContinueScenarios} activeOpacity={0.7}>
          <Text style={styles.continueText}>{t('practice.otherScenes')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },

  glow: {
    position: 'absolute',
    width: SW * 0.8,
    height: SW * 0.8,
    borderRadius: SW * 0.4,
    backgroundColor: 'rgba(232,181,118,0.05)',
    top: -SW * 0.2,
    right: -SW * 0.15,
  },

  topBar: {
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accentWarm,
    fontSize: 10,
    marginBottom: 10,
  },
  screenTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 30,
    color: colors.inkPrimary,
    letterSpacing: -0.5,
    lineHeight: 37,
    marginBottom: 8,
  },
  screenTitleItalic: {
    fontFamily: 'Fraunces_300Light_Italic',
    color: colors.accentWarm,
  },
  subtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.inkTertiary,
    lineHeight: 19,
  },

  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 4 },

  sectionTitle: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.inkSecondary,
    marginBottom: 12,
  },

  // Hero card
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232,181,118,0.2)',
    overflow: 'hidden',
    padding: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(28,20,14,0.8)',
  },
  shimmer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
  },
  heroEyebrow: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.accentWarmSoft,
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 20,
    color: colors.inkPrimary,
    letterSpacing: -0.3,
    lineHeight: 27,
    marginBottom: 6,
  },
  heroMeta: {
    ...typography.body,
    fontSize: 12,
    color: colors.inkTertiary,
    marginBottom: 10,
  },
  heroGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    marginBottom: 14,
  },
  heroGoal: { ...typography.body, fontSize: 12, color: colors.inkSecondary },
  heroCta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.inkPrimary,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  heroCtaText: { ...typography.button, fontSize: 14, color: colors.bgDeep },

  // Mode grid
  modeGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  modeCard: {
    flex: 1,
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  modeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.accentWarm}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modeTitle: { ...typography.bodyMedium, fontSize: 13, color: colors.inkPrimary, marginBottom: 4 },
  modeSub: { ...typography.body, fontSize: 11, color: colors.inkTertiary, lineHeight: 16 },

  // Goal row
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgMid,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    marginBottom: 4,
  },
  goalIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${colors.accentWarm}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: { ...typography.bodyMedium, fontSize: 13, color: colors.inkPrimary, marginBottom: 3 },
  goalSub: { ...typography.body, fontSize: 11, color: colors.inkTertiary },

  // Continue
  continueRow: { alignItems: 'center', paddingVertical: 16 },
  continueText: { ...typography.bodyMedium, fontSize: 13, color: colors.accentWarm },
});
