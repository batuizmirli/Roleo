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
import { colors } from '../theme/colors';

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

const buildOfflineQuoteSet = (targetLangName: string): QuoteSet => {
  const l = targetLangName.toLowerCase();
  const contentByLang: Record<string, Quote[]> = {
    es: [
      { original: 'Perdón, ¿me puede ayudar?', translation: 'Affedersiniz, bana yardım edebilir misiniz?', author: 'Kafe sahnesi' },
      { original: 'Estoy aprendiendo, ¿puede repetir?', translation: 'Öğreniyorum, tekrar edebilir misiniz?', author: 'Sokak sahnesi' },
      { original: 'Quisiera pedir algo sencillo.', translation: 'Basit bir şey sipariş etmek istiyorum.', author: 'Restoran sahnesi' },
      { original: 'No estoy seguro, pero puedo intentarlo.', translation: 'Emin değilim ama deneyebilirim.', author: 'Günlük konuşma' },
    ],
    fr: [
      { original: 'Excusez-moi, vous pouvez m’aider ?', translation: 'Affedersiniz, bana yardım edebilir misiniz?', author: 'Sokak sahnesi' },
      { original: 'J’apprends encore, vous pouvez répéter ?', translation: 'Hâlâ öğreniyorum, tekrar edebilir misiniz?', author: 'Servis sahnesi' },
      { original: 'Je voudrais quelque chose de simple.', translation: 'Basit bir şey rica ederim.', author: 'Kafe sahnesi' },
      { original: 'Je ne suis pas sûr, mais je peux essayer.', translation: 'Emin değilim ama deneyebilirim.', author: 'Günlük konuşma' },
    ],
    de: [
      { original: 'Entschuldigung, können Sie mir helfen?', translation: 'Affedersiniz, bana yardım edebilir misiniz?', author: 'Sokak sahnesi' },
      { original: 'Ich lerne noch, können Sie das wiederholen?', translation: 'Hâlâ öğreniyorum, tekrar edebilir misiniz?', author: 'Servis sahnesi' },
      { original: 'Ich möchte etwas Einfaches bestellen.', translation: 'Basit bir şey sipariş etmek istiyorum.', author: 'Kafe sahnesi' },
      { original: 'Ich bin nicht sicher, aber ich kann es versuchen.', translation: 'Emin değilim ama deneyebilirim.', author: 'Günlük konuşma' },
    ],
    it: [
      { original: 'Mi scusi, può aiutarmi?', translation: 'Affedersiniz, bana yardım edebilir misiniz?', author: 'Sokak sahnesi' },
      { original: 'Sto ancora imparando, può ripetere?', translation: 'Hâlâ öğreniyorum, tekrar edebilir misiniz?', author: 'Servis sahnesi' },
      { original: 'Vorrei ordinare qualcosa di semplice.', translation: 'Basit bir şey sipariş etmek istiyorum.', author: 'Kafe sahnesi' },
      { original: 'Non sono sicuro, ma posso provare.', translation: 'Emin değilim ama deneyebilirim.', author: 'Günlük konuşma' },
    ],
    pt: [
      { original: 'Com licença, você pode me ajudar?', translation: 'Affedersiniz, bana yardım edebilir misiniz?', author: 'Sokak sahnesi' },
      { original: 'Ainda estou aprendendo, pode repetir?', translation: 'Hâlâ öğreniyorum, tekrar edebilir misiniz?', author: 'Servis sahnesi' },
      { original: 'Eu gostaria de pedir algo simples.', translation: 'Basit bir şey sipariş etmek istiyorum.', author: 'Kafe sahnesi' },
      { original: 'Não tenho certeza, mas posso tentar.', translation: 'Emin değilim ama deneyebilirim.', author: 'Günlük konuşma' },
    ],
    en: [
      { original: 'Sorry, could you help me for a second?', translation: 'Affedersiniz, bana bir saniye yardım edebilir misiniz?', author: 'Street scene' },
      { original: 'I am still learning. Could you repeat that?', translation: 'Hâlâ öğreniyorum. Tekrar edebilir misiniz?', author: 'Service scene' },
      { original: 'Could I get something simple to start?', translation: 'Başlamak için basit bir şey alabilir miyim?', author: 'Cafe scene' },
      { original: 'I am not sure, but I can try.', translation: 'Emin değilim ama deneyebilirim.', author: 'Everyday scene' },
    ],
  };
  const langKey = /spanish|ispanyol|español/.test(l)
    ? 'es'
    : /french|fransız|français/.test(l)
    ? 'fr'
    : /german|alman|deutsch/.test(l)
    ? 'de'
    : /italian|italyan|italiano/.test(l)
    ? 'it'
    : /portuguese|portekiz|português|portugues/.test(l)
    ? 'pt'
    : 'en';
  return {
    title: 'Çevrimdışı kısa bağlamlar',
    content: contentByLang[langKey],
  };
};

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
  const [offlineNotice, setOfflineNotice] = useState('');

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
    setLoading(true); setError(''); setShowTranslations({}); setOfflineNotice('');
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
      const langName = p.language?.name ?? 'English';

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
      const profileData = await AsyncStorage.getItem('userProfile');
      const p = profileData ? tryParseJson<UserProfile>(profileData) : null;
      const fallback = buildOfflineQuoteSet(p?.language?.name ?? 'English');
      setProfile(p ?? null);
      setQuoteSet(fallback);
      setQuestions(buildQuiz(fallback));
      setQIndex(0);
      setSelected(null);
      setScore(0);
      setOfflineNotice('API hazır değil; kısa bağlamlar çevrimdışı örneklerle açıldı.');
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
      <ActivityIndicator size="large" color={colors.accentWarm} />
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
        <Text style={styles.title}>{'\uD83D\uDCAC Kısa Bağlamlar'}</Text>
      </View>

      {!!offlineNotice && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>{offlineNotice}</Text>
        </View>
      )}

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
          <Text style={styles.subtitle}>{'Bağlama dokun, anlamı açılsın · İlerleme %'}{revealRate}</Text>
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
              <Text style={styles.gamePrompt}>Bu bağlamın doğru anlamı hangisi?</Text>
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
          <Text style={styles.refreshText}>{'\uD83D\uDCAC Yeni Bağlamlar'}</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  fullCenter: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  topBack: { position: 'absolute', top: 60, left: 24 },
  topBackText: { fontSize: 15, color: colors.inkSecondary, fontFamily: 'InterTight_600SemiBold' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgMid, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.hairlineStrong },
  backText: { fontSize: 20, color: colors.inkPrimary },
  title: { fontSize: 22, fontFamily: 'InterTight_600SemiBold', color: colors.inkPrimary },
  noticeBox: { backgroundColor: colors.bgSoft, borderRadius: 14, borderWidth: 1, borderColor: colors.hairlineStrong, padding: 12, marginBottom: 12 },
  noticeText: { color: colors.inkSecondary, fontSize: 13, lineHeight: 18 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabBtn: { backgroundColor: colors.bgMid, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.hairlineStrong },
  tabBtnActive: { borderColor: colors.accentWarm, backgroundColor: colors.bgSoft },
  tabText: { color: colors.inkSecondary, fontFamily: 'InterTight_600SemiBold' },
  tabTextActive: { color: colors.accentWarm },
  subtitle: { fontSize: 14, color: colors.inkSecondary, marginBottom: 10 },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: colors.bgMid, marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.accentWarm },
  storyCard: { backgroundColor: colors.bgMid, borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: colors.hairlineStrong },
  storyTitle: { fontSize: 20, fontFamily: 'InterTight_600SemiBold', color: colors.accentWarm, marginBottom: 8 },
  divider: { height: 1, backgroundColor: colors.hairline, marginBottom: 12 },
  sentenceRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline, gap: 4 },
  sentence: { fontSize: 16, color: colors.inkPrimary, lineHeight: 24, fontStyle: 'italic' },
  authorText: { fontSize: 13, color: colors.inkTertiary, marginTop: 2 },
  translation: { fontSize: 14, color: colors.accentWarm, lineHeight: 20, marginTop: 4 },
  gameCard: { backgroundColor: colors.bgMid, borderRadius: 20, padding: 18, borderWidth: 1.5, borderColor: colors.hairlineStrong },
  gameTitle: { fontSize: 18, color: colors.accentWarm, fontFamily: 'InterTight_600SemiBold', marginBottom: 10 },
  gameProgress: { color: colors.inkSecondary, marginBottom: 8, fontSize: 13 },
  gamePrompt: { color: colors.inkSecondary, marginBottom: 10, fontSize: 14 },
  quoteBox: { backgroundColor: colors.bgMid, borderRadius: 12, padding: 12, marginBottom: 12 },
  quoteText: { color: colors.inkPrimary, fontSize: 16, lineHeight: 22, fontStyle: 'italic' },
  quoteAuthor: { color: colors.inkTertiary, fontSize: 13, marginTop: 6 },
  optionBtn: { backgroundColor: colors.bgMid, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.hairlineStrong },
  optionCorrect: { borderColor: colors.success, backgroundColor: colors.successSoft },
  optionWrong: { borderColor: colors.errorDs, backgroundColor: 'rgba(201,122,106,0.15)' },
  optionDim: { opacity: 0.45 },
  optionText: { color: colors.inkPrimary, fontSize: 14 },
  nextBtn: { marginTop: 10, backgroundColor: colors.accentWarm, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  nextBtnText: { color: colors.bgDeep, fontFamily: 'InterTight_600SemiBold' },
  xpEarned: { color: colors.accentWarm, fontFamily: 'InterTight_600SemiBold', textAlign: 'center', marginBottom: 8, fontSize: 14 },
  doneEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 6 },
  doneText: { color: colors.inkPrimary, fontSize: 24, fontFamily: 'InterTight_600SemiBold', textAlign: 'center', marginBottom: 8 },
  loadingText: { color: colors.inkSecondary, fontSize: 14 },
  errorText: { color: colors.errorDs, fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.accentWarm, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: colors.bgDeep, fontFamily: 'InterTight_600SemiBold' },
  refreshBtn: { backgroundColor: colors.bgMid, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.hairlineStrong, marginTop: 14 },
  refreshText: { color: colors.accentWarm, fontFamily: 'InterTight_600SemiBold', fontSize: 15 },
});
