import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WeeklyActivityChart from '../components/WeeklyActivityChart';
import { getProgress, getLevelFromXp, getLevelProgress, getWeeklyXp, type DailyXpEntry, type ProgressState } from '../services/progress';
import { UserProfile } from '../types';
import { tryParseJson } from '../services/json';

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

type BadgeModel = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  unlocked: boolean;
  progress: number;
};

const clampProgress = (value: number) => Math.max(0, Math.min(1, value));

const buildBadges = (progress: ProgressState, level: number): BadgeModel[] => {
  const completed = progress.completedScenarioIds.length;
  const savedPhraseCount = progress.learningMemory?.savedPhrases?.length ?? 0;
  const cleanMemory = (progress.learningMemory?.repeatedWeaknesses?.length ?? 0) === 0 && completed > 0;

  return [
    {
      id: 'first-run',
      title: 'İlk Prova',
      description: 'İlk gerçek hayat sahneni tamamla.',
      icon: 'flag',
      unlocked: completed >= 1,
      progress: clampProgress(completed / 1),
    },
    {
      id: 'streak-3',
      title: 'Prova Serisi',
      description: '3 günlük prova ritmi yakala.',
      icon: 'local-fire-department',
      unlocked: progress.streak >= 3,
      progress: clampProgress(progress.streak / 3),
    },
    {
      id: 'natural-reply',
      title: 'Doğal Cevap',
      description: 'Akışı bozmadan temiz cevaplar biriktir.',
      icon: 'verified',
      unlocked: cleanMemory || savedPhraseCount >= 2,
      progress: clampProgress(Math.max(savedPhraseCount / 2, cleanMemory ? 1 : 0)),
    },
    {
      id: 'streak-7',
      title: '7 Günlük Seri',
      description: 'Bir hafta boyunca Roleo’ya dön.',
      icon: 'military-tech',
      unlocked: progress.streak >= 7,
      progress: clampProgress(progress.streak / 7),
    },
    {
      id: 'scene-master',
      title: 'Sahne Ustası',
      description: '10 sahne provasını tamamla.',
      icon: 'theater-comedy',
      unlocked: completed >= 10,
      progress: clampProgress(completed / 10),
    },
    {
      id: 'level-5',
      title: 'Seviye 5',
      description: 'XP biriktirip beşinci seviyeye ulaş.',
      icon: 'emoji-events',
      unlocked: level >= 5,
      progress: clampProgress(level / 5),
    },
  ];
};

