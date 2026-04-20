import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { getProgress, getUnlockState, getLevelFromXp, getLevelProgress, getWeeklyXp, ProgressState, UnlockState, DailyXpEntry } from '../services/progress';
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

  useEffect(() => {
    const load = async () => {
      const p = await getProgress();
      setProgress(p);
      setUnlockState(getUnlockState(p));
      setWeeklyXp(getWeeklyXp(p.dailyXpLog ?? {}));
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📈 Gelişimin</Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.xxxl },
  chartCard: { backgroundColor: colors.primaryCard, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.primaryBorder },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, gap: spacing.xs },
  chartCol: { flex: 1, alignItems: 'center', gap: spacing.xs },
  chartXp: { fontSize: 10, color: colors.textMuted, fontWeight: typography.weight.bold },
  chartBarBg: { width: '100%', height: 80, backgroundColor: colors.surface, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBar: { width: '100%', backgroundColor: colors.primaryAccent, borderRadius: 6, minHeight: 4 },
  chartBarToday: { backgroundColor: '#3DD68C' },
  chartLabel: { fontSize: 10, color: colors.textMuted, fontWeight: typography.weight.semibold },
  chartLabelToday: { color: '#3DD68C', fontWeight: typography.weight.bold },
  chartTotal: { fontSize: typography.size.xs, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: '#1A2B3C' },
  title: { fontSize: 22, fontWeight: '800', color: '#1A2B3C' },
  xpCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E8EDF2' },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  xpLabel: { fontSize: 10, fontWeight: '900', color: '#1B9C5A', letterSpacing: 1.5 },
  xpLevel: { fontSize: 48, fontWeight: '900', color: '#1A2B3C', lineHeight: 54 },
  xpRight: { alignItems: 'flex-end' },
  xpTotal: { fontSize: 22, fontWeight: '800', color: '#1A2B3C' },
  xpNext: { fontSize: 12, color: '#9AABB8', marginTop: 4 },
  progressBar: { height: 8, borderRadius: 999, backgroundColor: '#F5F7FA', overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 999, backgroundColor: '#1B9C5A' },
  progressPct: { fontSize: 11, color: '#9AABB8', marginTop: 6, textAlign: 'right' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E8EDF2' },
  statEmoji: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#1A2B3C' },
  statLabel: { fontSize: 10, color: '#6B7B8D', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#6B7B8D', marginBottom: 12, letterSpacing: 0.5 },
  stageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#FFFFFF' },
  stageRowLocked: { opacity: 0.45 },
  stageLabel: { fontSize: 14, fontWeight: '700', color: '#1A2B3C' },
  stageRight: {},
  stageDone: { fontSize: 13, color: '#3DD68C', fontWeight: '700' },
  stageEmpty: { fontSize: 13, color: '#B0BEC5' },
  stageLocked: { fontSize: 13, color: '#B0BEC5' },
  goalCard: { marginTop: 24, backgroundColor: '#0D1A10', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1A3020' },
  goalLabel: { fontSize: 10, fontWeight: '900', color: '#3DD68C', letterSpacing: 1.5, marginBottom: 8 },
  goalText: { fontSize: 14, color: '#CCC', lineHeight: 22 },
});
