import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
  ImageBackground,
} from 'react-native';

const homeBgImage = require('../../assets/onboarding/cafe-order.jpg');
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/scenarios';
import { tryParseJson } from '../services/json';
import AnimatedPressable from '../components/AnimatedPressable';
import { getLevelFromXp, getProgress, getWeeklyXp } from '../services/progress';
import { colors } from '../theme/colors';

type HomeSection = {
  id: 'scenarios' | 'flash-pick' | 'true-or-fake';
  title: string;
  description: string;
  emoji: string;
  color: string;
  tag: string;
};

type PracticeTarget = {
  id: string;
  label: string;
  hint: string;
};

const HOME_SECTIONS: HomeSection[] = [
  {
    id: 'scenarios',
    title: 'Sahneye Devam Et',
    description: 'Kaldığın konuşmadan devam et',
    emoji: '🎭',
    color: '#1B9C5A',
    tag: 'Ana Mod',
  },
  {
    id: 'true-or-fake',
    title: 'True or Fake',
    description: 'Cümle gerçek mi fake mi? Hızlı karar ver',
    emoji: '✅',
    color: '#34D399',
    tag: 'Real/Fake',
  },
  {
    id: 'flash-pick',
    title: 'Flash Pick',
    description: 'Hızlı karar ver, combo yakala, süreye karşı yarış',
    emoji: '⚡',
    color: '#EF4444',
    tag: 'Arcade',
  },
];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PRACTICE_TARGETS: PracticeTarget[] = [
  { id: 'b2-speaking', label: 'B2 seviyesinde konuşmak', hint: 'Akıcı, net ve doğal ifade' },
  { id: 'phrasal-verbs', label: 'Phrasal verbleri öğrenmek', hint: 'Günlük İngilizcede doğal kalıplar' },
  { id: 'meeting-confidence', label: 'Toplantıda özgüvenli konuşmak', hint: 'İş iletişiminde netlik' },
  { id: 'pronunciation', label: 'Telaffuzu düzeltmek', hint: 'Daha anlaşılır ve temiz ses' },
  { id: 'small-talk', label: 'Small talk başlatabilmek', hint: 'Sosyal ortamlarda rahat giriş' },
  { id: 'travel-survival', label: 'Seyahatte zorlanmamak', hint: 'Havalimanı, otel, restoran akışı' },
];
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
  onStartDailyMission?: () => void;
};

