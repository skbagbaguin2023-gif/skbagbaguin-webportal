import { supabase } from './supabase.ts';
import { rankSearchMatch, sanitizeSearchQuery } from './searchLogic.ts';
import { expandSearchQuery } from './searchLogic.ts';
export { expandSearchQuery, sanitizeSearchQuery } from './searchLogic.ts';

export type SearchType =
  | 'Programs'
  | 'Events'
  | 'Announcements'
  | 'Documents'
  | 'News'
  | 'Officials'
  | 'Services'
  | 'FAQs'
  | 'About';

export interface SearchResult {
  id: string;
  type: SearchType;
  title: string;
  snippet: string;
  date?: string;
  href: string;
  score: number;
  isStatic?: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

export interface LocalSearchOptions {
  localResults?: SearchResult[];
}

const MIN_QUERY_LENGTH = 2;
const cache = new Map<string, SearchResponse>();

export const STATIC_PUBLIC_SEARCH_CONTENT: SearchResult[] = [
  {
    id: 'about-mission',
    type: 'About',
    title: 'Our Mission and Vision',
    snippet: 'Transparent, integrity-driven, and youth-centered governance for the youth of Bagbaguin.',
    href: '/?page=about#mission',
    score: 0,
    isStatic: true,
  },
  {
    id: 'about-pillars',
    type: 'About',
    title: 'Five Pillars of Service',
    snippet: 'Education, health, sports development, environmental protection, and youth empowerment.',
    href: '/?page=about#pillars',
    score: 0,
    isStatic: true,
  },
  {
    id: 'faq-services',
    type: 'FAQs',
    title: 'How to request a youth service',
    snippet: 'Find published requirements, eligibility, and turnaround times for SK youth services.',
    href: '/?page=services',
    score: 0,
    isStatic: true,
  },
  {
    id: 'faq-events',
    type: 'FAQs',
    title: 'How to register for an event',
    snippet: 'Browse youth events and open an event to see its registration details.',
    href: '/?page=events',
    score: 0,
    isStatic: true,
  },
  {
    id: 'contact',
    type: 'FAQs',
    title: 'Contact SK Bagbaguin',
    snippet: 'Use the official contact page for verified procedures and public feedback.',
    href: '/?page=contact',
    score: 0,
    isStatic: true,
  },
  {
    id: 'faq-emergency',
    type: 'FAQs',
    title: 'Emergency and safety guidance',
    snippet: 'For immediate danger, contact local emergency services or the Barangay Bagbaguin office.',
    href: '/?page=contact',
    score: 0,
    isStatic: true,
  },
];

function scoreStaticResult(result: SearchResult, query: string): number {
  return rankSearchMatch(result.title, result.snippet, query);
}

function staticSearch(query: string): SearchResult[] {
  return STATIC_PUBLIC_SEARCH_CONTENT
    .map((result) => ({ ...result, score: scoreStaticResult(result, query) }))
    .filter((result) => result.score > 0);
}

function mergeResults(query: string, remote: SearchResponse): SearchResponse {
  const merged = [...remote.results, ...staticSearch(query)]
    .sort((first, second) => second.score - first.score)
    .filter((result, index, results) => results.findIndex((item) => item.id === result.id) === index);
  return { results: merged, total: remote.total + merged.length - remote.results.length };
}

export async function searchPublicContent(
  rawQuery: string,
  options: { limit?: number; offset?: number; signal?: AbortSignal; localResults?: SearchResult[] } = {},
): Promise<SearchResponse> {
  const query = sanitizeSearchQuery(rawQuery);
  if (query.length < MIN_QUERY_LENGTH) return { results: [], total: 0 };
  const limit = Math.min(Math.max(options.limit ?? 8, 1), 50);
  const offset = Math.max(options.offset ?? 0, 0);
  const cacheKey = `${query}:${limit}:${offset}`;
  if (!options.signal && cache.has(cacheKey)) return cache.get(cacheKey)!;

  const local = mergeResults(query, {
    results: (options.localResults ?? [])
      .filter((result) => !result.isStatic)
      .map((result) => ({
        ...result,
        score: rankSearchMatch(result.title, result.snippet, query),
      }))
      .filter((result) => result.score > 0),
    total: 0,
  });
  let remote: SearchResponse = { results: [], total: 0 };
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('search_public_content', {
        p_query: query,
        p_limit: limit,
        p_offset: offset,
      });
      if (options.signal?.aborted) throw new DOMException('Search request was cancelled.', 'AbortError');
      if (error) throw error;
      const rows = (data ?? []) as Array<SearchResult & { total_count: number }>;
      remote = {
        results: rows.map(({ total_count: _totalCount, ...result }) => result),
        total: rows[0]?.total_count ?? 0,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      console.warn('Public search RPC unavailable; using local public content.', error);
    }
  }

  const response = mergeResults(query, {
    results: [...local.results, ...remote.results],
    total: local.total + remote.total,
  });
  if (!options.signal) cache.set(cacheKey, response);
  return response;
}
