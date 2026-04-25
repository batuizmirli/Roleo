import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { tryParseJson } from '../services/json';
import { getProgress } from '../services/progress';
import { getTodaysMissionScenario } from '../data/scenarios';
import { ALL_PRACTICE_TARGETS, defaultPracticeTarget } from '../data/practiceGoals';

const LESSON_IMAGES = {
  scenarios:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBbtctSvx_HriBlpMS37XCcnY3eTll-alUxjMwhKb7oMKf-XDm3mjICRemXdXJctnEzyMVmdG3kSQYv1XGbhJsObmRqMfTXT0O4WtVHNf1lpiqR6GY5Ih_khda0f27szL26GNTkAwK_0mv03oFl_fICtzw1tyBkaaXvV6pO8u4U1CvrTH1tt7jYNhj56Dcerd_ablb7hzOVQMvv69iue3lTAE_ibZNDjnru1uRxqcgn-gmeAe-Qe07QUYttbqaeTXcWzhfM-H12nH_q',
} as const;

type PickedCard = {
  id: 'scenarios';
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
    subtitle: 'Kaldığın gerçek hayat provasına dön',
    image: LESSON_IMAGES.scenarios,
    thumbBg: 'rgba(160, 103, 76, 0.12)',
  },
];

type Props = {
  onOpenScenarios: () => void;
  onStartDailyMission: () => void;
  onStartDailyRun: (goalId: string) => void;
  onContinueScenarios: () => void;
  onOpenFlashPick: () => void;
  onOpenTrueOrFake: () => void;
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

export default function PracticeHubScreen({
  onOpenScenarios,
  onStartDailyMission,
  onStartDailyRun,
  onContinueScenarios,
  onOpenFlashPick,
  onOpenTrueOrFake,
}: Props) {
  const insets = useSafeAreaInsets();
  const [selectedTargetId, setSelectedTargetId] = useState<string>(defaultPracticeTarget().id);
  const [todaySceneTitle, setTodaySceneTitle] = useState('Bugünün sahnesi hazırlanıyor...');
  const [todaySceneMeta, setTodaySceneMeta] = useState('Gerçek hayat konuşmasını prova et');
  const [todaySceneGoal, setTodaySceneGoal] = useState('6 turu tamamla ve akışı koru');

  useEffect(() => {
    const load = async () => {
      const data = await AsyncStorage.getItem('userProfile');
      if (!data) return;
      const parsed = tryParseJson<UserProfile>(data);
      if (!parsed) return;
      const savedLabel = parsed.goalDescription?.trim() || defaultPracticeTarget().label;
      const matched = ALL_PRACTICE_TARGETS.find(t => t.label === savedLabel) ?? defaultPracticeTarget();
      setSelectedTargetId(matched.id);

      const progress = await getProgress();
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
    void load();
  }, []);

  const openPicked = (id: PickedCard['id']) => {
    if (id === 'scenarios') onContinueScenarios();
  };

  const bottomPad = Math.max(insets.bottom, 12) + 56;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>Pratik</Text>
        </View>
      </SafeAreaView>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Gerçek hayat konuşmalarını prova et. Bugünkü sahne ana rota.</Text>

        <Text style={[styles.sectionTitle, styles.firstSectionTitle]}>Ana Prova</Text>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Günlük Roleo koşusu</Text>
          <Text style={styles.heroTitle}>{todaySceneTitle}</Text>
          <Text style={styles.heroMeta}>{todaySceneMeta}</Text>
          <Text style={styles.heroGoal}>Hedef: {todaySceneGoal}</Text>
          <TouchableOpacity style={styles.heroCta} activeOpacity={0.9} onPress={onStartDailyMission}>
            <Text style={styles.heroCtaText}>Günlük Koşuya Başla</Text>
            <MaterialIcons name="play-arrow" size={22} color={primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.practiceGrid}>
          <TouchableOpacity style={styles.practiceCard} onPress={onOpenScenarios} activeOpacity={0.88}>
            <View style={styles.practiceIconWrap}>
              <MaterialIcons name="theater-comedy" size={21} color={primary} />
            </View>
            <Text style={styles.practiceTitle}>Sahne Modu</Text>
            <Text style={styles.practiceSub}>Gerçek anları serbest prova et</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.practiceCard} onPress={onContinueScenarios} activeOpacity={0.88}>
            <View style={styles.practiceIconWrap}>
              <MaterialIcons name="view-list" size={21} color={primary} />
            </View>
            <Text style={styles.practiceTitle}>Scenario Library</Text>
            <Text style={styles.practiceSub}>Kaldığın sahneye veya listeye dön</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.supportRow}
          onPress={() => onStartDailyRun(selectedTargetId)}
          activeOpacity={0.88}
        >
          <MaterialIcons name="directions-run" size={20} color={terracotta} />
          <View style={{ flex: 1 }}>
            <Text style={styles.supportTitle}>Hedefinle bugünkü sahneyi prova et</Text>
            <Text style={styles.supportSub}>Kısa ısınma sonrası aynı konuşma akışına gir.</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 18, marginBottom: 12 }]}>Mini Oyunlar</Text>
        <View style={styles.miniGameGrid}>
          <TouchableOpacity style={styles.miniGameCard} onPress={onOpenFlashPick} activeOpacity={0.88}>
            <View style={styles.miniIconWrap}>
              <MaterialIcons name="bolt" size={22} color={primary} />
            </View>
            <Text style={styles.miniTitle}>Flash Pick</Text>
            <Text style={styles.miniSub}>Kelimeyi hızlı yakala</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.miniGameCard} onPress={onOpenTrueOrFake} activeOpacity={0.88}>
            <View style={styles.miniIconWrap}>
              <MaterialIcons name="fact-check" size={22} color={primary} />
            </View>
            <Text style={styles.miniTitle}>True or Fake</Text>
            <Text style={styles.miniSub}>Doğal mı garip mi seç</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 22, marginBottom: 12 }]}>Diğer sahneler</Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface },
  safeTop: { backgroundColor: '#FCF9F7' },
  topBar: {
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
  subtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
    marginBottom: 18,
    lineHeight: 19,
  },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 16 },
  firstSectionTitle: { marginBottom: 10 },
  hero: {
    backgroundColor: primary,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  heroLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255,255,255,0.74)',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroMeta: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 4,
  },
  heroGoal: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 14,
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
  practiceGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  practiceCard: {
    flex: 1,
    backgroundColor: white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: outlineVariant,
    padding: 12,
    minHeight: 118,
  },
  practiceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(165, 100, 72, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  practiceTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
  },
  practiceSub: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
    marginTop: 4,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(176, 109, 80, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(176, 109, 80, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
    gap: 10,
  },
  supportTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurfaceVariant,
  },
  supportSub: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Poppins_500Medium',
    color: '#7A6E68',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
  },
  miniGameGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  miniGameCard: {
    flex: 1,
    backgroundColor: 'rgba(176, 109, 80, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(176, 109, 80, 0.18)',
    padding: 12,
    minHeight: 118,
  },
  miniIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(165, 100, 72, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  miniTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
  },
  miniSub: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
    marginTop: 4,
  },
  pickedList: { gap: 10 },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: white,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(216,194,186,0.2)',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  lessonThumb: {
    width: 46,
    height: 46,
    borderRadius: 12,
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
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins_500Medium',
    color: onSurface,
  },
  lessonSub: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
    marginTop: 4,
  },
  lessonChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
