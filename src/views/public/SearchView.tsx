import React, { useEffect, useMemo, useState } from 'react';
import { Search, LoaderCircle, ArrowUpDown } from 'lucide-react';
import { searchPublicContent, type SearchResult, type SearchType } from '../../services/search.ts';

interface SearchViewProps {
  query: string;
}

const filters: Array<'All' | SearchType> = ['All', 'Events', 'Announcements', 'Programs', 'Documents', 'News', 'Officials', 'Services', 'FAQs', 'About'];

export const SearchView: React.FC<SearchViewProps> = ({ query }) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'All' | SearchType>('All');
  const [sort, setSort] = useState<'relevance' | 'newest'>('relevance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void searchPublicContent(query, { limit: 50, signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) {
          setResults(response.results);
          setTotal(response.total);
        }
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        console.error('Public search failed.', caught);
        setError('Search is temporarily unavailable. Please try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query]);

  const visibleResults = useMemo(() => {
    const filtered = filter === 'All' ? results : results.filter((result) => result.type === filter);
    return [...filtered].sort((first, second) => sort === 'relevance'
      ? second.score - first.score
      : (second.date ?? '').localeCompare(first.date ?? ''));
  }, [filter, results, sort]);
  const groupedResults = useMemo(() => visibleResults.reduce<Record<string, SearchResult[]>>((groups, result) => {
    (groups[result.type] ??= []).push(result);
    return groups;
  }, {}), [visibleResults]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-2xl bg-[#0F2C59] p-6 text-white shadow-md sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Public portal search</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Results for “{query}”</h1>
        <p className="mt-2 text-sm text-slate-200">{total || results.length} public result{(total || results.length) === 1 ? '' : 's'}</p>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter results by type">
          {filters.map((item) => (
            <button key={item} type="button" role="tab" aria-selected={filter === item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${filter === item ? 'bg-[#0F2C59] text-white dark:bg-amber-500 dark:text-slate-950' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
              {item}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <ArrowUpDown className="h-4 w-4" />
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="rounded-lg border border-slate-300 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-900">
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </div>

      {loading && <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" role="status"><LoaderCircle className="h-5 w-5 animate-spin" /> Searching public content...</div>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      {!loading && !error && visibleResults.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <Search className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">No public results found</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Try a shorter phrase, a different spelling, or words such as sports, programa, kabataan, or serbisyo.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {['sports', 'programs', 'events', 'kabataan'].map((suggestion) => (
              <a key={suggestion} href={`/search?q=${suggestion}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-[#0F2C59] dark:bg-slate-800 dark:text-amber-300">
                Try “{suggestion}”
              </a>
            ))}
          </div>
        </div>
      )}
      {!loading && visibleResults.length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedResults).map(([type, typeResults]) => (
            <section key={type} aria-labelledby={`search-group-${type}`}>
              <h2 id={`search-group-${type}`} className="mb-3 text-lg font-bold text-slate-900 dark:text-white">{type}</h2>
              <div className="grid gap-3">
                {typeResults.map((result) => (
                  <a key={`${result.type}-${result.id}`} href={result.href} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{result.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{result.snippet}</p>
                    {result.date && <time className="mt-2 block text-xs text-slate-400">{result.date}</time>}
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
