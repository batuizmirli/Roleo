import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { getProgress, getUnlockState, getLevelFromXp, getLevelProgress, ProgressState, UnlockState } from '../services/progress';

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

  useEffect(() => {
    const load = async () => {
      const p = await getProgress();
      setProgress(p);
      setUnlockState(getUnlockState(p));
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
  container: { flex: 1, backgroundColor: '#0A0A12' },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#16162A', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: '#FFF' },
  title: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  xpCard: { backgroundColor: '#16162A', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#252540' },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  xpLabel: { fontSize: 10, fontWeight: '900', color: '#E8324A', letterSpacing: 1.5 },
  xpLevel: { fontSize: 48, fontWeight: '900', color: '#FFF', lineHeight: 54 },
  xpRight: { alignItems: 'flex-end' },
  xpTotal: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  xpNext: { fontSize: 12, color: '#888', marginTop: 4 },
  progressBar: { height: 8, borderRadius: 999, backgroundColor: '#0A0A12', overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 999, backgroundColor: '#E8324A' },
  progressPct: { fontSize: 11, color: '#666', marginTop: 6, textAlign: 'right' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: '#16162A', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#252540' },
  statEmoji: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  statLabel: { fontSize: 10, color: '#777', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#AAA', marginBottom: 12, letterSpacing: 0.5 },
  stageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#16162A' },
  stageRowLocked: { opacity: 0.45 },
  stageLabel: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  stageRight: {},
  stageDone: { fontSize: 13, color: '#3DD68C', fontWeight: '700' },
  stageEmpty: { fontSize: 13, color: '#555' },
  stageLocked: { fontSize: 13, color: '#555' },
  goalCard: { marginTop: 24, backgroundColor: '#0D1A10', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1A3020' },
  goalLabel: { fontSize: 10, fontWeight: '900', color: '#3DD68C', letterSpacing: 1.5, marginBottom: 8 },
  goalText: { fontSize: 14, color: '#CCC', lineHeight: 22 },
});
