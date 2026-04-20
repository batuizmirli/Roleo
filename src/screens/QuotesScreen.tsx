import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { sendMessage } from '../services/claude';
import { parseModelJson, tryParseJson } from '../services/json';
import { awardActivityXP } from '../services/progress';
import AnimatedPressable from '../components/AnimatedPressable';

type Quote = {
  original: string;
  translation: string;
  author: string;
};

type QuoteSet = {
  title: string;
  content: Quote[];
};

type QuizQuestion = {
  sentence: string;
  author: string;
  options: string[];
  correct: number;
};

type Props = { onBack: () => void };

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const THINKERS = [
  'Carl Jung',
  'Mevlana (Rumi)',
  'Indira Gandhi',
  'Niccol\u00F2 Machiavelli',
  'Marcus Aurelius',
  'Seneca',
  'Lao Tzu',
  'Epictetus',
  'Confucius',
  'Khalil Gibran',
  'Friedrich Nietzsche',
  'Socrates',
  'Maya Angelou',
  'Albert Camus',
  'Simone de Beauvoir',
];

export default function QuotesScreen({ onBack }: Props) {
  const [quoteSet, setQuoteSet] = useState<QuoteSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranslations, setShowTranslations] = useState<Record<number, boolean>>({});
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<'read' | 'game'>('read');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);

  useEffect(() => { loadQuotes(); }, []);

  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  const pickThinkers = () => shuffle(THINKERS).slice(0, 6);

  const buildQuiz = (data: QuoteSet) => {
    const quotes = data.content ?? [];
    if (!quotes.length) return [] as QuizQuestion[];

    const chosen = shuffle(quotes).slice(0, Math.min(4, quotes.length));

    return chosen.map(item => {
      const distractors = shuffle(
        quotes
          .filter(q => q.translation !== item.translation)
          .map(q => q.translation)
      ).slice(0, 3);

      const options = shuffle([item.translation, ...distractors]);

      return {
        sentence: item.original,
        author: item.author,
        options,
        correct: options.findIndex(o => o === item.translation),
      };
    });
  };

  const resetGame = (data?: QuoteSet | null) => {
    const base = data ?? quoteSet;
    if (!base) return;
    setQuestions(buildQuiz(base));
    setQIndex(0);
    setSelected(null);
    setScore(0);
  };

  const loadQuotes = async () => {
    setLoading(true); setError(''); setShowTranslations({});
    try {
      const profileData = await AsyncStorage.getItem('userProfile');
      if (!profileData) { setError('Profil bulunamad\u0131.'); setLoading(false); return; }

      const p = tryParseJson<UserProfile>(profileData);
      if (!p) {
        await AsyncStorage.removeItem('userProfile');
        setError('Profil verisi bozuk. L\u00FCtfen uygulamay\u0131 yeniden ba\u015Flat\u0131p tekrar giri\u015F yap.');
        setLoading(false);
        return;
      }
      setProfile(p);
      const nativeLang = p.nativeLanguage?.name ?? 'English';
      const langName = p.language?.name ?? 'Spanish';

      const cacheKey = `quotes_${p.language?.code}_${new Date().toDateString()}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const cachedSet = tryParseJson<QuoteSet>(cached);
        if (cachedSet?.content?.length) {
          setQuoteSet(cachedSet);
          setQuestions(buildQuiz(cachedSet));
          setQIndex(0); setSelected(null); setScore(0);
          setLoading(false);
          return;
        }
        await AsyncStorage.removeItem(cacheKey);
      }

      const thinkers = pickThinkers();
      const prompt = `Give me 6 famous quotes from these thinkers: ${thinkers.join(', ')}.
Each quote must be translated into ${langName} (the original can stay in its original language or ${langName}).
Return ONLY valid JSON:
{"title":"Quotes of the Day","content":[{"original":"(quote in ${langName})","translation":"(${nativeLang} translation)","author":"(thinker name)"}]}

Rules:
- Each quote max 2 sentences
- Use real, well-known quotes only
- 6 quotes total, one per thinker`;

      const response = await sendMessage(
        [{ id: '1', role: 'user', content: prompt, timestamp: new Date() }],
        '',
        { maxTokens: 1600 },
      );
      const parsed = parseModelJson<QuoteSet>(response, 'object');
      if (parsed?.content?.length) {
        setQuoteSet(parsed);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(parsed));
        setQuestions(buildQuiz(parsed));
        setQIndex(0);
        setSelected(null);
        setScore(0);
      } else {
        setError('S\u00F6zler eksik/bozuk geldi. Tekrar dene.');
      }
    } catch (e: any) {
      setError(`Hata: ${e.message ?? 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuote = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowTranslations(prev => {
      const updated = { ...prev, [index]: !prev[index] };
      const openCount = Object.values(updated).filter(Boolean).length;
      const total = quoteSet?.content?.length ?? 0;
      if (!xpAwarded && total > 0 && openCount / total >= 0.8) {
        setXpAwarded(true);
        awardActivityXP(8);
      }
      return updated;
    });
  };

  const revealRate = quoteSet?.content?.length
    ? Math.round((Object.values(showTranslations).filter(Boolean).length / quoteSet.content.length) * 100)
    : 0;

  const currentQuestion = questions[qIndex];
  const gameDone = questions.length > 0 && qIndex >= questions.length;

  const onAnswer = (idx: number) => {
    if (selected !== null || !currentQuestion) return;
    setSelected(idx);
    if (idx === currentQuestion.correct) setScore(prev => prev + 1);
  };

  const onNextQuestion = () => {
    if (!currentQuestion) return;
    const isLast = qIndex + 1 >= questions.length;
    setQIndex(prev => prev + 1);
    setSelected(null);
    if (isLast && !xpAwarded) {
      setXpAwarded(true);
      awardActivityXP(12);
    }
  };

  if (loading) return (
    <View style={styles.fullCenter}>
      <TouchableOpacity onPress={onBack} style={styles.topBack}>
        <Text style={styles.topBackText}>{'\u2190 Geri'}</Text>
      </TouchableOpacity>
      <ActivityIndicator size="large" color="#C4B5FD" />
      <Text style={styles.loadingText}>{'S\u00F6zler haz\u0131rlan\u0131yor...'}</Text>
    </View>
  );

  if (error) return (
    <View style={styles.fullCenter}>
      <TouchableOpacity onPress={onBack} style={styles.topBack}>
        <Text style={styles.topBackText}>{'\u2190 Geri'}</Text>
      </TouchableOpacity>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={loadQuotes} style={styles.retryBtn}>
        <Text style={styles.retryText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{'\uD83D\uDCAC S\u00F6zler'}</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabBtn, mode === 'read' && styles.tabBtnActive]} onPress={() => setMode('read')}>
          <Text style={[styles.tabText, mode === 'read' && styles.tabTextActive]}>Oku</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, mode === 'game' && styles.tabBtnActive]} onPress={() => setMode('game')}>
          <Text style={[styles.tabText, mode === 'game' && styles.tabTextActive]}>Mini Oyun</Text>
        </TouchableOpacity>
      </View>

      {mode === 'read' && quoteSet && (
        <>
          <Text style={styles.subtitle}>{'S\u00F6ze dokun, \u00E7evirisi a\u00E7\u0131ls\u0131n \u00B7 \u0130lerleme %'}{revealRate}</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${revealRate}%` }]} /></View>

          <View style={styles.storyCard}>
            <Text style={styles.storyTitle}>{quoteSet.title}</Text>
            <View style={styles.divider} />
            {quoteSet.content?.map((item, i) => (
              <AnimatedPressable key={i} style={styles.sentenceRow} onPress={() => toggleQuote(i)} delay={i * 30}>
                <Text style={styles.sentence}>{`\u201C${item.original}\u201D`}</Text>
                <Text style={styles.authorText}>{`\u2014 ${item.author}`}</Text>
                {showTranslations[i] && <Text style={styles.translation}>{item.translation}</Text>}
              </AnimatedPressable>
            ))}
          </View>
        </>
      )}

      {mode === 'game' && (
        <View style={styles.gameCard}>
          <Text style={styles.gameTitle}>{'\uD83C\uDFAE S\u00F6z Challenge'}</Text>
          {!gameDone && currentQuestion && (
            <>
              <Text style={styles.gameProgress}>Soru {qIndex + 1}/{questions.length}</Text>
              <Text style={styles.gamePrompt}>{'Bu s\u00F6z\u00FCn do\u011Fru \u00E7evirisi hangisi?'}</Text>
              <View style={styles.quoteBox}>
                <Text style={styles.quoteText}>{`\u201C${currentQuestion.sentence}\u201D`}</Text>
                <Text style={styles.quoteAuthor}>{`\u2014 ${currentQuestion.author}`}</Text>
              </View>

              {currentQuestion.options.map((option, idx) => {
                const isCorrect = selected !== null && idx === currentQuestion.correct;
                const isWrongPick = selected === idx && idx !== currentQuestion.correct;
                return (
                  <AnimatedPressable
                    key={idx}
                    style={[
                      styles.optionBtn,
                      isCorrect && styles.optionCorrect,
                      isWrongPick && styles.optionWrong,
                      selected !== null && selected !== idx && !isCorrect && styles.optionDim,
                    ]}
                    onPress={() => onAnswer(idx)}
                    disabled={selected !== null}
                    delay={idx * 40}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </AnimatedPressable>
                );
              })}

              {selected !== null && (
                <TouchableOpacity style={styles.nextBtn} onPress={onNextQuestion}>
                  <Text style={styles.nextBtnText}>{'Sonraki \u2192'}</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {gameDone && (
            <>
              <Text style={styles.doneEmoji}>{score >= 3 ? '\uD83C\uDFC6' : '\u2B50'}</Text>
              <Text style={styles.doneText}>Skor: {score}/{questions.length}</Text>
              <Text style={styles.xpEarned}>{'+12 XP kazand\u0131n \uD83C\uDF89'}</Text>
              <TouchableOpacity style={styles.nextBtn} onPress={() => { setXpAwarded(false); resetGame(); }}>
                <Text style={styles.nextBtnText}>Tekrar Oyna</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {quoteSet && (
        <TouchableOpacity style={styles.refreshBtn} onPress={loadQuotes}>
          <Text style={styles.refreshText}>{'\uD83D\uDCAC Yeni S\u00F6zler'}</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A12' },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  fullCenter: { flex: 1, backgroundColor: '#0A0A12', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  topBack: { position: 'absolute', top: 60, left: 24 },
  topBackText: { fontSize: 15, color: '#888', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#16162A', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: '#FFF' },
  title: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabBtn: { backgroundColor: '#16162A', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#252540' },
  tabBtnActive: { borderColor: '#C4B5FD', backgroundColor: '#150F2A' },
  tabText: { color: '#888', fontWeight: '700' },
  tabTextActive: { color: '#C4B5FD' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 10 },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: '#16162A', marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#C4B5FD' },
  storyCard: { backgroundColor: '#16162A', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#252540' },
  storyTitle: { fontSize: 20, fontWeight: '800', color: '#C4B5FD', marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#252540', marginBottom: 12 },
  sentenceRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1C2035', gap: 4 },
  sentence: { fontSize: 16, color: '#FFF', lineHeight: 24, fontStyle: 'italic' },
  authorText: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  translation: { fontSize: 14, color: '#C4B5FD', lineHeight: 20, marginTop: 4 },
  gameCard: { backgroundColor: '#16162A', borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: '#252540' },
  gameTitle: { fontSize: 18, color: '#C4B5FD', fontWeight: '800', marginBottom: 10 },
  gameProgress: { color: '#888', marginBottom: 8, fontSize: 13 },
  gamePrompt: { color: '#DDD', marginBottom: 10, fontSize: 14 },
  quoteBox: { backgroundColor: '#0A0A12', borderRadius: 12, padding: 12, marginBottom: 12 },
  quoteText: { color: '#FFF', fontSize: 16, lineHeight: 22, fontStyle: 'italic' },
  quoteAuthor: { color: '#94A3B8', fontSize: 13, marginTop: 6 },
  optionBtn: { backgroundColor: '#0A0A12', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#252540' },
  optionCorrect: { borderColor: '#C4B5FD', backgroundColor: '#150F2A' },
  optionWrong: { borderColor: '#E8324A', backgroundColor: '#2A1016' },
  optionDim: { opacity: 0.45 },
  optionText: { color: '#FFF', fontSize: 14 },
  nextBtn: { marginTop: 10, backgroundColor: '#C4B5FD', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  nextBtnText: { color: '#0B1020', fontWeight: '800' },
  xpEarned: { color: '#C4B5FD', fontWeight: '800', textAlign: 'center', marginBottom: 8, fontSize: 14 },
  doneEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 6 },
  doneText: { color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  loadingText: { color: '#888', fontSize: 14 },
  errorText: { color: '#E8324A', fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#E8324A', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#FFF', fontWeight: '700' },
  refreshBtn: { backgroundColor: '#16162A', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#252540', marginTop: 14 },
  refreshText: { color: '#C4B5FD', fontWeight: '700', fontSize: 15 },
});
