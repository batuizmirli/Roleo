import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { getProgress, getUnlockState, getLevelFromXp, getLevelProgress, getWeeklyXp, ProgressState, UnlockState, DailyXpEntry } from '../services/progress';
import { getDailyLeaderboard, LeaderboardEntry } from '../services/leaderboard';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = {
  onBack: () => void;
};

const STAGE_LABELS: Record<string, string> = {
  cafe: '☕ Café',
  travel: '✈️ Travel',
  business: '💼 Business',
  social: '🎉 Social',
  story: '📖 Story',
  survival: '🛟 Survival',
};

export default function ProgressScreen({ onBack }: Props) {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [unlockState, setUnlockState] = useState<UnlockState | null>(null);
  const [weeklyXp, setWeeklyXp] = useState<DailyXpEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<(LeaderboardEntry & { rank: number })[]>([]);

  useEffect(() => {
    const load = async () => {
      const p = await getProgress();
      setProgress(p);
      setUnlockState(getUnlockState(p));
      setWeeklyXp(getWeeklyXp(p.dailyXpLog ?? {}));
      setLeaderboard(await getDailyLeaderboard());
    };
    load();
  }, []);

  if (!progress || !unlockState) return null;

  const xp = progress.xp;
  const level = getLevelFromXp(xp);
  const levelPct = Math.round(getLevelProgress(xp) * 100);
  const totalCompleted = progress.completedScenarioIds.length;
  const totalSessions = totalCompleted;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.fixedBackBtn}>
        <Text style={styles.fixedBackText}>←</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>📈 Gelişimin</Text>
      </View>

      <View style={styles.overviewCard}>
        <Text style={styles.overviewLabel}>Genel Durum</Text>
        <Text style={styles.overviewTitle}>Öğrenme ritmin istikrarlı ilerliyor.</Text>
        <Text style={styles.overviewText}>Ana ekrandaki yoğun kutuları kaldırdım; detaylı ilerleme artık burada daha sakin bir düzende duruyor.</Text>
      </View>

      {/* XP & Level */}
      <View style={styles.xpCard}>
        <View style={styles.xpRow}>
          <View>
            <Text style={styles.xpLabel}>SEVİYE</Text>
            <Text style={styles.xpLevel}>{level}</Text>
          </View>
          <View style={styles.xpRight}>
            <Text style={styles.xpTotal}>{xp} XP</Text>
            <Text style={styles.xpNext}>{100 - (xp % 100)} XP sonraki seviye</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${levelPct}%` }]} />
        </View>
        <Text style={styles.progressPct}>%{levelPct}</Text>
      </View>

      {/* Streak & Sessions */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statValue}>{progress.streak}</Text>
          <Text style={styles.statLabel}>Gün serisi</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🎭</Text>
          <Text style={styles.statValue}>{totalSessions}</Text>
          <Text style={styles.statLabel}>Tamamlanan sahne</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🔓</Text>
          <Text style={styles.statValue}>{unlockState.unlockedStageTypes.length}</Text>
          <Text style={styles.statLabel}>Açık stage tipi</Text>
        </View>
      </View>

      {/* Weekly XP Chart */}
      <Text style={styles.sectionTitle}>Haftal\u0131k XP</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartRow}>
          {weeklyXp.map((day, i) => {
            const maxXp = Math.max(...weeklyXp.map(d => d.xp), 1);
            const heightPct = Math.max((day.xp / maxXp) * 100, 4);
            const isToday = i === weeklyXp.length - 1;
            return (
              <View key={day.date} style={styles.chartCol}>
                <Text style={styles.chartXp}>{day.xp > 0 ? day.xp : ''}</Text>
                <View style={styles.chartBarBg}>
                  <View style={[styles.chartBar, { height: `${heightPct}%` }, isToday && styles.chartBarToday]} />
                </View>
                <Text style={[styles.chartLabel, isToday && styles.chartLabelToday]}>{day.label}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.chartTotal}>Toplam: {weeklyXp.reduce((s, d) => s + d.xp, 0)} XP</Text>
      </View>

      {leaderboard.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Günlük Arena</Text>
          <View style={styles.lbCard}>
            <Text style={styles.lbHint}>Bugünkü sahne skorlarına göre sıra (yerel).</Text>
            {leaderboard.slice(0, 6).map(row => (
              <View key={row.id} style={[styles.lbRow, row.isSelf && styles.lbRowSelf]}>
                <Text style={styles.lbRank}>#{row.rank}</Text>
                <Text style={[styles.lbName, row.isSelf && styles.lbNameSelf]} numberOfLines={1}>
                  {row.name}{row.isSelf ? ' (sen)' : ''}
                </Text>
                <Text style={styles.lbScore}>{row.score}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Stage Breakdown */}
      <Text style={styles.sectionTitle}>Stage Tipleri</Text>
      {Object.entries(STAGE_LABELS).map(([key, label]) => {
        const count = unlockState.stageCounts[key as keyof typeof unlockState.stageCounts] ?? 0;
        const isUnlocked = unlockState.unlockedStageTypes.includes(key as any);
        return (
          <View key={key} style={[styles.stageRow, !isUnlocked && styles.stageRowLocked]}>
            <Text style={styles.stageLabel}>{label}</Text>
            <View style={styles.stageRight}>
              {!isUnlocked
                ? <Text style={styles.stageLocked}>🔒 Kilitli</Text>
                : count > 0
                ? <Text style={styles.stageDone}>✓ {count} tamamlandı</Text>
                : <Text style={styles.stageEmpty}>Henüz başlanmadı</Text>
              }
            </View>
          </View>
        );
      })}

      {/* Next Goal */}
      {!!unlockState.nextGoal && (
        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>SIRADAKI HEDEF</Text>
          <Text style={styles.goalText}>{unlockState.nextGoal}</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 96, paddingBottom: spacing.xxxl },
  overviewCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  overviewLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 8 },
  overviewTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, marginBottom: 8 },
  overviewText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  chartCard: { backgroundColor: colors.primaryCard, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.primaryBorder },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, gap: spacing.xs },
  chartCol: { flex: 1, alignItems: 'center', gap: spacing.xs },
  chartXp: { fontSize: 10, color: colors.textMuted, fontWeight: typography.weight.bold },
  chartBarBg: { width: '100%', height: 80, backgroundColor: colors.surface, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBar: { width: '100%', backgroundColor: colors.primaryAccent, borderRadius: 6, minHeight: 4 },
  chartBarToday: { backgroundColor: colors.secondaryAccent },
  chartLabel: { fontSize: 10, color: colors.textMuted, fontWeight: typography.weight.semibold },
  chartLabelToday: { color: colors.primaryAccent, fontWeight: typography.weight.bold },
  chartTotal: { fontSize: typography.size.xs, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  fixedBackBtn: {
    position: 'absolute',
    top: 52,
    left: spacing.xl,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  fixedBackText: { fontSize: 20, color: colors.textPrimary },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28, paddingLeft: 52 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  xpCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  xpLabel: { fontSize: 10, fontWeight: '900', color: colors.primaryAccent, letterSpacing: 1.5 },
  xpLevel: { fontSize: 48, fontWeight: '900', color: colors.textPrimary, lineHeight: 54 },
  xpRight: { alignItems: 'flex-end' },
  xpTotal: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  xpNext: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  progressBar: { height: 8, borderRadius: 999, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 999, backgroundColor: colors.primaryAccent },
  progressPct: { fontSize: 11, color: colors.textMuted, marginTop: 6, textAlign: 'right' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  statEmoji: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '900', color: colors.textPrimary },
  statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.textSecondary, marginBottom: 12, letterSpacing: 0.5 },
  stageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E8EDF2' },
  stageRowLocked: { opacity: 0.45 },
  stageLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  stageRight: {},
  stageDone: { fontSize: 13, color: colors.secondaryAccent, fontWeight: '700' },
  stageEmpty: { fontSize: 13, color: colors.textMuted },
  stageLocked: { fontSize: 13, color: colors.textMuted },
  goalCard: { marginTop: 24, backgroundColor: colors.primaryAccentSoft, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E8CBB5' },
  goalLabel: { fontSize: 10, fontWeight: '900', color: colors.primaryAccent, letterSpacing: 1.5, marginBottom: 8 },
  goalText: { fontSize: 14, color: colors.textPrimary, lineHeight: 22 },
  lbCard: {
    backgroundColor: colors.primaryCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  lbHint: { fontSize: 12, color: colors.textSecondary, marginBottom: 10, lineHeight: 18 },
  lbRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.primaryBorder },
  lbRowSelf: { backgroundColor: colors.surface, marginHorizontal: -6, paddingHorizontal: 8, borderRadius: 10, borderBottomWidth: 0 },
  lbRank: { width: 34, fontSize: 12, fontWeight: '800', color: colors.textMuted },
  lbName: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  lbNameSelf: { color: colors.secondaryAccent },
  lbScore: { fontSize: 13, fontWeight: '900', color: colors.primaryAccent },
});
