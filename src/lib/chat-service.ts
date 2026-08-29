import { supabase } from './supabase';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function processMessage(
  message: string,
  history: ChatMessage[],
  userToken: string | null,
): Promise<string> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ message, history, userToken }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed (${response.status})`);
  }

  const data = await response.json();

  if (!data || typeof data.reply !== 'string') {
    throw new Error('Invalid response from server');
  }

  return data.reply;
}
