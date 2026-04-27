import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PracticeTarget } from '../data/practiceGoals';
import PracticeFocusPicker from './PracticeFocusPicker';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Variant = 'onboarding' | 'startup';

type Props = {
  selected: PracticeTarget | null;
  onSelect: (t: PracticeTarget) => void;
  variant: Variant;
  title?: string;
  subtitle?: string;
};

/**
 * Ana dil sonrası hedef seçimi: beyaz kart + akordiyon hedef listesi.
 */
export default function PracticeFocusGoalCard({
  selected,
  onSelect,
  variant,
  title = 'Bugünün odağı',
  subtitle,
}: Props) {
  const onb = variant === 'onboarding';
  const defaultSub = onb
    ? 'Günlük koşu ve ipuçları seçtiğin hedefe göre şekillenir.'
    : 'Günlük koşu ve ipuçları bu hedefe göre ayarlanır. İstersen değiştir.';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{subtitle ?? defaultSub}</Text>
      <View style={styles.divider} />
      <PracticeFocusPicker
        selected={selected}
        onSelect={onSelect}
        variant="light"
        scrollable={onb}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: colors.bgMid,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    ...typography.lingua.heading3,
    color: colors.inkPrimary,
    marginBottom: 8,
  },
  sub: {
    ...typography.lingua.description,
    color: colors.inkSecondary,
    marginBottom: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginBottom: 10,
  },
});
