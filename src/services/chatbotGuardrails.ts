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
const TAGALOG_FALLBACK_REPLY = 'Wala pa akong beripikadong impormasyon tungkol diyan. Pakitingnan ang opisyal na Contact page o makipag-ugnayan sa tanggapan ng Barangay Bagbaguin.';

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
  if (/\b(hi|hello|hey|kumusta|kamusta|magandang umaga|magandang hapon)\b/.test(normalized)) {
    const reply = /\b(kumusta|kamusta|magandang umaga|magandang hapon)\b/.test(normalized)
      ? 'Kumusta po! Matutulungan ko kayong maghanap ng beripikadong impormasyon tungkol sa mga programa, serbisyo, anunsyo, requirements, at opisyal na contact channels ng SK Bagbaguin.'
      : 'Hello po! I can help you find verified SK Bagbaguin programs, services, announcements, requirements, and official contact channels.';
    return { success: true, source: 'faq', reply, category: 'assistant', knowledge: [] };
  }
  if (/\b(what|which|list|available|offer|show)\b.*\b(service|services)\b/.test(normalized) || /\b(anong|ano ang|ano yung|magagamit|available)\b.*\b(serbisyo|services)\b/.test(normalized)) {
    const reply = /\b(anong|ano ang|ano yung|serbisyo)\b/.test(normalized)
      ? 'Makikita sa Programs page ang kasalukuyang SK programs at projects, at sa Youth Services page ang mga available na serbisyo para sa kabataan. Nakasalalay ang availability at requirements sa mga na-publish na records sa portal.'
      : 'You can view current SK programs and projects on the Programs page, and available youth services on the Youth Services page. Availability and requirements depend on the published portal records.';
    return { success: true, source: 'faq', reply, category: 'barangay-services', knowledge: ['page:programs', 'page:services'] };
  }
  if (/\b(what|which|list|available|current|show)\b.*\b(program|programs|project|projects)\b/.test(normalized) || /\b(ano ang|ano yung|anong|may|mga)\b.*\b(programa|program|proyekto|projects)\b/.test(normalized)) {
    const reply = /\b(ano ang|ano yung|anong|programa|proyekto)\b/.test(normalized)
      ? 'Makikita sa Programs page ang kasalukuyang SK programs at projects. Nakasalalay ang mga detalye at availability sa mga na-publish na records sa portal.'
      : 'Current SK programs and projects are listed on the Programs page. Details and availability depend on the published portal records.';
    return { success: true, source: 'faq', reply, category: 'programs', knowledge: ['page:programs'] };
  }
  if (/\b(announcement|announcements|notice|notices|latest update|updates|anunsyo|abiso|pinakabagong balita|bagong update)\b/.test(normalized)) {
    const reply = /\b(anunsyo|abiso|pinakabagong balita|bagong update)\b/.test(normalized)
      ? 'Makikita sa Announcements page ang mga na-publish na anunsyo at public notices. Pakitingnan ang page na iyon para sa pinakabagong beripikadong updates.'
      : 'Published announcements and public notices are available on the Announcements page. Please check that page for the latest verified updates.';
    return { success: true, source: 'faq', reply, category: 'announcements', knowledge: ['page:announcements'] };
  }
  if (/\b(event|events|activity|activities|kaganapan|aktibidad)\b/.test(normalized)) {
    const reply = /\b(kaganapan|aktibidad)\b/.test(normalized)
      ? 'Makikita sa Events page ang mga community event at impormasyon tungkol sa event registration.'
      : 'Community events and event registration information are available on the Events page.';
    return { success: true, source: 'faq', reply, category: 'events', knowledge: ['page:events'] };
  }
  if (/\b(contact|official|officials|council|facebook|office|location|address|hours|makipag ugnayan|opisina|tanggapan|lokasyon|address|oras)\b/.test(normalized)) {
    const reply = /\b(makipag ugnayan|opisina|tanggapan|lokasyon|oras)\b/.test(normalized)
      ? 'Pakitingnan ang opisyal na Contact page para sa beripikadong contact channels at mga tanong para sa SK Bagbaguin. Wala akong karagdagang beripikadong detalye tungkol sa opisina.'
      : 'Please use the official Contact page for verified SK Bagbaguin contact channels and council inquiries. I do not have additional verified office details to provide here.';
    return { success: true, source: 'faq', reply, category: 'contact', knowledge: ['page:contact'] };
  }
  if (/\b(certificate|certificates|requirements|document|documents|appointment|consultation)\b/.test(normalized)) {
    return { success: true, source: 'fallback', reply: 'Verified certificate requirements and appointment details are not currently available in my knowledge base. Please use the official Contact page or contact the Barangay Bagbaguin office.', category: 'requirements', knowledge: ['page:contact'] };
  }
  if (/\b(emergency|danger|abuse|threat|urgent)\b/.test(normalized)) {
    return { success: true, source: 'fallback', reply: 'If there is immediate danger, contact local emergency services or the Barangay Bagbaguin office immediately. I cannot make emergency decisions or provide unverified numbers.', category: 'emergency', knowledge: [] };
  }
  return null;
}

export function fallbackResponse(message?: string): ChatbotResponse {
  const normalized = message ? normalizeChatbotText(message) : '';
  const isTagalog = /\b(ano|ang|mga|para|sa|ng|ngayon|paano|saan|sino|may|wala|hindi|po|ba|ako|kayo|kabataan|programa|serbisyo|anunsyo|opisina)\b/.test(normalized);
  return { success: true, source: 'fallback', reply: isTagalog ? TAGALOG_FALLBACK_REPLY : FALLBACK_REPLY, category: 'unavailable', knowledge: ['page:contact'] };
}