export default function HomeScreen({ onModeSelect, onStartDailyRun, onRevisitIntro, onDebug, onOpenInstantLearn, onOpenPronunciation, onOpenFlashPick, onOpenTrueOrFake, onOpenProgress, onStartDailyMission }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [targetExpanded, setTargetExpanded] = useState(false);
  const [streakMessage, setStreakMessage] = useState<string | null>(null);
  const [streakUrgent, setStreakUrgent] = useState(false);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [selectedTarget, setSelectedTarget] = useState<string>(PRACTICE_TARGETS[0].label);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(PRACTICE_TARGETS[0].id);
  const [targetUpdatedNotice, setTargetUpdatedNotice] = useState(false);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadProfile();

    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const xp = profile?.xp ?? 0;
  const level = getLevelFromXp(xp);

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
    const matchedTarget = PRACTICE_TARGETS.find(t => t.label === savedLabel) ?? PRACTICE_TARGETS[0];
    setSelectedTargetId(matchedTarget.id);

    const progress = await getProgress();

    // Streak banner logic
    const streak = progress.streak;
    const lastPlayed = progress.lastPlayedDate;
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const playedToday = lastPlayed === todayStr;

    if (streak >= 7) {
      setStreakMessage(`\uD83D\uDD25 ${streak} g\u00FCn \u00FCst \u00FCste! Efsane seri!`);
      setStreakUrgent(false);
    } else if (streak >= 3) {
      setStreakMessage(`\uD83D\uDD25 ${streak} g\u00FCn serisi! Devam et!`);
      setStreakUrgent(false);
    } else if (streak >= 1 && !playedToday) {
      setStreakMessage(`\u26A0\uFE0F Bug\u00FCn oynamazsan ${streak} g\u00FCnl\u00FCk serin k\u0131r\u0131l\u0131r!`);
      setStreakUrgent(true);
    } else if (streak === 0 || !lastPlayed) {
      setStreakMessage('\uD83C\uDF1F Bug\u00FCn yeni bir seri ba\u015Flat!');
      setStreakUrgent(false);
    } else {
      setStreakMessage(null);
    }

    const weekly = getWeeklyXp(progress.dailyXpLog ?? {});
    setWeeklyTotal(weekly.reduce((s, d) => s + d.xp, 0));

  };

  const handleTargetSelect = async (target: PracticeTarget) => {
    if (!profile) return;
    LayoutAnimation.configureNext({
      duration: 220,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setSelectedTarget(target.label);
    setSelectedTargetId(target.id);
    setTargetExpanded(false);
    setTargetUpdatedNotice(true);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => {
      setTargetUpdatedNotice(false);
    }, 2200);
    const updated: UserProfile = {
      ...profile,
      goalDescription: target.label,
      identity: profile.identity
        ? { ...profile.identity, goal: target.label }
        : profile.identity,
    };
    setProfile(updated);
    await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
  };

  const handleLanguageChange = async (lang: typeof SUPPORTED_LANGUAGES[0]) => {
    if (!profile) return;
    const updated = { ...profile, language: lang };
    await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
    setProfile(updated);
    setLangModalVisible(false);
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={homeBgImage} style={StyleSheet.absoluteFill} resizeMode="cover">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(246, 240, 229, 0.82)' }]} />
      </ImageBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onLongPress={onDebug} activeOpacity={1}>
            <Text style={styles.logo}>Roleo</Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.langBtn} onPress={() => setLangModalVisible(true)}>
              <Text style={styles.langBtnText}>{profile?.language.flag} {profile?.language.name}</Text>
              <Text style={styles.langBtnArrow}>▾</Text>
            </TouchableOpacity>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {profile?.streak ?? 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.dreamCard}>
          <Text style={styles.dreamLabel}>BUGÜNÜN ODAĞI</Text>
          <TouchableOpacity
            style={styles.targetSelector}
            activeOpacity={0.88}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setTargetExpanded(prev => !prev);
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.dreamTitle}>{selectedTarget}</Text>
              <Text style={styles.dreamMeta}>Dokunarak değiştir</Text>
            </View>
            <Text style={styles.targetSelectorArrow}>{targetExpanded ? '▴' : '▾'}</Text>
          </TouchableOpacity>

          {targetExpanded && (
            <View style={styles.targetDropdown}>
              {PRACTICE_TARGETS.map(target => {
                const active = selectedTarget === target.label;
                return (
                  <TouchableOpacity
                    key={target.id}
                    onPress={() => handleTargetSelect(target)}
                    style={[styles.targetOption, active && styles.targetOptionActive]}
                    activeOpacity={0.88}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.targetOptionTitle, active && styles.targetOptionTitleActive]}>{target.label}</Text>
                      <Text style={styles.targetOptionHint}>{target.hint}</Text>
                    </View>
                    {active ? <Text style={styles.targetOptionCheck}>✓</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {targetUpdatedNotice ? (
            <View style={styles.targetUpdatedNotice}>
              <Text style={styles.targetUpdatedNoticeText}>Oyun modları hedefin için yeniden düzenlendi ✅</Text>
            </View>
          ) : null}
        </View>

        {streakMessage ? (
          <AnimatedPressable style={[styles.streakBanner, streakUrgent && styles.streakBannerUrgent]} delay={60}>
            <Text style={[styles.streakBannerText, streakUrgent && styles.streakBannerTextUrgent]}>{streakMessage}</Text>
            {weeklyTotal > 0 ? <Text style={styles.streakBannerMeta}>Bu hafta: {weeklyTotal} XP</Text> : null}
          </AnimatedPressable>
        ) : null}

        <TouchableOpacity style={styles.dailyRunBtn} onPress={() => onStartDailyRun?.(selectedTargetId)} activeOpacity={0.9}>
          <Text style={styles.dailyRunBtnEyebrow}>Günlük Rutin</Text>
          <Text style={styles.dailyRunBtnTitle}>Bugünkü çalışmayı başlat</Text>
          <Text style={styles.dailyRunBtnSub}>3 kısa mod • yaklaşık 6-8 dk</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.progressOverviewCard} onPress={onOpenProgress} activeOpacity={0.9}>
          <View style={styles.progressOverviewTop}>
            <View>
              <Text style={styles.progressOverviewLabel}>İlerleme Özeti</Text>
              <Text style={styles.progressOverviewTitle}>Seviye {level} • {xp} XP</Text>
            </View>
            <Text style={styles.progressOverviewArrow}>↗</Text>
          </View>
          <Text style={styles.progressOverviewText}>
            {profile?.streak ?? 0} günlük seri • bu hafta {weeklyTotal} XP • detaylı istatistikler ayrı ekranda
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Advanced Modes</Text>

        <View style={styles.modesGrid}>
          {HOME_SECTIONS.map((mode, index) => (
            <AnimatedPressable
              key={mode.id}
              style={[styles.modeCard, index === 0 && styles.modeCardRecommended]}
              onPress={() => mode.id === 'flash-pick'
                ? onOpenFlashPick?.()
                : mode.id === 'true-or-fake'
                ? onOpenTrueOrFake?.()
                : onModeSelect(mode.id)}
              delay={index * 45}
            >
              {index === 0 && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Tavsiye Edilen</Text>
                </View>
              )}
              <View style={[styles.modeIconBg, { backgroundColor: mode.color + '22' }]}>
                <Text style={styles.modeEmoji}>{mode.emoji}</Text>
              </View>
              <View style={[styles.modeMiddle]}>
                <Text style={styles.modeTitle}>{mode.title}</Text>
                <Text style={styles.modeDesc}>{mode.description}</Text>
                <Text style={[styles.modeBadge, { color: mode.color }]}>{mode.tag}</Text>
              </View>
              <View style={[styles.modeArrow, { backgroundColor: mode.color + '22' }]}>
                <Text style={[styles.modeArrowText, { color: mode.color }]}>→</Text>
              </View>
            </AnimatedPressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Learning Tools</Text>
        <View style={styles.toolsGrid}>
          <AnimatedPressable style={styles.toolCard} onPress={onOpenPronunciation} delay={60}>
            <View style={styles.toolIconWrap}><Text style={styles.toolIcon}>🔊</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toolTitle}>Pronunciation</Text>
              <Text style={styles.toolDesc}>Harfler, kelimeler ve sayılar için dinle-tekrar et</Text>
            </View>
            <Text style={styles.toolArrow}>→</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.toolCard} onPress={onOpenInstantLearn} delay={95}>
            <View style={styles.toolIconWrap}><Text style={styles.toolIcon}>🧠</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toolTitle}>Instant Learn</Text>
              <Text style={styles.toolDesc}>AI ile kısa, kişisel mini dersler</Text>
            </View>
            <Text style={styles.toolArrow}>→</Text>
          </AnimatedPressable>
        </View>

        <TouchableOpacity style={styles.revisitIntroBtn} onPress={onRevisitIntro} activeOpacity={0.88}>
          <Text style={styles.revisitIntroBtnText}>Tanıtıma dön</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={langModalVisible} transparent animationType="fade" onRequestClose={() => setLangModalVisible(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setLangModalVisible(false)} />
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Dil Seç</Text>
            {SUPPORTED_LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.modalItem, profile?.language.code === lang.code && styles.modalItemActive]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text style={styles.modalFlag}>{lang.flag}</Text>
                <Text style={styles.modalName}>{lang.name}</Text>
                {profile?.language.code === lang.code && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 28, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.2, fontFamily: 'PlayfairDisplay_900Black' },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  langBtn: { backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.primaryBorder, flexDirection: 'row', alignItems: 'center', gap: 4 },
  langBtnText: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  langBtnArrow: { fontSize: 10, color: colors.textMuted },
  streakBadge: { backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.primaryBorder },
  streakText: { fontSize: 13, fontWeight: '700', color: colors.primaryAccent },

  // Dream Card
  dreamCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  dreamLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 2, marginBottom: 8 },
  dreamTitle: { fontSize: 22, color: colors.textPrimary, fontWeight: '900', lineHeight: 28, fontFamily: 'PlayfairDisplay_700Bold' },
  dreamMeta: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginTop: 6 },
  targetSelector: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  targetSelectorArrow: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
  targetDropdown: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  targetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  targetOptionActive: { backgroundColor: colors.primaryAccentSoft },
  targetOptionTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  targetOptionTitleActive: { color: colors.textPrimary },
  targetOptionHint: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  targetOptionCheck: { fontSize: 16, color: colors.primaryAccent, fontWeight: '800' },
  targetUpdatedNotice: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.secondaryBorder,
    backgroundColor: colors.secondaryCard,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  targetUpdatedNoticeText: { color: colors.secondaryAccent, fontSize: 12, fontWeight: '700' },

  // Streak Banner
  streakBanner: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  streakBannerUrgent: { backgroundColor: colors.dangerSoft, borderColor: '#E7C3BD' },
  streakBannerText: { color: colors.primaryAccent, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  streakBannerTextUrgent: { color: colors.danger },
  streakBannerMeta: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4 },

  // Daily Run Button
  dailyRunBtn: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: colors.primaryAccent,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 7,
  },
  dailyRunBtnEyebrow: { color: 'rgba(255,253,248,0.72)', fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 4, letterSpacing: 1.2, textTransform: 'uppercase' },
  dailyRunBtnTitle: { color: colors.textOnAccent, fontSize: 20, fontWeight: '900', textAlign: 'center', fontFamily: 'PlayfairDisplay_700Bold' },
  dailyRunBtnSub: { color: 'rgba(255,253,248,0.82)', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 6 },

  progressOverviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  progressOverviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  progressOverviewLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  progressOverviewTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '900', marginTop: 4, fontFamily: 'PlayfairDisplay_700Bold' },
  progressOverviewArrow: { color: colors.primaryAccent, fontSize: 18, fontWeight: '700' },
  progressOverviewText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },

  // Section Title
  sectionTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginBottom: 14, fontFamily: 'PlayfairDisplay_700Bold' },

  // Mode Cards
  modesGrid: { gap: 10 },
  modeCard: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    shadowColor: '#2F241B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  modeCardRecommended: { paddingTop: 32 },
  recommendedBadge: {
    position: 'absolute',
    right: 12,
    top: 10,
    backgroundColor: colors.primaryAccentSoft,
    borderWidth: 1,
    borderColor: '#E8CBB5',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 2,
  },
  recommendedText: { color: colors.primaryAccent, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  modeIconBg: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modeEmoji: { fontSize: 28 },
  modeMiddle: { flex: 1 },
  modeTitle: { fontSize: 16, fontWeight: '900', color: colors.textPrimary, fontFamily: 'PlayfairDisplay_700Bold' },
  modeDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 3, lineHeight: 16 },
  modeBadge: { marginTop: 6, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  modeArrow: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  modeArrowText: { fontSize: 16, fontWeight: '800' },

  toolsGrid: { gap: 10 },
  toolCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  toolIcon: { fontSize: 22 },
  toolTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', fontFamily: 'PlayfairDisplay_700Bold' },
  toolDesc: { color: colors.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 17 },
  toolArrow: { color: colors.primaryAccent, fontSize: 16, fontWeight: '800' },
  revisitIntroBtn: {
    marginTop: 18,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    alignItems: 'center',
  },
  revisitIntroBtnText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },

  // Language Modal
  overlay: { flex: 1, backgroundColor: 'rgba(59,49,38,0.2)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    shadowColor: '#2F241B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: colors.textPrimary, marginBottom: 20, textAlign: 'center', fontFamily: 'PlayfairDisplay_700Bold' },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, marginBottom: 8, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.primaryBorder },
  modalItemActive: { borderWidth: 1.5, borderColor: colors.primaryAccent, backgroundColor: colors.primaryAccentSoft },
  modalFlag: { fontSize: 24 },
  modalName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  check: { fontSize: 16, color: colors.primaryAccent, fontWeight: '800' },
});
