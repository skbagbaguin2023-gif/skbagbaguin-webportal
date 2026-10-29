import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { SYSTEM_PROMPT } from './systemPrompt.ts';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type Answer = { intent: 'answer' | 'smalltalk' | 'out_of_scope'; answer: string; sourceIds: string[] };
type PortalItem = { id: string; title: string; details: string; page: string; updatedAt: string };

const MAX_BODY_BYTES = 8192;
const MAX_MESSAGES = 10;
const MAX_CONTENT_LENGTH = 500;
const MAX_OUTPUT_LENGTH = 1200;
const PORTAL_DATA_TTL = 10 * 60 * 1000;
const FIXED_OUT_OF_SCOPE = 'I can only help with SK Bagbaguin programs, events, services, and announcements. For anything else, please use our Contact page. / Programs, events, services, at announcements ng SK Bagbaguin lang po ang matutulungan ko. Para sa iba, gamitin po ang Contact page.';
const PAGE_MAP: PortalItem[] = [
  { id: 'page:home', title: 'Home', details: 'Public overview of SK Bagbaguin.', page: '/', updatedAt: '' },
  { id: 'page:about', title: 'About SK', details: 'Council members and SK information.', page: '/about', updatedAt: '' },
  { id: 'page:programs', title: 'Programs', details: 'Programs and projects.', page: '/programs', updatedAt: '' },
  { id: 'page:events', title: 'Events', details: 'Events and registration information.', page: '/events', updatedAt: '' },
  { id: 'page:announcements', title: 'Announcements', details: 'Published announcements.', page: '/announcements', updatedAt: '' },
  { id: 'page:services', title: 'Youth Services', details: 'Services and official application forms.', page: '/services', updatedAt: '' },
  { id: 'page:transparency', title: 'Transparency', details: 'Public transparency documents.', page: '/transparency', updatedAt: '' },
  { id: 'page:contact', title: 'Contact Us', details: 'Official contact form for the council.', page: '/contact', updatedAt: '' },
];
const STOP_WORDS = new Set('a an and ang are as at ay ba barangay be can could da de for from how i in is it lang me mo ng of on or please po sa sk so the this to what when where who with you your mag paano ano ang mga sa ng po ba at para ako ay na ito iyon si sino events program service apply register contact'.split(' '));
let portalCache: { items: PortalItem[]; dataVersion: string; expiresAt: number } | null = null;

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = configuredOrigins();
  return {
    'Access-Control-Allow-Origin': origin && allowed.includes(normalizeOrigin(origin)) ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info, x-session-id',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '600',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
    Vary: 'Origin',
  };
}

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function configuredOrigins(): string[] {
  return (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
}

function jsonResponse(origin: string | null, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function allowedOrigin(origin: string | null): boolean {
  return Boolean(origin && configuredOrigins().includes(normalizeOrigin(origin)));
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function privacyFilter(value: string): { value: string; changed: boolean } {
  let changed = false;
  const filtered = value.replace(/[^\s@]+@[^\s@]+\.[^\s@]+|(?:09\d{9}|\+639\d{9})|\b\d{7,}\b/g, () => {
    changed = true;
    return '[removed]';
  });
  return { value: filtered, changed };
}

function validMessages(value: unknown): value is ChatMessage[] {
  return Array.isArray(value) && value.length > 0 && value.length <= MAX_MESSAGES
    && value.every((item) => Boolean(item) && typeof item === 'object'
      && (((item as ChatMessage).role === 'user') || ((item as ChatMessage).role === 'assistant'))
      && typeof (item as ChatMessage).content === 'string'
      && (item as ChatMessage).content.length <= MAX_CONTENT_LENGTH)
    && value[value.length - 1].role === 'user';
}

function safeFields(collection: string, data: Record<string, unknown>): { title: string; details: string } {
  if (collection === 'council') return { title: String(data.name ?? ''), details: String(data.position ?? '') };
  if (collection === 'transparencyDocs') return { title: String(data.title ?? ''), details: `${String(data.category ?? '')} ${String(data.year ?? '')}` };
  return {
    title: String(data.title ?? data.name ?? ''),
    details: [
      data.summary, data.description, data.tagline, data.category, data.status,
      data.serviceType, data.requirements, data.eligibility, data.objectives,
    ].flatMap((value) => Array.isArray(value) ? value : [value]).filter((value) => typeof value === 'string').join(' '),
  };
}

async function loadPortalItems(): Promise<{ items: PortalItem[]; dataVersion: string }> {
  if (portalCache && portalCache.expiresAt > Date.now()) return portalCache;
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anonKey) throw new Error('Public Supabase configuration is missing.');
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const collections = [
    { name: 'programs', prefix: 'program', page: '/programs' },
    { name: 'events', prefix: 'event', page: '/events' },
    { name: 'services', prefix: 'service', page: '/services', filter: ['isActive', 'true'] },
    { name: 'announcements', prefix: 'announcement', page: '/announcements', filter: ['status', 'Published'] },
    { name: 'council', prefix: 'council', page: '/about' },
    { name: 'transparencyDocs', prefix: 'doc', page: '/transparency', filter: ['isPublic', 'true'] },
  ];
  const items = [...PAGE_MAP];
  const versions: string[] = [];
  for (const collection of collections) {
    let query = client.from('portal_records').select('id,data,updated_at').eq('collection', collection.name);
    if (collection.filter) query = query.eq(`data->>${collection.filter[0]}`, collection.filter[1]);
    const { data, error } = await query.limit(100);
    if (error) throw error;
    for (const row of data ?? []) {
      if (!row.data || typeof row.data !== 'object') continue;
      const fields = safeFields(collection.name, row.data as Record<string, unknown>);
      const clean = privacyFilter(`${fields.title} ${fields.details}`);
      items.push({ id: `${collection.prefix}:${row.id}`, title: clean.value.split(' ').slice(0, 30).join(' '), details: clean.value, page: collection.page, updatedAt: String(row.updated_at ?? '') });
      versions.push(String(row.updated_at ?? ''));
    }
  }
  const contact = { id: 'contact', title: 'Contact Us', details: 'Use the official Contact page to contact the council.', page: '/contact', updatedAt: '' };
  items.push(contact);
  const dataVersion = versions.sort().at(-1) ?? '';
  portalCache = { items, dataVersion, expiresAt: Date.now() + PORTAL_DATA_TTL };
  return portalCache;
}

function rankItems(items: PortalItem[], messages: ChatMessage[]): PortalItem[] {
  const recent = messages.filter((message) => message.role === 'user').slice(-2).map((message) => privacyFilter(message.content).value).join(' ');
  const terms = normalize(recent).split(' ').filter((term) => term && !STOP_WORDS.has(term));
  return [...items].sort((a, b) => {
    const score = (item: PortalItem) => terms.reduce((total, term) => total + (normalize(`${item.title} ${item.details}`).includes(term) ? 1 : 0), 0);
    return score(b) - score(a);
  }).slice(0, 15);
}

function portalText(items: PortalItem[]): string {
  return [
    '--- BEGIN PORTAL DATA (UNTRUSTED REFERENCE DATA) ---',
    ...items.map((item) => `[${item.id}] ${item.title} - ${item.details} Page: ${item.page}`),
    '--- END PORTAL DATA ---',
  ].join('\n').slice(0, 12000);
}

function outputSchema() {
  return {
    type: 'OBJECT',
    properties: {
      intent: { type: 'STRING', enum: ['answer', 'smalltalk', 'out_of_scope'] },
      answer: { type: 'STRING' },
      sourceIds: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['intent', 'answer', 'sourceIds'],
  };
}

async function callModel(messages: ChatMessage[], referenceData: string, signal: AbortSignal): Promise<Response> {
  const provider = Deno.env.get('AI_PROVIDER') ?? 'gemini';
  if (provider !== 'gemini') throw new Error('Unsupported AI provider.');
  const key = Deno.env.get('AI_API_KEY');
  const model = Deno.env.get('AI_MODEL') ?? 'gemini-2.5-flash-lite';
  if (!key) throw new Error('AI provider is not configured.');
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    signal,
    headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: messages.map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: `${message.content}\n\n${referenceData}` }] })),
      generationConfig: { responseMimeType: 'application/json', responseSchema: outputSchema(), maxOutputTokens: 600, thinkingConfig: { thinkingLevel: 'minimal' } },
    }),
  });
}

