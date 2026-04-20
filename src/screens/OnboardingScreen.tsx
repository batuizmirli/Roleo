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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, UserGoal, UserProfile } from '../types';

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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Step indicator */}
        <View style={styles.stepDots}>
          {stepIndicator.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentStepIndex && styles.dotActive, i < currentStepIndex && styles.dotDone]} />
          ))}
        </View>

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
                placeholderTextColor="#555"
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
                placeholderTextColor="#555"
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
                placeholderTextColor="#555"
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

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 32,
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
    letterSpacing: 2,
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A2B3C',
    marginBottom: 10,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7B8D',
    marginBottom: 32,
    lineHeight: 22,
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
  },
  dreamInput: {
    color: '#1A2B3C',
    fontSize: 15,
    lineHeight: 24,
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
    color: '#1A2B3C',
    fontSize: 16,
    fontWeight: '800',
  },
});
