import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import NotificationsSheet from '../components/NotificationsSheet';
import { tryParseJson } from '../services/json';
import { getLevelFromXp, getProgress, getWeeklyXp, type DailyXpEntry } from '../services/progress';
import { colors } from '../theme/colors';
import WeeklyActivityChart from '../components/WeeklyActivityChart';
import { ALL_PRACTICE_TARGETS, defaultPracticeTarget } from '../data/practiceGoals';

const LESSON_IMAGES = {
  scenarios:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBbtctSvx_HriBlpMS37XCcnY3eTll-alUxjMwhKb7oMKf-XDm3mjICRemXdXJctnEzyMVmdG3kSQYv1XGbhJsObmRqMfTXT0O4WtVHNf1lpiqR6GY5Ih_khda0f27szL26GNTkAwK_0mv03oFl_fICtzw1tyBkaaXvV6pO8u4U1CvrTH1tt7jYNhj56Dcerd_ablb7hzOVQMvv69iue3lTAE_ibZNDjnru1uRxqcgn-gmeAe-Qe07QUYttbqaeTXcWzhfM-H12nH_q',
  trueOrFake:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAUjXcrzjE4C6wau0P7C-fkISaTbqT61PsWcgEuTO46gD8gUboOWCPFI_D8XGtcCQeWhVwTen8IOIHksRdn5ihA2pvO8zhf6sM6jr9qnC6mzJmf07It2cdvuuv7dWrKIfHAvMHm1cIJW86R1gQqEmojxcDxvo3qErXsXSvKPYjzx6UfYveHzFSKQYdILZkXN9mgnU2pJjlaabjOgHi6uwRFMrMffLULdx5FkizJOCSrerStULUhj5qY1-axBvSVmCoj7jkktZP8BJlV',
  instant:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuASzAHrVeV45oQpiluyBlqkJlC65-gea9gcv_n6mRS7PG7TdqjgsihMMGBOmJ-cTtjxGK84c_Hu2P4X0Co6v2NhMB3wG8eH8kYFroeuWZ0QTxGU7KtjSpAETkCFkOmkMXZ97LDPycIHXWNi6FrBbO63zZmuBX7YmPINQhScLFr0BzolxjC2NK59SA03ip1ruzGZtKI2UnehaBKLiFa198E-IBGeOEBtFQxXmrbClU7xG_rXM74N3qIHKyIVXD3hGmMyhTb2N8RvOqKZ',
} as const;

type PickedCard = {
  id: 'scenarios' | 'true-or-fake' | 'instant-learn';
  tag: string;
  title: string;
  subtitle: string;
  image: string;
  thumbBg: string;
};

const PICKED_FOR_YOU: PickedCard[] = [
  {
    id: 'scenarios',
    tag: 'ORTA',
    title: 'Sahneye Devam Et',
    subtitle: 'Kaldığın yerden diyaloglara devam et',
    image: LESSON_IMAGES.scenarios,
    thumbBg: 'rgba(160, 103, 76, 0.12)',
  },
  {
    id: 'true-or-fake',
    tag: 'TEMEL',
    title: 'True or Fake',
    subtitle: 'Doğru kalıpları hızlıca ayırt et',
    image: LESSON_IMAGES.trueOrFake,
    thumbBg: 'rgba(165, 100, 72, 0.12)',
  },
  {
    id: 'instant-learn',
    tag: 'İLERİ',
    title: 'Serbest Pratik',
    subtitle: 'Yapay zeka ile dilediğin konuda konuş',
    image: LESSON_IMAGES.instant,
    thumbBg: 'rgba(231, 226, 217, 0.55)',
  },
];

type RoutineTile = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  fill: number;
  muted: boolean;
  onPress: () => void;
  /** Kart içi kısa açıklama (ör. grammar konuları) */
  caption?: string;
};

