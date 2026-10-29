import { supabase } from './supabase.ts';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiAnswer {
  intent: 'answer' | 'smalltalk' | 'out_of_scope';
  answer: string;
  sourceIds: string[];
}

interface SendOptions {
  signal?: AbortSignal;
}

export async function sendAiChat(messages: ChatMessage[], options: SendOptions = {}): Promise<AiAnswer> {
  if (!supabase) throw new Error('The assistant is unavailable because the portal is not configured.');
  const sessionKey = sessionStorage.getItem('kabataan-assistant-session') ?? crypto.randomUUID();
  sessionStorage.setItem('kabataan-assistant-session', sessionKey);
  let response: Response;
  try {
    response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
      method: 'POST',
      signal: options.signal,
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'x-session-id': sessionKey,
      },
      body: JSON.stringify({ messages }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('The assistant cannot connect right now. Please check the deployed Edge Function and ALLOWED_ORIGINS setting.');
  }
  if (!response.ok) {
    if (response.status === 429) throw new Error('Please wait a moment before trying again.');
    if (response.status === 503) throw new Error('The assistant is resting right now. Please use the Contact page.');
    throw new Error('The assistant is temporarily unavailable.');
  }
  const result = await response.json() as Partial<AiAnswer>;
  if (!['answer', 'smalltalk', 'out_of_scope'].includes(result.intent ?? '') || typeof result.answer !== 'string' || !Array.isArray(result.sourceIds)) {
    throw new Error('The assistant returned an invalid response.');
  }
  return result as AiAnswer;
}
