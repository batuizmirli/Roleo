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
    subtitle: 'Kaldığın gerçek hayat provasına dön',
    image: LESSON_IMAGES.scenarios,
    thumbBg: 'rgba(160, 103, 76, 0.12)',
  },
  {
    id: 'true-or-fake',
    tag: 'TEMEL',
    title: 'True or Fake',
    subtitle: 'Doğal mı garip mi, hızlıca ayırt et',
    image: LESSON_IMAGES.trueOrFake,
    thumbBg: 'rgba(165, 100, 72, 0.12)',
  },
  {
    id: 'instant-learn',
    tag: 'İLERİ',
    title: 'Hızlı Prova',
    subtitle: 'Kısa bir konuşma anını dene',
    image: LESSON_IMAGES.instant,
    thumbBg: 'rgba(231, 226, 217, 0.55)',
  },
];

type Props = {
  onOpenScenarios: () => void;
  onStartDailyMission: () => void;
  onStartDailyRun: (goalId: string) => void;
  onOpenTrueOrFake?: () => void;
  onOpenInstantLearn?: () => void;
  onContinueScenarios: () => void;
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
  onOpenTrueOrFake,
  onOpenInstantLearn,
  onContinueScenarios,
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
    else if (id === 'true-or-fake') onOpenTrueOrFake?.();
    else onOpenInstantLearn?.();
  };

  const bottomPad = Math.max(insets.bottom, 12) + 56;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>Sahneler</Text>
        </View>
      </SafeAreaView>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Ana rota bugünkü koşu. Diğer sahneler tekrar ve keşif için burada.</Text>

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

        <TouchableOpacity style={styles.compactRow} onPress={onOpenScenarios} activeOpacity={0.88}>
          <MaterialIcons name="theater-comedy" size={22} color={primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Tüm sahneler</Text>
            <Text style={styles.rowSub}>Bugünkü koşudan sonra başka gerçek anları keşfet</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={terracotta} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportRow}
          onPress={() => onStartDailyRun(selectedTargetId)}
          activeOpacity={0.88}
        >
          <MaterialIcons name="directions-run" size={20} color={terracotta} />
          <View style={{ flex: 1 }}>
            <Text style={styles.supportTitle}>Aynı günlük akışı hedefinle başlat</Text>
            <Text style={styles.supportSub}>Hazırlık hedefini uygular, yine bugünkü sahneye götürür.</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 22, marginBottom: 12 }]}>Destekleyici pratikler</Text>
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
  compactRow: {
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
  rowTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
  },
  rowSub: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
    marginTop: 2,
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
