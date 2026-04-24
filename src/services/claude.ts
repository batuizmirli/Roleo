import { Message } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_KEY_STORAGE = 'roleoAnthropicApiKey';
let runtimeApiKey: string | null = null;

type SendMessageOptions = {
  maxTokens?: number;
  model?: string;
};

export const sendMessage = async (
  messages: Message[],
  systemPrompt: string,
  options?: SendMessageOptions
): Promise<string> => {
  const envKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  const storedKey = runtimeApiKey ?? await AsyncStorage.getItem(ANTHROPIC_KEY_STORAGE);
  const apiKey = envKey || storedKey;
  if (storedKey && !runtimeApiKey) runtimeApiKey = storedKey;
  if (!apiKey) {
    throw new Error('API yapılandırması eksik. EXPO_PUBLIC_ANTHROPIC_API_KEY tanımlanmalı.');
  }

  const formattedMessages = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: options?.model ?? 'claude-haiku-4-5-20251001',
      max_tokens: options?.maxTokens ?? 900,
      system: systemPrompt,
      messages: formattedMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API error');
  }

  const data = await response.json();
  return data.content[0].text;
};

export const saveAnthropicApiKey = async (key: string): Promise<void> => {
  const cleaned = key.trim();
  runtimeApiKey = cleaned;
  await AsyncStorage.setItem(ANTHROPIC_KEY_STORAGE, cleaned);
};
