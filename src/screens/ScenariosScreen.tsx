import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Dimensions, Platform, ImageBackground, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Scenario } from '../types';
import { getDailyScenarios, getScenarioWithVariant } from '../data/scenarios';
import { tryParseJson } from '../services/json';
import AnimatedPressable from '../components/AnimatedPressable';
import { getProgress, getUnlockState } from '../services/progress';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAppTranslation } from '../i18n';

const { width: SW } = Dimensions.get('window');

type Props = {
  onScenarioSelect: (scenario: Scenario) => void;
  onBack: () => void;
};

type SceneCategoryId = NonNullable<Scenario['sceneCategory']> | 'all';

const CATEGORY_META: Array<{ id: SceneCategoryId; label: string; icon: string }> = [
  { id: 'all', label: 'Tümü', icon: '✨' },
  { id: 'daily', label: 'Günlük', icon: '🌆' },
  { id: 'travel', label: 'Seyahat', icon: '🧳' },
  { id: 'work', label: 'İş', icon: '💼' },
  { id: 'social', label: 'Sosyal', icon: '💬' },
  { id: 'sports', label: 'Spor', icon: '🏟️' },
  { id: 'food', label: 'Yemek', icon: '🍽️' },
  { id: 'survival', label: 'Acil', icon: '🛟' },
];

const TOPIC_META: Record<string, string> = {
  cafe: 'Kafe',
  restaurant: 'Restoran',
  market: 'Pazar',
  recipe: 'Tarif',
  directions: 'Yön sorma',
  hotel: 'Otel',
  transport: 'Ulaşım',
  airport: 'Havalimanı',
  meeting: 'Toplantı',
  interview: 'Mülakat',
  concert: 'Konser',
  party: 'Parti',
  smallTalk: 'Small talk',
  football: 'Futbol',
  basketball: 'Basketbol',
  horseRiding: 'Atçılık',
  motorsports: 'Motorsporları',
  pharmacy: 'Eczane',
  emergency: 'Acil yardım',
};

const categoryForScenario = (scenario: Scenario): SceneCategoryId => {
  if (scenario.sceneCategory) return scenario.sceneCategory;
  if (scenario.stageType === 'cafe') return 'food';
  if (scenario.stageType === 'travel') return 'travel';
  if (scenario.stageType === 'business') return 'work';
  if (scenario.stageType === 'survival') return 'survival';
  return 'social';
};

const topicForScenario = (scenario: Scenario): string => {
  if (scenario.sceneTopic) return scenario.sceneTopic;
  if (scenario.stageType === 'cafe') return 'cafe';
  if (scenario.stageType === 'business') return 'meeting';
  if (scenario.stageType === 'travel') return scenario.title.toLocaleLowerCase().includes('otel') ? 'hotel' : 'directions';
  if (scenario.stageType === 'survival') return 'emergency';
  if (scenario.title.toLocaleLowerCase().includes('konser')) return 'concert';
  return 'smallTalk';
};

const FALLBACK_STAGE_IMAGES: Record<string, string> = {
  cafe: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop&q=70',
  social: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop&q=70',
  story: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&h=400&fit=crop&q=70',
  travel: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&h=400&fit=crop&q=70',
  business: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop&q=70',
  survival: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&h=400&fit=crop&q=70',
};

const imageForScenario = (scenario: Scenario) =>
  scenario.backgroundImage || FALLBACK_STAGE_IMAGES[scenario.stageType ?? 'social'] || FALLBACK_STAGE_IMAGES.social;

const lockedStageReason = (stageType: string) => {
  if (stageType === 'business') return 'Seviye 7: Work scenes açıldığında profesyonel sahneler gelir.';
  if (stageType === 'survival') return 'Seviye 2: daha gerçekçi tempo açıldığında survival sahneleri gelir.';
  if (stageType === 'travel') return 'Temel seyahat sahneleri açık. Gelişmiş seyahat provası Plus ile açılır.';
  return 'Bu sahne tipi progression içinde biraz daha prova sonrası açılır.';
};