export default function ProfileHubScreen({ onOpenAccount, onOpenProgress }: Props) {
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [weeklyXpSeries, setWeeklyXpSeries] = useState<DailyXpEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const load = async () => {
      const profileRaw = await AsyncStorage.getItem('userProfile');
      setProfile(profileRaw ? tryParseJson<UserProfile>(profileRaw) : null);
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
  const levelPct = Math.round(getLevelProgress(xp) * 100);
  const weeklyTotal = weeklyXpSeries.reduce((sum, day) => sum + day.xp, 0);
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
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.topBar}>
          <View style={styles.headerIdentity}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{avatarInitial}</Text>
            </View>
            <View>
              <Text style={styles.brandText}>Roleo</Text>
              <Text style={styles.screenTitle}>Profil</Text>
            </View>
          </View>
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
        <Text style={styles.heroEyebrow}>Gelişim ve rozetler</Text>
        <Text style={styles.heroTitle}>Prova geçmişin burada güçlenir.</Text>

        <View style={styles.summaryBento}>
          <View style={styles.streakCard}>
            <View style={styles.streakIconWrap}>
              <MaterialIcons name="local-fire-department" size={42} color={primary} />
            </View>
            <Text style={styles.streakValue}>{streak}</Text>
            <Text style={styles.streakLabel}>Günlük seri</Text>
            <Text style={styles.streakHint}>Bugün kısa bir sahne daha oynayarak ritmi koru.</Text>
          </View>

          <View style={styles.sideStats}>
            <View style={styles.statTile}>
              <Text style={styles.statMiniLabel}>XP / Seviye</Text>
              <Text style={styles.statMiniValue}>{xp}</Text>
              <Text style={styles.statMiniSub}>Seviye {level} · %{levelPct}</Text>
              <View style={styles.levelTrack}>
                <View style={[styles.levelFill, { width: `${levelPct}%` }]} />
              </View>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statMiniLabel}>Sahne provası</Text>
              <Text style={styles.statMiniValue}>{completed}</Text>
              <Text style={styles.statMiniSub}>Tamamlanan gerçek an</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartPanel}>
          <View style={styles.chartTitleRow}>
            <View>
              <Text style={styles.chartPanelTitle}>Haftalık ilerleme</Text>
              <Text style={styles.chartPanelSub}>Bu hafta kazandığın XP akışı</Text>
            </View>
            <View style={styles.chartWeekPill}>
              <Text style={styles.chartWeekPillText}>{weeklyTotal} XP</Text>
            </View>
          </View>
          <WeeklyActivityChart
            series={weeklyXpSeries.length ? weeklyXpSeries : getWeeklyXp({})}
            accent={terracotta}
            barMuted="rgba(136, 76, 50, 0.35)"
            barEmpty="rgba(136, 76, 50, 0.12)"
          />
        </View>

        <View style={styles.badgeSectionHead}>
          <Text style={styles.sectionTitle}>Rozetler</Text>
          <Text style={styles.badgeCount}>{unlockedCount} / {badges.length} açık</Text>
        </View>
        <View style={styles.badgeGrid}>
          {badges.map(badge => (
            <View key={badge.id} style={[styles.badgeCard, !badge.unlocked && styles.badgeCardLocked]}>
              <View style={[styles.badgeIconCircle, badge.unlocked ? styles.badgeIconUnlocked : styles.badgeIconLocked]}>
                <MaterialIcons name={badge.unlocked ? badge.icon : 'lock'} size={26} color={badge.unlocked ? primary : '#9B8B82'} />
              </View>
              <Text style={[styles.badgeTitle, !badge.unlocked && styles.badgeTextLocked]}>{badge.title}</Text>
              <Text style={styles.badgeDesc} numberOfLines={2}>{badge.description}</Text>
              {!badge.unlocked && (
                <View style={styles.badgeProgressTrack}>
                  <View style={[styles.badgeProgressFill, { width: `${Math.round(badge.progress * 100)}%` }]} />
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.memoryCard}>
          <View style={styles.memoryTopRow}>
            <View style={styles.memoryIconWrap}>
              <MaterialIcons name="psychology" size={22} color={primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memoryLabel}>Prova Hafızası</Text>
              <Text style={styles.memoryText}>{memoryLine}</Text>
            </View>
          </View>
          {!!savedPhrase && (
            <View style={styles.savedPhrasePill}>
              <Text style={styles.savedPhraseLabel}>Son işe yarayan ifade</Text>
              <Text style={styles.savedPhraseText}>{savedPhrase}</Text>
            </View>
          )}
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
  safeTop: { backgroundColor: 'rgba(252,249,247,0.92)' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(136, 76, 50, 0.12)',
    backgroundColor: 'rgba(252,249,247,0.92)',
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5ECE8',
    borderWidth: 1,
    borderColor: outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    color: primary,
  },
  brandText: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: terracotta,
    letterSpacing: 0.6,
  },
  screenTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: outlineVariant,
  },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 18 },
  heroEyebrow: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: terracotta,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 31,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
    marginBottom: 18,
    maxWidth: 310,
  },
  summaryBento: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  streakCard: {
    flex: 1.12,
    minHeight: 218,
    backgroundColor: white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: outlineVariant,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A4542',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  streakIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF8F5',
    borderWidth: 1,
    borderColor: outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  streakValue: {
    fontSize: 46,
    lineHeight: 52,
    fontFamily: 'Poppins_700Bold',
    color: onSurface,
  },
  streakLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurfaceVariant,
    marginBottom: 8,
  },
  streakHint: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Poppins_500Medium',
    color: '#7A6E68',
    textAlign: 'center',
  },
  sideStats: {
    flex: 0.88,
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#FBF2ED',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: outlineVariant,
    padding: 14,
    justifyContent: 'center',
  },
  statMiniLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: terracotta,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statMiniValue: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
  },
  statMiniSub: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
    marginTop: 2,
  },
  levelTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(136, 76, 50, 0.12)',
    overflow: 'hidden',
    marginTop: 10,
  },
  levelFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: primary,
  },
  chartPanel: {
    backgroundColor: white,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: outlineVariant,
    shadowColor: '#4A4542',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 10,
  },
  chartPanelTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
  },
  chartPanelSub: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
    marginTop: 2,
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
  badgeSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: outlineVariant,
    paddingBottom: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
  },
  badgeCount: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurfaceVariant,
    backgroundColor: '#F5ECE8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  badgeCard: {
    width: '48%',
    minHeight: 178,
    backgroundColor: white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: outlineVariant,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#4A4542',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  badgeCardLocked: {
    backgroundColor: '#F5ECE8',
    borderStyle: 'dashed',
    opacity: 0.78,
  },
  badgeIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  badgeIconUnlocked: {
    backgroundColor: '#FFF8F5',
    borderWidth: 1.5,
    borderColor: primary,
  },
  badgeIconLocked: {
    backgroundColor: '#EAE1DC',
    borderWidth: 1,
    borderColor: '#D8C2BA',
  },
  badgeTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
    textAlign: 'center',
  },
  badgeTextLocked: {
    color: '#66574F',
  },
  badgeDesc: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
    textAlign: 'center',
    marginTop: 5,
  },
  badgeProgressTrack: {
    width: '100%',
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(136, 76, 50, 0.12)',
    overflow: 'hidden',
    marginTop: 'auto',
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#85736C',
  },
  memoryCard: {
    backgroundColor: '#F9F2ED',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(176, 109, 80, 0.28)',
    padding: 14,
    marginBottom: 16,
  },
  memoryTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  memoryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(165, 100, 72, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(176, 109, 80, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
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
  savedPhrasePill: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: outlineVariant,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  savedPhraseLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: terracotta,
    marginBottom: 3,
  },
  savedPhraseText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins_500Medium',
    color: onSurface,
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
