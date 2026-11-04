export interface ChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotRequest {
  message: string;
  context: ChatbotContext;
  recentMessages: ChatbotMessage[];
}

export interface ChatbotContext {
  userRole: 'resident' | 'guest';
  currentPage: string;
}

export interface ChatbotResponse {
  success: true;
  source: 'faq' | 'ai' | 'retrieval' | 'fallback';
  reply: string;
  category: string;
  knowledge: string[];
}

const MAX_MESSAGE_LENGTH = 500;
const MAX_RECENT_MESSAGES = 10;

export const FALLBACK_REPLY = 'I do not have verified information for that yet. Please use the official Contact page or contact the Barangay Bagbaguin office for assistance.';

export function normalizeChatbotText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

export function validateChatbotRequest(value: unknown): { request: ChatbotRequest } | { error: string } {
  if (!value || typeof value !== 'object') return { error: 'Invalid request.' };
  const body = value as Partial<ChatbotRequest>;
  const context = body.context;
  if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > MAX_MESSAGE_LENGTH) {
    return { error: 'Message must be between 1 and 500 characters.' };
  }
  if (
    !context ||
    (context.userRole !== 'resident' && context.userRole !== 'guest') ||
    typeof context.currentPage !== 'string' ||
    context.currentPage.length > 100
  ) {
    return { error: 'Invalid chatbot context.' };
  }
  if (!Array.isArray(body.recentMessages) || body.recentMessages.length > MAX_RECENT_MESSAGES) {
    return { error: 'Invalid recent messages.' };
  }
  if (!body.recentMessages.every((message) => (
    message &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.length <= MAX_MESSAGE_LENGTH
  ))) {
    return { error: 'Invalid recent messages.' };
  }
  return {
    request: {
      message: body.message.trim(),
      context: { userRole: context.userRole, currentPage: context.currentPage },
      recentMessages: body.recentMessages,
    },
  };
}

export function matchVerifiedFaq(message: string): ChatbotResponse | null {
  const normalized = normalizeChatbotText(message);
  if (/\b(hi|hello|hey|kumusta|good morning|good afternoon)\b/.test(normalized)) {
    return { success: true, source: 'faq', reply: 'Hello po! I can help you find verified SK Bagbaguin programs, services, announcements, requirements, and official contact channels.', category: 'assistant', knowledge: [] };
  }
  if (/\b(service|services|program|programs|project|projects)\b/.test(normalized)) {
    return { success: true, source: 'faq', reply: 'You can view current SK programs and projects on the Programs page, and available youth services on the Youth Services page. Availability and requirements depend on the published portal records.', category: 'barangay-services', knowledge: ['page:programs', 'page:services'] };
  }
  if (/\b(announcement|announcements|notice|notices|latest update|updates)\b/.test(normalized)) {
    return { success: true, source: 'faq', reply: 'Published announcements and public notices are available on the Announcements page. Please check that page for the latest verified updates.', category: 'announcements', knowledge: ['page:announcements'] };
  }
  if (/\b(event|events|activity|activities)\b/.test(normalized)) {
    return { success: true, source: 'faq', reply: 'Community events and event registration information are available on the Events page.', category: 'events', knowledge: ['page:events'] };
  }
  if (/\b(contact|official|officials|council|facebook|office|location|address|hours)\b/.test(normalized)) {
    return { success: true, source: 'faq', reply: 'Please use the official Contact page for verified SK Bagbaguin contact channels and council inquiries. I do not have additional verified office details to provide here.', category: 'contact', knowledge: ['page:contact'] };
  }
  if (/\b(certificate|certificates|requirements|document|documents|appointment|consultation)\b/.test(normalized)) {
    return { success: true, source: 'fallback', reply: 'Verified certificate requirements and appointment details are not currently available in my knowledge base. Please use the official Contact page or contact the Barangay Bagbaguin office.', category: 'requirements', knowledge: ['page:contact'] };
  }
  if (/\b(emergency|danger|abuse|threat|urgent)\b/.test(normalized)) {
    return { success: true, source: 'fallback', reply: 'If there is immediate danger, contact local emergency services or the Barangay Bagbaguin office immediately. I cannot make emergency decisions or provide unverified numbers.', category: 'emergency', knowledge: [] };
  }
  return null;
}

export function fallbackResponse(): ChatbotResponse {
  return { success: true, source: 'fallback', reply: FALLBACK_REPLY, category: 'unavailable', knowledge: ['page:contact'] };
}
