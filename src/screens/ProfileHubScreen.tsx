import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WeeklyActivityChart from '../components/WeeklyActivityChart';
import { getProgress, getLevelFromXp, getLevelProgress, getWeeklyXp, type DailyXpEntry, type ProgressState } from '../services/progress';
import { UserProfile } from '../types';
import { tryParseJson } from '../services/json';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const { width: SW } = Dimensions.get('window');

type Props = {
  onOpenAccount: () => void;
  onOpenProgress: () => void;
};

type BadgeModel = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));

const buildBadges = (progress: ProgressState, level: number): BadgeModel[] => {
  const completed = progress.completedScenarioIds.length;
  const savedPhraseCount = progress.learningMemory?.savedPhrases?.length ?? 0;
  const cleanMemory = (progress.learningMemory?.repeatedWeaknesses?.length ?? 0) === 0 && completed > 0;
  return [
    { id: 'first-run',    title: 'İlk Prova',      description: 'İlk gerçek hayat sahneni tamamla.',       icon: 'flag',      unlocked: completed >= 1,         progress: clamp(completed / 1) },
    { id: 'streak-3',     title: 'Prova Serisi',   description: '3 günlük prova ritmi yakala.',             icon: 'zap',       unlocked: progress.streak >= 3,   progress: clamp(progress.streak / 3) },
    { id: 'natural',      title: 'Doğal Cevap',    description: 'Akışı bozmadan temiz cevaplar biriktir.', icon: 'check-circle', unlocked: cleanMemory || savedPhraseCount >= 2, progress: clamp(Math.max(savedPhraseCount / 2, cleanMemory ? 1 : 0)) },
    { id: 'streak-7',     title: '7 Günlük Seri',  description: "Bir hafta boyunca Roleo'ya dön.",         icon: 'award',     unlocked: progress.streak >= 7,   progress: clamp(progress.streak / 7) },
    { id: 'scene-master', title: 'Sahne Ustası',   description: '10 sahne provasını tamamla.',             icon: 'mic',       unlocked: completed >= 10,        progress: clamp(completed / 10) },
    { id: 'level-5',      title: 'Seviye 5',       description: 'XP biriktirip beşinci seviyeye ulaş.',    icon: 'star',      unlocked: level >= 5,             progress: clamp(level / 5) },
  ];
};

