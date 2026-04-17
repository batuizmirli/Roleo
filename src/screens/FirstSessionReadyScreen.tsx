import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { trackEvent } from '../services/telemetry';

type Props = {
  onStart: () => void;
};

export default function FirstSessionReadyScreen({ onStart }: Props) {
  useEffect(() => {
    trackEvent('first_session_ready_seen');
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>roleo</Text>
      <Text style={styles.title}>Hazırsın.</Text>
      <Text style={styles.subtitle}>İlk sahnene giriyoruz.</Text>

      <View style={styles.card}>
        <Text style={styles.cardEmoji}>☕</Text>
        <Text style={styles.cardTitle}>İlk Stage: Café Stage</Text>
        <Text style={styles.cardDesc}>Leo ile kısa bir sipariş konuşması yapacaksın.</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>Sahneye Gir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A', paddingHorizontal: 24, paddingTop: 90 },
  logo: { color: '#FF4D6D', fontSize: 26, fontWeight: '900', letterSpacing: 2, marginBottom: 28 },
  title: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  subtitle: { color: '#AAA', fontSize: 16, marginTop: 8, marginBottom: 24 },
  card: { backgroundColor: '#1A1A2E', borderRadius: 18, borderWidth: 1, borderColor: '#2A2A3E', padding: 16, marginBottom: 22 },
  cardEmoji: { fontSize: 28 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 10 },
  cardDesc: { color: '#888', fontSize: 13, marginTop: 6, lineHeight: 20 },
  button: { marginTop: 'auto', marginBottom: 34, backgroundColor: '#FF4D6D', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
});