export default function ScenariosScreen({ onScenarioSelect, onBack }: Props) {
  const t = useAppTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unlockedTypes, setUnlockedTypes] = useState<string[]>(['cafe', 'travel', 'social', 'story']);
  const [nextGoal, setNextGoal] = useState('');
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<SceneCategoryId>('all');
  const [activeTopic, setActiveTopic] = useState<string>('all');
  const subNavEntrance = useRef(new Animated.Value(1)).current;

  const load = async () => {
    const data = await AsyncStorage.getItem('userProfile');
    if (!data) return;
    const p = tryParseJson<UserProfile>(data);
    if (!p) { await AsyncStorage.removeItem('userProfile'); return; }
    setProfile(p);
    setScenarios(getDailyScenarios(p.language.code));
    const progress = await getProgress();
    const unlockState = getUnlockState(progress);
    setUnlockedTypes(unlockState.unlockedStageTypes);
    setNextGoal(unlockState.nextGoal);
    setCompletedIds(progress.completedScenarioIds);
    setPlayCounts(progress.scenarioPlayCounts ?? {});
  };

  useEffect(() => { load(); }, []);

  const availableCategories = useMemo(() => (
    CATEGORY_META.filter(category => (
      category.id === 'all' || scenarios.some(s => categoryForScenario(s) === category.id)
    ))
  ), [scenarios]);

  const topicOptions = useMemo(() => {
    if (activeCategory === 'all') return [];
    const seen = new Set<string>();
    scenarios.forEach((scenario) => {
      if (categoryForScenario(scenario) === activeCategory) seen.add(topicForScenario(scenario));
    });
    return Array.from(seen).map(id => ({
      id,
      label: TOPIC_META[id] ?? id,
    }));
  }, [activeCategory, scenarios]);

  const visibleScenarios = useMemo(() => (
    scenarios.filter((scenario) => {
      const categoryMatch = activeCategory === 'all' || categoryForScenario(scenario) === activeCategory;
      const topicMatch = activeTopic === 'all' || topicForScenario(scenario) === activeTopic;
      return categoryMatch && topicMatch;
    })
  ), [activeCategory, activeTopic, scenarios]);

  const selectCategory = (category: SceneCategoryId) => {
    setActiveCategory(category);
    setActiveTopic('all');
  };

  useEffect(() => {
    if (topicOptions.length === 0) return;
    subNavEntrance.setValue(0);
    Animated.timing(subNavEntrance, {
      toValue: 1,
      duration: 420,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [activeCategory, topicOptions.length, subNavEntrance]);

  return (
    <View style={styles.container}>
      {/* Atmosphere */}
      <View style={styles.glow1} pointerEvents="none" />

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <Feather name="arrow-left" size={18} color={colors.inkSecondary} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
            tintColor={colors.accentWarm}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{t('scenarios.eyebrow')}</Text>
          <Text style={styles.title}>
            {t('scenarios.title')}
          </Text>
          {!!profile?.language?.name && (
            <Text style={styles.subtitle}>{t('scenarios.count', { language: profile.language.name, count: scenarios.length })}</Text>
          )}
        </View>

        {/* Next unlock hint */}
        {!!nextGoal && (
          <View style={styles.unlockHint}>
            <Feather name="lock" size={11} color={colors.accentWarmSoft} />
            <Text style={styles.unlockHintText}>{nextGoal}</Text>
          </View>
        )}

        <View style={styles.tabBleed}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {availableCategories.map((category) => {
              const active = activeCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => selectCategory(category.id)}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  activeOpacity={0.84}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {category.icon} {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {topicOptions.length > 0 && (
          <Animated.View
            style={[
              styles.subTabBleed,
              {
                opacity: subNavEntrance,
                transform: [{
                  translateY: subNavEntrance.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }),
                }],
              },
            ]}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabRow}>
              {[{ id: 'all', label: 'Hepsi' }, ...topicOptions].map((topic) => {
                const active = activeTopic === topic.id;
                return (
                  <TouchableOpacity
                    key={topic.id}
                    onPress={() => setActiveTopic(topic.id)}
                    style={[styles.subTabBtn, active && styles.subTabBtnActive]}
                    activeOpacity={0.84}
                  >
                    <Text style={[styles.subTabText, active && styles.subTabTextActive]}>{topic.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        <View style={styles.sceneList}>
          {visibleScenarios.map((scenario, index) => {
            const stage = scenario.stageType ?? 'social';
            const isUnlocked = unlockedTypes.includes(stage);
            const isDone = completedIds.includes(scenario.id);
            const playCount = playCounts[scenario.id] ?? 0;
            const variant = getScenarioWithVariant(scenario, playCount, profile?.identity);

            if (!isUnlocked) {
              return (
                <View key={scenario.id} style={styles.lockedCard}>
                  <View style={styles.lockedTitleRow}>
                    <Feather name="lock" size={11} color={colors.inkTertiary} />
                    <Text style={styles.lockedTitle}>{scenario.title}</Text>
                  </View>
                  <Text style={styles.lockedText}>{lockedStageReason(stage)}</Text>
                </View>
              );
            }

            return (
              <AnimatedPressable
                key={scenario.id}
                style={[styles.card, isDone && styles.cardDone]}
                onPress={() => onScenarioSelect(variant)}
                delay={index * 40}
              >
                <ScenarioCardPhoto
                  scenario={variant}
                  imageUri={imageForScenario(variant)}
                  isDone={isDone}
                  completedLabel={t('scenarios.completed')}
                />

                <View style={styles.cardBody}>
                  <View style={styles.topicRow}>
                    <Text style={styles.topicPill}>{TOPIC_META[topicForScenario(scenario)] ?? topicForScenario(scenario)}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{scenario.title}</Text>
                  <View style={styles.cardLocationRow}>
                    <Feather name="map-pin" size={10} color={colors.inkTertiary} />
                    <Text style={styles.cardLocation}>{scenario.location}</Text>
                  </View>
                  {!!scenario.mission && (
                    <Text style={styles.cardMission} numberOfLines={2}>{scenario.mission}</Text>
                  )}
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardCta}>
                      {isDone ? 'Tekrar oyna' : 'Sahneye gir'} →
                    </Text>
                    <View style={styles.xpBadge}>
                      <Text style={styles.xpBadgeText}>+{scenario.xpReward ?? 20} XP</Text>
                    </View>
                  </View>
                </View>
              </AnimatedPressable>
            );
          })}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const diffColor = (d: string) =>
  d === 'beginner' ? colors.successDs : d === 'intermediate' ? colors.accentWarm : colors.errorDs;
const diffLabel = (d: string) =>
  d === 'beginner' ? 'Başlangıç' : d === 'intermediate' ? 'Orta' : 'İleri';

function ScenarioCardPhoto({
  scenario,
  imageUri,
  isDone,
  completedLabel,
}: {
  scenario: Scenario;
  imageUri: string;
  isDone: boolean;
  completedLabel: string;
}) {
  const [uri, setUri] = useState(imageUri);
  const fallbackUri = imageForScenario({ ...scenario, backgroundImage: undefined });

  useEffect(() => {
    setUri(imageUri);
  }, [imageUri]);

  return (
    <ImageBackground
      source={{ uri }}
      style={styles.cardPhoto}
      resizeMode="cover"
      imageStyle={{ borderRadius: 0 }}
      onError={() => {
        if (uri !== fallbackUri) setUri(fallbackUri);
      }}
    >
      <LinearGradient
        colors={['rgba(10,14,20,0.10)', 'rgba(10,14,20,0.72)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardPhotoOverlay}>
        <Text style={styles.cardEmoji}>{scenario.emoji}</Text>
        <View style={styles.cardBadgeRow}>
          {isDone && (
            <View style={styles.doneBadge}>
              <Feather name="check" size={10} color={colors.successDs} />
              <Text style={styles.doneBadgeText}>{completedLabel}</Text>
            </View>
          )}
          <View style={styles.diffBadge}>
            <Text style={[styles.diffBadgeText, { color: diffColor(scenario.difficulty) }]}>
              {diffLabel(scenario.difficulty)}
            </Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },

  glow1: {
    position: 'absolute',
    width: SW * 0.8,
    height: SW * 0.8,
    borderRadius: SW * 0.4,
    backgroundColor: 'rgba(232,181,118,0.05)',
    top: -SW * 0.2,
    right: -SW * 0.2,
  },

  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 20,
    zIndex: 100,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgMid,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 108 : 88, paddingBottom: 40 },

  header: { marginBottom: 24 },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accentWarm,
    fontSize: 10,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 32,
    color: colors.inkPrimary,
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 8,
  },
  titleItalic: {
    fontFamily: 'Fraunces_300Light_Italic',
    color: colors.accentWarm,
  },
  subtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.inkTertiary,
  },

  unlockHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgMid,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  unlockHintText: {
    ...typography.body,
    fontSize: 12,
    color: colors.inkSecondary,
    flex: 1,
  },

  tabBleed: {
    marginHorizontal: -20,
    marginBottom: 10,
  },
  tabRow: {
    paddingHorizontal: 20,
    gap: 10,
  },
  tabBtn: {
    minWidth: 104,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.bgMid,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  tabBtnActive: {
    borderColor: colors.accentWarm,
    backgroundColor: colors.bgSoft,
  },
  tabText: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.inkSecondary,
  },
  tabTextActive: {
    color: colors.accentWarm,
  },
  subTabBleed: {
    marginHorizontal: -20,
    marginBottom: 18,
  },
  subTabRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  subTabBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    backgroundColor: 'rgba(255,255,255,0.035)',
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  subTabBtnActive: {
    borderColor: colors.accentWarm,
    backgroundColor: colors.accentGlow,
  },
  subTabText: {
    ...typography.bodyMedium,
    fontSize: 12,
    color: colors.inkTertiary,
  },
  subTabTextActive: {
    color: colors.accentWarm,
  },
  sceneList: {
    gap: 10,
  },

  groupWrap: { marginBottom: 28 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  groupTitle: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.inkSecondary,
    letterSpacing: 2,
  },
  groupTitleLocked: { color: colors.inkTertiary },
  lockBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lockedCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
    opacity: 0.6,
  },
  lockedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  lockedTitle: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.inkSecondary,
  },
  lockedText: {
    ...typography.body,
    fontSize: 13,
    color: colors.inkTertiary,
    lineHeight: 19,
  },

  card: {
    backgroundColor: colors.bgMid,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },
  cardDone: { borderColor: colors.hairlineStrong },

  cardPhoto: {
    width: '100%',
    height: 130,
    justifyContent: 'flex-end',
  },
  cardPhotoOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 12,
  },
  cardBody: {
    padding: 14,
    paddingTop: 12,
  },
  topicRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  topicPill: {
    ...typography.bodyMedium,
    fontSize: 10,
    color: colors.accentWarmSoft,
    backgroundColor: `${colors.accentWarm}12`,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  cardEmoji: { fontSize: 26 },
  cardBadgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },

  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.successDs}18`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  doneBadgeText: {
    ...typography.body,
    fontSize: 10,
    color: colors.successDs,
  },

  diffBadge: {
    backgroundColor: colors.bgSoft,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  diffBadgeText: {
    ...typography.bodyMedium,
    fontSize: 10,
  },

  cardTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 18,
    color: colors.inkPrimary,
    letterSpacing: -0.2,
    lineHeight: 25,
    marginBottom: 6,
  },

  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  cardLocation: {
    ...typography.body,
    fontSize: 12,
    color: colors.inkTertiary,
  },

  cardMission: {
    ...typography.body,
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginBottom: 10,
    fontStyle: 'italic',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    marginTop: 4,
  },
  cardCta: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.accentWarm,
  },
  xpBadge: {
    backgroundColor: `${colors.accentWarm}14`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  xpBadgeText: {
    ...typography.bodyMedium,
    fontSize: 11,
    color: colors.accentWarm,
  },
});
