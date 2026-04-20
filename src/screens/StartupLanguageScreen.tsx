import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, UserProfile } from '../types';
import { tryParseJson } from '../services/json';

const NATIVE_LANGUAGES: Language[] = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

type Props = {
  onComplete: () => void;
  onReset: () => void;
};

export default function StartupLanguageScreen({ onComplete, onReset }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selected, setSelected] = useState<Language | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const profileData = await AsyncStorage.getItem('userProfile');
      if (!profileData) {
        onReset();
        return;
      }

      const parsed = tryParseJson<UserProfile>(profileData);
      if (!parsed) {
        await AsyncStorage.removeItem('userProfile');
        onReset();
        return;
      }

      setProfile(parsed);
      setSelected(parsed.nativeLanguage ?? null);
      setLoading(false);
    };

    load();
  }, [onReset]);

  const handleContinue = async () => {
    if (!profile || !selected || saving) return;
    setSaving(true);

    const updated: UserProfile = {
      ...profile,
      nativeLanguage: selected,
    };

    await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
    onComplete();
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#FF4D6D" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.logo}>roleo</Text>
      <Text style={styles.title}>Ana dilin hangisi?</Text>
      <Text style={styles.subtitle}>Öğrenme açıklamalarını bu dilde göstereceğim.</Text>

      <View style={styles.grid}>
        {NATIVE_LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.card, selected?.code === lang.code && styles.cardActive]}
            onPress={() => setSelected(lang)}
            activeOpacity={0.85}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text style={styles.name}>{lang.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.button, !selected && styles.buttonDisabled]} onPress={handleContinue} disabled={!selected || saving}>
        <Text style={styles.buttonText}>{saving ? 'Kaydediliyor...' : 'Devam Et →'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  loadingWrap: { flex: 1, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 28, fontWeight: '900', color: '#1B9C5A', letterSpacing: 2, marginBottom: 26 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A2B3C', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#9AABB8', marginBottom: 28, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E8EDF2',
  },
  cardActive: { borderColor: '#1B9C5A', backgroundColor: '#1F1520' },
  flag: { fontSize: 22 },
  name: { fontSize: 14, fontWeight: '700', color: '#1A2B3C', flex: 1 },
  button: {
    marginTop: 24,
    backgroundColor: '#1B9C5A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
