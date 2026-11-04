import { supabase } from './supabase.ts';
import {
  fallbackResponse,
  matchVerifiedFaq,
  validateChatbotRequest,
  type ChatbotContext,
  type ChatbotResponse,
} from './chatbotGuardrails.ts';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type { ChatbotResponse };

interface SendOptions {
  signal?: AbortSignal;
}

const MAX_RECENT_MESSAGES = 10;
const MAX_RECENT_MESSAGE_LENGTH = 500;

function recentMessagesForApi(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(-MAX_RECENT_MESSAGES).map((message) => ({
    role: message.role,
    content: message.content.slice(0, MAX_RECENT_MESSAGE_LENGTH),
  }));
}

function sessionId(): string {
  const key = 'sk-bagbaguin-chat-session';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const generated = crypto.randomUUID();
  sessionStorage.setItem(key, generated);
  return generated;
}

function validateResponse(value: unknown): ChatbotResponse {
  if (!value || typeof value !== 'object') throw new Error('The assistant returned an invalid response.');
  const response = value as Partial<ChatbotResponse>;
  if (
    response.success !== true ||
    !['faq', 'ai', 'retrieval', 'fallback'].includes(response.source ?? '') ||
    typeof response.reply !== 'string' ||
    !response.reply.trim() ||
    typeof response.category !== 'string' ||
    !Array.isArray(response.knowledge) ||
    !response.knowledge.every((item) => typeof item === 'string')
  ) {
    throw new Error('The assistant returned an invalid response.');
  }
  return {
    success: true,
    source: response.source as ChatbotResponse['source'],
    reply: response.reply.trim(),
    category: response.category,
    knowledge: response.knowledge,
  };
}

export async function sendAiChat(
  message: string,
  context: ChatbotContext,
  recentMessages: ChatMessage[],
  options: SendOptions = {},
): Promise<ChatbotResponse> {
  const validRequest = validateChatbotRequest({ message, context, recentMessages });
  if ('error' in validRequest) throw new Error(validRequest.error);

  const faq = matchVerifiedFaq(message);
  // Current announcements must reach the server so it can retrieve the
  // latest published records from Supabase instead of returning a static FAQ.
  if (faq && faq.category !== 'announcements') return faq;

  // The FAQ/retrieval assistant is intentionally usable without an AI provider.
  // A configured server endpoint may add retrieval later, but it is never required.
  if (!supabase) return fallbackResponse(message);

  let response: Response;
  try {
    response = await fetch('/api/chatbot', {
      method: 'POST',
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId(),
      },
      body: JSON.stringify({
        message: message.trim(),
        context,
        recentMessages: recentMessagesForApi(recentMessages),
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return fallbackResponse(message);
  }
  if (response.status === 404 && import.meta.env.DEV) {
    return fallbackResponse(message);
  }
  if (!response.ok) {
    if (response.status === 429) throw new Error('Please wait a moment before trying again.');
    return fallbackResponse(message);
  }
  try {
    return validateResponse(await response.json());
  } catch {
    return fallbackResponse(message);
  }
}
