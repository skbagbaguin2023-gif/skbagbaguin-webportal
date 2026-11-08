import React, { useEffect, useRef, useState } from 'react';
import { PublicPage } from '../types/index.ts';
import skLogo from '../assets/images/skLogo.png';
import { ThemeToggle } from './ThemeToggle.tsx';
import { 
  Menu, 
  X, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  Sparkles, 
  Info, 
  Phone, 
  Layers, 
  Bell,
  ChevronRight,
  SearchCheck
} from 'lucide-react';
import { searchPublicContent, type SearchResult } from '../services/search.ts';
import { expandSearchQuery } from '../services/searchLogic.ts';

interface HeaderProps {
  currentPage: PublicPage;
  onNavigate: (page: PublicPage) => void;
  onOpenApplyModal: () => void;
  onSearch: (query: string) => void;
  searchResults?: SearchResult[];
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  onOpenApplyModal,
  onSearch,
  searchResults = [],
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  const navLinks: { id: PublicPage; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Layers className="w-4 h-4" /> },
    { id: 'about', label: 'About SK', icon: <Info className="w-4 h-4" /> },
    { id: 'programs', label: 'Programs', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'events', label: 'Events', icon: <Calendar className="w-4 h-4" /> },
    { id: 'announcements', label: 'Announcements', icon: <Bell className="w-4 h-4" /> },
    { id: 'services', label: 'Youth Services', icon: <FileText className="w-4 h-4" /> },
    { id: 'track', label: 'Track Request', icon: <SearchCheck className="w-4 h-4" /> },
    { id: 'transparency', label: 'Transparency', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact Us', icon: <Phone className="w-4 h-4" /> },
  ];

