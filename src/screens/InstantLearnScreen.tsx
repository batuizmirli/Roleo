import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, UserProfile } from '../types';
import { tryParseJson } from '../services/json';
import { sendMessage } from '../services/claude';
import { trackEvent } from '../services/telemetry';

type Props = {
  onBack: () => void;
};

const EXAMPLES = [
  'Spiker “golazo” dedi, ne demek?',
  'Waiter said “for here or to go?”',
  '“Qué te pongo?” ne zaman kullanılır?',
];

export default function InstantLearnScreen({ onBack }: Props) {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLearn = async () => {
    if (!query.trim() || loading) return;

    setLoading(true);
    try {
      const profileRaw = await AsyncStorage.getItem('userProfile');
      const profile = profileRaw ? tryParseJson<UserProfile>(profileRaw) : null;
      const nativeLanguage = profile?.nativeLanguage?.name ?? 'English';
      const targetLanguage = profile?.language?.name ?? 'Spanish';
      const identityGoal = profile?.identity?.goal ?? profile?.goalDescription ?? 'feel natural in real life';

      const prompt = `
You are Roleo Instant Learn.
The user wants a fast real-life explanation in ${nativeLanguage} while learning ${targetLanguage}.
Keep the answer practical, short, motivating, and real-life focused.
Reference their goal when useful: ${identityGoal}.

Return only plain text in this structure:
ANLAMI:
...

NE ZAMAN KULLANILIR:
...

HIZLI CEVAP:
...

MİNİ SAHNE:
...
`;

      const msg: Message[] = [{
        id: 'instant-learn',
        role: 'user',
        content: query.trim(),
        timestamp: new Date(),
      }];

      const response = await sendMessage(msg, prompt, { maxTokens: 500 });
      await trackEvent('instant_learn_used', { queryLength: query.trim().length, hasIdentityGoal: Boolean(profile?.identity?.goal) });
      setAnswer(response);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Instant Learn şu an çalışmadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.logo}>roleo</Text>
        <Text style={styles.title}>Instant Learn</Text>
        <Text style={styles.subtitle}>Duyduğun cümleyi yaz. Anlamını çöz, kullanımını öğren, mini sahnesini gör.</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Ne duydun?</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn. golazo ne demek?"
            placeholderTextColor="#555"
            multiline
            value={query}
            onChangeText={setQuery}
          />
          <View style={styles.chipsWrap}>
            {EXAMPLES.map(example => (
              <TouchableOpacity key={example} style={styles.chip} onPress={() => setQuery(example)}>
                <Text style={styles.chipText}>{example}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, (!query.trim() || loading) && styles.buttonDisabled]}
          onPress={handleLearn}
          disabled={!query.trim() || loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Açıkla + Mini Sahne Üret</Text>}
        </TouchableOpacity>

        {answer ? (
          <View style={styles.answerCard}>
            <Text style={styles.answerLabel}>SONUÇ</Text>
            <Text style={styles.answerText}>{answer}</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  backText: { color: '#9AABB8', fontSize: 15, fontWeight: '600' },
  logo: { fontSize: 28, fontWeight: '900', color: '#1B9C5A', letterSpacing: 2, marginBottom: 20 },
  title: { color: '#1A2B3C', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#9AABB8', fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#E8EDF2' },
  cardLabel: { color: '#1A2B3C', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  input: { minHeight: 110, color: '#1A2B3C', fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  chipsWrap: { gap: 8, marginTop: 12 },
  chip: { backgroundColor: '#221927', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#382438' },
  chipText: { color: '#FFB6C1', fontSize: 12, lineHeight: 18 },
  button: { backgroundColor: '#1B9C5A', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 18 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  answerCard: { marginTop: 18, backgroundColor: '#131A22', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#243447' },
  answerLabel: { color: '#60A5FA', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  answerText: { color: '#EAEAEA', fontSize: 14, lineHeight: 22 },
});
