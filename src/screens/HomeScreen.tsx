import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import NotificationsSheet from '../components/NotificationsSheet';
import { tryParseJson } from '../services/json';
import { getProgress, getLevelFromXp } from '../services/progress';
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
  const [todaySceneMeta, setTodaySceneMeta] = useState('Gerçek hayat konuşmasını prova et');
  const [todaySceneGoal, setTodaySceneGoal] = useState('6 turu tamamla ve akışı koru');
  const [lastPlayedDate, setLastPlayedDate] = useState<string | null>(null);
  const [todayMemoryFocus, setTodayMemoryFocus] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [smartSuggestion, setSmartSuggestion] = useState('Bugün sahnede daha doğal cevaplara odaklan.');

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
      setXp(0);
      setStreak(0);
      setSmartSuggestion('Gerçek hayatta söylemeden önce Roleo’da dene.');
      return;
    }

    const parsed = tryParseJson<UserProfile>(data);
    if (!parsed) {
      await AsyncStorage.removeItem('userProfile');
      setProfile(null);
      setLastPlayedDate(null);
      setTodayMemoryFocus(null);
      setXp(0);
      setStreak(0);
      setSmartSuggestion('Gerçek hayatta söylemeden önce Roleo’da dene.');
      return;
    }

    setProfile(parsed);

    const progress = await getProgress();
    setXp(progress.xp);
    setStreak(progress.streak);
    setLastPlayedDate(progress.lastPlayedDate);
    setTodayMemoryFocus(progress.learningMemory?.nextRecommendedFocus ?? null);
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
    setSmartSuggestion(
      progress.lastPlayedDate === new Date().toISOString().slice(0, 10)
        ? 'Pratik’te başka bir gerçek hayat sahnesi prova et.'
        : 'Öğren’de 2 dakikalık ısınma yap, sonra sahneye gir.'
    );
  };

  const focusHint = profile?.language?.name
    ? `${profile.language.name} pratiği · ${matchedTarget.hint}`
    : matchedTarget.hint;

  const yestStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const showYesterdayLesson = lastPlayedDate === yestStr;
  const missionFocusLine =
    todayMemoryFocus ??
    (showYesterdayLesson
      ? 'Dün sahneye girdin. Bugün hedefin: daha temiz akış.'
      : focusHint);

  const level = getLevelFromXp(xp);
  const bottomNavPad = Math.max(insets.bottom, 12) + 56;
  const progressPulse = `🔥 ${streak} gün seri · ⭐ ${xp} XP · Seviye ${level}`;

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
            <Text style={styles.focusCardText} numberOfLines={2}>{missionFocusLine}</Text>
          </View>
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.hero}>
            <View style={styles.heroContent}>
              <Text style={styles.heroHeadline}>Günlük Roleo koşusu</Text>
              <Text style={styles.heroSubMeta}>Isın, sahneye gir, sonucu gör.</Text>

              <View style={styles.todaySceneCard}>
                <Text style={styles.todaySceneLabel}>Bugünkü sahne</Text>
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
                <Text style={styles.heroCtaText}>Günlük Koşuya Başla</Text>
                <MaterialIcons name="play-arrow" size={22} color={primary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.progressPulse}
            onPress={() => onOpenProgress?.()}
            activeOpacity={onOpenProgress ? 0.88 : 1}
            disabled={!onOpenProgress}
            accessibilityRole={onOpenProgress ? 'button' : 'none'}
            accessibilityLabel="Kompakt ilerleme özeti"
          >
            <Text style={styles.progressPulseText} numberOfLines={1}>{progressPulse}</Text>
          </TouchableOpacity>

          <View style={styles.suggestionCard}>
            <MaterialIcons name="lightbulb-outline" size={18} color={terracotta} />
            <Text style={styles.suggestionText} numberOfLines={2}>{smartSuggestion}</Text>
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
    paddingTop: 10,
  },
  heroWrap: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
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
    marginBottom: 0,
  },
  focusCardLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: terracotta,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  focusCardText: {
    fontSize: 13,
    lineHeight: 20,
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
    marginBottom: 10,
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
  progressPulse: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 8,
  },
  progressPulseText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurfaceVariant,
    textAlign: 'center',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9F2ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(176, 109, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
  },
});