  const highlightSnippet = (text: string) => {
    const terms = expandSearchQuery(query).filter((term) => term.length > 1);
    if (!terms.length) return text;
    const pattern = new RegExp(`(${terms.join('|')})`, 'ig');
    return text.split(pattern).map((part, index) => (
      terms.some((term) => part.toLocaleLowerCase() === term.toLocaleLowerCase())
        ? <mark key={index} className="rounded bg-amber-200 px-0.5 text-inherit dark:bg-amber-700">{part}</mark>
        : part
    ));
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        window.setTimeout(() => searchRef.current?.focus(), 0);
      } else if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault();
        setSearchOpen(true);
        window.setTimeout(() => searchRef.current?.focus(), 0);
      } else if (event.key === 'Escape') {
        setSearchOpen(false);
        setSuggestions([]);
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (searchOpen && !searchPanelRef.current?.contains(event.target as Node)) {
        requestRef.current?.abort();
        setSearchOpen(false);
        setSuggestions([]);
        setIsSearching(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [searchOpen]);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      requestRef.current?.abort();
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    const timer = window.setTimeout(() => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      setIsSearching(true);
      void searchPublicContent(value, { limit: 8, signal: controller.signal, localResults: searchResults })
        .then((response) => {
          if (!controller.signal.aborted) setSuggestions(response.results.slice(0, 8));
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          console.error('Public search suggestions failed.', error);
          setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, searchResults]);

  const submitSearch = (value = query) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    setSearchOpen(false);
    setSuggestions([]);
    onSearch(trimmed);
  };

  const closeSearch = () => {
    requestRef.current?.abort();
    setSearchOpen(false);
    setSuggestions([]);
    setIsSearching(false);
    searchRef.current?.blur();
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedSuggestion((current) => Math.min(current + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedSuggestion((current) => Math.max(current - 1, -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = suggestions[selectedSuggestion];
      if (selected) window.location.href = selected.href;
      else submitSearch();
    }
  };

  return (
    <>
      {/* Top Advisory Utility Strip */}
      <div className="bg-[#081830] text-slate-300 text-xs py-1.5 px-4 sm:px-8 border-b border-white/10 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-amber-400">Sangguniang Kabataan ng Barangay Bagbaguin</span>
            <span className="text-white/30">|</span>
            <span>City of Valenzuela</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <a
              href="/admin/login"
              className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
            >
              Admin Login
            </a>
            <span className="text-white/30">|</span>
            <ThemeToggle variant="header" className="p-1" />
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#0F2C59] text-white shadow-md border-b border-navy-800">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3">
          
          {/* Brand Zone */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg p-1"
          >
            {/* SK Logo Seal Placeholder */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 flex items-center justify-center shadow-sm shrink-0">
              <div className="w-full h-full rounded-full bg-[#0F2C59] flex items-center justify-center font-bold text-amber-400 text-xs tracking-tighter" >
                <img
                  src={skLogo}
                  alt="SK Bagbaguin Youth Assembly"
                  className="h-full w-full rounded-full object-contain pointer-events-none"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-amber-300 transition-colors whitespace-nowrap">
                SK Bagbaguin
              </span>
              <span className="text-[9px] text-slate-300 font-medium tracking-wide uppercase hidden sm:block">
                Valenzuela City Youth Portal
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 text-xs font-semibold cursor-pointer ${
                    isActive
                      ? 'bg-white/15 text-amber-300 font-bold shadow-xs'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action Zone */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={() => { setSearchOpen((open) => !open); window.setTimeout(() => searchRef.current?.focus(), 0); }} className="rounded-lg p-2 text-slate-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400" aria-label={searchOpen ? 'Close global search' : 'Open global search'}>
              <SearchCheck className="h-5 w-5" />
            </button>
            <ThemeToggle variant="header" />

            <button
              onClick={onOpenApplyModal}
              className="bg-[#F5A623] hover:bg-[#D98E16] text-[#081830] font-bold text-xs sm:text-sm px-2.5 sm:px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Request <span className="hidden sm:inline">a Service</span></span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div ref={searchPanelRef} className="absolute left-0 right-0 top-full z-50 border-t border-slate-200/70 bg-white/90 px-4 py-3 text-slate-900 shadow-2xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/90 dark:text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center rounded-lg border border-slate-300 bg-white/80 focus-within:ring-2 focus-within:ring-amber-400 dark:border-slate-600 dark:bg-slate-800/80">
                <SearchCheck className="ml-3 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-300" aria-hidden="true" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelectedSuggestion(-1);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search SK Bagbaguin"
                  aria-label="Search public SK Bagbaguin content"
                  role="combobox"
                  aria-expanded={suggestions.length > 0}
                  aria-controls="global-search-suggestions"
                  aria-autocomplete="list"
                  className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none dark:text-white dark:placeholder:text-slate-300"
                />
                {isSearching && <span className="px-2 text-xs text-slate-500 dark:text-slate-300" role="status">...</span>}
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white" aria-label="Clear search">
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button type="button" onClick={() => submitSearch()} className="p-2 text-amber-600 hover:text-amber-700 dark:text-amber-300 dark:hover:text-amber-200" aria-label="Submit search">
                <SearchCheck className="h-4 w-4" />
                </button>
              </div>
              {suggestions.length > 0 && (
                <div id="global-search-suggestions" role="listbox" className="mt-2 overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 p-2 text-slate-900 shadow-2xl backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-white">
                  {suggestions.map((suggestion, index) => (
                    <a
                      key={`${suggestion.type}-${suggestion.id}`}
                      href={suggestion.href}
                      role="option"
                      aria-selected={selectedSuggestion === index}
                      className={`block rounded-lg px-3 py-2 text-left ${selectedSuggestion === index ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">{suggestion.type}</span>
                      <span className="block truncate text-sm font-semibold">{suggestion.title}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{highlightSnippet(suggestion.snippet)}</span>
                    </a>
                  ))}
                  <button type="button" onClick={() => submitSearch()} className="w-full border-t border-slate-200 px-3 py-2 text-left text-xs font-semibold text-[#0F2C59] dark:border-slate-700 dark:text-amber-300">
                    See all results for “{query.trim()}”
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-full max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-white/10 bg-[#081830]/90 px-4 pt-3 pb-6 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200 lg:hidden">
            <div className="text-xs text-slate-400 font-medium px-3 py-1 uppercase tracking-wider">
              Navigation Menu
            </div>
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    onNavigate(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-amber-300 font-bold'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {link.icon}
                    <span>{link.label}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}

            <div className="pt-3 border-t border-white/10 mt-2 flex flex-col gap-2">
              <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg text-xs text-slate-300">
                <span>Dark / Night Theme</span>
                <ThemeToggle variant="header" />
              </div>

            </div>
          </div>
        )}
      </header>
    </>
  );
};