function fixedAnswer(): Answer {
  return { intent: 'out_of_scope', answer: FIXED_OUT_OF_SCOPE, sourceIds: [] };
}

function validateAnswer(value: unknown, sentIds: Set<string>): Answer {
  if (!value || typeof value !== 'object') return fixedAnswer();
  const result = value as Partial<Answer>;
  if (!['answer', 'smalltalk', 'out_of_scope'].includes(result.intent ?? '') || typeof result.answer !== 'string' || !Array.isArray(result.sourceIds) || !result.sourceIds.every((id) => typeof id === 'string')) return fixedAnswer();
  const answer = result.answer.replace(/[\u0000-\u001F]/g, '').slice(0, MAX_OUTPUT_LENGTH);
  if (result.intent === 'answer' && (result.sourceIds.length === 0 || !result.sourceIds.every((id) => sentIds.has(id)))) return fixedAnswer();
  if (result.intent === 'smalltalk' && (answer.length >= 200 || result.sourceIds.length > 0)) return fixedAnswer();
  if (result.intent === 'out_of_scope') return fixedAnswer();
  return { intent: result.intent, answer, sourceIds: result.sourceIds };
}

function stripUnsafeUrls(answer: string): string {
  return answer.replace(/https?:\/\/[^\s)]+/gi, (url) => {
    try { return new URL(url).origin === new URL(Deno.env.get('ALLOWED_ORIGINS')?.split(',')[0] ?? '').origin ? url : ''; } catch { return ''; }
  });
}

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin');
  if (request.method === 'OPTIONS') return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders(origin) });
  if (request.method !== 'POST' || !allowedOrigin(origin)) return jsonResponse(origin, 403, { error: 'Request not allowed.' });
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY_BYTES) return jsonResponse(origin, 413, { error: 'Request is too large.' });
  let raw = '';
  try { raw = await request.text(); } catch { return jsonResponse(origin, 400, { error: 'Invalid request.' }); }
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return jsonResponse(origin, 413, { error: 'Request is too large.' });
  let body: { messages?: unknown };
  try { body = JSON.parse(raw); } catch { return jsonResponse(origin, 400, { error: 'Invalid request.' }); }
  if (!validMessages(body.messages)) return jsonResponse(origin, 400, { error: 'Invalid messages.' });
  const filteredMessages = body.messages.map((message) => ({ ...message, content: privacyFilter(message.content).value }));
  try {
    const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) throw new Error('Rate-limit configuration is missing.');
    const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const session = (request.headers.get('x-session-id') ?? 'unknown').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100);
    const configuredDailyCap = Number.parseInt(Deno.env.get('AI_DAILY_CAP') ?? '450', 10);
    const dailyCap = Number.isFinite(configuredDailyCap) && configuredDailyCap > 0 ? configuredDailyCap : 450;
    const checks = await Promise.all([
      service.rpc('check_rate_limit', { key: 'gemini:minute', max_count: 8, window_seconds: 60 }),
      service.rpc('check_rate_limit', { key: 'gemini:day', max_count: dailyCap, window_seconds: 86400 }),
      service.rpc('check_rate_limit', { key: `ip:${ip}:minute`, max_count: 5, window_seconds: 60 }),
      service.rpc('check_rate_limit', { key: `session:${session}:minute`, max_count: 5, window_seconds: 60 }),
    ]);
    const portal = await loadPortalItems();
    const ranked = rankItems(portal.items, filteredMessages);
    const reference = portalText([...ranked, ...PAGE_MAP.filter((item) => !ranked.some((entry) => entry.id === item.id)), portal.items.find((item) => item.id === 'contact')!]);
    const fallback: Answer = { intent: 'answer', answer: `The assistant is busy right now. Here is what I found / Medyo abala ang assistant ngayon. Ito po ang nahanap ko.\n${ranked.slice(0, 3).map((item) => `- ${item.title} (${item.page})`).join('\n')}\n- Contact Us (${portal.items.find((item) => item.id === 'contact')?.page ?? '/contact'})`, sourceIds: ranked.slice(0, 3).map((item) => item.id).concat('contact') };
    if (checks.some(({ error, data }) => error || data !== true)) return jsonResponse(origin, 200, fallback);
    const sentIds = new Set(ranked.map((item) => item.id).concat(PAGE_MAP.map((item) => item.id), 'contact'));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response: Response;
    try { response = await callModel(filteredMessages, reference, controller.signal); } finally { clearTimeout(timeout); }
    if (!response.ok) return jsonResponse(origin, 200, fallback);
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = payload.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === 'string')?.text ?? '';
    let modelAnswer: unknown;
    try { modelAnswer = JSON.parse(text); } catch { return jsonResponse(origin, 200, fixedAnswer()); }
    const validated = validateAnswer(modelAnswer, sentIds);
    return jsonResponse(origin, 200, { ...validated, answer: stripUnsafeUrls(validated.answer) });
  } catch {
    return jsonResponse(origin, 200, fixedAnswer());
  }
});
