import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform,
  ScrollView, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import NotificationsSheet from '../components/NotificationsSheet';
import { tryParseJson } from '../services/json';
import { getProgress, getLevelFromXp, getLevelProgress, getLevelName, getUnlockState } from '../services/progress';
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
  onOpenJournal?: () => void;
};

export default function HomeScreen({ onOpenAccount, onDebug, onStartDailyMission, onOpenProgress, onOpenJournal }: Props) {
  const insets = useSafeAreaInsets();
  const t = useAppTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [todaySceneTitle, setTodaySceneTitle] = useState(t('home.defaultTitle'));
  const [todaySceneMeta, setTodaySceneMeta] = useState(t('home.defaultMeta'));
  const [todaySceneGoal, setTodaySceneGoal] = useState(t('home.defaultGoal'));
  const [todaySceneBg, setTodaySceneBg] = useState<string | null>(null);
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
    setTodaySceneBg(mission.backgroundImage ?? null);
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
  const levelName = getLevelName(level);
  const xpProgress = getLevelProgress(xp);
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
          styles.bodyWrap,
          { opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0,1], outputRange: [16,0] }) }] },
        ]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.body, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
        {/* Eyebrow */}
        <Text style={styles.eyebrow}>{t('home.eyebrow')}</Text>

        {/* Hero title */}
        <Text style={styles.heroTitle}>
          {t('home.hero', { language: langName })}
        </Text>

        {/* Today's scene card */}
        <ImageBackground
          source={todaySceneBg ? { uri: todaySceneBg } : undefined}
          style={styles.sceneCard}
          imageStyle={{ opacity: 0.55, borderRadius: 20 }}
        >
          <LinearGradient
            colors={['rgba(40,30,22,0.60)', 'rgba(18,24,34,0.92)']}
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
        </ImageBackground>

        {/* CTA */}
        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={onStartDailyMission}
        >
          <Text style={styles.ctaText}>{t('home.enterScene')}</Text>
          <Feather name="arrow-right" size={16} color={colors.bgDeep} />
        </TouchableOpacity>

        {/* Quick action grid */}
        <View style={styles.quickGrid}>
          {[
            { icon: 'mic' as const, label: 'Sesli pratik', onPress: onStartDailyMission },
            { icon: 'book-open' as const, label: 'Prova defteri', onPress: onOpenJournal },
            { icon: 'zap' as const, label: 'Anlık öğren', onPress: undefined },
            { icon: 'bar-chart-2' as const, label: 'Gelişimim', onPress: onOpenProgress },
          ].map(({ icon, label, onPress }) => (
            <TouchableOpacity
              key={label}
              style={styles.quickCard}
              activeOpacity={0.75}
              onPress={onPress}
              disabled={!onPress}
            >
              <View style={styles.quickCardIcon}>
                <Feather name={icon} size={16} color={colors.accentWarm} />
              </View>
              <Text style={styles.quickCardLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress block */}
        <TouchableOpacity
          style={styles.progressBlock}
          onPress={onOpenProgress}
          activeOpacity={0.7}
          disabled={!onOpenProgress}
        >
          {/* Stat row */}
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{xp} XP</Text>
              <Text style={styles.statLabel}>Toplam</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streak} gün</Text>
              <Text style={styles.statLabel}>Seri</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Sv. {level}</Text>
              <Text style={styles.statLabel}>{levelName}</Text>
            </View>
          </View>
          <View style={styles.xpTrack}>
            <LinearGradient
              colors={[colors.accentWarmSoft, colors.accentWarm]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.xpFill, { width: `${Math.round(xpProgress * 100)}%` as any }]}
            />
          </View>
          <Text style={styles.xpNextLabel}>{100 - (xp % 100)} XP → {getLevelName(level + 1)}</Text>
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
          <TouchableOpacity
            style={styles.lastSessionCard}
            onPress={onOpenJournal}
            activeOpacity={onOpenJournal ? 0.75 : 1}
            disabled={!onOpenJournal}
          >
            <View style={styles.lastSessionHeader}>
              <Text style={styles.lastSessionEyebrow}>SON PROVADAN HATIRLADIM</Text>
              <Text style={styles.lastSessionScenario} numberOfLines={1}>
                {lastSession.scenarioTitle}
              </Text>
            </View>
            {lastSession.nextFocus ? (
              <Text style={styles.lastSessionMemoryLine} numberOfLines={3}>
                {lastSession.nextFocus}
              </Text>
            ) : lastSession.bestLine ? (
              <Text style={styles.lastSessionMemoryLine} numberOfLines={2}>
                "{lastSession.bestLine}"
              </Text>
            ) : null}
            {onOpenJournal ? (
              <View style={styles.lastSessionFooter}>
                <Text style={styles.lastSessionJournalLink}>Prova defteri →</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        )}

        <View style={styles.plusMemoryCard}>
          <Feather name="archive" size={13} color={colors.accentWarmSoft} />
          <View style={{ flex: 1 }}>
            <Text style={styles.plusMemoryTitle}>{PLUS_SOFT_UPSELL.title}</Text>
            <Text style={styles.plusMemorySub}>{PLUS_SOFT_UPSELL.subtitle}</Text>
          </View>
        </View>
        </ScrollView>
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
  bodyWrap: { flex: 1 },
  scroll: { flex: 1 },
  body: {
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
    minHeight: 210,
    backgroundColor: 'rgba(28,20,14,0.7)',
    justifyContent: 'flex-end',
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

  // Quick action grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: (SW - 48 - 10) / 2,
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    padding: 14,
    gap: 10,
  },
  quickCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(232,181,118,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardLabel: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 13,
    color: colors.inkSecondary,
    letterSpacing: -0.1,
  },

  // Stat row inside progress block
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 14,
    color: colors.inkPrimary,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 10,
    color: colors.inkTertiary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.hairlineStrong,
  },

  // Progress block
  progressBlock: {
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 10,
  },
  progressBlockTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressBlockLeft: { gap: 2 },
  progressBlockRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressLevelName: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 18,
    color: colors.inkPrimary,
    letterSpacing: -0.3,
  },
  progressLevelSub: {
    ...typography.body,
    fontSize: 11,
    color: colors.inkTertiary,
  },
  progressStreakText: {
    ...typography.bodyMedium,
    fontSize: 12,
    color: colors.inkSecondary,
  },
  xpTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.hairlineStrong,
    overflow: 'hidden',
  },
  xpFill: { height: 3, borderRadius: 2 },
  xpNextLabel: {
    ...typography.body,
    fontSize: 10,
    color: colors.inkTertiary,
  },

  // Suggestion
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
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
  lastSessionMemoryLine: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 19,
  },
  lastSessionFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  lastSessionJournalLink: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 11.5,
    color: colors.accentWarmSoft,
    letterSpacing: 0.2,
  },
  plusMemoryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
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