export default function ProfileHubScreen({ onOpenAccount, onOpenProgress }: Props) {
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [weeklyXpSeries, setWeeklyXpSeries] = useState<DailyXpEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    (async () => {
      const profileRaw = await AsyncStorage.getItem('userProfile');
      setProfile(profileRaw ? tryParseJson<UserProfile>(profileRaw) : null);
      const p = await getProgress();
      setProgress(p);
      setWeeklyXpSeries(getWeeklyXp(p.dailyXpLog ?? {}));
    })();
  }, []);

  const bottomPad = Math.max(insets.bottom, 12) + 56;

  if (!progress) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ ...typography.body, color: colors.inkTertiary }}>Yükleniyor…</Text>
      </View>
    );
  }

  const xp = progress.xp;
  const level = getLevelFromXp(xp);
  const completed = progress.completedScenarioIds.length;
  const streak = progress.streak;
  const memory = progress.learningMemory;
  const levelPct = Math.round(getLevelProgress(xp) * 100);
  const weeklyTotal = weeklyXpSeries.reduce((s, d) => s + d.xp, 0);
  const badges = buildBadges(progress, level);
  const unlockedCount = badges.filter(b => b.unlocked).length;
  const savedPhrase = memory?.savedPhrases?.[memory.savedPhrases.length - 1];
  const displayName = profile?.displayName?.trim();
  const avatarInitial = (displayName?.[0] ?? profile?.language?.flag ?? 'R').toUpperCase();
  const memoryLine =
    memory?.nextRecommendedFocus ??
    (memory?.savedPhrases?.length
      ? `Son kayıtlı ifade: "${memory.savedPhrases[memory.savedPhrases.length - 1]}"`
      : 'Prova sonrası işe yarayan ifadeler burada görünür.');

  return (
    <View style={styles.root}>
      <View style={styles.glow} pointerEvents="none" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{avatarInitial}</Text>
          </View>
          <View>
            <Text style={styles.eyebrow}>PROFİL</Text>
            <Text style={styles.screenTitle}>
              Prova{' '}
              <Text style={styles.screenTitleItalic}>geçmişin</Text>
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenAccount} activeOpacity={0.8}>
          <Feather name="settings" size={18} color={colors.inkSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats bento */}
        <View style={styles.bento}>
          {/* Streak card */}
          <View style={styles.streakCard}>
            <LinearGradient
              colors={['rgba(232,181,118,0.08)', 'rgba(232,181,118,0.02)']}
              style={StyleSheet.absoluteFillObject}
            />
            <Feather name="zap" size={28} color={colors.accentWarm} />
            <Text style={styles.streakValue}>{streak}</Text>
            <Text style={styles.streakLabel}>Günlük seri</Text>
          </View>

          {/* Side tiles */}
          <View style={styles.sideTiles}>
            <View style={styles.statTile}>
              <Text style={styles.tileLabel}>XP</Text>
              <Text style={styles.tileValue}>{xp}</Text>
              <Text style={styles.tileSub}>Sev. {level}</Text>
              <View style={styles.levelTrack}>
                <LinearGradient
                  colors={[colors.accentWarmSoft, colors.accentWarm]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.levelFill, { width: `${levelPct}%` as any }]}
                />
              </View>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.tileLabel}>SAHNE</Text>
              <Text style={styles.tileValue}>{completed}</Text>
              <Text style={styles.tileSub}>Tamamlanan</Text>
            </View>
          </View>
        </View>

        {/* Weekly chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Haftalık İlerleme</Text>
              <Text style={styles.chartSub}>Bu hafta kazandığın XP</Text>
            </View>
            <View style={styles.weekPill}>
              <Text style={styles.weekPillText}>{weeklyTotal} XP</Text>
            </View>
          </View>
          <WeeklyActivityChart
            series={weeklyXpSeries.length ? weeklyXpSeries : getWeeklyXp({})}
            accent={colors.accentWarm}
            barMuted={`${colors.accentWarm}50`}
            barEmpty={`${colors.accentWarm}18`}
          />
        </View>

        {/* Badges */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Rozetler</Text>
          <Text style={styles.badgeCount}>{unlockedCount} / {badges.length}</Text>
        </View>
        <View style={styles.badgeGrid}>
          {badges.map(badge => (
            <View key={badge.id} style={[styles.badgeCard, !badge.unlocked && styles.badgeCardLocked]}>
              <View style={[styles.badgeIconCircle, badge.unlocked ? styles.badgeIconUnlocked : styles.badgeIconLocked]}>
                <Feather
                  name={badge.unlocked ? (badge.icon as any) : 'lock'}
                  size={22}
                  color={badge.unlocked ? colors.accentWarm : colors.inkTertiary}
                />
              </View>
              <Text style={[styles.badgeTitle, !badge.unlocked && styles.badgeTitleLocked]}>{badge.title}</Text>
              <Text style={styles.badgeDesc} numberOfLines={2}>{badge.description}</Text>
              {!badge.unlocked && (
                <View style={styles.badgeTrack}>
                  <View style={[styles.badgeFill, { width: `${Math.round(badge.progress * 100)}%` as any }]} />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Memory card */}
        <View style={styles.memoryCard}>
          <View style={styles.memoryRow}>
            <View style={styles.memoryIcon}>
              <Feather name="cpu" size={16} color={colors.accentWarmSoft} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memoryLabel}>PROVA HAFIZASI</Text>
              <Text style={styles.memoryText}>{memoryLine}</Text>
            </View>
          </View>
          {!!savedPhrase && (
            <View style={styles.phrasePill}>
              <Text style={styles.phraseLabel}>Son işe yarayan ifade</Text>
              <Text style={styles.phraseText}>{savedPhrase}</Text>
            </View>
          )}
        </View>

        {/* Action rows */}
        <TouchableOpacity style={styles.actionRow} onPress={onOpenProgress} activeOpacity={0.8}>
          <Feather name="bar-chart-2" size={18} color={colors.accentWarmSoft} />
          <Text style={styles.actionText}>Detaylı ilerleme</Text>
          <Feather name="chevron-right" size={16} color={colors.inkTertiary} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={onOpenAccount} activeOpacity={0.8}>
          <Feather name="user" size={18} color={colors.accentWarmSoft} />
          <Text style={styles.actionText}>Hesap ayarları</Text>
          <Feather name="chevron-right" size={16} color={colors.inkTertiary} style={{ marginLeft: 'auto' }} />
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
    pointerEvents: 'none',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.accentWarm}18`,
    borderWidth: 1,
    borderColor: `${colors.accentWarm}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 20,
    color: colors.accentWarm,
  },
  eyebrow: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.accentWarm,
    marginBottom: 2,
  },
  screenTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 22,
    color: colors.inkPrimary,
    letterSpacing: -0.4,
  },
  screenTitleItalic: {
    fontFamily: 'Fraunces_300Light_Italic',
    color: colors.accentWarm,
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

  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 4, gap: 14 },

  // Bento
  bento: { flexDirection: 'row', gap: 10 },
  streakCard: {
    flex: 1.1,
    backgroundColor: colors.bgMid,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${colors.accentWarm}20`,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
    minHeight: 160,
  },
  streakValue: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 52,
    color: colors.inkPrimary,
    letterSpacing: -1,
    lineHeight: 60,
  },
  streakLabel: {
    ...typography.body,
    fontSize: 12,
    color: colors.inkTertiary,
  },
  sideTiles: { flex: 0.9, gap: 10 },
  statTile: {
    flex: 1,
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 12,
  },
  tileLabel: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.accentWarmSoft,
    marginBottom: 4,
  },
  tileValue: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 28,
    color: colors.inkPrimary,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  tileSub: {
    ...typography.body,
    fontSize: 11,
    color: colors.inkTertiary,
    marginTop: 2,
  },
  levelTrack: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.hairlineStrong,
    overflow: 'hidden',
    marginTop: 8,
  },
  levelFill: { height: 2, borderRadius: 1 },

  // Chart
  chartCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  chartTitle: {
    ...typography.bodyMedium,
    fontSize: 14,
    color: colors.inkPrimary,
    marginBottom: 3,
  },
  chartSub: {
    ...typography.body,
    fontSize: 11,
    color: colors.inkTertiary,
  },
  weekPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: `${colors.accentWarm}14`,
    borderWidth: 1,
    borderColor: `${colors.accentWarm}30`,
  },
  weekPillText: {
    ...typography.bodyMedium,
    fontSize: 11,
    color: colors.accentWarm,
  },

  // Section head
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.inkSecondary,
  },
  badgeCount: {
    ...typography.body,
    fontSize: 11,
    color: colors.accentWarmSoft,
  },

  // Badges
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: {
    width: '48%',
    minHeight: 160,
    backgroundColor: colors.bgMid,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    alignItems: 'center',
  },
  badgeCardLocked: {
    opacity: 0.6,
  },
  badgeIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  badgeIconUnlocked: {
    backgroundColor: `${colors.accentWarm}14`,
    borderWidth: 1,
    borderColor: `${colors.accentWarm}30`,
  },
  badgeIconLocked: {
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  badgeTitle: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.inkPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeTitleLocked: { color: colors.inkTertiary },
  badgeDesc: {
    ...typography.body,
    fontSize: 11,
    color: colors.inkTertiary,
    textAlign: 'center',
    lineHeight: 15,
  },
  badgeTrack: {
    width: '100%',
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.hairlineStrong,
    overflow: 'hidden',
    marginTop: 'auto',
  },
  badgeFill: { height: 2, borderRadius: 1, backgroundColor: colors.accentWarmSoft },

  // Memory card
  memoryCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderLeftWidth: 2,
    borderLeftColor: colors.accentWarmSoft,
    padding: 14,
  },
  memoryRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  memoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.accentWarm}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryLabel: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.accentWarmSoft,
    marginBottom: 6,
  },
  memoryText: {
    ...typography.body,
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 19,
  },
  phrasePill: {
    marginTop: 12,
    backgroundColor: colors.bgSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  phraseLabel: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.accentWarmSoft,
    marginBottom: 3,
  },
  phraseText: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.inkPrimary,
  },

  // Action rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgMid,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  actionText: {
    ...typography.bodyMedium,
    fontSize: 14,
    color: colors.inkPrimary,
  },
});
