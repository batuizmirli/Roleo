import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, UserGoal, UserProfile } from '../types';

const crowdConversationImage = require('../../assets/onboarding/crowd-conversation.jpg');
const cafeOrderImage = require('../../assets/onboarding/cafe-order.jpg');
const meetingConfidenceImage = require('../../assets/onboarding/meeting-confidence.jpg');

const LEARNING_LANGUAGES: Language[] = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

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

const GOALS: UserGoal[] = [
  { id: 'travel', label: 'Travel', emoji: '✈️', description: 'Get lost in a new city' },
  { id: 'work', label: 'Work', emoji: '💼', description: 'Speak in meetings' },
  { id: 'culture', label: 'Culture', emoji: '🎭', description: 'Music, film, art' },
  { id: 'love', label: 'Social', emoji: '❤️', description: 'Connect with people' },
  { id: 'exam', label: 'Exam', emoji: '📚', description: 'Get a language certificate' },
];

type Step = 'native' | 'language' | 'goal' | 'dream' | 'context' | 'emotion';

type Props = {
  onComplete: () => void;
};

const STEP_BACKGROUNDS: Record<Step, any> = {
  native: crowdConversationImage,
  language: crowdConversationImage,
  goal: crowdConversationImage,
  dream: cafeOrderImage,
  context: cafeOrderImage,
  emotion: meetingConfidenceImage,
};

