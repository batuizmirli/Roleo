import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import NotificationsSheet from '../components/NotificationsSheet';
import { tryParseJson } from '../services/json';
import { getProgress, getLevelFromXp, getUnlockState } from '../services/progress';
import { getTodaysMissionScenario } from '../data/scenarios';
import { ALL_PRACTICE_TARGETS, defaultPracticeTarget } from '../data/practiceGoals';
import { getLastSceneSession } from '../services/sessionMemory';
import type { SceneSession } from '../types';
import { PLUS_SOFT_UPSELL } from '../data/plus';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAppTranslation } from '../i18n';

const { width: SW } = Dimensions.get('window');

type Props = {
  onOpenAccount?: () => void;
  onDebug?: () => void;
  onStartDailyMission?: () => void;
  onOpenProgress?: () => void;
};

export default function HomeScreen({ onOpenAccount, onDebug, onStartDailyMission, onOpenProgress }: Props) {
  const insets = useSafeAreaInsets();
  const t = useAppTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [todaySceneTitle, setTodaySceneTitle] = useState(t('home.defaultTitle'));
  const [todaySceneMeta, setTodaySceneMeta] = useState(t('home.defaultMeta'));
  const [todaySceneGoal, setTodaySceneGoal] = useState(t('home.defaultGoal'));
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [smartSuggestion, setSmartSuggestion] = useState('Bugün sahnede daha doğal cevaplara odaklan.');
  const [lastSession, setLastSession] = useState<SceneSession | null>(null);
  const [nextUnlock, setNextUnlock] = useState('');

  // Entrance animation
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 700, delay: 120, useNativeDriver: true }).start();
  }, [entrance]);

  const matchedTarget =
    ALL_PRACTICE_TARGETS.find(t => t.label === (profile?.goalDescription?.trim() || defaultPracticeTarget().label)) ??
    defaultPracticeTarget();

  const loadProfile = async () => {
    const data = await AsyncStorage.getItem('userProfile');
    if (!data) { setProfile(null); setXp(0); setStreak(0); return; }
    const parsed = tryParseJson<UserProfile>(data);
    if (!parsed) { await AsyncStorage.removeItem('userProfile'); setProfile(null); return; }
    setProfile(parsed);

    const progress = await getProgress();
    setXp(progress.xp);
    setStreak(progress.streak);
    const unlockState = getUnlockState(progress);
    setNextUnlock(unlockState.nextFeature ? `Seviye ${unlockState.nextFeature.level}: ${unlockState.nextFeature.title}` : 'Tüm ana sahne özellikleri açık');

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
    setTodaySceneMeta(`${mission.location} · ~${minutes} min${playCount > 0 ? ` · ${t('home.played', { count: playCount })}` : ''}`);
    setTodaySceneGoal(t('home.turnGoal', { turns: turnGoal, awkward: awkwardCap }));
    setSmartSuggestion(
      progress.lastPlayedDate === new Date().toISOString().slice(0, 10)
        ? t('home.suggestionPlayed')
        : t('home.suggestionFresh')
    );

    const session = await getLastSceneSession();
    setLastSession(session);
  };

  useEffect(() => { loadProfile(); }, [t]);

  const level = getLevelFromXp(xp);
  const bottomPad = Math.max(insets.bottom, 12) + 56;
  const topPad = insets.top + 12;

  const langName = profile?.language?.name ?? 'dil';

  return (
    <View style={styles.root}>
      {/* Atmosphere glow blobs */}
      <View style={[styles.glow1]} pointerEvents="none" />
      <View style={[styles.glow2]} pointerEvents="none" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <TouchableOpacity
          onPress={onOpenAccount}
          onLongPress={onDebug}
          delayLongPress={480}
          activeOpacity={0.8}
          style={styles.avatarBtn}
        >
          <Feather name="user" size={18} color={colors.inkSecondary} />
        </TouchableOpacity>

        <Text style={styles.wordmark}>Roleo</Text>

        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.8}
          onPress={() => setNotifOpen(true)}
        >
          <Feather name="bell" size={18} color={colors.inkSecondary} />
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <Animated.View
        style={[
          styles.body,
          { paddingBottom: bottomPad, opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0,1], outputRange: [16,0] }) }] },
        ]}
      >
        {/* Eyebrow */}
        <Text style={styles.eyebrow}>{t('home.eyebrow')}</Text>

        {/* Hero title */}
        <Text style={styles.heroTitle}>
          {t('home.hero', { language: langName })}
        </Text>

        {/* Today's scene card */}
        <View style={styles.sceneCard}>
          <LinearGradient
            colors={['rgba(40,30,22,0.70)', 'rgba(18,24,34,0.90)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.sceneCardGradient}
          />
          {/* Shimmer top line */}
          <LinearGradient
            colors={['transparent', 'rgba(232,181,118,0.22)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sceneCardShimmer}
          />
          <Text style={styles.sceneCardEyebrow}>{t('home.sceneEyebrow')}</Text>
          <Text style={styles.sceneCardTitle} numberOfLines={2}>{todaySceneTitle}</Text>
          <Text style={styles.sceneCardMeta} numberOfLines={1}>{todaySceneMeta}</Text>
          <View style={styles.sceneCardGoalRow}>
            <Feather name="target" size={11} color={colors.accentWarm} />
            <Text style={styles.sceneCardGoal}>{todaySceneGoal}</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={onStartDailyMission}
        >
          <Text style={styles.ctaText}>{t('home.enterScene')}</Text>
          <Feather name="arrow-right" size={16} color={colors.bgDeep} />
        </TouchableOpacity>

        {/* Progress pill */}
        <TouchableOpacity
          style={styles.progressPill}
          onPress={onOpenProgress}
          activeOpacity={0.7}
          disabled={!onOpenProgress}
        >
          <View style={styles.progressPillItem}>
            <Feather name="zap" size={11} color={colors.accentWarm} />
            <Text style={styles.progressPillText}>{t('home.streak', { count: streak })}</Text>
          </View>
          <View style={styles.progressPillDivider} />
          <View style={styles.progressPillItem}>
            <Text style={styles.progressPillText}>{xp} XP</Text>
          </View>
          <View style={styles.progressPillDivider} />
          <View style={styles.progressPillItem}>
            <Text style={styles.progressPillText}>{t('home.level', { level })}</Text>
          </View>
        </TouchableOpacity>

        {/* Suggestion */}
        <View style={styles.suggestionCard}>
          <Feather name="coffee" size={13} color={colors.accentWarmSoft} />
          <Text style={styles.suggestionText} numberOfLines={2}>{smartSuggestion}</Text>
        </View>

        <TouchableOpacity style={styles.unlockCard} onPress={onOpenProgress} activeOpacity={0.78} disabled={!onOpenProgress}>
          <View style={styles.unlockIcon}>
            <Feather name="unlock" size={13} color={colors.accentWarm} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.unlockEyebrow}>SIRADAKİ AÇILIM</Text>
            <Text style={styles.unlockText} numberOfLines={1}>{nextUnlock}</Text>
          </View>
          <Feather name="chevron-right" size={15} color={colors.inkTertiary} />
        </TouchableOpacity>

        {/* Last scene session memory */}
        {lastSession && (
          <View style={styles.lastSessionCard}>
            <View style={styles.lastSessionHeader}>
              <Text style={styles.lastSessionEyebrow}>SON PROVA</Text>
              <Text style={styles.lastSessionScenario} numberOfLines={1}>
                {lastSession.scenarioTitle}
                {lastSession.npcPersona ? ` · ${lastSession.npcPersona}` : ''}
              </Text>
            </View>
            {lastSession.bestLine ? (
              <Text style={styles.lastSessionBestLine} numberOfLines={2}>
                "{lastSession.bestLine}"
              </Text>
            ) : null}
            {lastSession.nextFocus ? (
              <View style={styles.lastSessionFocusRow}>
                <Feather name="arrow-right" size={11} color={colors.inkTertiary} />
                <Text style={styles.lastSessionFocus} numberOfLines={2}>
                  {lastSession.nextFocus}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        <View style={styles.plusMemoryCard}>
          <Feather name="archive" size={13} color={colors.accentWarmSoft} />
          <View style={{ flex: 1 }}>
            <Text style={styles.plusMemoryTitle}>{PLUS_SOFT_UPSELL.title}</Text>
            <Text style={styles.plusMemorySub}>{PLUS_SOFT_UPSELL.subtitle}</Text>
          </View>
        </View>
      </Animated.View>

      <NotificationsSheet visible={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },

  // Atmosphere
  glow1: {
    position: 'absolute',
    width: SW * 0.9,
    height: SW * 0.9,
    borderRadius: SW * 0.45,
    backgroundColor: 'rgba(232,181,118,0.07)',
    top: -SW * 0.3,
    right: -SW * 0.3,
  },
  glow2: {
    position: 'absolute',
    width: SW * 0.7,
    height: SW * 0.7,
    borderRadius: SW * 0.35,
    backgroundColor: 'rgba(95,124,168,0.06)',
    bottom: SW * 0.1,
    left: -SW * 0.25,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 26,
    color: colors.accentWarm,
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Body
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
  },

  eyebrow: {
    ...typography.eyebrow,
    color: colors.accentWarm,
    fontSize: 10,
  },

  heroTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 34,
    color: colors.inkPrimary,
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  heroTitleItalic: {
    fontFamily: 'Fraunces_300Light_Italic',
    color: colors.accentWarm,
  },

  // Scene card
  sceneCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232,181,118,0.18)',
    overflow: 'hidden',
    padding: 20,
    backgroundColor: 'rgba(28,20,14,0.7)',
  },
  sceneCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  sceneCardShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  sceneCardEyebrow: {
    ...typography.eyebrow,
    color: colors.accentWarmSoft,
    fontSize: 9,
    marginBottom: 10,
  },
  sceneCardTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 20,
    color: colors.inkPrimary,
    letterSpacing: -0.3,
    lineHeight: 27,
    marginBottom: 6,
  },
  sceneCardMeta: {
    ...typography.body,
    fontSize: 12,
    color: colors.inkTertiary,
    marginBottom: 10,
  },
  sceneCardGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  sceneCardGoal: {
    ...typography.body,
    fontSize: 12,
    color: colors.inkSecondary,
  },

  // CTA
  cta: {
    backgroundColor: colors.inkPrimary,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    ...typography.button,
    fontSize: 15,
    color: colors.bgDeep,
  },

  // Progress pill
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgMid,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  progressPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressPillText: {
    ...typography.bodyMedium,
    fontSize: 12,
    color: colors.inkSecondary,
  },
  progressPillDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.hairlineStrong,
  },

  // Suggestion
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.bgMid,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderLeftWidth: 2,
    borderLeftColor: colors.accentWarmSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionText: {
    flex: 1,
    ...typography.body,
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 19,
  },
  unlockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(232,181,118,0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accentGlow,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  unlockIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockEyebrow: {
    ...typography.eyebrow,
    color: colors.accentWarm,
    fontSize: 8.5,
    marginBottom: 2,
  },
  unlockText: {
    ...typography.bodyMedium,
    color: colors.inkSecondary,
    fontSize: 12.5,
  },

  // Last session memory card
  lastSessionCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  lastSessionHeader: {
    gap: 3,
  },
  lastSessionEyebrow: {
    ...typography.eyebrow,
    color: colors.inkTertiary,
    fontSize: 9,
  },
  lastSessionScenario: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 12.5,
    color: colors.inkSecondary,
  },
  lastSessionBestLine: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 13,
    color: colors.inkPrimary,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  lastSessionFocusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  lastSessionFocus: {
    flex: 1,
    ...typography.body,
    fontSize: 11.5,
    color: colors.inkTertiary,
    lineHeight: 16,
  },
  plusMemoryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  plusMemoryTitle: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 12.5,
    color: colors.inkSecondary,
    marginBottom: 3,
  },
  plusMemorySub: {
    ...typography.body,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkTertiary,
  },
});
