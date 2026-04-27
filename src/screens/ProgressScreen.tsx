import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import {
  getProgress, getUnlockState, getLevelFromXp, getLevelProgress,
  getWeeklyXp, ProgressState, UnlockState, DailyXpEntry,
} from '../services/progress';
import { getDailyLeaderboard, LeaderboardEntry } from '../services/leaderboard';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

const { width: SW } = Dimensions.get('window');

type Props = { onBack: () => void };

const STAGE_META: Record<string, { icon: string; label: string }> = {
  cafe:     { icon: 'coffee',      label: 'Café' },
  travel:   { icon: 'navigation',  label: 'Seyahat' },
  business: { icon: 'briefcase',   label: 'İş' },
  social:   { icon: 'users',       label: 'Sosyal' },
  story:    { icon: 'book-open',   label: 'Hikaye' },
  survival: { icon: 'shield',      label: 'Hayatta Kalma' },
};

export default function ProgressScreen({ onBack }: Props) {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [unlockState, setUnlockState] = useState<UnlockState | null>(null);
  const [weeklyXp, setWeeklyXp] = useState<DailyXpEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<(LeaderboardEntry & { rank: number })[]>([]);

  useEffect(() => {
    (async () => {
      const p = await getProgress();
      setProgress(p);
      setUnlockState(getUnlockState(p));
      setWeeklyXp(getWeeklyXp(p.dailyXpLog ?? {}));
      setLeaderboard(await getDailyLeaderboard());
    })();
  }, []);

  if (!progress || !unlockState) return (
    <View style={styles.container} />
  );

  const xp = progress.xp;
  const level = getLevelFromXp(xp);
  const levelPct = Math.round(getLevelProgress(xp) * 100);
  const totalCompleted = progress.completedScenarioIds.length;
  const maxWeeklyXp = Math.max(...weeklyXp.map(d => d.xp), 1);

  return (
    <View style={styles.container}>
      {/* Atmosphere */}
      <View style={styles.glow1} pointerEvents="none" />

      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <Feather name="arrow-left" size={18} color={colors.inkSecondary} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>GELİŞİMİN</Text>
          <Text style={styles.title}>
            Sahne{'\n'}
            <Text style={styles.titleItalic}>geçmişin</Text>
          </Text>
        </View>

        {/* XP + Level card */}
        <View style={styles.xpCard}>
          <LinearGradient
            colors={['rgba(40,30,22,0.6)', 'rgba(18,24,34,0.8)']}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={['transparent', 'rgba(232,181,118,0.18)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.shimmer}
          />
          <View style={styles.xpRow}>
            <View>
              <Text style={styles.xpEyebrow}>SEVİYE</Text>
              <Text style={styles.xpLevel}>{level}</Text>
            </View>
            <View style={styles.xpRight}>
              <Text style={styles.xpTotal}>{xp} XP</Text>
              <Text style={styles.xpNext}>{100 - (xp % 100)} XP sonraki seviye</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={styles.levelBar}>
            <View style={[styles.levelBarFill, { width: `${levelPct}%` }]} />
          </View>
          <Text style={styles.levelPct}>%{levelPct}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Feather name="zap" size={18} color={colors.accentWarm} />
            <Text style={styles.statValue}>{progress.streak}</Text>
            <Text style={styles.statLabel}>Gün serisi</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="play-circle" size={18} color={colors.accentWarmSoft} />
            <Text style={styles.statValue}>{totalCompleted}</Text>
            <Text style={styles.statLabel}>Tamamlanan</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="unlock" size={18} color={colors.successDs} />
            <Text style={styles.statValue}>{unlockState.unlockedStageTypes.length}</Text>
            <Text style={styles.statLabel}>Açık tip</Text>
          </View>
        </View>

        {/* Weekly chart */}
        <Text style={styles.sectionTitle}>HAFTALIK XP</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartRow}>
            {weeklyXp.map((day, i) => {
              const heightPct = Math.max((day.xp / maxWeeklyXp) * 100, 4);
              const isToday = i === weeklyXp.length - 1;
              return (
                <View key={day.date} style={styles.chartCol}>
                  {day.xp > 0 && (
                    <Text style={styles.chartXpLabel}>{day.xp}</Text>
                  )}
                  <View style={styles.chartBarBg}>
                    <LinearGradient
                      colors={isToday
                        ? [colors.accentWarm, colors.accentWarmSoft]
                        : [colors.bgSoft, colors.bgSoft]}
                      style={[styles.chartBar, { height: `${heightPct}%` as any }]}
                    />
                  </View>
                  <Text style={[styles.chartDayLabel, isToday && styles.chartDayLabelToday]}>
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.chartTotal}>
            Toplam: {weeklyXp.reduce((s, d) => s + d.xp, 0)} XP
          </Text>
        </View>

        {/* Stage breakdown */}
        <Text style={styles.sectionTitle}>STAGE TİPLERİ</Text>
        <View style={styles.stageCard}>
          {Object.entries(STAGE_META).map(([key, meta], i) => {
            const count = (unlockState.stageCounts as any)[key] ?? 0;
            const isUnlocked = unlockState.unlockedStageTypes.includes(key as any);
            return (
              <View
                key={key}
                style={[
                  styles.stageRow,
                  i < Object.keys(STAGE_META).length - 1 && styles.stageRowBorder,
                  !isUnlocked && styles.stageRowLocked,
                ]}
              >
                <View style={styles.stageLeft}>
                  <Feather name={meta.icon as any} size={13} color={isUnlocked ? colors.inkSecondary : colors.inkTertiary} />
                  <Text style={styles.stageLabel}>{meta.label}</Text>
                </View>
                {!isUnlocked ? (
                  <View style={styles.stageLockBadge}>
                    <Feather name="lock" size={10} color={colors.inkTertiary} />
                    <Text style={styles.stageLockText}>Kilitli</Text>
                  </View>
                ) : count > 0 ? (
                  <Text style={styles.stageDone}>{count} tamamlandı</Text>
                ) : (
                  <Text style={styles.stageEmpty}>Henüz başlanmadı</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>GÜNLÜK ARENA</Text>
            <View style={styles.lbCard}>
              <Text style={styles.lbHint}>Bugünkü sahne skorları</Text>
              {leaderboard.slice(0, 6).map(row => (
                <View
                  key={row.id}
                  style={[styles.lbRow, row.isSelf && styles.lbRowSelf]}
                >
                  <Text style={styles.lbRank}>#{row.rank}</Text>
                  <Text
                    style={[styles.lbName, row.isSelf && styles.lbNameSelf]}
                    numberOfLines={1}
                  >
                    {row.name}{row.isSelf ? ' (sen)' : ''}
                  </Text>
                  <Text style={styles.lbScore}>{row.score}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Next goal */}
        {!!unlockState.nextGoal && (
          <View style={styles.goalCard}>
            <View style={styles.goalLeft}>
              <Feather name="target" size={13} color={colors.accentWarm} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.goalEyebrow}>SIRADAKI HEDEF</Text>
              <Text style={styles.goalText}>{unlockState.nextGoal}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },

  glow1: {
    position: 'absolute',
    width: SW * 0.8,
    height: SW * 0.8,
    borderRadius: SW * 0.4,
    backgroundColor: 'rgba(232,181,118,0.05)',
    top: -SW * 0.15,
    right: -SW * 0.2,
  },

  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 20,
    zIndex: 100,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgMid,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 108 : 88, paddingBottom: 40 },

  header: { marginBottom: 28 },
  eyebrow: { ...typography.eyebrow, color: colors.accentWarm, fontSize: 10, marginBottom: 10 },
  title: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 34,
    color: colors.inkPrimary,
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  titleItalic: {
    fontFamily: 'Fraunces_300Light_Italic',
    color: colors.accentWarm,
  },

  // XP card
  xpCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232,181,118,0.18)',
    overflow: 'hidden',
    padding: 22,
    marginBottom: 14,
    backgroundColor: 'rgba(28,20,14,0.7)',
  },
  shimmer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  xpEyebrow: { ...typography.eyebrow, fontSize: 9, color: colors.accentWarmSoft, marginBottom: 4 },
  xpLevel: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 52,
    color: colors.inkPrimary,
    lineHeight: 58,
    letterSpacing: -1,
  },
  xpRight: { alignItems: 'flex-end' },
  xpTotal: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 24,
    color: colors.inkPrimary,
    letterSpacing: -0.5,
  },
  xpNext: { ...typography.body, fontSize: 12, color: colors.inkTertiary, marginTop: 4 },
  levelBar: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.hairlineStrong,
    overflow: 'hidden',
    marginBottom: 6,
  },
  levelBarFill: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accentWarm,
  },
  levelPct: { ...typography.body, fontSize: 11, color: colors.inkTertiary, textAlign: 'right' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    gap: 6,
  },
  statValue: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 26,
    color: colors.inkPrimary,
    letterSpacing: -0.5,
  },
  statLabel: { ...typography.body, fontSize: 10, color: colors.inkTertiary, textAlign: 'center' },

  sectionTitle: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.inkTertiary,
    marginBottom: 12,
  },

  // Chart
  chartCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, gap: 4, marginBottom: 8 },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  chartXpLabel: { ...typography.body, fontSize: 9, color: colors.inkTertiary },
  chartBarBg: {
    width: '100%',
    height: 72,
    backgroundColor: colors.bgSoft,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: { width: '100%', borderRadius: 4, minHeight: 3 },
  chartDayLabel: { ...typography.body, fontSize: 9, color: colors.inkTertiary },
  chartDayLabelToday: { color: colors.accentWarm, fontFamily: 'InterTight_500Medium' },
  chartTotal: { ...typography.body, fontSize: 11, color: colors.inkTertiary, textAlign: 'center' },

  // Stage breakdown
  stageCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: 28,
    overflow: 'hidden',
  },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  stageRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  stageRowLocked: { opacity: 0.4 },
  stageLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stageLabel: { ...typography.bodyMedium, fontSize: 14, color: colors.inkPrimary },
  stageLockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stageLockText: { ...typography.body, fontSize: 11, color: colors.inkTertiary },
  stageDone: { ...typography.body, fontSize: 12, color: colors.successDs },
  stageEmpty: { ...typography.body, fontSize: 12, color: colors.inkTertiary },

  // Leaderboard
  lbCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
    marginBottom: 28,
  },
  lbHint: { ...typography.body, fontSize: 11, color: colors.inkTertiary, marginBottom: 12 },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  lbRowSelf: { backgroundColor: colors.bgSoft, marginHorizontal: -4, paddingHorizontal: 4, borderRadius: 8, borderBottomWidth: 0 },
  lbRank: { width: 30, ...typography.body, fontSize: 12, color: colors.inkTertiary },
  lbName: { flex: 1, ...typography.bodyMedium, fontSize: 13, color: colors.inkPrimary },
  lbNameSelf: { color: colors.accentWarm },
  lbScore: { ...typography.bodyMedium, fontSize: 13, color: colors.accentWarm },

  // Goal card
  goalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,181,118,0.2)',
    padding: 16,
    marginBottom: 8,
  },
  goalLeft: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: `${colors.accentWarm}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalEyebrow: { ...typography.eyebrow, fontSize: 9, color: colors.accentWarmSoft, marginBottom: 4 },
  goalText: { ...typography.body, fontSize: 13, color: colors.inkSecondary, lineHeight: 19 },
});
