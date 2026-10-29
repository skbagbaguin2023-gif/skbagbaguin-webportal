import { supabase } from './supabase.ts';
import type { ChatMessage, AiAnswer } from './aiChat.ts';
export type { ChatMessage, AiAnswer };

type Item = { id: string; title: string; text: string; page: string };

const OUT_OF_SCOPE = 'I can only help with SK Bagbaguin programs, events, services, and announcements. For anything else, please use our Contact page. / Programs, events, services, at announcements ng SK Bagbaguin lang po ang matutulungan ko. Para sa iba, gamitin po ang Contact page.';
const STOP_WORDS = new Set('a an and ang are as at ay ba barangay be can could for from how i in is it lang me mo ng of on or please po sa sk so the this to what when where who with you your mag paano ano mga para ako ito iyon si sino'.split(' '));
const PAGE_MAP: Item[] = [
  { id: 'page:programs', title: 'Programs', text: 'SK programs and projects', page: '/programs' },
  { id: 'page:events', title: 'Events', text: 'Events and registration information', page: '/events' },
  { id: 'page:services', title: 'Youth Services', text: 'Services and official application forms', page: '/services' },
  { id: 'page:announcements', title: 'Announcements', text: 'Published announcements', page: '/announcements' },
  { id: 'page:about', title: 'About SK', text: 'Council members and SK information', page: '/about' },
  { id: 'page:transparency', title: 'Transparency', text: 'Public transparency documents', page: '/transparency' },
  { id: 'page:contact', title: 'Contact Us', text: 'Official contact page for the council', page: '/contact' },
];

let itemCache: { items: Item[]; expiresAt: number } | null = null;

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function itemText(data: Record<string, unknown>, collection: string): string {
  const allowed = collection === 'council'
    ? ['name', 'position', 'role']
    : collection === 'transparencyDocs'
      ? ['title', 'category', 'year']
      : ['title', 'name', 'summary', 'description', 'tagline', 'category', 'status', 'serviceType', 'requirements', 'eligibility', 'objectives'];
  return allowed.flatMap((key) => {
    const value = data[key];
    return Array.isArray(value) ? value : [value];
  })
    .filter((value) => typeof value === 'string' || typeof value === 'number')
    .join(' ')
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+|(?:09\d{9}|\+639\d{9})|\b\d{7,}\b/g, '[removed]');
}

async function loadItems(): Promise<Item[]> {
  if (itemCache && itemCache.expiresAt > Date.now()) return itemCache.items;
  if (!supabase) throw new Error('Supabase is not configured.');
  const collections = [
    { name: 'programs', prefix: 'program', page: '/programs' },
    { name: 'events', prefix: 'event', page: '/events' },
    { name: 'services', prefix: 'service', page: '/services', filter: ['isActive', 'true'] },
    { name: 'announcements', prefix: 'announcement', page: '/announcements', filter: ['status', 'Published'] },
    { name: 'council', prefix: 'council', page: '/about' },
    { name: 'transparencyDocs', prefix: 'doc', page: '/transparency', filter: ['isPublic', 'true'] },
    { name: 'aiKnowledge', prefix: 'faq', page: '/services', filter: ['isActive', 'true'] },
  ];
  const items = [...PAGE_MAP];
  for (const collection of collections) {
    let query = supabase.from('portal_records').select('id,data').eq('collection', collection.name);
    if (collection.filter) query = query.eq(`data->>${collection.filter[0]}`, collection.filter[1]);
    const { data, error } = await query.limit(100);
    if (error) {
      if (collection.name === 'aiKnowledge') continue;
      throw error;
    }
    for (const row of data ?? []) {
      const record = row.data as Record<string, unknown>;
      const title = String(record.title ?? record.name ?? record.position ?? 'Portal information');
      items.push({ id: `${collection.prefix}:${row.id}`, title, text: `${title} ${itemText(record, collection.name)}`.slice(0, 1200), page: collection.page });
    }
  }
  itemCache = { items, expiresAt: Date.now() + 10 * 60 * 1000 };
  return items;
}

function rankedItems(items: Item[], messages: ChatMessage[]): Item[] {
  const query = messages.filter((message) => message.role === 'user').slice(-2).map((message) => normalize(message.content)).join(' ');
  const terms = query.split(' ').filter((term) => term && !STOP_WORDS.has(term));
  return [...items].map((item) => ({
    item,
    score: terms.reduce((score, term) => score + (normalize(`${item.title} ${item.text}`).includes(term) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score).slice(0, 3).map(({ item }) => item);
}

export async function sendLocalAiChat(messages: ChatMessage[]): Promise<AiAnswer> {
  const latest = messages[messages.length - 1]?.content.trim() ?? '';
  if (!latest) return { intent: 'out_of_scope', answer: OUT_OF_SCOPE, sourceIds: [] };
  const normalized = normalize(latest);
  if (/^(hi|hello|hey|good morning|good afternoon|thanks|thank you|what can you do)\b/.test(normalized)) {
    return { intent: 'smalltalk', answer: 'I can help you find public information about SK Bagbaguin programs, events, services, and announcements po.', sourceIds: [] };
  }
  const items = await loadItems();
  const matches = rankedItems(items, messages);
  const relevant = matches.filter((item) => !item.id.startsWith('page:') && normalize(`${item.title} ${item.text}`).split(' ').some((word) => normalized.includes(word) && !STOP_WORDS.has(word)));
  if (relevant.length === 0) return { intent: 'out_of_scope', answer: OUT_OF_SCOPE, sourceIds: [] };
  const answer = `Here is what I found:\n${relevant.map((item) => `- ${item.title}: ${item.text.slice(0, 220)} (${item.page})`).join('\n')}\nYou can open the page above for more details.`;
  return { intent: 'answer', answer: answer.slice(0, 1200), sourceIds: relevant.map((item) => item.id) };
}
