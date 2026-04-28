import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Dimensions, Platform, ImageBackground,
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

const STAGE_META: Record<string, { icon: string; labelKey: string }> = {
  cafe:     { icon: 'coffee', labelKey: 'scenarios.stage.cafe' },
  social:   { icon: 'users',  labelKey: 'scenarios.stage.social' },
  story:    { icon: 'book-open', labelKey: 'scenarios.stage.story' },
  travel:   { icon: 'navigation', labelKey: 'scenarios.stage.travel' },
  business: { icon: 'briefcase', labelKey: 'scenarios.stage.business' },
  survival: { icon: 'shield', labelKey: 'scenarios.stage.survival' },
};

const STAGE_ORDER = ['cafe', 'social', 'story', 'travel', 'business', 'survival'];

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

export default function ScenariosScreen({ onScenarioSelect, onBack }: Props) {
  const t = useAppTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unlockedTypes, setUnlockedTypes] = useState<string[]>(['cafe', 'social', 'story']);
  const [nextGoal, setNextGoal] = useState('');
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});

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

  const allGroups = STAGE_ORDER.map(key => ({
    key,
    items: scenarios.filter(s => (s.stageType ?? 'social') === key),
  })).filter(g => g.items.length > 0);

  const unlockedGroups = allGroups.filter(g => unlockedTypes.includes(g.key));
  const lockedGroups = allGroups.filter(g => !unlockedTypes.includes(g.key));
  const stageGroups = [...unlockedGroups, ...lockedGroups];

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

        {/* Stage groups */}
        {stageGroups.map((group) => {
          const isUnlocked = unlockedTypes.includes(group.key);
          const meta = STAGE_META[group.key] ?? { icon: 'circle', labelKey: group.key };
          return (
            <View key={group.key} style={styles.groupWrap}>
              {/* Group header */}
              <View style={styles.groupHeader}>
                <Feather name={meta.icon as any} size={12} color={isUnlocked ? colors.accentWarmSoft : colors.inkTertiary} />
                <Text style={[styles.groupTitle, !isUnlocked && styles.groupTitleLocked]}>
                  {t(meta.labelKey).toUpperCase()}
                </Text>
                {!isUnlocked && (
                  <View style={styles.lockBadge}>
                    <Feather name="lock" size={9} color={colors.inkTertiary} />
                  </View>
                )}
              </View>

              {!isUnlocked ? (
                <View style={styles.lockedCard}>
                  <Text style={styles.lockedText}>
                    {nextGoal || t('scenarios.locked')}
                  </Text>
                </View>
              ) : (
                group.items.map((scenario, index) => {
                  const isDone = completedIds.includes(scenario.id);
                  const playCount = playCounts[scenario.id] ?? 0;
                  const variant = getScenarioWithVariant(scenario, playCount, profile?.identity);
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

                      {/* Text content */}
                      <View style={styles.cardBody}>
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
                })
              )}
            </View>
          );
        })}

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
