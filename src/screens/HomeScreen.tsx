import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import NotificationsSheet from '../components/NotificationsSheet';
import { tryParseJson } from '../services/json';
import WeeklyActivityChart from '../components/WeeklyActivityChart';
import { getDailyLeaderboard } from '../services/leaderboard';
import { getProgress, getLevelFromXp, getWeeklyXp, type DailyXpEntry } from '../services/progress';
import { getTodaysMissionScenario } from '../data/scenarios';
import { ALL_PRACTICE_TARGETS, defaultPracticeTarget } from '../data/practiceGoals';

type Props = {
  onOpenAccount?: () => void;
  onDebug?: () => void;
  onStartDailyMission?: () => void;
  onOpenProgress?: () => void;
};

const surface = '#FCF9F8';
const primary = '#884C32';
const terracotta = '#B06D50';
const onSurface = '#1B1C1C';
const onSurfaceVariant = '#53433E';
const outlineVariant = 'rgba(216, 194, 186, 0.35)';
const white = '#FFFFFF';

export default function HomeScreen({ onOpenAccount, onDebug, onStartDailyMission, onOpenProgress }: Props) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [todaySceneTitle, setTodaySceneTitle] = useState('Bugünün sahnesi hazırlanıyor...');
  const [todaySceneMeta, setTodaySceneMeta] = useState('Gerçek bir konuşmayı prova et');
  const [todaySceneGoal, setTodaySceneGoal] = useState('6 turu tamamla ve akışı koru');
  const [lastPlayedDate, setLastPlayedDate] = useState<string | null>(null);
  const [todayMemoryFocus, setTodayMemoryFocus] = useState<string | null>(null);
  const [memoryPhrase, setMemoryPhrase] = useState<string | null>(null);
  const [weeklyXpSeries, setWeeklyXpSeries] = useState<DailyXpEntry[]>([]);
  const [xp, setXp] = useState(0);
  const [leaderboardLine, setLeaderboardLine] = useState<string>('Bugünkü tablo yükleniyor…');

  useEffect(() => {
    loadProfile();
  }, []);

  const matchedTarget =
    ALL_PRACTICE_TARGETS.find(t => t.label === (profile?.goalDescription?.trim() || defaultPracticeTarget().label)) ??
    defaultPracticeTarget();

  const loadProfile = async () => {
    const data = await AsyncStorage.getItem('userProfile');
    if (!data) {
      setProfile(null);
      setLastPlayedDate(null);
      setTodayMemoryFocus(null);
      setMemoryPhrase(null);
      setWeeklyXpSeries([]);
      setXp(0);
      setLeaderboardLine('Sahneye gir, günlük sıralamaya katıl.');
      return;
    }

    const parsed = tryParseJson<UserProfile>(data);
    if (!parsed) {
      await AsyncStorage.removeItem('userProfile');
      setProfile(null);
      setLastPlayedDate(null);
      setTodayMemoryFocus(null);
      setMemoryPhrase(null);
      setWeeklyXpSeries([]);
      setXp(0);
      setLeaderboardLine('Sahneye gir, günlük sıralamaya katıl.');
      return;
    }

    setProfile(parsed);

    const progress = await getProgress();
    setXp(progress.xp);
    setWeeklyXpSeries(getWeeklyXp(progress.dailyXpLog ?? {}));
    const board = await getDailyLeaderboard();
    const self = board.find(e => e.isSelf);
    const top = board[0];
    if (self) {
      setLeaderboardLine(`Sen · #${self.rank} · ${self.score} puan`);
    } else if (top) {
      setLeaderboardLine(`Lider: ${top.name} — sen de sahneye gir`);
    } else {
      setLeaderboardLine('Sahneye gir, günlük sıralamaya katıl.');
    }
    setLastPlayedDate(progress.lastPlayedDate);
    setTodayMemoryFocus(progress.learningMemory?.nextRecommendedFocus ?? null);
    const saved = progress.learningMemory?.savedPhrases ?? [];
    setMemoryPhrase(saved.length > 0 ? saved[saved.length - 1] : null);
    const mission = getTodaysMissionScenario(
      parsed.language?.code ?? 'es',
      parsed.identity ?? null,
      parsed.completedScenarios ?? []
    );
    const minutes = mission.estimatedMinutes ?? 3;
    const scenarioPlayCount = progress.scenarioPlayCounts?.[mission.id] ?? 0;
    const awkwardCap = mission.difficulty === 'advanced' ? 1 : 2;
    const turnGoal = minutes >= 4 ? 6 : 5;
    setTodaySceneTitle(mission.title);
    setTodaySceneMeta(`${mission.location} · ~${minutes} dk${scenarioPlayCount > 0 ? ` · ${scenarioPlayCount} kez oynandı` : ''}`);
    setTodaySceneGoal(`${turnGoal} turu tamamla, ${awkwardCap}'den az garip yanıt ver`);
  };

  const focusHint = profile?.language?.name
    ? `${profile.language.name} pratiği · ${matchedTarget.hint}`
    : matchedTarget.hint;

  const yestStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const showYesterdayLesson = lastPlayedDate === yestStr;
  const missionFocusLine =
    todayMemoryFocus ??
    (showYesterdayLesson
      ? 'Dun sahneye girdin. Bugun hedefin: daha temiz akis ve daha az garip yanit.'
      : focusHint);

  const level = getLevelFromXp(xp);
  const bottomNavPad = Math.max(insets.bottom, 12) + 56;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => onOpenAccount?.()}
            onLongPress={onDebug}
            delayLongPress={480}
            activeOpacity={0.88}
            style={styles.avatarWrap}
            accessibilityLabel="Hesap"
          >
            <MaterialIcons name="person" size={24} color={terracotta} />
          </TouchableOpacity>
          <Text style={styles.wordmark}>Roleo</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.88}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setNotifOpen(true)}
            accessibilityLabel="Bildirimler"
          >
            <MaterialIcons name="notifications-none" size={22} color={terracotta} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={[styles.mainBody, { paddingBottom: bottomNavPad }]}>
        <View style={styles.upperStack}>
          <View style={styles.memoryFocusCard}>
            <Text style={styles.focusCardLabel}>Bugünün odağı</Text>
            <ScrollView
              style={styles.focusScroll}
              contentContainerStyle={styles.focusScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <Text style={styles.focusCardText}>{missionFocusLine}</Text>
              {!!memoryPhrase && <Text style={styles.memoryPhrase}>İfade: "{memoryPhrase}"</Text>}
            </ScrollView>
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
              barTrackHeight={64}
              chartPaddingTop={2}
              dayLabelMarginTop={3}
            />
          </View>

          <TouchableOpacity
            style={styles.statsStrip}
            onPress={() => onOpenProgress?.()}
            activeOpacity={onOpenProgress ? 0.88 : 1}
            disabled={!onOpenProgress}
            accessibilityRole={onOpenProgress ? 'button' : 'none'}
            accessibilityLabel="XP ve günlük tablo, detaylı ilerleme"
          >
            <View style={styles.statsStripHalf}>
              <MaterialIcons name="stars" size={18} color={terracotta} />
              <View style={styles.statsStripText}>
                <Text style={styles.statsStripLabel}>XP</Text>
                <Text style={styles.statsStripValue} numberOfLines={1}>
                  Seviye {level} · {xp} XP
                </Text>
              </View>
            </View>
            <View style={styles.statsStripDivider} />
            <View style={styles.statsStripHalf}>
              <MaterialIcons name="groups" size={18} color={terracotta} />
              <View style={styles.statsStripText}>
                <Text style={styles.statsStripLabel}>Bugünkü tablo</Text>
                <Text style={styles.statsStripValue} numberOfLines={2}>
                  {leaderboardLine}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.hero}>
            <View style={styles.heroContent}>
              <Text style={styles.heroHeadline}>Bugünkü sahne</Text>
              <Text style={styles.heroSubMeta}>Konuşmadan önce sahnede dene.</Text>

              <View style={styles.todaySceneCard}>
                <Text style={styles.todaySceneLabel}>Günlük görev</Text>
                <Text style={styles.todaySceneTitle} numberOfLines={2}>
                  {todaySceneTitle}
                </Text>
                <Text style={styles.todaySceneMeta} numberOfLines={2}>
                  {todaySceneMeta}
                </Text>
                <Text style={styles.todaySceneGoal} numberOfLines={2}>
                  Hedef: {todaySceneGoal}
                </Text>
              </View>

              <TouchableOpacity style={styles.heroCta} activeOpacity={0.9} onPress={() => onStartDailyMission?.()}>
                <Text style={styles.heroCtaText}>Sahneye Gir</Text>
                <MaterialIcons name="play-arrow" size={22} color={primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <NotificationsSheet visible={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface },
  safeTop: { backgroundColor: '#FCF9F7' },
  mainBody: {
    flex: 1,
    minHeight: 0,
  },
  upperStack: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  heroWrap: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 20,
    paddingTop: 2,
    justifyContent: 'flex-start',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(51,51,51,0.06)',
    backgroundColor: '#FCF9F7',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(136, 76, 50, 0.2)',
    backgroundColor: surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Poppins_700Bold',
    color: terracotta,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryFocusCard: {
    backgroundColor: '#F9F2ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(176, 109, 80, 0.28)',
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 10,
    marginBottom: 10,
  },
  focusCardLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: terracotta,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  focusScroll: {
    maxHeight: 160,
  },
  focusScrollContent: {
    paddingBottom: 4,
    flexGrow: 0,
  },
  focusCardText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
  },
  memoryPhrase: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins_500Medium',
    color: '#7A5B4A',
  },
  chartPanel: {
    backgroundColor: surface,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: outlineVariant,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  chartPanelTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
    flex: 1,
    paddingRight: 8,
  },
  chartWeekPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(176, 109, 80, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(176, 109, 80, 0.35)',
  },
  chartWeekPillText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: terracotta,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: outlineVariant,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 0,
    gap: 2,
  },
  statsStripHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  statsStripDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(51,51,51,0.12)',
    marginVertical: 2,
  },
  statsStripText: { flex: 1, minWidth: 0 },
  statsStripLabel: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
    color: terracotta,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  statsStripValue: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
  },
  hero: {
    backgroundColor: primary,
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  heroContent: { zIndex: 2 },
  heroHeadline: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: 'Poppins_600SemiBold',
    color: white,
    marginBottom: 4,
    maxWidth: 300,
  },
  heroSubMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.82)',
    marginBottom: 4,
  },
  todaySceneCard: {
    backgroundColor: 'rgba(252, 249, 248, 0.16)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(252, 249, 248, 0.28)',
  },
  todaySceneLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255,255,255,0.74)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  todaySceneTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  todaySceneMeta: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 6,
  },
  todaySceneGoal: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255,255,255,0.92)',
    marginTop: 2,
  },
  heroCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: surface,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  heroCtaText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: primary,
    letterSpacing: 0.3,
  },
});
