import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  onContinueStage: () => void;
  onStartMission: () => void;
};

export default function FirstSessionNextScreen({ onContinueStage, onStartMission }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Harika başlangıç 🎉</Text>
      <Text style={styles.subtitle}>Şimdi ne yapmak istersin?</Text>

      <TouchableOpacity style={styles.mainCard} onPress={onContinueStage}>
        <Text style={styles.mainEmoji}>🎭</Text>
        <Text style={styles.mainTitle}>Continue Stage</Text>
        <Text style={styles.mainDesc}>Yeni bir sahne ile roleplay’e devam et</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryCard} onPress={onStartMission}>
        <Text style={styles.secondaryEmoji}>⚡</Text>
        <Text style={styles.secondaryTitle}>Today’s Mission</Text>
        <Text style={styles.secondaryDesc}>30-60 saniyelik tek görev, tek ödül</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A', paddingTop: 80, paddingHorizontal: 24 },
  title: { color: '#FFF', fontSize: 30, fontWeight: '900' },
  subtitle: { color: '#9A9AA8', fontSize: 15, marginTop: 8, marginBottom: 20 },
  mainCard: { backgroundColor: '#1A1A2E', borderRadius: 18, borderWidth: 1.5, borderColor: '#FF4D6D66', padding: 16, marginBottom: 12 },
  mainEmoji: { fontSize: 26 },
  mainTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 8 },
  mainDesc: { color: '#AAA', fontSize: 13, marginTop: 4 },
  secondaryCard: { backgroundColor: '#171727', borderRadius: 16, borderWidth: 1, borderColor: '#2C2C45', padding: 14 },
  secondaryEmoji: { fontSize: 22 },
  secondaryTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 8 },
  secondaryDesc: { color: '#888', fontSize: 12, marginTop: 3 },
});
