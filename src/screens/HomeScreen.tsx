import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import NotificationsSheet from '../components/NotificationsSheet';
import { tryParseJson } from '../services/json';
import { getLevelFromXp, getProgress, getWeeklyXp } from '../services/progress';
import { colors } from '../theme/colors';

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

type PracticeTarget = {
  id: string;
  label: string;
  hint: string;
};

const PRACTICE_TARGETS: PracticeTarget[] = [
  { id: 'b2-speaking', label: 'B2 seviyesinde konuşmak', hint: 'Akıcı, net ve doğal ifade' },
  { id: 'phrasal-verbs', label: 'Phrasal verbleri öğrenmek', hint: 'Günlük İngilizcede doğal kalıplar' },
  { id: 'meeting-confidence', label: 'Toplantıda özgüvenli konuşmak', hint: 'İş iletişiminde netlik' },
  { id: 'pronunciation', label: 'Telaffuzu düzeltmek', hint: 'Daha anlaşılır ve temiz ses' },
  { id: 'small-talk', label: 'Small talk başlatabilmek', hint: 'Sosyal ortamlarda rahat giriş' },
  { id: 'travel-survival', label: 'Seyahatte zorlanmamak', hint: 'Havalimanı, otel, restoran akışı' },
];

type RoutineTile = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  fill: number;
  muted: boolean;
  onPress: () => void;
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  onModeSelect: (mode: 'scenarios' | 'stories' | 'phrasebook') => void;
  onStartDailyRun?: (goalId: string) => void;
  onRevisitIntro?: () => void;
  onDebug?: () => void;
  onOpenInstantLearn?: () => void;
  onOpenPronunciation?: () => void;
  onOpenFlashPick?: () => void;
  onOpenTrueOrFake?: () => void;
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
  onOpenProgress,
  onOpenAccount,
}: Props) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [targetExpanded, setTargetExpanded] = useState(false);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [selectedTarget, setSelectedTarget] = useState<string>(PRACTICE_TARGETS[0].label);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(PRACTICE_TARGETS[0].id);
  const [targetUpdatedNotice, setTargetUpdatedNotice] = useState(false);
  const [playedToday, setPlayedToday] = useState(false);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadProfile();
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const xp = profile?.xp ?? 0;
  const level = getLevelFromXp(xp);
  const matchedTarget = PRACTICE_TARGETS.find(t => t.label === selectedTarget) ?? PRACTICE_TARGETS[0];

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
      fill: weeklyTotal > 40 ? 0.4 : 0,
      muted: weeklyTotal <= 40,
      onPress: () => onOpenTrueOrFake?.(),
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
    const savedLabel = parsed.goalDescription?.trim() || PRACTICE_TARGETS[0].label;
    setSelectedTarget(savedLabel);
    const matched = PRACTICE_TARGETS.find(t => t.label === savedLabel) ?? PRACTICE_TARGETS[0];
    setSelectedTargetId(matched.id);

    const progress = await getProgress();
    const todayStr = new Date().toISOString().slice(0, 10);
    setPlayedToday(progress.lastPlayedDate === todayStr);
    const weekly = getWeeklyXp(progress.dailyXpLog ?? {});
    setWeeklyTotal(weekly.reduce((s, d) => s + d.xp, 0));
  };

  const handleTargetSelect = async (target: PracticeTarget) => {
    if (!profile) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedTarget(target.label);
    setSelectedTargetId(target.id);
    setTargetExpanded(false);
    setTargetUpdatedNotice(true);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setTargetUpdatedNotice(false), 2200);
    const updated: UserProfile = {
      ...profile,
      goalDescription: target.label,
      identity: profile.identity ? { ...profile.identity, goal: target.label } : profile.identity,
    };
    setProfile(updated);
    await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
  };

  const heroDescription = profile?.language?.name
    ? `${profile.language.name} pratiğinde bugün: ${matchedTarget.hint}`
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
          <MaterialIcons name="record-voice-over" size={112} color="rgba(255,255,255,0.38)" style={styles.heroDecoIcon} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>GÜNLÜK HEDEF</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setTargetExpanded(e => !e);
              }}
            >
              <Text style={styles.heroHeadline}>Bugünün odağı</Text>
              <Text style={styles.heroGoalLine} numberOfLines={2}>
                {selectedTarget}
              </Text>
              <Text style={styles.heroBody} numberOfLines={3}>
                {heroDescription}
              </Text>
            </TouchableOpacity>
            {targetExpanded ? (
              <View style={styles.targetList}>
                {PRACTICE_TARGETS.map(t => {
                  const active = selectedTarget === t.label;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.targetRow, active && styles.targetRowActive]}
                      onPress={() => handleTargetSelect(t)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.targetRowTitle, active && styles.targetRowTitleActive]}>{t.label}</Text>
                        <Text style={styles.targetRowHint}>{t.hint}</Text>
                      </View>
                      {active ? <MaterialIcons name="check-circle" size={20} color={white} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
            {targetUpdatedNotice ? (
              <Text style={styles.notice}>Hedef güncellendi — modlar buna göre ayarlandı.</Text>
            ) : null}
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
              <Text style={styles.rhythmLabel}>{tile.label}</Text>
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
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: white,
    letterSpacing: 0.8,
  },
  heroHeadline: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: 'Poppins_600SemiBold',
    color: white,
    marginBottom: 6,
    maxWidth: 280,
  },
  heroGoalLine: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 8,
    maxWidth: 280,
  },
  heroBody: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.88)',
    maxWidth: 260,
    marginBottom: 16,
  },
  targetList: {
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  targetRowActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
  targetRowTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.92)' },
  targetRowTitleActive: { color: white },
  targetRowHint: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  notice: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
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
  rhythmLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurfaceVariant,
    marginBottom: 8,
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