type Props = {
  onModeSelect: (mode: 'scenarios' | 'stories' | 'phrasebook') => void;
  onStartDailyRun?: (goalId: string) => void;
  onRevisitIntro?: () => void;
  onDebug?: () => void;
  onOpenInstantLearn?: () => void;
  onOpenPronunciation?: () => void;
  onOpenFlashPick?: () => void;
  onOpenTrueOrFake?: () => void;
  onOpenGrammar?: () => void;
  onOpenProgress?: () => void;
  onOpenAccount?: () => void;
  onStartDailyMission?: () => void;
};

const surface = '#FCF9F8';
const primary = '#884C32';
const terracotta = '#B06D50';
const onSurface = '#1B1C1C';
const onSurfaceVariant = '#53433E';
const outlineVariant = 'rgba(216, 194, 186, 0.35)';
const tagBg = '#FFDBCC';
const tagText = '#6A3A23';
const white = '#FFFFFF';

export default function HomeScreen({
  onModeSelect,
  onStartDailyRun,
  onRevisitIntro,
  onDebug,
  onOpenInstantLearn,
  onOpenPronunciation,
  onOpenFlashPick,
  onOpenTrueOrFake,
  onOpenGrammar,
  onOpenProgress,
  onOpenAccount,
}: Props) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [weeklyXpSeries, setWeeklyXpSeries] = useState<DailyXpEntry[]>([]);
  const def = defaultPracticeTarget();
  const [selectedTarget, setSelectedTarget] = useState<string>(def.label);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(def.id);
  const [playedToday, setPlayedToday] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const xp = profile?.xp ?? 0;
  const level = getLevelFromXp(xp);
  const matchedTarget = ALL_PRACTICE_TARGETS.find(t => t.label === selectedTarget) ?? defaultPracticeTarget();

  const routineTiles: RoutineTile[] = [
    {
      id: 'kelime',
      label: 'Kelime',
      icon: 'menu-book',
      fill: playedToday ? 1 : 0.35,
      muted: false,
      onPress: () => onOpenFlashPick?.(),
    },
    {
      id: 'telaffuz',
      label: 'Telaffuz',
      icon: 'mic',
      fill: Math.min(1, 0.45 + (weeklyTotal > 20 ? 0.25 : 0)),
      muted: false,
      onPress: () => onOpenPronunciation?.(),
    },
    {
      id: 'dinleme',
      label: 'Dinleme',
      icon: 'headphones',
      fill: Math.min(1, 0.55 + (xp > 80 ? 0.3 : 0)),
      muted: false,
      onPress: () => onOpenInstantLearn?.(),
    },
    {
      id: 'grammar',
      label: 'Grammar',
      icon: 'translate',
      fill: Math.min(1, 0.58 + (weeklyTotal > 15 ? 0.22 : 0) + (xp > 40 ? 0.2 : 0)),
      muted: false,
      caption: 'Kural + örnek: zamanlar, edatlar, bağlaçlar',
      onPress: () => onOpenGrammar?.(),
    },
  ];

  const loadProfile = async () => {
    const data = await AsyncStorage.getItem('userProfile');
    if (!data) return;

    const parsed = tryParseJson<UserProfile>(data);
    if (!parsed) {
      await AsyncStorage.removeItem('userProfile');
      return;
    }

    setProfile(parsed);
    const savedLabel = parsed.goalDescription?.trim() || defaultPracticeTarget().label;
    const matched = ALL_PRACTICE_TARGETS.find(t => t.label === savedLabel) ?? defaultPracticeTarget();
    setSelectedTarget(matched.label);
    setSelectedTargetId(matched.id);

    const progress = await getProgress();
    const todayStr = new Date().toISOString().slice(0, 10);
    setPlayedToday(progress.lastPlayedDate === todayStr);
    const weekly = getWeeklyXp(progress.dailyXpLog ?? {});
    setWeeklyXpSeries(weekly);
    setWeeklyTotal(weekly.reduce((s, d) => s + d.xp, 0));
  };

  const focusHint = profile?.language?.name
    ? `${profile.language.name} pratiği · ${matchedTarget.hint}`
    : matchedTarget.hint;

  const rhythmDoneCount = routineTiles.filter(t => t.fill >= 0.95).length;
  const rhythmDoneLabel = `${Math.min(4, Math.max(rhythmDoneCount, playedToday ? 1 : 0))}/4 tamamlandı`;

  const openPicked = (id: PickedCard['id']) => {
    if (id === 'scenarios') onModeSelect('scenarios');
    else if (id === 'true-or-fake') onOpenTrueOrFake?.();
    else onOpenInstantLearn?.();
  };

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: bottomNavPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <MaterialIcons name="bar-chart" size={88} color="rgba(255,255,255,0.22)" style={styles.heroDecoIcon} />
          <View style={styles.heroContent}>
            <Text style={styles.heroHeadline}>Haftalık analiz</Text>
            <Text style={styles.heroSubMeta}>Son 7 gün · toplam {weeklyTotal} XP</Text>

            <View style={styles.chartPanel}>
              <View style={styles.chartTitleRow}>
                <Text style={styles.chartPanelTitle}>Öğrenme süresi özeti</Text>
                <View style={styles.chartWeekPill}>
                  <Text style={styles.chartWeekPillText}>Haftalık</Text>
                </View>
              </View>
              <WeeklyActivityChart
                series={weeklyXpSeries.length ? weeklyXpSeries : getWeeklyXp({})}
                accent={terracotta}
                barMuted="rgba(136, 76, 50, 0.35)"
                barEmpty="rgba(136, 76, 50, 0.12)"
              />
            </View>

            <View style={styles.focusBlock}>
              <Text style={styles.focusLabel}>Bugünün odağı</Text>
              <Text style={styles.focusTitle} numberOfLines={2}>
                {selectedTarget}
              </Text>
              <Text style={styles.focusHint} numberOfLines={2}>
                {focusHint}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.heroCta}
              activeOpacity={0.9}
              onPress={() => onStartDailyRun?.(selectedTargetId)}
            >
              <Text style={styles.heroCtaText}>Hemen Başla</Text>
              <MaterialIcons name="play-arrow" size={22} color={primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Günlük ritim</Text>
          <Text style={styles.sectionMeta}>{rhythmDoneLabel}</Text>
        </View>
        <View style={styles.rhythmGrid}>
          {routineTiles.map(tile => (
            <TouchableOpacity
              key={tile.id}
              style={[styles.rhythmCard, tile.muted && styles.rhythmCardMuted]}
              onPress={tile.onPress}
              activeOpacity={0.88}
            >
              <View style={[styles.rhythmIconCircle, tile.muted && styles.rhythmIconCircleMuted]}>
                <MaterialIcons name={tile.icon} size={22} color={tile.muted ? '#85736C' : primary} />
              </View>
              <View style={styles.rhythmTextBlock}>
                <Text style={styles.rhythmLabel}>{tile.label}</Text>
                {tile.caption ? (
                  <Text style={styles.rhythmCaption} numberOfLines={2}>
                    {tile.caption}
                  </Text>
                ) : null}
              </View>
              <View style={styles.rhythmTrack}>
                <View style={[styles.rhythmFill, { width: `${Math.round(tile.fill * 100)}%` }]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Senin için seçtiklerimiz</Text>
        <View style={styles.pickedList}>
          {PICKED_FOR_YOU.map(card => (
            <TouchableOpacity
              key={card.id}
              style={styles.lessonCard}
              onPress={() => openPicked(card.id)}
              activeOpacity={0.92}
            >
              <View style={[styles.lessonThumb, { backgroundColor: card.thumbBg }]}>
                <Image source={{ uri: card.image }} style={styles.lessonImg} />
              </View>
              <View style={styles.lessonMid}>
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{card.tag}</Text>
                </View>
                <Text style={styles.lessonTitle}>{card.title}</Text>
                <Text style={styles.lessonSub}>{card.subtitle}</Text>
              </View>
              <View style={styles.lessonChevron}>
                <MaterialIcons name="chevron-right" size={22} color={primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={onOpenProgress} activeOpacity={0.88} style={styles.progressLink}>
          <Text style={styles.progressLinkText}>
            İlerleme — Seviye {level} · {xp} XP
          </Text>
          <MaterialIcons name="chevron-right" size={18} color={terracotta} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onRevisitIntro} activeOpacity={0.88} style={styles.introLink}>
          <Text style={styles.introLinkText}>Tanıtımı tekrar izle</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.navInner}>
          <View style={styles.navItem}>
            <MaterialIcons name="explore" size={24} color={terracotta} />
            <Text style={styles.navLabelActive}>Discover</Text>
            <View style={styles.navDot} />
          </View>
          <TouchableOpacity style={styles.navItem} onPress={() => onModeSelect('scenarios')} activeOpacity={0.88}>
            <MaterialIcons name="school" size={24} color="#333" style={{ opacity: 0.45 }} />
            <Text style={styles.navLabel}>Learn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onStartDailyRun?.(selectedTargetId)} activeOpacity={0.88}>
            <MaterialIcons name="record-voice-over" size={24} color="#333" style={{ opacity: 0.45 }} />
            <Text style={styles.navLabel}>Practice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onOpenAccount?.()} activeOpacity={0.88}>
            <MaterialIcons name="person-outline" size={24} color="#333" style={{ opacity: 0.45 }} />
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <NotificationsSheet visible={notifOpen} onClose={() => setNotifOpen(false)} />
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
    height: 56,
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
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 20 },
  hero: {
    backgroundColor: primary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    overflow: 'hidden',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  heroGlow: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroDecoIcon: {
    position: 'absolute',
    right: 4,
    bottom: 4,
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
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.82)',
    marginBottom: 14,
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
  focusBlock: {
    marginBottom: 14,
  },
  focusLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  focusTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: white,
    marginBottom: 6,
    maxWidth: 300,
  },
  focusHint: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.88)',
    maxWidth: 300,
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
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Poppins_500Medium',
    color: onSurface,
  },
  sectionMeta: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: primary,
  },
  rhythmGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  rhythmCard: {
    width: '48%',
    backgroundColor: white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: outlineVariant,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  rhythmCardMuted: { opacity: 0.62 },
  rhythmIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(165, 100, 72, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rhythmIconCircleMuted: { backgroundColor: '#F0EDED' },
  rhythmTextBlock: {
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 8,
    gap: 4,
  },
  rhythmLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurfaceVariant,
  },
  rhythmCaption: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#7A6E68',
    textAlign: 'center',
    paddingHorizontal: 2,
    alignSelf: 'stretch',
  },
  rhythmTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.creamMuted,
    overflow: 'hidden',
  },
  rhythmFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: primary,
  },
  pickedList: { gap: 10, marginBottom: 16 },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(216,194,186,0.2)',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  lessonThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
  },
  lessonImg: { width: '100%', height: '100%' },
  lessonMid: { flex: 1, minWidth: 0 },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: tagBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  tagPillText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: tagText,
    letterSpacing: 1.2,
  },
  lessonTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Poppins_500Medium',
    color: onSurface,
  },
  lessonSub: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
    marginTop: 4,
  },
  lessonChevron: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
  },
  progressLinkText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: terracotta,
  },
  introLink: { alignItems: 'center', paddingBottom: 8 },
  introLinkText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: onSurfaceVariant },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FCF9F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(51,51,51,0.06)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    shadowColor: '#333',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 12,
  },
  navInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  navItem: { alignItems: 'center', minWidth: 72 },
  navLabel: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#333',
    opacity: 0.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  navLabelActive: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: terracotta,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: terracotta,
    marginTop: 4,
  },
});
