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
  container: { flex: 1, backgroundColor: colors.bgDeep, paddingHorizontal: 24, paddingTop: 90 },
  logo: {
    color: colors.accentWarm,
    fontSize: 26,
    fontFamily: 'Fraunces_300Light',
    letterSpacing: -0.3,
    marginBottom: 28,
  },
  title: { color: colors.inkPrimary, fontSize: 32, fontFamily: 'Fraunces_300Light', lineHeight: 38 },
  subtitle: { color: colors.inkSecondary, fontSize: 16, fontFamily: 'InterTight_400Regular', marginTop: 8, marginBottom: 24 },
  card: {
    backgroundColor: colors.bgMid,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    padding: 16,
    marginBottom: 22,
  },
  cardEmoji: { fontSize: 28 },
  cardTitle: { color: colors.inkPrimary, fontSize: 18, fontFamily: 'InterTight_600SemiBold', marginTop: 10 },
  cardDesc: { color: colors.inkTertiary, fontSize: 13, fontFamily: 'InterTight_400Regular', marginTop: 6, lineHeight: 20 },
  cardMission: { color: colors.accentWarmSoft, fontSize: 12, fontFamily: 'InterTight_500Medium', marginTop: 8, lineHeight: 18 },
  button: {
    marginTop: 'auto',
    marginBottom: 34,
    backgroundColor: colors.accentWarm,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: colors.bgDeep, fontFamily: 'InterTight_600SemiBold', fontSize: 16 },
});
