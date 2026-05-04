import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { ExpoSpeechRecognitionNativeEventMap } from 'expo-speech-recognition';

type SpeechMod = {
  start: (options: import('expo-speech-recognition').ExpoSpeechRecognitionOptions) => void;
  stop: () => void;
  abort: () => void;
  isRecognitionAvailable: () => boolean;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  addListener: <K extends keyof ExpoSpeechRecognitionNativeEventMap>(
    event: K,
    listener: (payload: ExpoSpeechRecognitionNativeEventMap[K]) => void,
  ) => { remove: () => void };
};

let cachedModule: SpeechMod | null | undefined;

const cannotLoadCustomNativeSpeech = () =>
  Platform.OS === 'web' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Lazy-load native speech. Never call `require('expo-speech-recognition')` in Expo Go —
 * Hermes throws "Cannot find native module" outside try/catch when resolving the bridge.
 */
export const getSpeechRecognitionModule = (): SpeechMod | null => {
  if (cachedModule !== undefined) return cachedModule;
  if (cannotLoadCustomNativeSpeech()) {
    cachedModule = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ExpoSpeechRecognitionModule } = require('expo-speech-recognition') as {
      ExpoSpeechRecognitionModule: SpeechMod;
    };
    cachedModule = ExpoSpeechRecognitionModule;
    return cachedModule;
  } catch {
    cachedModule = null;
    return null;
  }
};

export const isLiveSpeechRecognitionUsable = (): boolean => {
  const m = getSpeechRecognitionModule();
  if (!m) return false;
  try {
    return typeof m.isRecognitionAvailable === 'function' && m.isRecognitionAvailable();
  } catch {
    return false;
  }
};
