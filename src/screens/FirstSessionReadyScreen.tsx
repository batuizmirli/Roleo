import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Scenario } from '../types';
import { trackEvent } from '../services/telemetry';
import { colors } from '../theme/colors';

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
  container: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: 24, paddingTop: 90 },
  logo: {
    color: colors.primaryAccent,
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
    marginBottom: 28,
  },
  title: { color: colors.textPrimary, fontSize: 32, fontFamily: 'Poppins_700Bold', lineHeight: 38 },
  subtitle: { color: colors.textSecondary, fontSize: 16, fontFamily: 'Poppins_400Regular', marginTop: 8, marginBottom: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    padding: 16,
    marginBottom: 22,
  },
  cardEmoji: { fontSize: 28 },
  cardTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold', marginTop: 10 },
  cardDesc: { color: colors.textMuted, fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 6, lineHeight: 20 },
  cardMission: { color: colors.secondaryAccent, fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 8, lineHeight: 18 },
  button: {
    marginTop: 'auto',
    marginBottom: 34,
    backgroundColor: colors.primaryAccent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: colors.textOnAccent, fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
});
