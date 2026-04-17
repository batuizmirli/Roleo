import { Message } from '../types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

type SendMessageOptions = {
  maxTokens?: number;
  model?: string;
};

export const sendMessage = async (
  messages: Message[],
  systemPrompt: string,
  options?: SendMessageOptions
): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
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
