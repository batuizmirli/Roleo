import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import WeeklyActivityChart from '../components/WeeklyActivityChart';
import { getProgress, getLevelFromXp, getWeeklyXp, type DailyXpEntry, type ProgressState } from '../services/progress';

type Props = {
  onOpenAccount: () => void;
  onOpenProgress: () => void;
};

const surface = '#FCF9F8';
const primary = '#884C32';
const terracotta = '#B06D50';
const onSurface = '#1B1C1C';
const onSurfaceVariant = '#53433E';
const outlineVariant = 'rgba(216, 194, 186, 0.35)';
const white = '#FFFFFF';

export default function ProfileHubScreen({ onOpenAccount, onOpenProgress }: Props) {
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [weeklyXpSeries, setWeeklyXpSeries] = useState<DailyXpEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      const p = await getProgress();
      setProgress(p);
      setWeeklyXpSeries(getWeeklyXp(p.dailyXpLog ?? {}));
    };
    void load();
  }, []);

  const bottomPad = Math.max(insets.bottom, 12) + 56;

  if (!progress) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontFamily: 'Poppins_500Medium', color: onSurfaceVariant }}>Yükleniyor…</Text>
      </View>
    );
  }

  const xp = progress.xp;
  const level = getLevelFromXp(xp);
  const completed = progress.completedScenarioIds.length;
  const streak = progress.streak;
  const memory = progress.learningMemory;
  const memoryLine =
    memory?.nextRecommendedFocus ??
    (memory?.savedPhrases?.length
      ? `Son kayıtlı ifade: "${memory.savedPhrases[memory.savedPhrases.length - 1]}"`
      : 'Sahne sonrası kaydettiğin ifadeler burada görünecek.');

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>Profil</Text>
          <TouchableOpacity onPress={onOpenAccount} style={styles.iconBtn} accessibilityLabel="Hesap">
            <MaterialIcons name="settings" size={22} color={terracotta} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statMini}>
            <Text style={styles.statMiniLabel}>Seviye</Text>
            <Text style={styles.statMiniValue}>{level}</Text>
          </View>
          <View style={styles.statMini}>
            <Text style={styles.statMiniLabel}>XP</Text>
            <Text style={styles.statMiniValue}>{xp}</Text>
          </View>
          <View style={styles.statMini}>
            <Text style={styles.statMiniLabel}>Seri</Text>
            <Text style={styles.statMiniValue}>{streak}</Text>
          </View>
          <View style={styles.statMini}>
            <Text style={styles.statMiniLabel}>Sahne</Text>
            <Text style={styles.statMiniValue}>{completed}</Text>
          </View>
        </View>

        <View style={styles.chartPanel}>
          <View style={styles.chartTitleRow}>
            <Text style={styles.chartPanelTitle}>Haftalık aktivite</Text>
            <View style={styles.chartWeekPill}>
              <Text style={styles.chartWeekPillText}>7 gün</Text>
            </View>
          </View>
          <WeeklyActivityChart
            series={weeklyXpSeries.length ? weeklyXpSeries : getWeeklyXp({})}
            accent={terracotta}
            barMuted="rgba(136, 76, 50, 0.35)"
            barEmpty="rgba(136, 76, 50, 0.12)"
          />
        </View>

        <View style={styles.memoryCard}>
          <Text style={styles.memoryLabel}>Öğrenme hafızası</Text>
          <Text style={styles.memoryText}>{memoryLine}</Text>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={onOpenAccount} activeOpacity={0.88}>
          <MaterialIcons name="person-outline" size={22} color={primary} />
          <Text style={styles.actionBtnText}>Hesap</Text>
          <MaterialIcons name="chevron-right" size={22} color={terracotta} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onOpenProgress} activeOpacity={0.88}>
          <MaterialIcons name="insights" size={22} color={primary} />
          <Text style={styles.actionBtnText}>Detaylı ilerleme</Text>
          <MaterialIcons name="chevron-right" size={22} color={terracotta} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface },
  safeTop: { backgroundColor: '#FCF9F7' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(51,51,51,0.06)',
    backgroundColor: '#FCF9F7',
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 18 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  statMini: {
    flexGrow: 1,
    minWidth: '22%',
    backgroundColor: white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: outlineVariant,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statMiniLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: terracotta,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statMiniValue: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
  },
  chartPanel: {
    backgroundColor: surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chartPanelTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
    flex: 1,
    paddingRight: 8,
  },
  chartWeekPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(176, 109, 80, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(176, 109, 80, 0.35)',
  },
  chartWeekPillText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: terracotta,
  },
  memoryCard: {
    backgroundColor: '#F9F2ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(176, 109, 80, 0.28)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  memoryLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: terracotta,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  memoryText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    gap: 12,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
  },
});
