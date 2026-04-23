import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PracticeTarget } from '../data/practiceGoals';
import PracticeFocusPicker from './PracticeFocusPicker';

type Variant = 'onboarding' | 'startup';

type Props = {
  selected: PracticeTarget | null;
  onSelect: (t: PracticeTarget) => void;
  variant: Variant;
  /** Varsayılan: Bugünün odağı */
  title?: string;
  subtitle?: string;
};

/**
 * Ana dil sonrası hedef seçimi: tek kart içinde başlık + gruplu hedef listesi.
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
    <View style={[styles.card, onb ? styles.cardOnb : styles.cardStartup]}>
      <Text style={onb ? styles.titleOnb : styles.titleStartup}>{title}</Text>
      <Text style={onb ? styles.subOnb : styles.subStartup}>{subtitle ?? defaultSub}</Text>
      <View style={[styles.divider, onb ? styles.dividerOnb : styles.dividerStartup]} />
      <PracticeFocusPicker
        selected={selected}
        onSelect={onSelect}
        variant={onb ? 'dark' : 'light'}
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
  },
  cardOnb: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  cardStartup: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(216,194,186,0.45)',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  titleOnb: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  titleStartup: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#1B1C1C',
    marginBottom: 8,
  },
  subOnb: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 14,
  },
  subStartup: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins_400Regular',
    color: '#53433E',
    marginBottom: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  dividerOnb: { backgroundColor: 'rgba(255,255,255,0.14)' },
  dividerStartup: { backgroundColor: 'rgba(136, 76, 50, 0.15)' },
});
