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
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  streakBanner: { backgroundColor: '#F0FAF4', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#D4E8DC' },
  streakBannerUrgent: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  streakBannerText: { color: '#1B9C5A', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  streakBannerTextUrgent: { color: '#EF4444' },
  streakBannerMeta: { color: '#9AABB8', fontSize: 11, textAlign: 'center', marginTop: 4 },
  dailyRunBtn: {
    backgroundColor: '#1B9C5A',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#1B9C5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  dailyRunBtnTitle: { color: '#1A2B3C', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  dailyRunBtnSub: { color: '#D4E8DC', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logo: { fontSize: 26, fontWeight: '900', color: '#1B9C5A', letterSpacing: 1.5 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  langBtn: { backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E8EDF2', flexDirection: 'row', alignItems: 'center', gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  langBtnText: { fontSize: 13, color: '#1A2B3C', fontWeight: '600' },
  langBtnArrow: { fontSize: 10, color: '#9AABB8' },
  streakBadge: { backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E8EDF2', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  streakText: { fontSize: 13, fontWeight: '700', color: '#1A2B3C' },
  dreamCard: { backgroundColor: '#1B9C5A', borderRadius: 20, padding: 18, marginBottom: 18, borderLeftWidth: 0, borderWidth: 0 },
  dreamLabel: { fontSize: 10, fontWeight: '700', color: '#D4E8DC', letterSpacing: 1.5, marginBottom: 6 },
  dreamTitle: { fontSize: 16, color: '#1A2B3C', fontWeight: '800', lineHeight: 22 },
  dreamMeta: { fontSize: 12, color: '#B8E4CC', lineHeight: 18, marginTop: 6 },
  targetSelector: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  targetSelectorArrow: { color: '#D4E8DC', fontSize: 16, fontWeight: '700' },
  targetDropdown: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  targetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  targetOptionActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  targetOptionTitle: { color: '#E8F5EE', fontSize: 13, fontWeight: '700' },
  targetOptionTitleActive: { color: '#1A2B3C' },
  targetOptionHint: { color: '#B8E4CC', fontSize: 11, marginTop: 2 },
  targetOptionCheck: { fontSize: 16, color: '#1A2B3C', fontWeight: '800' },
  targetUpdatedNotice: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  targetUpdatedNoticeText: {
    color: '#1A2B3C',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A2B3C', marginBottom: 14 },
  modesGrid: { gap: 10 },
  modeCard: { position: 'relative', backgroundColor: '#FFF', borderRadius: 18, padding: 18, borderWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  modeCardRecommended: { paddingTop: 32 },
  recommendedBadge: {
    position: 'absolute',
    right: 12,
    top: 10,
    backgroundColor: '#F0FAF4',
    borderWidth: 1,
    borderColor: '#D4E8DC',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 2,
  },
  recommendedText: { color: '#1B9C5A', fontSize: 10, fontWeight: '800' },
  modeIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modeEmoji: { fontSize: 24 },
  modeMiddle: { flex: 1 },
  modeTitle: { fontSize: 15, fontWeight: '800', color: '#1A2B3C' },
  modeDesc: { fontSize: 12, color: '#9AABB8', marginTop: 2 },
  modeBadge: { marginTop: 5, fontSize: 11, fontWeight: '800' },
  modeArrow: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modeArrowText: { fontSize: 16, fontWeight: '800' },
  quickStatsRow: { marginTop: 16, flexDirection: 'row', gap: 8 },
  quickStatPill: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 0,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickStatLabel: { color: '#9AABB8', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  quickStatValue: { color: '#1A2B3C', fontSize: 13, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 0,
    padding: 20,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A2B3C', marginBottom: 20, textAlign: 'center' },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, marginBottom: 8, backgroundColor: '#F5F7FA' },
  modalItemActive: { borderWidth: 1.5, borderColor: '#1B9C5A', backgroundColor: '#F0FAF4' },
  modalFlag: { fontSize: 24 },
  modalName: { fontSize: 16, fontWeight: '600', color: '#1A2B3C', flex: 1 },
  check: { fontSize: 16, color: '#1B9C5A', fontWeight: '800' },
});
