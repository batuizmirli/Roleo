import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Scenario } from '../types';
import { trackEvent } from '../services/telemetry';

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
      <Text style={styles.logo}>roleo</Text>
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
  container: { flex: 1, backgroundColor: '#0A0A12', paddingHorizontal: 24, paddingTop: 90 },
  logo: { color: '#E8324A', fontSize: 26, fontWeight: '900', letterSpacing: 2, marginBottom: 28 },
  title: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  subtitle: { color: '#AAA', fontSize: 16, marginTop: 8, marginBottom: 24 },
  card: { backgroundColor: '#16162A', borderRadius: 18, borderWidth: 1, borderColor: '#252540', padding: 16, marginBottom: 22 },
  cardEmoji: { fontSize: 28 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 10 },
  cardDesc: { color: '#888', fontSize: 13, marginTop: 6, lineHeight: 20 },
  cardMission: { color: '#3DD68C', fontSize: 12, marginTop: 8, lineHeight: 18 },
  button: { marginTop: 'auto', marginBottom: 34, backgroundColor: '#E8324A', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
});
