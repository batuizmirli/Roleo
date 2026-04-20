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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/scenarios';
import { tryParseJson } from '../services/json';
import AnimatedPressable from '../components/AnimatedPressable';
import { getLevelFromXp, getProgress, getWeeklyXp } from '../services/progress';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

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
    color: '#E8324A',
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
    color: '#FB7185',
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
  onDebug?: () => void;
  onOpenInstantLearn?: () => void;
  onOpenFlashPick?: () => void;
  onOpenTrueOrFake?: () => void;
  onOpenProgress?: () => void;
  onStartDailyMission?: () => void;
};

export default function HomeScreen({ onModeSelect, onStartDailyRun, onDebug, onOpenInstantLearn, onOpenFlashPick, onOpenTrueOrFake, onOpenProgress, onStartDailyMission }: Props) {
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
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onLongPress={onDebug} activeOpacity={1}>
            <Text style={styles.logo}>roleo</Text>
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
          <Text style={styles.dreamLabel}>HEDEFİN</Text>
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
              <Text style={styles.dreamMeta}>Değiştirmek için dokun</Text>
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
          <Text style={styles.dailyRunBtnTitle}>Start Today’s Run</Text>
          <Text style={styles.dailyRunBtnSub}>Flash Pick → True/Fake → Scene</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Quick Play</Text>

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

        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatPill}>
            <Text style={styles.quickStatLabel}>Streak</Text>
            <Text style={styles.quickStatValue}>🔥 {profile?.streak ?? 0}</Text>
          </View>
          <View style={styles.quickStatPill}>
            <Text style={styles.quickStatLabel}>Bu hafta</Text>
            <Text style={styles.quickStatValue}>{weeklyTotal} XP</Text>
          </View>
          <View style={styles.quickStatPill}>
            <Text style={styles.quickStatLabel}>Seviye</Text>
            <Text style={styles.quickStatValue}>Lv {level}</Text>
          </View>
        </View>

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

    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.xxxl },
  streakBanner: { backgroundColor: colors.primaryCard, borderRadius: 14, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.primaryBorder },
  streakBannerUrgent: { backgroundColor: '#2A1016', borderColor: '#E8324A88' },
  streakBannerText: { color: colors.primaryAccent, fontSize: typography.size.sm, fontWeight: typography.weight.bold, textAlign: 'center' },
  streakBannerTextUrgent: { color: '#FB7185' },
  streakBannerMeta: { color: colors.textMuted, fontSize: typography.size.xs, textAlign: 'center', marginTop: spacing.xs },
  dailyRunBtn: {
    backgroundColor: '#E8324A',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  dailyRunBtnTitle: { color: '#FFF', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  dailyRunBtnSub: { color: '#FEE2E2', fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 24, fontWeight: '900', color: '#E8324A', letterSpacing: 2 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  langBtn: { backgroundColor: '#16162A', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#252540', flexDirection: 'row', alignItems: 'center', gap: 4 },
  langBtnText: { fontSize: 13, color: '#FFF', fontWeight: '600' },
  langBtnArrow: { fontSize: 10, color: '#666' },
  streakBadge: { backgroundColor: '#16162A', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#252540' },
  streakText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  dreamCard: { backgroundColor: '#16162A', borderRadius: 16, padding: 16, marginBottom: 18, borderLeftWidth: 3, borderLeftColor: '#E8324A', borderWidth: 1, borderColor: '#252540' },
  dreamLabel: { fontSize: 10, fontWeight: '700', color: '#E8324A', letterSpacing: 1.5, marginBottom: 6 },
  dreamTitle: { fontSize: 15, color: '#FFF', fontWeight: '800', lineHeight: 22 },
  dreamMeta: { fontSize: 12, color: '#94A3B8', lineHeight: 18, marginTop: 6 },
  targetSelector: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B2B45',
    backgroundColor: '#111127',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  targetSelectorArrow: { color: '#94A3B8', fontSize: 16, fontWeight: '700' },
  targetDropdown: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B2B45',
    backgroundColor: '#0E1020',
    overflow: 'hidden',
  },
  targetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2438',
  },
  targetOptionActive: { backgroundColor: '#2A1F44' },
  targetOptionTitle: { color: '#D3D9E7', fontSize: 13, fontWeight: '700' },
  targetOptionTitleActive: { color: '#F1EAFE' },
  targetOptionHint: { color: '#8B96AB', fontSize: 11, marginTop: 2 },
  targetOptionCheck: { fontSize: 16, color: '#E8324A', fontWeight: '800' },
  targetUpdatedNotice: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1F7A4C',
    backgroundColor: '#0C2218',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  targetUpdatedNoticeText: {
    color: '#3DD68C',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 16 },
  modesGrid: { gap: 12 },
  modeCard: { position: 'relative', backgroundColor: '#16162A', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#252540', flexDirection: 'row', alignItems: 'center', gap: 16 },
  modeCardRecommended: { paddingTop: 34 },
  recommendedBadge: {
    position: 'absolute',
    right: 12,
    top: 10,
    backgroundColor: '#C4B5FD22',
    borderWidth: 1,
    borderColor: '#C4B5FD66',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 2,
  },
  recommendedText: { color: '#C4B5FD', fontSize: 10, fontWeight: '800' },
  modeIconBg: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modeEmoji: { fontSize: 26 },
  modeMiddle: { flex: 1 },
  modeTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  modeDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  modeBadge: { marginTop: 6, fontSize: 11, fontWeight: '800' },
  modeArrow: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modeArrowText: { fontSize: 16, fontWeight: '800' },
  quickStatsRow: { marginTop: 14, flexDirection: 'row', gap: 8 },
  quickStatPill: {
    flex: 1,
    backgroundColor: '#151526',
    borderWidth: 1,
    borderColor: '#23233A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  quickStatLabel: { color: '#7B859C', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  quickStatValue: { color: '#E5E7EB', fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#16162A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2B2B45',
    padding: 20,
    paddingBottom: 18,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 20, textAlign: 'center' },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, marginBottom: 8, backgroundColor: '#0A0A12' },
  modalItemActive: { borderWidth: 1.5, borderColor: '#E8324A', backgroundColor: '#1F1520' },
  modalFlag: { fontSize: 24 },
  modalName: { fontSize: 16, fontWeight: '600', color: '#FFF', flex: 1 },
  check: { fontSize: 16, color: '#E8324A', fontWeight: '800' },
});
