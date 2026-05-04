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
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

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
      const targetLanguage = profile?.language?.name ?? 'English';
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

        <View style={styles.hero}>
          <Text style={styles.kicker}>Kısa prova</Text>
          <Text style={styles.title}>Kısa prova</Text>
          <Text style={styles.subtitle}>Sahneye girmeden önce cümleyi yaz. Anlamını çöz, kullanımını öğren, mini sahnesini gör.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Ne duydun?</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn. golazo ne demek?"
            placeholderTextColor={colors.inkTertiary}
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
          {loading ? <ActivityIndicator color={colors.bgDeep} /> : <Text style={styles.buttonText}>Açıkla + mini sahne kur</Text>}
        </TouchableOpacity>

        {answer ? (
          <View style={styles.answerCard}>
            <Text style={styles.answerLabel}>SONUÇ</Text>
            <Text style={styles.answerText}>{answer}</Text>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Bugünkü sahneye küçük bir not bırak</Text>
            <Text style={styles.emptyText}>Duyduğun bir ifade, mesajdaki bir cümle veya aklına takılan kısa bir cevap yeter.</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  backText: { color: colors.inkSecondary, fontSize: 15, fontFamily: 'InterTight_600SemiBold' },
  hero: { backgroundColor: colors.bgMid, borderRadius: 22, padding: spacing.lg, borderWidth: 1, borderColor: colors.hairlineStrong, marginBottom: spacing.lg },
  kicker: { color: colors.accentWarm, fontSize: typography.size.xs, fontFamily: 'InterTight_600SemiBold', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  title: { color: colors.inkPrimary, fontSize: 28, fontFamily: 'InterTight_600SemiBold' },
  subtitle: { color: colors.inkSecondary, fontSize: 15, lineHeight: 22, marginTop: 8 },
  card: { backgroundColor: colors.bgMid, borderRadius: 20, padding: 18, borderWidth: 1.5, borderColor: colors.hairlineStrong },
  cardLabel: { color: colors.inkPrimary, fontSize: 15, fontFamily: 'InterTight_600SemiBold', marginBottom: 10 },
  input: { minHeight: 104, color: colors.inkPrimary, fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  chipsWrap: { gap: 8, marginTop: 12 },
  chip: { backgroundColor: colors.bgSoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: colors.hairlineStrong },
  chipText: { color: colors.accentWarm, fontSize: 12, lineHeight: 18 },
  button: { backgroundColor: colors.accentWarm, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 18 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.bgDeep, fontSize: 16, fontFamily: 'InterTight_600SemiBold' },
  answerCard: { marginTop: 18, backgroundColor: colors.bgMid, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.hairlineStrong },
  answerLabel: { color: colors.accentWarm, fontSize: 11, fontFamily: 'InterTight_600SemiBold', letterSpacing: 1, marginBottom: 8 },
  answerText: { color: colors.inkPrimary, fontSize: 14, lineHeight: 22 },
  emptyCard: { marginTop: 14, backgroundColor: colors.bgSoft, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.hairlineStrong },
  emptyTitle: { color: colors.inkPrimary, fontSize: 14, fontFamily: 'InterTight_600SemiBold', marginBottom: 4 },
  emptyText: { color: colors.inkSecondary, fontSize: 13, lineHeight: 19 },
});
