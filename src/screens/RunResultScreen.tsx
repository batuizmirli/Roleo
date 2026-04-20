import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ModuleResult } from '../types';

type Props = {
  results: ModuleResult[];
  onExit: () => void;
};

export default function RunResultScreen({ results, onExit }: Props) {
  const overallAccuracy = results.length
    ? Math.round((results.reduce((s, r) => s + r.accuracy, 0) / results.length) * 100)
    : 0;
  const maxCombo = results.reduce((m, r) => Math.max(m, r.comboMax ?? 0), 0);

  const message = overallAccuracy >= 80
    ? 'You handled it smoothly'
    : overallAccuracy >= 55
    ? 'You hesitated but recovered'
    : 'You struggled but pushed through';

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{overallAccuracy >= 80 ? '🏆' : overallAccuracy >= 55 ? '🎯' : '💪'}</Text>
      <Text style={styles.title}>Daily Run Complete</Text>
      <Text style={styles.metric}>Overall Accuracy: %{overallAccuracy}</Text>
      <Text style={styles.metric}>Max Combo: {maxCombo}</Text>
      <Text style={styles.message}>{message}</Text>

      <TouchableOpacity style={styles.btn} onPress={onExit}>
        <Text style={styles.btnText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: { fontSize: 56 },
  title: { color: '#1A2B3C', fontSize: 28, fontWeight: '900', marginTop: 10 },
  metric: { color: '#CBD5E1', fontSize: 16, marginTop: 8 },
  message: { color: '#A78BFA', fontSize: 16, marginTop: 14, fontWeight: '700' },
  btn: {
    marginTop: 22,
    backgroundColor: '#1B9C5A',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: 220,
    alignItems: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
