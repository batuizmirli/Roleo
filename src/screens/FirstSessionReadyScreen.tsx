import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Scenario } from '../types';
import { trackEvent } from '../services/telemetry';
import { refined } from '../theme/refinedTokens';

type Props = {
  onStart: () => void;
  scenario?: Scenario | null;
};

const STAGE_LABEL: Record<string, string> = {
  cafe: 'Café Stage',
  social: 'Social Stage',
  travel: 'Travel Stage',
  business: 'Business Stage',
  story: 'Story Stage',
  survival: 'Survival Stage',
};

export default function FirstSessionReadyScreen({ onStart, scenario }: Props) {
  useEffect(() => {
    trackEvent('first_session_ready_seen');
  }, []);

  const stageLabel = STAGE_LABEL[scenario?.stageType ?? 'cafe'] ?? 'İlk Stage';

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Roleo</Text>
      <Text style={styles.title}>Hazırsın.</Text>
      <Text style={styles.subtitle}>İlk sahnene giriyoruz.</Text>

      <View style={styles.card}>
        <Text style={styles.cardEmoji}>{scenario?.emoji ?? '☕'}</Text>
        <Text style={styles.cardTitle}>İlk Stage: {stageLabel}</Text>
        <Text style={styles.cardDesc}>
          {scenario?.title ?? 'Birinci sahnen hazır'} · {scenario?.location ?? ''}
        </Text>
        {!!scenario?.mission && (
          <Text style={styles.cardMission}>🎯 {scenario.mission}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>Sahneye Gir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: refined.surfaceMuted, paddingHorizontal: 24, paddingTop: 90 },
  logo: {
    color: refined.text,
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: -0.3,
    marginBottom: 28,
  },
  title: { color: refined.text, fontSize: 34, fontFamily: 'PlayfairDisplay_700Bold', lineHeight: 40 },
  subtitle: { color: refined.textMuted, fontSize: 16, marginTop: 8, marginBottom: 24, fontFamily: 'Manrope_400Regular' },
  card: {
    backgroundColor: refined.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: refined.border,
    padding: 20,
    marginBottom: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  cardEmoji: { fontSize: 28 },
  cardTitle: { color: refined.text, fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', marginTop: 10 },
  cardDesc: { color: refined.textMuted, fontSize: 14, marginTop: 6, lineHeight: 21, fontFamily: 'Manrope_400Regular' },
  cardMission: { color: refined.secondary, fontSize: 13, marginTop: 8, lineHeight: 19, fontFamily: 'Manrope_500Medium' },
  button: {
    marginTop: 'auto',
    marginBottom: 34,
    backgroundColor: refined.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: refined.surface, fontFamily: 'Manrope_600SemiBold', fontSize: 16 },
});
