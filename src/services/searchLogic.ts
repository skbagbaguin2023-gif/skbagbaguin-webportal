export const MAX_QUERY_LENGTH = 80;
const SYNONYMS: Record<string, string[]> = {
  sports: ['sportsfest', 'liga', 'basketball'],
  sportsfest: ['sports', 'liga', 'basketball'],
  liga: ['sports', 'sportsfest', 'basketball'],
  basketball: ['sports', 'sportsfest', 'liga'],
  programa: ['program', 'proyekto'],
  proyekto: ['program', 'programa'],
  dokumento: ['document', 'resolution', 'report'],
  opisyal: ['official', 'council'],
  kabataan: ['youth'],
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function sanitizeSearchQuery(value: string): string {
  return value
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
}

export function expandSearchQuery(query: string): string[] {
  const terms = normalizeText(sanitizeSearchQuery(query)).split(/\s+/).filter(Boolean);
  return [...new Set(terms.flatMap((term) => [term, ...(SYNONYMS[term] ?? [])]))];
}

export function rankSearchMatch(title: string, snippet: string, query: string): number {
  const normalizedQuery = normalizeText(sanitizeSearchQuery(query));
  const normalizedTitle = normalizeText(title);
  const haystack = normalizeText(`${title} ${snippet}`);
  const terms = expandSearchQuery(query);
  if (!terms.some((term) => haystack.includes(term))) return 0;
  return (normalizedTitle.includes(normalizedQuery) ? 100 : 40)
    + terms.filter((term) => haystack.includes(term)).length * 5;
}