const STEP_VISUALS: Record<Step, { eyebrow: string; caption: string }> = {
  native: {
    eyebrow: 'Real-life scene',
    caption: 'Kalabalık bir ortamda konuşan insanlar gibi gerçek anlara hazırlan.',
  },
  language: {
    eyebrow: 'Conversation flow',
    caption: 'Yeni dilini sosyal bir ortamda, gerçek kişilerle kullanma hissi.',
  },
  goal: {
    eyebrow: 'Your reason',
    caption: 'Hedefin, hangi sahnelerde rahat konuşmak istediğini belirler.',
  },
  dream: {
    eyebrow: 'Cafe scene',
    caption: 'Bir kafede sipariş verirken doğal ve rahat hissettiğin anı kur.',
  },
  context: {
    eyebrow: 'Exact setup',
    caption: 'Garson, masa, kalabalık ve anın detayları öğrenmeni güçlendirir.',
  },
  emotion: {
    eyebrow: 'Confidence moment',
    caption: 'Toplantıda ya da sosyal ortamda daha akıcı ve özgüvenli hisset.',
  },
};

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('native');
  const [selectedNative, setSelectedNative] = useState<Language | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null);
  const [dreamText, setDreamText] = useState('');
  const [contextText, setContextText] = useState('');
  const [emotionText, setEmotionText] = useState('');

  const handleNativeSelect = (lang: Language) => {
    setSelectedNative(lang);
    setTimeout(() => setStep('language'), 300);
  };

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
    setTimeout(() => setStep('goal'), 300);
  };

  const handleGoalSelect = (goal: UserGoal) => {
    setSelectedGoal(goal);
    setTimeout(() => setStep('dream'), 300);
  };

  const handleBack = () => {
    if (step === 'language') setStep('native');
    else if (step === 'goal') setStep('language');
    else if (step === 'dream') setStep('goal');
    else if (step === 'context') setStep('dream');
    else if (step === 'emotion') setStep('context');
  };

  const handleDreamContinue = () => {
    if (!dreamText.trim()) {
      Alert.alert('Write your dream', 'Write something that motivates you.');
      return;
    }
    setStep('context');
  };

  const handleContextContinue = () => {
    if (!contextText.trim()) {
      Alert.alert('Add the scene', 'Where are you and who are you talking to?');
      return;
    }
    setStep('emotion');
  };

  const handleEmotionContinue = () => {
    if (!emotionText.trim()) {
      Alert.alert('Add the feeling', 'How do you want to feel in that moment?');
      return;
    }
    handleComplete();
  };

  const handleComplete = async () => {
    const profile: UserProfile = {
      language: selectedLanguage!,
      nativeLanguage: selectedNative!,
      goal: selectedGoal!,
      goalDescription: dreamText,
      identity: {
        goal: dreamText.trim(),
        context: contextText.trim(),
        emotion: emotionText.trim(),
      },
      streak: 0,
      completedScenarios: [],
      xp: 0,
      level: 'beginner',
    };

    await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
    onComplete();
  };

  const stepIndicator = ['native', 'language', 'goal', 'dream', 'context', 'emotion'];
  const currentStepIndex = stepIndicator.indexOf(step);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ImageBackground source={STEP_BACKGROUNDS[step]} style={styles.backgroundImage}>
        <View style={styles.backgroundOverlay} />
      </ImageBackground>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.contentPanel}>

          {/* Step indicator */}
          <View style={styles.stepDots}>
            {stepIndicator.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentStepIndex && styles.dotActive, i < currentStepIndex && styles.dotDone]} />
            ))}
          </View>

          <ImageBackground source={STEP_BACKGROUNDS[step]} imageStyle={styles.heroImageStyle} style={styles.heroImageCard}>
            <View style={styles.heroOverlay}>
              <Text style={styles.heroEyebrow}>{STEP_VISUALS[step].eyebrow}</Text>
              <Text style={styles.heroCaption}>{STEP_VISUALS[step].caption}</Text>
            </View>
          </ImageBackground>

        {/* NATIVE LANGUAGE */}
        {step === 'native' && (
          <View style={styles.stepContainer}>
            <Text style={styles.logo}>roleo</Text>
            <Text style={styles.title}>What's your native language?</Text>
            <Text style={styles.subtitle}>We'll explain things in your language.</Text>
            <View style={styles.nativeGrid}>
              {NATIVE_LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.nativeCard, selectedNative?.code === lang.code && styles.cardActive]}
                  onPress={() => handleNativeSelect(lang)}
                >
                  <Text style={styles.nativeFlag}>{lang.flag}</Text>
                  <Text style={styles.nativeName}>{lang.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* LEARNING LANGUAGE */}
        {step === 'language' && (
          <View style={styles.stepContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.logo}>roleo</Text>
            <Text style={styles.title}>Which language do you want to learn?</Text>
            <Text style={styles.subtitle}>You'll practice every day with real-life scenes.</Text>
            <View style={styles.langGrid}>
              {LEARNING_LANGUAGES.filter(l => l.code !== selectedNative?.code).map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langCard, selectedLanguage?.code === lang.code && styles.cardActive]}
                  onPress={() => handleLanguageSelect(lang)}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={styles.langName}>{lang.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* GOAL */}
        {step === 'goal' && (
          <View style={styles.stepContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.logo}>roleo</Text>
            <Text style={styles.title}>Why do you want to learn?</Text>
            <Text style={styles.subtitle}>
              {selectedLanguage?.flag} {selectedLanguage?.name} — we'll build your personal curriculum.
            </Text>
            <View style={styles.goalsList}>
              {GOALS.map(goal => (
                <TouchableOpacity
                  key={goal.id}
                  style={[styles.goalCard, selectedGoal?.id === goal.id && styles.cardActive]}
                  onPress={() => handleGoalSelect(goal)}
                >
                  <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                  <View style={styles.goalText}>
                    <Text style={styles.goalLabel}>{goal.label}</Text>
                    <Text style={styles.goalDesc}>{goal.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* DREAM */}
        {step === 'dream' && (
          <View style={styles.stepContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.logo}>roleo</Text>
            <Text style={styles.title}>Imagine the moment.</Text>
            <Text style={styles.subtitle}>
              {selectedGoal?.emoji} {selectedGoal?.label} — describe the exact scene you're dreaming of.
            </Text>
            <View style={styles.dreamBox}>
              <Text style={styles.dreamHint}>e.g. "I'm ordering coffee in Barcelona and the waiter smiles back at me."</Text>
              <TextInput
                style={styles.dreamInput}
                placeholder="Describe your dream moment..."
                placeholderTextColor="#9AABB8"
                multiline
                numberOfLines={5}
                value={dreamText}
                onChangeText={setDreamText}
              />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleDreamContinue}>
              <Text style={styles.buttonText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'context' && (
          <View style={styles.stepContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.logo}>roleo</Text>
            <Text style={styles.title}>Set the exact scene.</Text>
            <Text style={styles.subtitle}>Where are you, and who are you speaking with?</Text>
            <View style={styles.dreamBox}>
              <Text style={styles.dreamHint}>e.g. “La Rambla'da bir kafedeyim ve garson siparişimi bekliyor.”</Text>
              <TextInput
                style={styles.dreamInput}
                placeholder="Describe the setting and person..."
                placeholderTextColor="#9AABB8"
                multiline
                numberOfLines={4}
                value={contextText}
                onChangeText={setContextText}
              />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleContextContinue}>
              <Text style={styles.buttonText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'emotion' && (
          <View style={styles.stepContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.logo}>roleo</Text>
            <Text style={styles.title}>How do you want to feel?</Text>
            <Text style={styles.subtitle}>This becomes the emotional goal behind your practice.</Text>
            <View style={styles.dreamBox}>
              <Text style={styles.dreamHint}>e.g. “cool, relaxed and natural” / “confident in the meeting”</Text>
              <TextInput
                style={styles.dreamInput}
                placeholder="Describe the feeling you want..."
                placeholderTextColor="#9AABB8"
                multiline
                numberOfLines={4}
                value={emotionText}
                onChangeText={setEmotionText}
              />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleEmotionContinue}>
              <Text style={styles.buttonText}>Start My Journey →</Text>
            </TouchableOpacity>
          </View>
        )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10211A',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 22, 16, 0.48)',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  contentPanel: {
    backgroundColor: 'rgba(247, 250, 246, 0.94)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  heroImageCard: {
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    justifyContent: 'flex-end',
  },
  heroImageStyle: {
    borderRadius: 20,
  },
  heroOverlay: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(7, 20, 15, 0.35)',
  },
  heroEyebrow: {
    color: '#E8F8EE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroCaption: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4E8DC',
  },
  dotActive: {
    backgroundColor: '#1B9C5A',
    width: 20,
  },
  dotDone: {
    backgroundColor: '#1B9C5A66',
  },
  stepContainer: {
    flex: 1,
  },
  logo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1B9C5A',
    letterSpacing: -0.3,
    marginBottom: 32,
    fontFamily: 'PlayfairDisplay_900Black',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A2B3C',
    marginBottom: 10,
    lineHeight: 34,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7B8D',
    marginBottom: 32,
    lineHeight: 22,
    fontWeight: '500',
  },
  backBtn: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#6B7B8D',
    fontSize: 15,
    fontWeight: '600',
  },
  nativeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  nativeCard: {
    width: '47%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E8EDF2',
  },
  nativeFlag: {
    fontSize: 22,
  },
  nativeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2B3C',
    flex: 1,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  langCard: {
    width: '46%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8EDF2',
  },
  langFlag: {
    fontSize: 36,
    marginBottom: 8,
  },
  langName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2B3C',
  },
  cardActive: {
    borderColor: '#1B9C5A',
    backgroundColor: '#F0FAF4',
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8EDF2',
    gap: 16,
  },
  goalEmoji: {
    fontSize: 28,
  },
  goalText: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2B3C',
    marginBottom: 2,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  goalDesc: {
    fontSize: 13,
    color: '#9AABB8',
  },
  dreamBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#E8EDF2',
  },
  dreamHint: {
    fontSize: 13,
    color: '#9AABB8',
    marginBottom: 12,
    fontStyle: 'italic',
    lineHeight: 20,
    fontWeight: '500',
  },
  dreamInput: {
    color: '#1A2B3C',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  apiInput: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    color: '#1A2B3C',
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: '#E8EDF2',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#1B9C5A',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'PlayfairDisplay_700Bold',
  },
});
